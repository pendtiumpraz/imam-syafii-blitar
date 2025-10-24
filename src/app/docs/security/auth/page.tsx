'use client'

import React, { useState } from 'react'
import { Lock, Key, Shield, UserCheck, AlertTriangle, Code, CheckCircle, Copy, Check, Smartphone, Mail } from 'lucide-react'

export default function SecurityAuthPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'implementation', label: 'Implementation', icon: Code },
    { id: '2fa', label: 'Two-Factor Auth', icon: Smartphone },
    { id: 'sessions', label: 'Session Security', icon: UserCheck },
    { id: 'best-practices', label: 'Best Practices', icon: CheckCircle }
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <Lock className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-4xl font-bold">Authentication & Authorization Security</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Secure authentication implementation with JWT, 2FA, and session management
        </p>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="space-y-8">
        {activeTab === 'overview' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Authentication Flow</h2>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <h3 className="font-semibold mb-2">1. User Registration</h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Password hashing with bcrypt (10 rounds)</li>
                    <li>• Email verification token generation</li>
                    <li>• Account activation via email link</li>
                    <li>• Optional 2FA setup during onboarding</li>
                  </ul>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <h3 className="font-semibold mb-2">2. User Login</h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Validate credentials against database</li>
                    <li>• Check account status (active/suspended)</li>
                    <li>• Generate JWT access & refresh tokens</li>
                    <li>• Enforce 2FA if enabled</li>
                    <li>• Log authentication event</li>
                  </ul>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <h3 className="font-semibold mb-2">3. Request Authorization</h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Verify JWT signature and expiration</li>
                    <li>• Check user roles and permissions</li>
                    <li>• Validate against permission matrix</li>
                    <li>• Rate limit by user/IP</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Security Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <Key className="w-6 h-6 text-blue-500 mb-2" />
                  <h3 className="font-semibold mb-1">Password Security</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Minimum 8 characters required</li>
                    <li>• Complexity requirements enforced</li>
                    <li>• Bcrypt hashing with salt</li>
                    <li>• Password history tracking</li>
                  </ul>
                </div>

                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <Shield className="w-6 h-6 text-green-500 mb-2" />
                  <h3 className="font-semibold mb-1">Token Management</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Short-lived access tokens (15 min)</li>
                    <li>• Long-lived refresh tokens (7 days)</li>
                    <li>• Secure HttpOnly cookies</li>
                    <li>• Token rotation on refresh</li>
                  </ul>
                </div>

                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <Smartphone className="w-6 h-6 text-purple-500 mb-2" />
                  <h3 className="font-semibold mb-1">Two-Factor Auth</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• TOTP (Google Authenticator)</li>
                    <li>• SMS verification (optional)</li>
                    <li>• Backup codes generation</li>
                    <li>• Recovery options</li>
                  </ul>
                </div>

                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <UserCheck className="w-6 h-6 text-orange-500 mb-2" />
                  <h3 className="font-semibold mb-1">Account Protection</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Login attempt limiting</li>
                    <li>• Account lockout after failures</li>
                    <li>• Suspicious activity detection</li>
                    <li>• Email alerts for new logins</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'implementation' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Authentication Implementation</h2>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">Password Hashing</h3>
                    <button
                      onClick={() => copyToClipboard(`import bcrypt from 'bcryptjs'

// Hash password during registration
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

// Verify password during login
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword)
}

// Password strength validation
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain number')
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain special character')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}`, 'password-hash')}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {copiedCode === 'password-hash' ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`import bcrypt from 'bcryptjs'

// Hash password during registration
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

// Verify password during login
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword)
}

// Password strength validation
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain number')
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain special character')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">JWT Token Generation</h3>
                    <button
                      onClick={() => copyToClipboard(`import jwt from 'jsonwebtoken'
import { User } from '@prisma/client'

interface TokenPayload {
  sub: string
  username: string
  role: string
  iat?: number
  exp?: number
}

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!

export function generateTokens(user: User) {
  const payload: TokenPayload = {
    sub: user.id,
    username: user.username,
    role: user.role
  }
  
  // Generate access token (15 minutes)
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '15m',
    issuer: 'pondok-imam-syafii',
    audience: 'api'
  })
  
  // Generate refresh token (7 days)
  const refreshToken = jwt.sign(
    { sub: user.id },
    JWT_REFRESH_SECRET,
    {
      expiresIn: '7d',
      issuer: 'pondok-imam-syafii',
      audience: 'refresh'
    }
  )
  
  return { accessToken, refreshToken }
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET, {
    issuer: 'pondok-imam-syafii',
    audience: 'api'
  }) as TokenPayload
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, JWT_REFRESH_SECRET, {
    issuer: 'pondok-imam-syafii',
    audience: 'refresh'
  }) as { sub: string }
}`, 'jwt-generation')}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {copiedCode === 'jwt-generation' ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`import jwt from 'jsonwebtoken'
import { User } from '@prisma/client'

