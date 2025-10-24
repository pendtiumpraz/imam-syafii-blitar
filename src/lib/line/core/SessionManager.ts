import { prisma } from '@/lib/prisma'
import type { line_user_sessions } from '@prisma/client'

const SESSION_EXPIRY_MINUTES = 30

export class SessionManager {
  /**
   * Get or create session for a user
   */
  static async getSession(userId: string): Promise<line_user_sessions> {
    // Try to get existing session
    let session = await prisma.line_user_sessions.findUnique({
      where: { userId }
    })

    // Check if session expired
    if (session && session.expiresAt && session.expiresAt < new Date()) {
      // Delete expired session
      await prisma.line_user_sessions.delete({
        where: { id: session.id }
      })
      session = null
    }

    // Create new session if needed
    if (!session) {
      session = await prisma.line_user_sessions.create({
        data: {
          userId,
          mode: 'PUBLIC',
          expiresAt: new Date(Date.now() + SESSION_EXPIRY_MINUTES * 60 * 1000)
        }
      })
    }

    return session
  }

  /**
   * Update session
   */
  static async updateSession(
    userId: string,
    data: any
  ): Promise<line_user_sessions> {
    // Ensure session exists
    await this.getSession(userId)
    
    // Clean up data object - remove undefined and convert to proper types
    const cleanData: any = {}
    for (const key in data) {
      if (data[key] !== undefined) {
        cleanData[key] = data[key]
      }
    }
    
    // Update with new expiry
    return await prisma.line_user_sessions.update({
      where: { userId },
      data: {
        ...cleanData,
        expiresAt: new Date(Date.now() + SESSION_EXPIRY_MINUTES * 60 * 1000),
        updatedAt: new Date()
      }
    })
  }

  /**
   * Start a new flow
   */
  static async startFlow(
    userId: string,
    flowType: string,
    flowId: string,
    totalSteps: number,
    initialData: any = {}
  ): Promise<line_user_sessions> {
    return await this.updateSession(userId, {
      activeFlowId: flowId,
      flowType,
      currentStep: 0,
      totalSteps,
      flowData: initialData,
      stepHistory: [],
      waitingFor: null,
      canAbort: true
    })
  }

  /**
   * Advance to next step in flow
   */
  static async nextStep(
    userId: string,
    stepData: any,
    waitingFor?: string
  ): Promise<line_user_sessions> {
    const session = await this.getSession(userId)
    
    const flowData = session.flowData as any || {}
    const newFlowData = { ...flowData, ...stepData }
    
    return await this.updateSession(userId, {
      currentStep: session.currentStep + 1,
      flowData: newFlowData,
      stepHistory: [...session.stepHistory, `step_${session.currentStep}`],
      waitingFor
    })
  }

  /**
   * Complete current flow
   */
  static async completeFlow(userId: string): Promise<line_user_sessions> {
    return await this.updateSession(userId, {
      activeFlowId: null,
      flowType: null,
      currentStep: 0,
      totalSteps: 0,
      flowData: {},
      stepHistory: [],
      waitingFor: null
    })
  }

  /**
   * Abort current flow
   */
  static async abortFlow(userId: string): Promise<line_user_sessions> {
    const session = await this.getSession(userId)
    
    if (!session.canAbort) {
      throw new Error('Flow cannot be aborted')
    }
    
    return await this.completeFlow(userId)
  }

  /**
   * Set admin mode
   */
  static async setAdminMode(userId: string, isAdmin: boolean): Promise<line_user_sessions> {
    return await this.updateSession(userId, {
      mode: isAdmin ? 'ADMIN' : 'PUBLIC',
      isAdmin,
      permissions: isAdmin ? ['ALL'] : []
    })
  }

  /**
   * Check if user is in a flow
   */
  static async isInFlow(userId: string): Promise<boolean> {
    const session = await this.getSession(userId)
    return !!session.activeFlowId
  }

  /**
   * Get flow data
   */
  static async getFlowData(userId: string): Promise<any> {
    const session = await this.getSession(userId)
    return session.flowData || {}
  }

  /**
   * Clear session
   */
  static async clearSession(userId: string): Promise<void> {
    await prisma.line_user_sessions.deleteMany({
      where: { userId }
    })
  }

  /**
   * Clean expired sessions (run periodically)
   */
  static async cleanExpiredSessions(): Promise<number> {
    const result = await prisma.line_user_sessions.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })
    return result.count
  }
}