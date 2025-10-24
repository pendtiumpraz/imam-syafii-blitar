import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hafalanSession = await prisma.hafalan_sessions.findUnique({
      where: { id: params.id }
    });

    if (!hafalanSession) {
      return NextResponse.json({ error: 'Hafalan session not found' }, { status: 404 });
    }

    // Get student and teacher data
    const student = await prisma.students.findUnique({
      where: { id: hafalanSession.studentId },
      select: {
        id: true,
        fullName: true,
        nickname: true,
        photo: true
      }
    });

    const teacher = await prisma.users.findUnique({
      where: { id: hafalanSession.teacherId },
      select: {
        id: true,
        name: true
      }
    });

    // Parse content and get related records
    const recordsData = await prisma.hafalan_records.findMany({
      where: {
        studentId: hafalanSession.studentId,
        createdAt: {
          gte: new Date(hafalanSession.createdAt.getTime() - 1000), // 1 second before
          lte: new Date(hafalanSession.createdAt.getTime() + 60000) // 1 minute after
        }
      }
    });

    // Get surah data for records
    const surahNumbers = [...new Set(recordsData.map(r => r.surahNumber))];
    const surahs = await prisma.quran_surahs.findMany({
      where: { number: { in: surahNumbers } },
      select: {
        number: true,
        name: true,
        nameArabic: true,
        totalAyat: true,
        juz: true
      }
    });

    const records = recordsData.map(record => ({
      ...record,
      surah: surahs.find(s => s.number === record.surahNumber)
    }));

    return NextResponse.json({
      session: {
        ...hafalanSession,
        content: JSON.parse(hafalanSession.content),
        student,
        teacher
      },
      records
    });

  } catch (error) {
    console.error('Error fetching hafalan session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hafalan session' },
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
      type,
      content, // Array of {surahNumber, startAyat, endAyat, quality, status}
      duration,
      location = 'KELAS',
      overallQuality,
      overallFluency,
      studentMood = 'NORMAL',
      engagement = 'GOOD',
      confidence = 'MEDIUM',
      improvements,
      challenges,
      homework,
      nextTarget,
      notes
    } = body;

    // Check if session exists
    const existingSession = await prisma.hafalan_sessions.findUnique({
      where: { id: params.id }
    });

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Hafalan session not found' },
        { status: 404 }
      );
    }

    // Validation
    if (!content || !Array.isArray(content) || content.length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Validate content items
    for (const item of content) {
      if (!item.surahNumber || !item.startAyat || !item.endAyat || !item.status) {
        return NextResponse.json(
          { error: 'Each content item must have surahNumber, startAyat, endAyat, and status' },
          { status: 400 }
        );
      }
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update hafalan session
      const updatedSession = await tx.hafalan_sessions.update({
        where: { id: params.id },
        data: {
          type,
          duration: duration || existingSession.duration,
          location,
          content: JSON.stringify(content),
          totalAyat: content.reduce((sum, item) => sum + (item.endAyat - item.startAyat + 1), 0),
          overallQuality: overallQuality || existingSession.overallQuality,
          overallFluency: overallFluency || existingSession.overallFluency,
          studentMood,
          engagement,
          confidence,
          improvements,
          challenges,
          homework,
          nextTarget,
          notes,
          updatedAt: new Date()
        }
      });

      // Delete existing records for this session (approximate by time range)
      await tx.hafalan_records.deleteMany({
        where: {
          studentId: existingSession.studentId,
          createdAt: {
            gte: new Date(existingSession.createdAt.getTime() - 1000),
            lte: new Date(existingSession.createdAt.getTime() + 60000)
          }
        }
      });

      // Create new hafalan records
      const records = [];
      for (const item of content) {
        const record = await tx.hafalan_records.create({
          data: {
            studentId: existingSession.studentId,
            surahNumber: parseInt(item.surahNumber),
            startAyat: parseInt(item.startAyat),
            endAyat: parseInt(item.endAyat),
            status: item.status,
            quality: item.quality || 'B',
            teacherId: session.user.id,
            fluency: item.fluency,
            tajweed: item.tajweed,
            makharijul: item.makharijul,
            duration: Math.ceil((duration || existingSession.duration) / content.length),
            method: content.length > 1 ? 'GROUP' : 'INDIVIDUAL',
            notes: item.notes,
            corrections: item.corrections
          }
        });
        records.push(record);
      }

      return { session: updatedSession, records };
    });

    // Update student progress
    await updateStudentProgress(existingSession.studentId);

    // Get updated session with related data
    const sessionData = await prisma.hafalan_sessions.findUnique({
      where: { id: params.id }
    });

    // Get student and teacher data
    const student = await prisma.students.findUnique({
      where: { id: existingSession.studentId },
      select: {
        id: true,
        fullName: true,
        nickname: true,
        photo: true
      }
    });

    const teacher = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true
      }
    });

    const sessionWithData = {
      ...sessionData,
      student,
      teacher
    };

    // Get records with surah data
    const recordsData = await prisma.hafalan_records.findMany({
      where: {
        id: { in: result.records.map(r => r.id) }
      }
    });

    // Get surah data
    const surahNumbers = [...new Set(recordsData.map(r => r.surahNumber))];
    const surahs = await prisma.quran_surahs.findMany({
      where: { number: { in: surahNumbers } },
      select: {
        number: true,
        name: true,
        nameArabic: true,
        totalAyat: true,
        juz: true
      }
    });

    const recordsWithData = recordsData.map(record => ({
      ...record,
      surah: surahs.find(s => s.number === record.surahNumber)
    }));

    return NextResponse.json({
      session: sessionWithData,
      records: recordsWithData,
      message: 'Hafalan session updated successfully'
    });

  } catch (error) {
    console.error('Error updating hafalan session:', error);
    return NextResponse.json(
      { error: 'Failed to update hafalan session' },
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

    // Check if session exists
    const existingSession = await prisma.hafalan_sessions.findUnique({
      where: { id: params.id }
    });

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Hafalan session not found' },
        { status: 404 }
      );
    }

    // Start transaction to delete session and related records
    await prisma.$transaction(async (tx) => {
      // Delete related records (approximate by time range)
      await tx.hafalan_records.deleteMany({
        where: {
          studentId: existingSession.studentId,
          createdAt: {
            gte: new Date(existingSession.createdAt.getTime() - 1000),
            lte: new Date(existingSession.createdAt.getTime() + 60000)
          }
        }
      });

      // Delete session
      await tx.hafalan_sessions.delete({
        where: { id: params.id }
      });
    });

    // Update student progress
    await updateStudentProgress(existingSession.studentId);

    return NextResponse.json({ message: 'Hafalan session deleted successfully' });

  } catch (error) {
    console.error('Error deleting hafalan session:', error);
    return NextResponse.json(
      { error: 'Failed to delete hafalan session' },
      { status: 500 }
    );
  }
}

