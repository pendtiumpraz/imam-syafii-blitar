// Billing system seed data
// Run this script to populate initial bill types and settings

export const defaultBillTypes = [
  {
    name: 'SPP Bulanan',
    category: 'TUITION',
    description: 'Sumbangan Pembinaan Pendidikan bulanan',
    isRecurring: true,
    frequency: 'MONTHLY',
    priceByGrade: {
      'TK': 200000,
      'SD': 300000,
      'PONDOK': 500000,
      '1': 250000,
      '2': 250000,
      '3': 250000,
      '4': 300000,
      '5': 300000,
      '6': 300000,
    },
    dueDayOfMonth: 10,
    gracePeriodDays: 7,
    latePenaltyType: 'FIXED',
    latePenaltyAmount: 25000,
    maxPenalty: 100000,
    allowSiblingDiscount: true,
    siblingDiscountPercent: 10,
    allowScholarshipDiscount: true,
    isActive: true,
    sortOrder: 1,
  },
  {
    name: 'Daftar Ulang',
    category: 'REGISTRATION',
    description: 'Biaya daftar ulang tahunan',
    isRecurring: true,
    frequency: 'ANNUALLY',
    priceByGrade: {
      'TK': 500000,
      'SD': 750000,
      'PONDOK': 1000000,
    },
    dueDayOfMonth: 15,
    gracePeriodDays: 14,
    latePenaltyType: 'PERCENTAGE',
    latePenaltyAmount: 5,
    maxPenalty: 200000,
    allowSiblingDiscount: true,
    siblingDiscountPercent: 15,
    allowScholarshipDiscount: true,
    isActive: true,
    sortOrder: 2,
  },
  {
    name: 'Seragam',
    category: 'MATERIAL',
    description: 'Pembelian seragam sekolah',
    isRecurring: false,
    frequency: 'ONE_TIME',
    defaultAmount: 200000,
    priceByGrade: {
      'TK': 150000,
      'SD': 200000,
      'PONDOK': 250000,
    },
    gracePeriodDays: 14,
    latePenaltyType: 'NONE',
    allowSiblingDiscount: false,
    allowScholarshipDiscount: true,
    isActive: true,
    sortOrder: 3,
  },
  {
    name: 'Buku Pelajaran',
    category: 'MATERIAL',
    description: 'Pembelian buku pelajaran',
    isRecurring: true,
    frequency: 'ANNUALLY',
    priceByGrade: {
      'TK': 150000,
      'SD': 250000,
      'PONDOK': 400000,
      '1': 200000,
      '2': 200000,
      '3': 200000,
      '4': 250000,
      '5': 250000,
      '6': 250000,
    },
    gracePeriodDays: 14,
    latePenaltyType: 'FIXED',
    latePenaltyAmount: 15000,
    allowSiblingDiscount: true,
    siblingDiscountPercent: 5,
    allowScholarshipDiscount: true,
    isActive: true,
    sortOrder: 4,
  },
  {
    name: 'Kegiatan Ekstrakurikuler',
    category: 'ACTIVITY',
    description: 'Biaya kegiatan ekstrakurikuler',
    isRecurring: false,
    frequency: 'ONE_TIME',
    defaultAmount: 100000,
    gracePeriodDays: 7,
    latePenaltyType: 'NONE',
    allowSiblingDiscount: false,
    allowScholarshipDiscount: false,
    isActive: true,
    sortOrder: 5,
  },
  {
    name: 'Study Tour',
    category: 'ACTIVITY',
    description: 'Biaya study tour dan karyawisata',
    isRecurring: false,
    frequency: 'ONE_TIME',
    priceByGrade: {
      'TK': 300000,
      'SD': 500000,
      'PONDOK': 750000,
    },
    gracePeriodDays: 14,
    latePenaltyType: 'NONE',
    allowSiblingDiscount: true,
    siblingDiscountPercent: 10,
    allowScholarshipDiscount: true,
    isActive: true,
    sortOrder: 6,
  },
  {
    name: 'Ujian Semester',
    category: 'OTHER',
    description: 'Biaya ujian semester dan evaluasi',
    isRecurring: true,
    frequency: 'QUARTERLY',
    priceByGrade: {
      'SD': 75000,
      'PONDOK': 100000,
    },
    gracePeriodDays: 7,
    latePenaltyType: 'FIXED',
    latePenaltyAmount: 10000,
    allowSiblingDiscount: true,
    siblingDiscountPercent: 5,
    allowScholarshipDiscount: true,
    isActive: true,
    sortOrder: 7,
  },
];

