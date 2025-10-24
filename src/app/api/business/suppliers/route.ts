import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Validation schemas
const createSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  code: z.string().optional(),
  contact: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  whatsapp: z.string().optional(),
  taxId: z.string().optional(), // NPWP
  bankAccount: z.string().optional(),
  paymentTerms: z.string().optional(),
  rating: z.number().min(1).max(5).default(5),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
})

const updateSupplierSchema = createSupplierSchema.partial()

const querySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  rating: z.number().min(1).max(5).optional(),
  sortBy: z.enum(['name', 'code', 'rating', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// Helper function to generate supplier code
async function generateSupplierCode(): Promise<string> {
  const count = await prisma.suppliers.count()
  return `SUP${String(count + 1).padStart(4, '0')}`
}

// GET - Retrieve suppliers with filtering and pagination
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
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      rating: searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'name',
      sortOrder: (searchParams.get('sortOrder') as any) || 'asc',
    })

    const skip = (query.page - 1) * query.limit

    // Build where clause
    const where: any = {}
    if (query.isActive !== undefined) where.isActive = query.isActive
    if (query.rating) where.rating = query.rating
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { contact: { contains: query.search, mode: 'insensitive' } },
        { address: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    const [suppliers, total, stats] = await Promise.all([
      prisma.suppliers.findMany({
        where,
        include: {
          purchaseOrders: {
            select: {
              id: true,
              orderDate: true,
              totalAmount: true,
              status: true,
            },
            orderBy: { orderDate: 'desc' },
            take: 5, // Latest 5 purchase orders
          },
          _count: {
            select: {
              purchaseOrders: true,
            },
          },
        },
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
        skip,
        take: query.limit,
      }),
      prisma.suppliers.count({ where }),
      // Get summary statistics
      Promise.all([
        prisma.suppliers.count({ where: { isActive: true } }),
        prisma.suppliers.count({ where: { isActive: false } }),
        prisma.suppliers.aggregate({
          _avg: { rating: true },
          _count: { rating: true },
        }),
        prisma.purchase_orders.aggregate({
          _sum: { totalAmount: true },
          _count: true,
          where: {
            supplier: {
              isActive: true,
            },
          },
        }),
      ]).then(([activeCount, inactiveCount, ratingStats, purchaseStats]) => ({
        activeCount,
        inactiveCount,
        averageRating: ratingStats._avg.rating || 0,
        totalPurchaseValue: purchaseStats._sum.totalAmount || 0,
        totalPurchaseOrders: purchaseStats._count,
      })),
    ])

    // Calculate additional metrics for each supplier
    const suppliersWithMetrics = suppliers.map(supplier => {
      const totalPurchaseValue = supplier.purchaseOrders.reduce(
        (sum, po) => sum + Number(po.totalAmount), 0
      )
      const activePurchaseOrders = supplier.purchaseOrders.filter(
        po => po.status !== 'CANCELLED'
      ).length
      const lastPurchaseDate = supplier.purchaseOrders[0]?.orderDate

      return {
        ...supplier,
        metrics: {
          totalPurchaseValue,
          activePurchaseOrders,
          lastPurchaseDate,
          totalPurchaseOrders: supplier._count.purchaseOrders,
        },
      }
    })

    return NextResponse.json({
      suppliers: suppliersWithMetrics,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
      summary: {
        totalSuppliers: total,
        ...stats,
      },
    })

  } catch (error: any) {
    console.error('Error fetching suppliers:', error)
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

// POST - Create new supplier
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createSupplierSchema.parse(body)

    // Generate supplier code if not provided
    if (!data.code) {
      data.code = await generateSupplierCode()
    }

    // Check if supplier code already exists
    if (data.code) {
      const existingSupplier = await prisma.suppliers.findUnique({
        where: { code: data.code },
      })

      if (existingSupplier) {
        return NextResponse.json(
          { error: 'Supplier code already exists' },
          { status: 409 }
        )
      }
    }

    // Check if email already exists (if provided)
    if (data.email) {
      const existingEmail = await prisma.suppliers.findFirst({
        where: { 
          email: data.email,
          isActive: true,
        },
      })

      if (existingEmail) {
        return NextResponse.json(
          { error: 'Email address already exists' },
          { status: 409 }
        )
      }
    }

    const supplier = await prisma.suppliers.create({
      data,
      include: {
        _count: {
          select: {
            purchaseOrders: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        supplier,
        message: 'Supplier created successfully',
      },
      { status: 201 }
    )

  } catch (error: any) {
    console.error('Error creating supplier:', error)
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