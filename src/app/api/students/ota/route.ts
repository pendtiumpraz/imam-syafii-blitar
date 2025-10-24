import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT /api/students/ota - Update student OTA status (mark as orphan)
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
    const { studentId, isOrphan, monthlyNeeds, otaProfile } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

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

    // Update student OTA fields
    const updateData: any = {};
    
    if (isOrphan !== undefined) {
      updateData.isOrphan = isOrphan;
    }
    
    if (monthlyNeeds !== undefined) {
      updateData.monthlyNeeds = parseFloat(monthlyNeeds);
    }
    
    if (otaProfile !== undefined) {
      updateData.otaProfile = otaProfile;
    }

    const updatedStudent = await prisma.students.update({
      where: { id: studentId },
      data: updateData,
      include: {
        ota_program: true,
        hafalan_progress: {
          select: {
            totalSurah: true,
            totalAyat: true,
            totalJuz: true,
            level: true,
          }
        }
      }
    });

    return NextResponse.json({ student: updatedStudent });
  } catch (error) {
    console.error('Error updating student OTA status:', error);
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    );
  }
}

// GET /api/students/ota - Get orphan students and potential OTA candidates
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
    const search = searchParams.get('search') || '';
    const institution = searchParams.get('institution') || 'all';
    const orphanStatus = searchParams.get('orphanStatus') || 'all';

    const skip = (page - 1) * limit;

    // Build where conditions
    const whereConditions: any = {
      status: 'ACTIVE',
    };

    if (institution !== 'all') {
      whereConditions.institutionType = institution;
    }

    if (orphanStatus === 'orphan') {
      whereConditions.isOrphan = true;
    } else if (orphanStatus === 'not_orphan') {
      whereConditions.isOrphan = false;
    }

    if (search) {
      whereConditions.OR = [
        {
          fullName: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          nis: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    const [students, total] = await Promise.all([
      prisma.students.findMany({
        where: whereConditions,
        include: {
          ota_program: {
            select: {
              id: true,
              monthlyTarget: true,
              currentMonth: true,
              totalCollected: true,
              isActive: true,
            }
          },
          hafalan_progress: {
            select: {
              totalSurah: true,
              totalAyat: true,
              totalJuz: true,
              level: true,
            }
          }
        },
        orderBy: [
          { isOrphan: 'desc' }, // Orphans first
          { fullName: 'asc' }
        ],
        skip,
        take: limit,
      }),
      prisma.students.count({ where: whereConditions })
    ]);

    return NextResponse.json({
      students,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error('Error fetching students for OTA:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}