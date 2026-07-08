'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { gradeService } from '@/services/grade.service';
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
import { formatDate, getStatusColor } from '@/lib/utils';
import { GRADE_LETTERS } from '@/lib/constants';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  BookOpen,
  GraduationCap,
  FileSpreadsheet,
  Download,
} from 'lucide-react';

const gradeEntrySchema = z.object({
  midterm: z.coerce.number().min(0).max(100).optional(),
  final: z.coerce.number().min(0).max(100).optional(),
  assignment: z.coerce.number().min(0).max(100).optional(),
  attendance: z.coerce.number().min(0).max(100).optional(),
});

type GradeEntryFormData = z.infer<typeof gradeEntrySchema>;

const ITEMS_PER_PAGE = 10;

export default function GradesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, hasRole } = useAuth();

  const isLecturer = hasRole('LECTURER');
  const isStudent = hasRole('STUDENT');
  const isAdmin = hasRole('SUPER_ADMIN') || hasRole('REGISTRAR') || hasRole('DEPARTMENT_HEAD');

  const [search, setSearch] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [page, setPage] = useState(1);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [transcriptDialogOpen, setTranscriptDialogOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<any>(null);
  const [transcriptData, setTranscriptData] = useState<any>(null);

  const debouncedSearch = useDebounce(search, 400);

  const gradeQueryKey = isStudent
    ? ['my-grades']
    : ['grades', debouncedSearch, selectedCourseId, page];

  const gradeQueryFn = isStudent
    ? () => gradeService.getAll({ studentId: user?.student?.id || user?.id, limit: 200 })
    : () =>
        gradeService.getAll({
          search: debouncedSearch || undefined,
          courseId: selectedCourseId || undefined,
          page,
          limit: ITEMS_PER_PAGE,
        });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: gradeQueryKey,
    queryFn: gradeQueryFn,
  });

  const { data: coursesRes } = useQuery({
    queryKey: ['courses-list'],
    queryFn: () => courseService.getAll({ limit: 200 }),
  });

  const courses = coursesRes?.data ?? [];
  const grades = data?.data ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;
  const total = data?.meta?.total ?? 0;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedCourseId]);

  const form = useForm<GradeEntryFormData>({
    resolver: zodResolver(gradeEntrySchema),
    defaultValues: { midterm: 0, final: 0, assignment: 0, attendance: 0 },
  });

  const gradeMutation = useMutation({
    mutationFn: ({ id, data }: { id?: string; data: any }) =>
      id ? gradeService.update(id, data) : gradeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      queryClient.invalidateQueries({ queryKey: ['my-grades'] });
      toast({ title: 'Success', description: 'Grade saved successfully', variant: 'success' });
      setGradeDialogOpen(false);
      setEditingGrade(null);
      form.reset();
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to save grade', variant: 'destructive' });
    },
  });

  const openGradeDialog = (grade?: any) => {
    if (grade) {
      setEditingGrade(grade);
      form.reset({
        midterm: grade.midterm || 0,
        final: grade.final || 0,
        assignment: grade.assignment || 0,
        attendance: grade.attendance || 0,
      });
    } else {
      setEditingGrade(null);
      form.reset({ midterm: 0, final: 0, assignment: 0, attendance: 0 });
    }
    setGradeDialogOpen(true);
  };

  const openTranscript = async () => {
    try {
      const studentId = user?.student?.id || user?.id;
      const res = await gradeService.getTranscript(studentId);
      setTranscriptData(res.data);
      setTranscriptDialogOpen(true);
    } catch {
      toast({ title: 'Error', description: 'Failed to load transcript', variant: 'destructive' });
    }
  };

  const onSubmitGrade = (data: GradeEntryFormData) => {
    const payload: any = { ...data };
    if (editingGrade) {
      gradeMutation.mutate({ id: editingGrade.id, data: payload });
    } else {
      gradeMutation.mutate({ data: payload });
    }
  };

  const calculateTotal = (grade: any) => {
    const mid = grade.midterm || 0;
    const fin = grade.final || 0;
    const asgn = grade.assignment || 0;
    const att = grade.attendance || 0;
    return Math.round((mid * 0.3) + (fin * 0.4) + (asgn * 0.2) + (att * 0.1));
  };

  const getGradeLetter = (total: number): string => {
    if (total >= 80) return 'A';
    if (total >= 70) return 'B';
    if (total >= 60) return 'C';
    if (total >= 50) return 'D';
    return 'F';
  };

  const getGradePoint = (letter: string): number => {
    const points: Record<string, number> = { A: 4.0, B: 3.0, C: 2.0, D: 1.0, F: 0.0 };
    return points[letter] || 0;
  };

  return (
    <div>
      <PageHeader
        title="Grades"
        description={
          isLecturer ? 'Enter and manage grades for your courses' :
          isStudent ? 'View your grades' :
          'Manage all grades'
        }
      >
        {isStudent && (
          <Button onClick={openTranscript}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            View Transcript
          </Button>
        )}
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {!isStudent && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student or course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
        {!isStudent && (
          <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Courses</SelectItem>
              {courses.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {isLecturer && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Quick Grade Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger className="w-60">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Select a course to view enrolled students and enter grades
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {!isStudent && <TableHead>Student</TableHead>}
              <TableHead>Course</TableHead>
              <TableHead>Midterm</TableHead>
              <TableHead>Final</TableHead>
              <TableHead>Assignment</TableHead>
              <TableHead>Attendance</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>GPA</TableHead>
              {(isLecturer || isAdmin) && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: isStudent ? 8 : 10 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={isStudent ? 8 : 10} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <p>Error loading grades</p>
                    <p className="text-sm">{(error as any)?.response?.data?.message || 'Something went wrong'}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : grades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isStudent ? 8 : 10} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <GraduationCap className="h-8 w-8 text-muted-foreground/50" />
                    <p>No grades found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              grades.map((grade: any) => {
                const total = calculateTotal(grade);
                const letter = getGradeLetter(total);
                const gpa = getGradePoint(letter);
                const showActions = (isLecturer || isAdmin) && !isStudent;
                return (
                  <TableRow key={grade.id}>
                    {!isStudent && (
                      <TableCell className="font-medium">
                        {grade.student?.firstName} {grade.student?.lastName}
                      </TableCell>
                    )}
                    <TableCell>{grade.course?.code || grade.courseCode || grade.course?.name || 'N/A'}</TableCell>
                    <TableCell>{grade.midterm ?? 'N/A'}</TableCell>
                    <TableCell>{grade.final ?? 'N/A'}</TableCell>
                    <TableCell>{grade.assignment ?? 'N/A'}</TableCell>
                    <TableCell>{grade.attendance ?? 'N/A'}</TableCell>
                    <TableCell className="font-medium">{total}</TableCell>
                    <TableCell>
                      <Badge variant={letter === 'F' ? 'destructive' : 'default'}>{letter}</Badge>
                    </TableCell>
                    <TableCell>{gpa.toFixed(1)}</TableCell>
                    {showActions && (
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openGradeDialog(grade)}>
                          Edit
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && total > 0 && !isStudent && (
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

      <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGrade ? 'Edit Grade' : 'Enter Grade'}</DialogTitle>
            <DialogDescription>Enter grade components for this student</DialogDescription>
          </DialogHeader>
          {editingGrade && (
            <div className="mb-4 p-3 bg-muted rounded-md text-sm">
              <p className="font-medium">
                {editingGrade.student?.firstName} {editingGrade.student?.lastName} - {editingGrade.course?.code || editingGrade.courseCode}
              </p>
            </div>
          )}
          <form onSubmit={form.handleSubmit(onSubmitGrade)}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="midterm">Midterm (30%)</Label>
                <Input id="midterm" type="number" min={0} max={100} {...form.register('midterm', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="final">Final (40%)</Label>
                <Input id="final" type="number" min={0} max={100} {...form.register('final', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignment">Assignment (20%)</Label>
                <Input id="assignment" type="number" min={0} max={100} {...form.register('assignment', { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attendance">Attendance (10%)</Label>
                <Input id="attendance" type="number" min={0} max={100} {...form.register('attendance', { valueAsNumber: true })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGradeDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={gradeMutation.isPending}>
                {gradeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Grade
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={transcriptDialogOpen} onOpenChange={setTranscriptDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Academic Transcript</DialogTitle>
            <DialogDescription>Your complete academic record</DialogDescription>
          </DialogHeader>
          {transcriptData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Student Name</p>
                  <p className="font-medium">{transcriptData.student?.firstName} {transcriptData.student?.lastName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Student Number</p>
                  <p className="font-medium">{transcriptData.student?.studentNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Program</p>
                  <p className="font-medium">{transcriptData.student?.program?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cumulative GPA</p>
                  <p className="font-medium text-lg">{transcriptData.cumulativeGPA || transcriptData.gpa || 'N/A'}</p>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>GPA</TableHead>
                    <TableHead>Semester</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(transcriptData.grades || transcriptData.courses || []).map((item: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{item.course?.code || item.courseCode || item.course?.name}</TableCell>
                      <TableCell>{item.course?.credits || item.credits || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={item.letter === 'F' ? 'destructive' : 'default'}>{item.letter || item.grade}</Badge>
                      </TableCell>
                      <TableCell>{item.gpa || item.gradePoint || '-'}</TableCell>
                      <TableCell>{item.semester || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-end">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Loading transcript...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
