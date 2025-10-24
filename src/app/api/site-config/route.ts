import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const SITE_CONFIG_KEYS = [
  'logo',
  'logoWhite',
  'favicon',
  'siteName',
  'siteDescription',
  'contactEmail',
  'contactPhone',
  'contactWhatsapp',
  'address',
  'facebook',
  'instagram',
  'youtube',
  'twitter',
  'linkedIn',
  'navbarItems',
  'footerAbout',
  'footerLinks',
]

export async function GET() {
  try {
    const settings = await prisma.settings.findMany({
      where: {
        key: {
          in: SITE_CONFIG_KEYS,
        },
      },
    })

    const config: any = {}
    settings.forEach((setting) => {
      try {
        // Try to parse as JSON for arrays/objects
        config[setting.key] = JSON.parse(setting.value)
      } catch {
        // If not JSON, use as string
        config[setting.key] = setting.value
      }
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching site config:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil konfigurasi situs' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Update or create each setting
    for (const key of SITE_CONFIG_KEYS) {
      if (body[key] !== undefined) {
        const value =
          typeof body[key] === 'object' ? JSON.stringify(body[key]) : String(body[key])

        await prisma.settings.upsert({
          where: { key },
          update: { value },
          create: {
            id: `site-config-${key}`,
            key,
            value,
          },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving site config:', error)
    return NextResponse.json(
      { error: 'Gagal menyimpan konfigurasi situs' },
      { status: 500 }
    )
  }
}
