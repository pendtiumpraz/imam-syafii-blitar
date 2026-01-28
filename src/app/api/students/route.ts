import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { cache, withETag, invalidateCache } from '@/lib/redis-cache';
import { getPaginationParams, createPaginationResult, getSearchParams, buildPrismaWhereClause } from '@/lib/pagination';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createStudentSchema = z.object({
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
  email: z.string().email().optional().nullable().or(z.literal('')),
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
  institutionType: z.enum(['KB_TK', 'SD', 'MTQ', 'MSWi', 'MSWa', 'SMP', 'SMA']),
  grade: z.string().optional().nullable(),
  enrollmentDate: z.string(),
  enrollmentYear: z.string(),
  previousSchool: z.string().optional().nullable(),
  specialNeeds: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  photo: z.string().optional().nullable(),
  isOrphan: z.boolean().optional().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const { default: prisma } = await import('@/lib/prisma');
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get pagination and search parameters
    const paginationParams = getPaginationParams(request);
    const searchParams = getSearchParams(request);

    // Generate cache key
    const cacheKey = cache.generateAPIKey('students', {
      ...paginationParams,
      ...searchParams,
      userId: session.user.id
    });

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      return withETag(cached, request);
    }

    // Build where clause with better structure
    const where: any = buildPrismaWhereClause(searchParams);

    // Filter out soft deleted records
    where.isDeleted = false;

    // Add specific student filters
    if (searchParams.institutionType) {
      where.institutionType = searchParams.institutionType;
    }

    if (searchParams.grade) {
      where.grade = searchParams.grade;
    }

    // Override default search for students
    if (searchParams.query) {
      where.OR = [
        { fullName: { contains: searchParams.query, mode: 'insensitive' } },
        { nis: { contains: searchParams.query, mode: 'insensitive' } },
        { nisn: { contains: searchParams.query, mode: 'insensitive' } },
      ];
    }

    const [students, total] = await Promise.all([
      prisma.students.findMany({
        where,
        orderBy: {
          [paginationParams.orderBy as string]: paginationParams.sortOrder,
        },
        skip: paginationParams.offset,
        take: paginationParams.limit,
      }),
      prisma.students.count({ where }),
    ]);

    // Fetch creators separately if needed
    const creatorIds = [...new Set(students.map(s => s.createdBy).filter(Boolean))];
    const creators = creatorIds.length > 0 ? await prisma.users.findMany({
      where: { id: { in: creatorIds } },
      select: { id: true, name: true }
    }) : [];
    const creatorsMap = new Map(creators.map(c => [c.id, c]));

    // Attach creator info to students
    const studentsWithCreators = students.map(s => ({
      ...s,
      creator: s.createdBy ? creatorsMap.get(s.createdBy) : null
    }));

    const result = createPaginationResult(studentsWithCreators, total, paginationParams);

    // Cache the result
    cache.set(cacheKey, result, 5 * 60 * 1000); // 5 minutes

    return withETag(result, request);
  } catch (error) {
    console.error('Error fetching students:', error);
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
    const validated = createStudentSchema.parse(body);

    const student = await prisma.students.create({
      data: {
        ...validated,
        birthDate: new Date(validated.birthDate),
        enrollmentDate: new Date(validated.enrollmentDate),
        createdBy: session.user.id,
      },
    });

    // Invalidate students cache after creation
    invalidateCache.students();

    return NextResponse.json(student);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
}