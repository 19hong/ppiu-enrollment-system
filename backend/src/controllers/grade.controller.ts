import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { gradeService } from '../services/grade.service';
import { ApiResponse } from '../utils/apiResponse';

export const gradeController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { studentId, courseId, semesterId, page, limit } = req.query;
      const result = await gradeService.getAll({
        studentId: studentId as string,
        courseId: courseId as string,
        semesterId: semesterId as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      return ApiResponse.success(res, result.data, 'Grades retrieved successfully', 200, result.meta);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const grade = await gradeService.getById(id);
      return ApiResponse.success(res, grade, 'Grade retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async enterGrade(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const grade = await gradeService.enterGrade({
        ...req.body,
        gradedBy: req.user!.userId,
      });
      return ApiResponse.created(res, grade, 'Grade entered successfully');
    } catch (error) {
      next(error);
    }
  },

  async updateGrade(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const grade = await gradeService.updateGrade(id, {
        ...req.body,
        gradedBy: req.user!.userId,
      });
      return ApiResponse.success(res, grade, 'Grade updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async getMyGrades(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const grades = await gradeService.getMyGrades(req.user!.userId);
      return ApiResponse.success(res, grades, 'Grades retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async getStudentGrades(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const studentId = req.params.studentId as string;
      const grades = await gradeService.getStudentGrades(studentId);
      return ApiResponse.success(res, grades, 'Student grades retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async generateTranscript(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const studentId = req.params.studentId as string;
      const transcript = await gradeService.generateTranscript(studentId);
      return ApiResponse.success(res, transcript, 'Transcript generated successfully');
    } catch (error) {
      next(error);
    }
  },

  async getCourseGrades(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const courseId = req.params.courseId as string;
      const grades = await gradeService.getCourseGrades(courseId);
      return ApiResponse.success(res, grades, 'Course grades retrieved successfully');
    } catch (error) {
      next(error);
    }
  },
};
