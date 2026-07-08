import { Router } from 'express';
import { z } from 'zod';
import { attendanceController } from '../controllers/attendance.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

const markAttendanceSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  scheduleId: z.string().uuid('Invalid schedule ID'),
  courseId: z.string().uuid('Invalid course ID'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
  remarks: z.string().optional(),
});

const bulkAttendanceSchema = z.object({
  scheduleId: z.string().uuid('Invalid schedule ID'),
  courseId: z.string().uuid('Invalid course ID'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  records: z.array(
    z.object({
      studentId: z.string().uuid('Invalid student ID'),
      status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
      remarks: z.string().optional(),
    }),
  ).min(1, 'At least one record is required'),
});

const updateAttendanceSchema = z.object({
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']).optional(),
  remarks: z.string().optional(),
});

router.get('/', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR', 'LECTURER'), attendanceController.getAll);

router.get('/my-attendance', authenticate, authorize('STUDENT'), attendanceController.getMyAttendance);

router.get('/courses/:courseId', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR', 'LECTURER'), attendanceController.getCourseAttendance);

router.get('/reports/:studentId', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR', 'LECTURER'), attendanceController.getAttendanceReport);

router.get('/:id', authenticate, attendanceController.getById);

router.post('/', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR', 'LECTURER'), validate(markAttendanceSchema), attendanceController.markAttendance);

router.post('/bulk', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR', 'LECTURER'), validate(bulkAttendanceSchema), attendanceController.markBulkAttendance);

router.patch('/:id', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR', 'LECTURER'), validate(updateAttendanceSchema), attendanceController.updateAttendance);

export default router;
