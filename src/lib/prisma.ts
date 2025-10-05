import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL || '',
      },
    },
  })
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

// Soft delete middleware
prisma.$use(async (params, next) => {
  // Check if model has soft delete fields
  const softDeleteModels = [
    // CRITICAL priority models
    'User', 'Student', 'Teacher', 'ParentAccount', 'Transaction', 'JournalEntry',
    'Payment', 'Donation', 'Bill', 'BillPayment', 'SPPBilling', 'SPPPayment',
    'Grade', 'Attendance', 'ExamResult', 'ReportCard', 'HafalanRecord',
    'HafalanProgress', 'HafalanSession', 'Alumni', 'Registration', 'PPDBRegistration',
    'AuditTrail', 'SecurityAuditLog', 'FinancialAccount', 'FinancialCategory',
    'Budget', 'FinancialReport',
    // HIGH priority models
    'Class', 'AcademicYear', 'Semester', 'Subject', 'Curriculum', 'Exam',
    'Schedule', 'Course', 'Video', 'Ebook', 'Activity', 'Message',
    'Announcement', 'Question', 'Answer', 'DonationCampaign', 'Product', 'Supplier'
  ];

  if (softDeleteModels.includes(params.model || '')) {
    // Convert delete to update (soft delete)
    if (params.action === 'delete') {
      params.action = 'update';
      params.args['data'] = {
        deletedAt: new Date(),
        isDeleted: true
      };
    }

    if (params.action === 'deleteMany') {
      params.action = 'updateMany';
      params.args['data'] = {
        deletedAt: new Date(),
        isDeleted: true
      };
    }

    // Auto-filter deleted records
    if (params.action === 'findUnique' || params.action === 'findFirst') {
      params.args.where = { ...params.args.where, isDeleted: false };
    }

    if (params.action === 'findMany') {
      if (params.args.where !== undefined) {
        if (params.args.where.isDeleted === undefined) {
          params.args.where['isDeleted'] = false;
        }
      } else {
        params.args['where'] = { isDeleted: false };
      }
    }
  }

  return next(params);
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma