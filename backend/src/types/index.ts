import { Request } from 'express';

export interface IUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  profileImage: string | null;
  isActive: boolean;
  isVerified: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
  roles: IRole[];
  student: IStudent | null;
  lecturer: ILecturer | null;
}

export interface IRole {
  id: string;
  name: string;
  permissions: string[];
  users: IUser[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserWithRoles extends IUser {
  roles: IRole[];
}

export interface IStudent {
  id: string;
  userId: string;
  user?: IUser;
  studentNumber: string;
  dateOfBirth: Date | null;
  gender: string | null;
  address: string | null;
  nationality: string | null;
  phoneNumber: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  highSchool: string | null;
  highSchoolYear: number | null;
  departmentId: string | null;
  department?: IDepartment | null;
  programId: string | null;
  program?: IProgram | null;
  intakeYear: number;
  status: StudentStatus;
  enrollments: IEnrollment[];
  payments: IPayment[];
  grades: IGrade[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ILecturer {
  id: string;
  userId: string;
  user?: IUser;
  employeeId: string;
  departmentId: string;
  department?: IDepartment;
  specialization: string | null;
  qualifications: string[];
  courses: ICourse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IDepartment {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  programs: IProgram[];
  students: IStudent[];
  lecturers: ILecturer[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IProgram {
  id: string;
  code: string;
  name: string;
  description: string | null;
  duration: number;
  degreeLevel: DegreeLevel;
  departmentId: string;
  department?: IDepartment;
  courses: ICourse[];
  students: IStudent[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICourse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  credits: number;
  hours: number;
  departmentId: string;
  department?: IDepartment;
  programId: string;
  program?: IProgram;
  lecturerId: string | null;
  lecturer?: ILecturer | null;
  semesterId: string;
  semester?: ISemester;
  schedules: ISchedule[];
  enrollments: IEnrollment[];
  grades: IGrade[];
  prerequisites: ICoursePrerequisite[];
  prerequisitesFor: ICoursePrerequisite[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICoursePrerequisite {
  id: string;
  courseId: string;
  course?: ICourse;
  prerequisiteId: string;
  prerequisite?: ICourse;
}

export interface ISemester {
  id: string;
  code: string;
  name: string;
  academicYear: string;
  startDate: Date;
  endDate: Date;
  enrollmentStart: Date;
  enrollmentEnd: Date;
  isActive: boolean;
  courses: ICourse[];
  schedules: ISchedule[];
  enrollments: IEnrollment[];
  grades: IGrade[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ISchedule {
  id: string;
  courseId: string;
  course?: ICourse;
  semesterId: string;
  semester?: ISemester;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room: string;
  building: string | null;
  type: ScheduleType;
  lecturerId: string | null;
  lecturer?: ILecturer | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEnrollment {
  id: string;
  enrollmentNumber: string;
  studentId: string;
  student?: IStudent;
  semesterId: string;
  semester?: ISemester;
  courses: ICourse[];
  status: EnrollmentStatus;
  enrolledAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayment {
  id: string;
  invoiceNumber: string;
  studentId: string;
  student?: IStudent;
  enrollmentId: string | null;
  enrollment?: IEnrollment | null;
  amount: number;
  paidAmount: number;
  dueDate: Date;
  paidAt: Date | null;
  method: PaymentMethod | null;
  status: PaymentStatus;
  reference: string | null;
  notes: string | null;
  receiptUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGrade {
  id: string;
  studentId: string;
  student?: IStudent;
  courseId: string;
  course?: ICourse;
  semesterId: string;
  semester?: ISemester;
  midterm: number | null;
  final: number | null;
  assignment: number | null;
  attendance: number | null;
  total: number | null;
  grade: string | null;
  gradePoints: number | null;
  isPassed: boolean | null;
  remarks: string | null;
  gradedBy: string | null;
  gradedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAnnouncement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  targetRole: string | null;
  authorId: string;
  author?: IUser;
  isPublished: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuditLog {
  id: string;
  userId: string;
  user?: IUser;
  action: string;
  entity: string;
  entityId: string;
  oldValue: any;
  newValue: any;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: IPagination;
  error?: any;
}

export interface IJwtPayload {
  userId: string;
  email: string;
  roles: string[];
}

export interface IRequestWithUser extends Request {
  user?: IJwtPayload;
}

export enum StudentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  GRADUATED = 'GRADUATED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum DegreeLevel {
  ASSOCIATE = 'ASSOCIATE',
  BACHELOR = 'BACHELOR',
  MASTER = 'MASTER',
  DOCTORATE = 'DOCTORATE',
  DIPLOMA = 'DIPLOMA',
  CERTIFICATE = 'CERTIFICATE',
}

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export enum ScheduleType {
  LECTURE = 'LECTURE',
  LAB = 'LAB',
  TUTORIAL = 'TUTORIAL',
  SEMINAR = 'SEMINAR',
  PRACTICAL = 'PRACTICAL',
}

export enum EnrollmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  WING = 'WING',
  ABA = 'ABA',
  ACLEDA = 'ACLEDA',
  OTHER = 'OTHER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum AnnouncementType {
  GENERAL = 'GENERAL',
  ACADEMIC = 'ACADEMIC',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  EVENT = 'EVENT',
  EMERGENCY = 'EMERGENCY',
}

export enum RoleName {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  ACCOUNTANT = 'ACCOUNTANT',
  REGISTRAR = 'REGISTRAR',
  LECTURER = 'LECTURER',
  STUDENT = 'STUDENT',
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  profileImage?: string;
}

export interface CreateStudentDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  nationality?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  highSchool?: string;
  highSchoolYear?: number;
  departmentId?: string;
  programId?: string;
  intakeYear?: number;
}

export interface UpdateStudentDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  nationality?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  highSchool?: string;
  highSchoolYear?: number;
  departmentId?: string;
  programId?: string;
  status?: StudentStatus;
}

export interface CreateDepartmentDto {
  code: string;
  name: string;
  description?: string;
}

export interface UpdateDepartmentDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateProgramDto {
  code: string;
  name: string;
  description?: string;
  duration: number;
  degreeLevel: DegreeLevel;
  departmentId: string;
}

export interface UpdateProgramDto {
  name?: string;
  description?: string;
  duration?: number;
  degreeLevel?: DegreeLevel;
  departmentId?: string;
  isActive?: boolean;
}

export interface CreateCourseDto {
  code: string;
  name: string;
  description?: string;
  credits: number;
  hours: number;
  departmentId: string;
  programId: string;
  semesterId: string;
  lecturerId?: string;
  prerequisites?: string[];
}

export interface UpdateCourseDto {
  name?: string;
  description?: string;
  credits?: number;
  hours?: number;
  departmentId?: string;
  programId?: string;
  semesterId?: string;
  lecturerId?: string;
  prerequisites?: string[];
  isActive?: boolean;
}

export interface CreateSemesterDto {
  code: string;
  name: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  enrollmentStart: string;
  enrollmentEnd: string;
}

export interface UpdateSemesterDto {
  code?: string;
  name?: string;
  academicYear?: string;
  startDate?: string;
  endDate?: string;
  enrollmentStart?: string;
  enrollmentEnd?: string;
  isActive?: boolean;
}

export interface CreateScheduleDto {
  courseId: string;
  semesterId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room: string;
  building?: string;
  type: ScheduleType;
  lecturerId?: string;
}

export interface UpdateScheduleDto {
  dayOfWeek?: DayOfWeek;
  startTime?: string;
  endTime?: string;
  room?: string;
  building?: string;
  type?: ScheduleType;
  lecturerId?: string;
}

export interface CreateEnrollmentDto {
  studentId: string;
  semesterId: string;
  courseIds: string[];
}

export interface CreatePaymentDto {
  studentId: string;
  enrollmentId?: string;
  amount: number;
  dueDate: string;
  method?: PaymentMethod;
  notes?: string;
}

export interface CreateGradeDto {
  studentId: string;
  courseId: string;
  semesterId: string;
  midterm?: number;
  final?: number;
  assignment?: number;
  attendance?: number;
  remarks?: string;
}

export interface UpdateGradeDto {
  midterm?: number;
  final?: number;
  assignment?: number;
  attendance?: number;
  remarks?: string;
}

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  type: AnnouncementType;
  targetRole?: string;
  isPublished?: boolean;
}

export interface UpdateAnnouncementDto {
  title?: string;
  content?: string;
  type?: AnnouncementType;
  targetRole?: string;
  isPublished?: boolean;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: IUserWithRoles;
  accessToken: string;
  refreshToken: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface StudentFilterQuery extends PaginationQuery {
  departmentId?: string;
  programId?: string;
  status?: StudentStatus;
  intakeYear?: number;
}

export interface CourseFilterQuery extends PaginationQuery {
  departmentId?: string;
  programId?: string;
  semesterId?: string;
  lecturerId?: string;
}

export interface EnrollmentFilterQuery extends PaginationQuery {
  studentId?: string;
  semesterId?: string;
  status?: EnrollmentStatus;
}

export interface PaymentFilterQuery extends PaginationQuery {
  studentId?: string;
  status?: PaymentStatus;
  method?: PaymentMethod;
  fromDate?: string;
  toDate?: string;
}

export interface GradeFilterQuery extends PaginationQuery {
  studentId?: string;
  courseId?: string;
  semesterId?: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalLecturers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  pendingPayments: number;
  activeSemester: ISemester | null;
  recentEnrollments: IEnrollment[];
  studentStatusDistribution: { status: string; count: number }[];
  enrollmentTrend: { month: string; count: number }[];
}
