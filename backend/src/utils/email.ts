import nodemailer from 'nodemailer';
import { config } from '../config';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
  connectionTimeout: 5000,
});

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
  if (config.nodeEnv === 'development' || !config.smtp.user || !config.smtp.pass) {
    console.log(`[DEV EMAIL] To: ${to}, Subject: ${subject}`);
    return;
  }

  await transporter.sendMail({
    from: `"PPIU Enrollment System" <${config.smtp.from}>`,
    to,
    subject,
    html,
  });
}

export async function sendWelcomeEmail(user: { email: string; firstName: string }): Promise<void> {
  await sendEmail({
    to: user.email,
    subject: 'Welcome to PPIU Enrollment System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to PPIU!</h2>
        <p>Dear ${user.firstName},</p>
        <p>Your account has been created successfully. You can now log in to the PPIU Enrollment System.</p>
        <p>Please verify your email address to activate your account.</p>
        <p>Best regards,<br>PPIU Administration</p>
      </div>
    `,
  });
}

export async function sendVerificationEmail(user: { email: string; firstName: string }, token: string): Promise<void> {
  const verificationUrl = `${config.frontendUrl}/verify-email?token=${token}`;

  await sendEmail({
    to: user.email,
    subject: 'Verify Your Email - PPIU Enrollment System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Dear ${user.firstName},</p>
        <p>Please click the link below to verify your email address:</p>
        <p><a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
        <p>Or copy and paste this link in your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br>PPIU Administration</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(user: { email: string; firstName: string }, token: string): Promise<void> {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;

  await sendEmail({
    to: user.email,
    subject: 'Reset Your Password - PPIU Enrollment System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset</h2>
        <p>Dear ${user.firstName},</p>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <p><a href="${resetUrl}" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>Or copy and paste this link in your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>PPIU Administration</p>
      </div>
    `,
  });
}

export async function sendEnrollmentConfirmation(
  student: { firstName: string; lastName: string; email: string },
  enrollment: { enrollmentNumber: string },
): Promise<void> {
  await sendEmail({
    to: student.email,
    subject: 'Enrollment Confirmed - PPIU Enrollment System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Enrollment Confirmed</h2>
        <p>Dear ${student.firstName} ${student.lastName},</p>
        <p>Your enrollment has been confirmed. Your enrollment number is <strong>${enrollment.enrollmentNumber}</strong>.</p>
        <p>Please log in to the system to view your enrolled courses and schedule.</p>
        <p>Best regards,<br>PPIU Registrar's Office</p>
      </div>
    `,
  });
}

export async function sendPaymentReceipt(
  student: { firstName: string; lastName: string; email: string },
  payment: { invoiceNumber: string; amount: number; paidAmount: number; status: string },
): Promise<void> {
  await sendEmail({
    to: student.email,
    subject: 'Payment Receipt - PPIU Enrollment System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Payment Receipt</h2>
        <p>Dear ${student.firstName} ${student.lastName},</p>
        <p>We have received your payment. Here are the details:</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Invoice Number:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${payment.invoiceNumber}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Amount Due:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">$${payment.amount.toFixed(2)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Amount Paid:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">$${payment.paidAmount.toFixed(2)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Status:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${payment.status}</td></tr>
        </table>
        <p>Best regards,<br>PPIU Finance Department</p>
      </div>
    `,
  });
}
