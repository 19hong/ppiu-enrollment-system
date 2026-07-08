import prisma from '../config/database';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors';
import { paginate } from '../utils/helpers';

export const scheduleService = {
  async getAll(filters: {
    courseId?: string;
    classroomId?: string;
    lecturerId?: string;
    semesterId?: string;
    weekday?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const { skip, take } = paginate(page, limit);

    const where: any = {};

    if (filters.courseId) {
      where.courseId = filters.courseId;
    }
    if (filters.classroomId) {
      where.classroomId = filters.classroomId;
    }
    if (filters.lecturerId) {
      where.lecturerId = filters.lecturerId;
    }
    if (filters.semesterId) {
      where.semesterId = filters.semesterId;
    }
    if (filters.weekday) {
      where.weekday = filters.weekday;
    }
    if (filters.status) {
      where.status = filters.status;
    }

    const [schedules, total] = await Promise.all([
      prisma.schedule.findMany({
        where,
        skip,
        take,
        orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
        include: {
          course: {
            select: {
              id: true,
              code: true,
              name: true,
              credits: true,
            },
          },
          classroom: {
            select: {
              id: true,
              code: true,
              name: true,
              building: true,
              capacity: true,
            },
          },
          lecturer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.schedule.count({ where }),
    ]);

    return {
      data: schedules,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getById(id: string) {
    const schedule = await prisma.schedule.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true,
            description: true,
          },
        },
        classroom: {
          select: {
            id: true,
            code: true,
            name: true,
            building: true,
            capacity: true,
          },
        },
        lecturer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        semester: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundError('Schedule not found');
    }

    return schedule;
  },

  async create(data: {
    courseId: string;
    classroomId: string;
    lecturerId?: string;
    semesterId: string;
    weekday: string;
    startTime: string;
    endTime: string;
    capacity?: number;
  }) {
    const course = await prisma.course.findUnique({ where: { id: data.courseId } });
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    const classroom = await prisma.classroom.findUnique({ where: { id: data.classroomId } });
    if (!classroom) {
      throw new NotFoundError('Classroom not found');
    }

    const semester = await prisma.semester.findUnique({ where: { id: data.semesterId } });
    if (!semester) {
      throw new NotFoundError('Semester not found');
    }

    const startDate = new Date(data.startTime);
    const endDate = new Date(data.endTime);

    if (startDate >= endDate) {
      throw new BadRequestError('Start time must be before end time');
    }

    const conflict = await prisma.schedule.findFirst({
      where: {
        classroomId: data.classroomId,
        semesterId: data.semesterId,
        weekday: data.weekday as any,
        status: { not: 'CANCELLED' },
        AND: [
          { startTime: { lt: endDate } },
          { endTime: { gt: startDate } },
        ],
      },
    });

    if (conflict) {
      throw new ConflictError('Classroom is already booked for this time slot');
    }

    if (data.lecturerId) {
      const lecturerConflict = await prisma.schedule.findFirst({
        where: {
          lecturerId: data.lecturerId,
          semesterId: data.semesterId,
          weekday: data.weekday as any,
          status: { not: 'CANCELLED' },
          AND: [
            { startTime: { lt: endDate } },
            { endTime: { gt: startDate } },
          ],
        },
      });

      if (lecturerConflict) {
        throw new ConflictError('Lecturer has a scheduling conflict at this time');
      }
    }

    const schedule = await prisma.schedule.create({
      data: {
        courseId: data.courseId,
        classroomId: data.classroomId,
        lecturerId: data.lecturerId ?? null,
        semesterId: data.semesterId,
        weekday: data.weekday as any,
        startTime: startDate,
        endTime: endDate,
        capacity: data.capacity ?? null,
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        classroom: {
          select: {
            id: true,
            code: true,
            name: true,
            building: true,
          },
        },
        lecturer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return schedule;
  },

  async update(
    id: string,
    data: {
      courseId?: string;
      classroomId?: string;
      lecturerId?: string;
      semesterId?: string;
      weekday?: string;
      startTime?: string;
      endTime?: string;
      capacity?: number;
      status?: string;
    },
  ) {
    const existing = await prisma.schedule.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Schedule not found');
    }

    const startTime = data.startTime ? new Date(data.startTime) : existing.startTime;
    const endTime = data.endTime ? new Date(data.endTime) : existing.endTime;
    const weekday = data.weekday ?? existing.weekday;
    const classroomId = data.classroomId ?? existing.classroomId;
    const semesterId = data.semesterId ?? existing.semesterId;
    const lecturerId = data.lecturerId !== undefined ? data.lecturerId : existing.lecturerId;

    if (startTime >= endTime) {
      throw new BadRequestError('Start time must be before end time');
    }

    if (data.classroomId || data.weekday || data.startTime || data.endTime || data.semesterId) {
      const conflict = await prisma.schedule.findFirst({
        where: {
          id: { not: id },
          classroomId,
          semesterId: semesterId as any,
          weekday: weekday as any,
          status: { not: 'CANCELLED' },
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gt: startTime } },
          ],
        },
      });

      if (conflict) {
        throw new ConflictError('Classroom is already booked for this time slot');
      }
    }

    if (lecturerId) {
      const lecturerConflict = await prisma.schedule.findFirst({
        where: {
          id: { not: id },
          lecturerId,
          semesterId: semesterId as any,
          weekday: weekday as any,
          status: { not: 'CANCELLED' },
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gt: startTime } },
          ],
        },
      });

      if (lecturerConflict) {
        throw new ConflictError('Lecturer has a scheduling conflict at this time');
      }
    }

    const updated = await prisma.schedule.update({
      where: { id },
      data: {
        ...(data.courseId !== undefined && { courseId: data.courseId }),
        ...(data.classroomId !== undefined && { classroomId: data.classroomId }),
        ...(data.lecturerId !== undefined && { lecturerId: data.lecturerId }),
        ...(data.semesterId !== undefined && { semesterId: data.semesterId }),
        ...(data.weekday !== undefined && { weekday: data.weekday as any }),
        ...(data.startTime !== undefined && { startTime: new Date(data.startTime) }),
        ...(data.endTime !== undefined && { endTime: new Date(data.endTime) }),
        ...(data.capacity !== undefined && { capacity: data.capacity }),
        ...(data.status !== undefined && { status: data.status as any }),
      } as any,
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        classroom: {
          select: {
            id: true,
            code: true,
            name: true,
            building: true,
          },
        },
        lecturer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updated;
  },

  async delete(id: string) {
    const existing = await prisma.schedule.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Schedule not found');
    }

    const updated = await prisma.schedule.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return updated;
  },

  async getMySchedule(userId: string) {
    const lecturer = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        scheduledCourses: {
          where: { status: { not: 'CANCELLED' } },
          orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
          include: {
            course: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            classroom: {
              select: {
                id: true,
                code: true,
                name: true,
                building: true,
              },
            },
            semester: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        students: {
          take: 1,
        },
      },
    });

    if (!lecturer) {
      throw new NotFoundError('User not found');
    }

    if (lecturer.scheduledCourses.length > 0) {
      return {
        role: 'LECTURER',
        schedules: lecturer.scheduledCourses,
      };
    }

    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        enrollments: {
          where: { status: 'APPROVED' },
          include: {
            enrollmentCourses: {
              where: { status: 'ENROLLED' },
              include: {
                course: {
                  include: {
                    schedules: {
                      where: { status: { not: 'CANCELLED' } },
                      orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
                      include: {
                        classroom: {
                          select: {
                            id: true,
                            code: true,
                            name: true,
                            building: true,
                          },
                        },
                        lecturer: {
                          select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                          },
                        },
                        semester: {
                          select: {
                            id: true,
                            name: true,
                            code: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundError('Student profile not found');
    }

    const schedules = student.enrollments.flatMap((enrollment: any) =>
      enrollment.enrollmentCourses.flatMap((ec: any) =>
        ec.course.schedules.map((s: any) => ({
          id: s.id,
          courseId: s.courseId,
          courseCode: ec.course.code,
          courseName: ec.course.name,
          weekday: s.weekday,
          startTime: s.startTime,
          endTime: s.endTime,
          classroom: s.classroom,
          lecturer: s.lecturer,
          semester: s.semester,
          status: s.status,
        })),
      ),
    );

    schedules.sort((a: any, b: any) => {
      const dayOrder: Record<string, number> = { MON: 0, TUE: 1, WED: 2, THU: 3, FRI: 4, SAT: 5, SUN: 6 };
      const dayDiff = (dayOrder[a.weekday] ?? 0) - (dayOrder[b.weekday] ?? 0);
      if (dayDiff !== 0) return dayDiff;
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });

    return {
      role: 'STUDENT',
      schedules,
    };
  },

  async checkAvailability(
    classroomId: string,
    weekday: string,
    startTime: string,
    endTime: string,
    semesterId: string,
  ) {
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    const conflicting = await prisma.schedule.findFirst({
      where: {
        classroomId,
        semesterId,
        weekday: weekday as any,
        status: { not: 'CANCELLED' },
        AND: [
          { startTime: { lt: endDate } },
          { endTime: { gt: startDate } },
        ],
      },
    });

    return {
      available: !conflicting,
      conflictingSchedule: conflicting ?? null,
    };
  },

  async getSemesterSchedule(semesterId: string) {
    const semester = await prisma.semester.findUnique({ where: { id: semesterId } });
    if (!semester) {
      throw new NotFoundError('Semester not found');
    }

    const schedules = await prisma.schedule.findMany({
      where: { semesterId, status: { not: 'CANCELLED' } },
      orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true,
          },
        },
        classroom: {
          select: {
            id: true,
            code: true,
            name: true,
            building: true,
            capacity: true,
          },
        },
        lecturer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      semester: {
        id: semester.id,
        name: semester.name,
        code: semester.code,
      },
      schedules,
    };
  },
};
