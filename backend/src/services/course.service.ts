import { CourseStatus } from '@prisma/client';
import prisma from '../config/database';
import { ConflictError, NotFoundError } from '../utils/errors';
import { paginate } from '../utils/helpers';

export const courseService = {
  async getAll(filters: {
    search?: string;
    semester?: number;
    departmentId?: string;
    programId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';

    const where: any = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.semester !== undefined) {
      where.semester = filters.semester;
    }

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters.programId) {
      where.programId = filters.programId;
    }

    const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'code', 'credits', 'semester'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const { skip, take } = paginate(page, limit);

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take,
        orderBy: { [orderField]: sortOrder },
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          program: {
            select: {
              id: true,
              name: true,
              code: true,
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
      prisma.course.count({ where }),
    ]);

    return {
      data: courses,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getById(id: string) {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        program: {
          select: {
            id: true,
            name: true,
            code: true,
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
        prerequisites: {
          include: {
            prerequisiteCourse: {
              select: {
                id: true,
                code: true,
                name: true,
                credits: true,
              },
            },
          },
        },
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
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    return course;
  },

  async create(data: {
    code: string;
    name: string;
    description?: string;
    credits?: number;
    semester?: number;
    departmentId: string;
    programId?: string;
    lecturerId?: string;
    maxStudents?: number;
  }) {
    const existingCode = await prisma.course.findUnique({ where: { code: data.code } });
    if (existingCode) {
      throw new ConflictError('Course code already exists');
    }

    const department = await prisma.department.findUnique({ where: { id: data.departmentId } });
    if (!department) {
      throw new NotFoundError('Department not found');
    }

    const course = await prisma.course.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        credits: data.credits,
        semester: data.semester,
        departmentId: data.departmentId,
        programId: data.programId,
        lecturerId: data.lecturerId,
        maxStudents: data.maxStudents,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        program: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return course;
  },

  async update(
    id: string,
    data: {
      name?: string;
      code?: string;
      description?: string;
      credits?: number;
      semester?: number;
      departmentId?: string;
      programId?: string;
      lecturerId?: string;
      maxStudents?: number;
      isActive?: boolean;
    },
  ) {
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    if (data.code && data.code !== course.code) {
      const existingCode = await prisma.course.findUnique({ where: { code: data.code } });
      if (existingCode) {
        throw new ConflictError('Course code already exists');
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.credits !== undefined) updateData.credits = data.credits;
    if (data.semester !== undefined) updateData.semester = data.semester;
    if (data.departmentId !== undefined) updateData.departmentId = data.departmentId;
    if (data.programId !== undefined) updateData.programId = data.programId;
    if (data.lecturerId !== undefined) updateData.lecturerId = data.lecturerId;
    if (data.maxStudents !== undefined) updateData.maxStudents = data.maxStudents;
    if (data.isActive !== undefined) {
      updateData.status = data.isActive ? CourseStatus.ACTIVE : CourseStatus.INACTIVE;
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        program: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return updatedCourse;
  },

  async delete(id: string) {
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: { status: CourseStatus.INACTIVE },
    });

    return updatedCourse;
  },

  async getPrerequisites(courseId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    const prerequisites = await prisma.coursePrerequisite.findMany({
      where: { courseId },
      include: {
        prerequisiteCourse: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true,
          },
        },
      },
    });

    return prerequisites;
  },

  async checkPrerequisites(courseId: string, studentId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    const prerequisites = await prisma.coursePrerequisite.findMany({
      where: { courseId },
      include: {
        prerequisiteCourse: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true,
          },
        },
      },
    });

    if (prerequisites.length === 0) {
      return { met: true, prerequisites: [] };
    }

    const results = await Promise.all(
      prerequisites.map(async (prereq) => {
        const completedEnrollment = await prisma.enrollmentCourse.findFirst({
          where: {
            courseId: prereq.prerequisiteCourseId,
            enrollment: { studentId },
            status: 'COMPLETED',
          },
        });

        const passingGrade = await prisma.grade.findFirst({
          where: {
            studentId,
            courseId: prereq.prerequisiteCourseId,
            total: { gte: 60 },
          },
        });

        const completed = !!(completedEnrollment || passingGrade);

        return {
          id: prereq.prerequisiteCourse.id,
          code: prereq.prerequisiteCourse.code,
          name: prereq.prerequisiteCourse.name,
          credits: prereq.prerequisiteCourse.credits,
          completed,
        };
      }),
    );

    return {
      met: results.every((r) => r.completed),
      prerequisites: results,
    };
  },
};
