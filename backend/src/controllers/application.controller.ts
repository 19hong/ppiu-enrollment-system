import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { applicationService } from '../services/application.service';
import { ApiResponse } from '../utils/apiResponse';

export const applicationController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { status, programId, semesterId, page, limit, sortBy, sortOrder } = req.query;
      const result = await applicationService.getAll({
        status: status as string,
        programId: programId as string,
        semesterId: semesterId as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });
      return ApiResponse.success(res, result.data, 'Applications retrieved successfully', 200, result.meta);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const application = await applicationService.getById(id);
      return ApiResponse.success(res, application, 'Application retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const application = await applicationService.create(req.body);
      return ApiResponse.created(res, application, 'Application created successfully');
    } catch (error) {
      next(error);
    }
  },

  async review(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { status, reviewNotes } = req.body;
      const application = await applicationService.updateReview(id, {
        status,
        reviewNotes,
        reviewedBy: req.user!.userId,
      });
      return ApiResponse.success(res, application, 'Application reviewed successfully');
    } catch (error) {
      next(error);
    }
  },

  async getMyApplications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const applications = await applicationService.getMyApplications(userId);
      return ApiResponse.success(res, applications, 'Applications retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async getStatistics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await applicationService.getStatistics();
      return ApiResponse.success(res, stats, 'Application statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  },
};
