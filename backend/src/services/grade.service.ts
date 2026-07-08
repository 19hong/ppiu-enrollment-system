import prisma from '../config/database';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { calculateGradeTotal, getGradeLetter, getGradePoints, paginate } from '../utils/helpers';

export const gradeService = {
  async getAll(filters: {
    studentId?: string;
    courseId?: string;
    semesterId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const { skip, take } = paginate(page, limit);

    const where: any = {};

    if (filters.studentId) {
      where.studentId = filters.studentId;
    }
    if (filters.courseId) {
      where.courseId = filters.courseId;
    }
    if (filters.semesterId) {
      where.semesterId = filters.semesterId;
    }

    const [grades, total] = await Promise.all([
      prisma.grade.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          course: {
            select: {
              id: true,
              code: true,
              name: true,
              credits: true,
            },
          },
          semester: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      }),
      prisma.grade.count({ where }),
    ]);

    return {
      data: grades,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getById(id: string) {
    const grade = await prisma.grade.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true,
          },
        },
        semester: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        grader: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!grade) {
      throw new NotFoundError('Grade not found');
    }

    return grade;
  },

  async enterGrade(data: {
    enrollmentCourseId: string;
    studentId: string;
    courseId: string;
    semesterId: string;
    midterm?: number;
    final?: number;
    assignment?: number;
    attendance?: number;
    remarks?: string;
    gradedBy: string;
  }) {
    const enrollmentCourse = await prisma.enrollmentCourse.findUnique({
      where: { id: data.enrollmentCourseId },
    });

    if (!enrollmentCourse) {
      throw new NotFoundError('Enrollment course not found');
    }

    if (enrollmentCourse.grade !== null && enrollmentCourse.grade !== undefined) {
      throw new BadRequestError('Grade already exists for this enrollment course');
    }

    const midterm = data.midterm ?? 0;
    const final = data.final ?? 0;
    const assignment = data.assignment ?? 0;
    const attendance = data.attendance ?? 0;

    const total = calculateGradeTotal(midterm, final, assignment, attendance);
    const gradeLetter = getGradeLetter(total);
    const gpa = getGradePoints(gradeLetter);

    const grade = await prisma.$transaction(async (tx: any) => {
      const created = await tx.grade.create({
        data: {
          enrollmentCourseId: data.enrollmentCourseId,
          studentId: data.studentId,
          courseId: data.courseId,
          semesterId: data.semesterId,
          midterm,
          final,
          assignment,
          attendance,
          total,
          grade: gradeLetter,
          gpa,
          remarks: data.remarks ?? null,
          gradedBy: data.gradedBy,
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          course: {
            select: {
              id: true,
              code: true,
              name: true,
              credits: true,
            },
          },
          semester: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          grader: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      await tx.enrollmentCourse.update({
        where: { id: data.enrollmentCourseId },
        data: { grade: total },
      });

      return created;
    });

    return grade;
  },

  async updateGrade(
    id: string,
    data: {
      midterm?: number;
      final?: number;
      assignment?: number;
      attendance?: number;
      remarks?: string;
      gradedBy?: string;
    },
  ) {
    const existing = await prisma.grade.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Grade not found');
    }

    const midterm = data.midterm ?? existing.midterm ?? 0;
    const final = data.final ?? existing.final ?? 0;
    const assignment = data.assignment ?? existing.assignment ?? 0;
    const attendance = data.attendance ?? existing.attendance ?? 0;

    const total = calculateGradeTotal(midterm, final, assignment, attendance);
    const gradeLetter = getGradeLetter(total);
    const gpa = getGradePoints(gradeLetter);

    const updated = await prisma.$transaction(async (tx: any) => {
      const grade = await tx.grade.update({
        where: { id },
        data: {
          ...(data.midterm !== undefined && { midterm: data.midterm }),
          ...(data.final !== undefined && { final: data.final }),
          ...(data.assignment !== undefined && { assignment: data.assignment }),
          ...(data.attendance !== undefined && { attendance: data.attendance }),
          ...(data.remarks !== undefined && { remarks: data.remarks }),
          ...(data.gradedBy !== undefined && { gradedBy: data.gradedBy }),
          total,
          grade: gradeLetter,
          gpa,
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          course: {
            select: {
              id: true,
              code: true,
              name: true,
              credits: true,
            },
          },
          semester: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          grader: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      await tx.enrollmentCourse.update({
        where: { id: existing.enrollmentCourseId },
        data: { grade: total },
      });

      return grade;
    });

    return updated;
  },

  async getMyGrades(userId: string) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) {
      throw new NotFoundError('Student profile not found');
    }

    const grades = await prisma.grade.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true,
          },
        },
        semester: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return grades;
  },

  async getStudentGrades(studentId: string, userId: string) {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    const requestingStudent = await prisma.student.findUnique({ where: { userId } });
    if (requestingStudent && requestingStudent.id !== studentId) {
      throw new ForbiddenError('You do not have access to these grades');
    }

    const grades = await prisma.grade.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true,
          },
        },
        semester: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return grades;
  },

  async generateTranscript(studentId: string, userId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundError('Student not found');
    }

    const requestingStudent = await prisma.student.findUnique({ where: { userId } });
    if (requestingStudent && requestingStudent.id !== studentId) {
      throw new ForbiddenError('You do not have access to this transcript');
    }

    const grades = await prisma.grade.findMany({
      where: { studentId },
      orderBy: { createdAt: 'asc' },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true,
          },
        },
        semester: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    const groupedBySemester: Record<string, any> = {};
    for (const grade of grades) {
      const semesterKey = grade.semester.id;
      if (!groupedBySemester[semesterKey]) {
        groupedBySemester[semesterKey] = {
          semester: grade.semester,
          courses: [],
          totalCredits: 0,
          semesterGpa: 0,
        };
      }
      groupedBySemester[semesterKey].courses.push({
        code: grade.course.code,
        name: grade.course.name,
        credits: grade.course.credits,
        grade: grade.grade,
        gpa: grade.gpa,
        total: grade.total,
      });
      if (grade.course.credits) {
        groupedBySemester[semesterKey].totalCredits += grade.course.credits;
      }
    }

    let cumulativeCredits = 0;
    let cumulativeGradePoints = 0;
    const semesterData = Object.values(groupedBySemester).map((sem: any) => {
      let totalPoints = 0;
      let totalCredits = 0;
      for (const course of sem.courses) {
        if (course.credits && course.gpa !== null) {
          totalPoints += course.credits * course.gpa;
          totalCredits += course.credits;
        }
      }
      const semesterGpa = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;
      cumulativeCredits += totalCredits;
      cumulativeGradePoints += totalPoints;
      return { ...sem, semesterGpa };
    });

    const cumulativeGpa = cumulativeCredits > 0 ? parseFloat((cumulativeGradePoints / cumulativeCredits).toFixed(2)) : 0;

    return {
      student: {
        id: student.id,
        studentNumber: student.studentNumber,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        email: student.user.email,
      },
      semesters: semesterData,
      cumulativeCredits,
      cumulativeGpa,
      totalCourses: grades.length,
    };
  },

  async getCourseGrades(courseId: string, userId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userRoles: { select: { role: { select: { name: true } } } } },
    });
    const roles = user?.userRoles.map(ur => ur.role.name) || [];
    const hasElevatedAccess = roles.some(r => ['SUPER_ADMIN', 'REGISTRAR'].includes(r));
    if (!hasElevatedAccess) {
      const teachesCourse = await prisma.course.findFirst({
        where: {
          id: courseId,
          OR: [
            { lecturerId: userId },
            { schedules: { some: { lecturerId: userId } } },
          ],
        },
      });
      if (!teachesCourse) {
        throw new ForbiddenError('You do not have access to grades for this course');
      }
    }

    const grades = await prisma.grade.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        semester: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return grades;
  },
};
