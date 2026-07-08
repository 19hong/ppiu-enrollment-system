'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationService } from '@/services/application.service';
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
import { APPLICATION_STATUS } from '@/lib/constants';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const statusActions: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Review', color: 'bg-yellow-100 text-yellow-800' },
  REVIEWED: { label: 'Accept', color: 'bg-green-100 text-green-800' },
  ACCEPTED: { label: 'Accepted', color: '' },
  REJECTED: { label: 'Rejected', color: '' },
  WAITLISTED: { label: 'Waitlisted', color: '' },
};

export default function AdmissionsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);

  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['applications', debouncedSearch, statusFilter, page],
    queryFn: () =>
      applicationService.getAll({
        search: debouncedSearch || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        page,
        limit: ITEMS_PER_PAGE,
      }),
  });

  const applications = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;
  const total = data?.meta?.total ?? 0;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const statusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      applicationService.updateStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast({ title: 'Success', description: 'Application status updated', variant: 'success' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to update status', variant: 'destructive' });
    },
  });

  const openViewDialog = (app: any) => {
    setSelectedApp(app);
    setViewDialogOpen(true);
  };

  const handleStatusUpdate = (id: string, status: string) => {
    statusMutation.mutate({ id, status });
  };

  return (
    <div>
      <PageHeader title="Admissions" description="Manage student applications">
        <Button onClick={() => {}}>
          <FileText className="h-4 w-4 mr-2" />
          Export
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by applicant name or email..."
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
            {Object.values(APPLICATION_STATUS).map((s) => (
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
              <TableHead>Applicant Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <p>Error loading applications</p>
                    <p className="text-sm">{(error as any)?.response?.data?.message || 'Something went wrong'}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-8 w-8 text-muted-foreground/50" />
                    <p>No applications found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              applications.map((app: any) => (
                <TableRow key={app.id} className="cursor-pointer" onClick={() => openViewDialog(app)}>
                  <TableCell className="font-medium">
                    {app.firstName} {app.lastName}
                  </TableCell>
                  <TableCell>{app.email}</TableCell>
                  <TableCell>{app.program?.name || app.programName || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(app.status)} variant="outline">
                      {app.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(app.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openViewDialog(app)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        View
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Review application information and take action
            </DialogDescription>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedApp.firstName} {selectedApp.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedApp.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedApp.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Program</p>
                  <p className="font-medium">{selectedApp.program?.name || selectedApp.programName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedApp.status)} variant="outline">
                    {selectedApp.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Applied</p>
                  <p className="font-medium">{formatDate(selectedApp.createdAt)}</p>
                </div>
              </div>

              {selectedApp.documents && selectedApp.documents.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Documents</h4>
                  <div className="space-y-2">
                    {selectedApp.documents.map((doc: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{doc.name || doc.type || `Document ${i + 1}`}</span>
                        </div>
                        {doc.url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={doc.url} target="_blank" rel="noopener noreferrer">View</a>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm font-semibold mb-3">Actions</p>
                <div className="flex flex-wrap gap-2">
                  {selectedApp.status === 'PENDING' && (
                    <Button
                      onClick={() => handleStatusUpdate(selectedApp.id, 'REVIEWED')}
                      disabled={statusMutation.isPending}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Mark Reviewed
                    </Button>
                  )}
                  {(selectedApp.status === 'PENDING' || selectedApp.status === 'REVIEWED' || selectedApp.status === 'WAITLISTED') && (
                    <>
                      <Button
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleStatusUpdate(selectedApp.id, 'ACCEPTED')}
                        disabled={statusMutation.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleStatusUpdate(selectedApp.id, 'REJECTED')}
                        disabled={statusMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleStatusUpdate(selectedApp.id, 'WAITLISTED')}
                        disabled={statusMutation.isPending}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Waitlist
                      </Button>
                    </>
                  )}
                  {statusMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
