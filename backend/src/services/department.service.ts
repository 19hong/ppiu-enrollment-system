import { DepartmentStatus } from '@prisma/client';
import prisma from '../config/database';
import { ConflictError, NotFoundError } from '../utils/errors';
import { paginate } from '../utils/helpers';

export const departmentService = {
  async getAll(filters: {
    search?: string;
    status?: string;
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

    if (filters.status) {
      where.status = filters.status;
    }

    const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'code', 'status'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const { skip, take } = paginate(page, limit);

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where,
        skip,
        take,
        orderBy: { [orderField]: sortOrder },
        include: {
          head: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
          _count: {
            select: {
              programs: true,
              courses: true,
            },
          },
        },
      }),
      prisma.department.count({ where }),
    ]);

    return {
      data: departments,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getById(id: string) {
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        head: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
        programs: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            code: true,
            level: true,
            duration: true,
            creditsTotal: true,
            status: true,
          },
        },
        courses: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            name: true,
            code: true,
            credits: true,
            semester: true,
            status: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundError('Department not found');
    }

    return department;
  },

  async create(data: {
    name: string;
    code: string;
    description?: string;
    headId?: string;
  }) {
    const existingCode = await prisma.department.findUnique({ where: { code: data.code } });
    if (existingCode) {
      throw new ConflictError('Department code already exists');
    }

    const existingName = await prisma.department.findUnique({ where: { name: data.name } });
    if (existingName) {
      throw new ConflictError('Department name already exists');
    }

    const department = await prisma.department.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        headId: data.headId,
      },
      include: {
        head: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return department;
  },

  async update(
    id: string,
    data: {
      name?: string;
      code?: string;
      description?: string;
      headId?: string;
      isActive?: boolean;
    },
  ) {
    const department = await prisma.department.findUnique({ where: { id } });
    if (!department) {
      throw new NotFoundError('Department not found');
    }

    if (data.code && data.code !== department.code) {
      const existingCode = await prisma.department.findUnique({ where: { code: data.code } });
      if (existingCode) {
        throw new ConflictError('Department code already exists');
      }
    }

    if (data.name && data.name !== department.name) {
      const existingName = await prisma.department.findUnique({ where: { name: data.name } });
      if (existingName) {
        throw new ConflictError('Department name already exists');
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.headId !== undefined) updateData.headId = data.headId;
    if (data.isActive !== undefined) {
      updateData.status = data.isActive ? DepartmentStatus.ACTIVE : DepartmentStatus.INACTIVE;
    }

    const updatedDepartment = await prisma.department.update({
      where: { id },
      data: updateData,
      include: {
        head: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updatedDepartment;
  },

  async delete(id: string) {
    const department = await prisma.department.findUnique({ where: { id } });
    if (!department) {
      throw new NotFoundError('Department not found');
    }

    const updatedDepartment = await prisma.department.update({
      where: { id },
      data: { status: DepartmentStatus.INACTIVE },
    });

    return updatedDepartment;
  },
};
