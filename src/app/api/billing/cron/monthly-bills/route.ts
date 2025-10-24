import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { default: prisma } = await import('@/lib/prisma');
    
    // Verify cron authentication
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const period = `${year}-${month}`;
    
    // Get the first day of next month as due date (15 days grace period)
    const dueDate = new Date(year, currentDate.getMonth() + 1, 15);

    // Get all active recurring bill types
    const recurringBillTypes = await prisma.bill_types.findMany({
      where: {
        isActive: true,
        isRecurring: true,
        frequency: 'MONTHLY',
      },
    });

    if (recurringBillTypes.length === 0) {
      return NextResponse.json({ 
        message: 'No recurring monthly bill types found',
        billsGenerated: 0,
      });
    }

    let totalBillsGenerated = 0;
    const generationResults = [];

    for (const billType of recurringBillTypes) {
      try {
        // Check if bills for this period already exist
        const existingBills = await prisma.bills.count({
          where: {
            billTypeId: billType.id,
            period: period,
          },
        });

        if (existingBills > 0) {
          console.log(`Bills already exist for ${billType.name} in period ${period}`);
          continue;
        }

        // Get all active students
        const students = await prisma.students.findMany({
          where: {
            status: 'ACTIVE',
          },
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
          continue;
        }

        // Parse price by grade
        const priceByGrade = JSON.parse(billType.priceByGrade || '{}');
        const billsToCreate = [];

        for (const student of students) {
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
          if (billType.allowSiblingDiscount && Number(billType.siblingDiscountPercent) > 0) {
            // Find siblings (students with same parent phone numbers)
            if (student.fatherPhone || student.motherPhone) {
              const siblingWhere: any = {
                id: { not: student.id },
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

              // Apply discount if there are siblings
              if (siblingCount > 0) {
                const discount = (amount * Number(billType.siblingDiscountPercent)) / 100;
                discounts.push({
                  type: 'SIBLING_DISCOUNT',
                  description: `Sibling discount (${siblingCount} siblings)`,
                  amount: discount,
                  percentage: billType.siblingDiscountPercent,
                });
                totalDiscount += discount;
              }
            }
          }

          const finalAmount = amount - totalDiscount;
          
          // Generate bill number
          const billNo = await generateBillNumber(prisma, period, billType.name);

          billsToCreate.push({
            billNo,
            studentId: student.id,
            billTypeId: billType.id,
            amount: finalAmount,
            originalAmount,
            period,
            dueDate,
            discounts: JSON.stringify(discounts),
            totalDiscount,
            remainingAmount: finalAmount,
            notes: `Auto-generated monthly bill for ${period}`,
          });
        }

        // Create bills in batches
        const batchSize = 100;
        let createdCount = 0;

        for (let i = 0; i < billsToCreate.length; i += batchSize) {
          const batch = billsToCreate.slice(i, i + batchSize);
          
          const createdBills = await prisma.bills.createMany({
            data: batch,
          });

          createdCount += createdBills.count;

          // Create payment history entries for the batch
          const historyEntries = batch.map(bill => ({
            billId: '', // Will be filled after bills are created
            studentId: bill.studentId,
            action: 'BILL_GENERATED',
            description: `Auto-generated bill for ${billType.name} - ${period}`,
            newAmount: bill.amount,
            metadata: JSON.stringify({
              period,
              billType: billType.name,
              autoGenerated: true,
              originalAmount: bill.originalAmount,
              discountsApplied: bill.totalDiscount > 0,
            }),
          }));

          // Get the created bills to get their IDs for history entries
          const createdBillsWithIds = await prisma.bills.findMany({
            where: {
              billTypeId: billType.id,
              period,
              studentId: { in: batch.map(b => b.studentId) },
            },
            select: {
              id: true,
              studentId: true,
            },
          });

          // Create history entries with correct bill IDs
          const historyEntriesWithBillIds = historyEntries.map(entry => {
            const bill = createdBillsWithIds.find(b => b.studentId === entry.studentId);
            return {
              ...entry,
              billId: bill?.id || '',
            };
          }).filter(entry => entry.billId); // Only include entries with valid bill IDs

          if (historyEntriesWithBillIds.length > 0) {
            await prisma.payment_history.createMany({
              data: historyEntriesWithBillIds,
            });
          }
        }

        totalBillsGenerated += createdCount;
        generationResults.push({
          billType: billType.name,
          billsGenerated: createdCount,
          totalStudents: students.length,
        });

        console.log(`Generated ${createdCount} bills for ${billType.name} in period ${period}`);

      } catch (error) {
        console.error(`Error generating bills for ${billType.name}:`, error);
        generationResults.push({
          billType: billType.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      message: `Monthly bill generation completed`,
      period,
      totalBillsGenerated,
      results: generationResults,
    });

  } catch (error) {
    console.error('Error in monthly bill generation cron:', error);
    return NextResponse.json(
      { error: 'Failed to generate monthly bills' },
      { status: 500 }
    );
  }
}

// Helper function to generate bill number
async function generateBillNumber(prisma: any, period: string, billTypeName: string): Promise<string> {
  const [year, month] = period.split('-');
  const billTypeCode = billTypeName.substring(0, 3).toUpperCase();
  const prefix = `${billTypeCode}-${year}${month}`;
  
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