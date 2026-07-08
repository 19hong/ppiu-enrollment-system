import { Router } from 'express';
import { z } from 'zod';
import { announcementController } from '../controllers/announcement.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

const createAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200),
    content: z.string().min(1, 'Content is required'),
    type: z.enum(['GENERAL', 'ACADEMIC', 'ADMIN', 'FINANCE']),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    targetRoles: z.array(z.string()).optional(),
    publishedAt: z.string().datetime().optional(),
    expiresAt: z.string().datetime().optional(),
  }),
});

const updateAnnouncementSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    content: z.string().min(1).optional(),
    type: z.enum(['GENERAL', 'ACADEMIC', 'ADMIN', 'FINANCE']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    targetRoles: z.array(z.string()).optional(),
    publishedAt: z.string().datetime().nullable().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
  }),
});

router.get('/active', announcementController.getActive);

router.get('/', authenticate, announcementController.getAll);

router.get('/:id', authenticate, announcementController.getById);

router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), validate(createAnnouncementSchema), announcementController.create);

router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), validate(updateAnnouncementSchema), announcementController.update);

router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), announcementController.delete);

router.patch('/:id/publish', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), announcementController.publish);

router.patch('/:id/archive', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), announcementController.archive);

export default router;
