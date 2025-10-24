import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PaymentGateway } from '@/lib/payment-gateway'
import { 
  checkRateLimit, 
  logSecurityEvent, 
  validatePaymentAmount,
  validateCustomerDetails,
  validatePaymentMethod,
  sanitizeInput
} from '@/lib/payment-security'
import { z } from 'zod'

// Transaction creation schema
const CreateTransactionSchema = z.object({
  // Payment source
  billId: z.string().optional(),
  registrationId: z.string().optional(),
  studentId: z.string().optional(),
  
  // Payment details
  amount: z.number().positive(),
  paymentType: z.string(),
  description: z.string().optional(),
  
  // Payment method selection
  paymentMethod: z.enum(['bank_transfer', 'e_wallet', 'qris', 'credit_card', 'cash']),
  paymentChannel: z.string().optional(), // bca, mandiri, gopay, ovo, etc.
  
  // Customer information
  customerDetails: z.object({
    firstName: z.string().min(1),
    lastName: z.string().optional(),
    email: z.string().email(),
    phone: z.string().min(10)
  }),
  
  // Additional options
  autoRedirect: z.boolean().default(true),
  callbackUrl: z.string().optional()
})

export async function POST(request: NextRequest) {
  const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'

  try {
    // Rate limiting check
    const rateLimit = checkRateLimit(`create-payment:${clientIP}`, 20, 60000) // 20 requests per minute
    if (!rateLimit.allowed) {
      await logSecurityEvent(
        'CREATE_PAYMENT_RATE_LIMIT',
        { clientIP, remaining: rateLimit.remaining },
        'medium',
        clientIP,
        userAgent
      )
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    
    // Sanitize input data
    const sanitizedBody = sanitizeInput(body)
    
    // Validate request
    const validation = CreateTransactionSchema.safeParse(sanitizedBody)
    if (!validation.success) {
      await logSecurityEvent(
        'INVALID_PAYMENT_REQUEST',
        { errors: validation.error.errors, clientIP },
        'low',
        clientIP,
        userAgent
      )
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const {
      billId,
      registrationId,
      studentId,
      amount,
      paymentType,
      description,
      paymentMethod,
      paymentChannel,
      customerDetails,
      autoRedirect,
      callbackUrl
    } = validation.data

    // Additional security validations
    if (!validatePaymentAmount(amount)) {
      await logSecurityEvent(
        'INVALID_PAYMENT_AMOUNT',
        { amount, clientIP },
        'medium',
        clientIP,
        userAgent
      )
      return NextResponse.json(
        { error: 'Invalid payment amount' },
        { status: 400 }
      )
    }

    if (!validateCustomerDetails(customerDetails)) {
      await logSecurityEvent(
        'INVALID_CUSTOMER_DETAILS',
        { customerDetails: { ...customerDetails, email: '***', phone: '***' }, clientIP },
        'medium',
        clientIP,
        userAgent
      )
      return NextResponse.json(
        { error: 'Invalid customer details' },
        { status: 400 }
      )
    }

    if (!validatePaymentMethod(paymentMethod, paymentChannel)) {
      await logSecurityEvent(
        'INVALID_PAYMENT_METHOD',
        { paymentMethod, paymentChannel, clientIP },
        'medium',
        clientIP,
        userAgent
      )
      return NextResponse.json(
        { error: 'Invalid payment method or channel' },
        { status: 400 }
      )
    }

    // Validate that at least one source is provided
    if (!billId && !registrationId && !studentId) {
      return NextResponse.json(
        { error: 'At least one of billId, registrationId, or studentId must be provided' },
        { status: 400 }
      )
    }

    // Initialize payment gateway
    const paymentGateway = new PaymentGateway()
    
    // Generate unique order ID
    const orderId = paymentGateway.generateOrderId('TXN')
    const paymentNo = await generatePaymentNumber()

    // Calculate expiry (24 hours for most methods, 1 hour for e-wallets)
    const expiredAt = new Date()
    const hoursToAdd = paymentMethod === 'e_wallet' ? 1 : 24
    expiredAt.setHours(expiredAt.getHours() + hoursToAdd)

    // Determine method and channel for database
    let dbMethod: string
    let dbChannel: string | null = paymentChannel || null

    switch (paymentMethod) {
      case 'bank_transfer':
        dbMethod = 'VA'
        break
      case 'e_wallet':
        dbMethod = 'EWALLET'
        break
      case 'qris':
        dbMethod = 'QRIS'
        break
      case 'credit_card':
        dbMethod = 'CARD'
        break
      case 'cash':
        dbMethod = 'CASH'
        break
      default:
        dbMethod = 'TRANSFER'
    }

    // Create payment record
    const payment = await prisma.payments.create({
      data: {
        paymentNo,
        billId,
        registrationId,
        studentId,
        amount,
        paymentType,
        description: description || `Payment for ${paymentType}`,
        method: dbMethod,
        channel: dbChannel,
        status: 'PENDING',
        externalId: orderId,
        expiredAt
      }
    })

    // Prepare item details for gateway
    const itemDetails = [{
      id: payment.id,
      price: Number(amount),
      quantity: 1,
      name: description || `Payment for ${paymentType}`
    }]

    const paymentRequest = {
      orderId,
      amount: Number(amount),
      customerDetails,
      itemDetails,
      paymentType: paymentMethod,
      bankTransfer: paymentChannel && paymentMethod === 'bank_transfer' ? 
        { bank: paymentChannel } : undefined,
      ewallet: paymentChannel && paymentMethod === 'e_wallet' ? 
        { type: paymentChannel } : undefined
    }

    let gatewayResponse
    let paymentUrl = null
    let instructions = null

    try {
      // Create payment with appropriate gateway method
      switch (paymentMethod) {
        case 'bank_transfer':
          if (!paymentChannel) {
            throw new Error('Payment channel is required for bank transfer')
          }
          gatewayResponse = await paymentGateway.createVirtualAccount(
            paymentRequest,
            paymentChannel
          )
          break

        case 'e_wallet':
          if (!paymentChannel) {
            throw new Error('Payment channel is required for e-wallet')
          }
          gatewayResponse = await paymentGateway.createEwalletPayment(
            paymentRequest,
            paymentChannel
          )
          break

        case 'qris':
          gatewayResponse = await paymentGateway.createQrisPayment(paymentRequest)
          break

        case 'credit_card':
          // Use Snap for credit card payments
          gatewayResponse = await paymentGateway.createPayment(paymentRequest)
          paymentUrl = gatewayResponse.redirect_url
          break

        case 'cash':
          // For cash payments, no gateway interaction needed
          gatewayResponse = {
            payment_type: 'cash',
            transaction_status: 'pending',
            transaction_id: orderId
          }
          break

        default:
          // Default to Snap for other payment types
          gatewayResponse = await paymentGateway.createPayment(paymentRequest)
          paymentUrl = gatewayResponse.redirect_url
      }

      // Update payment with gateway response data
      const updateData: any = {
        paymentGatewayData: JSON.stringify(gatewayResponse)
      }

      // Extract and store specific gateway data
      if (gatewayResponse.redirect_url) {
        updateData.paymentUrl = gatewayResponse.redirect_url
        paymentUrl = gatewayResponse.redirect_url
      }

      if (gatewayResponse.qr_string) {
        updateData.qrString = gatewayResponse.qr_string
      }

      if (gatewayResponse.deeplink_redirect) {
        updateData.deeplink = gatewayResponse.deeplink_redirect
      }

      if (gatewayResponse.transaction_id) {
        updateData.transactionId = gatewayResponse.transaction_id
      }

      // Handle VA numbers
      if (gatewayResponse.va_numbers && gatewayResponse.va_numbers.length > 0) {
        updateData.vaNumber = gatewayResponse.va_numbers[0].va_number
      } else if (gatewayResponse.permata_va_number) {
        updateData.vaNumber = gatewayResponse.permata_va_number
      } else if (gatewayResponse.bca_va_number) {
        updateData.vaNumber = gatewayResponse.bca_va_number
      } else if (gatewayResponse.bni_va_number) {
        updateData.vaNumber = gatewayResponse.bni_va_number
      } else if (gatewayResponse.bri_va_number) {
        updateData.vaNumber = gatewayResponse.bri_va_number
      }

      // Update payment record
      await prisma.payments.update({
        where: { id: payment.id },
        data: updateData
      })

      // Generate payment instructions based on method
      instructions = generatePaymentInstructions(paymentMethod, paymentChannel, gatewayResponse)

      // Prepare success response
      const response = {
        success: true,
        transaction: {
          id: payment.id,
          paymentNo: payment.paymentNo,
          orderId,
          transactionId: gatewayResponse.transaction_id,
          amount: Number(amount),
          paymentType,
          paymentMethod,
          paymentChannel,
          status: 'PENDING',
          expiredAt,
          createdAt: payment.createdAt
        },
        payment: {
          url: paymentUrl,
          token: gatewayResponse.token,
          vaNumber: updateData.vaNumber,
          qrString: updateData.qrString,
          deeplink: updateData.deeplink,
          instructions
        },
        redirect: autoRedirect && paymentUrl ? {
          url: paymentUrl,
          type: 'external'
        } : null
      }

      return NextResponse.json(response)

    } catch (gatewayError: any) {
      // Update payment status to failed
      await prisma.payments.update({
        where: { id: payment.id },
        data: { 
          status: 'FAILED',
          description: `${payment.description} (Gateway error: ${gatewayError.message})`
        }
      })

      console.error('Gateway error:', gatewayError)
      
      return NextResponse.json(
        { 
          error: 'Payment gateway error',
          details: gatewayError.message,
          transaction: {
            id: payment.id,
            paymentNo: payment.paymentNo,
            status: 'FAILED'
          }
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    await logSecurityEvent(
      'PAYMENT_CREATION_ERROR',
      { 
        error: error.message,
        stack: error.stack,
        clientIP
      },
      'high',
      clientIP,
      userAgent
    )
    
    console.error('Error creating transaction:', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      clientIP
    })
    
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

// Helper function to generate payment instructions
function generatePaymentInstructions(
  paymentMethod: string, 
  paymentChannel: string | undefined, 
  gatewayResponse: any
): any {
  const instructions: any = {
    method: paymentMethod,
    channel: paymentChannel
  }

  switch (paymentMethod) {
    case 'bank_transfer':
      instructions.title = `Transfer ke Virtual Account ${paymentChannel?.toUpperCase()}`
      instructions.steps = [
        'Login ke mobile banking atau kunjungi ATM',
        `Pilih menu Transfer ke Virtual Account ${paymentChannel?.toUpperCase()}`,
        `Masukkan nomor Virtual Account: ${gatewayResponse.va_numbers?.[0]?.va_number || gatewayResponse.permata_va_number || gatewayResponse.bca_va_number}`,
        `Masukkan jumlah transfer sesuai tagihan`,
        'Konfirmasi dan selesaikan transaksi',
        'Simpan bukti transfer sebagai konfirmasi'
      ]
      break

    case 'e_wallet':
      instructions.title = `Bayar dengan ${paymentChannel?.toUpperCase()}`
      if (gatewayResponse.deeplink_redirect) {
        instructions.deeplink = gatewayResponse.deeplink_redirect
        instructions.steps = [
          `Klik tombol "Bayar dengan ${paymentChannel?.toUpperCase()}" di bawah`,
          `Atau buka aplikasi ${paymentChannel?.toUpperCase()} dan scan QR code`,
          'Konfirmasi pembayaran di aplikasi',
          'Tunggu notifikasi pembayaran berhasil'
        ]
      } else {
        instructions.steps = [
          `Buka aplikasi ${paymentChannel?.toUpperCase()}`,
          'Pilih menu Scan QR atau Bayar',
          'Scan QR code yang ditampilkan',
          'Konfirmasi jumlah pembayaran',
          'Selesaikan pembayaran'
        ]
      }
      break

    case 'qris':
      instructions.title = 'Bayar dengan QRIS'
      instructions.qrString = gatewayResponse.qr_string
      instructions.steps = [
        'Buka aplikasi e-wallet atau mobile banking',
        'Pilih menu Scan QR atau QRIS',
        'Scan QR code yang ditampilkan',
        'Konfirmasi jumlah pembayaran',
        'Selesaikan pembayaran'
      ]
      break

    case 'credit_card':
      instructions.title = 'Bayar dengan Kartu Kredit'
      instructions.redirectUrl = gatewayResponse.redirect_url
      instructions.steps = [
        'Klik tombol "Bayar Sekarang" untuk melanjutkan',
        'Masukkan data kartu kredit Anda',
        'Masukkan kode OTP jika diminta',
        'Konfirmasi pembayaran'
      ]
      break

    case 'cash':
      instructions.title = 'Pembayaran Tunai'
      instructions.steps = [
        'Datang ke kantor administrasi sekolah',
        'Sebutkan nomor pembayaran kepada petugas',
        'Lakukan pembayaran tunai sesuai jumlah tagihan',
        'Simpan bukti pembayaran yang diberikan'
      ]
      break

    default:
      instructions.title = 'Instruksi Pembayaran'
      instructions.steps = ['Ikuti instruksi pembayaran yang diberikan']
  }

  return instructions
}