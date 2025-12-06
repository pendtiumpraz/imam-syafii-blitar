import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('academicYear') || '2024/2025';

    let settings = await prisma.ppdb_settings.findFirst({
      where: { academicYear }
    });
    
    // If settings don't exist, create default settings
    if (!settings) {
      const defaultFeeDetails = {
        KB_TK: { registrationFee: 100000, enrollmentFee: 500000, monthlyFee: 300000, uniformFee: 250000, booksFee: 150000 },
        TK: { registrationFee: 100000, enrollmentFee: 500000, monthlyFee: 300000, uniformFee: 250000, booksFee: 150000 },
        SD: { registrationFee: 150000, enrollmentFee: 750000, monthlyFee: 400000, uniformFee: 350000, booksFee: 200000 },
        SMP: { registrationFee: 200000, enrollmentFee: 1000000, monthlyFee: 500000, uniformFee: 400000, booksFee: 250000 },
        SMA: { registrationFee: 200000, enrollmentFee: 1000000, monthlyFee: 500000, uniformFee: 400000, booksFee: 250000 },
        PONDOK: { registrationFee: 250000, enrollmentFee: 1500000, monthlyFee: 750000, uniformFee: 500000, booksFee: 300000 }
      };

      settings = await prisma.ppdb_settings.create({
        data: {
          academicYear,
          openDate: new Date('2024-01-01'),
          closeDate: new Date('2024-03-31'),
          quotaKBTK: 30,
          quotaTK: 30,
          quotaSD: 60,
          quotaSMP: 40,
          quotaSMA: 40,
          quotaPondok: 50,
          registrationFeeKBTK: 100000,
          registrationFeeTK: 100000,
          registrationFeeSD: 150000,
          registrationFeeSMP: 200000,
          registrationFeeSMA: 200000,
          registrationFeePondok: 250000,
          feeDetails: JSON.stringify(defaultFeeDetails),
          testEnabled: true,
          testPassScore: 60,
          interviewEnabled: true,
          interviewPassScore: 70,
          requiredDocs: JSON.stringify([
            { name: 'Pas Foto 3x4', required: true },
            { name: 'Akta Kelahiran', required: true },
            { name: 'Kartu Keluarga', required: true },
            { name: 'Ijazah/Raport Terakhir', required: true },
            { name: 'Surat Keterangan Sehat', required: false }
          ]),
          isActive: true
        }
      });
    }
    
    // Get current registration statistics
    const stats = {
      KB_TK: { registered: 0, accepted: 0, enrolled: 0 },
      TK: { registered: 0, accepted: 0, enrolled: 0 },
      SD: { registered: 0, accepted: 0, enrolled: 0 },
      SMP: { registered: 0, accepted: 0, enrolled: 0 },
      SMA: { registered: 0, accepted: 0, enrolled: 0 },
      PONDOK: { registered: 0, accepted: 0, enrolled: 0 }
    };
    
    for (const level of ['KB_TK', 'TK', 'SD', 'SMP', 'SMA', 'PONDOK']) {
      const [registered, accepted, enrolled] = await Promise.all([
        prisma.ppdb_registrations.count({
          where: { level, academicYear, status: { not: 'DRAFT' } }
        }),
        prisma.ppdb_registrations.count({
          where: { level, academicYear, status: 'ACCEPTED' }
        }),
        prisma.ppdb_registrations.count({
          where: { level, academicYear, status: 'ENROLLED' }
        })
      ]);
      
      stats[level as keyof typeof stats] = { registered, accepted, enrolled };
    }
    
    return NextResponse.json({
      settings,
      stats
    });
  } catch (error) {
    console.error('Error fetching PPDB settings:', error);
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
    const { academicYear, ...updateData } = body;
    
    if (!academicYear) {
      return NextResponse.json(
        { error: 'Academic year is required' },
        { status: 400 }
      );
    }
    
    // Parse dates if provided as strings
    if (updateData.openDate) {
      updateData.openDate = new Date(updateData.openDate);
    }
    if (updateData.closeDate) {
      updateData.closeDate = new Date(updateData.closeDate);
    }
    
    // Stringify requiredDocs if it's an array
    if (Array.isArray(updateData.requiredDocs)) {
      updateData.requiredDocs = JSON.stringify(updateData.requiredDocs);
    }
    
    // Stringify feeDetails if it's an object
    if (updateData.feeDetails && typeof updateData.feeDetails === 'object') {
      updateData.feeDetails = JSON.stringify(updateData.feeDetails);
    }
    
    const existingSettings = await prisma.ppdb_settings.findFirst({
      where: { academicYear }
    });

    let settings;
    if (existingSettings) {
      settings = await prisma.ppdb_settings.update({
        where: { id: existingSettings.id },
        data: updateData
      });
    } else {
      settings = await prisma.ppdb_settings.create({
        data: {
          academicYear,
          openDate: updateData.openDate || new Date('2024-01-01'),
          closeDate: updateData.closeDate || new Date('2024-03-31'),
          ...updateData
        }
      });
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating PPDB settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}