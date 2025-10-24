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

    // Get parent account with children
    const parentAccount = await prisma.parent_accounts.findUnique({
      where: { userId },
      include: {
        parentStudents: {
          include: {
            student: {
              include: {
                studentClasses: {
                  where: {
                    status: 'ACTIVE'
                  },
                  include: {
                    class: {
                      include: {
                        teacher: {
                          select: {
                            name: true,
                            email: true
                          }
                        },
                        academicYear: {
                          select: {
                            name: true,
                            isActive: true
                          }
                        }
                      }
                    }
                  }
                },
                grades: {
                  include: {
                    semester: {
                      include: {
                        academicYear: {
                          select: { name: true }
                        }
                      }
                    },
                    subject: {
                      select: {
                        name: true,
                        code: true,
                        category: true
                      }
                    }
                  }
                },
                attendances: {
                  include: {
                    semester: true
                  }
                }
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

    // Get current semester
    const currentSemester = await prisma.semesters.findFirst({
      where: { isActive: true },
      include: {
        academicYear: {
          select: { name: true }
        }
      }
    });

    if (!currentSemester) {
      return NextResponse.json({ 
        error: 'No active semester found' 
      }, { status: 404 });
    }

    // Process children data
    const children = parentAccount.parentStudents.map((parentStudent) => {
      const student = parentStudent.student;
      
      // Calculate current attendance stats
      const currentAttendances = student.attendances.filter(
        (att) => currentSemester && att.semesterId === currentSemester.id
      );
      
      const attendanceStats = {
        totalDays: currentAttendances.length,
        presentDays: currentAttendances.filter((att) => att.status === 'HADIR').length,
        absentDays: currentAttendances.filter((att) => att.status === 'ALPHA').length,
        sickDays: currentAttendances.filter((att) => att.status === 'SAKIT').length,
        permittedDays: currentAttendances.filter((att) => att.status === 'IZIN').length,
        lateDays: currentAttendances.filter((att) => att.status === 'TERLAMBAT').length,
        percentage: currentAttendances.length > 0 
          ? Math.round((currentAttendances.filter((att) => att.status === 'HADIR').length / currentAttendances.length) * 100)
          : 0
      };

      // Calculate current semester grades
      const currentGrades = student.grades.filter(
        (grade) => currentSemester && grade.semesterId === currentSemester.id && grade.total
      );

      const gradeStats = {
        totalSubjects: currentGrades.length,
        average: currentGrades.length > 0 
          ? Math.round(currentGrades.reduce((sum, grade) => sum + (grade.total?.toNumber() || 0), 0) / currentGrades.length * 100) / 100
          : 0,
        subjects: currentGrades.map((grade) => ({
          name: grade.subject.name,
          code: grade.subject.code,
          category: grade.subject.category,
          score: grade.total?.toNumber() || 0,
          grade: grade.grade || 'N/A',
          point: grade.point?.toNumber() || 0
        }))
      };

      // Get current class info
      const currentClass = student.studentClasses.find((sc) => 
        sc.status === 'ACTIVE' && sc.class.academicYear.isActive
      );

      return {
        id: student.id,
        nis: student.nis,
        fullName: student.fullName,
        nickname: student.nickname,
        photo: student.photo,
        institutionType: student.institutionType,
        grade: student.grade,
        currentClass: currentClass ? {
          id: currentClass.class.id,
          name: currentClass.class.name,
          level: currentClass.class.level,
          program: currentClass.class.program,
          teacher: currentClass.class.teacher,
          academicYear: currentClass.class.academicYear.name,
          rollNumber: currentClass.rollNumber
        } : null,
        attendance: attendanceStats,
        grades: gradeStats
      };
    });

    // Get upcoming exams
    const upcomingExams = await prisma.exams.findMany({
      where: {
        date: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
        },
        classId: {
          in: children.map(child => child.currentClass?.id).filter((id): id is string => !!id)
        }
      },
      include: {
        subject: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      },
      take: 10
    });

    // Get recent grades (last 2 weeks)
    const recentGrades = await prisma.grades.findMany({
      where: {
        studentId: {
          in: children.map(child => child.id)
        },
        semesterId: currentSemester.id,
        updatedAt: {
          gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // Last 2 weeks
        },
        total: {
          not: null
        }
      },
      include: {
        student: {
          select: {
            fullName: true,
            nickname: true
          }
        },
        subject: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 20
    });

    // Get teacher feedback (simulated for now as there's no specific feedback model)
    const teacherFeedback = [
      // This would normally come from a dedicated feedback/notes table
      // For now, we'll generate some sample data based on recent activities
      ...recentGrades.slice(0, 5).map(grade => ({
        id: `feedback-${grade.id}`,
        studentName: grade.student.fullName,
        teacher: 'Guru Mata Pelajaran',
        subject: grade.subject.name,
        message: grade.total && grade.total.toNumber() >= 85 
          ? 'Hasil yang sangat memuaskan! Pertahankan semangat belajar.'
          : grade.total && grade.total.toNumber() >= 70
          ? 'Hasil cukup baik, namun masih bisa ditingkatkan dengan latihan lebih.'
          : 'Perlu bimbingan ekstra untuk mata pelajaran ini.',
        date: grade.updatedAt.toISOString(),
        type: grade.total && grade.total.toNumber() >= 85 
          ? 'positive' 
          : grade.total && grade.total.toNumber() >= 70 
          ? 'neutral' 
          : 'concern' as 'positive' | 'neutral' | 'concern'
      }))
    ];

    const academicData = {
      children,
      semester: {
        id: currentSemester.id,
        name: currentSemester.name,
        academicYear: currentSemester.academicYear.name,
        startDate: currentSemester.startDate,
        endDate: currentSemester.endDate
      },
      upcomingExams: upcomingExams.map(exam => ({
        id: exam.id,
        subject: (exam as any).subject?.name || 'Unknown Subject',
        date: exam.date.toISOString(),
        type: exam.type,
        description: exam.name
      })),
      recentGrades: recentGrades.map(grade => ({
        id: grade.id,
        studentName: grade.student.fullName,
        subject: grade.subject.name,
        score: grade.total?.toNumber() || 0,
        grade: grade.grade || 'N/A',
        date: grade.updatedAt.toISOString(),
        type: 'REGULAR' // This could be expanded based on grade type
      })),
      teacherFeedback
    };

    return NextResponse.json(academicData);
  } catch (error) {
    console.error('Error fetching academic data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}