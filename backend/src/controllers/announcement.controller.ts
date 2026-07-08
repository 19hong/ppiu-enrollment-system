import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { announcementService } from '../services/announcement.service';
import { ApiResponse } from '../utils/apiResponse';

export const announcementController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { search, type, status, page, limit, sortBy, sortOrder } = req.query;
      const result = await announcementService.getAll({
        search: search as string,
        type: type as string,
        status: status as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });
      return ApiResponse.success(res, result.data, 'Announcements retrieved successfully', 200, result.meta);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const announcement = await announcementService.getById(id);
      return ApiResponse.success(res, announcement, 'Announcement retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const announcement = await announcementService.create({
        ...req.body,
        authorId: req.user!.userId,
      });
      return ApiResponse.created(res, announcement, 'Announcement created successfully');
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const announcement = await announcementService.update(id, req.body);
      return ApiResponse.success(res, announcement, 'Announcement updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await announcementService.delete(id);
      return ApiResponse.success(res, null, 'Announcement deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  async publish(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const announcement = await announcementService.publish(id);
      return ApiResponse.success(res, announcement, 'Announcement published successfully');
    } catch (error) {
      next(error);
    }
  },

  async archive(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const announcement = await announcementService.archive(id);
      return ApiResponse.success(res, announcement, 'Announcement archived successfully');
    } catch (error) {
      next(error);
    }
  },

  async getActive(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const announcements = await announcementService.getActive();
      return ApiResponse.success(res, announcements, 'Active announcements retrieved successfully');
    } catch (error) {
      next(error);
    }
  },
};
