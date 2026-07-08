'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { paymentService } from '@/services/payment.service';
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
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/context/AuthContext';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';
import { PAYMENT_STATUS, PAYMENT_TYPES } from '@/lib/constants';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  DollarSign,
  Download,
  FileText,
  Receipt,
} from 'lucide-react';

const paymentSchema = z.object({
  amount: z.coerce.number().min(1, 'Amount is required'),
  method: z.string().min(1, 'Payment method is required'),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

const ITEMS_PER_PAGE = 10;

const PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER', 'CARD', 'CHECK', 'MOBILE_MONEY'];

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  const isStudent = hasRole('STUDENT');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [processingPayment, setProcessingPayment] = useState<any>(null);

  const debouncedSearch = useDebounce(search, 400);

  const queryKey = isStudent
    ? ['my-payments', debouncedSearch, page]
    : ['payments', debouncedSearch, statusFilter, typeFilter, page];

  const queryFn = isStudent
    ? () => paymentService.getAll({ search: debouncedSearch || undefined, page, limit: ITEMS_PER_PAGE })
    : () =>
        paymentService.getAll({
          search: debouncedSearch || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          type: typeFilter !== 'ALL' ? typeFilter : undefined,
          page,
          limit: ITEMS_PER_PAGE,
        });

  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn,
  });

  const payments = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;
  const total = data?.meta?.total ?? 0;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, typeFilter]);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: 0, method: '', transactionId: '', notes: '' },
  });

  const processMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PaymentFormData }) =>
      paymentService.processPayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['my-payments'] });
      toast({ title: 'Success', description: 'Payment recorded successfully', variant: 'success' });
      setPaymentDialogOpen(false);
      setProcessingPayment(null);
      form.reset();
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to process payment', variant: 'destructive' });
    },
  });

  const openViewDialog = (payment: any) => {
    setSelectedPayment(payment);
    setViewDialogOpen(true);
  };

  const openPaymentDialog = (payment: any) => {
    setProcessingPayment(payment);
    const due = payment.balance || payment.totalAmount - (payment.paidAmount || 0);
    form.reset({ amount: due > 0 ? due : 0, method: '', transactionId: '', notes: '' });
    setPaymentDialogOpen(true);
  };

  const handleDownload = async (id: string, type: 'invoice' | 'receipt') => {
    try {
      const blob = await paymentService.generateInvoice(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-${id.slice(0, 8)}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast({ title: 'Error', description: 'Failed to download document', variant: 'destructive' });
    }
  };

  const onSubmitPayment = (data: PaymentFormData) => {
    if (processingPayment) {
      processMutation.mutate({ id: processingPayment.id, data });
    }
  };

  return (
    <div>
      <PageHeader
        title={isStudent ? 'My Payments' : 'Payments'}
        description={isStudent ? 'View your payment records' : 'Manage payment records'}
      >
        {!isStudent && (
          <Button onClick={() => {}}>
            <DollarSign className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        )}
      </PageHeader>

      {!isStudent && (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by invoice or student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              {Object.values(PAYMENT_STATUS).map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {Object.values(PAYMENT_TYPES).map((t) => (
                <SelectItem key={t} value={t}>
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isStudent && (
        <div className="relative flex-1 max-w-sm mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search payments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              {!isStudent && <TableHead>Student</TableHead>}
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: isStudent ? 8 : 9 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={isStudent ? 8 : 9} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <p>Error loading payments</p>
                    <p className="text-sm">{(error as any)?.response?.data?.message || 'Something went wrong'}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isStudent ? 8 : 9} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <DollarSign className="h-8 w-8 text-muted-foreground/50" />
                    <p>No payments found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment: any) => {
                const amount = payment.totalAmount || payment.amount || 0;
                const paid = payment.paidAmount || 0;
                const balance = payment.balance || amount - paid;
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.invoiceNumber || payment.invoice || payment.id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    {!isStudent && (
                      <TableCell>
                        {payment.student?.firstName} {payment.student?.lastName}
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant="outline">{payment.type || payment.paymentType || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(amount)}</TableCell>
                    <TableCell>{formatCurrency(paid)}</TableCell>
                    <TableCell className={balance > 0 ? 'text-destructive font-medium' : ''}>
                      {formatCurrency(balance)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(payment.status)} variant="outline">
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{payment.dueDate ? formatDate(payment.dueDate) : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openViewDialog(payment)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(payment.status === 'PENDING' || payment.status === 'PARTIALLY') && !isStudent && (
                          <Button variant="ghost" size="icon" onClick={() => openPaymentDialog(payment)}>
                            <DollarSign className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleDownload(payment.id, 'invoice')}>
                          <FileText className="h-4 w-4" />
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

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>View payment information and history</DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Invoice #</p>
                  <p className="font-medium">
                    {selectedPayment.invoiceNumber || selectedPayment.invoice || selectedPayment.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedPayment.status)} variant="outline">
                    {selectedPayment.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{selectedPayment.type || selectedPayment.paymentType || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium">{formatCurrency(selectedPayment.totalAmount || selectedPayment.amount || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paid</p>
                  <p className="font-medium">{formatCurrency(selectedPayment.paidAmount || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className="font-medium">{(selectedPayment.balance || (selectedPayment.totalAmount || 0) - (selectedPayment.paidAmount || 0)) > 0 ? (
                    <span className="text-destructive">{formatCurrency(selectedPayment.balance || (selectedPayment.totalAmount || 0) - (selectedPayment.paidAmount || 0))}</span>
                  ) : (
                    formatCurrency(0)
                  )}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium">{selectedPayment.dueDate ? formatDate(selectedPayment.dueDate) : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Student</p>
                  <p className="font-medium">
                    {selectedPayment.student?.firstName} {selectedPayment.student?.lastName}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-2">Payment History</h4>
                {selectedPayment.transactions && selectedPayment.transactions.length > 0 ? (
                  <div className="space-y-2">
                    {selectedPayment.transactions.map((tx: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 border rounded-md text-sm">
                        <div>
                          <p className="font-medium">{formatCurrency(tx.amount)}</p>
                          <p className="text-xs text-muted-foreground">{tx.method} | {tx.transactionId || 'N/A'}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No transactions recorded</p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => handleDownload(selectedPayment.id, 'invoice')}>
                  <FileText className="h-4 w-4 mr-1" />
                  Invoice PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDownload(selectedPayment.id, 'receipt')}>
                  <Receipt className="h-4 w-4 mr-1" />
                  Receipt PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Enter payment details to process this invoice</DialogDescription>
          </DialogHeader>
          {processingPayment && (
            <div className="mb-4 p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">
                Invoice: {processingPayment.invoiceNumber || processingPayment.id.slice(0, 8)}
              </p>
              <p className="text-sm text-muted-foreground">
                Balance Due: {formatCurrency(processingPayment.balance || (processingPayment.totalAmount || 0) - (processingPayment.paidAmount || 0))}
              </p>
            </div>
          )}
          <form onSubmit={form.handleSubmit(onSubmitPayment)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input id="amount" type="number" min={1} step="0.01" {...form.register('amount', { valueAsNumber: true })} />
                {form.formState.errors.amount && (
                  <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="method">Payment Method *</Label>
                <Select
                  value={form.watch('method')}
                  onValueChange={(v) => form.setValue('method', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>{m.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.method && (
                  <p className="text-sm text-destructive">{form.formState.errors.method.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="transactionId">Transaction ID</Label>
                <Input id="transactionId" {...form.register('transactionId')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" {...form.register('notes')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={processMutation.isPending}>
                {processMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Process Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
