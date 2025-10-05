import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    console.log('🔍 Debug login attempt:', { username, hasPassword: !!password })

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: { username }
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        details: {
          username,
          query: 'findFirst',
          middleware: process.env.NODE_ENV === 'development' || process.env.ENABLE_SOFT_DELETE === 'true' ? 'enabled' : 'disabled'
        }
      })
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password)

    return NextResponse.json({
      success: passwordMatch,
      user: {
        id: user.id,
        username: user.username,
        isActive: user.isActive,
        isDeleted: (user as any).isDeleted,
        hasPassword: !!user.password,
        passwordMatch
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        ENABLE_SOFT_DELETE: process.env.ENABLE_SOFT_DELETE,
        DATABASE_URL: process.env.DATABASE_URL?.substring(0, 30) + '...',
      }
    })
  } catch (error) {
    console.error('Debug login error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
