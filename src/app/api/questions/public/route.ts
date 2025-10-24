import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { QuestionCategory, QUESTION_CATEGORIES } from '@/types'

const prisma = new PrismaClient()

const querySchema = z.object({
  category: z.enum(['fiqih_ibadah', 'muamalah', 'akhlaq', 'aqidah', 'tafsir', 'tahsin'] as const).optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(5).max(50).default(10),
  sortBy: z.enum(['createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const query = querySchema.parse({
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc'
    })
    
    // Build where clause
    const where: any = {
      status: 'answered',
      answer: {
        isNot: null
      }
    }
    
    if (query.category) {
      where.category = query.category
    }
    
    if (query.search) {
      const searchTerm = `%${query.search}%`
      where.OR = [
        {
          question: {
            contains: query.search,
            mode: 'insensitive'
          }
        },
        {
          answer: {
            answer: {
              contains: query.search,
              mode: 'insensitive'
            }
          }
        }
      ]
    }
    
    // Calculate pagination
    const skip = (query.page - 1) * query.limit
    
    // Get total count for pagination
    const totalCount = await prisma.questions.count({ where })
    
    // Fetch questions with answers
    const questions = await prisma.questions.findMany({
      where,
      include: {
        answer: {
          include: {
            ustadz: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        [query.sortBy]: query.sortOrder
      },
      skip,
      take: query.limit
    })
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / query.limit)
    const hasNext = query.page < totalPages
    const hasPrev = query.page > 1
    
    // Format response
    const formattedQuestions = questions.map(question => ({
      id: question.id,
      question: question.question,
      category: question.category,
      categoryLabel: QUESTION_CATEGORIES.find(cat => cat.value === question.category)?.label || question.category,
      askerName: question.isAnonymous ? 'Anonim' : (question.askerName || 'Anonim'),
      isAnonymous: question.isAnonymous,
      createdAt: question.createdAt,
      answer: question.answer ? {
        id: question.answer.id,
        answer: question.answer.answer,
        ustadzName: question.answer.ustadz.name,
        answeredAt: question.answer.createdAt,
        updatedAt: question.answer.updatedAt
      } : null
    }))
    
    return NextResponse.json({
      success: true,
      data: formattedQuestions,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: totalCount,
        totalPages,
        hasNext,
        hasPrev
      }
    })
    
  } catch (error) {
    console.error('Error fetching public questions:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Parameter tidak valid',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data pertanyaan'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}