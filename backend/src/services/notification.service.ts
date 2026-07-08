import prisma from '../config/database';
import { NotFoundError } from '../utils/errors';
import { paginate } from '../utils/helpers';

export const notificationService = {
  async getMyNotifications(userId: string, filters: {
    isRead?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const where: any = { userId };

    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead;
    }

    const { skip, take } = paginate(page, limit);

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async markAsRead(notificationId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return updated;
  },

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { message: 'All notifications marked as read' };
  },

  async create(data: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    referenceType?: string;
    referenceId?: string;
  }) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: (data.type as any) || 'INFO',
        referenceType: data.referenceType,
        referenceId: data.referenceId,
      },
    });

    return notification;
  },

  async createBulk(userIds: string[], data: {
    title: string;
    message: string;
    type?: string;
    referenceType?: string;
    referenceId?: string;
  }) {
    const notifications = await prisma.notification.createMany({
      data: userIds.map(userId => ({
        userId,
        title: data.title,
        message: data.message,
        type: (data.type as any) || 'INFO',
        referenceType: data.referenceType,
        referenceId: data.referenceId,
      })),
    });

    return { count: notifications.count };
  },

  async delete(id: string) {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    await prisma.notification.delete({ where: { id } });
    return { message: 'Notification deleted successfully' };
  },

  async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { count };
  },
};
