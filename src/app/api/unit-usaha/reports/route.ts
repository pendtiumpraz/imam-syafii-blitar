import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// Helper to calculate profit metrics
function calculateProfitMetrics(revenue: Decimal, expenses: Decimal, purchaseCost: Decimal) {
  const grossProfit = revenue.minus(purchaseCost);
  const netProfit = revenue.minus(expenses);
  const profitMargin = revenue.gt(0) 
    ? netProfit.div(revenue).mul(100) 
    : new Decimal(0);
    
  return { grossProfit, netProfit, profitMargin };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get('unitId');
    const unitCode = searchParams.get('unitCode');
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const status = searchParams.get('status');

    const whereConditions: any = {};
    
    if (unitId) {
      whereConditions.unitId = unitId;
    } else if (unitCode) {
      // Get unit by code first
      const unit = await prisma.business_units.findFirst({
        where: { code: unitCode }
      });
      if (unit) {
        whereConditions.unitId = unit.id;
      }
    }
    
    if (year) {
      whereConditions.year = parseInt(year);
    }
    
    if (month) {
      whereConditions.month = parseInt(month);
    }
    
    if (status) {
      whereConditions.status = status;
    }

    const reports = await prisma.business_unit_reports.findMany({
      where: whereConditions,
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    });

    // Calculate totals if multiple reports
    if (reports.length > 1) {
      const totals = reports.reduce((acc, report) => {
        return {
          totalRevenue: acc.totalRevenue.plus(report.revenue),
          totalExpenses: acc.totalExpenses.plus(report.expenses),
          totalNetProfit: acc.totalNetProfit.plus(report.netProfit),
          avgProfitMargin: acc.avgProfitMargin.plus(report.profitMargin)
        };
      }, {
        totalRevenue: new Decimal(0),
        totalExpenses: new Decimal(0),
        totalNetProfit: new Decimal(0),
        avgProfitMargin: new Decimal(0)
      });
      
      totals.avgProfitMargin = totals.avgProfitMargin.div(reports.length);
      
      return NextResponse.json({
        reports,
        summary: {
          totalRevenue: totals.totalRevenue.toNumber(),
          totalExpenses: totals.totalExpenses.toNumber(),
          totalNetProfit: totals.totalNetProfit.toNumber(),
          avgProfitMargin: totals.avgProfitMargin.toNumber(),
          reportCount: reports.length
        }
      });
    }

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Error fetching business unit reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      unitId,
      unitCode,
      year,
      month,
      initialCapital,
      revenue,
      expenses,
      purchaseCost = 0,
      operationalCost = 0,
      salaryCost = 0,
      maintenanceCost = 0,
      otherCost = 0,
      salesRevenue = 0,
      serviceRevenue = 0,
      otherRevenue = 0,
      inventoryValue,
      totalTransactions = 0,
      totalCustomers = 0,
      totalItems = 0,
      revenueTarget,
      notes,
      highlights
    } = body;

    // Get unit if code provided
    let actualUnitId = unitId;
    if (!actualUnitId && unitCode) {
      const unit = await prisma.business_units.findFirst({
        where: { code: unitCode }
      });
      if (!unit) {
        return NextResponse.json(
          { error: 'Business unit not found' },
          { status: 404 }
        );
      }
      actualUnitId = unit.id;
    }

    // Check if report already exists
    const existing = await prisma.business_unit_reports.findFirst({
      where: {
        unitId: actualUnitId,
        year: parseInt(year),
        month: parseInt(month)
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Report already exists for this period' },
        { status: 409 }
      );
    }

    // Calculate totals
    const totalRevenue = new Decimal(salesRevenue)
      .plus(serviceRevenue)
      .plus(otherRevenue);
      
    const totalExpenses = new Decimal(purchaseCost)
      .plus(operationalCost)
      .plus(salaryCost)
      .plus(maintenanceCost)
      .plus(otherCost);

    const { grossProfit, netProfit, profitMargin } = calculateProfitMetrics(
      totalRevenue,
      totalExpenses,
      new Decimal(purchaseCost)
    );

    const targetAchievement = revenueTarget 
      ? totalRevenue.div(new Decimal(revenueTarget)).mul(100)
      : null;

    const period = `${year}-${String(month).padStart(2, '0')}`;

    const report = await prisma.business_unit_reports.create({
      data: {
        unitId: actualUnitId,
        year: parseInt(year),
        month: parseInt(month),
        period,
        initialCapital: new Decimal(initialCapital || 0),
        revenue: totalRevenue,
        expenses: totalExpenses,
        purchaseCost: new Decimal(purchaseCost),
        operationalCost: new Decimal(operationalCost),
        salaryCost: new Decimal(salaryCost),
        maintenanceCost: new Decimal(maintenanceCost),
        otherCost: new Decimal(otherCost),
        salesRevenue: new Decimal(salesRevenue),
        serviceRevenue: new Decimal(serviceRevenue),
        otherRevenue: new Decimal(otherRevenue),
        grossProfit,
        netProfit,
        profitMargin,
        inventoryValue: inventoryValue ? new Decimal(inventoryValue) : null,
        totalTransactions,
        totalCustomers,
        totalItems,
        revenueTarget: revenueTarget ? new Decimal(revenueTarget) : null,
        targetAchievement,
        notes,
        highlights,
        status: 'DRAFT'
      }
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Error creating business unit report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, action, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      );
    }

    // Handle status actions
    if (action === 'submit') {
      const report = await prisma.business_unit_reports.update({
        where: { id },
        data: {
          status: 'SUBMITTED',
          submittedAt: new Date(),
          submittedBy: session.user.id
        }
      });
      return NextResponse.json(report);
    }

    if (action === 'approve') {
      if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      const report = await prisma.business_unit_reports.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: session.user.id
        }
      });
      return NextResponse.json(report);
    }

    // Regular update
    if (updateData.revenue !== undefined || updateData.expenses !== undefined) {
      // Recalculate profit metrics
      const current = await prisma.business_unit_reports.findUnique({
        where: { id }
      });
      
      if (!current) {
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        );
      }

      const revenue = updateData.revenue !== undefined 
        ? new Decimal(updateData.revenue) 
        : current.revenue;
        
      const expenses = updateData.expenses !== undefined
        ? new Decimal(updateData.expenses)
        : current.expenses;
        
      const purchaseCost = updateData.purchaseCost !== undefined
        ? new Decimal(updateData.purchaseCost)
        : current.purchaseCost;

      const { grossProfit, netProfit, profitMargin } = calculateProfitMetrics(
        revenue,
        expenses,
        purchaseCost
      );

      updateData.grossProfit = grossProfit;
      updateData.netProfit = netProfit;
      updateData.profitMargin = profitMargin;
    }

    const report = await prisma.business_unit_reports.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error updating business unit report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}