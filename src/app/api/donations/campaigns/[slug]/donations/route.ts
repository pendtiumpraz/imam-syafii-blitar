import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    const { searchParams } = new URL(request.url)
    
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit
    
    // Find campaign first
    const campaign = await prisma.donations_campaigns.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign tidak ditemukan' },
        { status: 404 }
      )
    }

    // Get donations for this campaign
    const [donations, total] = await Promise.all([
      prisma.donations.findMany({
        where: {
          campaignId: campaign.id,
          paymentStatus: 'VERIFIED' // Only show verified donations for public view
        },
        include: {
          category: true,
          campaign: {
            select: { title: true, slug: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.donations.count({
        where: {
          campaignId: campaign.id,
          paymentStatus: 'VERIFIED'
        }
      })
    ])

    // Parse amount fields and hide sensitive info for anonymous donations
    const sanitizedDonations = donations.map(donation => ({
      ...donation,
      amount: parseFloat(donation.amount.toString()),
      donorName: donation.isAnonymous ? null : donation.donorName,
      donorEmail: donation.isAnonymous ? null : donation.donorEmail,
      donorPhone: donation.isAnonymous ? null : donation.donorPhone
    }))

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
    console.error('Error fetching campaign donations:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data donasi campaign' },
      { status: 500 }
    )
  }
}