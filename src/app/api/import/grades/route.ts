import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const GradeImportSchema = z.object({
  studentNis: z.string().min(1, 'NIS siswa wajib diisi'),
  subjectCode: z.string().min(1, 'Kode mapel wajib diisi'),
  semesterName: z.string().optional(), // Untuk lookup by name
  semesterId: z.string().optional(), // Direct ID
  classId: z.string().optional(),
  midterm: z.union([z.number(), z.string()]).transform(val => {
    if (val === '' || val === null || val === undefined) return null;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? null : num;
  }).optional(),
  final: z.union([z.number(), z.string()]).transform(val => {
    if (val === '' || val === null || val === undefined) return null;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? null : num;
  }).optional(),
  assignment: z.union([z.number(), z.string()]).transform(val => {
    if (val === '' || val === null || val === undefined) return null;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? null : num;
  }).optional(),
  quiz: z.union([z.number(), z.string()]).transform(val => {
    if (val === '' || val === null || val === undefined) return null;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? null : num;
  }).optional(),
  daily: z.union([z.number(), z.string()]).transform(val => {
    if (val === '' || val === null || val === undefined) return null;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? null : num;
  }).optional(),
  participation: z.union([z.number(), z.string()]).transform(val => {
    if (val === '' || val === null || val === undefined) return null;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isNaN(num) ? null : num;
  }).optional(),
  akhlak: z.string().optional(),
  notes: z.string().optional(),
});

