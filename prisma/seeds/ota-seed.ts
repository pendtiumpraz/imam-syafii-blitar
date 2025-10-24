import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedOTAData(): Promise<void> {
  console.log('🌱 Seeding OTA data...')

  try {
    // First, let's create some orphan students if they don't exist
    const existingOrphans = await prisma.students.count({
      where: { isOrphan: true }
    })

    if (existingOrphans === 0) {
      console.log('Creating orphan students...')
      
      // Create some sample orphan students
      const orphanStudents = [
        {
          nisn: '1234567890',
          nis: 'TK001',
          fullName: 'Ahmad Yatim Mandiri',
          nickname: 'Ahmad',
          birthPlace: 'Jakarta',
          birthDate: new Date('2018-05-15'),
          gender: 'MALE',
          address: 'Jl. Merdeka No. 123',
          city: 'Jakarta Timur',
          fatherName: 'Almarhum Budi',
          motherName: 'Siti Aminah',
          institutionType: 'TK',
          grade: 'RA-A',
          enrollmentDate: new Date('2023-07-01'),
          enrollmentYear: '2023/2024',
          isOrphan: true,
          monthlyNeeds: 300000,
          otaProfile: 'Ahmad adalah siswa TK yang pintar dan rajin. Ayahnya telah meninggal dunia dan ibunya bekerja sebagai buruh cuci. Ahmad memiliki mimpi menjadi dokter.'
        },
        {
          nisn: '2345678901',
          nis: 'SD001',
          fullName: 'Fatimah Sholehah',
          nickname: 'Fatimah',
          birthPlace: 'Bandung',
          birthDate: new Date('2014-08-20'),
          gender: 'FEMALE',
          address: 'Jl. Kebon Jeruk No. 456',
          city: 'Bandung',
          fatherName: 'Almarhum Ahmad',
          motherName: 'Khadijah',
          institutionType: 'SD',
          grade: 'Kelas 4',
          enrollmentDate: new Date('2021-07-01'),
          enrollmentYear: '2021/2022',
          isOrphan: true,
          monthlyNeeds: 450000,
          otaProfile: 'Fatimah adalah siswi SD yang berprestasi dalam bidang akademik dan hafalan Al-Quran. Sudah menghafal 5 surah dan selalu ranking 3 besar di kelasnya.',
          achievements: JSON.stringify([
            { title: 'Juara 2 Lomba Hafalan', date: '2024-01-15' },
            { title: 'Ranking 2 Kelas 4', date: '2024-06-30' }
          ])
        },
        {
          nisn: '3456789012',
          nis: 'PD001',
          fullName: 'Muhammad Hafidz Rahman',
          nickname: 'Hafidz',
          birthPlace: 'Surabaya',
          birthDate: new Date('2010-03-10'),
          gender: 'MALE',
          address: 'Jl. Pahlawan No. 789',
          city: 'Surabaya',
          fatherName: 'Almarhum Rahman',
          motherName: 'Aisyah Muslimah',
          institutionType: 'PONDOK',
          grade: 'Ula 2',
          enrollmentDate: new Date('2022-07-01'),
          enrollmentYear: '2022/2023',
          isOrphan: true,
          monthlyNeeds: 600000,
          otaProfile: 'Hafidz adalah santri yang sangat tekun dalam menghafal Al-Quran. Sudah menghafal 10 surah dan aktif dalam kegiatan dakwah. Cita-citanya menjadi ustadz.',
          achievements: JSON.stringify([
            { title: 'Hafidz 10 Surah', date: '2024-05-20' },
            { title: 'Juara 1 Lomba Tilawah', date: '2024-03-15' },
            { title: 'Santri Teladan', date: '2024-07-01' }
          ])
        }
      ]

      for (let i = 0; i < orphanStudents.length; i++) {
        const studentData = orphanStudents[i];
        await prisma.students.create({
          data: {
            id: `seed-orphan-${String(i + 1).padStart(3, '0')}`,
            ...studentData,
            createdBy: 'system', // We'll need to get a valid user ID in real implementation
            updatedAt: new Date(),
          }
        })
      }

      console.log('✅ Created orphan students')
    }

    // Create OTA programs for orphan students
    // First, get all orphan students
    const allOrphanStudents = await prisma.students.findMany({
      where: {
        isOrphan: true
      }
    })

    // Then filter out students who already have OTA programs
    const existingProgramStudentIds = await prisma.ota_programs.findMany({
      select: { studentId: true }
    })
    const existingIds = new Set(existingProgramStudentIds.map(p => p.studentId))
    const orphanStudents = allOrphanStudents.filter(s => !existingIds.has(s.id))

    console.log(`Found ${orphanStudents.length} orphan students without OTA programs`)

    for (const student of orphanStudents) {
      // Create OTA program
      const program = await prisma.ota_programs.create({
        data: {
          studentId: student.id,
          monthlyTarget: student.monthlyNeeds || 500000,
          currentMonth: new Date().toISOString().substring(0, 7),
          displayOrder: Math.floor(Math.random() * 100),
          isActive: true,
        }
      })

      console.log(`✅ Created OTA program for ${student.fullName}`)

      // Create some sample sponsors for variety
      const sponsorCount = Math.floor(Math.random() * 3) + 1 // 1-3 sponsors
      const currentMonth = new Date().toISOString().substring(0, 7)

      for (let i = 0; i < sponsorCount; i++) {
        const donorNames = [
          'Hamba Allah 1', 'Keluarga Barokah', 'Donatur Peduli',
          'Sahabat Yatim', 'Keluarga Muslimah', 'Dermawan Anonim'
        ]

        const amount = [50000, 100000, 150000, 200000, 250000][Math.floor(Math.random() * 5)]
        const isPaid = Math.random() > 0.3 // 70% chance of being paid

        await prisma.ota_sponsors.create({
          data: {
            programId: program.id,
            donorName: `Real Name ${i + 1}`, // Admin sees real name
            publicName: donorNames[Math.floor(Math.random() * donorNames.length)],
            donorEmail: `donor${i + 1}@example.com`,
            amount: amount,
            month: currentMonth,
            isPaid: isPaid,
            paymentStatus: isPaid ? 'VERIFIED' : 'PENDING',
            paymentMethod: 'TRANSFER',
            donorMessage: i === 0 ? 'Semangat belajar ya, dek! Semoga menjadi anak sholeh.' : null,
            allowPublicDisplay: true,
            verifiedAt: isPaid ? new Date() : null,
            paymentDate: isPaid ? new Date() : null,
          }
        })
      }

      // Update program progress based on sponsors
      const totalCollected = await prisma.ota_sponsors.aggregate({
        where: {
          programId: program.id,
          isPaid: true,
        },
        _sum: {
          amount: true,
        }
      })

      const monthlyCollected = await prisma.ota_sponsors.aggregate({
        where: {
          programId: program.id,
          month: currentMonth,
          isPaid: true,
        },
        _sum: {
          amount: true,
        }
      })

      await prisma.ota_programs.update({
        where: { id: program.id },
        data: {
          totalCollected: totalCollected._sum.amount || 0,
          monthlyProgress: monthlyCollected._sum.amount || 0,
          monthsCompleted: parseFloat((monthlyCollected._sum.amount || 0).toString()) >= parseFloat(program.monthlyTarget.toString()) ? 1 : 0,
        }
      })

      console.log(`✅ Created ${sponsorCount} sponsors for ${student.fullName}`)
    }

    // Create sample hafalan progress for some students
    // First, get all orphan students
    const potentialHafalanStudents = await prisma.students.findMany({
      where: {
        isOrphan: true
      },
      take: 10
    })

    // Filter out students who already have hafalan progress
    const existingHafalanStudentIds = await prisma.hafalan_progress.findMany({
      select: { studentId: true }
    })
    const existingHafalanIds = new Set(existingHafalanStudentIds.map(h => h.studentId))
    const studentsNeedingHafalan = potentialHafalanStudents
      .filter(s => !existingHafalanIds.has(s.id))
      .slice(0, 3)

    for (const student of studentsNeedingHafalan) {
      const totalSurah = Math.floor(Math.random() * 15) + 1 // 1-15 surah
      const level = totalSurah > 10 ? 'LANJUT' : totalSurah > 5 ? 'MENENGAH' : 'PEMULA'

      await prisma.hafalan_progress.create({
        data: {
          studentId: student.id,
          totalSurah: totalSurah,
          totalAyat: totalSurah * 20, // Rough estimate
          totalJuz: Math.floor(totalSurah / 4),
          level: level,
          currentSurah: totalSurah + 1,
          currentAyat: 1,
          juz30Progress: Math.min(totalSurah * 6.67, 100), // Juz 30 has ~15 surah
          overallProgress: (totalSurah / 114) * 100,
          currentStreak: Math.floor(Math.random() * 30),
          longestStreak: Math.floor(Math.random() * 60) + 30,
          totalSessions: Math.floor(Math.random() * 100) + 20,
          avgQuality: 3.5 + Math.random(),
          avgFluency: 3.0 + Math.random(),
          avgTajweed: 3.2 + Math.random(),
        }
      })

      console.log(`✅ Created hafalan progress for ${student.fullName} (${totalSurah} surah)`)
    }

    console.log('🎉 OTA seeding completed successfully!')

    // Print summary
    const totalPrograms = await prisma.ota_programs.count()
    const totalSponsors = await prisma.ota_sponsors.count()
    const totalOrphans = await prisma.students.count({ where: { isOrphan: true } })

    console.log('\n📊 OTA System Summary:')
    console.log(`   • Total Orphan Students: ${totalOrphans}`)
    console.log(`   • Total OTA Programs: ${totalPrograms}`)
    console.log(`   • Total Sponsors: ${totalSponsors}`)

    // Calculate total targets and collected
    const programStats = await prisma.ota_programs.aggregate({
      _sum: {
        monthlyTarget: true,
        totalCollected: true,
        monthlyProgress: true,
      }
    })

    console.log(`   • Total Monthly Target: Rp ${(programStats._sum.monthlyTarget || 0).toLocaleString('id-ID')}`)
    console.log(`   • Total Collected: Rp ${(programStats._sum.totalCollected || 0).toLocaleString('id-ID')}`)
    console.log(`   • This Month Progress: Rp ${(programStats._sum.monthlyProgress || 0).toLocaleString('id-ID')}`)

  } catch (error) {
    console.error('❌ Error seeding OTA data:', error)
    throw error
  }
}

export default seedOTAData

// Run directly if this file is executed
if (require.main === module) {
  seedOTAData()
    .then(() => {
      console.log('✅ OTA seeding completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ OTA seeding failed:', error)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}