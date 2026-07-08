import { Router } from 'express';
import { z } from 'zod';
import { courseController } from '../controllers/course.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

const createCourseSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Code is required').max(20),
    name: z.string().min(1, 'Name is required').max(100),
    description: z.string().optional(),
    credits: z.number().int().min(1, 'Credits must be at least 1').max(20).optional(),
    semester: z.number().int().min(1).max(20).optional(),
    departmentId: z.string().uuid('Invalid department ID'),
    programId: z.string().uuid('Invalid program ID').optional(),
    lecturerId: z.string().uuid().optional(),
    maxStudents: z.number().int().min(1).optional(),
  }),
});

const updateCourseSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    code: z.string().min(1).max(20).optional(),
    description: z.string().optional(),
    credits: z.number().int().min(1).max(20).optional(),
    semester: z.number().int().min(1).max(20).optional(),
    departmentId: z.string().uuid().optional(),
    programId: z.string().uuid().nullable().optional(),
    lecturerId: z.string().uuid().nullable().optional(),
    maxStudents: z.number().int().min(1).optional(),
    isActive: z.boolean().optional(),
  }),
});

router.get('/', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR', 'DEPARTMENT_HEAD', 'LECTURER', 'STUDENT'), courseController.getAll);

router.get('/:id', authenticate, courseController.getById);

router.get('/:id/prerequisites', authenticate, courseController.getPrerequisites);

router.get('/:id/prerequisites/check/:studentId', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR', 'DEPARTMENT_HEAD'), courseController.checkPrerequisites);

router.post('/', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR'), validate(createCourseSchema), courseController.create);

router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR'), validate(updateCourseSchema), courseController.update);

router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), courseController.delete);

export default router;
