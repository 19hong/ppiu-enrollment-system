import prisma from '../config/database';
import { NotFoundError } from '../utils/errors';
import { paginate } from '../utils/helpers';

export const announcementService = {
  async getAll(filters: {
    search?: string;
    type?: string;
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
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const allowedSortFields = ['createdAt', 'updatedAt', 'title', 'publishedAt', 'priority'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const { skip, take } = paginate(page, limit);

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        skip,
        take,
        orderBy: { [orderField]: sortOrder },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      prisma.announcement.count({ where }),
    ]);

    return {
      data: announcements,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getById(id: string) {
    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    if (!announcement) {
      throw new NotFoundError('Announcement not found');
    }

    return announcement;
  },

  async create(data: {
    title: string;
    content: string;
    type: string;
    priority?: string;
    targetRoles?: string[];
    publishedAt?: string;
    expiresAt?: string;
    authorId: string;
  }) {
    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        type: data.type as any,
        priority: (data.priority as any) || 'MEDIUM',
        targetRoles: (data.targetRoles || null) as any,
        authorId: data.authorId,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        status: data.publishedAt ? 'PUBLISHED' : 'DRAFT',
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return announcement;
  },

  async update(id: string, data: {
    title?: string;
    content?: string;
    type?: string;
    priority?: string;
    targetRoles?: string[];
    publishedAt?: string;
    expiresAt?: string;
  }) {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Announcement not found');
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.type !== undefined && { type: data.type as any }),
        ...(data.priority !== undefined && { priority: data.priority as any }),
        ...(data.targetRoles !== undefined && { targetRoles: data.targetRoles as any }),
        ...(data.publishedAt !== undefined && { publishedAt: data.publishedAt ? new Date(data.publishedAt) : null }),
        ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt ? new Date(data.expiresAt) : null }),
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return announcement;
  },

  async delete(id: string) {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Announcement not found');
    }

    await prisma.announcement.delete({ where: { id } });
    return { message: 'Announcement deleted successfully' };
  },

  async publish(id: string) {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Announcement not found');
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return announcement;
  },

  async archive(id: string) {
    const existing = await prisma.announcement.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Announcement not found');
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: { status: 'ARCHIVED' },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return announcement;
  },

  async getActive() {
    const now = new Date();

    const announcements = await prisma.announcement.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { publishedAt: 'desc' },
      ],
    });

    return announcements;
  },
};
