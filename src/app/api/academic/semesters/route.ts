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
    const academicYearId = searchParams.get('academicYearId');
    const isActive = searchParams.get('active');

    const whereConditions: any = {};
    
    if (academicYearId) {
      whereConditions.academicYearId = academicYearId;
    }
    
    if (isActive === 'true') {
      whereConditions.isActive = true;
    }

    const semesters = await prisma.semesters.findMany({
      where: whereConditions,
      include: {
        academic_years: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            teacherSubjects: true,
            grades: true,
            attendances: true,
            exams: true,
          },
        },
      },
      orderBy: [
        { academic_years: { startDate: 'desc' } },
        { startDate: 'asc' },
      ],
    });

    return NextResponse.json(semesters);
  } catch (error) {
    console.error('Error fetching semesters:', error);
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
      academicYearId,
      name,
      shortName,
      startDate,
      endDate,
      gradingDeadline,
      reportDeadline,
      isActive
    } = body;

    // Validate required fields
    if (!academicYearId || !name || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Academic year, name, start date, and end date are required' },
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

    // If this is being set as active, deactivate other semesters in the same academic year
    if (isActive) {
      await prisma.semesters.updateMany({
        where: { 
          academicYearId,
          isActive: true
        },
        data: { isActive: false },
      });
    }

    const semester = await prisma.semesters.create({
      data: {
        academicYearId,
        name,
        shortName,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        gradingDeadline: gradingDeadline ? new Date(gradingDeadline) : null,
        reportDeadline: reportDeadline ? new Date(reportDeadline) : null,
        isActive: Boolean(isActive),
      },
      include: {
        academic_years: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            teacherSubjects: true,
            grades: true,
            attendances: true,
            exams: true,
          },
        },
      },
    });

    return NextResponse.json(semester, { status: 201 });
  } catch (error) {
    console.error('Error creating semester:', error);
    
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Semester with this name already exists in the academic year' },
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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      name,
      shortName,
      startDate,
      endDate,
      gradingDeadline,
      reportDeadline,
      isActive
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Semester ID is required' },
        { status: 400 }
      );
    }

    // Get current semester to find academic year
    const currentSemester = await prisma.semesters.findUnique({
      where: { id },
      select: { academicYearId: true },
    });

    if (!currentSemester) {
      return NextResponse.json(
        { error: 'Semester not found' },
        { status: 404 }
      );
    }

    // If this is being set as active, deactivate other semesters in the same academic year
    if (isActive) {
      await prisma.semesters.updateMany({
        where: { 
          academicYearId: currentSemester.academicYearId,
          isActive: true,
          NOT: { id }
        },
        data: { isActive: false },
      });
    }

    const semester = await prisma.semesters.update({
      where: { id },
      data: {
        name,
        shortName,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        gradingDeadline: gradingDeadline ? new Date(gradingDeadline) : null,
        reportDeadline: reportDeadline ? new Date(reportDeadline) : null,
        isActive: Boolean(isActive),
      },
      include: {
        academic_years: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            teacherSubjects: true,
            grades: true,
            attendances: true,
            exams: true,
          },
        },
      },
    });

    return NextResponse.json(semester);
  } catch (error) {
    console.error('Error updating semester:', error);
    
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Semester not found' },
        { status: 404 }
      );
    }

    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Semester with this name already exists in the academic year' },
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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Semester ID is required' },
        { status: 400 }
      );
    }

    // Check if semester has associated data
    const semester = await prisma.semesters.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            teacherSubjects: true,
            grades: true,
            attendances: true,
            exams: true,
          },
        },
      },
    });

    if (!semester) {
      return NextResponse.json(
        { error: 'Semester not found' },
        { status: 404 }
      );
    }

    const { teacherSubjects, grades, attendances, exams } = semester._count;
    if (teacherSubjects > 0 || grades > 0 || attendances > 0 || exams > 0) {
      return NextResponse.json(
        { error: 'Cannot delete semester that has associated academic data' },
        { status: 409 }
      );
    }

    await softDelete(prisma.semesters, { id }, session.user.id);

    return NextResponse.json({ message: 'Semester soft deleted successfully' });
  } catch (error) {
    console.error('Error deleting semester:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}