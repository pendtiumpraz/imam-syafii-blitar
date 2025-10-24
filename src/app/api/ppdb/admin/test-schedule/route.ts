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
    const { registrationId, testSchedule, testVenue, batchSchedule } = body

    if (!registrationId && !batchSchedule) {
      return NextResponse.json(
        { success: false, error: 'Registration ID or batch schedule data is required' },
        { status: 400 }
      )
    }

    if (batchSchedule) {
      // Handle batch scheduling
      return await handleBatchScheduling(batchSchedule, session.user.id)
    }

    // Handle single registration scheduling
    if (!testSchedule || !testVenue) {
      return NextResponse.json(
        { success: false, error: 'Test schedule and venue are required' },
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

    // Validate that registration is in correct status
    if (registration.status !== 'VERIFIED') {
      return NextResponse.json(
        { success: false, error: 'Registration must be verified before scheduling test' },
        { status: 400 }
      )
    }

    // Update test schedule
    const updatedRegistration = await prisma.registrations.update({
      where: { id: registrationId },
      data: {
        testSchedule: new Date(testSchedule),
        testVenue: testVenue,
        status: 'TEST_SCHEDULED',
        updatedAt: new Date()
      }
    })

    // Log the action
    console.log('Admin Action Log:', {
      adminId: session.user.id,
      registrationId,
      action: 'SCHEDULE_TEST',
      details: `Scheduled test for ${registration.fullName} at ${testVenue} on ${new Date(testSchedule).toLocaleString()}`,
      previousStatus: registration.status,
      newStatus: 'TEST_SCHEDULED',
      timestamp: new Date()
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedRegistration.id,
        testSchedule: updatedRegistration.testSchedule,
        testVenue: updatedRegistration.testVenue,
        status: updatedRegistration.status
      },
      message: 'Tes berhasil dijadwalkan'
    })

  } catch (error) {
    console.error('Test schedule error:', error)
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

// Handle batch test scheduling
async function handleBatchScheduling(batchData: any, adminId: string) {
  const { registrationIds, testSchedule, testVenue, level } = batchData

  if (!Array.isArray(registrationIds) || registrationIds.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Registration IDs array is required for batch scheduling' },
      { status: 400 }
    )
  }

  if (!testSchedule || !testVenue) {
    return NextResponse.json(
      { success: false, error: 'Test schedule and venue are required' },
      { status: 400 }
    )
  }

  try {
    // Get registrations to update
    const registrations = await prisma.registrations.findMany({
      where: {
        id: { in: registrationIds },
        status: 'VERIFIED',
        ...(level && { level })
      }
    })

    if (registrations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No eligible registrations found for scheduling' },
        { status: 404 }
      )
    }

    // Update all registrations
    const updateResult = await prisma.registrations.updateMany({
      where: {
        id: { in: registrations.map(r => r.id) }
      },
      data: {
        testSchedule: new Date(testSchedule),
        testVenue: testVenue,
        status: 'TEST_SCHEDULED',
        updatedAt: new Date()
      }
    })

    // Log batch action
    console.log('Admin Action Log:', {
      adminId,
      action: 'BATCH_SCHEDULE_TEST',
      details: `Batch scheduled ${updateResult.count} tests at ${testVenue} on ${new Date(testSchedule).toLocaleString()}`,
      affectedRegistrations: registrations.map(r => r.id),
      timestamp: new Date()
    })

    return NextResponse.json({
      success: true,
      data: {
        scheduledCount: updateResult.count,
        testSchedule: new Date(testSchedule),
        testVenue: testVenue
      },
      message: `${updateResult.count} tes berhasil dijadwalkan secara batch`
    })

  } catch (error) {
    console.error('Batch schedule error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Batch scheduling failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET method to retrieve test schedules
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const venue = searchParams.get('venue')
    const level = searchParams.get('level')

    // Build where clause
    const where: any = {
      testSchedule: { not: null }
    }

    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)
      
      where.testSchedule = {
        gte: startDate,
        lt: endDate
      }
    }

    if (venue) where.testVenue = venue
    if (level) where.level = level

    // Get scheduled tests
    const scheduledTests = await prisma.registrations.findMany({
      where,
      select: {
        id: true,
        registrationNo: true,
        fullName: true,
        level: true,
        status: true,
        testSchedule: true,
        testVenue: true,
        testResult: true,
        phoneNumber: true
      },
      orderBy: { testSchedule: 'asc' }
    })

    // Group by date and venue for better organization
    const groupedTests = scheduledTests.reduce((acc: any, test) => {
      const dateKey = test.testSchedule!.toISOString().split('T')[0]
      const venueKey = test.testVenue || 'Unknown'
      
      if (!acc[dateKey]) acc[dateKey] = {}
      if (!acc[dateKey][venueKey]) acc[dateKey][venueKey] = []
      
      acc[dateKey][venueKey].push(test)
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      data: {
        tests: scheduledTests,
        grouped: groupedTests,
        summary: {
          totalScheduled: scheduledTests.length,
          byVenue: scheduledTests.reduce((acc: any, test) => {
            const venue = test.testVenue || 'Unknown'
            acc[venue] = (acc[venue] || 0) + 1
            return acc
          }, {}),
          byLevel: scheduledTests.reduce((acc: any, test) => {
            acc[test.level] = (acc[test.level] || 0) + 1
            return acc
          }, {})
        }
      }
    })

  } catch (error) {
    console.error('Get test schedules error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}