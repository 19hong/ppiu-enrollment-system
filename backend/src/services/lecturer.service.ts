import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { config } from '../config';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors';
import { paginate } from '../utils/helpers';
import { RoleName } from '../types';

export const lecturerService = {
  async getAll(filters: {
    search?: string;
    departmentId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';

    const where: any = {
      userRoles: {
        some: {
          role: { name: RoleName.LECTURER },
        },
      },
    };

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.departmentId) {
      where.departmentsHead = {
        some: { id: filters.departmentId },
      };
    }

    const allowedSortFields = ['createdAt', 'updatedAt', 'firstName', 'lastName', 'email'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const { skip, take } = paginate(page, limit);

    const [lecturers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { [orderField]: sortOrder },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          profileImage: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
          departmentsHead: {
            select: { id: true, name: true, code: true },
          },
          _count: {
            select: {
              coursesTaught: true,
              scheduledCourses: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: lecturers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getById(id: string) {
    const lecturer = await prisma.user.findFirst({
      where: {
        id,
        userRoles: {
          some: {
            role: { name: RoleName.LECTURER },
          },
        },
      },
      include: {
        departmentsHead: true,
        coursesTaught: {
          include: {
            department: true,
            program: true,
            /* semester: true,*/
          },
        },
        scheduledCourses: {
          include: {
            course: true,
            classroom: true,
            /* semester: true,*/
          },
        },
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!lecturer) {
      throw new NotFoundError('Lecturer not found');
    }

    return lecturer;
  },

  async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictError('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, config.bcryptSaltRounds);

    const lecturerRole = await prisma.role.findUnique({ where: { name: RoleName.LECTURER } });
    if (!lecturerRole) {
      throw new BadRequestError('Lecturer role not configured in the system');
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        isVerified: true,
        userRoles: {
          create: { roleId: lecturerRole.id },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        profileImage: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        departmentsHead: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: {
            coursesTaught: true,
            scheduledCourses: true,
          },
        },
      },
    });

    return user;
  },

  async update(id: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) {
    const lecturer = await prisma.user.findFirst({
      where: {
        id,
        userRoles: {
          some: {
            role: { name: RoleName.LECTURER },
          },
        },
      },
    });

    if (!lecturer) {
      throw new NotFoundError('Lecturer not found');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.phone !== undefined && { phone: data.phone }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        profileImage: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        departmentsHead: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: {
            coursesTaught: true,
            scheduledCourses: true,
          },
        },
      },
    });

    return updated;
  },

  async delete(id: string) {
    const lecturer = await prisma.user.findFirst({
      where: {
        id,
        userRoles: {
          some: {
            role: { name: RoleName.LECTURER },
          },
        },
      },
    });

    if (!lecturer) {
      throw new NotFoundError('Lecturer not found');
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Lecturer deactivated successfully' };
  },

  async getCourses(lecturerId: string) {
    const lecturer = await prisma.user.findFirst({
      where: {
        id: lecturerId,
        userRoles: {
          some: {
            role: { name: RoleName.LECTURER },
          },
        },
      },
    });

    if (!lecturer) {
      throw new NotFoundError('Lecturer not found');
    }

    const courses = await prisma.course.findMany({
      where: { lecturerId },
      include: {
        department: true,
        program: true,
        /* semester: true,*/
        _count: {
          select: {
            enrollmentCourses: true,
          },
        },
      },
    });

    return courses;
  },

  async getSchedule(lecturerId: string) {
    const lecturer = await prisma.user.findFirst({
      where: {
        id: lecturerId,
        userRoles: {
          some: {
            role: { name: RoleName.LECTURER },
          },
        },
      },
    });

    if (!lecturer) {
      throw new NotFoundError('Lecturer not found');
    }

    const schedules = await prisma.schedule.findMany({
      where: { lecturerId },
      include: {
        course: true,
        classroom: true,
        /* semester: true,*/
      },
      orderBy: { startTime: 'asc' },
    });

    return schedules;
  },

  async getStudents(lecturerId: string) {
    const lecturer = await prisma.user.findFirst({
      where: {
        id: lecturerId,
        userRoles: {
          some: {
            role: { name: RoleName.LECTURER },
          },
        },
      },
    });

    if (!lecturer) {
      throw new NotFoundError('Lecturer not found');
    }

    const courses = await prisma.course.findMany({
      where: { lecturerId },
      select: { id: true },
    });

    const courseIds = courses.map((c: any) => c.id);
    if (courseIds.length === 0) return [];

    const enrollmentCourses = await prisma.enrollmentCourse.findMany({
      where: {
        courseId: { in: courseIds },
      },
      include: {
        enrollment: {
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
        },
      },
    });

    const studentMap = new Map<string, any>();
    for (const ec of enrollmentCourses) {
      const student = ec.enrollment.student;
      if (!studentMap.has(student.id)) {
        studentMap.set(student.id, {
          ...student,
          courses: [ec.courseId],
        });
      } else {
        studentMap.get(student.id).courses.push(ec.courseId);
      }
    }

    return Array.from(studentMap.values());
  },
};
