import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { softDelete, forceDelete } from '@/lib/soft-delete'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const updateSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').optional(),
  code: z.string().optional(),
  contact: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  whatsapp: z.string().optional(),
  taxId: z.string().optional(),
  bankAccount: z.string().optional(),
  paymentTerms: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
})

// GET - Retrieve single supplier with detailed information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: params.id },
      include: {
        purchaseOrders: {
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                    unit: true,
                  },
                },
              },
            },
          },
          orderBy: { orderDate: 'desc' },
        },
        _count: {
          select: {
            purchaseOrders: true,
          },
        },
      },
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    // Calculate supplier metrics
    const metrics = {
      totalPurchaseOrders: supplier.purchaseOrders.length,
      totalPurchaseValue: supplier.purchaseOrders.reduce(
        (sum, po) => sum + Number(po.totalAmount), 0
      ),
      averageOrderValue: supplier.purchaseOrders.length > 0 
        ? supplier.purchaseOrders.reduce((sum, po) => sum + Number(po.totalAmount), 0) / supplier.purchaseOrders.length
        : 0,
      pendingOrders: supplier.purchaseOrders.filter(po => 
        ['DRAFT', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED'].includes(po.status)
      ).length,
      completedOrders: supplier.purchaseOrders.filter(po => 
        po.status === 'RECEIVED'
      ).length,
      cancelledOrders: supplier.purchaseOrders.filter(po => 
        po.status === 'CANCELLED'
      ).length,
      lastOrderDate: supplier.purchaseOrders[0]?.orderDate,
      outstandingAmount: supplier.purchaseOrders
        .filter(po => po.paymentStatus !== 'PAID')
        .reduce((sum, po) => sum + (Number(po.totalAmount) - Number(po.paidAmount)), 0),
    }

    // Get top products purchased from this supplier
    const productStats = supplier.purchaseOrders.flatMap(po => po.items).reduce((acc, item) => {
      const key = item.product.id
      if (!acc[key]) {
        acc[key] = {
          product: item.product,
          totalQuantity: 0,
          totalValue: 0,
          orderCount: 0,
        }
      }
      acc[key].totalQuantity += item.quantity
      acc[key].totalValue += Number(item.totalCost)
      acc[key].orderCount += 1
      return acc
    }, {} as any)

    const topProducts = Object.values(productStats)
      .sort((a: any, b: any) => b.totalValue - a.totalValue)
      .slice(0, 10)

    return NextResponse.json({
      supplier: {
        ...supplier,
        metrics,
        topProducts,
      },
    })

  } catch (error: any) {
    console.error('Error fetching supplier:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update supplier
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = updateSupplierSchema.parse(body)

    // Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id: params.id },
    })

    if (!existingSupplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    // Check if code is being updated and already exists elsewhere
    if (data.code && data.code !== existingSupplier.code) {
      const codeExists = await prisma.supplier.findFirst({
        where: {
          code: data.code,
          id: { not: params.id },
        },
      })

      if (codeExists) {
        return NextResponse.json(
          { error: 'Supplier code already exists' },
          { status: 409 }
        )
      }
    }

    // Check if email is being updated and already exists elsewhere
    if (data.email && data.email !== existingSupplier.email) {
      const emailExists = await prisma.supplier.findFirst({
        where: {
          email: data.email,
          isActive: true,
          id: { not: params.id },
        },
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email address already exists' },
          { status: 409 }
        )
      }
    }

    const supplier = await prisma.supplier.update({
      where: { id: params.id },
      data,
      include: {
        _count: {
          select: {
            purchaseOrders: true,
          },
        },
      },
    })

    return NextResponse.json({
      supplier,
      message: 'Supplier updated successfully',
    })

  } catch (error: any) {
    console.error('Error updating supplier:', error)
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

// DELETE - Delete supplier (soft delete if has purchase orders)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: params.id },
      include: {
        purchaseOrders: true,
      },
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    // Check if supplier has purchase orders
    const hasPurchaseOrders = supplier.purchaseOrders.length > 0

    if (hasPurchaseOrders) {
      // Soft delete if has purchase orders
      const updatedSupplier = await softDelete(
        prisma.supplier,
        { id: params.id },
        session.user.id
      )

      return NextResponse.json({
        supplier: updatedSupplier,
        message: 'Supplier deactivated successfully (has purchase order history)',
      })
    } else {
      // Hard delete if no purchase orders
      await forceDelete(prisma.supplier, { id: params.id })

      return NextResponse.json({
        message: 'Supplier deleted successfully',
      })
    }

  } catch (error: any) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}