import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schemas
const budgetItemSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  budgetAmount: z.number().positive('Budget amount must be positive'),
  notes: z.string().optional(),
})

const createBudgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required'),
  type: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']).default('ANNUAL'),
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
  description: z.string().optional(),
  items: z.array(budgetItemSchema).min(1, 'At least one budget item is required'),
})

const querySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  type: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED']).optional(),
  year: z.number().optional(),
  includeItems: z.boolean().default(false),
  includeActuals: z.boolean().default(false),
})

// Helper function to calculate budget actuals
async function calculateBudgetActuals(budgetId: string, budget: any) {
  const budgetItems = await prisma.budgetItem.findMany({
    where: { budgetId },
    include: {
      category: true,
    },
  })

  // Get actual transactions for the budget period
  const actualTransactions = await prisma.transaction.groupBy({
    by: ['categoryId'],
    _sum: {
      amount: true,
    },
    where: {
      status: 'POSTED',
      date: {
        gte: new Date(budget.startDate),
        lte: new Date(budget.endDate),
      },
      categoryId: {
        in: budgetItems.map(item => item.categoryId),
      },
    },
  })

  // Create a map of actual amounts by category
  const actualMap = new Map(
    actualTransactions.map(tx => [tx.categoryId, tx._sum.amount || 0])
  )

  // Update budget items with actuals
  const updates = budgetItems.map(async (item) => {
    const actualAmount = actualMap.get(item.categoryId) || 0
    const variance = actualAmount - item.budgetAmount
    const percentage = item.budgetAmount > 0 ? (actualAmount / item.budgetAmount) * 100 : 0

    return prisma.budgetItem.update({
      where: { id: item.id },
      data: {
        actualAmount,
        variance,
        percentage,
      },
    })
  })

  await Promise.all(updates)

  return budgetItems.map(item => ({
    ...item,
    actualAmount: actualMap.get(item.categoryId) || 0,
    variance: (actualMap.get(item.categoryId) || 0) - item.budgetAmount,
    percentage: item.budgetAmount > 0 ? ((actualMap.get(item.categoryId) || 0) / item.budgetAmount) * 100 : 0,
  }))
}

// GET - Retrieve budgets
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
      status: searchParams.get('status') || undefined,
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
      includeItems: searchParams.get('includeItems') === 'true',
      includeActuals: searchParams.get('includeActuals') === 'true',
    })

    const skip = (query.page - 1) * query.limit

    // Build where clause
    const where: any = {
      isDeleted: false,
    }
    if (query.type) where.type = query.type
    if (query.status) where.status = query.status
    if (query.year) {
      const startOfYear = new Date(query.year, 0, 1)
      const endOfYear = new Date(query.year, 11, 31)
      where.startDate = {
        gte: startOfYear,
        lte: endOfYear,
      }
    }

    const [budgets, total] = await Promise.all([
      prisma.budget.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          items: query.includeItems ? {
            include: {
              category: {
                include: {
                  account: true,
                },
              },
            },
          } : false,
          _count: {
            select: {
              items: true,
              reports: true,
            },
          },
        },
        orderBy: [
          { startDate: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: query.limit,
      }),
      prisma.budget.count({ where }),
    ])

    // Calculate actuals if requested
    if (query.includeActuals) {
      for (const budget of budgets) {
        if (budget.items) {
          await calculateBudgetActuals(budget.id, budget)
        }
      }
    }

    // Calculate summary statistics
    const summary = await prisma.budget.groupBy({
      by: ['status', 'type'],
      _count: true,
      _sum: {
        totalBudget: true,
      },
      where,
    })

    return NextResponse.json({
      budgets,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
      summary: summary.reduce((acc, item) => {
        const key = `${item.type.toLowerCase()}_${item.status.toLowerCase()}`
        acc[key] = {
          count: item._count,
          totalBudget: item._sum.totalBudget || 0,
        }
        return acc
      }, {} as any),
    })

  } catch (error: any) {
    console.error('Error fetching budgets:', error)
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

// POST - Create new budget
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createBudgetSchema.parse(body)

    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    // Validate date range
    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Check for overlapping active budgets of the same type
    const overlappingBudget = await prisma.budget.findFirst({
      where: {
        type: data.type,
        status: 'ACTIVE',
        OR: [
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: startDate } },
            ],
          },
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: endDate } },
            ],
          },
          {
            AND: [
              { startDate: { gte: startDate } },
              { endDate: { lte: endDate } },
            ],
          },
        ],
      },
    })

    if (overlappingBudget) {
      return NextResponse.json(
        { error: 'An active budget already exists for this period' },
        { status: 409 }
      )
    }

    // Verify all categories exist and are active
    const categoryIds = data.items.map(item => item.categoryId)
    const categories = await prisma.financialCategory.findMany({
      where: {
        id: { in: categoryIds },
        isActive: true,
      },
    })

    if (categories.length !== categoryIds.length) {
      return NextResponse.json(
        { error: 'One or more categories not found or inactive' },
        { status: 404 }
      )
    }

    // Calculate total budget
    const totalBudget = data.items.reduce((sum, item) => sum + item.budgetAmount, 0)

    // Create budget with items
    const budget = await prisma.budget.create({
      data: {
        name: data.name,
        type: data.type,
        startDate,
        endDate,
        totalBudget,
        description: data.description,
        createdBy: session.user.id,
        items: {
          create: data.items.map(item => ({
            categoryId: item.categoryId,
            budgetAmount: item.budgetAmount,
            notes: item.notes,
          })),
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        items: {
          include: {
            category: {
              include: {
                account: true,
              },
            },
          },
        },
        _count: {
          select: {
            items: true,
            reports: true,
          },
        },
      },
    })

    return NextResponse.json({
      budget,
      message: 'Budget created successfully',
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating budget:', error)
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