import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { scheduleService } from '../services/schedule.service';
import { ApiResponse } from '../utils/apiResponse';

export const scheduleController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { courseId, classroomId, lecturerId, semesterId, weekday, status, page, limit } = req.query;
      const result = await scheduleService.getAll({
        courseId: courseId as string,
        classroomId: classroomId as string,
        lecturerId: lecturerId as string,
        semesterId: semesterId as string,
        weekday: weekday as any,
        status: status as any,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      return ApiResponse.success(res, result.data, 'Schedules retrieved successfully', 200, result.meta);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const schedule = await scheduleService.getById(id);
      return ApiResponse.success(res, schedule, 'Schedule retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schedule = await scheduleService.create(req.body);
      return ApiResponse.created(res, schedule, 'Schedule created successfully');
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const schedule = await scheduleService.update(id, req.body);
      return ApiResponse.success(res, schedule, 'Schedule updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await scheduleService.delete(id);
      return ApiResponse.success(res, null, 'Schedule cancelled successfully');
    } catch (error) {
      next(error);
    }
  },

  async getMySchedule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await scheduleService.getMySchedule(req.user!.userId);
      return ApiResponse.success(res, result, 'Schedule retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async checkAvailability(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { classroomId, weekday, startTime, endTime, semesterId } = req.query;
      const result = await scheduleService.checkAvailability(
        classroomId as string,
        weekday as any,
        startTime as string,
        endTime as string,
        semesterId as string,
      );
      return ApiResponse.success(res, result, 'Availability checked successfully');
    } catch (error) {
      next(error);
    }
  },

  async getSemesterSchedule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const semesterId = req.params.semesterId as string;
      const result = await scheduleService.getSemesterSchedule(semesterId);
      return ApiResponse.success(res, result, 'Semester schedule retrieved successfully');
    } catch (error) {
      next(error);
    }
  },
};
