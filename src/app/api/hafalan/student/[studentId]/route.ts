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
    const progress = await prisma.hafalan_progress.findUnique({
      where: { studentId }
    });

    // Get recent records
    let recentRecords: any[] = [];
    if (includeRecords) {
      recentRecords = await prisma.hafalan_records.findMany({
        where: { studentId },
        orderBy: { date: 'desc' },
        take: parseInt(recordLimit),
        include: {
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
    }

    // Get current targets
    const currentTargets = await prisma.hafalan_targets.findMany({
      where: {
        studentId,
        status: 'ACTIVE'
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
        },
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { targetDate: 'asc' }
    });

    // Get achievements
    const achievements = await prisma.hafalan_achievements.findMany({
      where: { studentId },
      orderBy: { earnedAt: 'desc' },
      take: 5
    });

    // Get next schedule
    const nextSchedule = await prisma.setoran_schedules.findFirst({
      where: {
        studentId,
        isActive: true
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Calculate surah completion status
    const allRecords = await prisma.hafalan_records.findMany({
      where: { studentId },
      include: { surah: true }
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