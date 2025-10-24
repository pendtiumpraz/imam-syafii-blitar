import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      calculationType,
      inputs,
      zakatAmount,
      nisabAmount,
      donorName,
      donorEmail,
      donorPhone
    } = body

    // Validate required fields
    if (!calculationType || !inputs || zakatAmount === undefined) {
      return NextResponse.json(
        { error: 'Data perhitungan tidak lengkap' },
        { status: 400 }
      )
    }

    // Save calculation
    const calculation = await prisma.zakat_calculations.create({
      data: {
        calculationType,
        inputs: JSON.stringify(inputs),
        zakatAmount: parseFloat(zakatAmount.toString()),
        nisabAmount: nisabAmount ? parseFloat(nisabAmount.toString()) : null,
        donorName: donorName || null,
        donorEmail: donorEmail || null,
        donorPhone: donorPhone || null
      }
    })

    return NextResponse.json({
      id: calculation.id,
      calculationType: calculation.calculationType,
      zakatAmount: parseFloat(calculation.zakatAmount.toString()),
      nisabAmount: calculation.nisabAmount ? parseFloat(calculation.nisabAmount.toString()) : null,
      createdAt: calculation.createdAt
    }, { status: 201 })
  } catch (error) {
    console.error('Error saving zakat calculation:', error)
    return NextResponse.json(
      { error: 'Gagal menyimpan perhitungan zakat' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const email = searchParams.get('email')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    
    if (type) {
      where.calculationType = type
    }
    
    if (email) {
      where.donorEmail = email
    }

    const calculations = await prisma.zakat_calculations.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    // Parse JSON inputs and format amounts
    const formattedCalculations = calculations.map(calc => ({
      ...calc,
      inputs: JSON.parse(calc.inputs),
      zakatAmount: parseFloat(calc.zakatAmount.toString()),
      nisabAmount: calc.nisabAmount ? parseFloat(calc.nisabAmount.toString()) : null
    }))

    return NextResponse.json({ calculations: formattedCalculations })
  } catch (error) {
    console.error('Error fetching zakat calculations:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data perhitungan zakat' },
      { status: 500 }
    )
  }
}