import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { softDelete } from '@/lib/soft-delete';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { default: prisma } = await import('@/lib/prisma');
    
    const registration = await prisma.registration.findUnique({
      where: { id: params.id },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' }
        },
        student: true
      }
    });
    
    if (!registration) {
      return NextResponse.json(
        { success: false, error: 'Pendaftaran tidak ditemukan' },
        { status: 404 }
      );
    }
    
    // Parse JSON fields
    const parsedRegistration = {
      ...registration,
      documents: JSON.parse(registration.documents),
      testScore: registration.testScore ? JSON.parse(registration.testScore) : null
    };
    
    return NextResponse.json({
      success: true,
      data: parsedRegistration
    });
  } catch (error) {
    console.error('Get registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data pendaftaran' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { default: prisma } = await import('@/lib/prisma');
    
    // Prepare data for update
    const updateData: any = { ...body };
    
    // Handle date fields
    if (body.birthDate) {
      updateData.birthDate = new Date(body.birthDate);
    }
    if (body.testSchedule) {
      updateData.testSchedule = new Date(body.testSchedule);
    }
    
    // Handle JSON fields
    if (body.documents) {
      updateData.documents = JSON.stringify(body.documents);
    }
    if (body.testScore) {
      updateData.testScore = JSON.stringify(body.testScore);
    }
    
    // Handle status updates
    if (body.status === 'SUBMITTED' && !body.submittedAt) {
      updateData.submittedAt = new Date();
    }
    
    const registration = await prisma.registration.update({
      where: { id: params.id },
      data: updateData
    });
    
    return NextResponse.json({
      success: true,
      data: registration,
      message: 'Pendaftaran berhasil diupdate'
    });
  } catch (error) {
    console.error('Update registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengupdate pendaftaran' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { default: prisma } = await import('@/lib/prisma');
    
    // Check if registration exists
    const registration = await prisma.registration.findUnique({
      where: { id: params.id },
      include: { payments: true }
    });
    
    if (!registration) {
      return NextResponse.json(
        { success: false, error: 'Pendaftaran tidak ditemukan' },
        { status: 404 }
      );
    }
    
    // Don't delete if there are payments
    if (registration.payments.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Tidak dapat menghapus pendaftaran yang sudah memiliki pembayaran' },
        { status: 400 }
      );
    }
    
    // Soft delete registration (preserve data for audit trail)
    await softDelete(prisma.registration, { id: params.id }, session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Pendaftaran berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus pendaftaran' },
      { status: 500 }
    );
  }
}