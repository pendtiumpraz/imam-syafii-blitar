import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { softDelete } from '@/lib/soft-delete'

// Validation schema for updates
const updateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  code: z.string().optional(),
  accountId: z.string().min(1, 'Account ID is required').optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  description: z.string().optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().optional(),
})

interface RouteParams {
  params: {
    id: string
  }
}

// GET - Retrieve single financial category
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const category = await prisma.financial_categories.findUnique({
      where: { id: params.id },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Fetch related data separately
    const [account, parent, children, transactions, budgetItems, transactionCount, budgetItemCount, childrenCount] = await Promise.all([
      // Fetch account
      category.accountId ? prisma.financial_accounts.findUnique({
        where: { id: category.accountId },
      }) : null,
      // Fetch parent
      category.parentId ? prisma.financial_categories.findUnique({
        where: { id: category.parentId },
      }) : null,
      // Fetch children
      prisma.financial_categories.findMany({
        where: { parentId: params.id },
      }),
      // Fetch recent transactions
      prisma.transactions.findMany({
        where: { categoryId: params.id },
        select: {
          id: true,
          transactionNo: true,
          amount: true,
          description: true,
          date: true,
          status: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // Fetch budget items
      prisma.budget_items.findMany({
        where: { categoryId: params.id },
      }),
      // Count transactions
      prisma.transactions.count({
        where: { categoryId: params.id },
      }),
      // Count budget items
      prisma.budget_items.count({
        where: { categoryId: params.id },
      }),
      // Count children
      prisma.financial_categories.count({
        where: { parentId: params.id },
      }),
    ])

    // Fetch budgets for budget items
    const budgetIds = budgetItems.map(bi => bi.budgetId).filter((id): id is string => id !== null)
    const budgets = budgetIds.length > 0 ? await prisma.budgets.findMany({
      where: { id: { in: budgetIds } },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
      },
    }) : []
    const budgetsMap = new Map(budgets.map(b => [b.id, b]))

    // Combine budget items with their budgets
    const budgetItemsWithBudgets = budgetItems.map(bi => ({
      ...bi,
      budget: bi.budgetId ? budgetsMap.get(bi.budgetId) : null,
    }))

    // Combine all data
    const categoryWithRelations = {
      ...category,
      account,
      parent,
      children,
      transactions,
      budgetItems: budgetItemsWithBudgets,
      _count: {
        transactions: transactionCount,
        budgetItems: budgetItemCount,
        children: childrenCount,
      },
    }

    return NextResponse.json(categoryWithRelations)

  } catch (error: any) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update financial category
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = updateCategorySchema.parse(body)

    // Check if category exists
    const existingCategory = await prisma.financial_categories.findUnique({
      where: { id: params.id },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // If name is being updated, check for duplicates
    if (data.name && data.name !== existingCategory.name) {
      const duplicate = await prisma.financial_categories.findFirst({
        where: {
          name: data.name,
          type: existingCategory.type,
          id: { not: params.id },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'Category with this name already exists for this type' },
          { status: 409 }
        )
      }
    }

    // If accountId is being updated, verify account exists
    if (data.accountId) {
      const account = await prisma.financial_accounts.findUnique({
        where: { id: data.accountId },
      })

      if (!account) {
        return NextResponse.json(
          { error: 'Account not found' },
          { status: 404 }
        )
      }
    }

    // If parentId is being updated, verify parent exists and prevent circular references
    if (data.parentId !== undefined) {
      if (data.parentId === params.id) {
        return NextResponse.json(
          { error: 'Category cannot be its own parent' },
          { status: 400 }
        )
      }

      if (data.parentId) {
        const parent = await prisma.financial_categories.findUnique({
          where: { id: data.parentId },
        })

        if (!parent) {
          return NextResponse.json(
            { error: 'Parent category not found' },
            { status: 404 }
          )
        }

        if (parent.type !== existingCategory.type) {
          return NextResponse.json(
            { error: 'Parent category must have the same type' },
            { status: 400 }
          )
        }

        // Check for circular reference (prevent parent from being a descendant)
        const checkCircular = async (parentId: string, targetId: string): Promise<boolean> => {
          const parent = await prisma.financial_categories.findUnique({
            where: { id: parentId },
            select: { parentId: true },
          })
          
          if (!parent) return false
          if (parent.parentId === targetId) return true
          if (parent.parentId) return await checkCircular(parent.parentId, targetId)
          return false
        }

        const isCircular = await checkCircular(data.parentId, params.id)
        if (isCircular) {
          return NextResponse.json(
            { error: 'Circular reference detected' },
            { status: 400 }
          )
        }
      }
    }

    const category = await prisma.financial_categories.update({
      where: { id: params.id },
      data,
    })

    // Fetch related data separately
    const [account, parent, children, transactionCount, budgetItemCount] = await Promise.all([
      // Fetch account
      category.accountId ? prisma.financial_accounts.findUnique({
        where: { id: category.accountId },
      }) : null,
      // Fetch parent
      category.parentId ? prisma.financial_categories.findUnique({
        where: { id: category.parentId },
      }) : null,
      // Fetch children
      prisma.financial_categories.findMany({
        where: { parentId: params.id },
      }),
      // Count transactions
      prisma.transactions.count({
        where: { categoryId: params.id },
      }),
      // Count budget items
      prisma.budget_items.count({
        where: { categoryId: params.id },
      }),
    ])

    // Combine all data
    const categoryWithRelations = {
      ...category,
      account,
      parent,
      children,
      _count: {
        transactions: transactionCount,
        budgetItems: budgetItemCount,
      },
    }

    return NextResponse.json(categoryWithRelations)

  } catch (error: any) {
    console.error('Error updating category:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete financial category
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if category exists
    const category = await prisma.financial_categories.findUnique({
      where: { id: params.id },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Fetch related data separately to check constraints
    const [children, transactionCount, budgetItemCount] = await Promise.all([
      prisma.financial_categories.findMany({
        where: { parentId: params.id },
      }),
      prisma.transactions.count({
        where: { categoryId: params.id },
      }),
      prisma.budget_items.count({
        where: { categoryId: params.id },
      }),
    ])

    // Check if category has transactions or budget items
    if (transactionCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with existing transactions' },
        { status: 409 }
      )
    }

    if (budgetItemCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with existing budget items' },
        { status: 409 }
      )
    }

    // Check if category has children
    if (children.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with subcategories. Delete subcategories first.' },
        { status: 409 }
      )
    }

    // Soft delete the financial category
    await softDelete(prisma.financial_categories, { id: params.id }, session.user.id)

    return NextResponse.json({ message: 'Category deleted successfully' })

  } catch (error: any) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}