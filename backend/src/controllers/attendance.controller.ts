import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { attendanceService } from '../services/attendance.service';
import { ApiResponse } from '../utils/apiResponse';

export const attendanceController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { studentId, courseId, scheduleId, date, status, page, limit } = req.query;
      const result = await attendanceService.getAll({
        studentId: studentId as string,
        courseId: courseId as string,
        scheduleId: scheduleId as string,
        date: date as string,
        status: status as any,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      return ApiResponse.success(res, result.data, 'Attendance records retrieved successfully', 200, result.meta);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const record = await attendanceService.getById(id);
      return ApiResponse.success(res, record, 'Attendance record retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async markAttendance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const record = await attendanceService.markAttendance(req.body);
      return ApiResponse.created(res, record, 'Attendance marked successfully');
    } catch (error) {
      next(error);
    }
  },

  async markBulkAttendance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const records = await attendanceService.markBulkAttendance(req.body);
      return ApiResponse.created(res, records, 'Bulk attendance marked successfully');
    } catch (error) {
      next(error);
    }
  },

  async updateAttendance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const record = await attendanceService.updateAttendance(id, req.body);
      return ApiResponse.success(res, record, 'Attendance updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async getMyAttendance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const records = await attendanceService.getMyAttendance(req.user!.userId);
      return ApiResponse.success(res, records, 'Attendance records retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async getAttendanceReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const studentId = req.params.studentId as string;
      const { courseId, semesterId } = req.query;
      const report = await attendanceService.getAttendanceReport(
        studentId,
        courseId as string,
        semesterId as string,
      );
      return ApiResponse.success(res, report, 'Attendance report generated successfully');
    } catch (error) {
      next(error);
    }
  },

  async getCourseAttendance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const courseId = req.params.courseId as string;
      const { date } = req.query;
      const records = await attendanceService.getCourseAttendance(courseId, date as string);
      return ApiResponse.success(res, records, 'Course attendance retrieved successfully');
    } catch (error) {
      next(error);
    }
  },
};
