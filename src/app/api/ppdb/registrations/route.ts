import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { softDelete } from '@/lib/soft-delete';

// Helper function to generate registration number
async function generateRegistrationNumber(level: string, year: string): Promise<string> {
  const settings = await prisma.ppdb_settings.findUnique({
    where: { academicYear: year }
  });
  
  const lastNo = settings?.lastRegistrationNo || 0;
  const newNo = lastNo + 1;
  
  // Update the last registration number
  if (settings) {
    await prisma.ppdb_settings.update({
      where: { academicYear: year },
      data: { lastRegistrationNo: newNo }
    });
  }
  
  // Format: PPDB-2024-TK-001
  const paddedNo = String(newNo).padStart(3, '0');
  return `PPDB-${year.split('/')[0]}-${level}-${paddedNo}`;
}

// Helper function to check quotas
async function checkQuota(level: string, year: string): Promise<boolean> {
  const settings = await prisma.ppdb_settings.findUnique({
    where: { academicYear: year }
  });
  
  if (!settings) return false;
  
  const registrationCount = await prisma.ppdb_registrations.count({
    where: {
      level,
      academicYear: year,
      status: {
        in: ['ACCEPTED', 'ENROLLED']
      }
    }
  });
  
  const quotaField = `quota${level}` as keyof typeof settings;
  const quota = settings[quotaField] as number;
  
  return registrationCount < quota;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const status = searchParams.get('status');
    const academicYear = searchParams.get('academicYear');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    
    const whereConditions: any = {};
    
    if (level) {
      whereConditions.level = level;
    }
    
    if (status) {
      whereConditions.status = status;
    }
    
    if (academicYear) {
      whereConditions.academicYear = academicYear;
    }
    
    if (search) {
      whereConditions.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { registrationNo: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const [registrations, totalCount] = await Promise.all([
      prisma.ppdb_registrations.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.ppdb_registrations.count({ where: whereConditions })
    ]);
    
    // Get quota information if academic year is specified
    let quotaInfo: Record<string, { quota: number; accepted: number; available: number }> | null = null;
    if (academicYear) {
      const settings = await prisma.ppdb_settings.findUnique({
        where: { academicYear }
      });
      
      if (settings) {
        const levels = ['TK', 'SD', 'SMP', 'PONDOK'];
        quotaInfo = {};
        
        for (const lvl of levels) {
          const quotaField = `quota${lvl}` as keyof typeof settings;
          const quota = settings[quotaField] as number;
          
          const accepted = await prisma.ppdb_registrations.count({
            where: {
              level: lvl,
              academicYear,
              status: { in: ['ACCEPTED', 'ENROLLED'] }
            }
          });
          
          quotaInfo[lvl] = {
            quota,
            accepted,
            available: quota - accepted
          };
        }
      }
    }
    
    return NextResponse.json({
      registrations,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1
      },
      quotaInfo
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract data from request body
    const {
      level,
      academicYear = '2024/2025',
      fullName,
      nickname,
      birthPlace,
      birthDate,
      gender,
      bloodType,
      religion = 'ISLAM',
      nationality = 'INDONESIA',
      nik,
      nisn,
      birthCertNo,
      familyCardNo,
      phone,
      email,
      address,
      rt,
      rw,
      village,
      district,
      city,
      province,
      postalCode,
      previousSchool,
      previousGrade,
      previousNISN,
      graduationYear,
      fatherName,
      fatherNIK,
      fatherBirth,
      fatherEducation,
      fatherOccupation,
      fatherPhone,
      fatherIncome,
      motherName,
      motherNIK,
      motherBirth,
      motherEducation,
      motherOccupation,
      motherPhone,
      motherIncome,
      guardianName,
      guardianNIK,
      guardianRelation,
      guardianPhone,
      guardianAddress,
      hasSpecialNeeds = false,
      specialNeeds,
      healthConditions,
      allergies,
      documents = [],
      photoUrl,
      birthCertUrl,
      familyCardUrl,
      transcriptUrl,
      submitNow = false
    } = body;
    
    // Validate required fields
    if (!fullName || !birthPlace || !birthDate || !gender || !address || 
        !village || !district || !city || !province || !fatherName || !motherName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check quota
    const quotaAvailable = await checkQuota(level, academicYear);
    if (!quotaAvailable && submitNow) {
      return NextResponse.json(
        { error: 'Quota penuh untuk level ini' },
        { status: 400 }
      );
    }
    
    // Generate registration number
    const registrationNo = await generateRegistrationNumber(level, academicYear);
    
    // Get registration fee from settings
    const settings = await prisma.ppdb_settings.findUnique({
      where: { academicYear }
    });
    
    const feeField = `registrationFee${level}` as keyof typeof settings;
    const registrationFee = settings ? (settings[feeField] as number) : 100000;
    
    // Create registration
    const registration = await prisma.ppdb_registrations.create({
      data: {
        registrationNo,
        level,
        academicYear,
        fullName,
        nickname,
        birthPlace,
        birthDate: new Date(birthDate),
        gender,
        bloodType,
        religion,
        nationality,
        nik,
        nisn,
        birthCertNo,
        familyCardNo,
        phone,
        email,
        address,
        rt,
        rw,
        village,
        district,
        city,
        province,
        postalCode,
        previousSchool,
        previousGrade,
        previousNISN,
        graduationYear: graduationYear ? parseInt(graduationYear) : null,
        fatherName,
        fatherNIK,
        fatherBirth: fatherBirth ? new Date(fatherBirth) : null,
        fatherEducation,
        fatherOccupation,
        fatherPhone,
        fatherIncome: fatherIncome || null,
        motherName,
        motherNIK,
        motherBirth: motherBirth ? new Date(motherBirth) : null,
        motherEducation,
        motherOccupation,
        motherPhone,
        motherIncome: motherIncome || null,
        guardianName,
        guardianNIK,
        guardianRelation,
        guardianPhone,
        guardianAddress,
        hasSpecialNeeds,
        specialNeeds,
        healthConditions,
        allergies,
        documents: JSON.stringify(documents),
        photoUrl,
        birthCertUrl,
        familyCardUrl,
        transcriptUrl,
        registrationFee,
        status: submitNow ? 'SUBMITTED' : 'DRAFT',
        submittedAt: submitNow ? new Date() : null
      }
    });

    // Create activity log
    if (registration) {
      await prisma.ppdb_activities.create({
        data: {
          registrationId: registration.id,
          activity: submitNow ? 'SUBMITTED' : 'CREATED',
          description: submitNow ?
            `Pendaftaran ${registrationNo} telah disubmit` :
            `Draft pendaftaran ${registrationNo} telah dibuat`,
          metadata: JSON.stringify({ ip: request.headers.get('x-forwarded-for') })
        }
      });
    }

    return NextResponse.json(registration, { status: 201 });
  } catch (error) {
    console.error('Error creating registration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { id, status, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      );
    }
    
    // Check if registration exists
    const existing = await prisma.ppdb_registrations.findUnique({
      where: { id }
    });
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }
    
    // Handle status change
    let activityData = null;
    if (status && status !== existing.status) {
      // Admin-only status changes
      if (session?.user?.role && ['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
        activityData = {
          activity: 'STATUS_CHANGED',
          description: `Status berubah dari ${existing.status} ke ${status}`,
          performedBy: session.user.id,
          metadata: JSON.stringify({ oldStatus: existing.status, newStatus: status })
        };
        
        // Handle specific status changes
        if (status === 'ACCEPTED') {
          updateData.acceptedAt = new Date();
          updateData.acceptedBy = session.user.id;
        } else if (status === 'ENROLLED') {
          updateData.enrolledAt = new Date();
        }
      } else if (!session && status === 'SUBMITTED' && existing.status === 'DRAFT') {
        // Allow public users to submit their draft
        activityData = {
          activity: 'SUBMITTED',
          description: `Pendaftaran ${existing.registrationNo} telah disubmit`,
          metadata: JSON.stringify({ ip: request.headers.get('x-forwarded-for') })
        };
        updateData.submittedAt = new Date();
      } else {
        return NextResponse.json(
          { error: 'Unauthorized to change status' },
          { status: 403 }
        );
      }
    }
    
    // Update registration
    const registration = await prisma.ppdb_registrations.update({
      where: { id },
      data: {
        ...updateData,
        status
      }
    });

    // Create activity log if needed
    if (activityData) {
      await prisma.ppdb_activities.create({
        data: {
          registrationId: id,
          ...activityData
        }
      });
    }
    
    return NextResponse.json(registration);
  } catch (error) {
    console.error('Error updating registration:', error);
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
        { error: 'Registration ID is required' },
        { status: 400 }
      );
    }

    await softDelete(prisma.ppdb_registrations, { id }, session.user.id);

    return NextResponse.json({ message: 'PPDB registration soft deleted successfully' });
  } catch (error) {
    console.error('Error deleting registration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}