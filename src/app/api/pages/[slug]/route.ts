import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug

    // Find page content by slug
    const setting = await prisma.settings.findUnique({
      where: { key: `page_${slug}` },
    })

    if (!setting) {
      return NextResponse.json(
        { error: 'Page content not found' },
        { status: 404 }
      )
    }

    const content = JSON.parse(setting.value)

    return NextResponse.json(content)
  } catch (error) {
    console.error('Error fetching page content:', error)
    return NextResponse.json(
      { error: 'Failed to fetch page content' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug
    const body = await request.json()

    // Save page content
    await prisma.settings.upsert({
      where: { key: `page_${slug}` },
      update: { value: JSON.stringify(body) },
      create: {
        id: `page-${slug}`,
        key: `page_${slug}`,
        value: JSON.stringify(body),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving page content:', error)
    return NextResponse.json(
      { error: 'Failed to save page content' },
      { status: 500 }
    )
  }
}
