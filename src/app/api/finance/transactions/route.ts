import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Validation schemas
const createTransactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE', 'DONATION']),
  categoryId: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  reference: z.string().optional(),
  date: z.string().datetime('Invalid date format'),
  dueDate: z.string().datetime().optional(),
  tags: z.array(z.string()).default([]),
  attachments: z.array(z.string()).default([]),
  notes: z.string().optional(),
})

const querySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  type: z.enum(['INCOME', 'EXPENSE', 'DONATION']).optional(),
  categoryId: z.string().optional(),
  status: z.enum(['DRAFT', 'POSTED', 'CANCELLED', 'REVERSED']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['date', 'amount', 'createdAt']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Helper function to generate transaction number
async function generateTransactionNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.transactions.count({
    where: {
      transactionNo: {
        startsWith: `TRX-${year}-`,
      },
    },
  })
  return `TRX-${year}-${String(count + 1).padStart(4, '0')}`
}

// Helper function to create journal entries for double-entry bookkeeping
async function createJournalEntry(transaction: any, userId: string) {
  const category = await prisma.financial_categories.findUnique({
    where: { id: transaction.categoryId },
    include: { account: true },
  })

  if (!category) {
    throw new Error('Category not found')
  }

  // Generate journal entry number
  const year = new Date().getFullYear()
  const jeCount = await prisma.journal_entries.count({
    where: {
      entryNo: {
        startsWith: `JE-${year}-`,
      },
    },
  })
  const entryNo = `JE-${year}-${String(jeCount + 1).padStart(4, '0')}`

  // Determine accounts for double-entry
  let debitAccountId: string
  let creditAccountId: string

  // Get Cash/Bank account (assuming code '1001' for main cash account)
  const cashAccount = await prisma.financial_accounts.findFirst({
    where: { code: '1001' },
  })

  if (!cashAccount) {
    throw new Error('Cash account not found')
  }

  if (transaction.type === 'INCOME' || transaction.type === 'DONATION') {
    // Debit: Cash, Credit: Income/Donation Account
    debitAccountId = cashAccount.id
    creditAccountId = category.accountId
  } else {
    // Expense: Debit: Expense Account, Credit: Cash
    debitAccountId = category.accountId
    creditAccountId = cashAccount.id
  }

  // Create journal entry
  const journalEntry = await prisma.journal_entries.create({
    data: {
      entryNo,
      transactionId: transaction.id,
      description: transaction.description,
      date: transaction.date,
      reference: transaction.reference || transaction.transactionNo,
      totalDebit: transaction.amount,
      totalCredit: transaction.amount,
      isBalanced: true,
      createdBy: userId,
      entries: {
        create: [
          {
            accountId: debitAccountId,
            debitAmount: transaction.amount,
            creditAmount: 0,
            description: `${transaction.type}: ${transaction.description}`,
            lineOrder: 1,
          },
          {
            accountId: creditAccountId,
            debitAmount: 0,
            creditAmount: transaction.amount,
            description: `${transaction.type}: ${transaction.description}`,
            lineOrder: 2,
          },
        ],
      },
    },
    include: {
      entries: {
        include: {
          account: true,
        },
      },
    },
  })

  // Update account balances
  await prisma.financial_accounts.update({
    where: { id: debitAccountId },
    data: {
      balance: {
        increment: transaction.amount,
      },
    },
  })

  await prisma.financial_accounts.update({
    where: { id: creditAccountId },
    data: {
      balance: {
        decrement: transaction.amount,
      },
    },
  })

  return journalEntry
}

// GET - Retrieve transactions with advanced filtering
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
      categoryId: searchParams.get('categoryId') || undefined,
      status: searchParams.get('status') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'date',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
    })

    const skip = (query.page - 1) * query.limit

    // Build where clause
    const where: any = {}

    // Filter out soft deleted records
    where.isDeleted = false

    if (query.type) where.type = query.type
    if (query.categoryId) where.categoryId = query.categoryId
    if (query.status) where.status = query.status
    if (query.dateFrom || query.dateTo) {
      where.date = {}
      if (query.dateFrom) where.date.gte = new Date(query.dateFrom)
      if (query.dateTo) where.date.lte = new Date(query.dateTo)
    }
    if (query.search) {
      where.OR = [
        { description: { contains: query.search, mode: 'insensitive' } },
        { transactionNo: { contains: query.search, mode: 'insensitive' } },
        { reference: { contains: query.search, mode: 'insensitive' } },
        { notes: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    const [transactions, total, summary] = await Promise.all([
      prisma.transactions.findMany({
        where,
        include: {
          category: {
            include: {
              account: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          journalEntry: {
            include: {
              entries: {
                include: {
                  account: true,
                },
              },
            },
          },
        },
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
        skip,
        take: query.limit,
      }),
      prisma.transactions.count({ where }),
      // Get summary statistics
      prisma.transactions.groupBy({
        by: ['type', 'status'],
        _sum: {
          amount: true,
        },
        _count: true,
        where,
      }),
    ])

    return NextResponse.json({
      transactions,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
      summary: summary.reduce((acc, item) => {
        const key = `${item.type.toLowerCase()}${item.status !== 'POSTED' ? '_' + item.status.toLowerCase() : ''}`
        acc[key] = {
          count: item._count,
          total: item._sum?.amount || 0,
        }
        return acc
      }, {} as any),
    })

  } catch (error: any) {
    console.error('Error fetching transactions:', error)
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

// POST - Create new transaction with double-entry bookkeeping
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createTransactionSchema.parse(body)

    // Verify category exists and is active
    const category = await prisma.financial_categories.findFirst({
      where: {
        id: data.categoryId,
        type: data.type,
        isActive: true,
      },
      include: {
        account: true,
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found or inactive' },
        { status: 404 }
      )
    }

    // Generate transaction number
    const transactionNo = await generateTransactionNumber()

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create transaction
      const transaction = await tx.transactions.create({
        data: {
          transactionNo,
          type: data.type,
          categoryId: data.categoryId,
          amount: data.amount,
          description: data.description,
          reference: data.reference,
          date: new Date(data.date),
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          tags: JSON.stringify(data.tags),
          attachments: JSON.stringify(data.attachments),
          notes: data.notes,
          createdBy: session.user.id,
        },
        include: {
          category: {
            include: {
              account: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      })

      // Create journal entry for double-entry bookkeeping
      const journalEntry = await createJournalEntry(transaction, session.user.id)

      return {
        transaction,
        journalEntry,
      }
    })

    return NextResponse.json(
      {
        transaction: result.transaction,
        journalEntry: result.journalEntry,
        message: 'Transaction created successfully',
      },
      { status: 201 }
    )

  } catch (error: any) {
    console.error('Error creating transaction:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}