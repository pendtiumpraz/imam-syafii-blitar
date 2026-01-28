import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { softDelete } from '@/lib/soft-delete';

// GET /api/teachers - Get all teachers (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const institution = searchParams.get('institution') || 'all';
    const isUstadz = searchParams.get('isUstadz'); // 'true', 'false', or null for all
    const status = searchParams.get('status') || 'ACTIVE';

    const skip = (page - 1) * limit;

    // Build where conditions
    const whereConditions: any = {};

    // Filter out soft deleted records
    whereConditions.isDeleted = false;

    if (status !== 'all') {
      whereConditions.status = status;
    }

    if (search) {
      whereConditions.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          position: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          specialization: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    if (institution !== 'all') {
      whereConditions.OR = [
        { institution: institution },
        { institution: 'ALL' }
      ];
    }

    if (isUstadz !== null && isUstadz !== undefined) {
      whereConditions.isUstadz = isUstadz === 'true';
    }

    const [teachers, total] = await Promise.all([
      prisma.teachers.findMany({
        where: whereConditions,
        orderBy: [
          { status: 'asc' },
          { name: 'asc' }
        ],
        skip,
        take: limit,
      }),
      prisma.teachers.count({ where: whereConditions })
    ]);

    // Parse JSON fields
    const formattedTeachers = teachers.map(teacher => ({
      ...teacher,
      subjects: JSON.parse(teacher.subjects || '[]'),
      certifications: JSON.parse(teacher.certifications || '[]'),
      achievements: JSON.parse(teacher.achievements || '[]')
    }));

    return NextResponse.json({
      teachers: formattedTeachers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teachers' },
      { status: 500 }
    );
  }
}

// POST /api/teachers - Create new teacher (admin only)
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
      nip,
      name,
      title,
      gender,
      birthPlace,
      birthDate,
      phone,
      email,
      address,
      position,
      subjects,
      education,
      university,
      major,
      certifications,
      employmentType,
      joinDate,
      status,
      institution,
      specialization,
      experience,
      photo,
      bio,
      achievements,
      isUstadz
    } = body;

    // Validate required fields
    if (!name || !gender || !position || !institution) {
      return NextResponse.json(
        { error: 'Name, gender, position, and institution are required' },
        { status: 400 }
      );
    }

    // Normalize gender values (L/P to MALE/FEMALE)
    let normalizedGender = gender;
    const genderUpper = String(gender).toUpperCase().trim();
    if (['L', 'LAKI-LAKI', 'LAKI'].includes(genderUpper)) {
      normalizedGender = 'MALE';
    } else if (['P', 'PEREMPUAN', 'WANITA'].includes(genderUpper)) {
      normalizedGender = 'FEMALE';
    }

    // Check if NIP already exists
    if (nip) {
      const existingTeacher = await prisma.teachers.findUnique({
        where: { nip }
      });
      if (existingTeacher) {
        return NextResponse.json(
          { error: 'NIP already exists' },
          { status: 400 }
        );
      }
    }

    const teacher = await prisma.teachers.create({
      data: {
        nip: nip || null,
        name,
        title: title || null,
        gender: normalizedGender,
        birthPlace: birthPlace || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        position,
        subjects: JSON.stringify(subjects || []),
        education: education || null,
        university: university || null,
        major: major || null,
        certifications: JSON.stringify(certifications || []),
        employmentType: employmentType || 'TETAP',
        joinDate: joinDate ? new Date(joinDate) : null,
        status: status || 'ACTIVE',
        institution,
        specialization: specialization || null,
        experience: experience ? parseInt(experience) : null,
        photo: photo || null,
        bio: bio || null,
        achievements: JSON.stringify(achievements || []),
        isUstadz: isUstadz !== false,
        createdBy: session.user.id
      }
    });

    return NextResponse.json({
      ...teacher,
      subjects: JSON.parse(teacher.subjects || '[]'),
      certifications: JSON.parse(teacher.certifications || '[]'),
      achievements: JSON.parse(teacher.achievements || '[]')
    });
  } catch (error) {
    console.error('Error creating teacher:', error);
    return NextResponse.json(
      { error: 'Failed to create teacher' },
      { status: 500 }
    );
  }
}

// PUT /api/teachers - Update teacher (admin only)
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
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Teacher ID is required' },
        { status: 400 }
      );
    }

    // Process JSON fields if provided
    if (updateData.subjects) {
      updateData.subjects = JSON.stringify(updateData.subjects);
    }
    if (updateData.certifications) {
      updateData.certifications = JSON.stringify(updateData.certifications);
    }
    if (updateData.achievements) {
      updateData.achievements = JSON.stringify(updateData.achievements);
    }

    // Process date fields
    if (updateData.birthDate) {
      updateData.birthDate = new Date(updateData.birthDate);
    }
    if (updateData.joinDate) {
      updateData.joinDate = new Date(updateData.joinDate);
    }

    // Process number fields
    if (updateData.experience) {
      updateData.experience = parseInt(updateData.experience);
    }

    // Normalize gender values (L/P to MALE/FEMALE)
    if (updateData.gender) {
      const genderUpper = String(updateData.gender).toUpperCase().trim();
      if (['L', 'LAKI-LAKI', 'LAKI'].includes(genderUpper)) {
        updateData.gender = 'MALE';
      } else if (['P', 'PEREMPUAN', 'WANITA'].includes(genderUpper)) {
        updateData.gender = 'FEMALE';
      }
    }

    const teacher = await prisma.teachers.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      ...teacher,
      subjects: JSON.parse(teacher.subjects || '[]'),
      certifications: JSON.parse(teacher.certifications || '[]'),
      achievements: JSON.parse(teacher.achievements || '[]')
    });
  } catch (error) {
    console.error('Error updating teacher:', error);
    return NextResponse.json(
      { error: 'Failed to update teacher' },
      { status: 500 }
    );
  }
}

// DELETE /api/teachers - Delete teacher (admin only)
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
        { error: 'Teacher ID is required' },
        { status: 400 }
      );
    }

    await softDelete(prisma.teachers, { id }, session.user.id);

    return NextResponse.json({
      message: 'Teacher soft deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting teacher:', error);
    return NextResponse.json(
      { error: 'Failed to delete teacher' },
      { status: 500 }
    );
  }
}