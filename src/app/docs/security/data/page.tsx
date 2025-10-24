'use client'

import React from 'react'
import { Shield, Lock, Eye, Database, Key, AlertTriangle } from 'lucide-react'

export default function DataSecurityPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <Shield className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-4xl font-bold">Data Security</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Comprehensive data protection, encryption, and privacy compliance
        </p>
      </div>

      <div className="space-y-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Lock className="w-6 h-6 text-blue-500" />
            Data Encryption
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">Encryption at Rest</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Database Encryption</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• PostgreSQL TDE (Transparent Data Encryption)</li>
                    <li>• Encrypted database backups</li>
                    <li>• Column-level encryption for sensitive data</li>
                    <li>• Key rotation policies</li>
                  </ul>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">File System Encryption</h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>• Full disk encryption (LUKS/FileVault)</li>
                    <li>• Encrypted file uploads</li>
                    <li>• Secure temporary file handling</li>
                    <li>• Cloud storage encryption</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Encryption Implementation</h3>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-300">
{`// lib/encryption.ts
import crypto from 'crypto'

export class DataEncryption {
  private static algorithm = 'aes-256-gcm'
  private static keyLength = 32
  private static ivLength = 16
  private static tagLength = 16

  static generateKey(): string {
    return crypto.randomBytes(this.keyLength).toString('hex')
  }

  static encrypt(text: string, key: string): string {
    const iv = crypto.randomBytes(this.ivLength)
    const cipher = crypto.createCipher(this.algorithm, Buffer.from(key, 'hex'))
    cipher.setIV(iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    // Combine iv + authTag + encrypted data
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
  }

  static decrypt(encryptedData: string, key: string): string {
    const parts = encryptedData.split(':')
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format')
    }

    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]

    const decipher = crypto.createDecipher(this.algorithm, Buffer.from(key, 'hex'))
    decipher.setIV(iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  }

  // Field-level encryption for database
  static encryptField(value: string, fieldKey: string): string {
    const key = this.deriveKey(process.env.MASTER_KEY!, fieldKey)
    return this.encrypt(value, key)
  }

  static decryptField(encryptedValue: string, fieldKey: string): string {
    const key = this.deriveKey(process.env.MASTER_KEY!, fieldKey)
    return this.decrypt(encryptedValue, key)
  }

  private static deriveKey(masterKey: string, salt: string): string {
    return crypto.pbkdf2Sync(masterKey, salt, 100000, this.keyLength, 'sha512').toString('hex')
  }
}

// Usage in Prisma models
export const encryptSensitiveData = (data: any) => {
  if (data.nik) {
    data.nik = DataEncryption.encryptField(data.nik, 'nik')
  }
  if (data.phone) {
    data.phone = DataEncryption.encryptField(data.phone, 'phone')
  }
  return data
}

export const decryptSensitiveData = (data: any) => {
  if (data.nik) {
    data.nik = DataEncryption.decryptField(data.nik, 'nik')
  }
  if (data.phone) {
    data.phone = DataEncryption.decryptField(data.phone, 'phone')
  }
  return data
}

// Middleware for automatic encryption/decryption
prisma.$use(async (params, next) => {
  // Encrypt before write operations
  if (['create', 'update', 'upsert'].includes(params.action) && params.model === 'Student') {
    if (params.args.data) {
      params.args.data = encryptSensitiveData(params.args.data)
    }
  }

  const result = await next(params)

  // Decrypt after read operations
  if (['findUnique', 'findFirst', 'findMany'].includes(params.action) && params.model === 'Student') {
    if (Array.isArray(result)) {
      return result.map(decryptSensitiveData)
    } else if (result) {
      return decryptSensitiveData(result)
    }
  }

  return result
})`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Eye className="w-6 h-6 text-purple-500" />
            Data Privacy & Compliance
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">GDPR Compliance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">Data Subject Rights</h4>
                  <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                    <li>• Right to access personal data</li>
                    <li>• Right to rectification</li>
                    <li>• Right to erasure (right to be forgotten)</li>
                    <li>• Right to data portability</li>
                    <li>• Right to restrict processing</li>
                  </ul>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">Implementation Requirements</h4>
                  <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                    <li>• Consent management system</li>
                    <li>• Data processing audit logs</li>
                    <li>• Privacy by design implementation</li>
                    <li>• Data breach notification system</li>
                    <li>• Regular privacy impact assessments</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Privacy Implementation</h3>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-300">
{`// lib/privacy.ts
export class PrivacyManager {
  // Data subject access request
  static async exportUserData(userId: string): Promise<any> {
    const userData = {
      profile: await prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      students: await prisma.students.findMany({
        where: { parentId: userId },
        include: {
          bills: true,
          hafalan: true,
          grades: true
        }
      }),
      activities: await prisma.activitiesParticipant.findMany({
        where: { userId },
        include: {
          activity: {
            select: {
              title: true,
              date: true,
              type: true
            }
          }
        }
      }),
      auditLogs: await prisma.auditLog.findMany({
        where: { userId },
        select: {
          action: true,
          timestamp: true,
          ipAddress: true
        }
      })
    }

    // Log the data export request
    await this.logPrivacyAction(userId, 'DATA_EXPORT', {
      exportedAt: new Date(),
      dataTypes: Object.keys(userData)
    })

    return userData
  }

  // Right to erasure (right to be forgotten)
  static async deleteUserData(userId: string, reason: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Archive data before deletion (for legal compliance)
      await this.archiveUserData(tx, userId)

      // Delete user data in correct order (foreign key constraints)
      await tx.auditLog.deleteMany({ where: { userId } })
      await tx.activityParticipant.deleteMany({ where: { userId } })
      
      // Anonymize instead of delete for financial records (legal requirement)
      await tx.bill.updateMany({
        where: { student: { parentId: userId } },
        data: { 
          studentName: 'ANONYMIZED',
          parentName: 'ANONYMIZED'
        }
      })

      // Delete user profile
      await tx.user.delete({ where: { id: userId } })
    })

    await this.logPrivacyAction(userId, 'DATA_DELETION', {
      deletedAt: new Date(),
      reason,
      retentionPeriod: '7 years' // for financial data
    })
  }

  // Consent management
  static async updateConsent(userId: string, consentTypes: Record<string, boolean>): Promise<void> {
    await prisma.usersConsent.upsert({
      where: { userId },
      create: {
        userId,
        ...consentTypes,
        consentDate: new Date()
      },
      update: {
        ...consentTypes,
        lastUpdated: new Date()
      }
    })

    await this.logPrivacyAction(userId, 'CONSENT_UPDATE', consentTypes)
  }

  // Data minimization - only collect necessary data
  static validateDataCollection(data: any, purpose: string): any {
    const allowedFields = this.getAllowedFields(purpose)
    
    return Object.keys(data)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = data[key]
        return obj
      }, {})
  }

  private static getAllowedFields(purpose: string): string[] {
    const fieldMaps = {
      'student_registration': ['fullName', 'birthDate', 'gender', 'parentName', 'parentEmail', 'parentPhone'],
      'payment_processing': ['studentId', 'amount', 'paymentMethod'],
      'academic_tracking': ['studentId', 'subject', 'grade', 'semester'],
      'communication': ['email', 'phone', 'preferredLanguage']
    }
    
    return fieldMaps[purpose] || []
  }

  private static async logPrivacyAction(userId: string, action: string, details: any): Promise<void> {
    await prisma.privacyLog.create({
      data: {
        userId,
        action,
        details: JSON.stringify(details),
        timestamp: new Date(),
        ipAddress: 'system'
      }
    })
  }

  private static async archiveUserData(tx: any, userId: string): Promise<void> {
    const userData = await tx.user.findUnique({
      where: { id: userId },
      include: {
        students: {
          include: {
            bills: true,
            hafalan: true
          }
        }
      }
    })

    await tx.dataArchive.create({
      data: {
        userId,
        data: JSON.stringify(userData),
        archivedAt: new Date(),
        reason: 'USER_DELETION_REQUEST'
      }
    })
  }
}

// API endpoint for data subject requests
// app/api/privacy/export/route.ts
export async function POST(request: Request) {
  const { userId } = await request.json()
  
  try {
    const userData = await PrivacyManager.exportUserData(userId)
    
    // Generate downloadable file
    const dataFile = JSON.stringify(userData, null, 2)
    
    return new Response(dataFile, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': \`attachment; filename="user-data-\${userId}.json"\`
      }
    })
  } catch (error) {
    return Response.json({ error: 'Failed to export user data' }, { status: 500 })
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Database className="w-6 h-6 text-green-500" />
            Data Access Controls
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">Role-Based Access Control (RBAC)</h3>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-300">
{`// lib/access-control.ts
export enum Permission {
  READ_STUDENTS = 'read:students',
  WRITE_STUDENTS = 'write:students',
  DELETE_STUDENTS = 'delete:students',
  READ_FINANCIAL = 'read:financial',
  WRITE_FINANCIAL = 'write:financial',
  READ_GRADES = 'read:grades',
  WRITE_GRADES = 'write:grades',
  ADMIN_PANEL = 'admin:panel',
  SYSTEM_CONFIG = 'system:config'
}

export const rolePermissions = {
  SUPER_ADMIN: [
    Permission.READ_STUDENTS,
    Permission.WRITE_STUDENTS,
    Permission.DELETE_STUDENTS,
    Permission.READ_FINANCIAL,
    Permission.WRITE_FINANCIAL,
    Permission.READ_GRADES,
    Permission.WRITE_GRADES,
    Permission.ADMIN_PANEL,
    Permission.SYSTEM_CONFIG
  ],
  ADMIN: [
    Permission.READ_STUDENTS,
    Permission.WRITE_STUDENTS,
    Permission.READ_FINANCIAL,
    Permission.WRITE_FINANCIAL,
    Permission.READ_GRADES,
    Permission.WRITE_GRADES,
    Permission.ADMIN_PANEL
  ],
  STAFF: [
    Permission.READ_STUDENTS,
    Permission.WRITE_STUDENTS,
    Permission.READ_GRADES,
    Permission.WRITE_GRADES
  ],
  TEACHER: [
    Permission.READ_STUDENTS,
    Permission.READ_GRADES,
    Permission.WRITE_GRADES
  ],
  PARENT: [
    Permission.READ_STUDENTS // Only their own children
  ]
}

export class AccessControl {
  static hasPermission(userRole: string, permission: Permission): boolean {
    return rolePermissions[userRole]?.includes(permission) || false
  }

  static async hasResourceAccess(userId: string, resourceType: string, resourceId: string): Promise<boolean> {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { students: true }
    })

    if (!user) return false

    // Super admin has access to all resources
    if (user.role === 'SUPER_ADMIN') return true

    switch (resourceType) {
      case 'student':
        if (user.role === 'PARENT') {
          return user.students.some(s => s.id === resourceId)
        }
        return this.hasPermission(user.role, Permission.READ_STUDENTS)

      case 'financial':
        if (user.role === 'PARENT') {
          return user.students.some(s => s.id === resourceId)
        }
        return this.hasPermission(user.role, Permission.READ_FINANCIAL)

      default:
        return false
    }
  }

  // Middleware for API route protection
  static requirePermission(permission: Permission) {
    return async (req: any, res: any, next: any) => {
      const user = req.user // Set by authentication middleware
      
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      if (!this.hasPermission(user.role, permission)) {
        return res.status(403).json({ error: 'Insufficient permissions' })
      }

      next()
    }
  }

  // Database row-level security helper
  static getDataFilter(userId: string, userRole: string, resourceType: string): any {
    switch (userRole) {
      case 'PARENT':
        return {
          students: {
            some: {
              parentId: userId
            }
          }
        }
      
      case 'TEACHER':
        if (resourceType === 'grades') {
          return {
            subject: {
              teacherId: userId
            }
          }
        }
        break
      
      default:
        return {} // No additional filtering for admin roles
    }
  }
}`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Data Audit Trail</h3>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-300">
{`// lib/audit-logger.ts
export class AuditLogger {
  static async logDataAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId,
        resourceType,
        resourceId,
        action,
        timestamp: new Date(),
        ipAddress,
        userAgent,
        details: JSON.stringify({
          success: true,
          timestamp: new Date().toISOString()
        })
      }
    })
  }

  static async logDataModification(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string,
    changes: any,
    ipAddress: string
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId,
        resourceType,
        resourceId,
        action,
        timestamp: new Date(),
        ipAddress,
        details: JSON.stringify({
          changes,
          timestamp: new Date().toISOString()
        })
      }
    })
  }

  static async getAuditTrail(
    resourceType: string,
    resourceId: string,
    limit: number = 50
  ): Promise<any[]> {
    return await prisma.auditLog.findMany({
      where: {
        resourceType,
        resourceId
      },
      include: {
        user: {
          select: {
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit
    })
  }
}

// Middleware to automatically log data access
export function auditMiddleware() {
  return async (req: any, res: any, next: any) => {
    const originalJson = res.json
    
    res.json = function(data: any) {
      // Log successful data access
      if (req.user && res.statusCode === 200) {
        AuditLogger.logDataAccess(
          req.user.id,
          req.params.resourceType || 'api',
          req.params.id || 'bulk',
          req.method,
          req.ip,
          req.get('User-Agent')
        ).catch(console.error)
      }
      
      return originalJson.call(this, data)
    }
    
    next()
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Key className="w-6 h-6 text-yellow-500" />
            Secure Data Handling
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">Data Sanitization</h3>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-300">
{`// lib/data-sanitization.ts
import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'

export class DataSanitizer {
  // Input validation and sanitization
  static sanitizeInput(data: any, schema: any): any {
    const sanitized: any = {}
    
    for (const [key, rules] of Object.entries(schema)) {
      if (data[key] !== undefined) {
        sanitized[key] = this.applyRules(data[key], rules)
      }
    }
    
    return sanitized
  }

  private static applyRules(value: any, rules: any): any {
    let sanitizedValue = value

    // String sanitization
    if (typeof sanitizedValue === 'string') {
      // Remove null bytes
      sanitizedValue = sanitizedValue.replace(/\0/g, '')
      
      // HTML sanitization
      if (rules.allowHtml) {
        sanitizedValue = DOMPurify.sanitize(sanitizedValue)
      } else {
        sanitizedValue = validator.escape(sanitizedValue)
      }
      
      // Trim whitespace
      if (rules.trim !== false) {
        sanitizedValue = sanitizedValue.trim()
      }
      
      // Length limits
      if (rules.maxLength) {
        sanitizedValue = sanitizedValue.substring(0, rules.maxLength)
      }
    }

    // Type validation
    if (rules.type) {
      switch (rules.type) {
        case 'email':
          if (!validator.isEmail(sanitizedValue)) {
            throw new Error(\`Invalid email: \${key}\`)
          }
          break
        case 'phone':
          if (!validator.isMobilePhone(sanitizedValue, 'id-ID')) {
            throw new Error(\`Invalid phone number: \${key}\`)
          }
          break
        case 'numeric':
          if (!validator.isNumeric(sanitizedValue.toString())) {
            throw new Error(\`Invalid number: \${key}\`)
          }
          sanitizedValue = Number(sanitizedValue)
          break
      }
    }

    return sanitizedValue
  }

  // PII redaction for logging
  static redactPII(data: any): any {
    const redacted = JSON.parse(JSON.stringify(data))
    
    const piiFields = [
      'password', 'token', 'secret', 'key',
      'email', 'phone', 'nik', 'address',
      'birthDate', 'mothersName', 'fathersName'
    ]
    
    function redactObject(obj: any, path: string = ''): any {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? \`\${path}.\${key}\` : key
        
        if (piiFields.some(field => key.toLowerCase().includes(field))) {
          obj[key] = '[REDACTED]'
        } else if (typeof value === 'object' && value !== null) {
          redactObject(value, currentPath)
        }
      }
      return obj
    }
    
    return redactObject(redacted)
  }

  // Safe data export (remove sensitive fields)
  static exportSafe(data: any, allowedFields: string[]): any {
    if (Array.isArray(data)) {
      return data.map(item => this.exportSafe(item, allowedFields))
    }
    
    const safe: any = {}
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        safe[field] = data[field]
      }
    }
    
    return safe
  }
}

// Usage in API routes
const studentSchema = {
  fullName: { type: 'string', maxLength: 100, trim: true },
  email: { type: 'email', required: true },
  phone: { type: 'phone', required: true },
  birthDate: { type: 'date' },
  grade: { type: 'string', maxLength: 10 },
  notes: { type: 'string', maxLength: 1000, allowHtml: false }
}

export async function POST(request: Request) {
  try {
    const rawData = await request.json()
    const sanitizedData = DataSanitizer.sanitizeInput(rawData, studentSchema)
    
    const student = await prisma.students.create({
      data: sanitizedData
    })
    
    // Log without PII
    console.log('Student created:', DataSanitizer.redactPII(student))
    
    return Response.json({ 
      success: true, 
      data: DataSanitizer.exportSafe(student, ['id', 'fullName', 'grade'])
    })
  } catch (error) {
    console.error('Student creation failed:', error.message)
    return Response.json({ error: 'Invalid input data' }, { status: 400 })
  }
}`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-3">Data Backup Security</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Backup Encryption</h4>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <li>• AES-256 encryption for backups</li>
                    <li>• Separate encryption keys</li>
                    <li>• Encrypted backup transmission</li>
                    <li>• Secure key storage (HSM/KMS)</li>
                  </ul>
                </div>
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <h4 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-2">Access Controls</h4>
                  <ul className="text-sm text-indigo-700 dark:text-indigo-300 space-y-1">
                    <li>• Multi-factor authentication</li>
                    <li>• Limited backup access roles</li>
                    <li>• Audit logging for access</li>
                    <li>• Regular access reviews</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-red-800 dark:text-red-200 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Data Security Checklist
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3 text-red-700 dark:text-red-300">Encryption & Storage</h3>
              <ul className="space-y-2 text-sm">
                <li>□ Database encryption at rest enabled</li>
                <li>□ TLS 1.3 for data in transit</li>
                <li>□ Field-level encryption for PII</li>
                <li>□ Encrypted backups with separate keys</li>
                <li>□ Secure key management (rotation)</li>
                <li>□ File upload encryption</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-red-700 dark:text-red-300">Access & Compliance</h3>
              <ul className="space-y-2 text-sm">
                <li>□ Role-based access controls implemented</li>
                <li>□ Data audit trail logging</li>
                <li>□ GDPR compliance procedures</li>
                <li>□ Data retention policies</li>
                <li>□ Privacy impact assessments</li>
                <li>□ Regular security assessments</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}