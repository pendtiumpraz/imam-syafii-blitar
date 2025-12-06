import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const AcademicYearImportSchema = z.object({
  name: z.string().min(1, 'Nama tahun ajaran wajib diisi'),
  startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
  endDate: z.string().min(1, 'Tanggal selesai wajib diisi'),
  description: z.string().optional(),
  isActive: z.union([z.boolean(), z.string()]).transform(val => 
    val === true || val === 'true' || val === 'TRUE' || val === '1' || val === 'yes' || val === 'YES'
  ).default(false),
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
        const validatedData = AcademicYearImportSchema.parse(row);

        // Parse dates
        const startDate = new Date(validatedData.startDate);
        const endDate = new Date(validatedData.endDate);

        if (isNaN(startDate.getTime())) {
          results.errors.push(`Baris ${rowNumber}: Format tanggal mulai tidak valid`);
          results.errorRows++;
          continue;
        }

        if (isNaN(endDate.getTime())) {
          results.errors.push(`Baris ${rowNumber}: Format tanggal selesai tidak valid`);
          results.errorRows++;
          continue;
        }

        if (endDate <= startDate) {
          results.errors.push(`Baris ${rowNumber}: Tanggal selesai harus setelah tanggal mulai`);
          results.errorRows++;
          continue;
        }

        // Check for existing academic year
        const existingYear = await prisma.academic_years.findFirst({
          where: { name: validatedData.name }
        });

        if (existingYear) {
          results.duplicates.push(`Baris ${rowNumber}: Tahun ajaran ${validatedData.name} sudah ada`);
          results.errorRows++;
          continue;
        }

        if (preview) {
          results.validRows++;
        } else {
          // If setting as active, deactivate others first
          if (validatedData.isActive) {
            await prisma.academic_years.updateMany({
              where: { isActive: true },
              data: { isActive: false }
            });
          }

          const newYear = await prisma.academic_years.create({
            data: {
              name: validatedData.name,
              startDate: startDate,
              endDate: endDate,
              description: validatedData.description,
              isActive: validatedData.isActive,
            }
          });

          results.created.push({
            id: newYear.id,
            name: newYear.name
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
    console.error('Import academic years error:', error);
    return NextResponse.json({ error: 'Failed to import academic years data' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const templateColumns = [
      { key: 'name', header: 'Nama Tahun Ajaran', required: true, example: '2024/2025', width: 20 },
      { key: 'startDate', header: 'Tanggal Mulai', required: true, example: '2024-07-15', width: 15 },
      { key: 'endDate', header: 'Tanggal Selesai', required: true, example: '2025-06-30', width: 15 },
      { key: 'description', header: 'Keterangan', required: false, example: 'Tahun ajaran genap', width: 25 },
      { key: 'isActive', header: 'Status Aktif', required: false, example: 'true', width: 12 },
    ];

    return NextResponse.json({
      success: true,
      templateColumns,
      validationRules: {
        required: ['name', 'startDate', 'endDate'],
        formats: {
          startDate: 'YYYY-MM-DD (contoh: 2024-07-15)',
          endDate: 'YYYY-MM-DD (contoh: 2025-06-30)',
          isActive: 'true/false (default: false). Hanya boleh 1 tahun ajaran yang aktif.'
        }
      }
    });
  } catch (error) {
    console.error('Get template error:', error);
    return NextResponse.json({ error: 'Failed to get template information' }, { status: 500 });
  }
}
