import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { enrollmentService } from '../services/enrollment.service';
import { ApiResponse } from '../utils/apiResponse';

export const enrollmentController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { search, status, semesterId, studentId, page, limit } = req.query;
      const result = await enrollmentService.getAll({
        search: search as string,
        status: status as any,
        semesterId: semesterId as string,
        studentId: studentId as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      return ApiResponse.success(res, result.data, 'Enrollments retrieved successfully', 200, result.meta);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const enrollment = await enrollmentService.getById(id);
      return ApiResponse.success(res, enrollment, 'Enrollment retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const enrollment = await enrollmentService.create(req.body);
      return ApiResponse.created(res, enrollment, 'Enrollment created successfully');
    } catch (error) {
      next(error);
    }
  },

  async approve(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const enrollment = await enrollmentService.approve(id, req.user!.userId);
      return ApiResponse.success(res, enrollment, 'Enrollment approved successfully');
    } catch (error) {
      next(error);
    }
  },

  async reject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const enrollment = await enrollmentService.reject(id);
      return ApiResponse.success(res, enrollment, 'Enrollment rejected successfully');
    } catch (error) {
      next(error);
    }
  },

  async getMyEnrollments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const enrollments = await enrollmentService.getMyEnrollments(req.user!.userId);
      return ApiResponse.success(res, enrollments, 'Enrollments retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async getSchedule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const enrollmentId = req.params.enrollmentId as string;
      const schedule = await enrollmentService.getSchedule(enrollmentId, req.user!.userId);
      return ApiResponse.success(res, schedule, 'Schedule retrieved successfully');
    } catch (error) {
      next(error);
    }
  },
};
