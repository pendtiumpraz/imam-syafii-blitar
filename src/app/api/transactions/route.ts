import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const createTransactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE', 'DONATION']),
  category: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().datetime('Invalid date format'),
})

export async function GET(request: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma')
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type')
    const category = searchParams.get('category')

    const skip = (page - 1) * limit

    const where: any = {}
    if (type) where.type = type
    if (category) where.category = category

    const [transactions, total] = await Promise.all([
      prisma.transactions.findMany({
        where,
        include: {
          users: {
            select: {
              name: true,
              username: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.transactions.count({ where }),
    ])

    return NextResponse.json({
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma')
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createTransactionSchema.parse(body)

    const { category, date, ...otherData } = validatedData;
    
    // Generate transaction number
    const year = new Date().getFullYear();
    const count = await prisma.transactions.count() + 1;
    const transactionNo = `TRX-${year}-${count.toString().padStart(3, '0')}`;
    
    const transaction = await prisma.transactions.create({
      data: {
        type: otherData.type,
        description: otherData.description,
        amount: otherData.amount,
        transactionNo,
        categoryId: category,
        date: new Date(date),
        createdBy: session.user.id,
      },
      include: {
        users: {
          select: {
            name: true,
            username: true,
          },
        },
      },
    })

    return NextResponse.json(
      { data: transaction, message: 'Transaction created successfully' },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}