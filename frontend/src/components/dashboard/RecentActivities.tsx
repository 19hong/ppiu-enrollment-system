'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatDateTime } from '@/lib/utils';
import {
  LucideIcon,
  UserPlus,
  FileText,
  CreditCard,
  GraduationCap,
  BookOpen,
  Settings,
  AlertCircle,
} from 'lucide-react';

type ActivityType =
  | 'STUDENT_CREATED'
  | 'ENROLLMENT_CREATED'
  | 'PAYMENT_RECEIVED'
  | 'COURSE_CREATED'
  | 'GRADE_POSTED'
  | 'APPLICATION_SUBMITTED'
  | 'SETTINGS_UPDATED'
  | 'SYSTEM_ALERT';

interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
  };
}

interface RecentActivitiesProps {
  activities: Activity[];
  loading?: boolean;
}

const activityIcons: Record<ActivityType, LucideIcon> = {
  STUDENT_CREATED: UserPlus,
  ENROLLMENT_CREATED: FileText,
  PAYMENT_RECEIVED: CreditCard,
  COURSE_CREATED: BookOpen,
  GRADE_POSTED: GraduationCap,
  APPLICATION_SUBMITTED: FileText,
  SETTINGS_UPDATED: Settings,
  SYSTEM_ALERT: AlertCircle,
};

const activityColors: Record<ActivityType, string> = {
  STUDENT_CREATED: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  ENROLLMENT_CREATED: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  PAYMENT_RECEIVED: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  COURSE_CREATED: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  GRADE_POSTED: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  APPLICATION_SUBMITTED: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  SETTINGS_UPDATED: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
  SYSTEM_ALERT: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

function ActivitySkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RecentActivities({ activities, loading }: RecentActivitiesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <ActivitySkeleton />
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-1 p-4 pt-0">
              {activities.map((activity) => {
                const Icon = activityIcons[activity.type] || AlertCircle;
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full',
                        activityColors[activity.type] || 'bg-gray-100 text-gray-600'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm">{activity.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {activity.user && (
                          <span>
                            {activity.user.firstName} {activity.user.lastName}
                          </span>
                        )}
                        <span>{formatDateTime(activity.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {activities.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No recent activities
                </p>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
