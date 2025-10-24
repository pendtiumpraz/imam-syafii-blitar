import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const querySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  productId: z.string().optional(),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'TRANSFER']).optional(),
  location: z.enum(['KOPERASI', 'KANTIN', 'KATERING', 'GUDANG']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'quantity', 'totalCost']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// GET - Retrieve inventory transactions with filtering
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
      productId: searchParams.get('productId') || undefined,
      type: searchParams.get('type') as any || undefined,
      location: searchParams.get('location') as any || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
    })

    const skip = (query.page - 1) * query.limit

    // Build where clause
    const where: any = {}
    if (query.productId) where.productId = query.productId
    if (query.type) where.type = query.type
    if (query.location) where.location = query.location
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {}
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom)
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo)
    }
    if (query.search) {
      where.OR = [
        { reference: { contains: query.search, mode: 'insensitive' } },
        { reason: { contains: query.search, mode: 'insensitive' } },
        { notes: { contains: query.search, mode: 'insensitive' } },
        { batchNo: { contains: query.search, mode: 'insensitive' } },
        { product: {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { code: { contains: query.search, mode: 'insensitive' } },
          ]
        }},
      ]
    }

    const [transactions, total, summary] = await Promise.all([
      prisma.inventory_transactions.findMany({
        where,
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
        skip,
        take: query.limit,
      }),
      prisma.inventory_transactions.count({ where }),
      // Get summary statistics
      prisma.inventory_transactions.groupBy({
        by: ['type'],
        _sum: {
          quantity: true,
          totalCost: true,
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
        acc[item.type.toLowerCase()] = {
          count: item._count,
          totalQuantity: item._sum.quantity || 0,
          totalCost: item._sum.totalCost || 0,
        }
        return acc
      }, {} as any),
    })

  } catch (error: any) {
    console.error('Error fetching inventory transactions:', error)
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