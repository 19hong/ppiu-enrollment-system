import { ProgramLevel, ProgramStatus } from '@prisma/client';
import prisma from '../config/database';
import { ConflictError, NotFoundError } from '../utils/errors';
import { paginate } from '../utils/helpers';

export const programService = {
  async getAll(filters: {
    search?: string;
    level?: string;
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

    const where: any = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.level) {
      where.level = filters.level;
    }

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'code', 'level', 'duration'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const { skip, take } = paginate(page, limit);

    const [programs, total] = await Promise.all([
      prisma.program.findMany({
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
          _count: {
            select: { courses: true },
          },
        },
      }),
      prisma.program.count({ where }),
    ]);

    return {
      data: programs,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getById(id: string) {
    const program = await prisma.program.findUnique({
      where: { id },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
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

    if (!program) {
      throw new NotFoundError('Program not found');
    }

    return program;
  },

  async create(data: {
    name: string;
    code: string;
    description?: string;
    level: string;
    duration?: number;
    creditsTotal?: number;
    departmentId: string;
  }) {
    const existingCode = await prisma.program.findUnique({ where: { code: data.code } });
    if (existingCode) {
      throw new ConflictError('Program code already exists');
    }

    const existingName = await prisma.program.findUnique({ where: { name: data.name } });
    if (existingName) {
      throw new ConflictError('Program name already exists');
    }

    const department = await prisma.department.findUnique({ where: { id: data.departmentId } });
    if (!department) {
      throw new NotFoundError('Department not found');
    }

    const program = await prisma.program.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        level: data.level as ProgramLevel,
        duration: data.duration,
        creditsTotal: data.creditsTotal,
        departmentId: data.departmentId,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return program;
  },

  async update(
    id: string,
    data: {
      name?: string;
      code?: string;
      description?: string;
      level?: string;
      duration?: number;
      creditsTotal?: number;
      departmentId?: string;
      isActive?: boolean;
    },
  ) {
    const program = await prisma.program.findUnique({ where: { id } });
    if (!program) {
      throw new NotFoundError('Program not found');
    }

    if (data.code && data.code !== program.code) {
      const existingCode = await prisma.program.findUnique({ where: { code: data.code } });
      if (existingCode) {
        throw new ConflictError('Program code already exists');
      }
    }

    if (data.name && data.name !== program.name) {
      const existingName = await prisma.program.findUnique({ where: { name: data.name } });
      if (existingName) {
        throw new ConflictError('Program name already exists');
      }
    }

    if (data.departmentId) {
      const department = await prisma.department.findUnique({ where: { id: data.departmentId } });
      if (!department) {
        throw new NotFoundError('Department not found');
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.level !== undefined) updateData.level = data.level;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.creditsTotal !== undefined) updateData.creditsTotal = data.creditsTotal;
    if (data.departmentId !== undefined) updateData.departmentId = data.departmentId;
    if (data.isActive !== undefined) {
      updateData.status = data.isActive ? ProgramStatus.ACTIVE : ProgramStatus.INACTIVE;
    }

    const updatedProgram = await prisma.program.update({
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
      },
    });

    return updatedProgram;
  },

  async delete(id: string) {
    const program = await prisma.program.findUnique({ where: { id } });
    if (!program) {
      throw new NotFoundError('Program not found');
    }

    const updatedProgram = await prisma.program.update({
      where: { id },
      data: { status: ProgramStatus.INACTIVE },
    });

    return updatedProgram;
  },
};
