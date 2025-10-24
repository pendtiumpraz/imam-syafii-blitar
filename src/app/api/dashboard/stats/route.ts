import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current date info
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentYear = new Date(now.getFullYear(), 0, 1);

    // Fetch all statistics in parallel
    const [
      // Student Statistics
      totalStudents,
      activeStudents,
      newStudentsThisMonth,
      
      // Teacher Statistics
      totalTeachers,
      
      // Financial Statistics
      currentMonthIncome,
      currentMonthExpenses,
      totalDonations,
      outstandingBills,
      
      // Academic Statistics
      totalClasses,
      totalSubjects,
      
      // Activity Statistics
      totalActivities,
      currentMonthActivities,
      
      // Hafalan Statistics
      totalHafalanSessions,
      
      // Business Unit Statistics
      businessUnits,
      businessReports,
      
      // PPDB Statistics
      ppdbRegistrations,
      
      // SPP Statistics
      sppBillings,
      
      // Library Statistics
      totalEbooks,
      totalVideos,
    ] = await Promise.all([
      // Students
      prisma.students.count(),
      prisma.students.count({ where: { status: 'ACTIVE' } }),
      prisma.students.count({
        where: {
          createdAt: { gte: currentMonth },
          status: 'ACTIVE'
        }
      }),
      
      // Teachers
      prisma.teachers.count(),
      
      // Financial - Income
      prisma.transactions.aggregate({
        where: {
          type: 'INCOME',
          date: { gte: currentMonth },
          status: 'POSTED'
        },
        _sum: { amount: true }
      }),
      
      // Financial - Expenses
      prisma.transactions.aggregate({
        where: {
          type: 'EXPENSE',
          date: { gte: currentMonth },
          status: 'POSTED'
        },
        _sum: { amount: true }
      }),
      
      // Financial - Donations
      prisma.donations.aggregate({
        where: {
          paymentStatus: 'VERIFIED',
          createdAt: { gte: currentMonth }
        },
        _sum: { amount: true }
      }),
      
      // Financial - Outstanding Bills
      prisma.spp_billings.aggregate({
        where: {
          status: { in: ['UNPAID', 'PARTIAL', 'OVERDUE'] }
        },
        _sum: { totalAmount: true }
      }),
      
      // Academic
      prisma.classes.count({ where: { isActive: true } }),
      prisma.subjects.count({ where: { isActive: true } }),
      
      // Activities
      prisma.activities.count(),
      prisma.activities.count({
        where: { createdAt: { gte: currentMonth } }
      }),
      
      // Hafalan
      prisma.hafalan_sessions.count({
        where: { createdAt: { gte: currentMonth } }
      }),
      
      // Business Units
      prisma.business_units.findMany({
        where: { isActive: true },
      }),
      
      // Business Reports for current month
      prisma.business_unit_reports.findMany({
        where: {
          year: now.getFullYear(),
          month: now.getMonth() + 1
        },
      }),
      
      // PPDB
      prisma.ppdb_registrations.count({
        where: {
          academicYear: `${now.getFullYear()}/${now.getFullYear() + 1}`,
          status: { not: 'DRAFT' }
        }
      }),
      
      // SPP
      prisma.spp_billings.findMany({
        where: {
          year: now.getFullYear(),
          month: now.getMonth() + 1
        },
        select: {
          status: true,
          totalAmount: true,
          paidAmount: true
        }
      }),
      
      // Library
      prisma.ebooks.count({ where: { isPublic: true } }),
      prisma.videos.count({ where: { isPublic: true } }),
    ]);

    // Calculate derived statistics
    const monthlyIncome = Number(currentMonthIncome._sum.amount || 0);
    const monthlyExpenses = Number(currentMonthExpenses._sum.amount || 0);
    const monthlyProfit = monthlyIncome - monthlyExpenses;
    const monthlyDonations = Number(totalDonations._sum.amount || 0);
    const totalOutstanding = Number(outstandingBills._sum.totalAmount || 0);

    // Calculate SPP collection rate
    const sppStats = sppBillings.reduce((acc, bill) => {
      acc.total += Number(bill.totalAmount);
      acc.paid += Number(bill.paidAmount);
      if (bill.status === 'PAID') acc.paidCount++;
      return acc;
    }, { total: 0, paid: 0, paidCount: 0 });

    const sppCollectionRate = sppStats.total > 0 
      ? (sppStats.paid / sppStats.total) * 100 
      : 0;

    // Calculate business unit totals
    const businessUnitTotals = businessReports.reduce((acc, report) => {
      acc.revenue += Number(report.revenue);
      acc.expenses += Number(report.expenses);
      acc.profit += Number(report.netProfit);
      return acc;
    }, { revenue: 0, expenses: 0, profit: 0 });

    // Get monthly reports count for each unit
    const unitReportsCounts = await Promise.all(
      businessUnits.map(async (unit) => ({
        unitId: unit.id,
        count: await prisma.business_unit_reports.count({ where: { unitId: unit.id } }),
      }))
    );
    const unitReportsMap = new Map(unitReportsCounts.map(u => [u.unitId, u.count]));

    // Growth calculations
    const [lastMonthStudents, lastMonthIncome] = await Promise.all([
      prisma.students.count({
        where: {
          createdAt: { gte: lastMonth, lt: currentMonth },
          status: 'ACTIVE'
        }
      }),
      prisma.transactions.aggregate({
        where: {
          type: 'INCOME',
          date: { gte: lastMonth, lt: currentMonth },
          status: 'POSTED'
        },
        _sum: { amount: true }
      })
    ]);

    const studentGrowth = lastMonthStudents > 0
      ? ((newStudentsThisMonth - lastMonthStudents) / lastMonthStudents) * 100
      : 0;

    const lastMonthIncomeAmount = Number(lastMonthIncome._sum.amount || 0);
    const incomeGrowth = lastMonthIncomeAmount > 0
      ? ((monthlyIncome - lastMonthIncomeAmount) / lastMonthIncomeAmount) * 100
      : 0;

    // Prepare response
    const stats = {
      // Student Stats
      students: {
        total: totalStudents,
        active: activeStudents,
        newThisMonth: newStudentsThisMonth,
        growth: studentGrowth.toFixed(1)
      },
      
      // Teacher Stats
      teachers: {
        total: totalTeachers
      },
      
      // Financial Stats
      finance: {
        monthlyIncome,
        monthlyExpenses,
        monthlyProfit,
        monthlyDonations,
        totalOutstanding,
        incomeGrowth: incomeGrowth.toFixed(1)
      },
      
      // Academic Stats
      academic: {
        totalClasses,
        totalSubjects,
        totalActivities,
        monthlyActivities: currentMonthActivities
      },
      
      // Hafalan Stats
      hafalan: {
        monthlySessions: totalHafalanSessions
      },
      
      // Business Unit Stats
      businessUnits: {
        total: businessUnits.length,
        monthlyRevenue: businessUnitTotals.revenue,
        monthlyExpenses: businessUnitTotals.expenses,
        monthlyProfit: businessUnitTotals.profit,
        units: businessUnits.map(unit => ({
          name: unit.name,
          code: unit.code,
          reportCount: unitReportsMap.get(unit.id) || 0
        }))
      },
      
      // PPDB Stats
      ppdb: {
        totalRegistrations: ppdbRegistrations
      },
      
      // SPP Stats
      spp: {
        monthlyBills: sppBillings.length,
        collectionRate: sppCollectionRate.toFixed(1),
        totalBilled: sppStats.total,
        totalCollected: sppStats.paid
      },
      
      // Library Stats
      library: {
        totalEbooks,
        totalVideos
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}