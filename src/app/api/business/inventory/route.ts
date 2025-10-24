import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Validation schemas
const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().int('Quantity must be an integer'),
  location: z.enum(['KOPERASI', 'KANTIN', 'KATERING', 'GUDANG']).default('GUDANG'),
  unitCost: z.number().min(0).default(0),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
  batchNo: z.string().optional(),
  expiryDate: z.string().datetime().optional(),
})

const stockTransferSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  fromLocation: z.enum(['KOPERASI', 'KANTIN', 'KATERING', 'GUDANG']),
  toLocation: z.enum(['KOPERASI', 'KANTIN', 'KATERING', 'GUDANG']),
  quantity: z.number().positive('Quantity must be positive'),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional(),
})

const querySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  location: z.enum(['KOPERASI', 'KANTIN', 'KATERING', 'GUDANG']).optional(),
  productId: z.string().optional(),
  lowStock: z.boolean().optional(),
  expiringSoon: z.boolean().optional(), // Items expiring within 30 days
  search: z.string().optional(),
  sortBy: z.enum(['productName', 'quantity', 'lastUpdated', 'expiryDate']).default('lastUpdated'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// GET - Retrieve inventory with filtering
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
      productId: searchParams.get('productId') || undefined,
      lowStock: searchParams.get('lowStock') ? searchParams.get('lowStock') === 'true' : undefined,
      expiringSoon: searchParams.get('expiringSoon') ? searchParams.get('expiringSoon') === 'true' : undefined,
      search: searchParams.get('search') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'lastUpdated',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
    })

    const skip = (query.page - 1) * query.limit

    // Build where clause
    const where: any = {}
    if (query.location) where.location = query.location
    if (query.productId) where.productId = query.productId
    if (query.expiringSoon) {
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      where.expiryDate = {
        lte: thirtyDaysFromNow,
        gte: new Date(),
      }
    }

    // Search in product name, code, or batch number
    if (query.search) {
      where.OR = [
        { batchNo: { contains: query.search, mode: 'insensitive' } },
        { product: {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { code: { contains: query.search, mode: 'insensitive' } },
          ]
        }},
      ]
    }

    // Add low stock filter
    if (query.lowStock) {
      where.product = {
        ...where.product,
        stock: {
          lt: prisma.products.fields.minStock,
        },
      }
    }

    const [inventory, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
        orderBy: query.sortBy === 'productName' 
          ? { product: { name: query.sortOrder } }
          : { [query.sortBy]: query.sortOrder },
        skip,
        take: query.limit,
      }),
      prisma.inventory.count({ where }),
    ])

    // Get summary statistics
    const [totalValue, lowStockCount, expiringSoonCount, locationSummary] = await Promise.all([
      // Total inventory value
      prisma.inventory.findMany({
        include: { product: true },
      }).then(items => items.reduce((sum, item) => sum + (item.quantity * Number(item.product.price)), 0)),
      
      // Low stock items count
      prisma.inventory.count({
        where: {
          product: {
            stock: {
              lt: prisma.products.fields.minStock,
            },
          },
        },
      }),
      
      // Items expiring within 30 days
      prisma.inventory.count({
        where: {
          expiryDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            gte: new Date(),
          },
        },
      }),
      
      // Summary by location
      prisma.inventory.groupBy({
        by: ['location'],
        _sum: {
          quantity: true,
        },
        _count: true,
      }),
    ])

    return NextResponse.json({
      inventory,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
      summary: {
        totalItems: total,
        totalValue,
        lowStockCount,
        expiringSoonCount,
        byLocation: locationSummary.reduce((acc, item) => {
          acc[item.location] = {
            count: item._count,
            totalQuantity: item._sum.quantity || 0,
          }
          return acc
        }, {} as any),
      },
    })

  } catch (error: any) {
    console.error('Error fetching inventory:', error)
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

// POST - Stock adjustment (add/remove stock)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = stockAdjustmentSchema.parse(body)

    // Verify product exists
    const product = await prisma.products.findUnique({
      where: { id: data.productId },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Perform stock adjustment in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create inventory transaction
      const transaction = await tx.inventoryTransaction.create({
        data: {
          productId: data.productId,
          type: 'ADJUSTMENT',
          quantity: data.quantity,
          location: data.location,
          unitCost: data.unitCost,
          totalCost: data.unitCost * Math.abs(data.quantity),
          reference: 'Stock Adjustment',
          reason: data.reason,
          notes: data.notes,
          batchNo: data.batchNo,
          createdBy: session.user.id,
        },
      })

      // Update or create inventory record
      // Find existing inventory record
      const existingInventory = await tx.inventory.findFirst({
        where: {
          productId: data.productId,
          location: data.location,
          batchNo: data.batchNo || null,
        },
      });

      let inventoryRecord;
      if (existingInventory) {
        // Update existing record
        inventoryRecord = await tx.inventory.update({
          where: { id: existingInventory.id },
          data: {
            quantity: {
              increment: data.quantity,
            },
            unitCost: data.unitCost,
            lastUpdated: new Date(),
            expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
          },
          include: {
            product: true,
          },
        });
      } else {
        // Create new record
        inventoryRecord = await tx.inventory.create({
          data: {
            productId: data.productId,
            quantity: Math.max(0, data.quantity),
            location: data.location,
            unitCost: data.unitCost || 0,
            batchNo: data.batchNo || null,
            expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
            lastUpdated: new Date(),
          },
          include: {
            product: true,
          },
        });
      }

      // Update product total stock
      const totalStock = await tx.inventory.aggregate({
        where: { productId: data.productId },
        _sum: { quantity: true },
      })

      await tx.product.update({
        where: { id: data.productId },
        data: { stock: totalStock._sum.quantity || 0 },
      })

      return { transaction, inventoryRecord }
    })

    return NextResponse.json(
      {
        transaction: result.transaction,
        inventory: result.inventoryRecord,
        message: 'Stock adjustment completed successfully',
      },
      { status: 201 }
    )

  } catch (error: any) {
    console.error('Error creating stock adjustment:', error)
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

// PUT - Stock transfer between locations
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = stockTransferSchema.parse(body)

    if (data.fromLocation === data.toLocation) {
      return NextResponse.json(
        { error: 'Source and destination locations cannot be the same' },
        { status: 400 }
      )
    }

    // Check if enough stock is available at source location
    const sourceInventory = await prisma.inventory.findMany({
      where: {
        productId: data.productId,
        location: data.fromLocation,
      },
    })

    const availableStock = sourceInventory.reduce((sum, inv) => sum + inv.quantity, 0)
    
    if (availableStock < data.quantity) {
      return NextResponse.json(
        { error: `Insufficient stock at ${data.fromLocation}. Available: ${availableStock}` },
        { status: 400 }
      )
    }

    // Perform stock transfer
    const result = await prisma.$transaction(async (tx) => {
      // Create OUT transaction for source location
      await tx.inventoryTransaction.create({
        data: {
          productId: data.productId,
          type: 'TRANSFER',
          quantity: -data.quantity,
          location: data.fromLocation,
          reference: `Transfer to ${data.toLocation}`,
          reason: data.reason,
          notes: data.notes,
          createdBy: session.user.id,
        },
      })

      // Create IN transaction for destination location
      await tx.inventoryTransaction.create({
        data: {
          productId: data.productId,
          type: 'TRANSFER',
          quantity: data.quantity,
          location: data.toLocation,
          reference: `Transfer from ${data.fromLocation}`,
          reason: data.reason,
          notes: data.notes,
          createdBy: session.user.id,
        },
      })

      // Update source inventory (FIFO - reduce from oldest batches first)
      let remainingToReduce = data.quantity
      const sourceRecords = await tx.inventory.findMany({
        where: {
          productId: data.productId,
          location: data.fromLocation,
          quantity: { gt: 0 },
        },
        orderBy: { lastUpdated: 'asc' }, // FIFO
      })

      for (const record of sourceRecords) {
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

      // Add to destination inventory
      const avgCost = sourceRecords.reduce((sum, r) => sum + Number(r.unitCost), 0) / sourceRecords.length

      // Find or create destination inventory
      const destinationInventory = await tx.inventory.findFirst({
        where: {
          productId: data.productId,
          location: data.toLocation,
          batchNo: null,
        },
      });

      if (destinationInventory) {
        await tx.inventory.update({
          where: { id: destinationInventory.id },
          data: {
            quantity: { increment: data.quantity },
            lastUpdated: new Date(),
          },
        });
      } else {
        await tx.inventory.create({
          data: {
            productId: data.productId,
            quantity: data.quantity,
            location: data.toLocation,
            unitCost: avgCost,
            batchNo: null,
            lastUpdated: new Date(),
          },
        });
      }

      return { success: true }
    })

    return NextResponse.json({
      message: `Successfully transferred ${data.quantity} units from ${data.fromLocation} to ${data.toLocation}`,
    })

  } catch (error: any) {
    console.error('Error transferring stock:', error)
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