import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { transactions } = body

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json(
        { error: 'Data transaksi tidak valid' },
        { status: 400 }
      )
    }

    // Create all transactions
    const results = await Promise.all(
      transactions.map(async (transaction: any) => {
        const transactionNo = `TRX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        return prisma.transactions.create({
          data: {
            id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            transactionNo,
            type: transaction.type,
            amount: parseFloat(transaction.amount),
            description: transaction.description,
            date: new Date(transaction.date),
            categoryId: transaction.category,
            reference: transaction.reference || null,
            status: 'POSTED',
            createdBy: 'admin', // TODO: Get from session
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })
      })
    )

    return NextResponse.json({
      success: true,
      count: results.length,
    })
  } catch (error) {
    console.error('Error creating bulk transactions:', error)
    return NextResponse.json(
      { error: 'Gagal menyimpan transaksi' },
      { status: 500 }
    )
  }
}
