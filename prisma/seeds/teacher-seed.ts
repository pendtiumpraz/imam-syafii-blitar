import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTeachers() {
  console.log('🌱 Seeding teachers (Ustadz & Ustadzah)...');

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

  const teachers = [
    // Ustadz (Male Teachers)
    {
      nip: '2023001',
      name: 'Ust. Abu Haitsami Iqbal',
      title: 'S.Pd.I',
      gender: 'L',
      birthPlace: 'Blitar',
      birthDate: new Date('1985-03-15'),
      phone: '081234567890',
      email: 'abu.haitsami@pondokimamsyafii.sch.id',
      address: 'Jl. Imam Syafi\'i No. 1, Blitar',
      position: 'Kepala Pondok',
      subjects: JSON.stringify(['Fiqih', 'Aqidah', 'Akhlak']),
      education: 'S1 Pendidikan Agama Islam',
      university: 'UIN Malang',
      major: 'Pendidikan Agama Islam',
      certifications: JSON.stringify(['Sertifikat Pendidik', 'Sertifikat Tahfidz 30 Juz']),
      employmentType: 'TETAP',
      joinDate: new Date('2015-07-01'),
      status: 'ACTIVE',
      institution: 'PONDOK',
      specialization: 'Fiqih & Tahfidz',
      experience: 9,
      bio: 'Kepala Pondok Imam Syafi\'i dengan pengalaman mengajar Fiqih dan membimbing tahfidz selama lebih dari 9 tahun.',
      achievements: JSON.stringify(['Juara 1 MTQ Nasional 2010', 'Hafidz 30 Juz']),
      isUstadz: true,
      createdBy: adminUser.id
    },
    {
      nip: '2023002',
      name: 'Ust. Ahmad Syaifuddin',
      title: 'M.Pd.I',
      gender: 'L',
      birthPlace: 'Kediri',
      birthDate: new Date('1982-06-20'),
      phone: '081234567891',
      email: 'ahmad.syaifuddin@pondokimamsyafii.sch.id',
      address: 'Jl. Merdeka No. 15, Blitar',
      position: 'Wakil Kepala Kurikulum',
      subjects: JSON.stringify(['Bahasa Arab', 'Nahwu', 'Shorof']),
      education: 'S2 Pendidikan Bahasa Arab',
      university: 'UIN Sunan Ampel Surabaya',
      major: 'Pendidikan Bahasa Arab',
      certifications: JSON.stringify(['Sertifikat Pendidik', 'TOAFL Score 580']),
      employmentType: 'TETAP',
      joinDate: new Date('2016-01-01'),
      status: 'ACTIVE',
      institution: 'PONDOK',
      specialization: 'Bahasa Arab',
      experience: 12,
      bio: 'Ahli bahasa Arab dengan pengalaman mengajar Nahwu dan Shorof. Lulusan terbaik UIN Sunan Ampel.',
      achievements: JSON.stringify(['Best Paper Award Konferensi Bahasa Arab 2019']),
      isUstadz: true,
      createdBy: adminUser.id
    },
    {
      nip: '2023003',
      name: 'Ust. Fuad Hasyim',
      title: 'S.Pd',
      gender: 'L',
      birthPlace: 'Malang',
      birthDate: new Date('1988-11-10'),
      phone: '081234567892',
      email: 'fuad.hasyim@pondokimamsyafii.sch.id',
      address: 'Jl. Sunan Kalijaga No. 7, Blitar',
      position: 'Guru Tahfidz',
      subjects: JSON.stringify(['Tahfidz', 'Tajwid', 'Qiroah']),
      education: 'S1 Ilmu Al-Quran dan Tafsir',
      university: 'LIPIA Jakarta',
      major: 'Ilmu Al-Quran dan Tafsir',
      certifications: JSON.stringify(['Sertifikat Tahfidz 30 Juz', 'Sanad Qiroah Sab\'ah']),
      employmentType: 'TETAP',
      joinDate: new Date('2017-08-01'),
      status: 'ACTIVE',
      institution: 'PONDOK',
      specialization: 'Tahfidz Al-Quran',
      experience: 7,
      bio: 'Pembimbing tahfidz dengan sanad qiroah sab\'ah. Telah membimbing lebih dari 50 santri hafidz.',
      achievements: JSON.stringify(['Hafidz 30 Juz', 'Juara 1 MTQ Tingkat Provinsi']),
      isUstadz: true,
      createdBy: adminUser.id
    },
    {
      nip: '2023004',
      name: 'Ust. Imam Ghozali',
      title: 'S.Pd.I',
      gender: 'L',
      birthPlace: 'Tulungagung',
      birthDate: new Date('1990-02-25'),
      phone: '081234567893',
      email: 'imam.ghozali@pondokimamsyafii.sch.id',
      address: 'Jl. KH. Wahid Hasyim No. 20, Blitar',
      position: 'Guru Kitab Kuning',
      subjects: JSON.stringify(['Tafsir', 'Hadits', 'Mustholah Hadits']),
      education: 'S1 Ilmu Hadits',
      university: 'Universitas Al-Azhar Kairo',
      major: 'Ilmu Hadits',
      certifications: JSON.stringify(['Sertifikat Pendidik', 'Ijazah Sanad Hadits']),
      employmentType: 'TETAP',
      joinDate: new Date('2018-07-01'),
      status: 'ACTIVE',
      institution: 'PONDOK',
      specialization: 'Kitab Kuning',
      experience: 6,
      bio: 'Lulusan Al-Azhar Kairo, spesialis pengajaran kitab kuning klasik dan ilmu hadits.',
      achievements: JSON.stringify(['Lulusan Terbaik Al-Azhar 2014']),
      isUstadz: true,
      createdBy: adminUser.id
    },
    {
      nip: '2023005',
      name: 'Ust. Syamsul Arifin',
      title: 'S.Pd',
      gender: 'L',
      birthPlace: 'Blitar',
      birthDate: new Date('1987-07-12'),
      phone: '081234567894',
      email: 'syamsul.arifin@pondokimamsyafii.sch.id',
      address: 'Jl. Pesantren No. 5, Blitar',
      position: 'Kepala SD Islam',
      subjects: JSON.stringify(['Matematika', 'IPA', 'PAI']),
      education: 'S1 Pendidikan Matematika',
      university: 'Universitas Negeri Malang',
      major: 'Pendidikan Matematika',
      certifications: JSON.stringify(['Sertifikat Pendidik', 'Sertifikat Kepala Sekolah']),
      employmentType: 'TETAP',
      joinDate: new Date('2015-07-01'),
      status: 'ACTIVE',
      institution: 'SD',
      specialization: 'Matematika & Sains',
      experience: 10,
      bio: 'Kepala SD Islam dengan latar belakang pendidikan matematika. Berpengalaman dalam pengembangan kurikulum terpadu.',
      achievements: JSON.stringify(['Kepala Sekolah Berprestasi 2022']),
      isUstadz: true,
      createdBy: adminUser.id
    },
    
    // Ustadzah (Female Teachers)
    {
      nip: '2023006',
      name: 'Ustzh. Ummu Dzakiyah',
      title: 'S.Pd.I',
      gender: 'P',
      birthPlace: 'Blitar',
      birthDate: new Date('1989-09-15'),
      phone: '081234567895',
      email: 'ummu.dzakiyah@pondokimamsyafii.sch.id',
      address: 'Jl. Imam Bonjol No. 10, Blitar',
      position: 'Kepala TK Islam',
      subjects: JSON.stringify(['Iqro', 'Hafalan Surat Pendek', 'Adab & Akhlak']),
      education: 'S1 PAUD',
      university: 'UIN Malang',
      major: 'Pendidikan Anak Usia Dini',
      certifications: JSON.stringify(['Sertifikat Pendidik PAUD', 'Sertifikat Montessori']),
      employmentType: 'TETAP',
      joinDate: new Date('2016-07-01'),
      status: 'ACTIVE',
      institution: 'TK',
      specialization: 'Pendidikan Anak Usia Dini',
      experience: 8,
      bio: 'Kepala TK Islam dengan spesialisasi pendidikan anak usia dini dan metode Montessori.',
      achievements: JSON.stringify(['Juara 1 Guru PAUD Kreatif Tingkat Kota']),
      isUstadz: false,
      createdBy: adminUser.id
    },
    {
      nip: '2023007',
      name: 'Ustzh. Fatimah Az-Zahra',
      title: 'S.Pd',
      gender: 'P',
      birthPlace: 'Kediri',
      birthDate: new Date('1991-04-20'),
      phone: '081234567896',
      email: 'fatimah.azzahra@pondokimamsyafii.sch.id',
      address: 'Jl. Sudirman No. 25, Blitar',
      position: 'Guru Tahfidz Akhwat',
      subjects: JSON.stringify(['Tahfidz', 'Tajwid']),
      education: 'S1 Ilmu Al-Quran',
      university: 'STAI Ali bin Abi Thalib Surabaya',
      major: 'Ilmu Al-Quran',
      certifications: JSON.stringify(['Sertifikat Tahfidz 30 Juz', 'Sertifikat Pendidik']),
      employmentType: 'TETAP',
      joinDate: new Date('2017-01-01'),
      status: 'ACTIVE',
      institution: 'PONDOK',
      specialization: 'Tahfidz Akhwat',
      experience: 7,
      bio: 'Pembimbing tahfidz khusus santriwati dengan metode pembelajaran yang inovatif.',
      achievements: JSON.stringify(['Hafidzah 30 Juz', 'Pembimbing Terbaik 2023']),
      isUstadz: false,
      createdBy: adminUser.id
    },
    {
      nip: '2023008',
      name: 'Ustzh. Aisyah Nur',
      title: 'S.Pd',
      gender: 'P',
      birthPlace: 'Malang',
      birthDate: new Date('1993-12-05'),
      phone: '081234567897',
      email: 'aisyah.nur@pondokimamsyafii.sch.id',
      address: 'Jl. Diponegoro No. 15, Blitar',
      position: 'Guru Bahasa Arab Akhwat',
      subjects: JSON.stringify(['Bahasa Arab', 'Muhadatsah', 'Imla\'']),
      education: 'S1 Pendidikan Bahasa Arab',
      university: 'UIN Maulana Malik Ibrahim Malang',
      major: 'Pendidikan Bahasa Arab',
      certifications: JSON.stringify(['Sertifikat Pendidik', 'TOAFL Score 550']),
      employmentType: 'TETAP',
      joinDate: new Date('2018-07-01'),
      status: 'ACTIVE',
      institution: 'PONDOK',
      specialization: 'Bahasa Arab Komunikatif',
      experience: 6,
      bio: 'Pengajar bahasa Arab dengan metode komunikatif untuk santriwati.',
      achievements: JSON.stringify(['Best Presenter Seminar Bahasa Arab 2022']),
      isUstadz: false,
      createdBy: adminUser.id
    },
    {
      nip: '2023009',
      name: 'Ustzh. Khadijah',
      title: 'S.Pd.I',
      gender: 'P',
      birthPlace: 'Blitar',
      birthDate: new Date('1986-08-18'),
      phone: '081234567898',
      email: 'khadijah@pondokimamsyafii.sch.id',
      address: 'Jl. Ahmad Yani No. 30, Blitar',
      position: 'Guru Fiqih Wanita',
      subjects: JSON.stringify(['Fiqih Wanita', 'Kesehatan Reproduksi', 'Parenting Islami']),
      education: 'S1 Syariah',
      university: 'IAIN Tulungagung',
      major: 'Hukum Keluarga Islam',
      certifications: JSON.stringify(['Sertifikat Pendidik', 'Sertifikat Konselor']),
      employmentType: 'TETAP',
      joinDate: new Date('2016-01-01'),
      status: 'ACTIVE',
      institution: 'PONDOK',
      specialization: 'Fiqih Wanita',
      experience: 9,
      bio: 'Spesialis fiqih wanita dan konseling remaja putri dengan pendekatan Islami.',
      achievements: JSON.stringify(['Penulis Buku Fiqih Wanita Kontemporer']),
      isUstadz: false,
      createdBy: adminUser.id
    },
    {
      nip: '2023010',
      name: 'Ustzh. Maryam',
      title: 'S.Pd',
      gender: 'P',
      birthPlace: 'Tulungagung',
      birthDate: new Date('1992-03-22'),
      phone: '081234567899',
      email: 'maryam@pondokimamsyafii.sch.id',
      address: 'Jl. Kartini No. 12, Blitar',
      position: 'Guru Kelas SD',
      subjects: JSON.stringify(['Bahasa Indonesia', 'IPS', 'SBdP']),
      education: 'S1 PGSD',
      university: 'Universitas Negeri Malang',
      major: 'Pendidikan Guru Sekolah Dasar',
      certifications: JSON.stringify(['Sertifikat Pendidik', 'Sertifikat Guru Penggerak']),
      employmentType: 'TETAP',
      joinDate: new Date('2017-07-01'),
      status: 'ACTIVE',
      institution: 'SD',
      specialization: 'Pembelajaran Tematik',
      experience: 7,
      bio: 'Guru kelas dengan keahlian dalam pembelajaran tematik integratif.',
      achievements: JSON.stringify(['Guru Teladan Tingkat Kota 2023']),
      isUstadz: false,
      createdBy: adminUser.id
    },
    {
      nip: '2023011',
      name: 'Ustzh. Halimah',
      title: 'S.Pd',
      gender: 'P',
      birthPlace: 'Blitar',
      birthDate: new Date('1994-06-30'),
      phone: '081234567900',
      email: 'halimah@pondokimamsyafii.sch.id',
      address: 'Jl. Veteran No. 8, Blitar',
      position: 'Guru TK',
      subjects: JSON.stringify(['Motorik', 'Kognitif', 'Seni']),
      education: 'S1 PAUD',
      university: 'Universitas Negeri Surabaya',
      major: 'Pendidikan Anak Usia Dini',
      certifications: JSON.stringify(['Sertifikat Pendidik PAUD']),
      employmentType: 'TETAP',
      joinDate: new Date('2019-07-01'),
      status: 'ACTIVE',
      institution: 'TK',
      specialization: 'Pengembangan Kreativitas Anak',
      experience: 5,
      bio: 'Guru TK dengan fokus pada pengembangan kreativitas dan motorik anak.',
      achievements: JSON.stringify(['Finalis Guru PAUD Inspiratif 2023']),
      isUstadz: false,
      createdBy: adminUser.id
    }
  ];

  console.log(`📝 Creating ${teachers.length} teachers...`);

  for (const teacher of teachers) {
    // Check if teacher exists by NIP
    const existing = await prisma.teacher.findUnique({
      where: { nip: teacher.nip }
    });

    if (existing) {
      await prisma.teacher.update({
        where: { id: existing.id },
        data: teacher
      });
    } else {
      await prisma.teacher.create({
        data: teacher
      });
    }
  }

  console.log('✅ Teachers seeded successfully!');
}

export default seedTeachers;

// Run the seed function
seedTeachers()
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