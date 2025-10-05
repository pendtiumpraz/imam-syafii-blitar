import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { softDelete } from '@/lib/soft-delete';

// Helper function to generate payment number
async function generatePaymentNumber(year: number, month: number): Promise<string> {
  const count = await prisma.sPPPayment.count({
    where: {
      createdAt: {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1)
      }
    }
  });
  
  const paddedMonth = String(month).padStart(2, '0');
  const paddedNo = String(count + 1).padStart(3, '0');
  return `PAY-${year}-${paddedMonth}-${paddedNo}`;
}

// Helper function to generate receipt number
function generateReceiptNumber(paymentNo: string): string {
  return paymentNo.replace('PAY', 'RCP');
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const billingId = searchParams.get('billingId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    
    const whereConditions: any = {};

    // Filter out soft deleted records
    whereConditions.isDeleted = false;

    if (billingId) {
      whereConditions.billingId = billingId;
    }

    if (status) {
      whereConditions.status = status;
    }
    
    if (startDate || endDate) {
      whereConditions.paymentDate = {};
      if (startDate) {
        whereConditions.paymentDate.gte = new Date(startDate);
      }
      if (endDate) {
        whereConditions.paymentDate.lte = new Date(endDate);
      }
    }
    
    const skip = (page - 1) * limit;
    
    const [payments, totalCount] = await Promise.all([
      prisma.sPPPayment.findMany({
        where: whereConditions,
        skip,
        take: limit,
        include: {
          billing: {
            include: {
              student: {
                select: {
                  id: true,
                  nis: true,
                  fullName: true,
                  grade: true
                }
              },
              class: {
                select: {
                  id: true,
                  name: true,
                  level: true
                }
              }
            }
          }
        },
        orderBy: { paymentDate: 'desc' }
      }),
      prisma.sPPPayment.count({ where: whereConditions })
    ]);
    
    // Calculate summary
    const summary = await prisma.sPPPayment.aggregate({
      where: {
        ...whereConditions,
        status: 'VERIFIED'
      },
      _sum: {
        amount: true
      },
      _count: true
    });
    
    return NextResponse.json({
      payments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1
      },
      summary: {
        totalPayments: summary._count,
        totalAmount: summary._sum.amount || 0
      }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const {
      billingId,
      amount,
      paymentDate,
      paymentMethod,
      bankName,
      accountNo,
      accountName,
      proofUrl,
      notes
    } = body;
    
    // Validate required fields
    if (!billingId || !amount || !paymentDate || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get billing details
    const billing = await prisma.sPPBilling.findUnique({
      where: { id: billingId }
    });
    
    if (!billing) {
      return NextResponse.json(
        { error: 'Billing not found' },
        { status: 404 }
      );
    }
    
    // Check if payment amount is valid
    const paymentAmount = new Decimal(amount);
    const remainingAmount = billing.totalAmount.minus(billing.paidAmount);
    
    if (paymentAmount.greaterThan(remainingAmount)) {
      return NextResponse.json(
        { error: 'Payment amount exceeds remaining balance' },
        { status: 400 }
      );
    }
    
    // Generate payment number
    const paymentDateObj = new Date(paymentDate);
    const paymentNo = await generatePaymentNumber(
      paymentDateObj.getFullYear(),
      paymentDateObj.getMonth() + 1
    );
    
    // Create payment record
    const payment = await prisma.sPPPayment.create({
      data: {
        paymentNo,
        billingId,
        amount: paymentAmount,
        paymentDate: paymentDateObj,
        paymentMethod,
        bankName,
        accountNo,
        accountName,
        proofUrl,
        notes,
        status: proofUrl ? 'PENDING' : 'VERIFIED', // Auto-verify if no proof needed
        verifiedBy: proofUrl ? null : session.user.id,
        verifiedAt: proofUrl ? null : new Date(),
        receiptNo: proofUrl ? null : generateReceiptNumber(paymentNo),
        recordedBy: session.user.id
      }
    });
    
    // Update billing if payment is verified
    if (!proofUrl) {
      const newPaidAmount = billing.paidAmount.plus(paymentAmount);
      const newStatus = newPaidAmount.equals(billing.totalAmount) ? 'PAID' : 'PARTIAL';
      
      await prisma.sPPBilling.update({
        where: { id: billingId },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
          paidAt: newStatus === 'PAID' ? new Date() : null,
          paymentMethod,
          paymentRef: paymentNo
        }
      });
    }
    
    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { id, action, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }
    
    // Get payment details
    const payment = await prisma.sPPPayment.findUnique({
      where: { id },
      include: { billing: true }
    });
    
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }
    
    // Handle verification action
    if (action === 'verify') {
      if (payment.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Payment is not pending verification' },
          { status: 400 }
        );
      }
      
      // Verify payment
      const updatedPayment = await prisma.sPPPayment.update({
        where: { id },
        data: {
          status: 'VERIFIED',
          verifiedBy: session.user.id,
          verifiedAt: new Date(),
          receiptNo: generateReceiptNumber(payment.paymentNo),
          notes: updateData.notes || payment.notes
        }
      });
      
      // Update billing
      const newPaidAmount = payment.billing.paidAmount.plus(payment.amount);
      const newStatus = newPaidAmount.equals(payment.billing.totalAmount) ? 'PAID' : 'PARTIAL';
      
      await prisma.sPPBilling.update({
        where: { id: payment.billingId },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
          paidAt: newStatus === 'PAID' ? new Date() : null,
          paymentMethod: payment.paymentMethod,
          paymentRef: payment.paymentNo
        }
      });
      
      return NextResponse.json(updatedPayment);
    }
    
    // Handle rejection action
    if (action === 'reject') {
      if (payment.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Payment is not pending verification' },
          { status: 400 }
        );
      }
      
      const updatedPayment = await prisma.sPPPayment.update({
        where: { id },
        data: {
          status: 'REJECTED',
          verifiedBy: session.user.id,
          verifiedAt: new Date(),
          notes: updateData.notes || 'Payment proof rejected'
        }
      });
      
      return NextResponse.json(updatedPayment);
    }
    
    // Regular update (only for pending payments)
    if (payment.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Cannot edit verified or rejected payments' },
        { status: 400 }
      );
    }
    
    const updatedPayment = await prisma.sPPPayment.update({
      where: { id },
      data: updateData
    });
    
    return NextResponse.json(updatedPayment);
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }
    
    // Get payment details
    const payment = await prisma.sPPPayment.findUnique({
      where: { id },
      include: { billing: true }
    });
    
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }
    
    // If payment was verified, update billing
    if (payment.status === 'VERIFIED') {
      const newPaidAmount = payment.billing.paidAmount.minus(payment.amount);
      const newStatus = newPaidAmount.equals(0) ? 'UNPAID' : 'PARTIAL';
      
      await prisma.sPPBilling.update({
        where: { id: payment.billingId },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
          paidAt: null
        }
      });
    }
    
    // Soft delete payment
    await softDelete(prisma.sPPPayment, { id }, session.user.id);

    return NextResponse.json({ message: 'Payment soft deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}