import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const SubjectImportSchema = z.object({
  code: z.string().min(1, 'Kode mata pelajaran wajib diisi'),
  name: z.string().min(1, 'Nama mata pelajaran wajib diisi'),
  nameArabic: z.string().optional(),
  description: z.string().optional(),
  credits: z.union([z.number(), z.string()]).transform(val => {
    const num = typeof val === 'string' ? parseInt(val) : val;
    return isNaN(num) ? 2 : Math.min(Math.max(num, 1), 10);
  }).default(2),
  type: z.enum(['WAJIB', 'PILIHAN']).default('WAJIB'),
  category: z.enum(['UMUM', 'AGAMA', 'MUATAN_LOKAL']).default('UMUM'),
  level: z.enum(['KB_TK', 'SD', 'MTQ', 'MSWi', 'MSWa', 'SMP', 'SMA']),
  minGrade: z.string().optional(),
  maxGrade: z.string().optional(),
  sortOrder: z.union([z.number(), z.string()]).transform(val => {
    const num = typeof val === 'string' ? parseInt(val) : val;
    return isNaN(num) ? 0 : num;
  }).default(0),
  isActive: z.union([z.boolean(), z.string()]).transform(val => 
    val === true || val === 'true' || val === 'TRUE' || val === '1' || val === 'yes' || val === 'YES'
  ).default(true),
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
        const validatedData = SubjectImportSchema.parse(row);

        // Check for existing subject with same code
        const existingSubject = await prisma.subjects.findFirst({
          where: {
            code: validatedData.code,
            isDeleted: false
          }
        });

        if (existingSubject) {
          results.duplicates.push(`Baris ${rowNumber}: Mata pelajaran dengan kode ${validatedData.code} sudah ada`);
          results.errorRows++;
          continue;
        }

        if (preview) {
          results.validRows++;
        } else {
          const newSubject = await prisma.subjects.create({
            data: {
              code: validatedData.code,
              name: validatedData.name,
              nameArabic: validatedData.nameArabic,
              description: validatedData.description,
              credits: validatedData.credits,
              type: validatedData.type,
              category: validatedData.category,
              level: validatedData.level,
              minGrade: validatedData.minGrade,
              maxGrade: validatedData.maxGrade,
              sortOrder: validatedData.sortOrder,
              isActive: validatedData.isActive,
            }
          });

          results.created.push({
            id: newSubject.id,
            code: newSubject.code,
            name: newSubject.name
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
    console.error('Import subjects error:', error);
    return NextResponse.json({ error: 'Failed to import subjects data' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const templateColumns = [
      { key: 'code', header: 'Kode', required: true, example: 'MTK01', width: 12 },
      { key: 'name', header: 'Nama Mapel', required: true, example: 'Matematika', width: 25 },
      { key: 'nameArabic', header: 'Nama Arab', required: false, example: 'الرياضيات', width: 20 },
      { key: 'description', header: 'Deskripsi', required: false, example: 'Pelajaran matematika dasar', width: 30 },
      { key: 'credits', header: 'Jam', required: false, example: '2', width: 8 },
      { key: 'type', header: 'Jenis', required: false, example: 'WAJIB', width: 10 },
      { key: 'category', header: 'Kategori', required: false, example: 'UMUM', width: 15 },
      { key: 'level', header: 'Jenjang', required: true, example: 'SD', width: 10 },
      { key: 'minGrade', header: 'Kelas Min', required: false, example: '1', width: 10 },
      { key: 'maxGrade', header: 'Kelas Max', required: false, example: '6', width: 10 },
      { key: 'sortOrder', header: 'Urutan', required: false, example: '1', width: 8 },
      { key: 'isActive', header: 'Aktif', required: false, example: 'true', width: 8 },
    ];

    // Common Islamic subjects for quick reference
    const islamicSubjects = [
      { code: 'QUR01', name: 'Al-Quran', nameArabic: 'القرآن الكريم', category: 'AGAMA' },
      { code: 'HAD01', name: 'Hadits', nameArabic: 'الحديث الشريف', category: 'AGAMA' },
      { code: 'FIQ01', name: 'Fiqh', nameArabic: 'الفقه', category: 'AGAMA' },
      { code: 'AQD01', name: 'Aqidah', nameArabic: 'العقيدة', category: 'AGAMA' },
      { code: 'AKH01', name: 'Akhlak', nameArabic: 'الأخلاق', category: 'AGAMA' },
      { code: 'TAF01', name: 'Tafsir', nameArabic: 'التفسير', category: 'AGAMA' },
      { code: 'BAR01', name: 'Bahasa Arab', nameArabic: 'اللغة العربية', category: 'AGAMA' },
      { code: 'NHW01', name: 'Nahwu', nameArabic: 'النحو', category: 'AGAMA' },
      { code: 'SRF01', name: 'Shorof', nameArabic: 'الصرف', category: 'AGAMA' },
    ];

    return NextResponse.json({
      success: true,
      templateColumns,
      validationRules: {
        required: ['code', 'name', 'level'],
        formats: {
          level: 'KB_TK, SD, MTQ, MSWi, MSWa, SMP, atau SMA',
          type: 'WAJIB atau PILIHAN (default: WAJIB)',
          category: 'UMUM, AGAMA, atau MUATAN_LOKAL (default: UMUM)',
          credits: 'Angka 1-10 (default: 2) - Jumlah jam pelajaran',
          isActive: 'true/false (default: true)'
        }
      },
      quickReference: {
        islamicSubjects
      }
    });
  } catch (error) {
    console.error('Get template error:', error);
    return NextResponse.json({ error: 'Failed to get template information' }, { status: 500 });
  }
}
