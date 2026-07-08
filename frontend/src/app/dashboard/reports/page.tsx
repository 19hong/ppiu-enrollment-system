'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services/report.service';
import { courseService } from '@/services/course.service';
import { departmentService } from '@/services/department.service';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/useToast';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Download,
  FileText,
  FileSpreadsheet,
  Loader2,
  Users,
  GraduationCap,
  DollarSign,
  CalendarCheck,
  BookOpen,
  Building2,
  BarChart3,
} from 'lucide-react';

const REPORT_TYPES = [
  { id: 'enrollment', label: 'Enrollment', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'student', label: 'Student', icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
  { id: 'finance', label: 'Finance', icon: DollarSign, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'grade', label: 'Grade', icon: GraduationCap, color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'department', label: 'Department', icon: Building2, color: 'text-red-600', bg: 'bg-red-50' },
];

export default function ReportsPage() {
  const { toast } = useToast();

  const [selectedType, setSelectedType] = useState('enrollment');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: coursesRes } = useQuery({
    queryKey: ['courses-list'],
    queryFn: () => courseService.getAll({ limit: 200 }),
  });

  const { data: departmentsRes } = useQuery({
    queryKey: ['departments-list'],
    queryFn: () => departmentService.getAll({ limit: 100 }),
  });

  const courses = coursesRes?.data ?? [];
  const departments = departmentsRes?.data ?? [];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setReportData(null);
    try {
      let res;
      const params: any = {};
      switch (selectedType) {
        case 'enrollment':
          params.departmentId = selectedDepartmentId || undefined;
          params.startDate = startDate || undefined;
          params.endDate = endDate || undefined;
          res = await reportService.getEnrollmentReport(params);
          break;
        case 'student':
          params.departmentId = selectedDepartmentId || undefined;
          res = await reportService.getStudentReport(params);
          break;
        case 'finance':
          params.startDate = startDate || undefined;
          params.endDate = endDate || undefined;
          res = await reportService.getPaymentReport(params);
          break;
        case 'attendance':
          params.courseId = selectedCourseId || undefined;
          params.departmentId = selectedDepartmentId || undefined;
          params.startDate = startDate || undefined;
          params.endDate = endDate || undefined;
          res = await reportService.getAttendanceReport(params);
          break;
        case 'grade':
          params.courseId = selectedCourseId || undefined;
          params.academicYear = selectedSemester || undefined;
          res = await reportService.getGradeReport(params);
          break;
        case 'department':
          res = await reportService.getStudentReport({ departmentId: selectedDepartmentId || undefined });
          break;
      }
      setReportData(res.data || res);
      toast({ title: 'Success', description: 'Report generated successfully', variant: 'success' });
    } catch {
      toast({ title: 'Error', description: 'Failed to generate report', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (selectedCourseId) params.courseId = selectedCourseId;
      if (selectedDepartmentId) params.departmentId = selectedDepartmentId;

      const blob = await reportService.exportReport(selectedType, format, params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedType}-report.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast({ title: 'Success', description: `Report exported as ${format.toUpperCase()}`, variant: 'success' });
    } catch {
      toast({ title: 'Error', description: 'Failed to export report', variant: 'destructive' });
    }
  };

  const renderFilters = () => {
    const isFinance = selectedType === 'finance';
    const isAcademic = ['enrollment', 'attendance', 'grade'].includes(selectedType);

    return (
      <div className="flex flex-wrap gap-4 mb-6">
        {isFinance && (
          <>
            <div className="space-y-1">
              <Label className="text-xs">Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40 h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40 h-9" />
            </div>
          </>
        )}
        {isAcademic && (
          <>
            <div className="space-y-1">
              <Label className="text-xs">Course</Label>
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger className="w-44 h-9">
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Courses</SelectItem>
                  {courses.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.code} - {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedType === 'grade' && (
              <div className="space-y-1">
                <Label className="text-xs">Semester/Academic Year</Label>
                <Input
                  type="text"
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  placeholder="e.g. 2024-2025"
                  className="w-40 h-9"
                />
              </div>
            )}
          </>
        )}
        {['enrollment', 'student', 'attendance', 'department'].includes(selectedType) && (
          <div className="space-y-1">
            <Label className="text-xs">Department</Label>
            <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
              <SelectTrigger className="w-44 h-9">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Departments</SelectItem>
                {departments.map((d: any) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    );
  };

  const renderPreview = () => {
    if (!reportData) return null;

    const dataArray = Array.isArray(reportData) ? reportData : reportData.data || reportData.records || [];

    if (!dataArray || dataArray.length === 0) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          <BarChart3 className="h-8 w-8 mx-auto mb-2" />
          <p>No data available for this report</p>
        </div>
      );
    }

    const columns = Object.keys(dataArray[0]).filter((k) => !k.startsWith('_') && k !== 'id');
    const keys = columns.slice(0, 6);

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {keys.map((key) => (
                <TableHead key={key}>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataArray.slice(0, 20).map((row: any, i: number) => (
              <TableRow key={i}>
                {keys.map((key) => (
                  <TableCell key={key}>
                    {typeof row[key] === 'object'
                      ? row[key]?.name || row[key]?.code || JSON.stringify(row[key])
                      : typeof row[key] === 'number'
                      ? row[key] % 1 === 0
                        ? row[key]
                        : row[key].toFixed(2)
                      : String(row[key] || 'N/A')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {dataArray.length > 20 && (
          <div className="p-2 text-center text-sm text-muted-foreground border-t">
            Showing 20 of {dataArray.length} records
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <PageHeader title="Reports" description="Generate and export various reports">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('pdf')} disabled={!reportData}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => handleExport('excel')} disabled={!reportData}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {REPORT_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          return (
            <Card
              key={type.id}
              className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary' : ''}`}
              onClick={() => { setSelectedType(type.id); setReportData(null); }}
            >
              <CardContent className={`p-4 flex flex-col items-center gap-2 ${type.bg} rounded-lg`}>
                <Icon className={`h-8 w-8 ${type.color}`} />
                <p className="text-sm font-medium text-center">{type.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg capitalize">{selectedType} Report</CardTitle>
          <CardDescription>
            {selectedType === 'enrollment' && 'Enrollment statistics and trends'}
            {selectedType === 'student' && 'Student demographics and status breakdown'}
            {selectedType === 'finance' && 'Financial summary and payment analysis'}
            {selectedType === 'attendance' && 'Attendance rates and patterns'}
            {selectedType === 'grade' && 'Grade distribution and academic performance'}
            {selectedType === 'department' && 'Department-wise student and program statistics'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderFilters()}

          <div className="flex gap-2">
            <Button onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <BarChart3 className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {renderPreview()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
