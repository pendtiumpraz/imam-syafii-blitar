'use client'

import React, { useState } from 'react'
import { MessageSquare, Phone, Send, Shield, Zap, CheckCircle, AlertTriangle, Code, Copy, Check, Globe, Settings } from 'lucide-react'

export default function SMSIntegrationPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: MessageSquare },
    { id: 'providers', label: 'SMS Providers', icon: Globe },
    { id: 'setup', label: 'Setup', icon: Settings },
    { id: 'implementation', label: 'Implementation', icon: Code },
    { id: 'automation', label: 'Automation', icon: Zap },
    { id: 'security', label: 'Security', icon: Shield }
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <MessageSquare className="w-8 h-8 text-purple-500" />
          </div>
          <h1 className="text-4xl font-bold">SMS Integration</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Integrate SMS services for instant notifications and emergency communications
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
                  ? 'bg-purple-500 text-white'
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
              <h2 className="text-2xl font-bold mb-4">SMS Integration Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <MessageSquare className="w-8 h-8 text-purple-500 mb-2" />
                  <h3 className="font-semibold mb-2">Instant Notifications</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Payment confirmations</li>
                    <li>• Emergency alerts</li>
                    <li>• Assignment reminders</li>
                    <li>• Attendance notifications</li>
                  </ul>
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <Phone className="w-8 h-8 text-blue-500 mb-2" />
                  <h3 className="font-semibold mb-2">OTP & Verification</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Two-factor authentication</li>
                    <li>• Phone verification</li>
                    <li>• Password reset codes</li>
                    <li>• Account security</li>
                  </ul>
                </div>
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <Send className="w-8 h-8 text-green-500 mb-2" />
                  <h3 className="font-semibold mb-2">Bulk Messaging</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• School announcements</li>
                    <li>• Event notifications</li>
                    <li>• Class updates</li>
                    <li>• Parent communications</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">SMS vs Other Communication Methods</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900">
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left">Feature</th>
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center">SMS</th>
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center">WhatsApp</th>
                      <th className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 font-medium">Delivery Speed</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center">⚡ Instant</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center">⚡ Instant</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center">🐌 Delayed</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 font-medium">Reach</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center">📱 Universal</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center">📲 App Required</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center">💻 Internet Required</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 font-medium">Character Limit</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center">160 chars</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center">Unlimited</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center">Unlimited</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 font-medium">Cost</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center">💰 Per Message</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center">💰 Per Message</td>
                      <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center">💵 Per Email/Free</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'providers' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">SMS Service Providers</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Twilio (International)</h3>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-medium mb-2">Pros</h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>✅ Global coverage</li>
                          <li>✅ Excellent API</li>
                          <li>✅ High delivery rates</li>
                          <li>✅ Advanced features</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Cons</h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>❌ More expensive</li>
                          <li>❌ Complex pricing</li>
                        </ul>
                      </div>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                      <pre className="text-sm text-gray-300">
{`# Twilio Configuration
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Nexmo/Vonage (International)</h3>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-medium mb-2">Pros</h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>✅ Competitive pricing</li>
                          <li>✅ Good API documentation</li>
                          <li>✅ Multiple channels</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Cons</h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>❌ Variable delivery in Indonesia</li>
                        </ul>
                      </div>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                      <pre className="text-sm text-gray-300">
{`# Vonage Configuration
VONAGE_API_KEY=your-api-key
VONAGE_API_SECRET=your-api-secret
VONAGE_BRAND_NAME=YourSchool`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Zenziva (Indonesia)</h3>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-medium mb-2">Pros</h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>✅ Local Indonesia provider</li>
                          <li>✅ Good local delivery rates</li>
                          <li>✅ Affordable pricing</li>
                          <li>✅ Indonesian support</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Cons</h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>❌ Limited to Indonesia</li>
                          <li>❌ Basic API features</li>
                        </ul>
                      </div>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                      <pre className="text-sm text-gray-300">
{`# Zenziva Configuration
ZENZIVA_USERKEY=your-userkey
ZENZIVA_PASSKEY=your-passkey`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Rajasms (Indonesia)</h3>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-medium mb-2">Pros</h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>✅ Very affordable</li>
                          <li>✅ Good for Indonesia</li>
                          <li>✅ Simple integration</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Cons</h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <li>❌ Basic features only</li>
                          <li>❌ Limited analytics</li>
                        </ul>
                      </div>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                      <pre className="text-sm text-gray-300">
{`# Rajasms Configuration
RAJASMS_API_KEY=your-api-key`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'setup' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">SMS Service Setup</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">1. Choose Your Provider</h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm">
                      For schools in Indonesia, we recommend starting with <strong>Zenziva</strong> or <strong>Rajasms</strong> for cost-effectiveness. 
                      For international reach or advanced features, consider <strong>Twilio</strong>.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">2. Environment Configuration</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`# Common SMS Settings
SMS_PROVIDER=zenziva  # Options: twilio, vonage, zenziva, rajasms
SMS_FROM_NAME=PondokIS
SMS_RATE_LIMIT=100    # Messages per minute
SMS_RETRY_ATTEMPTS=3
SMS_TIMEOUT=30000     # 30 seconds

# Provider-specific settings (choose one)

# Twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Zenziva
ZENZIVA_USERKEY=your-userkey
ZENZIVA_PASSKEY=your-passkey

# Vonage
VONAGE_API_KEY=your-api-key
VONAGE_API_SECRET=your-api-secret

# Rajasms
RAJASMS_API_KEY=your-api-key`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">3. Database Schema Updates</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`// prisma/schema.prisma additions

model SmsLog {
  id            String   @id @default(cuid())
  phoneNumber   String
  message       String
  status        String   // sent, failed, delivered, bounced
  provider      String
  messageId     String?  // Provider message ID
  cost          Float?   // Message cost
  segments      Int      @default(1) // Number of SMS segments
  error         String?
  deliveredAt   DateTime?
  createdAt     DateTime @default(now())
  
  @@map("sms_logs")
}

model SmsTemplate {
  id          String   @id @default(cuid())
  name        String   @unique
  content     String   // Template with placeholders
  category    String   // otp, notification, reminder, etc.
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("sms_templates")
}

model OtpCode {
  id          String    @id @default(cuid())
  phoneNumber String
  code        String
  purpose     String    // login, reset_password, verify_phone
  expiresAt   DateTime
  usedAt      DateTime?
  attempts    Int       @default(0)
  maxAttempts Int       @default(3)
  createdAt   DateTime  @default(now())
  
  @@map("otp_codes")
}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">4. Run Database Migration</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`# Generate and run migration
npx prisma db push
npx prisma generate

# Or create named migration
npx prisma migrate dev --name add-sms-support`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'implementation' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">SMS Service Implementation</h2>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">SMS Service Class</h3>
                    <button
                      onClick={() => copyToClipboard(`import axios from 'axios'

interface SMSProvider {
  sendSMS(phoneNumber: string, message: string): Promise<any>
}

interface SMSOptions {
  phoneNumber: string
  message: string
  template?: string
  templateData?: Record<string, string>
}

class TwilioProvider implements SMSProvider {
  private accountSid: string
  private authToken: string
  private phoneNumber: string

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID!
    this.authToken = process.env.TWILIO_AUTH_TOKEN!
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER!
  }

  async sendSMS(phoneNumber: string, message: string): Promise<any> {
    const url = \`https://api.twilio.com/2010-04-01/Accounts/\${this.accountSid}/Messages.json\`
    
    const response = await axios.post(url, new URLSearchParams({
      To: phoneNumber,
      From: this.phoneNumber,
      Body: message
    }), {
      auth: {
        username: this.accountSid,
        password: this.authToken
      }
    })
    
    return response.data
  }
}

class ZenzivaProvider implements SMSProvider {
  private userkey: string
  private passkey: string

  constructor() {
    this.userkey = process.env.ZENZIVA_USERKEY!
    this.passkey = process.env.ZENZIVA_PASSKEY!
  }

  async sendSMS(phoneNumber: string, message: string): Promise<any> {
    // Format phone number for Indonesia
    const formattedPhone = this.formatIndonesianPhone(phoneNumber)
    
    const response = await axios.post('https://console.zenziva.net/reguler/api/sendsms/', {
      userkey: this.userkey,
      passkey: this.passkey,
      to: formattedPhone,
      message: message
    })
    
    return response.data
  }

  private formatIndonesianPhone(phoneNumber: string): string {
    // Convert +62xxx or 0xxx to 62xxx
    if (phoneNumber.startsWith('+62')) {
      return phoneNumber.substring(1)
    } else if (phoneNumber.startsWith('0')) {
      return '62' + phoneNumber.substring(1)
    } else if (phoneNumber.startsWith('62')) {
      return phoneNumber
    }
    return '62' + phoneNumber
  }
}

class VonageProvider implements SMSProvider {
  private apiKey: string
  private apiSecret: string

  constructor() {
    this.apiKey = process.env.VONAGE_API_KEY!
    this.apiSecret = process.env.VONAGE_API_SECRET!
  }

  async sendSMS(phoneNumber: string, message: string): Promise<any> {
    const response = await axios.post('https://rest.nexmo.com/sms/json', {
      api_key: this.apiKey,
      api_secret: this.apiSecret,
      to: phoneNumber,
      from: process.env.SMS_FROM_NAME || 'YourSchool',
      text: message
    })
    
    return response.data
  }
}

class SMSService {
  private provider: SMSProvider
  private rateLimitMap = new Map<string, number[]>()

  constructor() {
    const providerType = process.env.SMS_PROVIDER || 'zenziva'
    
    switch (providerType) {
      case 'twilio':
        this.provider = new TwilioProvider()
        break
      case 'vonage':
        this.provider = new VonageProvider()
        break
      case 'zenziva':
      default:
        this.provider = new ZenzivaProvider()
        break
    }
  }

  async sendSMS(options: SMSOptions): Promise<any> {
    try {
      // Check rate limiting
      await this.checkRateLimit(options.phoneNumber)
      
      // Process template if provided
      let message = options.message
      if (options.template && options.templateData) {
        message = await this.processTemplate(options.template, options.templateData)
      }
      
      // Validate phone number
      if (!this.isValidPhoneNumber(options.phoneNumber)) {
        throw new Error('Invalid phone number format')
      }
      
      // Send SMS
      const result = await this.provider.sendSMS(options.phoneNumber, message)
      
      // Log successful SMS
      await this.logSMS(options.phoneNumber, message, 'sent', result)
      
      return result
    } catch (error) {
      // Log failed SMS
      await this.logSMS(options.phoneNumber, options.message, 'failed', error)
      throw error
    }
  }

  private async processTemplate(templateName: string, data: Record<string, string>): Promise<string> {
    const template = await prisma.smsTemplate.findUnique({
      where: { name: templateName }
    })
    
    if (!template) {
      throw new Error(\`SMS template not found: \${templateName}\`)
    }
    
    let message = template.content
    for (const [key, value] of Object.entries(data)) {
      message = message.replace(new RegExp(\`{{\\s*\${key}\\s*}}\`, 'g'), value)
    }
    
    return message
  }

  private async checkRateLimit(phoneNumber: string): Promise<void> {
    const now = Date.now()
    const windowSize = 60 * 1000 // 1 minute
    const maxMessages = parseInt(process.env.SMS_RATE_LIMIT || '10')
    
    const timestamps = this.rateLimitMap.get(phoneNumber) || []
    const validTimestamps = timestamps.filter(
      timestamp => now - timestamp < windowSize
    )
    
    if (validTimestamps.length >= maxMessages) {
      throw new Error('SMS rate limit exceeded')
    }
    
    validTimestamps.push(now)
    this.rateLimitMap.set(phoneNumber, validTimestamps)
  }

  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic validation for international phone numbers
    const phoneRegex = /^[\+]?[1-9]\d{1,14}$/
    return phoneRegex.test(phoneNumber.replace(/[\s\-\(\)]/g, ''))
  }

  private async logSMS(
    phoneNumber: string,
    message: string,
    status: string,
    result: any
  ): Promise<void> {
    const segments = Math.ceil(message.length / 160)
    
    await prisma.smsLog.create({
      data: {
        phoneNumber,
        message,
        status,
        provider: process.env.SMS_PROVIDER || 'zenziva',
        messageId: result?.sid || result?.message_id || null,
        segments,
        error: status === 'failed' ? JSON.stringify(result) : null
      }
    })
  }

  // Helper methods for common use cases
  async sendOTP(phoneNumber: string, purpose: string = 'login'): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    
    // Store OTP in database
    await prisma.otpCode.create({
      data: {
        phoneNumber,
        code,
        purpose,
        expiresAt
      }
    })
    
    // Send SMS
    await this.sendSMS({
      phoneNumber,
      template: 'otp_verification',
      templateData: {
        code,
        expiry: '10 menit'
      }
    })
    
    return code
  }

  async verifyOTP(phoneNumber: string, code: string, purpose: string = 'login'): Promise<boolean> {
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        phoneNumber,
        code,
        purpose,
        usedAt: null,
        expiresAt: {
          gt: new Date()
        }
      }
    })
    
    if (!otpRecord) {
      // Increment attempts
      await prisma.otpCode.updateMany({
        where: {
          phoneNumber,
          purpose,
          usedAt: null
        },
        data: {
          attempts: {
            increment: 1
          }
        }
      })
      return false
    }
    
    // Mark as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() }
    })
    
    return true
  }
}

export const smsService = new SMSService()`, 'sms-service')}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {copiedCode === 'sms-service' ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`import axios from 'axios'

interface SMSProvider {
  sendSMS(phoneNumber: string, message: string): Promise<any>
}

interface SMSOptions {
  phoneNumber: string
  message: string
  template?: string
  templateData?: Record<string, string>
}

class TwilioProvider implements SMSProvider {
  private accountSid: string
  private authToken: string
  private phoneNumber: string

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID!
    this.authToken = process.env.TWILIO_AUTH_TOKEN!
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER!
  }

  async sendSMS(phoneNumber: string, message: string): Promise<any> {
    const url = \`https://api.twilio.com/2010-04-01/Accounts/\${this.accountSid}/Messages.json\`
    
    const response = await axios.post(url, new URLSearchParams({
      To: phoneNumber,
      From: this.phoneNumber,
      Body: message
    }), {
      auth: {
        username: this.accountSid,
        password: this.authToken
      }
    })
    
    return response.data
  }
}

class ZenzivaProvider implements SMSProvider {
  private userkey: string
  private passkey: string

  constructor() {
    this.userkey = process.env.ZENZIVA_USERKEY!
    this.passkey = process.env.ZENZIVA_PASSKEY!
  }

  async sendSMS(phoneNumber: string, message: string): Promise<any> {
    // Format phone number for Indonesia
    const formattedPhone = this.formatIndonesianPhone(phoneNumber)
    
    const response = await axios.post('https://console.zenziva.net/reguler/api/sendsms/', {
      userkey: this.userkey,
      passkey: this.passkey,
      to: formattedPhone,
      message: message
    })
    
    return response.data
  }

  private formatIndonesianPhone(phoneNumber: string): string {
    // Convert +62xxx or 0xxx to 62xxx
    if (phoneNumber.startsWith('+62')) {
      return phoneNumber.substring(1)
    } else if (phoneNumber.startsWith('0')) {
      return '62' + phoneNumber.substring(1)
    } else if (phoneNumber.startsWith('62')) {
      return phoneNumber
    }
    return '62' + phoneNumber
  }
}

class SMSService {
  private provider: SMSProvider
  private rateLimitMap = new Map<string, number[]>()

  constructor() {
    const providerType = process.env.SMS_PROVIDER || 'zenziva'
    
    switch (providerType) {
      case 'twilio':
        this.provider = new TwilioProvider()
        break
      case 'zenziva':
      default:
        this.provider = new ZenzivaProvider()
        break
    }
  }

  async sendSMS(options: SMSOptions): Promise<any> {
    try {
      // Check rate limiting
      await this.checkRateLimit(options.phoneNumber)
      
      // Process template if provided
      let message = options.message
      if (options.template && options.templateData) {
        message = await this.processTemplate(options.template, options.templateData)
      }
      
      // Send SMS
      const result = await this.provider.sendSMS(options.phoneNumber, message)
      
      // Log successful SMS
      await this.logSMS(options.phoneNumber, message, 'sent', result)
      
      return result
    } catch (error) {
      // Log failed SMS
      await this.logSMS(options.phoneNumber, options.message, 'failed', error)
      throw error
    }
  }

  // Helper methods for OTP
  async sendOTP(phoneNumber: string, purpose: string = 'login'): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    
    // Store OTP in database
    await prisma.otpCode.create({
      data: {
        phoneNumber,
        code,
        purpose,
        expiresAt
      }
    })
    
    // Send SMS
    await this.sendSMS({
      phoneNumber,
      template: 'otp_verification',
      templateData: {
        code,
        expiry: '10 menit'
      }
    })
    
    return code
  }

  async verifyOTP(phoneNumber: string, code: string, purpose: string = 'login'): Promise<boolean> {
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        phoneNumber,
        code,
        purpose,
        usedAt: null,
        expiresAt: {
          gt: new Date()
        }
      }
    })
    
    if (!otpRecord) {
      return false
    }
    
    // Mark as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() }
    })
    
    return true
  }
}

export const smsService = new SMSService()`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">SMS Templates Setup</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`// Create default SMS templates
const defaultTemplates = [
  {
    name: 'otp_verification',
    content: 'Kode verifikasi Anda: {{code}}. Berlaku selama {{expiry}}. Jangan bagikan kode ini kepada siapapun.',
    category: 'otp'
  },
  {
    name: 'payment_reminder',
    content: 'Reminder: Pembayaran SPP {{studentName}} bulan {{month}} sebesar Rp {{amount}} jatuh tempo {{dueDate}}.',
    category: 'reminder'
  },
  {
    name: 'payment_success',
    content: 'Pembayaran SPP {{studentName}} sebesar Rp {{amount}} telah berhasil. Terima kasih.',
    category: 'notification'
  },
  {
    name: 'assignment_reminder',
    content: 'Tugas {{subject}}: {{title}} untuk {{studentName}} akan deadline {{deadline}}. Segera dikerjakan!',
    category: 'reminder'
  },
  {
    name: 'emergency_alert',
    content: 'PENTING: {{message}} - {{schoolName}}',
    category: 'emergency'
  }
]

// API route to seed templates: /api/admin/sms/templates/seed
export async function POST() {
  try {
    for (const template of defaultTemplates) {
      await prisma.smsTemplate.upsert({
        where: { name: template.name },
        update: template,
        create: template
      })
    }
    
    return NextResponse.json({ success: true, message: 'Templates seeded' })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Usage examples
async function sendPaymentReminder() {
  await smsService.sendSMS({
    phoneNumber: '+6281234567890',
    template: 'payment_reminder',
    templateData: {
      studentName: 'Ahmad Wijaya',
      month: 'Januari 2024',
      amount: '500.000',
      dueDate: '31 Jan 2024'
    }
  })
}

async function sendOTPForLogin(phoneNumber: string) {
  const code = await smsService.sendOTP(phoneNumber, 'login')
  console.log(\`OTP sent to \${phoneNumber}: \${code}\`)
}

async function verifyLoginOTP(phoneNumber: string, code: string) {
  const isValid = await smsService.verifyOTP(phoneNumber, code, 'login')
  return isValid
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'automation' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">SMS Automation</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Automated SMS Workflows</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`// SMS Automation Service
class SMSAutomationService {
  async schedulePaymentReminders() {
    // Find payments due in next 1-3 days
    const upcomingPayments = await prisma.sppPayment.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        student: {
          include: {
            parent: true
          }
        }
      }
    })

    for (const payment of upcomingPayments) {
      const daysUntilDue = Math.ceil(
        (payment.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )

      // Send reminder based on days remaining
      if (daysUntilDue === 3) {
        await this.sendPaymentReminder(payment, '3 hari lagi')
      } else if (daysUntilDue === 1) {
        await this.sendPaymentReminder(payment, 'BESOK')
      } else if (daysUntilDue === 0) {
        await this.sendPaymentReminder(payment, 'HARI INI')
      }
    }
  }

  private async sendPaymentReminder(payment: any, urgency: string) {
    if (!payment.student.parent?.phoneNumber) return

    await smsService.sendSMS({
      phoneNumber: payment.student.parent.phoneNumber,
      template: 'payment_reminder_urgent',
      templateData: {
        studentName: payment.student.name,
        month: payment.month,
        amount: payment.amount.toLocaleString('id-ID'),
        urgency: urgency.toUpperCase(),
        dueDate: payment.dueDate.toLocaleDateString('id-ID')
      }
    })
  }

  async sendBulkAnnouncement(announcement: {
    title: string
    message: string
    targetAudience: 'all' | 'parents' | 'students' | 'class'
    classId?: string
  }) {
    let recipients: string[] = []

    switch (announcement.targetAudience) {
      case 'all':
        const allUsers = await prisma.users.findMany({
          where: { phoneNumber: { not: null } },
          select: { phoneNumber: true }
        })
        recipients = allUsers.map(u => u.phoneNumber!).filter(Boolean)
        break

      case 'parents':
        const parents = await prisma.parent.findMany({
          where: { phoneNumber: { not: null } },
          select: { phoneNumber: true }
        })
        recipients = parents.map(p => p.phoneNumber!).filter(Boolean)
        break

      case 'class':
        if (announcement.classId) {
          const classStudents = await prisma.students.findMany({
            where: { classId: announcement.classId },
            include: { parent: true }
          })
          recipients = classStudents
            .map(s => s.parent?.phoneNumber)
            .filter(Boolean) as string[]
        }
        break
    }

    // Send in batches to avoid rate limiting
    const batchSize = 50
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize)
      
      const promises = batch.map(phoneNumber =>
        smsService.sendSMS({
          phoneNumber,
          template: 'school_announcement',
          templateData: {
            title: announcement.title,
            message: announcement.message,
            schoolName: 'Pondok Imam Syafi\'i'
          }
        }).catch(error => {
          console.error(\`Failed to send to \${phoneNumber}:\`, error)
          return null
        })
      )

      await Promise.allSettled(promises)
      
      // Wait between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
  }

  async sendAssignmentReminders() {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(23, 59, 59, 999)

    const dueAssignments = await prisma.assignment.findMany({
      where: {
        dueDate: {
          gte: new Date(),
          lte: tomorrow
        },
        status: 'ACTIVE'
      },
      include: {
        class: {
          include: {
            students: {
              include: {
                parent: true
              }
            }
          }
        }
      }
    })

    for (const assignment of dueAssignments) {
      for (const student of assignment.class.students) {
        if (student.parent?.phoneNumber) {
          await smsService.sendSMS({
            phoneNumber: student.parent.phoneNumber,
            template: 'assignment_reminder',
            templateData: {
              studentName: student.name,
              subject: assignment.subject,
              title: assignment.title,
              deadline: assignment.dueDate.toLocaleDateString('id-ID')
            }
          })
        }
      }
      
      // Small delay between assignments
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  async sendEmergencyAlert(message: string, priority: 'high' | 'critical' = 'high') {
    // Get all parent phone numbers
    const parents = await prisma.parent.findMany({
      where: { phoneNumber: { not: null } },
      select: { phoneNumber: true }
    })

    const phoneNumbers = parents.map(p => p.phoneNumber!).filter(Boolean)
    
    // For critical alerts, send immediately to all
    if (priority === 'critical') {
      const promises = phoneNumbers.map(phoneNumber =>
        smsService.sendSMS({
          phoneNumber,
          template: 'emergency_alert',
          templateData: {
            message: message.toUpperCase(),
            schoolName: 'Pondok Imam Syafi\'i'
          }
        })
      )
      
      await Promise.allSettled(promises)
    } else {
      // For high priority, send in batches
      await this.sendBulkAnnouncement({
        title: 'PENTING',
        message,
        targetAudience: 'parents'
      })
    }
  }
}

// Cron job for automated SMS
export async function runSMSAutomation() {
  const smsAutomation = new SMSAutomationService()
  
  try {
    // Run daily at 8 AM
    await smsAutomation.schedulePaymentReminders()
    
    // Run daily at 6 PM for assignment reminders
    const now = new Date()
    if (now.getHours() === 18) {
      await smsAutomation.sendAssignmentReminders()
    }
    
    console.log('SMS automation completed successfully')
  } catch (error) {
    console.error('SMS automation failed:', error)
  }
}

export const smsAutomationService = new SMSAutomationService()`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Two-Factor Authentication Implementation</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`// 2FA with SMS OTP
class TwoFactorAuthService {
  async enableTwoFactor(userId: string, phoneNumber: string): Promise<boolean> {
    // Verify phone number first
    const verificationCode = await smsService.sendOTP(phoneNumber, 'verify_phone')
    
    // Store temporary 2FA setup
    await prisma.twoFactorSetup.create({
      data: {
        userId,
        phoneNumber,
        verificationCode,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        verified: false
      }
    })
    
    return true
  }

  async verifyPhoneAndEnable2FA(
    userId: string,
    phoneNumber: string,
    code: string
  ): Promise<boolean> {
    const isValid = await smsService.verifyOTP(phoneNumber, code, 'verify_phone')
    
    if (!isValid) {
      return false
    }

    // Enable 2FA for user
    await prisma.users.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorPhone: phoneNumber
      }
    })

    // Clean up setup record
    await prisma.twoFactorSetup.deleteMany({
      where: { userId }
    })

    await smsService.sendSMS({
      phoneNumber,
      message: '2FA berhasil diaktifkan untuk akun Anda. Keamanan akun Anda sekarang lebih terlindungi.'
    })

    return true
  }

  async sendLoginOTP(userId: string): Promise<boolean> {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true, twoFactorPhone: true }
    })

    if (!user?.twoFactorEnabled || !user?.twoFactorPhone) {
      throw new Error('2FA not enabled for this user')
    }

    await smsService.sendOTP(user.twoFactorPhone, 'login')
    return true
  }

  async verifyLoginOTP(userId: string, code: string): Promise<boolean> {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { twoFactorPhone: true }
    })

    if (!user?.twoFactorPhone) {
      return false
    }

    return await smsService.verifyOTP(user.twoFactorPhone, code, 'login')
  }

  async sendPasswordResetOTP(phoneNumber: string): Promise<boolean> {
    // Verify user exists with this phone number
    const user = await prisma.users.findFirst({
      where: { 
        OR: [
          { phoneNumber },
          { twoFactorPhone: phoneNumber }
        ]
      }
    })

    if (!user) {
      throw new Error('No user found with this phone number')
    }

    await smsService.sendOTP(phoneNumber, 'password_reset')
    return true
  }

  async verifyPasswordResetOTP(phoneNumber: string, code: string): Promise<string | null> {
    const isValid = await smsService.verifyOTP(phoneNumber, code, 'password_reset')
    
    if (!isValid) {
      return null
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const user = await prisma.users.findFirst({
      where: { 
        OR: [
          { phoneNumber },
          { twoFactorPhone: phoneNumber }
        ]
      }
    })

    if (user) {
      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
        }
      })
    }

    return resetToken
  }
}

export const twoFactorAuthService = new TwoFactorAuthService()`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'security' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">SMS Security & Compliance</h2>
              
              <div className="space-y-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Shield className="w-5 h-5 text-red-600 dark:text-red-500 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-800 dark:text-red-200 mb-1">SMS Security Best Practices</h3>
                      <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                        <li>• Never send sensitive data via SMS</li>
                        <li>• Implement rate limiting</li>
                        <li>• Validate phone numbers</li>
                        <li>• Use secure OTP generation</li>
                        <li>• Log all SMS activities</li>
                        <li>• Handle delivery failures</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Enhanced Security Implementation</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`// Enhanced SMS Security Service
import crypto from 'crypto'
import rateLimit from 'express-rate-limit'

class SecureSMSService extends SMSService {
  private suspiciousPatterns = [
    /click here/i,
    /urgent.*act now/i,
    /congratulations.*winner/i,
    /free.*money/i
  ]

  async sendSMS(options: SMSOptions): Promise<any> {
    // Security validations
    await this.performSecurityChecks(options)
    
    // Enhanced logging
    return await this.sendWithSecurityAudit(options)
  }

  private async performSecurityChecks(options: SMSOptions): Promise<void> {
    // 1. Validate phone number format
    if (!this.isValidInternationalPhone(options.phoneNumber)) {
      throw new Error('Invalid phone number format')
    }

    // 2. Check for spam patterns
    if (this.containsSuspiciousContent(options.message)) {
      throw new Error('Message flagged as potentially suspicious')
    }

    // 3. Rate limiting per phone number
    await this.enforceRateLimit(options.phoneNumber)

    // 4. Check blacklisted numbers
    if (await this.isPhoneBlacklisted(options.phoneNumber)) {
      throw new Error('Phone number is blacklisted')
    }

    // 5. Validate message length
    if (options.message.length > 1600) { // 10 SMS segments max
      throw new Error('Message too long')
    }
  }

  private isValidInternationalPhone(phoneNumber: string): boolean {
    // More strict validation
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '')
    
    // Must start with + or country code
    if (!cleanPhone.match(/^(\+|62|0)/)) {
      return false
    }
    
    // Indonesian mobile numbers
    if (cleanPhone.startsWith('62') || cleanPhone.startsWith('+62')) {
      return cleanPhone.match(/^(\+62|62)[8][1-9]\d{7,10}$/) !== null
    }
    
    // Local format
    if (cleanPhone.startsWith('0')) {
      return cleanPhone.match(/^0[8][1-9]\d{7,10}$/) !== null
    }
    
    return false
  }

  private containsSuspiciousContent(message: string): boolean {
    return this.suspiciousPatterns.some(pattern => pattern.test(message))
  }

  private async enforceRateLimit(phoneNumber: string): Promise<void> {
    const key = \`sms_rate_\${phoneNumber}\`
    const now = Date.now()
    const windowSize = 60 * 60 * 1000 // 1 hour
    const maxMessages = 5 // per hour per number

    // Get recent messages from cache/database
    const recentMessages = await this.getRecentMessages(phoneNumber, windowSize)
    
    if (recentMessages >= maxMessages) {
      throw new Error(\`Rate limit exceeded: \${maxMessages} messages per hour\`)
    }
  }

  private async isPhoneBlacklisted(phoneNumber: string): Promise<boolean> {
    const blacklisted = await prisma.phoneBlacklist.findFirst({
      where: { phoneNumber }
    })
    return !!blacklisted
  }

  private async sendWithSecurityAudit(options: SMSOptions): Promise<any> {
    const auditId = crypto.randomUUID()
    const startTime = Date.now()
    
    try {
      // Send SMS
      const result = await super.sendSMS(options)
      
      // Log successful send with security context
      await this.auditSMSActivity({
        auditId,
        phoneNumber: options.phoneNumber,
        messageLength: options.message.length,
        template: options.template,
        status: 'sent',
        duration: Date.now() - startTime,
        securityPassed: true,
        result
      })
      
      return result
    } catch (error) {
      // Log security failure
      await this.auditSMSActivity({
        auditId,
        phoneNumber: options.phoneNumber,
        messageLength: options.message?.length || 0,
        template: options.template,
        status: 'failed',
        duration: Date.now() - startTime,
        securityPassed: false,
        error: error.message
      })
      
      throw error
    }
  }

  private async auditSMSActivity(audit: {
    auditId: string
    phoneNumber: string
    messageLength: number
    template?: string
    status: string
    duration: number
    securityPassed: boolean
    result?: any
    error?: string
  }): Promise<void> {
    await prisma.smsSecurityAudit.create({
      data: {
        ...audit,
        timestamp: new Date(),
        ipAddress: 'server', // In real app, capture client IP
        userAgent: 'system'
      }
    })
  }

  // Secure OTP generation
  async generateSecureOTP(length: number = 6): Promise<string> {
    const digits = '0123456789'
    let result = ''
    
    // Use crypto.randomInt for secure random generation
    for (let i = 0; i < length; i++) {
      result += digits[crypto.randomInt(0, digits.length)]
    }
    
    return result
  }

  async sendSecureOTP(phoneNumber: string, purpose: string): Promise<string> {
    const code = await this.generateSecureOTP(6)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes (shorter)
    
    // Store with additional security measures
    await prisma.otpCode.create({
      data: {
        phoneNumber,
        code: await this.hashOTP(code), // Hash the OTP
        purpose,
        expiresAt,
        maxAttempts: 3,
        createdAt: new Date()
      }
    })
    
    // Send SMS with security template
    await this.sendSMS({
      phoneNumber,
      template: 'secure_otp',
      templateData: {
        code,
        expiry: '5 menit',
        warning: 'Jangan bagikan kode ini kepada siapapun!'
      }
    })
    
    return code
  }

  private async hashOTP(code: string): Promise<string> {
    const salt = await bcrypt.genSalt(10)
    return await bcrypt.hash(code, salt)
  }

  async verifySecureOTP(phoneNumber: string, code: string, purpose: string): Promise<boolean> {
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        phoneNumber,
        purpose,
        usedAt: null,
        expiresAt: {
          gt: new Date()
        }
      }
    })
    
    if (!otpRecord) {
      // Log failed attempt
      await this.logFailedOTPAttempt(phoneNumber, code, 'not_found')
      return false
    }
    
    // Check max attempts
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      await this.logFailedOTPAttempt(phoneNumber, code, 'max_attempts')
      return false
    }
    
    // Verify hash
    const isValid = await bcrypt.compare(code, otpRecord.code)
    
    if (!isValid) {
      // Increment attempts
      await prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 }
      })
      
      await this.logFailedOTPAttempt(phoneNumber, code, 'invalid_code')
      return false
    }
    
    // Mark as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() }
    })
    
    return true
  }

  private async logFailedOTPAttempt(phoneNumber: string, code: string, reason: string) {
    await prisma.otpFailedAttempt.create({
      data: {
        phoneNumber,
        attemptedCode: code.substring(0, 2) + '****', // Log partial code for debugging
        reason,
        timestamp: new Date()
      }
    })
  }
}

export const secureSMSService = new SecureSMSService()`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Compliance & Privacy</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`// Privacy compliance for SMS
class SMSPrivacyCompliance {
  async requestConsentForSMS(phoneNumber: string, userId?: string): Promise<void> {
    // Send opt-in message
    await smsService.sendSMS({
      phoneNumber,
      message: 'Pondok Imam Syafii: Untuk menerima notifikasi SMS, balas YA. Biaya SMS berlaku. Info: wa.me/6281234567890'
    })
    
    // Track consent request
    await prisma.smsConsent.create({
      data: {
        phoneNumber,
        userId,
        status: 'requested',
        requestedAt: new Date()
      }
    })
  }
  
  async recordConsentResponse(phoneNumber: string, response: string): Promise<boolean> {
    const isConsent = ['ya', 'yes', 'ok', 'setuju'].includes(response.toLowerCase())
    
    await prisma.smsConsent.updateMany({
      where: { phoneNumber, status: 'requested' },
      data: {
        status: isConsent ? 'granted' : 'denied',
        respondedAt: new Date()
      }
    })
    
    if (isConsent) {
      await smsService.sendSMS({
        phoneNumber,
        message: 'Terima kasih! Anda akan menerima notifikasi penting dari sekolah. Balas STOP untuk berhenti.'
      })
    }
    
    return isConsent
  }
  
  async handleOptOut(phoneNumber: string): Promise<void> {
    // Add to opt-out list
    await prisma.smsOptOut.upsert({
      where: { phoneNumber },
      update: { optedOutAt: new Date() },
      create: {
        phoneNumber,
        optedOutAt: new Date(),
        reason: 'user_request'
      }
    })
    
    // Update consent status
    await prisma.smsConsent.updateMany({
      where: { phoneNumber },
      data: { status: 'revoked', revokedAt: new Date() }
    })
    
    // Send confirmation
    await smsService.sendSMS({
      phoneNumber,
      message: 'Anda telah berhenti berlangganan notifikasi SMS. Terima kasih.'
    })
  }
  
  async canSendSMS(phoneNumber: string): Promise<boolean> {
    // Check opt-out status
    const optOut = await prisma.smsOptOut.findFirst({
      where: { phoneNumber }
    })
    
    if (optOut) return false
    
    // Check consent for marketing messages
    const consent = await prisma.smsConsent.findFirst({
      where: { phoneNumber, status: 'granted' }
    })
    
    return !!consent
  }
  
  async dataRetentionCleanup(): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    
    // Delete old OTP codes
    await prisma.otpCode.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo }
      }
    })
    
    // Archive old SMS logs
    await prisma.smsLog.updateMany({
      where: {
        createdAt: { lt: oneYearAgo }
      },
      data: {
        message: '[ARCHIVED]', // Remove message content
        phoneNumber: '[REDACTED]' // Anonymize phone numbers
      }
    })
  }
}

export const smsPrivacyCompliance = new SMSPrivacyCompliance()`}
                    </pre>
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