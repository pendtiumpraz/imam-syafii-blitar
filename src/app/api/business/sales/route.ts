import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Validation schemas
const saleItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().positive('Unit price must be positive'),
  discountAmount: z.number().min(0).default(0),
})

const createSaleSchema = z.object({
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email('Invalid email format').optional().or(z.literal('')),
  location: z.enum(['KOPERASI', 'KANTIN', 'KATERING']).default('KOPERASI'),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  subtotal: z.number().positive('Subtotal must be positive'),
  taxAmount: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
  totalAmount: z.number().positive('Total amount must be positive'),
  paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER', 'QRIS']).default('CASH'),
  paidAmount: z.number().positive('Paid amount must be positive'),
  changeAmount: z.number().min(0).default(0),
  paymentReference: z.string().optional(),
  notes: z.string().optional(),
})

const querySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  location: z.enum(['KOPERASI', 'KANTIN', 'KATERING']).optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER', 'QRIS']).optional(),
  status: z.enum(['DRAFT', 'COMPLETED', 'CANCELLED', 'REFUNDED']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  cashier: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['saleDate', 'totalAmount', 'saleNo']).default('saleDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Helper function to generate sale number
async function generateSaleNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  const count = await prisma.sales.count({
    where: {
      saleNo: {
        startsWith: `SAL-${year}${month}-`,
      },
    },
  })
  return `SAL-${year}${month}-${String(count + 1).padStart(4, '0')}`
}

