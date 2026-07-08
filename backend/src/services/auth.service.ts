import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { config } from '../config';
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';
import { RoleName } from '../types';

const generateAccessToken = (user: { id: string; email: string; roles: string[] }): string => {
  return jwt.sign(
    { userId: user.id, email: user.email, roles: user.roles },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as any,
  );
};

const generateRefreshToken = (user: { id: string; email: string; roles: string[] }): string => {
  return jwt.sign(
    { userId: user.id, email: user.email, roles: user.roles },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn } as any,
  );
};

const excludePassword = <T extends { password?: string }>(user: T): Omit<T, 'password'> => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const authService = {
  async register(data: { email: string; password: string; firstName: string; lastName: string; phone: string }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictError('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, config.bcryptSaltRounds);

    const studentRole = await prisma.role.findUnique({ where: { name: RoleName.STUDENT } });
    if (!studentRole) {
      throw new BadRequestError('Student role not configured in the system');
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        userRoles: {
          create: { roleId: studentRole.id },
        },
      },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    const verificationToken = jwt.sign(
      { userId: user.id },
      config.jwt.secret,
      { expiresIn: '24h' },
    );

    try {
      await sendVerificationEmail(
        { email: user.email, firstName: user.firstName },
        verificationToken,
      );
    } catch {
      // Email sending failed — registration still succeeds
    }

    return excludePassword(user);
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account has been deactivated');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const roles = user.userRoles.map((ur) => ur.role.name);

    const accessToken = generateAccessToken({ id: user.id, email: user.email, roles });
    const refreshToken = generateRefreshToken({ id: user.id, email: user.email, roles });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return {
      user: excludePassword(user),
      accessToken,
      refreshToken,
    };
  },

  async refreshToken(token: string) {
    let decoded: { userId: string; email: string; roles: string[] };
    try {
      decoded = jwt.verify(token, config.jwt.refreshSecret) as {
        userId: string;
        email: string;
        roles: string[];
      };
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const accessToken = generateAccessToken({ id: user.id, email: user.email, roles });
    const refreshToken = generateRefreshToken({ id: user.id, email: user.email, roles });

    return { accessToken, refreshToken };
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    const resetToken = jwt.sign(
      { userId: user.id },
      config.jwt.secret,
      { expiresIn: '1h' },
    );

    try {
      await sendPasswordResetEmail(
        { email: user.email, firstName: user.firstName },
        resetToken,
      );
    } catch {
      // Email sending failed — password reset still proceeds
    }

    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  },

  async resetPassword(token: string, newPassword: string) {
    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
    } catch {
      throw new BadRequestError('Invalid or expired reset token');
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, config.bcryptSaltRounds);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return { message: 'Password has been reset successfully' };
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestError('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, config.bcryptSaltRounds);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  },

  async verifyEmail(token: string) {
    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
    } catch {
      throw new BadRequestError('Invalid or expired verification token');
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      throw new BadRequestError('Invalid verification token');
    }

    if (user.isVerified) {
      return { message: 'Email is already verified' };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    return { message: 'Email verified successfully' };
  },

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return excludePassword(user);
  },

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.phone !== undefined && { phone: data.phone }),
      },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    return excludePassword(updatedUser);
  },
};
