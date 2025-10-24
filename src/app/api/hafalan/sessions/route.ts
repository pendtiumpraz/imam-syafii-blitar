import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { softDelete } from '@/lib/soft-delete';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Validation schemas
const createHafalanSessionSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  sessionDate: z.string().optional(),
  type: z.enum(['SETORAN_BARU', 'MURAJA\'AH', 'TES_HAFALAN', 'TALAQQI']),
  method: z.enum(['INDIVIDUAL', 'GROUP', 'PEER_REVIEW']).default('INDIVIDUAL'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  location: z.enum(['KELAS', 'MASJID', 'OUTDOOR', 'ONLINE']).default('KELAS'),
  atmosphere: z.enum(['FORMAL', 'CASUAL', 'COMPETITIVE']).default('FORMAL'),
  content: z.array(z.object({
    surahNumber: z.number().min(1).max(114),
    startAyat: z.number().min(1),
    endAyat: z.number().min(1),
    status: z.enum(['BARU', 'MURAJA\'AH', 'LANCAR', 'MUTQIN']),
    quality: z.enum(['A', 'B', 'C']).default('B'),
    fluency: z.enum(['LANCAR', 'TERBATA', 'TERPUTUS']).optional(),
    tajweed: z.enum(['SANGAT_BAIK', 'BAIK', 'CUKUP', 'KURANG']).optional(),
    makharijul: z.enum(['SANGAT_BAIK', 'BAIK', 'CUKUP', 'KURANG']).optional(),
    notes: z.string().optional(),
    corrections: z.string().optional(),
    voiceNoteUrl: z.string().url().optional()
  })),
  overallQuality: z.enum(['A', 'B', 'C']),
  overallFluency: z.enum(['LANCAR', 'CUKUP', 'KURANG']),
  improvements: z.string().optional(),
  challenges: z.string().optional(),
  homework: z.string().optional(),
  nextTarget: z.string().optional(),
  reminderNote: z.string().optional(),
  studentMood: z.enum(['ENTHUSIASTIC', 'NORMAL', 'TIRED', 'STRUGGLING']).default('NORMAL'),
  engagement: z.enum(['EXCELLENT', 'GOOD', 'AVERAGE', 'POOR']).default('GOOD'),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  reportSent: z.boolean().default(false),
  parentFeedback: z.string().optional(),
  notes: z.string().optional()
});

// Helper function to update student progress after session
async function updateStudentProgress(studentId: string) {
  // Get all MUTQIN and LANCAR records
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
  const juzProgress: { [key: number]: number } = {};

  records.forEach(record => {
    // Count ayats
    totalAyat += (record.endAyat - record.startAyat + 1);
    
    // Calculate quality score
    const qualityScore = record.quality === 'A' ? 4 : record.quality === 'B' ? 3 : 2;
    qualitySum += qualityScore;

    // Calculate juz progress
    const juz = record.surah.juz;
    if (!juzProgress[juz]) juzProgress[juz] = 0;
    juzProgress[juz] += (record.endAyat - record.startAyat + 1);

    // Check if entire surah is completed with MUTQIN status
    if (record.status === 'MUTQIN') {
      const surahRecords = records.filter(r => 
        r.surahNumber === record.surahNumber && r.status === 'MUTQIN'
      );
      
      const completedAyats = new Set();
      surahRecords.forEach(r => {
        for (let i = r.startAyat; i <= r.endAyat; i++) {
          completedAyats.add(i);
        }
      });
      
      if (completedAyats.size === record.surah.totalAyat) {
        completedSurahs.add(record.surahNumber);
      }
    }
  });

  // Calculate progress percentages
  const totalQuranAyats = 6236;
  const overallProgress = Math.min((totalAyat / totalQuranAyats) * 100, 100);
  
  // Juz 30 specific calculation
  const juz30Ayats = 564;
  const juz30Progress = Math.min(((juzProgress[30] || 0) / juz30Ayats) * 100, 100);

  // Determine level based on progress
  let level = 'PEMULA';
  if (completedSurahs.size >= 30 || overallProgress >= 80) {
    level = 'HAFIDZ';
  } else if (completedSurahs.size >= 10 || overallProgress >= 40) {
    level = 'LANJUT';
  } else if (completedSurahs.size >= 3 || overallProgress >= 15) {
    level = 'MENENGAH';
  }

  // Get session count
  const sessionCount = await prisma.hafalan_sessions.count({
    where: { studentId }
  });

  // Update or create progress
  await prisma.hafalan_progress.upsert({
    where: { studentId },
    create: {
      studentId,
      totalSurah: completedSurahs.size,
      totalAyat,
      totalJuz: Object.keys(juzProgress).length,
      juz30Progress,
      overallProgress,
      level,
      avgQuality: records.length > 0 ? qualitySum / records.length : 0,
      totalSessions: sessionCount + 1,
      lastSetoranDate: new Date(),
      lastUpdated: new Date()
    },
    update: {
      totalSurah: completedSurahs.size,
      totalAyat,
      totalJuz: Object.keys(juzProgress).length,
      juz30Progress,
      overallProgress,
      level,
      avgQuality: records.length > 0 ? qualitySum / records.length : 0,
      totalSessions: sessionCount + 1,
      lastSetoranDate: new Date(),
      lastUpdated: new Date()
    }
  });
}

