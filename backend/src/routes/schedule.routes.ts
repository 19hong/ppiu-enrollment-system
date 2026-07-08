import { Router } from 'express';
import { z } from 'zod';
import { scheduleController } from '../controllers/schedule.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

const createScheduleSchema = z.object({
  body: z.object({
    courseId: z.string().uuid('Invalid course ID'),
    classroomId: z.string().uuid('Invalid classroom ID'),
    lecturerId: z.string().uuid('Invalid lecturer ID').optional(),
    semesterId: z.string().uuid('Invalid semester ID'),
    weekday: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']),
    startTime: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid start time'),
    endTime: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid end time'),
    capacity: z.number().int().positive().optional(),
  }),
});

const updateScheduleSchema = z.object({
  body: z.object({
    courseId: z.string().uuid('Invalid course ID').optional(),
    classroomId: z.string().uuid('Invalid classroom ID').optional(),
    lecturerId: z.string().uuid('Invalid lecturer ID').nullable().optional(),
    semesterId: z.string().uuid('Invalid semester ID').optional(),
    weekday: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']).optional(),
    startTime: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid start time').optional(),
    endTime: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid end time').optional(),
    capacity: z.number().int().positive().optional(),
    status: z.enum(['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED']).optional(),
  }),
});

const availabilityQuerySchema = z.object({
  query: z.object({
    classroomId: z.string().uuid('Invalid classroom ID'),
    weekday: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']),
    startTime: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid start time'),
    endTime: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid end time'),
    semesterId: z.string().uuid('Invalid semester ID'),
  }),
});

router.get('/', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR', 'LECTURER', 'STUDENT'), scheduleController.getAll);

router.get('/my-schedule', authenticate, authorize('LECTURER', 'STUDENT'), scheduleController.getMySchedule);

router.get('/availability', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR'), validate(availabilityQuerySchema), scheduleController.checkAvailability);

router.get('/semesters/:semesterId', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR', 'LECTURER', 'STUDENT'), scheduleController.getSemesterSchedule);

router.get('/:id', authenticate, scheduleController.getById);

router.post('/', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR'), validate(createScheduleSchema), scheduleController.create);

router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR'), validate(updateScheduleSchema), scheduleController.update);

router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR'), scheduleController.delete);

export default router;
