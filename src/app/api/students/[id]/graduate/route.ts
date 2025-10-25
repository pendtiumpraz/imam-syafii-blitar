import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { default: prisma } = await import('@/lib/prisma');
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get student data
    const student = await prisma.students.findUnique({
      where: { id: params.id },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Check if already graduated
    if (student.status === 'GRADUATED') {
      return NextResponse.json(
        { error: 'Student is already graduated' },
        { status: 400 }
      );
    }

    // Get current year for graduation year
    const currentYear = new Date().getFullYear().toString();

    // Create transaction to update student and create alumni record
    const result = await prisma.$transaction(async (tx) => {
      // Update student status to GRADUATED
      const updatedStudent = await tx.students.update({
        where: { id: params.id },
        data: {
          status: 'GRADUATED',
          isActive: false,
          graduationDate: new Date(),
          updatedAt: new Date(),
        },
      });

      // Create alumni record with student data
      const alumni = await tx.alumni.create({
        data: {
          nisn: student.nisn,
          nis: student.nis,
          fullName: student.fullName,
          nickname: student.nickname,
          birthPlace: student.birthPlace,
          birthDate: student.birthDate,
          gender: student.gender,
          bloodType: student.bloodType,
          religion: student.religion || 'Islam',
          nationality: student.nationality || 'Indonesia',
          currentAddress: student.address,
          currentCity: student.city,
          currentProvince: student.province || 'Jawa Timur',
          currentCountry: 'Indonesia',
          phone: student.phone,
          email: student.email,
          fatherName: student.fatherName,
          motherName: student.motherName,
          institutionType: student.institutionType,
          graduationYear: currentYear,
          generation: student.enrollmentYear,
          createdBy: session.user.id,
        },
      });

      return { updatedStudent, alumni };
    });

    return NextResponse.json({
      success: true,
      message: 'Student graduated successfully',
      data: result,
    });

  } catch (error) {
    console.error('Error graduating student:', error);
    return NextResponse.json(
      { error: 'Failed to graduate student' },
      { status: 500 }
    );
  }
}
