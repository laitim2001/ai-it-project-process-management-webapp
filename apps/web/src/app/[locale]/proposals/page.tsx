/**
 * @fileoverview Budget Proposals List Page - 預算提案列表頁面
 *
 * @description
 * 顯示所有預算提案的列表，支援即時搜尋、多條件過濾和雙視圖模式（卡片/表格）。
 * Project Manager 可查看自己專案的提案，Supervisor 可查看所有提案並進行審批操作。
 * 整合 tRPC 查詢和 React Query 進行資料快取和即時更新，提供流暢的用戶體驗。
 *
 * @page /[locale]/proposals
 *
 * @features
 * - 提案列表展示（支援卡片和表格視圖切換）
 * - 即時搜尋（提案標題、描述、專案名稱）
 * - 狀態過濾（Draft, PendingApproval, Approved, Rejected, MoreInfoRequired）
 * - 專案過濾（根據所屬專案篩選）
 * - 排序功能（金額、建立日期、狀態）
 * - 分頁導航（每頁 10/20/50 項）
 * - 快速操作（查看詳情、編輯、提交審批、刪除）
 * - 單筆刪除和批量刪除功能 (CHANGE-017)
 * - 角色權限控制（RBAC）
 * - 狀態徽章顯示（不同顏色標示不同狀態）
 *
 * @permissions
 * - ProjectManager: 查看自己專案的提案，建立/編輯/刪除 Draft 提案
 * - Supervisor: 查看所有提案，審批 PendingApproval 提案
 * - Admin: 完整管理權限（可刪除任何 Draft 提案）
 *
 * @routing
 * - 列表頁: /proposals
 * - 建立頁: /proposals/new
 * - 詳情頁: /proposals/[id]
 * - 編輯頁: /proposals/[id]/edit
 *
 * @stateManagement
 * - URL Query Params: 搜尋、過濾、排序、分頁狀態
 * - React Query: 資料快取和即時更新
 * - Local State: 視圖模式（卡片/表格）、搜尋輸入、選中項目
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢和快取
 * - shadcn/ui: Table, Card, Badge, Input, Button, Checkbox, AlertDialog
 * - lucide-react: 圖示庫
 *
 * @related
 * - packages/api/src/routers/budgetProposal.ts - 預算提案 API Router
 * - apps/web/src/components/proposal/BudgetProposalForm.tsx - 提案表單組件
 * - apps/web/src/app/[locale]/proposals/[id]/page.tsx - 提案詳情頁面
 * - packages/db/prisma/schema.prisma - BudgetProposal 資料模型
 *
 * @author IT Department
 * @since Epic 3 - Budget Proposal Workflow
 * @lastModified 2025-12-15
 * @changelog
 * - CHANGE-017: 新增單筆刪除和批量刪除功能
 */

'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from "@/i18n/routing";
import { api } from '@/lib/trpc';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useToast } from '@/components/ui/use-toast';
import { Plus, FileText, LayoutGrid, List, Search, Trash2 } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';

type ProposalStatus = 'Draft' | 'PendingApproval' | 'Approved' | 'Rejected' | 'MoreInfoRequired';

