import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { softDelete } from '@/lib/soft-delete';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const updateBillTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  category: z.enum(['TUITION', 'REGISTRATION', 'MATERIAL', 'ACTIVITY', 'OTHER']).optional(),
  description: z.string().optional().nullable(),
  defaultAmount: z.number().optional().nullable(),
  isRecurring: z.boolean().optional(),
  frequency: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUALLY', 'ONE_TIME']).optional().nullable(),
  priceByGrade: z.record(z.number()).optional(),
  dueDayOfMonth: z.number().min(1).max(31).optional().nullable(),
  gracePeriodDays: z.number().min(0).optional(),
  latePenaltyType: z.enum(['NONE', 'FIXED', 'PERCENTAGE']).optional(),
  latePenaltyAmount: z.number().min(0).optional(),
  maxPenalty: z.number().optional().nullable(),
  allowSiblingDiscount: z.boolean().optional(),
  siblingDiscountPercent: z.number().min(0).max(100).optional(),
  allowScholarshipDiscount: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
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

    const billType = await prisma.bill_types.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { bills: true },
        },
      },
    });

    if (!billType) {
      return NextResponse.json({ error: 'Bill type not found' }, { status: 404 });
    }

    return NextResponse.json({ data: billType });
  } catch (error) {
    console.error('Error fetching bill type:', error);
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

    // Check user permissions
    if (!session.user?.role || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateBillTypeSchema.parse(body);

    // Check if bill type exists
    const existing = await prisma.bill_types.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Bill type not found' },
        { status: 404 }
      );
    }

    // Check if name already exists (if changing name)
    if (validated.name && validated.name !== existing.name) {
      const nameExists = await prisma.bill_types.findUnique({
        where: { name: validated.name },
      });

      if (nameExists) {
        return NextResponse.json(
          { error: 'Bill type with this name already exists' },
          { status: 409 }
        );
      }
    }

    const updateData: any = { ...validated };
    if (validated.priceByGrade) {
      updateData.priceByGrade = JSON.stringify(validated.priceByGrade);
    }

    const billType = await prisma.bill_types.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ data: billType });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating bill type:', error);
    return NextResponse.json(
      { error: 'Failed to update bill type' },
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

    // Check user permissions
    if (!session.user?.role || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check if bill type exists
    const billType = await prisma.bill_types.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { bills: true },
        },
      },
    });

    if (!billType) {
      return NextResponse.json(
        { error: 'Bill type not found' },
        { status: 404 }
      );
    }

    // Check if there are existing bills using this type
    if (billType._count.bills > 0) {
      return NextResponse.json(
        { error: 'Cannot delete bill type with existing bills. Consider deactivating instead.' },
        { status: 409 }
      );
    }

    // Soft delete the bill type
    await softDelete(prisma.bill_types, { id: params.id }, session.user.id);

    return NextResponse.json({ message: 'Bill type deleted successfully' });
  } catch (error) {
    console.error('Error deleting bill type:', error);
    return NextResponse.json(
      { error: 'Failed to delete bill type' },
      { status: 500 }
    );
  }
}