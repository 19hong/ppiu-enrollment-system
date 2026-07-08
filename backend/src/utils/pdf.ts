import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { config } from '../config';

function addHeader(doc: typeof PDFDocument.prototype, title: string): void {
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('PPIU', { align: 'center' })
    .fontSize(12)
    .font('Helvetica')
    .text('Panha Pisey International University', { align: 'center' })
    .moveDown(0.5)
    .fontSize(16)
    .font('Helvetica-Bold')
    .text(title, { align: 'center' })
    .moveDown(1);
}

function addFooter(doc: typeof PDFDocument.prototype): void {
  doc
    .moveDown(2)
    .fontSize(8)
    .font('Helvetica')
    .text('This is a computer-generated document. No signature is required.', { align: 'center', color: '#888888' })
    .text(`Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center', color: '#888888' });
}

export async function generateRegistrationReceipt(
  student: { firstName: string; lastName: string; studentNumber: string; department?: { name: string }; program?: { name: string } },
  enrollment: { enrollmentNumber: string },
  courses: { code: string; name: string; credits: number }[],
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    addHeader(doc, 'Registration Receipt');

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Enrollment #: ${enrollment.enrollmentNumber}`, { align: 'right' })
      .moveDown(0.5);

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('Student Information')
      .moveDown(0.3);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Name: ${student.firstName} ${student.lastName}`)
      .text(`Student #: ${student.studentNumber}`)
      .text(`Department: ${student.department?.name || 'N/A'}`)
      .text(`Program: ${student.program?.name || 'N/A'}`)
      .moveDown(1);

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('Enrolled Courses')
      .moveDown(0.3);

    const tableTop = doc.y;
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Code', 50, tableTop)
      .text('Course Name', 120, tableTop)
      .text('Credits', 430, tableTop);

    doc
      .moveTo(50, tableTop + 18)
      .lineTo(500, tableTop + 18)
      .stroke();

    let yPos = tableTop + 25;
    let totalCredits = 0;

    doc.font('Helvetica').fontSize(10);
    for (const course of courses) {
      doc
        .text(course.code, 50, yPos)
        .text(course.name, 120, yPos, { width: 300 })
        .text(String(course.credits), 430, yPos);
      totalCredits += course.credits;
      yPos += 20;
    }

    doc
      .moveTo(50, yPos)
      .lineTo(500, yPos)
      .stroke();

    yPos += 8;
    doc
      .font('Helvetica-Bold')
      .text('Total Credits:', 350, yPos)
      .text(String(totalCredits), 430, yPos);

    addFooter(doc);
    doc.end();
  });
}

export async function generateTranscript(
  student: { firstName: string; lastName: string; studentNumber: string; department?: { name: string }; program?: { name: string } },
  grades: { course?: { code: string; name: string; credits: number }; semester?: { name: string }; total: number | null; grade: string | null; gradePoints: number | null }[],
  semesters: { name: string; academicYear: string }[],
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    addHeader(doc, 'Academic Transcript');

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('Student Information')
      .moveDown(0.3);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Name: ${student.firstName} ${student.lastName}`)
      .text(`Student #: ${student.studentNumber}`)
      .text(`Department: ${student.department?.name || 'N/A'}`)
      .text(`Program: ${student.program?.name || 'N/A'}`)
      .moveDown(1);

    for (const semester of semesters) {
      const semesterGrades = grades.filter((g) => g.semester?.name === semester.name);
      if (semesterGrades.length === 0) continue;

      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`${semester.name} (${semester.academicYear})`)
        .moveDown(0.3);

      const tableTop = doc.y;
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Code', 50, tableTop)
        .text('Course', 120, tableTop)
        .text('Credits', 320, tableTop)
        .text('Score', 380, tableTop)
        .text('Grade', 430, tableTop)
        .text('GP', 480, tableTop);

      doc
        .moveTo(50, tableTop + 18)
        .lineTo(510, tableTop + 18)
        .stroke();

      let yPos = tableTop + 25;
      let semesterPoints = 0;
      let semesterCredits = 0;

      doc.font('Helvetica').fontSize(9);
      for (const grade of semesterGrades) {
        doc
          .text(grade.course?.code || '', 50, yPos)
          .text(grade.course?.name || '', 120, yPos, { width: 190 })
          .text(String(grade.course?.credits || 0), 320, yPos)
          .text(grade.total != null ? String(grade.total) : '-', 380, yPos)
          .text(grade.grade || '-', 430, yPos)
          .text(grade.gradePoints != null ? String(grade.gradePoints) : '-', 480, yPos);
        semesterPoints += (grade.gradePoints || 0) * (grade.course?.credits || 0);
        semesterCredits += grade.course?.credits || 0;
        yPos += 18;
      }

      doc
        .moveTo(50, yPos)
        .lineTo(510, yPos)
        .stroke();

      yPos += 8;
      doc
        .font('Helvetica')
        .fontSize(9)
        .text(`Semester GPA: ${semesterCredits > 0 ? (semesterPoints / semesterCredits).toFixed(2) : '0.00'}`, 350, yPos);

      doc.moveDown(1);
    }

    addFooter(doc);
    doc.end();
  });
}