export default function ProposalsPage() {
  const t = useTranslations('proposals');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');
  const { toast } = useToast();
  const { data: session } = useSession();
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | undefined>(undefined);
  const router = useRouter();

  // CHANGE-017: 選中項目狀態
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'batch'; id?: string; title?: string } | null>(null);

  // Debounce search to avoid too many API requests
  const debouncedSearch = useDebounce(search, 300);

  const { data: proposals, isLoading, refetch } = api.budgetProposal.getAll.useQuery({
    search: debouncedSearch || undefined,
    status: statusFilter,
  });

  // CHANGE-017: 刪除 mutations
  const deleteMutation = api.budgetProposal.delete.useMutation({
    onSuccess: () => {
      toast({
        title: t('actions.deleteSuccess'),
        variant: 'default',
      });
      refetch();
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast({
        title: t('actions.deleteError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteManyMutation = api.budgetProposal.deleteMany.useMutation({
    onSuccess: (result) => {
      toast({
        title: t('actions.batchDeleteSuccess', { count: result.deletedCount }),
        variant: 'default',
      });
      refetch();
      setSelectedIds(new Set());
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast({
        title: t('actions.batchDeleteError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // CHANGE-017: 計算可刪除的 Draft 提案
  const deletableProposals = useMemo(() => {
    if (!proposals || !session?.user) return [];
    const userId = session.user.id;
    const userRole = session.user.role?.name;
    const isAdmin = userRole === 'Admin';

    return proposals.filter((p) => {
      if (p.status !== 'Draft') return false;
      // Admin 可刪除任何 Draft，其他用戶只能刪除自己專案的
      if (isAdmin) return true;
      return p.project.managerId === userId;
    });
  }, [proposals, session]);

  // CHANGE-017: 全選處理
  const allDeletableSelected = deletableProposals.length > 0 &&
    deletableProposals.every((p) => selectedIds.has(p.id));
  const someDeletableSelected = deletableProposals.some((p) => selectedIds.has(p.id));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(deletableProposals.map((p) => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  // CHANGE-017: 檢查是否可以刪除
  const canDelete = (proposal: { status: string; project: { managerId: string } }) => {
    if (proposal.status !== 'Draft') return false;
    if (!session?.user) return false;
    const userId = session.user.id;
    const userRole = session.user.role?.name;
    const isAdmin = userRole === 'Admin';
    return isAdmin || proposal.project.managerId === userId;
  };

  // CHANGE-017: 刪除處理
  const handleDelete = (id: string, title: string) => {
    setDeleteTarget({ type: 'single', id, title });
    setDeleteDialogOpen(true);
  };

  const handleBatchDelete = () => {
    setDeleteTarget({ type: 'batch' });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'single' && deleteTarget.id) {
      deleteMutation.mutate({ id: deleteTarget.id });
    } else if (deleteTarget.type === 'batch') {
      deleteManyMutation.mutate({ ids: Array.from(selectedIds) });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      Draft: { label: t('status.draft'), variant: 'outline' },
      PendingApproval: { label: t('status.pendingApproval'), variant: 'default' },
      Approved: { label: t('status.approved'), variant: 'secondary' },
      Rejected: { label: t('status.rejected'), variant: 'destructive' },
      MoreInfoRequired: { label: t('status.moreInfoRequired'), variant: 'default' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'default' as const };

    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Breadcrumb Skeleton */}
          <Skeleton className="h-5 w-64" />

          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-5 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Table Skeleton */}
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link href="/dashboard">{tNav('dashboard')}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-2 text-muted-foreground">{t('description')}</p>
          </div>
          <div className="flex gap-2">
            {/* 視圖切換按鈕 */}
            <div className="flex border border-input rounded-md">
              <Button
                variant={viewMode === 'card' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('card')}
                className="rounded-r-none"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Link href="/proposals/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('actions.create')}
              </Button>
            </Link>
          </div>
        </div>

        {/* 搜尋和篩選欄 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              {/* 搜尋框 */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={t('search.placeholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* 狀態篩選 */}
              <div className="flex gap-2">
                <select
                  value={statusFilter ?? ''}
                  onChange={(e) => {
                    setStatusFilter(
                      e.target.value
                        ? (e.target.value as ProposalStatus)
                        : undefined
                    );
                  }}
                  className="h-10 rounded-md border border-input px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/20"
                >
                  <option value="">{t('filters.allStatuses')}</option>
                  <option value="Draft">{t('status.draft')}</option>
                  <option value="PendingApproval">{t('status.pendingApproval')}</option>
                  <option value="Approved">{t('status.approved')}</option>
                  <option value="Rejected">{t('status.rejected')}</option>
                  <option value="MoreInfoRequired">{t('status.moreInfoRequired')}</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CHANGE-017: 批量操作工具欄 */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">
              {t('actions.selectedCount', { count: selectedIds.size })}
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBatchDelete}
              disabled={deleteManyMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteManyMutation.isPending ? t('actions.deleting') : t('actions.batchDelete')}
            </Button>
          </div>
        )}

        {/* 結果數量統計 */}
        {proposals && proposals.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {t('summary.total', { count: proposals.length })}
          </div>
        )}

        {/* 提案顯示區域 - 根據視圖模式切換 */}
        {!proposals || proposals.length === 0 ? (
          <Card className="bg-muted">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground font-medium">
                  {search || statusFilter ? tCommon('noData') : tCommon('noData')}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{t('empty.hint')}</p>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'card' ? (
          <>
            {/* 卡片視圖 */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {proposals.map((proposal) => (
                <Card
                  key={proposal.id}
                  className="h-full transition-all hover:border-primary hover:shadow-md cursor-pointer"
                  onClick={() => router.push(`/proposals/${proposal.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-xl flex-1">{proposal.title}</CardTitle>
                      {getStatusBadge(proposal.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {/* 專案 */}
                      <div className="flex justify-between">
                        <span>{t('fields.project')}：</span>
                        <span className="font-medium text-right">{proposal.project.name}</span>
                      </div>

                      {/* 金額 */}
                      <div className="flex justify-between">
                        <span>{t('fields.amount')}：</span>
                        <span className="font-medium text-primary text-lg">
                          <CurrencyDisplay
                            amount={proposal.amount}
                            currency={proposal.project.currency}
                          />
                        </span>
                      </div>

                      {/* 建立時間 */}
                      <div className="flex justify-between">
                        <span>{tCommon('fields.createdAt')}：</span>
                        <span className="font-medium">
                          {new Date(proposal.createdAt).toLocaleDateString('zh-TW')}
                        </span>
                      </div>

                      {/* 操作按鈕 */}
                      <div className="pt-2 border-t border-border flex gap-2">
                        {(proposal.status === 'Draft' || proposal.status === 'MoreInfoRequired') && (
                          <Link
                            href={`/proposals/${proposal.id}/edit`}
                            className="text-sm text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {t('actions.edit')}
                          </Link>
                        )}
                        {canDelete(proposal) && (
                          <button
                            className="text-sm text-destructive hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(proposal.id, proposal.title);
                            }}
                          >
                            {t('actions.delete')}
                          </button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* 列表視圖 */}
            <div className="rounded-lg border bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* CHANGE-017: 全選 Checkbox */}
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allDeletableSelected}
                        onCheckedChange={(checked) => handleSelectAll(!!checked)}
                        aria-label={allDeletableSelected ? t('actions.deselectAll') : t('actions.selectAll')}
                        disabled={deletableProposals.length === 0}
                        className={someDeletableSelected && !allDeletableSelected ? 'opacity-50' : ''}
                      />
                    </TableHead>
                    <TableHead>{t('fields.title')}</TableHead>
                    <TableHead>{t('fields.project')}</TableHead>
                    <TableHead>{t('fields.amount')}</TableHead>
                    <TableHead>{t('fields.status')}</TableHead>
                    <TableHead>{tCommon('fields.createdAt')}</TableHead>
                    <TableHead className="text-right">{tCommon('fields.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposals.map((proposal) => {
                    const isDeletable = canDelete(proposal);
                    return (
                      <TableRow key={proposal.id} className="hover:bg-muted/50">
                        {/* CHANGE-017: 行 Checkbox */}
                        <TableCell>
                          {isDeletable && (
                            <Checkbox
                              checked={selectedIds.has(proposal.id)}
                              onCheckedChange={(checked) => handleSelectOne(proposal.id, !!checked)}
                              aria-label={`Select ${proposal.title}`}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/proposals/${proposal.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {proposal.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/projects/${proposal.project.id}`}
                            className="text-primary hover:underline"
                          >
                            {proposal.project.name}
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium">
                          <CurrencyDisplay
                            amount={proposal.amount}
                            currency={proposal.project.currency}
                          />
                        </TableCell>
                        <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(proposal.createdAt).toLocaleDateString('zh-TW')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/proposals/${proposal.id}`}
                            className="text-primary hover:underline"
                          >
                            {tCommon('actions.view')}
                          </Link>
                          {(proposal.status === 'Draft' || proposal.status === 'MoreInfoRequired') && (
                            <>
                              <span className="mx-2 text-muted-foreground">|</span>
                              <Link
                                href={`/proposals/${proposal.id}/edit`}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                {tCommon('actions.edit')}
                              </Link>
                            </>
                          )}
                          {isDeletable && (
                            <>
                              <span className="mx-2 text-muted-foreground">|</span>
                              <button
                                className="text-destructive hover:underline"
                                onClick={() => handleDelete(proposal.id, proposal.title)}
                              >
                                {t('actions.delete')}
                              </button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      {/* CHANGE-017: 刪除確認對話框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.type === 'batch'
                ? t('actions.batchDelete')
                : t('actions.delete')
              }
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'batch'
                ? t('actions.confirmBatchDelete', { count: selectedIds.size })
                : t('actions.confirmDelete')
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending || deleteManyMutation.isPending}>
              {tCommon('actions.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending || deleteManyMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {(deleteMutation.isPending || deleteManyMutation.isPending)
                ? t('actions.deleting')
                : t('actions.delete')
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
