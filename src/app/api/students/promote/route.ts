import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/students/promote - Promote students to next grade or graduate
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
    const { studentId, action, newGrade, graduationDate } = body;

    if (!studentId || !action) {
      return NextResponse.json(
        { error: 'Student ID and action are required' },
        { status: 400 }
      );
    }

    const student = await prisma.students.findUnique({
      where: { id: studentId },
      include: {
        ota_program: true,
      }
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    if (student.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Only active students can be promoted or graduated' },
        { status: 400 }
      );
    }

    let updateData: any = {};
    let alumniData: any = null;

    if (action === 'promote') {
      // Promote to next grade
      if (!newGrade) {
        return NextResponse.json(
          { error: 'New grade is required for promotion' },
          { status: 400 }
        );
      }

      updateData.grade = newGrade;
      
      // Update enrollment year if moving from one institution to another
      if (shouldUpdateEnrollmentYear(student.institutionType, student.grade, newGrade)) {
        const currentYear = new Date().getFullYear();
        updateData.enrollmentYear = `${currentYear}/${currentYear + 1}`;
      }

    } else if (action === 'graduate') {
      // Graduate student
      updateData.status = 'GRADUATED';
      updateData.graduationDate = graduationDate ? new Date(graduationDate) : new Date();
      updateData.isActive = false;

      // Prepare alumni data
      alumniData = {
        nisn: student.nisn,
        nis: student.nis,
        fullName: student.fullName,
        nickname: student.nickname,
        birthPlace: student.birthPlace,
        birthDate: student.birthDate,
        gender: student.gender,
        bloodType: student.bloodType,
        religion: student.religion,
        nationality: student.nationality,
        currentAddress: student.address,
        currentCity: student.city,
        currentProvince: student.province,
        phone: student.phone,
        email: student.email,
        fatherName: student.fatherName,
        motherName: student.motherName,
        institutionType: student.institutionType,
        graduationYear: new Date().getFullYear().toString(),
        generation: student.enrollmentYear,
        achievements: student.achievements,
        notes: `Graduated from ${student.institutionType} - Grade ${student.grade}`,
        photo: student.photo,
        createdBy: session.user.id,
      };

      // If student has OTA program, deactivate it
      if (student.otaProgram) {
        await prisma.ota_programs.update({
          where: { id: student.otaProgram.id },
          data: {
            isActive: false,
            adminNotes: `Student graduated on ${updateData.graduationDate.toISOString().split('T')[0]}`,
          }
        });
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "promote" or "graduate"' },
        { status: 400 }
      );
    }

    // Update student and create alumni record if graduating
    const [updatedStudent, alumni] = await Promise.all([
      prisma.students.update({
        where: { id: studentId },
        data: updateData,
        include: {
          ota_program: true,
          hafalan_progress: true,
        }
      }),
      alumniData ? prisma.alumni.create({ data: alumniData }) : null
    ]);

    const result: any = { student: updatedStudent };
    if (alumni) {
      result.alumni = alumni;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error promoting/graduating student:', error);
    return NextResponse.json(
      { error: 'Failed to promote/graduate student' },
      { status: 500 }
    );
  }
}

// GET /api/students/promote - Get promotion/graduation options for a student
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
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const student = await prisma.students.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        fullName: true,
        institutionType: true,
        grade: true,
        status: true,
        enrollmentYear: true,
        enrollmentDate: true,
      }
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    if (student.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Student is not active' },
        { status: 400 }
      );
    }

    // Determine promotion options based on current grade and institution
    const promotionOptions = getPromotionOptions(student.institutionType, student.grade);

    return NextResponse.json({
      student,
      promotionOptions,
    });
  } catch (error) {
    console.error('Error getting promotion options:', error);
    return NextResponse.json(
      { error: 'Failed to get promotion options' },
      { status: 500 }
    );
  }
}

// Helper function to determine promotion options
function getPromotionOptions(institutionType: string, currentGrade: string | null) {
  const options: any = {
    canPromote: false,
    canGraduate: false,
    nextGrades: [],
    graduationLevel: null,
  };

  if (!currentGrade) {
    return options;
  }

  switch (institutionType) {
    case 'TK':
      if (currentGrade === 'RA-A') {
        options.canPromote = true;
        options.nextGrades = ['RA-B'];
      } else if (currentGrade === 'RA-B') {
        options.canGraduate = true;
        options.graduationLevel = 'TK';
      }
      break;

    case 'SD':
      const gradeNum = parseInt(currentGrade.replace('Kelas ', ''));
      if (gradeNum >= 1 && gradeNum <= 5) {
        options.canPromote = true;
        options.nextGrades = [`Kelas ${gradeNum + 1}`];
      } else if (gradeNum === 6) {
        options.canGraduate = true;
        options.graduationLevel = 'SD';
      }
      break;

    case 'PONDOK':
      // Pondok can promote through various levels or graduate directly
      options.canPromote = true;
      options.canGraduate = true;
      options.nextGrades = [
        'Ula 1', 'Ula 2', 'Ula 3',
        'Wusta 1', 'Wusta 2', 'Wusta 3',
        'Ulya 1', 'Ulya 2', 'Ulya 3',
        'Mahad 1', 'Mahad 2', 'Mahad 3'
      ];
      options.graduationLevel = 'PONDOK';
      break;

    default:
      break;
  }

  return options;
}

// Helper function to determine if enrollment year should be updated
function shouldUpdateEnrollmentYear(institutionType: string, currentGrade: string | null, newGrade: string): boolean {
  // Update enrollment year when transitioning between major levels
  if (institutionType === 'TK' && currentGrade === 'RA-A' && newGrade === 'RA-B') {
    return false; // Same institution
  }
  
  if (institutionType === 'SD') {
    return false; // SD progression within same enrollment period
  }
  
  if (institutionType === 'PONDOK') {
    // Check if transitioning between major levels in pondok
    const majorTransitions = [
      { from: 'Ula 3', to: 'Wusta 1' },
      { from: 'Wusta 3', to: 'Ulya 1' },
      { from: 'Ulya 3', to: 'Mahad 1' },
    ];
    
    return majorTransitions.some(transition => 
      currentGrade === transition.from && newGrade === transition.to
    );
  }

  return false;
}