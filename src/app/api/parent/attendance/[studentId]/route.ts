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
      canViewAttendance: true
    },
    include: {
      parent: true,
      student: {
        select: {
          id: true,
          nis: true,
          fullName: true,
          photo: true
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const month = searchParams.get('month'); // YYYY-MM format
    const year = searchParams.get('year'); // YYYY format

    // Verify parent has access to this student's attendance
    const parentAccess = await verifyParentAccess(session.user.id, studentId);
    if (!parentAccess) {
      return NextResponse.json({ 
        error: 'Access denied to this student\'s attendance data' 
      }, { status: 403 });
    }

    // Build where conditions
    const whereConditions: any = {
      studentId
    };

    // Add semester filter
    if (semesterId) {
      whereConditions.semesterId = semesterId;
    }

    // Add date range filters
    if (startDate && endDate) {
      whereConditions.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    } else if (month) {
      // Month format: YYYY-MM
      const [yearStr, monthStr] = month.split('-');
      const startOfMonth = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
      const endOfMonth = new Date(parseInt(yearStr), parseInt(monthStr), 0);
      
      whereConditions.date = {
        gte: startOfMonth,
        lte: endOfMonth
      };
    } else if (year) {
      // Year format: YYYY
      const yearInt = parseInt(year);
      whereConditions.date = {
        gte: new Date(yearInt, 0, 1),
        lte: new Date(yearInt, 11, 31)
      };
    }

    // Get attendance records
    const attendances = await prisma.attendances.findMany({
      where: whereConditions,
      include: {
        class: {
          select: {
            name: true,
            level: true,
            program: true
          }
        },
        semester: {
          select: {
            name: true,
            academicYear: {
              select: {
                name: true
              }
            }
          }
        },
        marker: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Calculate statistics
    const stats = {
      total: attendances.length,
      present: attendances.filter(att => att.status === 'HADIR').length,
      absent: attendances.filter(att => att.status === 'ALPHA').length,
      sick: attendances.filter(att => att.status === 'SAKIT').length,
      permitted: attendances.filter(att => att.status === 'IZIN').length,
      late: attendances.filter(att => att.status === 'TERLAMBAT').length,
      percentage: 0
    };

    stats.percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

    // Group by month for monthly summary if no specific period requested
    let monthlyStats = {};
    if (!semesterId && !startDate && !month) {
      const groupedByMonth = attendances.reduce((acc, att) => {
        const monthKey = att.date.toISOString().substring(0, 7); // YYYY-MM
        if (!acc[monthKey]) {
          acc[monthKey] = {
            total: 0,
            present: 0,
            absent: 0,
            sick: 0,
            permitted: 0,
            late: 0
          };
        }
        
        acc[monthKey].total++;
        switch (att.status) {
          case 'HADIR':
            acc[monthKey].present++;
            break;
          case 'ALPHA':
            acc[monthKey].absent++;
            break;
          case 'SAKIT':
            acc[monthKey].sick++;
            break;
          case 'IZIN':
            acc[monthKey].permitted++;
            break;
          case 'TERLAMBAT':
            acc[monthKey].late++;
            acc[monthKey].present++; // Late is still present
            break;
        }
        
        return acc;
      }, {} as any);

      // Calculate percentages for monthly stats
      monthlyStats = Object.entries(groupedByMonth).map(([month, stats]: [string, any]) => ({
        month,
        ...stats,
        percentage: Math.round((stats.present / stats.total) * 100)
      })).sort((a, b) => b.month.localeCompare(a.month));
    }

    // Get attendance patterns (day of week analysis)
    const dayOfWeekStats = attendances.reduce((acc, att) => {
      const dayOfWeek = att.date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const dayName = dayNames[dayOfWeek];
      
      if (!acc[dayName]) {
        acc[dayName] = {
          total: 0,
          present: 0,
          absent: 0,
          late: 0
        };
      }
      
      acc[dayName].total++;
      if (att.status === 'HADIR') {
        acc[dayName].present++;
      } else if (att.status === 'ALPHA') {
        acc[dayName].absent++;
      } else if (att.status === 'TERLAMBAT') {
        acc[dayName].late++;
        acc[dayName].present++;
      }
      
      return acc;
    }, {} as any);

    // Convert day of week stats to array with percentages
    const dayPatterns = Object.entries(dayOfWeekStats).map(([day, stats]: [string, any]) => ({
      day,
      ...stats,
      percentage: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0
    }));

    // Get recent attendance alerts (absences in last 7 days)
    const recentAlerts = attendances
      .filter(att => {
        const daysDiff = Math.floor((Date.now() - att.date.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= 7 && (att.status === 'ALPHA' || att.status === 'SAKIT');
      })
      .slice(0, 5);

    const result = {
      studentInfo: {
        id: parentAccess.student.id,
        nis: parentAccess.student.nis,
        fullName: parentAccess.student.fullName,
        photo: parentAccess.student.photo
      },
      stats,
      monthlyStats,
      dayPatterns,
      recentAlerts: recentAlerts.map(att => ({
        date: att.date,
        status: att.status,
        notes: att.notes,
        class: att.class?.name,
        markedBy: att.marker?.name
      })),
      attendanceRecords: attendances.map(att => ({
        id: att.id,
        date: att.date,
        status: att.status,
        timeIn: att.timeIn,
        notes: att.notes,
        class: att.class,
        semester: att.semester,
        markedBy: att.marker?.name,
        markedAt: att.markedAt
      }))
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}