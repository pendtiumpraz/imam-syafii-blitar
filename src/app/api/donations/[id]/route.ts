import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/donations/[id] - Get single campaign details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const campaign = await prisma.donationCampaign.findUnique({
      where: { id },
      include: {
        category: true,
        creator: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: {
            donations: {
              where: { paymentStatus: 'VERIFIED' }
            },
            updates: true
          }
        },
        donations: {
          where: {
            paymentStatus: 'VERIFIED',
            isAnonymous: false
          },
          select: {
            id: true,
            donorName: true,
            amount: true,
            message: true,
            paidAt: true
          },
          orderBy: {
            paidAt: 'desc'
          },
          take: 10
        }
      }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if user can view this campaign
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user?.role === 'ADMIN'
    const isCreator = session?.user?.id === campaign.createdBy

    // Non-admin and non-creator can only view ACTIVE or COMPLETED campaigns
    if (!isAdmin && !isCreator && !['ACTIVE', 'COMPLETED'].includes(campaign.status)) {
      return NextResponse.json(
        { error: 'Campaign tidak tersedia' },
        { status: 403 }
      )
    }

    // Format the response
    const response = {
      ...campaign,
      images: JSON.parse(campaign.images),
      currentAmount: parseFloat(campaign.currentAmount.toString()),
      targetAmount: parseFloat(campaign.targetAmount.toString()),
      donations: campaign.donations.map(d => ({
        ...d,
        amount: parseFloat(d.amount.toString())
      }))
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching campaign:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data campaign' },
      { status: 500 }
    )
  }
}

// PUT /api/donations/[id] - Update campaign (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Check authentication
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin role
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { id } = params
    const body = await request.json()

    // Find existing campaign
    const existingCampaign = await prisma.donationCampaign.findUnique({
      where: { id }
    })

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign tidak ditemukan' },
        { status: 404 }
      )
    }

    const {
      title,
      slug,
      description,
      story,
      categoryId,
      targetAmount,
      currentAmount,
      startDate,
      endDate,
      mainImage,
      images,
      video,
      status,
      isFeatured,
      isUrgent,
      allowAnonymous
    } = body

    // Validate status if provided
    if (status) {
      const validStatuses = ['DRAFT', 'ACTIVE', 'CLOSED', 'COMPLETED', 'CANCELLED', 'REDIRECTED']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Status tidak valid. Harus salah satu dari: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Check if slug is being changed and if it's unique
    if (slug && slug !== existingCampaign.slug) {
      const slugExists = await prisma.donationCampaign.findUnique({
        where: { slug }
      })

      if (slugExists) {
        return NextResponse.json(
          { error: 'Slug sudah digunakan' },
          { status: 400 }
        )
      }
    }

    // Verify category exists if being changed
    if (categoryId && categoryId !== existingCampaign.categoryId) {
      const category = await prisma.donationCategory.findUnique({
        where: { id: categoryId }
      })

      if (!category) {
        return NextResponse.json(
          { error: 'Kategori tidak ditemukan' },
          { status: 400 }
        )
      }
    }

    // Build update data
    const updateData: any = {
      updatedAt: new Date()
    }

    if (title !== undefined) updateData.title = title
    if (slug !== undefined) updateData.slug = slug
    if (description !== undefined) updateData.description = description
    if (story !== undefined) updateData.story = story
    if (categoryId !== undefined) updateData.categoryId = categoryId
    if (targetAmount !== undefined) updateData.targetAmount = parseFloat(targetAmount.toString())
    if (currentAmount !== undefined) updateData.currentAmount = parseFloat(currentAmount.toString())
    if (startDate !== undefined) updateData.startDate = new Date(startDate)
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null
    if (mainImage !== undefined) updateData.mainImage = mainImage
    if (images !== undefined) updateData.images = JSON.stringify(images)
    if (video !== undefined) updateData.video = video
    if (status !== undefined) updateData.status = status
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured
    if (isUrgent !== undefined) updateData.isUrgent = isUrgent
    if (allowAnonymous !== undefined) updateData.allowAnonymous = allowAnonymous

    // Update campaign
    const updatedCampaign = await prisma.donationCampaign.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        creator: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json({
      ...updatedCampaign,
      images: JSON.parse(updatedCampaign.images),
      currentAmount: parseFloat(updatedCampaign.currentAmount.toString()),
      targetAmount: parseFloat(updatedCampaign.targetAmount.toString())
    })
  } catch (error) {
    console.error('Error updating campaign:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui campaign' },
      { status: 500 }
    )
  }
}

// DELETE /api/donations/[id] - Delete campaign (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    // Check authentication and admin role
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { id } = params

    // Find existing campaign
    const existingCampaign = await prisma.donationCampaign.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            donations: true
          }
        }
      }
    })

    if (!existingCampaign) {
      return NextResponse.json(
        { error: 'Campaign tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if campaign has donations
    if (existingCampaign._count.donations > 0) {
      return NextResponse.json(
        { error: 'Campaign tidak dapat dihapus karena sudah ada donasi. Gunakan status CANCELLED sebagai gantinya.' },
        { status: 400 }
      )
    }

    // Delete campaign (cascade will delete related updates)
    await prisma.donationCampaign.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Campaign berhasil dihapus',
      deletedId: id
    })
  } catch (error) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus campaign' },
      { status: 500 }
    )
  }
}
