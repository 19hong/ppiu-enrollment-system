'use client';

import { useAuth } from '@/context/AuthContext';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { RegistrarDashboard } from '@/components/dashboard/RegistrarDashboard';
import { FinanceDashboard } from '@/components/dashboard/FinanceDashboard';
import { DepartmentDashboard } from '@/components/dashboard/DepartmentDashboard';
import { LecturerDashboard } from '@/components/dashboard/LecturerDashboard';
import { StudentDashboard } from '@/components/dashboard/StudentDashboard';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const role = user.roles[0];

  switch (role) {
    case 'SUPER_ADMIN':
      return <AdminDashboard user={user} />;
    case 'REGISTRAR':
      return <RegistrarDashboard user={user} />;
    case 'FINANCE_OFFICER':
      return <FinanceDashboard user={user} />;
    case 'DEPARTMENT_HEAD':
      return <DepartmentDashboard user={user} />;
    case 'LECTURER':
      return <LecturerDashboard user={user} />;
    case 'STUDENT':
      return <StudentDashboard user={user} />;
    default:
      return <AdminDashboard user={user} />;
  }
}
