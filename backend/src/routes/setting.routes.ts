import { Router } from 'express';
import { z } from 'zod';
import { settingController } from '../controllers/setting.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { upload } from '../middlewares/upload';

const router = Router();

const updateSettingSchema = z.object({
  body: z.object({
    value: z.string().min(1, 'Value is required'),
  }),
});

const updateBulkSettingsSchema = z.object({
  body: z.object({
    settings: z.array(z.object({
      key: z.string().min(1),
      value: z.string().min(1),
    })).min(1),
  }),
});

const setAcademicYearSchema = z.object({
  body: z.object({
    academicYearId: z.string().uuid('Invalid academic year ID'),
  }),
});

const setSemesterSchema = z.object({
  body: z.object({
    semesterId: z.string().uuid('Invalid semester ID'),
  }),
});

router.get('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), settingController.getAll);

router.get('/university', settingController.getUniversityInfo);

router.get('/academic-year', authenticate, settingController.getAcademicYear);

router.get('/semester', authenticate, settingController.getSemester);

router.get('/:key', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), settingController.get);

router.put('/:key', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), validate(updateSettingSchema), settingController.update);

router.post('/bulk', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), validate(updateBulkSettingsSchema), settingController.updateBulk);

router.post('/logo', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), upload.single('logo'), settingController.updateLogo);

router.put('/academic-year/current', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), validate(setAcademicYearSchema), settingController.setCurrentAcademicYear);

router.put('/semester/current', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), validate(setSemesterSchema), settingController.setCurrentSemester);

export default router;
