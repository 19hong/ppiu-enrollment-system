import prisma from '../config/database';
import { NotFoundError } from '../utils/errors';

export const dashboardService = {
  async getAdminStats() {
    const [
      totalStudents,
      totalCourses,
      totalPrograms,
      totalDepartments,
      newApplications,
      pendingEnrollments,
      approvedEnrollments,
      payments,
      recentActivities,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.course.count(),
      prisma.program.count(),
      prisma.department.count(),
      prisma.application.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.enrollment.count({ where: { status: 'PENDING' } }),
      prisma.enrollment.count({ where: { status: 'APPROVED' } }),
      prisma.payment.aggregate({
        _sum: { paidAmount: true },
        where: { status: { in: ['PAID', 'PARTIALLY'] } },
      }),
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return {
      totalStudents,
      totalCourses,
      totalPrograms,
      totalDepartments,
      newApplications,
      pendingEnrollments,
      approvedEnrollments,
      tuitionRevenue: payments._sum.paidAmount || 0,
      recentActivities,
    };
  },

  async getStudentStats(userId: string) {
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      throw new NotFoundError('Student profile not found');
    }

    const [enrollments, payments, grades, attendance] = await Promise.all([
      prisma.enrollment.findMany({
        where: { studentId: student.id },
        include: {
          semester: true,
          _count: { select: { enrollmentCourses: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.grade.findMany({
        where: { studentId: student.id },
        include: {
          course: true,
          semester: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.attendance.count({
        where: { studentId: student.id },
      }),
    ]);

    const totalPaid = payments
      .filter((p: any) => p.status === 'PAID' || p.status === 'PARTIALLY')
      .reduce((sum: number, p: any) => sum + p.paidAmount, 0);

    return {
      enrollments,
      payments,
      totalPaid,
      grades,
      attendanceCount: attendance,
    };
  },

  async getLecturerStats(userId: string) {
    const lecturer = await prisma.user.findFirst({
      where: {
        id: userId,
        userRoles: {
          some: {
            role: { name: 'LECTURER' },
          },
        },
      },
    });

    if (!lecturer) {
      throw new NotFoundError('Lecturer profile not found');
    }

    const [courses, schedules] = await Promise.all([
      prisma.course.findMany({
        where: { lecturerId: userId },
        include: {
          _count: { select: { enrollmentCourses: true } },
          department: true,
          semester: true,
        },
      }),
      prisma.schedule.findMany({
        where: { lecturerId: userId },
        include: {
          course: true,
          classroom: true,
          semester: true,
        },
        orderBy: { startTime: 'asc' },
      }),
    ]);

    const courseIds = courses.map((c: any) => c.id);
    let totalStudents = 0;

    if (courseIds.length > 0) {
      const enrollmentCourses = await prisma.enrollmentCourse.findMany({
        where: { courseId: { in: courseIds } },
        select: { enrollment: { select: { studentId: true } } },
      });

      const uniqueStudents = new Set(enrollmentCourses.map((ec: any) => ec.enrollment.studentId));
      totalStudents = uniqueStudents.size;
    }

    return {
      courses,
      totalCourses: courses.length,
      totalStudents,
      schedules,
    };
  },

  async getFinanceStats() {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const payments = await prisma.payment.findMany({
      where: {
        createdAt: { gte: sixMonthsAgo },
      },
      orderBy: { createdAt: 'asc' },
    });

    const revenueByMonth: Record<string, number> = {};
    for (const p of payments) {
      if (p.status === 'PAID' || p.status === 'PARTIALLY') {
        const monthKey = p.createdAt.toISOString().slice(0, 7);
        revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + p.paidAmount;
      }
    }

    const [pendingCount, paidCount] = await Promise.all([
      prisma.payment.count({ where: { status: 'PENDING' } }),
      prisma.payment.count({ where: { status: 'PAID' } }),
    ]);

    return {
      revenueByMonth,
      pendingPayments: pendingCount,
      paidPayments: paidCount,
    };
  },

  async getRegistrarStats() {
    const [pendingEnrollments, approvedEnrollments, applications] = await Promise.all([
      prisma.enrollment.count({ where: { status: 'PENDING' } }),
      prisma.enrollment.count({ where: { status: 'APPROVED' } }),
      prisma.application.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    const applicationStats: Record<string, number> = {};
    for (const a of applications) {
      applicationStats[a.status] = a._count.id;
    }
    applicationStats.total = applications.reduce((sum: number, a: any) => sum + a._count.id, 0);

    return {
      pendingEnrollments,
      approvedEnrollments,
      applicationStats,
    };
  },
};
