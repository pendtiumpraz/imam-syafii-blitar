import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const ORG_KEYS = [
  'yayasanName',
  'yayasanDescription',
  'yayasanFoundedYear',
  'yayasanLegalNo',
  'tkInfo',
  'sdInfo',
  'pondokInfo',
  'vision',
  'missions',
  'structure',
  'history',
]

export async function GET() {
  try {
    const settings = await prisma.settings.findMany({
      where: {
        key: {
          in: ORG_KEYS,
        },
      },
    })

    const data: any = {}
    settings.forEach((setting) => {
      try {
        data[setting.key] = JSON.parse(setting.value)
      } catch {
        data[setting.key] = setting.value
      }
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching organization data:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data organisasi' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    for (const key of ORG_KEYS) {
      if (body[key] !== undefined) {
        const value =
          typeof body[key] === 'object' ? JSON.stringify(body[key]) : String(body[key])

        await prisma.settings.upsert({
          where: { key },
          update: { value },
          create: {
            id: `org-${key}`,
            key,
            value,
          },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving organization data:', error)
    return NextResponse.json(
      { error: 'Gagal menyimpan data organisasi' },
      { status: 500 }
    )
  }
}
