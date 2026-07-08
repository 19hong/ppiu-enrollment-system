'use client';

import { useState, useEffect } from 'react';
import { StatsCard } from '@/components/layout/StatsCard';
import { StatCardGrid } from '@/components/layout/StatCardGrid';
import { PageHeader } from '@/components/layout/PageHeader';
import { dashboardService } from '@/services/dashboard.service';
import { enrollmentService } from '@/services/enrollment.service';
import { gradeService } from '@/services/grade.service';
import { scheduleService } from '@/services/schedule.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import {
  BookOpen,
  CreditCard,
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface StudentStats {
  enrollmentStatus: string;
  paymentStatus: string;
  completedCredits: number;
  totalCredits: number;
  gpa: number;
  attendanceRate: number;
}

interface Enrollment {
  id: string;
  course: { code: string; name: string; credits: number };
  status: string;
  createdAt: string;
}

interface Grade {
  id: string;
  course: { code: string; name: string; credits: number };
  score?: number;
  grade?: string;
  semester: string;
}

interface Schedule {
  id: string;
  course: { code: string; name: string };
  day: string;
  startTime: string;
  endTime: string;
  room: string;
}

interface StudentDashboardProps {
  user: any;
}

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function StudentDashboard({ user }: StudentDashboardProps) {
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentId = user.student?.id;
        if (!studentId) {
          setLoading(false);
          return;
        }

        const [statsRes, enrollmentsRes, gradesRes, schedulesRes] =
          await Promise.all([
            dashboardService.getStats(),
            enrollmentService.getAll({ studentId, limit: 10 }),
            gradeService.getAll({ studentId, limit: 10 }),
            scheduleService.getAll({ limit: 10 }),
          ]);
        setStats(statsRes.data);
        setEnrollments(enrollmentsRes.data?.data || enrollmentsRes.data || []);
        setGrades(gradesRes.data?.data || gradesRes.data || []);
        setSchedules(schedulesRes.data?.data || schedulesRes.data || []);
      } catch (error) {
        console.error('Failed to fetch student dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.student?.id]);

  const getStatusVariant = (
    status: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'ACTIVE':
      case 'APPROVED':
      case 'PAID':
        return 'default';
      case 'PENDING':
      case 'PARTIALLY':
        return 'secondary';
      case 'REJECTED':
      case 'UNPAID':
      case 'SUSPENDED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getGradeColor = (grade?: string): string => {
    if (!grade) return 'text-muted-foreground';
    const gradeColors: Record<string, string> = {
      A: 'text-green-600',
      'B+': 'text-blue-600',
      B: 'text-blue-600',
      'C+': 'text-yellow-600',
      C: 'text-yellow-600',
      D: 'text-orange-600',
      F: 'text-red-600',
    };
    return gradeColors[grade] || 'text-muted-foreground';
  };

  const sortedSchedules = [...schedules].sort(
    (a, b) => DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day)
  );

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Dashboard" description="Your academic overview" />
        <StatCardGrid>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-lg" />
          ))}
        </StatCardGrid>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[300px] rounded-lg" />
          <Skeleton className="h-[300px] rounded-lg" />
          <Skeleton className="h-[300px] rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Dashboard"
        description={`Welcome back, ${user.firstName} ${user.lastName}`}
      />

      <StatCardGrid>
        <StatsCard
          title="Enrollment Status"
          value={stats?.enrollmentStatus ?? 'N/A'}
          icon={BookOpen}
        />
        <StatsCard
          title="Payment Status"
          value={stats?.paymentStatus ?? 'N/A'}
          icon={CreditCard}
        />
        <StatsCard
          title="GPA"
          value={stats?.gpa?.toFixed(2) ?? 'N/A'}
          icon={GraduationCap}
        />
        <StatsCard
          title="Attendance"
          value={stats?.attendanceRate ? `${stats.attendanceRate}%` : 'N/A'}
          icon={CheckCircle2}
          trend={
            stats?.attendanceRate
              ? { value: stats.attendanceRate, isPositive: stats.attendanceRate >= 75 }
              : undefined
          }
        />
      </StatCardGrid>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              My Enrollments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : (
              <ScrollArea className="h-[250px]">
                <div className="space-y-3">
                  {enrollments.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {enrollment.course?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {enrollment.course?.code} - {enrollment.course?.credits} credits
                        </p>
                      </div>
                      <Badge variant={getStatusVariant(enrollment.status)}>
                        {enrollment.status}
                      </Badge>
                    </div>
                  ))}
                  {enrollments.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No enrollments found
                    </p>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Grades Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : (
              <ScrollArea className="h-[250px]">
                <div className="space-y-3">
                  {grades.map((grade) => (
                    <div
                      key={grade.id}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {grade.course?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {grade.course?.code} - {grade.semester}
                        </p>
                      </div>
                      <span
                        className={`text-lg font-bold ${getGradeColor(grade.grade)}`}
                      >
                        {grade.grade || '-'}
                      </span>
                    </div>
                  ))}
                  {grades.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No grades available
                    </p>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            ) : (
              <ScrollArea className="h-[250px]">
                <div className="space-y-3">
                  {sortedSchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="rounded-lg border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">
                          {schedule.course?.name}
                        </p>
                        <Badge variant="outline">{schedule.day}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {schedule.startTime} - {schedule.endTime}
                        </span>
                        <span>{schedule.room}</span>
                      </div>
                    </div>
                  ))}
                  {sortedSchedules.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No upcoming schedule
                    </p>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Academic Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Credit Completion</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.completedCredits} / {stats.totalCredits} credits
                  </span>
                </div>
                <Progress
                  value={
                    stats.totalCredits > 0
                      ? (stats.completedCredits / stats.totalCredits) * 100
                      : 0
                  }
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Attendance Rate</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.attendanceRate}%
                  </span>
                </div>
                <Progress value={stats.attendanceRate || 0} />
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted p-4">
                {stats.gpa >= 3.0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    Current GPA: {stats.gpa?.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stats.gpa >= 3.0
                      ? 'Good academic standing'
                      : stats.gpa >= 2.0
                      ? 'Satisfactory progress'
                      : 'Academic support recommended'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
