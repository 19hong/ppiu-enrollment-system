import { Router } from 'express';
import { z } from 'zod';
import { lecturerController } from '../controllers/lecturer.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

const createLecturerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    phone: z.string().regex(/^\+?[\d\s-]{8,20}$/, 'Invalid phone number').optional(),
  }),
});

const updateLecturerSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    phone: z.string().regex(/^\+?[\d\s-]{8,20}$/).optional(),
  }),
});

router.get('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'REGISTRAR'), lecturerController.getAll);

router.get('/:id', authenticate, lecturerController.getById);

router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), validate(createLecturerSchema), lecturerController.create);

router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), validate(updateLecturerSchema), lecturerController.update);

router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), lecturerController.delete);

router.get('/:id/courses', authenticate, lecturerController.getCourses);

router.get('/:id/schedule', authenticate, lecturerController.getSchedule);

router.get('/:id/students', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'LECTURER'), lecturerController.getStudents);

export default router;
