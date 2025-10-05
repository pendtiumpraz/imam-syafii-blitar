import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { softDelete } from '@/lib/soft-delete';

// Helper function to check user permissions
function hasPermission(userRole: string, action: 'read' | 'create' | 'update' | 'delete'): boolean {
  const permissions: Record<string, string[]> = {
    SUPER_ADMIN: ['read', 'create', 'update', 'delete'],
    ADMIN: ['read', 'create', 'update', 'delete'],
    USTADZ: ['read'],
    STAFF: ['read'],
    PARENT: []
  };
  
  return permissions[userRole]?.includes(action) ?? false;
}

// Helper function to check time conflicts
function hasTimeConflict(startTime1: string, endTime1: string, startTime2: string, endTime2: string): boolean {
  const start1 = new Date(`2000-01-01T${startTime1}`);
  const end1 = new Date(`2000-01-01T${endTime1}`);
  const start2 = new Date(`2000-01-01T${startTime2}`);
  const end2 = new Date(`2000-01-01T${endTime2}`);
  
  return (start1 < end2) && (start2 < end1);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const teacherId = searchParams.get('teacherId');
    const day = searchParams.get('day');
    const isActive = searchParams.get('active');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const format = searchParams.get('format');

    const whereConditions: any = {};
    
    if (classId) {
      whereConditions.classId = classId;
    }
    
    if (teacherId) {
      whereConditions.teacherId = teacherId;
    }
    
    if (day) {
      whereConditions.day = day;
    }
    
    if (isActive === 'true') {
      whereConditions.isActive = true;
    }

    const skip = (page - 1) * limit;

    const [schedules, totalCount] = await Promise.all([
      prisma.schedule.findMany({
        where: whereConditions,
        skip,
        take: limit,
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            level: true,
            academicYear: {
              select: {
                name: true,
              },
            },
          },
        },
        subject: {
          select: {
            id: true,
            code: true,
            name: true,
            nameArabic: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { day: 'asc' },
        { period: 'asc' },
        { startTime: 'asc' },
      ],
    }),
    prisma.schedule.count({ where: whereConditions })
  ]);

    const response: any = {
      schedules,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1
      }
    };

    // Group schedules by day if requested
    if (format === 'grouped') {
      const groupedSchedules = schedules.reduce((acc, schedule) => {
        const day = schedule.day;
        if (!acc[day]) {
          acc[day] = [];
        }
        acc[day].push(schedule);
        return acc;
      }, {} as Record<string, any[]>);
      
      response.grouped = groupedSchedules;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching schedules:', error);
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

    if (!hasPermission(session.user?.role || '', 'create')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      classId,
      subjectId,
      teacherId,
      day,
      startTime,
      endTime,
      room,
      period,
      notes,
      isActive
    } = body;

    // Validate required fields
    if (!classId || !subjectId || !teacherId || !day || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Class, subject, teacher, day, start time, and end time are required' },
        { status: 400 }
      );
    }

    // Validate day
    const validDays = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    if (!validDays.includes(day)) {
      return NextResponse.json(
        { error: 'Invalid day. Must be one of: ' + validDays.join(', ') },
        { status: 400 }
      );
    }

    // Enhanced conflict checking with time overlap detection
    const conflictingSchedules = await prisma.schedule.findMany({
      where: {
        OR: [
          { classId, day, isActive: true },
          { teacherId, day, isActive: true }
        ]
      },
      select: {
        id: true,
        classId: true,
        teacherId: true,
        startTime: true,
        endTime: true,
        class: { select: { name: true } },
        teacher: { select: { name: true } }
      }
    });

    for (const conflict of conflictingSchedules) {
      if (hasTimeConflict(startTime, endTime, conflict.startTime, conflict.endTime)) {
        if (conflict.classId === classId) {
          return NextResponse.json({
            error: `Schedule conflict: Class ${conflict.class.name} already has a schedule from ${conflict.startTime} to ${conflict.endTime}`
          }, { status: 409 });
        }
        if (conflict.teacherId === teacherId) {
          return NextResponse.json({
            error: `Schedule conflict: Teacher ${conflict.teacher.name} is not available from ${conflict.startTime} to ${conflict.endTime}`
          }, { status: 409 });
        }
      }
    }

    const schedule = await prisma.schedule.create({
      data: {
        classId,
        subjectId,
        teacherId,
        day,
        startTime,
        endTime,
        room,
        period,
        notes,
        isActive: Boolean(isActive),
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            level: true,
            academicYear: {
              select: {
                name: true,
              },
            },
          },
        },
        subject: {
          select: {
            id: true,
            code: true,
            name: true,
            nameArabic: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error('Error creating schedule:', error);
    
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Schedule already exists for this class, day, and time' },
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

    if (!hasPermission(session.user?.role || '', 'update')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      subjectId,
      teacherId,
      day,
      startTime,
      endTime,
      room,
      period,
      notes,
      isActive
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    // Get current schedule to check conflicts
    const currentSchedule = await prisma.schedule.findUnique({
      where: { id },
      select: { classId: true, day: true, startTime: true },
    });

    if (!currentSchedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    // If day or startTime is being changed, check for conflicts
    if ((day && day !== currentSchedule.day) || (startTime && startTime !== currentSchedule.startTime)) {
      const newDay = day || currentSchedule.day;
      const newStartTime = startTime || currentSchedule.startTime;

      // Check for class conflicts
      const existingSchedule = await prisma.schedule.findFirst({
        where: {
          classId: currentSchedule.classId,
          day: newDay,
          startTime: newStartTime,
          isActive: true,
          NOT: { id },
        },
      });

      if (existingSchedule) {
        return NextResponse.json(
          { error: 'Schedule conflict: Class already has a schedule at this time' },
          { status: 409 }
        );
      }

      // Check teacher availability if teacher is being changed
      if (teacherId) {
        const teacherConflict = await prisma.schedule.findFirst({
          where: {
            teacherId,
            day: newDay,
            startTime: newStartTime,
            isActive: true,
            NOT: { id },
          },
        });

        if (teacherConflict) {
          return NextResponse.json(
            { error: 'Schedule conflict: Teacher is not available at this time' },
            { status: 409 }
          );
        }
      }
    }

    const schedule = await prisma.schedule.update({
      where: { id },
      data: {
        subjectId,
        teacherId,
        day,
        startTime,
        endTime,
        room,
        period,
        notes,
        isActive: Boolean(isActive),
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
            level: true,
            academicYear: {
              select: {
                name: true,
              },
            },
          },
        },
        subject: {
          select: {
            id: true,
            code: true,
            name: true,
            nameArabic: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Error updating schedule:', error);
    
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

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

    if (!hasPermission(session.user?.role || '', 'delete')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    // Check if schedule exists
    const schedule = await prisma.schedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    // Soft delete the schedule
    await softDelete(prisma.schedule, { id }, session.user?.id);

    return NextResponse.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}