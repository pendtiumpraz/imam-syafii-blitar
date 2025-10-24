import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import twilio from 'twilio'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import prisma from './prisma'
import SecurityAuditService from './security-audit'
import { SecurityEventType } from './rate-limiter'

// Configuration
const SMS_SERVICE_SID = process.env.TWILIO_SERVICE_SID
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const APP_NAME = 'Pondok Imam Syafi\'i'

// Initialize Twilio client
const twilioClient = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN 
  ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  : null

export class TwoFactorAuthService {
  /**
   * Generate a secret for TOTP
   */
  static generateSecret(userEmail: string): { secret: string; qrCodeUrl: string; manualEntryKey: string } {
    const secret = speakeasy.generateSecret({
      name: userEmail,
      issuer: APP_NAME,
      length: 32,
    })

    return {
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url || '',
      manualEntryKey: secret.base32,
    }
  }

  /**
   * Generate QR code image data URL
   */
  static async generateQRCode(otpauthUrl: string): Promise<string> {
    try {
      return await QRCode.toDataURL(otpauthUrl)
    } catch (error) {
      console.error('Failed to generate QR code:', error)
      throw new Error('Failed to generate QR code')
    }
  }

  /**
   * Verify TOTP token
   */
  static verifyTOTP(token: string, secret: string, window = 2): boolean {
    try {
      return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window, // Allow some time drift
      })
    } catch (error) {
      console.error('TOTP verification error:', error)
      return false
    }
  }

  /**
   * Generate backup codes
   */
  static generateBackupCodes(count = 10): string[] {
    const codes: string[] = []
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase()
      codes.push(code)
    }
    return codes
  }

  /**
   * Hash backup codes for secure storage
   */
  static hashBackupCodes(codes: string[]): string[] {
    return codes.map(code => 
      crypto.createHash('sha256').update(code).digest('hex')
    )
  }

  /**
   * Verify backup code
   */
  static verifyBackupCode(inputCode: string, hashedCodes: string[]): { isValid: boolean; index: number } {
    const hashedInput = crypto.createHash('sha256').update(inputCode.toUpperCase()).digest('hex')
    const index = hashedCodes.findIndex(hash => hash === hashedInput)
    return {
      isValid: index !== -1,
      index
    }
  }

  /**
   * Send SMS OTP
   */
  static async sendSMSOTP(phoneNumber: string, userId: string): Promise<{ success: boolean; message: string }> {
    if (!twilioClient || !SMS_SERVICE_SID) {
      return { success: false, message: 'SMS service not configured' }
    }

    try {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

      // Store OTP in database
      // TODO: userId is not a unique field in schema - need to use proper unique field
      const existing = await prisma.two_factor_verifications.findFirst({
        where: { userId },
      })

      if (existing) {
        await prisma.two_factor_verifications.update({
          where: { id: existing.id },
          data: {
            smsOtp: otp,
            smsOtpExpiresAt: expiresAt,
            smsAttempts: 0,
          },
        })
      } else {
        await prisma.two_factor_verifications.create({
          data: {
            userId,
            smsOtp: otp,
            smsOtpExpiresAt: expiresAt,
            smsAttempts: 0,
          },
        })
      }

      // Send SMS
      await twilioClient.messages.create({
        body: `Your ${APP_NAME} verification code is: ${otp}. Valid for 10 minutes.`,
        to: phoneNumber,
        from: SMS_SERVICE_SID,
      })

      // Log SMS sent event
      await SecurityAuditService.logSecurityEvent(
        userId, 
        SecurityEventType.SMS_OTP_SENT,
        {
          additionalData: { phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*') } // Mask phone number
        }
      )

      return { success: true, message: 'SMS sent successfully' }
    } catch (error) {
      console.error('SMS sending error:', error)
      return { success: false, message: 'Failed to send SMS' }
    }
  }

  /**
   * Verify SMS OTP
   */
  static async verifySMSOTP(userId: string, otp: string): Promise<{ isValid: boolean; message: string }> {
    try {
      const verification = await prisma.two_factor_verifications.findFirst({
        where: { userId }
      })

      if (!verification || !verification.smsOtp || !verification.smsOtpExpiresAt) {
        return { isValid: false, message: 'No OTP found' }
      }

      // Check if OTP is expired
      if (new Date() > verification.smsOtpExpiresAt) {
        await prisma.two_factor_verifications.update({
          where: { id: verification.id },
          data: {
            smsOtp: null,
            smsOtpExpiresAt: null,
          }
        })
        return { isValid: false, message: 'OTP has expired' }
      }

      // Check attempts
      if (verification.smsAttempts >= 5) {
        return { isValid: false, message: 'Too many attempts. Request a new code.' }
      }

      // Verify OTP
      if (verification.smsOtp === otp) {
        // Clear OTP after successful verification
        await prisma.two_factor_verifications.update({
          where: { id: verification.id },
          data: {
            smsOtp: null,
            smsOtpExpiresAt: null,
            smsAttempts: 0,
          }
        })

        // Log successful SMS verification
        await SecurityAuditService.logSecurityEvent(
          userId, 
          SecurityEventType.SMS_OTP_SUCCESS
        )

        return { isValid: true, message: 'OTP verified successfully' }
      } else {
        // Increment attempts
        await prisma.two_factor_verifications.update({
          where: { id: verification.id },
          data: {
            smsAttempts: verification.smsAttempts + 1
          }
        })

        // Log failed SMS verification
        await SecurityAuditService.logSecurityEvent(
          userId, 
          SecurityEventType.SMS_OTP_FAILURE
        )

        return { isValid: false, message: 'Invalid OTP' }
      }
    } catch (error) {
      console.error('SMS OTP verification error:', error)
      return { isValid: false, message: 'Verification failed' }
    }
  }

  /**
   * Enable 2FA for user
   */
  static async enable2FA(userId: string, totpToken: string, secret: string): Promise<{ success: boolean; backupCodes?: string[]; message: string }> {
    try {
      // Verify the TOTP token first
      if (!this.verifyTOTP(totpToken, secret)) {
        return { success: false, message: 'Invalid verification code' }
      }

      // Generate backup codes
      const backupCodes = this.generateBackupCodes()
      const hashedBackupCodes = this.hashBackupCodes(backupCodes)

      // Update user in database
      await prisma.users.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: true,
          twoFactorSecret: secret,
          backupCodes: hashedBackupCodes,
        }
      })

      // Log security event
      await SecurityAuditService.logSecurityEvent(
        userId, 
        SecurityEventType.TWO_FACTOR_ENABLED,
        {
          additionalData: {
            method: 'TOTP',
          }
        }
      )

      return {
        success: true,
        backupCodes,
        message: '2FA enabled successfully'
      }
    } catch (error) {
      console.error('2FA enable error:', error)
      return { success: false, message: 'Failed to enable 2FA' }
    }
  }

  /**
   * Disable 2FA for user
   */
  static async disable2FA(userId: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      // Verify password first
      const user = await prisma.users.findUnique({ where: { id: userId } })
      if (!user) {
        return { success: false, message: 'User not found' }
      }

      // bcrypt is now imported at the top
      const isValidPassword = await bcrypt.compare(password, user.password)
      if (!isValidPassword) {
        return { success: false, message: 'Invalid password' }
      }

      // Disable 2FA
      await prisma.users.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          backupCodes: [],
          phoneVerified: false,
        }
      })

      // Clean up verification records
      await prisma.two_factor_verifications.deleteMany({
        where: { userId }
      })

      // Log security event
      await SecurityAuditService.logSecurityEvent(
        userId, 
        SecurityEventType.TWO_FACTOR_DISABLED
      )

      return { success: true, message: '2FA disabled successfully' }
    } catch (error) {
      console.error('2FA disable error:', error)
      return { success: false, message: 'Failed to disable 2FA' }
    }
  }

  /**
   * Generate new backup codes
   */
  static async generateNewBackupCodes(userId: string): Promise<{ success: boolean; backupCodes?: string[]; message: string }> {
    try {
      const backupCodes = this.generateBackupCodes()
      const hashedBackupCodes = this.hashBackupCodes(backupCodes)

      await prisma.users.update({
        where: { id: userId },
        data: {
          backupCodes: hashedBackupCodes,
        }
      })

      // Log security event
      await SecurityAuditService.logSecurityEvent(
        userId, 
        'BACKUP_CODES_REGENERATED'
      )

      return {
        success: true,
        backupCodes,
        message: 'New backup codes generated'
      }
    } catch (error) {
      console.error('Backup codes generation error:', error)
      return { success: false, message: 'Failed to generate backup codes' }
    }
  }

  /**
   * Verify user's 2FA
   */
  static async verify2FA(userId: string, token: string, isBackupCode = false): Promise<{ isValid: boolean; message: string; backupCodeUsed?: boolean }> {
    try {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: {
          twoFactorSecret: true,
          backupCodes: true,
          twoFactorEnabled: true,
        }
      })

      if (!user || !user.twoFactorEnabled) {
        return { isValid: false, message: '2FA not enabled' }
      }

      if (isBackupCode) {
        // Verify backup code
        const { isValid, index } = this.verifyBackupCode(token, user.backupCodes)
        if (isValid) {
          // Remove used backup code
          const updatedBackupCodes = [...user.backupCodes]
          updatedBackupCodes.splice(index, 1)
          
          await prisma.users.update({
            where: { id: userId },
            data: { backupCodes: updatedBackupCodes }
          })

          // Log security event
          await SecurityAuditService.logSecurityEvent(
            userId, 
            SecurityEventType.BACKUP_CODE_USED
          )

          return { 
            isValid: true, 
            message: 'Backup code verified', 
            backupCodeUsed: true 
          }
        } else {
          return { isValid: false, message: 'Invalid backup code' }
        }
      } else {
        // Verify TOTP
        if (!user.twoFactorSecret) {
          return { isValid: false, message: '2FA secret not found' }
        }

        const isValid = this.verifyTOTP(token, user.twoFactorSecret)
        if (isValid) {
          // Log security event
          await SecurityAuditService.logSecurityEvent(
            userId, 
            SecurityEventType.TWO_FACTOR_SUCCESS,
            {
              additionalData: { method: 'TOTP' }
            }
          )
        } else {
          // Log failed attempt
          await SecurityAuditService.logSecurityEvent(
            userId, 
            SecurityEventType.TWO_FACTOR_FAILURE,
            {
              additionalData: { method: 'TOTP' }
            }
          )
        }

        return {
          isValid,
          message: isValid ? 'Code verified' : 'Invalid verification code'
        }
      }
    } catch (error) {
      console.error('2FA verification error:', error)
      return { isValid: false, message: 'Verification failed' }
    }
  }

  /**
   * Check if user has 2FA enabled
   */
  static async is2FAEnabled(userId: string): Promise<boolean> {
    try {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { twoFactorEnabled: true }
      })
      return user?.twoFactorEnabled ?? false
    } catch (error) {
      console.error('2FA status check error:', error)
      return false
    }
  }

  /**
   * Get 2FA status and info
   */
  static async get2FAStatus(userId: string) {
    try {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: {
          twoFactorEnabled: true,
          phoneVerified: true,
          backupCodes: true,
        }
      })

      if (!user) {
        throw new Error('User not found')
      }

      return {
        enabled: user.twoFactorEnabled,
        phoneVerified: user.phoneVerified,
        backupCodesCount: user.backupCodes.length,
      }
    } catch (error) {
      console.error('2FA status error:', error)
      throw error
    }
  }


  /**
   * Check rate limiting for 2FA attempts
   */
  static async checkRateLimit(userId: string, action: string): Promise<{ allowed: boolean; remainingAttempts: number; resetTime?: Date }> {
    try {
      const verification = await prisma.two_factor_verifications.findFirst({
        where: { userId }
      })

      const maxAttempts = 5
      const resetWindow = 15 * 60 * 1000 // 15 minutes

      if (!verification) {
        return { allowed: true, remainingAttempts: maxAttempts }
      }

      const now = new Date()
      let attempts = 0
      let resetTime = new Date(now.getTime() + resetWindow)

      switch (action) {
        case 'totp':
          attempts = verification.totpAttempts || 0
          resetTime = verification.totpAttemptsResetAt || resetTime
          break
        case 'sms':
          attempts = verification.smsAttempts || 0
          resetTime = verification.smsAttemptsResetAt || resetTime
          break
        case 'backup':
          attempts = verification.backupAttempts || 0
          resetTime = verification.backupAttemptsResetAt || resetTime
          break
      }

      // Reset attempts if reset time has passed
      if (now > resetTime) {
        attempts = 0
        resetTime = new Date(now.getTime() + resetWindow)
        
        // Update reset time in database
        const updateData: any = {}
        updateData[`${action}Attempts`] = 0
        updateData[`${action}AttemptsResetAt`] = resetTime


        await prisma.two_factor_verifications.update({
          where: { id: verification.id },
          data: updateData
        })
      }

      const remainingAttempts = Math.max(0, maxAttempts - attempts)
      const allowed = attempts < maxAttempts

      return {
        allowed,
        remainingAttempts,
        resetTime: allowed ? undefined : resetTime
      }
    } catch (error) {
      console.error('Rate limit check error:', error)
      // Allow by default if error occurs
      return { allowed: true, remainingAttempts: 5 }
    }
  }

  /**
   * Increment rate limit attempts
   */
  static async incrementAttempts(userId: string, action: string) {
    try {
      const resetWindow = 15 * 60 * 1000 // 15 minutes
      const resetTime = new Date(Date.now() + resetWindow)

      const updateData: any = {}
      updateData[`${action}Attempts`] = { increment: 1 }
      updateData[`${action}AttemptsResetAt`] = resetTime

      const existing = await prisma.two_factor_verifications.findFirst({
        where: { userId },
      })

      if (existing) {
        await prisma.two_factor_verifications.update({
          where: { id: existing.id },
          data: updateData,
        })
      } else {
        await prisma.two_factor_verifications.create({
          data: {
            userId,
            ...updateData
          },
        })
      }
    } catch (error) {
      console.error('Increment attempts error:', error)
    }
  }
}

export default TwoFactorAuthService