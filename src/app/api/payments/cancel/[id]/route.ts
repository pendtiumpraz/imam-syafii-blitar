import { NextRequest, NextResponse } from 'next/server'
import { PaymentGateway } from '@/lib/payment-gateway'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

interface RouteParams {
  params: {
    id: string
  }
}

const CancelPaymentSchema = z.object({
  reason: z.string().optional(),
  cancelledBy: z.string().optional()
})

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const body = await request.json()

    const validation = CancelPaymentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const { reason, cancelledBy } = validation.data

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

    // Fetch related registration data if needed
    const registration = payment.registrationId
      ? await prisma.ppdb_registrations.findUnique({
          where: { id: payment.registrationId }
        })
      : null

    // Check if payment can be cancelled
    if (payment.status === 'SUCCESS') {
      return NextResponse.json(
        { error: 'Cannot cancel a successful payment' },
        { status: 400 }
      )
    }

    if (payment.status === 'FAILED' || payment.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Payment is already cancelled or failed' },
        { status: 400 }
      )
    }

    // Cancel payment with gateway if it has external ID
    let gatewayResult = null
    if (payment.externalId) {
      try {
        const paymentGateway = new PaymentGateway()
        await paymentGateway.cancelPayment(payment.externalId)
        gatewayResult = { success: true, message: 'Payment cancelled with gateway' }
      } catch (gatewayError: any) {
        console.error('Error cancelling payment with gateway:', gatewayError)
        gatewayResult = { 
          success: false, 
          message: gatewayError.message,
          error: 'Gateway cancellation failed but local cancellation will proceed'
        }
      }
    }

    // Update payment status to cancelled
    const updatedPayment = await prisma.payments.update({
      where: { id: payment.id },
      data: {
        status: 'CANCELLED',
        verifiedBy: cancelledBy,
        verifiedAt: new Date(),
        description: reason ? `${payment.description} (Cancelled: ${reason})` : `${payment.description} (Cancelled)`,
        updatedAt: new Date()
      }
    })

    // Update registration status if applicable
    if (payment.registrationId && registration) {
      await prisma.ppdb_registrations.update({
        where: { id: payment.registrationId },
        data: {
          paymentStatus: 'UNPAID',
          updatedAt: new Date()
        }
      })
    }

    console.log(`Payment ${payment.paymentNo} cancelled by ${cancelledBy || 'system'}`)

    return NextResponse.json({
      message: 'Payment cancelled successfully',
      payment: {
        id: updatedPayment.id,
        paymentNo: updatedPayment.paymentNo,
        status: updatedPayment.status,
        cancelledAt: updatedPayment.verifiedAt,
        cancelledBy: updatedPayment.verifiedBy,
        reason
      },
      gateway: gatewayResult
    })

  } catch (error: any) {
    console.error('Error cancelling payment:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params

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

    // Check if payment can be cancelled
    const canCancel = payment.status === 'PENDING' || payment.status === 'EXPIRED'

    return NextResponse.json({
      paymentId: payment.id,
      paymentNo: payment.paymentNo,
      status: payment.status,
      canCancel,
      reason: canCancel ? null : getCannotCancelReason(payment.status)
    })

  } catch (error: any) {
    console.error('Error checking payment cancellation status:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    )
  }
}

function getCannotCancelReason(status: string): string {
  switch (status) {
    case 'SUCCESS':
      return 'Payment has already been completed'
    case 'FAILED':
      return 'Payment has already failed'
    case 'CANCELLED':
      return 'Payment has already been cancelled'
    case 'REFUNDED':
      return 'Payment has already been refunded'
    default:
      return 'Payment cannot be cancelled in current status'
  }
}