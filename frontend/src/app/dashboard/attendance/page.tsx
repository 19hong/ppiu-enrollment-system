'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '@/services/attendance.service';
import { courseService } from '@/services/course.service';
import { scheduleService } from '@/services/schedule.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/context/AuthContext';
import { formatDate, getStatusColor, cn } from '@/lib/utils';
import { ATTENDANCE_STATUS } from '@/lib/constants';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CalendarCheck,
  UserCheck,
  UserX,
  Clock,
  AlertCircle,
  Download,
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PRESENT: <UserCheck className="h-5 w-5 text-green-600" />,
  ABSENT: <UserX className="h-5 w-5 text-red-600" />,
  LATE: <Clock className="h-5 w-5 text-yellow-600" />,
  EXCUSED: <AlertCircle className="h-5 w-5 text-blue-600" />,
};

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, hasRole } = useAuth();

  const isLecturer = hasRole('LECTURER');
  const isStudent = hasRole('STUDENT');

  const [search, setSearch] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [page, setPage] = useState(1);

  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, string>>({});
  const [bulkStatus, setBulkStatus] = useState('PRESENT');
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const debouncedSearch = useDebounce(search, 400);

  const { data: coursesRes } = useQuery({
    queryKey: ['courses-list'],
    queryFn: () => courseService.getAll({ limit: 200 }),
  });

  const { data: schedulesRes } = useQuery({
    queryKey: ['schedules-list', selectedCourseId],
    queryFn: () => scheduleService.getAll({ courseId: selectedCourseId || undefined, limit: 50 }),
    enabled: !!selectedCourseId,
  });

  const courses = coursesRes?.data ?? [];
  const schedules = schedulesRes?.data ?? [];

  const attendanceQueryKey = isStudent
    ? ['my-attendance', debouncedSearch, page]
    : ['attendance', debouncedSearch, selectedCourseId, selectedDate, page];

  const attendanceQueryFn = isStudent
    ? () =>
        attendanceService.getAll({
          search: debouncedSearch || undefined,
          page,
          limit: ITEMS_PER_PAGE,
        })
    : () =>
        attendanceService.getAll({
          search: debouncedSearch || undefined,
          courseId: selectedCourseId || undefined,
          date: selectedDate || undefined,
          page,
          limit: ITEMS_PER_PAGE,
        });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: attendanceQueryKey,
    queryFn: attendanceQueryFn,
  });

  const attendanceList = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;
  const total = data?.meta?.total ?? 0;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCourseId, selectedDate]);

  const markAttendanceMutation = useMutation({
    mutationFn: (data: { courseId: string; date: string; records: { studentId: string; status: string }[] }) =>
      attendanceService.markAttendance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['my-attendance'] });
      toast({ title: 'Success', description: 'Attendance marked successfully', variant: 'success' });
      setAttendanceRecords({});
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to mark attendance', variant: 'destructive' });
    },
  });

  const loadReport = async () => {
    try {
      const res = await attendanceService.getAttendanceReport({
        courseId: selectedCourseId || undefined,
        studentId: isStudent ? user?.student?.id || user?.id : undefined,
      });
      setReportData(res.data || res);
      setReportDialogOpen(true);
    } catch {
      toast({ title: 'Error', description: 'Failed to load attendance report', variant: 'destructive' });
    }
  };

  const setStudentAttendance = (studentId: string, status: string) => {
    setAttendanceRecords((prev) => ({ ...prev, [studentId]: status }));
  };

  const applyBulkStatus = () => {
    const updated: Record<string, string> = {};
    Object.keys(attendanceRecords).forEach((id) => {
      updated[id] = bulkStatus;
    });
    setAttendanceRecords(updated);
  };

  const submitAttendance = () => {
    const records = Object.entries(attendanceRecords).map(([studentId, status]) => ({
      studentId,
      status,
    }));
    if (records.length === 0) {
      toast({ title: 'Error', description: 'No attendance records to submit', variant: 'destructive' });
      return;
    }
    markAttendanceMutation.mutate({
      courseId: selectedCourseId,
      date: selectedDate,
      records,
    });
  };

  const getAttendancePercentage = (records: any[]) => {
    if (!records || records.length === 0) return 0;
    const present = records.filter((r) => r.status === 'PRESENT').length;
    return Math.round((present / records.length) * 100);
  };

  return (
    <div>
      <PageHeader
        title="Attendance"
        description={
          isLecturer ? 'Mark and manage attendance for your classes' :
          isStudent ? 'View your attendance records' :
          'Manage attendance records'
        }
      >
        {!isStudent && (
          <Button variant="outline" onClick={loadReport}>
            <Download className="h-4 w-4 mr-2" />
            Report
          </Button>
        )}
      </PageHeader>

      {isLecturer && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Mark Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="space-y-1">
                <Label>Course</Label>
                <Select value={selectedCourseId} onValueChange={(v) => { setSelectedCourseId(v); setSelectedScheduleId(''); }}>
                  <SelectTrigger className="w-60">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Schedule</Label>
                <Select value={selectedScheduleId} onValueChange={setSelectedScheduleId}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    {schedules.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.weekday} {s.startTime?.slice(0, 5)} - {s.endTime?.slice(0, 5)} ({s.classroom})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Date</Label>
                <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-44" />
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4 p-3 bg-muted rounded-md">
              <Label className="text-sm">Bulk Action:</Label>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger className="w-36 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ATTENDANCE_STATUS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={applyBulkStatus}>Apply to All</Button>
              <div className="ml-auto">
                <Button size="sm" onClick={submitAttendance} disabled={markAttendanceMutation.isPending || !selectedCourseId}>
                  {markAttendanceMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Attendance
                </Button>
              </div>
            </div>

            {selectedCourseId ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Student Number</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.students || [{ id: '1', firstName: 'Sample', lastName: 'Student', studentNumber: 'STU001' }]).map((student: any) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell>{student.studentNumber || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {Object.entries(ATTENDANCE_STATUS).map(([key, label]) => (
                              <Button
                                key={key}
                                variant={attendanceRecords[student.id] === key ? 'default' : 'outline'}
                                size="sm"
                                className={cn(
                                  'h-8',
                                  attendanceRecords[student.id] === key && key === 'PRESENT' && 'bg-green-600',
                                  attendanceRecords[student.id] === key && key === 'ABSENT' && 'bg-red-600',
                                  attendanceRecords[student.id] === key && key === 'LATE' && 'bg-yellow-600',
                                  attendanceRecords[student.id] === key && key === 'EXCUSED' && 'bg-blue-600',
                                )}
                                onClick={() => setStudentAttendance(student.id, key)}
                              >
                                {label}
                              </Button>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <CalendarCheck className="h-8 w-8 mx-auto mb-2" />
                <p>Select a course and schedule to start marking attendance</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!isLecturer && (
        <Tabs defaultValue="records" className="space-y-4">
          <TabsList>
            <TabsTrigger value="records">Attendance Records</TabsTrigger>
            {isStudent && <TabsTrigger value="report">Report</TabsTrigger>}
          </TabsList>

          <TabsContent value="records">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search attendance..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {!isStudent && (
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="All Courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Courses</SelectItem>
                    {courses.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {!isStudent && <TableHead>Student</TableHead>}
                    <TableHead>Course</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: isStudent ? 3 : 4 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : isError ? (
                    <TableRow>
                      <TableCell colSpan={isStudent ? 3 : 4} className="h-48 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <p>Error loading attendance</p>
                          <p className="text-sm">{(error as any)?.response?.data?.message || 'Something went wrong'}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : attendanceList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isStudent ? 3 : 4} className="h-48 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <CalendarCheck className="h-8 w-8 text-muted-foreground/50" />
                          <p>No attendance records found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    attendanceList.map((record: any) => (
                      <TableRow key={record.id}>
                        {!isStudent && (
                          <TableCell className="font-medium">
                            {record.student?.firstName} {record.student?.lastName}
                          </TableCell>
                        )}
                        <TableCell>{record.course?.code || record.courseCode || 'N/A'}</TableCell>
                        <TableCell>{formatDate(record.date || record.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {STATUS_ICONS[record.status || record.attendanceStatus]}
                            <span className="text-sm font-medium">{record.status || record.attendanceStatus}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {!isLoading && total > 0 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const start = Math.max(1, page - 2);
                    const pageNum = start + i;
                    if (pageNum > totalPages) return null;
                    return (
                      <Button key={pageNum} variant={page === pageNum ? 'default' : 'outline'} size="icon" className="h-8 w-8" onClick={() => setPage(pageNum)}>
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {isStudent && (
            <TabsContent value="report">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Attendance Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button onClick={loadReport}>
                    <Download className="h-4 w-4 mr-2" />
                    Load Report
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      )}

      {isLecturer && (
        <div className="flex flex-col sm:flex-row gap-4 mb-6 mt-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      )}

      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Attendance Report</DialogTitle>
            <DialogDescription>Attendance summary and statistics</DialogDescription>
          </DialogHeader>
          {reportData ? (
            <div className="space-y-6">
              {reportData.summary && (
                <div className="grid grid-cols-4 gap-4">
                  {Object.entries(ATTENDANCE_STATUS).map(([key, label]) => (
                    <div key={key} className="text-center p-3 border rounded-md">
                      <p className="text-2xl font-bold">{reportData.summary[key] || 0}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {getAttendancePercentage(reportData.records || reportData.data || [])}%
                </p>
                <p className="text-sm text-muted-foreground">Overall Attendance Rate</p>
              </div>

              {(reportData.records || reportData.data) && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Present</TableHead>
                      <TableHead>Absent</TableHead>
                      <TableHead>Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(reportData.records || reportData.data || []).slice(0, 10).map((item: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{item.student?.firstName} {item.student?.lastName}</TableCell>
                        <TableCell>{item.course?.code || item.courseCode}</TableCell>
                        <TableCell>{item.present || item.PRESENT || 0}</TableCell>
                        <TableCell>{item.absent || item.ABSENT || 0}</TableCell>
                        <TableCell>{item.percentage || item.attendanceRate || 0}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Loading report...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
