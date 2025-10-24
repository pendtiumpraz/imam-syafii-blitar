import { z } from 'zod';

const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
const nikRegex = /^[0-9]{16}$/;
const nisnRegex = /^[0-9]{10}$/;

export const ppdbRegistrationSchema = z.object({
  // Personal Information
  fullName: z
    .string()
    .min(3, 'Nama lengkap minimal 3 karakter')
    .max(100, 'Nama lengkap maksimal 100 karakter')
    .regex(/^[a-zA-Z\s.,']+$/, 'Nama hanya boleh mengandung huruf'),
  nickname: z
    .string()
    .min(2, 'Nama panggilan minimal 2 karakter')
    .max(50, 'Nama panggilan maksimal 50 karakter')
    .optional()
    .or(z.literal('')),
  birthPlace: z
    .string()
    .min(2, 'Tempat lahir minimal 2 karakter')
    .max(100, 'Tempat lahir maksimal 100 karakter'),
  birthDate: z.coerce
    .date({
      required_error: 'Tanggal lahir wajib diisi',
      invalid_type_error: 'Format tanggal tidak valid',
    })
    .refine(
      (date) => {
        const age = new Date().getFullYear() - date.getFullYear();
        return age >= 3 && age <= 25;
      },
      {
        message: 'Usia harus antara 3-25 tahun',
      }
    ),
  gender: z.enum(['LAKI_LAKI', 'PEREMPUAN'], {
    required_error: 'Jenis kelamin wajib dipilih',
  }),
  bloodType: z
    .enum(['A', 'B', 'AB', 'O'])
    .optional()
    .or(z.literal('')),
  religion: z.string().default('ISLAM'),
  nationality: z.string().default('INDONESIA'),

  // Identification Numbers
  nik: z
    .string()
    .regex(nikRegex, 'NIK harus 16 digit angka')
    .optional()
    .or(z.literal('')),
  nisn: z
    .string()
    .regex(nisnRegex, 'NISN harus 10 digit angka')
    .optional()
    .or(z.literal('')),
  birthCertNo: z
    .string()
    .max(50, 'Nomor akta maksimal 50 karakter')
    .optional()
    .or(z.literal('')),
  familyCardNo: z
    .string()
    .max(20, 'Nomor KK maksimal 20 karakter')
    .optional()
    .or(z.literal('')),

  // Contact Information
  phone: z
    .string()
    .regex(phoneRegex, 'Format nomor telepon tidak valid')
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .email('Format email tidak valid')
    .optional()
    .or(z.literal('')),

  // Address
  address: z
    .string()
    .min(10, 'Alamat minimal 10 karakter')
    .max(500, 'Alamat maksimal 500 karakter'),
  rt: z
    .string()
    .max(5, 'RT maksimal 5 karakter')
    .optional()
    .or(z.literal('')),
  rw: z
    .string()
    .max(5, 'RW maksimal 5 karakter')
    .optional()
    .or(z.literal('')),
  village: z
    .string()
    .min(2, 'Desa/Kelurahan minimal 2 karakter')
    .max(100, 'Desa/Kelurahan maksimal 100 karakter'),
  district: z
    .string()
    .min(2, 'Kecamatan minimal 2 karakter')
    .max(100, 'Kecamatan maksimal 100 karakter'),
  city: z
    .string()
    .min(2, 'Kota/Kabupaten minimal 2 karakter')
    .max(100, 'Kota/Kabupaten maksimal 100 karakter'),
  province: z
    .string()
    .min(2, 'Provinsi minimal 2 karakter')
    .max(100, 'Provinsi maksimal 100 karakter'),
  postalCode: z
    .string()
    .regex(/^[0-9]{5}$/, 'Kode pos harus 5 digit')
    .optional()
    .or(z.literal('')),

  // Education Background
  level: z.enum(['TK', 'SD', 'SMP', 'PONDOK'], {
    required_error: 'Jenjang pendidikan wajib dipilih',
  }),
  previousSchool: z
    .string()
    .max(200, 'Nama sekolah maksimal 200 karakter')
    .optional()
    .or(z.literal('')),
  previousGrade: z
    .string()
    .max(20, 'Kelas terakhir maksimal 20 karakter')
    .optional()
    .or(z.literal('')),
  previousNISN: z
    .string()
    .regex(nisnRegex, 'NISN harus 10 digit angka')
    .optional()
    .or(z.literal('')),
  graduationYear: z
    .number()
    .int()
    .min(2000, 'Tahun lulus minimal 2000')
    .max(new Date().getFullYear(), 'Tahun lulus tidak boleh melebihi tahun ini')
    .optional(),

  // Father Information
  fatherName: z
    .string()
    .min(3, 'Nama ayah minimal 3 karakter')
    .max(100, 'Nama ayah maksimal 100 karakter'),
  fatherNIK: z
    .string()
    .regex(nikRegex, 'NIK ayah harus 16 digit angka')
    .optional()
    .or(z.literal('')),
  fatherBirth: z.coerce
    .date()
    .optional(),
  fatherEducation: z
    .string()
    .max(50, 'Pendidikan ayah maksimal 50 karakter')
    .optional()
    .or(z.literal('')),
  fatherOccupation: z
    .string()
    .max(100, 'Pekerjaan ayah maksimal 100 karakter')
    .optional()
    .or(z.literal('')),
  fatherPhone: z
    .string()
    .regex(phoneRegex, 'Format nomor telepon ayah tidak valid')
    .optional()
    .or(z.literal('')),
  fatherIncome: z
    .number()
    .nonnegative('Penghasilan tidak boleh negatif')
    .optional(),

  // Mother Information
  motherName: z
    .string()
    .min(3, 'Nama ibu minimal 3 karakter')
    .max(100, 'Nama ibu maksimal 100 karakter'),
  motherNIK: z
    .string()
    .regex(nikRegex, 'NIK ibu harus 16 digit angka')
    .optional()
    .or(z.literal('')),
  motherBirth: z.coerce
    .date()
    .optional(),
  motherEducation: z
    .string()
    .max(50, 'Pendidikan ibu maksimal 50 karakter')
    .optional()
    .or(z.literal('')),
  motherOccupation: z
    .string()
    .max(100, 'Pekerjaan ibu maksimal 100 karakter')
    .optional()
    .or(z.literal('')),
  motherPhone: z
    .string()
    .regex(phoneRegex, 'Format nomor telepon ibu tidak valid')
    .optional()
    .or(z.literal('')),
  motherIncome: z
    .number()
    .nonnegative('Penghasilan tidak boleh negatif')
    .optional(),

  // Guardian Information (optional)
  guardianName: z
    .string()
    .max(100, 'Nama wali maksimal 100 karakter')
    .optional()
    .or(z.literal('')),
  guardianNIK: z
    .string()
    .regex(nikRegex, 'NIK wali harus 16 digit angka')
    .optional()
    .or(z.literal('')),
  guardianRelation: z
    .string()
    .max(50, 'Hubungan dengan wali maksimal 50 karakter')
    .optional()
    .or(z.literal('')),
  guardianPhone: z
    .string()
    .regex(phoneRegex, 'Format nomor telepon wali tidak valid')
    .optional()
    .or(z.literal('')),
  guardianAddress: z
    .string()
    .max(500, 'Alamat wali maksimal 500 karakter')
    .optional()
    .or(z.literal('')),

  // Health Information
  hasSpecialNeeds: z.boolean().default(false),
  specialNeeds: z
    .string()
    .max(500, 'Kebutuhan khusus maksimal 500 karakter')
    .optional()
    .or(z.literal('')),
  healthConditions: z
    .string()
    .max(500, 'Kondisi kesehatan maksimal 500 karakter')
    .optional()
    .or(z.literal('')),
  allergies: z
    .string()
    .max(500, 'Alergi maksimal 500 karakter')
    .optional()
    .or(z.literal('')),
});

export type PPDBRegistrationInput = z.infer<typeof ppdbRegistrationSchema>;

export const ppdbDocumentUploadSchema = z.object({
  photoUrl: z
    .string()
    .url('Format URL foto tidak valid')
    .optional(),
  birthCertUrl: z
    .string()
    .url('Format URL akta kelahiran tidak valid')
    .optional(),
  familyCardUrl: z
    .string()
    .url('Format URL kartu keluarga tidak valid')
    .optional(),
  transcriptUrl: z
    .string()
    .url('Format URL rapor tidak valid')
    .optional(),
});

export type PPDBDocumentUpload = z.infer<typeof ppdbDocumentUploadSchema>;

// File validation for upload
export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: 'Ukuran file maksimal 5MB',
    })
    .refine(
      (file) => ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'].includes(file.type),
      {
        message: 'Format file harus JPG, PNG, atau PDF',
      }
    ),
});

export const multipleFileUploadSchema = z.object({
  files: z
    .array(z.instanceof(File))
    .max(5, 'Maksimal 5 file')
    .refine(
      (files) => files.every((file) => file.size <= 5 * 1024 * 1024),
      {
        message: 'Setiap file maksimal 5MB',
      }
    )
    .refine(
      (files) =>
        files.every((file) =>
          ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'].includes(file.type)
        ),
      {
        message: 'Setiap file harus format JPG, PNG, atau PDF',
      }
    ),
});
