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

    const categories = await prisma.financialCategory.findMany({
      where,
      include: {
        account: true,
        parent: true,
        children: query.includeChildren,
        _count: {
          select: {
            transactions: true,
            budgetItems: true,
          },
        },
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({ 
      categories,
      total: categories.length,
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
    const existingCategory = await prisma.financialCategory.findFirst({
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
    const account = await prisma.financialAccount.findUnique({
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
      const parent = await prisma.financialCategory.findUnique({
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

    const category = await prisma.financialCategory.create({
      data,
      include: {
        account: true,
        parent: true,
        children: true,
        _count: {
          select: {
            transactions: true,
            budgetItems: true,
          },
        },
      },
    })

    return NextResponse.json(category, { status: 201 })

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