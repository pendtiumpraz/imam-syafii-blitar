import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      studentId,
      type = 'SETORAN_BARU',
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

    // Validation
    if (!studentId || !content || !Array.isArray(content) || content.length === 0) {
      return NextResponse.json(
        { error: 'Student ID and content are required' },
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
      // Create hafalan session
      const hafalanSession = await tx.hafalanSession.create({
        data: {
          studentId,
          teacherId: session.user.id,
          type,
          duration: duration || 15,
          location,
          content: JSON.stringify(content),
          totalAyat: content.reduce((sum, item) => sum + (item.endAyat - item.startAyat + 1), 0),
          overallQuality: overallQuality || 'B',
          overallFluency: overallFluency || 'CUKUP',
          studentMood,
          engagement,
          confidence,
          improvements,
          challenges,
          homework,
          nextTarget,
          notes
        }
      });

      // Create individual hafalan records
      const records = [];
      for (const item of content) {
        const record = await tx.hafalanRecord.create({
          data: {
            studentId,
            surahNumber: parseInt(item.surahNumber),
            startAyat: parseInt(item.startAyat),
            endAyat: parseInt(item.endAyat),
            status: item.status,
            quality: item.quality || 'B',
            teacherId: session.user.id,
            fluency: item.fluency,
            tajweed: item.tajweed,
            makharijul: item.makharijul,
            duration: Math.ceil((duration || 15) / content.length), // Distribute duration
            method: content.length > 1 ? 'GROUP' : 'INDIVIDUAL',
            notes: item.notes,
            corrections: item.corrections
          }
        });
        records.push(record);
      }

      return { session: hafalanSession, records };
    });

    // Update student progress (outside transaction for performance)
    await updateStudentProgress(studentId);

    // Get session with related data
    const sessionWithData = await prisma.hafalan_sessions.findUnique({
      where: { id: result.session.id },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            nickname: true,
            photo: true
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

    // Get records with surah data
    const recordsWithData = await prisma.hafalan_records.findMany({
      where: {
        id: { in: result.records.map(r => r.id) }
      },
      include: {
        surah: {
          select: {
            number: true,
            name: true,
            nameArabic: true,
            totalAyat: true,
            juz: true
          }
        }
      }
    });

    return NextResponse.json({
      session: sessionWithData,
      records: recordsWithData,
      message: 'Setoran recorded successfully'
    });

  } catch (error) {
    console.error('Error recording setoran:', error);
    return NextResponse.json(
      { error: 'Failed to record setoran' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const teacherId = searchParams.get('teacherId');
    const type = searchParams.get('type');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = searchParams.get('limit') || '20';
    const page = searchParams.get('page') || '1';

    let where: any = {};

    if (studentId) where.studentId = studentId;
    if (teacherId) where.teacherId = teacherId;
    if (type) where.type = type;

    if (dateFrom || dateTo) {
      where.sessionDate = {};
      if (dateFrom) where.sessionDate.gte = new Date(dateFrom);
      if (dateTo) where.sessionDate.lte = new Date(dateTo);
    }

    const sessions = await prisma.hafalan_sessions.findMany({
      where,
      orderBy: { sessionDate: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            nickname: true,
            photo: true
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

    // Parse content for each session
    const sessionsWithParsedContent = sessions.map(session => ({
      ...session,
      content: JSON.parse(session.content)
    }));

    const total = await prisma.hafalan_sessions.count({ where });

    return NextResponse.json({
      sessions: sessionsWithParsedContent,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching setoran sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// Helper function to update student progress (same as in record route)
async function updateStudentProgress(studentId: string) {
  const records = await prisma.hafalan_records.findMany({
    where: {
      studentId,
      status: { in: ['LANCAR', 'MUTQIN'] }
    },
    include: { surah: true }
  });

  const completedSurahs = new Set();
  const uniqueAyats = new Set<string>(); // Track unique ayats as "surahNumber:ayatNumber"
  let qualitySum = 0;
  let juzProgress: { [key: number]: Set<string> } = {}; // Track unique ayats per juz

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
      // Check if entire surah is completed
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

    // Track unique ayats across all surahs
    for (let i = record.startAyat; i <= record.endAyat; i++) {
      uniqueAyats.add(`${record.surahNumber}:${i}`);
    }

    qualitySum += getQualityScore(record.quality);

    // Calculate juz progress with unique ayats
    const juz = record.surah.juz;
    if (!juzProgress[juz]) juzProgress[juz] = new Set();
    for (let i = record.startAyat; i <= record.endAyat; i++) {
      juzProgress[juz].add(`${record.surahNumber}:${i}`);
    }
  });

  // Calculate total unique ayats
  const totalAyat = uniqueAyats.size;

  // Calculate overall progress
  const totalQuranAyats = 6236;
  const overallProgress = Math.min((totalAyat / totalQuranAyats) * 100, 100);

  // Calculate Juz 30 progress
  const juz30Ayats = 564;
  const juz30UniqueAyats = juzProgress[30] ? juzProgress[30].size : 0;
  const juz30Progress = Math.min((juz30UniqueAyats / juz30Ayats) * 100, 100);

  const avgQuality = records.length > 0 ? qualitySum / records.length : 0;

  await prisma.hafalan_progress.upsert({
    where: { studentId },
    create: {
      studentId,
      totalSurah: completedSurahs.size,
      totalAyat,
      juz30Progress: Number(juz30Progress.toFixed(2)),
      overallProgress: Number(overallProgress.toFixed(2)),
      avgQuality: Number(avgQuality.toFixed(2)),
      totalSessions: records.length,
      lastSetoranDate: new Date(),
      lastUpdated: new Date()
    },
    update: {
      totalSurah: completedSurahs.size,
      totalAyat,
      juz30Progress: Number(juz30Progress.toFixed(2)),
      overallProgress: Number(overallProgress.toFixed(2)),
      avgQuality: Number(avgQuality.toFixed(2)),
      lastSetoranDate: new Date(),
      lastUpdated: new Date()
    }
  });
}