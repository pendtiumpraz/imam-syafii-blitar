import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const units = await prisma.business_units.findMany({
      include: {
        _count: {
          select: {
            monthlyReports: true,
            transactions: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Initialize units if they don't exist
    if (units.length === 0) {
      const defaultUnits = [
        {
          code: 'KOPERASI',
          name: 'Koperasi Sekolah',
          description: 'Unit usaha koperasi untuk kebutuhan sehari-hari siswa dan santri',
          managerName: 'Bapak Ahmad'
        },
        {
          code: 'KANTIN',
          name: 'Kantin Sekolah',
          description: 'Kantin menyediakan makanan dan minuman halal untuk warga pondok',
          managerName: 'Ibu Fatimah'
        },
        {
          code: 'LAUNDRY',
          name: 'Laundry Imam Syafi\'i',
          description: 'Layanan laundry untuk santri dan masyarakat sekitar',
          managerName: 'Bapak Rizki'
        },
        {
          code: 'PASAR_BARKAS',
          name: 'Pasar Barkas',
          description: 'Pasar barang bekas layak pakai untuk mendukung ekonomi pondok',
          managerName: 'Bapak Umar'
        }
      ];

      for (const unit of defaultUnits) {
        await prisma.business_units.create({
          data: unit
        });
      }

      // Fetch again after initialization
      const newUnits = await prisma.business_units.findMany({
        include: {
          _count: {
            select: {
              monthlyReports: true,
              transactions: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      return NextResponse.json(newUnits);
    }

    return NextResponse.json(units);
  } catch (error) {
    console.error('Error fetching business units:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      code,
      name,
      description,
      managerName,
      bankName,
      bankAccount
    } = body;

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Code and name are required' },
        { status: 400 }
      );
    }

    const unit = await prisma.business_units.create({
      data: {
        code: code.toUpperCase(),
        name,
        description,
        managerName,
        bankName,
        bankAccount,
        isActive: true
      }
    });

    return NextResponse.json(unit, { status: 201 });
  } catch (error) {
    console.error('Error creating business unit:', error);
    
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Business unit with this code already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Unit ID is required' },
        { status: 400 }
      );
    }

    const unit = await prisma.business_units.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(unit);
  } catch (error) {
    console.error('Error updating business unit:', error);
    
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Business unit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}