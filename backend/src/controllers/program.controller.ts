import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { programService } from '../services/program.service';
import { ApiResponse } from '../utils/apiResponse';

export const programController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { search, level, departmentId, page, limit, sortBy, sortOrder } = req.query;
      const result = await programService.getAll({
        search: search as string,
        level: level as string,
        departmentId: departmentId as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });
      return ApiResponse.success(res, result.data, 'Programs retrieved successfully', 200, result.meta);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const program = await programService.getById(id);
      return ApiResponse.success(res, program, 'Program retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const program = await programService.create(req.body);
      return ApiResponse.created(res, program, 'Program created successfully');
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const program = await programService.update(id, req.body);
      return ApiResponse.success(res, program, 'Program updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await programService.delete(id);
      return ApiResponse.success(res, null, 'Program deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};
