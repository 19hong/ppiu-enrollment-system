'use client';

import { useState, useEffect } from 'react';
import { StatsCard } from '@/components/layout/StatsCard';
import { StatCardGrid } from '@/components/layout/StatCardGrid';
import { PageHeader } from '@/components/layout/PageHeader';
import { EnrollmentChart } from '@/components/dashboard/EnrollmentChart';
import { ProgramDistribution } from '@/components/dashboard/ProgramDistribution';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { dashboardService } from '@/services/dashboard.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  GraduationCap,
  BookOpen,
  Users,
  TrendingUp,
} from 'lucide-react';

interface DepartmentStats {
  totalPrograms: number;
  totalCourses: number;
  totalStudents: number;
  activePrograms: number;
  averageClassSize: number;
}

interface Program {
  id: string;
  name: string;
  code: string;
  studentCount: number;
  capacity: number;
  status: string;
}

interface DepartmentDashboardProps {
  user: any;
}

export function DepartmentDashboard({ user }: DepartmentDashboardProps) {
  const [stats, setStats] = useState<DepartmentStats | null>(null);
  const [enrollmentData, setEnrollmentData] = useState([]);
  const [programData, setProgramData] = useState([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, enrollmentRes, programsRes, programsListRes, activitiesRes] =
          await Promise.all([
            dashboardService.getStats(),
            dashboardService.getEnrollmentChart(),
            dashboardService.getTopPrograms(),
            dashboardService.getTopPrograms({ limit: 10 }),
            dashboardService.getRecentActivities(),
          ]);
        setStats(statsRes.data);
        setEnrollmentData(enrollmentRes.data || []);
        setProgramData(programsRes.data || []);
        setPrograms(programsListRes.data || []);
        setActivities(activitiesRes.data || []);
      } catch (error) {
        console.error('Failed to fetch department dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusVariant = (status: string): 'default' | 'secondary' | 'outline' => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'DRAFT':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <PageHeader title="Department Dashboard" description="Department overview" />
        <StatCardGrid>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-lg" />
          ))}
        </StatCardGrid>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[350px] rounded-lg" />
          <Skeleton className="h-[350px] rounded-lg" />
        </div>
        <Skeleton className="h-[350px] rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Dashboard"
        description={`Welcome back, ${user.firstName} ${user.lastName}`}
      />

      <StatCardGrid>
        <StatsCard
          title="Total Programs"
          value={stats?.totalPrograms ?? 0}
          icon={GraduationCap}
          trend={{ value: 2, isPositive: true }}
        />
        <StatsCard
          title="Total Courses"
          value={stats?.totalCourses ?? 0}
          icon={BookOpen}
          trend={{ value: 4, isPositive: true }}
        />
        <StatsCard
          title="Total Students"
          value={stats?.totalStudents ?? 0}
          icon={Users}
          trend={{ value: 6, isPositive: true }}
        />
        <StatsCard
          title="Active Programs"
          value={stats?.activePrograms ?? 0}
          icon={TrendingUp}
        />
        <StatsCard
          title="Avg Class Size"
          value={stats?.averageClassSize ?? 0}
          icon={Building2}
        />
      </StatCardGrid>

      <div className="grid gap-6 md:grid-cols-2">
        <EnrollmentChart data={enrollmentData} loading={loading} />
        <ProgramDistribution data={programData} loading={loading} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Program Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {programs.map((program) => (
                  <div
                    key={program.id}
                    className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium">{program.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {program.code}
                        </p>
                      </div>
                      <Badge variant={getStatusVariant(program.status)}>
                        {program.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {program.studentCount} / {program.capacity} students
                      </span>
                      <span className="text-muted-foreground">
                        {Math.round(
                          (program.studentCount / program.capacity) * 100
                        )}%
                      </span>
                    </div>
                    <Progress
                      value={(program.studentCount / program.capacity) * 100}
                      className="mt-2"
                    />
                  </div>
                ))}
                {programs.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No programs found
                  </p>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <RecentActivities activities={activities} loading={loading} />
    </div>
  );
}
