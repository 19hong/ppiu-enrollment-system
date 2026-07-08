import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { config } from '../config';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../utils/errors';
import { generateStudentNumber, paginate } from '../utils/helpers';
import { RoleName, StudentStatus } from '../types';

export const studentService = {
  async getAll(filters: {
    search?: string;
    status?: StudentStatus;
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
        { studentNumber: { contains: filters.search, mode: 'insensitive' } },
        { user: { firstName: { contains: filters.search, mode: 'insensitive' } } },
        { user: { lastName: { contains: filters.search, mode: 'insensitive' } } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const allowedSortFields = ['createdAt', 'updatedAt', 'studentNumber', 'status', 'enrollmentDate'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const { skip, take } = paginate(page, limit);

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take,
        orderBy: { [orderField]: sortOrder },
        include: {
          user: {
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
            },
          },
        },
      }),
      prisma.student.count({ where }),
    ]);

    return {
      data: students,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getById(id: string) {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: {
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
          },
        },
        parents: {
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
        enrollments: {
          include: {
            semester: true,
            enrollmentCourses: {
              include: {
                course: true,
              },
            },
          },
        },
        payments: true,
        grades: {
          include: {
            course: true,
            semester: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundError('Student not found');
    }

    return student;
  },

  async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
    nationality?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictError('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, config.bcryptSaltRounds);

    const studentRole = await prisma.role.findUnique({ where: { name: RoleName.STUDENT } });
    if (!studentRole) {
      throw new BadRequestError('Student role not configured in the system');
    }

    const studentNumber = generateStudentNumber();

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        isVerified: true,
        userRoles: {
          create: { roleId: studentRole.id },
        },
        students: {
          create: {
            studentNumber,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
            gender: data.gender,
            address: data.address,
            nationality: data.nationality,
            emergencyContactName: data.emergencyContact,
            emergencyContactPhone: data.emergencyPhone,
            enrollmentDate: new Date(),
          },
        },
      },
      include: {
        students: {
          include: {
            user: {
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
              },
            },
          },
        },
      },
    });

    return user.students[0];
  },

  async update(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      dateOfBirth?: string;
      gender?: string;
      address?: string;
      nationality?: string;
      emergencyContact?: string;
      emergencyPhone?: string;
      status?: StudentStatus;
    },
  ) {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    const hasUserUpdates = data.firstName !== undefined || data.lastName !== undefined || data.phone !== undefined;
    if (hasUserUpdates) {
      await prisma.user.update({
        where: { id: student.userId },
        data: {
          ...(data.firstName !== undefined && { firstName: data.firstName }),
          ...(data.lastName !== undefined && { lastName: data.lastName }),
          ...(data.phone !== undefined && { phone: data.phone }),
        },
      });
    }

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        ...(data.dateOfBirth !== undefined && { dateOfBirth: new Date(data.dateOfBirth) }),
        ...(data.gender !== undefined && { gender: data.gender }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.nationality !== undefined && { nationality: data.nationality }),
        ...(data.emergencyContact !== undefined && { emergencyContactName: data.emergencyContact }),
        ...(data.emergencyPhone !== undefined && { emergencyContactPhone: data.emergencyPhone }),
        ...(data.status !== undefined && { status: data.status as any }),
      },
      include: {
        user: {
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
          },
        },
      },
    });

    return updatedStudent;
  },

  async delete(id: string) {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    await prisma.$transaction([
      prisma.student.update({
        where: { id },
        data: { status: StudentStatus.INACTIVE as any },
      }),
      prisma.user.update({
        where: { id: student.userId },
        data: { isActive: false },
      }),
    ]);

    return { message: 'Student deleted successfully' };
  },

  async updateStatus(id: string, status: StudentStatus) {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: { status: status as any },
      include: {
        user: {
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
          },
        },
      },
    });

    return updatedStudent;
  },

  async getStudentByUserId(userId: string) {
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        user: {
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
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundError('Student profile not found');
    }

    return student;
  },

  async uploadPhoto(studentId: string, userId: string, fileUrl: string) {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    const requestingStudent = await prisma.student.findUnique({ where: { userId } });
    if (requestingStudent && requestingStudent.id !== studentId) {
      throw new ForbiddenError('You do not have permission to update this student\'s photo');
    }

    const user = await prisma.user.update({
      where: { id: student.userId },
      data: { profileImage: fileUrl },
    });

    return { profileImage: user.profileImage };
  },
};
