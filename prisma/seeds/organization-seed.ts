import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedOrganization() {
  console.log('🌱 Seeding organization structure...')

  // Clear existing data
  await prisma.organization_structure.deleteMany()

  // Level hierarchy:
  // 0 = Dewan (Syuro, Pembina, Pengawas)
  // 1 = Pengurus Inti
  // 2 = Kepala Divisi
  // 3 = Unit/Sub-divisi

  // 1. DEWAN SYURO
  const dewanSyuro = [
    { name: 'Bpk. Syamsul', order: 1 },
    { name: 'Bpk. Syaiful', order: 2 },
    { name: 'Bpk. Bowo', order: 3 },
    { name: 'Ust. Fuad', order: 4 },
  ]

  for (const member of dewanSyuro) {
    await prisma.organization_structure.create({
      data: {
        positionName: 'Anggota Dewan Syuro',
        personName: member.name,
        department: 'Dewan Syuro',
        level: 0,
        sortOrder: member.order,
        isActive: true,
      },
    })
  }

  // 2. DEWAN PEMBINA
  const dewanPembina = [
    { name: 'Bpk. Hadi', order: 1 },
    { name: 'Bpk. Syamsul', order: 2 },
    { name: 'Ust. Anwar Zen', order: 3 },
    { name: 'Ust. Fuad', order: 4 },
  ]

  for (const member of dewanPembina) {
    await prisma.organization_structure.create({
      data: {
        positionName: 'Anggota Dewan Pembina',
        personName: member.name,
        department: 'Dewan Pembina',
        level: 0,
        sortOrder: member.order,
        isActive: true,
      },
    })
  }

  // 3. DEWAN PENGAWAS
  const dewanPengawas = [
    { name: 'Bu Umi', order: 1 },
    { name: 'Bpk. Fadhli', order: 2 },
  ]

  for (const member of dewanPengawas) {
    await prisma.organization_structure.create({
      data: {
        positionName: 'Anggota Dewan Pengawas',
        personName: member.name,
        department: 'Dewan Pengawas',
        level: 0,
        sortOrder: member.order,
        isActive: true,
      },
    })
  }

  // 4. PENGURUS INTI
  const ketuaYayasan = await prisma.organization_structure.create({
    data: {
      positionName: 'Ketua Yayasan',
      personName: 'Ust. Abu Haitsami Iqbal',
      department: 'Pengurus Inti',
      level: 1,
      sortOrder: 1,
      isActive: true,
    },
  })

  await prisma.organization_structure.create({
    data: {
      positionName: 'Sekretaris',
      personName: 'Bpk. Bowo',
      department: 'Pengurus Inti',
      level: 1,
      sortOrder: 2,
      isActive: true,
    },
  })

  await prisma.organization_structure.create({
    data: {
      positionName: 'Bendahara',
      personName: 'Bpk. Syaiful',
      department: 'Pengurus Inti',
      level: 1,
      sortOrder: 3,
      isActive: true,
    },
  })

  await prisma.organization_structure.create({
    data: {
      positionName: 'Admin Keuangan',
      personName: 'Ummu Rafa',
      department: 'Pengurus Inti',
      level: 1,
      sortOrder: 4,
      isActive: true,
    },
  })

  // 5. DIVISI BMT & UNIT USAHA
  const bmtDivisi = await prisma.organization_structure.create({
    data: {
      positionName: 'Kepala Divisi',
      personName: 'Bpk. Bowo',
      department: 'BMT & Unit Usaha',
      level: 2,
      sortOrder: 1,
      isActive: true,
    },
  })

  const bmtUnits = [
    { name: 'Gunung Gamping', pic: 'Bpk. Syaiful', order: 1 },
    { name: 'Koperasi', pic: 'Ummu Rafa', order: 2 },
    { name: 'Barang Bekas & Rosok', pic: 'Bpk. Warno', order: 3 },
    { name: 'Donasi', pic: 'Bpk. Hamzah', order: 4 },
    { name: 'Sarpras & Logistik', pic: 'Bpk. Irfan', order: 5 },
  ]

  for (const unit of bmtUnits) {
    await prisma.organization_structure.create({
      data: {
        positionName: `PIC ${unit.name}`,
        personName: unit.pic,
        department: 'BMT & Unit Usaha',
        parentId: bmtDivisi.id,
        level: 3,
        sortOrder: unit.order,
        isActive: true,
      },
    })
  }

  // 6. DIVISI DAKWAH
  const dakwahDivisi = await prisma.organization_structure.create({
    data: {
      positionName: 'Kepala Divisi',
      personName: 'Ust. Abu Haitsami',
      department: 'Divisi Dakwah',
      level: 2,
      sortOrder: 2,
      isActive: true,
    },
  })

  const dakwahUnits = [
    { name: 'Masjid', pic: 'Bpk. Budi', order: 1 },
    { name: 'Kajian Rutin', pic: 'Akh Sofwan', order: 2 },
    { name: 'Medsos', pic: 'Ust. Ahmad', order: 3 },
    { name: 'MTU', pic: 'Ummu Dzakiyah', order: 4 },
  ]

  for (const unit of dakwahUnits) {
    await prisma.organization_structure.create({
      data: {
        positionName: `PIC ${unit.name}`,
        personName: unit.pic,
        department: 'Divisi Dakwah',
        parentId: dakwahDivisi.id,
        level: 3,
        sortOrder: unit.order,
        isActive: true,
      },
    })
  }

  // 7. DIVISI PENDIDIKAN
  const pendidikanDivisi = await prisma.organization_structure.create({
    data: {
      positionName: 'Kepala Divisi',
      personName: 'Bpk. Syamsul',
      department: 'Divisi Pendidikan',
      level: 2,
      sortOrder: 3,
      isActive: true,
    },
  })

  const pendidikanUnits = [
    { name: 'RA & TK', pic: 'Ummu Dzakiyah', order: 1 },
    { name: 'MTQ', pic: 'Ust. Syamsul', order: 2 },
    { name: 'MSW Ikhwan', pic: 'Ust. Imam', order: 3 },
    { name: 'MSW Akhwat', pic: 'Ummu Dzakiyah', order: 4 },
  ]

  for (const unit of pendidikanUnits) {
    await prisma.organization_structure.create({
      data: {
        positionName: `PIC ${unit.name}`,
        personName: unit.pic,
        department: 'Divisi Pendidikan',
        parentId: pendidikanDivisi.id,
        level: 3,
        sortOrder: unit.order,
        isActive: true,
      },
    })
  }

  // 8. DIVISI LAIN-LAIN
  const lainDivisi = await prisma.organization_structure.create({
    data: {
      positionName: 'Kepala Divisi',
      personName: 'Ust. Fuad',
      department: 'Divisi Lain-lain',
      level: 2,
      sortOrder: 4,
      isActive: true,
    },
  })

  const lainUnits = [
    { name: 'Humas', pic: 'Ust. Fuad', order: 1 },
    { name: 'Komunikasi', pic: 'Ust. Fuad', order: 2 },
    { name: 'Baksos', pic: 'Bpk. Syamsul', order: 3 },
  ]

  for (const unit of lainUnits) {
    await prisma.organization_structure.create({
      data: {
        positionName: `PIC ${unit.name}`,
        personName: unit.pic,
        department: 'Divisi Lain-lain',
        parentId: lainDivisi.id,
        level: 3,
        sortOrder: unit.order,
        isActive: true,
      },
    })
  }

  // Count total records
  const count = await prisma.organization_structure.count()
  console.log(`✅ Created ${count} organization structure records`)

  // Display summary
  const summary = await prisma.organization_structure.groupBy({
    by: ['department'],
    _count: true,
  })

  console.log('\n📊 Organization Structure Summary:')
  summary.forEach((dept) => {
    console.log(`   ${dept.department}: ${dept._count} positions`)
  })
}

async function main() {
  try {
    await seedOrganization()
    console.log('\n✅ Organization seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error seeding organization:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
