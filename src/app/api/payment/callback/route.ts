import { NextRequest, NextResponse } from 'next/server'
import { PaymentGateway, PaymentNotification } from '@/lib/payment-gateway'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text()
    let notification: PaymentNotification

    try {
      notification = JSON.parse(rawBody)
    } catch (parseError) {
      console.error('Invalid JSON in webhook:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON format' },
        { status: 400 }
      )
    }

    console.log('Received payment notification:', {
      orderId: notification.order_id,
      status: notification.transaction_status,
      paymentType: notification.payment_type,
      amount: notification.gross_amount
    })

    // Validate required fields
    if (!notification.order_id || !notification.transaction_status || !notification.signature_key) {
      console.error('Missing required fields in notification')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Initialize payment gateway for validation
    const paymentGateway = new PaymentGateway()

    // Validate notification signature
    if (!paymentGateway.validateNotification(notification)) {
      console.error('Invalid signature for notification:', notification.order_id)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Process the notification
    try {
      await processPaymentNotification(notification)
      
      console.log(`Successfully processed notification for order: ${notification.order_id}`)
      
      return NextResponse.json({ 
        message: 'Notification processed successfully',
        orderId: notification.order_id
      })
      
    } catch (processingError: any) {
      console.error('Error processing notification:', processingError)
      
      // Log the error but still return success to prevent retries
      await logNotificationError(notification, processingError.message)
      
      return NextResponse.json(
        { 
          error: 'Processing error',
          details: processingError.message 
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Webhook error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    )
  }
}

// Handle GET requests for webhook testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Payment webhook endpoint is active',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  })
}

async function processPaymentNotification(notification: PaymentNotification): Promise<void> {
  try {
    // Find payment by external ID (order ID)
    const payment = await prisma.payments.findFirst({
      where: {
        externalId: notification.order_id
      }
    })

    if (!payment) {
      throw new Error(`Payment not found for order ID: ${notification.order_id}`)
    }

    // Determine payment status based on transaction status
    let status: string
    let paidAt: Date | null = null

    switch (notification.transaction_status.toLowerCase()) {
      case 'capture':
        // For credit card transactions that are captured
        if (notification.fraud_status === 'accept') {
          status = 'SUCCESS'
          paidAt = new Date(notification.transaction_time)
        } else if (notification.fraud_status === 'deny') {
          status = 'FAILED'
        } else {
          status = 'PENDING' // Challenge by fraud detection system
        }
        break

      case 'settlement':
        // Transaction is settled and money is credited to merchant
        status = 'SUCCESS'
        paidAt = new Date(notification.transaction_time)
        break

      case 'pending':
        // Transaction is pending (waiting for customer to complete payment)
        status = 'PENDING'
        break

      case 'deny':
        // Payment was denied
        status = 'FAILED'
        break

      case 'cancel':
        // Transaction was cancelled
        status = 'FAILED'
        break

      case 'expire':
        // Transaction expired
        status = 'EXPIRED'
        break

      case 'failure':
        // Transaction failed
        status = 'FAILED'
        break

      case 'refund':
        // Transaction was refunded
        status = 'REFUNDED'
        break

      case 'partial_refund':
        // Transaction was partially refunded
        status = 'REFUNDED'
        break

      default:
        console.warn(`Unknown transaction status: ${notification.transaction_status}`)
        status = 'PENDING'
    }

    // Additional data to update
    const updateData: any = {
      status,
      paidAt,
      updatedAt: new Date()
    }

    // Store additional payment gateway data
    if (notification.payment_type) {
      updateData.channel = notification.payment_type.toUpperCase()
    }

    // Update payment record
    const updatedPayment = await prisma.payments.update({
      where: { id: payment.id },
      data: updateData
    })

    console.log(`Payment ${payment.id} updated to status: ${status}`)

    // Handle successful payments
    if (status === 'SUCCESS') {
      await handleSuccessfulPayment(updatedPayment, notification)
    }

    // Handle failed payments
    if (['FAILED', 'EXPIRED'].includes(status)) {
      await handleFailedPayment(updatedPayment, notification)
    }

    // Log notification for audit trail
    await logNotification(notification, payment.id, status)

  } catch (error) {
    console.error('Error in processPaymentNotification:', error)
    throw error
  }
}

async function handleSuccessfulPayment(payment: any, notification: PaymentNotification): Promise<void> {
  try {
    // Update registration payment status if this is a registration payment
    if (payment.registrationId) {
      await prisma.ppdb_registrations.update({
        where: { id: payment.registrationId },
        data: {
          paymentStatus: 'PAID',
          updatedAt: new Date()
        }
      })

      console.log(`Registration ${payment.registrationId} payment status updated to PAID`)

      // If this is registration fee payment, consider moving status forward
      if (payment.paymentType === 'REGISTRATION') {
        const registration = await prisma.ppdb_registrations.findUnique({
          where: { id: payment.registrationId }
        })

        if (registration && registration.status === 'SUBMITTED') {
          await prisma.ppdb_registrations.update({
            where: { id: payment.registrationId },
            data: {
              status: 'DOCUMENT_CHECK',
              updatedAt: new Date()
            }
          })

          console.log(`Registration ${payment.registrationId} status updated to DOCUMENT_CHECK`)
        }
      }
    }

    // Handle other payment types (SPP, uniform, etc.) for students
    if (payment.studentId) {
      console.log(`Student payment ${payment.id} completed for student ${payment.studentId}`)
    }

    // TODO: Send notification email/SMS to customer about successful payment
    // await sendPaymentSuccessNotification(payment, notification)

  } catch (error) {
    console.error('Error handling successful payment:', error)
    throw error
  }
}

async function handleFailedPayment(payment: any, notification: PaymentNotification): Promise<void> {
  try {
    console.log(`Payment ${payment.id} failed or expired`)

    // TODO: Send notification about failed payment
    // await sendPaymentFailureNotification(payment, notification)

    // For registration payments, you might want to create a new payment record
    // or allow the user to retry payment

  } catch (error) {
    console.error('Error handling failed payment:', error)
    throw error
  }
}

async function logNotification(notification: PaymentNotification, paymentId: string, resultStatus: string): Promise<void> {
  try {
    // Log notification for audit purposes
    // You might want to create a separate table for this
    console.log('Payment notification logged:', {
      paymentId,
      orderId: notification.order_id,
      transactionStatus: notification.transaction_status,
      resultStatus,
      paymentType: notification.payment_type,
      amount: notification.gross_amount,
      timestamp: notification.transaction_time
    })

    // Store in database for audit (optional)
    // await prisma.paymentsLog.create({
    //   data: {
    //     paymentId,
    //     orderId: notification.order_id,
    //     transactionStatus: notification.transaction_status,
    //     resultStatus,
    //     paymentType: notification.payment_type,
    //     amount: parseFloat(notification.gross_amount),
    //     rawNotification: JSON.stringify(notification),
    //     createdAt: new Date()
    //   }
    // })

  } catch (error) {
    console.error('Error logging notification:', error)
    // Don't throw error here to avoid breaking the main flow
  }
}

async function logNotificationError(notification: PaymentNotification, errorMessage: string): Promise<void> {
  try {
    console.error('Payment notification error logged:', {
      orderId: notification.order_id,
      error: errorMessage,
      timestamp: new Date().toISOString()
    })

    // Store error in database for debugging (optional)
    // await prisma.paymentsErrorLog.create({
    //   data: {
    //     orderId: notification.order_id,
    //     errorMessage,
    //     rawNotification: JSON.stringify(notification),
    //     createdAt: new Date()
    //   }
    // })

  } catch (error) {
    console.error('Error logging notification error:', error)
  }
}