import prisma from './prisma'
import { SecurityEventType, SecurityMonitor } from './rate-limiter'

export interface SecurityEventMetadata {
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  deviceFingerprint?: string
  location?: {
    country?: string
    city?: string
    coordinates?: { lat: number; lng: number }
  }
  reason?: string
  recentEventsCount?: number
  additionalData?: Record<string, any>
}

export class SecurityAuditService {
  /**
   * Log a security event
   */
  static async logSecurityEvent(
    userId: string,
    event: SecurityEventType | string,
    metadata: SecurityEventMetadata = {}
  ): Promise<void> {
    try {
      const eventData = {
        userId,
        event: event.toString(),
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
        },
        ipAddress: metadata.ipAddress || 'unknown',
        userAgent: metadata.userAgent || 'unknown',
        timestamp: new Date(),
      }

      await prisma.security_audit_logs.create({
        data: eventData
      })

      // Check for suspicious activity
      await this.checkSuspiciousActivity(userId, metadata.ipAddress)

    } catch (error) {
      console.error('Security audit log error:', error)
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Get security events for a user
   */
  static async getUserSecurityEvents(
    userId: string,
    limit = 50,
    offset = 0
  ) {
    try {
      const events = await prisma.security_audit_logs.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          event: true,
          metadata: true,
          ipAddress: true,
          timestamp: true,
        }
      })

