import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { softDelete } from '@/lib/soft-delete';

// GET /api/ota/sponsors - Get sponsors for admin management
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const programId = searchParams.get('programId');
    const month = searchParams.get('month') || new Date().toISOString().substring(0, 7);
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build where conditions
    const whereConditions: any = {};

    if (programId) {
      whereConditions.programId = programId;
    }

    if (month) {
      whereConditions.month = month;
    }

    if (status === 'paid') {
      whereConditions.isPaid = true;
    } else if (status === 'pending') {
      whereConditions.isPaid = false;
    } else if (status === 'verified') {
      whereConditions.paymentStatus = 'VERIFIED';
    }

    if (search) {
      whereConditions.OR = [
        {
          donorName: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          donorEmail: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          program: {
            student: {
              fullName: {
                contains: search,
                mode: 'insensitive'
              }
            }
          }
        }
      ];
    }

    const [sponsors, total] = await Promise.all([
      prisma.oTASponsor.findMany({
        where: whereConditions,
        include: {
          program: {
            include: {
              student: {
                select: {
                  id: true,
                  nis: true,
                  fullName: true,
                  institutionType: true,
                  grade: true,
                }
              }
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        ],
        skip,
        take: limit,
      }),
      prisma.oTASponsor.count({ where: whereConditions })
    ]);

    return NextResponse.json({
      sponsors,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error('Error fetching OTA sponsors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sponsors' },
      { status: 500 }
    );
  }
}

// POST /api/ota/sponsors - Add new sponsor donation
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
    const {
      programId,
      donorName,
      donorEmail,
      donorPhone,
      amount,
      month,
      paymentMethod,
      donorMessage,
      isRecurring,
      donationType,
      allowPublicDisplay,
      allowContact
    } = body;

    // Validate required fields
    if (!programId || !donorName || !amount) {
      return NextResponse.json(
        { error: 'Program ID, donor name, and amount are required' },
        { status: 400 }
      );
    }

    // Check if program exists
    const program = await prisma.oTAProgram.findUnique({
      where: { id: programId },
      include: { student: true }
    });

    if (!program) {
      return NextResponse.json(
        { error: 'OTA program not found' },
        { status: 404 }
      );
    }

    if (!program.isActive) {
      return NextResponse.json(
        { error: 'OTA program is not active' },
        { status: 400 }
      );
    }

    const donationMonth = month || new Date().toISOString().substring(0, 7);

    // Create sponsor donation
    const sponsor = await prisma.oTASponsor.create({
      data: {
        programId,
        donorName,
        donorEmail: donorEmail || null,
        donorPhone: donorPhone || null,
        publicName: allowPublicDisplay ? "Hamba Allah" : "Anonim",
        amount: parseFloat(amount),
        month: donationMonth,
        paymentMethod: paymentMethod || null,
        donorMessage: donorMessage || null,
        isRecurring: isRecurring || false,
        donationType: donationType || 'REGULAR',
        allowPublicDisplay: allowPublicDisplay !== false,
        allowContact: allowContact || false,
        // For manual admin entry, mark as paid by default
        isPaid: true,
        paymentStatus: 'VERIFIED',
        verifiedBy: session.user.id,
        verifiedAt: new Date(),
        paymentDate: new Date(),
      },
      include: {
        program: {
          include: {
            student: {
              select: {
                id: true,
                nis: true,
                fullName: true,
                institutionType: true,
                grade: true,
              }
            }
          }
        }
      }
    });

    // Update program progress
    await updateProgramProgress(programId, donationMonth);

    return NextResponse.json({ sponsor });
  } catch (error) {
    console.error('Error creating sponsor:', error);
    return NextResponse.json(
      { error: 'Failed to create sponsor donation' },
      { status: 500 }
    );
  }
}

