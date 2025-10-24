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
      },
      orderBy: [
        { academic_years: { startDate: 'desc' } },
        { startDate: 'asc' },
      ],
    });

    // Get counts separately
    const counts = await Promise.all(
      semesters.map(async (s) => ({
        semesterId: s.id,
        teacherSubjects: await prisma.teacher_subjects.count({ where: { semesterId: s.id } }),
        grades: await prisma.grades.count({ where: { semesterId: s.id } }),
        attendances: await prisma.attendances.count({ where: { semesterId: s.id } }),
        exams: await prisma.exams.count({ where: { semesterId: s.id } }),
      }))
    );
    const countsMap = new Map(counts.map(c => [c.semesterId, c]));

    const semestersWithCounts = semesters.map(s => ({
      ...s,
      _count: {
        teacherSubjects: countsMap.get(s.id)?.teacherSubjects || 0,
        grades: countsMap.get(s.id)?.grades || 0,
        attendances: countsMap.get(s.id)?.attendances || 0,
        exams: countsMap.get(s.id)?.exams || 0,
      },
    }));

    return NextResponse.json(semestersWithCounts);
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
      },
    });

    // Get counts separately
    const [teacherSubjects, grades, attendances, exams] = await Promise.all([
      prisma.teacher_subjects.count({ where: { semesterId: semester.id } }),
      prisma.grades.count({ where: { semesterId: semester.id } }),
      prisma.attendances.count({ where: { semesterId: semester.id } }),
      prisma.exams.count({ where: { semesterId: semester.id } }),
    ]);

    const semesterWithCount = {
      ...semester,
      _count: {
        teacherSubjects,
        grades,
        attendances,
        exams,
      },
    };

    return NextResponse.json(semesterWithCount, { status: 201 });
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
      },
    });

    // Get counts separately
    const [teacherSubjects, grades, attendances, exams] = await Promise.all([
      prisma.teacher_subjects.count({ where: { semesterId: semester.id } }),
      prisma.grades.count({ where: { semesterId: semester.id } }),
      prisma.attendances.count({ where: { semesterId: semester.id } }),
      prisma.exams.count({ where: { semesterId: semester.id } }),
    ]);

    const semesterWithCount = {
      ...semester,
      _count: {
        teacherSubjects,
        grades,
        attendances,
        exams,
      },
    };

    return NextResponse.json(semesterWithCount);
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

    // Check if semester exists
    const semester = await prisma.semesters.findUnique({
      where: { id },
    });

    if (!semester) {
      return NextResponse.json(
        { error: 'Semester not found' },
        { status: 404 }
      );
    }

    // Check if semester has associated data
    const [teacherSubjects, grades, attendances, exams] = await Promise.all([
      prisma.teacher_subjects.count({ where: { semesterId: id } }),
      prisma.grades.count({ where: { semesterId: id } }),
      prisma.attendances.count({ where: { semesterId: id } }),
      prisma.exams.count({ where: { semesterId: id } }),
    ]);

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