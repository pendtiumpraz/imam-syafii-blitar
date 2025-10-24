import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const generateBillsSchema = z.object({
  billTypeId: z.string().min(1, 'Bill type is required'),
  period: z.string().min(1, 'Period is required'), // Format: "2024-12" or "2024-Q1"
  dueDate: z.string().min(1, 'Due date is required'),
  studentIds: z.array(z.string()).optional(), // If not provided, generate for all active students
  institutionTypes: z.array(z.enum(['TK', 'SD', 'PONDOK'])).optional(),
  grades: z.array(z.string()).optional(),
  applyDiscounts: z.boolean().default(true),
  notes: z.string().optional(),
});

// Helper function to generate bill number
async function generateBillNumber(prisma: any, period: string): Promise<string> {
  const [year, monthOrQuarter] = period.split('-');
  const prefix = `BILL-${year}-${monthOrQuarter}`;
  
  const lastBill = await prisma.bills.findFirst({
    where: {
      billNo: {
        startsWith: prefix,
      },
    },
    orderBy: {
      billNo: 'desc',
    },
  });

  let sequence = 1;
  if (lastBill) {
    const lastSequence = parseInt(lastBill.billNo.split('-').pop() || '0');
    sequence = lastSequence + 1;
  }

  return `${prefix}-${sequence.toString().padStart(4, '0')}`;
}

