import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // week, month, quarter, year
    const classId = searchParams.get('classId');
    const level = searchParams.get('level');

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // month
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Build student filter
    let studentWhere: any = { isActive: true };
    
    if (classId) {
      studentWhere.studentClasses = {
        some: { classId, status: 'ACTIVE' }
      };
    }
    
    if (level) {
      studentWhere.grade = level;
    }

    // Get basic counts
    const totalStudents = await prisma.students.count({ where: studentWhere });
    
    const studentsWithProgress = await prisma.students.findMany({
      where: studentWhere
    });

    // Get progress for all students
    const progressRecords = await prisma.hafalan_progress.findMany({
      where: {
        studentId: { in: studentsWithProgress.map(s => s.id) }
      }
    });

    // Map progress to students
    const studentsWithProgressData = studentsWithProgress.map(student => ({
      ...student,
      hafalanProgress: progressRecords.find(p => p.studentId === student.id)
    }));

    // Activity statistics
    const totalSessions = await prisma.hafalan_sessions.count({
      where: {
        sessionDate: { gte: startDate },
        ...(classId || level ? {
          student: studentWhere
        } : {})
      }
    });

    const totalRecords = await prisma.hafalan_records.count({
      where: {
        date: { gte: startDate },
        ...(classId || level ? {
          student: studentWhere
        } : {})
      }
    });

    const activeStudents = await prisma.hafalan_records.groupBy({
      by: ['studentId'],
      where: {
        date: { gte: startDate },
        ...(classId || level ? {
          student: studentWhere
        } : {})
      }
    });

    // Quality distribution
    const qualityStats = await prisma.hafalan_records.groupBy({
      by: ['quality'],
      _count: { quality: true },
      where: {
        date: { gte: startDate },
        ...(classId || level ? {
          student: studentWhere
        } : {})
      }
    });

    // Status distribution
    const statusStats = await prisma.hafalan_records.groupBy({
      by: ['status'],
      _count: { status: true },
      where: {
        date: { gte: startDate },
        ...(classId || level ? {
          student: studentWhere
        } : {})
      }
    });

    // Top performing students
    const topStudents = studentsWithProgressData
      .filter(s => s.hafalanProgress)
      .sort((a, b) => Number(b.hafalanProgress?.overallProgress || 0) - Number(a.hafalanProgress?.overallProgress || 0))
      .slice(0, 10)
      .map(student => ({
        id: student.id,
        name: student.fullName,
        nickname: student.nickname,
        photo: student.photo,
        progress: student.hafalanProgress?.overallProgress || 0,
        totalSurah: student.hafalanProgress?.totalSurah || 0,
        totalAyat: student.hafalanProgress?.totalAyat || 0,
        level: student.hafalanProgress?.level || 'PEMULA'
      }));

    // Most memorized surahs
    const surahStats = await prisma.hafalan_records.groupBy({
      by: ['surahNumber'],
      _count: { surahNumber: true },
      where: {
        status: { in: ['LANCAR', 'MUTQIN'] },
        date: { gte: startDate },
        ...(classId || level ? {
          student: studentWhere
        } : {})
      },
      orderBy: { _count: { surahNumber: 'desc' } },
      take: 10
    });

    // Get surah names for the stats
    const surahNumbers = surahStats.map(s => s.surahNumber);
    const surahDetails = await prisma.quran_surahs.findMany({
      where: { number: { in: surahNumbers } },
      select: { number: true, name: true, nameArabic: true }
    });

    const mostMemorizedSurahs = surahStats.map(stat => {
      const surah = surahDetails.find(s => s.number === stat.surahNumber);
      return {
        surahNumber: stat.surahNumber,
        surahName: surah?.name || '',
        surahNameArabic: surah?.nameArabic || '',
        count: stat._count.surahNumber
      };
    });

    // Daily activity trend (last 30 days)
    const dailyActivity = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const sessionCount = await prisma.hafalan_sessions.count({
        where: {
          sessionDate: { gte: dayStart, lte: dayEnd },
          ...(classId || level ? {
            student: studentWhere
          } : {})
        }
      });

      const recordCount = await prisma.hafalan_records.count({
        where: {
          date: { gte: dayStart, lte: dayEnd },
          ...(classId || level ? {
            student: studentWhere
          } : {})
        }
      });

      dailyActivity.push({
        date: date.toISOString().split('T')[0],
        sessions: sessionCount,
        records: recordCount
      });
    }

    // Level distribution
    const levelDistribution = {
      PEMULA: studentsWithProgressData.filter(s => s.hafalanProgress?.level === 'PEMULA' || !s.hafalanProgress).length,
      MENENGAH: studentsWithProgressData.filter(s => s.hafalanProgress?.level === 'MENENGAH').length,
      LANJUT: studentsWithProgressData.filter(s => s.hafalanProgress?.level === 'LANJUT').length,
      HAFIDZ: studentsWithProgressData.filter(s => s.hafalanProgress?.level === 'HAFIDZ').length
    };

    // Calculate averages
    const studentsWithData = studentsWithProgressData.filter(s => s.hafalanProgress);
    const averages = {
      overallProgress: studentsWithData.length > 0 
        ? studentsWithData.reduce((sum, s) => sum + Number(s.hafalanProgress?.overallProgress || 0), 0) / studentsWithData.length 
        : 0,
      juz30Progress: studentsWithData.length > 0 
        ? studentsWithData.reduce((sum, s) => sum + Number(s.hafalanProgress?.juz30Progress || 0), 0) / studentsWithData.length 
        : 0,
      totalSurah: studentsWithData.length > 0 
        ? studentsWithData.reduce((sum, s) => sum + Number(s.hafalanProgress?.totalSurah || 0), 0) / studentsWithData.length 
        : 0,
      totalAyat: studentsWithData.length > 0 
        ? studentsWithData.reduce((sum, s) => sum + Number(s.hafalanProgress?.totalAyat || 0), 0) / studentsWithData.length 
        : 0,
      quality: studentsWithData.length > 0 
        ? studentsWithData.reduce((sum, s) => sum + Number(s.hafalanProgress?.avgQuality || 0), 0) / studentsWithData.length 
        : 0
    };

    // Recent achievements
    const achievementsBase = await prisma.hafalan_achievements.findMany({
      where: {
        earnedAt: { gte: startDate }
      },
      orderBy: { earnedAt: 'desc' },
      take: 100 // Get more to filter
    });

    // Filter achievements by student criteria and get student data
    let recentAchievements = achievementsBase;
    if (classId || level) {
      const validStudentIds = studentsWithProgressData.map(s => s.id);
      recentAchievements = achievementsBase.filter(a => validStudentIds.includes(a.studentId));
    }
    recentAchievements = recentAchievements.slice(0, 10);

    // Get student data for achievements
    const achievementStudentIds = recentAchievements.map(a => a.studentId);
    const achievementStudents = await prisma.students.findMany({
      where: { id: { in: achievementStudentIds } },
      select: {
        id: true,
        fullName: true,
        nickname: true,
        photo: true
      }
    });

    const achievementsWithStudents = recentAchievements.map(achievement => ({
      ...achievement,
      student: achievementStudents.find(s => s.id === achievement.studentId)
    }));

    const response = {
      period,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: now.toISOString()
      },
      summary: {
        totalStudents,
        activeStudents: activeStudents.length,
        totalSessions,
        totalRecords,
        averages
      },
      distributions: {
        quality: qualityStats.map(q => ({
          quality: q.quality,
          count: q._count.quality,
          percentage: totalRecords > 0 ? (q._count.quality / totalRecords * 100) : 0
        })),
        status: statusStats.map(s => ({
          status: s.status,
          count: s._count.status,
          percentage: totalRecords > 0 ? (s._count.status / totalRecords * 100) : 0
        })),
        levels: Object.entries(levelDistribution).map(([level, count]) => ({
          level,
          count,
          percentage: totalStudents > 0 ? (count / totalStudents * 100) : 0
        }))
      },
      topPerformers: topStudents,
      mostMemorizedSurahs,
      dailyActivity,
      recentAchievements: achievementsWithStudents,
      filters: {
        period,
        classId,
        level
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching hafalan statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}