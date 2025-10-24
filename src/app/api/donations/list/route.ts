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
    const campaignId = searchParams.get('campaignId')
    const categoryId = searchParams.get('categoryId')
    const verified = searchParams.get('verified') === 'true'
    const donorEmail = searchParams.get('donorEmail')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    const skip = (page - 1) * limit

    // Check if user is admin to see all donations or just public ones
    const session = await getServerSession(authOptions)
    const isAdmin = session?.user?.role === 'ADMIN'

    // Build where clause
    const where: any = {}
    
    if (status) {
      where.paymentStatus = status
    }
    
    if (verified) {
      where.paymentStatus = 'VERIFIED'
    }
    
    if (campaignId) {
      where.campaignId = campaignId
    }
    
    if (categoryId) {
      where.categoryId = categoryId
    }
    
    if (donorEmail && isAdmin) {
      where.donorEmail = donorEmail
    }
    
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    // For public access, only show verified donations
    if (!isAdmin) {
      where.paymentStatus = 'VERIFIED'
    }

    // Get donations with relations
    const [donations, total] = await Promise.all([
      prisma.donations.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.donations.count({ where })
    ])

    // Fetch related data
    const [categories, campaigns] = await Promise.all([
      prisma.donation_categories.findMany({
        where: { id: { in: donations.map(d => d.categoryId).filter(Boolean) } }
      }),
      prisma.donation_campaigns.findMany({
        where: { id: { in: donations.map(d => d.campaignId).filter(Boolean) as string[] } },
        select: { id: true, title: true, slug: true }
      })
    ])

    // Create maps for O(1) lookups
    const categoriesMap = new Map(categories.map(c => [c.id, c]))
    const campaignsMap = new Map(campaigns.map(c => [c.id, c]))

    // Parse amount fields and sanitize sensitive data for non-admin users
    const sanitizedDonations = donations.map(donation => {
      const baseData = {
        ...donation,
        amount: parseFloat(donation.amount.toString()),
        category: categoriesMap.get(donation.categoryId),
        campaign: donation.campaignId ? campaignsMap.get(donation.campaignId) : null
      }

      // Hide sensitive information for non-admin users
      if (!isAdmin) {
        return {
          ...baseData,
          donorName: donation.isAnonymous ? null : donation.donorName,
          donorEmail: null, // Always hide email for public
          donorPhone: null, // Always hide phone for public
          ipAddress: null,
          userAgent: null,
          referrer: null,
          proofUrl: null,
          verifiedBy: null,
          verifiedAt: donation.verifiedAt
        }
      }

      return baseData
    })

    return NextResponse.json({
      donations: sanitizedDonations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching donations:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data donasi' },
      { status: 500 }
    )
  }
}