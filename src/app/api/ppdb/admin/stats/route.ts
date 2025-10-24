import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get comprehensive statistics
    const [
      totalRegistrations,
      statusStats,
      levelStats,
      paymentStats,
      testResultStats,
      monthlyStats,
      recentStats
    ] = await Promise.all([
      // Total registrations
      prisma.registrations.count(),
      
      // Group by status
      prisma.registrations.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      
      // Group by level
      prisma.registrations.groupBy({
        by: ['level'],
        _count: { level: true }
      }),
      
      // Group by payment status
      prisma.registrations.groupBy({
        by: ['paymentStatus'],
        _count: { paymentStatus: true }
      }),
      
      // Group by test result
      prisma.registrations.groupBy({
        by: ['testResult'],
        _count: { testResult: true },
        where: {
          testResult: { not: null }
        }
      }),
      
      // Monthly registrations (last 6 months)
      getMonthlyRegistrations(),
      
      // Recent activity stats (last 7 days, 30 days)
      getRecentStats()
    ])

    // Process status stats
    const byStatus = statusStats.reduce((acc, item) => {
      acc[item.status] = item._count.status
      return acc
    }, {} as Record<string, number>)

    // Process level stats
    const byLevel = levelStats.reduce((acc, item) => {
      acc[item.level] = item._count.level
      return acc
    }, {} as Record<string, number>)

    // Process payment stats
    const byPaymentStatus = paymentStats.reduce((acc, item) => {
      acc[item.paymentStatus] = item._count.paymentStatus
      return acc
    }, {} as Record<string, number>)

    // Process test result stats
    const byTestResult = testResultStats.reduce((acc, item) => {
      acc[item.testResult || 'UNKNOWN'] = item._count.testResult
      return acc
    }, {} as Record<string, number>)

    // Calculate additional metrics
    const completionRate = totalRegistrations > 0 
      ? Math.round((byStatus.REGISTERED || 0) / totalRegistrations * 100) 
      : 0

    const passRate = (byTestResult.PASSED || 0) + (byTestResult.FAILED || 0) > 0
      ? Math.round((byTestResult.PASSED || 0) / ((byTestResult.PASSED || 0) + (byTestResult.FAILED || 0)) * 100)
      : 0

    const paymentRate = totalRegistrations > 0
      ? Math.round(((byPaymentStatus.PAID || 0) + (byPaymentStatus.VERIFIED || 0)) / totalRegistrations * 100)
      : 0

    return NextResponse.json({
      success: true,
      data: {
        total: totalRegistrations,
        byStatus,
        byLevel,
        byPaymentStatus,
        byTestResult,
        monthlyStats,
        recentStats,
        metrics: {
          completionRate,
          passRate,
          paymentRate
        }
      }
    })

  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Get monthly registration statistics for the last 6 months
async function getMonthlyRegistrations() {
  const currentDate = new Date()
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(currentDate.getMonth() - 6)

  const monthlyData = await prisma.registrations.groupBy({
    by: ['createdAt'],
    _count: { id: true },
    where: {
      createdAt: {
        gte: sixMonthsAgo
      }
    }
  })

  // Group by month
  const monthlyStats: Record<string, number> = {}
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date()
    date.setMonth(currentDate.getMonth() - i)
    const monthKey = date.toISOString().substring(0, 7) // YYYY-MM format
    monthlyStats[monthKey] = 0
  }

  monthlyData.forEach(item => {
    const monthKey = item.createdAt.toISOString().substring(0, 7)
    if (monthKey in monthlyStats) {
      monthlyStats[monthKey] += item._count.id
    }
  })

  return monthlyStats
}

// Get recent activity statistics
async function getRecentStats() {
  const now = new Date()
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    registrationsLast7Days,
    registrationsLast30Days,
    verificationsLast7Days,
    paymentsLast7Days,
    testsLast7Days
  ] = await Promise.all([
    // New registrations last 7 days
    prisma.registrations.count({
      where: {
        createdAt: { gte: last7Days }
      }
    }),
    
    // New registrations last 30 days
    prisma.registrations.count({
      where: {
        createdAt: { gte: last30Days }
      }
    }),
    
    // Verifications last 7 days
    prisma.registrations.count({
      where: {
        verifiedAt: { gte: last7Days }
      }
    }),
    
    // Payments last 7 days
    prisma.registrations.count({
      where: {
        paymentDate: { gte: last7Days }
      }
    }),
    
    // Tests scheduled/taken last 7 days
    prisma.registrations.count({
      where: {
        testSchedule: { gte: last7Days }
      }
    })
  ])

  return {
    registrations: {
      last7Days: registrationsLast7Days,
      last30Days: registrationsLast30Days
    },
    verifications: {
      last7Days: verificationsLast7Days
    },
    payments: {
      last7Days: paymentsLast7Days
    },
    tests: {
      last7Days: testsLast7Days
    }
  }
}