// Helper function to calculate sibling discount
async function calculateSiblingDiscount(
  prisma: any,
  studentId: string,
  amount: number,
  discountPercent: number
): Promise<{ discount: number; siblingCount: number }> {
  // Find siblings (students with same parent phone numbers)
  const student = await prisma.students.findUnique({
    where: { id: studentId },
    select: {
      fatherPhone: true,
      motherPhone: true,
      institutionType: true,
      status: true,
    },
  });

  if (!student || (!student.fatherPhone && !student.motherPhone)) {
    return { discount: 0, siblingCount: 0 };
  }

  const siblingWhere: any = {
    id: { not: studentId },
    status: 'ACTIVE',
    OR: [],
  };

  if (student.fatherPhone) {
    siblingWhere.OR.push({ fatherPhone: student.fatherPhone });
  }
  if (student.motherPhone) {
    siblingWhere.OR.push({ motherPhone: student.motherPhone });
  }

  const siblingCount = await prisma.students.count({
    where: siblingWhere,
  });

  // Apply discount only if there are siblings
  if (siblingCount > 0) {
    const discount = (amount * discountPercent) / 100;
    return { discount, siblingCount };
  }

  return { discount: 0, siblingCount: 0 };
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
    if (!session.user?.role || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validated = generateBillsSchema.parse(body);

    // Get bill type
    const billType = await prisma.bill_types.findUnique({
      where: { id: validated.billTypeId },
    });

    if (!billType || !billType.isActive) {
      return NextResponse.json(
        { error: 'Bill type not found or inactive' },
        { status: 404 }
      );
    }

    // Parse price by grade
    const priceByGrade = JSON.parse(billType.priceByGrade || '{}');

    // Build student query
    let studentWhere: any = {
      status: 'ACTIVE',
    };

    if (validated.studentIds && validated.studentIds.length > 0) {
      studentWhere.id = { in: validated.studentIds };
    }

    if (validated.institutionTypes && validated.institutionTypes.length > 0) {
      studentWhere.institutionType = { in: validated.institutionTypes };
    }

    if (validated.grades && validated.grades.length > 0) {
      studentWhere.grade = { in: validated.grades };
    }

    // Get students
    const students = await prisma.students.findMany({
      where: studentWhere,
      select: {
        id: true,
        fullName: true,
        nis: true,
        institutionType: true,
        grade: true,
        fatherPhone: true,
        motherPhone: true,
      },
    });

    if (students.length === 0) {
      return NextResponse.json(
        { error: 'No students found matching criteria' },
        { status: 400 }
      );
    }

    // Check for existing bills for this period
    const existingBills = await prisma.bills.findMany({
      where: {
        billTypeId: validated.billTypeId,
        period: validated.period,
        studentId: { in: students.map(s => s.id) },
      },
      select: { studentId: true },
    });

    const existingStudentIds = new Set(existingBills.map(b => b.studentId));
    const studentsToProcess = students.filter(s => !existingStudentIds.has(s.id));

    if (studentsToProcess.length === 0) {
      return NextResponse.json(
        { error: 'Bills already exist for all selected students in this period' },
        { status: 400 }
      );
    }

    // Generate bills
    const billsToCreate: any[] = [];
    const billsMetadata: any[] = [];

    for (const student of studentsToProcess) {
      // Determine amount based on grade or default
      let amount = Number(billType.defaultAmount) || 0;
      if (student.grade && priceByGrade[student.grade]) {
        amount = Number(priceByGrade[student.grade]);
      } else if (priceByGrade[student.institutionType]) {
        amount = Number(priceByGrade[student.institutionType]);
      }

      if (amount <= 0) {
        continue; // Skip if no amount defined
      }

      const originalAmount = amount;
      const discounts = [];
      let totalDiscount = 0;

      // Apply sibling discount if enabled
      if (validated.applyDiscounts && billType.allowSiblingDiscount && Number(billType.siblingDiscountPercent) > 0) {
        const { discount, siblingCount } = await calculateSiblingDiscount(
          prisma,
          student.id,
          amount,
          Number(billType.siblingDiscountPercent)
        );
        
        if (discount > 0) {
          discounts.push({
            type: 'SIBLING_DISCOUNT',
            description: `Sibling discount (${siblingCount} siblings)`,
            amount: discount,
            percentage: billType.siblingDiscountPercent,
          });
          totalDiscount += discount;
        }
      }

      const finalAmount = amount - totalDiscount;
      const billNo = await generateBillNumber(prisma, validated.period);

      billsToCreate.push({
        billNo,
        studentId: student.id,
        billTypeId: validated.billTypeId,
        amount: finalAmount,
        originalAmount,
        period: validated.period,
        dueDate: new Date(validated.dueDate),
        discounts: JSON.stringify(discounts),
        totalDiscount,
        remainingAmount: finalAmount,
        generatedBy: session.user.id,
        notes: validated.notes,
      });

      billsMetadata.push({
        studentName: student.fullName,
        nis: student.nis,
        institutionType: student.institutionType,
        grade: student.grade,
        originalAmount,
        finalAmount,
        totalDiscount,
        discounts,
      });
    }

    // Create bills in transaction
    const createdBills = await prisma.$transaction(async (tx: any) => {
      const bills = [];
      for (const billData of billsToCreate) {
        const bill = await tx.bills.create({
          data: billData,
          include: {
            students: {
              select: {
                fullName: true,
                nis: true,
                institutionType: true,
                grade: true,
              },
            },
            bill_types: {
              select: {
                name: true,
                category: true,
              },
            },
          },
        });

        // Create payment history entry
        await tx.payment_history.create({
          data: {
            billId: bill.id,
            studentId: bill.studentId,
            action: 'BILL_GENERATED',
            description: `Bill generated for ${bill.bill_types.name} - ${validated.period}`,
            newAmount: bill.amount,
            performedBy: session.user.id,
            metadata: JSON.stringify({
              period: validated.period,
              billType: bill.bill_types.name,
              originalAmount: bill.originalAmount,
              discountsApplied: bill.totalDiscount > 0,
            }),
          },
        });

        bills.push(bill);
      }
      return bills;
    });

    return NextResponse.json({
      message: `Successfully generated ${createdBills.length} bills`,
      data: {
        billsGenerated: createdBills.length,
        totalStudents: students.length,
        existingBills: existingStudentIds.size,
        skippedStudents: students.length - studentsToProcess.length,
        bills: createdBills.map(bill => ({
          id: bill.id,
          billNo: bill.billNo,
          studentName: bill.students.fullName,
          amount: bill.amount,
          dueDate: bill.dueDate,
        })),
        summary: {
          totalAmount: createdBills.reduce((sum, bill) => sum + Number(bill.amount), 0),
          totalDiscount: createdBills.reduce((sum, bill) => sum + Number(bill.totalDiscount), 0),
          averageAmount: createdBills.length > 0 
            ? createdBills.reduce((sum, bill) => sum + Number(bill.amount), 0) / createdBills.length 
            : 0,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error generating bills:', error);
    return NextResponse.json(
      { error: 'Failed to generate bills' },
      { status: 500 }
    );
  }
}