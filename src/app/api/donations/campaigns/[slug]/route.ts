import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { softDelete } from '@/lib/soft-delete'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    const campaign = await prisma.donation_campaigns.findUnique({
      where: { slug }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign tidak ditemukan' },
        { status: 404 }
      )
    }

    // Fetch related data
    const [category, creator, donationCount, updateCount] = await Promise.all([
      prisma.donation_categories.findUnique({
        where: { id: campaign.categoryId }
      }),
      prisma.users.findUnique({
        where: { id: campaign.createdBy },
        select: { id: true, name: true, email: true }
      }),
      prisma.donations.count({
        where: {
          campaignId: campaign.id,
          paymentStatus: 'VERIFIED'
        }
      }),
      prisma.campaign_updates.count({
        where: { campaignId: campaign.id }
      })
    ])

    return NextResponse.json({
      ...campaign,
      images: JSON.parse(campaign.images),
      currentAmount: parseFloat(campaign.currentAmount.toString()),
      targetAmount: parseFloat(campaign.targetAmount.toString()),
      category,
      creator,
      _count: {
        donations: donationCount,
        updates: updateCount
      }
    })
  } catch (error) {
    console.error('Error fetching campaign:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data campaign' },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    // Find existing campaign
    const existingCampaign = await prisma.donation_campaigns.findUnique({
      where: { slug }
    })

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check authorization (admin or creator)
    if (session.user.role !== 'ADMIN' && existingCampaign.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: 'Tidak memiliki akses' },
        { status: 403 }
      )
    }

    const {
      title,
      description,
      story,
      categoryId,
      targetAmount,
      startDate,
      endDate,
      mainImage,
      images = [],
      video,
      isFeatured,
      isUrgent,
      allowAnonymous,
      status
    } = body

    // Update campaign
    const updatedCampaign = await prisma.donation_campaigns.update({
      where: { slug },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(story !== undefined && { story }),
        ...(categoryId && { categoryId }),
        ...(targetAmount && { targetAmount: parseFloat(targetAmount.toString()) }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(mainImage !== undefined && { mainImage }),
        ...(images && { images: JSON.stringify(images) }),
        ...(video !== undefined && { video }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(isUrgent !== undefined && { isUrgent }),
        ...(allowAnonymous !== undefined && { allowAnonymous }),
        ...(status && { status }),
        updatedAt: new Date()
      }
    })

    // Fetch related data
    const [category, creator] = await Promise.all([
      prisma.donation_categories.findUnique({
        where: { id: updatedCampaign.categoryId }
      }),
      prisma.users.findUnique({
        where: { id: updatedCampaign.createdBy },
        select: { id: true, name: true, email: true }
      })
    ])

    return NextResponse.json({
      ...updatedCampaign,
      images: JSON.parse(updatedCampaign.images),
      currentAmount: parseFloat(updatedCampaign.currentAmount.toString()),
      targetAmount: parseFloat(updatedCampaign.targetAmount.toString()),
      category,
      creator
    })
  } catch (error) {
    console.error('Error updating campaign:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui campaign' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { slug } = params

    // Find existing campaign
    const existingCampaign = await prisma.donation_campaigns.findUnique({
      where: { slug }
    })

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if campaign has donations
    const donationCount = await prisma.donations.count({
      where: { campaignId: existingCampaign.id }
    })

    if (donationCount > 0) {
      return NextResponse.json(
        { error: 'Campaign tidak dapat dihapus karena sudah ada donasi' },
        { status: 400 }
      )
    }

    // Soft delete campaign
    await softDelete(
      prisma.donation_campaigns,
      { slug },
      session.user.id
    )

    return NextResponse.json({ message: 'Campaign berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus campaign' },
      { status: 500 }
    )
  }
}