'use client';

import { useState, useEffect } from 'react';
import { StatsCard } from '@/components/layout/StatsCard';
import { StatCardGrid } from '@/components/layout/StatCardGrid';
import { PageHeader } from '@/components/layout/PageHeader';
import { EnrollmentChart } from '@/components/dashboard/EnrollmentChart';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { dashboardService } from '@/services/dashboard.service';
import { enrollmentService } from '@/services/enrollment.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import {
  FileText,
  Users,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';

interface RegistrarStats {
  totalEnrollments: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  totalStudents: number;
}

interface RecentEnrollment {
  id: string;
  student: { firstName: string; lastName: string };
  course: { code: string; name: string };
  status: string;
  createdAt: string;
}

interface RegistrarDashboardProps {
  user: any;
}

export function RegistrarDashboard({ user }: RegistrarDashboardProps) {
  const [stats, setStats] = useState<RegistrarStats | null>(null);
  const [enrollmentData, setEnrollmentData] = useState([]);
  const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollment[]>([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, enrollmentRes, enrollmentsRes, activitiesRes] =
          await Promise.all([
            dashboardService.getStats(),
            dashboardService.getEnrollmentChart(),
            enrollmentService.getAll({ limit: 10 }),
            dashboardService.getRecentActivities(),
          ]);
        setStats(statsRes.data);
        setEnrollmentData(enrollmentRes.data || []);
        setRecentEnrollments(enrollmentsRes.data?.data || enrollmentsRes.data || []);
        setActivities(activitiesRes.data || []);
      } catch (error) {
        console.error('Failed to fetch registrar dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      PENDING: 'secondary',
      APPROVED: 'default',
      REJECTED: 'destructive',
      COMPLETED: 'default',
    };
    return variants[status] || 'outline';
  };

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <PageHeader title="Enrollment Dashboard" description="Manage enrollments" />
        <StatCardGrid>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-lg" />
          ))}
        </StatCardGrid>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[350px] rounded-lg" />
          <Skeleton className="h-[350px] rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enrollment Dashboard"
        description={`Welcome back, ${user.firstName} ${user.lastName}`}
      />

      <StatCardGrid>
        <StatsCard
          title="Total Enrollments"
          value={stats?.totalEnrollments ?? 0}
          icon={FileText}
        />
        <StatsCard
          title="Pending Applications"
          value={stats?.pendingApplications ?? 0}
          icon={Clock}
        />
        <StatsCard
          title="Approved Applications"
          value={stats?.approvedApplications ?? 0}
          icon={CheckCircle}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Rejected Applications"
          value={stats?.rejectedApplications ?? 0}
          icon={XCircle}
        />
        <StatsCard
          title="Total Students"
          value={stats?.totalStudents ?? 0}
          icon={Users}
          trend={{ value: 5, isPositive: true }}
        />
      </StatCardGrid>

      <div className="grid gap-6 md:grid-cols-2">
        <EnrollmentChart data={enrollmentData} loading={loading} />

        <Card>
          <CardHeader>
            <CardTitle>Recent Enrollments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[350px]">
              <div className="space-y-1 p-4 pt-0">
                {recentEnrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {enrollment.student?.firstName}{' '}
                        {enrollment.student?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {enrollment.course?.code} - {enrollment.course?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(enrollment.createdAt)}
                      </p>
                    </div>
                    <Badge variant={getStatusBadge(enrollment.status)}>
                      {enrollment.status}
                    </Badge>
                  </div>
                ))}
                {recentEnrollments.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No recent enrollments
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <RecentActivities activities={activities} loading={loading} />
    </div>
  );
}
