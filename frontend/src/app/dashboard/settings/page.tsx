'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { settingService } from '@/services/setting.service';
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/context/AuthContext';
import {
  Loader2,
  Save,
  Building2,
  GraduationCap,
  Mail,
  Settings as SettingsIcon,
  Upload,
  Plus,
  Trash2,
} from 'lucide-react';

const generalSettingsSchema = z.object({
  universityName: z.string().min(1, 'University name is required'),
  universityCode: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().optional(),
});

const smtpSchema = z.object({
  host: z.string().min(1, 'SMTP host is required'),
  port: z.coerce.number().min(1, 'Port is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  fromAddress: z.string().email('Invalid email'),
  encryption: z.string().optional(),
});

type GeneralFormData = z.infer<typeof generalSettingsSchema>;
type SmtpFormData = z.infer<typeof smtpSchema>;

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const isSuperAdmin = hasRole('SUPER_ADMIN');

  const [activeTab, setActiveTab] = useState('general');

  const { data: settingsRes, isLoading, isError } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingService.getAll(),
  });

  const { data: academicYearsRes } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => settingService.getAcademicYears(),
  });

  const { data: semestersRes } = useQuery({
    queryKey: ['semesters'],
    queryFn: () => settingService.getSemesters(),
  });

  const settings = settingsRes?.data || settingsRes || {};
  const academicYears = academicYearsRes?.data || academicYearsRes || [];
  const semesters = semestersRes?.data || semestersRes || [];

  const generalForm = useForm<GeneralFormData>({
    resolver: zodResolver(generalSettingsSchema),
    values: {
      universityName: settings?.universityName || settings?.university_name || '',
      universityCode: settings?.universityCode || settings?.university_code || '',
      address: settings?.address || '',
      phone: settings?.phone || '',
      email: settings?.email || settings?.contactEmail || '',
      website: settings?.website || '',
    },
  });

  const smtpForm = useForm<SmtpFormData>({
    resolver: zodResolver(smtpSchema),
    values: {
      host: settings?.smtpHost || settings?.smtp_host || '',
      port: settings?.smtpPort || settings?.smtp_port || 587,
      username: settings?.smtpUsername || settings?.smtp_username || '',
      password: '',
      fromAddress: settings?.smtpFromAddress || settings?.smtp_from || '',
      encryption: settings?.smtpEncryption || settings?.smtp_encryption || 'tls',
    },
  });

  const [currentAcademicYear, setCurrentAcademicYear] = useState(settings?.currentAcademicYear || settings?.current_academic_year || '');
  const [newSemesterName, setNewSemesterName] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(settings?.logoUrl || settings?.logo || null);

  const updateGeneralMutation = useMutation({
    mutationFn: (data: GeneralFormData) => settingService.updateBulk(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({ title: 'Success', description: 'General settings saved', variant: 'success' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to save settings', variant: 'destructive' });
    },
  });

  const updateSmtpMutation = useMutation({
    mutationFn: (data: SmtpFormData) => settingService.updateBulk(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({ title: 'Success', description: 'SMTP settings saved', variant: 'success' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to save SMTP settings', variant: 'destructive' });
    },
  });

  const updateAcademicYearMutation = useMutation({
    mutationFn: (value: string) => settingService.update('currentAcademicYear', value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
      toast({ title: 'Success', description: 'Academic year updated', variant: 'success' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to update academic year', variant: 'destructive' });
    },
  });

  const addSemesterMutation = useMutation({
    mutationFn: (name: string) => settingService.updateBulk({ semesters: [...semesters, { name, isActive: false }] }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['semesters'] });
      toast({ title: 'Success', description: 'Semester added', variant: 'success' });
      setNewSemesterName('');
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.response?.data?.message || 'Failed to add semester', variant: 'destructive' });
    },
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSaveGeneral = (data: GeneralFormData) => {
    updateGeneralMutation.mutate({ ...data, logoUrl: logoPreview || undefined } as any);
  };

  const onSaveSmtp = (data: SmtpFormData) => {
    updateSmtpMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Settings" description="Configure system settings" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <PageHeader title="Settings" description="Configure system settings" />
        <div className="py-8 text-center text-muted-foreground">
          <p>Error loading settings</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Settings" description="Configure system settings" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="general">
            <Building2 className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="academic">
            <GraduationCap className="h-4 w-4 mr-2" />
            Academic
          </TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="smtp">
              <Mail className="h-4 w-4 mr-2" />
              SMTP
            </TabsTrigger>
          )}
          <TabsTrigger value="system">
            <SettingsIcon className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic institution information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={generalForm.handleSubmit(onSaveGeneral)}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>University Logo</Label>
                    <div className="flex items-center gap-4">
                      {logoPreview ? (
                        <div className="relative h-20 w-20 rounded-lg border overflow-hidden">
                          <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
                        </div>
                      ) : (
                        <div className="h-20 w-20 rounded-lg border flex items-center justify-center bg-muted">
                          <Building2 className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <Label htmlFor="logo-upload" className="cursor-pointer">
                          <div className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm hover:bg-muted">
                            <Upload className="h-4 w-4" />
                            Upload Logo
                          </div>
                          <Input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG. Max 2MB</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="universityName">University Name *</Label>
                    <Input id="universityName" {...generalForm.register('universityName')} />
                    {generalForm.formState.errors.universityName && (
                      <p className="text-sm text-destructive">{generalForm.formState.errors.universityName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="universityCode">University Code</Label>
                    <Input id="universityCode" {...generalForm.register('universityCode')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" {...generalForm.register('address')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" {...generalForm.register('phone')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...generalForm.register('email')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" {...generalForm.register('website')} />
                  </div>
                </div>
                <div className="mt-6">
                  <Button type="submit" disabled={updateGeneralMutation.isPending}>
                    {updateGeneralMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academic">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Academic Year</CardTitle>
                <CardDescription>Set the active academic year for the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1 max-w-xs">
                    <Select value={currentAcademicYear} onValueChange={setCurrentAcademicYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select academic year" />
                      </SelectTrigger>
                      <SelectContent>
                        {(academicYears.length > 0 ? academicYears : ['2023-2024', '2024-2025', '2025-2026']).map((year: any) => (
                          <SelectItem key={year.id || year.name || year} value={year.id || year.name || year}>
                            {year.name || year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => updateAcademicYearMutation.mutate(currentAcademicYear)}
                    disabled={updateAcademicYearMutation.isPending || !currentAcademicYear}
                  >
                    {updateAcademicYearMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Set Active Year
                  </Button>
                </div>
                {settings.currentAcademicYear && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Current active: <strong>{settings.currentAcademicYear}</strong>
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Semester Management</CardTitle>
                <CardDescription>Manage academic semesters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(semesters.length > 0 ? semesters : []).map((sem: any, i: number) => (
                    <div key={sem.id || i} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center gap-3">
                        <Badge variant={sem.isActive ? 'default' : 'outline'}>
                          {sem.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className="font-medium">{sem.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={sem.isActive}
                          onCheckedChange={() => {}}
                        />
                      </div>
                    </div>
                  ))}
                  {semesters.length === 0 && (
                    <p className="text-sm text-muted-foreground">No semesters configured</p>
                  )}

                  <Separator />

                  <div className="flex items-center gap-3">
                    <div className="flex-1 max-w-xs">
                      <Input
                        placeholder="New semester name..."
                        value={newSemesterName}
                        onChange={(e) => setNewSemesterName(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => addSemesterMutation.mutate(newSemesterName)}
                      disabled={addSemesterMutation.isPending || !newSemesterName}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Semester
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="smtp">
            <Card>
              <CardHeader>
                <CardTitle>SMTP Settings</CardTitle>
                <CardDescription>Configure email server settings for notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={smtpForm.handleSubmit(onSaveSmtp)}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="host">SMTP Host *</Label>
                      <Input id="host" {...smtpForm.register('host')} placeholder="smtp.gmail.com" />
                      {smtpForm.formState.errors.host && (
                        <p className="text-sm text-destructive">{smtpForm.formState.errors.host.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="port">Port *</Label>
                      <Input id="port" type="number" {...smtpForm.register('port', { valueAsNumber: true })} />
                      {smtpForm.formState.errors.port && (
                        <p className="text-sm text-destructive">{smtpForm.formState.errors.port.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username *</Label>
                      <Input id="username" {...smtpForm.register('username')} />
                      {smtpForm.formState.errors.username && (
                        <p className="text-sm text-destructive">{smtpForm.formState.errors.username.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input id="password" type="password" {...smtpForm.register('password')} placeholder="Leave blank to keep current" />
                      {smtpForm.formState.errors.password && (
                        <p className="text-sm text-destructive">{smtpForm.formState.errors.password.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fromAddress">From Address *</Label>
                      <Input id="fromAddress" type="email" {...smtpForm.register('fromAddress')} placeholder="noreply@university.edu" />
                      {smtpForm.formState.errors.fromAddress && (
                        <p className="text-sm text-destructive">{smtpForm.formState.errors.fromAddress.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="encryption">Encryption</Label>
                      <Select
                        value={smtpForm.watch('encryption')}
                        onValueChange={(v) => smtpForm.setValue('encryption', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select encryption" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tls">TLS</SelectItem>
                          <SelectItem value="ssl">SSL</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button type="submit" disabled={updateSmtpMutation.isPending}>
                      {updateSmtpMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <Save className="h-4 w-4 mr-2" />
                      Save SMTP Settings
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Preferences</CardTitle>
              <CardDescription>Configure system-wide preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Maintenance Mode</p>
                    <p className="text-sm text-muted-foreground">Disable access to non-admin users</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Automatic Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Send email notifications for system events</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Student Self-Registration</p>
                    <p className="text-sm text-muted-foreground">Allow students to register themselves</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Grace Period (days)</p>
                    <p className="text-sm text-muted-foreground">Days allowed for late enrollment</p>
                  </div>
                  <div className="w-24">
                    <Input type="number" defaultValue={7} min={0} />
                  </div>
                </div>
                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