// Calculate total and grade
function calculateGrade(data: any): { total: number; grade: string; point: number } {
  const scores = [
    data.midterm || 0,
    data.final || 0,
    data.assignment || 0,
    data.quiz || 0,
    data.daily || 0,
    data.participation || 0
  ].filter(s => s > 0);
  
  const total = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  
  let grade = 'E';
  let point = 0;
  
  if (total >= 90) { grade = 'A'; point = 4.0; }
  else if (total >= 85) { grade = 'A-'; point = 3.7; }
  else if (total >= 80) { grade = 'B+'; point = 3.3; }
  else if (total >= 75) { grade = 'B'; point = 3.0; }
  else if (total >= 70) { grade = 'B-'; point = 2.7; }
  else if (total >= 65) { grade = 'C+'; point = 2.3; }
  else if (total >= 60) { grade = 'C'; point = 2.0; }
  else if (total >= 55) { grade = 'C-'; point = 1.7; }
  else if (total >= 50) { grade = 'D'; point = 1.0; }
  
  return { total, grade, point };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'ADMIN', 'USTADZ'].includes(session.user?.role || '')) {
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
      created: [] as any[],
      updated: [] as any[]
    };

    // Get active semester as default
    const activeSemester = await prisma.semesters.findFirst({
      where: { isActive: true }
    });

    for (let i = 0; i < data.length; i++) {
      const rowNumber = i + 2;
      const row = data[i];

      try {
        const validatedData = GradeImportSchema.parse(row);

        // Find student by NIS
        const student = await prisma.students.findFirst({
          where: { nis: validatedData.studentNis, isDeleted: false }
        });

        if (!student) {
          results.errors.push(`Baris ${rowNumber}: Siswa dengan NIS ${validatedData.studentNis} tidak ditemukan`);
          results.errorRows++;
          continue;
        }

        // Find subject by code
        const subject = await prisma.subjects.findFirst({
          where: { code: validatedData.subjectCode, isDeleted: false }
        });

        if (!subject) {
          results.errors.push(`Baris ${rowNumber}: Mata pelajaran dengan kode ${validatedData.subjectCode} tidak ditemukan`);
          results.errorRows++;
          continue;
        }

        // Resolve semester
        let semesterId = validatedData.semesterId;
        if (!semesterId && validatedData.semesterName) {
          const semester = await prisma.semesters.findFirst({
            where: { name: { contains: validatedData.semesterName, mode: 'insensitive' } }
          });
          if (semester) semesterId = semester.id;
        }
        if (!semesterId && activeSemester) {
          semesterId = activeSemester.id;
        }

        if (!semesterId) {
          results.errors.push(`Baris ${rowNumber}: Semester tidak ditemukan dan tidak ada semester aktif`);
          results.errorRows++;
          continue;
        }

        // Calculate total and grade
        const calculated = calculateGrade(validatedData);

        if (preview) {
          results.validRows++;
        } else {
          // Check if grade already exists
          const existingGrade = await prisma.grades.findFirst({
            where: {
              studentId: student.id,
              subjectId: subject.id,
              semesterId: semesterId,
              isDeleted: false
            }
          });

          if (existingGrade) {
            // Update existing grade
            await prisma.grades.update({
              where: { id: existingGrade.id },
              data: {
                midterm: validatedData.midterm,
                final: validatedData.final,
                assignment: validatedData.assignment,
                quiz: validatedData.quiz,
                daily: validatedData.daily,
                participation: validatedData.participation,
                total: calculated.total,
                grade: calculated.grade,
                point: calculated.point,
                akhlak: validatedData.akhlak,
                notes: validatedData.notes,
                enteredBy: session.user.id,
                enteredAt: new Date(),
              }
            });
            results.updated.push({
              studentNis: student.nis,
              subjectCode: subject.code
            });
          } else {
            // Create new grade
            await prisma.grades.create({
              data: {
                studentId: student.id,
                subjectId: subject.id,
                semesterId: semesterId,
                classId: validatedData.classId,
                midterm: validatedData.midterm,
                final: validatedData.final,
                assignment: validatedData.assignment,
                quiz: validatedData.quiz,
                daily: validatedData.daily,
                participation: validatedData.participation,
                total: calculated.total,
                grade: calculated.grade,
                point: calculated.point,
                akhlak: validatedData.akhlak,
                notes: validatedData.notes,
                enteredBy: session.user.id,
                enteredAt: new Date(),
              }
            });
            results.created.push({
              studentNis: student.nis,
              subjectCode: subject.code
            });
          }
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
    console.error('Import grades error:', error);
    return NextResponse.json({ error: 'Failed to import grades data' }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get subjects and semesters for reference
    const subjects = await prisma.subjects.findMany({
      where: { isDeleted: false, isActive: true },
      select: { code: true, name: true, level: true },
      orderBy: [{ level: 'asc' }, { name: 'asc' }]
    });

    const semesters = await prisma.semesters.findMany({
      select: { id: true, name: true, isActive: true },
      orderBy: { startDate: 'desc' }
    });

    const templateColumns = [
      { key: 'studentNis', header: 'NIS Siswa', required: true, example: '20240001', width: 15 },
      { key: 'subjectCode', header: 'Kode Mapel', required: true, example: 'MTK01', width: 12 },
      { key: 'semesterName', header: 'Semester', required: false, example: 'Ganjil 2024/2025', width: 20 },
      { key: 'daily', header: 'Nilai Harian', required: false, example: '85', width: 12 },
      { key: 'quiz', header: 'Nilai Kuis', required: false, example: '80', width: 12 },
      { key: 'assignment', header: 'Nilai Tugas', required: false, example: '90', width: 12 },
      { key: 'midterm', header: 'Nilai UTS', required: false, example: '82', width: 12 },
      { key: 'final', header: 'Nilai UAS', required: false, example: '88', width: 12 },
      { key: 'participation', header: 'Partisipasi', required: false, example: '85', width: 12 },
      { key: 'akhlak', header: 'Akhlak', required: false, example: 'Baik', width: 12 },
      { key: 'notes', header: 'Catatan', required: false, example: '', width: 20 },
    ];

    return NextResponse.json({
      success: true,
      templateColumns,
      validationRules: {
        required: ['studentNis', 'subjectCode'],
        formats: {
          nilai: 'Angka 0-100 (kosongkan jika belum ada nilai)',
          akhlak: 'Teks bebas (Sangat Baik, Baik, Cukup, Kurang)'
        },
        notes: [
          'Total dan Grade akan dihitung otomatis dari rata-rata nilai yang diisi',
          'Jika data nilai sudah ada, akan di-update dengan nilai baru',
          'Semester default: semester aktif saat ini'
        ]
      },
      references: {
        subjects: subjects.map(s => ({ code: s.code, name: s.name, level: s.level })),
        semesters: semesters.map(s => ({ id: s.id, name: s.name, isActive: s.isActive }))
      }
    });
  } catch (error) {
    console.error('Get template error:', error);
    return NextResponse.json({ error: 'Failed to get template information' }, { status: 500 });
  }
}
