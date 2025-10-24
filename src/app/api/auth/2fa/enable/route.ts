import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import TwoFactorAuthService from '@/lib/two-factor-auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { password, totpToken } = await request.json()

    if (!password || !totpToken) {
      return NextResponse.json({ 
        error: 'Password and verification code are required' 
      }, { status: 400 })
    }

    // Verify user password first
    const user = await prisma.users.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if 2FA is already enabled
    if (user.twoFactorEnabled) {
      return NextResponse.json({ 
        error: '2FA is already enabled for this account' 
      }, { status: 400 })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 400 })
    }

    // Check rate limiting
    const rateLimit = await TwoFactorAuthService.checkRateLimit(session.user.id, 'totp')
    if (!rateLimit.allowed) {
      return NextResponse.json({
        error: 'Too many attempts. Please try again later.',
        resetTime: rateLimit.resetTime
      }, { status: 429 })
    }

    // Generate secret if not provided in session (first step)
    if (!request.headers.get('x-2fa-secret')) {
      const secretData = TwoFactorAuthService.generateSecret(user.email)
      const qrCodeDataUrl = await TwoFactorAuthService.generateQRCode(secretData.qrCodeUrl)

      return NextResponse.json({
        step: 'setup',
        secret: secretData.secret,
        qrCode: qrCodeDataUrl,
        manualEntryKey: secretData.manualEntryKey,
        message: 'Scan the QR code with your authenticator app, then verify with a code'
      })
    }

    // Second step - verify and enable
    const secret = request.headers.get('x-2fa-secret')
    if (!secret) {
      return NextResponse.json({ error: 'Invalid setup flow' }, { status: 400 })
    }

    // Enable 2FA
    const result = await TwoFactorAuthService.enable2FA(session.user.id, totpToken, secret)
    
    if (!result.success) {
      // Increment failed attempts
      await TwoFactorAuthService.incrementAttempts(session.user.id, 'totp')
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({
      message: result.message,
      backupCodes: result.backupCodes,
      enabled: true
    })

  } catch (error) {
    console.error('2FA enable error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// GET endpoint to initiate 2FA setup
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { 
        twoFactorEnabled: true,
        email: true 
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json({ 
        error: '2FA is already enabled for this account' 
      }, { status: 400 })
    }

    // Generate secret for setup
    const secretData = TwoFactorAuthService.generateSecret(user.email)
    const qrCodeDataUrl = await TwoFactorAuthService.generateQRCode(secretData.qrCodeUrl)

    return NextResponse.json({
      secret: secretData.secret,
      qrCode: qrCodeDataUrl,
      manualEntryKey: secretData.manualEntryKey,
      appName: 'Pondok Imam Syafi\'i'
    })

  } catch (error) {
    console.error('2FA setup error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}