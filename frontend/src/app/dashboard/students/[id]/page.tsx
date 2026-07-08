'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { studentService } from '@/services/student.service';
import { enrollmentService } from '@/services/enrollment.service';
import { paymentService } from '@/services/payment.service';
import { gradeService } from '@/services/grade.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  BookOpen,
  CreditCard,
  GraduationCap,
} from 'lucide-react';
import { formatDate, formatCurrency, getStatusColor, getInitials } from '@/lib/utils';

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: student, isLoading: studentLoading, isError: studentError } = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentService.getById(id),
  });

  const { data: enrollmentsRes } = useQuery({
    queryKey: ['student-enrollments', id],
    queryFn: () => enrollmentService.getAll({ studentId: id, limit: 50 }),
    enabled: !!id,
  });

  const { data: paymentsRes } = useQuery({
    queryKey: ['student-payments', id],
    queryFn: () => paymentService.getAll({ studentId: id, limit: 50 }),
    enabled: !!id,
  });

  const { data: gradesRes } = useQuery({
    queryKey: ['student-grades', id],
    queryFn: () => gradeService.getAll({ studentId: id, limit: 50 }),
    enabled: !!id,
  });

  if (studentLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (studentError || !student) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Student not found</h2>
        <Button variant="link" onClick={() => router.push('/dashboard/students')}>
          Back to Students
        </Button>
      </div>
    );
  }

  const s = student;
  const enrollments = enrollmentsRes?.data ?? [];
  const payments = paymentsRes?.data ?? [];
  const grades = gradesRes?.data ?? [];

  const gpa = grades.length > 0
    ? (grades.reduce((sum: number, g: any) => sum + (g.gradePoints || 0), 0) / grades.length).toFixed(2)
    : 'N/A';

  return (
    <div className="space-y-6">
      <PageHeader title="Student Profile">
        <Button variant="outline" onClick={() => router.push('/dashboard/students')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Students
        </Button>
        <Button onClick={() => router.push(`/dashboard/students/${id}/edit`)}>
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                {s.photoUrl ? (
                  <AvatarImage src={s.photoUrl} alt={`${s.firstName} ${s.lastName}`} />
                ) : null}
                <AvatarFallback className="text-2xl">
                  {getInitials(s.firstName, s.lastName)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{s.firstName} {s.lastName}</h2>
              <p className="text-sm text-muted-foreground">{s.studentNumber || 'No student number'}</p>
              <Badge className={`mt-2 ${getStatusColor(s.status)}`} variant="outline">
                {s.status}
              </Badge>
            </div>
            <Separator className="my-4" />
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{s.email}</span>
              </div>
              {s.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{s.phone}</span>
                </div>
              )}
              {s.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{s.address}</span>
                </div>
              )}
              {s.dateOfBirth && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(s.dateOfBirth)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">First Name</p>
                  <p className="font-medium">{s.firstName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Name</p>
                  <p className="font-medium">{s.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium">{s.gender || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{s.dateOfBirth ? formatDate(s.dateOfBirth) : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{s.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{s.phone || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{s.address || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Program</p>
                  <p className="font-medium">{s.program?.name || s.programName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{s.department?.name || s.departmentName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Semester</p>
                  <p className="font-medium">{s.currentSemester || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">GPA</p>
                  <p className="font-medium">{gpa}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Enrollment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No enrollment records found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Enrollment #</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Courses</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enr: any) => (
                  <TableRow key={enr.id}>
                    <TableCell className="font-medium">{enr.enrollmentNumber || enr.id.slice(0, 8)}</TableCell>
                    <TableCell>{enr.semester?.name || enr.semester || 'N/A'}</TableCell>
                    <TableCell>{enr.courses?.length || enr.courseCount || 0}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(enr.status)} variant="outline">
                        {enr.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(enr.createdAt || enr.enrolledAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No payment records found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.slice(0, 10).map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.type || 'TUITION'}</TableCell>
                      <TableCell>{formatCurrency(p.amount || 0)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(p.status)} variant="outline">
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(p.createdAt || p.paidAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Grade Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {grades.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No grade records found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Semester</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.slice(0, 10).map((g: any) => (
                    <TableRow key={g.id}>
                      <TableCell>{g.course?.code || g.courseCode || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={g.letter === 'F' ? 'destructive' : 'default'}
                          className={g.letter && g.letter !== 'F' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {g.letter || g.grade || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>{g.gradePoints || 'N/A'}</TableCell>
                      <TableCell>{g.semester?.name || g.semester || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
