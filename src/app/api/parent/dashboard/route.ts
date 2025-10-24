import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Helper function to check if user is a parent and get their children
async function getParentChildren(userId: string) {
  const parentAccount = await prisma.parent_accounts.findUnique({
    where: { userId },
    include: {
      parentStudents: {
        include: {
          student: {
            select: {
              id: true,
              nis: true,
              fullName: true,
              photo: true,
              status: true,
              institutionType: true,
              grade: true,
              enrollmentYear: true,
            }
          }
        }
      }
    }
  });

  return parentAccount?.parentStudents.map(ps => ({
    ...ps.student,
    relationship: ps.relationship,
    isPrimary: ps.isPrimary
  })) || [];
}

// Calculate attendance percentage for a student
async function getAttendanceStats(studentId: string, currentSemesterId: string) {
  const attendance = await prisma.attendances.findMany({
    where: {
      studentId,
      semesterId: currentSemesterId
    }
  });

  const totalDays = attendance.length;
  const presentDays = attendance.filter(a => a.status === 'HADIR').length;
  const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  return {
    totalDays,
    presentDays,
    percentage,
    absentDays: attendance.filter(a => a.status === 'ALPHA').length,
    sickDays: attendance.filter(a => a.status === 'SAKIT').length,
    permittedDays: attendance.filter(a => a.status === 'IZIN').length,
    lateDays: attendance.filter(a => a.status === 'TERLAMBAT').length
  };
}

// Get average grades for a student
async function getGradeStats(studentId: string, currentSemesterId: string) {
  const grades = await prisma.grades.findMany({
    where: {
      studentId,
      semesterId: currentSemesterId,
      total: { not: null }
    },
    include: {
      subjects: true
    }
  });

  if (grades.length === 0) {
    return {
      average: 0,
      totalSubjects: 0,
      highestGrade: null,
      lowestGrade: null,
      subjectBreakdown: []
    };
  }

  const totalScore = grades.reduce((sum, grade) => sum + (grade.total?.toNumber() || 0), 0);
  const average = Math.round(totalScore / grades.length * 100) / 100;

  const sortedGrades = grades.sort((a, b) => (b.total?.toNumber() || 0) - (a.total?.toNumber() || 0));

  return {
    average,
    totalSubjects: grades.length,
    highestGrade: sortedGrades[0] ? {
      subject: sortedGrades[0].subjects?.name || 'Unknown',
      score: sortedGrades[0].total?.toNumber(),
      grade: sortedGrades[0].grade
    } : null,
    lowestGrade: sortedGrades[sortedGrades.length - 1] ? {
      subject: sortedGrades[sortedGrades.length - 1].subjects?.name || 'Unknown',
      score: sortedGrades[sortedGrades.length - 1].total?.toNumber(),
      grade: sortedGrades[sortedGrades.length - 1].grade
    } : null,
    subjectBreakdown: grades.map(g => ({
      subject: g.subjects?.name || 'Unknown',
      category: g.subjects?.category || 'UMUM',
      score: g.total?.toNumber(),
      grade: g.grade
    }))
  };
}

// Get payment status for a student
async function getPaymentStats(studentId: string) {
  const currentYear = new Date().getFullYear();
  const payments = await prisma.payments.findMany({
    where: {
      studentId,
      createdAt: {
        gte: new Date(`${currentYear}-01-01`),
        lte: new Date(`${currentYear}-12-31`)
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount.toNumber(), 0);
  const paidPayments = payments.filter(p => p.status === 'SUCCESS');
  const pendingPayments = payments.filter(p => p.status === 'PENDING');
  const paidAmount = paidPayments.reduce((sum, payment) => sum + payment.amount.toNumber(), 0);
  const pendingAmount = pendingPayments.reduce((sum, payment) => sum + payment.amount.toNumber(), 0);

  return {
    totalAmount,
    paidAmount,
    pendingAmount,
    paidCount: paidPayments.length,
    pendingCount: pendingPayments.length,
    recentPayments: payments.slice(0, 5).map(p => ({
      id: p.id,
      type: p.paymentType,
      amount: p.amount.toNumber(),
      status: p.status,
      date: p.createdAt
    }))
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get parent's children
    const children = await getParentChildren(userId);
    
    if (children.length === 0) {
      return NextResponse.json({ 
        error: 'No children found for this parent account' 
      }, { status: 404 });
    }

    // Get current semester
    const currentSemester = await prisma.semesters.findFirst({
      where: { isActive: true },
      include: {
        academic_years: {
          select: { name: true }
        }
      }
    });

    if (!currentSemester) {
      return NextResponse.json({ 
        error: 'No active semester found' 
      }, { status: 404 });
    }

    // Get statistics for each child
    const childrenStats = await Promise.all(
      children.map(async (child) => {
        const [attendanceStats, gradeStats, paymentStats] = await Promise.all([
          getAttendanceStats(child.id, currentSemester.id),
          getGradeStats(child.id, currentSemester.id),
          getPaymentStats(child.id)
        ]);

        return {
          ...child,
          attendance: attendanceStats,
          grades: gradeStats,
          payments: paymentStats
        };
      })
    );

    // Get recent announcements for parents
    const recentAnnouncements = await prisma.announcements.findMany({
      where: {
        status: 'PUBLISHED',
        publishDate: { lte: new Date() },
        AND: [
          {
            OR: [
              { targetAudience: 'ALL' },
              { targetAudience: 'PARENTS' }
            ]
          },
          {
            OR: [
              { expiryDate: null },
              { expiryDate: { gte: new Date() } }
            ]
          }
        ]
      },
      orderBy: [
        { isPinned: 'desc' },
        { priority: 'desc' },
        { publishDate: 'desc' }
      ],
      take: 5,
      select: {
        id: true,
        title: true,
        summary: true,
        category: true,
        priority: true,
        publishDate: true,
        featuredImage: true,
        isPinned: true
      }
    });

    // Get unread messages count
    const unreadMessagesCount = await prisma.messages.count({
      where: {
        receiverId: userId,
        isRead: false,
        status: { not: 'ARCHIVED' }
      }
    });

    // Get unread notifications count
    const unreadNotificationsCount = await prisma.notifications.count({
      where: {
        userId,
        isRead: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      }
    });

    // Calculate overall statistics
    const totalChildren = children.length;
    const overallAttendance = childrenStats.length > 0 
      ? Math.round(childrenStats.reduce((sum, child) => sum + child.attendance.percentage, 0) / childrenStats.length)
      : 0;
    const overallGradeAverage = childrenStats.length > 0 
      ? Math.round(childrenStats.reduce((sum, child) => sum + child.grades.average, 0) / childrenStats.length * 100) / 100
      : 0;
    const totalPendingPayments = childrenStats.reduce((sum, child) => sum + child.payments.pendingAmount, 0);

    const dashboardData = {
      overview: {
        totalChildren,
        overallAttendance,
        overallGradeAverage,
        totalPendingPayments,
        unreadMessagesCount,
        unreadNotificationsCount
      },
      currentSemester: {
        id: currentSemester.id,
        name: currentSemester.name,
        academicYear: currentSemester.academic_years?.name || 'Unknown',
        startDate: currentSemester.startDate,
        endDate: currentSemester.endDate
      },
      children: childrenStats,
      recentAnnouncements,
      quickStats: {
        attendanceAlerts: childrenStats.filter(child => child.attendance.percentage < 80).length,
        gradeAlerts: childrenStats.filter(child => child.grades.average < 70).length,
        paymentAlerts: childrenStats.filter(child => child.payments.pendingCount > 0).length
      }
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching parent dashboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}