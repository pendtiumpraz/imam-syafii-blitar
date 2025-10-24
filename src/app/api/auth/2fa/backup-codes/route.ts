import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import TwoFactorAuthService from '@/lib/two-factor-auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Generate new backup codes
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { password } = await request.json()

    if (!password) {
      return NextResponse.json({ 
        error: 'Password is required to generate new backup codes' 
      }, { status: 400 })
    }

    // Verify user password first
    const user = await prisma.users.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json({ 
        error: '2FA must be enabled to generate backup codes' 
      }, { status: 400 })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 400 })
    }

    const result = await TwoFactorAuthService.generateNewBackupCodes(session.user.id)
    
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({
      message: result.message,
      backupCodes: result.backupCodes
    })

  } catch (error) {
    console.error('Backup codes generation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Get current backup codes count
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = await TwoFactorAuthService.get2FAStatus(session.user.id)

    return NextResponse.json({
      backupCodesCount: status.backupCodesCount,
      twoFactorEnabled: status.enabled
    })

  } catch (error) {
    console.error('Backup codes status error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}