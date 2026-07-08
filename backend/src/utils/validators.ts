import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password is too long'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password is too long'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(100, 'New password is too long'),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().optional(),
});

export const createStudentSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  address: z.string().optional(),
  nationality: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
});

export const updateStudentSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  address: z.string().optional(),
  nationality: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'GRADUATED']).optional(),
});

export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().min(1, 'Code is required').max(20),
  description: z.string().optional(),
  headId: z.string().optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().min(1).max(20).optional(),
  description: z.string().optional(),
  headId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const createProgramSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().min(1, 'Code is required').max(20),
  description: z.string().optional(),
  level: z.enum(['BACHELOR', 'MASTER', 'ASSOCIATE', 'DOCTORATE']),
  duration: z.number().int().min(1),
  creditsTotal: z.number().int().min(1),
  departmentId: z.string().min(1),
});

export const updateProgramSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().min(1).max(20).optional(),
  description: z.string().optional(),
  level: z.enum(['BACHELOR', 'MASTER', 'ASSOCIATE', 'DOCTORATE']).optional(),
  duration: z.number().int().min(1).optional(),
  creditsTotal: z.number().int().min(1).optional(),
  departmentId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const createCourseSchema = z.object({
  code: z.string().min(1, 'Code is required').max(20),
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  credits: z.number().int().min(1).max(20),
  semester: z.string().optional(),
  departmentId: z.string().min(1),
  programId: z.string().optional(),
  lecturerId: z.string().optional(),
  maxStudents: z.number().int().min(1).optional(),
});

export const updateCourseSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().min(1).max(20).optional(),
  description: z.string().optional(),
  credits: z.number().int().min(1).max(20).optional(),
  semester: z.string().optional(),
  departmentId: z.string().optional(),
  programId: z.string().optional(),
  lecturerId: z.string().optional(),
  maxStudents: z.number().int().min(1).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const createScheduleSchema = z.object({
  courseId: z.string().min(1),
  classroomId: z.string().min(1),
  lecturerId: z.string().optional(),
  semesterId: z.string().min(1),
  weekday: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']),
  startTime: z.string(),
  endTime: z.string(),
  capacity: z.number().int().min(1).optional(),
});

export const updateScheduleSchema = z.object({
  courseId: z.string().optional(),
  classroomId: z.string().optional(),
  lecturerId: z.string().optional(),
  semesterId: z.string().optional(),
  weekday: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  capacity: z.number().int().min(1).optional(),
  status: z.enum(['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED']).optional(),
});

export const createEnrollmentSchema = z.object({
  studentId: z.string().min(1),
  semesterId: z.string().min(1),
  courseIds: z.array(z.string()).min(1, 'At least one course is required'),
});

export const createPaymentSchema = z.object({
  studentId: z.string().min(1),
  enrollmentId: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  paymentType: z.enum(['TUITION', 'REGISTRATION', 'OTHER']).optional(),
  dueDate: z.string().optional(),
  description: z.string().optional(),
});

export const recordPaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'CHEQUE', 'ONLINE']),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

export const createGradeSchema = z.object({
  enrollmentCourseId: z.string().min(1),
  studentId: z.string().min(1),
  courseId: z.string().min(1),
  semesterId: z.string().min(1),
  midterm: z.number().min(0).max(100).optional(),
  final: z.number().min(0).max(100).optional(),
  assignment: z.number().min(0).max(100).optional(),
  attendance: z.number().min(0).max(100).optional(),
  remarks: z.string().optional(),
});

export const updateGradeSchema = z.object({
  midterm: z.number().min(0).max(100).optional(),
  final: z.number().min(0).max(100).optional(),
  assignment: z.number().min(0).max(100).optional(),
  attendance: z.number().min(0).max(100).optional(),
  remarks: z.string().optional(),
});

export const markAttendanceSchema = z.object({
  studentId: z.string().min(1),
  scheduleId: z.string().min(1),
  courseId: z.string().min(1),
  date: z.string().min(1),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
  remarks: z.string().optional(),
});

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required'),
  type: z.enum(['GENERAL', 'ACADEMIC', 'ADMIN', 'FINANCE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  targetRoles: z.array(z.string()).optional(),
  publishedAt: z.string().optional(),
  expiresAt: z.string().optional(),
});

export const paginationSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});
