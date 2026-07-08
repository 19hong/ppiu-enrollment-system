import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.get('/enrollments', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'REGISTRAR'), reportController.getEnrollmentReport);

router.get('/students', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'REGISTRAR'), reportController.getStudentReport);

router.get('/finance', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'), reportController.getFinanceReport);

router.get('/attendance', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'LECTURER'), reportController.getAttendanceReport);

router.get('/grades', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'LECTURER', 'REGISTRAR'), reportController.getGradeReport);

router.get('/departments', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), reportController.getDepartmentReport);

router.post('/export/pdf', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), reportController.exportPDF);

router.post('/export/excel', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), reportController.exportExcel);

export default router;
