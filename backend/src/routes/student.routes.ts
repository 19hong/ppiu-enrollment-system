import { Router } from 'express';
import { z } from 'zod';
import { studentController } from '../controllers/student.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { upload } from '../middlewares/upload';
import { createStudentSchema, updateStudentSchema } from '../utils/validators';

const router = Router();

const updateStudentStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'GRADUATED']),
});

router.get('/', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR', 'DEPARTMENT_HEAD'), studentController.getAll);

router.get('/:id', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR', 'DEPARTMENT_HEAD'), studentController.getById);

router.post('/', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR'), validate(createStudentSchema), studentController.create);

router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR'), validate(updateStudentSchema), studentController.update);

router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), studentController.delete);

router.patch('/:id/status', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR'), validate(updateStudentStatusSchema), studentController.updateStatus);

router.post('/:id/photo', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR', 'STUDENT'), upload.single('photo'), studentController.uploadPhoto);

export default router;
