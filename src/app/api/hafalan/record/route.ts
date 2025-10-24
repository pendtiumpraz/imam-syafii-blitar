import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Helper function to calculate quality score
function getQualityScore(quality: string): number {
  switch (quality) {
    case 'A': return 4;
    case 'B': return 3;
    case 'C': return 2;
    default: return 2;
  }
}

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
  const uniqueAyats = new Set<string>(); // Track unique ayats as "surahNumber:ayatNumber"
  let qualitySum = 0;
  let juzProgress: { [key: number]: Set<string> } = {}; // Track unique ayats per juz

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

  // Calculate Juz 30 progress specifically
  const juz30Ayats = 564; // Total ayats in Juz 30
  const juz30UniqueAyats = juzProgress[30] ? juzProgress[30].size : 0;
  const juz30Progress = Math.min((juz30UniqueAyats / juz30Ayats) * 100, 100);

  // Update or create progress record
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
      lastUpdated: new Date()
    },
    update: {
      totalSurah: completedSurahs.size,
      totalAyat,
      juz30Progress: Number(juz30Progress.toFixed(2)),
      overallProgress: Number(overallProgress.toFixed(2)),
      avgQuality: Number(avgQuality.toFixed(2)),
      lastUpdated: new Date()
    }
  });
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
    const surahNumber = searchParams.get('surahNumber');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = searchParams.get('limit') || '50';
    const page = searchParams.get('page') || '1';

    let where: any = {};

    // Filter out soft deleted records
    where.isDeleted = false;

    if (studentId) where.studentId = studentId;
    if (teacherId) where.teacherId = teacherId;
    if (surahNumber) where.surahNumber = parseInt(surahNumber);
    if (status) where.status = status;

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const records = await prisma.hafalan_records.findMany({
      where,
      orderBy: { date: 'desc' },
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

    const total = await prisma.hafalan_records.count({ where });

    return NextResponse.json({
      records,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching hafalan records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch records' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Received body:', JSON.stringify(body, null, 2));

    const {
      studentId,
      surahNumber,
      startAyat,
      endAyat,
      status,
      quality = 'B',
      fluency,
      tajweed,
      makharijul,
      duration,
      method = 'INDIVIDUAL',
      notes,
      corrections,
      voiceNoteUrl
    } = body;

    // Validation
    if (!studentId || !surahNumber || !startAyat || !endAyat || !status) {
      console.error('Validation failed:', { studentId, surahNumber, startAyat, endAyat, status });
      return NextResponse.json(
        { error: 'Missing required fields', received: { studentId, surahNumber, startAyat, endAyat, status } },
        { status: 400 }
      );
    }

    if (startAyat > endAyat) {
      return NextResponse.json(
        { error: 'Start ayat cannot be greater than end ayat' },
        { status: 400 }
      );
    }

    // Check if surah exists and ayat numbers are valid
    const surah = await prisma.quran_surahs.findUnique({
      where: { number: parseInt(surahNumber) }
    });

    if (!surah) {
      return NextResponse.json(
        { error: 'Surah not found' },
        { status: 404 }
      );
    }

    if (endAyat > surah.totalAyat) {
      return NextResponse.json(
        { error: `Surah ${surah.name} only has ${surah.totalAyat} ayat` },
        { status: 400 }
      );
    }

    // Verify teacher exists or create placeholder for admin
    let teacherId = session.user.id;
    const teacher = await prisma.users.findUnique({
      where: { id: session.user.id }
    });

    if (!teacher) {
      console.log('User not found in User table, checking if admin...');
      // If user doesn't exist in User table, try to find or create a default teacher account
      const defaultTeacher = await prisma.users.findFirst({
        where: { role: 'TEACHER' }
      });

      if (defaultTeacher) {
        teacherId = defaultTeacher.id;
        console.log('Using default teacher ID:', teacherId);
      } else {
        // Create a system teacher account if none exists
        const systemTeacher = await prisma.users.create({
          data: {
            username: 'system',
            email: 'system@pondok.com',
            name: 'System',
            role: 'TEACHER',
            password: 'system123', // Will be hashed by the model
            isUstadz: true
          }
        });
        teacherId = systemTeacher.id;
        console.log('Created system teacher:', teacherId);
      }
    }

    // Verify student exists
    const studentExists = await prisma.students.findUnique({
      where: { id: studentId }
    });

    if (!studentExists) {
      console.error('Student not found:', studentId);
      return NextResponse.json(
        { error: 'Student not found', studentId },
        { status: 404 }
      );
    }

    // Create hafalan record
    const record = await prisma.hafalan_records.create({
      data: {
        studentId,
        surahNumber: parseInt(surahNumber),
        startAyat: parseInt(startAyat),
        endAyat: parseInt(endAyat),
        status,
        quality,
        teacherId: teacherId,
        fluency,
        tajweed,
        makharijul,
        duration: duration ? parseInt(duration) : null,
        method,
        notes,
        corrections,
        voiceNoteUrl
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
    await updateStudentProgress(studentId);

    // Update setoran date in progress
    await prisma.hafalan_progress.updateMany({
      where: { studentId },
      data: {
        lastSetoranDate: new Date(),
        totalSessions: { increment: 1 }
      }
    });

    // Check for achievements
    if (status === 'MUTQIN') {
      // Check if student completed the entire surah
      const surahRecords = await prisma.hafalan_records.findMany({
        where: {
          studentId,
          surahNumber: parseInt(surahNumber),
          status: 'MUTQIN'
        }
      });

      const completedAyats = new Set();
      surahRecords.forEach(record => {
        for (let i = record.startAyat; i <= record.endAyat; i++) {
          completedAyats.add(i);
        }
      });

      if (completedAyats.size === surah.totalAyat) {
        // Award surah completion achievement
        await prisma.hafalan_achievements.create({
          data: {
            studentId,
            type: 'SURAH_COMPLETE',
            title: `Menyelesaikan Surah ${surah.name}`,
            description: `Berhasil menghafal dan menguasai seluruh ayat dalam Surah ${surah.name} (${surah.totalAyat} ayat)`,
            data: JSON.stringify({
              surahNumber: surah.number,
              surahName: surah.name,
              totalAyat: surah.totalAyat,
              completedDate: new Date().toISOString()
            }),
            level: surah.totalAyat > 100 ? 'GOLD' : surah.totalAyat > 50 ? 'SILVER' : 'BRONZE',
            points: surah.totalAyat * 10,
            icon: '📖',
            verifiedBy: session.user.id,
            verifiedAt: new Date()
          }
        });
      }
    }

    return NextResponse.json({
      record,
      message: 'Hafalan record created successfully'
    });

  } catch (error) {
    console.error('Error creating hafalan record:', error);
    return NextResponse.json(
      {
        error: 'Failed to create record',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }

    // Check if record exists and user has permission
    const existingRecord = await prisma.hafalan_records.findUnique({
      where: { id }
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

    const record = await prisma.hafalan_records.update({
      where: { id },
      data: updateData,
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