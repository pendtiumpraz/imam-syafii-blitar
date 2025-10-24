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
    const parentAccount = await prisma.parent_accounts.findFirst({
      where: { userId },
      include: {
        parentStudents: {
          include: {
            student: true
          }
        }
      }
    });

    if (!parentAccount) {
      return NextResponse.json({ 
        error: 'Parent account not found' 
      }, { status: 404 });
    }

    // Get current semester for calculations
    const currentSemester = await prisma.semesters.findFirst({
      where: { isActive: true }
    });

    if (!parentAccount || !parentAccount.parentStudents) {
      return NextResponse.json({ children: [] });
    }

    // Get student IDs for fetching related data separately
    const allStudentIds = parentAccount.parentStudents.map(ps => ps.student.id);

    // Fetch all related data in parallel
    const [studentClasses, grades, attendances, payments] = await Promise.all([
      prisma.student_classes.findMany({
        where: {
          studentId: { in: allStudentIds },
          status: 'ACTIVE'
        },
        include: {
          classes: {
            include: {
              academicYear: {
                select: {
                  name: true,
                  isActive: true
                }
              },
              teacher: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      }),
      prisma.grades.findMany({
        where: {
          studentId: { in: allStudentIds }
        },
        include: {
          subjects: {
            select: {
              name: true,
              code: true,
              category: true
            }
          }
        }
      }),
      prisma.attendances.findMany({
        where: {
          studentId: { in: allStudentIds }
        }
      }),
      prisma.payments.findMany({
        where: {
          studentId: { in: allStudentIds },
          createdAt: {
            gte: new Date(new Date().getFullYear(), 0, 1), // Current year
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    // Create maps for quick lookup
    const studentClassesMap = new Map<string, typeof studentClasses>();
    const gradesMap = new Map<string, typeof grades>();
    const attendancesMap = new Map<string, typeof attendances>();
    const paymentsMap = new Map<string, typeof payments>();

    allStudentIds.forEach((id: string) => {
      studentClassesMap.set(id, []);
      gradesMap.set(id, []);
      attendancesMap.set(id, []);
      paymentsMap.set(id, []);
    });

    studentClasses.forEach(sc => {
      const existing = studentClassesMap.get(sc.studentId) || [];
      existing.push(sc);
      studentClassesMap.set(sc.studentId, existing);
    });

    grades.forEach(g => {
      const existing = gradesMap.get(g.studentId) || [];
      existing.push(g);
      gradesMap.set(g.studentId, existing);
    });

    attendances.forEach(a => {
      const existing = attendancesMap.get(a.studentId) || [];
      existing.push(a);
      attendancesMap.set(a.studentId, existing);
    });

    payments.forEach(p => {
      if (p.studentId) {
        const existing = paymentsMap.get(p.studentId) || [];
        existing.push(p);
        paymentsMap.set(p.studentId, existing);
      }
    });

    // Define types
    interface AttendanceRecord {
      semesterId: string;
      status: string;
    }

    interface GradeRecord {
      semesterId: string;
      total: { toNumber: () => number } | null;
      grade: string | null;
      point: { toNumber: () => number } | null;
      subjects: {
        name: string;
        code: string;
        category: string;
      } | null;
    }

    interface PaymentRecord {
      id: string;
      amount: { toNumber: () => number };
      status: string;
      paymentType: string;
      createdAt: Date;
    }

    interface StudentClass {
      status: string;
      rollNumber: string | null;
      classes: {
        id: string;
        name: string;
        level: string | null;
        program: string | null;
        room: string | null;
        academicYear: {
          name: string;
          isActive: boolean;
        } | null;
        teacher: {
          name: string | null;
          email: string;
        } | null;
      } | null;
    }

    const children = parentAccount.parentStudents.map((parentStudent) => {
      const student = parentStudent.student;

      // Get data from maps
      const studentAttendances = (attendancesMap.get(student.id) || []) as AttendanceRecord[];
      const studentGrades = (gradesMap.get(student.id) || []) as GradeRecord[];
      const studentPayments = (paymentsMap.get(student.id) || []) as PaymentRecord[];

      // Calculate current attendance stats
      const currentAttendances = studentAttendances.filter(
        (att: AttendanceRecord) =>
          currentSemester &&
          att.semesterId === currentSemester.id
      );

      const attendanceStats = {
        totalDays: currentAttendances.length,
        presentDays: currentAttendances.filter((att: AttendanceRecord) => att.status === 'HADIR').length,
        absentDays: currentAttendances.filter((att: AttendanceRecord) => att.status === 'ALPHA').length,
        sickDays: currentAttendances.filter((att: AttendanceRecord) => att.status === 'SAKIT').length,
        permittedDays: currentAttendances.filter((att: AttendanceRecord) => att.status === 'IZIN').length,
        lateDays: currentAttendances.filter((att: AttendanceRecord) => att.status === 'TERLAMBAT').length,
        percentage: currentAttendances.length > 0
          ? Math.round((currentAttendances.filter((att: AttendanceRecord) => att.status === 'HADIR').length / currentAttendances.length) * 100)
          : 0
      };

      // Calculate current semester grades
      const currentGrades = studentGrades.filter(
        (grade: GradeRecord) =>
          currentSemester &&
          grade.semesterId === currentSemester.id &&
          grade.total
      );

      const gradeStats = {
        totalSubjects: currentGrades.length,
        average: currentGrades.length > 0
          ? Math.round(currentGrades.reduce((sum: number, grade: GradeRecord) => sum + (grade.total?.toNumber() || 0), 0) / currentGrades.length * 100) / 100
          : 0,
        subjects: currentGrades.map((grade: GradeRecord) => ({
          name: grade.subjects?.name || 'Unknown',
          code: grade.subjects?.code || 'N/A',
          category: grade.subjects?.category || 'UMUM',
          score: grade.total?.toNumber() || 0,
          grade: grade.grade || 'N/A',
          point: grade.point?.toNumber() || 0
        }))
      };

      // Calculate payment stats
      const paymentStats = {
        totalAmount: studentPayments.reduce((sum: number, payment: PaymentRecord) => sum + payment.amount.toNumber(), 0),
        paidAmount: studentPayments
          .filter((payment: PaymentRecord) => payment.status === 'SUCCESS')
          .reduce((sum: number, payment: PaymentRecord) => sum + payment.amount.toNumber(), 0),
        pendingAmount: studentPayments
          .filter((payment: PaymentRecord) => payment.status === 'PENDING')
          .reduce((sum: number, payment: PaymentRecord) => sum + payment.amount.toNumber(), 0),
        pendingCount: studentPayments.filter((payment: PaymentRecord) => payment.status === 'PENDING').length,
        recentPayments: studentPayments.slice(0, 3).map((payment: PaymentRecord) => ({
          id: payment.id,
          type: payment.paymentType,
          amount: payment.amount.toNumber(),
          status: payment.status,
          date: payment.createdAt
        }))
      };

      // Get current class info from the separately fetched data
      const studentClassList = (studentClassesMap.get(student.id) || []) as StudentClass[];
      const currentClass = studentClassList.find((sc: StudentClass) =>
        sc.status === 'ACTIVE' && sc.classes?.academicYear?.isActive
      );

      return {
        id: student.id,
        nis: student.nis,
        fullName: student.fullName,
        nickname: student.nickname,
        photo: student.photo,
        institutionType: student.institutionType,
        grade: student.grade,
        status: student.status,
        enrollmentYear: student.enrollmentYear,
        enrollmentDate: student.enrollmentDate,
        relationship: parentStudent.relationship,
        isPrimary: parentStudent.isPrimary,
        canViewGrades: parentStudent.canViewGrades,
        canViewAttendance: parentStudent.canViewAttendance,
        canViewPayments: parentStudent.canViewPayments,
        canReceiveMessages: parentStudent.canReceiveMessages,
        currentClass: currentClass && currentClass.classes ? {
          id: currentClass.classes.id,
          name: currentClass.classes.name,
          level: currentClass.classes.level,
          program: currentClass.classes.program,
          room: currentClass.classes.room,
          teacher: currentClass.classes.teacher || null,
          academicYear: currentClass.classes.academicYear?.name || 'Unknown',
          rollNumber: currentClass.rollNumber
        } : null,
        attendance: attendanceStats,
        grades: gradeStats,
        payments: paymentStats
      };
    });

    return NextResponse.json({
      parentInfo: {
        id: parentAccount.id,
        phoneNumber: parentAccount.phoneNumber,
        whatsapp: parentAccount.whatsapp,
        emergencyContact: parentAccount.emergencyContact,
        preferredLanguage: parentAccount.preferredLanguage
      },
      children,
      totalChildren: children.length,
      currentSemester: currentSemester ? {
        id: currentSemester.id,
        name: currentSemester.name,
        startDate: currentSemester.startDate,
        endDate: currentSemester.endDate
      } : null
    });
    
  } catch (error) {
    console.error('Error fetching parent children:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}