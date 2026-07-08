import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from './auth';
import { logger } from '../utils/logger';

const SENSITIVE_FIELDS = ['password', 'currentPassword', 'newPassword', 'confirmPassword', 'token', 'refreshToken'];

function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') return body;
  const sanitized = Array.isArray(body) ? [...body] : { ...body };
  for (const key of Object.keys(sanitized)) {
    if (SENSITIVE_FIELDS.includes(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeBody(sanitized[key]);
    }
  }
  return sanitized;
}

export const auditLog = (action: string, resource: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
      if (req.user && res.statusCode < 500) {
        (async () => {
          try {
            await prisma.auditLog.create({
              data: {
                userId: req.user.userId,
                action,
                resource,
                resourceId: req.params.id || body?.data?.id || null,
                details: {
                  method: req.method,
                  path: req.path,
                  statusCode: res.statusCode,
                  body: req.method !== 'GET' ? sanitizeBody(req.body) : undefined,
                },
                ipAddress: req.ip || req.socket.remoteAddress || '',
                userAgent: req.headers['user-agent'] || '',
              },
            });
          } catch (error) {
            logger.error('Failed to create audit log', {
              action,
              resource,
              userId: req.user?.userId,
              error: error instanceof Error ? error.message : error,
            });
          }
        })();
      }
      return originalJson(body);
    };

    next();
  };
};
