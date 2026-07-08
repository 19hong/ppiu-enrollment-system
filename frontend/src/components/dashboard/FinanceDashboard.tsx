'use client';

import { useState, useEffect } from 'react';
import { StatsCard } from '@/components/layout/StatsCard';
import { StatCardGrid } from '@/components/layout/StatCardGrid';
import { PageHeader } from '@/components/layout/PageHeader';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { dashboardService } from '@/services/dashboard.service';
import { paymentService } from '@/services/payment.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
  DollarSign,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';

interface FinanceStats {
  totalRevenue: number;
  pendingPayments: number;
  completedPayments: number;
  overduePayments: number;
  monthlyCollections: number;
}

interface PendingPayment {
  id: string;
  student: { firstName: string; lastName: string };
  amount: number;
  type: string;
  dueDate: string;
  status: string;
}

interface FinanceDashboardProps {
  user: any;
}

function PaymentSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

export function FinanceDashboard({ user }: FinanceDashboardProps) {
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [revenueData, setRevenueData] = useState([]);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, revenueRes, paymentsRes, activitiesRes] =
          await Promise.all([
            dashboardService.getStats(),
            dashboardService.getRevenueChart(),
            paymentService.getAll({ status: 'PENDING', limit: 10 }),
            dashboardService.getRecentActivities(),
          ]);
        setStats(statsRes.data);
        setRevenueData(revenueRes.data || []);
        setPendingPayments(paymentsRes.data?.data || paymentsRes.data || []);
        setActivities(activitiesRes.data || []);
      } catch (error) {
        console.error('Failed to fetch finance dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <PageHeader title="Finance Dashboard" description="Financial overview" />
        <StatCardGrid>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-lg" />
          ))}
        </StatCardGrid>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[350px] rounded-lg col-span-2" />
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
        title="Finance Dashboard"
        description={`Welcome back, ${user.firstName} ${user.lastName}`}
      />

      <StatCardGrid>
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats?.totalRevenue ?? 0)}
          icon={DollarSign}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Monthly Collections"
          value={formatCurrency(stats?.monthlyCollections ?? 0)}
          icon={TrendingUp}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Completed Payments"
          value={stats?.completedPayments ?? 0}
          icon={CheckCircle}
        />
        <StatsCard
          title="Pending Payments"
          value={stats?.pendingPayments ?? 0}
          icon={CreditCard}
        />
        <StatsCard
          title="Overdue Payments"
          value={stats?.overduePayments ?? 0}
          icon={AlertTriangle}
          trend={{ value: 3, isPositive: false }}
        />
      </StatCardGrid>

      <RevenueChart data={revenueData} loading={loading} />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pending Payments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <PaymentSkeleton />
            ) : (
              <ScrollArea className="h-[350px]">
                <div className="space-y-1 p-4 pt-0">
                  {pendingPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {payment.student?.firstName}{' '}
                          {payment.student?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payment.type} - Due {formatDate(payment.dueDate)}
                        </p>
                        <p className="text-sm font-semibold">
                          {formatCurrency(payment.amount)}
                        </p>
                      </div>
                      <Badge variant="secondary">{payment.status}</Badge>
                    </div>
                  ))}
                  {pendingPayments.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No pending payments
                    </p>
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <RecentActivities activities={activities} loading={loading} />
      </div>
    </div>
  );
}
