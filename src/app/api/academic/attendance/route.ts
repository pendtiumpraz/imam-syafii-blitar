import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { softDelete } from '@/lib/soft-delete';

// Helper function to check user permissions
function hasPermission(userRole: string, action: 'read' | 'create' | 'update' | 'delete'): boolean {
  const permissions = {
    SUPER_ADMIN: ['read', 'create', 'update', 'delete'],
    ADMIN: ['read', 'create', 'update', 'delete'],
    USTADZ: ['read', 'create', 'update'],
    STAFF: ['read'],
    PARENT: ['read']
  };
  
  return permissions[userRole as keyof typeof permissions]?.includes(action) ?? false;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const studentId = searchParams.get('studentId');
    const semesterId = searchParams.get('semesterId');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const includeStats = searchParams.get('includeStats') === 'true';

    const whereConditions: any = {};
    
    if (classId) {
      whereConditions.classId = classId;
    }
    
    if (studentId) {
      whereConditions.studentId = studentId;
    }
    
    if (semesterId) {
      whereConditions.semesterId = semesterId;
    }

    if (date) {
      whereConditions.date = new Date(date);
    } else if (startDate && endDate) {
      whereConditions.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const skip = (page - 1) * limit;

    const [attendances, totalCount] = await Promise.all([
      prisma.attendance.findMany({
        where: whereConditions,
        skip,
        take: limit,
      include: {
        student: {
          select: {
            id: true,
            nis: true,
            fullName: true,
            photo: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            level: true,
          },
        },
        semester: {
          select: {
            id: true,
            name: true,
            academicYear: {
              select: {
                name: true,
              },
            },
          },
        },
        marker: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { date: 'desc' },
        { student: { fullName: 'asc' } },
      ],
    }),
    prisma.attendance.count({ where: whereConditions })
  ]);

    const response: any = {
      attendances,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1
      }
    };

    // Include attendance statistics if requested
    if (includeStats && hasPermission(session.user?.role || '', 'read')) {
      const statsWhere = { ...whereConditions };
      delete statsWhere.date; // Remove date filter for overall stats
      
      const stats = await prisma.attendance.groupBy({
        by: ['status'],
        where: statsWhere,
        _count: { status: true }
      });
      
      response.statistics = {
        byStatus: Object.fromEntries(stats.map(s => [s.status, s._count.status])),
        totalRecords: totalCount
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching attendances:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'create')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      studentId,
      classId,
      semesterId,
      date,
      status,
      timeIn,
      notes
    } = body;

    // Validate required fields
    if (!studentId || !classId || !semesterId || !date || !status) {
      return NextResponse.json(
        { error: 'Student, class, semester, date, and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['HADIR', 'IZIN', 'SAKIT', 'ALPHA', 'TERLAMBAT'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid attendance status' },
        { status: 400 }
      );
    }

    const attendance = await prisma.attendance.create({
      data: {
        studentId,
        classId,
        semesterId,
        date: new Date(date),
        status,
        timeIn: timeIn ? new Date(timeIn) : null,
        notes,
        markedBy: session.user?.id,
      },
      include: {
        student: {
          select: {
            id: true,
            nis: true,
            fullName: true,
            photo: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            level: true,
          },
        },
        semester: {
          select: {
            id: true,
            name: true,
            academicYear: {
              select: {
                name: true,
              },
            },
          },
        },
        marker: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error('Error creating attendance:', error);
    
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Attendance already recorded for this student, class, and date' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'update')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      status,
      timeIn,
      notes
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Attendance ID is required' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['HADIR', 'IZIN', 'SAKIT', 'ALPHA', 'TERLAMBAT'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid attendance status' },
          { status: 400 }
        );
      }
    }

    const attendance = await prisma.attendance.update({
      where: { id },
      data: {
        status,
        timeIn: timeIn ? new Date(timeIn) : null,
        notes,
        markedBy: session.user?.id,
        markedAt: new Date(),
      },
      include: {
        student: {
          select: {
            id: true,
            nis: true,
            fullName: true,
            photo: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            level: true,
          },
        },
        semester: {
          select: {
            id: true,
            name: true,
            academicYear: {
              select: {
                name: true,
              },
            },
          },
        },
        marker: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error updating attendance:', error);
    
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Attendance not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Bulk attendance marking
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'create')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      classId,
      semesterId,
      date,
      attendances // Array of { studentId, status, timeIn?, notes? }
    } = body;

    // Validate required fields
    if (!classId || !semesterId || !date || !attendances || !Array.isArray(attendances)) {
      return NextResponse.json(
        { error: 'Class, semester, date, and attendances array are required' },
        { status: 400 }
      );
    }

    const results = [];

    for (const attendance of attendances) {
      try {
        const result = await prisma.attendance.upsert({
          where: {
            studentId_classId_date: {
              studentId: attendance.studentId,
              classId,
              date: new Date(date),
            },
          },
          update: {
            status: attendance.status,
            timeIn: attendance.timeIn ? new Date(attendance.timeIn) : null,
            notes: attendance.notes,
            markedBy: session.user?.id,
            markedAt: new Date(),
          },
          create: {
            studentId: attendance.studentId,
            classId,
            semesterId,
            date: new Date(date),
            status: attendance.status,
            timeIn: attendance.timeIn ? new Date(attendance.timeIn) : null,
            notes: attendance.notes,
            markedBy: session.user?.id,
          },
          include: {
            student: {
              select: {
                id: true,
                nis: true,
                fullName: true,
              },
            },
          },
        });

        results.push(result);
      } catch (error) {
        console.error(`Error processing attendance for student ${attendance.studentId}:`, error);
        // Continue with other students
      }
    }

    return NextResponse.json({
      message: `${results.length} attendance records processed`,
      attendances: results,
    });
  } catch (error) {
    console.error('Error bulk updating attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'delete')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Attendance ID is required' },
        { status: 400 }
      );
    }

    // Check if attendance exists
    const attendance = await prisma.attendance.findUnique({
      where: { id },
    });

    if (!attendance) {
      return NextResponse.json(
        { error: 'Attendance not found' },
        { status: 404 }
      );
    }

    // Soft delete the attendance
    await softDelete(prisma.attendance, { id }, session.user?.id);

    return NextResponse.json({ message: 'Attendance deleted successfully' });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Attendance not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}