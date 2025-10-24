import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const SEO_KEYS = [
  'siteTitle',
  'siteDescription',
  'siteKeywords',
  'author',
  'twitterHandle',
  'fbAppId',
  'ogDefaultImage',
  'googleSiteVerification',
  'googleAnalyticsId',
  'facebookPixelId',
  'robots',
  'canonicalUrl',
]

export async function GET() {
  try {
    const settings = await prisma.settings.findMany({
      where: {
        key: {
          in: SEO_KEYS,
        },
      },
    })

    const config: any = {}
    settings.forEach((setting) => {
      try {
        config[setting.key] = JSON.parse(setting.value)
      } catch {
        config[setting.key] = setting.value
      }
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching SEO config:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil konfigurasi SEO' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    for (const key of SEO_KEYS) {
      if (body[key] !== undefined) {
        const value =
          typeof body[key] === 'object' ? JSON.stringify(body[key]) : String(body[key])

        await prisma.settings.upsert({
          where: { key },
          update: { value },
          create: {
            id: `seo-${key}`,
            key,
            value,
          },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving SEO config:', error)
    return NextResponse.json(
      { error: 'Gagal menyimpan konfigurasi SEO' },
      { status: 500 }
    )
  }
}
