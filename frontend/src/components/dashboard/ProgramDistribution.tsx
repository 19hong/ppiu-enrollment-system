'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ProgramData {
  name: string;
  value: number;
  color?: string;
}

interface ProgramDistributionProps {
  data: ProgramData[];
  loading?: boolean;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2, 142.1 76.2% 36.3%))',
  'hsl(var(--chart-3, 271 91% 65%))',
  'hsl(var(--chart-4, 24 95% 53%))',
  'hsl(var(--chart-5, 340 82% 52%))',
  'hsl(var(--chart-6, 200 98% 39%))',
];

function ChartSkeleton() {
  return (
    <div className="h-[300px] flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading chart...</div>
    </div>
  );
}

export function ProgramDistribution({ data, loading }: ProgramDistributionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <ChartSkeleton />
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--card))',
                  }}
                  formatter={(value: number, name: string) => [
                    value,
                    name,
                  ]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value: string) => (
                    <span className="text-xs text-muted-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
