import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = {}
    if (status) {
      where.status = status
    }

    // For now, store articles in settings as JSON
    // In production, you'd want a dedicated articles table
    const articlesData = await prisma.settings.findUnique({
      where: { key: 'articles' },
    })

    let articles = []
    if (articlesData) {
      try {
        articles = JSON.parse(articlesData.value)
        if (status) {
          articles = articles.filter((a: any) => a.status === status)
        }
      } catch (error) {
        articles = []
      }
    }

    return NextResponse.json(articles)
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil artikel' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Get existing articles
    const articlesData = await prisma.settings.findUnique({
      where: { key: 'articles' },
    })

    let articles = []
    if (articlesData) {
      try {
        articles = JSON.parse(articlesData.value)
      } catch (error) {
        articles = []
      }
    }

    // Create new article
    const newArticle = {
      id: `article-${Date.now()}`,
      ...body,
      author: 'Admin', // TODO: Get from session
      viewCount: 0,
      createdAt: new Date().toISOString(),
      publishedAt: body.status === 'PUBLISHED' ? new Date().toISOString() : null,
    }

    articles.push(newArticle)

    // Save back to settings
    await prisma.settings.upsert({
      where: { key: 'articles' },
      update: { value: JSON.stringify(articles) },
      create: {
        id: 'articles-data',
        key: 'articles',
        value: JSON.stringify(articles),
      },
    })

    return NextResponse.json(newArticle)
  } catch (error) {
    console.error('Error creating article:', error)
    return NextResponse.json(
      { error: 'Gagal membuat artikel' },
      { status: 500 }
    )
  }
}
