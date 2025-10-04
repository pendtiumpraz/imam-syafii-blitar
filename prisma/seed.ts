import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { seedBillingData } from '../src/lib/billing-seed';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create SUPERADMIN user (Platform Owner)
  const superAdminPassword = await bcrypt.hash('superadmin123', 10);
  
  const superAdmin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      username: 'superadmin',
      email: 'superadmin@sistempondok.id',
      password: superAdminPassword,
      name: 'Super Administrator',
      role: 'SUPERADMIN',
      isUstadz: false,
      isActive: true,
    },
  });

  console.log('Created SUPERADMIN user:', superAdmin.username);

  // Create admin user (Admin Yayasan Imam Syafii)
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin_syafii' },
    update: {},
    create: {
      username: 'admin_syafii',
      email: 'admin@pondokimamsyafii.com',
      password: hashedPassword,
      name: 'Admin Yayasan Imam Syafii',
      role: 'ADMIN',
      isUstadz: false,
      isActive: true,
    },
  });

  console.log('Created admin user:', admin.username);

  // Create staff user
  const staffPassword = await bcrypt.hash('staff123', 10);
  
  const staff = await prisma.user.upsert({
    where: { username: 'staff' },
    update: {},
    create: {
      username: 'staff',
      email: 'staff@pondokimamsyafii.com',
      password: staffPassword,
      name: 'Staff User',
      role: 'STAFF',
      isUstadz: false,
      isActive: true,
    },
  });

  console.log('Created staff user:', staff.username);

  // Create ustadz user
  const ustadzPassword = await bcrypt.hash('ustadz123', 10);
  
  const ustadz = await prisma.user.upsert({
    where: { username: 'ustadz' },
    update: {},
    create: {
      username: 'ustadz',
      email: 'ustadz@pondokimamsyafii.com',
      password: ustadzPassword,
      name: 'Ustadz Ahmad',
      role: 'USTADZ',
      isUstadz: true,
      isActive: true,
    },
  });

  console.log('Created ustadz user:', ustadz.username);

  // Create financial accounts
  const incomeAccount = await prisma.financialAccount.upsert({
    where: { code: '4001' },
    update: {},
    create: {
      code: '4001',
      name: 'Income Account',
      type: 'INCOME',
      subtype: 'GENERAL',
      isActive: true,
      balance: 0,
      description: 'General income account'
    }
  });

  const expenseAccount = await prisma.financialAccount.upsert({
    where: { code: '5001' },
    update: {},
    create: {
      code: '5001',
      name: 'Expense Account',
      type: 'EXPENSE',
      subtype: 'GENERAL',
      isActive: true,
      balance: 0,
      description: 'General expense account'
    }
  });

  // Create financial categories
  const sppCategory = await prisma.financialCategory.upsert({
    where: { name_type: { name: 'SPP', type: 'INCOME' } },
    update: {},
    create: {
      name: 'SPP',
      type: 'INCOME',
      code: 'INC001',
      accountId: incomeAccount.id,
      color: '#22C55E',
      icon: 'academic-cap',
      isActive: true,
      description: 'Student tuition payments'
    }
  });

  const infaqCategory = await prisma.financialCategory.upsert({
    where: { name_type: { name: 'Infaq', type: 'DONATION' } },
    update: {},
    create: {
      name: 'Infaq',
      type: 'DONATION',
      code: 'DON001',
      accountId: incomeAccount.id,
      color: '#10B981',
      icon: 'heart',
      isActive: true,
      description: 'Charitable donations'
    }
  });

  const operationalCategory = await prisma.financialCategory.upsert({
    where: { name_type: { name: 'Operational', type: 'EXPENSE' } },
    update: {},
    create: {
      name: 'Operational',
      type: 'EXPENSE',
      code: 'EXP001',
      accountId: expenseAccount.id,
      color: '#EF4444',
      icon: 'cog',
      isActive: true,
      description: 'Operational expenses'
    }
  });

  console.log('Created financial accounts and categories');

  // Create sample transactions
  const transactions = await Promise.all([
    prisma.transaction.create({
      data: {
        transactionNo: 'TRX-2024-001',
        type: 'INCOME',
        categoryId: sppCategory.id,
        amount: 500000,
        description: 'Pembayaran SPP Bulan Januari',
        date: new Date('2024-01-15'),
        status: 'POSTED',
        createdBy: admin.id,
      },
    }),
    prisma.transaction.create({
      data: {
        transactionNo: 'TRX-2024-002',
        type: 'DONATION',
        categoryId: infaqCategory.id,
        amount: 1000000,
        description: 'Infaq dari Hamba Allah',
        date: new Date('2024-01-20'),
        status: 'POSTED',
        createdBy: admin.id,
      },
    }),
    prisma.transaction.create({
      data: {
        transactionNo: 'TRX-2024-003',
        type: 'EXPENSE',
        categoryId: operationalCategory.id,
        amount: 250000,
        description: 'Pembelian Alat Tulis',
        date: new Date('2024-01-22'),
        status: 'POSTED',
        createdBy: admin.id,
      },
    }),
  ]);

  console.log(`Created ${transactions.length} sample transactions`);

  // Create sample activities
  const activities = await Promise.all([
    prisma.activity.create({
      data: {
        title: 'Pengajian Rutin Mingguan',
        description: 'Kajian kitab Riyadhus Shalihin bersama Ustadz Ahmad',
        type: 'Pondok',
        date: new Date('2024-02-01'),
        location: 'Masjid Baiturrahman',
        photos: JSON.stringify([]),
        status: 'upcoming',
        createdBy: admin.id,
      },
    }),
    prisma.activity.create({
      data: {
        title: 'Lomba Tahfidz Antar Santri',
        description: 'Lomba hafalan Al-Quran untuk santri tingkat SMP',
        type: 'Pondok',
        date: new Date('2024-01-25'),
        location: 'Aula Pondok',
        photos: JSON.stringify([]),
        status: 'completed',
        createdBy: admin.id,
      },
    }),
  ]);

  console.log(`Created ${activities.length} sample activities`);

  // Create sample courses
  const courses = await Promise.all([
    prisma.course.create({
      data: {
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
      },
    }),
    prisma.course.create({
      data: {
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
      },
    }),
  ]);

  console.log(`Created ${courses.length} sample courses`);

  // Create sample videos
  const videos = await Promise.all([
    prisma.video.create({
      data: {
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
      },
    }),
    prisma.video.create({
      data: {
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
      },
    }),
  ]);

  console.log(`Created ${videos.length} sample videos`);

  // Create sample ebooks
  const ebooks = await Promise.all([
    prisma.ebook.create({
      data: {
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
      },
    }),
    prisma.ebook.create({
      data: {
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
      },
    }),
  ]);

  console.log(`Created ${ebooks.length} sample ebooks`);

  // Seed billing data
  await seedBillingData(prisma);

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