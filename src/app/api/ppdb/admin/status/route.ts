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
    const { registrationId, status, reason } = body

    if (!registrationId || !status) {
      return NextResponse.json(
        { success: false, error: 'Registration ID and status are required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = [
      'DRAFT', 'SUBMITTED', 'DOCUMENT_CHECK', 'VERIFIED', 
      'TEST_SCHEDULED', 'TEST_TAKEN', 'PASSED', 'FAILED', 'REGISTERED'
    ]
    
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
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

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: new Date()
    }

    // Add additional fields based on status
    if (status === 'VERIFIED') {
      updateData.verifiedBy = session.user.id
      updateData.verifiedAt = new Date()
    }

    if (status === 'DOCUMENT_CHECK' && reason) {
      updateData.rejectionReason = reason
    }

    if (status === 'FAILED' && reason) {
      updateData.rejectionReason = reason
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
    console.log('Admin Action Log:', {
      adminId: session.user.id,
      registrationId,
      action: 'UPDATE_STATUS',
      details: `Changed status from ${registration.status} to ${status}${reason ? ` - Reason: ${reason}` : ''}`,
      previousStatus: registration.status,
      newStatus: status,
      timestamp: new Date()
    })

    // If status is REGISTERED, create student record if not exists
    if (status === 'REGISTERED') {
      await createStudentFromRegistration(registrationId, session.user.id)
    }

    // Parse JSON fields for response
    const responseData = {
      ...updatedRegistration,
      documents: JSON.parse(updatedRegistration.documents || '[]'),
      testScore: updatedRegistration.testScore ? JSON.parse(updatedRegistration.testScore) : null
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      message: `Status berhasil diubah ke ${status}`
    })

  } catch (error) {
    console.error('Update status error:', error)
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
    // Don't throw here as status update should still succeed
    return null
  }
}