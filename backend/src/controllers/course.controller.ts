import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { courseService } from '../services/course.service';
import { ApiResponse } from '../utils/apiResponse';

export const courseController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { search, semester, departmentId, programId, page, limit, sortBy, sortOrder } = req.query;
      const result = await courseService.getAll({
        search: search as string,
        semester: semester ? parseInt(semester as string, 10) : undefined,
        departmentId: departmentId as string,
        programId: programId as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });
      return ApiResponse.success(res, result.data, 'Courses retrieved successfully', 200, result.meta);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const course = await courseService.getById(id);
      return ApiResponse.success(res, course, 'Course retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const course = await courseService.create(req.body);
      return ApiResponse.created(res, course, 'Course created successfully');
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const course = await courseService.update(id, req.body);
      return ApiResponse.success(res, course, 'Course updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await courseService.delete(id);
      return ApiResponse.success(res, null, 'Course deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  async getPrerequisites(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const prerequisites = await courseService.getPrerequisites(id);
      return ApiResponse.success(res, prerequisites, 'Prerequisites retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async checkPrerequisites(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const studentId = req.params.studentId as string;
      const result = await courseService.checkPrerequisites(id, studentId);
      return ApiResponse.success(res, result, 'Prerequisites check completed');
    } catch (error) {
      next(error);
    }
  },
};
