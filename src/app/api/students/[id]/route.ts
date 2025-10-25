import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const updateStudentSchema = z.object({
  nisn: z.string().optional().nullable(),
  nis: z.string().min(1, 'NIS is required'),
  fullName: z.string().min(1, 'Name is required'),
  nickname: z.string().optional().nullable(),
  birthPlace: z.string().min(1, 'Birth place is required'),
  birthDate: z.string(),
  gender: z.enum(['MALE', 'FEMALE']),
  bloodType: z.string().optional().nullable(),
  address: z.string().min(1, 'Address is required'),
  village: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  city: z.string().min(1, 'City is required'),
  province: z.string().default('Jawa Timur'),
  postalCode: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  fatherName: z.string().min(1, 'Father name is required'),
  fatherJob: z.string().optional().nullable(),
  fatherPhone: z.string().optional().nullable(),
  fatherEducation: z.string().optional().nullable(),
  motherName: z.string().min(1, 'Mother name is required'),
  motherJob: z.string().optional().nullable(),
  motherPhone: z.string().optional().nullable(),
  motherEducation: z.string().optional().nullable(),
  guardianName: z.string().optional().nullable(),
  guardianJob: z.string().optional().nullable(),
  guardianPhone: z.string().optional().nullable(),
  guardianRelation: z.string().optional().nullable(),
  institutionType: z.enum(['TK', 'SD', 'PONDOK']),
  grade: z.string().optional().nullable(),
  enrollmentDate: z.string(),
  enrollmentYear: z.string(),
  previousSchool: z.string().optional().nullable(),
  specialNeeds: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  photo: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'GRADUATED', 'TRANSFERRED', 'DROPPED_OUT']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { default: prisma } = await import('@/lib/prisma');
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.students.findUnique({
      where: { id: params.id }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Fetch creator separately if needed
    let creatorName = null;
    if (student.createdBy) {
      const creator = await prisma.users.findUnique({
        where: { id: student.createdBy },
        select: { name: true }
      });
      creatorName = creator?.name;
    }

    return NextResponse.json({
      ...student,
      creator: creatorName ? { name: creatorName } : null
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const body = await request.json();
    const validated = updateStudentSchema.parse(body);

    // Check if student exists
    const existingStudent = await prisma.students.findUnique({
      where: { id: params.id },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Update student
    const updatedStudent = await prisma.students.update({
      where: { id: params.id },
      data: {
        ...validated,
        birthDate: new Date(validated.birthDate),
        enrollmentDate: new Date(validated.enrollmentDate),
        updatedAt: new Date(),
      }
    });

    // Fetch creator separately if needed
    let creatorName = null;
    if (updatedStudent.createdBy) {
      const creator = await prisma.users.findUnique({
        where: { id: updatedStudent.createdBy },
        select: { name: true }
      });
      creatorName = creator?.name;
    }

    return NextResponse.json({
      ...updatedStudent,
      creator: creatorName ? { name: creatorName } : null
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating student:', error);
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Check if student exists
    const existingStudent = await prisma.students.findUnique({
      where: { id: params.id },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Soft delete by updating status
    const deletedStudent = await prisma.students.update({
      where: { id: params.id },
      data: {
        status: 'DROPPED_OUT',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(deletedStudent);
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    );
  }
}