import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { studentService } from '../services/student.service';
import { ApiResponse } from '../utils/apiResponse';

export const studentController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { search, status, page, limit, sortBy, sortOrder } = req.query;
      const result = await studentService.getAll({
        search: search as string,
        status: status as any,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });
      return ApiResponse.success(res, result.data, 'Students retrieved successfully', 200, result.meta);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const student = await studentService.getById(id);
      return ApiResponse.success(res, student, 'Student retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const student = await studentService.create(req.body);
      return ApiResponse.created(res, student, 'Student created successfully');
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const student = await studentService.update(id, req.body);
      return ApiResponse.success(res, student, 'Student updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await studentService.delete(id);
      return ApiResponse.success(res, null, 'Student deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { status } = req.body;
      const student = await studentService.updateStatus(id, status);
      return ApiResponse.success(res, student, 'Student status updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async uploadPhoto(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      if (!req.file) {
        return ApiResponse.badRequest(res, 'No file uploaded');
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      const result = await studentService.uploadPhoto(id, fileUrl);
      return ApiResponse.success(res, result, 'Photo uploaded successfully');
    } catch (error) {
      next(error);
    }
  },
};
