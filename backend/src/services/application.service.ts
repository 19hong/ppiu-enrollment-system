import prisma from '../config/database';
import { NotFoundError } from '../utils/errors';
import { paginate } from '../utils/helpers';

export const applicationService = {
  async getAll(filters: {
    status?: string;
    programId?: string;
    semesterId?: string;
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

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.programId) {
      where.programId = filters.programId;
    }
    if (filters.semesterId) {
      where.semesterId = filters.semesterId;
    }

    const allowedSortFields = ['createdAt', 'updatedAt', 'applicationDate', 'status'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const { skip, take } = paginate(page, limit);

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
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
            },
          },
          program: true,
          semester: true,
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.application.count({ where }),
    ]);

    return {
      data: applications,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getById(id: string) {
    const application = await prisma.application.findUnique({
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
          },
        },
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
        program: true,
        semester: true,
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    const documents = await prisma.document.findMany({
      where: { applicationId: id },
    });

    return { ...application, documents };
  },

  async create(data: {
    userId: string;
    programId: string;
    semesterId: string;
    documents?: { name: string; url: string; type?: string }[];
  }) {
    const application = await prisma.application.create({
      data: {
        userId: data.userId,
        programId: data.programId,
        semesterId: data.semesterId,
        documents: (data.documents || []) as any,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        program: true,
        semester: true,
      },
    });

    if (data.documents && data.documents.length > 0) {
      for (const doc of data.documents) {
        await prisma.document.create({
          data: {
            userId: data.userId,
            applicationId: application.id,
            name: doc.name,
            type: doc.type,
            url: doc.url,
          },
        });
      }
    }

    return application;
  },

  async updateReview(id: string, data: {
    status: string;
    reviewNotes?: string;
    reviewedBy: string;
  }) {
    const application = await prisma.application.findUnique({ where: { id } });
    if (!application) {
      throw new NotFoundError('Application not found');
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: data.status as any,
        reviewNotes: data.reviewNotes,
        reviewedBy: data.reviewedBy,
        reviewDate: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        program: true,
        semester: true,
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updated;
  },

  async getMyApplications(userId: string) {
    const applications = await prisma.application.findMany({
      where: { userId },
      include: {
        program: true,
        semester: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return applications;
  },

  async getStatistics() {
    const counts = await prisma.application.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const total = counts.reduce((sum: number, c: any) => sum + c._count.id, 0);
    const stats: Record<string, number> = { total };
    for (const c of counts) {
      stats[c.status] = c._count.id;
    }

    return stats;
  },
};
