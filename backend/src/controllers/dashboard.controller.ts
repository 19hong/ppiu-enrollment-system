import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { dashboardService } from '../services/dashboard.service';
import { ApiResponse } from '../utils/apiResponse';

export const dashboardController = {
  async getAdminStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await dashboardService.getAdminStats();
      return ApiResponse.success(res, stats, 'Admin stats retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async getStudentStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const stats = await dashboardService.getStudentStats(userId);
      return ApiResponse.success(res, stats, 'Student stats retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async getLecturerStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const stats = await dashboardService.getLecturerStats(userId);
      return ApiResponse.success(res, stats, 'Lecturer stats retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async getFinanceStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await dashboardService.getFinanceStats();
      return ApiResponse.success(res, stats, 'Finance stats retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async getRegistrarStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await dashboardService.getRegistrarStats();
      return ApiResponse.success(res, stats, 'Registrar stats retrieved successfully');
    } catch (error) {
      next(error);
    }
  },
};