export const defaultBillingSettings = [
  {
    key: 'ENABLE_AUTO_BILL_GENERATION',
    value: 'true',
    category: 'AUTOMATION',
    description: 'Automatically generate monthly bills',
    dataType: 'BOOLEAN',
  },
  {
    key: 'DEFAULT_PAYMENT_REMINDER_DAYS',
    value: '3,7,14',
    category: 'NOTIFICATIONS',
    description: 'Days before due date to send payment reminders',
    dataType: 'STRING',
  },
  {
    key: 'MAX_PAYMENT_AMOUNT',
    value: '10000000',
    category: 'GENERAL',
    description: 'Maximum payment amount allowed',
    dataType: 'NUMBER',
  },
  {
    key: 'PAYMENT_VERIFICATION_REQUIRED',
    value: 'true',
    category: 'GENERAL',
    description: 'Require admin verification for payments',
    dataType: 'BOOLEAN',
  },
  {
    key: 'SIBLING_DISCOUNT_ENABLED',
    value: 'true',
    category: 'DISCOUNTS',
    description: 'Enable automatic sibling discounts',
    dataType: 'BOOLEAN',
  },
  {
    key: 'LATE_PENALTY_ENABLED',
    value: 'true',
    category: 'PENALTIES',
    description: 'Enable late payment penalties',
    dataType: 'BOOLEAN',
  },
  {
    key: 'BANK_ACCOUNT_INFO',
    value: JSON.stringify({
      bankName: 'Bank BCA',
      accountNumber: '1234567890',
      accountName: 'Pondok Pesantren Imam Syafi\'i',
      branch: 'Surabaya',
    }),
    category: 'GENERAL',
    description: 'Bank account information for payments',
    dataType: 'JSON',
  },
  {
    key: 'QRIS_CODE_URL',
    value: 'https://example.com/qris-code.png',
    category: 'GENERAL',
    description: 'QRIS code image URL for payments',
    dataType: 'STRING',
  },
  {
    key: 'PAYMENT_CONFIRMATION_EMAIL_TEMPLATE',
    value: `
Assalamu'alaikum Wr. Wb.

Terima kasih atas pembayaran yang telah dilakukan:

Nama Siswa: {{studentName}}
Jenis Tagihan: {{billType}}
Jumlah: {{amount}}
Tanggal Pembayaran: {{paymentDate}}
Status: {{status}}

Untuk informasi lebih lanjut, hubungi bagian keuangan.

Wassalamu'alaikum Wr. Wb.
Tim Keuangan Pondok Pesantren Imam Syafi'i
    `.trim(),
    category: 'NOTIFICATIONS',
    description: 'Email template for payment confirmations',
    dataType: 'STRING',
  },
  {
    key: 'OVERDUE_NOTICE_EMAIL_TEMPLATE',
    value: `
Assalamu'alaikum Wr. Wb.

Kami ingatkan bahwa ada tagihan yang sudah melewati tanggal jatuh tempo:

Nama Siswa: {{studentName}}
Jenis Tagihan: {{billType}}
Jumlah: {{amount}}
Tanggal Jatuh Tempo: {{dueDate}}
Terlambat: {{daysPastDue}} hari

Mohon segera lakukan pembayaran untuk menghindari denda keterlambatan.

Wassalamu'alaikum Wr. Wb.
Tim Keuangan Pondok Pesantren Imam Syafi'i
    `.trim(),
    category: 'NOTIFICATIONS',
    description: 'Email template for overdue payment notices',
    dataType: 'STRING',
  },
];

export async function seedBillingData(prisma: any) {
  console.log('🌱 Seeding billing data...');

  try {
    // Seed bill types
    console.log('📋 Creating bill types...');
    for (const billType of defaultBillTypes) {
      const existing = await prisma.bill_types.findUnique({
        where: { name: billType.name },
      });

      if (!existing) {
        await prisma.bill_types.create({
          data: {
            ...billType,
            priceByGrade: JSON.stringify(billType.priceByGrade),
          },
        });
        console.log(`✅ Created bill type: ${billType.name}`);
      } else {
        console.log(`⏭️  Bill type already exists: ${billType.name}`);
      }
    }

    // Seed billing settings
    console.log('⚙️  Creating billing settings...');
    for (const setting of defaultBillingSettings) {
      const existing = await prisma.billsingSetting.findUnique({
        where: { key: setting.key },
      });

      if (!existing) {
        await prisma.billsingSetting.create({
          data: setting,
        });
        console.log(`✅ Created billing setting: ${setting.key}`);
      } else {
        console.log(`⏭️  Billing setting already exists: ${setting.key}`);
      }
    }

    console.log('🎉 Billing data seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding billing data:', error);
    throw error;
  }
}