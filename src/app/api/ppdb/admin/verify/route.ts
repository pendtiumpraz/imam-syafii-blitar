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
    const { registrationId, action, reason, documents } = body

    if (!registrationId || !action) {
      return NextResponse.json(
        { success: false, error: 'Registration ID and action are required' },
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

    let updateData: any = {
      updatedAt: new Date()
    }

    switch (action) {
      case 'VERIFY':
        updateData.status = 'VERIFIED'
        updateData.verifiedBy = session.user.id
        updateData.verifiedAt = new Date()
        
        // Update document status if provided
        if (documents && Array.isArray(documents)) {
          const updatedDocs = JSON.parse(registration.documents || '[]').map((doc: any) => {
            const docUpdate = documents.find((d: any) => d.type === doc.type)
            if (docUpdate) {
              return { ...doc, status: docUpdate.status }
            }
            return doc
          })
          updateData.documents = JSON.stringify(updatedDocs)
        } else {
          // Mark all documents as verified
          const currentDocs = JSON.parse(registration.documents || '[]')
          const verifiedDocs = currentDocs.map((doc: any) => ({ ...doc, status: 'VERIFIED' }))
          updateData.documents = JSON.stringify(verifiedDocs)
        }
        break

      case 'REJECT':
        updateData.status = 'DOCUMENT_CHECK'
        updateData.rejectionReason = reason
        updateData.verifiedBy = session.user.id
        updateData.verifiedAt = new Date()
        
        // Update document status if provided
        if (documents && Array.isArray(documents)) {
          const updatedDocs = JSON.parse(registration.documents || '[]').map((doc: any) => {
            const docUpdate = documents.find((d: any) => d.type === doc.type)
            if (docUpdate) {
              return { ...doc, status: docUpdate.status }
            }
            return doc
          })
          updateData.documents = JSON.stringify(updatedDocs)
        }
        break

      case 'VERIFY_PAYMENT':
        updateData.paymentStatus = 'VERIFIED'
        updateData.verifiedBy = session.user.id
        updateData.verifiedAt = new Date()
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Update registration
    const updatedRegistration = await prisma.registrations.update({
      where: { id: registrationId },
      data: updateData
    })

    // Fetch payments separately
    const payments = await prisma.payments.findMany({
      where: { registrationId: registrationId },
      orderBy: { createdAt: 'desc' }
    })

    // Send status update email
    if (updatedRegistration.email) {
      try {
        const { getEmailService } = await import('@/lib/email-service');
        const emailService = getEmailService();

        const statusDescriptions: { [key: string]: string } = {
          'VERIFIED': 'Dokumen Terverifikasi',
          'DOCUMENT_CHECK': 'Dokumen Perlu Diperbaiki',
          'PAYMENT_VERIFIED': 'Pembayaran Terverifikasi'
        };

        await emailService.sendStatusUpdate(updatedRegistration.email, {
          fullName: updatedRegistration.fullName,
          registrationNo: updatedRegistration.registrationNo,
          status: updateData.status || updatedRegistration.status,
          statusDescription: statusDescriptions[updateData.status || updatedRegistration.status] || updateData.status,
          message: action === 'REJECT' ? `Dokumen perlu diperbaiki. Alasan: ${reason}` :
                   action === 'VERIFY' ? 'Selamat! Dokumen Anda telah berhasil diverifikasi. Kami akan segera menghubungi Anda untuk jadwal tes.' :
                   'Pembayaran Anda telah berhasil diverifikasi.'
        });
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
      }
    }

    // Log the action
    await logAction(
      session.user.id,
      registrationId,
      `${action}_DOCUMENT`,
      `${action === 'VERIFY' ? 'Verified' : 'Rejected'} registration documents${reason ? `: ${reason}` : ''}`,
      registration.status,
      updateData.status
    )

    // Parse JSON fields for response
    const responseData = {
      ...updatedRegistration,
      documents: JSON.parse(updatedRegistration.documents || '[]'),
      testScore: updatedRegistration.testScore ? JSON.parse(updatedRegistration.testScore) : null,
      payments
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      message: action === 'VERIFY' 
        ? 'Dokumen berhasil diverifikasi' 
        : 'Dokumen ditolak dan dikembalikan untuk perbaikan'
    })

  } catch (error) {
    console.error('Document verification error:', error)
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
    // This could be stored in a separate ActionLog table
    // For now, we'll just console.log it
    console.log('Admin Action Log:', {
      adminId,
      registrationId,
      action,
      details,
      previousStatus,
      newStatus,
      timestamp: new Date()
    })
    
    // You could implement a proper action log table here:
    /*
    await prisma.actionLog.create({
      data: {
        adminId,
        registrationId,
        action,
        details,
        previousStatus,
        newStatus,
        performedAt: new Date()
      }
    })
    */
  } catch (error) {
    console.error('Failed to log action:', error)
  }
}