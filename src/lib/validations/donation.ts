import { z } from 'zod';

const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;

export const donationSchema = z.object({
  campaignId: z
    .string()
    .uuid('ID kampanye tidak valid')
    .optional()
    .or(z.literal('')),
  categoryId: z.string().uuid('Kategori donasi wajib dipilih'),
  amount: z
    .number({
      required_error: 'Nominal donasi wajib diisi',
      invalid_type_error: 'Nominal harus berupa angka',
    })
    .positive('Nominal harus lebih dari 0')
    .min(10000, 'Nominal donasi minimal Rp 10.000')
    .max(1000000000, 'Nominal donasi maksimal Rp 1.000.000.000'),
  message: z
    .string()
    .max(500, 'Pesan maksimal 500 karakter')
    .optional()
    .or(z.literal('')),
  donorName: z
    .string()
    .min(3, 'Nama minimal 3 karakter')
    .max(100, 'Nama maksimal 100 karakter')
    .optional()
    .or(z.literal('')),
  donorEmail: z
    .string()
    .email('Format email tidak valid')
    .max(100, 'Email maksimal 100 karakter')
    .optional()
    .or(z.literal('')),
  donorPhone: z
    .string()
    .regex(phoneRegex, 'Format nomor telepon tidak valid')
    .optional()
    .or(z.literal('')),
  isAnonymous: z.boolean().default(false),
  paymentMethod: z.enum(
    [
      'BANK_TRANSFER',
      'VIRTUAL_ACCOUNT',
      'QRIS',
      'E_WALLET',
      'CREDIT_CARD',
      'CASH',
      'OTHER',
    ],
    {
      required_error: 'Metode pembayaran wajib dipilih',
    }
  ),
});

export type DonationInput = z.infer<typeof donationSchema>;

export const otaSponsorSchema = z.object({
  programId: z.string().uuid('ID program tidak valid'),
  amount: z
    .number({
      required_error: 'Nominal donasi wajib diisi',
      invalid_type_error: 'Nominal harus berupa angka',
    })
    .positive('Nominal harus lebih dari 0')
    .min(50000, 'Nominal donasi OTA minimal Rp 50.000'),
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Format bulan tidak valid (YYYY-MM)'),
  donorName: z
    .string()
    .min(3, 'Nama minimal 3 karakter')
    .max(100, 'Nama maksimal 100 karakter'),
  donorEmail: z
    .string()
    .email('Format email tidak valid')
    .max(100, 'Email maksimal 100 karakter')
    .optional()
    .or(z.literal('')),
  donorPhone: z
    .string()
    .regex(phoneRegex, 'Format nomor telepon tidak valid')
    .optional()
    .or(z.literal('')),
  publicName: z
    .string()
    .max(100, 'Nama publik maksimal 100 karakter')
    .default('Hamba Allah'),
  isRecurring: z.boolean().default(false),
  allowPublicDisplay: z.boolean().default(true),
  allowContact: z.boolean().default(false),
  donorMessage: z
    .string()
    .max(500, 'Pesan maksimal 500 karakter')
    .optional()
    .or(z.literal('')),
  paymentMethod: z.enum(
    [
      'BANK_TRANSFER',
      'VIRTUAL_ACCOUNT',
      'QRIS',
      'E_WALLET',
      'CASH',
      'OTHER',
    ],
    {
      required_error: 'Metode pembayaran wajib dipilih',
    }
  ),
});

export type OTASponsorInput = z.infer<typeof otaSponsorSchema>;

