import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').optional(),
  code: z.string().min(1, 'Product code/SKU is required').optional(),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required').optional(),
  price: z.number().positive('Price must be positive').optional(),
  cost: z.number().min(0).optional(),
  stock: z.number().min(0).optional(),
  minStock: z.number().min(0).optional(),
  unit: z.string().optional(),
  image: z.string().optional(),
  brand: z.string().optional(),
  supplier: z.string().optional(),
  location: z.enum(['KOPERASI', 'KANTIN', 'KATERING', 'UMUM']).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
})

// GET - Retrieve single product with details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Add relations to products schema (category, inventoryRecords, inventoryTransactions, saleItems, purchaseItems)
    const product = await prisma.products.findUnique({
      where: { id: params.id },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // TODO: Calculate stock by location when inventory relation is added
    const stockByLocation = {};

    // TODO: Calculate total sales when saleItems relation is added
    const salesStats = { totalQuantitySold: 0, totalRevenue: 0 }

    return NextResponse.json({
      product: {
        ...product,
        tags: JSON.parse(product.tags),
        stockByLocation,
        salesStats,
      },
    })

  } catch (error: any) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update product
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
    const data = updateProductSchema.parse(body)

    // Check if product exists
    const existingProduct = await prisma.products.findUnique({
      where: { id: params.id },
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if code is being updated and already exists elsewhere
    if (data.code && data.code !== existingProduct.code) {
      const codeExists = await prisma.products.findFirst({
        where: {
          code: data.code,
          id: { not: params.id },
        },
      })

      if (codeExists) {
        return NextResponse.json(
          { error: 'Product code already exists' },
          { status: 409 }
        )
      }
    }

    // Verify category if being updated
    if (data.categoryId) {
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
    }

    const updateData = {
      ...data,
      tags: data.tags ? JSON.stringify(data.tags) : undefined,
    }

    // Handle stock update with inventory transaction
    let result
    if (data.stock !== undefined && data.stock !== existingProduct.stock) {
      result = await prisma.$transaction(async (tx) => {
        const product = await tx.products.update({
          where: { id: params.id },
          data: updateData,
        })

        // Create inventory adjustment transaction
        const stockDiff = data.stock! - existingProduct.stock
        if (stockDiff !== 0) {
          await tx.inventory_transactions.create({
            data: {
              productId: params.id,
              type: 'ADJUSTMENT',
              quantity: stockDiff,
              location: data.location || existingProduct.location,
              unitCost: data.cost || existingProduct.cost,
              totalCost: Number(data.cost || existingProduct.cost) * Math.abs(stockDiff),
              reference: 'Stock Adjustment',
              reason: 'Manual stock update',
            },
          })

          // Update or create inventory record
          const existingInventory = await tx.inventory.findFirst({
            where: {
              productId: params.id,
              location: data.location || existingProduct.location,
              batchNo: null,
            },
          });

          if (existingInventory) {
            await tx.inventory.update({
              where: { id: existingInventory.id },
              data: {
                quantity: data.stock!,
                unitCost: data.cost || existingProduct.cost,
                lastUpdated: new Date(),
              },
            });
          } else {
            await tx.inventory.create({
              data: {
                productId: params.id,
                quantity: data.stock!,
                location: data.location || existingProduct.location,
                unitCost: data.cost || existingProduct.cost,
                batchNo: null,
                lastUpdated: new Date(),
              },
            });
          }
        }

        return product
      })
    } else {
      result = await prisma.products.update({
        where: { id: params.id },
        data: updateData,
      })
    }

    return NextResponse.json({
      product: {
        ...result,
        tags: JSON.parse(result.tags),
      },
      message: 'Product updated successfully',
    })

  } catch (error: any) {
    console.error('Error updating product:', error)
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

// DELETE - Delete product (soft delete by setting isActive to false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if product exists
    const product = await prisma.products.findUnique({
      where: { id: params.id },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // TODO: Add relations to products schema to check for saleItems and purchaseItems
    // For now, always soft delete (deactivate)
    const hasTransactions = true;

    if (hasTransactions) {
      // Soft delete - just deactivate
      const updatedProduct = await prisma.products.update({
        where: { id: params.id },
        data: { isActive: false },
      })

      return NextResponse.json({
        product: {
          ...updatedProduct,
          tags: JSON.parse(updatedProduct.tags),
        },
        message: 'Product deactivated successfully (has transaction history)',
      })
    } else {
      // Hard delete if no transactions
      await prisma.$transaction(async (tx) => {
        // Delete related inventory records
        await tx.inventory.deleteMany({
          where: { productId: params.id },
        })

        // Delete related inventory transactions
        await tx.inventory_transactions.deleteMany({
          where: { productId: params.id },
        })

        // Delete the product
        await tx.products.delete({
          where: { id: params.id },
        })
      })

      return NextResponse.json({
        message: 'Product deleted successfully',
      })
    }

  } catch (error: any) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}