import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    // Increment share count
    const updatedCampaign = await prisma.donation_campaigns.update({
      where: { slug },
      data: {
        shareCount: {
          increment: 1
        }
      }
    })

    return NextResponse.json({
      message: 'Share count updated',
      shareCount: updatedCampaign.shareCount
    })
  } catch (error) {
    console.error('Error updating share count:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui jumlah share' },
      { status: 500 }
    )
  }
}