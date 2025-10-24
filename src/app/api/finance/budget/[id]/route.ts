import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { softDelete } from '@/lib/soft-delete'

// Validation schemas
const budgetItemSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  budgetAmount: z.number().positive('Budget amount must be positive'),
  notes: z.string().optional(),
})

const updateBudgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required').optional(),
  type: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']).optional(),
  startDate: z.string().datetime('Invalid start date format').optional(),
  endDate: z.string().datetime('Invalid end date format').optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED']).optional(),
  description: z.string().optional(),
  items: z.array(budgetItemSchema).optional(),
})

interface RouteParams {
  params: {
    id: string
  }
}

// Helper function to recalculate budget actuals
async function recalculateBudgetActuals(budgetId: string) {
  const budget = await prisma.budgets.findUnique({
    where: { id: budgetId },
    select: { startDate: true, endDate: true },
  })

  if (!budget) return

  const budgetItems = await prisma.budget_items.findMany({
    where: { budgetId },
  })

  // Get actual transactions for the budget period
  const actualTransactions = await prisma.transactions.groupBy({
    by: ['categoryId'],
    _sum: {
      amount: true,
    },
    where: {
      status: 'POSTED',
      date: {
        gte: budget.startDate,
        lte: budget.endDate,
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

    return prisma.budget_items.update({
      where: { id: item.id },
      data: {
        actualAmount,
        variance,
        percentage,
      },
    })
  })

  await Promise.all(updates)
}

// GET - Retrieve single budget
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const budget = await prisma.budgets.findUnique({
      where: { id: params.id },
    })

    if (!budget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      )
    }

    // Get creator
    const creator = await prisma.users.findUnique({
      where: { id: budget.createdBy },
      select: {
        id: true,
        name: true,
        username: true,
      },
    })

    // Get budget items
    const items = await prisma.budget_items.findMany({
      where: { budgetId: params.id },
    })

    // Get categories for items
    const categoryIds = items.map(i => i.categoryId)
    const categories = await prisma.financial_categories.findMany({
      where: { id: { in: categoryIds } },
    })

    // Get accounts for categories
    const accountIds = categories.map(c => c.accountId)
    const accounts = await prisma.financial_accounts.findMany({
      where: { id: { in: accountIds } },
    })

    // Sort items by category type and name
    const itemsWithRelations = items.map(item => {
      const category = categories.find(c => c.id === item.categoryId)
      const account = category ? accounts.find(a => a.id === category.accountId) : null
      return {
        ...item,
        category: category ? {
          ...category,
          account,
        } : null,
      }
    }).sort((a, b) => {
      const typeCompare = (a.category?.type || '').localeCompare(b.category?.type || '')
      if (typeCompare !== 0) return typeCompare
      return (a.category?.name || '').localeCompare(b.category?.name || '')
    })

    // Get reports
    const reports = await prisma.financial_reports.findMany({
      where: {
        budgetId: params.id,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        type: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Recalculate actuals for active budgets
    if (budget.status === 'ACTIVE') {
      await recalculateBudgetActuals(params.id)

      // Fetch updated budget items
      const updatedItems = await prisma.budget_items.findMany({
        where: { budgetId: params.id },
      })

      // Update items with actual values
      const updatedItemsWithRelations = updatedItems.map(item => {
        const originalItem = itemsWithRelations.find(i => i.id === item.id)
        return {
          ...originalItem,
          ...item,
        }
      })

      return NextResponse.json({
        ...budget,
        creator,
        items: updatedItemsWithRelations,
        reports,
        _count: {
          items: items.length,
          reports: reports.length,
        },
      })
    }

    return NextResponse.json({
      ...budget,
      creator,
      items: itemsWithRelations,
      reports,
      _count: {
        items: items.length,
        reports: reports.length,
      },
    })

  } catch (error: any) {
    console.error('Error fetching budget:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update budget
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = updateBudgetSchema.parse(body)

    // Check if budget exists
    const existingBudget = await prisma.budgets.findUnique({
      where: { id: params.id },
    })

    if (!existingBudget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      )
    }

    // Validate date range if provided
    let startDate = existingBudget.startDate
    let endDate = existingBudget.endDate

    if (data.startDate) startDate = new Date(data.startDate)
    if (data.endDate) endDate = new Date(data.endDate)

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Check for overlapping active budgets if status is being set to active
    if (data.status === 'ACTIVE' || (existingBudget.status === 'ACTIVE' && (data.startDate || data.endDate))) {
      const overlappingBudget = await prisma.budgets.findFirst({
        where: {
          id: { not: params.id },
          type: data.type || existingBudget.type,
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
    }

    // Prepare base update data
    const updateData: any = {}
    if (data.name) updateData.name = data.name
    if (data.type) updateData.type = data.type
    if (data.startDate) updateData.startDate = new Date(data.startDate)
    if (data.endDate) updateData.endDate = new Date(data.endDate)
    if (data.status) updateData.status = data.status
    if (data.description !== undefined) updateData.description = data.description

    // Handle approval info for activation
    if (data.status === 'ACTIVE' && existingBudget.status !== 'ACTIVE') {
      updateData.approvedBy = session.user.id
      updateData.approvedAt = new Date()
    }

    // Start transaction for updating budget and items
    const result = await prisma.$transaction(async (tx) => {
      // Update budget items if provided
      if (data.items) {
        // Verify all categories exist and are active
        const categoryIds = data.items.map(item => item.categoryId)
        const categories = await tx.financial_categories.findMany({
          where: {
            id: { in: categoryIds },
            isActive: true,
          },
        })

        if (categories.length !== categoryIds.length) {
          throw new Error('One or more categories not found or inactive')
        }

        // Calculate new total budget
        const totalBudget = data.items.reduce((sum, item) => sum + item.budgetAmount, 0)
        updateData.totalBudget = totalBudget

        // Delete existing items
        await tx.budget_items.deleteMany({
          where: { budgetId: params.id },
        })

        // Create new items
        await tx.budget_items.createMany({
          data: data.items.map(item => ({
            budgetId: params.id,
            categoryId: item.categoryId,
            budgetAmount: item.budgetAmount,
            notes: item.notes,
          })),
        })
      }

      // Update budget
      const updatedBudget = await tx.budgets.update({
        where: { id: params.id },
        data: updateData,
      })

      return updatedBudget
    })

    // Get updated budget with relations
    const creator = await prisma.users.findUnique({
      where: { id: result.createdBy },
      select: {
        id: true,
        name: true,
        username: true,
      },
    })

    const items = await prisma.budget_items.findMany({
      where: { budgetId: params.id },
    })

    const categoryIds = items.map(i => i.categoryId)
    const categories = await prisma.financial_categories.findMany({
      where: { id: { in: categoryIds } },
    })

    const accountIds = categories.map(c => c.accountId)
    const accounts = await prisma.financial_accounts.findMany({
      where: { id: { in: accountIds } },
    })

    const itemsWithRelations = items.map(item => {
      const category = categories.find(c => c.id === item.categoryId)
      const account = category ? accounts.find(a => a.id === category.accountId) : null
      return {
        ...item,
        category: category ? {
          ...category,
          account,
        } : null,
      }
    }).sort((a, b) => {
      const typeCompare = (a.category?.type || '').localeCompare(b.category?.type || '')
      if (typeCompare !== 0) return typeCompare
      return (a.category?.name || '').localeCompare(b.category?.name || '')
    })

    const reports = await prisma.financial_reports.findMany({
      where: {
        budgetId: params.id,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        type: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Recalculate actuals if budget is active
    if (result.status === 'ACTIVE') {
      await recalculateBudgetActuals(params.id)
    }

    return NextResponse.json({
      budget: {
        ...result,
        creator,
        items: itemsWithRelations,
        reports,
        _count: {
          items: items.length,
          reports: reports.length,
        },
      },
      message: 'Budget updated successfully',
    })

  } catch (error: any) {
    console.error('Error updating budget:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    if (error.message.includes('categories not found')) {
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

// DELETE - Delete budget
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if budget exists
    const budget = await prisma.budgets.findUnique({
      where: { id: params.id },
    })

    if (!budget) {
      return NextResponse.json(
        { error: 'Budget not found' },
        { status: 404 }
      )
    }

    // Prevent deletion of active budgets
    if (budget.status === 'ACTIVE') {
      return NextResponse.json(
        { error: 'Cannot delete active budget. Please close it first.' },
        { status: 409 }
      )
    }

    // Check for associated reports
    const reportCount = await prisma.financial_reports.count({
      where: {
        budgetId: params.id,
        isDeleted: false,
      },
    })

    // Prevent deletion if there are associated reports
    if (reportCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete budget with associated reports' },
        { status: 409 }
      )
    }

    // Soft delete budget
    await softDelete(prisma.budgets, { id: params.id }, session.user.id)

    return NextResponse.json({
      message: 'Budget soft deleted successfully',
    })

  } catch (error: any) {
    console.error('Error deleting budget:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}