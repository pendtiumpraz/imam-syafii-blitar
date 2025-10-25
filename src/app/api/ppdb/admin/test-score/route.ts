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
    const { registrationId, testScore, testResult } = body

    if (!registrationId || !testScore) {
      return NextResponse.json(
        { success: false, error: 'Registration ID and test score are required' },
        { status: 400 }
      )
    }

    // Validate test score format
    const { quran, arabic, interview } = testScore
    if (typeof quran !== 'number' || typeof arabic !== 'number' || typeof interview !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Invalid test score format' },
        { status: 400 }
      )
    }

    if (quran < 0 || quran > 100 || arabic < 0 || arabic > 100 || interview < 0 || interview > 100) {
      return NextResponse.json(
        { success: false, error: 'Test scores must be between 0-100' },
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

    // Calculate total score and determine result
    const total = Math.round((quran + arabic + interview) / 3)
    const scoreWithTotal = { ...testScore, total }
    
    // Determine test result based on scoring criteria
    let calculatedResult = testResult
    if (!calculatedResult) {
      // Default passing criteria - can be customized based on level
      const passingScore = getPassingScore(registration.level)
      calculatedResult = total >= passingScore ? 'PASSED' : 'FAILED'
    }

    // Determine new status
    let newStatus = registration.status
    if (registration.status === 'TEST_TAKEN' || registration.status === 'TEST_SCHEDULED') {
      newStatus = calculatedResult === 'PASSED' ? 'PASSED' : 'FAILED'
    }

    // Update registration
    const updateData = {
      testScore: JSON.stringify(scoreWithTotal),
      testResult: calculatedResult,
      status: newStatus,
      updatedAt: new Date()
    }

    const updatedRegistration = await prisma.registrations.update({
      where: { id: registrationId },
      data: updateData
    })

    // Fetch payments separately
    const payments = await prisma.payments.findMany({
      where: { registrationId: registrationId },
      orderBy: { createdAt: 'desc' }
    })

    // Log the action
    await logAction(
      session.user.id,
      registrationId,
      'INPUT_TEST_SCORE',
      `Input test scores: Quran=${quran}, Arabic=${arabic}, Interview=${interview}, Total=${total}, Result=${calculatedResult}`,
      registration.status,
      newStatus
    )

    // If student passed and payment is verified, update status to REGISTERED
    if (calculatedResult === 'PASSED' && registration.paymentStatus === 'VERIFIED') {
      await prisma.registrations.update({
        where: { id: registrationId },
        data: {
          status: 'REGISTERED',
          updatedAt: new Date()
        }
      })

      // Create student record if not exists
      await createStudentFromRegistration(registrationId, session.user.id)
    }

    // Parse JSON fields for response
    const responseData = {
      ...updatedRegistration,
      documents: JSON.parse(updatedRegistration.documents || '[]'),
      testScore: JSON.parse(updatedRegistration.testScore || 'null'),
      payments
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      message: `Nilai tes berhasil diinput. Hasil: ${calculatedResult === 'PASSED' ? 'LULUS' : 'TIDAK LULUS'}`
    })

  } catch (error) {
    console.error('Test score input error:', error)
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

// Get ranking/update rankings
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
    const level = searchParams.get('level')

    // Get all registrations with test scores for ranking
    const registrations = await prisma.registrations.findMany({
      where: {
        testScore: { not: null },
        testResult: 'PASSED',
        ...(level && { level })
      },
      select: {
        id: true,
        registrationNo: true,
        fullName: true,
        level: true,
        testScore: true,
        ranking: true
      }
    })

    // Parse scores and calculate rankings
    const withScores = registrations.map(reg => ({
      ...reg,
      testScore: JSON.parse(reg.testScore || '{}'),
      totalScore: JSON.parse(reg.testScore || '{}').total || 0
    }))

    // Sort by total score (descending)
    withScores.sort((a, b) => b.totalScore - a.totalScore)

    // Update rankings
    const updates = withScores.map(async (reg, index) => {
      const newRanking = index + 1
      if (reg.ranking !== newRanking) {
        await prisma.registrations.update({
          where: { id: reg.id },
          data: { ranking: newRanking }
        })
      }
      return { ...reg, ranking: newRanking }
    })

    const updatedRankings = await Promise.all(updates)

    return NextResponse.json({
      success: true,
      data: updatedRankings
    })

  } catch (error) {
    console.error('Rankings error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to determine passing score based on level
function getPassingScore(level: string): number {
  switch (level) {
    case 'TK':
      return 60 // Lower threshold for TK
    case 'SD':
      return 65
    case 'PONDOK':
      return 70 // Higher threshold for Pondok
    default:
      return 65
  }
}

// Helper function to create student record from registration
async function createStudentFromRegistration(registrationId: string, adminId: string) {
  try {
    const registration = await prisma.registrations.findUnique({
      where: { id: registrationId }
    })

    if (!registration) {
      throw new Error('Registration not found')
    }

    // Check if student already exists
    const existingStudent = await prisma.students.findUnique({
      where: { registrationId }
    })

    if (existingStudent) {
      return existingStudent
    }

    // Generate NIS
    const currentYear = new Date().getFullYear().toString()
    const existingStudents = await prisma.students.count({
      where: {
        enrollmentYear: currentYear,
        institutionType: registration.level
      }
    })
    const nisSeq = (existingStudents + 1).toString().padStart(3, '0')
    const nis = `${registration.level}${currentYear.slice(-2)}${nisSeq}`

    // Create student record
    const student = await prisma.students.create({
      data: {
        nisn: registration.nisn,
        nis: nis,
        fullName: registration.fullName,
        nickname: registration.nickname,
        birthPlace: registration.birthPlace,
        birthDate: new Date(registration.birthDate),
        gender: registration.gender === 'L' ? 'MALE' : 'FEMALE',
        bloodType: registration.bloodType,
        address: registration.address,
        village: registration.village,
        district: registration.district,
        city: registration.city,
        province: registration.province,
        postalCode: registration.postalCode,
        phone: registration.phoneNumber,
        email: registration.email,
        fatherName: registration.fatherName,
        fatherJob: registration.fatherJob,
        fatherPhone: registration.fatherPhone,
        fatherEducation: registration.fatherEducation,
        motherName: registration.motherName,
        motherJob: registration.motherJob,
        motherPhone: registration.motherPhone,
        motherEducation: registration.motherEducation,
        guardianName: registration.guardianName,
        guardianPhone: registration.guardianPhone,
        guardianRelation: registration.guardianRelation,
        institutionType: registration.level,
        grade: registration.gradeTarget,
        enrollmentDate: new Date(),
        enrollmentYear: currentYear,
        previousSchool: registration.previousSchool,
        specialNeeds: registration.specialNeeds,
        documents: registration.documents,
        createdBy: adminId,
        registrationId: registrationId
      }
    })

    console.log('Student record created:', student.id)
    return student

  } catch (error) {
    console.error('Failed to create student record:', error)
    throw error
  }
}

// Helper function to log admin actions
async function logAction(
  adminId: string,
  registrationId: string,
  action: string,
  details: string,
  previousStatus?: string,
  newStatus?: string
) {
  try {
    console.log('Admin Action Log:', {
      adminId,
      registrationId,
      action,
      details,
      previousStatus,
      newStatus,
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Failed to log action:', error)
  }
}