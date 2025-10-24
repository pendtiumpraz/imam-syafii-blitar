import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    
    // Find campaign first
    const campaign = await prisma.donation_campaigns.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign tidak ditemukan' },
        { status: 404 }
      )
    }

    // Get updates
    const updates = await prisma.campaign_updates.findMany({
      where: {
        campaignId: campaign.id,
        isPublic: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Parse JSON fields
    const updatesWithParsedData = updates.map(update => ({
      ...update,
      images: JSON.parse(update.images)
    }))

    return NextResponse.json({ updates: updatesWithParsedData })
  } catch (error) {
    console.error('Error fetching campaign updates:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil update campaign' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { slug } = params
    const body = await request.json()
    const { title, content, images = [], isPublic = true } = body

    // Find campaign
    const campaign = await prisma.donation_campaigns.findUnique({
      where: { slug },
      select: { id: true, createdBy: true }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check authorization (admin or campaign creator)
    if (session.user.role !== 'ADMIN' && campaign.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: 'Tidak memiliki akses' },
        { status: 403 }
      )
    }

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title dan content harus diisi' },
        { status: 400 }
      )
    }

    // Create update
    const update = await prisma.campaign_updates.create({
      data: {
        campaignId: campaign.id,
        title,
        content,
        images: JSON.stringify(images),
        isPublic
      }
    })

    return NextResponse.json({
      ...update,
      images: JSON.parse(update.images)
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating campaign update:', error)
    return NextResponse.json(
      { error: 'Gagal membuat update campaign' },
      { status: 500 }
    )
  }
}