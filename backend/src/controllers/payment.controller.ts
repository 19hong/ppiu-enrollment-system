import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { paymentService } from '../services/payment.service';
import { ApiResponse } from '../utils/apiResponse';

export const paymentController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { search, status, paymentType, studentId, page, limit } = req.query;
      const result = await paymentService.getAll({
        search: search as string,
        status: status as any,
        paymentType: paymentType as string,
        studentId: studentId as string,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      return ApiResponse.success(res, result.data, 'Payments retrieved successfully', 200, result.meta);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const payment = await paymentService.getById(id);
      return ApiResponse.success(res, payment, 'Payment retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const payment = await paymentService.create(req.body);
      return ApiResponse.created(res, payment, 'Payment record created successfully');
    } catch (error) {
      next(error);
    }
  },

  async recordPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const paymentId = req.params.id as string;
      const payment = await paymentService.recordPayment(paymentId, {
        ...req.body,
        paidBy: req.user!.userId,
      });
      return ApiResponse.success(res, payment, 'Payment recorded successfully');
    } catch (error) {
      next(error);
    }
  },

  async getMyPayments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const payments = await paymentService.getMyPayments(req.user!.userId);
      return ApiResponse.success(res, payments, 'Payments retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async getInvoice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const paymentId = req.params.id as string;
      const pdfBuffer = await paymentService.getInvoice(paymentId, req.user!.userId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${paymentId}.pdf`);
      return res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  },

  async getReceipt(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const paymentId = req.params.id as string;
      const pdfBuffer = await paymentService.getReceipt(paymentId, req.user!.userId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=receipt-${paymentId}.pdf`);
      return res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  },
};
