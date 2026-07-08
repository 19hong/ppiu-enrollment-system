import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { notificationService } from '../services/notification.service';
import { ApiResponse } from '../utils/apiResponse';

export const notificationController = {
  async getMyNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { isRead, page, limit } = req.query;
      const result = await notificationService.getMyNotifications(userId, {
        isRead: isRead !== undefined ? isRead === 'true' : undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      return ApiResponse.success(res, result.data, 'Notifications retrieved successfully', 200, result.meta);
    } catch (error) {
      next(error);
    }
  },

  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const notification = await notificationService.markAsRead(id, req.user!.userId);
      return ApiResponse.success(res, notification, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  },

  async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      await notificationService.markAllAsRead(userId);
      return ApiResponse.success(res, null, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const notification = await notificationService.create(req.body);
      return ApiResponse.created(res, notification, 'Notification created successfully');
    } catch (error) {
      next(error);
    }
  },

  async createBulk(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userIds, ...data } = req.body;
      const result = await notificationService.createBulk(userIds, data);
      return ApiResponse.created(res, result, 'Notifications created successfully');
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await notificationService.delete(id, req.user!.userId);
      return ApiResponse.success(res, null, 'Notification deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const result = await notificationService.getUnreadCount(userId);
      return ApiResponse.success(res, result, 'Unread count retrieved successfully');
    } catch (error) {
      next(error);
    }
  },
};
