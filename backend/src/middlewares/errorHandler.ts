import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { ApiResponse } from '../utils/apiResponse';
import { Prisma } from '@prisma/client';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    return ApiResponse.error(res, err.message, err.statusCode);
  }

  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return ApiResponse.badRequest(res, 'Validation failed', errors);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = err.meta?.target as string;
      return ApiResponse.conflict(res, `Duplicate value for ${field}`);
    }
    if (err.code === 'P2025') {
      return ApiResponse.notFound(res, 'Record not found');
    }
    if (err.code === 'P2003') {
      return ApiResponse.badRequest(res, 'Referenced record not found');
    }
  }

  return ApiResponse.error(res, 'Internal server error', 500);
};
