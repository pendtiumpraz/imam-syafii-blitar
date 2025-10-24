import { z } from 'zod';

const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;

export const contactSchema = z.object({
  name: z
    .string()
    .min(3, 'Nama minimal 3 karakter')
    .max(100, 'Nama maksimal 100 karakter'),
  email: z
    .string()
    .email('Format email tidak valid')
    .max(100, 'Email maksimal 100 karakter'),
  phone: z
    .string()
    .regex(phoneRegex, 'Format nomor telepon tidak valid')
    .optional()
    .or(z.literal('')),
  subject: z
    .string()
    .min(5, 'Subjek minimal 5 karakter')
    .max(200, 'Subjek maksimal 200 karakter'),
  message: z
    .string()
    .min(10, 'Pesan minimal 10 karakter')
    .max(1000, 'Pesan maksimal 1000 karakter'),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const questionSchema = z.object({
  question: z
    .string()
    .min(10, 'Pertanyaan minimal 10 karakter')
    .max(1000, 'Pertanyaan maksimal 1000 karakter'),
  category: z.enum(['AQIDAH', 'FIQIH', 'AKHLAK', 'MUAMALAH', 'LAINNYA'], {
    required_error: 'Kategori wajib dipilih',
  }),
  askerName: z
    .string()
    .min(3, 'Nama minimal 3 karakter')
    .max(100, 'Nama maksimal 100 karakter')
    .optional()
    .or(z.literal('')),
  isAnonymous: z.boolean().default(false),
});

export type QuestionInput = z.infer<typeof questionSchema>;

export const urlSchema = z.object({
  url: z.string().url('Format URL tidak valid'),
});

export const socialLinkSchema = z.object({
  facebook: z
    .string()
    .url('Format URL Facebook tidak valid')
    .optional()
    .or(z.literal('')),
  instagram: z
    .string()
    .url('Format URL Instagram tidak valid')
    .optional()
    .or(z.literal('')),
  twitter: z
    .string()
    .url('Format URL Twitter tidak valid')
    .optional()
    .or(z.literal('')),
  linkedin: z
    .string()
    .url('Format URL LinkedIn tidak valid')
    .optional()
    .or(z.literal('')),
  youtube: z
    .string()
    .url('Format URL YouTube tidak valid')
    .optional()
    .or(z.literal('')),
  whatsapp: z
    .string()
    .regex(phoneRegex, 'Format nomor WhatsApp tidak valid')
    .optional()
    .or(z.literal('')),
});

export type SocialLinkInput = z.infer<typeof socialLinkSchema>;

export const paginationSchema = z.object({
  page: z
    .number()
    .int('Halaman harus bilangan bulat')
    .positive('Halaman harus lebih dari 0')
    .default(1),
  limit: z
    .number()
    .int('Limit harus bilangan bulat')
    .positive('Limit harus lebih dari 0')
    .max(100, 'Limit maksimal 100')
    .default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export const searchSchema = z.object({
  query: z
    .string()
    .min(2, 'Query pencarian minimal 2 karakter')
    .max(200, 'Query pencarian maksimal 200 karakter'),
  filters: z.record(z.any()).optional(),
  ...paginationSchema.shape,
});

export type SearchInput = z.infer<typeof searchSchema>;

export const idSchema = z.object({
  id: z.string().uuid('ID tidak valid'),
});

export const slugSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug wajib diisi')
    .regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung'),
});

export const emailSchema = z.object({
  email: z.string().email('Format email tidak valid'),
});

export const phoneSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Format nomor telepon tidak valid'),
});

export const dateRangeSchema = z.object({
  startDate: z.coerce.date({
    required_error: 'Tanggal mulai wajib diisi',
  }),
  endDate: z.coerce
    .date({
      required_error: 'Tanggal selesai wajib diisi',
    })
    .refine(
      (endDate) => {
        return true; // Will be validated in superRefine
      },
      {
        message: 'Tanggal selesai harus setelah tanggal mulai',
      }
    ),
}).superRefine((data, ctx) => {
  if (data.endDate < data.startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Tanggal selesai harus setelah tanggal mulai',
      path: ['endDate'],
    });
  }
});

export type DateRangeInput = z.infer<typeof dateRangeSchema>;

// File validation helpers
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const DOCUMENT_MIME_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

export function validateFileSize(size: number, maxSize: number = MAX_FILE_SIZE): boolean {
  return size <= maxSize;
}

export function validateFileType(type: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(type);
}

export function validateImage(file: File): { valid: boolean; error?: string } {
  if (!validateFileSize(file.size, MAX_IMAGE_SIZE)) {
    return { valid: false, error: 'Ukuran gambar maksimal 2MB' };
  }
  if (!validateFileType(file.type, IMAGE_MIME_TYPES)) {
    return { valid: false, error: 'Format gambar harus JPG, PNG, atau WEBP' };
  }
  return { valid: true };
}

export function validateDocument(file: File): { valid: boolean; error?: string } {
  if (!validateFileSize(file.size, MAX_FILE_SIZE)) {
    return { valid: false, error: 'Ukuran dokumen maksimal 5MB' };
  }
  if (!validateFileType(file.type, [...IMAGE_MIME_TYPES, ...DOCUMENT_MIME_TYPES])) {
    return { valid: false, error: 'Format dokumen tidak didukung' };
  }
  return { valid: true };
}
