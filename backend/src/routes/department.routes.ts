import { Router } from 'express';
import { z } from 'zod';
import { departmentController } from '../controllers/department.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

const createDepartmentSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Code is required').max(20),
    name: z.string().min(1, 'Name is required').max(100),
    description: z.string().optional(),
    headId: z.string().uuid().optional(),
  }),
});

const updateDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    code: z.string().min(1).max(20).optional(),
    description: z.string().optional(),
    headId: z.string().uuid().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});

router.get('/', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR', 'DEPARTMENT_HEAD'), departmentController.getAll);

router.get('/:id', authenticate, departmentController.getById);

router.post('/', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR'), validate(createDepartmentSchema), departmentController.create);

router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR'), validate(updateDepartmentSchema), departmentController.update);

router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), departmentController.delete);

export default router;
