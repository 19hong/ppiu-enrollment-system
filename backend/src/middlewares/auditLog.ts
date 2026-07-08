import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from './auth';

export const auditLog = (action: string, resource: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    
    res.json = function (body: any) {
      if (req.user && res.statusCode < 500) {
        prisma.auditLog.create({
          data: {
            userId: req.user.userId,
            action,
            resource,
            resourceId: req.params.id || body?.data?.id || null,
            details: {
              method: req.method,
              path: req.path,
              statusCode: res.statusCode,
              body: req.method !== 'GET' ? req.body : undefined,
            },
            ipAddress: req.ip || req.socket.remoteAddress || '',
            userAgent: req.headers['user-agent'] || '',
          },
        }).catch(console.error);
      }
      return originalJson(body);
    };
    
    next();
  };
};
