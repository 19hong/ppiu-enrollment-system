import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { settingService } from '../services/setting.service';
import { ApiResponse } from '../utils/apiResponse';

export const settingController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const group = req.query.group as string | undefined;
      const settings = await settingService.getAll(group);
      return ApiResponse.success(res, settings, 'Settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async get(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const key = req.params.key as string;
      const setting = await settingService.get(key);
      return ApiResponse.success(res, setting, 'Setting retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const key = req.params.key as string;
      const { value } = req.body;
      const setting = await settingService.update(key, value);
      return ApiResponse.success(res, setting, 'Setting updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async updateBulk(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { settings } = req.body;
      const result = await settingService.updateBulk(settings);
      return ApiResponse.success(res, result, 'Settings updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async getUniversityInfo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const info = await settingService.getUniversityInfo();
      return ApiResponse.success(res, info, 'University info retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async updateLogo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return ApiResponse.badRequest(res, 'No file uploaded');
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      const setting = await settingService.updateLogo(fileUrl);
      return ApiResponse.success(res, setting, 'Logo updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async getAcademicYear(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const academicYear = await settingService.getAcademicYear();
      return ApiResponse.success(res, academicYear, 'Academic year retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async setCurrentAcademicYear(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { academicYearId } = req.body;
      const academicYear = await settingService.setCurrentAcademicYear(academicYearId);
      return ApiResponse.success(res, academicYear, 'Current academic year updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async getSemester(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const semester = await settingService.getSemester();
      return ApiResponse.success(res, semester, 'Current semester retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async setCurrentSemester(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { semesterId } = req.body;
      const semester = await settingService.setCurrentSemester(semesterId);
      return ApiResponse.success(res, semester, 'Current semester updated successfully');
    } catch (error) {
      next(error);
    }
  },
};
