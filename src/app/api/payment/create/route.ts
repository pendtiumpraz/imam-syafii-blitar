import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PaymentGateway } from '@/lib/payment-gateway'
import { z } from 'zod'

// Request validation schema
const CreatePaymentSchema = z.object({
  registrationId: z.string().optional(),
  studentId: z.string().optional(),
  amount: z.number().positive(),
  paymentType: z.string(),
  description: z.string().optional(),
  method: z.enum(['TRANSFER', 'CASH', 'VA', 'EWALLET', 'QRIS']),
  channel: z.string().optional(),
  customerDetails: z.object({
    firstName: z.string().min(1),
    lastName: z.string().optional(),
    email: z.string().email(),
    phone: z.string().min(10)
  })
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = CreatePaymentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const {
      registrationId,
      studentId,
      amount,
      paymentType,
      description,
      method,
      channel,
      customerDetails
    } = validation.data

    // Verify registration or student exists
    let registration = null
    let student = null

    if (registrationId) {
      registration = await prisma.registrations.findUnique({
        where: { id: registrationId }
      })

      if (!registration) {
        return NextResponse.json(
          { error: 'Registration not found' },
          { status: 404 }
        )
      }
    }

    if (studentId) {
      student = await prisma.students.findUnique({
        where: { id: studentId }
      })

      if (!student) {
        return NextResponse.json(
          { error: 'Student not found' },
          { status: 404 }
        )
      }
    }

    if (!registrationId && !studentId) {
      return NextResponse.json(
        { error: 'Either registrationId or studentId must be provided' },
        { status: 400 }
      )
    }

    // Initialize payment gateway
    const paymentGateway = new PaymentGateway()

    // Generate order ID and payment number
    const orderId = paymentGateway.generateOrderId('PAY')
    const paymentNo = await generatePaymentNumber()

    // Calculate expiry time (24 hours from now)
    const expiredAt = new Date()
    expiredAt.setHours(expiredAt.getHours() + 24)

    // Create payment record in database
    const payment = await prisma.payments.create({
      data: {
        paymentNo,
        registrationId,
        studentId,
        amount,
        paymentType,
        description: description || `Pembayaran ${paymentType}`,
        method,
        channel,
        status: 'PENDING',
        externalId: orderId,
        expiredAt
      }
    })

    // Prepare item details
    const itemDetails = [{
      id: payment.id,
      price: Number(amount),
      quantity: 1,
      name: description || `Pembayaran ${paymentType}`
    }]

    const paymentRequest = {
      orderId,
      amount: Number(amount),
      customerDetails,
      itemDetails
    }

    let paymentResponse

    try {
      // Create payment based on method
      switch (method) {
        case 'VA':
          if (!channel) {
            return NextResponse.json(
              { error: 'Channel is required for Virtual Account payment' },
              { status: 400 }
            )
          }
          paymentResponse = await paymentGateway.createVirtualAccount(
            paymentRequest, 
            channel.toLowerCase()
          )
          break

        case 'EWALLET':
          if (!channel) {
            return NextResponse.json(
              { error: 'Channel is required for E-Wallet payment' },
              { status: 400 }
            )
          }
          paymentResponse = await paymentGateway.createEwalletPayment(
            paymentRequest,
            channel.toLowerCase()
          )
          break

        case 'QRIS':
          paymentResponse = await paymentGateway.createQrisPayment(paymentRequest)
          break

        case 'TRANSFER':
          // For manual transfer, we don't need payment gateway
          paymentResponse = {
            redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL}/ppdb/payment/${payment.id}`,
            token: null
          }
          break

        default:
          // Use Snap for general payment (includes all methods)
          paymentResponse = await paymentGateway.createPayment(paymentRequest)
      }

      // Update payment with gateway response data
      const updateData: any = {
        paymentGatewayData: JSON.stringify(paymentResponse)
      }

      // Extract specific gateway fields
      if (paymentResponse.transaction_id) {
        updateData.transactionId = paymentResponse.transaction_id
      }

      if (paymentResponse.redirect_url) {
        updateData.paymentUrl = paymentResponse.redirect_url
      }

      if (paymentResponse.qr_string) {
        updateData.qrString = paymentResponse.qr_string
      }

      if (paymentResponse.deeplink_redirect) {
        updateData.deeplink = paymentResponse.deeplink_redirect
      }

      if (paymentResponse.va_numbers && paymentResponse.va_numbers.length > 0) {
        updateData.vaNumber = paymentResponse.va_numbers[0].va_number
      } else if (paymentResponse.permata_va_number) {
        updateData.vaNumber = paymentResponse.permata_va_number
      } else if (paymentResponse.bca_va_number) {
        updateData.vaNumber = paymentResponse.bca_va_number
      } else if (paymentResponse.bni_va_number) {
        updateData.vaNumber = paymentResponse.bni_va_number
      } else if (paymentResponse.bri_va_number) {
        updateData.vaNumber = paymentResponse.bri_va_number
      } else if (paymentResponse.cimb_va_number) {
        updateData.vaNumber = paymentResponse.cimb_va_number
      } else if (paymentResponse.other_va_number) {
        updateData.vaNumber = paymentResponse.other_va_number
      }

      await prisma.payments.update({
        where: { id: payment.id },
        data: updateData
      })

      // Return payment details
      return NextResponse.json({
        payment: {
          id: payment.id,
          paymentNo: payment.paymentNo,
          orderId,
          transactionId: updateData.transactionId,
          amount: Number(payment.amount),
          method: payment.method,
          channel: payment.channel,
          status: payment.status,
          paymentUrl: updateData.paymentUrl,
          vaNumber: updateData.vaNumber,
          qrString: updateData.qrString,
          deeplink: updateData.deeplink,
          expiredAt: payment.expiredAt
        },
        gateway: paymentResponse
      })

    } catch (gatewayError: any) {
      // Update payment status to failed if gateway error
      await prisma.payments.update({
        where: { id: payment.id },
        data: { status: 'FAILED' }
      })

      console.error('Payment gateway error:', gatewayError)
      
      return NextResponse.json(
        { 
          error: 'Payment gateway error',
          details: gatewayError.message 
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Error creating payment:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const registrationId = searchParams.get('registrationId')
    const studentId = searchParams.get('studentId')
    const status = searchParams.get('status')
    const method = searchParams.get('method')

    // Build where clause
    const where: any = {}
    
    if (registrationId) {
      where.registrationId = registrationId
    }
    
    if (studentId) {
      where.studentId = studentId
    }
    
    if (status) {
      where.status = status
    }
    
    if (method) {
      where.method = method
    }

    // Get payments
    const payments = await prisma.payments.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    // Fetch related registration and student data separately
    const registrationIds = payments
      .map(p => p.registrationId)
      .filter((id): id is string => id !== null)
    const studentIds = payments
      .map(p => p.studentId)
      .filter((id): id is string => id !== null)

    const [registrations, students] = await Promise.all([
      registrationIds.length > 0
        ? prisma.ppdb_registrations.findMany({
            where: { id: { in: registrationIds } },
            select: {
              id: true,
              registrationNo: true,
              fullName: true,
              email: true,
              phone: true
            }
          })
        : [],
      studentIds.length > 0
        ? prisma.students.findMany({
            where: { id: { in: studentIds } },
            select: {
              id: true,
              nis: true,
              fullName: true,
              email: true,
              phone: true
            }
          })
        : []
    ])

    // Create lookup maps for O(1) access
    const registrationMap = new Map(registrations.map(r => [r.id, r]))
    const studentMap = new Map(students.map(s => [s.id, s]))

    // Combine data
    const paymentsWithRelations = payments.map(payment => ({
      ...payment,
      registration: payment.registrationId ? registrationMap.get(payment.registrationId) : null,
      student: payment.studentId ? studentMap.get(payment.studentId) : null
    }))

    return NextResponse.json({ payments: paymentsWithRelations })

  } catch (error: any) {
    console.error('Error fetching payments:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      },
      { status: 500 }
    )
  }
}

// Helper function to generate payment number
async function generatePaymentNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  
  // Get the count of payments this month
  const startOfMonth = new Date(year, new Date().getMonth(), 1)
  const endOfMonth = new Date(year, new Date().getMonth() + 1, 0)
  
  const paymentCount = await prisma.payments.count({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }
  })
  
  const sequence = String(paymentCount + 1).padStart(4, '0')
  return `PAY-${year}-${month}-${sequence}`
}