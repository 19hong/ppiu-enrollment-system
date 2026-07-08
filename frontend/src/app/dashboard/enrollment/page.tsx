'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enrollmentService } from '@/services/enrollment.service';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDate, getStatusColor } from '@/lib/utils';
import { ENROLLMENT_STATUS } from '@/lib/constants';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  Loader2,
  BookOpen,
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export default function EnrollmentPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['enrollments', debouncedSearch, statusFilter, page],
    queryFn: () =>
      enrollmentService.getAll({
        search: debouncedSearch || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        page,
        limit: ITEMS_PER_PAGE,
      }),
  });

  const enrollments = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;
  const total = data?.meta?.total ?? 0;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const approveMutation = useMutation({
    mutationFn: (id: string) => enrollmentService.updateStatus(id, 'APPROVED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      toast({ title: 'Success', description: 'Enrollment approved', variant: 'success' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to approve', variant: 'destructive' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => enrollmentService.updateStatus(id, 'REJECTED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      toast({ title: 'Success', description: 'Enrollment rejected', variant: 'success' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to reject', variant: 'destructive' });
    },
  });

  const openViewDialog = (enr: any) => {
    setSelectedEnrollment(enr);
    setViewDialogOpen(true);
  };

  return (
    <div>
      <PageHeader title="Enrollments" description="Manage course enrollments">
        <Button onClick={() => {}}>
          <BookOpen className="h-4 w-4 mr-2" />
          New Enrollment
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by enrollment number or student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {Object.values(ENROLLMENT_STATUS).map((s) => (
              <SelectItem key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Enrollment #</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Courses</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
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
                    <p>Error loading enrollments</p>
                    <p className="text-sm">{(error as any)?.response?.data?.message || 'Something went wrong'}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : enrollments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <BookOpen className="h-8 w-8 text-muted-foreground/50" />
                    <p>No enrollments found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              enrollments.map((enr: any) => (
                <TableRow key={enr.id}>
                  <TableCell className="font-medium">{enr.enrollmentNumber || enr.id.slice(0, 8)}</TableCell>
                  <TableCell>
                    {enr.student?.firstName} {enr.student?.lastName}
                  </TableCell>
                  <TableCell>{enr.semester?.name || enr.semester || 'N/A'}</TableCell>
                  <TableCell>{enr.courses?.length || enr.courseCount || 0}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(enr.status)} variant="outline">
                      {enr.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(enr.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openViewDialog(enr)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {enr.status === 'PENDING' && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => approveMutation.mutate(enr.id)}
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => rejectMutation.mutate(enr.id)}
                            disabled={rejectMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
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
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const start = Math.max(1, page - 2);
              const pageNum = start + i;
              if (pageNum > totalPages) return null;
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enrollment Details</DialogTitle>
            <DialogDescription>
              Detailed information about this enrollment
            </DialogDescription>
          </DialogHeader>
          {selectedEnrollment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Enrollment #</p>
                  <p className="font-medium">{selectedEnrollment.enrollmentNumber || selectedEnrollment.id.slice(0, 8)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedEnrollment.status)} variant="outline">
                    {selectedEnrollment.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Student</p>
                  <p className="font-medium">
                    {selectedEnrollment.student?.firstName} {selectedEnrollment.student?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Semester</p>
                  <p className="font-medium">{selectedEnrollment.semester?.name || selectedEnrollment.semester || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDate(selectedEnrollment.createdAt)}</p>
                </div>
              </div>

              {selectedEnrollment.courses && selectedEnrollment.courses.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Courses ({selectedEnrollment.courses.length})</p>
                  <div className="space-y-1">
                    {selectedEnrollment.courses.map((course: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 border rounded-md text-sm">
                        <span className="font-medium">{course.code || course.courseCode}</span>
                        <span className="text-muted-foreground">{course.name || course.courseName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
