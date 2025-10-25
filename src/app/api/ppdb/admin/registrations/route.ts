import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const level = searchParams.get('level')
    const paymentStatus = searchParams.get('paymentStatus')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { registrationNo: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (status) where.status = status
    if (level) where.level = level
    if (paymentStatus) where.paymentStatus = paymentStatus

    // Build orderBy clause
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    // Get registrations with pagination
    const [registrations, total] = await Promise.all([
      prisma.registrations.findMany({
        where,
        skip,
        take: limit,
        orderBy
      }),
      prisma.registrations.count({ where })
    ])

    // Fetch payments for all registrations (only latest payment per registration)
    const registrationIds = registrations.map(reg => reg.id)
    const allPayments = await prisma.payments.findMany({
      where: { registrationId: { in: registrationIds } },
      orderBy: { createdAt: 'desc' }
    })

    // Create a map of registrationId to latest payment
    const paymentsMap = new Map<string, typeof allPayments[0]>()
    allPayments.forEach(payment => {
      if (payment.registrationId && !paymentsMap.has(payment.registrationId)) {
        paymentsMap.set(payment.registrationId, payment)
      }
    })

    // Parse JSON fields and add computed fields
    const processedRegistrations = registrations.map(reg => {
      const documents = JSON.parse(reg.documents || '[]')
      const testScore = reg.testScore ? JSON.parse(reg.testScore) : null

      return {
        id: reg.id,
        registrationNo: reg.registrationNo,
        fullName: reg.fullName,
        nickname: reg.nickname,
        gender: reg.gender,
        birthPlace: reg.birthPlace,
        birthDate: reg.birthDate.toISOString(),
        level: reg.level,
        status: reg.status,
        paymentStatus: reg.paymentStatus,
        testResult: reg.testResult,
        ranking: reg.ranking,
        phoneNumber: reg.phoneNumber,
        whatsapp: reg.whatsapp,
        email: reg.email,
        address: reg.address,
        city: reg.city,
        province: reg.province,
        testSchedule: reg.testSchedule?.toISOString(),
        testVenue: reg.testVenue,
        testScore,
        documents,
        documentsCount: documents.length,
        hasCompleteDocuments: documents.length >= 3, // Minimum required documents
        registrationFee: reg.registrationFee,
        paymentMethod: reg.paymentMethod,
        paymentDate: reg.paymentDate?.toISOString(),
        notes: reg.notes,
        verifiedBy: reg.verifiedBy,
        verifiedAt: reg.verifiedAt?.toISOString(),
        rejectionReason: reg.rejectionReason,
        createdAt: reg.createdAt.toISOString(),
        updatedAt: reg.updatedAt.toISOString(),
        latestPayment: paymentsMap.get(reg.id) || null,
        age: calculateAge(reg.birthDate)
      }
    })

    return NextResponse.json({
      success: true,
      data: processedRegistrations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get registrations error:', error)
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

// Helper function to calculate age
function calculateAge(birthDate: Date): number {
  const today = new Date()
  const birth = new Date(birthDate)
  const age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1
  }
  return age
}