// Helper function to update student progress (same as in setoran route)
async function updateStudentProgress(studentId: string) {
  const records = await prisma.hafalan_records.findMany({
    where: {
      studentId,
      status: { in: ['LANCAR', 'MUTQIN'] }
    }
  });

  // Get surah data for records
  const surahNumbers = [...new Set(records.map(r => r.surahNumber))];
  const surahs = await prisma.quran_surahs.findMany({
    where: { number: { in: surahNumbers } }
  });

  const surahMap = new Map(surahs.map(s => [s.number, s]));

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
    const surah = surahMap.get(record.surahNumber);

    if (record.status === 'MUTQIN' && surah) {
      const surahRecords = records.filter(r => r.surahNumber === record.surahNumber);
      const surahAyats = new Set();
      surahRecords.forEach(r => {
        for (let i = r.startAyat; i <= r.endAyat; i++) {
          surahAyats.add(i);
        }
      });

      if (surahAyats.size === surah.totalAyat) {
        completedSurahs.add(record.surahNumber);
      }
    }

    totalAyat += (record.endAyat - record.startAyat + 1);
    qualitySum += getQualityScore(record.quality);

    if (surah) {
      const juz = surah.juz;
      if (!juzProgress[juz]) juzProgress[juz] = 0;
      juzProgress[juz] += (record.endAyat - record.startAyat + 1);
    }
  });

  const totalQuranAyats = 6236;
  const overallProgress = Math.min((totalAyat / totalQuranAyats) * 100, 100);

  const juz30Ayats = 564;
  const juz30Progress = Math.min(((juzProgress[30] || 0) / juz30Ayats) * 100, 100);

  // Find existing progress record
  const existingProgress = await prisma.hafalan_progress.findFirst({
    where: { studentId }
  });

  if (existingProgress) {
    await prisma.hafalan_progress.update({
      where: { id: existingProgress.id },
      data: {
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
  } else {
    await prisma.hafalan_progress.create({
      data: {
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
      }
    });
  }
}