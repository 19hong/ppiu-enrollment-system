import { Router } from 'express';
import { z } from 'zod';
import { applicationController } from '../controllers/application.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

const createApplicationSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  programId: z.string().uuid('Invalid program ID'),
  semesterId: z.string().uuid('Invalid semester ID'),
  documents: z.array(z.object({
    name: z.string().min(1),
    url: z.string().min(1),
    type: z.string().optional(),
  })).optional(),
});

const reviewApplicationSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED', 'WAITLISTED']),
  reviewNotes: z.string().optional(),
});

router.get('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'REGISTRAR'), applicationController.getAll);

router.get('/my-applications', authenticate, applicationController.getMyApplications);

router.get('/statistics', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'REGISTRAR'), applicationController.getStatistics);

router.get('/:id', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR', 'STUDENT'), applicationController.getById);

router.post('/', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR'), validate(createApplicationSchema), applicationController.create);

router.patch('/:id/review', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR'), validate(reviewApplicationSchema), applicationController.review);

export default router;
