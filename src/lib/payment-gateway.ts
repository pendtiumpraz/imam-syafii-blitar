import { prisma } from './prisma'
import crypto from 'crypto'

// Environment variables for Midtrans
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY!
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY!
const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true'
const MIDTRANS_BASE_URL = MIDTRANS_IS_PRODUCTION 
  ? 'https://app.midtrans.com/snap/v1'
  : 'https://app.sandbox.midtrans.com/snap/v1'

const MIDTRANS_API_BASE_URL = MIDTRANS_IS_PRODUCTION
  ? 'https://api.midtrans.com/v2'
  : 'https://api.sandbox.midtrans.com/v2'

export interface PaymentMethod {
  type: 'bank_transfer' | 'e_wallet' | 'qris' | 'credit_card'
  name: string
  code: string
  icon?: string
  fee?: number
  description?: string
}

export interface PaymentRequest {
  orderId: string
  amount: number
  customerDetails: {
    firstName: string
    lastName?: string
    email: string
    phone: string
  }
  itemDetails: {
    id: string
    price: number
    quantity: number
    name: string
  }[]
  paymentType?: string
  bankTransfer?: {
    bank: string
  }
  ewallet?: {
    type: string
  }
}

export interface MidtransResponse {
  token: string
  redirect_url: string
  transaction_id: string
  va_numbers?: Array<{
    bank: string
    va_number: string
  }>
  permata_va_number?: string
  bca_va_number?: string
  bni_va_number?: string
  bri_va_number?: string
  cimb_va_number?: string
  other_va_number?: string
  qr_string?: string
  deeplink_redirect?: string
  expiry_time?: string
}

export interface PaymentNotification {
  transaction_time: string
  transaction_status: 'capture' | 'settlement' | 'pending' | 'deny' | 'cancel' | 'expire' | 'failure'
  transaction_id: string
  status_message: string
  status_code: string
  signature_key: string
  payment_type: string
  order_id: string
  merchant_id: string
  masked_card?: string
  gross_amount: string
  fraud_status?: string
  eci?: string
  currency: string
  channel_response_message?: string
  channel_response_code?: string
  card_type?: string
  bank?: string
  va_numbers?: Array<{
    bank: string
    va_number: string
  }>
  biller_code?: string
  bill_key?: string
  permata_va_number?: string
  bca_va_number?: string
  approval_code?: string
}

// Available payment methods
export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    type: 'bank_transfer',
    name: 'BCA Virtual Account',
    code: 'bca',
    icon: '/images/banks/bca.png',
    description: 'Transfer melalui ATM, Mobile Banking, atau Internet Banking BCA'
  },
  {
    type: 'bank_transfer',
    name: 'BNI Virtual Account',
    code: 'bni',
    icon: '/images/banks/bni.png',
    description: 'Transfer melalui ATM, Mobile Banking, atau Internet Banking BNI'
  },
  {
    type: 'bank_transfer',
    name: 'BRI Virtual Account',
    code: 'bri',
    icon: '/images/banks/bri.png',
    description: 'Transfer melalui ATM, Mobile Banking, atau Internet Banking BRI'
  },
  {
    type: 'bank_transfer',
    name: 'Mandiri Bill Payment',
    code: 'echannel',
    icon: '/images/banks/mandiri.png',
    description: 'Bayar melalui ATM Mandiri, Livin, atau Internet Banking'
  },
  {
    type: 'bank_transfer',
    name: 'Permata Virtual Account',
    code: 'permata',
    icon: '/images/banks/permata.png',
    description: 'Transfer melalui ATM atau Mobile Banking Permata'
  },
  {
    type: 'e_wallet',
    name: 'GoPay',
    code: 'gopay',
    icon: '/images/ewallet/gopay.png',
    description: 'Bayar dengan saldo GoPay'
  },
  {
    type: 'e_wallet',
    name: 'OVO',
    code: 'ovo',
    icon: '/images/ewallet/ovo.png',
    description: 'Bayar dengan saldo OVO'
  },
  {
    type: 'e_wallet',
    name: 'DANA',
    code: 'dana',
    icon: '/images/ewallet/dana.png',
    description: 'Bayar dengan saldo DANA'
  },
  {
    type: 'e_wallet',
    name: 'LinkAja',
    code: 'linkaja',
    icon: '/images/ewallet/linkaja.png',
    description: 'Bayar dengan saldo LinkAja'
  },
  {
    type: 'e_wallet',
    name: 'ShopeePay',
    code: 'shopeepay',
    icon: '/images/ewallet/shopeepay.png',
    description: 'Bayar dengan saldo ShopeePay'
  },
  {
    type: 'qris',
    name: 'QRIS',
    code: 'qris',
    icon: '/images/qris.png',
    description: 'Scan QR Code untuk pembayaran instan'
  }
]

