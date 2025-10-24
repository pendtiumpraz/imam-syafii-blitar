import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const semesterId = searchParams.get('semesterId');
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const institutionType = searchParams.get('institutionType');
    const grade = searchParams.get('grade');
    const reportType = searchParams.get('reportType') || 'grades';

    if (reportType === 'attendance') {
      // Export attendance data
      const where: any = {};
      
      if (semesterId && semesterId !== 'all') {
        where.semesterId = semesterId;
      }
      
      if (classId && classId !== 'all') {
        where.classId = classId;
      }

      if (institutionType && institutionType !== 'all') {
        where.student = {
          institutionType: institutionType
        };
      }

      if (grade && grade !== 'all') {
        where.student = {
          ...where.student,
          grade: grade
        };
      }

      const attendance = await prisma.attendances.findMany({
        where,
        include: {
          student: true,
          class: true,
          semester: true,
          marker: true
        },
        orderBy: [
          { date: 'desc' },
          { student: { fullName: 'asc' } }
        ]
      });

      const exportData = attendance.map(record => ({
        'Tanggal': record.date.toISOString().split('T')[0],
        'Nama Siswa': record.student.fullName,
        'NIS': record.student.nis,
        'Institusi': record.student.institutionType,
        'Kelas': record.student.grade || '',
        'Nama Kelas': record.class.name,
        'Semester': record.semester.name,
        'Status Kehadiran': record.status,
        'Jam Masuk': record.timeIn ? record.timeIn.toISOString().split('T')[1].substring(0, 5) : '',
        'Catatan': record.notes || '',
        'Dicatat Oleh': record.marker.name,
        'Tanggal Dicatat': record.markedAt.toISOString().split('T')[0]
      }));

      return NextResponse.json({
        success: true,
        data: exportData,
        total: exportData.length,
        columns: [
          { key: 'Tanggal', header: 'Tanggal', width: 12, type: 'date' },
          { key: 'Nama Siswa', header: 'Nama Siswa', width: 25 },
          { key: 'NIS', header: 'NIS', width: 15 },
          { key: 'Institusi', header: 'Institusi', width: 10 },
          { key: 'Kelas', header: 'Kelas', width: 8 },
          { key: 'Nama Kelas', header: 'Nama Kelas', width: 15 },
          { key: 'Semester', header: 'Semester', width: 12 },
          { key: 'Status Kehadiran', header: 'Status Kehadiran', width: 15 },
          { key: 'Jam Masuk', header: 'Jam Masuk', width: 10 },
          { key: 'Catatan', header: 'Catatan', width: 30 },
          { key: 'Dicatat Oleh', header: 'Dicatat Oleh', width: 20 },
          { key: 'Tanggal Dicatat', header: 'Tanggal Dicatat', width: 15, type: 'date' }
        ]
      });
    } else {
      // Export grades data
      const where: any = {};
      
      if (semesterId && semesterId !== 'all') {
        where.semesterId = semesterId;
      }
      
      if (classId && classId !== 'all') {
        where.classId = classId;
      }
      
      if (subjectId && subjectId !== 'all') {
        where.subjectId = subjectId;
      }

      if (institutionType && institutionType !== 'all') {
        where.student = {
          institutionType: institutionType
        };
      }

      if (grade && grade !== 'all') {
        where.student = {
          ...where.student,
          grade: grade
        };
      }

      const grades = await prisma.grades.findMany({
        where,
        include: {
          student: true,
          subject: true,
          semester: true
        },
        orderBy: [
          { semester: { name: 'asc' } },
          { student: { fullName: 'asc' } },
          { subject: { name: 'asc' } }
        ]
      });

      const exportData = grades.map(grade => ({
        'Nama Siswa': grade.student.fullName,
        'NIS': grade.student.nis,
        'Institusi': grade.student.institutionType,
        'Kelas': grade.student.grade || '',
        'Mata Pelajaran': grade.subject.name,
        'Kode Mapel': grade.subject.code,
        'Semester': grade.semester.name,
        'UTS': grade.midterm?.toNumber() || '',
        'UAS': grade.final?.toNumber() || '',
        'Tugas': grade.assignment?.toNumber() || '',
        'Kuis': grade.quiz?.toNumber() || '',
        'Partisipasi': grade.participation?.toNumber() || '',
        'Proyek': grade.project?.toNumber() || '',
        'Harian': grade.daily?.toNumber() || '',
        'Nilai Total': grade.total?.toNumber() || '',
        'Grade': grade.grade || '',
        'Poin': grade.point?.toNumber() || '',
        'Akhlak': grade.akhlak || '',
        'Hafalan Quran': grade.quranMemory || '',
        'Catatan': grade.notes || '',
        'Terkunci': grade.isLocked ? 'Ya' : 'Tidak',
        'Diinput Oleh': grade.enteredBy || '',
        'Tanggal Input': grade.enteredAt ? grade.enteredAt.toISOString().split('T')[0] : '',
        'Tanggal Update': grade.updatedAt.toISOString().split('T')[0]
      }));

      return NextResponse.json({
        success: true,
        data: exportData,
        total: exportData.length,
        columns: [
          { key: 'Nama Siswa', header: 'Nama Siswa', width: 25 },
          { key: 'NIS', header: 'NIS', width: 15 },
          { key: 'Institusi', header: 'Institusi', width: 10 },
          { key: 'Kelas', header: 'Kelas', width: 8 },
          { key: 'Mata Pelajaran', header: 'Mata Pelajaran', width: 20 },
          { key: 'Kode Mapel', header: 'Kode Mapel', width: 12 },
          { key: 'Semester', header: 'Semester', width: 12 },
          { key: 'UTS', header: 'UTS', width: 8, type: 'number' },
          { key: 'UAS', header: 'UAS', width: 8, type: 'number' },
          { key: 'Tugas', header: 'Tugas', width: 8, type: 'number' },
          { key: 'Kuis', header: 'Kuis', width: 8, type: 'number' },
          { key: 'Partisipasi', header: 'Partisipasi', width: 12, type: 'number' },
          { key: 'Proyek', header: 'Proyek', width: 8, type: 'number' },
          { key: 'Harian', header: 'Harian', width: 8, type: 'number' },
          { key: 'Nilai Total', header: 'Nilai Total', width: 12, type: 'number' },
          { key: 'Grade', header: 'Grade', width: 8 },
          { key: 'Poin', header: 'Poin', width: 8, type: 'number' },
          { key: 'Akhlak', header: 'Akhlak', width: 10 },
          { key: 'Hafalan Quran', header: 'Hafalan Quran', width: 15 },
          { key: 'Catatan', header: 'Catatan', width: 30 },
          { key: 'Terkunci', header: 'Terkunci', width: 10 },
          { key: 'Diinput Oleh', header: 'Diinput Oleh', width: 20 },
          { key: 'Tanggal Input', header: 'Tanggal Input', width: 15, type: 'date' },
          { key: 'Tanggal Update', header: 'Tanggal Update', width: 15, type: 'date' }
        ]
      });
    }

  } catch (error) {
    console.error('Export academic error:', error);
    return NextResponse.json(
      { error: 'Failed to export academic data' },
      { status: 500 }
    );
  }
}