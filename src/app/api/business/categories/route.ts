import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { softDelete, forceDelete } from '@/lib/soft-delete'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
})

const updateCategorySchema = createCategorySchema.partial()

// GET - Retrieve product categories
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const hierarchical = searchParams.get('hierarchical') === 'true'

    const where = includeInactive ? {} : { isActive: true }

    if (hierarchical) {
      // Return hierarchical structure
      const categories = await prisma.product_categories.findMany({
        where: { ...where, parentId: null },
        include: {
          children: {
            where,
            include: {
              _count: {
                select: {
                  products: { where: { isActive: true } },
                },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
          _count: {
            select: {
              products: { where: { isActive: true } },
            },
          },
        },
        orderBy: { sortOrder: 'asc' },
      })

      return NextResponse.json({ categories })
    } else {
      // Return flat list
      const categories = await prisma.product_categories.findMany({
        where,
        include: {
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              products: { where: { isActive: true } },
              children: true,
            },
          },
        },
        orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }],
      })

      return NextResponse.json({ categories })
    }

  } catch (error: any) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createCategorySchema.parse(body)

    // Check if category name already exists
    const existingCategory = await prisma.product_categories.findFirst({
      where: { 
        name: data.name,
        parentId: data.parentId || null,
      },
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category name already exists in this level' },
        { status: 409 }
      )
    }

    // Verify parent exists if specified
    if (data.parentId) {
      const parent = await prisma.product_categories.findFirst({
        where: {
          id: data.parentId,
          isActive: true,
        },
      })

      if (!parent) {
        return NextResponse.json(
          { error: 'Parent category not found or inactive' },
          { status: 404 }
        )
      }
    }

    const category = await prisma.product_categories.create({
      data,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        category,
        message: 'Category created successfully',
      },
      { status: 201 }
    )

  } catch (error: any) {
    console.error('Error creating category:', error)
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

// PUT - Update category
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      )
    }

    const data = updateCategorySchema.parse(updateData)

    // Check if category exists
    const existingCategory = await prisma.product_categories.findUnique({
      where: { id },
    })

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if name is being updated and already exists elsewhere
    if (data.name && data.name !== existingCategory.name) {
      const nameExists = await prisma.product_categories.findFirst({
        where: {
          name: data.name,
          parentId: data.parentId !== undefined ? data.parentId : existingCategory.parentId,
          id: { not: id },
        },
      })

      if (nameExists) {
        return NextResponse.json(
          { error: 'Category name already exists in this level' },
          { status: 409 }
        )
      }
    }

    // Verify parent if being updated (prevent circular reference)
    if (data.parentId) {
      if (data.parentId === id) {
        return NextResponse.json(
          { error: 'Category cannot be its own parent' },
          { status: 400 }
        )
      }

      const parent = await prisma.product_categories.findFirst({
        where: {
          id: data.parentId,
          isActive: true,
        },
      })

      if (!parent) {
        return NextResponse.json(
          { error: 'Parent category not found or inactive' },
          { status: 404 }
        )
      }
    }

    const category = await prisma.product_categories.update({
      where: { id },
      data,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    })

    return NextResponse.json({
      category,
      message: 'Category updated successfully',
    })

  } catch (error: any) {
    console.error('Error updating category:', error)
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

// DELETE - Delete category
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      )
    }

    // Check if category exists
    const category = await prisma.product_categories.findUnique({
      where: { id },
      include: {
        products: { where: { isActive: true } },
        children: { where: { isActive: true } },
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if category has active products or children
    if (category.products.length > 0 || category.children.length > 0) {
      // Soft delete if has products or children
      const updatedCategory = await softDelete(
        prisma.product_categories,
        { id },
        session.user.id
      )

      return NextResponse.json({
        category: updatedCategory,
        message: 'Category deactivated successfully (has products or subcategories)',
      })
    } else {
      // Hard delete if no products or children
      await forceDelete(prisma.product_categories, { id })

      return NextResponse.json({
        message: 'Category deleted successfully',
      })
    }

  } catch (error: any) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}