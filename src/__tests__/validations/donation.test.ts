import { describe, it, expect } from '@jest/globals';
import {
  donationSchema,
  otaSponsorSchema,
  zakatCalculationSchema,
  campaignSchema,
} from '@/lib/validations/donation';

describe('Donation Validation', () => {
  const validDonation = {
    categoryId: '550e8400-e29b-41d4-a716-446655440000',
    amount: 100000,
    paymentMethod: 'BANK_TRANSFER' as const,
  };

  it('should accept valid donation', () => {
    const result = donationSchema.safeParse(validDonation);
    expect(result.success).toBe(true);
  });

  it('should reject amount below minimum', () => {
    const data = { ...validDonation, amount: 5000 };
    const result = donationSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('minimal Rp 10.000');
    }
  });

  it('should reject amount above maximum', () => {
    const data = { ...validDonation, amount: 1100000000 };
    const result = donationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should reject negative amount', () => {
    const data = { ...validDonation, amount: -1000 };
    const result = donationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should accept optional campaign ID', () => {
    const data = {
      ...validDonation,
      campaignId: '550e8400-e29b-41d4-a716-446655440001',
    };
    const result = donationSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should accept valid donor information', () => {
    const data = {
      ...validDonation,
      donorName: 'Ahmad Abdullah',
      donorEmail: 'ahmad@example.com',
      donorPhone: '081234567890',
      message: 'Semoga bermanfaat',
    };
    const result = donationSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const data = {
      ...validDonation,
      donorEmail: 'invalid-email',
    };
    const result = donationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should reject invalid phone', () => {
    const data = {
      ...validDonation,
      donorPhone: '12345',
    };
    const result = donationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should accept anonymous donation', () => {
    const data = {
      ...validDonation,
      isAnonymous: true,
    };
    const result = donationSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

describe('OTA Sponsor Validation', () => {
  const validSponsor = {
    programId: '550e8400-e29b-41d4-a716-446655440000',
    amount: 500000,
    month: '2024-12',
    donorName: 'Ahmad Abdullah',
    paymentMethod: 'BANK_TRANSFER' as const,
  };

  it('should accept valid OTA sponsor', () => {
    const result = otaSponsorSchema.safeParse(validSponsor);
    expect(result.success).toBe(true);
  });

  it('should reject amount below OTA minimum', () => {
    const data = { ...validSponsor, amount: 30000 };
    const result = otaSponsorSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('minimal Rp 50.000');
    }
  });

  it('should reject invalid month format', () => {
    const data = { ...validSponsor, month: '202412' };
    const result = otaSponsorSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should accept valid month format', () => {
    const validMonths = ['2024-01', '2024-12', '2025-06'];
    validMonths.forEach((month) => {
      const data = { ...validSponsor, month };
      const result = otaSponsorSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  it('should accept recurring sponsorship', () => {
    const data = {
      ...validSponsor,
      isRecurring: true,
    };
    const result = otaSponsorSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should accept custom public name', () => {
    const data = {
      ...validSponsor,
      publicName: 'Keluarga Ahmad',
      allowPublicDisplay: true,
    };
    const result = otaSponsorSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

describe('Zakat Calculation Validation', () => {
  it('should accept valid zakat mal calculation', () => {
    const data = {
      calculationType: 'MAL' as const,
      totalAssets: 100000000,
      totalDebts: 10000000,
    };
    const result = zakatCalculationSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should accept valid zakat penghasilan calculation', () => {
    const data = {
      calculationType: 'PENGHASILAN' as const,
      monthlyIncome: 10000000,
      monthlyExpenses: 3000000,
    };
    const result = zakatCalculationSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should accept valid zakat pertanian calculation', () => {
    const data = {
      calculationType: 'PERTANIAN' as const,
      harvestQuantity: 1000,
      irrigationType: 'HUJAN' as const,
    };
    const result = zakatCalculationSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should accept valid zakat emas/perak calculation', () => {
    const data = {
      calculationType: 'EMAS_PERAK' as const,
      goldWeight: 100,
      goldPrice: 1000000,
    };
    const result = zakatCalculationSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should accept valid zakat fitrah calculation', () => {
    const data = {
      calculationType: 'FITRAH' as const,
      numberOfPeople: 5,
      ricePrice: 15000,
    };
    const result = zakatCalculationSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should reject negative values', () => {
    const data = {
      calculationType: 'MAL' as const,
      totalAssets: -100000,
    };
    const result = zakatCalculationSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should accept optional donor information', () => {
    const data = {
      calculationType: 'MAL' as const,
      totalAssets: 100000000,
      donorName: 'Ahmad Abdullah',
      donorEmail: 'ahmad@example.com',
      donorPhone: '081234567890',
    };
    const result = zakatCalculationSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

describe('Campaign Validation', () => {
  const validCampaign = {
    title: 'Pembangunan Masjid Imam Syafii',
    slug: 'pembangunan-masjid-imam-syafii',
    description: 'Kampanye untuk membangun masjid baru di lingkungan pondok pesantren dengan kapasitas 500 jamaah.',
    categoryId: '550e8400-e29b-41d4-a716-446655440000',
    targetAmount: 1000000000,
    startDate: new Date('2024-01-01'),
  };

  it('should accept valid campaign', () => {
    const result = campaignSchema.safeParse(validCampaign);
    expect(result.success).toBe(true);
  });

  it('should reject short title', () => {
    const data = { ...validCampaign, title: 'Short' };
    const result = campaignSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should reject short description', () => {
    const data = { ...validCampaign, description: 'Too short' };
    const result = campaignSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should reject invalid slug format', () => {
    const data = { ...validCampaign, slug: 'Invalid Slug!' };
    const result = campaignSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should accept valid slug format', () => {
    const validSlugs = [
      'pembangunan-masjid',
      'program-tahfidz-2024',
      'bantuan-anak-yatim',
    ];

    validSlugs.forEach((slug) => {
      const data = { ...validCampaign, slug };
      const result = campaignSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  it('should reject target amount below minimum', () => {
    const data = { ...validCampaign, targetAmount: 50000 };
    const result = campaignSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('should accept campaign with end date', () => {
    const data = {
      ...validCampaign,
      endDate: new Date('2024-12-31'),
    };
    const result = campaignSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should accept campaign with media', () => {
    const data = {
      ...validCampaign,
      mainImage: 'https://example.com/image.jpg',
      video: 'https://youtube.com/watch?v=abc123',
    };
    const result = campaignSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should accept campaign flags', () => {
    const data = {
      ...validCampaign,
      isFeatured: true,
      isUrgent: true,
      allowAnonymous: false,
    };
    const result = campaignSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});
