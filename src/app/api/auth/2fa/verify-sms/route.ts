import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import TwoFactorAuthService from '@/lib/two-factor-auth'
import prisma from '@/lib/prisma'

// Send SMS OTP
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { phoneNumber, action = 'send' } = await request.json()

    if (action === 'send') {
      if (!phoneNumber) {
        return NextResponse.json({ 
          error: 'Phone number is required' 
        }, { status: 400 })
      }

      // Validate phone number format (basic validation)
      const phoneRegex = /^\+?[\d\s-()]{10,15}$/
      if (!phoneRegex.test(phoneNumber)) {
        return NextResponse.json({ 
          error: 'Invalid phone number format' 
        }, { status: 400 })
      }

      // Check rate limiting
      const rateLimit = await TwoFactorAuthService.checkRateLimit(session.user.id, 'sms')
      if (!rateLimit.allowed) {
        return NextResponse.json({
          error: 'Too many SMS requests. Please try again later.',
          resetTime: rateLimit.resetTime
        }, { status: 429 })
      }

      const result = await TwoFactorAuthService.sendSMSOTP(phoneNumber, session.user.id)
      
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 })
      }

      return NextResponse.json({
        message: result.message,
        sent: true
      })
    }

    // Verify SMS OTP
    const { otp } = await request.json()
    
    if (!otp) {
      return NextResponse.json({ 
        error: 'OTP is required' 
      }, { status: 400 })
    }

    // Check rate limiting for verification
    const rateLimit = await TwoFactorAuthService.checkRateLimit(session.user.id, 'sms')
    if (!rateLimit.allowed) {
      return NextResponse.json({
        error: 'Too many verification attempts. Please try again later.',
        resetTime: rateLimit.resetTime
      }, { status: 429 })
    }

    const result = await TwoFactorAuthService.verifySMSOTP(session.user.id, otp)
    
    if (!result.isValid) {
      // Increment failed attempts
      await TwoFactorAuthService.incrementAttempts(session.user.id, 'sms')
      return NextResponse.json({ 
        error: result.message 
      }, { status: 400 })
    }

    // Mark phone as verified
    await prisma.users.update({
      where: { id: session.user.id },
      data: { phoneVerified: true }
    })

    return NextResponse.json({
      message: result.message,
      verified: true
    })

  } catch (error) {
    console.error('SMS verification error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Get SMS verification status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = await TwoFactorAuthService.get2FAStatus(session.user.id)

    return NextResponse.json({
      phoneVerified: status.phoneVerified,
      twoFactorEnabled: status.enabled
    })

  } catch (error) {
    console.error('SMS status error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}