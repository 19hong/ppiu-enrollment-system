'use client';

import { useState, useEffect } from 'react';
import { StatsCard } from '@/components/layout/StatsCard';
import { StatCardGrid } from '@/components/layout/StatCardGrid';
import { PageHeader } from '@/components/layout/PageHeader';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { EnrollmentChart } from '@/components/dashboard/EnrollmentChart';
import { ProgramDistribution } from '@/components/dashboard/ProgramDistribution';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { dashboardService } from '@/services/dashboard.service';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  BookOpen,
  GraduationCap,
  Building2,
  UserPlus,
  Clock,
  CheckCircle,
  DollarSign,
} from 'lucide-react';

interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  totalPrograms: number;
  totalDepartments: number;
  newApplicants: number;
  pendingRegistrations: number;
  approvedRegistrations: number;
  tuitionRevenue: number;
}

interface AdminDashboardProps {
  user: any;
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState([]);
  const [enrollmentData, setEnrollmentData] = useState([]);
  const [programData, setProgramData] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, revenueRes, enrollmentRes, programsRes, activitiesRes] =
          await Promise.all([
            dashboardService.getStats(),
            dashboardService.getRevenueChart(),
            dashboardService.getEnrollmentChart(),
            dashboardService.getTopPrograms(),
            dashboardService.getRecentActivities(),
          ]);
        setStats(statsRes.data);
        setRevenueData(revenueRes.data || []);
        setEnrollmentData(enrollmentRes.data || []);
        setProgramData(programsRes.data || []);
        setActivities(activitiesRes.data || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Welcome back, admin" />
        <StatCardGrid>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-lg" />
          ))}
        </StatCardGrid>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[350px] rounded-lg col-span-2" />
          <Skeleton className="h-[350px] rounded-lg" />
        </div>
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
        title="Dashboard"
        description={`Welcome back, ${user.firstName} ${user.lastName}`}
      />

      <StatCardGrid>
        <StatsCard
          title="Total Students"
          value={stats?.totalStudents ?? 0}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Total Courses"
          value={stats?.totalCourses ?? 0}
          icon={BookOpen}
          trend={{ value: 5, isPositive: true }}
        />
        <StatsCard
          title="Total Programs"
          value={stats?.totalPrograms ?? 0}
          icon={GraduationCap}
        />
        <StatsCard
          title="Total Departments"
          value={stats?.totalDepartments ?? 0}
          icon={Building2}
        />
        <StatsCard
          title="New Applicants"
          value={stats?.newApplicants ?? 0}
          icon={UserPlus}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Pending Registrations"
          value={stats?.pendingRegistrations ?? 0}
          icon={Clock}
        />
        <StatsCard
          title="Approved Registrations"
          value={stats?.approvedRegistrations ?? 0}
          icon={CheckCircle}
          trend={{ value: 15, isPositive: true }}
        />
        <StatsCard
          title="Tuition Revenue"
          value={`$${((stats?.tuitionRevenue ?? 0) / 1000).toFixed(1)}k`}
          icon={DollarSign}
          trend={{ value: 10, isPositive: true }}
        />
      </StatCardGrid>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={revenueData} loading={loading} />
        </div>
        <ProgramDistribution data={programData} loading={loading} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <EnrollmentChart data={enrollmentData} loading={loading} />
        <RecentActivities activities={activities} loading={loading} />
      </div>
    </div>
  );
}
