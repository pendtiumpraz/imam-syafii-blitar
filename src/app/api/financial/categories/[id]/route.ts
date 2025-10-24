import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.financial_categories.update({
      where: { id: params.id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting financial category:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus kategori' },
      { status: 500 }
    )
  }
}
