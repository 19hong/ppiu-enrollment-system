import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiResponse } from '../utils/apiResponse';

function formatZodErrors(error: ZodError): { field: string; message: string }[] {
  return error.errors.map((e) => {
    const field = e.path.join('.');
    let message: string;

    switch (e.code) {
      case 'invalid_type':
        if (e.received === 'undefined') {
          message = `${field} is required`;
        } else {
          message = `${field} must be a ${e.expected}, received ${e.received}`;
        }
        break;
      case 'too_small':
        if (e.type === 'string') {
          message = `${field} must be at least ${e.minimum} characters`;
        } else if (e.type === 'number') {
          message = `${field} must be greater than or equal to ${e.minimum}`;
        } else {
          message = `${field} is too short (minimum ${e.minimum})`;
        }
        break;
      case 'too_big':
        if (e.type === 'string') {
          message = `${field} must be at most ${e.maximum} characters`;
        } else if (e.type === 'number') {
          message = `${field} must be less than or equal to ${e.maximum}`;
        } else {
          message = `${field} is too long (maximum ${e.maximum})`;
        }
        break;
      case 'invalid_string':
        if (e.validation) {
          message = `${field} is not a valid ${e.validation}`;
        } else {
          message = `${field} is invalid`;
        }
        break;
      case 'custom':
        message = e.message || `${field} is invalid`;
        break;
      default:
        message = e.message;
    }

    return { field, message };
  });
}

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      return ApiResponse.badRequest(res, 'Validation failed', errors);
    }
    req.body = result.data;
    next();
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      return ApiResponse.badRequest(res, 'Query validation failed', errors);
    }
    req.query = result.data;
    next();
  };
};
