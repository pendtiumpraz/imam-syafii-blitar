import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { registrationId, notes } = body

    if (!registrationId) {
      return NextResponse.json(
        { success: false, error: 'Registration ID is required' },
        { status: 400 }
      )
    }

    // Get current registration
    const registration = await prisma.registrations.findUnique({
      where: { id: registrationId }
    })

    if (!registration) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      )
    }

    // Update notes
    const updatedRegistration = await prisma.registrations.update({
      where: { id: registrationId },
      data: {
        notes: notes || null,
        updatedAt: new Date()
      }
    })

    // Log the action
    console.log('Admin Action Log:', {
      adminId: session.user.id,
      registrationId,
      action: 'UPDATE_NOTES',
      details: `Updated notes for registration ${registration.registrationNo}`,
      timestamp: new Date()
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedRegistration.id,
        notes: updatedRegistration.notes
      },
      message: 'Catatan berhasil disimpan'
    })

  } catch (error) {
    console.error('Update notes error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}