import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Get counts for different statuses
    const [totalQuestions, answeredQuestions, pendingQuestions] = await Promise.all([
      prisma.questions.count(),
      prisma.questions.count({
        where: {
          status: 'answered'
        }
      }),
      prisma.questions.count({
        where: {
          status: 'pending'
        }
      })
    ])

    // Get category breakdown
    const categoryStats = await prisma.questions.groupBy({
      by: ['category'],
      _count: {
        id: true
      }
    })

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentQuestions = await prisma.questions.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    })

    const recentAnswers = await prisma.answers.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    })

    // Calculate average response time for answered questions
    const answeredQuestionsWithTime = await prisma.questions.findMany({
      where: {
        status: 'answered'
      }
    })

    let averageResponseTime = 0
    if (answeredQuestionsWithTime.length > 0) {
      // Fetch answers for these questions
      const questionIds = answeredQuestionsWithTime.map(q => q.id);
      const answersForQuestions = await prisma.answers.findMany({
        where: {
          questionId: { in: questionIds }
        }
      });

      // Create a map of questionId to answer
      const answerMap = new Map(answersForQuestions.map(a => [a.questionId, a]));

      const responseTimes = answeredQuestionsWithTime.map(q => {
        const answer = answerMap.get(q.id);
        if (answer) {
          return answer.createdAt.getTime() - q.createdAt.getTime()
        }
        return 0
      }).filter(time => time > 0)

      if (responseTimes.length > 0) {
        averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        // Convert to hours
        averageResponseTime = Math.round(averageResponseTime / (1000 * 60 * 60))
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalQuestions,
        answeredQuestions,
        pendingQuestions,
        categoryStats: categoryStats.map(stat => ({
          category: stat.category,
          count: stat._count.id
        })),
        recentActivity: {
          questionsLast7Days: recentQuestions,
          answersLast7Days: recentAnswers
        },
        averageResponseTimeHours: averageResponseTime || 24, // Default to 24 hours
        percentageAnswered: totalQuestions > 0 
          ? Math.round((answeredQuestions / totalQuestions) * 100) 
          : 0
      }
    }, { status: 200 })
    
  } catch (error) {
    console.error('Error fetching question stats:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil statistik'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// For CORS support if needed
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}