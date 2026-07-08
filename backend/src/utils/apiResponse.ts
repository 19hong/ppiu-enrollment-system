import { Response } from 'express';

export class ApiResponse {
  static success(res: Response, data: any = null, message = 'Success', statusCode = 200, meta?: any) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      meta,
    });
  }

  static created(res: Response, data: any = null, message = 'Created successfully') {
    return ApiResponse.success(res, data, message, 201);
  }

  static error(res: Response, message = 'Internal Server Error', statusCode = 500, errors?: any) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }

  static badRequest(res: Response, message = 'Bad Request', errors?: any) {
    return ApiResponse.error(res, message, 400, errors);
  }

  static unauthorized(res: Response, message = 'Unauthorized') {
    return ApiResponse.error(res, message, 401);
  }

  static forbidden(res: Response, message = 'Forbidden') {
    return ApiResponse.error(res, message, 403);
  }

  static notFound(res: Response, message = 'Not Found') {
    return ApiResponse.error(res, message, 404);
  }

  static conflict(res: Response, message = 'Conflict') {
    return ApiResponse.error(res, message, 409);
  }
}