// PUT /api/ota/sponsors - Update sponsor donation
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
      isPaid, 
      paymentStatus, 
      paymentMethod, 
      adminNotes,
      verifyPayment 
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Sponsor ID is required' },
        { status: 400 }
      );
    }

    const sponsor = await prisma.oTASponsor.findUnique({
      where: { id },
      include: { program: true }
    });

    if (!sponsor) {
      return NextResponse.json(
        { error: 'Sponsor not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (isPaid !== undefined) {
      updateData.isPaid = isPaid;
      if (isPaid) {
        updateData.paymentDate = new Date();
      }
    }

    if (paymentStatus !== undefined) {
      updateData.paymentStatus = paymentStatus;
    }

    if (paymentMethod !== undefined) {
      updateData.paymentMethod = paymentMethod;
    }

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    if (verifyPayment) {
      updateData.isPaid = true;
      updateData.paymentStatus = 'VERIFIED';
      updateData.verifiedBy = session.user.id;
      updateData.verifiedAt = new Date();
      updateData.paymentDate = new Date();
    }

    const updatedSponsor = await prisma.oTASponsor.update({
      where: { id },
      data: updateData,
      include: {
        program: {
          include: {
            student: {
              select: {
                id: true,
                nis: true,
                fullName: true,
                institutionType: true,
                grade: true,
              }
            }
          }
        }
      }
    });

    // Update program progress if payment status changed
    if (isPaid !== undefined || verifyPayment) {
      await updateProgramProgress(sponsor.programId, sponsor.month);
    }

    return NextResponse.json({ sponsor: updatedSponsor });
  } catch (error) {
    console.error('Error updating sponsor:', error);
    return NextResponse.json(
      { error: 'Failed to update sponsor' },
      { status: 500 }
    );
  }
}

// DELETE /api/ota/sponsors - Delete sponsor donation
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
        { error: 'Sponsor ID is required' },
        { status: 400 }
      );
    }

    const sponsor = await prisma.oTASponsor.findUnique({
      where: { id },
      include: { program: true }
    });

    if (!sponsor) {
      return NextResponse.json(
        { error: 'Sponsor not found' },
        { status: 404 }
      );
    }

    // Don't allow deletion of verified payments
    if (sponsor.isPaid && sponsor.paymentStatus === 'VERIFIED') {
      return NextResponse.json(
        { error: 'Cannot delete verified payments. Please mark as refunded instead.' },
        { status: 400 }
      );
    }

    const programId = sponsor.programId;
    const month = sponsor.month;

    // Soft delete sponsor
    await softDelete(
      prisma.oTASponsor,
      { id },
      session.user.id
    );

    // Update program progress
    await updateProgramProgress(programId, month);

    return NextResponse.json({
      message: 'Sponsor donation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sponsor:', error);
    return NextResponse.json(
      { error: 'Failed to delete sponsor' },
      { status: 500 }
    );
  }
}

// Helper function to update program progress
async function updateProgramProgress(programId: string, month: string) {
  const [paidSponsors, program] = await Promise.all([
    prisma.oTASponsor.findMany({
      where: {
        programId,
        month,
        isPaid: true,
      }
    }),
    prisma.oTAProgram.findUnique({
      where: { id: programId }
    })
  ]);

  if (!program) return;

  const monthlyCollected = paidSponsors.reduce((sum, sponsor) => 
    sum + parseFloat(sponsor.amount.toString()), 0
  );

  const totalCollected = await prisma.oTASponsor.aggregate({
    where: {
      programId,
      isPaid: true,
    },
    _sum: {
      amount: true,
    }
  });

  // Update program with new totals
  await prisma.oTAProgram.update({
    where: { id: programId },
    data: {
      monthlyProgress: monthlyCollected,
      totalCollected: totalCollected._sum.amount || 0,
      lastUpdate: new Date(),
      // If this month's target is met, increment months completed
      monthsCompleted: monthlyCollected >= parseFloat(program.monthlyTarget.toString()) 
        ? program.monthsCompleted + (month === program.currentMonth ? 1 : 0)
        : program.monthsCompleted,
      // Move to next month if current month target is met
      currentMonth: monthlyCollected >= parseFloat(program.monthlyTarget.toString()) && month === program.currentMonth
        ? getNextMonth(month)
        : program.currentMonth,
    }
  });
}

// Helper function to get next month
function getNextMonth(currentMonth: string): string {
  const [year, month] = currentMonth.split('-').map(Number);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${nextYear}-${nextMonth.toString().padStart(2, '0')}`;
}