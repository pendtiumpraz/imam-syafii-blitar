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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'read')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');
    const level = searchParams.get('level');
    const grade = searchParams.get('grade');
    const isActive = searchParams.get('active');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100 items per page
    const includeStudentCount = searchParams.get('includeStudentCount') === 'true';

    const whereConditions: any = {};

    // Filter out soft deleted records
    whereConditions.isDeleted = false;

    if (academicYearId) {
      whereConditions.academicYearId = academicYearId;
    }

    if (level) {
      whereConditions.level = level;
    }

    if (grade) {
      whereConditions.grade = grade;
    }

    if (isActive === 'true') {
      whereConditions.isActive = true;
    } else if (isActive === 'false') {
      whereConditions.isActive = false;
    }

    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { room: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { teacher: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const skip = (page - 1) * limit;

    const [classes, totalCount] = await Promise.all([
      prisma.classes.findMany({
        where: whereConditions,
        skip,
        take: limit,
        include: {
        academicYear: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            studentClasses: true,
            teacherSubjects: true,
            schedules: true,
            exams: true,
          },
        },
      },
      orderBy: [
        { academicYear: { startDate: 'desc' } },
        { level: 'asc' },
        { grade: 'asc' },
        { name: 'asc' },
      ],
    }),
    prisma.classes.count({ where: whereConditions })
  ]);

    const response: any = {
      classes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1
      }
    };

    // Add student count if requested and user has permission
    if (includeStudentCount && hasPermission(session.user.role, 'read')) {
      const studentCounts = await prisma.student_classes.groupBy({
        by: ['classId'],
        where: {
          classId: { in: classes.map((c: any) => c.id) },
          status: 'ACTIVE'
        },
        _count: { studentId: true }
      });

      response.studentCounts = Object.fromEntries(
        studentCounts.map((sc: any) => [sc.classId, sc._count.studentId])
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching classes:', error);
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
      name,
      grade,
      section,
      academicYearId,
      teacherId,
      capacity,
      room,
      level,
      program,
      description,
      isActive
    } = body;

    // Validate required fields
    if (!name || !grade || !academicYearId || !level) {
      return NextResponse.json(
        { error: 'Name, grade, academic year, and level are required' },
        { status: 400 }
      );
    }

    // Validate capacity
    if (capacity && (capacity < 1 || capacity > 100)) {
      return NextResponse.json(
        { error: 'Capacity must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Validate level
    const validLevels = ['KB_TK', 'SD', 'MTQ', 'MSWi', 'MSWa', 'SMP', 'SMA'];
    if (!validLevels.includes(level)) {
      return NextResponse.json(
        { error: `Level must be one of: ${validLevels.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if academic year exists
    const academicYear = await prisma.academic_years.findUnique({
      where: { id: academicYearId },
    });

    if (!academicYear) {
      return NextResponse.json(
        { error: 'Academic year not found' },
        { status: 404 }
      );
    }

    // Check if teacher exists (if provided)
    if (teacherId) {
      const teacher = await prisma.users.findUnique({
        where: { id: teacherId },
      });

      if (!teacher) {
        return NextResponse.json(
          { error: 'Teacher not found' },
          { status: 404 }
        );
      }
    }

    const classData = await prisma.classes.create({
      data: {
        name,
        grade,
        section,
        academicYearId,
        teacherId,
        capacity: capacity || 30,
        room,
        level,
        program,
        description,
        isActive: Boolean(isActive),
      },
      include: {
        academicYear: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            studentClasses: true,
            teacherSubjects: true,
            schedules: true,
            exams: true,
          },
        },
      },
    });

    return NextResponse.json(classData, { status: 201 });
  } catch (error) {
    console.error('Error creating class:', error);
    
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Class with this name already exists in the academic year' },
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
      name,
      grade,
      section,
      teacherId,
      capacity,
      room,
      level,
      program,
      description,
      isActive
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Class ID is required' },
        { status: 400 }
      );
    }

    // Validate capacity
    if (capacity && (capacity < 1 || capacity > 100)) {
      return NextResponse.json(
        { error: 'Capacity must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Validate level if provided
    if (level) {
      const validLevels = ['KB_TK', 'SD', 'MTQ', 'MSWi', 'MSWa', 'SMP', 'SMA'];
      if (!validLevels.includes(level)) {
        return NextResponse.json(
          { error: `Level must be one of: ${validLevels.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Check if teacher exists (if provided)
    if (teacherId) {
      const teacher = await prisma.users.findUnique({
        where: { id: teacherId },
      });

      if (!teacher) {
        return NextResponse.json(
          { error: 'Teacher not found' },
          { status: 404 }
        );
      }
    }

    const classData = await prisma.classes.update({
      where: { id },
      data: {
        name,
        grade,
        section,
        teacherId,
        capacity,
        room,
        level,
        program,
        description,
        isActive: Boolean(isActive),
      },
      include: {
        academicYear: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            studentClasses: true,
            teacherSubjects: true,
            schedules: true,
            exams: true,
          },
        },
      },
    });

    return NextResponse.json(classData);
  } catch (error) {
    console.error('Error updating class:', error);
    
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Class with this name already exists in the academic year' },
        { status: 409 }
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

    if (!hasPermission(session.user.role, 'delete')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Class ID is required' },
        { status: 400 }
      );
    }

    // Check if class has associated data
    const classData = await prisma.classes.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            studentClasses: true,
            teacherSubjects: true,
            schedules: true,
            exams: true,
          },
        },
      },
    });

    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }

    const { studentClasses, teacherSubjects, schedules, exams } = classData._count;
    if (studentClasses > 0 || teacherSubjects > 0 || schedules > 0 || exams > 0) {
      return NextResponse.json(
        { error: 'Cannot delete class that has students, subjects, schedules, or exams associated with it' },
        { status: 409 }
      );
    }

    await softDelete(prisma.classes, { id }, session.user.id);

    return NextResponse.json({ message: 'Class soft deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}