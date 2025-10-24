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
    const institutionType = searchParams.get('institutionType');
    const grade = searchParams.get('grade');
    const teacherId = searchParams.get('teacherId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const reportType = searchParams.get('reportType') || 'progress';

    if (reportType === 'records') {
      // Export hafalan records
      const where: any = {};
      
      if (teacherId && teacherId !== 'all') {
        where.teacherId = teacherId;
      }
      
      if (status && status !== 'all') {
        where.status = status;
      }
      
      if (startDate) {
        where.date = {
          ...where.date,
          gte: new Date(startDate)
        };
      }

      if (endDate) {
        where.date = {
          ...where.date,
          lte: new Date(endDate)
        };
      }

      // Add student filter
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

      const records = await prisma.hafalan_records.findMany({
        where,
        orderBy: [
          { date: 'desc' },
          { studentId: 'asc' }
        ]
      });

      const exportData = records.map(record => ({
        'Tanggal': record.date.toISOString().split('T')[0],
        'Student ID': record.studentId,
        'Nomor Surah': record.surahNumber,
        'Ayat Mulai': record.startAyat,
        'Ayat Selesai': record.endAyat,
        'Total Ayat': record.endAyat - record.startAyat + 1,
        'Status': record.status,
        'Kualitas': record.quality,
        'Kelancaran': record.fluency || '',
        'Tajweed': record.tajweed || '',
        'Makharijul': record.makharijul || '',
        'Durasi (menit)': record.duration || 0,
        'Metode': record.method,
        'Teacher ID': record.teacherId,
        'Catatan': record.notes || '',
        'Koreksi': record.corrections || '',
        'Target Selanjutnya': record.nextTarget || ''
      }));

      return NextResponse.json({
        success: true,
        data: exportData,
        total: exportData.length,
        columns: [
          { key: 'Tanggal', header: 'Tanggal', width: 12, type: 'date' },
          { key: 'Student ID', header: 'Student ID', width: 25 },
          { key: 'Nomor Surah', header: 'Nomor Surah', width: 12, type: 'number' },
          { key: 'Ayat Mulai', header: 'Ayat Mulai', width: 10, type: 'number' },
          { key: 'Ayat Selesai', header: 'Ayat Selesai', width: 12, type: 'number' },
          { key: 'Total Ayat', header: 'Total Ayat', width: 10, type: 'number' },
          { key: 'Status', header: 'Status', width: 12 },
          { key: 'Kualitas', header: 'Kualitas', width: 10 },
          { key: 'Kelancaran', header: 'Kelancaran', width: 12 },
          { key: 'Tajweed', header: 'Tajweed', width: 12 },
          { key: 'Makharijul', header: 'Makharijul', width: 12 },
          { key: 'Durasi (menit)', header: 'Durasi (menit)', width: 15, type: 'number' },
          { key: 'Metode', header: 'Metode', width: 15 },
          { key: 'Teacher ID', header: 'Teacher ID', width: 25 },
          { key: 'Catatan', header: 'Catatan', width: 40 },
          { key: 'Koreksi', header: 'Koreksi', width: 40 },
          { key: 'Target Selanjutnya', header: 'Target Selanjutnya', width: 30 }
        ]
      });
    } else {
      // Export hafalan progress
      const where: any = {};
      
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

      const progress = await prisma.hafalan_progress.findMany({
        where,
        orderBy: [
          { totalSurah: 'desc' },
          { totalAyat: 'desc' },
          { studentId: 'asc' }
        ]
      });

      const exportData = progress.map(prog => ({
        'Student ID': prog.studentId,
        'Total Surah Hafal': prog.totalSurah,
        'Total Ayat Hafal': prog.totalAyat,
        'Total Juz': prog.totalJuz.toNumber(),
        'Surah Saat Ini': prog.currentSurah || '',
        'Ayat Saat Ini': prog.currentAyat,
        'Target Saat Ini': prog.currentTarget || '',
        'Level': prog.level,
        'Progress Juz 30 (%)': prog.juz30Progress.toNumber(),
        'Progress Keseluruhan (%)': prog.overallProgress.toNumber(),
        'Setoran Terakhir': prog.lastSetoranDate ? prog.lastSetoranDate.toISOString().split('T')[0] : '',
        'Murajaah Terakhir': prog.lastMurajaahDate ? prog.lastMurajaahDate.toISOString().split('T')[0] : '',
        'Streak Saat Ini': prog.currentStreak,
        'Streak Terpanjang': prog.longestStreak,
        'Total Sesi': prog.totalSessions,
        'Rata-rata Kualitas': prog.avgQuality.toNumber(),
        'Rata-rata Kelancaran': prog.avgFluency.toNumber(),
        'Rata-rata Tajweed': prog.avgTajweed.toNumber(),
        'Terakhir Update': prog.lastUpdated.toISOString().split('T')[0]
      }));

      return NextResponse.json({
        success: true,
        data: exportData,
        total: exportData.length,
        columns: [
          { key: 'Student ID', header: 'Student ID', width: 25 },
          { key: 'Total Surah Hafal', header: 'Total Surah Hafal', width: 15, type: 'number' },
          { key: 'Total Ayat Hafal', header: 'Total Ayat Hafal', width: 15, type: 'number' },
          { key: 'Total Juz', header: 'Total Juz', width: 10, type: 'number' },
          { key: 'Surah Saat Ini', header: 'Surah Saat Ini', width: 15 },
          { key: 'Ayat Saat Ini', header: 'Ayat Saat Ini', width: 12, type: 'number' },
          { key: 'Target Saat Ini', header: 'Target Saat Ini', width: 25 },
          { key: 'Level', header: 'Level', width: 12 },
          { key: 'Progress Juz 30 (%)', header: 'Progress Juz 30 (%)', width: 15, type: 'number' },
          { key: 'Progress Keseluruhan (%)', header: 'Progress Keseluruhan (%)', width: 20, type: 'number' },
          { key: 'Setoran Terakhir', header: 'Setoran Terakhir', width: 15, type: 'date' },
          { key: 'Murajaah Terakhir', header: 'Murajaah Terakhir', width: 15, type: 'date' },
          { key: 'Streak Saat Ini', header: 'Streak Saat Ini', width: 12, type: 'number' },
          { key: 'Streak Terpanjang', header: 'Streak Terpanjang', width: 15, type: 'number' },
          { key: 'Total Sesi', header: 'Total Sesi', width: 10, type: 'number' },
          { key: 'Rata-rata Kualitas', header: 'Rata-rata Kualitas', width: 15, type: 'number' },
          { key: 'Rata-rata Kelancaran', header: 'Rata-rata Kelancaran', width: 18, type: 'number' },
          { key: 'Rata-rata Tajweed', header: 'Rata-rata Tajweed', width: 15, type: 'number' },
          { key: 'Terakhir Update', header: 'Terakhir Update', width: 15, type: 'date' }
        ]
      });
    }

  } catch (error) {
    console.error('Export hafalan error:', error);
    return NextResponse.json(
      { error: 'Failed to export hafalan data' },
      { status: 500 }
    );
  }
}