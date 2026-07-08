'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { getInitials } from '@/lib/utils';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

function useBreadcrumbs() {
  const pathname = usePathname();

  const segments = pathname.split('/').filter(Boolean);

  const labelMap: Record<string, string> = {
    dashboard: 'Dashboard',
    students: 'Students',
    admissions: 'Admissions',
    enrollment: 'Enrollment',
    programs: 'Programs',
    courses: 'Courses',
    departments: 'Departments',
    schedules: 'Schedules',
    lecturers: 'Lecturers',
    payments: 'Payments',
    grades: 'Grades',
    attendance: 'Attendance',
    announcements: 'Announcements',
    reports: 'Reports',
    settings: 'Settings',
  };

  const crumbs = segments.map((segment, index) => ({
    label: labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
    href: '/' + segments.slice(0, index + 1).join('/'),
    isLast: index === segments.length - 1,
  }));

  const pageTitle = crumbs.length > 0 ? crumbs[crumbs.length - 1].label : 'Dashboard';
  return { crumbs, pageTitle };
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const { crumbs, pageTitle } = useBreadcrumbs();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const notifications = [
    { id: 1, title: 'New enrollment request', time: '5 min ago', unread: true },
    { id: 2, title: 'Payment received from Student', time: '1 hour ago', unread: true },
    { id: 3, title: 'Schedule updated for CS101', time: '3 hours ago', unread: false },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {crumbs.length > 0 ? (
            crumbs.map((crumb) => (
              <span key={crumb.href} className="flex items-center gap-2">
                {crumb.href !== crumbs[0].href && (
                  <span className="text-muted-foreground/50">/</span>
                )}
                {crumb.isLast ? (
                  <span className="font-semibold text-foreground">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="hover:text-foreground transition-colors">
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))
          ) : (
            <span className="font-semibold text-foreground">Dashboard</span>
          )}
        </div>
      </div>

      <div className={cn(
        'hidden md:flex items-center relative',
        searchOpen && 'flex-1 max-w-sm'
      )}>
        {searchOpen ? (
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
              autoFocus
              onBlur={() => {
                if (!searchQuery) setSearchOpen(false);
              }}
            />
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="relative" ref={notifRef}>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setNotifOpen(!notifOpen)}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>

        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border bg-card shadow-lg animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <p className="text-sm font-semibold">Notifications</p>
              <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">No notifications</p>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    className={cn(
                      'w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted transition-colors',
                      notif.unread && 'bg-primary/5'
                    )}
                  >
                    <div className={cn(
                      'h-2 w-2 rounded-full mt-1.5 flex-shrink-0',
                      notif.unread ? 'bg-primary' : 'bg-transparent'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notif.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{notif.time}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="relative" ref={userMenuRef}>
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-muted transition-colors"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.profileImage} />
            <AvatarFallback className="text-xs">
              {user ? getInitials(user.firstName, user.lastName) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex items-center gap-1">
            <span className="text-sm font-medium max-w-[120px] truncate">
              {user ? `${user.firstName} ${user.lastName}` : 'User'}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </div>
        </button>

        {userMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border bg-card shadow-lg animate-in slide-in-from-top-2">
            <div className="px-4 py-3 border-b">
              <p className="text-sm font-medium">
                {user ? `${user.firstName} ${user.lastName}` : 'Guest'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {user?.email || 'No email'}
              </p>
            </div>
            <div className="p-1">
              <Link
                href="/settings"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                <User className="h-4 w-4" />
                Profile
              </Link>
              <Link
                href="/settings"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <div className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <Moon className="h-4 w-4" />
                  <span>Dark mode</span>
                </div>
                <ThemeToggle />
              </div>
            </div>
            <div className="border-t p-1">
              <button
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}