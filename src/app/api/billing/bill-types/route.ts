import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const createBillTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['TUITION', 'REGISTRATION', 'MATERIAL', 'ACTIVITY', 'OTHER']),
  description: z.string().optional().nullable(),
  defaultAmount: z.number().optional().nullable(),
  isRecurring: z.boolean().default(false),
  frequency: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUALLY', 'ONE_TIME']).optional().nullable(),
  priceByGrade: z.record(z.number()).default({}),
  dueDayOfMonth: z.number().min(1).max(31).optional().nullable(),
  gracePeriodDays: z.number().min(0).default(7),
  latePenaltyType: z.enum(['NONE', 'FIXED', 'PERCENTAGE']).default('NONE'),
  latePenaltyAmount: z.number().min(0).default(0),
  maxPenalty: z.number().optional().nullable(),
  allowSiblingDiscount: z.boolean().default(false),
  siblingDiscountPercent: z.number().min(0).max(100).default(0),
  allowScholarshipDiscount: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

const updateBillTypeSchema = createBillTypeSchema.partial();

export async function GET(request: NextRequest) {
  try {
    const { default: prisma } = await import('@/lib/prisma');
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user permissions
    if (!session.user?.role || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');
    const isRecurring = searchParams.get('isRecurring');

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    if (isRecurring !== null) {
      where.isRecurring = isRecurring === 'true';
    }

    const billTypes = await prisma.bill_types.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({ data: billTypes });
  } catch (error) {
    console.error('Error fetching bill types:', error);
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

    // Check user permissions
    if (!session.user?.role || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validated = createBillTypeSchema.parse(body);

    // Check if name already exists
    const existing = await prisma.bill_types.findUnique({
      where: { name: validated.name },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Bill type with this name already exists' },
        { status: 409 }
      );
    }

    const billType = await prisma.bill_types.create({
      data: {
        ...validated,
        priceByGrade: JSON.stringify(validated.priceByGrade),
      },
    });

    return NextResponse.json({ data: billType });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating bill type:', error);
    return NextResponse.json(
      { error: 'Failed to create bill type' },
      { status: 500 }
    );
  }
}