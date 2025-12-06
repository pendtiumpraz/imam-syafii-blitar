import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ClassImportSchema = z.object({
  name: z.string().min(1, 'Nama kelas wajib diisi'),
  grade: z.string().min(1, 'Tingkat wajib diisi'),
  section: z.string().optional(),
  level: z.enum(['KB_TK', 'SD', 'MTQ', 'MSWi', 'MSWa', 'SMP', 'SMA']),
  program: z.string().optional(),
  capacity: z.union([z.number(), z.string()]).transform(val => {
    const num = typeof val === 'string' ? parseInt(val) : val;
    return isNaN(num) ? 30 : num;
  }).default(30),
  room: z.string().optional(),
  academicYearName: z.string().optional(), // Untuk lookup by name
  academicYearId: z.string().optional(), // Direct ID
  teacherEmail: z.string().optional(), // Untuk lookup by email
  teacherId: z.string().optional(), // Direct ID
  description: z.string().optional(),
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

    // Get active academic year as default
    const activeAcademicYear = await prisma.academic_years.findFirst({
      where: { isActive: true }
    });

    for (let i = 0; i < data.length; i++) {
      const rowNumber = i + 2;
      const row = data[i];

      try {
        const validatedData = ClassImportSchema.parse(row);

        // Resolve academic year
        let academicYearId = validatedData.academicYearId;
        if (!academicYearId && validatedData.academicYearName) {
          const academicYear = await prisma.academic_years.findFirst({
            where: { name: { contains: validatedData.academicYearName, mode: 'insensitive' } }
          });
          if (academicYear) academicYearId = academicYear.id;
        }
        if (!academicYearId && activeAcademicYear) {
          academicYearId = activeAcademicYear.id;
        }

        if (!academicYearId) {
          results.errors.push(`Baris ${rowNumber}: Tahun ajaran tidak ditemukan dan tidak ada tahun ajaran aktif`);
          results.errorRows++;
          continue;
        }

        // Resolve teacher (optional)
        let teacherId = validatedData.teacherId;
        if (!teacherId && validatedData.teacherEmail) {
          const teacher = await prisma.users.findFirst({
            where: { 
              email: validatedData.teacherEmail,
              role: { in: ['USTADZ', 'ADMIN'] },
              isDeleted: false
            }
          });
          if (teacher) teacherId = teacher.id;
        }

        // Check for existing class
        const existingClass = await prisma.classes.findFirst({
          where: {
            name: validatedData.name,
            academicYearId: academicYearId,
            isDeleted: false
          }
        });

        if (existingClass) {
          results.duplicates.push(`Baris ${rowNumber}: Kelas ${validatedData.name} sudah ada di tahun ajaran ini`);
          results.errorRows++;
          continue;
        }

        if (preview) {
          results.validRows++;
        } else {
          const newClass = await prisma.classes.create({
            data: {
              name: validatedData.name,
              grade: validatedData.grade,
              section: validatedData.section,
              level: validatedData.level,
              program: validatedData.program,
              capacity: validatedData.capacity,
              room: validatedData.room,
              academicYearId: academicYearId,
              teacherId: teacherId || null,
              description: validatedData.description,
              isActive: validatedData.isActive,
            }
          });

          results.created.push({
            id: newClass.id,
            name: newClass.name,
            grade: newClass.grade
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
    console.error('Import classes error:', error);
    return NextResponse.json({ error: 'Failed to import classes data' }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get academic years and teachers for reference
    const academicYears = await prisma.academic_years.findMany({
      select: { id: true, name: true, isActive: true },
      orderBy: { startDate: 'desc' }
    });

    const teachers = await prisma.users.findMany({
      where: { role: { in: ['USTADZ', 'ADMIN'] }, isDeleted: false, isActive: true },
      select: { id: true, name: true, email: true },
      take: 100
    });

    const templateColumns = [
      { key: 'name', header: 'Nama Kelas', required: true, example: 'VII-A', width: 15 },
      { key: 'grade', header: 'Tingkat', required: true, example: '7', width: 10 },
      { key: 'section', header: 'Bagian', required: false, example: 'A', width: 10 },
      { key: 'level', header: 'Jenjang', required: true, example: 'SMP', width: 10 },
      { key: 'program', header: 'Program', required: false, example: 'REGULER', width: 12 },
      { key: 'capacity', header: 'Kapasitas', required: false, example: '30', width: 10 },
      { key: 'room', header: 'Ruangan', required: false, example: 'A1', width: 10 },
      { key: 'academicYearName', header: 'Tahun Ajaran', required: false, example: '2024/2025', width: 15 },
      { key: 'teacherEmail', header: 'Email Wali Kelas', required: false, example: 'ustadz@pondok.sch.id', width: 25 },
      { key: 'description', header: 'Keterangan', required: false, example: '', width: 20 },
      { key: 'isActive', header: 'Aktif', required: false, example: 'true', width: 10 },
    ];

    return NextResponse.json({
      success: true,
      templateColumns,
      validationRules: {
        required: ['name', 'grade', 'level'],
        formats: {
          level: 'KB_TK, SD, MTQ, MSWi, MSWa, SMP, atau SMA',
          program: 'REGULER, TAHFIDZ, atau KITAB',
          capacity: 'Angka 1-100 (default: 30)',
          isActive: 'true/false atau 1/0 (default: true)'
        }
      },
      references: {
        academicYears: academicYears.map(ay => ({ value: ay.id, label: `${ay.name}${ay.isActive ? ' (Aktif)' : ''}` })),
        teachers: teachers.map(t => ({ value: t.id, label: t.name, email: t.email }))
      }
    });
  } catch (error) {
    console.error('Get template error:', error);
    return NextResponse.json({ error: 'Failed to get template information' }, { status: 500 });
  }
}
