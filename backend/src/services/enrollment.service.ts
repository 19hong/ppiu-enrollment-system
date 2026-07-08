import { Prisma, EnrollmentStatus, SemesterStatus, PaymentType, PaymentStatus, EnrollmentCourseStatus } from '@prisma/client';
import prisma from '../config/database';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../utils/errors';
import { generateEnrollmentNumber, paginate } from '../utils/helpers';

export const enrollmentService = {
  async getAll(filters: {
    search?: string;
    status?: EnrollmentStatus;
    semesterId?: string;
    studentId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    const where: Prisma.EnrollmentWhereInput = {};

    if (filters.search) {
      where.OR = [
        { enrollmentNumber: { contains: filters.search, mode: 'insensitive' } },
        { student: { user: { firstName: { contains: filters.search, mode: 'insensitive' } } } },
        { student: { user: { lastName: { contains: filters.search, mode: 'insensitive' } } } },
        { student: { studentNumber: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.semesterId) {
      where.semesterId = filters.semesterId;
    }

    if (filters.studentId) {
      where.studentId = filters.studentId;
    }

    const { skip, take } = paginate(page, limit);

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
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
          semester: true,
          enrollmentCourses: {
            include: {
              course: true,
            },
          },
        },
      }),
      prisma.enrollment.count({ where }),
    ]);

    return {
      data: enrollments,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getById(id: string) {
    const enrollment = await prisma.enrollment.findUnique({
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
                phone: true,
              },
            },
          },
        },
        semester: true,
        enrollmentCourses: {
          include: {
            course: {
              include: {
                schedules: true,
              },
            },
          },
        },
        payments: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundError('Enrollment not found');
    }

    return enrollment;
  },

  async create(data: {
    studentId: string;
    semesterId: string;
    courseIds: string[];
  }) {
    const { studentId, semesterId, courseIds } = data;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) {
      throw new NotFoundError('Student not found');
    }

    const semester = await prisma.semester.findUnique({
      where: { id: semesterId },
    });

    if (!semester) {
      throw new NotFoundError('Semester not found');
    }

    if (semester.status !== SemesterStatus.UPCOMING && semester.status !== SemesterStatus.ONGOING) {
      throw new BadRequestError('Enrollment is only allowed for upcoming or ongoing semesters');
    }

    const uniqueCourseIds = [...new Set(courseIds)];

    if (uniqueCourseIds.length !== courseIds.length) {
      throw new BadRequestError('Duplicate courses detected in the request');
    }

    const courses = await prisma.course.findMany({
      where: { id: { in: uniqueCourseIds }, status: 'ACTIVE' },
      include: {
        schedules: {
          where: { semesterId },
        },
        prerequisites: {
          include: {
            prerequisiteCourse: true,
          },
        },
      },
    });

    if (courses.length !== uniqueCourseIds.length) {
      const foundIds = courses.map((c) => c.id);
      const missing = uniqueCourseIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundError(`Courses not found or inactive: ${missing.join(', ')}`);
    }

    const existingEnrollment = await prisma.enrollment.findFirst({
      where: { studentId, semesterId, status: { in: ['PENDING', 'APPROVED'] } },
    });

    if (existingEnrollment) {
      throw new ConflictError('Student already has a pending or approved enrollment for this semester');
    }

    const enrolledCourseIds = await prisma.enrollmentCourse.findMany({
      where: {
        enrollment: { studentId, semesterId },
        status: EnrollmentCourseStatus.ENROLLED,
      },
      select: { courseId: true },
    });

    const alreadyEnrolledIds = enrolledCourseIds.map((e) => e.courseId);
    const newCourseIds = uniqueCourseIds.filter((id) => !alreadyEnrolledIds.includes(id));

    if (newCourseIds.length === 0) {
      throw new ConflictError('All selected courses are already enrolled');
    }

    const newCourses = courses.filter((c) => newCourseIds.includes(c.id));

    const newSchedules = newCourses.flatMap((c) => c.schedules);

    const existingSchedules = await prisma.schedule.findMany({
      where: {
        courseId: { in: alreadyEnrolledIds },
        semesterId,
      },
    });

    for (const newSched of newSchedules) {
      for (const existingSched of existingSchedules) {
        if (newSched.weekday === existingSched.weekday) {
          const newStart = new Date(newSched.startTime).getTime();
          const newEnd = new Date(newSched.endTime).getTime();
          const exStart = new Date(existingSched.startTime).getTime();
          const exEnd = new Date(existingSched.endTime).getTime();

          if (newStart < exEnd && newEnd > exStart) {
            const conflictCourse = courses.find((c) => c.schedules.some((s) => s.id === newSched.id));
            throw new ConflictError(
              `Schedule conflict: course "${conflictCourse?.name}" overlaps with an existing enrolled course on ${newSched.weekday}`,
            );
          }
        }
      }
    }

    for (const newSched of newSchedules) {
      for (const otherSched of newSchedules) {
        if (newSched.id === otherSched.id) continue;
        if (newSched.weekday === otherSched.weekday) {
          const newStart = new Date(newSched.startTime).getTime();
          const newEnd = new Date(newSched.endTime).getTime();
          const otherStart = new Date(otherSched.startTime).getTime();
          const otherEnd = new Date(otherSched.endTime).getTime();

          if (newStart < otherEnd && newEnd > otherStart) {
            const courseA = courses.find((c) => c.schedules.some((s) => s.id === newSched.id));
            const courseB = courses.find((c) => c.schedules.some((s) => s.id === otherSched.id));
            throw new ConflictError(
              `Schedule conflict between "${courseA?.name}" and "${courseB?.name}" on ${newSched.weekday}`,
            );
          }
        }
      }
    }

    for (const course of newCourses) {
      if (course.maxStudents) {
        const enrolledCount = await prisma.enrollmentCourse.count({
          where: {
            courseId: course.id,
            enrollment: {
              semesterId,
              status: { in: ['PENDING', 'APPROVED'] },
            },
            status: EnrollmentCourseStatus.ENROLLED,
          },
        });

        if (enrolledCount >= course.maxStudents) {
          throw new ConflictError(`Course "${course.name}" has reached maximum capacity (${course.maxStudents})`);
        }
      }

      if (course.prerequisites.length > 0) {
        for (const prereq of course.prerequisites) {
          const completed = await prisma.enrollmentCourse.findFirst({
            where: {
              courseId: prereq.prerequisiteCourseId,
              enrollment: { studentId },
              status: EnrollmentCourseStatus.COMPLETED,
            },
          });

          const passingGrade = await prisma.grade.findFirst({
            where: {
              studentId,
              courseId: prereq.prerequisiteCourseId,
              total: { gte: 60 },
            },
          });

          if (!completed && !passingGrade) {
            throw new BadRequestError(
              `Prerequisite not met: ${prereq.prerequisiteCourse.name} is required for ${course.name}`,
            );
          }
        }
      }
    }

    const enrollmentNumber = generateEnrollmentNumber();

    const totalCredits = newCourses.reduce((sum, c) => sum + (c.credits || 0), 0);

    const enrollment = await prisma.$transaction(async (tx) => {
      const created = await tx.enrollment.create({
        data: {
          studentId,
          semesterId,
          enrollmentNumber,
          totalCredits,
          enrolledDate: new Date(),
          enrollmentCourses: {
            create: newCourses.map((course) => ({
              courseId: course.id,
              status: EnrollmentCourseStatus.ENROLLED,
            })),
          },
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
          semester: true,
          enrollmentCourses: {
            include: { course: true },
          },
        },
      });

      await tx.payment.create({
        data: {
          studentId,
          enrollmentId: created.id,
          amount: 0,
          paymentType: PaymentType.TUITION,
          status: PaymentStatus.PENDING,
          invoiceNumber: generateEnrollmentNumber(),
        },
      });

      return created;
    });

    return enrollment;
  },

  async approve(id: string, approvedBy: string) {
    const enrollment = await prisma.enrollment.findUnique({ where: { id } });

    if (!enrollment) {
      throw new NotFoundError('Enrollment not found');
    }

    if (enrollment.status !== EnrollmentStatus.PENDING) {
      throw new BadRequestError('Only pending enrollments can be approved');
    }

    const user = await prisma.user.findUnique({ where: { id: approvedBy } });
    if (!user) {
      throw new NotFoundError('Approver not found');
    }

    const updated = await prisma.enrollment.update({
      where: { id },
      data: {
        status: EnrollmentStatus.APPROVED,
        approvedBy,
        approvedDate: new Date(),
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
        semester: true,
        enrollmentCourses: {
          include: { course: true },
        },
      },
    });

    return updated;
  },

  async reject(id: string) {
    const enrollment = await prisma.enrollment.findUnique({ where: { id } });

    if (!enrollment) {
      throw new NotFoundError('Enrollment not found');
    }

    if (enrollment.status !== EnrollmentStatus.PENDING) {
      throw new BadRequestError('Only pending enrollments can be rejected');
    }

    const updated = await prisma.enrollment.update({
      where: { id },
      data: {
        status: EnrollmentStatus.REJECTED,
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
        semester: true,
        enrollmentCourses: {
          include: { course: true },
        },
      },
    });

    return updated;
  },

  async getMyEnrollments(userId: string) {
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      throw new NotFoundError('Student profile not found');
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' },
      include: {
        semester: true,
        enrollmentCourses: {
          include: { course: true },
        },
        payments: true,
      },
    });

    return enrollments;
  },

  async getSchedule(enrollmentId: string, userId: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        enrollmentCourses: {
          where: { status: EnrollmentCourseStatus.ENROLLED },
          include: {
            course: {
              include: {
                schedules: {
                  include: {
                    classroom: {
                      select: {
                        id: true,
                        name: true,
                        code: true,
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
                },
              },
            },
          },
        },
        semester: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundError('Enrollment not found');
    }

    const requestingStudent = await prisma.student.findUnique({ where: { userId } });
    if (requestingStudent && requestingStudent.id !== enrollment.studentId) {
      throw new ForbiddenError('You do not have access to this schedule');
    }

    const schedule = enrollment.enrollmentCourses.flatMap((ec) =>
      ec.course.schedules.map((s) => ({
        id: s.id,
        courseId: s.courseId,
        courseCode: ec.course.code,
        courseName: ec.course.name,
        weekday: s.weekday,
        startTime: s.startTime,
        endTime: s.endTime,
        classroom: s.classroom,
        lecturer: s.lecturer,
        status: s.status,
      })),
    );

    schedule.sort((a, b) => {
      const dayOrder = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
      const dayDiff = dayOrder.indexOf(a.weekday) - dayOrder.indexOf(b.weekday);
      if (dayDiff !== 0) return dayDiff;
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });

    return {
      enrollment: {
        id: enrollment.id,
        enrollmentNumber: enrollment.enrollmentNumber,
        status: enrollment.status,
      },
      semester: enrollment.semester,
      schedule,
    };
  },
};
