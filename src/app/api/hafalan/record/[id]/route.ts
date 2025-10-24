import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { softDelete } from '@/lib/soft-delete';

// Helper function to update student progress
async function updateStudentProgress(studentId: string) {
  const records = await prisma.hafalan_records.findMany({
    where: {
      studentId,
      status: { in: ['LANCAR', 'MUTQIN'] }
    },
    include: { surah: true }
  });

  const completedSurahs = new Set();
  let totalAyat = 0;
  let qualitySum = 0;
  let juzProgress: { [key: number]: number } = {};

  function getQualityScore(quality: string): number {
    switch (quality) {
      case 'A': return 4;
      case 'B': return 3;
      case 'C': return 2;
      default: return 2;
    }
  }

  records.forEach(record => {
    if (record.status === 'MUTQIN') {
      const surahRecords = records.filter(r => r.surahNumber === record.surahNumber);
      const surahAyats = new Set();
      surahRecords.forEach(r => {
        for (let i = r.startAyat; i <= r.endAyat; i++) {
          surahAyats.add(i);
        }
      });

      if (surahAyats.size === record.surah.totalAyat) {
        completedSurahs.add(record.surahNumber);
      }
    }

    totalAyat += (record.endAyat - record.startAyat + 1);
    qualitySum += getQualityScore(record.quality);

    const juz = record.surah.juz;
    if (!juzProgress[juz]) juzProgress[juz] = 0;
    juzProgress[juz] += (record.endAyat - record.startAyat + 1);
  });

  const totalQuranAyats = 6236;
  const overallProgress = Math.min((totalAyat / totalQuranAyats) * 100, 100);

  const juz30Ayats = 564;
  const juz30Progress = Math.min(((juzProgress[30] || 0) / juz30Ayats) * 100, 100);

  await prisma.hafalan_progress.upsert({
    where: { studentId },
    create: {
      studentId,
      totalSurah: completedSurahs.size,
      totalAyat,
      totalJuz: Object.keys(juzProgress).length,
      juz30Progress,
      overallProgress,
      avgQuality: records.length > 0 ? qualitySum / records.length : 0,
      totalSessions: records.length,
      lastSetoranDate: new Date(),
      lastUpdated: new Date()
    },
    update: {
      totalSurah: completedSurahs.size,
      totalAyat,
      totalJuz: Object.keys(juzProgress).length,
      juz30Progress,
      overallProgress,
      avgQuality: records.length > 0 ? qualitySum / records.length : 0,
      lastSetoranDate: new Date(),
      lastUpdated: new Date()
    }
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const record = await prisma.hafalan_records.findUnique({
      where: { id: params.id },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            nickname: true,
            photo: true
          }
        },
        surah: {
          select: {
            number: true,
            name: true,
            nameArabic: true,
            totalAyat: true,
            juz: true
          }
        },
        teacher: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({ record });

  } catch (error) {
    console.error('Error fetching hafalan record:', error);
    return NextResponse.json(
      { error: 'Failed to fetch record' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      studentId,
      surahNumber,
      startAyat,
      endAyat,
      status,
      quality,
      date,
      fluency,
      tajweed,
      makharijul,
      duration,
      notes,
      corrections,
      voiceNoteUrl
    } = body;

    // Check if record exists
    const existingRecord = await prisma.hafalan_records.findUnique({
      where: { id: params.id }
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    // Only teacher who created the record or admin can update
    if (existingRecord.teacherId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Validation
    if (startAyat && endAyat && startAyat > endAyat) {
      return NextResponse.json(
        { error: 'Start ayat cannot be greater than end ayat' },
        { status: 400 }
      );
    }

    // Check if surah exists and ayat numbers are valid
    if (surahNumber) {
      const surah = await prisma.quran_surahs.findUnique({
        where: { number: parseInt(surahNumber) }
      });

      if (!surah) {
        return NextResponse.json(
          { error: 'Surah not found' },
          { status: 404 }
        );
      }

      if (endAyat && endAyat > surah.totalAyat) {
        return NextResponse.json(
          { error: `Surah ${surah.name} only has ${surah.totalAyat} ayat` },
          { status: 400 }
        );
      }
    }

    const record = await prisma.hafalan_records.update({
      where: { id: params.id },
      data: {
        ...(studentId && { studentId }),
        ...(surahNumber && { surahNumber: parseInt(surahNumber) }),
        ...(startAyat && { startAyat: parseInt(startAyat) }),
        ...(endAyat && { endAyat: parseInt(endAyat) }),
        ...(status && { status }),
        ...(quality && { quality }),
        ...(date && { date: new Date(date) }),
        ...(fluency && { fluency }),
        ...(tajweed && { tajweed }),
        ...(makharijul && { makharijul }),
        ...(duration && { duration: parseInt(duration) }),
        ...(notes !== undefined && { notes }),
        ...(corrections !== undefined && { corrections }),
        ...(voiceNoteUrl !== undefined && { voiceNoteUrl })
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            nickname: true,
            photo: true
          }
        },
        surah: {
          select: {
            number: true,
            name: true,
            nameArabic: true,
            totalAyat: true,
            juz: true
          }
        },
        teacher: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Update student progress
    await updateStudentProgress(existingRecord.studentId);

    return NextResponse.json({
      record,
      message: 'Record updated successfully'
    });

  } catch (error) {
    console.error('Error updating hafalan record:', error);
    return NextResponse.json(
      { error: 'Failed to update record' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if record exists
    const existingRecord = await prisma.hafalan_records.findUnique({
      where: { id: params.id }
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    // Only teacher who created the record or admin can delete
    if (existingRecord.teacherId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // Soft delete the record
    await softDelete(prisma.hafalan_records, { id: params.id }, session.user.id);

    // Update student progress
    await updateStudentProgress(existingRecord.studentId);

    return NextResponse.json({ message: 'Record soft deleted successfully' });

  } catch (error) {
    console.error('Error deleting hafalan record:', error);
    return NextResponse.json(
      { error: 'Failed to delete record' },
      { status: 500 }
    );
  }
}
