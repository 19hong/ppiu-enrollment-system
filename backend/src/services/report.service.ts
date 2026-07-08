import prisma from '../config/database';

export const reportService = {
  async getEnrollmentReport(semesterId?: string) {
    const where: any = {};
    if (semesterId) {
      where.semesterId = semesterId;
    }

    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        semester: true,
        enrollmentCourses: {
          include: { course: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalEnrollments = enrollments.length;
    const statusBreakdown: Record<string, number> = {};
    for (const e of enrollments) {
      statusBreakdown[e.status] = (statusBreakdown[e.status] || 0) + 1;
    }

    return {
      totalEnrollments,
      statusBreakdown,
      enrollments,
    };
  },

  async getStudentReport(departmentId?: string) {
    const where: any = {};
    if (departmentId) {
      where.departmentId = departmentId; // Not in prisma Student schema, skip or filter differently
    }

    // Student model doesn't have departmentId directly; we filter by related data
    const students = await prisma.student.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            payments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const statusBreakdown: Record<string, number> = {};
    for (const s of students) {
      statusBreakdown[s.status] = (statusBreakdown[s.status] || 0) + 1;
    }

    return {
      totalStudents: students.length,
      statusBreakdown,
      students,
    };
  },

  async getFinanceReport(startDate?: string, endDate?: string) {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalRevenue = payments
      .filter((p: any) => p.status === 'PAID' || p.status === 'PARTIALLY')
      .reduce((sum: number, p: any) => sum + p.paidAmount, 0);

    const totalPending = payments
      .filter((p: any) => p.status === 'PENDING')
      .reduce((sum: number, p: any) => sum + p.amount, 0);

    const statusBreakdown: Record<string, number> = {};
    for (const p of payments) {
      statusBreakdown[p.status] = (statusBreakdown[p.status] || 0) + 1;
    }

    return {
      totalRevenue,
      totalPending,
      statusBreakdown,
      paymentCount: payments.length,
      payments,
    };
  },

  async getAttendanceReport(courseId?: string, semesterId?: string) {
    const where: any = {};
    if (courseId) where.courseId = courseId;
    if (semesterId) where.semesterId = semesterId; // Not in Attendance model directly

    // Attendance has scheduleId which links to Schedule which links to semester
    const attendanceRecords = await prisma.attendance.findMany({
      where: courseId ? { courseId } : undefined,
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        schedule: {
          include: {
            course: true,
            semester: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    if (semesterId) {
      const filtered = attendanceRecords.filter((a: any) => a.schedule.semesterId === semesterId);
      return {
        totalRecords: filtered.length,
        statusBreakdown: this.groupByStatus(filtered),
        records: filtered,
      };
    }

    return {
      totalRecords: attendanceRecords.length,
      statusBreakdown: this.groupByStatus(attendanceRecords),
      records: attendanceRecords,
    };
  },

  groupByStatus(records: any[]) {
    const breakdown: Record<string, number> = {};
    for (const r of records) {
      breakdown[r.status] = (breakdown[r.status] || 0) + 1;
    }
    return breakdown;
  },

  async getGradeReport(courseId?: string, semesterId?: string) {
    const where: any = {};
    if (courseId) where.courseId = courseId;
    if (semesterId) where.semesterId = semesterId;

    const grades = await prisma.grade.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        course: true,
        semester: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const gradeDistribution: Record<string, number> = {};
    for (const g of grades) {
      if (g.grade) {
        gradeDistribution[g.grade] = (gradeDistribution[g.grade] || 0) + 1;
      }
    }

    const averageTotal = grades.length > 0
      ? grades.reduce((sum: number, g: any) => sum + (g.total || 0), 0) / grades.length
      : 0;

    return {
      totalGrades: grades.length,
      averageTotal: parseFloat(averageTotal.toFixed(2)),
      gradeDistribution,
      grades,
    };
  },

  async getDepartmentReport(departmentId?: string) {
    const where: any = {};
    if (departmentId) where.id = departmentId;

    const departments = await prisma.department.findMany({
      where,
      include: {
        _count: {
          select: {
            programs: true,
            courses: true,
          },
        },
        head: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return { departments };
  },

  async exportPDF(reportType: string, data: any) {
    return { message: 'PDF export not yet implemented', reportType, data };
  },

  async exportExcel(reportType: string, data: any) {
    return { message: 'Excel export not yet implemented', reportType, data };
  },
};
