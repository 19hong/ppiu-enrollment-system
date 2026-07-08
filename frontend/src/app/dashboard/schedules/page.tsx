'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { scheduleService } from '@/services/schedule.service';
import { courseService } from '@/services/course.service';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { getStatusColor } from '@/lib/utils';
import { WEEKDAYS } from '@/lib/constants';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  Clock,
} from 'lucide-react';

const scheduleSchema = z.object({
  courseId: z.string().min(1, 'Course is required'),
  lecturerId: z.string().optional(),
  lecturerName: z.string().optional(),
  classroom: z.string().min(1, 'Classroom is required'),
  weekday: z.string().min(1, 'Weekday is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  semester: z.string().optional(),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

const ITEMS_PER_PAGE = 10;

export default function SchedulesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [weekdayFilter, setWeekdayFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['schedules', debouncedSearch, weekdayFilter, page],
    queryFn: () =>
      scheduleService.getAll({
        search: debouncedSearch || undefined,
        day: weekdayFilter !== 'ALL' ? weekdayFilter : undefined,
        page,
        limit: ITEMS_PER_PAGE,
      }),
  });

  const { data: coursesRes } = useQuery({
    queryKey: ['courses-list'],
    queryFn: () => courseService.getAll({ limit: 200 }),
  });

  const schedules = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;
  const total = data?.meta?.total ?? 0;
  const courses = coursesRes?.data ?? [];

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, weekdayFilter]);

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      courseId: '',
      lecturerId: '',
      lecturerName: '',
      classroom: '',
      weekday: '',
      startTime: '',
      endTime: '',
      semester: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ScheduleFormData) => scheduleService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast({ title: 'Success', description: 'Schedule created successfully', variant: 'success' });
      setDialogOpen(false);
      form.reset();
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to create schedule', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ScheduleFormData }) =>
      scheduleService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast({ title: 'Success', description: 'Schedule updated successfully', variant: 'success' });
      setDialogOpen(false);
      setEditingSchedule(null);
      form.reset();
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to update schedule', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => scheduleService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast({ title: 'Success', description: 'Schedule deleted successfully', variant: 'success' });
      setDeleteDialogOpen(false);
      setDeletingId(null);
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to delete schedule', variant: 'destructive' });
    },
  });

  const openAddDialog = () => {
    setEditingSchedule(null);
    form.reset({
      courseId: '',
      lecturerId: '',
      lecturerName: '',
      classroom: '',
      weekday: '',
      startTime: '',
      endTime: '',
      semester: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (schedule: any) => {
    setEditingSchedule(schedule);
    form.reset({
      courseId: schedule.courseId || schedule.course?.id || '',
      lecturerId: schedule.lecturerId || '',
      lecturerName: schedule.lecturerName || schedule.lecturer?.name || '',
      classroom: schedule.classroom || '',
      weekday: schedule.weekday || '',
      startTime: schedule.startTime || '',
      endTime: schedule.endTime || '',
      semester: schedule.semester || '',
    });
    setDialogOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const onSubmit = (data: ScheduleFormData) => {
    if (editingSchedule) {
      updateMutation.mutate({ id: editingSchedule.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <PageHeader title="Schedules" description="Manage class schedules">
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Schedule
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search schedules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={weekdayFilter} onValueChange={setWeekdayFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Weekday" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Days</SelectItem>
            {Object.entries(WEEKDAYS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Lecturer</TableHead>
              <TableHead>Classroom</TableHead>
              <TableHead>Weekday</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={8} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <p>Error loading schedules</p>
                    <p className="text-sm">{(error as any)?.response?.data?.message || 'Something went wrong'}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : schedules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Calendar className="h-8 w-8 text-muted-foreground/50" />
                    <p>No schedules found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              schedules.map((schedule: any) => {
                const weekdayLabel = WEEKDAYS[schedule.weekday as keyof typeof WEEKDAYS] || schedule.weekday;
                const timeStr = schedule.startTime
                  ? `${schedule.startTime.slice(0, 5)} - ${schedule.endTime?.slice(0, 5) || ''}`
                  : 'N/A';
                return (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">
                      {schedule.course?.code || schedule.courseCode || 'N/A'}
                    </TableCell>
                    <TableCell>{schedule.lecturerName || schedule.lecturer?.name || 'N/A'}</TableCell>
                    <TableCell>{schedule.classroom}</TableCell>
                    <TableCell>{weekdayLabel}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{timeStr}</span>
                      </div>
                    </TableCell>
                    <TableCell>{schedule.semester || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(schedule.status || 'ACTIVE')} variant="outline">
                        {schedule.status || 'ACTIVE'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(schedule)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(schedule.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSchedule ? 'Edit Schedule' : 'Add Schedule'}</DialogTitle>
            <DialogDescription>
              {editingSchedule ? 'Update schedule information' : 'Fill in the details to create a new schedule'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="courseId">Course *</Label>
                <Select
                  value={form.watch('courseId')}
                  onValueChange={(v) => form.setValue('courseId', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.code} - {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.courseId && (
                  <p className="text-sm text-destructive">{form.formState.errors.courseId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lecturerName">Lecturer Name</Label>
                <Input id="lecturerName" {...form.register('lecturerName')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="classroom">Classroom *</Label>
                <Input id="classroom" {...form.register('classroom')} />
                {form.formState.errors.classroom && (
                  <p className="text-sm text-destructive">{form.formState.errors.classroom.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Input id="semester" {...form.register('semester')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weekday">Weekday *</Label>
                <Select
                  value={form.watch('weekday')}
                  onValueChange={(v) => form.setValue('weekday', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(WEEKDAYS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.weekday && (
                  <p className="text-sm text-destructive">{form.formState.errors.weekday.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input id="startTime" type="time" {...form.register('startTime')} />
                {form.formState.errors.startTime && (
                  <p className="text-sm text-destructive">{form.formState.errors.startTime.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <Input id="endTime" type="time" {...form.register('endTime')} />
                {form.formState.errors.endTime && (
                  <p className="text-sm text-destructive">{form.formState.errors.endTime.message}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingSchedule ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this schedule. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
