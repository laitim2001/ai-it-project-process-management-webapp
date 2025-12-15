/**
 * @fileoverview Charge Outs List Page - 費用轉嫁列表頁面
 *
 * @description
 * 顯示所有費用轉嫁記錄的列表，支援即時搜尋、狀態過濾和分頁功能。
 * 費用轉嫁用於將專案費用分攤到不同的成本中心或部門。
 * 整合專案和預算類別資訊，提供完整的費用轉嫁管理功能。
 *
 * @page /[locale]/charge-outs
 *
 * @features
 * - 費用轉嫁列表展示（卡片視圖）
 * - 即時搜尋（轉嫁描述、成本中心）
 * - 狀態過濾（Draft, Submitted, Approved, Completed）
 * - 專案過濾（根據所屬專案篩選）
 * - 排序功能（金額、日期、狀態）
 * - 分頁導航（每頁 10/20/50 項）
 * - 快速操作（查看詳情、編輯、提交、審批）
 * - 狀態徽章顯示（不同顏色標示不同狀態）
 * - 角色權限控制（RBAC）
 *
 * @permissions
 * - ProjectManager: 查看和建立自己專案的費用轉嫁
 * - Supervisor: 查看所有費用轉嫁，審批 Submitted 轉嫁
 * - Admin: 完整權限
 *
 * @routing
 * - 列表頁: /charge-outs
 * - 建立頁: /charge-outs/new
 * - 詳情頁: /charge-outs/[id]
 * - 編輯頁: /charge-outs/[id]/edit
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢和快取
 * - shadcn/ui: UI 組件庫
 *
 * @related
 * - `packages/api/src/routers/chargeOut.ts` - ChargeOut API Router（列表查詢、狀態過濾）
 * - `packages/api/src/routers/operatingCompany.ts` - OperatingCompany API Router（OpCo 過濾器）
 * - `packages/api/src/routers/project.ts` - Project API Router（專案過濾器）
 * - `packages/db/prisma/schema.prisma` - ChargeOut, OperatingCompany, Project 資料模型定義
 * - `apps/web/src/app/[locale]/charge-outs/new/page.tsx` - ChargeOut 建立頁
 * - `apps/web/src/app/[locale]/charge-outs/[id]/page.tsx` - ChargeOut 詳情頁
 * - `apps/web/src/app/[locale]/charge-outs/[id]/edit/page.tsx` - ChargeOut 編輯頁
 * - `apps/web/src/components/layout/dashboard-layout.tsx` - Dashboard 佈局組件
 *
 * @author IT Department
 * @since Epic 6 - Expense Recording & Financial Integration
 * @lastModified 2025-11-14
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { Plus, Trash2, RotateCcw, MoreHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { api } from '@/lib/trpc';

export default function ChargeOutsPage() {
  const t = useTranslations('chargeOuts');
  const tNav = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { toast } = useToast();

  // 過濾狀態
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedOpCo, setSelectedOpCo] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [page, setPage] = useState(1);
  const limit = 12;

  // CHANGE-024: 選擇和對話框狀態
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; status: string } | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [revertTarget, setRevertTarget] = useState<{ id: string; name: string } | null>(null);

  // 獲取 OpCo 列表（用於過濾器）
  const { data: opCos } = api.operatingCompany.getAll.useQuery();

  // 獲取項目列表（用於過濾器）
  const { data: projects } = api.project.getAll.useQuery({
    page: 1,
    limit: 100,
  });

  // 獲取 ChargeOut 列表
  const { data: chargeOuts, isLoading, refetch } = api.chargeOut.getAll.useQuery({
    status: selectedStatus || undefined,
    opCoId: selectedOpCo || undefined,
    projectId: selectedProject || undefined,
    page,
    limit,
  });

  // CHANGE-024: Mutations
  const deleteMutation = api.chargeOut.delete.useMutation({
    onSuccess: () => {
      toast({ title: t('messages.deleteSuccess') });
      refetch();
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget?.id));
    },
    onError: (error) => {
      toast({ title: t('messages.deleteError'), description: error.message, variant: 'destructive' });
    },
  });

  const deleteManyMutation = api.chargeOut.deleteMany.useMutation({
    onSuccess: (result) => {
      toast({
        title: t('messages.bulkDeleteSuccess'),
        description: t('messages.bulkDeleteResult', { deleted: result.deleted, skipped: result.skipped }),
      });
      refetch();
      setBulkDeleteDialogOpen(false);
      setSelectedIds([]);
    },
    onError: (error) => {
      toast({ title: t('messages.deleteError'), description: error.message, variant: 'destructive' });
    },
  });

  const revertToDraftMutation = api.chargeOut.revertToDraft.useMutation({
    onSuccess: () => {
      toast({ title: t('messages.revertSuccess') });
      refetch();
      setRevertDialogOpen(false);
      setRevertTarget(null);
    },
    onError: (error) => {
      toast({ title: t('messages.revertError'), description: error.message, variant: 'destructive' });
    },
  });

  // CHANGE-024: Helper functions
  const handleSelectAll = (checked: boolean) => {
    if (checked && chargeOuts?.items) {
      setSelectedIds(chargeOuts.items.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const canDelete = (status: string) => status === 'Draft' || status === 'Rejected';
  const canRevert = (status: string) => status === 'Submitted' || status === 'Confirmed' || status === 'Paid';

  const handleDeleteClick = (e: React.MouseEvent, item: { id: string; name: string; status: string }) => {
    e.stopPropagation();
    setDeleteTarget(item);
    setDeleteDialogOpen(true);
  };

  const handleRevertClick = (e: React.MouseEvent, item: { id: string; name: string }) => {
    e.stopPropagation();
    setRevertTarget(item);
    setRevertDialogOpen(true);
  };

  // 格式化金額
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-HK', {
      style: 'currency',
      currency: 'HKD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // 格式化日期
  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('zh-HK').format(new Date(date));
  };

  // 狀態顏色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-500';
      case 'Submitted':
        return 'bg-yellow-500';
      case 'Confirmed':
        return 'bg-green-500';
      case 'Paid':
        return 'bg-blue-500';
      case 'Rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // 狀態文字
  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'Draft': tCommon('status.draft'),
      'Submitted': tCommon('status.submitted'),
      'Confirmed': tCommon('status.confirmed'),
      'Paid': tCommon('status.paid'),
      'Rejected': tCommon('status.rejected'),
    };
    return statusMap[status] || status;
  };

  // 狀態選項
  const statusOptions = ['Draft', 'Submitted', 'Confirmed', 'Paid', 'Rejected'];

  return (
    <DashboardLayout>
      {/* Breadcrumb 導航 */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">{tNav('home')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{tNav('menu.chargeOuts')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 頁面標題 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('list.title')}</h1>
            <p className="mt-2 text-muted-foreground">
              {t('list.subtitle')}
            </p>
          </div>
          <Button onClick={() => router.push('/charge-outs/new')}>
            <Plus className="mr-2 h-4 w-4" />
            {t('list.newChargeOut')}
          </Button>
        </div>
      </div>

      {/* CHANGE-024: 批量操作工具列 */}
      {selectedIds.length > 0 && (
        <div className="mb-4 flex items-center gap-4 rounded-lg border bg-muted/50 p-3">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={chargeOuts?.items?.length === selectedIds.length}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm font-medium">
              {t('messages.selectedCount', { count: selectedIds.length })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('actions.bulkDelete')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds([])}
            >
              <X className="mr-2 h-4 w-4" />
              {t('actions.clearSelection')}
            </Button>
          </div>
        </div>
      )}

      {/* 過濾器 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* 狀態選擇 */}
            <div>
              <label className="mb-2 block text-sm font-medium">{t('list.filters.status')}</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">{t('list.filters.allStatuses')}</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {getStatusText(status)}
                  </option>
                ))}
              </select>
            </div>

            {/* OpCo 選擇 */}
            <div>
              <label className="mb-2 block text-sm font-medium">{t('list.filters.opCo')}</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedOpCo}
                onChange={(e) => {
                  setSelectedOpCo(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">{t('list.filters.allOpCos')}</option>
                {opCos?.map((opCo) => (
                  <option key={opCo.id} value={opCo.id}>
                    {opCo.code} - {opCo.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 項目選擇 */}
            <div>
              <label className="mb-2 block text-sm font-medium">{t('list.filters.project')}</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedProject}
                onChange={(e) => {
                  setSelectedProject(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">{t('list.filters.allProjects')}</option>
                {projects?.items?.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ChargeOut 列表 */}
      {isLoading ? (
        <div className="text-center py-8">{tCommon('loading')}</div>
      ) : chargeOuts && chargeOuts.items.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {chargeOuts.items.map((chargeOut) => (
              <Card
                key={chargeOut.id}
                className="cursor-pointer transition-shadow hover:shadow-lg"
                onClick={() => router.push(`/charge-outs/${chargeOut.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    {/* CHANGE-024: Checkbox */}
                    <div className="mr-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.includes(chargeOut.id)}
                        onCheckedChange={(checked) => handleSelectOne(chargeOut.id, !!checked)}
                      />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{chargeOut.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {chargeOut.description || t('list.noDescription')}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(chargeOut.status)}>
                        {getStatusText(chargeOut.status)}
                      </Badge>
                      {/* CHANGE-024: DropdownMenu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canDelete(chargeOut.status) && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => handleDeleteClick(e, { id: chargeOut.id, name: chargeOut.name, status: chargeOut.status })}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('actions.delete')}
                            </DropdownMenuItem>
                          )}
                          {canRevert(chargeOut.status) && (
                            <DropdownMenuItem
                              onClick={(e) => handleRevertClick(e, { id: chargeOut.id, name: chargeOut.name })}
                            >
                              <RotateCcw className="mr-2 h-4 w-4" />
                              {t('actions.revertToDraft')}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* 項目和 OpCo */}
                    <div className="text-sm">
                      <span className="text-muted-foreground">{t('list.project')}: </span>
                      <span className="font-medium">{chargeOut.project.name}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">{t('list.opCo')}: </span>
                      <span className="font-medium">
                        {chargeOut.opCo.code} - {chargeOut.opCo.name}
                      </span>
                    </div>

                    {/* 總金額 */}
                    <div className="flex items-center justify-between border-t pt-3">
                      <span className="text-sm text-muted-foreground">{t('list.totalAmount')}</span>
                      <span className="text-lg font-semibold text-primary">
                        {formatCurrency(chargeOut.totalAmount)}
                      </span>
                    </div>

                    {/* 費用明細數 */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{t('list.items')}</span>
                      <span className="text-sm font-medium">{chargeOut._count.items} {tCommon('units.records')}</span>
                    </div>

                    {/* 日期信息 */}
                    {chargeOut.issueDate && (
                      <div className="border-t pt-3 text-xs text-muted-foreground">
                        {t('list.issueDate')}: {formatDate(chargeOut.issueDate)}
                      </div>
                    )}
                    {chargeOut.paymentDate && (
                      <div className="text-xs text-muted-foreground">
                        {t('list.paymentDate')}: {formatDate(chargeOut.paymentDate)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 分頁控制 */}
          {chargeOuts.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                {tCommon('pagination.previous')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {tCommon('pagination.page')} {page} {tCommon('pagination.of')} {chargeOuts.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(chargeOuts.totalPages, p + 1))}
                disabled={page === chargeOuts.totalPages}
              >
                {tCommon('pagination.next')}
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              {selectedStatus || selectedOpCo || selectedProject
                ? t('list.noMatchingRecords')
                : t('list.noRecords')}
            </p>
            {!selectedStatus && !selectedOpCo && !selectedProject && (
              <Button className="mt-4" onClick={() => router.push('/charge-outs/new')}>
                <Plus className="mr-2 h-4 w-4" />
                {t('list.createFirst')}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* CHANGE-024: 單一刪除確認對話框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {canDelete(deleteTarget?.status || '')
                ? t('dialogs.delete.description')
                : t('dialogs.delete.cannotDeleteDescription', { reason: deleteTarget?.status })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('dialogs.cancel')}</AlertDialogCancel>
            {canDelete(deleteTarget?.status || '') && (
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteTarget && deleteMutation.mutate({ id: deleteTarget.id })}
              >
                {t('actions.delete')}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CHANGE-024: 批量刪除確認對話框 */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.bulkDelete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.bulkDelete.description', { count: selectedIds.length })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('dialogs.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteManyMutation.mutate({ ids: selectedIds })}
            >
              {t('actions.bulkDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CHANGE-024: 退回草稿確認對話框 */}
      <AlertDialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.revert.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.revert.description', { name: revertTarget?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('dialogs.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => revertTarget && revertToDraftMutation.mutate({ id: revertTarget.id })}
            >
              {t('actions.revertToDraft')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
