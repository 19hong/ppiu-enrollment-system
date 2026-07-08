'use client';

import { useState, useEffect } from 'react';
import { StatsCard } from '@/components/layout/StatsCard';
import { StatCardGrid } from '@/components/layout/StatCardGrid';
import { PageHeader } from '@/components/layout/PageHeader';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { dashboardService } from '@/services/dashboard.service';
import { courseService } from '@/services/course.service';
import { scheduleService } from '@/services/schedule.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import {
  BookOpen,
  Users,
  Clock,
  Calendar,
  GraduationCap,
} from 'lucide-react';

interface LecturerStats {
  coursesTeaching: number;
  totalStudents: number;
  weeklyHours: number;
  pendingGrades: number;
}

interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  studentCount?: number;
  schedule?: string;
}

interface Schedule {
  id: string;
  course: { code: string; name: string };
  day: string;
  startTime: string;
  endTime: string;
  room: string;
}

interface LecturerDashboardProps {
  user: any;
}

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function LecturerDashboard({ user }: LecturerDashboardProps) {
  const [stats, setStats] = useState<LecturerStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, coursesRes, schedulesRes, activitiesRes] =
          await Promise.all([
            dashboardService.getStats(),
            courseService.getAll({ limit: 10 }),
            scheduleService.getAll({ limit: 10 }),
            dashboardService.getRecentActivities(),
          ]);
        setStats(statsRes.data);
        setCourses(coursesRes.data?.data || coursesRes.data || []);
        setSchedules(schedulesRes.data?.data || schedulesRes.data || []);
        setActivities(activitiesRes.data || []);
      } catch (error) {
        console.error('Failed to fetch lecturer dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const sortedSchedules = [...schedules].sort(
    (a, b) => DAYS_ORDER.indexOf(a.day) - DAYS_ORDER.indexOf(b.day)
  );

  const getDayColor = (day: string): string => {
    const colors: Record<string, string> = {
      Monday: 'border-l-blue-500',
      Tuesday: 'border-l-green-500',
      Wednesday: 'border-l-purple-500',
      Thursday: 'border-l-orange-500',
      Friday: 'border-l-pink-500',
      Saturday: 'border-l-cyan-500',
    };
    return colors[day] || 'border-l-gray-500';
  };

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <PageHeader title="Lecturer Dashboard" description="Your teaching overview" />
        <StatCardGrid>
          {Array.from({ length: 4 }).map((_, i) => (
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
        title="Lecturer Dashboard"
        description={`Welcome back, ${user.firstName} ${user.lastName}`}
      />

      <StatCardGrid>
        <StatsCard
          title="Courses Teaching"
          value={stats?.coursesTeaching ?? 0}
          icon={BookOpen}
        />
        <StatsCard
          title="Total Students"
          value={stats?.totalStudents ?? 0}
          icon={Users}
          trend={{ value: 5, isPositive: true }}
        />
        <StatsCard
          title="Weekly Hours"
          value={stats?.weeklyHours ?? 0}
          icon={Clock}
        />
        <StatsCard
          title="Pending Grades"
          value={stats?.pendingGrades ?? 0}
          icon={GraduationCap}
        />
      </StatCardGrid>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Courses</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{course.name}</p>
                        <Badge variant="secondary">{course.credits} credits</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{course.code}</p>
                      {course.studentCount !== undefined && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {course.studentCount} students enrolled
                        </p>
                      )}
                    </div>
                  ))}
                  {courses.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No courses assigned
                    </p>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {sortedSchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className={`rounded-lg border border-l-4 ${getDayColor(
                        schedule.day
                      )} p-4 transition-colors hover:bg-muted/50`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">
                          {schedule.course?.name || schedule.course?.code}
                        </p>
                        <Badge variant="outline">{schedule.day}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
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

      <RecentActivities activities={activities} loading={loading} />
    </div>
  );
}