export const zakatCalculationSchema = z.object({
  calculationType: z.enum(
    ['MAL', 'PENGHASILAN', 'PERDAGANGAN', 'PERTANIAN', 'EMAS_PERAK', 'FITRAH'],
    {
      required_error: 'Jenis zakat wajib dipilih',
    }
  ),
  // For Zakat Mal
  totalAssets: z
    .number()
    .nonnegative('Jumlah harta tidak boleh negatif')
    .optional(),
  totalDebts: z
    .number()
    .nonnegative('Jumlah hutang tidak boleh negatif')
    .optional(),
  // For Zakat Penghasilan
  monthlyIncome: z
    .number()
    .nonnegative('Penghasilan tidak boleh negatif')
    .optional(),
  monthlyExpenses: z
    .number()
    .nonnegative('Pengeluaran tidak boleh negatif')
    .optional(),
  // For Zakat Perdagangan
  businessCapital: z
    .number()
    .nonnegative('Modal usaha tidak boleh negatif')
    .optional(),
  businessProfit: z
    .number()
    .nonnegative('Keuntungan tidak boleh negatif')
    .optional(),
  // For Zakat Pertanian
  harvestQuantity: z
    .number()
    .nonnegative('Jumlah panen tidak boleh negatif')
    .optional(),
  irrigationType: z
    .enum(['HUJAN', 'IRIGASI'])
    .optional(),
  // For Zakat Emas/Perak
  goldWeight: z
    .number()
    .nonnegative('Berat emas tidak boleh negatif')
    .optional(),
  silverWeight: z
    .number()
    .nonnegative('Berat perak tidak boleh negatif')
    .optional(),
  goldPrice: z
    .number()
    .positive('Harga emas harus lebih dari 0')
    .optional(),
  silverPrice: z
    .number()
    .positive('Harga perak harus lebih dari 0')
    .optional(),
  // For Zakat Fitrah
  numberOfPeople: z
    .number()
    .int('Jumlah orang harus bilangan bulat')
    .positive('Jumlah orang harus lebih dari 0')
    .optional(),
  ricePrice: z
    .number()
    .positive('Harga beras harus lebih dari 0')
    .optional(),
  // Optional donor info
  donorName: z
    .string()
    .max(100, 'Nama maksimal 100 karakter')
    .optional()
    .or(z.literal('')),
  donorEmail: z
    .string()
    .email('Format email tidak valid')
    .optional()
    .or(z.literal('')),
  donorPhone: z
    .string()
    .regex(phoneRegex, 'Format nomor telepon tidak valid')
    .optional()
    .or(z.literal('')),
});

export type ZakatCalculationInput = z.infer<typeof zakatCalculationSchema>;

export const campaignSchema = z.object({
  title: z
    .string()
    .min(10, 'Judul minimal 10 karakter')
    .max(200, 'Judul maksimal 200 karakter'),
  slug: z
    .string()
    .min(5, 'Slug minimal 5 karakter')
    .max(200, 'Slug maksimal 200 karakter')
    .regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung'),
  description: z
    .string()
    .min(50, 'Deskripsi minimal 50 karakter')
    .max(5000, 'Deskripsi maksimal 5000 karakter'),
  story: z
    .string()
    .max(10000, 'Cerita maksimal 10000 karakter')
    .optional()
    .or(z.literal('')),
  categoryId: z.string().uuid('Kategori kampanye wajib dipilih'),
  targetAmount: z
    .number()
    .positive('Target donasi harus lebih dari 0')
    .min(100000, 'Target donasi minimal Rp 100.000'),
  startDate: z.coerce.date({
    required_error: 'Tanggal mulai wajib diisi',
  }),
  endDate: z.coerce
    .date()
    .optional(),
  mainImage: z
    .string()
    .url('Format URL gambar tidak valid')
    .optional()
    .or(z.literal('')),
  video: z
    .string()
    .url('Format URL video tidak valid')
    .optional()
    .or(z.literal('')),
  status: z
    .enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'])
    .default('DRAFT'),
  isFeatured: z.boolean().default(false),
  isUrgent: z.boolean().default(false),
  allowAnonymous: z.boolean().default(true),
});

export type CampaignInput = z.infer<typeof campaignSchema>;

export const paymentProofSchema = z.object({
  proofUrl: z.string().url('Format URL bukti pembayaran tidak valid'),
});

export type PaymentProofInput = z.infer<typeof paymentProofSchema>;
