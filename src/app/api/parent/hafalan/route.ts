import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    // Get parent account with children
    const parentAccount = await prisma.parent_accounts.findUnique({
      where: { userId },
      include: {
        parentStudents: {
          include: {
            student: {
              select: {
                id: true,
                nis: true,
                fullName: true,
                nickname: true,
                photo: true
              }
            }
          }
        }
      }
    });

    if (!parentAccount) {
      return NextResponse.json({ 
        error: 'Parent account not found' 
      }, { status: 404 });
    }

    const children = parentAccount.parentStudents.map(ps => ps.student);
    const targetStudents = studentId ? children.filter(c => c.id === studentId) : children;

    // Get hafalan progress for each child
    const hafalanData = await Promise.all(
      targetStudents.map(async (student) => {
        // Get hafalan progress summary
        const progressSummary = await prisma.hafalan_progress.findUnique({
          where: { studentId: student.id }
        });

        // Get recent hafalan records (last 3 months)
        const recentRecords = await prisma.hafalan_records.findMany({
          where: {
            studentId: student.id,
            createdAt: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 3 months
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 50
        });

        // Get hafalan targets
        const targets = await prisma.hafalan_targets.findMany({
          where: {
            studentId: student.id,
            status: {
              in: ['ACTIVE', 'COMPLETED']
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        // Get hafalan sessions (last 30 days)
        const recentSessions = await prisma.hafalan_sessions.findMany({
          where: {
            studentId: student.id,
            sessionDate: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          },
          orderBy: {
            sessionDate: 'desc'
          },
          take: 10
        });

        // Get hafalan achievements
        const achievements = await prisma.hafalan_achievements.findMany({
          where: {
            studentId: student.id,
            verifiedAt: {
              not: null
            }
          },
          orderBy: {
            earnedAt: 'desc'
          },
          take: 10
        });

        // Get Quran surahs for reference
        const allSurahs = await prisma.quran_surahs.findMany({
          orderBy: { number: 'asc' }
        });

        // Get unique teacher and creator IDs
        const teacherIds = [...new Set([
          ...recentRecords.map(r => r.teacherId),
          ...recentSessions.map(s => s.teacherId)
        ])];
        const creatorIds = [...new Set(targets.map(t => t.createdBy))];

        // Fetch teacher and creator names
        const [teachers, creators] = await Promise.all([
          prisma.users.findMany({
            where: { id: { in: teacherIds } },
            select: { id: true, name: true }
          }),
          prisma.users.findMany({
            where: { id: { in: creatorIds } },
            select: { id: true, name: true }
          })
        ]);

        const teacherMap = new Map(teachers.map(t => [t.id, t]));
        const creatorMap = new Map(creators.map(c => [c.id, c]));
        const surahMap = new Map(allSurahs.map(s => [s.number, s]));

        // Calculate surah completion status
        const completedSurahs = recentRecords.filter(record => record.status === 'MUTQIN');
        const surahStats = completedSurahs.reduce((acc, record) => {
          const surahNumber = record.surahNumber;
          const surah = surahMap.get(surahNumber);

          if (!acc[surahNumber]) {
            acc[surahNumber] = {
              surah: surah || { number: surahNumber, name: 'Unknown', nameArabic: 'Unknown', totalAyat: 0, juz: 0, type: 'MAKKIYAH', meaningId: '' },
              lastRecord: record,
              totalAyat: surah?.totalAyat || 0,
              completedAyat: 0,
              status: record.status,
              quality: record.quality
            };
          }
          acc[surahNumber].completedAyat += (record.endAyat - record.startAyat + 1);

          // Update status to the most recent one
          if (new Date(record.createdAt) > new Date(acc[surahNumber].lastRecord.createdAt)) {
            acc[surahNumber].lastRecord = record;
            acc[surahNumber].status = record.status;
            acc[surahNumber].quality = record.quality;
          }

          return acc;
        }, {} as Record<number, any>);

        // Calculate current memorization target
        const currentTarget = targets.find(target => target.status === 'ACTIVE');

        return {
          student: {
            id: student.id,
            nis: student.nis,
            fullName: student.fullName,
            nickname: student.nickname,
            photo: student.photo
          },
          progress: progressSummary ? {
            totalSurah: progressSummary.totalSurah,
            totalAyat: progressSummary.totalAyat,
            totalJuz: progressSummary.totalJuz.toNumber(),
            currentSurah: progressSummary.currentSurah,
            currentAyat: progressSummary.currentAyat,
            level: progressSummary.level,
            badge: JSON.parse(progressSummary.badge || '[]'),
            juz30Progress: progressSummary.juz30Progress.toNumber(),
            overallProgress: progressSummary.overallProgress.toNumber(),
            lastSetoranDate: progressSummary.lastSetoranDate,
            lastMurajaahDate: progressSummary.lastMurajaahDate,
            currentStreak: progressSummary.currentStreak,
            longestStreak: progressSummary.longestStreak,
            totalSessions: progressSummary.totalSessions,
            avgQuality: progressSummary.avgQuality.toNumber(),
            avgFluency: progressSummary.avgFluency.toNumber(),
            avgTajweed: progressSummary.avgTajweed.toNumber()
          } : {
            totalSurah: 0,
            totalAyat: 0,
            totalJuz: 0,
            currentSurah: null,
            currentAyat: 1,
            level: 'PEMULA',
            badge: [],
            juz30Progress: 0,
            overallProgress: 0,
            lastSetoranDate: null,
            lastMurajaahDate: null,
            currentStreak: 0,
            longestStreak: 0,
            totalSessions: 0,
            avgQuality: 0,
            avgFluency: 0,
            avgTajweed: 0
          },
          surahProgress: Object.values(surahStats),
          recentRecords: recentRecords.map(record => {
            const surah = surahMap.get(record.surahNumber);
            const teacher = teacherMap.get(record.teacherId);
            return {
              id: record.id,
              surah: surah || { number: record.surahNumber, name: 'Unknown', nameArabic: 'Unknown', totalAyat: 0, juz: 0, type: 'MAKKIYAH' },
              startAyat: record.startAyat,
              endAyat: record.endAyat,
              status: record.status,
              quality: record.quality,
              fluency: record.fluency,
              tajweed: record.tajweed,
              makharijul: record.makharijul,
              teacher: teacher?.name || 'Unknown',
              date: record.date,
              notes: record.notes,
              voiceNoteUrl: record.voiceNoteUrl,
              duration: record.duration
            };
          }),
          currentTarget: currentTarget ? {
            id: currentTarget.id,
            surah: surahMap.get(currentTarget.targetSurah) || { number: currentTarget.targetSurah, name: 'Unknown', nameArabic: 'Unknown', totalAyat: 0 },
            startAyat: currentTarget.startAyat,
            endAyat: currentTarget.endAyat,
            targetDate: currentTarget.targetDate,
            priority: currentTarget.priority,
            progress: currentTarget.progress.toNumber(),
            creator: creatorMap.get(currentTarget.createdBy)?.name || 'Unknown'
          } : null,
          recentSessions: recentSessions.map(session => {
            const teacher = teacherMap.get(session.teacherId);
            return {
              id: session.id,
              type: session.type,
              method: session.method,
              duration: session.duration,
              date: session.sessionDate,
              teacher: teacher?.name || 'Unknown',
              overallQuality: session.overallQuality,
              overallFluency: session.overallFluency,
              content: JSON.parse(session.content || '[]'),
              totalAyat: session.totalAyat,
              studentMood: session.studentMood,
              engagement: session.engagement,
              confidence: session.confidence,
              notes: session.notes,
              nextTarget: session.nextTarget
            };
          }),
          achievements: achievements.map(achievement => ({
            id: achievement.id,
            type: achievement.type,
            title: achievement.title,
            description: achievement.description,
            level: achievement.level,
            points: achievement.points,
            icon: achievement.icon,
            color: achievement.color,
            earnedAt: achievement.earnedAt,
            isPublic: achievement.isPublic
          })),
          allSurahs: allSurahs.map(surah => ({
            number: surah.number,
            name: surah.name,
            nameArabic: surah.nameArabic,
            totalAyat: surah.totalAyat,
            juz: surah.juz,
            type: surah.type,
            meaningId: surah.meaningId
          }))
        };
      })
    );

    return NextResponse.json({
      children: hafalanData,
      summary: {
        totalChildren: children.length,
        totalSurahCompleted: hafalanData.reduce((sum, child) => sum + child.progress.totalSurah, 0),
        totalAyatMemorized: hafalanData.reduce((sum, child) => sum + child.progress.totalAyat, 0),
        averageProgress: hafalanData.length > 0 
          ? hafalanData.reduce((sum, child) => sum + child.progress.overallProgress, 0) / hafalanData.length 
          : 0
      }
    });
  } catch (error) {
    console.error('Error fetching hafalan data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}