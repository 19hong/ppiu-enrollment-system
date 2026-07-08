'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { lecturerService } from '@/services/lecturer.service';
import { departmentService } from '@/services/department.service';
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
import { formatDate, getStatusColor } from '@/lib/utils';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Users,
  BookOpen,
  CalendarClock,
} from 'lucide-react';

const lecturerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  departmentId: z.string().min(1, 'Department is required'),
  specialization: z.string().optional(),
  createUser: z.boolean().optional(),
  password: z.string().optional(),
});

type LecturerFormData = z.infer<typeof lecturerSchema>;

const ITEMS_PER_PAGE = 10;

export default function LecturersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingLecturer, setEditingLecturer] = useState<any>(null);
  const [viewingLecturer, setViewingLecturer] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['lecturers', debouncedSearch, departmentFilter, page],
    queryFn: () =>
      lecturerService.getAll({
        search: debouncedSearch || undefined,
        departmentId: departmentFilter !== 'ALL' ? departmentFilter : undefined,
        page,
        limit: ITEMS_PER_PAGE,
      }),
  });

  const { data: departmentsRes } = useQuery({
    queryKey: ['departments-list'],
    queryFn: () => departmentService.getAll({ limit: 100 }),
  });

  const { data: lecturerCoursesRes } = useQuery({
    queryKey: ['lecturer-courses', viewingLecturer?.id],
    queryFn: () => lecturerService.getCourses(viewingLecturer?.id),
    enabled: !!viewingLecturer?.id,
  });

  const lecturers = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;
  const total = data?.meta?.total ?? 0;
  const departments = departmentsRes?.data ?? [];
  const lecturerCourses = lecturerCoursesRes?.data ?? [];
  const coursesList = lecturerCourses.map((lc: any) => lc.course || lc);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, departmentFilter]);

  const form = useForm<LecturerFormData>({
    resolver: zodResolver(lecturerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      departmentId: '',
      specialization: '',
      createUser: false,
      password: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: LecturerFormData) => lecturerService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecturers'] });
      toast({ title: 'Success', description: 'Lecturer created successfully', variant: 'success' });
      setDialogOpen(false);
      form.reset();
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to create lecturer', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: LecturerFormData }) =>
      lecturerService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecturers'] });
      toast({ title: 'Success', description: 'Lecturer updated successfully', variant: 'success' });
      setDialogOpen(false);
      setEditingLecturer(null);
      form.reset();
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to update lecturer', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => lecturerService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lecturers'] });
      toast({ title: 'Success', description: 'Lecturer deleted successfully', variant: 'success' });
      setDeleteDialogOpen(false);
      setDeletingId(null);
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to delete lecturer', variant: 'destructive' });
    },
  });

  const openAddDialog = () => {
    setEditingLecturer(null);
    form.reset({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      departmentId: '',
      specialization: '',
      createUser: false,
      password: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (lecturer: any) => {
    setEditingLecturer(lecturer);
    form.reset({
      firstName: lecturer.firstName || '',
      lastName: lecturer.lastName || '',
      email: lecturer.email || '',
      phone: lecturer.phone || '',
      departmentId: lecturer.departmentId || lecturer.department?.id || '',
      specialization: lecturer.specialization || '',
      createUser: false,
      password: '',
    });
    setDialogOpen(true);
  };

  const openViewDialog = (lecturer: any) => {
    setViewingLecturer(lecturer);
    setViewDialogOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const onSubmit = (data: LecturerFormData) => {
    if (editingLecturer) {
      const { createUser, password, ...rest } = data;
      updateMutation.mutate({ id: editingLecturer.id, data: rest });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <PageHeader title="Lecturers" description="Manage lecturer records">
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Lecturer
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Departments</SelectItem>
            {departments.map((d: any) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Specialization</TableHead>
              <TableHead>Courses</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <p>Error loading lecturers</p>
                    <p className="text-sm">{(error as any)?.response?.data?.message || 'Something went wrong'}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : lecturers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-8 w-8 text-muted-foreground/50" />
                    <p>No lecturers found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              lecturers.map((lecturer: any) => (
                <TableRow key={lecturer.id}>
                  <TableCell className="font-medium">
                    {lecturer.firstName} {lecturer.lastName}
                  </TableCell>
                  <TableCell>{lecturer.email}</TableCell>
                  <TableCell>{lecturer.department?.name || lecturer.departmentName || 'N/A'}</TableCell>
                  <TableCell>{lecturer.specialization || 'N/A'}</TableCell>
                  <TableCell>{lecturer._count?.courses || lecturer.courseCount || 0}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(lecturer.status || 'ACTIVE')} variant="outline">
                      {lecturer.status || 'ACTIVE'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openViewDialog(lecturer)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(lecturer)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(lecturer.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lecturer Details</DialogTitle>
            <DialogDescription>Detailed information about this lecturer</DialogDescription>
          </DialogHeader>
          {viewingLecturer && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{viewingLecturer.firstName} {viewingLecturer.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{viewingLecturer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{viewingLecturer.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{viewingLecturer.department?.name || viewingLecturer.departmentName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Specialization</p>
                  <p className="font-medium">{viewingLecturer.specialization || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(viewingLecturer.status || 'ACTIVE')} variant="outline">
                    {viewingLecturer.status || 'ACTIVE'}
                  </Badge>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Assigned Courses ({coursesList.length})
                </h4>
                {coursesList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No courses assigned</p>
                ) : (
                  <div className="space-y-1">
                    {coursesList.map((course: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 border rounded-md text-sm">
                        <span className="font-medium">{course.code || course.courseCode}</span>
                        <span className="text-muted-foreground">{course.name || course.courseName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {viewingLecturer.schedules && viewingLecturer.schedules.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" />
                    Schedule
                  </h4>
                  <div className="space-y-1">
                    {viewingLecturer.schedules.map((sched: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 border rounded-md text-sm">
                        <span className="font-medium">{sched.course?.code || sched.courseCode}</span>
                        <span className="text-muted-foreground">
                          {sched.weekday} {sched.startTime?.slice(0, 5)} - {sched.endTime?.slice(0, 5)}
                        </span>
                        <span className="text-muted-foreground">{sched.classroom}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingLecturer ? 'Edit Lecturer' : 'Add Lecturer'}</DialogTitle>
            <DialogDescription>
              {editingLecturer ? 'Update lecturer information' : 'Fill in the details to create a new lecturer'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" {...form.register('firstName')} />
                {form.formState.errors.firstName && (
                  <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" {...form.register('lastName')} />
                {form.formState.errors.lastName && (
                  <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" {...form.register('email')} />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...form.register('phone')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="departmentId">Department *</Label>
                <Select
                  value={form.watch('departmentId')}
                  onValueChange={(v) => form.setValue('departmentId', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.departmentId && (
                  <p className="text-sm text-destructive">{form.formState.errors.departmentId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Input id="specialization" {...form.register('specialization')} />
              </div>

              {!editingLecturer && (
                <>
                  <div className="flex items-center space-x-2 col-span-2">
                    <input
                      type="checkbox"
                      id="createUser"
                      {...form.register('createUser')}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="createUser" className="text-sm font-normal">
                      Create user account for this lecturer
                    </Label>
                  </div>
                  {form.watch('createUser') && (
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input id="password" type="password" {...form.register('password')} />
                      {form.formState.errors.password && (
                        <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingLecturer ? 'Update' : 'Create'}
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
              This will permanently delete this lecturer. This action cannot be undone.
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