// GET - Retrieve sales with filtering and pagination
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
      location: searchParams.get('location') as any || undefined,
      paymentMethod: searchParams.get('paymentMethod') as any || undefined,
      status: searchParams.get('status') as any || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      cashier: searchParams.get('cashier') || undefined,
      search: searchParams.get('search') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'saleDate',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
    })

    const skip = (query.page - 1) * query.limit

    // Build where clause
    const where: any = {}
    if (query.location) where.location = query.location
    if (query.paymentMethod) where.paymentMethod = query.paymentMethod
    if (query.status) where.status = query.status
    if (query.cashier) where.cashier = query.cashier
    if (query.dateFrom || query.dateTo) {
      where.saleDate = {}
      if (query.dateFrom) where.saleDate.gte = new Date(query.dateFrom)
      if (query.dateTo) where.saleDate.lte = new Date(query.dateTo)
    }
    if (query.search) {
      where.OR = [
        { saleNo: { contains: query.search, mode: 'insensitive' } },
        { customerName: { contains: query.search, mode: 'insensitive' } },
        { customerPhone: { contains: query.search, mode: 'insensitive' } },
        { notes: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    const [sales, total, summary] = await Promise.all([
      prisma.sales.findMany({
        where,
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
        skip,
        take: query.limit,
      }),
      prisma.sales.count({ where }),
      // Get summary statistics
      Promise.all([
        prisma.sales.aggregate({
          where,
          _sum: { totalAmount: true },
          _count: true,
        }),
        prisma.sales.groupBy({
          by: ['location'],
          where,
          _sum: { totalAmount: true },
          _count: true,
        }),
        prisma.sales.groupBy({
          by: ['paymentMethod'],
          where,
          _sum: { totalAmount: true },
          _count: true,
        }),
        prisma.sales.groupBy({
          by: ['status'],
          where,
          _sum: { totalAmount: true },
          _count: true,
        }),
      ]).then(([totalStats, byLocation, byPaymentMethod, byStatus]) => ({
        totalSales: totalStats._count,
        totalRevenue: totalStats._sum.totalAmount || 0,
        byLocation: byLocation.reduce((acc, item) => {
          acc[item.location] = {
            count: item._count,
            revenue: item._sum.totalAmount || 0,
          }
          return acc
        }, {} as any),
        byPaymentMethod: byPaymentMethod.reduce((acc, item) => {
          acc[item.paymentMethod] = {
            count: item._count,
            revenue: item._sum.totalAmount || 0,
          }
          return acc
        }, {} as any),
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status] = {
            count: item._count,
            revenue: item._sum.totalAmount || 0,
          }
          return acc
        }, {} as any),
      })),
    ]);

    // Fetch related sale items and products separately
    const salesWithItems = await Promise.all(
      sales.map(async (sale) => {
        const items = await prisma.sale_items.findMany({
          where: { saleId: sale.id }
        });

        const itemsWithProducts = await Promise.all(
          items.map(async (item) => {
            const product = await prisma.products.findUnique({
              where: { id: item.productId },
              select: {
                id: true,
                name: true,
                code: true,
                unit: true,
              }
            });

            return {
              ...item,
              product
            };
          })
        );

        return {
          ...sale,
          items: itemsWithProducts
        };
      })
    );

    return NextResponse.json({
      sales: salesWithItems,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
      summary,
    })

  } catch (error: any) {
    console.error('Error fetching sales:', error)
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

// POST - Create new sale (POS transaction)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createSaleSchema.parse(body)

    // Validate payment amount
    if (data.paidAmount < data.totalAmount) {
      return NextResponse.json(
        { error: 'Paid amount is less than total amount' },
        { status: 400 }
      )
    }

    // Calculate change amount
    const changeAmount = data.paidAmount - data.totalAmount

    // Validate items and check stock availability
    for (const item of data.items) {
      const product = await prisma.products.findUnique({
        where: { id: item.productId }
      });

      if (!product || !product.isActive) {
        return NextResponse.json(
          { error: `Product not found or inactive: ${item.productId}` },
          { status: 404 }
        )
      }

      // Get inventory records separately
      const inventoryRecords = await prisma.inventory.findMany({
        where: {
          productId: item.productId,
          location: data.location
        }
      });

      const availableStock = inventoryRecords.reduce(
        (sum: number, inv: { quantity: number }) => sum + inv.quantity, 0
      )

      if (availableStock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${availableStock}` },
          { status: 400 }
        )
      }
    }

    // Generate sale number
    const saleNo = await generateSaleNumber()

    // Create sale with items and update inventory
    const result = await prisma.$transaction(async (tx) => {
      // Create sale record
      const sale = await tx.sales.create({
        data: {
          saleNo,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail,
          location: data.location,
          subtotal: data.subtotal,
          taxAmount: data.taxAmount,
          discountAmount: data.discountAmount,
          totalAmount: data.totalAmount,
          paymentMethod: data.paymentMethod,
          paidAmount: data.paidAmount,
          changeAmount: changeAmount,
          paymentReference: data.paymentReference,
          cashier: session.user.id,
          notes: data.notes,
          status: 'COMPLETED',
        },
      })

      // Create sale items and update inventory
      for (const itemData of data.items) {
        const product = await tx.products.findUnique({
          where: { id: itemData.productId },
        })

        if (!product) continue

        const finalAmount = itemData.unitPrice * itemData.quantity - itemData.discountAmount

        // Create sale item
        await tx.sale_items.create({
          data: {
            saleId: sale.id,
            productId: itemData.productId,
            quantity: itemData.quantity,
            unitPrice: itemData.unitPrice,
            unitCost: product.cost,
            subtotal: itemData.unitPrice * itemData.quantity,
            discountAmount: itemData.discountAmount,
            finalAmount,
          },
        })

        // Create inventory OUT transaction
        await tx.inventory_transactions.create({
          data: {
            productId: itemData.productId,
            type: 'OUT',
            quantity: -itemData.quantity,
            location: data.location,
            unitCost: product.cost,
            totalCost: Number(product.cost) * itemData.quantity,
            reference: sale.saleNo,
            referenceId: sale.id,
            reason: 'Sale transaction',
            createdBy: session.user.id,
          },
        })

        // Update inventory records (FIFO - reduce from oldest batches first)
        let remainingToReduce = itemData.quantity
        const inventoryRecords = await tx.inventory.findMany({
          where: {
            productId: itemData.productId,
            location: data.location,
            quantity: { gt: 0 },
          },
          orderBy: { lastUpdated: 'asc' }, // FIFO
        })

        for (const record of inventoryRecords) {
          if (remainingToReduce <= 0) break

          const reduceAmount = Math.min(record.quantity, remainingToReduce)
          await tx.inventory.update({
            where: { id: record.id },
            data: {
              quantity: record.quantity - reduceAmount,
              lastUpdated: new Date(),
            },
          })
          remainingToReduce -= reduceAmount
        }

        // Update product total stock
        const totalStock = await tx.inventory.aggregate({
          where: { productId: itemData.productId },
          _sum: { quantity: true },
        })

        await tx.products.update({
          where: { id: itemData.productId },
          data: { stock: totalStock._sum.quantity || 0 },
        })
      }

      return sale
    })

    // Fetch complete sale data with items
    const completeSale = await prisma.sales.findUnique({
      where: { id: result.id }
    });

    // Fetch sale items and products separately
    const items = await prisma.sale_items.findMany({
      where: { saleId: result.id }
    });

    const itemsWithProducts = await Promise.all(
      items.map(async (item) => {
        const product = await prisma.products.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            code: true,
            unit: true,
          }
        });

        return {
          ...item,
          product
        };
      })
    );

    return NextResponse.json(
      {
        sale: {
          ...completeSale,
          items: itemsWithProducts
        },
        message: 'Sale completed successfully',
      },
      { status: 201 }
    )

  } catch (error: any) {
    console.error('Error creating sale:', error)
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