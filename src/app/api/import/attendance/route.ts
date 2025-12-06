import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const AttendanceImportSchema = z.object({
  studentNis: z.string().min(1, 'NIS siswa wajib diisi'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  status: z.enum(['HADIR', 'SAKIT', 'IZIN', 'ALPHA', 'TERLAMBAT']).transform(val => val.toUpperCase()),
  className: z.string().optional(), // Untuk lookup
  classId: z.string().optional(),
  semesterName: z.string().optional(),
  semesterId: z.string().optional(),
  timeIn: z.string().optional(),
  notes: z.string().optional(),
});

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
        // Normalize status
        if (row.status) {
          row.status = row.status.toUpperCase();
        }

        const validatedData = AttendanceImportSchema.parse(row);

        // Parse date
        const attendanceDate = new Date(validatedData.date);
        if (isNaN(attendanceDate.getTime())) {
          results.errors.push(`Baris ${rowNumber}: Format tanggal tidak valid`);
          results.errorRows++;
          continue;
        }

        // Find student by NIS
        const student = await prisma.students.findFirst({
          where: { nis: validatedData.studentNis, isDeleted: false }
        });

        if (!student) {
          results.errors.push(`Baris ${rowNumber}: Siswa dengan NIS ${validatedData.studentNis} tidak ditemukan`);
          results.errorRows++;
          continue;
        }

        // Resolve class
        let classId = validatedData.classId;
        if (!classId && validatedData.className) {
          const studentClass = await prisma.classes.findFirst({
            where: { name: { contains: validatedData.className, mode: 'insensitive' }, isDeleted: false }
          });
          if (studentClass) classId = studentClass.id;
        }
        
        // If still no class, try to find from student's current enrollment
        if (!classId) {
          const enrollment = await prisma.student_classes.findFirst({
            where: { studentId: student.id, status: 'ACTIVE' },
            include: { classes: true }
          });
          if (enrollment) classId = enrollment.classId;
        }

        if (!classId) {
          results.errors.push(`Baris ${rowNumber}: Kelas tidak ditemukan untuk siswa ${validatedData.studentNis}`);
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
          results.errors.push(`Baris ${rowNumber}: Semester tidak ditemukan`);
          results.errorRows++;
          continue;
        }

        // Parse time in if provided
        let timeIn = null;
        if (validatedData.timeIn) {
          const [hours, minutes] = validatedData.timeIn.split(':').map(Number);
          if (!isNaN(hours) && !isNaN(minutes)) {
            timeIn = new Date(attendanceDate);
            timeIn.setHours(hours, minutes, 0, 0);
          }
        }

        if (preview) {
          results.validRows++;
        } else {
          // Check if attendance already exists for this student on this date
          const existingAttendance = await prisma.attendances.findFirst({
            where: {
              studentId: student.id,
              date: attendanceDate,
              classId: classId,
              isDeleted: false
            }
          });

          if (existingAttendance) {
            // Update existing
            await prisma.attendances.update({
              where: { id: existingAttendance.id },
              data: {
                status: validatedData.status,
                timeIn: timeIn,
                notes: validatedData.notes,
                markedBy: session.user.id,
                markedAt: new Date(),
              }
            });
            results.updated.push({
              studentNis: student.nis,
              date: validatedData.date
            });
          } else {
            // Create new
            await prisma.attendances.create({
              data: {
                studentId: student.id,
                classId: classId,
                semesterId: semesterId,
                date: attendanceDate,
                status: validatedData.status,
                timeIn: timeIn,
                notes: validatedData.notes,
                markedBy: session.user.id,
                markedAt: new Date(),
              }
            });
            results.created.push({
              studentNis: student.nis,
              date: validatedData.date
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
    console.error('Import attendance error:', error);
    return NextResponse.json({ error: 'Failed to import attendance data' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const templateColumns = [
      { key: 'studentNis', header: 'NIS Siswa', required: true, example: '20240001', width: 15 },
      { key: 'date', header: 'Tanggal', required: true, example: '2024-07-15', width: 12 },
      { key: 'status', header: 'Status', required: true, example: 'HADIR', width: 12 },
      { key: 'className', header: 'Nama Kelas', required: false, example: 'VII-A', width: 12 },
      { key: 'timeIn', header: 'Jam Masuk', required: false, example: '07:00', width: 10 },
      { key: 'notes', header: 'Keterangan', required: false, example: '', width: 25 },
    ];

    return NextResponse.json({
      success: true,
      templateColumns,
      validationRules: {
        required: ['studentNis', 'date', 'status'],
        formats: {
          date: 'YYYY-MM-DD (contoh: 2024-07-15)',
          status: 'HADIR, SAKIT, IZIN, ALPHA, atau TERLAMBAT',
          timeIn: 'HH:MM (contoh: 07:00)'
        },
        notes: [
          'Jika data absensi sudah ada untuk siswa pada tanggal tersebut, akan di-update',
          'Kelas akan dicari otomatis dari enrollment siswa jika tidak diisi',
          'Semester default: semester aktif saat ini'
        ]
      }
    });
  } catch (error) {
    console.error('Get template error:', error);
    return NextResponse.json({ error: 'Failed to get template information' }, { status: 500 });
  }
}
