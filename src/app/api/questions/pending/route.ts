import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { QUESTION_CATEGORIES } from '@/types'

const prisma = new PrismaClient()

const querySchema = z.object({
  category: z.enum(['fiqih_ibadah', 'muamalah', 'akhlaq', 'aqidah', 'tafsir', 'tahsin'] as const).optional(),
  search: z.string().optional(),
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(5).max(50)).default('10'),
  sortBy: z.enum(['createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized. Please login first.'
      }, { status: 401 })
    }
    
    // Check if user is ustadz or admin
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, isUstadz: true, name: true }
    })
    
    if (!user || (!user.isUstadz && !['ADMIN', 'SUPER_ADMIN'].includes(user.role))) {
      return NextResponse.json({
        success: false,
        message: 'Forbidden. Only ustadz can access this resource.'
      }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const query = querySchema.parse({
      category: searchParams.get('category'),
      search: searchParams.get('search'),
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc'
    })
    
    // Build where clause for pending questions
    const where: any = {
      status: 'pending'
    }
    
    if (query.category) {
      where.category = query.category
    }
    
    if (query.search) {
      where.question = {
        contains: query.search,
        mode: 'insensitive'
      }
    }
    
    // Calculate pagination
    const skip = (query.page - 1) * query.limit
    
    // Get total count for pagination
    const totalCount = await prisma.questions.count({ where })
    
    // Fetch pending questions
    const questions = await prisma.questions.findMany({
      where,
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
      categoryColor: QUESTION_CATEGORIES.find(cat => cat.value === question.category)?.color || 'bg-gray-100 text-gray-800',
      askerName: question.isAnonymous ? 'Anonim' : (question.askerName || 'Anonim'),
      isAnonymous: question.isAnonymous,
      status: question.status,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt
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
      },
      user: {
        id: user.id,
        name: user.name,
        isUstadz: user.isUstadz
      }
    })
    
  } catch (error) {
    console.error('Error fetching pending questions:', error)
    
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