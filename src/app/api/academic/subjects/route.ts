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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const isActive = searchParams.get('active');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const includeTeachers = searchParams.get('includeTeachers') === 'true';

    const whereConditions: any = {
      isDeleted: false,
    };

    if (level) {
      whereConditions.level = level;
    }

    if (category) {
      whereConditions.category = category;
    }

    if (type) {
      whereConditions.type = type;
    }

    if (isActive === 'true') {
      whereConditions.isActive = true;
    }

    const skip = (page - 1) * limit;

    const [subjects, totalCount] = await Promise.all([
      prisma.subjects.findMany({
        where: whereConditions,
        skip,
        take: limit,
      include: {
        _count: {
          select: {
            teacherSubjects: true,
            curriculumSubjects: true,
            grades: true,
            schedules: true,
            exams: true,
          },
        },
      },
      orderBy: [
        { level: 'asc' },
        { category: 'asc' },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    }),
    prisma.subjects.count({ where: whereConditions })
  ]);

    const response: any = {
      subjects,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1
      }
    };

    // Include teacher assignments if requested
    if (includeTeachers && hasPermission(session.user?.role || '', 'read')) {
      const teacherSubjects = await prisma.teacher_subjects.findMany({
        where: {
          subjectId: { in: subjects.map(s => s.id) },
          isActive: true
        },
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          class: {
            select: {
              id: true,
              name: true,
              grade: true,
              level: true
            }
          },
          semester: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });
      
      response.teacherAssignments = teacherSubjects.reduce((acc: any, ts: any) => {
        if (!acc[ts.subjectId]) acc[ts.subjectId] = [];
        acc[ts.subjectId].push(ts);
        return acc;
      }, {});
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching subjects:', error);
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
      code,
      name,
      nameArabic,
      description,
      credits,
      type,
      category,
      level,
      minGrade,
      maxGrade,
      isActive,
      sortOrder
    } = body;

    // Validate required fields
    if (!code || !name || !level) {
      return NextResponse.json(
        { error: 'Code, name, and level are required' },
        { status: 400 }
      );
    }

    // Validate level
    const validLevels = ['TK', 'SD', 'SMP', 'PONDOK'];
    if (!validLevels.includes(level)) {
      return NextResponse.json(
        { error: `Level must be one of: ${validLevels.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['UMUM', 'AGAMA', 'MUATAN_LOKAL'];
    if (category && !validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Category must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['WAJIB', 'PILIHAN'];
    if (type && !validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate credits
    if (credits && (credits < 1 || credits > 10)) {
      return NextResponse.json(
        { error: 'Credits must be between 1 and 10' },
        { status: 400 }
      );
    }

    const subject = await prisma.subjects.create({
      data: {
        code,
        name,
        nameArabic,
        description,
        credits: credits || 2,
        type: type || 'WAJIB',
        category: category || 'UMUM',
        level,
        minGrade,
        maxGrade,
        isActive: Boolean(isActive),
        sortOrder: sortOrder || 0,
      },
      include: {
        _count: {
          select: {
            teacherSubjects: true,
            curriculumSubjects: true,
            grades: true,
            schedules: true,
            exams: true,
          },
        },
      },
    });

    return NextResponse.json(subject, { status: 201 });
  } catch (error) {
    console.error('Error creating subject:', error);
    
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Subject with this code already exists' },
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
      code,
      name,
      nameArabic,
      description,
      credits,
      type,
      category,
      level,
      minGrade,
      maxGrade,
      isActive,
      sortOrder
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Subject ID is required' },
        { status: 400 }
      );
    }

    const subject = await prisma.subjects.update({
      where: { id },
      data: {
        code,
        name,
        nameArabic,
        description,
        credits,
        type,
        category,
        level,
        minGrade,
        maxGrade,
        isActive: Boolean(isActive),
        sortOrder,
      },
      include: {
        _count: {
          select: {
            teacherSubjects: true,
            curriculumSubjects: true,
            grades: true,
            schedules: true,
            exams: true,
          },
        },
      },
    });

    return NextResponse.json(subject);
  } catch (error) {
    console.error('Error updating subject:', error);
    
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Subject with this code already exists' },
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

    if (!hasPermission(session.user?.role || '', 'delete')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Subject ID is required' },
        { status: 400 }
      );
    }

    // Check if subject has associated data
    const subject = await prisma.subjects.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            teacherSubjects: true,
            curriculumSubjects: true,
            grades: true,
            schedules: true,
            exams: true,
          },
        },
      },
    });

    if (!subject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }

    const { teacherSubjects, curriculumSubjects, grades, schedules, exams } = subject._count;
    if (teacherSubjects > 0 || curriculumSubjects > 0 || grades > 0 || schedules > 0 || exams > 0) {
      return NextResponse.json(
        { error: 'Cannot delete subject that has associated data' },
        { status: 409 }
      );
    }

    // Soft delete the subject
    await softDelete(prisma.subjects, { id }, session.user?.id);

    return NextResponse.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Error deleting subject:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}