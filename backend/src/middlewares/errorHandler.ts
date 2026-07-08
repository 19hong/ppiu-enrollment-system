import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { ApiResponse } from '../utils/apiResponse';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Request failed', {
    method: req.method,
    path: req.path,
    errorName: err.name,
    errorMessage: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

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
      return ApiResponse.conflict(res, 'A record with this value already exists');
    }
    if (err.code === 'P2025') {
      return ApiResponse.notFound(res, 'The requested record was not found');
    }
    if (err.code === 'P2003') {
      return ApiResponse.badRequest(res, 'Referenced record not found');
    }
    if (err.code === 'P2014') {
      return ApiResponse.badRequest(res, 'Invalid relationship constraint');
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return ApiResponse.badRequest(res, 'Invalid data provided');
  }

  return ApiResponse.error(res, 'Internal server error', 500);
};
