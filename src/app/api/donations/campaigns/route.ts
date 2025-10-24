import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const featured = searchParams.get('featured') === 'true'
    const urgent = searchParams.get('urgent') === 'true'
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('search')
    
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (featured) {
      where.isFeatured = true
    }
    
    if (urgent) {
      where.isUrgent = true
    }
    
    if (categoryId) {
      where.categoryId = categoryId
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get campaigns
    const [campaigns, total] = await Promise.all([
      prisma.donation_campaigns.findMany({
        where,
        orderBy: [
          { isFeatured: 'desc' },
          { isUrgent: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.donation_campaigns.count({ where })
    ])

    // Fetch related data
    const [categories, creators] = await Promise.all([
      prisma.donation_categories.findMany({
        where: { id: { in: campaigns.map(c => c.categoryId).filter(Boolean) } }
      }),
      prisma.users.findMany({
        where: { id: { in: campaigns.map(c => c.createdBy).filter(Boolean) } },
        select: { id: true, name: true, email: true }
      })
    ])

    // Fetch counts for each campaign
    const campaignIds = campaigns.map(c => c.id)
    const [donationCounts, updateCounts] = await Promise.all([
      Promise.all(campaignIds.map(id =>
        prisma.donations.count({
          where: { campaignId: id, paymentStatus: 'VERIFIED' }
        })
      )),
      Promise.all(campaignIds.map(id =>
        prisma.campaign_updates.count({
          where: { campaignId: id }
        })
      ))
    ])

    // Create maps for O(1) lookups
    const categoriesMap = new Map(categories.map(c => [c.id, c]))
    const creatorsMap = new Map(creators.map(c => [c.id, c]))

    // Parse JSON fields
    const campaignsWithParsedData = campaigns.map((campaign, index) => ({
      ...campaign,
      images: JSON.parse(campaign.images),
      currentAmount: parseFloat(campaign.currentAmount.toString()),
      targetAmount: parseFloat(campaign.targetAmount.toString()),
      category: categoriesMap.get(campaign.categoryId),
      creator: creatorsMap.get(campaign.createdBy),
      _count: {
        donations: donationCounts[index],
        updates: updateCounts[index]
      }
    }))

    return NextResponse.json({
      campaigns: campaignsWithParsedData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data campaign' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      title,
      slug,
      description,
      story,
      categoryId,
      targetAmount,
      startDate,
      endDate,
      mainImage,
      images = [],
      video,
      isFeatured = false,
      isUrgent = false,
      allowAnonymous = true
    } = body

    // Validate required fields
    if (!title || !description || !categoryId || !targetAmount) {
      return NextResponse.json(
        { error: 'Field yang wajib belum diisi' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    if (slug) {
      const existingCampaign = await prisma.donation_campaigns.findUnique({
        where: { slug }
      })
      
      if (existingCampaign) {
        return NextResponse.json(
          { error: 'Slug sudah digunakan' },
          { status: 400 }
        )
      }
    }

    // Generate slug if not provided
    let finalSlug = slug
    if (!finalSlug) {
      finalSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-')
      
      // Ensure uniqueness
      let counter = 1
      let uniqueSlug = finalSlug
      while (await prisma.donation_campaigns.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${finalSlug}-${counter}`
        counter++
      }
      finalSlug = uniqueSlug
    }

    // Create campaign
    const campaign = await prisma.donation_campaigns.create({
      data: {
        title,
        slug: finalSlug,
        description,
        story,
        categoryId,
        targetAmount: parseFloat(targetAmount.toString()),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        mainImage,
        images: JSON.stringify(images),
        video,
        isFeatured,
        isUrgent,
        allowAnonymous,
        createdBy: session.user.id,
        status: 'DRAFT'
      }
    })

    // Fetch related data
    const [category, creator] = await Promise.all([
      prisma.donation_categories.findUnique({
        where: { id: campaign.categoryId }
      }),
      prisma.users.findUnique({
        where: { id: campaign.createdBy },
        select: { id: true, name: true, email: true }
      })
    ])

    return NextResponse.json({
      ...campaign,
      images: JSON.parse(campaign.images),
      currentAmount: parseFloat(campaign.currentAmount.toString()),
      targetAmount: parseFloat(campaign.targetAmount.toString()),
      category,
      creator
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json(
      { error: 'Gagal membuat campaign' },
      { status: 500 }
    )
  }
}