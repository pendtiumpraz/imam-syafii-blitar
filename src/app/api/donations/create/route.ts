import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      campaignId,
      categoryId,
      amount,
      message,
      donorName,
      donorEmail,
      donorPhone,
      isAnonymous,
      paymentMethod,
      paymentChannel,
      source = 'WEB',
      ipAddress,
      userAgent,
      referrer
    } = body

    // Validate required fields
    if (!categoryId || !amount || amount < 1000) {
      return NextResponse.json(
        { error: 'Data tidak lengkap atau jumlah donasi minimal Rp 1.000' },
        { status: 400 }
      )
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Metode pembayaran harus dipilih' },
        { status: 400 }
      )
    }

    if (!isAnonymous && (!donorName || !donorEmail)) {
      return NextResponse.json(
        { error: 'Nama dan email donatur harus diisi jika tidak anonim' },
        { status: 400 }
      )
    }

    // Validate campaign exists if provided
    if (campaignId) {
      const campaign = await prisma.donations_campaigns.findUnique({
        where: { id: campaignId },
        select: { id: true, status: true, endDate: true }
      })

      if (!campaign) {
        return NextResponse.json(
          { error: 'Campaign tidak ditemukan' },
          { status: 404 }
        )
      }

      if (campaign.status !== 'ACTIVE') {
        return NextResponse.json(
          { error: 'Campaign tidak aktif' },
          { status: 400 }
        )
      }

      // Check if campaign has ended
      if (campaign.endDate && new Date() > campaign.endDate) {
        return NextResponse.json(
          { error: 'Campaign sudah berakhir' },
          { status: 400 }
        )
      }
    }

    // Validate category exists
    const category = await prisma.donations_categories.findUnique({
      where: { id: categoryId },
      select: { id: true, isActive: true }
    })

    if (!category || !category.isActive) {
      return NextResponse.json(
        { error: 'Kategori tidak valid' },
        { status: 400 }
      )
    }

    // Generate donation number
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    
    // Get next sequence number for this month
    const lastDonation = await prisma.donations.findFirst({
      where: {
        donationNo: {
          startsWith: `DON-${year}${month}`
        }
      },
      orderBy: { donationNo: 'desc' }
    })

    let sequence = 1
    if (lastDonation) {
      const lastSequence = parseInt(lastDonation.donationNo.split('-')[2] || '0')
      sequence = lastSequence + 1
    }

    const donationNo = `DON-${year}${month}-${String(sequence).padStart(4, '0')}`

    // Create donation record
    const donation = await prisma.donations.create({
      data: {
        donationNo,
        campaignId: campaignId || null,
        categoryId,
        amount: parseFloat(amount.toString()),
        message: message || null,
        donorName: isAnonymous ? null : donorName,
        donorEmail: isAnonymous ? null : donorEmail,
        donorPhone: isAnonymous ? null : donorPhone,
        isAnonymous,
        paymentMethod,
        paymentChannel: paymentChannel || null,
        paymentStatus: 'PENDING',
        source,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        referrer: referrer || null
      },
      include: {
        campaign: true,
        category: true
      }
    })

    // Create payment gateway transaction based on method
    let paymentData: any = {
      donationId: donation.id,
      donationNo: donation.donationNo,
      amount: donation.amount
    }

    try {
      switch (paymentMethod) {
        case 'VA':
          // Generate Virtual Account
          paymentData = await createVirtualAccount(donation)
          break
        case 'EWALLET':
          // Create E-Wallet payment
          paymentData = await createEWalletPayment(donation, paymentChannel)
          break
        case 'QRIS':
          // Generate QRIS code
          paymentData = await createQRISPayment(donation)
          break
        case 'TRANSFER':
          // Manual bank transfer - provide bank account info
          paymentData = await getBankAccountInfo()
          break
        default:
          break
      }

      // Update donation with payment gateway data
      if (paymentData.externalId || paymentData.vaNumber || paymentData.qrisCode || paymentData.paymentUrl) {
        await prisma.donations.update({
          where: { id: donation.id },
          data: {
            externalId: paymentData.externalId || null,
            vaNumber: paymentData.vaNumber || null,
            qrisCode: paymentData.qrisCode || null,
            paymentUrl: paymentData.paymentUrl || null,
            expiredAt: paymentData.expiredAt ? new Date(paymentData.expiredAt) : null
          }
        })
      }
    } catch (paymentError) {
      console.error('Error creating payment:', paymentError)
      // Don't fail the whole process, just log the error
    }

    // Update donor profile if not anonymous
    if (!isAnonymous && donorEmail) {
      await upsertDonorProfile(donorEmail, donorName, donorPhone, amount)
    }

    return NextResponse.json({
      donationId: donation.id,
      donationNo: donation.donationNo,
      amount: parseFloat(donation.amount.toString()),
      paymentMethod: donation.paymentMethod,
      paymentStatus: donation.paymentStatus,
      ...paymentData
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating donation:', error)
    return NextResponse.json(
      { error: 'Gagal membuat donasi' },
      { status: 500 }
    )
  }
}

// Helper functions for payment gateway integration
async function createVirtualAccount(donation: any) {
  // This is a mock implementation
  // In real implementation, integrate with payment gateway like Midtrans, Xendit, etc.
  
  const banks = ['BCA', 'BNI', 'BRI', 'MANDIRI']
  const selectedBank = banks[Math.floor(Math.random() * banks.length)]
  const vaNumber = `${selectedBank}${String(Date.now()).slice(-10)}`
  
  return {
    externalId: `VA_${donation.donationNo}`,
    vaNumber,
    paymentChannel: selectedBank,
    expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    instructions: `Transfer ke VA ${selectedBank}: ${vaNumber}`
  }
}

async function createEWalletPayment(donation: any, channel: string) {
  // Mock implementation for e-wallet
  const paymentUrl = `https://payment-gateway.example.com/ewallet/${donation.donationNo}`
  
  return {
    externalId: `EW_${donation.donationNo}`,
    paymentUrl,
    paymentChannel: channel,
    expiredAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    instructions: `Klik link untuk membayar dengan ${channel}`
  }
}

async function createQRISPayment(donation: any) {
  // Mock implementation for QRIS
  const qrisCode = `QRIS_${donation.donationNo}_${Date.now()}`
  
  return {
    externalId: `QR_${donation.donationNo}`,
    qrisCode,
    expiredAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    instructions: 'Scan QR code dengan aplikasi bank atau e-wallet'
  }
}

async function getBankAccountInfo() {
  // Return bank account information for manual transfer
  return {
    bankAccounts: [
      {
        bank: 'BCA',
        accountNumber: '1234567890',
        accountName: 'Pondok Imam Syafii'
      },
      {
        bank: 'BNI',
        accountNumber: '0987654321',
        accountName: 'Pondok Imam Syafii'
      }
    ],
    instructions: 'Transfer ke salah satu rekening di atas dan upload bukti transfer'
  }
}

async function upsertDonorProfile(email: string, name: string, phone?: string, amount?: number) {
  try {
    await prisma.donor_profiles.upsert({
      where: { email },
      update: {
        name,
        phone: phone || null,
        totalDonated: {
          increment: amount || 0
        },
        donationCount: {
          increment: 1
        },
        lastDonationAt: new Date()
      },
      create: {
        email,
        name,
        phone: phone || null,
        totalDonated: amount || 0,
        donationCount: 1,
        lastDonationAt: new Date()
      }
    })
  } catch (error) {
    console.error('Error upserting donor profile:', error)
    // Don't throw error, just log it
  }
}