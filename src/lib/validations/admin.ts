import { z } from 'zod'

// Site Configuration Validation
export const siteConfigSchema = z.object({
  logo: z.string().url().optional().or(z.literal('')),
  logoWhite: z.string().url().optional().or(z.literal('')),
  favicon: z.string().url().optional().or(z.literal('')),
  siteName: z.string().min(1, 'Nama situs harus diisi'),
  siteDescription: z.string().min(1, 'Deskripsi situs harus diisi'),
  contactEmail: z.string().email('Email tidak valid'),
  contactPhone: z.string().min(1, 'Telepon harus diisi'),
  contactWhatsapp: z.string().min(1, 'WhatsApp harus diisi'),
  address: z.string().min(1, 'Alamat harus diisi'),
  facebook: z.string().url().optional().or(z.literal('')),
  instagram: z.string().url().optional().or(z.literal('')),
  youtube: z.string().url().optional().or(z.literal('')),
  twitter: z.string().url().optional().or(z.literal('')),
  linkedIn: z.string().url().optional().or(z.literal('')),
})

// Organization Validation
export const organizationSchema = z.object({
  yayasanName: z.string().min(1, 'Nama yayasan harus diisi'),
  yayasanDescription: z.string().optional(),
  yayasanFoundedYear: z.string().optional(),
  yayasanLegalNo: z.string().optional(),
  vision: z.string().optional(),
  missions: z.array(z.string()).optional(),
  tkInfo: z.object({
    name: z.string(),
    description: z.string().optional(),
    headmaster: z.string().optional(),
    accreditation: z.string().optional(),
    capacity: z.string().optional(),
    programs: z.array(z.string()).optional(),
  }).optional(),
  sdInfo: z.object({
    name: z.string(),
    description: z.string().optional(),
    headmaster: z.string().optional(),
    accreditation: z.string().optional(),
    capacity: z.string().optional(),
    programs: z.array(z.string()).optional(),
  }).optional(),
  pondokInfo: z.object({
    name: z.string(),
    description: z.string().optional(),
    headmaster: z.string().optional(),
    accreditation: z.string().optional(),
    capacity: z.string().optional(),
    programs: z.array(z.string()).optional(),
  }).optional(),
})

// Financial Transaction Validation
export const transactionSchema = z.object({
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Tanggal tidak valid',
  }),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1, 'Kategori harus dipilih'),
  amount: z.string().refine((val) => parseFloat(val) > 0, {
    message: 'Jumlah harus lebih dari 0',
  }),
  description: z.string().min(1, 'Keterangan harus diisi'),
  reference: z.string().optional(),
})

export const bulkTransactionSchema = z.object({
  transactions: z.array(transactionSchema).min(1, 'Minimal 1 transaksi'),
})

// Financial Category Validation
export const financialCategorySchema = z.object({
  name: z.string().min(1, 'Nama kategori harus diisi'),
  type: z.enum(['INCOME', 'EXPENSE']),
  code: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
})

// Article Validation
export const articleSchema = z.object({
  title: z.string().min(1, 'Judul harus diisi').max(200, 'Judul maksimal 200 karakter'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan dash').optional(),
  excerpt: z.string().max(500, 'Ringkasan maksimal 500 karakter').optional(),
  content: z.string().min(1, 'Konten harus diisi'),
  featuredImage: z.string().url().optional().or(z.literal('')),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  seoTitle: z.string().max(60, 'SEO Title maksimal 60 karakter').optional(),
  seoDescription: z.string().max(160, 'SEO Description maksimal 160 karakter').optional(),
  seoKeywords: z.array(z.string()).optional(),
  ogImage: z.string().url().optional().or(z.literal('')),
})

// SEO Configuration Validation
export const seoConfigSchema = z.object({
  siteTitle: z.string().min(1, 'Site title harus diisi').max(60, 'Site title maksimal 60 karakter'),
  siteDescription: z.string().min(1, 'Site description harus diisi').max(160, 'Site description maksimal 160 karakter'),
  siteKeywords: z.array(z.string()).optional(),
  author: z.string().optional(),
  twitterHandle: z.string().optional(),
  fbAppId: z.string().optional(),
  ogDefaultImage: z.string().url().optional().or(z.literal('')),
  googleSiteVerification: z.string().optional(),
  googleAnalyticsId: z.string().optional(),
  facebookPixelId: z.string().optional(),
  robots: z.string().optional(),
  canonicalUrl: z.string().url().optional().or(z.literal('')),
})

// Campaign Validation (from existing pattern)
export const campaignSchema = z.object({
  title: z.string().min(1, 'Judul harus diisi'),
  slug: z.string().optional(),
  categoryId: z.string().min(1, 'Kategori harus dipilih'),
  description: z.string().min(1, 'Deskripsi harus diisi'),
  story: z.string().optional(),
  targetAmount: z.number().positive('Target harus lebih dari 0'),
  startDate: z.string(),
  endDate: z.string().optional(),
  mainImage: z.string().url().optional().or(z.literal('')),
  images: z.array(z.string().url()).optional(),
  video: z.string().url().optional().or(z.literal('')),
  status: z.enum(['DRAFT', 'ACTIVE', 'CLOSED', 'COMPLETED', 'CANCELLED', 'REDIRECTED']),
  isFeatured: z.boolean().optional(),
  isUrgent: z.boolean().optional(),
  allowAnonymous: z.boolean().optional(),
})

// Helper function to validate data
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      }
    }
    return {
      success: false,
      errors: ['Validation failed']
    }
  }
}
