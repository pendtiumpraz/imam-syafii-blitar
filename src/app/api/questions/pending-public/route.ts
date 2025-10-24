import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const querySchema = z.object({
  category: z.enum(['fiqih_ibadah', 'muamalah', 'akhlaq', 'aqidah', 'tafsir', 'tahsin'] as const).optional(),
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
    
    // Get total count
    const totalCount = await prisma.questions.count({ where })
    
    // Get pending questions (public view - show all pending)
    const questions = await prisma.questions.findMany({
      where,
      select: {
        id: true,
        question: true,
        category: true,
        askerName: true,
        isAnonymous: true,
        createdAt: true,
        status: true
      },
      orderBy: {
        [query.sortBy]: query.sortOrder
      },
      skip: (query.page - 1) * query.limit,
      take: query.limit
    })
    
    // Calculate pagination
    const totalPages = Math.ceil(totalCount / query.limit)
    
    return NextResponse.json({
      success: true,
      data: questions,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: totalCount,
        totalPages,
        hasNext: query.page < totalPages,
        hasPrev: query.page > 1
      }
    }, { status: 200 })
    
  } catch (error) {
    console.error('Error fetching pending questions:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Invalid query parameters',
        errors: error.errors
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