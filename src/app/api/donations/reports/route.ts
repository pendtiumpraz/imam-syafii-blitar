import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'summary'
    const period = searchParams.get('period') || 'monthly'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    switch (type) {
      case 'summary':
        return await getSummaryReport()
      case 'donations':
        return await getDonationsReport(startDate, endDate)
      case 'campaigns':
        return await getCampaignsReport()
      case 'categories':
        return await getCategoriesReport(startDate, endDate)
      default:
        return NextResponse.json(
          { error: 'Tipe laporan tidak valid' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error generating reports:', error)
    return NextResponse.json(
      { error: 'Gagal membuat laporan' },
      { status: 500 }
    )
  }
}

async function getSummaryReport() {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  // Get current month data
  const startOfMonth = new Date(currentYear, currentMonth, 1)
  const startOfYear = new Date(currentYear, 0, 1)

  const [
    totalDonations,
    totalAmount,
    monthlyAmount,
    yearlyAmount,
    campaignStats,
    categoryBreakdown,
    monthlyTrend,
    topCampaigns,
    recentDonations
  ] = await Promise.all([
    // Total donations count
    prisma.donations.count({
      where: { paymentStatus: 'VERIFIED' }
    }),
    
    // Total amount
    prisma.donations.aggregate({
      where: { paymentStatus: 'VERIFIED' },
      _sum: { amount: true }
    }),
    
    // Monthly amount
    prisma.donations.aggregate({
      where: {
        paymentStatus: 'VERIFIED',
        createdAt: { gte: startOfMonth }
      },
      _sum: { amount: true }
    }),
    
    // Yearly amount
    prisma.donations.aggregate({
      where: {
        paymentStatus: 'VERIFIED',
        createdAt: { gte: startOfYear }
      },
      _sum: { amount: true }
    }),
    
    // Campaign statistics
    Promise.all([
      prisma.donations_campaigns.count({ where: { status: 'ACTIVE' } }),
      prisma.donations_campaigns.count({ where: { status: 'COMPLETED' } }),
      prisma.donations_campaigns.count()
    ]).then(([active, completed, total]) => ({
      active,
      completed,
      totalCampaigns: total
    })),
    
    // Category breakdown
    prisma.donations.groupBy({
      by: ['categoryId'],
      where: { paymentStatus: 'VERIFIED' },
      _sum: { amount: true },
      _count: true
    }).then(async (results) => {
      const categories = await prisma.donations_categories.findMany({
        where: {
          id: { in: results.map(r => r.categoryId) }
        }
      })
      
      const totalAmount = results.reduce((sum, r) => sum + parseFloat(r._sum.amount?.toString() || '0'), 0)
      
      return results.map(result => {
        const category = categories.find(c => c.id === result.categoryId)
        const amount = parseFloat(result._sum.amount?.toString() || '0')
        return {
          category: category?.name || 'Unknown',
          amount,
          count: result._count,
          percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0
        }
      }).sort((a, b) => b.amount - a.amount)
    }),
    
    // Monthly trend (last 12 months)
    Promise.all(
      Array.from({ length: 12 }, (_, i) => {
        const month = new Date(currentYear, currentMonth - i, 1)
        const nextMonth = new Date(currentYear, currentMonth - i + 1, 1)
        
        return prisma.donations.aggregate({
          where: {
            paymentStatus: 'VERIFIED',
            createdAt: {
              gte: month,
              lt: nextMonth
            }
          },
          _sum: { amount: true }
        }).then(result => parseFloat(result._sum.amount?.toString() || '0'))
      })
    ).then(amounts => amounts.reverse()),
    
    // Top campaigns
    prisma.donations_campaigns.findMany({
      include: {
        _count: {
          select: {
            donations: {
              where: { paymentStatus: 'VERIFIED' }
            }
          }
        }
      },
      orderBy: { currentAmount: 'desc' },
      take: 10
    }).then(campaigns => 
      campaigns.map(campaign => ({
        id: campaign.id,
        title: campaign.title,
        currentAmount: parseFloat(campaign.currentAmount.toString()),
        targetAmount: parseFloat(campaign.targetAmount.toString()),
        percentage: (parseFloat(campaign.currentAmount.toString()) / parseFloat(campaign.targetAmount.toString())) * 100,
        donorCount: campaign._count.donations
      }))
    ),
    
    // Recent donations
    prisma.donations.findMany({
      where: { paymentStatus: 'VERIFIED' },
      include: {
        campaign: {
          select: { title: true, slug: true }
        },
        category: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    }).then(donations =>
      donations.map(donation => ({
        ...donation,
        amount: parseFloat(donation.amount.toString())
      }))
    )
  ])

  return NextResponse.json({
    totalDonations,
    totalAmount: parseFloat(totalAmount._sum.amount?.toString() || '0'),
    monthlyAmount: parseFloat(monthlyAmount._sum.amount?.toString() || '0'),
    yearlyAmount: parseFloat(yearlyAmount._sum.amount?.toString() || '0'),
    monthlyTrend: Array.from({ length: 12 }, (_, i) => monthlyTrend[i] || 0),
    campaignStats,
    categoryBreakdown,
    topCampaigns,
    recentDonations: recentDonations.slice(0, 10)
  })
}

async function getDonationsReport(startDate?: string | null, endDate?: string | null) {
  const where: any = { paymentStatus: 'VERIFIED' }
  
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = new Date(startDate)
    if (endDate) where.createdAt.lte = new Date(endDate)
  }

  const [donations, summary] = await Promise.all([
    prisma.donations.findMany({
      where,
      include: {
        campaign: { select: { title: true, slug: true } },
        category: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.donations.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
      _avg: { amount: true }
    })
  ])

  return NextResponse.json({
    donations: donations.map(d => ({
      ...d,
      amount: parseFloat(d.amount.toString())
    })),
    summary: {
      totalAmount: parseFloat(summary._sum.amount?.toString() || '0'),
      totalDonations: summary._count,
      averageAmount: parseFloat(summary._avg.amount?.toString() || '0')
    }
  })
}

async function getCampaignsReport() {
  const campaigns = await prisma.donations_campaigns.findMany({
    include: {
      category: { select: { name: true } },
      creator: { select: { name: true } },
      _count: {
        select: {
          donations: {
            where: { paymentStatus: 'VERIFIED' }
          }
        }
      }
    },
    orderBy: { currentAmount: 'desc' }
  })

  const campaignsWithStats = campaigns.map(campaign => ({
    ...campaign,
    currentAmount: parseFloat(campaign.currentAmount.toString()),
    targetAmount: parseFloat(campaign.targetAmount.toString()),
    percentage: (parseFloat(campaign.currentAmount.toString()) / parseFloat(campaign.targetAmount.toString())) * 100,
    donorCount: campaign._count.donations,
    images: JSON.parse(campaign.images)
  }))

  return NextResponse.json({
    campaigns: campaignsWithStats,
    summary: {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'ACTIVE').length,
      completedCampaigns: campaigns.filter(c => c.status === 'COMPLETED').length,
      totalTarget: campaigns.reduce((sum, c) => sum + parseFloat(c.targetAmount.toString()), 0),
      totalRaised: campaigns.reduce((sum, c) => sum + parseFloat(c.currentAmount.toString()), 0)
    }
  })
}

async function getCategoriesReport(startDate?: string | null, endDate?: string | null) {
  const where: any = { paymentStatus: 'VERIFIED' }
  
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = new Date(startDate)
    if (endDate) where.createdAt.lte = new Date(endDate)
  }

  const categoryStats = await prisma.donations.groupBy({
    by: ['categoryId'],
    where,
    _sum: { amount: true },
    _count: true,
    _avg: { amount: true }
  })

  const categories = await prisma.donations_categories.findMany({
    where: {
      id: { in: categoryStats.map(s => s.categoryId) }
    }
  })

  const totalAmount = categoryStats.reduce((sum, stat) => sum + parseFloat(stat._sum.amount?.toString() || '0'), 0)

  const categoriesWithStats = categoryStats.map(stat => {
    const category = categories.find(c => c.id === stat.categoryId)
    const amount = parseFloat(stat._sum.amount?.toString() || '0')
    
    return {
      id: category?.id,
      name: category?.name || 'Unknown',
      description: category?.description,
      icon: category?.icon,
      color: category?.color,
      totalAmount: amount,
      totalDonations: stat._count,
      averageAmount: parseFloat(stat._avg.amount?.toString() || '0'),
      percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0
    }
  }).sort((a, b) => b.totalAmount - a.totalAmount)

  return NextResponse.json({
    categories: categoriesWithStats,
    summary: {
      totalCategories: categoriesWithStats.length,
      totalAmount,
      totalDonations: categoryStats.reduce((sum, stat) => sum + stat._count, 0)
    }
  })
}