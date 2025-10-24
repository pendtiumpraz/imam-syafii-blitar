import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schemas
const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['INCOME', 'EXPENSE', 'DONATION']),
  code: z.string().optional(),
  accountId: z.string().min(1, 'Account ID is required'),
  color: z.string().optional(),
  icon: z.string().optional(),
  description: z.string().optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().default(true),
})

const querySchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE', 'DONATION']).optional(),
  isActive: z.boolean().optional(),
  parentId: z.string().optional(),
  includeChildren: z.boolean().default(false),
})

// GET - Retrieve financial categories
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = querySchema.parse({
      type: searchParams.get('type') || undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      parentId: searchParams.get('parentId') || undefined,
      includeChildren: searchParams.get('includeChildren') === 'true',
    })

    const where: any = {
      isDeleted: false,
    }
    if (query.type) where.type = query.type
    if (query.isActive !== undefined) where.isActive = query.isActive
    if (query.parentId) where.parentId = query.parentId

    const categories = await prisma.financial_categories.findMany({
      where,
      orderBy: [
        { type: 'asc' },
        { name: 'asc' },
      ],
    })

    // Fetch related data separately
    const accountIds = [...new Set(categories.map(c => c.accountId))]
    const parentIds = [...new Set(categories.filter(c => c.parentId).map(c => c.parentId!))]
    const categoryIds = categories.map(c => c.id)

    const [accountsList, parents, children, transactionCounts, budgetItemCounts] = await Promise.all([
      // Fetch accounts
      accountIds.length > 0 ? prisma.financial_accounts.findMany({
        where: { id: { in: accountIds } },
      }) : [],
      // Fetch parents
      parentIds.length > 0 ? prisma.financial_categories.findMany({
        where: { id: { in: parentIds } },
      }) : [],
      // Fetch children if requested
      query.includeChildren ? prisma.financial_categories.findMany({
        where: { parentId: { in: categoryIds } },
      }) : [],
      // Count transactions per category
      Promise.all(categoryIds.map(async id => ({
        categoryId: id,
        count: await prisma.transactions.count({ where: { categoryId: id } }),
      }))),
      // Count budget items per category
      Promise.all(categoryIds.map(async id => ({
        categoryId: id,
        count: await prisma.budget_items.count({ where: { categoryId: id } }),
      }))),
    ])

    // Create Maps for efficient lookups
    const accountsMap = new Map(accountsList.map(a => [a.id, a]))
    const parentsMap = new Map(parents.map(p => [p.id, p]))

    // Type for children array
    type ChildCategory = typeof categories[number]
    const childrenMap = new Map<string, ChildCategory[]>()
    categories.forEach(c => childrenMap.set(c.id, []))
    if (query.includeChildren && children.length > 0) {
      children.forEach(child => {
        if (child.parentId) {
          const childList = childrenMap.get(child.parentId)
          if (childList) {
            childList.push(child)
          }
        }
      })
    }
    const transactionCountsMap = new Map(transactionCounts.map(tc => [tc.categoryId, tc.count]))
    const budgetItemCountsMap = new Map(budgetItemCounts.map(bc => [bc.categoryId, bc.count]))

    // Combine all data
    const categoriesWithRelations = categories.map(c => ({
      ...c,
      account: accountsMap.get(c.accountId) || null,
      parent: c.parentId ? (parentsMap.get(c.parentId) || null) : null,
      children: query.includeChildren ? (childrenMap.get(c.id) || []) : undefined,
      _count: {
        transactions: transactionCountsMap.get(c.id) || 0,
        budgetItems: budgetItemCountsMap.get(c.id) || 0,
      },
    }))

    return NextResponse.json({
      categories: categoriesWithRelations,
      total: categoriesWithRelations.length,
    })

  } catch (error: any) {
    console.error('Error fetching categories:', error)
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

// POST - Create new financial category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = categorySchema.parse(body)

    // Check if category name already exists for this type
    const existingCategory = await prisma.financial_categories.findFirst({
      where: {
        name: data.name,
        type: data.type,
      },
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name already exists for this type' },
        { status: 409 }
      )
    }

    // Verify account exists
    const account = await prisma.financial_accounts.findUnique({
      where: { id: data.accountId },
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // If parentId is provided, verify parent exists and has same type
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

      if (parent.type !== data.type) {
        return NextResponse.json(
          { error: 'Parent category must have the same type' },
          { status: 400 }
        )
      }
    }

    const category = await prisma.financial_categories.create({
      data,
    })

    // Fetch related data separately
    const [categoryAccount, categoryParent, categoryChildren, transactionCount, budgetItemCount] = await Promise.all([
      // Fetch account
      prisma.financial_accounts.findUnique({
        where: { id: category.accountId },
      }),
      // Fetch parent
      category.parentId ? prisma.financial_categories.findUnique({
        where: { id: category.parentId },
      }) : null,
      // Fetch children (will be empty for new category)
      prisma.financial_categories.findMany({
        where: { parentId: category.id },
      }),
      // Count transactions (will be 0 for new category)
      prisma.transactions.count({
        where: { categoryId: category.id },
      }),
      // Count budget items (will be 0 for new category)
      prisma.budget_items.count({
        where: { categoryId: category.id },
      }),
    ])

    // Combine all data
    const categoryWithRelations = {
      ...category,
      account: categoryAccount,
      parent: categoryParent,
      children: categoryChildren,
      _count: {
        transactions: transactionCount,
        budgetItems: budgetItemCount,
      },
    }

    return NextResponse.json(categoryWithRelations, { status: 201 })

  } catch (error: any) {
    console.error('Error creating category:', error)
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