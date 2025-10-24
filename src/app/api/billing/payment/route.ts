import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const recordPaymentSchema = z.object({
  billId: z.string().min(1, 'Bill ID is required'),
  amount: z.number().positive('Amount must be positive'),
  paymentDate: z.string().optional(),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'QRIS', 'VIRTUAL_ACCOUNT', 'CARD', 'OTHER']),
  channel: z.string().optional(),
  reference: z.string().optional(),
  proofUrl: z.string().optional(),
  notes: z.string().optional(),
  autoVerify: z.boolean().default(false), // For cash payments or admin entries
});

const verifyPaymentSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  action: z.enum(['VERIFY', 'REJECT']),
  rejectionReason: z.string().optional(),
  notes: z.string().optional(),
});

// Helper function to generate payment number
async function generatePaymentNumber(prisma: any): Promise<string> {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  const prefix = `BP-${year}-${month}`;
  
  const lastPayment = await prisma.bill_payments.findFirst({
    where: {
      paymentNo: {
        startsWith: prefix,
      },
    },
    orderBy: {
      paymentNo: 'desc',
    },
  });

  let sequence = 1;
  if (lastPayment) {
    const lastSequence = parseInt(lastPayment.paymentNo.split('-').pop() || '0');
    sequence = lastSequence + 1;
  }

  return `${prefix}-${sequence.toString().padStart(4, '0')}`;
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

    const body = await request.json();
    const action = body.action || 'RECORD_PAYMENT';

    if (action === 'VERIFY_PAYMENT') {
      return await verifyPayment(prisma, session, body);
    } else {
      return await recordPayment(prisma, session, body);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}

async function recordPayment(prisma: any, session: any, body: any) {
  const validated = recordPaymentSchema.parse(body);

  // Get the bill
  const bill = await prisma.bills.findUnique({
    where: { id: validated.billId },
    include: {
      student: {
        select: {
          fullName: true,
          nis: true,
        },
      },
      billType: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!bill) {
    return NextResponse.json(
      { error: 'Bill not found' },
      { status: 404 }
    );
  }

  // Check if bill is already fully paid
  if (bill.status === 'PAID') {
    return NextResponse.json(
      { error: 'Bill is already fully paid' },
      { status: 400 }
    );
  }

  // Validate payment amount
  if (validated.amount > Number(bill.remainingAmount)) {
    return NextResponse.json(
      { error: 'Payment amount exceeds remaining bill amount' },
      { status: 400 }
    );
  }

  const paymentDate = validated.paymentDate ? new Date(validated.paymentDate) : new Date();
  
  // Create payment in transaction
  const result = await prisma.$transaction(async (tx: any) => {
    // Generate payment number
    const paymentNo = await generatePaymentNumber(tx);

    // Create payment
    const payment = await tx.bill_payments.create({
      data: {
        paymentNo,
        billId: validated.billId,
        amount: validated.amount,
        paymentDate,
        method: validated.method,
        channel: validated.channel,
        reference: validated.reference,
        proofUrl: validated.proofUrl,
        notes: validated.notes,
        verificationStatus: validated.autoVerify ? 'VERIFIED' : 'PENDING',
        verifiedBy: validated.autoVerify ? session.user.id : null,
        verifiedAt: validated.autoVerify ? new Date() : null,
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

    // Update bill amounts if payment is verified
    if (validated.autoVerify) {
      const newPaidAmount = Number(bill.paidAmount) + validated.amount;
      const newRemainingAmount = Number(bill.amount) - newPaidAmount;
      
      let newStatus = bill.status;
      if (newRemainingAmount <= 0) {
        newStatus = 'PAID';
      } else if (newPaidAmount > 0) {
        newStatus = 'PARTIAL';
      }

      await tx.bills.update({
        where: { id: validated.billId },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: Math.max(0, newRemainingAmount),
          status: newStatus,
        },
      });

      // Create payment history entry
      await tx.payment_history.create({
        data: {
          billId: validated.billId,
          paymentId: payment.id,
          studentId: bill.studentId,
          action: 'PAYMENT_MADE',
          description: `Payment received - ${validated.method}${validated.channel ? ` via ${validated.channel}` : ''}`,
          previousAmount: Number(bill.remainingAmount),
          newAmount: newRemainingAmount,
          changeAmount: -validated.amount,
          performedBy: session.user.id,
          metadata: JSON.stringify({
            paymentMethod: validated.method,
            paymentChannel: validated.channel,
            reference: validated.reference,
            autoVerified: validated.autoVerify,
          }),
        },
      });
    } else {
      // Create payment history entry for pending payment
      await tx.payment_history.create({
        data: {
          billId: validated.billId,
          paymentId: payment.id,
          studentId: bill.studentId,
          action: 'PAYMENT_SUBMITTED',
          description: `Payment submitted for verification - ${validated.method}`,
          changeAmount: -validated.amount,
          performedBy: session.user.id,
          metadata: JSON.stringify({
            paymentMethod: validated.method,
            paymentChannel: validated.channel,
            reference: validated.reference,
            requiresVerification: true,
          }),
        },
      });
    }

    return payment;
  });

  return NextResponse.json({
    message: validated.autoVerify 
      ? 'Payment recorded and verified successfully' 
      : 'Payment submitted for verification',
    data: {
      payment: {
        id: result.id,
        paymentNo: result.paymentNo,
        amount: result.amount,
        paymentDate: result.paymentDate,
        method: result.method,
        verificationStatus: result.verificationStatus,
      },
      bill: {
        id: result.bills.id,
        billNo: result.bills.billNo,
        studentName: result.bills.students.fullName,
        billType: result.bills.bill_types.name,
        remainingAmount: validated.autoVerify
          ? Math.max(0, Number(result.bills.remainingAmount) - validated.amount)
          : result.bills.remainingAmount,
      },
    },
  });
}

async function verifyPayment(prisma: any, session: any, body: any) {
  const validated = verifyPaymentSchema.parse(body);

  // Check user permissions
  if (!session.user.role || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  // Get the payment
  const payment = await prisma.bill_payments.findUnique({
    where: { id: validated.paymentId },
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

  if (!payment) {
    return NextResponse.json(
      { error: 'Payment not found' },
      { status: 404 }
    );
  }

  if (payment.verificationStatus !== 'PENDING') {
    return NextResponse.json(
      { error: 'Payment has already been processed' },
      { status: 400 }
    );
  }

  const result = await prisma.$transaction(async (tx: any) => {
    const isVerifying = validated.action === 'VERIFY';
    
    // Update payment verification status
    const updatedPayment = await tx.bill_payments.update({
      where: { id: validated.paymentId },
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
      const newPaidAmount = Number(payment.bills.paidAmount) + Number(payment.amount);
      const newRemainingAmount = Number(payment.bills.amount) - newPaidAmount;

      let newStatus = payment.bills.status;
      if (newRemainingAmount <= 0) {
        newStatus = 'PAID';
      } else if (newPaidAmount > 0) {
        newStatus = 'PARTIAL';
      }

      await tx.bills.update({
        where: { id: payment.billId },
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: Math.max(0, newRemainingAmount),
          status: newStatus,
        },
      });

      // Create payment history entry for verification
      await tx.payment_history.create({
        data: {
          billId: payment.billId,
          paymentId: payment.id,
          studentId: payment.bills.studentId,
          action: 'PAYMENT_VERIFIED',
          description: `Payment verified by ${session.user.name}`,
          previousAmount: Number(payment.bills.remainingAmount),
          newAmount: newRemainingAmount,
          changeAmount: -Number(payment.amount),
          performedBy: session.user.id,
          metadata: JSON.stringify({
            verificationNotes: validated.notes,
            originalSubmissionDate: payment.createdAt,
          }),
        },
      });
    } else {
      // Create payment history entry for rejection
      await tx.payment_history.create({
        data: {
          billId: payment.billId,
          paymentId: payment.id,
          studentId: payment.bills.studentId,
          action: 'PAYMENT_REJECTED',
          description: `Payment rejected: ${validated.rejectionReason}`,
          performedBy: session.user.id,
          metadata: JSON.stringify({
            rejectionReason: validated.rejectionReason,
            rejectionNotes: validated.notes,
          }),
        },
      });
    }

    return updatedPayment;
  });

  return NextResponse.json({
    message: validated.action === 'VERIFY' 
      ? 'Payment verified successfully' 
      : 'Payment rejected',
    data: {
      payment: {
        id: result.id,
        paymentNo: result.paymentNo,
        verificationStatus: result.verificationStatus,
        verifiedAt: result.verifiedAt,
        rejectionReason: result.rejectionReason,
      },
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { default: prisma } = await import('@/lib/prisma');
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const billId = searchParams.get('billId');
    const studentId = searchParams.get('studentId');
    const verificationStatus = searchParams.get('verificationStatus');
    const method = searchParams.get('method');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {};

    if (billId) {
      where.billId = billId;
    }

    if (verificationStatus) {
      where.verificationStatus = verificationStatus;
    }

    if (method) {
      where.method = method;
    }

    if (studentId) {
      where.bills = {
        studentId: studentId,
      };
    }

    const [payments, total] = await Promise.all([
      prisma.bill_payments.findMany({
        where,
        include: {
          bills: {
            include: {
              students: {
                select: {
                  fullName: true,
                  nis: true,
                  institutionType: true,
                },
              },
              bill_types: {
                select: {
                  name: true,
                  category: true,
                },
              },
            },
          },
        },
        orderBy: {
          paymentDate: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.bill_payments.count({ where }),
    ]);

    return NextResponse.json({
      data: payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}