      return events
    } catch (error) {
      console.error('Error fetching security events:', error)
      return []
    }
  }

  /**
   * Get security events by IP address
   */
  static async getSecurityEventsByIP(
    ipAddress: string,
    limit = 100,
    hoursBack = 24
  ) {
    try {
      const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000)
      
      const events = await prisma.security_audit_logs.findMany({
        where: {
          ipAddress,
          timestamp: {
            gte: since
          }
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
        select: {
          id: true,
          userId: true,
          event: true,
          metadata: true,
          timestamp: true,
        }
      })

      return events
    } catch (error) {
      console.error('Error fetching security events by IP:', error)
      return []
    }
  }

  /**
   * Check for suspicious activity
   */
  static async checkSuspiciousActivity(
    userId: string,
    ipAddress?: string
  ): Promise<void> {
    try {
      // Get recent events for this user
      const recentEvents = await this.getUserSecurityEvents(userId, 100)
      
      const eventObjects = recentEvents.map((e: {
        event: string;
        timestamp: Date;
        metadata: any;
      }) => ({
        event: e.event as SecurityEventType,
        timestamp: e.timestamp,
        metadata: e.metadata
      }))

      const isSuspicious = await SecurityMonitor.detectSuspiciousActivity(eventObjects)
      
      if (isSuspicious) {
        await this.logSecurityEvent(userId, SecurityEventType.SUSPICIOUS_ACTIVITY, {
          ipAddress,
          reason: 'Pattern-based detection',
          recentEventsCount: recentEvents.length,
        })

        // Optionally, implement additional security measures
        await this.handleSuspiciousActivity(userId, ipAddress)
      }
    } catch (error) {
      console.error('Error checking suspicious activity:', error)
    }
  }

  /**
   * Handle suspicious activity
   */
  private static async handleSuspiciousActivity(
    userId: string,
    ipAddress?: string
  ): Promise<void> {
    try {
      // Log the suspicious activity
      console.warn(`Suspicious activity detected for user ${userId} from IP ${ipAddress}`)
      
      // Here you could implement additional security measures:
      // 1. Send email notification to user
      // 2. Temporarily lock account
      // 3. Require additional verification
      // 4. Block IP address
      // 5. Alert administrators

      // Example: Send email notification (implement email service)
      // await this.sendSecurityAlert(userId, ipAddress)

      // Example: Temporarily increase security requirements
      // await this.enableEnhancedSecurity(userId)

    } catch (error) {
      console.error('Error handling suspicious activity:', error)
    }
  }

  /**
   * Get security statistics
   */
  static async getSecurityStatistics(hoursBack = 24) {
    try {
      const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000)
      
      const stats = await prisma.security_audit_logs.groupBy({
        by: ['event'],
        where: {
          timestamp: {
            gte: since
          }
        },
        _count: {
          event: true
        }
      })

      const totalEvents = await prisma.security_audit_logs.count({
        where: {
          timestamp: {
            gte: since
          }
        }
      })

      const uniqueIPs = await prisma.security_audit_logs.findMany({
        where: {
          timestamp: {
            gte: since
          }
        },
        select: {
          ipAddress: true
        },
        distinct: ['ipAddress']
      })

      const uniqueUsers = await prisma.security_audit_logs.findMany({
        where: {
          timestamp: {
            gte: since
          }
        },
        select: {
          userId: true
        },
        distinct: ['userId']
      })

      return {
        totalEvents,
        uniqueIPAddresses: uniqueIPs.length,
        uniqueUsers: uniqueUsers.length,
        eventBreakdown: stats.reduce((acc: Record<string, number>, stat: {
          event: string;
          _count: { event: number };
        }) => {
          acc[stat.event] = stat._count.event
          return acc
        }, {} as Record<string, number>),
        timeRange: {
          from: since,
          to: new Date()
        }
      }
    } catch (error) {
      console.error('Error getting security statistics:', error)
      return {
        totalEvents: 0,
        uniqueIPAddresses: 0,
        uniqueUsers: 0,
        eventBreakdown: {},
        timeRange: {
          from: new Date(Date.now() - 24 * 60 * 60 * 1000),
          to: new Date()
        }
      }
    }
  }

  /**
   * Clean old audit logs (for maintenance)
   */
  static async cleanOldAuditLogs(daysToKeep = 90): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000)
      
      const result = await prisma.security_audit_logs.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      })

      console.log(`Cleaned ${result.count} old security audit logs`)
      return result.count
    } catch (error) {
      console.error('Error cleaning old audit logs:', error)
      return 0
    }
  }

  /**
   * Export security report for a user
   */
  static async exportUserSecurityReport(userId: string, daysBack = 30) {
    try {
      const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
      
      const events = await prisma.security_audit_logs.findMany({
        where: {
          userId,
          timestamp: {
            gte: since
          }
        },
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: {
              username: true,
              email: true,
              name: true
            }
          }
        }
      })

      const report = {
        user: events[0]?.user,
        reportPeriod: {
          from: since,
          to: new Date(),
          days: daysBack
        },
        summary: {
          totalEvents: events.length,
          eventTypes: events.reduce((acc: Record<string, number>, event: {
            event: string;
          }) => {
            acc[event.event] = (acc[event.event] || 0) + 1
            return acc
          }, {} as Record<string, number>),
          uniqueIPAddresses: Array.from(new Set(events.map((e: {
            ipAddress: string;
          }) => e.ipAddress))).length,
        },
        events: events.map((event: {
          timestamp: Date;
          event: string;
          ipAddress: string;
          userAgent: string;
          metadata: any;
        }) => ({
          timestamp: event.timestamp,
          event: event.event,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          metadata: event.metadata
        }))
      }

      return report
    } catch (error) {
      console.error('Error exporting security report:', error)
      throw error
    }
  }

  /**
   * Check if IP address is blocked or suspicious
   */
  static async checkIPReputation(ipAddress: string): Promise<{
    isBlocked: boolean
    isSuspicious: boolean
    riskScore: number
    reasons: string[]
  }> {
    try {
      const hoursBack = 24
      const events = await this.getSecurityEventsByIP(ipAddress, 100, hoursBack)
      
      let riskScore = 0
      const reasons: string[] = []
      
      // Count suspicious events
      const failureEvents = events.filter((e: {
        event: string;
      }) => 
        e.event.includes('FAILURE') || 
        e.event === SecurityEventType.RATE_LIMIT_EXCEEDED
      ).length
      
      if (failureEvents >= 10) {
        riskScore += 30
        reasons.push('Multiple authentication failures')
      }
      
      const suspiciousEvents = events.filter((e: {
        event: string;
      }) => 
        e.event === SecurityEventType.SUSPICIOUS_ACTIVITY
      ).length
      
      if (suspiciousEvents > 0) {
        riskScore += 50
        reasons.push('Flagged for suspicious activity')
      }
      
      // Check for rapid requests (potential bot behavior)
      const rapidRequests = events.filter((event: {
        timestamp: Date;
      }, index: number, arr: { timestamp: Date }[]) => {
        if (index === 0) return false
        const timeDiff = event.timestamp.getTime() - arr[index - 1].timestamp.getTime()
        return timeDiff < 1000 // Less than 1 second apart
      }).length
      
      if (rapidRequests >= 5) {
        riskScore += 20
        reasons.push('Rapid consecutive requests detected')
      }
      
      return {
        isBlocked: riskScore >= 80,
        isSuspicious: riskScore >= 40,
        riskScore,
        reasons
      }
    } catch (error) {
      console.error('Error checking IP reputation:', error)
      return {
        isBlocked: false,
        isSuspicious: false,
        riskScore: 0,
        reasons: []
      }
    }
  }
}

export default SecurityAuditService