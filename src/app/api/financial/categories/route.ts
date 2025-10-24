import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await prisma.financial_categories.findMany({
      where: {
        isDeleted: false,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching financial categories:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil kategori' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, type, code, color } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Nama dan tipe harus diisi' },
        { status: 400 }
      )
    }

    // Generate account ID based on type
    const accountId = type === 'INCOME' ? 'default-income-account' : 'default-expense-account'

    const category = await prisma.financial_categories.create({
      data: {
        id: `cat-${Date.now()}`,
        name,
        type,
        code: code || null,
        accountId,
        color: color || (type === 'INCOME' ? '#10B981' : '#EF4444'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error creating financial category:', error)
    return NextResponse.json(
      { error: 'Gagal membuat kategori' },
      { status: 500 }
    )
  }
}
