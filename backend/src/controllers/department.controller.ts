import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { departmentService } from '../services/department.service';
import { ApiResponse } from '../utils/apiResponse';

export const departmentController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { search, status, page, limit, sortBy, sortOrder } = req.query;
      const result = await departmentService.getAll({
        search: search as string,
        status: status as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });
      return ApiResponse.success(res, result.data, 'Departments retrieved successfully', 200, result.meta);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const department = await departmentService.getById(id);
      return ApiResponse.success(res, department, 'Department retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const department = await departmentService.create(req.body);
      return ApiResponse.created(res, department, 'Department created successfully');
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const department = await departmentService.update(id, req.body);
      return ApiResponse.success(res, department, 'Department updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await departmentService.delete(id);
      return ApiResponse.success(res, null, 'Department deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};
