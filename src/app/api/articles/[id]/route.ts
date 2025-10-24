import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const articlesData = await prisma.settings.findUnique({
      where: { key: 'articles' },
    })

    let articles = []
    if (articlesData) {
      articles = JSON.parse(articlesData.value)
    }

    const index = articles.findIndex((a: any) => a.id === params.id)
    if (index === -1) {
      return NextResponse.json(
        { error: 'Artikel tidak ditemukan' },
        { status: 404 }
      )
    }

    articles[index] = {
      ...articles[index],
      ...body,
      updatedAt: new Date().toISOString(),
    }

    await prisma.settings.update({
      where: { key: 'articles' },
      data: { value: JSON.stringify(articles) },
    })

    return NextResponse.json(articles[index])
  } catch (error) {
    console.error('Error updating article:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui artikel' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const articlesData = await prisma.settings.findUnique({
      where: { key: 'articles' },
    })

    let articles = []
    if (articlesData) {
      articles = JSON.parse(articlesData.value)
    }

    articles = articles.filter((a: any) => a.id !== params.id)

    await prisma.settings.update({
      where: { key: 'articles' },
      data: { value: JSON.stringify(articles) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting article:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus artikel' },
      { status: 500 }
    )
  }
}
