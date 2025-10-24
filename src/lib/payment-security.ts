import crypto from 'crypto'
import { prisma } from './prisma'

// Rate limiting storage (in production, use Redis or similar)
const rateLimitStorage = new Map<string, { count: number; resetTime: number }>()

// Webhook signature validation
export function validateWebhookSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string
): string {
  const signatureString = `${orderId}${statusCode}${grossAmount}${serverKey}`
  return crypto.createHash('sha512').update(signatureString).digest('hex')
}

// Enhanced webhook validation with additional checks
export function validateMidtransWebhook(notification: any, serverKey: string): boolean {
  try {
    // Check required fields
    const requiredFields = ['order_id', 'status_code', 'gross_amount', 'signature_key']
    for (const field of requiredFields) {
      if (!notification[field]) {
        console.error(`Missing required field: ${field}`)
        return false
      }
    }

    // Validate signature
    const expectedSignature = validateWebhookSignature(
      notification.order_id,
      notification.status_code,
      notification.gross_amount,
      serverKey
    )

    if (expectedSignature !== notification.signature_key) {
      console.error('Invalid webhook signature')
      return false
    }

    // Additional validation - check if the notification is not too old
    if (notification.transaction_time) {
      const transactionTime = new Date(notification.transaction_time)
      const now = new Date()
      const diffHours = (now.getTime() - transactionTime.getTime()) / (1000 * 60 * 60)
      
      // Reject notifications older than 24 hours
      if (diffHours > 24) {
        console.error('Webhook notification too old:', diffHours, 'hours')
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error validating webhook:', error)
    return false
  }
}

// Rate limiting for API endpoints
export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 60, 
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = identifier
  
  let record = rateLimitStorage.get(key)
  
  if (!record || now > record.resetTime) {
    record = {
      count: 0,
      resetTime: now + windowMs
    }
  }

  record.count++
  rateLimitStorage.set(key, record)

  const allowed = record.count <= maxRequests
  const remaining = Math.max(0, maxRequests - record.count)

  return {
    allowed,
    remaining,
    resetTime: record.resetTime
  }
}

// Clean up old rate limit records
export function cleanupRateLimit() {
  const now = Date.now()
  for (const [key, record] of rateLimitStorage.entries()) {
    if (now > record.resetTime) {
      rateLimitStorage.delete(key)
    }
  }
}

// Payment amount validation
export function validatePaymentAmount(amount: number, minAmount: number = 1000, maxAmount: number = 100000000): boolean {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return false
  }
  
  if (amount < minAmount || amount > maxAmount) {
    return false
  }
  
  // Check if amount has more than 2 decimal places
  if ((amount * 100) % 1 !== 0) {
    return false
  }
  
  return true
}

// Customer details validation
export function validateCustomerDetails(customerDetails: any): boolean {
  if (!customerDetails || typeof customerDetails !== 'object') {
    return false
  }

  // Check required fields
  const required = ['firstName', 'email', 'phone']
  for (const field of required) {
    if (!customerDetails[field] || typeof customerDetails[field] !== 'string') {
      return false
    }
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(customerDetails.email)) {
    return false
  }

  // Validate phone format (Indonesian)
  const phoneRegex = /^(\+62|62|0)[0-9]{8,13}$/
  if (!phoneRegex.test(customerDetails.phone.replace(/\s|-/g, ''))) {
    return false
  }

  // Validate name length
  if (customerDetails.firstName.length < 2 || customerDetails.firstName.length > 50) {
    return false
  }

  return true
}

// Payment method validation
export function validatePaymentMethod(method: string, channel?: string): boolean {
  const validMethods = ['bank_transfer', 'e_wallet', 'qris', 'credit_card', 'cash']
  
  if (!validMethods.includes(method)) {
    return false
  }

  // Validate channel for specific methods
  if (method === 'bank_transfer') {
    const validBanks = ['bca', 'bni', 'bri', 'permata', 'echannel', 'other']
    if (!channel || !validBanks.includes(channel)) {
      return false
    }
  }

  if (method === 'e_wallet') {
    const validEwallets = ['gopay', 'ovo', 'dana', 'linkaja', 'shopeepay']
    if (!channel || !validEwallets.includes(channel)) {
      return false
    }
  }

  return true
}

// Sanitize input data
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '')
  }
  
  if (typeof input === 'number') {
    return Math.round(input * 100) / 100 // Round to 2 decimal places
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value)
    }
    return sanitized
  }
  
  return input
}

// Log security events
export async function logSecurityEvent(
  event: string,
  details: any,
  severity: 'low' | 'medium' | 'high' = 'medium',
  ipAddress?: string,
  userAgent?: string
) {
  try {
    const logEntry = {
      event,
      details: JSON.stringify(details),
      severity,
      ipAddress,
      userAgent,
      timestamp: new Date()
    }

    console.log('Security Event:', logEntry)

    // In production, you might want to store this in a separate security log table
    // await prisma.securityLog.create({ data: logEntry })

  } catch (error) {
    console.error('Error logging security event:', error)
  }
}

// Check if payment already exists (prevent duplicate processing)
export async function checkDuplicatePayment(externalId: string): Promise<boolean> {
  try {
    const existingPayment = await prisma.payments.findFirst({
      where: {
        externalId,
        status: {
          in: ['SUCCESS', 'PENDING']
        }
      }
    })

    return !!existingPayment
  } catch (error) {
    console.error('Error checking duplicate payment:', error)
    return false
  }
}

// Validate payment expiry
export function isPaymentExpired(expiredAt: string): boolean {
  if (!expiredAt) return false
  return new Date(expiredAt) < new Date()
}

// Generate secure random string
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

// Hash sensitive data
export function hashSensitiveData(data: string, salt?: string): string {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex')
  return crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512').toString('hex')
}

// Mask sensitive information for logging
export function maskSensitiveInfo(data: any): any {
  if (!data || typeof data !== 'object') {
    return data
  }

  const sensitiveFields = ['email', 'phone', 'va_number', 'card_number', 'signature_key']
  const masked: any = { ...data }

  for (const field of sensitiveFields) {
    if (masked[field]) {
      const value = String(masked[field])
      if (value.length > 4) {
        masked[field] = value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2)
      }
    }
  }

  return masked
}

// Environment validation
export function validateEnvironmentConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  const requiredEnvVars = [
    'MIDTRANS_SERVER_KEY',
    'MIDTRANS_CLIENT_KEY',
    'MIDTRANS_IS_PRODUCTION'
  ]

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      errors.push(`Missing environment variable: ${envVar}`)
    }
  }

  // Validate server key format
  if (process.env.MIDTRANS_SERVER_KEY && !process.env.MIDTRANS_SERVER_KEY.startsWith('SB-') && !process.env.MIDTRANS_SERVER_KEY.startsWith('Mid-')) {
    errors.push('Invalid MIDTRANS_SERVER_KEY format')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// Initialize security checks
export function initializeSecurity() {
  // Validate environment
  const envCheck = validateEnvironmentConfig()
  if (!envCheck.valid) {
    console.error('Security validation failed:', envCheck.errors)
    throw new Error('Invalid environment configuration')
  }

  // Set up cleanup interval for rate limiting
  setInterval(cleanupRateLimit, 60000) // Clean up every minute

  console.log('Payment security initialized successfully')
}