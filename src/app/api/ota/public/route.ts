import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/ota/public - Get public OTA programs for donation page
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const institution = searchParams.get('institution') || 'all';

    const skip = (page - 1) * limit;

    // Build where conditions for public display
    const whereConditions: any = {
      isActive: true,
      showProgress: true,
      student: {
        isOrphan: true,
        status: 'ACTIVE',
      },
    };

    if (institution !== 'all') {
      whereConditions.student.institutionType = institution;
    }

    const [programs, total, overallStats] = await Promise.all([
      // Get active OTA programs with anonymized student info
      prisma.ota_programs.findMany({
        where: whereConditions,
        include: {
          student: {
            select: {
              id: true,
              nis: true, // We'll mask this
              institutionType: true,
              grade: true,
              otaProfile: true,
              photo: true,
              achievements: true,
              hafalan_progress: {
                select: {
                  totalSurah: true,
                  totalAyat: true,
                  totalJuz: true,
                  level: true,
                }
              }
            }
          },
          sponsors: {
            where: {
              month: new Date().toISOString().substring(0, 7), // Current month
              isPaid: true,
              allowPublicDisplay: true,
            },
            select: {
              publicName: true,
              amount: true,
              createdAt: true,
              donorMessage: true,
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 5, // Show latest 5 donors per student
          },
          _count: {
            select: {
              sponsors: {
                where: {
                  isPaid: true,
                }
              }
            }
          }
        },
        orderBy: [
          { displayOrder: 'asc' },
          { monthlyProgress: 'asc' }, // Show students who need more help first
          { createdAt: 'desc' }
        ],
        skip,
        take: limit,
      }),
      // Get total count
      prisma.ota_programs.count({ where: whereConditions }),
      // Get overall program statistics
      prisma.ota_programs.aggregate({
        where: { isActive: true },
        _sum: {
          monthlyTarget: true,
          totalCollected: true,
          monthlyProgress: true,
        },
        _count: true,
      })
    ]);

    // Anonymize student data for public consumption
    const anonymizedPrograms = programs.map(program => ({
      id: program.id,
      monthlyTarget: program.monthlyTarget,
      currentMonth: program.currentMonth,
      monthlyProgress: program.monthlyProgress,
      totalCollected: program.totalCollected,
      monthsCompleted: program.monthsCompleted,
      programStart: program.programStart,
      progressPercentage: Math.round((parseFloat(program.monthlyProgress.toString()) / parseFloat(program.monthlyTarget.toString())) * 100),
      student: {
        // Anonymize student info
        initials: anonymizeFullName(program.student.nis || `Student-${program.id.slice(-4)}`),
        institutionType: program.student.institutionType,
        grade: program.student.grade,
        otaProfile: program.student.otaProfile || 'Bantuan untuk siswa yatim berprestasi',
        photo: program.student.photo ? maskPhotoUrl(program.student.photo) : null,
        achievements: program.student.achievements ? JSON.parse(program.student.achievements).slice(0, 3) : [],
        hafalan_progress: program.student.hafalanProgress ? {
          totalSurah: program.student.hafalanProgress.totalSurah,
          totalAyat: program.student.hafalanProgress.totalAyat,
          totalJuz: program.student.hafalanProgress.totalJuz,
          level: program.student.hafalanProgress.level,
        } : null,
      },
      sponsors: program.sponsors,
      donorCount: program._count.sponsors,
    }));

    return NextResponse.json({
      programs: anonymizedPrograms,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
      statistics: {
        totalPrograms: overallStats._count,
        totalTargetMonthly: overallStats._sum.monthlyTarget || 0,
        totalCollectedAllTime: overallStats._sum.totalCollected || 0,
        totalCollectedThisMonth: overallStats._sum.monthlyProgress || 0,
        averageCompletion: overallStats._count > 0 
          ? Math.round((parseFloat((overallStats._sum.monthlyProgress || 0).toString()) / parseFloat((overallStats._sum.monthlyTarget || 1).toString())) * 100)
          : 0,
      }
    });
  } catch (error) {
    console.error('Error fetching public OTA programs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch OTA programs' },
      { status: 500 }
    );
  }
}

