import prisma from '../config/database';
import { ConflictError, NotFoundError } from '../utils/errors';
import { paginate } from '../utils/helpers';

export const attendanceService = {
  async getAll(filters: {
    studentId?: string;
    courseId?: string;
    scheduleId?: string;
    date?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const { skip, take } = paginate(page, limit);

    const where: any = {};

    if (filters.studentId) {
      where.studentId = filters.studentId;
    }
    if (filters.courseId) {
      where.courseId = filters.courseId;
    }
    if (filters.scheduleId) {
      where.scheduleId = filters.scheduleId;
    }
    if (filters.date) {
      const date = new Date(filters.date);
      where.date = {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lte: new Date(date.setHours(23, 59, 59, 999)),
      };
    }
    if (filters.status) {
      where.status = filters.status;
    }

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip,
        take,
        orderBy: { date: 'desc' },
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          course: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          schedule: {
            select: {
              id: true,
              weekday: true,
              startTime: true,
              endTime: true,
            },
          },
        },
      }),
      prisma.attendance.count({ where }),
    ]);

    return {
      data: records,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getById(id: string) {
    const record = await prisma.attendance.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        course: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        schedule: {
          select: {
            id: true,
            weekday: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundError('Attendance record not found');
    }

    return record;
  },

  async markAttendance(data: {
    studentId: string;
    scheduleId: string;
    courseId: string;
    date: string;
    status: string;
    remarks?: string;
  }) {
    const attendanceDate = new Date(data.date);

    const existing = await prisma.attendance.findUnique({
      where: {
        studentId_scheduleId_date: {
          studentId: data.studentId,
          scheduleId: data.scheduleId,
          date: attendanceDate,
        },
      },
    });

    if (existing) {
      throw new ConflictError('Attendance already marked for this student on this date and schedule');
    }

    const record = await prisma.attendance.create({
      data: {
        studentId: data.studentId,
        scheduleId: data.scheduleId,
        courseId: data.courseId,
        date: attendanceDate,
        status: data.status as any,
        remarks: data.remarks ?? null,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        course: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        schedule: {
          select: {
            id: true,
            weekday: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    return record;
  },

  async markBulkAttendance(data: {
    studentId: string;
    scheduleId: string;
    courseId: string;
    date: string;
    records: Array<{
      studentId: string;
      status: string;
      remarks?: string;
    }>;
  }) {
    const attendanceDate = new Date(data.date);

    const results = await prisma.$transaction(async (tx: any) => {
      const created: any[] = [];

      for (const record of data.records) {
        const existing = await tx.attendance.findUnique({
          where: {
            studentId_scheduleId_date: {
              studentId: record.studentId,
              scheduleId: data.scheduleId,
              date: attendanceDate,
            },
          },
        });

        if (existing) {
          const updated = await tx.attendance.update({
            where: { id: existing.id },
            data: {
              status: record.status as any,
              remarks: record.remarks ?? null,
            },
            include: {
              student: {
                include: {
                  user: {
                    select: {
                      id: true,
                      email: true,
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          });
          created.push(updated);
        } else {
          const newRecord = await tx.attendance.create({
            data: {
              studentId: record.studentId,
              scheduleId: data.scheduleId,
              courseId: data.courseId,
              date: attendanceDate,
              status: record.status as any,
              remarks: record.remarks ?? null,
            },
            include: {
              student: {
                include: {
                  user: {
                    select: {
                      id: true,
                      email: true,
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          });
          created.push(newRecord);
        }
      }

      return created;
    });

    return results;
  },

  async updateAttendance(
    id: string,
    data: {
      status?: string;
      remarks?: string;
    },
  ) {
    const existing = await prisma.attendance.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Attendance record not found');
    }

    const updated = await prisma.attendance.update({
      where: { id },
      data: {
        ...(data.status !== undefined && { status: data.status as any }),
        ...(data.remarks !== undefined && { remarks: data.remarks }),
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        course: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        schedule: {
          select: {
            id: true,
            weekday: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    return updated;
  },

  async getMyAttendance(userId: string) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) {
      throw new NotFoundError('Student profile not found');
    }

    const records = await prisma.attendance.findMany({
      where: { studentId: student.id },
      orderBy: { date: 'desc' },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        schedule: {
          select: {
            id: true,
            weekday: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    return records;
  },

  async getAttendanceReport(
    studentId: string,
    courseId?: string,
    semesterId?: string,
  ) {
    const where: any = { studentId };
    if (courseId) {
      where.courseId = courseId;
    }
    if (semesterId) {
      where.schedule = { semesterId };
    }

    const records = await prisma.attendance.findMany({
      where,
    });

    const total = records.length;
    const present = records.filter((r: any) => r.status === 'PRESENT').length;
    const absent = records.filter((r: any) => r.status === 'ABSENT').length;
    const late = records.filter((r: any) => r.status === 'LATE').length;
    const excused = records.filter((r: any) => r.status === 'EXCUSED').length;
    const percentage = total > 0 ? parseFloat((((present + late + excused) / total) * 100).toFixed(2)) : 0;

    return {
      studentId,
      courseId: courseId ?? null,
      semesterId: semesterId ?? null,
      totalClasses: total,
      present,
      absent,
      late,
      excused,
      percentage,
    };
  },

  async getCourseAttendance(courseId: string, date?: string) {
    const where: any = { courseId };
    if (date) {
      const dt = new Date(date);
      where.date = {
        gte: new Date(dt.setHours(0, 0, 0, 0)),
        lte: new Date(dt.setHours(23, 59, 59, 999)),
      };
    }

    const records = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return records;
  },
};
