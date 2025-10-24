import { NextRequest, NextResponse } from 'next/server'
import { PaymentGateway } from '@/lib/payment-gateway'
import { prisma } from '@/lib/prisma'
import { 
  validateMidtransWebhook, 
  checkRateLimit, 
  logSecurityEvent, 
  checkDuplicatePayment,
  maskSensitiveInfo
} from '@/lib/payment-security'
import { z } from 'zod'

// Midtrans notification schema
const NotificationSchema = z.object({
  transaction_time: z.string(),
  transaction_status: z.enum(['capture', 'settlement', 'pending', 'deny', 'cancel', 'expire', 'failure']),
  transaction_id: z.string(),
  status_message: z.string(),
  status_code: z.string(),
  signature_key: z.string(),
  payment_type: z.string(),
  order_id: z.string(),
  merchant_id: z.string(),
  masked_card: z.string().optional(),
  gross_amount: z.string(),
  fraud_status: z.string().optional(),
  eci: z.string().optional(),
  currency: z.string(),
  channel_response_message: z.string().optional(),
  channel_response_code: z.string().optional(),
  card_type: z.string().optional(),
  bank: z.string().optional(),
  va_numbers: z.array(z.object({
    bank: z.string(),
    va_number: z.string()
  })).optional(),
  biller_code: z.string().optional(),
  bill_key: z.string().optional(),
  permata_va_number: z.string().optional(),
  bca_va_number: z.string().optional(),
  approval_code: z.string().optional()
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'

  try {
    // Rate limiting check
    const rateLimit = checkRateLimit(`webhook:${clientIP}`, 100, 60000) // 100 requests per minute
    if (!rateLimit.allowed) {
      await logSecurityEvent(
        'RATE_LIMIT_EXCEEDED',
        { clientIP, remaining: rateLimit.remaining },
        'medium',
        clientIP,
        userAgent
      )
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString()
          }
        }
      )
    }

    const body = await request.json()
    
    // Validate notification payload
    const validation = NotificationSchema.safeParse(body)
    if (!validation.success) {
      await logSecurityEvent(
        'INVALID_WEBHOOK_PAYLOAD',
        { errors: validation.error.errors, body: maskSensitiveInfo(body) },
        'high',
        clientIP,
        userAgent
      )
      console.error('Invalid notification payload:', validation.error.errors)
      return NextResponse.json(
        { error: 'Invalid notification payload' },
        { status: 400 }
      )
    }

    const notification = validation.data
    
    // Log webhook received (with masked sensitive data)
    console.log('Received payment notification:', {
      orderId: notification.order_id,
      transactionId: notification.transaction_id,
      status: notification.transaction_status,
      clientIP
    })

    // Enhanced webhook validation
    const serverKey = process.env.MIDTRANS_SERVER_KEY!
    if (!validateMidtransWebhook(notification, serverKey)) {
      await logSecurityEvent(
        'INVALID_WEBHOOK_SIGNATURE',
        { orderId: notification.order_id, clientIP },
        'high',
        clientIP,
        userAgent
      )
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Check for duplicate processing
    const isDuplicate = await checkDuplicatePayment(notification.order_id)
    if (isDuplicate) {
      console.log('Duplicate webhook notification received for order:', notification.order_id)
      return NextResponse.json({
        message: 'Duplicate notification ignored',
        orderId: notification.order_id
      })
    }

    // Find payment record
    const payment = await prisma.payments.findFirst({
      where: { 
        externalId: notification.order_id 
      },
      include: {
        registration: true,
        student: true
      }
    })

    if (!payment) {
      console.error('Payment not found for order ID:', notification.order_id)
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Determine payment status based on Midtrans status
    let status: string
    let paidAt: Date | null = null

    switch (notification.transaction_status) {
      case 'capture':
      case 'settlement':
        status = 'SUCCESS'
        paidAt = new Date(notification.transaction_time)
        break
      case 'pending':
        status = 'PENDING'
        break
      case 'deny':
      case 'cancel':
      case 'expire':
      case 'failure':
        status = 'FAILED'
        break
      default:
        status = 'PENDING'
    }

    // Prepare update data
    const updateData: any = {
      status,
      paidAt,
      transactionId: notification.transaction_id,
      updatedAt: new Date(),
      // Store complete gateway response
      paymentGatewayData: JSON.stringify(notification),
      // Additional gateway fields
      merchantId: notification.merchant_id,
      fraudStatus: notification.fraud_status,
      cardType: notification.card_type,
      maskedCard: notification.masked_card,
      approvalCode: notification.approval_code
    }

    // Update VA number if provided
    if (notification.va_numbers && notification.va_numbers.length > 0) {
      updateData.vaNumber = notification.va_numbers[0].va_number
    } else if (notification.permata_va_number) {
      updateData.vaNumber = notification.permata_va_number
    } else if (notification.bca_va_number) {
      updateData.vaNumber = notification.bca_va_number
    }

    // Update payment record
    const updatedPayment = await prisma.payments.update({
      where: { id: payment.id },
      data: updateData
    })

    // Handle successful payment
    if (status === 'SUCCESS') {
      console.log(`Payment ${payment.paymentNo} successfully completed`)

      // Update registration payment status if applicable
      if (payment.registrationId && payment.registration) {
        await prisma.registrations.update({
          where: { id: payment.registrationId },
          data: {
            paymentStatus: 'PAID',
            paymentDate: paidAt,
            updatedAt: new Date()
          }
        })
        console.log(`Registration ${payment.registration.registrationNo} payment status updated to PAID`)
      }

      // TODO: Send notification to student/parent
      // TODO: Update any related bills or records
      // TODO: Generate receipt/invoice
    }

    // Handle failed payment
    if (status === 'FAILED') {
      console.log(`Payment ${payment.paymentNo} failed: ${notification.status_message}`)
      
      // TODO: Send failure notification
      // TODO: Update any related records
    }

    console.log(`Payment ${payment.paymentNo} status updated to: ${status}`)

    return NextResponse.json({
      message: 'Notification processed successfully',
      payment: {
        id: payment.id,
        paymentNo: payment.paymentNo,
        status,
        transactionId: notification.transaction_id
      }
    })

  } catch (error: any) {
    const processingTime = Date.now() - startTime
    
    // Log the error with context
    await logSecurityEvent(
      'WEBHOOK_PROCESSING_ERROR',
      { 
        error: error.message,
        stack: error.stack,
        processingTime,
        clientIP
      },
      'high',
      clientIP,
      userAgent
    )
    
    console.error('Error processing payment notification:', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      processingTime,
      clientIP
    })
    
    // Return success to prevent retry from Midtrans
    // But log the error for investigation
    return NextResponse.json({
      message: 'Notification received but processing failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      processingTime
    })
  }
}

// Handle GET requests for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Payment notification endpoint is active',
    timestamp: new Date().toISOString()
  })
}