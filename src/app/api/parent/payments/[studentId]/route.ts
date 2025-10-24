import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Helper function to verify parent access to student
async function verifyParentAccess(userId: string, studentId: string) {
  const parent = await prisma.parent_accounts.findUnique({
    where: { userId }
  });

  if (!parent) return null;

  const parentStudent = await prisma.parent_students.findFirst({
    where: {
      studentId,
      parentId: parent.id,
      canViewPayments: true
    },
    include: {
      parent: true,
      student: {
        select: {
          id: true,
          nis: true,
          fullName: true,
          photo: true,
          institutionType: true,
          grade: true
        }
      }
    }
  });

  return parentStudent;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = params;
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const status = searchParams.get('status'); // SUCCESS, PENDING, FAILED
    const paymentType = searchParams.get('paymentType'); // SPP, REGISTRATION, etc.
    const limit = parseInt(searchParams.get('limit') || '50');

    // Verify parent has access to this student's payments
    const parentAccess = await verifyParentAccess(session.user.id, studentId);
    if (!parentAccess) {
      return NextResponse.json({ 
        error: 'Access denied to this student\'s payment data' 
      }, { status: 403 });
    }

    // Build where conditions
    const whereConditions: any = {
      studentId,
      createdAt: {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`)
      }
    };

    if (status) {
      whereConditions.status = status;
    }

    if (paymentType) {
      whereConditions.paymentType = paymentType;
    }

    // Get payments
    const payments = await prisma.payments.findMany({
      where: whereConditions,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    // Calculate statistics
    const currentYearPayments = await prisma.payments.findMany({
      where: {
        studentId,
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`)
        }
      }
    });

    const stats = {
      total: currentYearPayments.length,
      totalAmount: currentYearPayments.reduce((sum, payment) => sum + payment.amount.toNumber(), 0),
      paid: currentYearPayments.filter(p => p.status === 'SUCCESS').length,
      paidAmount: currentYearPayments
        .filter(p => p.status === 'SUCCESS')
        .reduce((sum, payment) => sum + payment.amount.toNumber(), 0),
      pending: currentYearPayments.filter(p => p.status === 'PENDING').length,
      pendingAmount: currentYearPayments
        .filter(p => p.status === 'PENDING')
        .reduce((sum, payment) => sum + payment.amount.toNumber(), 0),
      failed: currentYearPayments.filter(p => p.status === 'FAILED').length,
      overdue: currentYearPayments.filter(p => 
        p.status === 'PENDING' && 
        p.expiredAt && 
        p.expiredAt < new Date()
      ).length
    };

    // Group payments by type for summary
    const paymentsByType = currentYearPayments.reduce((acc, payment) => {
      const type = payment.paymentType;
      if (!acc[type]) {
        acc[type] = {
          total: 0,
          totalAmount: 0,
          paid: 0,
          paidAmount: 0,
          pending: 0,
          pendingAmount: 0
        };
      }
      
      acc[type].total++;
      acc[type].totalAmount += payment.amount.toNumber();
      
      if (payment.status === 'SUCCESS') {
        acc[type].paid++;
        acc[type].paidAmount += payment.amount.toNumber();
      } else if (payment.status === 'PENDING') {
        acc[type].pending++;
        acc[type].pendingAmount += payment.amount.toNumber();
      }
      
      return acc;
    }, {} as any);

    // Group payments by month for charts
    const monthlyPayments = payments.reduce((acc, payment) => {
      const monthKey = payment.createdAt.toISOString().substring(0, 7); // YYYY-MM
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          total: 0,
          amount: 0,
          paid: 0,
          paidAmount: 0
        };
      }
      
      acc[monthKey].total++;
      acc[monthKey].amount += payment.amount.toNumber();
      
      if (payment.status === 'SUCCESS') {
        acc[monthKey].paid++;
        acc[monthKey].paidAmount += payment.amount.toNumber();
      }
      
      return acc;
    }, {} as any);

    // Get upcoming payment deadlines (next 30 days)
    const upcomingDeadlines = await prisma.payments.findMany({
      where: {
        studentId,
        status: 'PENDING',
        expiredAt: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
        }
      },
      orderBy: {
        expiredAt: 'asc'
      },
      take: 10
    });

    // Format payments for response
    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      paymentNo: payment.paymentNo,
      amount: payment.amount.toNumber(),
      paymentType: payment.paymentType,
      description: payment.description,
      method: payment.method,
      channel: payment.channel,
      status: payment.status,
      proofUrl: payment.proofUrl,
      vaNumber: payment.vaNumber,
      externalId: payment.externalId,
      expiredAt: payment.expiredAt,
      paidAt: payment.paidAt,
      verifiedAt: payment.verifiedAt,
      createdAt: payment.createdAt
    }));

    const result = {
      studentInfo: {
        id: parentAccess.student.id,
        nis: parentAccess.student.nis,
        fullName: parentAccess.student.fullName,
        photo: parentAccess.student.photo,
        institutionType: parentAccess.student.institutionType,
        grade: parentAccess.student.grade
      },
      stats,
      paymentsByType: Object.entries(paymentsByType).map(([type, data]) => ({
        type,
        ...(data as Record<string, any>)
      })),
      monthlyPayments: Object.values(monthlyPayments).sort((a: any, b: any) => 
        b.month.localeCompare(a.month)
      ),
      upcomingDeadlines: upcomingDeadlines.map(payment => ({
        id: payment.id,
        paymentNo: payment.paymentNo,
        type: payment.paymentType,
        amount: payment.amount.toNumber(),
        description: payment.description,
        expiredAt: payment.expiredAt,
        daysLeft: payment.expiredAt 
          ? Math.ceil((payment.expiredAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null
      })),
      payments: formattedPayments,
      meta: {
        total: payments.length,
        year: parseInt(year),
        hasMore: payments.length === limit,
        availableYears: await getAvailableYears(studentId),
        availableTypes: [...new Set(currentYearPayments.map(p => p.paymentType))]
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching student payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to get available years
async function getAvailableYears(studentId: string) {
  const payments = await prisma.payments.findMany({
    where: { studentId },
    select: { createdAt: true },
    orderBy: { createdAt: 'desc' }
  });

  const years = [...new Set(payments.map(p => p.createdAt.getFullYear()))];
  return years.sort((a, b) => b - a);
}