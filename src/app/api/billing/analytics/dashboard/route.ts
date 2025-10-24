import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { default: prisma } = await import('@/lib/prisma');
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user permissions
    if (!session.user?.role || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Get all bills
    const totalBills = await prisma.bills.count();

    // Get outstanding bills (not fully paid)
    const outstandingBills = await prisma.bills.findMany({
      where: {
        status: { in: ['OUTSTANDING', 'PARTIAL'] },
      },
      select: {
        remainingAmount: true,
        isOverdue: true,
      },
    });

    const totalOutstanding = outstandingBills.reduce(
      (sum, bill) => sum + Number(bill.remainingAmount), 
      0
    );

    const totalOverdue = outstandingBills.filter(bill => bill.isOverdue).length;

    // Get total collected this month
    const collectedThisMonth = await prisma.bill_payments.aggregate({
      where: {
        verificationStatus: 'VERIFIED',
        paymentDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const totalCollected = Number(collectedThisMonth._sum.amount || 0);

    // Calculate payment rate (percentage of bills that are fully paid)
    const paidBills = await prisma.bills.count({
      where: { status: 'PAID' },
    });
    const paymentRate = totalBills > 0 ? (paidBills / totalBills) * 100 : 0;

    // Calculate average payment time (from bill generation to full payment)
    const avgPaymentTime = await prisma.$queryRaw`
      SELECT AVG(EXTRACT(DAY FROM (bp.payment_date - b.generated_at))) as avg_days
      FROM bills b
      JOIN bill_payments bp ON b.id = bp.bill_id
      WHERE b.status = 'PAID' 
      AND bp.verification_status = 'VERIFIED'
      AND b.generated_at >= CURRENT_DATE - INTERVAL '90 days'
    ` as any[];

    const averagePaymentTime = avgPaymentTime[0]?.avg_days || 0;

    // Get monthly collection trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyCollections = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', bp.payment_date) as month,
        SUM(bp.amount) as total_amount,
        COUNT(*) as payment_count
      FROM bill_payments bp
      WHERE bp.verification_status = 'VERIFIED'
      AND bp.payment_date >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', bp.payment_date)
      ORDER BY month
    ` as any[];

    // Get payment method distribution
    const paymentMethodStats = await prisma.bill_payments.groupBy({
      by: ['method'],
      where: {
        verificationStatus: 'VERIFIED',
        paymentDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        _all: true,
      },
    });

    // Get institution type breakdown
    const institutionBreakdown = await prisma.$queryRaw`
      SELECT 
        s.institution_type,
        COUNT(b.id) as total_bills,
        SUM(CASE WHEN b.status = 'OUTSTANDING' OR b.status = 'PARTIAL' THEN b.remaining_amount ELSE 0 END) as outstanding_amount,
        COUNT(CASE WHEN b.is_overdue = true THEN 1 END) as overdue_count
      FROM bills b
      JOIN students s ON b.student_id = s.id
      GROUP BY s.institution_type
    ` as any[];

    // Recent payment activity
    const recentPayments = await prisma.bill_payments.findMany({
      take: 10,
      orderBy: { paymentDate: 'desc' },
      where: {
        verificationStatus: 'VERIFIED',
      },
      include: {
        bills: {
          include: {
            students: {
              select: {
                fullName: true,
                nis: true,
              },
            },
            bill_types: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const dashboardData = {
      totalBills,
      totalOutstanding,
      totalOverdue,
      totalCollected,
      paymentRate: Math.round(paymentRate * 10) / 10,
      averagePaymentTime: Math.round(averagePaymentTime),
      monthlyTrend: monthlyCollections.map((item: any) => ({
        month: item.month,
        amount: Number(item.total_amount),
        count: Number(item.payment_count),
      })),
      paymentMethods: paymentMethodStats.map((item: any) => ({
        method: item.method,
        amount: Number(item._sum.amount || 0),
        count: item._count._all,
      })),
      institutionBreakdown: institutionBreakdown.map((item: any) => ({
        institutionType: item.institution_type,
        totalBills: Number(item.total_bills),
        outstandingAmount: Number(item.outstanding_amount || 0),
        overdueCount: Number(item.overdue_count || 0),
      })),
      recentPayments: recentPayments.map((payment: any) => ({
        id: payment.id,
        paymentNo: payment.paymentNo,
        amount: Number(payment.amount),
        paymentDate: payment.paymentDate,
        method: payment.method,
        studentName: payment.bills.students.fullName,
        billType: payment.bills.bill_types.name,
      })),
    };

    return NextResponse.json({ data: dashboardData });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}