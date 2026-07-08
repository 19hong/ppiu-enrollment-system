import { Router } from 'express';
import { z } from 'zod';
import { gradeController } from '../controllers/grade.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

const enterGradeSchema = z.object({
  enrollmentCourseId: z.string().uuid('Invalid enrollment course ID'),
  studentId: z.string().uuid('Invalid student ID'),
  courseId: z.string().uuid('Invalid course ID'),
  semesterId: z.string().uuid('Invalid semester ID'),
  midterm: z.number().min(0).max(100).optional(),
  final: z.number().min(0).max(100).optional(),
  assignment: z.number().min(0).max(100).optional(),
  attendance: z.number().min(0).max(100).optional(),
  remarks: z.string().optional(),
});

const updateGradeSchema = z.object({
  midterm: z.number().min(0).max(100).optional(),
  final: z.number().min(0).max(100).optional(),
  assignment: z.number().min(0).max(100).optional(),
  attendance: z.number().min(0).max(100).optional(),
  remarks: z.string().optional(),
});

router.get('/', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR', 'LECTURER'), gradeController.getAll);

router.get('/my-grades', authenticate, authorize('STUDENT'), gradeController.getMyGrades);

router.get('/courses/:courseId', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR', 'LECTURER'), gradeController.getCourseGrades);

router.get('/students/:studentId', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR', 'LECTURER'), gradeController.getStudentGrades);

router.get('/students/:studentId/transcript', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR', 'STUDENT'), gradeController.generateTranscript);

router.get('/:id', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR', 'LECTURER', 'STUDENT'), gradeController.getById);

router.post('/', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR', 'LECTURER'), validate(enterGradeSchema), gradeController.enterGrade);

router.patch('/:id', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR', 'LECTURER'), validate(updateGradeSchema), gradeController.updateGrade);

export default router;
