import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { QuestionCategory } from '@/types'

const prisma = new PrismaClient()

const submitQuestionSchema = z.object({
  question: z.string().min(10, 'Pertanyaan minimal 10 karakter').max(2000, 'Pertanyaan maksimal 2000 karakter'),
  category: z.enum(['fiqih_ibadah', 'muamalah', 'akhlaq', 'aqidah', 'tafsir', 'tahsin'] as const),
  askerName: z.string().nullable().optional(),
  isAnonymous: z.boolean().default(false)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the request body
    const validatedData = submitQuestionSchema.parse(body)
    
    // Clean the data
    const questionData = {
      question: validatedData.question.trim(),
      category: validatedData.category,
      askerName: validatedData.isAnonymous ? null : validatedData.askerName?.trim() || null,
      isAnonymous: validatedData.isAnonymous,
      status: 'pending' as const
    }
    
    // Save to database
    const question = await prisma.questions.create({
      data: questionData
    })
    
    return NextResponse.json({
      success: true,
      message: 'Pertanyaan berhasil dikirim dan akan dijawab oleh ustadz kami',
      questionId: question.id,
      data: {
        id: question.id,
        status: question.status,
        createdAt: question.createdAt
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error submitting question:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        message: 'Data tidak valid',
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      message: 'Terjadi kesalahan saat mengirim pertanyaan. Silakan coba lagi.'
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}