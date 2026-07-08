import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { reportService } from '../services/report.service';
import { ApiResponse } from '../utils/apiResponse';

export const reportController = {
  async getEnrollmentReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { semesterId } = req.query;
      const report = await reportService.getEnrollmentReport(semesterId as string);
      return ApiResponse.success(res, report, 'Enrollment report generated successfully');
    } catch (error) {
      next(error);
    }
  },

  async getStudentReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { departmentId } = req.query;
      const report = await reportService.getStudentReport(departmentId as string);
      return ApiResponse.success(res, report, 'Student report generated successfully');
    } catch (error) {
      next(error);
    }
  },

  async getFinanceReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const report = await reportService.getFinanceReport(startDate as string, endDate as string);
      return ApiResponse.success(res, report, 'Finance report generated successfully');
    } catch (error) {
      next(error);
    }
  },

  async getAttendanceReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { courseId, semesterId } = req.query;
      const report = await reportService.getAttendanceReport(courseId as string, semesterId as string);
      return ApiResponse.success(res, report, 'Attendance report generated successfully');
    } catch (error) {
      next(error);
    }
  },

  async getGradeReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { courseId, semesterId } = req.query;
      const report = await reportService.getGradeReport(courseId as string, semesterId as string);
      return ApiResponse.success(res, report, 'Grade report generated successfully');
    } catch (error) {
      next(error);
    }
  },

  async getDepartmentReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { departmentId } = req.query;
      const report = await reportService.getDepartmentReport(departmentId as string);
      return ApiResponse.success(res, report, 'Department report generated successfully');
    } catch (error) {
      next(error);
    }
  },

  async exportPDF(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { reportType, ...data } = req.body;
      const result = await reportService.exportPDF(reportType, data);
      return ApiResponse.success(res, result, 'PDF exported successfully');
    } catch (error) {
      next(error);
    }
  },

  async exportExcel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { reportType, ...data } = req.body;
      const result = await reportService.exportExcel(reportType, data);
      return ApiResponse.success(res, result, 'Excel exported successfully');
    } catch (error) {
      next(error);
    }
  },
};
