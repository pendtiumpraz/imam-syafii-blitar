import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('academicYear') || '2024/2025';
    
    let settings = await prisma.ppdb_settings.findUnique({
      where: { academicYear }
    });
    
    // If settings don't exist, create default settings
    if (!settings) {
      settings = await prisma.ppdb_settings.create({
        data: {
          academicYear,
          openDate: new Date('2024-01-01'),
          closeDate: new Date('2024-03-31'),
          quotaTK: 30,
          quotaSD: 60,
          quotaSMP: 40,
          quotaPondok: 50,
          registrationFeeTK: 100000,
          registrationFeeSD: 150000,
          registrationFeeSMP: 200000,
          registrationFeePondok: 250000,
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
      TK: { registered: 0, accepted: 0, enrolled: 0 },
      SD: { registered: 0, accepted: 0, enrolled: 0 },
      SMP: { registered: 0, accepted: 0, enrolled: 0 },
      PONDOK: { registered: 0, accepted: 0, enrolled: 0 }
    };
    
    for (const level of ['TK', 'SD', 'SMP', 'PONDOK']) {
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
    
    const settings = await prisma.ppdb_settings.upsert({
      where: { academicYear },
      update: updateData,
      create: {
        academicYear,
        openDate: updateData.openDate || new Date('2024-01-01'),
        closeDate: updateData.closeDate || new Date('2024-03-31'),
        ...updateData
      }
    });
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating PPDB settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}