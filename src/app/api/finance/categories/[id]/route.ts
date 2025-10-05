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

    const category = await prisma.financialCategory.findUnique({
      where: { id: params.id },
      include: {
        account: true,
        parent: true,
        children: true,
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            transactionNo: true,
            amount: true,
            description: true,
            date: true,
            status: true,
          },
        },
        budgetItems: {
          include: {
            budget: {
              select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
              },
            },
          },
        },
        _count: {
          select: {
            transactions: true,
            budgetItems: true,
            children: true,
          },
        },
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(category)

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
    const existingCategory = await prisma.financialCategory.findUnique({
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
      const duplicate = await prisma.financialCategory.findFirst({
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
      const account = await prisma.financialAccount.findUnique({
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
        const parent = await prisma.financialCategory.findUnique({
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
          const parent = await prisma.financialCategory.findUnique({
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

    const category = await prisma.financialCategory.update({
      where: { id: params.id },
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

    return NextResponse.json(category)

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
    const category = await prisma.financialCategory.findUnique({
      where: { id: params.id },
      include: {
        children: true,
        _count: {
          select: {
            transactions: true,
            budgetItems: true,
          },
        },
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if category has transactions or budget items
    if (category._count.transactions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with existing transactions' },
        { status: 409 }
      )
    }

    if (category._count.budgetItems > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with existing budget items' },
        { status: 409 }
      )
    }

    // Check if category has children
    if (category.children.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with subcategories. Delete subcategories first.' },
        { status: 409 }
      )
    }

    // Soft delete the financial category
    await softDelete(prisma.financialCategory, { id: params.id }, session.user.id)

    return NextResponse.json({ message: 'Category deleted successfully' })

  } catch (error: any) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}