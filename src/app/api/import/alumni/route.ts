import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const AlumniImportSchema = z.object({
  fullName: z.string().min(1, 'Nama lengkap wajib diisi'),
  nickname: z.string().optional(),
  nis: z.string().optional(),
  nisn: z.string().optional(),
  birthPlace: z.string().min(1, 'Tempat lahir wajib diisi'),
  birthDate: z.string().min(1, 'Tanggal lahir wajib diisi'),
  gender: z.enum(['MALE', 'FEMALE', 'L', 'P', 'Laki-laki', 'Perempuan']).transform(val => {
    if (['L', 'Laki-laki'].includes(val)) return 'MALE';
    if (['P', 'Perempuan'].includes(val)) return 'FEMALE';
    return val;
  }),
  institutionType: z.enum(['KB_TK', 'SD', 'MTQ', 'MSWi', 'MSWa', 'SMP', 'SMA']),
  graduationYear: z.string().min(1, 'Tahun lulus wajib diisi'),
  generation: z.string().optional(),
  currentAddress: z.string().min(1, 'Alamat wajib diisi'),
  currentCity: z.string().min(1, 'Kota wajib diisi'),
  currentProvince: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  currentJob: z.string().optional(),
  jobPosition: z.string().optional(),
  company: z.string().optional(),
  university: z.string().optional(),
  major: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user?.role || '')) {
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

    for (let i = 0; i < data.length; i++) {
      const rowNumber = i + 2;
      const row = data[i];

      try {
        const validatedData = AlumniImportSchema.parse(row);

        // Parse birth date
        const birthDate = new Date(validatedData.birthDate);
        if (isNaN(birthDate.getTime())) {
          results.errors.push(`Baris ${rowNumber}: Format tanggal lahir tidak valid`);
          results.errorRows++;
          continue;
        }

        // Check for duplicates by name + graduation year + institution
        const existingAlumni = await prisma.alumni.findFirst({
          where: {
            fullName: validatedData.fullName,
            graduationYear: validatedData.graduationYear,
            institutionType: validatedData.institutionType,
            isDeleted: false
          }
        });

        if (existingAlumni) {
          results.duplicates.push(`Baris ${rowNumber}: Alumni ${validatedData.fullName} (${validatedData.graduationYear}) sudah ada`);
          results.errorRows++;
          continue;
        }

        if (preview) {
          results.validRows++;
        } else {
          const newAlumni = await prisma.alumni.create({
            data: {
              fullName: validatedData.fullName,
              nickname: validatedData.nickname,
              nis: validatedData.nis,
              nisn: validatedData.nisn,
              birthPlace: validatedData.birthPlace,
              birthDate: birthDate,
              gender: validatedData.gender,
              institutionType: validatedData.institutionType,
              graduationYear: validatedData.graduationYear,
              generation: validatedData.generation,
              currentAddress: validatedData.currentAddress,
              currentCity: validatedData.currentCity,
              currentProvince: validatedData.currentProvince,
              phone: validatedData.phone,
              whatsapp: validatedData.whatsapp,
              email: validatedData.email || null,
              fatherName: validatedData.fatherName,
              motherName: validatedData.motherName,
              currentJob: validatedData.currentJob,
              jobPosition: validatedData.jobPosition,
              company: validatedData.company,
              university: validatedData.university,
              major: validatedData.major,
              notes: validatedData.notes,
              createdBy: session.user.id,
            }
          });

          results.created.push({
            id: newAlumni.id,
            fullName: newAlumni.fullName,
            graduationYear: newAlumni.graduationYear
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

    results.success = results.validRows > 0;
    return NextResponse.json(results);

  } catch (error) {
    console.error('Import alumni error:', error);
    return NextResponse.json({ error: 'Failed to import alumni data' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const templateColumns = [
      { key: 'fullName', header: 'Nama Lengkap', required: true, example: 'Ahmad Fadli Rahman', width: 25 },
      { key: 'nickname', header: 'Nama Panggilan', required: false, example: 'Fadli', width: 15 },
      { key: 'nis', header: 'NIS', required: false, example: '20200001', width: 12 },
      { key: 'nisn', header: 'NISN', required: false, example: '0012345678', width: 15 },
      { key: 'birthPlace', header: 'Tempat Lahir', required: true, example: 'Blitar', width: 15 },
      { key: 'birthDate', header: 'Tanggal Lahir', required: true, example: '2000-05-15', width: 15 },
      { key: 'gender', header: 'L/P', required: true, example: 'L', width: 8 },
      { key: 'institutionType', header: 'Lembaga', required: true, example: 'SD', width: 10 },
      { key: 'graduationYear', header: 'Tahun Lulus', required: true, example: '2012', width: 12 },
      { key: 'generation', header: 'Angkatan', required: false, example: 'I', width: 10 },
      { key: 'currentAddress', header: 'Alamat Sekarang', required: true, example: 'Jl. Mawar No. 1', width: 30 },
      { key: 'currentCity', header: 'Kota', required: true, example: 'Blitar', width: 15 },
      { key: 'currentProvince', header: 'Provinsi', required: false, example: 'Jawa Timur', width: 15 },
      { key: 'phone', header: 'No. HP', required: false, example: '081234567890', width: 15 },
      { key: 'whatsapp', header: 'WhatsApp', required: false, example: '081234567890', width: 15 },
      { key: 'email', header: 'Email', required: false, example: 'fadli@email.com', width: 25 },
      { key: 'fatherName', header: 'Nama Ayah', required: false, example: 'Budi Rahman', width: 20 },
      { key: 'motherName', header: 'Nama Ibu', required: false, example: 'Siti Aminah', width: 20 },
      { key: 'currentJob', header: 'Pekerjaan', required: false, example: 'Guru', width: 20 },
      { key: 'jobPosition', header: 'Jabatan', required: false, example: 'Wali Kelas', width: 15 },
      { key: 'company', header: 'Tempat Kerja', required: false, example: 'MI Al-Hikmah', width: 20 },
      { key: 'university', header: 'Universitas', required: false, example: 'UIN Malang', width: 20 },
      { key: 'major', header: 'Jurusan', required: false, example: 'PAI', width: 15 },
      { key: 'notes', header: 'Catatan', required: false, example: '', width: 20 },
    ];

    return NextResponse.json({
      success: true,
      templateColumns,
      validationRules: {
        required: ['fullName', 'birthPlace', 'birthDate', 'gender', 'institutionType', 'graduationYear', 'currentAddress', 'currentCity'],
        formats: {
          birthDate: 'YYYY-MM-DD (contoh: 2000-05-15)',
          gender: 'L/P atau MALE/FEMALE atau Laki-laki/Perempuan',
          institutionType: 'KB_TK, SD, MTQ, MSWi, MSWa, SMP, atau SMA'
        }
      }
    });
  } catch (error) {
    console.error('Get template error:', error);
    return NextResponse.json({ error: 'Failed to get template information' }, { status: 500 });
  }
}
