import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const bulkVerifySchema = z.object({
  paymentIds: z.array(z.string()).min(1, 'At least one payment ID is required'),
  action: z.enum(['VERIFY', 'REJECT']),
  rejectionReason: z.string().optional(),
  notes: z.string().optional(),
});

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

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'PENDING';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Get pending payments for verification
    const [payments, total] = await Promise.all([
      prisma.bill_payments.findMany({
        where: {
          verificationStatus: status,
        },
        include: {
          bill: {
            include: {
              student: {
                select: {
                  fullName: true,
                  nis: true,
                  institutionType: true,
                  grade: true,
                  fatherPhone: true,
                  motherPhone: true,
                },
              },
              billType: {
                select: {
                  name: true,
                  category: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'asc', // Oldest first for FIFO processing
        },
        skip,
        take: limit,
      }),
      prisma.bill_payments.count({
        where: {
          verificationStatus: status,
        },
      }),
    ]);

    // Get verification stats
    const verificationStats = await prisma.bill_payments.groupBy({
      by: ['verificationStatus'],
      _count: {
        _all: true,
      },
      _sum: {
        amount: true,
      },
    });

    const stats = verificationStats.reduce((acc: any, stat) => {
      acc[stat.verificationStatus.toLowerCase()] = {
        count: stat._count._all,
        totalAmount: Number(stat._sum.amount || 0),
      };
      return acc;
    }, {});

    return NextResponse.json({
      data: payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error) {
    console.error('Error fetching payments for verification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { default: prisma } = await import('@/lib/prisma');
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check user permissions
    if (!session.user?.role || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validated = bulkVerifySchema.parse(body);

    // Get the payments to verify
    const payments = await prisma.bill_payments.findMany({
      where: {
        id: { in: validated.paymentIds },
        verificationStatus: 'PENDING',
      },
      include: {
        bill: {
          select: {
            id: true,
            studentId: true,
            amount: true,
            paidAmount: true,
            remainingAmount: true,
            status: true,
          },
        },
      },
    });

    if (payments.length === 0) {
      return NextResponse.json(
        { error: 'No pending payments found with provided IDs' },
        { status: 404 }
      );
    }

    if (payments.length !== validated.paymentIds.length) {
      return NextResponse.json(
        { error: 'Some payment IDs are invalid or already processed' },
        { status: 400 }
      );
    }

    // Process payments in transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const processedPayments = [];
      const updatedBills = [];

      for (const payment of payments) {
        const isVerifying = validated.action === 'VERIFY';
        
        // Update payment verification status
        const updatedPayment = await tx.billPayment.update({
          where: { id: payment.id },
          data: {
            verificationStatus: isVerifying ? 'VERIFIED' : 'REJECTED',
            verifiedBy: session.user.id,
            verifiedAt: new Date(),
            rejectionReason: validated.rejectionReason,
            notes: validated.notes,
          },
        });

        if (isVerifying) {
          // Update bill amounts
          const newPaidAmount = Number(payment.bill.paidAmount) + Number(payment.amount);
          const newRemainingAmount = Number(payment.bill.amount) - newPaidAmount;
          
          let newStatus = payment.bill.status;
          if (newRemainingAmount <= 0) {
            newStatus = 'PAID';
          } else if (newPaidAmount > 0) {
            newStatus = 'PARTIAL';
          }

          const updatedBill = await tx.bill.update({
            where: { id: payment.billId },
            data: {
              paidAmount: newPaidAmount,
              remainingAmount: Math.max(0, newRemainingAmount),
              status: newStatus,
            },
          });

          updatedBills.push(updatedBill);

          // Create payment history entry for verification
          await tx.paymentHistory.create({
            data: {
              billId: payment.billId,
              paymentId: payment.id,
              studentId: payment.bill.studentId,
              action: 'PAYMENT_VERIFIED',
              description: `Payment verified by ${session.user.name}`,
              previousAmount: Number(payment.bill.remainingAmount),
              newAmount: newRemainingAmount,
              changeAmount: -Number(payment.amount),
              performedBy: session.user.id,
              metadata: JSON.stringify({
                verificationNotes: validated.notes,
                bulkVerification: validated.paymentIds.length > 1,
                originalSubmissionDate: payment.createdAt,
              }),
            },
          });
        } else {
          // Create payment history entry for rejection
          await tx.paymentHistory.create({
            data: {
              billId: payment.billId,
              paymentId: payment.id,
              studentId: payment.bill.studentId,
              action: 'PAYMENT_REJECTED',
              description: `Payment rejected: ${validated.rejectionReason}`,
              performedBy: session.user.id,
              metadata: JSON.stringify({
                rejectionReason: validated.rejectionReason,
                rejectionNotes: validated.notes,
                bulkRejection: validated.paymentIds.length > 1,
              }),
            },
          });
        }

        processedPayments.push(updatedPayment);
      }

      return { processedPayments, updatedBills };
    });

    // Send notifications to parents if payments were verified
    if (validated.action === 'VERIFY') {
      // This could trigger email/SMS notifications to parents
      // For now, we'll just log it
      console.log(`Verified ${result.processedPayments.length} payments, notifications should be sent to parents`);
    }

    const action = validated.action === 'VERIFY' ? 'verified' : 'rejected';
    const successMessage = `Successfully ${action} ${result.processedPayments.length} payment${result.processedPayments.length !== 1 ? 's' : ''}`;

    return NextResponse.json({
      message: successMessage,
      data: {
        processedPayments: result.processedPayments.length,
        updatedBills: result.updatedBills.length,
        totalAmount: result.processedPayments.reduce((sum, p) => sum + Number(p.amount), 0),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error processing payment verification:', error);
    return NextResponse.json(
      { error: 'Failed to process payment verification' },
      { status: 500 }
    );
  }
}