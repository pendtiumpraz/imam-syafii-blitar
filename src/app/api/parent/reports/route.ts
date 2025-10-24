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

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'current_semester';
    const category = searchParams.get('category') || 'comprehensive';
    const studentId = searchParams.get('studentId');

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
                  where: { status: 'ACTIVE' },
                  include: {
                    class: {
                      include: {
                        academicYear: {
                          select: { name: true, isActive: true }
                        }
                      }
                    }
                  }
                },
                grades: {
                  include: {
                    subjects: true
                  }
                },
                attendances: true
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
        academic_years: { select: { name: true } }
      }
    });

    if (!currentSemester) {
      return NextResponse.json({ 
        error: 'No active semester found' 
      }, { status: 404 });
    }

    // Determine date range based on period
    let startDate: Date;
    let endDate: Date = new Date();

    switch (period) {
      case 'current_semester':
        startDate = currentSemester.startDate;
        endDate = currentSemester.endDate;
        break;
      case 'last_semester':
        // Get previous semester
        const lastSemester = await prisma.semesters.findFirst({
          where: { 
            endDate: { lt: currentSemester.startDate }
          },
          orderBy: { endDate: 'desc' }
        });
        startDate = lastSemester?.startDate || new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
        endDate = lastSemester?.endDate || currentSemester.startDate;
        break;
      case 'current_year':
        startDate = new Date(new Date().getFullYear(), 0, 1);
        break;
      case 'last_year':
        startDate = new Date(new Date().getFullYear() - 1, 0, 1);
        endDate = new Date(new Date().getFullYear() - 1, 11, 31);
        break;
      default:
        startDate = currentSemester.startDate;
        endDate = currentSemester.endDate;
    }

    // Process children data
    const children = await Promise.all(
      parentAccount.parentStudents
        .filter(ps => !studentId || ps.student.id === studentId)
        .map(async (parentStudent) => {
          const student = parentStudent.student;
          
          // Get hafalan progress
          const hafalanProgress = await prisma.hafalan_progress.findUnique({
            where: { studentId: student.id }
          });

          // Get payments data
          const payments = await prisma.payments.findMany({
            where: {
              studentId: student.id,
              createdAt: {
                gte: startDate,
                lte: endDate
              }
            }
          });

          // Calculate attendance stats for the period
          const attendances = student.attendances.filter(att => 
            new Date(att.createdAt) >= startDate && new Date(att.createdAt) <= endDate
          );

          const attendancePercentage = attendances.length > 0 
            ? Math.round((attendances.filter(att => att.status === 'HADIR').length / attendances.length) * 100)
            : 0;

          // Calculate grade average for the period
          const periodGrades = student.grades.filter(grade => 
            grade.semesterId === currentSemester.id && grade.total
          );

          const gradeAverage = periodGrades.length > 0 
            ? Math.round(periodGrades.reduce((sum, grade) => sum + (grade.total?.toNumber() || 0), 0) / periodGrades.length * 100) / 100
            : 0;

          // Calculate trend (simplified - comparing to previous period)
          const trend = Math.random() * 10 - 5; // Mock trend data

          // Get current class info
          const currentClass = student.studentClasses.find(sc => 
            sc.status === 'ACTIVE' && sc.class.academicYear.isActive
          );

          return {
            id: student.id,
            fullName: student.fullName,
            nickname: student.nickname,
            nis: student.nis,
            class: currentClass ? currentClass.class.name : 'N/A',
            academic: {
              average: gradeAverage,
              trend: trend,
              subjects: periodGrades.length,
              attendance: attendancePercentage
            },
            hafalan: {
              totalSurah: hafalanProgress?.totalSurah || 0,
              totalAyat: hafalanProgress?.totalAyat || 0,
              level: hafalanProgress?.level || 'PEMULA',
              progress: hafalanProgress?.overallProgress.toNumber() || 0
            },
            payments: {
              totalPaid: payments.filter(p => p.status === 'SUCCESS').reduce((sum, p) => sum + p.amount.toNumber(), 0),
              pending: payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount.toNumber(), 0),
              status: payments.filter(p => p.status === 'PENDING').length > 0 ? 'PENDING' : 'PAID'
            }
          };
        })
    );

    // Calculate summary statistics
    const summary = {
      totalChildren: children.length,
      averageGrades: children.length > 0 
        ? children.reduce((sum, child) => sum + child.academic.average, 0) / children.length 
        : 0,
      averageAttendance: children.length > 0 
        ? Math.round(children.reduce((sum, child) => sum + child.academic.attendance, 0) / children.length)
        : 0,
      totalHafalan: children.reduce((sum, child) => sum + child.hafalan.totalSurah, 0),
      totalPayments: children.reduce((sum, child) => sum + child.payments.totalPaid, 0),
      pendingPayments: children.reduce((sum, child) => sum + child.payments.pending, 0)
    };

    // Generate monthly trends (mock data for now)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      monthlyTrends.push({
        month: date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
        grades: Math.max(60, summary.averageGrades + (Math.random() * 20 - 10)),
        attendance: Math.max(70, summary.averageAttendance + (Math.random() * 20 - 10)),
        hafalan: Math.max(0, Math.min(100, (summary.totalHafalan / children.length) * 10 + (Math.random() * 20 - 10)))
      });
    }

    // Generate comparative analysis
    const comparativeAnalysis = {
      academic: {
        above80: children.filter(child => child.academic.average >= 80).length,
        between70And80: children.filter(child => child.academic.average >= 70 && child.academic.average < 80).length,
        below70: children.filter(child => child.academic.average < 70).length
      },
      attendance: {
        excellent: children.filter(child => child.academic.attendance >= 90).length,
        good: children.filter(child => child.academic.attendance >= 80 && child.academic.attendance < 90).length,
        needsImprovement: children.filter(child => child.academic.attendance < 80).length
      },
      hafalan: {
        advanced: children.filter(child => child.hafalan.level === 'LANJUT' || child.hafalan.level === 'HAFIDZ').length,
        intermediate: children.filter(child => child.hafalan.level === 'MENENGAH').length,
        beginner: children.filter(child => child.hafalan.level === 'PEMULA').length
      }
    };

    const reportsData = {
      children,
      semester: {
        id: currentSemester.id,
        name: currentSemester.name,
        academicYear: currentSemester.academic_years?.name || 'Unknown'
      },
      summary,
      monthlyTrends,
      comparativeAnalysis,
      period,
      category,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    };

    return NextResponse.json(reportsData);
  } catch (error) {
    console.error('Error fetching reports data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}