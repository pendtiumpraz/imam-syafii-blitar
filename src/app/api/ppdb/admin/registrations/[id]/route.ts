import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const registrationId = params.id

    // Get detailed registration data
    const registration = await prisma.registrations.findUnique({
      where: { id: registrationId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' }
        },
        student: {
          select: {
            id: true,
            nis: true,
            nisn: true,
            status: true,
            enrollmentDate: true
          }
        }
      }
    })

    if (!registration) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      )
    }

    // Parse JSON fields
    const documents = JSON.parse(registration.documents || '[]')
    const testScore = registration.testScore ? JSON.parse(registration.testScore) : null

    // Calculate additional fields
    const age = calculateAge(registration.birthDate)
    
    // Get admin who verified (if exists)
    let verifiedByAdmin = null
    if (registration.verifiedBy) {
      verifiedByAdmin = await prisma.users.findUnique({
        where: { id: registration.verifiedBy },
        select: { id: true, name: true, username: true }
      })
    }

    const responseData = {
      id: registration.id,
      registrationNo: registration.registrationNo,
      fullName: registration.fullName,
      nickname: registration.nickname,
      gender: registration.gender,
      birthPlace: registration.birthPlace,
      birthDate: registration.birthDate.toISOString(),
      age,
      nik: registration.nik,
      nisn: registration.nisn,
      address: registration.address,
      rt: registration.rt,
      rw: registration.rw,
      village: registration.village,
      district: registration.district,
      city: registration.city,
      province: registration.province,
      postalCode: registration.postalCode,
      level: registration.level,
      previousSchool: registration.previousSchool,
      gradeTarget: registration.gradeTarget,
      programType: registration.programType,
      boardingType: registration.boardingType,
      fatherName: registration.fatherName,
      fatherNik: registration.fatherNik,
      fatherJob: registration.fatherJob,
      fatherPhone: registration.fatherPhone,
      fatherEducation: registration.fatherEducation,
      fatherIncome: registration.fatherIncome,
      motherName: registration.motherName,
      motherNik: registration.motherNik,
      motherJob: registration.motherJob,
      motherPhone: registration.motherPhone,
      motherEducation: registration.motherEducation,
      motherIncome: registration.motherIncome,
      guardianName: registration.guardianName,
      guardianRelation: registration.guardianRelation,
      guardianPhone: registration.guardianPhone,
      guardianAddress: registration.guardianAddress,
      phoneNumber: registration.phoneNumber,
      whatsapp: registration.whatsapp,
      email: registration.email,
      bloodType: registration.bloodType,
      height: registration.height,
      weight: registration.weight,
      specialNeeds: registration.specialNeeds,
      medicalHistory: registration.medicalHistory,
      status: registration.status,
      paymentStatus: registration.paymentStatus,
      documents,
      testSchedule: registration.testSchedule?.toISOString(),
      testVenue: registration.testVenue,
      testScore,
      testResult: registration.testResult,
      ranking: registration.ranking,
      registrationFee: registration.registrationFee,
      paymentMethod: registration.paymentMethod,
      paymentDate: registration.paymentDate?.toISOString(),
      paymentProof: registration.paymentProof,
      reregStatus: registration.reregStatus,
      reregDate: registration.reregDate?.toISOString(),
      reregPayment: registration.reregPayment,
      notes: registration.notes,
      verifiedBy: registration.verifiedBy,
      verifiedByAdmin,
      verifiedAt: registration.verifiedAt?.toISOString(),
      rejectionReason: registration.rejectionReason,
      submittedAt: registration.submittedAt?.toISOString(),
      createdAt: registration.createdAt.toISOString(),
      updatedAt: registration.updatedAt.toISOString(),
      payments: registration.payments,
      student: registration.student
    }

    return NextResponse.json({
      success: true,
      data: responseData
    })

  } catch (error) {
    console.error('Get registration detail error:', error)
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

// UPDATE registration (for admin edits)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const registrationId = params.id
    const body = await request.json()

    // Get current registration
    const currentReg = await prisma.registrations.findUnique({
      where: { id: registrationId }
    })

    if (!currentReg) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    }

    // Fields that admin can update
    const allowedFields = [
      'notes', 'testSchedule', 'testVenue', 'testScore', 'testResult',
      'status', 'paymentStatus', 'rejectionReason', 'ranking'
    ]

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        if (field === 'testScore' && typeof body[field] === 'object') {
          updateData[field] = JSON.stringify(body[field])
        } else if (field === 'testSchedule' && body[field]) {
          updateData[field] = new Date(body[field])
        } else {
          updateData[field] = body[field]
        }
      }
    })

    // If status is being changed, add verification info
    if (body.status && body.status !== currentReg.status) {
      updateData.verifiedBy = session.user.id
      updateData.verifiedAt = new Date()
    }

    // Update registration
    const updatedRegistration = await prisma.registrations.update({
      where: { id: registrationId },
      data: updateData,
      include: {
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    // Log the action
    logAction(
      session.user.id,
      registrationId,
      'UPDATE_REGISTRATION',
      `Updated registration fields: ${Object.keys(updateData).join(', ')}`,
      currentReg.status,
      updatedRegistration.status
    )

    // Parse JSON fields for response
    const responseData = {
      ...updatedRegistration,
      documents: JSON.parse(updatedRegistration.documents || '[]'),
      testScore: updatedRegistration.testScore ? JSON.parse(updatedRegistration.testScore) : null
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      message: 'Registration updated successfully'
    })

  } catch (error) {
    console.error('Update registration error:', error)
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

// Helper functions
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

function logAction(
  adminId: string,
  registrationId: string,
  action: string,
  details: string,
  previousStatus?: string,
  newStatus?: string
) {
  console.log('Admin Action Log:', {
    adminId,
    registrationId,
    action,
    details,
    previousStatus,
    newStatus,
    timestamp: new Date()
  })
}