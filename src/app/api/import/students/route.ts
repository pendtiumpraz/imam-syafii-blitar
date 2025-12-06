import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for student import validation
const StudentImportSchema = z.object({
  nisn: z.string().optional(),
  nis: z.string().min(1, 'NIS wajib diisi'),
  fullName: z.string().min(1, 'Nama lengkap wajib diisi'),
  nickname: z.string().optional(),
  birthPlace: z.string().min(1, 'Tempat lahir wajib diisi'),
  birthDate: z.string().min(1, 'Tanggal lahir wajib diisi'),
  gender: z.enum(['MALE', 'FEMALE', 'L', 'P', 'Laki-laki', 'Perempuan']),
  bloodType: z.string().optional(),
  religion: z.string().default('Islam'),
  nationality: z.string().default('Indonesia'),
  address: z.string().min(1, 'Alamat wajib diisi'),
  village: z.string().optional(),
  district: z.string().optional(),
  city: z.string().min(1, 'Kota wajib diisi'),
  province: z.string().default('Jawa Timur'),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  fatherName: z.string().min(1, 'Nama ayah wajib diisi'),
  fatherJob: z.string().optional(),
  fatherPhone: z.string().optional(),
  fatherEducation: z.string().optional(),
  motherName: z.string().min(1, 'Nama ibu wajib diisi'),
  motherJob: z.string().optional(),
  motherPhone: z.string().optional(),
  motherEducation: z.string().optional(),
  guardianName: z.string().optional(),
  guardianJob: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianRelation: z.string().optional(),
  institutionType: z.enum(['KB_TK', 'SD', 'MTQ', 'MSWi', 'MSWa', 'SMP', 'SMA']),
  grade: z.string().optional(),
  enrollmentDate: z.string().min(1, 'Tanggal masuk wajib diisi'),
  enrollmentYear: z.string().min(1, 'Tahun ajaran wajib diisi'),
  previousSchool: z.string().optional(),
  specialNeeds: z.string().optional(),
  status: z.enum(['ACTIVE', 'GRADUATED', 'TRANSFERRED', 'DROPPED']).default('ACTIVE')
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, preview = false } = await request.json();

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    const results = {
      success: true,
      totalRows: data.length,
      validRows: 0,
      errorRows: 0,
      errors: [] as string[],
      duplicates: [] as string[],
      created: [] as any[]
    };

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const rowNumber = i + 2; // Account for header row
      const row = data[i];

      try {
        // Normalize gender values
        if (row.gender) {
          if (['L', 'Laki-laki'].includes(row.gender)) row.gender = 'MALE';
          if (['P', 'Perempuan'].includes(row.gender)) row.gender = 'FEMALE';
        }

        // Normalize date values
        if (row.birthDate) {
          row.birthDate = new Date(row.birthDate).toISOString();
        }
        if (row.enrollmentDate) {
          row.enrollmentDate = new Date(row.enrollmentDate).toISOString();
        }

        // Validate row data
        const validatedData = StudentImportSchema.parse(row);

        // Check for existing student with same NIS or NISN
        const existingStudent = await prisma.students.findFirst({
          where: {
            OR: [
              { nis: validatedData.nis },
              ...(validatedData.nisn ? [{ nisn: validatedData.nisn }] : [])
            ]
          }
        });

        if (existingStudent) {
          results.duplicates.push(`Baris ${rowNumber}: Siswa dengan NIS ${validatedData.nis} sudah ada`);
          results.errorRows++;
          continue;
        }

        if (preview) {
          // For preview, just validate without creating
          results.validRows++;
        } else {
          // Create new student
          const newStudent = await prisma.students.create({
            data: {
              nisn: validatedData.nisn,
              nis: validatedData.nis,
              fullName: validatedData.fullName,
              nickname: validatedData.nickname,
              birthPlace: validatedData.birthPlace,
              birthDate: new Date(validatedData.birthDate),
              gender: validatedData.gender,
              bloodType: validatedData.bloodType,
              religion: validatedData.religion,
              nationality: validatedData.nationality,
              address: validatedData.address,
              village: validatedData.village,
              district: validatedData.district,
              city: validatedData.city,
              province: validatedData.province,
              postalCode: validatedData.postalCode,
              phone: validatedData.phone,
              email: validatedData.email || null,
              fatherName: validatedData.fatherName,
              fatherJob: validatedData.fatherJob,
              fatherPhone: validatedData.fatherPhone,
              fatherEducation: validatedData.fatherEducation,
              motherName: validatedData.motherName,
              motherJob: validatedData.motherJob,
              motherPhone: validatedData.motherPhone,
              motherEducation: validatedData.motherEducation,
              guardianName: validatedData.guardianName,
              guardianJob: validatedData.guardianJob,
              guardianPhone: validatedData.guardianPhone,
              guardianRelation: validatedData.guardianRelation,
              institutionType: validatedData.institutionType,
              grade: validatedData.grade,
              enrollmentDate: new Date(validatedData.enrollmentDate),
              enrollmentYear: validatedData.enrollmentYear,
              previousSchool: validatedData.previousSchool,
              specialNeeds: validatedData.specialNeeds,
              status: validatedData.status,
              createdBy: session.user.id
            }
          });

          results.created.push({
            id: newStudent.id,
            nis: newStudent.nis,
            fullName: newStudent.fullName
          });
          results.validRows++;
        }

      } catch (error) {
        results.errorRows++;
        if (error instanceof z.ZodError) {
          const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
          results.errors.push(`Baris ${rowNumber}: ${errorMessages.join(', ')}`);
        } else {
          results.errors.push(`Baris ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Set overall success based on whether any rows were processed successfully
    results.success = results.validRows > 0;

    return NextResponse.json(results);

  } catch (error) {
    console.error('Import students error:', error);
    return NextResponse.json(
      { error: 'Failed to import students data' },
      { status: 500 }
    );
  }
}

// GET endpoint to return template columns and validation rules
export async function GET() {
  try {
    const templateColumns = [
      { key: 'nisn', header: 'NISN', required: false, example: '0012345678', width: 15 },
      { key: 'nis', header: 'NIS', required: true, example: '20240001', width: 15 },
      { key: 'fullName', header: 'Nama Lengkap', required: true, example: 'Ahmad Fadli Rahman', width: 25 },
      { key: 'nickname', header: 'Nama Panggilan', required: false, example: 'Fadli', width: 15 },
      { key: 'birthPlace', header: 'Tempat Lahir', required: true, example: 'Blitar', width: 15 },
      { key: 'birthDate', header: 'Tanggal Lahir', required: true, example: '2010-05-15', width: 15 },
      { key: 'gender', header: 'Jenis Kelamin', required: true, example: 'L (atau MALE)', width: 15 },
      { key: 'bloodType', header: 'Golongan Darah', required: false, example: 'O', width: 10 },
      { key: 'religion', header: 'Agama', required: false, example: 'Islam', width: 10 },
      { key: 'nationality', header: 'Kewarganegaraan', required: false, example: 'Indonesia', width: 15 },
      { key: 'address', header: 'Alamat', required: true, example: 'Jl. Mawar No. 123', width: 30 },
      { key: 'village', header: 'Desa/Kelurahan', required: false, example: 'Kepanjen Lor', width: 15 },
      { key: 'district', header: 'Kecamatan', required: false, example: 'Kepanjen Kidul', width: 15 },
      { key: 'city', header: 'Kota/Kabupaten', required: true, example: 'Blitar', width: 15 },
      { key: 'province', header: 'Provinsi', required: false, example: 'Jawa Timur', width: 15 },
      { key: 'postalCode', header: 'Kode Pos', required: false, example: '66171', width: 10 },
      { key: 'phone', header: 'Telepon', required: false, example: '081234567890', width: 15 },
      { key: 'email', header: 'Email', required: false, example: 'fadli@email.com', width: 25 },
      { key: 'fatherName', header: 'Nama Ayah', required: true, example: 'Budi Rahman', width: 20 },
      { key: 'fatherJob', header: 'Pekerjaan Ayah', required: false, example: 'Guru', width: 20 },
      { key: 'fatherPhone', header: 'Telepon Ayah', required: false, example: '081234567891', width: 15 },
      { key: 'fatherEducation', header: 'Pendidikan Ayah', required: false, example: 'S1', width: 15 },
      { key: 'motherName', header: 'Nama Ibu', required: true, example: 'Siti Aminah', width: 20 },
      { key: 'motherJob', header: 'Pekerjaan Ibu', required: false, example: 'Ibu Rumah Tangga', width: 20 },
      { key: 'motherPhone', header: 'Telepon Ibu', required: false, example: '081234567892', width: 15 },
      { key: 'motherEducation', header: 'Pendidikan Ibu', required: false, example: 'SMA', width: 15 },
      { key: 'guardianName', header: 'Nama Wali', required: false, example: '', width: 20 },
      { key: 'guardianJob', header: 'Pekerjaan Wali', required: false, example: '', width: 20 },
      { key: 'guardianPhone', header: 'Telepon Wali', required: false, example: '', width: 15 },
      { key: 'guardianRelation', header: 'Hubungan Wali', required: false, example: '', width: 15 },
      { key: 'institutionType', header: 'Jenis Institusi', required: true, example: 'SD', width: 15 },
      { key: 'grade', header: 'Kelas', required: false, example: '1', width: 10 },
      { key: 'enrollmentDate', header: 'Tanggal Masuk', required: true, example: '2024-07-15', width: 15 },
      { key: 'enrollmentYear', header: 'Tahun Ajaran', required: true, example: '2024/2025', width: 15 },
      { key: 'previousSchool', header: 'Sekolah Asal', required: false, example: 'TK Dharma Wanita', width: 25 },
      { key: 'specialNeeds', header: 'Kebutuhan Khusus', required: false, example: '', width: 20 },
      { key: 'status', header: 'Status', required: false, example: 'ACTIVE', width: 15 }
    ];

    return NextResponse.json({
      success: true,
      templateColumns,
      validationRules: {
        required: ['nis', 'fullName', 'birthPlace', 'birthDate', 'gender', 'address', 'city', 'fatherName', 'motherName', 'institutionType', 'enrollmentDate', 'enrollmentYear'],
        formats: {
          birthDate: 'YYYY-MM-DD atau DD/MM/YYYY',
          enrollmentDate: 'YYYY-MM-DD atau DD/MM/YYYY',
          gender: 'L/P atau MALE/FEMALE atau Laki-laki/Perempuan',
          institutionType: 'KB_TK, SD, MTQ, MSWi, MSWa, SMP, atau SMA',
          status: 'ACTIVE, GRADUATED, TRANSFERRED, atau DROPPED',
          email: 'Format email yang valid (opsional)'
        }
      }
    });
  } catch (error) {
    console.error('Get template error:', error);
    return NextResponse.json(
      { error: 'Failed to get template information' },
      { status: 500 }
    );
  }
}