// POST /api/ota/public - Submit donation from public
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      programId,
      donorName,
      donorEmail,
      donorPhone,
      amount,
      donorMessage,
      isAnonymous,
      paymentMethod,
    } = body;

    // Validate required fields
    if (!programId || !donorName || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Program ID, donor name, amount, and payment method are required' },
        { status: 400 }
      );
    }

    // Validate amount
    const donationAmount = parseFloat(amount);
    if (isNaN(donationAmount) || donationAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid donation amount' },
        { status: 400 }
      );
    }

    // Check minimum donation amount
    if (donationAmount < 10000) {
      return NextResponse.json(
        { error: 'Minimum donation amount is Rp 10,000' },
        { status: 400 }
      );
    }

    // Check if program exists and is active
    const program = await prisma.ota_programs.findUnique({
      where: { id: programId },
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
    });

    if (!program) {
      return NextResponse.json(
        { error: 'OTA program not found' },
        { status: 404 }
      );
    }

    if (!program.isActive) {
      return NextResponse.json(
        { error: 'This OTA program is currently not accepting donations' },
        { status: 400 }
      );
    }

    const currentMonth = new Date().toISOString().substring(0, 7);

    // Create sponsor donation (pending verification)
    const sponsor = await prisma.ota_sponsors.create({
      data: {
        programId,
        donorName: isAnonymous ? 'Anonim' : donorName,
        donorEmail: donorEmail || null,
        donorPhone: donorPhone || null,
        publicName: isAnonymous ? 'Anonim' : 'Hamba Allah',
        amount: donationAmount,
        month: currentMonth,
        paymentMethod,
        donorMessage: donorMessage || null,
        allowPublicDisplay: !isAnonymous,
        allowContact: false,
        // Public donations start as pending
        isPaid: false,
        paymentStatus: 'PENDING',
        donationType: isAnonymous ? 'ANONYMOUS' : 'REGULAR',
      },
      include: {
        program: {
          include: {
            student: {
              select: {
                institutionType: true,
                grade: true,
                otaProfile: true,
              }
            }
          }
        }
      }
    });

    // Generate donation ID for reference
    const donationRef = `OTA-${currentMonth.replace('-', '')}-${sponsor.id.slice(-6).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      donationId: sponsor.id,
      donationRef,
      program: {
        studentInitials: anonymizeFullName(program.student.nis || `Student-${program.id.slice(-4)}`),
        institutionType: program.student.institutionType,
        grade: program.student.grade,
        monthlyTarget: program.monthlyTarget,
      },
      donation: {
        amount: donationAmount,
        month: currentMonth,
        paymentMethod,
        status: 'PENDING',
      },
      message: 'Terima kasih atas donasi Anda! Silakan lakukan pembayaran dan kirim bukti transfer untuk verifikasi.',
    });
  } catch (error) {
    console.error('Error creating public donation:', error);
    return NextResponse.json(
      { error: 'Failed to process donation' },
      { status: 500 }
    );
  }
}

// Helper functions
function anonymizeFullName(identifier: string): string {
  // Convert NIS or identifier to initials format like "A.B.C"
  if (identifier.includes('-')) {
    // If it's a generated ID, create initials from it
    return identifier.split('-')[1]?.slice(0, 3).split('').join('.') || 'A.B.C';
  }
  
  // If it's NIS, use last few digits to create initials
  const numbers = identifier.replace(/\D/g, '');
  if (numbers.length >= 3) {
    const lastThree = numbers.slice(-3);
    const letters = lastThree.split('').map(n => String.fromCharCode(65 + parseInt(n) % 26));
    return letters.join('.');
  }
  
  return 'A.B.C';
}

function maskPhotoUrl(photoUrl: string): string | null {
  // For privacy, we don't show actual photos in public
  // Instead return a generic placeholder or null
  return null;
}