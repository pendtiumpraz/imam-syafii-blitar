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
    const studentId = searchParams.get('studentId');
    const semesterId = searchParams.get('semesterId');
    const classId = searchParams.get('classId');
    const status = searchParams.get('status');

    const whereConditions: any = {};
    
    if (studentId) {
      whereConditions.studentId = studentId;
    }
    
    if (semesterId) {
      whereConditions.semesterId = semesterId;
    }
    
    if (classId) {
      whereConditions.classId = classId;
    }
    
    if (status) {
      whereConditions.status = status;
    }

    const reportCards = await prisma.report_cards.findMany({
      where: whereConditions,
      orderBy: [
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(reportCards);
  } catch (error) {
    console.error('Error fetching report cards:', error);
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
    const { studentId, semesterId, classId } = body;

    // Validate required fields
    if (!studentId || !semesterId || !classId) {
      return NextResponse.json(
        { error: 'Student, semester, and class are required' },
        { status: 400 }
      );
    }

    // Check if report card already exists
    const existingReportCard = await prisma.report_cards.findFirst({
      where: {
        studentId,
        semesterId,
      },
    });

    if (existingReportCard) {
      return NextResponse.json(
        { error: 'Report card already exists for this student and semester' },
        { status: 409 }
      );
    }

    // Get student's grades for the semester
    const grades = await prisma.grades.findMany({
      where: {
        studentId,
        semesterId,
      },
      include: {
        subjects: {
          select: {
            id: true,
            name: true,
            credits: true,
          },
        },
      },
    });

    // Calculate academic performance
    let totalScore = 0;
    let totalCredits = 0;
    let validGrades = 0;

    grades.forEach((grade) => {
      if (grade.total !== null && grade.subjects) {
        totalScore += Number(grade.total) * grade.subjects.credits;
        totalCredits += grade.subjects.credits;
        validGrades++;
      }
    });

    const overallAverage = totalCredits > 0 ? totalScore / totalCredits : null;

    // Get attendance data
    const attendances = await prisma.attendances.findMany({
      where: {
        studentId,
        semesterId,
        classId,
      },
    });

    // Calculate attendance statistics
    const totalDays = attendances.length;
    const presentDays = attendances.filter(a => a.status === 'HADIR').length;
    const sickDays = attendances.filter(a => a.status === 'SAKIT').length;
    const permittedDays = attendances.filter(a => a.status === 'IZIN').length;
    const absentDays = attendances.filter(a => a.status === 'ALPHA').length;
    const lateDays = attendances.filter(a => a.status === 'TERLAMBAT').length;
    const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    // Calculate class ranking
    const classmates = await prisma.student_classes.findMany({
      where: {
        classId,
        status: 'ACTIVE',
      },
      select: {
        studentId: true,
      },
    });

    const classmateIds = classmates.map(c => c.studentId);

    // Get all classmates' grades for ranking
    const classmateGrades = await prisma.grades.findMany({
      where: {
        studentId: { in: classmateIds },
        semesterId,
      },
      include: {
        subjects: {
          select: {
            credits: true,
          },
        },
      },
    });

    // Calculate average for each student
    const studentAverages = classmateGrades.reduce((acc, grade) => {
      if (!acc[grade.studentId]) {
        acc[grade.studentId] = { totalScore: 0, totalCredits: 0 };
      }
      if (grade.total !== null && grade.subjects) {
        acc[grade.studentId].totalScore += Number(grade.total) * grade.subjects.credits;
        acc[grade.studentId].totalCredits += grade.subjects.credits;
      }
      return acc;
    }, {} as Record<string, { totalScore: number; totalCredits: number }>);

    const rankedStudents = Object.entries(studentAverages)
      .map(([id, data]) => ({
        studentId: id,
        average: data.totalCredits > 0 ? data.totalScore / data.totalCredits : 0,
      }))
      .sort((a, b) => b.average - a.average);

    const rank = rankedStudents.findIndex(s => s.studentId === studentId) + 1;

    const reportCard = await prisma.report_cards.create({
      data: {
        studentId,
        semesterId,
        classId,
        totalScore: overallAverage,
        rank: rank > 0 ? rank : null,
        totalSubjects: validGrades,
        totalDays,
        presentDays,
        sickDays,
        permittedDays,
        absentDays,
        lateDays,
        attendancePercentage: parseFloat(attendancePercentage.toFixed(2)),
        generatedBy: session.user?.id,
        generatedAt: new Date(),
      },
    });

    return NextResponse.json(reportCard, { status: 201 });
  } catch (error) {
    console.error('Error generating report card:', error);
    
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Report card already exists for this student and semester' },
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
      behavior,
      personality,
      extracurricular,
      achievements,
      notes,
      recommendations,
      parentNotes,
      status
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Report card ID is required' },
        { status: 400 }
      );
    }

    const reportCard = await prisma.report_cards.update({
      where: { id },
      data: {
        behavior,
        personality: personality ? JSON.stringify(personality) : undefined,
        extracurricular: extracurricular ? JSON.stringify(extracurricular) : undefined,
        achievements: achievements ? JSON.stringify(achievements) : undefined,
        notes,
        recommendations,
        parentNotes,
        status,
      },
    });

    return NextResponse.json(reportCard);
  } catch (error) {
    console.error('Error updating report card:', error);
    
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Report card not found' },
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
        { error: 'Report card ID is required' },
        { status: 400 }
      );
    }

    // Check if report card is finalized
    const reportCard = await prisma.report_cards.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!reportCard) {
      return NextResponse.json(
        { error: 'Report card not found' },
        { status: 404 }
      );
    }

    if (reportCard.status === 'SIGNED' || reportCard.status === 'DISTRIBUTED') {
      return NextResponse.json(
        { error: 'Cannot delete finalized report card' },
        { status: 409 }
      );
    }

    await softDelete(prisma.report_cards, { id }, session.user.id);

    return NextResponse.json({ message: 'Report card soft deleted successfully' });
  } catch (error) {
    console.error('Error deleting report card:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}