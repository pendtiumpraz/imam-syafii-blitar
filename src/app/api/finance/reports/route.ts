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
  // Get income categories
  const incomeCategories = await prisma.financial_categories.findMany({
    where: {
      type: { in: ['INCOME', 'DONATION'] },
      isActive: true,
    },
  })

  // Get transactions for income categories
  const incomeTransactions = await prisma.transactions.findMany({
    where: {
      categoryId: { in: incomeCategories.map(c => c.id) },
      status: 'POSTED',
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: includeDetails ? {
      id: true,
      transactionNo: true,
      amount: true,
      description: true,
      date: true,
      categoryId: true,
    } : {
      amount: true,
      categoryId: true,
    },
  })

  // Get accounts for income categories
  const incomeAccountIds = incomeCategories.map(c => c.accountId)
  const incomeAccounts = await prisma.financial_accounts.findMany({
    where: { id: { in: incomeAccountIds } },
  })

  // Get expense categories
  const expenseCategories = await prisma.financial_categories.findMany({
    where: {
      type: 'EXPENSE',
      isActive: true,
    },
  })

  // Get transactions for expense categories
  const expenseTransactions = await prisma.transactions.findMany({
    where: {
      categoryId: { in: expenseCategories.map(c => c.id) },
      status: 'POSTED',
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: includeDetails ? {
      id: true,
      transactionNo: true,
      amount: true,
      description: true,
      date: true,
      categoryId: true,
    } : {
      amount: true,
      categoryId: true,
    },
  })

  // Get accounts for expense categories
  const expenseAccountIds = expenseCategories.map(c => c.accountId)
  const expenseAccounts = await prisma.financial_accounts.findMany({
    where: { id: { in: expenseAccountIds } },
  })

  // Calculate totals
  const totalIncome = incomeTransactions.reduce((sum, tx) => sum + tx.amount, 0)
  const totalExpenses = expenseTransactions.reduce((sum, tx) => sum + tx.amount, 0)

  const netIncome = totalIncome - totalExpenses

  return {
    type: 'INCOME_STATEMENT',
    period: { startDate, endDate },
    summary: {
      totalIncome,
      totalExpenses,
      netIncome,
    },
    income: incomeCategories.map(category => {
      const categoryTransactions = incomeTransactions.filter(tx => tx.categoryId === category.id)
      const account = incomeAccounts.find(a => a.id === category.accountId)
      return {
        category: {
          id: category.id,
          name: category.name,
          type: category.type,
          account,
        },
        total: categoryTransactions.reduce((sum, tx) => sum + tx.amount, 0),
        transactionCount: categoryTransactions.length,
        ...(includeDetails ? { transactions: categoryTransactions } : {}),
      }
    }),
    expenses: expenseCategories.map(category => {
      const categoryTransactions = expenseTransactions.filter(tx => tx.categoryId === category.id)
      const account = expenseAccounts.find(a => a.id === category.accountId)
      return {
        category: {
          id: category.id,
          name: category.name,
          type: category.type,
          account,
        },
        total: categoryTransactions.reduce((sum, tx) => sum + tx.amount, 0),
        transactionCount: categoryTransactions.length,
        ...(includeDetails ? { transactions: categoryTransactions } : {}),
      }
    }),
  }
}

async function generateBalanceSheet(asOfDate: Date) {
  // Get all accounts with their current balances
  const accounts = await prisma.financial_accounts.findMany({
    where: { isActive: true },
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
  const cashAccount = await prisma.financial_accounts.findFirst({
    where: { code: '1001' }, // Main cash account
  })

  if (!cashAccount) {
    throw new Error('Cash account not found')
  }

  // Get journal entry lines affecting cash account
  const journalLines = await prisma.journal_entry_lines.findMany({
    where: {
      accountId: cashAccount.id,
    },
  })

  // Get journal entries
  const journalIds = journalLines.map(l => l.journalId)
  const journals = await prisma.journal_entries.findMany({
    where: {
      id: { in: journalIds },
      status: 'POSTED',
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      date: 'asc',
    },
  })

  // Get transactions for journals
  const transactionIds = journals.filter(j => j.transactionId).map(j => j.transactionId!)
  const transactions = await prisma.transactions.findMany({
    where: {
      id: { in: transactionIds },
    },
  })

  // Get categories for transactions
  const categoryIds = transactions.map(t => t.categoryId)
  const categories = await prisma.financial_categories.findMany({
    where: {
      id: { in: categoryIds },
    },
  })

  // Categorize cash flows
  const operatingActivities: any[] = []
  const investingActivities: any[] = []
  const financingActivities: any[] = []

  journalLines.forEach(line => {
    const journal = journals.find(j => j.id === line.journalId)
    if (!journal) return

    const transaction = transactions.find(t => t.id === journal.transactionId)
    const category = transaction ? categories.find(c => c.id === transaction.categoryId) : undefined

    const netAmount = line.debitAmount - line.creditAmount
    const activity = {
      date: journal.date,
      description: journal.description,
      reference: journal.reference,
      amount: netAmount,
      transaction: transaction ? {
        ...transaction,
        category,
      } : undefined,
    }

    // Categorize based on transaction type
    if (transaction?.type === 'INCOME' || transaction?.type === 'EXPENSE') {
      operatingActivities.push(activity)
    } else if (transaction?.type === 'DONATION') {
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
  const budget = await prisma.budgets.findUnique({
    where: { id: budgetId },
  })

  if (!budget) {
    throw new Error('Budget not found')
  }

  // Get budget items
  const budgetItems = await prisma.budget_items.findMany({
    where: { budgetId },
  })

  // Get categories for budget items
  const categoryIds = budgetItems.map(item => item.categoryId)
  const categories = await prisma.financial_categories.findMany({
    where: { id: { in: categoryIds } },
  })

  // Get accounts for categories
  const accountIds = categories.map(c => c.accountId)
  const accounts = await prisma.financial_accounts.findMany({
    where: { id: { in: accountIds } },
  })

  // Get transactions for budget period
  const transactions = await prisma.transactions.findMany({
    where: {
      categoryId: { in: categoryIds },
      status: 'POSTED',
      date: {
        gte: budget.startDate,
        lte: budget.endDate,
      },
    },
    select: includeDetails ? {
      id: true,
      transactionNo: true,
      amount: true,
      description: true,
      date: true,
      categoryId: true,
    } : {
      amount: true,
      categoryId: true,
    },
  })

  // Calculate actual amounts for each budget item
  const reportItems = budgetItems.map(item => {
    const category = categories.find(c => c.id === item.categoryId)!
    const account = accounts.find(a => a.id === category.accountId)
    const actualTransactions = transactions.filter(tx => tx.categoryId === item.categoryId)

    const actualAmount = actualTransactions.reduce((sum, tx) => sum + tx.amount, 0)
    const variance = actualAmount - item.budgetAmount
    const variancePercent = item.budgetAmount > 0 ? (variance / item.budgetAmount) * 100 : 0

    return {
      category: {
        id: category.id,
        name: category.name,
        type: category.type,
        account,
      },
      budgetAmount: item.budgetAmount,
      actualAmount,
      variance,
      variancePercent,
      status: Math.abs(variancePercent) > 10 ? 'SIGNIFICANT' : 'NORMAL',
      ...(includeDetails ? { transactions: actualTransactions } : {}),
    }
  })

  const totalBudget = budgetItems.reduce((sum, item) => sum + item.budgetAmount, 0)
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
      prisma.financial_reports.findMany({
        where,
        orderBy: [
          { createdAt: 'desc' },
        ],
        skip,
        take: query.limit,
      }),
      prisma.financial_reports.count({ where }),
    ])

    // Get creators for reports
    const creatorIds = [...new Set(reports.map(r => r.createdBy))]
    const creators = await prisma.users.findMany({
      where: { id: { in: creatorIds } },
      select: {
        id: true,
        name: true,
        username: true,
      },
    })

    // Get budgets for reports
    const budgetIds = [...new Set(reports.filter(r => r.budgetId).map(r => r.budgetId!))]
    const budgets = await prisma.budgets.findMany({
      where: { id: { in: budgetIds } },
      select: {
        id: true,
        name: true,
        type: true,
      },
    })

    // Parse JSON data for each report and add creator and budget
    const reportsWithParsedData = reports.map(report => ({
      ...report,
      data: JSON.parse(report.data),
      creator: creators.find(c => c.id === report.createdBy),
      budget: report.budgetId ? budgets.find(b => b.id === report.budgetId) : null,
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
      const budget = await prisma.budgets.findUnique({
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
    const report = await prisma.financial_reports.create({
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
    })

    // Get creator info
    const creator = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        username: true,
      },
    })

    // Get budget info if applicable
    const budget = data.budgetId ? await prisma.budgets.findUnique({
      where: { id: data.budgetId },
      select: {
        id: true,
        name: true,
        type: true,
      },
    }) : null

    return NextResponse.json({
      report: {
        ...report,
        data: reportData,
        creator,
        budget,
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