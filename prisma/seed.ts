import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { seedBillingData } from '../src/lib/billing-seed';
import seedWebsiteContent from './seeds/website-content-seed-v2';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Starting database seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.users.upsert({
    where: { username: 'admin' },
    update: {
      password: hashedPassword,
      isActive: true,
      updatedAt: new Date(),
    },
    create: {
      id: 'seed-admin-user',
      username: 'admin',
      email: 'admin@pondokimamsyafii.com',
      password: hashedPassword,
      name: 'Test Administrator',
      role: 'ADMIN',
      isUstadz: false,
      isActive: true,
      updatedAt: new Date(),
    },
  });

  console.log('✅ Created/Updated admin user:', admin.username);

  // Create staff user
  const staffPassword = await bcrypt.hash('staff123', 10);
  
  const staff = await prisma.users.upsert({
    where: { username: 'staff' },
    update: {
      password: staffPassword,
      isActive: true,
      updatedAt: new Date(),
    },
    create: {
      id: 'seed-staff-user',
      username: 'staff',
      email: 'staff@pondokimamsyafii.com',
      password: staffPassword,
      name: 'Test Staff Member',
      role: 'STAFF',
      isUstadz: false,
      isActive: true,
      updatedAt: new Date(),
    },
  });

  console.log('✅ Created/Updated staff user:', staff.username);

  // Create ustadz user
  const ustadzPassword = await bcrypt.hash('ustadz123', 10);
  
  const ustadz = await prisma.users.upsert({
    where: { username: 'ustadz' },
    update: {
      password: ustadzPassword,
      isActive: true,
      updatedAt: new Date(),
    },
    create: {
      id: 'seed-ustadz-user',
      username: 'ustadz',
      email: 'ustadz@pondokimamsyafii.com',
      password: ustadzPassword,
      name: 'Ustadz Ahmad',
      role: 'USTADZ',
      isUstadz: true,
      isActive: true,
      updatedAt: new Date(),
    },
  });

  console.log('✅ Created/Updated ustadz user:', ustadz.username);

  // Create financial accounts
  const incomeAccount = await prisma.financial_accounts.upsert({
    where: { code: '4001' },
    update: { updatedAt: new Date() },
    create: {
      id: 'seed-income-account',
      code: '4001',
      name: 'Income Account',
      type: 'INCOME',
      subtype: 'GENERAL',
      isActive: true,
      balance: 0,
      description: 'General income account',
      updatedAt: new Date(),
    }
  });

  const expenseAccount = await prisma.financial_accounts.upsert({
    where: { code: '5001' },
    update: { updatedAt: new Date() },
    create: {
      id: 'seed-expense-account',
      code: '5001',
      name: 'Expense Account',
      type: 'EXPENSE',
      subtype: 'GENERAL',
      isActive: true,
      balance: 0,
      description: 'General expense account',
      updatedAt: new Date(),
    }
  });

  // Create financial categories
  const sppCategory = await prisma.financial_categories.upsert({
    where: { name_type: { name: 'SPP', type: 'INCOME' } },
    update: { updatedAt: new Date() },
    create: {
      id: 'seed-cat-spp',
      name: 'SPP',
      type: 'INCOME',
      code: 'INC001',
      accountId: incomeAccount.id,
      color: '#22C55E',
      icon: 'academic-cap',
      isActive: true,
      description: 'Student tuition payments',
      updatedAt: new Date(),
    }
  });

  const infaqCategory = await prisma.financial_categories.upsert({
    where: { name_type: { name: 'Infaq', type: 'DONATION' } },
    update: { updatedAt: new Date() },
    create: {
      id: 'seed-cat-infaq',
      name: 'Infaq',
      type: 'DONATION',
      code: 'DON001',
      accountId: incomeAccount.id,
      color: '#10B981',
      icon: 'heart',
      isActive: true,
      description: 'Charitable donations',
      updatedAt: new Date(),
    }
  });

  const operationalCategory = await prisma.financial_categories.upsert({
    where: { name_type: { name: 'Operational', type: 'EXPENSE' } },
    update: { updatedAt: new Date() },
    create: {
      id: 'seed-cat-operational',
      name: 'Operational',
      type: 'EXPENSE',
      code: 'EXP001',
      accountId: expenseAccount.id,
      color: '#EF4444',
      icon: 'cog',
      isActive: true,
      description: 'Operational expenses',
      updatedAt: new Date(),
    }
  });

  console.log('Created financial accounts and categories');

  // Create sample transactions
  const transactions = await Promise.all([
    prisma.transactions.create({
      data: {
        id: 'seed-trx-001',
        transactionNo: 'TRX-2024-001',
        type: 'INCOME',
        categoryId: sppCategory.id,
        amount: 500000,
        description: 'Pembayaran SPP Bulan Januari',
        date: new Date('2024-01-15'),
        status: 'POSTED',
        createdBy: admin.id,
        updatedAt: new Date(),
      },
    }),
    prisma.transactions.create({
      data: {
        id: 'seed-trx-002',
        transactionNo: 'TRX-2024-002',
        type: 'DONATION',
        categoryId: infaqCategory.id,
        amount: 1000000,
        description: 'Infaq dari Hamba Allah',
        date: new Date('2024-01-20'),
        status: 'POSTED',
        createdBy: admin.id,
        updatedAt: new Date(),
      },
    }),
    prisma.transactions.create({
      data: {
        id: 'seed-trx-003',
        transactionNo: 'TRX-2024-003',
        type: 'EXPENSE',
        categoryId: operationalCategory.id,
        amount: 250000,
        description: 'Pembelian Alat Tulis',
        date: new Date('2024-01-22'),
        status: 'POSTED',
        createdBy: admin.id,
        updatedAt: new Date(),
      },
    }),
  ]);

  console.log(`Created ${transactions.length} sample transactions`);

  // Create sample activities
  const activities = await Promise.all([
    prisma.activities.create({
      data: {
        id: 'seed-activity-001',
        title: 'Pengajian Rutin Mingguan',
        description: 'Kajian kitab Riyadhus Shalihin bersama Ustadz Ahmad',
        type: 'Pondok',
        date: new Date('2024-02-01'),
        location: 'Masjid Baiturrahman',
        photos: JSON.stringify([]),
        status: 'upcoming',
        createdBy: admin.id,
        updatedAt: new Date(),
      },
    }),
    prisma.activities.create({
      data: {
        id: 'seed-activity-002',
        title: 'Lomba Tahfidz Antar Santri',
        description: 'Lomba hafalan Al-Quran untuk santri tingkat SMP',
        type: 'Pondok',
        date: new Date('2024-01-25'),
        location: 'Aula Pondok',
        photos: JSON.stringify([]),
        status: 'completed',
        createdBy: admin.id,
        updatedAt: new Date(),
      },
    }),
  ]);

  console.log(`Created ${activities.length} sample activities`);

  // Create sample courses
  const courses = await Promise.all([
    prisma.courses.create({
      data: {
        id: "seed-course-001",
        name: 'Tahfidz Al-Quran',
        description: 'Program hafalan Al-Quran 30 Juz dengan metode mutqin',
        level: 'Semua Tingkat',
        schedule: 'Setiap hari ba\'da Subuh dan Maghrib',
        teacher: 'Ustadz Abdullah',
        duration: '2 tahun',
        capacity: 50,
        enrolled: 35,
        status: 'active',
        createdBy: admin.id,
        updatedAt: new Date(),
      },
    }),
    prisma.courses.create({
      data: {
        id: "seed-course-002",
        name: 'Bahasa Arab Dasar',
        description: 'Pembelajaran bahasa Arab untuk pemula',
        level: 'Pemula',
        schedule: 'Senin, Rabu, Jumat (15:00-17:00)',
        teacher: 'Ustadz Mahmud',
        duration: '6 bulan',
        capacity: 30,
        enrolled: 25,
        status: 'active',
        createdBy: admin.id,
        updatedAt: new Date(),
      },
    }),
  ]);

  console.log(`Created ${courses.length} sample courses`);

  // Create sample videos
  const videos = await Promise.all([
    prisma.videos.create({
      data: {
        id: "seed-video-001",
        title: 'Kajian Tafsir Surat Al-Fatihah',
        description: 'Pembahasan mendalam tentang makna dan kandungan Surat Al-Fatihah',
        url: 'https://www.youtube.com/watch?v=example1',
        thumbnail: '/images/kajian-thumb-1.jpg',
        duration: '45:30',
        category: 'Tafsir',
        teacher: 'Ustadz Ahmad',
        uploadDate: new Date('2024-01-10'),
        views: 150,
        isPublic: true,
        createdBy: admin.id,
        updatedAt: new Date(),
      },
    }),
    prisma.videos.create({
      data: {
        id: "seed-video-002",
        title: 'Adab Menuntut Ilmu',
        description: 'Penjelasan tentang adab-adab dalam menuntut ilmu menurut Islam',
        url: 'https://www.youtube.com/watch?v=example2',
        thumbnail: '/images/kajian-thumb-2.jpg',
        duration: '30:15',
        category: 'Akhlak',
        teacher: 'Ustadz Abdullah',
        uploadDate: new Date('2024-01-15'),
        views: 200,
        isPublic: true,
        createdBy: admin.id,
        updatedAt: new Date(),
      },
    }),
  ]);

  console.log(`Created ${videos.length} sample videos`);

  // Create sample ebooks
  const ebooks = await Promise.all([
    prisma.ebooks.create({
      data: {
        id: "seed-ebook-001",
        title: 'Riyadhus Shalihin',
        author: 'Imam An-Nawawi',
        description: 'Kumpulan hadits pilihan tentang akhlak dan adab',
        category: 'Hadits',
        fileUrl: '/ebooks/riyadhus-shalihin.pdf',
        coverImage: '/images/riyadhus-shalihin-cover.jpg',
        publisher: 'Darul Haq',
        publishYear: '2020',
        pageCount: 850,
        language: 'Indonesia',
        isPublic: true,
        createdBy: admin.id,
        updatedAt: new Date(),
      },
    }),
    prisma.ebooks.create({
      data: {
        id: "seed-ebook-002",
        title: 'Fiqih Sunnah',
        author: 'Sayyid Sabiq',
        description: 'Pembahasan fiqih berdasarkan Al-Quran dan Sunnah',
        category: 'Fiqih',
        fileUrl: '/ebooks/fiqih-sunnah.pdf',
        coverImage: '/images/fiqih-sunnah-cover.jpg',
        publisher: 'Pena Pundi Aksara',
        publishYear: '2019',
        pageCount: 1200,
        language: 'Indonesia',
        isPublic: true,
        createdBy: admin.id,
        updatedAt: new Date(),
      },
    }),
  ]);

  console.log(`Created ${ebooks.length} sample ebooks`);

  // Create sample students
  const students = await Promise.all([
    prisma.students.create({
      data: {
        id: "seed-student-001",
        nis: '2024001',
        nisn: '1234567890',
        fullName: 'Ahmad Zaki Mubarak',
        nickname: 'Zaki',
        birthPlace: 'Blitar',
        birthDate: new Date('2010-05-15'),
        gender: 'MALE',
        bloodType: 'A',
        address: 'Jl. Merdeka No. 123',
        village: 'Kepanjenkidul',
        district: 'Kepanjenkidul',
        city: 'Blitar',
        province: 'Jawa Timur',
        postalCode: '66117',
        phone: '081234567890',
        fatherName: 'Bapak Ahmad',
        fatherJob: 'Wiraswasta',
        fatherPhone: '081234567891',
        motherName: 'Ibu Fatimah',
        motherJob: 'Ibu Rumah Tangga',
        motherPhone: '081234567892',
        institutionType: 'PONDOK',
        grade: 'Tingkat 1',
        enrollmentDate: new Date('2024-01-01'),
        enrollmentYear: '2024',
        photo: '/images/students/default-male.jpg',
        createdBy: admin.id,
        updatedAt: new Date(),
      },
    }),
    prisma.students.create({
      data: {
        id: "seed-student-002",
        nis: '2024002',
        nisn: '1234567891',
        fullName: 'Fatimah Az-Zahra',
        nickname: 'Zahra',
        birthPlace: 'Blitar',
        birthDate: new Date('2011-03-20'),
        gender: 'FEMALE',
        bloodType: 'B',
        address: 'Jl. Soekarno Hatta No. 45',
        village: 'Sananwetan',
        district: 'Sananwetan',
        city: 'Blitar',
        province: 'Jawa Timur',
        postalCode: '66117',
        phone: '081234567893',
        fatherName: 'Bapak Abdullah',
        fatherJob: 'PNS',
        fatherPhone: '081234567894',
        motherName: 'Ibu Aisyah',
        motherJob: 'Guru',
        motherPhone: '081234567895',
        institutionType: 'PONDOK',
        grade: 'Tingkat 1',
        enrollmentDate: new Date('2024-01-01'),
        enrollmentYear: '2024',
        photo: '/images/students/default-female.jpg',
        createdBy: admin.id,
        updatedAt: new Date(),
      },
    }),
    prisma.students.create({
      data: {
        id: "seed-student-003",
        nis: '2024003',
        fullName: 'Muhammad Iqbal Ramadhan',
        nickname: 'Iqbal',
        birthPlace: 'Blitar',
        birthDate: new Date('2012-07-10'),
        gender: 'MALE',
        bloodType: 'O',
        address: 'Jl. Ahmad Yani No. 78',
        village: 'Sukorejo',
        district: 'Sukorejo',
        city: 'Blitar',
        province: 'Jawa Timur',
        postalCode: '66117',
        fatherName: 'Bapak Hasan',
        fatherJob: 'Pedagang',
        fatherPhone: '081234567896',
        motherName: 'Ibu Khadijah',
        motherJob: 'Ibu Rumah Tangga',
        motherPhone: '081234567897',
        institutionType: 'PONDOK',
        grade: 'Tingkat 2',
        enrollmentDate: new Date('2023-01-01'),
        enrollmentYear: '2023',
        createdBy: admin.id,
        updatedAt: new Date(),
      },
    }),
    prisma.students.create({
      data: {
        id: "seed-student-004",
        nis: '2024004',
        fullName: 'Siti Nur Halimah',
        nickname: 'Halimah',
        birthPlace: 'Blitar',
        birthDate: new Date('2010-11-25'),
        gender: 'FEMALE',
        bloodType: 'AB',
        address: 'Jl. Veteran No. 12',
        village: 'Kepanjenkidul',
        district: 'Kepanjenkidul',
        city: 'Blitar',
        province: 'Jawa Timur',
        fatherName: 'Bapak Muhammad',
        fatherJob: 'Buruh',
        fatherPhone: '081234567898',
        motherName: 'Ibu Maryam',
        motherJob: 'Buruh',
        motherPhone: '081234567899',
        institutionType: 'PONDOK',
        grade: 'Tingkat 2',
        enrollmentDate: new Date('2023-01-01'),
        enrollmentYear: '2023',
        createdBy: admin.id,
        updatedAt: new Date(),
      },
    }),
    prisma.students.create({
      data: {
        id: "seed-student-005",
        nis: '2024005',
        fullName: 'Abdullah Aziz',
        nickname: 'Aziz',
        birthPlace: 'Kediri',
        birthDate: new Date('2011-09-05'),
        gender: 'MALE',
        bloodType: 'A',
        address: 'Jl. Diponegoro No. 56',
        village: 'Sananwetan',
        district: 'Sananwetan',
        city: 'Blitar',
        province: 'Jawa Timur',
        fatherName: 'Bapak Umar',
        fatherJob: 'Petani',
        fatherPhone: '081234567800',
        motherName: 'Ibu Hafsah',
        motherJob: 'Petani',
        motherPhone: '081234567801',
        institutionType: 'PONDOK',
        grade: 'Tingkat 3',
        enrollmentDate: new Date('2022-01-01'),
        enrollmentYear: '2022',
        createdBy: admin.id,
        updatedAt: new Date(),
      },
    }),
  ]);

  console.log(`Created ${students.length} sample students`);

  // Seed billing data
  await seedBillingData(prisma);

  // Seed website content (navbar, footer, yayasan, struktur)
  await seedWebsiteContent();

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });