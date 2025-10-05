import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schemas
const generateReportSchema = z.object({
  name: z.string().min(1, 'Report name is required'),
  type: z.enum(['INCOME_STATEMENT', 'BALANCE_SHEET', 'CASH_FLOW', 'BUDGET_VARIANCE']),
  period: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM']),
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
  budgetId: z.string().optional(),
  includeDetails: z.boolean().default(false),
  format: z.enum(['JSON', 'PDF', 'EXCEL']).default('JSON'),
})

const querySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  type: z.enum(['INCOME_STATEMENT', 'BALANCE_SHEET', 'CASH_FLOW', 'BUDGET_VARIANCE']).optional(),
  period: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM']).optional(),
  year: z.number().optional(),
  status: z.enum(['DRAFT', 'GENERATED', 'EXPORTED']).optional(),
})

// Helper functions for generating different types of reports
async function generateIncomeStatement(startDate: Date, endDate: Date, includeDetails: boolean) {
  // Get income categories and transactions
  const incomeCategories = await prisma.financialCategory.findMany({
    where: { 
      type: { in: ['INCOME', 'DONATION'] },
      isActive: true,
    },
    include: {
      transactions: {
        where: {
          status: 'POSTED',
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        ...(includeDetails ? {
          select: {
            id: true,
            transactionNo: true,
            amount: true,
            description: true,
            date: true,
          },
        } : {}),
      },
      account: true,
    },
  })

  // Get expense categories and transactions
  const expenseCategories = await prisma.financialCategory.findMany({
    where: { 
      type: 'EXPENSE',
      isActive: true,
    },
    include: {
      transactions: {
        where: {
          status: 'POSTED',
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        ...(includeDetails ? {
          select: {
            id: true,
            transactionNo: true,
            amount: true,
            description: true,
            date: true,
          },
        } : {}),
      },
      account: true,
    },
  })

  // Calculate totals
  const totalIncome = incomeCategories.reduce((sum, category) => 
    sum + category.transactions.reduce((catSum, tx) => catSum + tx.amount, 0), 0
  )

  const totalExpenses = expenseCategories.reduce((sum, category) => 
    sum + category.transactions.reduce((catSum, tx) => catSum + tx.amount, 0), 0
  )

  const netIncome = totalIncome - totalExpenses

  return {
    type: 'INCOME_STATEMENT',
    period: { startDate, endDate },
    summary: {
      totalIncome,
      totalExpenses,
      netIncome,
    },
    income: incomeCategories.map(category => ({
      category: {
        id: category.id,
        name: category.name,
        type: category.type,
        account: category.account,
      },
      total: category.transactions.reduce((sum, tx) => sum + tx.amount, 0),
      transactionCount: category.transactions.length,
      ...(includeDetails ? { transactions: category.transactions } : {}),
    })),
    expenses: expenseCategories.map(category => ({
      category: {
        id: category.id,
        name: category.name,
        type: category.type,
        account: category.account,
      },
      total: category.transactions.reduce((sum, tx) => sum + tx.amount, 0),
      transactionCount: category.transactions.length,
      ...(includeDetails ? { transactions: category.transactions } : {}),
    })),
  }
}

async function generateBalanceSheet(asOfDate: Date) {
  // Get all accounts with their current balances
  const accounts = await prisma.financialAccount.findMany({
    where: { isActive: true },
    include: {
      parent: true,
      children: true,
    },
    orderBy: [
      { type: 'asc' },
      { code: 'asc' },
    ],
  })

  // Group accounts by type
  const accountsByType = accounts.reduce((acc, account) => {
    if (!acc[account.type]) acc[account.type] = []
    acc[account.type].push(account)
    return acc
  }, {} as any)

  // Calculate totals by type
  const totals = Object.keys(accountsByType).reduce((acc, type) => {
    acc[type] = accountsByType[type].reduce((sum: number, account: any) => sum + account.balance, 0)
    return acc
  }, {} as any)

  return {
    type: 'BALANCE_SHEET',
    asOfDate,
    assets: {
      accounts: accountsByType.ASSET || [],
      total: totals.ASSET || 0,
    },
    liabilities: {
      accounts: accountsByType.LIABILITY || [],
      total: totals.LIABILITY || 0,
    },
    equity: {
      accounts: accountsByType.EQUITY || [],
      total: totals.EQUITY || 0,
    },
    totals,
    isBalanced: (totals.ASSET || 0) === ((totals.LIABILITY || 0) + (totals.EQUITY || 0)),
  }
}

async function generateCashFlowStatement(startDate: Date, endDate: Date, includeDetails: boolean) {
  // Get cash account
  const cashAccount = await prisma.financialAccount.findFirst({
    where: { code: '1001' }, // Main cash account
  })

  if (!cashAccount) {
    throw new Error('Cash account not found')
  }

  // Get journal entry lines affecting cash account
  const journalLines = await prisma.journalEntryLine.findMany({
    where: {
      accountId: cashAccount.id,
      journal: {
        status: 'POSTED',
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    },
    include: {
      journal: {
        include: {
          transaction: {
            include: {
              category: true,
            },
          },
        },
      },
    },
    orderBy: {
      journal: { date: 'asc' },
    },
  })

  // Categorize cash flows
  const operatingActivities: any[] = []
  const investingActivities: any[] = []
  const financingActivities: any[] = []

  journalLines.forEach(line => {
    const netAmount = line.debitAmount - line.creditAmount
    const activity = {
      date: line.journal.date,
      description: line.journal.description,
      reference: line.journal.reference,
      amount: netAmount,
      transaction: line.journal.transaction,
    }

    // Categorize based on transaction type and category
    if (line.journal.transaction?.type === 'INCOME' || line.journal.transaction?.type === 'EXPENSE') {
      operatingActivities.push(activity)
    } else if (line.journal.transaction?.type === 'DONATION') {
      financingActivities.push(activity)
    } else {
      // Default to operating for now
      operatingActivities.push(activity)
    }
  })

  const totalOperating = operatingActivities.reduce((sum, activity) => sum + activity.amount, 0)
  const totalInvesting = investingActivities.reduce((sum, activity) => sum + activity.amount, 0)
  const totalFinancing = financingActivities.reduce((sum, activity) => sum + activity.amount, 0)

  const netCashFlow = totalOperating + totalInvesting + totalFinancing

  return {
    type: 'CASH_FLOW',
    period: { startDate, endDate },
    summary: {
      totalOperating,
      totalInvesting,
      totalFinancing,
      netCashFlow,
    },
    operatingActivities: includeDetails ? operatingActivities : { total: totalOperating, count: operatingActivities.length },
    investingActivities: includeDetails ? investingActivities : { total: totalInvesting, count: investingActivities.length },
    financingActivities: includeDetails ? financingActivities : { total: totalFinancing, count: financingActivities.length },
  }
}

async function generateBudgetVarianceReport(budgetId: string, includeDetails: boolean) {
  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: {
      items: {
        include: {
          category: {
            include: {
              account: true,
              transactions: {
                where: {
                  status: 'POSTED',
                },
              },
            },
          },
        },
      },
    },
  })

  if (!budget) {
    throw new Error('Budget not found')
  }

  // Calculate actual amounts for each budget item
  const reportItems = budget.items.map(item => {
    const actualTransactions = item.category.transactions.filter(tx => 
      tx.date >= budget.startDate && tx.date <= budget.endDate
    )
    
    const actualAmount = actualTransactions.reduce((sum, tx) => sum + tx.amount, 0)
    const variance = actualAmount - item.budgetAmount
    const variancePercent = item.budgetAmount > 0 ? (variance / item.budgetAmount) * 100 : 0

    return {
      category: {
        id: item.category.id,
        name: item.category.name,
        type: item.category.type,
        account: item.category.account,
      },
      budgetAmount: item.budgetAmount,
      actualAmount,
      variance,
      variancePercent,
      status: Math.abs(variancePercent) > 10 ? 'SIGNIFICANT' : 'NORMAL',
      ...(includeDetails ? { transactions: actualTransactions } : {}),
    }
  })

  const totalBudget = budget.items.reduce((sum, item) => sum + item.budgetAmount, 0)
  const totalActual = reportItems.reduce((sum, item) => sum + item.actualAmount, 0)
  const totalVariance = totalActual - totalBudget
  const totalVariancePercent = totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0

  return {
    type: 'BUDGET_VARIANCE',
    budget: {
      id: budget.id,
      name: budget.name,
      type: budget.type,
      period: { startDate: budget.startDate, endDate: budget.endDate },
    },
    summary: {
      totalBudget,
      totalActual,
      totalVariance,
      totalVariancePercent,
    },
    items: reportItems,
  }
}

// GET - Retrieve reports
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = querySchema.parse({
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
      type: searchParams.get('type') || undefined,
      period: searchParams.get('period') || undefined,
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
      status: searchParams.get('status') || undefined,
    })

    const skip = (query.page - 1) * query.limit

    // Build where clause
    const where: any = {
      isDeleted: false,
    }
    if (query.type) where.type = query.type
    if (query.period) where.period = query.period
    if (query.status) where.status = query.status
    if (query.year) {
      const startOfYear = new Date(query.year, 0, 1)
      const endOfYear = new Date(query.year, 11, 31)
      where.startDate = {
        gte: startOfYear,
        lte: endOfYear,
      }
    }

    const [reports, total] = await Promise.all([
      prisma.financialReport.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          budget: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
        orderBy: [
          { createdAt: 'desc' },
        ],
        skip,
        take: query.limit,
      }),
      prisma.financialReport.count({ where }),
    ])

    // Parse JSON data for each report
    const reportsWithParsedData = reports.map(report => ({
      ...report,
      data: JSON.parse(report.data),
    }))

    return NextResponse.json({
      reports: reportsWithParsedData,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    })

  } catch (error: any) {
    console.error('Error fetching reports:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Generate new report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = generateReportSchema.parse(body)

    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    // Validate date range
    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // If budget variance report, verify budget exists
    if (data.type === 'BUDGET_VARIANCE' && !data.budgetId) {
      return NextResponse.json(
        { error: 'Budget ID is required for budget variance report' },
        { status: 400 }
      )
    }

    if (data.budgetId) {
      const budget = await prisma.budget.findUnique({
        where: { id: data.budgetId },
      })

      if (!budget) {
        return NextResponse.json(
          { error: 'Budget not found' },
          { status: 404 }
        )
      }
    }

    // Generate report data based on type
    let reportData: any
    switch (data.type) {
      case 'INCOME_STATEMENT':
        reportData = await generateIncomeStatement(startDate, endDate, data.includeDetails)
        break
      case 'BALANCE_SHEET':
        reportData = await generateBalanceSheet(endDate)
        break
      case 'CASH_FLOW':
        reportData = await generateCashFlowStatement(startDate, endDate, data.includeDetails)
        break
      case 'BUDGET_VARIANCE':
        reportData = await generateBudgetVarianceReport(data.budgetId!, data.includeDetails)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        )
    }

    // Save report to database
    const report = await prisma.financialReport.create({
      data: {
        name: data.name,
        type: data.type,
        period: data.period,
        startDate,
        endDate,
        budgetId: data.budgetId,
        data: JSON.stringify(reportData),
        createdBy: session.user.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        budget: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    })

    return NextResponse.json({
      report: {
        ...report,
        data: reportData,
      },
      message: 'Report generated successfully',
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error generating report:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}