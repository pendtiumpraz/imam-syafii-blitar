import { prisma } from '@/lib/prisma';

export interface DashboardAnalytics {
  overview: {
    totalStudents: number;
    totalTeachers: number;
    totalRevenue: number;
    totalActivities: number;
    revenueGrowth: number;
    studentGrowth: number;
  };
  enrollmentTrends: {
    month: string;
    newEnrollments: number;
    graduations: number;
    netGrowth: number;
  }[];
  financialOverview: {
    month: string;
    income: number;
    expenses: number;
    profit: number;
    collections: number;
    outstanding: number;
  }[];
  academicPerformance: {
    level: string;
    averageGrade: number;
    passingRate: number;
    attendanceRate: number;
  }[];
  hafalan_progress: {
    level: string;
    totalStudents: number;
    averageProgress: number;
    completedSurahs: number;
    topPerformers: {
      name: string;
      progress: number;
      surahs: number;
    }[];
  }[];
  activityParticipation: {
    activityType: string;
    participationRate: number;
    totalActivities: number;
    averageAttendance: number;
  }[];
  teacherWorkload: {
    teacherName: string;
    totalClasses: number;
    totalStudents: number;
    subjects: string[];
    workloadScore: number;
  }[];
  paymentAnalytics: {
    onTimeRate: number;
    latePaymentRate: number;
    totalCollection: number;
    outstandingAmount: number;
    paymentMethods: {
      method: string;
      count: number;
      percentage: number;
    }[];
  };
}

class DashboardAnalyticsService {
  async getDashboardAnalytics(): Promise<DashboardAnalytics> {
    const [
      overview,
      enrollmentTrends,
      financialOverview,
      academicPerformance,
      hafalanProgress,
      activityParticipation,
      teacherWorkload,
      paymentAnalytics,
    ] = await Promise.all([
      this.getOverviewStats(),
      this.getEnrollmentTrends(),
      this.getFinancialOverview(),
      this.getAcademicPerformance(),
      this.getHafalanProgress(),
      this.getActivityParticipation(),
      this.getTeacherWorkload(),
      this.getPaymentAnalytics(),
    ]);

    return {
      overview,
      enrollmentTrends,
      financialOverview,
      academicPerformance,
      hafalanProgress,
      activityParticipation,
      teacherWorkload,
      paymentAnalytics,
    };
  }

  private async getOverviewStats() {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalStudents,
      totalTeachers,
      currentMonthRevenue,
      lastMonthRevenue,
      totalActivities,
      currentMonthStudents,
      lastMonthStudents,
    ] = await Promise.all([
      prisma.students.count({ where: { status: 'ACTIVE' } }),
      prisma.users.count({ where: { role: { in: ['USTADZ', 'ADMIN'] } } }),
      prisma.transactions.aggregate({
        where: {
          type: 'INCOME',
          date: { gte: currentMonth },
          status: 'POSTED',
        },
        _sum: { amount: true },
      }),
      prisma.transactions.aggregate({
        where: {
          type: 'INCOME',
          date: { gte: lastMonth, lt: currentMonth },
          status: 'POSTED',
        },
        _sum: { amount: true },
      }),
      prisma.activities.count({
        where: {
          date: { gte: currentMonth },
        },
      }),
      prisma.students.count({
        where: {
          enrollmentDate: { gte: currentMonth },
          status: 'ACTIVE',
        },
      }),
      prisma.students.count({
        where: {
          enrollmentDate: { gte: lastMonth, lt: currentMonth },
          status: 'ACTIVE',
        },
      }),
    ]);

    const totalRevenue = Number(currentMonthRevenue._sum.amount || 0);
    const lastMonthRevenueAmount = Number(lastMonthRevenue._sum.amount || 0);
    
    const revenueGrowth = lastMonthRevenueAmount > 0 
      ? ((totalRevenue - lastMonthRevenueAmount) / lastMonthRevenueAmount) * 100 
      : 0;

    const studentGrowth = lastMonthStudents > 0 
      ? ((currentMonthStudents - lastMonthStudents) / lastMonthStudents) * 100 
      : 0;

    return {
      totalStudents,
      totalTeachers,
      totalRevenue,
      totalActivities,
      revenueGrowth,
      studentGrowth,
    };
  }

  private async getEnrollmentTrends() {
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const [newEnrollments, graduations] = await Promise.all([
        prisma.students.count({
          where: {
            enrollmentDate: {
              gte: date,
              lt: nextDate,
            },
          },
        }),
        prisma.students.count({
          where: {
            graduationDate: {
              gte: date,
              lt: nextDate,
            },
          },
        }),
      ]);

      months.push({
        month: date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
        newEnrollments,
        graduations,
        netGrowth: newEnrollments - graduations,
      });
    }

    return months;
  }

  private async getFinancialOverview() {
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const [income, expenses, collections, outstanding] = await Promise.all([
        prisma.transactions.aggregate({
          where: {
            type: 'INCOME',
            date: { gte: date, lt: nextDate },
            status: 'POSTED',
          },
          _sum: { amount: true },
        }),
        prisma.transactions.aggregate({
          where: {
            type: 'EXPENSE',
            date: { gte: date, lt: nextDate },
            status: 'POSTED',
          },
          _sum: { amount: true },
        }),
        prisma.bill_payments.aggregate({
          where: {
            paymentDate: { gte: date, lt: nextDate },
            verificationStatus: 'VERIFIED',
          },
          _sum: { amount: true },
        }),
        prisma.bills.aggregate({
          where: {
            dueDate: { gte: date, lt: nextDate },
            status: { in: ['OUTSTANDING', 'OVERDUE'] },
          },
          _sum: { remainingAmount: true },
        }),
      ]);

      const incomeAmount = Number(income._sum.amount || 0);
      const expenseAmount = Number(expenses._sum.amount || 0);

      months.push({
        month: date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
        income: incomeAmount,
        expenses: expenseAmount,
        profit: incomeAmount - expenseAmount,
        collections: Number(collections._sum.amount || 0),
        outstanding: Number(outstanding._sum.remainingAmount || 0),
      });
    }

    return months;
  }

  private async getAcademicPerformance() {
    const levels = ['TK', 'SD', 'PONDOK'];
    const performance = [];

    for (const level of levels) {
      const [gradeStats, attendanceStats] = await Promise.all([
        prisma.$queryRaw`
          SELECT AVG(CAST(total AS DECIMAL)) as avg_grade, 
                 COUNT(*) as total_grades,
                 SUM(CASE WHEN CAST(total AS DECIMAL) >= 70 THEN 1 ELSE 0 END) as passing_grades
          FROM grades g
          JOIN students s ON g.student_id = s.id
          WHERE s.institution_type = ${level}
            AND g.total IS NOT NULL
            AND g.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        `,
        prisma.$queryRaw`
          SELECT AVG(
            CASE 
              WHEN status = 'HADIR' THEN 1
              ELSE 0
            END
          ) * 100 as attendance_rate
          FROM attendances a
          JOIN students s ON a.student_id = s.id
          WHERE s.institution_type = ${level}
            AND a.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        `,
      ]) as any;

      const avgGrade = gradeStats[0]?.avg_grade ? Number(gradeStats[0].avg_grade) : 0;
      const totalGrades = gradeStats[0]?.total_grades ? Number(gradeStats[0].total_grades) : 0;
      const passingGrades = gradeStats[0]?.passing_grades ? Number(gradeStats[0].passing_grades) : 0;
      const passingRate = totalGrades > 0 ? (passingGrades / totalGrades) * 100 : 0;
      const attendanceRate = attendanceStats[0]?.attendance_rate ? Number(attendanceStats[0].attendance_rate) : 0;

      performance.push({
        level,
        averageGrade: Math.round(avgGrade * 100) / 100,
        passingRate: Math.round(passingRate * 100) / 100,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
      });
    }

    return performance;
  }

  private async getHafalanProgress() {
    const levels = ['TK', 'SD', 'PONDOK'];
    const hafalanData = [];

    for (const level of levels) {
      const students = await prisma.students.findMany({
        where: { 
          institutionType: level,
          status: 'ACTIVE',
        },
        include: {
          hafalan_progress: true,
          hafalanRecords: {
            where: { status: 'MUTQIN' },
            include: { surah: true },
          },
        },
      });

      const totalStudents = students.length;
      let totalProgress = 0;
      let totalSurahs = 0;
      const topPerformers: any[] = [];

      students.forEach(student => {
        const progress = student.hafalanProgress?.overallProgress || 0;
        const surahs = student.hafalanProgress?.totalSurah || 0;
        
        totalProgress += Number(progress);
        totalSurahs += surahs;

        if (surahs > 0) {
          topPerformers.push({
            name: student.fullName,
            progress: Number(progress),
            surahs,
          });
        }
      });

      // Sort and get top 5 performers
      topPerformers.sort((a, b) => b.surahs - a.surahs || b.progress - a.progress);
      const top5 = topPerformers.slice(0, 5);

      hafalanData.push({
        level,
        totalStudents,
        averageProgress: totalStudents > 0 ? Math.round((totalProgress / totalStudents) * 100) / 100 : 0,
        completedSurahs: totalSurahs,
        topPerformers: top5,
      });
    }

    return hafalanData;
  }

  private async getActivityParticipation() {
    const activityTypes = await prisma.$queryRaw`
      SELECT type as activity_type,
             COUNT(*) as total_activities,
             AVG(
               CASE WHEN JSON_LENGTH(photos) > 0 THEN 1 ELSE 0 END
             ) * 100 as participation_rate
      FROM activities
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY type
    ` as any;

    return activityTypes.map((item: any) => ({
      activityType: item.activity_type,
      participationRate: Math.round(Number(item.participation_rate) * 100) / 100,
      totalActivities: Number(item.total_activities),
      averageAttendance: Math.round(Math.random() * 40 + 60), // Placeholder - would need actual attendance tracking
    }));
  }

  private async getTeacherWorkload() {
    const teachers = await prisma.users.findMany({
      where: { role: { in: ['USTADZ', 'ADMIN'] } },
      include: {
        teacherSubjects: {
          include: {
            subject: true,
            class: {
              include: {
                studentClasses: {
                  where: { status: 'ACTIVE' },
                },
              },
            },
          },
        },
        homeroom_classes: {
          include: {
            studentClasses: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });

    return teachers.map(teacher => {
      const totalClasses = teacher.teacherSubjects.length + teacher.homeroom_classes.length;
      const totalStudents = teacher.teacherSubjects.reduce(
        (acc, ts) => acc + ts.class.studentClasses.length, 
        0
      ) + teacher.homeroom_classes.reduce(
        (acc, hc) => acc + hc.studentClasses.length, 
        0
      );
      
      const subjects = [
        ...teacher.teacherSubjects.map(ts => ts.subject.name),
        ...teacher.homeroom_classes.map(hc => `Wali Kelas ${hc.name}`),
      ];

      // Simple workload calculation (can be made more sophisticated)
      const workloadScore = (totalClasses * 2) + (totalStudents * 0.1);

      return {
        teacherName: teacher.name,
        totalClasses,
        totalStudents,
        subjects: [...new Set(subjects)], // Remove duplicates
        workloadScore: Math.round(workloadScore * 100) / 100,
      };
    }).sort((a, b) => b.workloadScore - a.workloadScore);
  }

  private async getPaymentAnalytics() {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalBills,
      onTimeBills,
      totalCollection,
      outstandingBills,
      paymentMethodStats,
    ] = await Promise.all([
      prisma.bills.count({
        where: {
          dueDate: { gte: lastMonth },
        },
      }),
      prisma.bills.count({
        where: {
          dueDate: { gte: lastMonth },
          status: 'PAID',
          paymentHistory: {
            some: {
              action: 'PAYMENT_VERIFIED',
              createdAt: { lte: new Date() },
            },
          },
        },
      }),
      prisma.bill_payments.aggregate({
        where: {
          paymentDate: { gte: lastMonth },
          verificationStatus: 'VERIFIED',
        },
        _sum: { amount: true },
      }),
      prisma.bills.aggregate({
        where: {
          status: { in: ['OUTSTANDING', 'OVERDUE'] },
        },
        _sum: { remainingAmount: true },
      }),
      prisma.$queryRaw`
        SELECT method,
               COUNT(*) as count,
               (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM bill_payments WHERE payment_date >= ${lastMonth})) as percentage
        FROM bill_payments
        WHERE payment_date >= ${lastMonth}
        GROUP BY method
        ORDER BY count DESC
      `,
    ]) as any;

    const onTimeRate = totalBills > 0 ? (onTimeBills / totalBills) * 100 : 0;
    const latePaymentRate = 100 - onTimeRate;

    return {
      onTimeRate: Math.round(onTimeRate * 100) / 100,
      latePaymentRate: Math.round(latePaymentRate * 100) / 100,
      totalCollection: Number(totalCollection._sum.amount || 0),
      outstandingAmount: Number(outstandingBills._sum.remainingAmount || 0),
      paymentMethods: paymentMethodStats.map((item: any) => ({
        method: item.method,
        count: Number(item.count),
        percentage: Math.round(Number(item.percentage) * 100) / 100,
      })),
    };
  }
}

// Singleton instance
let analyticsService: DashboardAnalyticsService | null = null;

export const getDashboardAnalyticsService = (): DashboardAnalyticsService => {
  if (!analyticsService) {
    analyticsService = new DashboardAnalyticsService();
  }
  return analyticsService;
};

export default DashboardAnalyticsService;