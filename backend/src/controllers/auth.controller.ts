import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { authService } from '../services/auth.service';
import { ApiResponse } from '../utils/apiResponse';

export const authController = {
  async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName, phone } = req.body;
      const user = await authService.register({ email, password, firstName, lastName, phone });
      return ApiResponse.created(res, user, 'Registration successful. Please verify your email.');
    } catch (error) {
      next(error);
    }
  },

  async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return ApiResponse.success(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  },

  async refreshToken(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return ApiResponse.badRequest(res, 'Refresh token is required');
      }
      const tokens = await authService.refreshToken(refreshToken);
      return ApiResponse.success(res, tokens, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  },

  async forgotPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      return ApiResponse.success(res, result, result.message);
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;
      const result = await authService.resetPassword(token, password);
      return ApiResponse.success(res, result, 'Password reset successfully');
    } catch (error) {
      next(error);
    }
  },

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(req.user!.userId, currentPassword, newPassword);
      return ApiResponse.success(res, result, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  },

  async verifyEmail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const result = await authService.verifyEmail(token as string);
      return ApiResponse.success(res, result, 'Email verified successfully');
    } catch (error) {
      next(error);
    }
  },

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.getProfile(req.user!.userId);
      return ApiResponse.success(res, user, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { firstName, lastName, phone } = req.body;
      const user = await authService.updateProfile(req.user!.userId, { firstName, lastName, phone });
      return ApiResponse.success(res, user, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      return ApiResponse.success(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  },
};
