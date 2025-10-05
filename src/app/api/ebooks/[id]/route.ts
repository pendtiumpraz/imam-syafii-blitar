import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { softDelete } from '@/lib/soft-delete';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { default: prisma } = await import('@/lib/prisma');
    const ebook = await prisma.ebook.findUnique({
      where: {
        id: params.id,
      },
      include: {
        creator: {
          select: {
            name: true,
          },
        },
      },
    });
    
    if (!ebook) {
      return NextResponse.json(
        { error: 'Ebook not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(ebook);
  } catch (error) {
    console.error('Error fetching ebook:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ebook' },
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
    
    const data = await request.json();
    
    const ebook = await prisma.ebook.update({
      where: {
        id: params.id,
      },
      data,
    });
    
    return NextResponse.json(ebook);
  } catch (error) {
    console.error('Error updating ebook:', error);
    return NextResponse.json(
      { error: 'Failed to update ebook' },
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
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if ebook exists
    const ebook = await prisma.ebook.findUnique({
      where: { id: params.id },
    });

    if (!ebook) {
      return NextResponse.json(
        { error: 'Ebook not found' },
        { status: 404 }
      );
    }

    // Soft delete the ebook
    await softDelete(prisma.ebook, { id: params.id }, session.user?.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ebook:', error);
    return NextResponse.json(
      { error: 'Failed to delete ebook' },
      { status: 500 }
    );
  }
}