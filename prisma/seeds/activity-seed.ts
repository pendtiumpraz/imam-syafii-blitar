import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedActivities(): Promise<void> {
  console.log('🌱 Seeding activities...');

  // Get first admin user for createdBy
  const adminUser = await prisma.users.findFirst({
    where: {
      role: { in: ['ADMIN', 'SUPER_ADMIN'] }
    }
  });

  if (!adminUser) {
    console.log('❌ No admin user found. Please seed users first.');
    return;
  }

  const activities = [
    {
      title: 'Wisuda Tahfidz 30 Juz',
      description: 'Acara wisuda untuk 25 santri yang telah menyelesaikan hafalan 30 juz Al-Quran. Acara dihadiri oleh orang tua santri, para ustadz, dan tokoh masyarakat.',
      type: 'akademik',
      date: new Date('2024-01-15'),
      location: 'Aula Utama Pondok Imam Syafi\'i',
      photos: JSON.stringify([
        '/images/wisuda-tahfidz-1.jpg',
        '/images/wisuda-tahfidz-2.jpg',
        '/images/wisuda-tahfidz-3.jpg'
      ]),
      status: 'completed',
      createdBy: adminUser.id
    },
    {
      title: 'Peringatan Maulid Nabi Muhammad SAW',
      description: 'Peringatan Maulid Nabi dengan berbagai kegiatan seperti pembacaan sholawat, ceramah agama, dan perlombaan untuk santri.',
      type: 'keagamaan',
      date: new Date('2024-01-10'),
      location: 'Masjid Pondok Imam Syafi\'i',
      photos: JSON.stringify([
        '/images/maulid-nabi-1.jpg',
        '/images/maulid-nabi-2.jpg'
      ]),
      status: 'completed',
      createdBy: adminUser.id
    },
    {
      title: 'Lomba Kreativitas Santri',
      description: 'Kompetisi tahunan kreativitas santri dalam berbagai bidang seperti tahfidz, kaligrafi, pidato, dan cerdas cermat.',
      type: 'kompetisi',
      date: new Date('2024-02-05'),
      location: 'Lapangan Pondok',
      photos: JSON.stringify([
        '/images/lomba-kreativitas-1.jpg',
        '/images/lomba-kreativitas-2.jpg',
        '/images/lomba-kreativitas-3.jpg'
      ]),
      status: 'completed',
      createdBy: adminUser.id
    },
    {
      title: 'Kunjungan Studi Banding',
      description: 'Kunjungan dari Pondok Pesantren se-Jawa Timur untuk berbagi pengalaman dan best practice dalam pengelolaan pondok pesantren modern.',
      type: 'sosial',
      date: new Date('2024-02-20'),
      location: 'Pondok Imam Syafi\'i Blitar',
      photos: JSON.stringify([
        '/images/studi-banding-1.jpg',
        '/images/studi-banding-2.jpg'
      ]),
      status: 'completed',
      createdBy: adminUser.id
    },
    {
      title: 'Pelatihan Kewirausahaan Santri',
      description: 'Workshop kewirausahaan untuk membekali santri dengan keterampilan bisnis dan entrepreneurship.',
      type: 'pelatihan',
      date: new Date('2024-03-01'),
      location: 'Ruang Pertemuan Pondok',
      photos: JSON.stringify([
        '/images/pelatihan-wirausaha-1.jpg'
      ]),
      status: 'completed',
      createdBy: adminUser.id
    },
    {
      title: 'Bakti Sosial Ramadhan',
      description: 'Pembagian sembako dan santunan untuk warga sekitar pondok dalam rangka menyambut bulan Ramadhan.',
      type: 'sosial',
      date: new Date('2024-03-10'),
      location: 'Desa Sumberejo, Blitar',
      photos: JSON.stringify([
        '/images/bakti-sosial-1.jpg',
        '/images/bakti-sosial-2.jpg'
      ]),
      status: 'completed',
      createdBy: adminUser.id
    },
    {
      title: 'Kajian Kitab Kuning Bulanan',
      description: 'Kajian rutin kitab kuning setiap bulan dengan tema Fiqih Muamalah dan Tasawuf.',
      type: 'kajian',
      date: new Date('2024-03-15'),
      location: 'Masjid Pondok',
      photos: JSON.stringify([]),
      status: 'planned',
      createdBy: adminUser.id
    },
    {
      title: 'Haflah Akhirussanah',
      description: 'Acara penutupan tahun ajaran dengan penampilan santri, pembagian rapor, dan pengumuman santri berprestasi.',
      type: 'akademik',
      date: new Date('2024-06-15'),
      location: 'Aula Utama Pondok',
      photos: JSON.stringify([]),
      status: 'planned',
      createdBy: adminUser.id
    },
    {
      title: 'Pesantren Kilat Ramadhan',
      description: 'Program pesantren kilat untuk siswa SD dan SMP selama bulan Ramadhan.',
      type: 'keagamaan',
      date: new Date('2024-03-20'),
      location: 'Pondok Imam Syafi\'i',
      photos: JSON.stringify([]),
      status: 'planned',
      createdBy: adminUser.id
    },
    {
      title: 'Turnamen Futsal Antar Pondok',
      description: 'Kompetisi futsal antar pondok pesantren se-Blitar Raya dalam rangka mempererat silaturahmi.',
      type: 'kompetisi',
      date: new Date('2024-04-01'),
      location: 'Lapangan Futsal Pondok',
      photos: JSON.stringify([]),
      status: 'planned',
      createdBy: adminUser.id
    }
  ];

  console.log(`📝 Creating ${activities.length} activities...`);

  for (let i = 0; i < activities.length; i++) {
    const activity = activities[i];
    // Check if activity exists by title
    const existing = await prisma.activities.findFirst({
      where: { title: activity.title }
    });

    if (existing) {
      await prisma.activities.update({
        where: { id: existing.id },
        data: {
          ...activity,
          updatedAt: new Date(),
        }
      });
    } else {
      await prisma.activities.create({
        data: {
          id: `seed-activity-${String(i + 1).padStart(3, '0')}`,
          ...activity,
          updatedAt: new Date(),
        }
      });
    }
  }

  console.log('✅ Activities seeded successfully!');
}

export default seedActivities;

// Run the seed function
seedActivities()
  .then(() => {
    console.log('✅ Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });