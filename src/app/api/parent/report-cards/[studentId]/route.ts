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
      canViewGrades: true // Report cards are grade-related
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
    const reportCardId = searchParams.get('reportCardId');

    // Verify parent has access to this student's report cards
    const parentAccess = await verifyParentAccess(session.user.id, studentId);
    if (!parentAccess) {
      return NextResponse.json({ 
        error: 'Access denied to this student\'s report card data' 
      }, { status: 403 });
    }

    // If specific report card requested
    if (reportCardId) {
      const reportCard = await prisma.report_cards.findFirst({
        where: {
          id: reportCardId,
          studentId,
          status: { not: 'DRAFT' } // Only show finalized report cards
        },
        include: {
          student: {
            select: {
              id: true,
              nis: true,
              fullName: true,
              photo: true,
              institutionType: true,
              grade: true
            }
          },
          semester: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
              academicYear: {
                select: {
                  name: true
                }
              }
            }
          },
          class: {
            select: {
              name: true,
              level: true,
              program: true,
              teacher: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });

      if (!reportCard) {
        return NextResponse.json({ 
          error: 'Report card not found or not available' 
        }, { status: 404 });
      }

      // Get detailed grades for this semester
      const grades = await prisma.grades.findMany({
        where: {
          studentId,
          semesterId: reportCard.semesterId,
          total: { not: null }
        },
        include: {
          subject: {
            select: {
              code: true,
              name: true,
              nameArabic: true,
              category: true,
              credits: true
            }
          }
        },
        orderBy: [
          { subject: { category: 'asc' } },
          { subject: { name: 'asc' } }
        ]
      });

      const formattedReportCard = {
        ...reportCard,
        personality: JSON.parse(reportCard.personality),
        extracurricular: JSON.parse(reportCard.extracurricular),
        achievements: JSON.parse(reportCard.achievements),
        grades: grades.map(grade => ({
          subject: grade.subject,
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
          akhlak: grade.akhlak,
          quranMemory: grade.quranMemory,
          notes: grade.notes
        })),
        totalScore: reportCard.totalScore?.toNumber(),
        attendancePercentage: reportCard.attendancePercentage?.toNumber()
      };

      return NextResponse.json(formattedReportCard);
    }

    // Build where conditions for report cards list
    const whereConditions: any = {
      studentId,
      status: { not: 'DRAFT' } // Only show finalized report cards
    };

    if (semesterId) {
      whereConditions.semesterId = semesterId;
    }

    if (academicYearId) {
      whereConditions.semester = {
        academicYearId
      };
    }

    // Get report cards list
    const reportCards = await prisma.report_cards.findMany({
      where: whereConditions,
      include: {
        semester: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            academicYear: {
              select: {
                name: true,
                isActive: true
              }
            }
          }
        },
        class: {
          select: {
            name: true,
            level: true,
            program: true,
            teacher: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: [
        { semester: { startDate: 'desc' } }
      ]
    });

    // Calculate overall performance trends
    const performanceTrends = reportCards.length >= 2 ? {
      scoreImprovement: reportCards[0].totalScore && reportCards[1].totalScore 
        ? reportCards[0].totalScore.toNumber() - reportCards[1].totalScore.toNumber()
        : null,
      rankImprovement: reportCards[0].rank && reportCards[1].rank
        ? reportCards[1].rank - reportCards[0].rank // Positive means improvement (lower rank number)
        : null,
      attendanceImprovement: reportCards[0].attendancePercentage && reportCards[1].attendancePercentage
        ? reportCards[0].attendancePercentage.toNumber() - reportCards[1].attendancePercentage.toNumber()
        : null
    } : null;

    // Format report cards for response
    const formattedReportCards = reportCards.map(reportCard => ({
      id: reportCard.id,
      semester: reportCard.semester,
      class: reportCard.class,
      totalScore: reportCard.totalScore?.toNumber(),
      rank: reportCard.rank,
      totalSubjects: reportCard.totalSubjects,
      attendanceStats: {
        totalDays: reportCard.totalDays,
        presentDays: reportCard.presentDays,
        sickDays: reportCard.sickDays,
        permittedDays: reportCard.permittedDays,
        absentDays: reportCard.absentDays,
        lateDays: reportCard.lateDays,
        percentage: reportCard.attendancePercentage?.toNumber()
      },
      behavior: reportCard.behavior,
      personality: JSON.parse(reportCard.personality),
      extracurricular: JSON.parse(reportCard.extracurricular),
      achievements: JSON.parse(reportCard.achievements),
      notes: reportCard.notes,
      recommendations: reportCard.recommendations,
      parentNotes: reportCard.parentNotes,
      status: reportCard.status,
      generatedAt: reportCard.generatedAt,
      signedAt: reportCard.signedAt,
      pdfUrl: reportCard.pdfUrl
    }));

    // Get available semesters and academic years
    const availableSemesters = [...new Set(reportCards.map(rc => ({
      id: rc.semester.id,
      name: rc.semester.name,
      academicYear: rc.semester.academicYear.name,
      isActive: rc.semester.academicYear.isActive
    })))];

    const result = {
      studentInfo: {
        id: parentAccess.student.id,
        nis: parentAccess.student.nis,
        fullName: parentAccess.student.fullName,
        photo: parentAccess.student.photo,
        institutionType: parentAccess.student.institutionType,
        grade: parentAccess.student.grade
      },
      reportCards: formattedReportCards,
      performanceTrends,
      availableSemesters,
      summary: {
        totalReportCards: reportCards.length,
        latestReportCard: reportCards[0] ? {
          id: reportCards[0].id,
          semester: reportCards[0].semester.name,
          academicYear: reportCards[0].semester.academicYear.name,
          totalScore: reportCards[0].totalScore?.toNumber(),
          rank: reportCards[0].rank,
          status: reportCards[0].status
        } : null,
        averageScore: reportCards.length > 0
          ? Math.round(reportCards
              .filter(rc => rc.totalScore)
              .reduce((sum, rc) => sum + (rc.totalScore?.toNumber() || 0), 0) / 
              reportCards.filter(rc => rc.totalScore).length * 100) / 100
          : 0,
        averageAttendance: reportCards.length > 0
          ? Math.round(reportCards
              .filter(rc => rc.attendancePercentage)
              .reduce((sum, rc) => sum + (rc.attendancePercentage?.toNumber() || 0), 0) / 
              reportCards.filter(rc => rc.attendancePercentage).length)
          : 0
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching student report cards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}