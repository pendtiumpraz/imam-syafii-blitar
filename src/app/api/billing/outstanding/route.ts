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

    const searchParams = request.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');
    const institutionType = searchParams.get('institutionType');
    const grade = searchParams.get('grade');
    const billTypeId = searchParams.get('billTypeId');
    const status = searchParams.get('status') || 'OUTSTANDING';
    const isOverdue = searchParams.get('isOverdue');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build the where clause
    let where: any = {};

    // Status filtering
    if (status === 'ALL') {
      where.status = { in: ['OUTSTANDING', 'PARTIAL', 'OVERDUE'] };
    } else {
      where.status = status;
    }

    if (studentId) {
      where.studentId = studentId;
    }

    if (billTypeId) {
      where.billTypeId = billTypeId;
    }

    if (isOverdue !== null) {
      where.isOverdue = isOverdue === 'true';
    }

    // Student-related filters
    if (institutionType || grade || search) {
      where.student = {};
      
      if (institutionType) {
        where.student.institutionType = institutionType;
      }
      
      if (grade) {
        where.student.grade = grade;
      }
      
      if (search) {
        where.student.OR = [
          { fullName: { contains: search, mode: 'insensitive' } },
          { nis: { contains: search, mode: 'insensitive' } },
          { nisn: { contains: search, mode: 'insensitive' } },
        ];
      }
    }

    // Get bills with related data
    const [bills, total] = await Promise.all([
      prisma.bills.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              nis: true,
              institutionType: true,
              grade: true,
              fatherName: true,
              motherName: true,
              phone: true,
              fatherPhone: true,
              motherPhone: true,
            },
          },
          billType: {
            select: {
              name: true,
              category: true,
              latePenaltyType: true,
              latePenaltyAmount: true,
              gracePeriodDays: true,
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              paymentDate: true,
              verificationStatus: true,
            },
            where: {
              verificationStatus: 'VERIFIED',
            },
            orderBy: {
              paymentDate: 'desc',
            },
          },
          _count: {
            select: {
              payments: true,
              paymentHistory: true,
            },
          },
        },
        orderBy: [
          { isOverdue: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.bills.count({ where }),
    ]);

    // Calculate additional fields and update overdue status if needed
    const currentDate = new Date();
    const processedBills = [];

    for (const bill of bills) {
      const dueDate = new Date(bill.dueDate);
      const daysPastDue = Math.max(0, Math.floor((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
      const gracePeriodDays = bill.billType.gracePeriodDays || 0;
      const isCurrentlyOverdue = daysPastDue > gracePeriodDays && Number(bill.remainingAmount) > 0;

      // Update overdue status if it has changed
      if (bill.isOverdue !== isCurrentlyOverdue || bill.daysPastDue !== daysPastDue) {
        await prisma.bills.update({
          where: { id: bill.id },
          data: {
            isOverdue: isCurrentlyOverdue,
            daysPastDue,
            firstOverdueDate: isCurrentlyOverdue && !bill.firstOverdueDate ? currentDate : bill.firstOverdueDate,
            status: isCurrentlyOverdue && bill.status === 'OUTSTANDING' ? 'OVERDUE' : bill.status,
          },
        });
      }

      // Calculate late penalty if applicable
      let latePenalty = 0;
      if (isCurrentlyOverdue && bill.billType.latePenaltyType !== 'NONE') {
        if (bill.billType.latePenaltyType === 'FIXED') {
          latePenalty = Number(bill.billType.latePenaltyAmount || 0);
        } else if (bill.billType.latePenaltyType === 'PERCENTAGE') {
          latePenalty = (Number(bill.originalAmount) * Number(bill.billType.latePenaltyAmount || 0)) / 100;
        }
      }

      processedBills.push({
        ...bill,
        daysPastDue,
        isCurrentlyOverdue,
        latePenalty,
        totalAmountDue: Number(bill.remainingAmount) + latePenalty,
        lastPaymentDate: bill.payments[0]?.paymentDate || null,
        paymentCount: bill._count.payments,
      });
    }

    // Calculate summary statistics
    const summary = {
      totalBills: total,
      totalOutstanding: processedBills.reduce((sum, bill) => sum + Number(bill.remainingAmount), 0),
      totalPenalties: processedBills.reduce((sum, bill) => sum + (bill.latePenalty || 0), 0),
      overdueCount: processedBills.filter(bill => bill.isCurrentlyOverdue).length,
      averageAmount: total > 0 ? processedBills.reduce((sum, bill) => sum + Number(bill.amount), 0) / total : 0,
      oldestOverdue: processedBills
        .filter(bill => bill.isCurrentlyOverdue)
        .reduce((oldest: any, bill) => {
          return !oldest || bill.daysPastDue > oldest.daysPastDue ? bill : oldest;
        }, null as any),
    };

    // Group by institution type for additional insights
    const byInstitution = processedBills.reduce((acc: any, bill) => {
      const type = bill.student.institutionType;
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          totalAmount: 0,
          overdueCount: 0,
        };
      }
      acc[type].count++;
      acc[type].totalAmount += Number(bill.remainingAmount);
      if (bill.isCurrentlyOverdue) {
        acc[type].overdueCount++;
      }
      return acc;
    }, {});

    return NextResponse.json({
      data: processedBills,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary,
      byInstitution,
    });
  } catch (error) {
    console.error('Error fetching outstanding bills:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}