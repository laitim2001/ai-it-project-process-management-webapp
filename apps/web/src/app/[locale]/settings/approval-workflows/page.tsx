/**
 * @fileoverview Approval Workflows Page - 審批流程配置頁面（FEAT-014）
 *
 * @description
 * Admin 專用的審批流程配置頁：建立 / 編輯 / 啟用切換流程，並維護其有序步驟
 * （新增 / 編輯 / 移除 / 拖曳排序）。每步指定一個審批角色。
 *
 * @page /[locale]/settings/approval-workflows
 *
 * @permissions Admin only（procedure 為 adminProcedure；前端額外閘門）
 *
 * @related
 * - packages/api/src/routers/approvalWorkflow.ts
 * - apps/web/src/components/approval-workflow/ApprovalStepList.tsx
 *
 * @since FEAT-014 - 可配置序列審批流程
 */

'use client';

import { Plus, Pencil, Power, AlertCircle, Home, Star } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { ApprovalStepList } from '@/components/approval-workflow/ApprovalStepList';
import type {
  ApprovalStepData,
  ApprovalWorkflowData,
} from '@/components/approval-workflow/types';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
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
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingButton } from '@/components/ui/loading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Link } from '@/i18n/routing';
import { api } from '@/lib/trpc';

export default function ApprovalWorkflowsPage() {
  const t = useTranslations('approvalWorkflows');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const utils = api.useUtils();

  const isAdmin = session?.user?.role?.name === 'Admin';

  // 流程建立/編輯 Dialog
  const [workflowDialog, setWorkflowDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    id?: string;
  }>({ open: false, mode: 'create' });
  const [workflowForm, setWorkflowForm] = useState({ name: '', isDefault: false });

  // 步驟新增/編輯 Dialog
  const [stepDialog, setStepDialog] = useState<{
    open: boolean;
    mode: 'add' | 'edit';
    workflowId: string;
    stepId?: string;
  }>({ open: false, mode: 'add', workflowId: '' });
  const [stepForm, setStepForm] = useState({ roleId: '', name: '' });

  // 步驟刪除確認
  const [stepToDelete, setStepToDelete] = useState<string | null>(null);

  const { data: workflows, isLoading } = api.approvalWorkflow.list.useQuery(
    undefined,
    { enabled: isAdmin }
  );
  const { data: roles } = api.user.getRoles.useQuery(undefined, { enabled: isAdmin });

  const invalidate = () => utils.approvalWorkflow.list.invalidate();

  const onError = (error: { message: string }) =>
    toast({ title: t('messages.error'), description: error.message, variant: 'destructive' });

  const createMutation = api.approvalWorkflow.create.useMutation({
    onSuccess: () => {
      toast({ title: t('messages.workflowCreated'), variant: 'success' });
      setWorkflowDialog({ open: false, mode: 'create' });
      void invalidate();
    },
    onError,
  });

  const updateMutation = api.approvalWorkflow.update.useMutation({
    onSuccess: () => {
      toast({ title: t('messages.workflowUpdated'), variant: 'success' });
      setWorkflowDialog({ open: false, mode: 'create' });
      void invalidate();
    },
    onError,
  });

  const toggleActiveMutation = api.approvalWorkflow.toggleActive.useMutation({
    onSuccess: () => void invalidate(),
    onError,
  });

  const addStepMutation = api.approvalWorkflow.addStep.useMutation({
    onSuccess: () => {
      toast({ title: t('messages.stepAdded'), variant: 'success' });
      setStepDialog((s) => ({ ...s, open: false }));
      void invalidate();
    },
    onError,
  });

  const updateStepMutation = api.approvalWorkflow.updateStep.useMutation({
    onSuccess: () => {
      toast({ title: t('messages.stepUpdated'), variant: 'success' });
      setStepDialog((s) => ({ ...s, open: false }));
      void invalidate();
    },
    onError,
  });

  const removeStepMutation = api.approvalWorkflow.removeStep.useMutation({
    onSuccess: () => {
      toast({ title: t('messages.stepRemoved'), variant: 'success' });
      setStepToDelete(null);
      void invalidate();
    },
    onError,
  });

  const reorderStepsMutation = api.approvalWorkflow.reorderSteps.useMutation({
    onSuccess: () => void invalidate(),
    onError,
  });

  // === Handlers ===
  const openCreateWorkflow = () => {
    setWorkflowForm({ name: '', isDefault: false });
    setWorkflowDialog({ open: true, mode: 'create' });
  };

  const openEditWorkflow = (wf: ApprovalWorkflowData) => {
    setWorkflowForm({ name: wf.name, isDefault: wf.isDefault });
    setWorkflowDialog({ open: true, mode: 'edit', id: wf.id });
  };

  const submitWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflowForm.name.trim()) return;
    if (workflowDialog.mode === 'create') {
      createMutation.mutate({ name: workflowForm.name.trim(), isDefault: workflowForm.isDefault });
    } else if (workflowDialog.id) {
      updateMutation.mutate({
        id: workflowDialog.id,
        name: workflowForm.name.trim(),
        isDefault: workflowForm.isDefault,
      });
    }
  };

  const openAddStep = (workflowId: string) => {
    setStepForm({ roleId: '', name: '' });
    setStepDialog({ open: true, mode: 'add', workflowId });
  };

  const openEditStep = (workflowId: string, step: ApprovalStepData) => {
    setStepForm({ roleId: String(step.approverRoleId), name: step.name ?? '' });
    setStepDialog({ open: true, mode: 'edit', workflowId, stepId: step.id });
  };

  const submitStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stepForm.roleId) return;
    const roleId = Number(stepForm.roleId);
    const name = stepForm.name.trim() || undefined;
    if (stepDialog.mode === 'add') {
      addStepMutation.mutate({ workflowId: stepDialog.workflowId, approverRoleId: roleId, name });
    } else if (stepDialog.stepId) {
      updateStepMutation.mutate({ id: stepDialog.stepId, approverRoleId: roleId, name: name ?? null });
    }
  };

  const handleReorder = (workflowId: string, orderedStepIds: string[]) => {
    reorderStepsMutation.mutate({ workflowId, stepIds: orderedStepIds });
  };

  // === Render ===
  if (status !== 'loading' && !isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="text-muted-foreground">{tCommon('errors.noPermission')}</p>
              <Link href="/dashboard">
                <Button variant="outline">{tCommon('actions.goToDashboard')}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const workflowList = (workflows ?? []) as unknown as ApprovalWorkflowData[];

  return (
    <DashboardLayout>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">
                <Home className="h-4 w-4" />
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/settings">{tNav('menu.settings')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbPage>{t('title')}</BreadcrumbPage>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="mt-1 text-muted-foreground">{t('description')}</p>
        </div>
        <Button onClick={openCreateWorkflow}>
          <Plus className="mr-2 h-4 w-4" />
          {t('actions.createWorkflow')}
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      )}

      {!isLoading && workflowList.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium text-muted-foreground">{t('list.empty')}</p>
            <p className="text-sm text-muted-foreground">{t('list.emptyHint')}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {workflowList.map((wf) => (
          <Card key={wf.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    {wf.name}
                    <Badge variant={wf.isActive ? 'default' : 'secondary'}>
                      {wf.isActive ? t('status.active') : t('status.inactive')}
                    </Badge>
                    {wf.isDefault && (
                      <Badge variant="outline" className="gap-1">
                        <Star className="h-3 w-3" />
                        {t('status.default')}
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {t('list.boundCount', { count: wf._count.proposals })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openEditWorkflow(wf)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={wf.isActive ? 'ghost' : 'default'}
                    size="sm"
                    onClick={() => toggleActiveMutation.mutate({ id: wf.id })}
                    disabled={toggleActiveMutation.isPending}
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ApprovalStepList
                steps={wf.steps}
                onAddStep={() => openAddStep(wf.id)}
                onEditStep={(step) => openEditStep(wf.id, step)}
                onRemoveStep={(stepId) => setStepToDelete(stepId)}
                onReorder={(orderedIds) => handleReorder(wf.id, orderedIds)}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 流程 建立/編輯 Dialog */}
      <Dialog
        open={workflowDialog.open}
        onOpenChange={(open) => setWorkflowDialog((s) => ({ ...s, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {workflowDialog.mode === 'create'
                ? t('actions.createWorkflow')
                : t('actions.editWorkflow')}
            </DialogTitle>
            <DialogDescription>{t('form.workflowSubtitle')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitWorkflow} className="space-y-4">
            <div>
              <Label htmlFor="wf-name">{t('form.nameLabel')}</Label>
              <Input
                id="wf-name"
                value={workflowForm.name}
                onChange={(e) => setWorkflowForm({ ...workflowForm, name: e.target.value })}
                placeholder={t('form.namePlaceholder')}
                required
              />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label htmlFor="wf-default" className="cursor-pointer">
                  {t('form.defaultLabel')}
                </Label>
                <p className="text-sm text-muted-foreground">{t('form.defaultHint')}</p>
              </div>
              <Switch
                id="wf-default"
                checked={workflowForm.isDefault}
                onCheckedChange={(checked) =>
                  setWorkflowForm({ ...workflowForm, isDefault: checked })
                }
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setWorkflowDialog((s) => ({ ...s, open: false }))}
              >
                {tCommon('actions.cancel')}
              </Button>
              <LoadingButton
                type="submit"
                isLoading={createMutation.isPending || updateMutation.isPending}
              >
                {tCommon('actions.save')}
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 步驟 新增/編輯 Dialog */}
      <Dialog
        open={stepDialog.open}
        onOpenChange={(open) => setStepDialog((s) => ({ ...s, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {stepDialog.mode === 'add' ? t('steps.addStep') : t('steps.editStep')}
            </DialogTitle>
            <DialogDescription>{t('steps.dialogSubtitle')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitStep} className="space-y-4">
            <div>
              <Label htmlFor="step-role">{t('steps.roleLabel')}</Label>
              <Select
                value={stepForm.roleId}
                onValueChange={(v) => setStepForm({ ...stepForm, roleId: v })}
              >
                <SelectTrigger id="step-role">
                  <SelectValue placeholder={t('steps.rolePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="step-name">{t('steps.nameLabel')}</Label>
              <Input
                id="step-name"
                value={stepForm.name}
                onChange={(e) => setStepForm({ ...stepForm, name: e.target.value })}
                placeholder={t('steps.namePlaceholder')}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStepDialog((s) => ({ ...s, open: false }))}
              >
                {tCommon('actions.cancel')}
              </Button>
              <LoadingButton
                type="submit"
                isLoading={addStepMutation.isPending || updateStepMutation.isPending}
                disabled={!stepForm.roleId}
              >
                {tCommon('actions.save')}
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 步驟刪除確認 */}
      <AlertDialog
        open={stepToDelete !== null}
        onOpenChange={(open) => !open && setStepToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('steps.confirmRemoveTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('steps.confirmRemove')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => stepToDelete && removeStepMutation.mutate({ id: stepToDelete })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tCommon('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