interface TokenPayload {
  sub: string
  username: string
  role: string
  iat?: number
  exp?: number
}

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!

export function generateTokens(user: User) {
  const payload: TokenPayload = {
    sub: user.id,
    username: user.username,
    role: user.role
  }
  
  // Generate access token (15 minutes)
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '15m',
    issuer: 'pondok-imam-syafii',
    audience: 'api'
  })
  
  // Generate refresh token (7 days)
  const refreshToken = jwt.sign(
    { sub: user.id },
    JWT_REFRESH_SECRET,
    {
      expiresIn: '7d',
      issuer: 'pondok-imam-syafii',
      audience: 'refresh'
    }
  )
  
  return { accessToken, refreshToken }
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET, {
    issuer: 'pondok-imam-syafii',
    audience: 'api'
  }) as TokenPayload
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, JWT_REFRESH_SECRET, {
    issuer: 'pondok-imam-syafii',
    audience: 'refresh'
  }) as { sub: string }
}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">Authentication Middleware</h3>
                    <button
                      onClick={() => copyToClipboard(`import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/jwt'

export async function authMiddleware(req: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }
    
    const token = authHeader.substring(7)
    
    // Verify token
    const payload = verifyAccessToken(token)
    
    // Add user info to request
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-user-id', payload.sub)
    requestHeaders.set('x-user-role', payload.role)
    
    // Continue with modified headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    )
  }
}

// Role-based access control
export function requireRole(allowedRoles: string[]) {
  return async (req: NextRequest) => {
    const userRole = req.headers.get('x-user-role')
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    return null // Continue
  }
}`, 'auth-middleware')}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {copiedCode === 'auth-middleware' ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/jwt'

export async function authMiddleware(req: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }
    
    const token = authHeader.substring(7)
    
    // Verify token
    const payload = verifyAccessToken(token)
    
    // Add user info to request
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-user-id', payload.sub)
    requestHeaders.set('x-user-role', payload.role)
    
    // Continue with modified headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    )
  }
}

