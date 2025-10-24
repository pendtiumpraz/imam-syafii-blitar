import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const generateReportSchema = z.object({
  type: z.enum([
    'MONTHLY_COLLECTION',
    'OUTSTANDING_BILLS', 
    'PAYMENT_ANALYSIS',
    'GRADE_WISE_COLLECTION',
    'OVERDUE_ANALYSIS',
    'PAYMENT_METHOD_ANALYSIS',
    'STUDENT_PAYMENT_HISTORY',
    'REVENUE_FORECAST'
  ]),
  name: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  filters: z.object({
    institutionTypes: z.array(z.enum(['TK', 'SD', 'PONDOK'])).optional(),
    grades: z.array(z.string()).optional(),
    billTypeIds: z.array(z.string()).optional(),
    studentIds: z.array(z.string()).optional(),
    paymentMethods: z.array(z.string()).optional(),
    includeOverdue: z.boolean().default(true),
    includePaid: z.boolean().default(true),
    includePending: z.boolean().default(true),
  }).default({}),
});

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
    if (!session.user?.role || !['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const validated = generateReportSchema.parse(body);

    const startDate = new Date(validated.startDate);
    const endDate = new Date(validated.endDate);
    
    // Generate report name if not provided
    const reportName = validated.name || `${validated.type.replace(/_/g, ' ')} Report - ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`;

    // Create report record
    const report = await prisma.billing_reports.create({
      data: {
        name: reportName,
        type: validated.type,
        startDate,
        endDate,
        parameters: JSON.stringify(validated.filters),
        generatedBy: session.user.id,
      },
    });

    // Generate report data based on type
    let reportData;
    let summary = {};

    switch (validated.type) {
      case 'MONTHLY_COLLECTION':
        reportData = await generateMonthlyCollectionReport(prisma, startDate, endDate, validated.filters);
        break;
      case 'OUTSTANDING_BILLS':
        reportData = await generateOutstandingBillsReport(prisma, startDate, endDate, validated.filters);
        break;
      case 'PAYMENT_ANALYSIS':
        reportData = await generatePaymentAnalysisReport(prisma, startDate, endDate, validated.filters);
        break;
      case 'GRADE_WISE_COLLECTION':
        reportData = await generateGradeWiseCollectionReport(prisma, startDate, endDate, validated.filters);
        break;
      case 'OVERDUE_ANALYSIS':
        reportData = await generateOverdueAnalysisReport(prisma, startDate, endDate, validated.filters);
        break;
      case 'PAYMENT_METHOD_ANALYSIS':
        reportData = await generatePaymentMethodAnalysisReport(prisma, startDate, endDate, validated.filters);
        break;
      case 'STUDENT_PAYMENT_HISTORY':
        reportData = await generateStudentPaymentHistoryReport(prisma, startDate, endDate, validated.filters);
        break;
      case 'REVENUE_FORECAST':
        reportData = await generateRevenueForecastReport(prisma, startDate, endDate, validated.filters);
        break;
      default:
        throw new Error('Unsupported report type');
    }

    // Calculate summary statistics
    summary = calculateReportSummary(reportData, validated.type);

    // Update report with data
    const updatedReport = await prisma.billing_reports.update({
      where: { id: report.id },
      data: {
        data: JSON.stringify(reportData),
        summary: JSON.stringify(summary),
        status: 'COMPLETED',
        progress: 100,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Report generated successfully',
      data: {
        report: {
          id: updatedReport.id,
          name: updatedReport.name,
          type: updatedReport.type,
          status: updatedReport.status,
          startDate: updatedReport.startDate,
          endDate: updatedReport.endDate,
        },
        data: reportData,
        summary,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { default: prisma } = await import('@/lib/prisma');
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const reportId = searchParams.get('reportId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    if (reportId) {
      // Get specific report
      const report = await prisma.billing_reports.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }

      return NextResponse.json({
        data: {
          ...report,
          data: report.data ? JSON.parse(report.data) : null,
          summary: report.summary ? JSON.parse(report.summary) : {},
          parameters: report.parameters ? JSON.parse(report.parameters) : {},
        },
      });
    }

    // Get list of reports
    const where: any = {};
    
    if (type) {
      where.type = type;
    }
    
    if (status) {
      where.status = status;
    }

    const [reports, total] = await Promise.all([
      prisma.billing_reports.findMany({
        where,
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          progress: true,
          startDate: true,
          endDate: true,
          generatedBy: true,
          generatedAt: true,
          completedAt: true,
          summary: true,
        },
        orderBy: {
          generatedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.billing_reports.count({ where }),
    ]);

    const processedReports = reports.map(report => ({
      ...report,
      summary: report.summary ? JSON.parse(report.summary) : {},
    }));

    return NextResponse.json({
      data: processedReports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Report generation functions
async function generateMonthlyCollectionReport(prisma: any, startDate: Date, endDate: Date, filters: any) {
  const where: any = {
    paymentDate: {
      gte: startDate,
      lte: endDate,
    },
    verificationStatus: 'VERIFIED',
  };

  if (filters.paymentMethods?.length > 0) {
    where.method = { in: filters.paymentMethods };
  }

  const payments = await prisma.bill_payments.findMany({
    where,
    include: {
      bills: {
        include: {
          students: {
            select: {
              institutionType: true,
              grade: true,
            },
          },
          bill_types: {
            select: {
              name: true,
              category: true,
            },
          },
        },
      },
    },
    orderBy: {
      paymentDate: 'asc',
    },
  });

  // Group by month
  const monthlyData = payments.reduce((acc: any, payment: any) => {
    const monthKey = payment.paymentDate.toISOString().substring(0, 7); // YYYY-MM

    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthKey,
        totalAmount: 0,
        totalPayments: 0,
        byInstitution: {},
        byBillType: {},
        byPaymentMethod: {},
      };
    }

    acc[monthKey].totalAmount += Number(payment.amount);
    acc[monthKey].totalPayments++;

    // Group by institution
    const institution = payment.bills.students.institutionType;
    acc[monthKey].byInstitution[institution] = (acc[monthKey].byInstitution[institution] || 0) + Number(payment.amount);

    // Group by bill type
    const billType = payment.bills.bill_types.name;
    acc[monthKey].byBillType[billType] = (acc[monthKey].byBillType[billType] || 0) + Number(payment.amount);

    // Group by payment method
    const method = payment.method;
    acc[monthKey].byPaymentMethod[method] = (acc[monthKey].byPaymentMethod[method] || 0) + Number(payment.amount);

    return acc;
  }, {});

  return Object.values(monthlyData);
}

async function generateOutstandingBillsReport(prisma: any, startDate: Date, endDate: Date, filters: any) {
  const where: any = {
    status: { in: ['OUTSTANDING', 'PARTIAL', 'OVERDUE'] },
    dueDate: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (filters.billTypeIds?.length > 0) {
    where.billTypeId = { in: filters.billTypeIds };
  }

  if (filters.institutionTypes?.length > 0 || filters.grades?.length > 0) {
    where.students = {};
    if (filters.institutionTypes?.length > 0) {
      where.students.institutionType = { in: filters.institutionTypes };
    }
    if (filters.grades?.length > 0) {
      where.students.grade = { in: filters.grades };
    }
  }

  const bills = await prisma.bills.findMany({
    where,
    include: {
      students: {
        select: {
          fullName: true,
          nis: true,
          institutionType: true,
          grade: true,
          fatherPhone: true,
          motherPhone: true,
        },
      },
      bill_types: {
        select: {
          name: true,
          category: true,
        },
      },
      bill_payments: {
        where: {
          verificationStatus: 'VERIFIED',
        },
        select: {
          amount: true,
          paymentDate: true,
        },
      },
    },
    orderBy: [
      { isOverdue: 'desc' },
      { dueDate: 'asc' },
    ],
  });

  return bills.map((bill: any) => ({
    billNo: bill.billNo,
    studentName: bill.students.fullName,
    studentNis: bill.students.nis,
    institutionType: bill.students.institutionType,
    grade: bill.students.grade,
    billType: bill.bill_types.name,
    originalAmount: Number(bill.originalAmount),
    paidAmount: Number(bill.paidAmount),
    remainingAmount: Number(bill.remainingAmount),
    dueDate: bill.dueDate,
    status: bill.status,
    isOverdue: bill.isOverdue,
    daysPastDue: bill.daysPastDue,
    lastPaymentDate: bill.bill_payments[0]?.paymentDate || null,
    contactInfo: {
      fatherPhone: bill.students.fatherPhone,
      motherPhone: bill.students.motherPhone,
    },
  }));
}

async function generatePaymentAnalysisReport(prisma: any, startDate: Date, endDate: Date, filters: any) {
  // This would contain complex payment analysis logic
  // For brevity, returning a basic structure
  return {
    totalPayments: 0,
    totalAmount: 0,
    averagePaymentAmount: 0,
    paymentsByMethod: {},
    paymentTrends: [],
  };
}

async function generateGradeWiseCollectionReport(prisma: any, startDate: Date, endDate: Date, filters: any) {
  // Implementation for grade-wise collection analysis
  return [];
}

async function generateOverdueAnalysisReport(prisma: any, startDate: Date, endDate: Date, filters: any) {
  // Implementation for overdue analysis
  return [];
}

async function generatePaymentMethodAnalysisReport(prisma: any, startDate: Date, endDate: Date, filters: any) {
  // Implementation for payment method analysis
  return [];
}

async function generateStudentPaymentHistoryReport(prisma: any, startDate: Date, endDate: Date, filters: any) {
  // Implementation for student payment history
  return [];
}

async function generateRevenueForecastReport(prisma: any, startDate: Date, endDate: Date, filters: any) {
  // Implementation for revenue forecasting
  return [];
}

function calculateReportSummary(data: any, reportType: string) {
  // Calculate summary based on report type and data
  switch (reportType) {
    case 'MONTHLY_COLLECTION':
      return {
        totalMonths: data.length,
        totalAmount: data.reduce((sum: number, month: any) => sum + month.totalAmount, 0),
        averageMonthlyCollection: data.length > 0 ? data.reduce((sum: number, month: any) => sum + month.totalAmount, 0) / data.length : 0,
        totalPayments: data.reduce((sum: number, month: any) => sum + month.totalPayments, 0),
      };
    case 'OUTSTANDING_BILLS':
      return {
        totalBills: data.length,
        totalOutstandingAmount: data.reduce((sum: number, bill: any) => sum + bill.remainingAmount, 0),
        overdueBills: data.filter((bill: any) => bill.isOverdue).length,
        averageOutstandingAmount: data.length > 0 ? data.reduce((sum: number, bill: any) => sum + bill.remainingAmount, 0) / data.length : 0,
      };
    default:
      return {};
  }
}