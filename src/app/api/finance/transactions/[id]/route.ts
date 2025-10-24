import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for updates
const updateTransactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE', 'DONATION']).optional(),
  categoryId: z.string().min(1, 'Category is required').optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  reference: z.string().optional(),
  date: z.string().datetime('Invalid date format').optional(),
  dueDate: z.string().datetime().optional().nullable(),
  status: z.enum(['DRAFT', 'POSTED', 'CANCELLED', 'REVERSED']).optional(),
  tags: z.array(z.string()).optional(),
  attachments: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
})

interface RouteParams {
  params: {
    id: string
  }
}

// Helper function to reverse journal entries
async function reverseJournalEntry(transactionId: string, userId: string) {
  const originalEntry = await prisma.journal_entries.findFirst({
    where: { transactionId },
    include: {
      entries: {
        include: {
          account: true,
        },
      },
    },
  })

  if (!originalEntry) return null

  // Generate reversal entry number
  const year = new Date().getFullYear()
  const jeCount = await prisma.journal_entries.count({
    where: {
      entryNo: {
        startsWith: `JER-${year}-`,
      },
    },
  })
  const entryNo = `JER-${year}-${String(jeCount + 1).padStart(4, '0')}`

  // Create reversal entry with swapped debits and credits
  const reversalEntry = await prisma.journal_entries.create({
    data: {
      entryNo,
      description: `Reversal of ${originalEntry.entryNo}: ${originalEntry.description}`,
      date: new Date(),
      reference: originalEntry.reference,
      totalDebit: originalEntry.totalDebit,
      totalCredit: originalEntry.totalCredit,
      isBalanced: true,
      createdBy: userId,
      entries: {
        create: originalEntry.entries.map((entry, index) => ({
          accountId: entry.accountId,
          debitAmount: entry.creditAmount, // Swap debit and credit
          creditAmount: entry.debitAmount,
          description: `Reversal: ${entry.description}`,
          lineOrder: index + 1,
        })),
      },
    },
    include: {
      entries: {
        include: {
          account: true,
        },
      },
    },
  })

  // Update account balances (reverse the original entries)
  for (const entry of originalEntry.entries) {
    await prisma.financial_accounts.update({
      where: { id: entry.accountId },
      data: {
        balance: {
          increment: entry.creditAmount - entry.debitAmount, // Reverse the balance change
        },
      },
    })
  }

  // Mark original entry as reversed
  await prisma.journal_entries.update({
    where: { id: originalEntry.id },
    data: {
      status: 'REVERSED',
      reversedBy: userId,
      reversedAt: new Date(),
    },
  })

  return reversalEntry
}

// GET - Retrieve single transaction
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const transaction = await prisma.transactions.findUnique({
      where: { id: params.id },
      include: {
        category: {
          include: {
            account: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        journalEntry: {
          include: {
            entries: {
              include: {
                account: true,
              },
            },
          },
        },
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Parse JSON fields
    const transactionData = {
      ...transaction,
      tags: JSON.parse(transaction.tags || '[]'),
      attachments: JSON.parse(transaction.attachments || '[]'),
    }

    return NextResponse.json(transactionData)

  } catch (error: any) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update transaction
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = updateTransactionSchema.parse(body)

    // Check if transaction exists
    const existingTransaction = await prisma.transactions.findUnique({
      where: { id: params.id },
      include: {
        journalEntry: true,
      },
    })

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Check permissions - only creator or admin can edit
    if (existingTransaction.createdBy !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Prevent editing of posted transactions without admin rights
    if (existingTransaction.status === 'POSTED' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot edit posted transactions' },
        { status: 403 }
      )
    }

    // If categoryId is being updated, verify it exists and matches type
    if (data.categoryId && data.categoryId !== existingTransaction.categoryId) {
      const category = await prisma.financial_categories.findFirst({
        where: {
          id: data.categoryId,
          type: data.type || existingTransaction.type,
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

    // Prepare update data
    const updateData: any = {}
    if (data.type) updateData.type = data.type
    if (data.categoryId) updateData.categoryId = data.categoryId
    if (data.amount) updateData.amount = data.amount
    if (data.description) updateData.description = data.description
    if (data.reference !== undefined) updateData.reference = data.reference
    if (data.date) updateData.date = new Date(data.date)
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
    if (data.status) updateData.status = data.status
    if (data.tags) updateData.tags = JSON.stringify(data.tags)
    if (data.attachments) updateData.attachments = JSON.stringify(data.attachments)
    if (data.notes !== undefined) updateData.notes = data.notes

    // Handle status changes
    if (data.status && data.status !== existingTransaction.status) {
      if (data.status === 'CANCELLED' || data.status === 'REVERSED') {
        // Reverse journal entries if moving to cancelled or reversed
        if (existingTransaction.journalEntry) {
          await reverseJournalEntry(params.id, session.user.id)
        }
      }
      // Add approval info for posting
      if (data.status === 'POSTED') {
        updateData.approvedBy = session.user.id
        updateData.approvedAt = new Date()
      }
    }

    const transaction = await prisma.transactions.update({
      where: { id: params.id },
      data: updateData,
      include: {
        category: {
          include: {
            account: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        journalEntry: {
          include: {
            entries: {
              include: {
                account: true,
              },
            },
          },
        },
      },
    })

    // Parse JSON fields for response
    const transactionData = {
      ...transaction,
      tags: JSON.parse(transaction.tags || '[]'),
      attachments: JSON.parse(transaction.attachments || '[]'),
    }

    return NextResponse.json({
      transaction: transactionData,
      message: 'Transaction updated successfully',
    })

  } catch (error: any) {
    console.error('Error updating transaction:', error)
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

// DELETE - Delete transaction (soft delete by setting status to CANCELLED)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if transaction exists
    const transaction = await prisma.transactions.findUnique({
      where: { id: params.id },
      include: {
        journalEntry: true,
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Check permissions - only creator or admin can delete
    if (transaction.createdBy !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // For posted transactions, reverse the journal entry first
    if (transaction.status === 'POSTED' && transaction.journalEntry) {
      await reverseJournalEntry(params.id, session.user.id)
    }

    // Soft delete by setting status to CANCELLED
    await prisma.transactions.update({
      where: { id: params.id },
      data: {
        status: 'CANCELLED',
      },
    })

    return NextResponse.json({
      message: 'Transaction cancelled successfully',
    })

  } catch (error: any) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}