import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// Helper function to generate billing number
async function generateBillingNumber(year: number, month: number): Promise<string> {
  const count = await prisma.sPPBilling.count({
    where: { year, month }
  });
  
  const paddedMonth = String(month).padStart(2, '0');
  const paddedNo = String(count + 1).padStart(3, '0');
  return `BILL-${year}-${paddedMonth}-${paddedNo}`;
}

// Helper function to calculate total amount
function calculateTotalAmount(data: any): {
  subtotal: Decimal;
  totalAmount: Decimal;
} {
  const sppAmount = new Decimal(data.sppAmount || 0);
  const booksFee = new Decimal(data.booksFee || 0);
  const uniformFee = new Decimal(data.uniformFee || 0);
  const activityFee = new Decimal(data.activityFee || 0);
  const examFee = new Decimal(data.examFee || 0);
  const lateFee = new Decimal(data.lateFee || 0);
  
  // Parse other fees from JSON
  let otherFeesTotal = new Decimal(0);
  if (data.otherFees) {
    const fees = typeof data.otherFees === 'string' ? JSON.parse(data.otherFees) : data.otherFees;
    fees.forEach((fee: any) => {
      otherFeesTotal = otherFeesTotal.plus(new Decimal(fee.amount || 0));
    });
  }
  
  const subtotal = sppAmount
    .plus(booksFee)
    .plus(uniformFee)
    .plus(activityFee)
    .plus(examFee)
    .plus(otherFeesTotal);
  
  // Apply discount
  let discountAmount = new Decimal(0);
  if (data.discount) {
    if (data.discountType === 'PERCENTAGE') {
      discountAmount = subtotal.mul(new Decimal(data.discount).div(100));
    } else {
      discountAmount = new Decimal(data.discount);
    }
  }
  
  const totalAmount = subtotal.minus(discountAmount).plus(lateFee);
  
  return { subtotal, totalAmount };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const classId = searchParams.get('classId');
    const semesterId = searchParams.get('semesterId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    
    const whereConditions: any = {
      isDeleted: false,
    };

    if (studentId) {
      whereConditions.studentId = studentId;
    }

    if (classId) {
      whereConditions.classId = classId;
    }

    if (semesterId) {
      whereConditions.semesterId = semesterId;
    }

    if (month) {
      whereConditions.month = parseInt(month);
    }

    if (year) {
      whereConditions.year = parseInt(year);
    }

    if (status) {
      whereConditions.status = status;
    }
    
    const skip = (page - 1) * limit;
    
    const [billings, totalCount] = await Promise.all([
      prisma.sPPBilling.findMany({
        where: whereConditions,
        skip,
        take: limit,
        include: {
          student: {
            select: {
              id: true,
              nis: true,
              fullName: true,
              institutionType: true,
              grade: true
            }
          },
          class: {
            select: {
              id: true,
              name: true,
              level: true
            }
          },
          semester: {
            select: {
              id: true,
              name: true,
              academicYear: {
                select: {
                  name: true
                }
              }
            }
          },
          payments: {
            where: { status: 'VERIFIED' },
            select: {
              amount: true,
              paymentDate: true
            }
          },
          _count: {
            select: {
              reminders: true
            }
          }
        },
        orderBy: [
          { year: 'desc' },
          { month: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.sPPBilling.count({ where: whereConditions })
    ]);
    
    // Calculate summary statistics
    const summary = await prisma.sPPBilling.aggregate({
      where: whereConditions,
      _sum: {
        totalAmount: true,
        paidAmount: true
      },
      _count: true
    });
    
    const statusCounts = await prisma.sPPBilling.groupBy({
      by: ['status'],
      where: whereConditions,
      _count: true
    });
    
    return NextResponse.json({
      billings,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1
      },
      summary: {
        totalBills: summary._count,
        totalAmount: summary._sum.totalAmount || 0,
        totalPaid: summary._sum.paidAmount || 0,
        totalOutstanding: (summary._sum.totalAmount || new Decimal(0))
          .minus(summary._sum.paidAmount || new Decimal(0)),
        statusCounts: statusCounts.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>)
      }
    });
  } catch (error) {
    console.error('Error fetching billings:', error);
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
      studentId,
      classId,
      semesterId,
      month,
      year,
      sppAmount,
      booksFee,
      uniformFee,
      activityFee,
      examFee,
      otherFees = [],
      discount = 0,
      discountType = 'FIXED',
      discountReason,
      dueDate,
      notes
    } = body;
    
    // Validate required fields
    if (!studentId || !classId || !semesterId || !month || !year || !sppAmount || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if billing already exists for this student and period
    const existing = await prisma.sPPBilling.findUnique({
      where: {
        studentId_month_year: {
          studentId,
          month: parseInt(month),
          year: parseInt(year)
        }
      }
    });
    
    if (existing) {
      return NextResponse.json(
        { error: 'Billing already exists for this student and period' },
        { status: 409 }
      );
    }
    
    // Generate billing number
    const billNo = await generateBillingNumber(parseInt(year), parseInt(month));
    
    // Calculate totals
    const { subtotal, totalAmount } = calculateTotalAmount({
      sppAmount,
      booksFee,
      uniformFee,
      activityFee,
      examFee,
      otherFees,
      discount,
      discountType,
      lateFee: 0
    });
    
    // Create billing
    const billing = await prisma.sPPBilling.create({
      data: {
        billNo,
        studentId,
        classId,
        semesterId,
        month: parseInt(month),
        year: parseInt(year),
        sppAmount: new Decimal(sppAmount),
        booksFee: booksFee ? new Decimal(booksFee) : null,
        uniformFee: uniformFee ? new Decimal(uniformFee) : null,
        activityFee: activityFee ? new Decimal(activityFee) : null,
        examFee: examFee ? new Decimal(examFee) : null,
        otherFees: JSON.stringify(otherFees),
        subtotal,
        discount: new Decimal(discount),
        discountType,
        discountReason,
        totalAmount,
        dueDate: new Date(dueDate),
        notes,
        generatedBy: session.user.id
      },
      include: {
        student: {
          select: {
            id: true,
            nis: true,
            fullName: true
          }
        }
      }
    });
    
    return NextResponse.json(billing, { status: 201 });
  } catch (error) {
    console.error('Error creating billing:', error);
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
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Billing ID is required' },
        { status: 400 }
      );
    }
    
    // Check if billing exists
    const existing = await prisma.sPPBilling.findUnique({
      where: { id }
    });
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Billing not found' },
        { status: 404 }
      );
    }
    
    // Don't allow editing if already paid
    if (existing.status === 'PAID') {
      return NextResponse.json(
        { error: 'Cannot edit paid billing' },
        { status: 400 }
      );
    }
    
    // Recalculate totals if amounts changed
    if (updateData.sppAmount !== undefined || updateData.discount !== undefined) {
      const { subtotal, totalAmount } = calculateTotalAmount({
        ...existing,
        ...updateData
      });
      updateData.subtotal = subtotal;
      updateData.totalAmount = totalAmount;
    }
    
    // Convert string dates to Date objects
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    }
    
    // Update billing
    const billing = await prisma.sPPBilling.update({
      where: { id },
      data: updateData,
      include: {
        student: {
          select: {
            id: true,
            nis: true,
            fullName: true
          }
        }
      }
    });
    
    return NextResponse.json(billing);
  } catch (error) {
    console.error('Error updating billing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Batch generate billings for a class/month
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const {
      classId,
      semesterId,
      month,
      year,
      dueDate
    } = body;
    
    if (!classId || !semesterId || !month || !year || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get all active students in the class
    const studentClasses = await prisma.studentClass.findMany({
      where: {
        classId,
        status: 'ACTIVE'
      },
      include: {
        student: {
          select: {
            id: true,
            institutionType: true
          }
        }
      }
    });
    
    // Get SPP settings for the class level
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      select: { level: true }
    });
    
    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      );
    }
    
    const sppSettings = await prisma.sPPSettings.findUnique({
      where: { level: classData.level }
    });
    
    if (!sppSettings) {
      return NextResponse.json(
        { error: 'SPP settings not found for this level' },
        { status: 404 }
      );
    }
    
    const createdBillings = [];
    const errors = [];
    
    for (const sc of studentClasses) {
      try {
        // Check if billing already exists
        const existing = await prisma.sPPBilling.findUnique({
          where: {
            studentId_month_year: {
              studentId: sc.studentId,
              month: parseInt(month),
              year: parseInt(year)
            }
          }
        });
        
        if (existing) {
          errors.push({
            studentId: sc.studentId,
            error: 'Billing already exists'
          });
          continue;
        }
        
        // Generate billing number
        const billNo = await generateBillingNumber(parseInt(year), parseInt(month));
        
        // Calculate totals
        const { subtotal, totalAmount } = calculateTotalAmount({
          sppAmount: sppSettings.monthlyFee,
          booksFee: sppSettings.booksFee,
          activityFee: sppSettings.activityFee,
          discount: 0,
          discountType: 'FIXED',
          lateFee: 0
        });
        
        // Create billing
        const billing = await prisma.sPPBilling.create({
          data: {
            billNo,
            studentId: sc.studentId,
            classId,
            semesterId,
            month: parseInt(month),
            year: parseInt(year),
            sppAmount: sppSettings.monthlyFee,
            booksFee: sppSettings.booksFee,
            activityFee: sppSettings.activityFee,
            subtotal,
            totalAmount,
            dueDate: new Date(dueDate),
            generatedBy: session.user.id
          }
        });
        
        createdBillings.push(billing);
      } catch (error) {
        errors.push({
          studentId: sc.studentId,
          error: 'Failed to create billing'
        });
      }
    }
    
    return NextResponse.json({
      created: createdBillings.length,
      errors: errors.length,
      details: {
        createdBillings,
        errors
      }
    });
  } catch (error) {
    console.error('Error batch creating billings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}