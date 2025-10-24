import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    
    if (level) {
      // Get specific level settings
      let settings = await prisma.spp_settings.findUnique({
        where: { level }
      });
      
      // Create default settings if not exists
      if (!settings) {
        const defaultFees = {
          TK: { monthly: 150000, books: 50000, uniform: 200000, activity: 25000 },
          SD: { monthly: 200000, books: 75000, uniform: 250000, activity: 30000 },
          SMP: { monthly: 250000, books: 100000, uniform: 300000, activity: 35000 },
          PONDOK: { monthly: 300000, books: 150000, uniform: 350000, activity: 50000 }
        };
        
        const levelFees = defaultFees[level as keyof typeof defaultFees] || defaultFees.SD;
        
        settings = await prisma.spp_settings.create({
          data: {
            level,
            monthlyFee: new Decimal(levelFees.monthly),
            booksFee: new Decimal(levelFees.books),
            uniformFee: new Decimal(levelFees.uniform),
            activityFee: new Decimal(levelFees.activity),
            dueDateDay: 10,
            lateFeeType: 'FIXED',
            lateFeeAmount: new Decimal(10000),
            maxLateDays: 30,
            discountSibling: new Decimal(10),
            discountOrphan: new Decimal(50),
            discountStaff: new Decimal(25),
            reminderDays: '[7, 3, 1, -1, -3, -7]',
            reminderChannels: '["WHATSAPP"]',
            isActive: true
          }
        });
      }
      
      return NextResponse.json(settings);
    } else {
      // Get all settings
      const settings = await prisma.spp_settings.findMany({
        orderBy: { level: 'asc' }
      });
      
      // Create default settings for missing levels if needed
      const existingLevels = settings.map(s => s.level);
      const allLevels = ['TK', 'SD', 'SMP', 'PONDOK'];
      const missingLevels = allLevels.filter(l => !existingLevels.includes(l));
      
      if (missingLevels.length > 0) {
        const defaultFees = {
          TK: { monthly: 150000, books: 50000, uniform: 200000, activity: 25000 },
          SD: { monthly: 200000, books: 75000, uniform: 250000, activity: 30000 },
          SMP: { monthly: 250000, books: 100000, uniform: 300000, activity: 35000 },
          PONDOK: { monthly: 300000, books: 150000, uniform: 350000, activity: 50000 }
        };
        
        for (const level of missingLevels) {
          const levelFees = defaultFees[level as keyof typeof defaultFees];
          const newSettings = await prisma.spp_settings.create({
            data: {
              level,
              monthlyFee: new Decimal(levelFees.monthly),
              booksFee: new Decimal(levelFees.books),
              uniformFee: new Decimal(levelFees.uniform),
              activityFee: new Decimal(levelFees.activity),
              dueDateDay: 10,
              lateFeeType: 'FIXED',
              lateFeeAmount: new Decimal(10000),
              maxLateDays: 30,
              discountSibling: new Decimal(10),
              discountOrphan: new Decimal(50),
              discountStaff: new Decimal(25),
              reminderDays: '[7, 3, 1, -1, -3, -7]',
              reminderChannels: '["WHATSAPP"]',
              isActive: true
            }
          });
          settings.push(newSettings);
        }
      }
      
      return NextResponse.json(settings);
    }
  } catch (error) {
    console.error('Error fetching SPP settings:', error);
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
    const { level, ...updateData } = body;
    
    if (!level) {
      return NextResponse.json(
        { error: 'Level is required' },
        { status: 400 }
      );
    }
    
    // Convert number fields to Decimal
    const decimalFields = [
      'monthlyFee', 'enrollmentFee', 'reEnrollmentFee', 'developmentFee',
      'booksFee', 'uniformFee', 'activityFee', 'examFee',
      'lateFeeAmount', 'discountSibling', 'discountOrphan', 'discountStaff'
    ];
    
    for (const field of decimalFields) {
      if (updateData[field] !== undefined) {
        updateData[field] = new Decimal(updateData[field]);
      }
    }
    
    // Stringify array fields if needed
    if (Array.isArray(updateData.reminderDays)) {
      updateData.reminderDays = JSON.stringify(updateData.reminderDays);
    }
    if (Array.isArray(updateData.reminderChannels)) {
      updateData.reminderChannels = JSON.stringify(updateData.reminderChannels);
    }
    
    const settings = await prisma.spp_settings.upsert({
      where: { level },
      update: updateData,
      create: {
        level,
        monthlyFee: new Decimal(updateData.monthlyFee || 150000),
        ...updateData
      }
    });
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating SPP settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}