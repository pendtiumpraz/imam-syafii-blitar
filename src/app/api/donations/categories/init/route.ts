import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    const INIT_SECRET = process.env.INIT_SECRET || 'init-secret-2024'

    if (secret !== INIT_SECRET) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 403 }
      )
    }

    // Check if categories already exist
    const existingCount = await prisma.donationCategory.count()

    if (existingCount > 0) {
      return NextResponse.json({
        message: 'Kategori donasi sudah ada',
        count: existingCount
      })
    }

    // Default donation categories
    const defaultCategories = [
      {
        id: 'cat_' + Date.now() + '_1',
        name: 'Pembangunan & Renovasi',
        description: 'Donasi untuk pembangunan dan renovasi fasilitas pesantren',
        icon: 'Building',
        color: 'blue',
        sortOrder: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'cat_' + Date.now() + '_2',
        name: 'Pendidikan',
        description: 'Donasi untuk biaya pendidikan santri',
        icon: 'GraduationCap',
        color: 'green',
        sortOrder: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'cat_' + Date.now() + '_3',
        name: 'Beasiswa',
        description: 'Donasi untuk beasiswa santri tidak mampu',
        icon: 'Award',
        color: 'purple',
        sortOrder: 3,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'cat_' + Date.now() + '_4',
        name: 'Kesehatan',
        description: 'Donasi untuk kesehatan santri dan fasilitas medis',
        icon: 'Heart',
        color: 'red',
        sortOrder: 4,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'cat_' + Date.now() + '_5',
        name: 'Operasional',
        description: 'Donasi untuk operasional sehari-hari pesantren',
        icon: 'Settings',
        color: 'gray',
        sortOrder: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'cat_' + Date.now() + '_6',
        name: 'Kegiatan Keagamaan',
        description: 'Donasi untuk kegiatan keagamaan dan dakwah',
        icon: 'Mosque',
        color: 'emerald',
        sortOrder: 6,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'cat_' + Date.now() + '_7',
        name: 'Zakat',
        description: 'Penyaluran zakat untuk mustahik',
        icon: 'Coins',
        color: 'amber',
        sortOrder: 7,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'cat_' + Date.now() + '_8',
        name: 'Qurban',
        description: 'Donasi untuk pelaksanaan qurban',
        icon: 'Beef',
        color: 'orange',
        sortOrder: 8,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'cat_' + Date.now() + '_9',
        name: 'Darurat',
        description: 'Donasi untuk keadaan darurat dan bencana',
        icon: 'AlertCircle',
        color: 'red',
        sortOrder: 9,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'cat_' + Date.now() + '_10',
        name: 'Umum',
        description: 'Donasi umum untuk kebutuhan pesantren',
        icon: 'Gift',
        color: 'indigo',
        sortOrder: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // Create all categories
    await prisma.donationCategory.createMany({
      data: defaultCategories
    })

    const categories = await prisma.donationCategory.findMany({
      orderBy: { sortOrder: 'asc' }
    })

    return NextResponse.json({
      success: true,
      message: 'Kategori donasi berhasil dibuat',
      count: categories.length,
      categories: categories.map(c => ({
        name: c.name,
        icon: c.icon,
        color: c.color
      }))
    })
  } catch (error) {
    console.error('Init donation categories error:', error)
    return NextResponse.json(
      {
        error: 'Gagal membuat kategori donasi',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
