import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    // Find donation
    const donation = await prisma.donations.findUnique({
      where: { id },
      include: {
        campaign: true,
        category: true
      }
    })

    if (!donation) {
      return NextResponse.json(
        { error: 'Donasi tidak ditemukan' },
        { status: 404 }
      )
    }

    if (donation.paymentStatus === 'VERIFIED') {
      return NextResponse.json(
        { error: 'Donasi sudah terverifikasi' },
        { status: 400 }
      )
    }

    // Start transaction to update donation and campaign amount
    const result = await prisma.$transaction(async (tx) => {
      // Update donation status
      const updatedDonation = await tx.donation.update({
        where: { id },
        data: {
          paymentStatus: 'VERIFIED',
          verifiedBy: session.user.id,
          verifiedAt: new Date(),
          paidAt: new Date()
        }
      })

      // Update campaign current amount if it's a campaign donation
      if (donation.campaignId) {
        await tx.donationCampaign.update({
          where: { id: donation.campaignId },
          data: {
            currentAmount: {
              increment: donation.amount
            }
          }
        })
      }

      // Generate certificate number
      const certificateNo = `CERT-${donation.donationNo}-${Date.now()}`
      
      // Update donation with certificate number
      await tx.donation.update({
        where: { id },
        data: {
          certificateNo
        }
      })

      return updatedDonation
    })

    // TODO: Generate certificate PDF and send email notification
    // This would be implemented with a PDF generator and email service

    return NextResponse.json({
      message: 'Donasi berhasil diverifikasi',
      donation: {
        ...result,
        amount: parseFloat(result.amount.toString())
      }
    })
  } catch (error) {
    console.error('Error verifying donation:', error)
    return NextResponse.json(
      { error: 'Gagal memverifikasi donasi' },
      { status: 500 }
    )
  }
}