// Helper function to check and create achievements
async function checkAchievements(studentId: string, sessionData: any, teacherId: string) {
  const achievements = [];
  
  // Check for session-based achievements
  const sessionCount = await prisma.hafalan_sessions.count({
    where: { studentId }
  });

  // First session achievement
  if (sessionCount === 1) {
    achievements.push({
      studentId,
      type: 'FIRST_SESSION',
      title: 'Memulai Perjalanan Hafalan',
      description: 'Selamat! Ini adalah sesi hafalan pertama Anda',
      data: JSON.stringify({
        sessionDate: new Date().toISOString(),
        type: sessionData.type
      }),
      level: 'BRONZE',
      points: 10,
      icon: '🌟',
      verifiedBy: teacherId,
      verifiedAt: new Date()
    });
  }

  // Consistency achievements (every 10 sessions)
  if (sessionCount > 0 && sessionCount % 10 === 0) {
    achievements.push({
      studentId,
      type: 'CONSISTENCY',
      title: `${sessionCount} Sesi Hafalan`,
      description: `Konsistensi yang luar biasa! Telah menyelesaikan ${sessionCount} sesi hafalan`,
      data: JSON.stringify({
        sessionCount,
        achievementDate: new Date().toISOString()
      }),
      level: sessionCount >= 50 ? 'GOLD' : sessionCount >= 25 ? 'SILVER' : 'BRONZE',
      points: sessionCount * 2,
      icon: '📚',
      verifiedBy: teacherId,
      verifiedAt: new Date()
    });
  }

  // Quality achievement - all A grades in a session
  if (sessionData.overallQuality === 'A' && sessionData.content.every((c: any) => c.quality === 'A')) {
    achievements.push({
      studentId,
      type: 'QUALITY_EXCELLENCE',
      title: 'Kualitas Sempurna',
      description: 'Mencapai kualitas A untuk semua hafalan dalam sesi ini',
      data: JSON.stringify({
        sessionDate: new Date().toISOString(),
        content: sessionData.content
      }),
      level: 'GOLD',
      points: 50,
      icon: '⭐',
      verifiedBy: teacherId,
      verifiedAt: new Date()
    });
  }

  // Create achievements
  for (const achievement of achievements) {
    try {
      await prisma.hafalan_achievements.create({ data: achievement });
    } catch (error) {
      // Achievement might already exist, continue
      console.log('Achievement already exists or error creating:', error);
    }
  }

  return achievements;
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause
    let where: any = {};
    
    if (studentId) where.studentId = studentId;
    if (teacherId) where.teacherId = teacherId;
    if (type) where.type = type;
    
    if (dateFrom || dateTo) {
      where.sessionDate = {};
      if (dateFrom) where.sessionDate.gte = new Date(dateFrom);
      if (dateTo) where.sessionDate.lte = new Date(dateTo + 'T23:59:59.999Z');
    }

    const [sessions, total] = await Promise.all([
      prisma.hafalan_sessions.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              fullName: true,
              nickname: true,
              photo: true,
              institutionType: true,
              grade: true
            }
          },
          teacher: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { sessionDate: 'desc' },
        skip,
        take: limit
      }),
      prisma.hafalan_sessions.count({ where })
    ]);

    // Parse content JSON for each session
    const sessionsWithParsedContent = sessions.map(session => ({
      ...session,
      content: JSON.parse(session.content)
    }));

    return NextResponse.json({
      sessions: sessionsWithParsedContent,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching hafalan sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
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

    // Only teachers and admins can create sessions
    if (!session.user?.role || !['USTADZ', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const validated = createHafalanSessionSchema.parse(body);

    // Validate student exists
    const student = await prisma.students.findUnique({
      where: { id: validated.studentId }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Validate surah numbers and ayat ranges
    const surahNumbers = validated.content.map(c => c.surahNumber);
    const surahs = await prisma.quran_surahs.findMany({
      where: { number: { in: surahNumbers } }
    });

    if (surahs.length !== surahNumbers.length) {
      return NextResponse.json(
        { error: 'One or more surahs not found' },
        { status: 400 }
      );
    }

    // Validate ayat ranges
    for (const content of validated.content) {
      const surah = surahs.find(s => s.number === content.surahNumber);
      if (!surah) continue;

      if (content.startAyat > content.endAyat) {
        return NextResponse.json(
          { error: `Invalid ayat range for Surah ${surah.name}` },
          { status: 400 }
        );
      }

      if (content.endAyat > surah.totalAyat) {
        return NextResponse.json(
          { error: `Surah ${surah.name} only has ${surah.totalAyat} ayat` },
          { status: 400 }
        );
      }
    }

    // Calculate total ayat covered
    const totalAyat = validated.content.reduce((sum, content) => 
      sum + (content.endAyat - content.startAyat + 1), 0
    );

    // Create hafalan session
    const hafalanSession = await prisma.hafalan_sessions.create({
      data: {
        studentId: validated.studentId,
        teacherId: session.user?.id || '',
        sessionDate: validated.sessionDate ? new Date(validated.sessionDate) : new Date(),
        type: validated.type,
        method: validated.method,
        duration: validated.duration,
        location: validated.location,
        atmosphere: validated.atmosphere,
        content: JSON.stringify(validated.content),
        totalAyat,
        overallQuality: validated.overallQuality,
        overallFluency: validated.overallFluency,
        improvements: validated.improvements,
        challenges: validated.challenges,
        homework: validated.homework,
        nextTarget: validated.nextTarget,
        reminderNote: validated.reminderNote,
        studentMood: validated.studentMood,
        engagement: validated.engagement,
        confidence: validated.confidence,
        reportSent: validated.reportSent,
        parentFeedback: validated.parentFeedback,
        notes: validated.notes
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            nickname: true,
            photo: true,
            institutionType: true,
            grade: true
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

    // Create individual hafalan records for each content item
    for (const content of validated.content) {
      await prisma.hafalan_records.create({
        data: {
          studentId: validated.studentId,
          surahNumber: content.surahNumber,
          startAyat: content.startAyat,
          endAyat: content.endAyat,
          status: content.status,
          quality: content.quality,
          teacherId: session.user?.id || '',
          fluency: content.fluency,
          tajweed: content.tajweed,
          makharijul: content.makharijul,
          duration: validated.duration,
          method: validated.method,
          notes: content.notes,
          corrections: content.corrections,
          voiceNoteUrl: content.voiceNoteUrl
        }
      });
    }

    // Update student progress
    await updateStudentProgress(validated.studentId);

    // Check for achievements
    await checkAchievements(validated.studentId, validated, session.user?.id || '');

    return NextResponse.json({
      session: {
        ...hafalanSession,
        content: JSON.parse(hafalanSession.content)
      },
      message: 'Hafalan session created successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating hafalan session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
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
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Check if session exists and user has permission
    const existingSession = await prisma.hafalan_sessions.findUnique({
      where: { id }
    });

    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Only the teacher who created the session or admin can update
    if (existingSession.teacherId !== session.user?.id && session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Update session
    const updatedSession = await prisma.hafalan_sessions.update({
      where: { id },
      data: {
        ...updateData,
        content: updateData.content ? JSON.stringify(updateData.content) : undefined
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            nickname: true,
            photo: true,
            institutionType: true,
            grade: true
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

    return NextResponse.json({
      session: {
        ...updatedSession,
        content: JSON.parse(updatedSession.content)
      },
      message: 'Session updated successfully'
    });

  } catch (error) {
    console.error('Error updating hafalan session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Check if session exists and user has permission
    const existingSession = await prisma.hafalan_sessions.findUnique({
      where: { id: sessionId }
    });

    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Only admin can delete sessions
    if (session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await softDelete(prisma.hafalan_sessions, { id: sessionId }, session.user.id);

    // Update student progress after deletion
    await updateStudentProgress(existingSession.studentId);

    return NextResponse.json({
      message: 'Session soft deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting hafalan session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}