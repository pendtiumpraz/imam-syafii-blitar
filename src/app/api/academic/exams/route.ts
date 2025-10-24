import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { softDelete } from '@/lib/soft-delete';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const semesterId = searchParams.get('semesterId');
    const teacherId = searchParams.get('teacherId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const whereConditions: any = {
      isDeleted: false,
    };

    if (classId) {
      whereConditions.classId = classId;
    }

    if (subjectId) {
      whereConditions.subjectId = subjectId;
    }

    if (semesterId) {
      whereConditions.semesterId = semesterId;
    }

    if (teacherId) {
      whereConditions.teacherId = teacherId;
    }

    if (type) {
      whereConditions.type = type;
    }

    if (status) {
      whereConditions.status = status;
    }

    const exams = await prisma.exams.findMany({
      where: whereConditions,
      include: {
        subject: {
          select: {
            id: true,
            code: true,
            name: true,
            nameArabic: true,
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
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            results: true,
          },
        },
      },
      orderBy: [
        { date: 'desc' },
        { startTime: 'asc' },
      ],
    });

    return NextResponse.json(exams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      code,
      type,
      subjectId,
      classId,
      semesterId,
      teacherId,
      date,
      startTime,
      endTime,
      duration,
      room,
      maxScore,
      minScore,
      passingScore,
      instructions,
      materials
    } = body;

    // Validate required fields
    if (!name || !type || !subjectId || !classId || !semesterId || !teacherId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Name, type, subject, class, semester, teacher, date, start time, and end time are required' },
        { status: 400 }
      );
    }

    // Validate exam type
    const validTypes = ['UTS', 'UAS', 'QUIZ', 'PRAKTIK', 'UJIAN_HARIAN'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid exam type. Must be one of: ' + validTypes.join(', ') },
        { status: 400 }
      );
    }

    const exam = await prisma.exams.create({
      data: {
        name,
        code,
        type,
        subjectId,
        classId,
        semesterId,
        teacherId,
        date: new Date(date),
        startTime,
        endTime,
        duration: duration || 120,
        room,
        maxScore: maxScore || 100,
        minScore: minScore || 0,
        passingScore: passingScore || 60,
        instructions,
        materials: JSON.stringify(materials || []),
      },
      include: {
        subject: {
          select: {
            id: true,
            code: true,
            name: true,
            nameArabic: true,
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
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            results: true,
          },
        },
      },
    });

    return NextResponse.json(exam, { status: 201 });
  } catch (error) {
    console.error('Error creating exam:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      name,
      code,
      type,
      date,
      startTime,
      endTime,
      duration,
      room,
      maxScore,
      minScore,
      passingScore,
      instructions,
      materials,
      status,
      isPublished
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Exam ID is required' },
        { status: 400 }
      );
    }

    const exam = await prisma.exams.update({
      where: { id },
      data: {
        name,
        code,
        type,
        date: date ? new Date(date) : undefined,
        startTime,
        endTime,
        duration,
        room,
        maxScore,
        minScore,
        passingScore,
        instructions,
        materials: materials ? JSON.stringify(materials) : undefined,
        status,
        isPublished: Boolean(isPublished),
      },
      include: {
        subject: {
          select: {
            id: true,
            code: true,
            name: true,
            nameArabic: true,
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
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            results: true,
          },
        },
      },
    });

    return NextResponse.json(exam);
  } catch (error) {
    console.error('Error updating exam:', error);
    
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Exam not found' },
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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Exam ID is required' },
        { status: 400 }
      );
    }

    // Check if exam has results
    const exam = await prisma.exams.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            results: true,
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      );
    }

    if (exam._count.results > 0) {
      return NextResponse.json(
        { error: 'Cannot delete exam that has results' },
        { status: 409 }
      );
    }

    // Soft delete the exam
    await softDelete(prisma.exams, { id }, session.user?.id);

    return NextResponse.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Error deleting exam:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}