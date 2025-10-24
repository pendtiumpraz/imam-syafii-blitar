import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = params;
    const { searchParams } = new URL(request.url);
    const includeRecords = searchParams.get('includeRecords') === 'true';
    const recordLimit = searchParams.get('recordLimit') || '10';

    // Check if student exists
    const student = await prisma.students.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        fullName: true,
        nickname: true,
        photo: true,
        grade: true,
        institutionType: true,
        enrollmentDate: true
      }
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Get progress summary
    const progress = await prisma.hafalan_progress.findFirst({
      where: { studentId }
    });

    // Get recent records
    let recentRecords: any[] = [];
    if (includeRecords) {
      const records = await prisma.hafalan_records.findMany({
        where: { studentId },
        orderBy: { date: 'desc' },
        take: parseInt(recordLimit)
      });

      // Fetch surahs and teachers separately
      const surahNumbers = [...new Set(records.map(r => r.surahNumber))];
      const teacherIds = [...new Set(records.map(r => r.teacherId))];

      const [surahs, teachers] = await Promise.all([
        prisma.quran_surahs.findMany({
          where: { number: { in: surahNumbers } },
          select: {
            number: true,
            name: true,
            nameArabic: true,
            totalAyat: true,
            juz: true
          }
        }),
        prisma.users.findMany({
          where: { id: { in: teacherIds } },
          select: {
            id: true,
            name: true
          }
        })
      ]);

      const surahMap = new Map(surahs.map(s => [s.number, s]));
      const teacherMap = new Map(teachers.map(t => [t.id, t]));

      // Attach related data to records
      recentRecords = records.map(record => ({
        ...record,
        surah: surahMap.get(record.surahNumber),
        teacher: teacherMap.get(record.teacherId)
      }));
    }

    // Get current targets
    const targets = await prisma.hafalan_targets.findMany({
      where: {
        studentId,
        status: 'ACTIVE'
      },
      orderBy: { targetDate: 'asc' }
    });

    // Fetch surahs and creators separately for targets
    const targetSurahNumbers = [...new Set(targets.map(t => t.targetSurah))];
    const creatorIds = [...new Set(targets.map(t => t.createdBy))];

    const [targetSurahs, creators] = await Promise.all([
      prisma.quran_surahs.findMany({
        where: { number: { in: targetSurahNumbers } },
        select: {
          number: true,
          name: true,
          nameArabic: true,
          totalAyat: true,
          juz: true
        }
      }),
      prisma.users.findMany({
        where: { id: { in: creatorIds } },
        select: {
          id: true,
          name: true
        }
      })
    ]);

    const targetSurahMap = new Map(targetSurahs.map(s => [s.number, s]));
    const creatorMap = new Map(creators.map(c => [c.id, c]));

    // Attach related data to targets
    const currentTargets = targets.map(target => ({
      ...target,
      surah: targetSurahMap.get(target.targetSurah),
      creator: creatorMap.get(target.createdBy)
    }));

    // Get achievements
    const achievements = await prisma.hafalan_achievements.findMany({
      where: { studentId },
      orderBy: { earnedAt: 'desc' },
      take: 5
    });

    // Get next schedule
    const schedule = await prisma.setoran_schedules.findFirst({
      where: {
        studentId,
        isActive: true
      }
    });

    let nextSchedule = null;
    if (schedule) {
      const scheduleTeacher = await prisma.users.findUnique({
        where: { id: schedule.teacherId },
        select: {
          id: true,
          name: true
        }
      });

      nextSchedule = {
        ...schedule,
        teacher: scheduleTeacher
      };
    }

    // Calculate surah completion status
    const allRecords = await prisma.hafalan_records.findMany({
      where: { studentId }
    });

    const surahStatus: { [key: number]: any } = {};
    
    // Initialize all surahs
    const allSurahs = await prisma.quran_surahs.findMany({
      orderBy: { number: 'asc' }
    });

    allSurahs.forEach(surah => {
      surahStatus[surah.number] = {
        surah,
        status: 'BELUM_DIHAFAL',
        progress: 0,
        lastRecord: null,
        completedAyats: new Set()
      };
    });

    // Process records to determine status
    allRecords.forEach(record => {
      const surahNum = record.surahNumber;
      const surahInfo = surahStatus[surahNum];
      
      if (!surahInfo.lastRecord || record.date > surahInfo.lastRecord.date) {
        surahInfo.lastRecord = record;
      }

      // Add completed ayats
      for (let i = record.startAyat; i <= record.endAyat; i++) {
        if (record.status === 'MUTQIN') {
          surahInfo.completedAyats.add(i);
        }
      }
    });

    // Determine final status and progress for each surah
    Object.keys(surahStatus).forEach(surahNum => {
      const surahInfo = surahStatus[parseInt(surahNum)];
      const totalAyats = surahInfo.surah.totalAyat;
      const completedAyats = surahInfo.completedAyats.size;
      
      surahInfo.progress = (completedAyats / totalAyats) * 100;
      
      if (completedAyats === totalAyats) {
        surahInfo.status = 'MUTQIN';
      } else if (completedAyats > 0) {
        if (surahInfo.lastRecord) {
          surahInfo.status = surahInfo.lastRecord.status;
        } else {
          surahInfo.status = 'SEDANG_DIHAFAL';
        }
      }

      // Convert Set to number for JSON response
      surahInfo.completedAyatsCount = completedAyats;
      delete surahInfo.completedAyats;
    });

    // Calculate juz progress
    const juzProgress: { [key: number]: any } = {};
    for (let juz = 1; juz <= 30; juz++) {
      const juzSurahs = allSurahs.filter(s => s.juz === juz);
      let totalAyats = juzSurahs.reduce((sum, s) => sum + s.totalAyat, 0);
      let completedAyats = 0;

      juzSurahs.forEach(surah => {
        const status = surahStatus[surah.number];
        completedAyats += status.completedAyatsCount || 0;
      });

      juzProgress[juz] = {
        juz,
        progress: totalAyats > 0 ? (completedAyats / totalAyats) * 100 : 0,
        totalAyats,
        completedAyats,
        surahs: juzSurahs.length
      };
    }

    const response = {
      student,
      progress,
      currentTargets,
      achievements,
      nextSchedule,
      surahStatus: Object.values(surahStatus),
      juzProgress,
      statistics: {
        totalRecords: allRecords.length,
        completedSurahs: Object.values(surahStatus).filter((s: any) => s.status === 'MUTQIN').length,
        inProgressSurahs: Object.values(surahStatus).filter((s: any) => s.status !== 'BELUM_DIHAFAL' && s.status !== 'MUTQIN').length,
        totalAyatsMemorized: Object.values(surahStatus).reduce((sum: number, s: any) => sum + (s.completedAyatsCount || 0), 0),
        overallProgress: progress?.overallProgress || 0,
        juz30Progress: progress?.juz30Progress || 0
      }
    };

    if (includeRecords) {
      (response as any).recentRecords = recentRecords;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching student hafalan progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}