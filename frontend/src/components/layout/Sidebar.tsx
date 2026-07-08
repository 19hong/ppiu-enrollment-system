'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { getInitials } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileText,
  BookOpen,
  GraduationCap,
  Building2,
  Calendar,
  Presentation,
  DollarSign,
  ClipboardCheck,
  UserCheck,
  Megaphone,
  Bell,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  GraduationCap as LogoIcon,
  X,
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  title: string;
  href?: string;
  icon?: any;
  items?: { title: string; href: string }[];
  roles?: string[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

function useNavigation(): NavSection[] {
  const { hasAnyRole } = useAuth();

  return [
    {
      title: 'Main',
      items: [
        {
          title: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard,
          roles: undefined,
        },
      ],
    },
    {
      title: 'Management',
      items: [
        {
          title: 'Students',
          href: '/students',
          icon: Users,
          roles: ['SUPER_ADMIN', 'REGISTRAR'],
        },
        {
          title: 'Admissions',
          href: '/admissions',
          icon: UserCheck,
          roles: ['SUPER_ADMIN', 'REGISTRAR'],
        },
        {
          title: 'Enrollment',
          href: '/enrollment',
          icon: FileText,
          roles: ['SUPER_ADMIN', 'REGISTRAR'],
        },
        {
          title: 'Departments',
          href: '/departments',
          icon: Building2,
          roles: ['SUPER_ADMIN', 'REGISTRAR'],
        },
        {
          title: 'Lecturers',
          href: '/lecturers',
          icon: Presentation,
          roles: ['SUPER_ADMIN', 'REGISTRAR'],
        },
      ],
    },
    {
      title: 'Academic',
      items: [
        {
          title: 'Programs',
          href: '/programs',
          icon: BookOpen,
          roles: ['SUPER_ADMIN', 'REGISTRAR', 'DEPARTMENT_HEAD'],
        },
        {
          title: 'Courses',
          href: '/courses',
          icon: GraduationCap,
          roles: ['SUPER_ADMIN', 'REGISTRAR', 'DEPARTMENT_HEAD', 'LECTURER'],
        },
        {
          title: 'Schedules',
          href: '/schedules',
          icon: Calendar,
          roles: ['SUPER_ADMIN', 'REGISTRAR', 'LECTURER'],
        },
        {
          title: 'Grades',
          href: '/grades',
          icon: ClipboardCheck,
          roles: ['SUPER_ADMIN', 'REGISTRAR', 'LECTURER', 'STUDENT'],
        },
        {
          title: 'Attendance',
          href: '/attendance',
          icon: UserCheck,
          roles: ['SUPER_ADMIN', 'REGISTRAR', 'LECTURER', 'STUDENT'],
        },
      ],
    },
    {
      title: 'Finance',
      items: [
        {
          title: 'Payments',
          href: '/payments',
          icon: DollarSign,
          roles: ['SUPER_ADMIN', 'FINANCE_OFFICER'],
        },
      ],
    },
    {
      title: 'Communication',
      items: [
        {
          title: 'Notifications',
          href: '/notifications',
          icon: Bell,
          roles: undefined,
        },
        {
          title: 'Announcements',
          href: '/announcements',
          icon: Megaphone,
          roles: undefined,
        },
      ],
    },
    {
      title: 'Analytics',
      items: [
        {
          title: 'Reports',
          href: '/reports',
          icon: BarChart3,
          roles: ['SUPER_ADMIN', 'REGISTRAR', 'FINANCE_OFFICER'],
        },
      ],
    },
    {
      title: 'System',
      items: [
        {
          title: 'Settings',
          href: '/settings',
          icon: Settings,
          roles: ['SUPER_ADMIN'],
        },
      ],
    },
  ].filter((section) => {
    const filteredItems = section.items.filter((item) => {
      if (!item.roles || item.roles.length === 0) return true;
      return hasAnyRole(...item.roles);
    });
    return filteredItems.length > 0;
  }).map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (!item.roles || item.roles.length === 0) return true;
      return hasAnyRole(...item.roles);
    }),
  }));
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-card border-r border-border transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <LogoIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-tight">PPIU</span>
              <span className="text-[10px] text-muted-foreground leading-tight">Enrollment System</span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden h-8 w-8 rounded-md flex items-center justify-center hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ScrollArea className="flex-1 py-4">
          <nav className="px-3 space-y-1">
            {navigation.map((section) => (
              <div key={section.title}>
                <button
                  onClick={() => toggleGroup(section.title)}
                  className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  {section.title}
                  {expandedGroups[section.title] ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
                {(expandedGroups[section.title] || expandedGroups[section.title] === undefined) && (
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const active = item.href ? isActive(item.href) : false;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.title}
                          href={item.href || '#'}
                          onClick={onClose}
                          className={cn(
                            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                            active
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          )}
                        >
                          {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                          <span>{item.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </ScrollArea>

        <Separator />

        <div className="p-4">
          {user && (
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.profileImage} />
                <AvatarFallback className="text-xs">
                  {getInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.roles.join(', ')}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <button
              onClick={logout}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign out
            </button>
            <ThemeToggle />
          </div>
        </div>
      </aside>
    </>
  );
}