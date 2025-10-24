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

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    // Get current month data
    const startOfMonth = new Date(currentYear, currentMonth, 1)
    const startOfYear = new Date(currentYear, 0, 1)

    const [
      totalStats,
      monthlyStats,
      campaignStats,
      categoryBreakdown,
      monthlyTrend,
      topCampaigns,
      recentDonations
    ] = await Promise.all([
      // Total statistics
      prisma.donations.aggregate({
        where: { paymentStatus: 'VERIFIED' },
        _sum: { amount: true },
        _count: true
      }),
      
      // Monthly statistics
      prisma.donations.aggregate({
        where: {
          paymentStatus: 'VERIFIED',
          createdAt: { gte: startOfMonth }
        },
        _sum: { amount: true },
        _count: true
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
          slug: campaign.slug,
          currentAmount: parseFloat(campaign.currentAmount.toString()),
          targetAmount: parseFloat(campaign.targetAmount.toString()),
          percentage: Math.min(
            (parseFloat(campaign.currentAmount.toString()) / parseFloat(campaign.targetAmount.toString())) * 100,
            100
          ),
          donorCount: campaign._count.donations
        }))
      ),
      
      // Recent donations (last 10)
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
        take: 10
      }).then(donations =>
        donations.map(donation => ({
          id: donation.id,
          donationNo: donation.donationNo,
          amount: parseFloat(donation.amount.toString()),
          donorName: donation.isAnonymous ? null : donation.donorName,
          donorEmail: donation.isAnonymous ? null : donation.donorEmail,
          message: donation.message,
          isAnonymous: donation.isAnonymous,
          createdAt: donation.createdAt,
          campaign: donation.campaign,
          category: donation.category
        }))
      )
    ])

    const response = {
      totalDonations: totalStats._count,
      totalAmount: parseFloat(totalStats._sum.amount?.toString() || '0'),
      monthlyDonations: monthlyStats._count,
      monthlyAmount: parseFloat(monthlyStats._sum.amount?.toString() || '0'),
      monthlyTrend: monthlyTrend,
      campaignStats,
      categoryBreakdown,
      topCampaigns,
      recentDonations
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error generating summary report:', error)
    return NextResponse.json(
      { error: 'Gagal membuat ringkasan laporan' },
      { status: 500 }
    )
  }
}