import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all organization structure data
    const organizations = await prisma.organization_structure.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { level: 'asc' },
        { sortOrder: 'asc' },
      ],
    })

    // Group by department and level
    const grouped = {
      dewanSyuro: organizations
        .filter((o) => o.department === 'Dewan Syuro')
        .map((o) => o.personName || ''),
      dewanPembina: organizations
        .filter((o) => o.department === 'Dewan Pembina')
        .map((o) => o.personName || ''),
      dewanPengawas: organizations
        .filter((o) => o.department === 'Dewan Pengawas')
        .map((o) => o.personName || ''),
      pengurusInti: {
        ketua:
          organizations.find((o) => o.positionName === 'Ketua Yayasan')?.personName || '',
        sekretaris:
          organizations.find((o) => o.positionName === 'Sekretaris')?.personName || '',
        bendahara:
          organizations.find((o) => o.positionName === 'Bendahara')?.personName || '',
        adminKeuangan:
          organizations.find((o) => o.positionName === 'Admin Keuangan')?.personName || '',
      },
      divisi: [] as any[],
    }

    // Group divisions with their units
    const divisions = [
      'BMT & Unit Usaha',
      'Divisi Dakwah',
      'Divisi Pendidikan',
      'Divisi Lain-lain',
    ]

    for (const divName of divisions) {
      const head = organizations.find(
        (o) => o.department === divName && o.level === 2
      )
      const units = organizations.filter(
        (o) => o.department === divName && o.level === 3
      )

      if (head) {
        grouped.divisi.push({
          name: divName,
          head: head.personName,
          units: units.map((u) => ({
            name: u.positionName?.replace('PIC ', '') || '',
            pic: u.personName,
          })),
        })
      }
    }

    return NextResponse.json(grouped)
  } catch (error) {
    console.error('Error fetching organization structure:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organization structure' },
      { status: 500 }
    )
  }
}
