import { Prisma, PaymentStatus, PaymentMethod } from '@prisma/client';
import prisma from '../config/database';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { generateInvoiceNumber, paginate } from '../utils/helpers';
import { generateInvoice, generateRegistrationReceipt } from '../utils/pdf';

export const paymentService = {
  async getAll(filters: {
    search?: string;
    status?: PaymentStatus;
    paymentType?: string;
    studentId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;

    const where: Prisma.PaymentWhereInput = {};

    if (filters.search) {
      where.OR = [
        { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
        { student: { user: { firstName: { contains: filters.search, mode: 'insensitive' } } } },
        { student: { user: { lastName: { contains: filters.search, mode: 'insensitive' } } } },
        { student: { studentNumber: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.paymentType) {
      where.paymentType = filters.paymentType as any;
    }

    if (filters.studentId) {
      where.studentId = filters.studentId;
    }

    const { skip, take } = paginate(page, limit);

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
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
          enrollment: {
            select: {
              id: true,
              enrollmentNumber: true,
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      data: payments,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getById(id: string) {
    const payment = await prisma.payment.findUnique({
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
                phone: true,
              },
            },
          },
        },
        enrollment: {
          select: {
            id: true,
            enrollmentNumber: true,
            semester: true,
          },
        },
        history: {
          orderBy: { createdAt: 'desc' },
          include: {
            payer: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    return payment;
  },

  async create(data: {
    studentId: string;
    enrollmentId?: string;
    amount: number;
    paymentType?: string;
    dueDate?: string;
    description?: string;
  }) {
    const student = await prisma.student.findUnique({
      where: { id: data.studentId },
      include: { user: true },
    });

    if (!student) {
      throw new NotFoundError('Student not found');
    }

    if (data.enrollmentId) {
      const enrollment = await prisma.enrollment.findUnique({ where: { id: data.enrollmentId } });
      if (!enrollment) {
        throw new NotFoundError('Enrollment not found');
      }
    }

    const invoiceNumber = generateInvoiceNumber();

    const payment = await prisma.payment.create({
      data: {
        studentId: data.studentId,
        enrollmentId: data.enrollmentId,
        amount: data.amount,
        balance: data.amount,
        paymentType: (data.paymentType as any) || 'TUITION',
        status: PaymentStatus.PENDING,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        invoiceNumber,
        description: data.description,
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
        enrollment: {
          select: {
            id: true,
            enrollmentNumber: true,
          },
        },
      },
    });

    return payment;
  },

  async recordPayment(
    paymentId: string,
    data: {
      amount: number;
      paymentMethod: PaymentMethod;
      transactionId?: string;
      notes?: string;
      paidBy: string;
    },
  ) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.status === PaymentStatus.PAID || payment.status === PaymentStatus.REFUNDED || payment.status === PaymentStatus.CANCELLED) {
      throw new BadRequestError(`Cannot record payment against a ${payment.status.toLowerCase()} invoice`);
    }

    if (data.amount <= 0) {
      throw new BadRequestError('Payment amount must be positive');
    }

    const remainingBalance = payment.amount - payment.paidAmount;

    if (data.amount > remainingBalance) {
      throw new BadRequestError(
        `Payment amount $${data.amount.toFixed(2)} exceeds remaining balance of $${remainingBalance.toFixed(2)}`,
      );
    }

    const newPaidAmount = payment.paidAmount + data.amount;
    const newBalance = payment.amount - newPaidAmount;
    const newStatus = newBalance <= 0 ? PaymentStatus.PAID : PaymentStatus.PARTIALLY;

    const updated = await prisma.$transaction(async (tx) => {
      const receiptNumber = `RCPT-${Date.now()}`;

      await tx.paymentHistory.create({
        data: {
          paymentId,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          transactionId: data.transactionId,
          receiptNumber,
          notes: data.notes,
          paidBy: data.paidBy,
        },
      });

      return tx.payment.update({
        where: { id: paymentId },
        data: {
          paidAmount: newPaidAmount,
          balance: newBalance,
          status: newStatus,
          paidDate: newStatus === PaymentStatus.PAID ? new Date() : undefined,
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
          enrollment: {
            select: {
              id: true,
              enrollmentNumber: true,
            },
          },
          history: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    });

    return updated;
  },

  async getMyPayments(userId: string) {
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      throw new NotFoundError('Student profile not found');
    }

    const payments = await prisma.payment.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' },
      include: {
        enrollment: {
          select: {
            id: true,
            enrollmentNumber: true,
            semester: {
              select: { id: true, name: true, code: true },
            },
          },
        },
        history: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return payments;
  },

  async getInvoice(paymentId: string, userId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        enrollment: true,
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    const student = await prisma.student.findUnique({ where: { userId } });
    if (student && student.id !== payment.studentId) {
      throw new ForbiddenError('You do not have access to this invoice');
    }

    const invoiceData = {
      invoiceNumber: payment.invoiceNumber || '',
      amount: payment.amount,
      paidAmount: payment.paidAmount,
      dueDate: payment.dueDate || new Date(),
      status: payment.status,
      student: {
        firstName: payment.student.user.firstName,
        lastName: payment.student.user.lastName,
        studentNumber: payment.student.studentNumber,
      },
      enrollment: payment.enrollment
        ? { enrollmentNumber: payment.enrollment.enrollmentNumber }
        : undefined,
      notes: payment.description,
    };

    const pdfBuffer = await generateInvoice(invoiceData);
    return pdfBuffer;
  },

  async getReceipt(paymentId: string, userId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        enrollment: {
          include: {
            enrollmentCourses: {
              include: {
                course: {
                  select: {
                    code: true,
                    name: true,
                    credits: true,
                  },
                },
              },
            },
          },
        },
        history: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    const student = await prisma.student.findUnique({ where: { userId } });
    if (student && student.id !== payment.studentId) {
      throw new ForbiddenError('You do not have access to this receipt');
    }

    if (payment.status !== PaymentStatus.PAID && payment.status !== PaymentStatus.PARTIALLY) {
      throw new BadRequestError('Receipt is only available for payments with recorded transactions');
    }

    const studentData = {
      firstName: payment.student.user.firstName,
      lastName: payment.student.user.lastName,
      studentNumber: payment.student.studentNumber,
    };

    if (payment.enrollment) {
      const courses = payment.enrollment.enrollmentCourses.map((ec) => ({
        code: ec.course.code,
        name: ec.course.name,
        credits: ec.course.credits || 0,
      }));

      const pdfBuffer = await generateRegistrationReceipt(
        studentData,
        { enrollmentNumber: payment.enrollment.enrollmentNumber },
        courses,
      );
      return pdfBuffer;
    }

    const pdfBuffer = await generateInvoice({
      invoiceNumber: payment.invoiceNumber || '',
      amount: payment.amount,
      paidAmount: payment.paidAmount,
      dueDate: payment.dueDate || new Date(),
      status: payment.status,
      student: {
        firstName: payment.student.user.firstName,
        lastName: payment.student.user.lastName,
        studentNumber: payment.student.studentNumber,
      },
      notes: payment.description,
    });

    return pdfBuffer;
  },
};
