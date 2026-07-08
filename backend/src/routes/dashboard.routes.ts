import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/admin', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), dashboardController.getAdminStats);

router.get('/student', authenticate, authorize('STUDENT'), dashboardController.getStudentStats);

router.get('/lecturer', authenticate, authorize('LECTURER'), dashboardController.getLecturerStats);

router.get('/finance', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), dashboardController.getFinanceStats);

router.get('/registrar', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'REGISTRAR'), dashboardController.getRegistrarStats);

export default router;
