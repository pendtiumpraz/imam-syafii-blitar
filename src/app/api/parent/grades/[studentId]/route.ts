import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Helper function to verify parent access to student
async function verifyParentAccess(userId: string, studentId: string) {
  const parentStudent = await prisma.parent_students.findFirst({
    where: {
      studentId,
      parent: {
        userId
      },
      canViewGrades: true
    },
    include: {
      parent: true,
      student: {
        select: {
          id: true,
          nis: true,
          fullName: true,
          photo: true,
          institutionType: true,
          grade: true
        }
      }
    }
  });

  return parentStudent;
}

// Grade calculation helpers
function getGradeLevel(score: number): { grade: string; level: string; color: string } {
  if (score >= 90) return { grade: 'A', level: 'Sangat Baik', color: 'green' };
  if (score >= 85) return { grade: 'A-', level: 'Sangat Baik', color: 'green' };
  if (score >= 80) return { grade: 'B+', level: 'Baik', color: 'blue' };
  if (score >= 75) return { grade: 'B', level: 'Baik', color: 'blue' };
  if (score >= 70) return { grade: 'B-', level: 'Baik', color: 'blue' };
  if (score >= 65) return { grade: 'C+', level: 'Cukup', color: 'yellow' };
  if (score >= 60) return { grade: 'C', level: 'Cukup', color: 'yellow' };
  if (score >= 55) return { grade: 'C-', level: 'Cukup', color: 'yellow' };
  if (score >= 50) return { grade: 'D+', level: 'Kurang', color: 'orange' };
  if (score >= 45) return { grade: 'D', level: 'Kurang', color: 'orange' };
  return { grade: 'E', level: 'Gagal', color: 'red' };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'PARENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = params;
    const { searchParams } = new URL(request.url);
    const semesterId = searchParams.get('semesterId');
    const academicYearId = searchParams.get('academicYearId');
    const subjectCategory = searchParams.get('subjectCategory'); // UMUM, AGAMA, MUATAN_LOKAL

    // Verify parent has access to this student's grades
    const parentAccess = await verifyParentAccess(session.user.id, studentId);
    if (!parentAccess) {
      return NextResponse.json({ 
        error: 'Access denied to this student\'s grade data' 
      }, { status: 403 });
    }

    // Build where conditions
    const whereConditions: any = {
      studentId
    };

    if (semesterId) {
      whereConditions.semesterId = semesterId;
    }

    if (academicYearId) {
      whereConditions.semester = {
        academicYearId
      };
    }

    // Get grades with subject filter
    const grades = await prisma.grades.findMany({
      where: whereConditions,
      include: {
        subjects: {
          select: {
            id: true,
            code: true,
            name: true,
            nameArabic: true,
            category: true,
            credits: true,
            type: true
          }
        }
      },
      orderBy: [
        { semesterId: 'desc' }
      ]
    });

    // Filter by subject category if specified
    const filteredGrades = subjectCategory
      ? grades.filter(grade => grade.subjects?.category === subjectCategory)
      : grades;

    // Calculate statistics
    const gradesWithScores = filteredGrades.filter(grade => grade.total !== null);
    
    const stats = {
      totalSubjects: filteredGrades.length,
      gradedSubjects: gradesWithScores.length,
      average: gradesWithScores.length > 0 
        ? Math.round(gradesWithScores.reduce((sum, grade) => sum + (grade.total?.toNumber() || 0), 0) / gradesWithScores.length * 100) / 100
        : 0,
      gpa: gradesWithScores.length > 0
        ? Math.round(gradesWithScores.reduce((sum, grade) => sum + (grade.point?.toNumber() || 0), 0) / gradesWithScores.length * 100) / 100
        : 0
    };

    // Get highest and lowest grades
    const sortedGrades = gradesWithScores.sort((a, b) => (b.total?.toNumber() || 0) - (a.total?.toNumber() || 0));
    const highestGrade = sortedGrades[0];
    const lowestGrade = sortedGrades[sortedGrades.length - 1];

    // Group grades by category
    const gradesByCategory = filteredGrades.reduce((acc, grade) => {
      const category = grade.subjects?.category || 'UMUM';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(grade);
      return acc;
    }, {} as any);

    // Calculate category averages
    const categoryStats = (Object.entries(gradesByCategory) as [string, any[]][]).map(([category, categoryGrades]) => {
      const categoryGradesArray = categoryGrades as any[];
      const categoryGradesWithScores = categoryGradesArray.filter((grade: any) => grade.total !== null);
      const average = categoryGradesWithScores.length > 0
        ? Math.round(categoryGradesWithScores.reduce((sum: number, grade: any) => sum + (grade.total?.toNumber() || 0), 0) / categoryGradesWithScores.length * 100) / 100
        : 0;
      
      return {
        category,
        totalSubjects: categoryGradesArray.length,
        gradedSubjects: categoryGradesWithScores.length,
        average,
        gradeInfo: average > 0 ? getGradeLevel(average) : null
      };
    });

    // Get semester info for all unique semester IDs
    const semesterIds = [...new Set(filteredGrades.map(g => g.semesterId))];
    const semesters = await prisma.semesters.findMany({
      where: { id: { in: semesterIds } },
      include: {
        academic_years: {
          select: { name: true, isActive: true }
        }
      }
    });

    const semesterMap = new Map(semesters.map(s => [s.id, s]));

    // Get semester-wise performance
    const semesterPerformance = Object.entries(
      filteredGrades.reduce((acc, grade) => {
        const semesterId = grade.semesterId;
        const semester = semesterMap.get(semesterId);
        const semesterName = semester ? `${semester.name} - ${semester.academic_years?.name || 'Unknown'}` : 'Unknown';

        if (!acc[semesterId]) {
          acc[semesterId] = {
            id: semesterId,
            name: semesterName,
            semester: semester ? {
              id: semester.id,
              name: semester.name,
              startDate: semester.startDate,
              endDate: semester.endDate,
              academicYear: {
                name: semester.academic_years?.name || 'Unknown',
                isActive: semester.academic_years?.isActive || false
              }
            } : null,
            grades: [],
            stats: {
              totalSubjects: 0,
              gradedSubjects: 0,
              average: 0,
              gpa: 0
            }
          };
        }

        acc[semesterId].grades.push(grade);
        return acc;
      }, {} as any)
    ).map(([semesterId, semesterData]: [string, any]) => {
      const gradesWithScores = semesterData.grades.filter((grade: any) => grade.total !== null);

      semesterData.stats = {
        totalSubjects: semesterData.grades.length,
        gradedSubjects: gradesWithScores.length,
        average: gradesWithScores.length > 0
          ? Math.round(gradesWithScores.reduce((sum: number, grade: any) => sum + (grade.total?.toNumber() || 0), 0) / gradesWithScores.length * 100) / 100
          : 0,
        gpa: gradesWithScores.length > 0
          ? Math.round(gradesWithScores.reduce((sum: number, grade: any) => sum + (grade.point?.toNumber() || 0), 0) / gradesWithScores.length * 100) / 100
          : 0
      };

      return semesterData;
    }).sort((a, b) => {
      if (!a.semester || !b.semester) return 0;
      return new Date(b.semester.startDate).getTime() - new Date(a.semester.startDate).getTime();
    });

    // Get grade trends (improvement/decline analysis)
    const gradeTrends = semesterPerformance.length >= 2 ? {
      trend: semesterPerformance[0].stats.average > semesterPerformance[1].stats.average ? 'improving' : 
             semesterPerformance[0].stats.average < semesterPerformance[1].stats.average ? 'declining' : 'stable',
      difference: Math.round((semesterPerformance[0].stats.average - semesterPerformance[1].stats.average) * 100) / 100,
      lastSemesterAverage: semesterPerformance[1].stats.average,
      currentSemesterAverage: semesterPerformance[0].stats.average
    } : null;

    // Format grades for response
    const formattedGrades = filteredGrades.map(grade => {
      const semester = semesterMap.get(grade.semesterId);
      return {
        id: grade.id,
        subject: grade.subjects || { name: 'Unknown', code: 'N/A', category: 'UMUM' },
        semester: semester ? {
          id: semester.id,
          name: semester.name,
          startDate: semester.startDate,
          endDate: semester.endDate,
          academicYear: {
            name: semester.academic_years?.name || 'Unknown',
            isActive: semester.academic_years?.isActive || false
          }
        } : null,
        scores: {
          midterm: grade.midterm?.toNumber(),
          final: grade.final?.toNumber(),
          assignment: grade.assignment?.toNumber(),
          quiz: grade.quiz?.toNumber(),
          participation: grade.participation?.toNumber(),
          project: grade.project?.toNumber(),
          daily: grade.daily?.toNumber()
        },
        total: grade.total?.toNumber(),
        grade: grade.grade,
        point: grade.point?.toNumber(),
        gradeInfo: grade.total ? getGradeLevel(grade.total.toNumber()) : null,
        akhlak: grade.akhlak,
        quranMemory: grade.quranMemory,
        notes: grade.notes,
        enteredAt: grade.enteredAt,
        isLocked: grade.isLocked
      };
    });

    const result = {
      studentInfo: {
        id: parentAccess.student.id,
        nis: parentAccess.student.nis,
        fullName: parentAccess.student.fullName,
        photo: parentAccess.student.photo,
        institutionType: parentAccess.student.institutionType,
        grade: parentAccess.student.grade
      },
      overallStats: stats,
      highestGrade: highestGrade ? {
        subject: highestGrade.subjects?.name || 'Unknown',
        score: highestGrade.total?.toNumber(),
        grade: highestGrade.grade,
        semester: semesterMap.get(highestGrade.semesterId)?.name || 'Unknown'
      } : null,
      lowestGrade: lowestGrade ? {
        subject: lowestGrade.subjects?.name || 'Unknown',
        score: lowestGrade.total?.toNumber(),
        grade: lowestGrade.grade,
        semester: semesterMap.get(lowestGrade.semesterId)?.name || 'Unknown'
      } : null,
      categoryStats,
      semesterPerformance,
      gradeTrends,
      grades: formattedGrades,
      // Helper data for UI
      availableSemesters: semesters.map(semester => ({
        id: semester.id,
        name: semester.name,
        academicYear: semester.academic_years?.name || 'Unknown',
        isActive: semester.academic_years?.isActive || false
      })),
      availableCategories: [...new Set(filteredGrades.map(grade => grade.subjects?.category || 'UMUM'))]
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching student grades:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}