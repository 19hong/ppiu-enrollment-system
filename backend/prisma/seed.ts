import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function clearDatabase() {
  const tablenames = [
    'student_scholarships',
    'scholarships',
    'audit_logs',
    'documents',
    'notifications',
    'announcements',
    'attendances',
    'grades',
    'payment_histories',
    'payments',
    'enrollment_courses',
    'enrollments',
    'schedules',
    'applications',
    'course_prerequisites',
    'courses',
    'semesters',
    'academic_years',
    'classrooms',
    'programs',
    'departments',
    'parents',
    'students',
    'user_roles',
    'role_permissions',
    'permissions',
    'roles',
    'users',
    'settings',
  ];

  for (const name of tablenames) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${name}" CASCADE;`);
  }
}

async function main() {
  console.log('🌱 Seeding database...\n');
  await clearDatabase();
  console.log('✅ Cleared existing data\n');

  // ── Roles ────────────────────────────────────────
  const rolesData = [
    { name: 'SUPER_ADMIN', description: 'Full system access' },
    { name: 'REGISTRAR', description: 'Manages student records and enrollments' },
    { name: 'FINANCE_OFFICER', description: 'Manages payments and financial records' },
    { name: 'DEPARTMENT_HEAD', description: 'Manages department courses and faculty' },
    { name: 'LECTURER', description: 'Teaches courses and manages grades' },
    { name: 'STUDENT', description: 'Student account' },
    { name: 'PARENT', description: 'Parent/guardian account' },
  ];

  const roles: Record<string, any> = {};
  for (const r of rolesData) {
    roles[r.name] = await prisma.role.create({ data: r });
  }
  console.log(`✅ Created ${rolesData.length} roles`);

  // ── Permissions ──────────────────────────────────
  const resources = [
    'user', 'student', 'course', 'enrollment', 'payment', 'grade',
    'attendance', 'schedule', 'department', 'program', 'classroom',
    'application', 'announcement', 'notification', 'report', 'setting',
    'role', 'permission', 'audit_log', 'document', 'scholarship',
  ];
  const actions = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'MANAGE'];

  const permissions: Record<string, any> = {};
  for (const resource of resources) {
    for (const action of actions) {
      const name = `${resource}:${action}`;
      permissions[name] = await prisma.permission.create({
        data: { name, resource, action, description: `Can ${action} ${resource}` },
      });
    }
  }
  console.log(`✅ Created ${Object.keys(permissions).length} permissions`);

  // ── Assign permissions to roles ──────────────────
  function getPerms(resource: string, ...acts: string[]): string[] {
    return acts.map((a) => `${resource}:${a}`);
  }

  const rolePerms: Record<string, string[]> = {
    SUPER_ADMIN: resources.flatMap((r) => getPerms(r, ...actions)),
    REGISTRAR: [
      ...getPerms('user', 'CREATE', 'READ', 'UPDATE'),
      ...getPerms('student', 'CREATE', 'READ', 'UPDATE'),
      ...getPerms('course', 'READ', 'UPDATE'),
      ...getPerms('enrollment', 'CREATE', 'READ', 'UPDATE', 'DELETE'),
      ...getPerms('application', 'READ', 'UPDATE'),
      ...getPerms('schedule', 'READ'),
      ...getPerms('grade', 'READ'),
      ...getPerms('attendance', 'READ'),
      ...getPerms('department', 'READ'),
      ...getPerms('program', 'READ'),
      ...getPerms('report', 'READ'),
      ...getPerms('announcement', 'CREATE', 'READ', 'UPDATE'),
    ],
    FINANCE_OFFICER: [
      ...getPerms('payment', 'CREATE', 'READ', 'UPDATE'),
      ...getPerms('student', 'READ'),
      ...getPerms('enrollment', 'READ'),
      ...getPerms('report', 'READ'),
    ],
    DEPARTMENT_HEAD: [
      ...getPerms('course', 'CREATE', 'READ', 'UPDATE', 'DELETE'),
      ...getPerms('schedule', 'CREATE', 'READ', 'UPDATE', 'DELETE'),
      ...getPerms('program', 'READ', 'UPDATE'),
      ...getPerms('department', 'READ', 'UPDATE'),
      ...getPerms('lecturer', 'READ'),
      ...getPerms('grade', 'READ'),
      ...getPerms('report', 'READ'),
      ...getPerms('announcement', 'CREATE', 'READ', 'UPDATE'),
    ],
    LECTURER: [
      ...getPerms('course', 'READ'),
      ...getPerms('schedule', 'READ'),
      ...getPerms('grade', 'CREATE', 'READ', 'UPDATE'),
      ...getPerms('attendance', 'CREATE', 'READ', 'UPDATE'),
      ...getPerms('student', 'READ'),
    ],
    STUDENT: [
      ...getPerms('user', 'READ', 'UPDATE'),
      ...getPerms('course', 'READ'),
      ...getPerms('enrollment', 'READ'),
      ...getPerms('grade', 'READ'),
      ...getPerms('attendance', 'READ'),
      ...getPerms('schedule', 'READ'),
      ...getPerms('payment', 'READ'),
      ...getPerms('application', 'CREATE', 'READ'),
    ],
    PARENT: [
      ...getPerms('user', 'READ', 'UPDATE'),
      ...getPerms('student', 'READ'),
      ...getPerms('grade', 'READ'),
      ...getPerms('attendance', 'READ'),
      ...getPerms('payment', 'READ'),
    ],
  };

  for (const [roleName, permNames] of Object.entries(rolePerms)) {
    const role = roles[roleName];
    for (const permName of permNames) {
      const perm = permissions[permName];
      if (perm) {
        await prisma.rolePermission.create({
          data: { roleId: role.id, permissionId: perm.id },
        });
      }
    }
  }
  console.log('✅ Assigned permissions to roles');

  // ── Users ────────────────────────────────────────
  const usersData = [
    { email: 'admin@ppiu.edu.kh', password: 'Admin@123', firstName: 'Super', lastName: 'Admin', phone: '012345678', isVerified: true },
    { email: 'registrar@ppiu.edu.kh', password: 'Test@123', firstName: 'Registrar', lastName: 'Chea', phone: '012345679', isVerified: true },
    { email: 'finance@ppiu.edu.kh', password: 'Test@123', firstName: 'Finance', lastName: 'Sok', phone: '012345680', isVerified: true },
    { email: 'cs.head@ppiu.edu.kh', password: 'Test@123', firstName: 'Chandara', lastName: 'Kim', phone: '012345681', isVerified: true },
    { email: 'ba.head@ppiu.edu.kh', password: 'Test@123', firstName: 'Serey', lastName: 'Vath', phone: '012345682', isVerified: true },
    { email: 'lecturer1@ppiu.edu.kh', password: 'Test@123', firstName: 'Mony', lastName: 'Sok', phone: '012345683', isVerified: true },
    { email: 'lecturer2@ppiu.edu.kh', password: 'Test@123', firstName: 'Rithy', lastName: 'Meas', phone: '012345684', isVerified: true },
    { email: 'student1@ppiu.edu.kh', password: 'Test@123', firstName: 'Sophea', lastName: 'Chea', phone: '012345685', isVerified: true },
    { email: 'student2@ppiu.edu.kh', password: 'Test@123', firstName: 'Veasna', lastName: 'Sok', phone: '012345686', isVerified: true },
    { email: 'student3@ppiu.edu.kh', password: 'Test@123', firstName: 'Dara', lastName: 'Meas', phone: '012345687', isVerified: true },
    { email: 'parent1@ppiu.edu.kh', password: 'Test@123', firstName: 'Sokunthea', lastName: 'Chea', phone: '012345688', isVerified: true },
  ];

  const users: Record<string, any> = {};
  for (const u of usersData) {
    const hashedPassword = await hashPassword(u.password);
    users[u.email] = await prisma.user.create({
      data: { ...u, password: hashedPassword },
    });
  }
  console.log(`✅ Created ${usersData.length} users`);

  // ── User Roles ───────────────────────────────────
  const userRoleAssignments: [string, string][] = [
    ['admin@ppiu.edu.kh', 'SUPER_ADMIN'],
    ['registrar@ppiu.edu.kh', 'REGISTRAR'],
    ['finance@ppiu.edu.kh', 'FINANCE_OFFICER'],
    ['cs.head@ppiu.edu.kh', 'DEPARTMENT_HEAD'],
    ['ba.head@ppiu.edu.kh', 'DEPARTMENT_HEAD'],
    ['lecturer1@ppiu.edu.kh', 'LECTURER'],
    ['lecturer2@ppiu.edu.kh', 'LECTURER'],
    ['student1@ppiu.edu.kh', 'STUDENT'],
    ['student2@ppiu.edu.kh', 'STUDENT'],
    ['student3@ppiu.edu.kh', 'STUDENT'],
    ['parent1@ppiu.edu.kh', 'PARENT'],
  ];

  for (const [email, roleName] of userRoleAssignments) {
    await prisma.userRole.create({
      data: { userId: users[email].id, roleId: roles[roleName].id },
    });
  }
  console.log('✅ Assigned users to roles');

  // ── Students ─────────────────────────────────────
  const studentsData = [
    {
      email: 'student1@ppiu.edu.kh',
      studentNumber: 'PPIU-2026-0001',
      dateOfBirth: new Date('2003-05-15'),
      gender: 'Female',
      address: '#123, Street 456',
      city: 'Phnom Penh',
      state: 'Phnom Penh',
      zipCode: '12000',
      country: 'Cambodia',
      nationality: 'Cambodian',
      emergencyContactName: 'Sokunthea Chea',
      emergencyContactPhone: '012345688',
      emergencyContactRelation: 'Mother',
      enrollmentDate: new Date('2024-10-01'),
    },
    {
      email: 'student2@ppiu.edu.kh',
      studentNumber: 'PPIU-2026-0002',
      dateOfBirth: new Date('2004-02-20'),
      gender: 'Male',
      address: '#789, Street 101',
      city: 'Siem Reap',
      state: 'Siem Reap',
      zipCode: '17000',
      country: 'Cambodia',
      nationality: 'Cambodian',
      emergencyContactName: 'Sok Veasna',
      emergencyContactPhone: '012345689',
      emergencyContactRelation: 'Father',
      enrollmentDate: new Date('2024-10-01'),
    },
    {
      email: 'student3@ppiu.edu.kh',
      studentNumber: 'PPIU-2026-0003',
      dateOfBirth: new Date('2003-11-08'),
      gender: 'Male',
      address: '#55, Street 789',
      city: 'Battambang',
      state: 'Battambang',
      zipCode: '02000',
      country: 'Cambodia',
      nationality: 'Cambodian',
      emergencyContactName: 'Mony Meas',
      emergencyContactPhone: '012345690',
      emergencyContactRelation: 'Mother',
      enrollmentDate: new Date('2024-10-01'),
    },
  ];

  const studentRecords: any[] = [];
  for (const s of studentsData) {
    const student = await prisma.student.create({
      data: { userId: users[s.email].id, ...s, email: undefined },
    });
    studentRecords.push(student);
  }
  console.log(`✅ Created ${studentsData.length} students`);

  // ── Parent ───────────────────────────────────────
  await prisma.parent.create({
    data: {
      userId: users['parent1@ppiu.edu.kh'].id,
      studentId: studentRecords[0].id,
      relation: 'Mother',
      occupation: 'Teacher',
      phone: '012345688',
    },
  });
  console.log('✅ Created parent record');

  // ── Departments ──────────────────────────────────
  const departmentsData = [
    { name: 'Computer Science', code: 'CS', description: 'Department of Computer Science and Information Technology', headId: users['cs.head@ppiu.edu.kh'].id },
    { name: 'Business Administration', code: 'BA', description: 'Department of Business Administration and Management', headId: users['ba.head@ppiu.edu.kh'].id },
  ];

  const departments: Record<string, any> = {};
  for (const d of departmentsData) {
    departments[d.code] = await prisma.department.create({ data: d });
  }
  console.log(`✅ Created ${departmentsData.length} departments`);

  // ── Programs ─────────────────────────────────────
  const programsData = [
    { name: 'Bachelor of Science in Computer Science', code: 'BSCS', level: 'BACHELOR' as const, duration: 4, creditsTotal: 120, departmentId: departments['CS'].id },
    { name: 'Bachelor of Business Administration', code: 'BBA', level: 'BACHELOR' as const, duration: 4, creditsTotal: 120, departmentId: departments['BA'].id },
    { name: 'Master of Science in Computer Science', code: 'MSCS', level: 'MASTER' as const, duration: 2, creditsTotal: 36, departmentId: departments['CS'].id },
    { name: 'Master of Business Administration', code: 'MBA', level: 'MASTER' as const, duration: 2, creditsTotal: 36, departmentId: departments['BA'].id },
  ];

  const programs: Record<string, any> = {};
  for (const p of programsData) {
    programs[p.code] = await prisma.program.create({
      data: {
        name: p.name,
        code: p.code,
        description: `${p.name} program`,
        level: p.level,
        duration: p.duration,
        creditsTotal: p.creditsTotal,
        departmentId: p.departmentId,
      },
    });
  }
  console.log(`✅ Created ${programsData.length} programs`);

  // ── Academic Years ───────────────────────────────
  const academicYearsData = [
    {
      year: 2025,
      name: '2025-2026',
      startDate: new Date('2025-10-01'),
      endDate: new Date('2026-09-30'),
      status: 'COMPLETED' as const,
      isCurrent: false,
    },
    {
      year: 2026,
      name: '2026-2027',
      startDate: new Date('2026-10-01'),
      endDate: new Date('2027-09-30'),
      status: 'ACTIVE' as const,
      isCurrent: true,
    },
  ];

  const academicYears: any[] = [];
  for (const ay of academicYearsData) {
    const record = await prisma.academicYear.create({ data: ay });
    academicYears.push(record);
  }
  console.log(`✅ Created ${academicYearsData.length} academic years`);

  // ── Semesters ────────────────────────────────────
  const semestersData = [
    { name: 'Semester 1', code: '2025-S1', startDate: new Date('2025-10-01'), endDate: new Date('2026-02-15'), registrationStartDate: new Date('2025-08-15'), registrationEndDate: new Date('2025-09-30'), status: 'COMPLETED' as const, academicYearId: academicYears[0].id, isCurrent: false },
    { name: 'Semester 2', code: '2025-S2', startDate: new Date('2026-03-01'), endDate: new Date('2026-07-15'), registrationStartDate: new Date('2026-01-15'), registrationEndDate: new Date('2026-02-28'), status: 'COMPLETED' as const, academicYearId: academicYears[0].id, isCurrent: false },
    { name: 'Semester 1', code: '2026-S1', startDate: new Date('2026-10-01'), endDate: new Date('2027-02-15'), registrationStartDate: new Date('2026-08-15'), registrationEndDate: new Date('2026-09-30'), status: 'UPCOMING' as const, academicYearId: academicYears[1].id, isCurrent: true },
    { name: 'Semester 2', code: '2026-S2', startDate: new Date('2027-03-01'), endDate: new Date('2027-07-15'), registrationStartDate: new Date('2027-01-15'), registrationEndDate: new Date('2027-02-28'), status: 'UPCOMING' as const, academicYearId: academicYears[1].id, isCurrent: false },
  ];

  const semesters: any[] = [];
  for (const s of semestersData) {
    const record = await prisma.semester.create({ data: s });
    semesters.push(record);
  }
  console.log(`✅ Created ${semestersData.length} semesters`);

  // ── Courses ──────────────────────────────────────
  const coursesData = [
    { code: 'CS101', name: 'Introduction to Programming', description: 'Fundamentals of programming using Python', credits: 3, semester: 1, departmentId: departments['CS'].id, programId: programs['BSCS'].id, lecturerId: users['lecturer1@ppiu.edu.kh'].id, maxStudents: 40 },
    { code: 'CS102', name: 'Data Structures', description: 'Data structures and algorithms', credits: 3, semester: 2, departmentId: departments['CS'].id, programId: programs['BSCS'].id, lecturerId: users['lecturer1@ppiu.edu.kh'].id, maxStudents: 40 },
    { code: 'CS201', name: 'Database Systems', description: 'Relational databases and SQL', credits: 3, semester: 1, departmentId: departments['CS'].id, programId: programs['BSCS'].id, lecturerId: users['lecturer2@ppiu.edu.kh'].id, maxStudents: 35 },
    { code: 'CS202', name: 'Web Development', description: 'Full-stack web development', credits: 3, semester: 2, departmentId: departments['CS'].id, programId: programs['BSCS'].id, lecturerId: users['lecturer2@ppiu.edu.kh'].id, maxStudents: 35 },
    { code: 'BA101', name: 'Principles of Management', description: 'Introduction to management principles', credits: 3, semester: 1, departmentId: departments['BA'].id, programId: programs['BBA'].id, lecturerId: users['lecturer1@ppiu.edu.kh'].id, maxStudents: 45 },
    { code: 'BA102', name: 'Financial Accounting', description: 'Fundamentals of financial accounting', credits: 3, semester: 1, departmentId: departments['BA'].id, programId: programs['BBA'].id, lecturerId: users['lecturer2@ppiu.edu.kh'].id, maxStudents: 45 },
    { code: 'CS501', name: 'Advanced Machine Learning', description: 'Graduate-level machine learning', credits: 3, semester: 1, departmentId: departments['CS'].id, programId: programs['MSCS'].id, lecturerId: users['lecturer1@ppiu.edu.kh'].id, maxStudents: 20 },
    { code: 'BA501', name: 'Strategic Management', description: 'Graduate-level strategic management', credits: 3, semester: 1, departmentId: departments['BA'].id, programId: programs['MBA'].id, lecturerId: users['lecturer2@ppiu.edu.kh'].id, maxStudents: 25 },
  ];

  const courseRecords: Record<string, any> = {};
  for (const c of coursesData) {
    courseRecords[c.code] = await prisma.course.create({ data: c });
  }
  console.log(`✅ Created ${coursesData.length} courses`);

  // ── Classrooms ───────────────────────────────────
  const classroomsData = [
    { name: 'Computer Lab A', code: 'CLA-101', capacity: 40, building: 'Main Building', floor: 1 },
    { name: 'Lecture Hall B', code: 'LHB-201', capacity: 80, building: 'Main Building', floor: 2 },
  ];

  const classrooms: any[] = [];
  for (const c of classroomsData) {
    const record = await prisma.classroom.create({ data: c });
    classrooms.push(record);
  }
  console.log(`✅ Created ${classroomsData.length} classrooms`);

  // ── Schedules ────────────────────────────────────
  const schedulesData = [
    { courseId: courseRecords['CS101'].id, classroomId: classrooms[0].id, lecturerId: users['lecturer1@ppiu.edu.kh'].id, semesterId: semesters[2].id, weekday: 'MON' as const, startTime: new Date('2026-10-05T08:00:00Z'), endTime: new Date('2026-10-05T10:00:00Z'), capacity: 40 },
    { courseId: courseRecords['CS102'].id, classroomId: classrooms[0].id, lecturerId: users['lecturer1@ppiu.edu.kh'].id, semesterId: semesters[2].id, weekday: 'WED' as const, startTime: new Date('2026-10-07T08:00:00Z'), endTime: new Date('2026-10-07T10:00:00Z'), capacity: 40 },
    { courseId: courseRecords['CS201'].id, classroomId: classrooms[1].id, lecturerId: users['lecturer2@ppiu.edu.kh'].id, semesterId: semesters[2].id, weekday: 'TUE' as const, startTime: new Date('2026-10-06T14:00:00Z'), endTime: new Date('2026-10-06T16:00:00Z'), capacity: 35 },
    { courseId: courseRecords['BA101'].id, classroomId: classrooms[1].id, lecturerId: users['lecturer1@ppiu.edu.kh'].id, semesterId: semesters[2].id, weekday: 'THU' as const, startTime: new Date('2026-10-08T08:00:00Z'), endTime: new Date('2026-10-08T10:00:00Z'), capacity: 45 },
    { courseId: courseRecords['BA102'].id, classroomId: classrooms[1].id, lecturerId: users['lecturer2@ppiu.edu.kh'].id, semesterId: semesters[2].id, weekday: 'FRI' as const, startTime: new Date('2026-10-09T10:00:00Z'), endTime: new Date('2026-10-09T12:00:00Z'), capacity: 45 },
  ];

  for (const s of schedulesData) {
    await prisma.schedule.create({ data: s });
  }
  console.log(`✅ Created ${schedulesData.length} schedules`);

  // ── Application ──────────────────────────────────
  const application = await prisma.application.create({
    data: {
      userId: users['student1@ppiu.edu.kh'].id,
      studentId: studentRecords[0].id,
      programId: programs['BSCS'].id,
      semesterId: semesters[2].id,
      status: 'ACCEPTED',
      applicationDate: new Date('2026-07-15'),
      reviewedBy: users['registrar@ppiu.edu.kh'].id,
      reviewDate: new Date('2026-07-20'),
      reviewNotes: 'Application approved. All documents verified.',
      applicationDocuments: { highSchoolDiploma: true, transcript: true, idCard: true },
    },
  });
  console.log('✅ Created application');

  // ── Enrollment ──────────────────────────────────
  const enrollment = await prisma.enrollment.create({
    data: {
      studentId: studentRecords[0].id,
      semesterId: semesters[2].id,
      enrollmentNumber: 'ENR-2026-0001',
      status: 'APPROVED',
      totalCredits: 12,
      approvedBy: users['registrar@ppiu.edu.kh'].id,
      approvedDate: new Date('2026-08-01'),
      enrolledDate: new Date('2026-08-01'),
    },
  });

  // Enrollment Courses
  const enrollmentCourse = await prisma.enrollmentCourse.create({
    data: {
      enrollmentId: enrollment.id,
      courseId: courseRecords['CS101'].id,
      status: 'ENROLLED',
    },
  });

  await prisma.enrollmentCourse.create({
    data: {
      enrollmentId: enrollment.id,
      courseId: courseRecords['CS102'].id,
      status: 'ENROLLED',
    },
  });
  console.log('✅ Created enrollment with 2 courses');

  // ── Payment ──────────────────────────────────────
  const payment = await prisma.payment.create({
    data: {
      studentId: studentRecords[0].id,
      enrollmentId: enrollment.id,
      amount: 2500,
      paidAmount: 2500,
      balance: 0,
      paymentType: 'TUITION',
      status: 'PAID',
      dueDate: new Date('2026-09-15'),
      paidDate: new Date('2026-08-20'),
      invoiceNumber: 'INV-2026-0001',
      description: 'Semester 1 tuition fee - Bachelor of Science in Computer Science',
    },
  });

  await prisma.paymentHistory.create({
    data: {
      paymentId: payment.id,
      amount: 2500,
      paymentMethod: 'BANK_TRANSFER',
      transactionId: 'TXN-ABC123XYZ',
      receiptNumber: 'RCT-2026-0001',
      notes: 'Full payment via ABA Bank transfer',
      paidBy: users['finance@ppiu.edu.kh'].id,
    },
  });
  console.log('✅ Created payment with history');

  // ── Grade ────────────────────────────────────────
  await prisma.grade.create({
    data: {
      enrollmentCourseId: enrollmentCourse.id,
      studentId: studentRecords[0].id,
      courseId: courseRecords['CS101'].id,
      semesterId: semesters[0].id,
      midterm: 85,
      final: 90,
      assignment: 88,
      attendance: 95,
      total: 89.5,
      grade: 'A',
      gpa: 4.0,
      remarks: 'Excellent performance',
      gradedBy: users['lecturer1@ppiu.edu.kh'].id,
    },
  });
  console.log('✅ Created grade entry');

  // ── Announcements ────────────────────────────────
  const announcementsData = [
    {
      title: 'Welcome to Academic Year 2026-2027',
      content: 'Dear students and faculty, welcome to the new academic year. Please check your schedules and enroll in courses before the deadline.',
      type: 'ACADEMIC' as const,
      priority: 'HIGH' as const,
      authorId: users['admin@ppiu.edu.kh'].id,
      targetRoles: { roles: ['STUDENT', 'LECTURER'] },
      publishedAt: new Date('2026-09-01'),
      status: 'PUBLISHED' as const,
    },
    {
      title: 'Tuition Fee Payment Deadline',
      content: 'All students are reminded to pay tuition fees before September 15th to avoid late penalties.',
      type: 'FINANCE' as const,
      priority: 'URGENT' as const,
      authorId: users['finance@ppiu.edu.kh'].id,
      targetRoles: { roles: ['STUDENT'] },
      publishedAt: new Date('2026-09-01'),
      expiresAt: new Date('2026-09-16'),
      status: 'PUBLISHED' as const,
    },
  ];

  for (const a of announcementsData) {
    await prisma.announcement.create({ data: a });
  }
  console.log(`✅ Created ${announcementsData.length} announcements`);

  // ── Notifications ────────────────────────────────
  const notificationsData = [
    { userId: users['student1@ppiu.edu.kh'].id, title: 'Enrollment Approved', message: 'Your enrollment for Semester 1, 2026-2027 has been approved.', type: 'SUCCESS' as const, referenceType: 'enrollment', referenceId: enrollment.id },
    { userId: users['student1@ppiu.edu.kh'].id, title: 'Payment Received', message: 'Your payment of $2,500 has been received. Thank you!', type: 'SUCCESS' as const, referenceType: 'payment', referenceId: payment.id },
    { userId: users['lecturer1@ppiu.edu.kh'].id, title: 'New Course Assigned', message: 'You have been assigned to teach CS101 - Introduction to Programming.', type: 'INFO' as const, referenceType: 'course', referenceId: courseRecords['CS101'].id },
  ];

  for (const n of notificationsData) {
    await prisma.notification.create({ data: n });
  }
  console.log(`✅ Created ${notificationsData.length} notifications`);

  // ── System Settings ──────────────────────────────
  const settingsData = [
    { key: 'university_name', value: 'PPIU - Panha Pich Institute of United', group: 'general', type: 'STRING' as const, description: 'University display name' },
    { key: 'university_short_name', value: 'PPIU', group: 'general', type: 'STRING' as const, description: 'University abbreviation' },
    { key: 'academic_year', value: '2026-2027', group: 'academic', type: 'STRING' as const, description: 'Current academic year' },
    { key: 'current_semester', value: 'Semester 1', group: 'academic', type: 'STRING' as const, description: 'Current semester name' },
    { key: 'registration_open', value: 'true', group: 'academic', type: 'BOOLEAN' as const, description: 'Whether student registration is open' },
    { key: 'max_credits_per_semester', value: '18', group: 'academic', type: 'NUMBER' as const, description: 'Maximum credits a student can take per semester' },
    { key: 'grade_publish_enabled', value: 'false', group: 'academic', type: 'BOOLEAN' as const, description: 'Whether grades are published to students' },
    { key: 'tuition_per_credit', value: '250', group: 'finance', type: 'NUMBER' as const, description: 'Tuition fee per credit hour' },
    { key: 'late_registration_fee', value: '50', group: 'finance', type: 'NUMBER' as const, description: 'Late registration penalty fee' },
    { key: 'currency', value: 'USD', group: 'finance', type: 'STRING' as const, description: 'Default currency' },
    { key: 'enable_email_notifications', value: 'true', group: 'notifications', type: 'BOOLEAN' as const, description: 'Whether email notifications are enabled' },
    { key: 'maintenance_mode', value: 'false', group: 'system', type: 'BOOLEAN' as const, description: 'Put system in maintenance mode' },
  ];

  for (const s of settingsData) {
    await prisma.setting.create({ data: s });
  }
  console.log(`✅ Created ${settingsData.length} settings`);

  console.log('\n🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
