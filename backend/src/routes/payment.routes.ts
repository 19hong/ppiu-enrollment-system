import { Router } from 'express';
import { z } from 'zod';
import { paymentController } from '../controllers/payment.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';

const router = Router();

const createPaymentSchema = z.object({
  body: z.object({
    studentId: z.string().uuid('Invalid student ID'),
    enrollmentId: z.string().uuid('Invalid enrollment ID').optional(),
    amount: z.number().positive('Amount must be positive'),
    paymentType: z.enum(['TUITION', 'REGISTRATION', 'OTHER']).optional(),
    dueDate: z.string().optional(),
    description: z.string().optional(),
  }),
});

const recordPaymentSchema = z.object({
  body: z.object({
    amount: z.number().positive('Payment amount must be positive'),
    paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'CHEQUE', 'ONLINE']),
    transactionId: z.string().optional(),
    notes: z.string().optional(),
  }),
});

router.get('/', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR', 'ACCOUNTANT', 'DEPARTMENT_HEAD'), paymentController.getAll);

router.get('/my-payments', authenticate, authorize('STUDENT'), paymentController.getMyPayments);

router.get('/:id', authenticate, paymentController.getById);

router.get('/:id/invoice', authenticate, paymentController.getInvoice);

router.get('/:id/receipt', authenticate, paymentController.getReceipt);

router.post('/', authenticate, authorize('SUPER_ADMIN', 'REGISTRAR', 'ACCOUNTANT'), validate(createPaymentSchema), paymentController.create);

router.post('/:id/pay', authenticate, authorize('SUPER_ADMIN', 'ACCOUNTANT', 'REGISTRAR'), validate(recordPaymentSchema), paymentController.recordPayment);

export default router;
