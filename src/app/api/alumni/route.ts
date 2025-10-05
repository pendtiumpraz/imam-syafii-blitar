import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createAlumniSchema = z.object({
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

export async function GET(request: NextRequest) {
  try {
    const { default: prisma } = await import('@/lib/prisma');
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const institutionType = searchParams.get('institutionType');
    const graduationYear = searchParams.get('graduationYear');
    const generation = searchParams.get('generation');
    const availableForEvents = searchParams.get('availableForEvents');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter out soft deleted records
    where.isDeleted = false;

    if (institutionType) {
      where.institutionType = institutionType;
    }

    if (graduationYear) {
      where.graduationYear = graduationYear;
    }

    if (generation) {
      where.generation = generation;
    }

    if (availableForEvents !== null) {
      where.availableForEvents = availableForEvents === 'true';
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { currentCity: { contains: search, mode: 'insensitive' } },
        { currentJob: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [alumni, total] = await Promise.all([
      prisma.alumni.findMany({
        where,
        include: {
          creator: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [
          { graduationYear: 'desc' },
          { fullName: 'asc' },
        ],
        skip,
        take: limit,
      }),
      prisma.alumni.count({ where }),
    ]);

    return NextResponse.json({
      data: alumni,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching alumni:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const validated = createAlumniSchema.parse(body);

    const alumni = await prisma.alumni.create({
      data: {
        ...validated,
        birthDate: new Date(validated.birthDate),
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(alumni);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating alumni:', error);
    return NextResponse.json(
      { error: 'Failed to create alumni' },
      { status: 500 }
    );
  }
}