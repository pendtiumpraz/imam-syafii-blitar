import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const type = searchParams.get('type')
    const category = searchParams.get('category')

    const where: any = {
      isDeleted: false,
    }

    if (from || to) {
      where.date = {}
      if (from) where.date.gte = new Date(from)
      if (to) where.date.lte = new Date(to)
    }

    if (type) {
      where.type = type
    }

    if (category) {
      where.categoryId = category
    }

    const transactions = await prisma.transactions.findMany({
      where,
      include: {
        users: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: 100,
    })

    // Get category names
    const categoryIds = [...new Set(transactions.map(t => t.categoryId))]
    const categories = await prisma.financial_categories.findMany({
      where: {
        id: { in: categoryIds },
      },
    })

    const categoryMap = Object.fromEntries(categories.map(c => [c.id, c.name]))

    const formattedTransactions = transactions.map(t => ({
      id: t.id,
      date: t.date,
      type: t.type,
      category: t.categoryId,
      categoryName: categoryMap[t.categoryId] || 'Unknown',
      amount: parseFloat(t.amount.toString()),
      description: t.description,
      reference: t.reference,
      createdBy: t.users.name,
    }))

    // Calculate stats
    const stats = {
      totalIncome: transactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
      totalExpense: transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0),
      balance: 0,
      transactionCount: transactions.length,
    }

    stats.balance = stats.totalIncome - stats.totalExpense

    return NextResponse.json({
      transactions: formattedTransactions,
      stats,
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil transaksi' },
      { status: 500 }
    )
  }
}
