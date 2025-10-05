import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { softDelete } from '@/lib/soft-delete';

// GET /api/ota/reports - Get OTA financial reports
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.role || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const reportType = searchParams.get('type') || 'MONTHLY';

    const skip = (page - 1) * limit;

    // Build where conditions
    const whereConditions: any = {
      reportType,
    };

    if (month) {
      whereConditions.month = month;
    }

    if (year) {
      whereConditions.year = year;
    }

    const [reports, total] = await Promise.all([
      prisma.oTAReport.findMany({
        where: whereConditions,
        orderBy: [
          { year: 'desc' },
          { month: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit,
      }),
      prisma.oTAReport.count({ where: whereConditions })
    ]);

    return NextResponse.json({
      reports,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error('Error fetching OTA reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// POST /api/ota/reports - Generate new monthly OTA report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.role || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { month, year, reportType = 'MONTHLY' } = body;

    // Validate required fields
    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      );
    }

    const reportMonth = `${year}-${month.toString().padStart(2, '0')}`;

    // Check if report already exists
    const existingReport = await prisma.oTAReport.findFirst({
      where: {
        month: reportMonth,
        reportType,
      }
    });

    if (existingReport) {
      return NextResponse.json(
        { error: 'Report for this period already exists' },
        { status: 400 }
      );
    }

    // Generate report data
    const reportData = await generateMonthlyReport(reportMonth);

    // Create the report
    const report = await prisma.oTAReport.create({
      data: {
        month: reportMonth,
        year: year.toString(),
        reportType,
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
        generatedBy: session.user.id,
        status: 'DRAFT',
      }
    });

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Error generating OTA report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

// PUT /api/ota/reports - Update report status or add distribution info
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.role || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      id, 
      status, 
      totalDistributed, 
      distributionNotes, 
      approvedBy,
      distributedBy 
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    const report = await prisma.oTAReport.findUnique({
      where: { id }
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (status !== undefined) {
      updateData.status = status;
      
      if (status === 'FINAL') {
        updateData.approvedBy = session.user.id;
        updateData.approvedAt = new Date();
      }
      
      if (status === 'DISTRIBUTED') {
        updateData.distributedBy = session.user.id;
        updateData.distributedAt = new Date();
      }
    }

    if (totalDistributed !== undefined) {
      updateData.totalDistributed = parseFloat(totalDistributed);
    }

    if (distributionNotes !== undefined) {
      updateData.distributionNotes = distributionNotes;
    }

    const updatedReport = await prisma.oTAReport.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ report: updatedReport });
  } catch (error) {
    console.error('Error updating OTA report:', error);
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    );
  }
}

// DELETE /api/ota/reports - Delete draft report
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.role || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    const report = await prisma.oTAReport.findUnique({
      where: { id }
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Only allow deletion of draft reports
    if (report.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only draft reports can be deleted' },
        { status: 400 }
      );
    }

    // Soft delete report
    await softDelete(
      prisma.oTAReport,
      { id },
      session.user.id
    );

    return NextResponse.json({
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting OTA report:', error);
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}

// Helper function to generate monthly report data
async function generateMonthlyReport(month: string) {
  const [year, monthNum] = month.split('-');
  
  // Get all active OTA programs
  const programs = await prisma.oTAProgram.findMany({
    where: {
      isActive: true,
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
  const prevMonthSponsors = await prisma.oTASponsor.findMany({
    where: {
      month: prevMonth,
      isPaid: true,
    }
  });
  
  const prevDonors = new Set(prevMonthSponsors.map(s => s.donorEmail || s.donorName));
  const newDonors = allSponsors.filter(s => !prevDonors.has(s.donorEmail || s.donorName)).length;
  const recurringDonors = allSponsors.filter(s => prevDonors.has(s.donorEmail || s.donorName)).length;

  // Get carry-over amount from previous month
  const prevReport = await prisma.oTAReport.findFirst({
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