import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Helper function to calculate completion percentage for a specific juz
async function calculateJuzCompletion(studentId: string, juzNumber: number) {
  const juzSurahs = await prisma.quran_surahs.findMany({
    where: { juz: juzNumber }
  });

  let totalAyats = 0;
  let completedAyats = 0;

  for (const surah of juzSurahs) {
    const ayatsInThisJuz = surah.juz === juzNumber ? surah.totalAyat : 0;
    totalAyats += ayatsInThisJuz;

    // Get completed ayats for this surah
    const records = await prisma.hafalan_records.findMany({
      where: {
        studentId,
        surahNumber: surah.number,
        status: { in: ['LANCAR', 'MUTQIN'] }
      }
    });

    const completedAyatSet = new Set();
    records.forEach(record => {
      for (let i = record.startAyat; i <= record.endAyat; i++) {
        completedAyatSet.add(i);
      }
    });

    completedAyats += completedAyatSet.size;
  }

  return totalAyats > 0 ? (completedAyats / totalAyats) * 100 : 0;
}

// Helper function to calculate streak
async function calculateStreak(studentId: string): Promise<{ current: number, longest: number }> {
  const sessions = await prisma.hafalan_sessions.findMany({
    where: { studentId },
    select: { sessionDate: true },
    orderBy: { sessionDate: 'desc' }
  });

  if (sessions.length === 0) {
    return { current: 0, longest: 0 };
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  const today = new Date();
  const sessionDates = sessions.map(s => new Date(s.sessionDate.getFullYear(), s.sessionDate.getMonth(), s.sessionDate.getDate()));
  const uniqueDates = [...new Set(sessionDates.map(d => d.getTime()))].sort((a, b) => b - a);

  // Calculate current streak
  for (let i = 0; i < uniqueDates.length; i++) {
    const sessionDate = new Date(uniqueDates[i]);
    const daysDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (i === 0 && daysDiff <= 1) {
      currentStreak = 1;
    } else if (i > 0) {
      const prevDate = new Date(uniqueDates[i - 1]);
      const daysBetween = Math.floor((prevDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysBetween === 1) {
        currentStreak++;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  // Calculate longest streak
  tempStreak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const currentDate = new Date(uniqueDates[i]);
    const prevDate = new Date(uniqueDates[i - 1]);
    const daysBetween = Math.floor((prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysBetween === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return { current: currentStreak, longest: longestStreak };
}

// Helper function to generate progress report
async function generateProgressReport(studentId: string) {
  const student = await prisma.students.findUnique({
    where: { id: studentId },
    select: {
      fullName: true,
      nickname: true,
      institutionType: true,
      grade: true,
      enrollmentDate: true
    }
  });

  if (!student) return null;

  // Get progress data
  const progress = await prisma.hafalan_progress.findFirst({
    where: { studentId }
  });

  // Get recent sessions
  const recentSessions = await prisma.hafalan_sessions.findMany({
    where: { studentId },
    orderBy: { sessionDate: 'desc' },
    take: 5
  });

  // Get teacher data for sessions
  const teacherIds = recentSessions.map(s => s.teacherId).filter(Boolean);
  const teachers = await prisma.users.findMany({
    where: { id: { in: teacherIds } },
    select: { id: true, name: true }
  });

  const sessionsWithTeacher = recentSessions.map(session => ({
    ...session,
    teacher: teachers.find(t => t.id === session.teacherId)
  }));

  // Get achievements
  const achievements = await prisma.hafalan_achievements.findMany({
    where: { studentId },
    orderBy: { earnedAt: 'desc' },
    take: 10
  });

  // Calculate monthly progress
  const monthlyStats = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('month', session_date) as month,
      COUNT(*) as sessions,
      SUM(total_ayat) as total_ayat,
      AVG(CASE WHEN overall_quality = 'A' THEN 4 WHEN overall_quality = 'B' THEN 3 ELSE 2 END) as avg_quality
    FROM hafalan_sessions 
    WHERE student_id = ${studentId}
      AND session_date >= NOW() - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', session_date)
    ORDER BY month DESC
  ` as Array<{
    month: Date;
    sessions: number;
    total_ayat: number;
    avg_quality: number;
  }>;

  // Calculate juz-wise progress
  const juzProgress = [];
  for (let i = 1; i <= 30; i++) {
    const completion = await calculateJuzCompletion(studentId, i);
    juzProgress.push({
      juz: i,
      completion: Math.round(completion * 100) / 100
    });
  }

  // Get current targets
  const currentTargets = await prisma.hafalan_targets.findMany({
    where: {
      studentId,
      status: 'ACTIVE'
    },
    orderBy: { targetDate: 'asc' }
  });

  // Get surah data for targets
  const targetSurahNumbers = currentTargets.map(t => t.targetSurah);
  const targetSurahs = await prisma.quran_surahs.findMany({
    where: { number: { in: targetSurahNumbers } },
    select: { number: true, name: true, nameArabic: true }
  });

  const targetsWithSurah = currentTargets.map(target => ({
    ...target,
    surah: targetSurahs.find(s => s.number === target.targetSurah)
  }));

  return {
    student,
    progress,
    recentSessions: sessionsWithTeacher.map(session => ({
      ...session,
      content: JSON.parse(session.content)
    })),
    achievements,
    monthlyStats,
    juzProgress,
    currentTargets: targetsWithSurah,
    generatedAt: new Date()
  };
}

// Helper function to handle analytics
async function handleAnalytics(classId?: string | null, level?: string | null, program?: string | null) {
  let studentWhere: any = { isActive: true };
  
  if (classId) {
    studentWhere.studentClasses = {
      some: { classId, status: 'ACTIVE' }
    };
  }
  
  if (level) {
    studentWhere.grade = level;
  }

  if (program) {
    studentWhere.studentClasses = {
      some: { 
        class: { program },
        status: 'ACTIVE'
      }
    };
  }

  // Get all students in scope
  const students = await prisma.students.findMany({
    where: studentWhere,
    select: { id: true, fullName: true }
  });

  const studentIds = students.map(s => s.id);

  // Analytics queries
  const [
    totalSessions,
    totalRecords,
    completionRates,
    monthlyTrends,
    levelDistribution,
    topPerformers
  ] = await Promise.all([
    // Total sessions
    prisma.hafalan_sessions.count({
      where: { studentId: { in: studentIds } }
    }),
    
    // Total records
    prisma.hafalan_records.count({
      where: { studentId: { in: studentIds } }
    }),
    
    // Completion rates by level
    prisma.hafalan_progress.findMany({
      where: { studentId: { in: studentIds } },
      select: {
        level: true,
        overallProgress: true,
        juz30Progress: true,
        totalSurah: true
      }
    }),
    
    // Monthly trends (last 12 months)
    prisma.$queryRaw<Array<{
      month: Date;
      sessions: number;
      active_students: number;
      total_ayat: number;
      avg_quality: number;
    }>>`
      SELECT 
        DATE_TRUNC('month', session_date) as month,
        COUNT(*) as sessions,
        COUNT(DISTINCT student_id) as active_students,
        SUM(total_ayat) as total_ayat,
        AVG(CASE WHEN overall_quality = 'A' THEN 4 WHEN overall_quality = 'B' THEN 3 ELSE 2 END) as avg_quality
      FROM hafalan_sessions 
      WHERE student_id = ANY(${studentIds})
        AND session_date >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', session_date)
      ORDER BY month DESC
    `,
    
    // Level distribution
    prisma.hafalan_progress.groupBy({
      by: ['level'],
      where: { studentId: { in: studentIds } },
      _count: { level: true },
      _avg: {
        overallProgress: true,
        totalSurah: true
      }
    }),
    
    // Top performers
    prisma.hafalan_progress.findMany({
      where: { studentId: { in: studentIds } },
      orderBy: [
        { overallProgress: 'desc' },
        { totalSurah: 'desc' }
      ],
      take: 10
    })
  ]);

  // Get student data for top performers
  const topPerformerStudentIds = topPerformers.map(p => p.studentId);
  const topPerformerStudents = await prisma.students.findMany({
    where: { id: { in: topPerformerStudentIds } },
    select: { id: true, fullName: true, photo: true, institutionType: true }
  });

  const topPerformersWithStudent = topPerformers.map(performer => ({
    ...performer,
    student: topPerformerStudents.find(s => s.id === performer.studentId)
  }));

  // Process completion rates
  const levelStats = {
    PEMULA: { count: 0, avgProgress: 0, avgJuz30: 0, avgSurah: 0 },
    MENENGAH: { count: 0, avgProgress: 0, avgJuz30: 0, avgSurah: 0 },
    LANJUT: { count: 0, avgProgress: 0, avgJuz30: 0, avgSurah: 0 },
    HAFIDZ: { count: 0, avgProgress: 0, avgJuz30: 0, avgSurah: 0 }
  };

  completionRates.forEach(progress => {
    const level = progress.level as keyof typeof levelStats;
    if (levelStats[level]) {
      levelStats[level].count++;
      levelStats[level].avgProgress += Number(progress.overallProgress);
      levelStats[level].avgJuz30 += Number(progress.juz30Progress);
      levelStats[level].avgSurah += progress.totalSurah;
    }
  });

  // Calculate averages
  Object.keys(levelStats).forEach(level => {
    const stat = levelStats[level as keyof typeof levelStats];
    if (stat.count > 0) {
      stat.avgProgress = Math.round((stat.avgProgress / stat.count) * 100) / 100;
      stat.avgJuz30 = Math.round((stat.avgJuz30 / stat.count) * 100) / 100;
      stat.avgSurah = Math.round((stat.avgSurah / stat.count) * 100) / 100;
    }
  });

  return NextResponse.json({
    analytics: {
      totalStudents: students.length,
      totalSessions,
      totalRecords,
      levelStats,
      monthlyTrends,
      topPerformers: topPerformersWithStudent
    },
    generatedAt: new Date()
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const level = searchParams.get('level');
    const program = searchParams.get('program');
    const studentId = searchParams.get('studentId');
    const report = searchParams.get('report'); // 'detailed' for individual student report
    const analytics = searchParams.get('analytics'); // 'true' for analytics data
    const limit = searchParams.get('limit') || '50';
    const page = searchParams.get('page') || '1';

    // Handle individual student detailed report
    if (studentId && report === 'detailed') {
      const progressReport = await generateProgressReport(studentId);
      if (!progressReport) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }
      return NextResponse.json(progressReport);
    }

    // Handle analytics request
    if (analytics === 'true') {
      return await handleAnalytics(classId, level, program);
    }

    let studentWhere: any = { isActive: true };
    
    if (classId) {
      studentWhere.studentClasses = {
        some: { classId, status: 'ACTIVE' }
      };
    }
    
    if (level) {
      studentWhere.grade = level;
    }

    if (program) {
      // Filter by program type in classes
      studentWhere.studentClasses = {
        some: { 
          class: { program },
          status: 'ACTIVE'
        }
      };
    }

    const students = await prisma.students.findMany({
      where: studentWhere,
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
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

    // Get progress for each student with enhanced data
    const studentsWithProgress = await Promise.all(
      students.map(async (student) => {
        const [
          progress,
          recentRecord,
          currentTarget,
          achievementCount,
          streakData,
          recentSession,
          weeklyStats
        ] = await Promise.all([
          // Progress data
          prisma.hafalan_progress.findFirst({
            where: { studentId: student.id }
          }),
          
          // Most recent record
          prisma.hafalan_records.findFirst({
            where: { studentId: student.id },
            orderBy: { date: 'desc' }
          }),
          
          // Current active target
          prisma.hafalan_targets.findFirst({
            where: {
              studentId: student.id,
              status: 'ACTIVE'
            },
            orderBy: { targetDate: 'asc' }
          }),
          
          // Achievement count
          prisma.hafalan_achievements.count({
            where: { studentId: student.id }
          }),
          
          // Calculate streak data
          calculateStreak(student.id),
          
          // Most recent session
          prisma.hafalan_sessions.findFirst({
            where: { studentId: student.id },
            orderBy: { sessionDate: 'desc' },
            select: {
              sessionDate: true,
              type: true,
              overallQuality: true,
              duration: true,
              totalAyat: true
            }
          }),
          
          // Weekly statistics
          prisma.hafalan_sessions.aggregate({
            where: {
              studentId: student.id,
              sessionDate: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              }
            },
            _count: { id: true },
            _sum: { totalAyat: true },
            _avg: { duration: true }
          })
        ]);

        // Get surah data for recent record and target
        let recentRecordWithSurah = recentRecord;
        let currentTargetWithSurah = currentTarget;

        if (recentRecord) {
          const surah = await prisma.quran_surahs.findFirst({
            where: { number: recentRecord.surahNumber },
            select: { number: true, name: true, nameArabic: true }
          });
          recentRecordWithSurah = recentRecord as any;
          if (surah) {
            recentRecordWithSurah = { ...recentRecord, surah };
          }
        }

        if (currentTarget) {
          const surah = await prisma.quran_surahs.findFirst({
            where: { number: currentTarget.targetSurah },
            select: { number: true, name: true, nameArabic: true }
          });
          currentTargetWithSurah = currentTarget as any;
          if (surah) {
            currentTargetWithSurah = { ...currentTarget, surah };
          }
        }

        // Calculate days since last activity
        let daysSinceLastActivity = null;
        const lastActivityDate = recentSession?.sessionDate || progress?.lastSetoranDate;
        
        if (lastActivityDate) {
          const daysDiff = Math.floor(
            (new Date().getTime() - lastActivityDate.getTime()) / (1000 * 3600 * 24)
          );
          daysSinceLastActivity = daysDiff;
        }

        // Determine activity status with more nuanced categories
        let activityStatus = 'BELUM_MULAI';
        if (daysSinceLastActivity !== null) {
          if (daysSinceLastActivity === 0) {
            activityStatus = 'AKTIF_HARI_INI';
          } else if (daysSinceLastActivity <= 3) {
            activityStatus = 'SANGAT_AKTIF';
          } else if (daysSinceLastActivity <= 7) {
            activityStatus = 'AKTIF';
          } else if (daysSinceLastActivity <= 14) {
            activityStatus = 'KURANG_AKTIF';
          } else if (daysSinceLastActivity <= 30) {
            activityStatus = 'PERLU_MOTIVASI';
          } else {
            activityStatus = 'TIDAK_AKTIF';
          }
        }

        return {
          ...student,
          progress: progress ? {
            ...progress,
            currentStreak: streakData.current,
            longestStreak: streakData.longest
          } : {
            totalSurah: 0,
            totalAyat: 0,
            totalJuz: 0,
            juz30Progress: 0,
            overallProgress: 0,
            level: 'PEMULA',
            currentStreak: 0,
            longestStreak: 0,
            totalSessions: 0,
            avgQuality: 0
          },
          recentRecord: recentRecordWithSurah,
          currentTarget: currentTargetWithSurah,
          achievementCount,
          recentSession,
          weeklyStats: {
            sessions: weeklyStats._count.id || 0,
            totalAyat: weeklyStats._sum.totalAyat || 0,
            avgDuration: Math.round(weeklyStats._avg.duration || 0)
          },
          daysSinceLastActivity,
          activityStatus,
          // Legacy status for backward compatibility
          status: activityStatus === 'SANGAT_AKTIF' ? 'AKTIF' :
                  activityStatus === 'PERLU_MOTIVASI' ? 'KURANG_AKTIF' :
                  activityStatus
        };
      })
    );

    // Sort by progress (descending)
    studentsWithProgress.sort((a, b) => {
      const progressA = Number(a.progress?.overallProgress) || 0;
      const progressB = Number(b.progress?.overallProgress) || 0;
      return progressB - progressA;
    });

    const total = await prisma.students.count({ where: studentWhere });

    // Calculate class/overall statistics
    const statistics = {
      totalStudents: studentsWithProgress.length,
      activeStudents: studentsWithProgress.filter(s => s.status === 'AKTIF' || s.status === 'AKTIF_HARI_INI').length,
      averageProgress: studentsWithProgress.reduce((sum, s) => sum + Number(s.progress?.overallProgress || 0), 0) / studentsWithProgress.length,
      averageJuz30Progress: studentsWithProgress.reduce((sum, s) => sum + Number(s.progress?.juz30Progress || 0), 0) / studentsWithProgress.length,
      totalCompletedSurahs: studentsWithProgress.reduce((sum, s) => sum + Number(s.progress?.totalSurah || 0), 0),
      totalAyatsMemorized: studentsWithProgress.reduce((sum, s) => sum + Number(s.progress?.totalAyat || 0), 0),
      levelDistribution: {
        PEMULA: studentsWithProgress.filter(s => s.progress?.level === 'PEMULA').length,
        MENENGAH: studentsWithProgress.filter(s => s.progress?.level === 'MENENGAH').length,
        LANJUT: studentsWithProgress.filter(s => s.progress?.level === 'LANJUT').length,
        HAFIDZ: studentsWithProgress.filter(s => s.progress?.level === 'HAFIDZ').length
      },
      activityStatus: {
        BELUM_MULAI: studentsWithProgress.filter(s => s.status === 'BELUM_MULAI').length,
        AKTIF_HARI_INI: studentsWithProgress.filter(s => s.status === 'AKTIF_HARI_INI').length,
        AKTIF: studentsWithProgress.filter(s => s.status === 'AKTIF').length,
        KURANG_AKTIF: studentsWithProgress.filter(s => s.status === 'KURANG_AKTIF').length,
        TIDAK_AKTIF: studentsWithProgress.filter(s => s.status === 'TIDAK_AKTIF').length
      }
    };

    return NextResponse.json({
      students: studentsWithProgress,
      statistics: {
        ...statistics,
        activityDistribution: {
          BELUM_MULAI: studentsWithProgress.filter(s => s.activityStatus === 'BELUM_MULAI').length,
          AKTIF_HARI_INI: studentsWithProgress.filter(s => s.activityStatus === 'AKTIF_HARI_INI').length,
          SANGAT_AKTIF: studentsWithProgress.filter(s => s.activityStatus === 'SANGAT_AKTIF').length,
          AKTIF: studentsWithProgress.filter(s => s.activityStatus === 'AKTIF').length,
          KURANG_AKTIF: studentsWithProgress.filter(s => s.activityStatus === 'KURANG_AKTIF').length,
          PERLU_MOTIVASI: studentsWithProgress.filter(s => s.activityStatus === 'PERLU_MOTIVASI').length,
          TIDAK_AKTIF: studentsWithProgress.filter(s => s.activityStatus === 'TIDAK_AKTIF').length
        },
        streakStats: {
          avgCurrentStreak: Math.round(studentsWithProgress.reduce((sum, s) => sum + (s.progress?.currentStreak || 0), 0) / studentsWithProgress.length * 100) / 100,
          avgLongestStreak: Math.round(studentsWithProgress.reduce((sum, s) => sum + (s.progress?.longestStreak || 0), 0) / studentsWithProgress.length * 100) / 100,
          totalWithStreaks: studentsWithProgress.filter(s => (s.progress?.currentStreak || 0) > 0).length
        }
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching hafalan progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}

// POST method for creating/updating student progress
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only teachers and admins can update progress
    if (!session.user?.role || !['USTADZ', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const { studentId, action, data } = body;

    if (!studentId || !action) {
      return NextResponse.json(
        { error: 'Student ID and action are required' },
        { status: 400 }
      );
    }

    // Validate student exists
    const student = await prisma.students.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    let result;

    switch (action) {
      case 'recalculate':
        // Recalculate progress based on existing records
        await updateStudentProgressFromRecords(studentId);
        result = await prisma.hafalan_progress.findFirst({
          where: { studentId }
        });
        break;

      case 'set_target':
        // Set a new hafalan target
        if (!data.surahNumber || !data.targetDate) {
          return NextResponse.json(
            { error: 'Surah number and target date are required' },
            { status: 400 }
          );
        }

        const target = await prisma.hafalan_targets.create({
          data: {
            studentId,
            targetSurah: data.surahNumber,
            startAyat: data.startAyat || 1,
            endAyat: data.endAyat,
            targetDate: new Date(data.targetDate),
            priority: data.priority || 'MEDIUM',
            difficulty: data.difficulty || 'MEDIUM',
            reward: data.reward,
            motivation: data.motivation,
            createdBy: session.user.id,
            notes: data.notes
          }
        });

        // Get surah data
        const surah = await prisma.quran_surahs.findFirst({
          where: { number: data.surahNumber },
          select: { name: true, nameArabic: true }
        });

        result = { ...target, surah } as any;
        break;

      case 'update_level':
        // Manually update student level
        if (!data.level) {
          return NextResponse.json(
            { error: 'Level is required' },
            { status: 400 }
          );
        }

        result = await prisma.hafalan_progress.upsert({
          where: { studentId },
          create: {
            studentId,
            level: data.level,
            lastUpdated: new Date()
          },
          update: {
            level: data.level,
            lastUpdated: new Date()
          }
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      result,
      message: `Action '${action}' completed successfully`
    });

  } catch (error) {
    console.error('Error processing progress action:', error);
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    );
  }
}

// PUT method for batch operations
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can perform batch operations
    if (session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { action, studentIds, data } = body;

    if (!action || !studentIds || !Array.isArray(studentIds)) {
      return NextResponse.json(
        { error: 'Action and student IDs array are required' },
        { status: 400 }
      );
    }

    let results = [];

    switch (action) {
      case 'recalculate_all':
        // Recalculate progress for multiple students
        for (const studentId of studentIds) {
          await updateStudentProgressFromRecords(studentId);
        }
        
        const progressData = await prisma.hafalan_progress.findMany({
          where: { studentId: { in: studentIds } }
        });

        // Get student data
        const progressStudents = await prisma.students.findMany({
          where: { id: { in: studentIds } },
          select: { id: true, fullName: true }
        });

        results = progressData.map(progress => ({
          ...progress,
          student: progressStudents.find(s => s.id === progress.studentId)
        }));
        break;

      case 'bulk_target':
        // Set the same target for multiple students
        if (!data.surahNumber || !data.targetDate) {
          return NextResponse.json(
            { error: 'Surah number and target date are required' },
            { status: 400 }
          );
        }

        for (const studentId of studentIds) {
          await prisma.hafalan_targets.create({
            data: {
              studentId,
              targetSurah: data.surahNumber,
              startAyat: data.startAyat || 1,
              endAyat: data.endAyat,
              targetDate: new Date(data.targetDate),
              priority: data.priority || 'MEDIUM',
              difficulty: data.difficulty || 'MEDIUM',
              reward: data.reward,
              motivation: data.motivation,
              createdBy: session.user.id,
              notes: data.notes
            }
          });
        }

        const targetsData = await prisma.hafalan_targets.findMany({
          where: {
            studentId: { in: studentIds },
            createdBy: session.user.id
          },
          orderBy: { createdAt: 'desc' }
        });

        // Get student data
        const targetStudents = await prisma.students.findMany({
          where: { id: { in: studentIds } },
          select: { id: true, fullName: true }
        });

        // Get surah data
        const targetSurahNumbers = [...new Set(targetsData.map(t => t.targetSurah))];
        const targetSurahs = await prisma.quran_surahs.findMany({
          where: { number: { in: targetSurahNumbers } },
          select: { number: true, name: true, nameArabic: true }
        });

        results = targetsData.map(target => ({
          ...target,
          student: targetStudents.find(s => s.id === target.studentId),
          surah: targetSurahs.find(s => s.number === target.targetSurah)
        }));
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid batch action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      results,
      processed: studentIds.length,
      message: `Batch action '${action}' completed successfully`
    });

  } catch (error) {
    console.error('Error processing batch action:', error);
    return NextResponse.json(
      { error: 'Failed to process batch action' },
      { status: 500 }
    );
  }
}

// Helper function to recalculate progress from records
async function updateStudentProgressFromRecords(studentId: string) {
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
  const juzProgress: { [key: number]: number } = {};

  records.forEach(record => {
    // Count ayats
    totalAyat += (record.endAyat - record.startAyat + 1);

    // Calculate quality score
    const qualityScore = record.quality === 'A' ? 4 : record.quality === 'B' ? 3 : 2;
    qualitySum += qualityScore;

    // Calculate juz progress
    const surah = surahMap.get(record.surahNumber);
    if (surah) {
      const juz = surah.juz;
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

        if (completedAyats.size === surah.totalAyat) {
          completedSurahs.add(record.surahNumber);
        }
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

  // Update progress
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
      totalSessions: sessionCount,
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
      totalSessions: sessionCount,
      lastUpdated: new Date()
    }
  });
}