class PaymentGateway {
  private serverKey: string
  private clientKey: string
  private baseUrl: string
  private apiBaseUrl: string

  constructor() {
    this.serverKey = MIDTRANS_SERVER_KEY
    this.clientKey = MIDTRANS_CLIENT_KEY
    this.baseUrl = MIDTRANS_BASE_URL
    this.apiBaseUrl = MIDTRANS_API_BASE_URL

    if (!this.serverKey || !this.clientKey) {
      throw new Error('Midtrans credentials are not configured')
    }
  }

  /**
   * Generate order ID with timestamp
   */
  generateOrderId(prefix: string = 'PAY'): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `${prefix}-${timestamp}-${random}`
  }

  /**
   * Create authorization header for Midtrans API
   */
  private getAuthHeader(): string {
    return 'Basic ' + Buffer.from(this.serverKey + ':').toString('base64')
  }

  /**
   * Create Snap payment token
   */
  async createPayment(paymentData: PaymentRequest): Promise<MidtransResponse> {
    try {
      const payload: any = {
        transaction_details: {
          order_id: paymentData.orderId,
          gross_amount: paymentData.amount
        },
        customer_details: {
          first_name: paymentData.customerDetails.firstName,
          last_name: paymentData.customerDetails.lastName || '',
          email: paymentData.customerDetails.email,
          phone: paymentData.customerDetails.phone
        },
        item_details: paymentData.itemDetails,
        enabled_payments: this.getEnabledPayments(),
        callbacks: {
          finish: `${process.env.NEXT_PUBLIC_BASE_URL}/ppdb/payment/${paymentData.orderId}/finish`,
          unfinish: `${process.env.NEXT_PUBLIC_BASE_URL}/ppdb/payment/${paymentData.orderId}`,
          error: `${process.env.NEXT_PUBLIC_BASE_URL}/ppdb/payment/${paymentData.orderId}/error`,
          pending: `${process.env.NEXT_PUBLIC_BASE_URL}/ppdb/payment/${paymentData.orderId}/pending`
        },
        expiry: {
          start_time: new Date().toISOString().replace(/\.\d{3}Z$/, '+07:00'),
          unit: 'hours',
          duration: 24
        }
      }

      // Add specific payment method configuration if specified
      if (paymentData.paymentType) {
        if (paymentData.bankTransfer) {
          payload['bank_transfer'] = paymentData.bankTransfer
        }
        if (paymentData.ewallet) {
          payload['ewallet'] = paymentData.ewallet
        }
      }

      const response = await fetch(`${this.baseUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Midtrans API error: ${errorData.error_messages?.[0] || 'Unknown error'}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error creating payment:', error)
      throw error
    }
  }

  /**
   * Create Virtual Account payment
   */
  async createVirtualAccount(paymentData: PaymentRequest, bank: string): Promise<MidtransResponse> {
    try {
      const payload = {
        payment_type: 'bank_transfer',
        transaction_details: {
          order_id: paymentData.orderId,
          gross_amount: paymentData.amount
        },
        customer_details: {
          first_name: paymentData.customerDetails.firstName,
          last_name: paymentData.customerDetails.lastName || '',
          email: paymentData.customerDetails.email,
          phone: paymentData.customerDetails.phone
        },
        item_details: paymentData.itemDetails,
        bank_transfer: {
          bank: bank
        }
      }

      const response = await fetch(`${this.apiBaseUrl}/charge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Midtrans API error: ${errorData.error_messages?.[0] || 'Unknown error'}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating virtual account:', error)
      throw error
    }
  }

  /**
   * Create E-Wallet payment
   */
  async createEwalletPayment(paymentData: PaymentRequest, ewalletType: string): Promise<MidtransResponse> {
    try {
      const payload: any = {
        payment_type: ewalletType,
        transaction_details: {
          order_id: paymentData.orderId,
          gross_amount: paymentData.amount
        },
        customer_details: {
          first_name: paymentData.customerDetails.firstName,
          last_name: paymentData.customerDetails.lastName || '',
          email: paymentData.customerDetails.email,
          phone: paymentData.customerDetails.phone
        },
        item_details: paymentData.itemDetails
      }

      // Add specific ewallet configuration
      if (ewalletType === 'gopay') {
        payload['gopay'] = {
          enable_callback: true,
          callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/callback`
        }
      }

      const response = await fetch(`${this.apiBaseUrl}/charge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Midtrans API error: ${errorData.error_messages?.[0] || 'Unknown error'}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating ewallet payment:', error)
      throw error
    }
  }

  /**
   * Create QRIS payment
   */
  async createQrisPayment(paymentData: PaymentRequest): Promise<MidtransResponse> {
    try {
      const payload = {
        payment_type: 'qris',
        transaction_details: {
          order_id: paymentData.orderId,
          gross_amount: paymentData.amount
        },
        customer_details: {
          first_name: paymentData.customerDetails.firstName,
          last_name: paymentData.customerDetails.lastName || '',
          email: paymentData.customerDetails.email,
          phone: paymentData.customerDetails.phone
        },
        item_details: paymentData.itemDetails,
        qris: {
          acquirer: 'gopay'
        }
      }

      const response = await fetch(`${this.apiBaseUrl}/charge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Midtrans API error: ${errorData.error_messages?.[0] || 'Unknown error'}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating QRIS payment:', error)
      throw error
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(orderId: string): Promise<PaymentNotification> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/${orderId}/status`, {
        method: 'GET',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Midtrans API error: ${errorData.error_messages?.[0] || 'Transaction not found'}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error checking payment status:', error)
      throw error
    }
  }

  /**
   * Cancel payment
   */
  async cancelPayment(orderId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': this.getAuthHeader(),
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Midtrans API error: ${errorData.error_messages?.[0] || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error canceling payment:', error)
      throw error
    }
  }

  /**
   * Verify webhook notification signature
   */
  verifySignature(orderId: string, statusCode: string, grossAmount: string, serverKey: string): string {
    const signatureString = `${orderId}${statusCode}${grossAmount}${serverKey}`
    return crypto.createHash('sha512').update(signatureString).digest('hex')
  }

  /**
   * Validate webhook notification
   */
  validateNotification(notification: PaymentNotification): boolean {
    try {
      const expectedSignature = this.verifySignature(
        notification.order_id,
        notification.status_code,
        notification.gross_amount,
        this.serverKey
      )

      return expectedSignature === notification.signature_key
    } catch (error) {
      console.error('Error validating notification:', error)
      return false
    }
  }

  /**
   * Process payment notification from Midtrans
   */
  async processNotification(notification: PaymentNotification): Promise<void> {
    try {
      // Validate signature
      if (!this.validateNotification(notification)) {
        throw new Error('Invalid notification signature')
      }

      // Update payment status in database
      const payment = await prisma.payments.findFirst({
        where: { externalId: notification.order_id },
        // TODO: payments model doesn't have registration or student relations defined
        // These are just ID fields (registrationId, studentId) without relations
      })

      if (!payment) {
        throw new Error(`Payment not found for order ID: ${notification.order_id}`)
      }

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

      // Update payment
      await prisma.payments.update({
        where: { id: payment.id },
        data: {
          status,
          paidAt,
          updatedAt: new Date()
        }
      })

      // Update registration payment status if applicable
      if (payment.registrationId && status === 'SUCCESS') {
        await prisma.registrations.update({
          where: { id: payment.registrationId },
          data: {
            paymentStatus: 'PAID',
            paymentDate: paidAt,
            updatedAt: new Date()
          }
        })
      }

      console.log(`Payment ${payment.id} updated to status: ${status}`)
    } catch (error) {
      console.error('Error processing notification:', error)
      throw error
    }
  }

  /**
   * Get enabled payment methods for Snap
   */
  private getEnabledPayments(): string[] {
    return [
      'credit_card',
      'bca_va',
      'bni_va',
      'bri_va',
      'echannel',
      'permata_va',
      'other_va',
      'gopay',
      'shopeepay',
      'qris'
    ]
  }

  /**
   * Format payment amount to IDR
   */
  static formatAmount(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  /**
   * Get payment method by code
   */
  static getPaymentMethod(code: string): PaymentMethod | undefined {
    return PAYMENT_METHODS.find(method => method.code === code)
  }

  /**
   * Get payment methods by type
   */
  static getPaymentMethodsByType(type: string): PaymentMethod[] {
    return PAYMENT_METHODS.filter(method => method.type === type)
  }
}

export default PaymentGateway
export { PaymentGateway }