import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { softDelete } from '@/lib/soft-delete';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const updateAlumniSchema = z.object({
  nisn: z.string().optional().nullable(),
  nis: z.string().optional().nullable(),
  fullName: z.string().min(1, 'Name is required'),
  nickname: z.string().optional().nullable(),
  birthPlace: z.string().min(1, 'Birth place is required'),
  birthDate: z.string(),
  gender: z.enum(['MALE', 'FEMALE']),
  bloodType: z.string().optional().nullable(),
  currentAddress: z.string().min(1, 'Current address is required'),
  currentCity: z.string().min(1, 'Current city is required'),
  currentProvince: z.string().optional().nullable(),
  currentCountry: z.string().default('Indonesia'),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  facebook: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  fatherName: z.string().optional().nullable(),
  motherName: z.string().optional().nullable(),
  institutionType: z.enum(['TK', 'SD', 'PONDOK']),
  graduationYear: z.string().min(1, 'Graduation year is required'),
  generation: z.string().optional().nullable(),
  currentJob: z.string().optional().nullable(),
  jobPosition: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  furtherEducation: z.string().optional().nullable(),
  university: z.string().optional().nullable(),
  major: z.string().optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
  spouseName: z.string().optional().nullable(),
  childrenCount: z.number().default(0),
  notes: z.string().optional().nullable(),
  photo: z.string().optional().nullable(),
  memories: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
  availableForEvents: z.boolean().default(true),
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

    // TODO: Add creator relation to schema - alumni model doesn't have a relation to users yet
    const alumni = await prisma.alumni.findUnique({
      where: { id: params.id },
    });

    if (!alumni) {
      return NextResponse.json({ error: 'Alumni not found' }, { status: 404 });
    }

    return NextResponse.json(alumni);
  } catch (error) {
    console.error('Error fetching alumni:', error);
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
    const validated = updateAlumniSchema.parse(body);

    // Check if alumni exists
    const existingAlumni = await prisma.alumni.findUnique({
      where: { id: params.id },
    });

    if (!existingAlumni) {
      return NextResponse.json(
        { error: 'Alumni not found' },
        { status: 404 }
      );
    }

    // Update alumni
    // TODO: Add creator relation to schema - alumni model doesn't have a relation to users yet
    const updatedAlumni = await prisma.alumni.update({
      where: { id: params.id },
      data: {
        ...validated,
        birthDate: new Date(validated.birthDate),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedAlumni);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating alumni:', error);
    return NextResponse.json(
      { error: 'Failed to update alumni' },
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

    // Check if alumni exists
    const existingAlumni = await prisma.alumni.findUnique({
      where: { id: params.id },
    });

    if (!existingAlumni) {
      return NextResponse.json(
        { error: 'Alumni not found' },
        { status: 404 }
      );
    }

    // Soft delete alumni
    await softDelete(prisma.alumni, { id: params.id }, session.user.id);

    return NextResponse.json({ message: 'Alumni soft deleted successfully' });
  } catch (error) {
    console.error('Error deleting alumni:', error);
    return NextResponse.json(
      { error: 'Failed to delete alumni' },
      { status: 500 }
    );
  }
}