import { Router } from 'express';
import { z } from 'zod';
import { notificationController } from '../controllers/notification.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

const createNotificationSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID'),
    title: z.string().min(1, 'Title is required'),
    message: z.string().min(1, 'Message is required'),
    type: z.enum(['INFO', 'WARNING', 'SUCCESS', 'ERROR']).optional(),
    referenceType: z.string().optional(),
    referenceId: z.string().optional(),
  }),
});

const createBulkNotificationSchema = z.object({
  body: z.object({
    userIds: z.array(z.string().uuid()).min(1, 'At least one user ID is required'),
    title: z.string().min(1, 'Title is required'),
    message: z.string().min(1, 'Message is required'),
    type: z.enum(['INFO', 'WARNING', 'SUCCESS', 'ERROR']).optional(),
    referenceType: z.string().optional(),
    referenceId: z.string().optional(),
  }),
});

router.get('/', authenticate, notificationController.getMyNotifications);

router.get('/unread-count', authenticate, notificationController.getUnreadCount);

router.patch('/read-all', authenticate, notificationController.markAllAsRead);

router.patch('/:id/read', authenticate, notificationController.markAsRead);

router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), validate(createNotificationSchema), notificationController.create);

router.post('/bulk', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), validate(createBulkNotificationSchema), notificationController.createBulk);

router.delete('/:id', authenticate, notificationController.delete);

export default router;
