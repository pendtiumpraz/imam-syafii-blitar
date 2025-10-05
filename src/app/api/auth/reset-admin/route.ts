import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    const INIT_SECRET = process.env.INIT_SECRET || 'init-secret-2024'

    if (secret !== INIT_SECRET) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 403 }
      )
    }

    const { default: prisma } = await import('@/lib/prisma')

    // Force update admin password using findFirst + update
    const hashedPassword = await bcrypt.hash('admin123', 10)

    // Find admin (use findFirst to avoid middleware issues)
    const admin = await prisma.user.findFirst({
      where: { username: 'admin' }
    })

    if (!admin) {
      // Create if doesn't exist
      const newAdmin = await prisma.user.create({
        data: {
          username: 'admin',
          email: 'admin@ponpesimamsyafii.id',
          password: hashedPassword,
          name: 'Administrator',
          role: 'ADMIN',
          isActive: true
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Admin user created',
        user: {
          id: newAdmin.id,
          username: newAdmin.username,
          password: 'admin123'
        }
      })
    }

    // Update existing
    const updated = await prisma.user.update({
      where: { id: admin.id },
      data: {
        password: hashedPassword,
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Admin password reset successfully',
      user: {
        id: updated.id,
        username: updated.username,
        isActive: updated.isActive,
        password: 'admin123'
      }
    })
  } catch (error) {
    console.error('Reset admin error:', error)
    return NextResponse.json(
      {
        error: 'Failed to reset admin',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
