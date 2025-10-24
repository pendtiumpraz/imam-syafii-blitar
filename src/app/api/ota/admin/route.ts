import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { softDelete } from '@/lib/soft-delete';

// GET /api/ota/admin - Get all OTA programs with student details
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
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const institution = searchParams.get('institution') || 'all';

    const skip = (page - 1) * limit;

    // Build where conditions
    const whereConditions: any = {
      student: {
        isOrphan: true,
      },
    };

    if (status === 'active') {
      whereConditions.isActive = true;
    } else if (status === 'inactive') {
      whereConditions.isActive = false;
    }

    if (institution !== 'all') {
      whereConditions.student.institutionType = institution;
    }

    if (search) {
      whereConditions.OR = [
        {
          student: {
            fullName: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          student: {
            nis: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ];
    }

    const [programs, total] = await Promise.all([
      prisma.ota_programs.findMany({
        where: whereConditions,
        include: {
          student: {
            select: {
              id: true,
              nis: true,
              fullName: true,
              institutionType: true,
              grade: true,
              monthlyNeeds: true,
              otaProfile: true,
              status: true,
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
              month: {
                equals: new Date().toISOString().substring(0, 7) // Current month YYYY-MM
              }
            },
            select: {
              id: true,
              donorName: true,
              amount: true,
              isPaid: true,
              paymentStatus: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              sponsors: true
            }
          }
        },
        orderBy: [
          { displayOrder: 'asc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit,
      }),
      prisma.ota_programs.count({ where: whereConditions })
    ]);

    return NextResponse.json({
      programs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error('Error fetching OTA programs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch OTA programs' },
      { status: 500 }
    );
  }
}

// POST /api/ota/admin - Create new OTA program for a student
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
    const { studentId, monthlyTarget, otaProfile, displayOrder } = body;

    // Validate required fields
    if (!studentId || !monthlyTarget) {
      return NextResponse.json(
        { error: 'Student ID and monthly target are required' },
        { status: 400 }
      );
    }

    // Check if student exists and is an orphan
    const student = await prisma.students.findUnique({
      where: { id: studentId },
      include: { ota_program: true }
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    if (!student.isOrphan) {
      return NextResponse.json(
        { error: 'Student must be marked as orphan to join OTA program' },
        { status: 400 }
      );
    }

    if (student.otaProgram) {
      return NextResponse.json(
        { error: 'Student already has an active OTA program' },
        { status: 400 }
      );
    }

    // Create OTA program and update student profile
    const currentMonth = new Date().toISOString().substring(0, 7);
    
    const [program] = await Promise.all([
      prisma.ota_programs.create({
        data: {
          studentId,
          monthlyTarget: parseFloat(monthlyTarget),
          currentMonth,
          displayOrder: displayOrder || 0,
        },
        include: {
          student: {
            select: {
              id: true,
              nis: true,
              fullName: true,
              institutionType: true,
              grade: true,
              monthlyNeeds: true,
              otaProfile: true,
              status: true,
            }
          }
        }
      }),
      // Update student with OTA profile and monthly needs
      prisma.students.update({
        where: { id: studentId },
        data: {
          otaProfile: otaProfile || `Bantuan untuk ${student.fullName.split(' ')[0]} - siswa yatim yang berprestasi`,
          monthlyNeeds: parseFloat(monthlyTarget),
        }
      })
    ]);

    return NextResponse.json({ program });
  } catch (error) {
    console.error('Error creating OTA program:', error);
    return NextResponse.json(
      { error: 'Failed to create OTA program' },
      { status: 500 }
    );
  }
}

// PUT /api/ota/admin - Update OTA program
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
    const { id, monthlyTarget, displayOrder, isActive, adminNotes, otaProfile } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Program ID is required' },
        { status: 400 }
      );
    }

    const program = await prisma.ota_programs.findUnique({
      where: { id },
      include: { student: true }
    });

    if (!program) {
      return NextResponse.json(
        { error: 'OTA program not found' },
        { status: 404 }
      );
    }

    // Update program and student profile simultaneously
    const updateData: any = {
      lastUpdate: new Date(),
    };

    if (monthlyTarget !== undefined) {
      updateData.monthlyTarget = parseFloat(monthlyTarget);
    }
    if (displayOrder !== undefined) {
      updateData.displayOrder = displayOrder;
    }
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    const updatedProgram = await prisma.ota_programs.update({
      where: { id },
      data: updateData,
      include: {
        student: {
          select: {
            id: true,
            nis: true,
            fullName: true,
            institutionType: true,
            grade: true,
            monthlyNeeds: true,
            otaProfile: true,
            status: true,
          }
        }
      }
    });

    // Update student profile if provided
    if (otaProfile !== undefined || monthlyTarget !== undefined) {
      const studentUpdateData: any = {};
      if (otaProfile !== undefined) {
        studentUpdateData.otaProfile = otaProfile;
      }
      if (monthlyTarget !== undefined) {
        studentUpdateData.monthlyNeeds = parseFloat(monthlyTarget);
      }

      await prisma.students.update({
        where: { id: program.studentId },
        data: studentUpdateData
      });
    }

    return NextResponse.json({ program: updatedProgram });
  } catch (error) {
    console.error('Error updating OTA program:', error);
    return NextResponse.json(
      { error: 'Failed to update OTA program' },
      { status: 500 }
    );
  }
}

// DELETE /api/ota/admin - Remove student from OTA program
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
        { error: 'Program ID is required' },
        { status: 400 }
      );
    }

    const program = await prisma.ota_programs.findUnique({
      where: { id },
      include: { sponsors: { where: { isPaid: true } } }
    });

    if (!program) {
      return NextResponse.json(
        { error: 'OTA program not found' },
        { status: 404 }
      );
    }

    // Check if there are paid donations
    if (program.sponsors.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete program with existing paid donations. Please archive it instead.'
        },
        { status: 400 }
      );
    }

    await softDelete(prisma.ota_programs, { id }, session.user.id);

    return NextResponse.json({
      message: 'OTA program soft deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting OTA program:', error);
    return NextResponse.json(
      { error: 'Failed to delete OTA program' },
      { status: 500 }
    );
  }
}