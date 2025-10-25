import { NextRequest, NextResponse } from 'next/server'
import { PaymentGateway } from '@/lib/payment-gateway'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params

    // Find payment by ID or external ID
    const payment = await prisma.payments.findFirst({
      where: {
        OR: [
          { id },
          { externalId: id },
          { paymentNo: id }
        ]
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Fetch related registration and student data separately
    const [registration, student] = await Promise.all([
      payment.registrationId
        ? prisma.ppdb_registrations.findUnique({
            where: { id: payment.registrationId },
            select: {
              id: true,
              registrationNo: true,
              fullName: true,
              email: true,
              phone: true
            }
          })
        : null,
      payment.studentId
        ? prisma.students.findUnique({
            where: { id: payment.studentId },
            select: {
              id: true,
              nis: true,
              fullName: true,
              email: true,
              phone: true
            }
          })
        : null
    ])

    // Check if payment has external ID (gateway payment)
    let gatewayStatus = null
    if (payment.externalId) {
      try {
        const paymentGateway = new PaymentGateway()
        gatewayStatus = await paymentGateway.checkPaymentStatus(payment.externalId)
        
        // Update local payment status if different from gateway
        if (gatewayStatus.transaction_status !== payment.status) {
          let newStatus: string
          let paidAt: Date | null = null

          switch (gatewayStatus.transaction_status) {
            case 'capture':
            case 'settlement':
              newStatus = 'SUCCESS'
              paidAt = new Date(gatewayStatus.transaction_time)
              break
            case 'pending':
              newStatus = 'PENDING'
              break
            case 'deny':
            case 'cancel':
            case 'expire':
            case 'failure':
              newStatus = 'FAILED'
              break
            default:
              newStatus = payment.status
          }

          if (newStatus !== payment.status) {
            await prisma.payments.update({
              where: { id: payment.id },
              data: {
                status: newStatus,
                paidAt,
                transactionId: gatewayStatus.transaction_id,
                paymentGatewayData: JSON.stringify(gatewayStatus),
                updatedAt: new Date()
              }
            })

            // Update payment object for response
            payment.status = newStatus
            payment.paidAt = paidAt
          }
        }
      } catch (gatewayError) {
        console.error('Error checking gateway status:', gatewayError)
        // Continue with local status if gateway check fails
      }
    }

    // Parse payment gateway data if available
    let gatewayData = null
    try {
      if (payment.paymentGatewayData && payment.paymentGatewayData !== '{}') {
        gatewayData = JSON.parse(payment.paymentGatewayData)
      }
    } catch (parseError) {
      console.error('Error parsing payment gateway data:', parseError)
    }

    // Prepare response
    const response = {
      id: payment.id,
      paymentNo: payment.paymentNo,
      externalId: payment.externalId,
      transactionId: payment.transactionId,
      amount: Number(payment.amount),
      paymentType: payment.paymentType,
      description: payment.description,
      method: payment.method,
      channel: payment.channel,
      status: payment.status,
      vaNumber: payment.vaNumber,
      qrString: payment.qrString,
      deeplink: payment.deeplink,
      paymentUrl: payment.paymentUrl,
      expiredAt: payment.expiredAt,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      // Related data
      registration,
      student,
      // Gateway data
      gatewayStatus,
      gatewayData
    }

    return NextResponse.json({ payment: response })

  } catch (error: any) {
    console.error('Error fetching payment status:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const body = await request.json()

    const UpdatePaymentSchema = z.object({
      status: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'EXPIRED', 'CANCELLED']).optional(),
      paidAt: z.string().optional(),
      verifiedBy: z.string().optional(),
      notes: z.string().optional()
    })

    const validation = UpdatePaymentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const { status, paidAt, verifiedBy, notes } = validation.data

    // Find payment
    const payment = await prisma.payments.findFirst({
      where: {
        OR: [
          { id },
          { externalId: id },
          { paymentNo: id }
        ]
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    }

    if (status) {
      updateData.status = status
    }

    if (paidAt) {
      updateData.paidAt = new Date(paidAt)
    }

    if (verifiedBy) {
      updateData.verifiedBy = verifiedBy
      updateData.verifiedAt = new Date()
    }

    if (notes) {
      updateData.description = notes
    }

    // Update payment
    const updatedPayment = await prisma.payments.update({
      where: { id: payment.id },
      data: updateData
    })

    return NextResponse.json({
      message: 'Payment updated successfully',
      payment: updatedPayment
    })

  } catch (error: any) {
    console.error('Error updating payment:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    )
  }
}