import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Validation schemas
const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  code: z.string().min(1, 'Product code/SKU is required'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  price: z.number().positive('Price must be positive'),
  cost: z.number().min(0).default(0),
  stock: z.number().min(0).default(0),
  minStock: z.number().min(0).default(5),
  unit: z.string().default('pcs'),
  image: z.string().optional(),
  brand: z.string().optional(),
  supplier: z.string().optional(),
  location: z.enum(['KOPERASI', 'KANTIN', 'KATERING', 'UMUM']).default('UMUM'),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
})

const updateProductSchema = createProductSchema.partial()

const querySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  location: z.enum(['KOPERASI', 'KANTIN', 'KATERING', 'UMUM']).optional(),
  isActive: z.boolean().optional(),
  lowStock: z.boolean().optional(), // Filter products below minimum stock
  sortBy: z.enum(['name', 'code', 'price', 'stock', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// Helper function to generate product code if not provided
async function generateProductCode(categoryId: string): Promise<string> {
  const category = await prisma.product_categories.findUnique({
    where: { id: categoryId },
    select: { name: true },
  })
  
  const categoryPrefix = category?.name.substring(0, 3).toUpperCase() || 'PRD'
  const count = await prisma.products.count({
    where: {
      code: {
        startsWith: categoryPrefix,
      },
    },
  })
  return `${categoryPrefix}${String(count + 1).padStart(4, '0')}`
}

// GET - Retrieve products with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = querySchema.parse({
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      search: searchParams.get('search') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      location: searchParams.get('location') as any || undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      lowStock: searchParams.get('lowStock') ? searchParams.get('lowStock') === 'true' : undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'name',
      sortOrder: (searchParams.get('sortOrder') as any) || 'asc',
    })

    const skip = (query.page - 1) * query.limit

    // Build where clause
    const where: any = {}
    if (query.categoryId) where.categoryId = query.categoryId
    if (query.location) where.location = query.location
    if (query.isActive !== undefined) where.isActive = query.isActive
    if (query.lowStock) {
      where.stock = { lt: prisma.products.fields.minStock }
    }
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { brand: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    const [products, total, categories, lowStockCount] = await Promise.all([
      prisma.products.findMany({
        where,
        include: {
          category: true,
          inventoryRecords: {
            select: {
              quantity: true,
              location: true,
            },
          },
          _count: {
            select: {
              saleItems: true,
            },
          },
        },
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
        skip,
        take: query.limit,
      }),
      prisma.products.count({ where }),
      // Get categories for filter options
      prisma.product_categories.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      // Get low stock count for dashboard
      prisma.products.count({
        where: {
          isActive: true,
          stock: { lt: prisma.products.fields.minStock },
        },
      }),
    ])

    // Calculate total inventory value
    const totalValue = products.reduce((sum, product) => {
      return sum + (Number(product.price) * product.stock)
    }, 0)

    return NextResponse.json({
      products: products.map(product => ({
        ...product,
        tags: JSON.parse(product.tags),
        salesCount: product._count.saleItems,
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
      summary: {
        totalProducts: total,
        totalValue,
        lowStockCount,
        categories: categories.length,
      },
      categories,
    })

  } catch (error: any) {
    console.error('Error fetching products:', error)
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

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createProductSchema.parse(body)

    // Check if product code already exists
    const existingProduct = await prisma.products.findUnique({
      where: { code: data.code },
    })

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product code already exists' },
        { status: 409 }
      )
    }

    // Verify category exists
    const category = await prisma.product_categories.findFirst({
      where: {
        id: data.categoryId,
        isActive: true,
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found or inactive' },
        { status: 404 }
      )
    }

    // Create product with initial inventory record
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.products.create({
        data: {
          ...data,
          tags: JSON.stringify(data.tags),
        },
        include: {
          category: true,
        },
      })

      // Create initial inventory record if stock > 0
      if (data.stock > 0) {
        await tx.inventory.create({
          data: {
            productId: product.id,
            quantity: data.stock,
            location: data.location,
            unitCost: data.cost,
            lastUpdated: new Date(),
          },
        })

        // Create inventory transaction for initial stock
        await tx.inventory_transactions.create({
          data: {
            productId: product.id,
            type: 'IN',
            quantity: data.stock,
            location: data.location,
            unitCost: data.cost,
            totalCost: data.cost * data.stock,
            reference: 'Initial Stock',
            reason: 'Product creation with initial stock',
          },
        })
      }

      return product
    })

    return NextResponse.json(
      {
        product: {
          ...result,
          tags: JSON.parse(result.tags),
        },
        message: 'Product created successfully',
      },
      { status: 201 }
    )

  } catch (error: any) {
    console.error('Error creating product:', error)
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