import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/ota/cron/monthly-reset - Automated monthly reset and report generation
export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'default-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    const currentMonth = now.toISOString().substring(0, 7); // YYYY-MM
    const year = now.getFullYear().toString();
    
    // Get the previous month for generating report
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = lastMonth.toISOString().substring(0, 7);
    const prevYear = lastMonth.getFullYear().toString();

    console.log(`Starting monthly OTA reset for ${currentMonth}, generating report for ${prevMonth}`);

    // Generate report for previous month if it doesn't exist
    const existingReport = await prisma.ota_reports.findFirst({
      where: {
        month: prevMonth,
        reportType: 'MONTHLY',
      }
    });

    let report = null;
    if (!existingReport) {
      // Generate the monthly report for previous month
      const reportData = await generateMonthlyReport(prevMonth);
      
      report = await prisma.ota_reports.create({
        data: {
          month: prevMonth,
          year: prevYear,
          reportType: 'MONTHLY',
          totalTarget: reportData.totalTarget,
          totalCollected: reportData.totalCollected,
          totalDistributed: reportData.totalDistributed,
          totalPending: reportData.totalPending,
          totalOrphans: reportData.totalOrphans,
          fullyFundedCount: reportData.fullyFundedCount,
          partialFundedCount: reportData.partialFundedCount,
          unfundedCount: reportData.unfundedCount,
          totalDonors: reportData.totalDonors,
          newDonors: reportData.newDonors,
          recurringDonors: reportData.recurringDonors,
          details: JSON.stringify(reportData.details),
          carryOverAmount: reportData.carryOverAmount,
          surplusAmount: reportData.surplusAmount,
          generatedBy: 'SYSTEM',
          status: 'FINAL',
        }
      });
    }

    // Reset monthly progress for all active programs
    const activePrograms = await prisma.ota_programs.findMany({
      where: {
        isActive: true,
      },
      include: {
        sponsors: {
          where: {
            month: prevMonth,
            isPaid: true,
          }
        }
      }
    });

    const resetOperations = [];
    let totalProgramsReset = 0;
    let totalProgramsPromoted = 0;

    for (const program of activePrograms) {
      const monthlyCollected = program.sponsors.reduce((sum, sponsor) => 
        sum + parseFloat(sponsor.amount.toString()), 0
      );
      
      const monthlyTarget = parseFloat(program.monthlyTarget.toString());
      const isFullyFunded = monthlyCollected >= monthlyTarget;
      
      // Update program for new month
      resetOperations.push(
        prisma.ota_programs.update({
          where: { id: program.id },
          data: {
            currentMonth: currentMonth,
            monthlyProgress: 0, // Reset monthly progress
            monthsCompleted: isFullyFunded ? program.monthsCompleted + 1 : program.monthsCompleted,
            lastUpdate: now,
          }
        })
      );

      totalProgramsReset++;
      if (isFullyFunded) totalProgramsPromoted++;
    }

    // Execute all reset operations
    await Promise.all(resetOperations);

    // Calculate carry-over amount for next month
    const carryOverAmount = existingReport?.surplusAmount || report?.surplusAmount || 0;

    const result = {
      success: true,
      currentMonth,
      previousMonth: prevMonth,
      reportGenerated: !existingReport,
      reportId: existingReport?.id || report?.id,
      totalProgramsReset,
      totalProgramsPromoted,
      carryOverAmount,
      timestamp: now.toISOString(),
    };

    console.log('Monthly OTA reset completed:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in monthly OTA reset:', error);
    return NextResponse.json(
      { 
        error: 'Failed to perform monthly reset',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Manual trigger for testing (GET request)
export async function GET() {
  try {
    // This is for testing purposes only - should be removed in production
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Manual trigger not available in production' },
        { status: 403 }
      );
    }

    // Create a mock request with the proper authorization
    const mockRequest = new Request('http://localhost/api/ota/cron/monthly-reset', {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${process.env.CRON_SECRET || 'default-secret'}`,
        'content-type': 'application/json'
      }
    });

    return await POST(mockRequest as NextRequest);
  } catch (error) {
    console.error('Error in manual trigger:', error);
    return NextResponse.json(
      { error: 'Failed to trigger monthly reset' },
      { status: 500 }
    );
  }
}

// Helper function to generate monthly report data
async function generateMonthlyReport(month: string) {
  const [year, monthNum] = month.split('-');
  
  // Get all active OTA programs
  const programs = await prisma.ota_programs.findMany({
    where: {
      OR: [
        { isActive: true },
        // Include programs that were active during this month
        { 
          sponsors: {
            some: {
              month: month
            }
          }
        }
      ]
    },
    include: {
      student: {
        select: {
          id: true,
          nis: true,
          fullName: true,
          institutionType: true,
          grade: true,
        }
      },
      sponsors: {
        where: {
          month: month,
        }
      }
    }
  });

  // Calculate statistics
  const totalTarget = programs.reduce((sum, program) => 
    sum + parseFloat(program.monthlyTarget.toString()), 0
  );

  const totalCollected = programs.reduce((sum, program) => {
    const paidSponsors = program.sponsors.filter(s => s.isPaid);
    return sum + paidSponsors.reduce((sponsorSum, sponsor) => 
      sponsorSum + parseFloat(sponsor.amount.toString()), 0
    );
  }, 0);

  const totalPending = programs.reduce((sum, program) => {
    const pendingSponsors = program.sponsors.filter(s => !s.isPaid);
    return sum + pendingSponsors.reduce((sponsorSum, sponsor) => 
      sponsorSum + parseFloat(sponsor.amount.toString()), 0
    );
  }, 0);

  let fullyFundedCount = 0;
  let partialFundedCount = 0;
  let unfundedCount = 0;

  // Student-level details
  const details = programs.map(program => {
    const paidAmount = program.sponsors
      .filter(s => s.isPaid)
      .reduce((sum, sponsor) => sum + parseFloat(sponsor.amount.toString()), 0);
    
    const targetAmount = parseFloat(program.monthlyTarget.toString());
    const percentage = Math.round((paidAmount / targetAmount) * 100);

    if (paidAmount >= targetAmount) {
      fullyFundedCount++;
    } else if (paidAmount > 0) {
      partialFundedCount++;
    } else {
      unfundedCount++;
    }

    return {
      programId: program.id,
      studentInitials: program.student.nis ? 
        program.student.nis.slice(-3).split('').map(n => String.fromCharCode(65 + parseInt(n) % 26)).join('.') :
        'A.B.C',
      institutionType: program.student.institutionType,
      grade: program.student.grade,
      monthlyTarget: targetAmount,
      collectedAmount: paidAmount,
      pendingAmount: program.sponsors
        .filter(s => !s.isPaid)
        .reduce((sum, sponsor) => sum + parseFloat(sponsor.amount.toString()), 0),
      donorCount: program.sponsors.filter(s => s.isPaid).length,
      completionPercentage: percentage,
      status: paidAmount >= targetAmount ? 'FULLY_FUNDED' : 
              paidAmount > 0 ? 'PARTIALLY_FUNDED' : 'UNFUNDED',
    };
  });

  // Donor statistics
  const allSponsors = programs.flatMap(p => p.sponsors.filter(s => s.isPaid));
  const uniqueDonors = new Set(allSponsors.map(s => s.donorEmail || s.donorName)).size;
  
  // Get previous month data for comparison
  const prevMonth = getPreviousMonth(month);
  const prevMonthSponsors = await prisma.ota_sponsors.findMany({
    where: {
      month: prevMonth,
      isPaid: true,
    }
  });
  
  const prevDonors = new Set(prevMonthSponsors.map(s => s.donorEmail || s.donorName));
  const newDonors = allSponsors.filter(s => !prevDonors.has(s.donorEmail || s.donorName)).length;
  const recurringDonors = allSponsors.filter(s => prevDonors.has(s.donorEmail || s.donorName)).length;

  // Get carry-over amount from previous month
  const prevReport = await prisma.ota_reports.findFirst({
    where: {
      month: prevMonth,
      reportType: 'MONTHLY',
    }
  });

  const carryOverAmount = prevReport?.surplusAmount || 0;
  const totalAvailable = totalCollected + parseFloat(carryOverAmount.toString());
  const surplusAmount = Math.max(0, totalAvailable - totalTarget);

  return {
    totalTarget,
    totalCollected,
    totalDistributed: totalCollected, // Assume all collected is distributed
    totalPending,
    totalOrphans: programs.length,
    fullyFundedCount,
    partialFundedCount,
    unfundedCount,
    totalDonors: uniqueDonors,
    newDonors,
    recurringDonors,
    carryOverAmount,
    surplusAmount,
    details,
  };
}

// Helper function to get previous month
function getPreviousMonth(month: string): string {
  const [year, monthNum] = month.split('-').map(Number);
  const prevMonth = monthNum === 1 ? 12 : monthNum - 1;
  const prevYear = monthNum === 1 ? year - 1 : year;
  return `${prevYear}-${prevMonth.toString().padStart(2, '0')}`;
}