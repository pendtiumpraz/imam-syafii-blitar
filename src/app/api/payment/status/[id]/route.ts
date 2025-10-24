import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PaymentGateway } from '@/lib/payment-gateway'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paymentId = params.id

    // Find payment by ID
    const payment = await prisma.payments.findUnique({
      where: { id: paymentId },
      include: {
        registration: {
          select: {
            id: true,
            registrationNo: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            level: true,
            status: true,
            paymentStatus: true
          }
        },
        student: {
          select: {
            id: true,
            nis: true,
            fullName: true,
            email: true,
            phone: true
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Check if payment is still pending and not expired
    const now = new Date()
    const isExpired = payment.expiredAt && payment.expiredAt < now

    // If payment is pending and has external ID, check with payment gateway
    let gatewayStatus = null
    if (payment.status === 'PENDING' && payment.externalId && !isExpired) {
      try {
        const paymentGateway = new PaymentGateway()
        gatewayStatus = await paymentGateway.checkPaymentStatus(payment.externalId)
        
        // Update payment status if it changed
        if (gatewayStatus.transaction_status !== 'pending') {
          let newStatus: string
          let paidAt: Date | null = null

          switch (gatewayStatus.transaction_status.toLowerCase()) {
            case 'capture':
            case 'settlement':
              newStatus = 'SUCCESS'
              paidAt = new Date(gatewayStatus.transaction_time)
              break
            case 'deny':
            case 'cancel':
            case 'expire':
            case 'failure':
              newStatus = 'FAILED'
              break
            default:
              newStatus = 'PENDING'
          }

          // Update payment in database
          if (newStatus !== 'PENDING') {
            const updatedPayment = await prisma.payments.update({
              where: { id: payment.id },
              data: {
                status: newStatus,
                paidAt,
                updatedAt: new Date()
              }
            })

            // Update registration if payment successful
            if (newStatus === 'SUCCESS' && payment.registrationId) {
              await prisma.registrations.update({
                where: { id: payment.registrationId },
                data: {
                  paymentStatus: 'PAID',
                  paymentDate: paidAt,
                  updatedAt: new Date()
                }
              })
            }

            // Return updated payment data
            return NextResponse.json({
              payment: {
                ...payment,
                status: newStatus,
                paidAt
              },
              gatewayStatus
            })
          }
        }
      } catch (gatewayError: any) {
        console.error('Error checking payment gateway status:', gatewayError)
        // Don't throw error, just log it and continue with database status
        gatewayStatus = { error: gatewayError.message }
      }
    }

    // Handle expired payments
    if (isExpired && payment.status === 'PENDING') {
      await prisma.payments.update({
        where: { id: payment.id },
        data: {
          status: 'EXPIRED',
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        payment: {
          ...payment,
          status: 'EXPIRED'
        },
        gatewayStatus
      })
    }

    // Return current payment status
    return NextResponse.json({
      payment,
      gatewayStatus
    })

  } catch (error: any) {
    console.error('Error checking payment status:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paymentId = params.id
    const body = await request.json()
    const { action } = body

    // Find payment
    const payment = await prisma.payments.findUnique({
      where: { id: paymentId },
      include: {
        registration: true,
        student: true
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    if (action === 'cancel') {
      // Cancel payment if it's still pending
      if (payment.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Payment cannot be cancelled' },
          { status: 400 }
        )
      }

      // Cancel with payment gateway if exists
      if (payment.externalId) {
        try {
          const paymentGateway = new PaymentGateway()
          await paymentGateway.cancelPayment(payment.externalId)
        } catch (gatewayError: any) {
          console.error('Error cancelling payment with gateway:', gatewayError)
          // Continue with database update even if gateway fails
        }
      }

      // Update payment status
      const updatedPayment = await prisma.payments.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        message: 'Payment cancelled successfully',
        payment: updatedPayment
      })
    }

    if (action === 'refresh') {
      // Force refresh payment status from gateway
      if (!payment.externalId) {
        return NextResponse.json(
          { error: 'Cannot refresh payment without external ID' },
          { status: 400 }
        )
      }

      try {
        const paymentGateway = new PaymentGateway()
        const gatewayStatus = await paymentGateway.checkPaymentStatus(payment.externalId)

        // Update payment status based on gateway response
        let newStatus: string
        let paidAt: Date | null = null

        switch (gatewayStatus.transaction_status.toLowerCase()) {
          case 'capture':
          case 'settlement':
            newStatus = 'SUCCESS'
            paidAt = new Date(gatewayStatus.transaction_time)
            break
          case 'deny':
          case 'cancel':
          case 'expire':
          case 'failure':
            newStatus = 'FAILED'
            break
          default:
            newStatus = 'PENDING'
        }

        const updatedPayment = await prisma.payments.update({
          where: { id: payment.id },
          data: {
            status: newStatus,
            paidAt,
            updatedAt: new Date()
          }
        })

        // Update registration if payment successful
        if (newStatus === 'SUCCESS' && payment.registrationId) {
          await prisma.registrations.update({
            where: { id: payment.registrationId },
            data: {
              paymentStatus: 'PAID',
              paymentDate: paidAt,
              updatedAt: new Date()
            }
          })
        }

        return NextResponse.json({
          message: 'Payment status refreshed',
          payment: updatedPayment,
          gatewayStatus
        })

      } catch (gatewayError: any) {
        console.error('Error refreshing payment status:', gatewayError)
        return NextResponse.json(
          { 
            error: 'Failed to refresh payment status',
            details: gatewayError.message 
          },
          { status: 500 }
        )
      }
    }

    if (action === 'verify_manual') {
      // For manual transfer verification by admin
      const { verifiedBy, proofUrl } = body

      if (!verifiedBy) {
        return NextResponse.json(
          { error: 'verifiedBy is required for manual verification' },
          { status: 400 }
        )
      }

      // Only allow verification for transfer payments
      if (payment.method !== 'TRANSFER') {
        return NextResponse.json(
          { error: 'Manual verification only allowed for transfer payments' },
          { status: 400 }
        )
      }

      if (payment.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Payment is not pending verification' },
          { status: 400 }
        )
      }

      const updatedPayment = await prisma.payments.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          paidAt: new Date(),
          verifiedBy,
          verifiedAt: new Date(),
          proofUrl,
          updatedAt: new Date()
        }
      })

      // Update registration if payment successful
      if (payment.registrationId) {
        await prisma.registrations.update({
          where: { id: payment.registrationId },
          data: {
            paymentStatus: 'PAID',
            paymentDate: new Date(),
            updatedAt: new Date()
          }
        })
      }

      return NextResponse.json({
        message: 'Payment verified successfully',
        payment: updatedPayment
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('Error processing payment action:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    )
  }
}