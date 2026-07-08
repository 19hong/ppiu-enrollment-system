import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { lecturerService } from '../services/lecturer.service';
import { ApiResponse } from '../utils/apiResponse';

export const lecturerController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { search, departmentId, page, limit, sortBy, sortOrder } = req.query;
      const result = await lecturerService.getAll({
        search: search as string,
        departmentId: departmentId as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });
      return ApiResponse.success(res, result.data, 'Lecturers retrieved successfully', 200, result.meta);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const lecturer = await lecturerService.getById(id);
      return ApiResponse.success(res, lecturer, 'Lecturer retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const lecturer = await lecturerService.create(req.body);
      return ApiResponse.created(res, lecturer, 'Lecturer created successfully');
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const lecturer = await lecturerService.update(id, req.body);
      return ApiResponse.success(res, lecturer, 'Lecturer updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await lecturerService.delete(id);
      return ApiResponse.success(res, null, 'Lecturer deactivated successfully');
    } catch (error) {
      next(error);
    }
  },

  async getCourses(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const courses = await lecturerService.getCourses(id);
      return ApiResponse.success(res, courses, 'Courses retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async getSchedule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const schedules = await lecturerService.getSchedule(id);
      return ApiResponse.success(res, schedules, 'Schedule retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async getStudents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const students = await lecturerService.getStudents(id);
      return ApiResponse.success(res, students, 'Students retrieved successfully');
    } catch (error) {
      next(error);
    }
  },
};