export async function generateStudentIdCard(
  student: { firstName: string; lastName: string; studentNumber: string; profileImage?: string | null; department?: { name: string }; program?: { name: string } },
): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ size: [337, 212], margin: 10 });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    try {
      const qrData = `${config.frontendUrl}/verify-student/${student.studentNumber}`;
      const qrBuffer = await QRCode.toBuffer(qrData, { width: 80, margin: 0 });
      doc.image(qrBuffer, 240, 120, { width: 80, height: 80 });
    } catch {
      // QR generation failed — continue without it
    }

    doc
      .rect(0, 0, 337, 212)
      .lineWidth(3)
      .stroke('#1a237e');

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#1a237e')
      .text('PPIU', 15, 15, { align: 'center' });

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#333333')
      .text('Panha Pisey International University', 15, 35, { align: 'center' });

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('STUDENT ID CARD', 15, 55, { align: 'center' });

    if (student.profileImage) {
      try {
        doc.image(student.profileImage, 15, 75, { width: 70, height: 70 });
      } catch {
        // Image load failed — skip
      }
    }

    const textX = student.profileImage ? 100 : 15;
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(student.firstName + ' ' + student.lastName, textX, 80)
      .fontSize(8)
      .font('Helvetica')
      .text(`Student #: ${student.studentNumber}`, textX, 100)
      .text(`Department: ${student.department?.name || 'N/A'}`, textX, 115)
      .text(`Program: ${student.program?.name || 'N/A'}`, textX, 130);

    doc
      .fontSize(6)
      .fillColor('#888888')
      .text('Valid for Academic Year ' + new Date().getFullYear(), 15, 180, { align: 'center' });

    doc.end();
  });
}

export async function generateInvoice(
  payment: {
    invoiceNumber: string;
    amount: number;
    paidAmount: number;
    dueDate: Date | string;
    status: string;
    student?: { firstName: string; lastName: string; studentNumber: string; program?: { name: string } };
    enrollment?: { enrollmentNumber: string };
    notes?: string | null;
  },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    addHeader(doc, 'Invoice');

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text(`Invoice #: ${payment.invoiceNumber}`, { align: 'right' })
      .moveDown(0.5);

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('Bill To:')
      .moveDown(0.3);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`${payment.student?.firstName || ''} ${payment.student?.lastName || ''}`)
      .text(`Student #: ${payment.student?.studentNumber || 'N/A'}`)
      .text(`Program: ${payment.student?.program?.name || 'N/A'}`);

    if (payment.enrollment?.enrollmentNumber) {
      doc.text(`Enrollment: ${payment.enrollment.enrollmentNumber}`);
    }

    doc.moveDown(1);

    const tableTop = doc.y;
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Description', 50, tableTop)
      .text('Amount', 430, tableTop);

    doc
      .moveTo(50, tableTop + 18)
      .lineTo(500, tableTop + 18)
      .stroke();

    doc
      .font('Helvetica')
      .fontSize(10)
      .text(`Tuition Fee - ${payment.enrollment?.enrollmentNumber || 'General'}`, 50, tableTop + 25)
      .text(`$${payment.amount.toFixed(2)}`, 430, tableTop + 25);

    const totalY = tableTop + 50;
    doc
      .moveTo(50, totalY)
      .lineTo(500, totalY)
      .stroke();

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('Total Due:', 350, totalY + 8)
      .text(`$${payment.amount.toFixed(2)}`, 430, totalY + 8);

    doc
      .font('Helvetica')
      .fontSize(10)
      .text('Amount Paid:', 350, totalY + 25)
      .text(`$${payment.paidAmount.toFixed(2)}`, 430, totalY + 25);

    const balance = payment.amount - payment.paidAmount;
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('Balance Due:', 350, totalY + 42)
      .text(`$${balance.toFixed(2)}`, 430, totalY + 42);

    doc.moveDown(4);

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Payment Details')
      .moveDown(0.3);

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Status: ${payment.status}`)
      .text(`Due Date: ${new Date(payment.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);

    if (payment.notes) {
      doc.text(`Notes: ${payment.notes}`);
    }

    addFooter(doc);
    doc.end();
  });
}