// Role-based access control
export function requireRole(allowedRoles: string[]) {
  return async (req: NextRequest) => {
    const userRole = req.headers.get('x-user-role')
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    return null // Continue
  }
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === '2fa' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Two-Factor Authentication</h2>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Two-factor authentication adds an extra layer of security by requiring a second form of verification beyond just a password.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">TOTP Implementation</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

// Generate 2FA secret
export function generate2FASecret(username: string) {
  const secret = speakeasy.generateSecret({
    name: \`Pondok Imam Syafi'i (\${username})\`,
    issuer: 'Pondok Imam Syafi\'i',
    length: 32
  })
  
  return {
    secret: secret.base32,
    url: secret.otpauth_url
  }
}

// Generate QR code for authenticator app
export async function generateQRCode(otpauthUrl: string): Promise<string> {
  return await QRCode.toDataURL(otpauthUrl)
}

// Verify TOTP code
export function verifyTOTP(token: string, secret: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2 // Allow 2 time steps for clock drift
  })
}

// Generate backup codes
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []
  
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase()
    codes.push(code)
  }
  
  return codes
}

// API endpoint for enabling 2FA
export async function enable2FA(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  const { token } = await req.json()
  
  // Get user's temporary secret from session/cache
  const tempSecret = await getTempSecret(userId)
  
  if (!verifyTOTP(token, tempSecret)) {
    return NextResponse.json(
      { error: 'Invalid verification code' },
      { status: 400 }
    )
  }
  
  // Generate backup codes
  const backupCodes = generateBackupCodes()
  
  // Save to database
  await prisma.users.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
      twoFactorSecret: tempSecret,
      backupCodes: {
        create: backupCodes.map(code => ({
          code: hashPassword(code),
          used: false
        }))
      }
    }
  })
  
  return NextResponse.json({
    success: true,
    backupCodes
  })
}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">2FA Login Flow</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`// Login with 2FA
export async function loginWith2FA(req: NextRequest) {
  const { username, password, totpCode } = await req.json()
  
  // Verify credentials
  const user = await prisma.users.findUnique({
    where: { username },
    include: { backupCodes: true }
  })
  
  if (!user || !await verifyPassword(password, user.password)) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    )
  }
  
  // Check if 2FA is enabled
  if (user.twoFactorEnabled) {
    if (!totpCode) {
      // Return partial success, requiring 2FA
      return NextResponse.json({
        requiresTwoFactor: true,
        tempToken: generateTempToken(user.id)
      })
    }
    
    // Verify TOTP code
    const isValidTOTP = verifyTOTP(totpCode, user.twoFactorSecret!)
    
    // If TOTP fails, check backup codes
    if (!isValidTOTP) {
      const backupCode = user.backupCodes.find(
        code => !code.used && await verifyPassword(totpCode, code.code)
      )
      
      if (!backupCode) {
        return NextResponse.json(
          { error: 'Invalid 2FA code' },
          { status: 401 }
        )
      }
      
      // Mark backup code as used
      await prisma.backupCode.update({
        where: { id: backupCode.id },
        data: { used: true }
      })
    }
  }
  
  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user)
  
  // Log successful login
  await logAuthEvent({
    userId: user.id,
    event: 'LOGIN_SUCCESS',
    ip: req.ip,
    userAgent: req.headers.get('user-agent'),
    twoFactorUsed: user.twoFactorEnabled
  })
  
  return NextResponse.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  })
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Alternative 2FA Methods</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <Mail className="w-6 h-6 text-blue-500 mb-2" />
                  <h3 className="font-semibold mb-2">Email Verification</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Send one-time codes via email for verification.
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-900 rounded p-2">
                    <code className="text-xs">await sendEmailOTP(user.email)</code>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <Smartphone className="w-6 h-6 text-green-500 mb-2" />
                  <h3 className="font-semibold mb-2">SMS Verification</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Send verification codes via SMS to registered phone.
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-900 rounded p-2">
                    <code className="text-xs">await sendSMSOTP(user.phone)</code>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'sessions' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Session Security</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Session Management</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`// Session tracking and management
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!
})

interface Session {
  id: string
  userId: string
  ipAddress: string
  userAgent: string
  createdAt: Date
  lastActivity: Date
  expiresAt: Date
}

// Create new session
export async function createSession(
  userId: string,
  req: NextRequest
): Promise<string> {
  const sessionId = crypto.randomUUID()
  const session: Session = {
    id: sessionId,
    userId,
    ipAddress: req.ip || 'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
    createdAt: new Date(),
    lastActivity: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
  
  // Store in Redis with expiration
  await redis.setex(
    \`session:\${sessionId}\`,
    7 * 24 * 60 * 60, // 7 days in seconds
    JSON.stringify(session)
  )
  
  // Add to user's active sessions
  await redis.sadd(\`user_sessions:\${userId}\`, sessionId)
  
  return sessionId
}

// Validate session
export async function validateSession(
  sessionId: string
): Promise<Session | null> {
  const sessionData = await redis.get(\`session:\${sessionId}\`)
  
  if (!sessionData) {
    return null
  }
  
  const session = JSON.parse(sessionData as string) as Session
  
  // Check if expired
  if (new Date(session.expiresAt) < new Date()) {
    await invalidateSession(sessionId)
    return null
  }
  
  // Update last activity
  session.lastActivity = new Date()
  await redis.setex(
    \`session:\${sessionId}\`,
    7 * 24 * 60 * 60,
    JSON.stringify(session)
  )
  
  return session
}

// Invalidate session
export async function invalidateSession(sessionId: string): Promise<void> {
  const session = await redis.get(\`session:\${sessionId}\`)
  
  if (session) {
    const { userId } = JSON.parse(session as string)
    await redis.srem(\`user_sessions:\${userId}\`, sessionId)
  }
  
  await redis.del(\`session:\${sessionId}\`)
}

// Get all user sessions
export async function getUserSessions(userId: string): Promise<Session[]> {
  const sessionIds = await redis.smembers(\`user_sessions:\${userId}\`)
  const sessions: Session[] = []
  
  for (const id of sessionIds) {
    const sessionData = await redis.get(\`session:\${id}\`)
    if (sessionData) {
      sessions.push(JSON.parse(sessionData as string))
    }
  }
  
  return sessions.sort((a, b) => 
    new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
  )
}

// Revoke all sessions (logout from all devices)
export async function revokeAllSessions(userId: string): Promise<void> {
  const sessionIds = await redis.smembers(\`user_sessions:\${userId}\`)
  
  for (const id of sessionIds) {
    await redis.del(\`session:\${id}\`)
  }
  
  await redis.del(\`user_sessions:\${userId}\`)
}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Cookie Security</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`// Secure cookie configuration
export function setSecureCookie(
  res: NextResponse,
  name: string,
  value: string,
  options?: {
    maxAge?: number
    path?: string
  }
) {
  const cookieOptions = [
    \`\${name}=\${value}\`,
    'HttpOnly', // Prevent JavaScript access
    'Secure', // HTTPS only
    'SameSite=Strict', // CSRF protection
    \`Path=\${options?.path || '/'}\`,
  ]
  
  if (options?.maxAge) {
    cookieOptions.push(\`Max-Age=\${options.maxAge}\`)
  }
  
  res.headers.append('Set-Cookie', cookieOptions.join('; '))
}

// Set refresh token as secure cookie
export function setRefreshTokenCookie(
  res: NextResponse,
  refreshToken: string
) {
  setSecureCookie(res, 'refresh_token', refreshToken, {
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/api/auth/refresh'
  })
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Session Monitoring</h2>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h3 className="font-semibold mb-3">Active Session Tracking</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Track IP address and location changes
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Monitor concurrent session limits
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Alert on suspicious login patterns
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Automatic session expiration
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Device fingerprinting for anomaly detection
                  </li>
                </ul>
              </div>
            </div>
          </>
        )}

        {activeTab === 'best-practices' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Authentication Best Practices</h2>
              
              <div className="space-y-4">
                <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">Use Strong Password Policies</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Enforce minimum length, complexity requirements, and prevent common passwords.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">Implement Account Lockout</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Lock accounts after multiple failed login attempts to prevent brute force attacks.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">Use Secure Token Storage</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Store tokens in HttpOnly cookies and use short expiration times for access tokens.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">Enable Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Provide 2FA options for all users, especially administrators and sensitive accounts.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">Audit Authentication Events</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Log all authentication attempts, including failures, for security monitoring.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Common Security Mistakes</h2>
              
              <div className="space-y-4">
                <div className="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">Storing Passwords in Plain Text</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Never store passwords without hashing. Always use bcrypt or similar algorithms.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">Using Weak JWT Secrets</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Use strong, randomly generated secrets of at least 256 bits for JWT signing.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">Not Validating Token Expiration</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Always check token expiration and implement proper token refresh mechanisms.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">Exposing Sensitive Information</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Never include passwords or sensitive data in JWT payloads or error messages.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}