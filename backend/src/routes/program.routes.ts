import { Router } from 'express';
import { z } from 'zod';
import { programController } from '../controllers/program.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

const createProgramSchema = z.object({
  code: z.string().min(1, 'Code is required').max(20),
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  level: z.enum(['BACHELOR', 'MASTER', 'ASSOCIATE', 'DOCTORATE']),
  duration: z.number().int().min(1, 'Duration must be at least 1 year').optional(),
  creditsTotal: z.number().int().min(1).optional(),
  departmentId: z.string().uuid('Invalid department ID'),
});

const updateProgramSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().min(1).max(20).optional(),
  description: z.string().optional(),
  level: z.enum(['BACHELOR', 'MASTER', 'ASSOCIATE', 'DOCTORATE']).optional(),
  duration: z.number().int().min(1).optional(),
  creditsTotal: z.number().int().min(1).optional(),
  departmentId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
});

router.get('/', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR', 'DEPARTMENT_HEAD', 'LECTURER', 'STUDENT'), programController.getAll);

router.get('/:id', authenticate, programController.getById);

router.post('/', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR'), validate(createProgramSchema), programController.create);

router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR'), validate(updateProgramSchema), programController.update);

router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), programController.delete);

export default router;
