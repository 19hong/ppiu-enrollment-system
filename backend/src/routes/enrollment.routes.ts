import { Router } from 'express';
import { z } from 'zod';
import { enrollmentController } from '../controllers/enrollment.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

const createEnrollmentSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  semesterId: z.string().uuid('Invalid semester ID'),
  courseIds: z.array(z.string().uuid('Invalid course ID')).min(1, 'At least one course is required'),
});

const approveEnrollmentSchema = z.object({
  notes: z.string().optional(),
});

router.get('/', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR', 'DEPARTMENT_HEAD', 'ACCOUNTANT'), enrollmentController.getAll);

router.get('/my-enrollments', authenticate, authorize('STUDENT'), enrollmentController.getMyEnrollments);

router.get('/:id', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR', 'STUDENT'), enrollmentController.getById);

router.get('/:enrollmentId/schedule', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR', 'STUDENT'), enrollmentController.getSchedule);

router.post('/', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR', 'STUDENT'), validate(createEnrollmentSchema), enrollmentController.create);

router.patch('/:id/approve', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR', 'DEPARTMENT_HEAD'), validate(approveEnrollmentSchema), enrollmentController.approve);

router.patch('/:id/reject', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR', 'DEPARTMENT_HEAD'), enrollmentController.reject);

export default router;
