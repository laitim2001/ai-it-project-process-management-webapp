/**
 * @fileoverview Quotes List Page - 報價單列表頁面
 *
 * @description
 * 顯示所有報價單的列表，支援即時搜尋、多條件過濾和分頁功能。
 * Project Manager 可查看和比較不同供應商的報價，用於選擇最佳供應商和生成採購單。
 * 整合專案和供應商資訊，提供報價檔案預覽和下載功能。
 *
 * @page /[locale]/quotes
 *
 * @features
 * - 報價單列表展示（卡片視圖）
 * - 即時搜尋（報價標題、描述）
 * - 專案過濾（根據所屬專案篩選）
 * - 供應商過濾（根據供應商篩選）
 * - 排序功能（金額、建立日期）
 * - 分頁導航（每頁 10/20/50 項）
 * - 報價比較功能（同一專案的多個報價）
 * - 報價檔案預覽和下載（Azure Blob Storage）
 * - 快速操作（查看詳情、生成採購單）
 * - 角色權限控制（RBAC）
 *
 * @permissions
 * - ProjectManager: 查看自己專案的報價
 * - Supervisor: 查看所有報價
 * - Admin: 完整權限
 *
 * @routing
 * - 列表頁: /quotes
 * - 新增頁: /quotes/new
 * - 專案報價頁: /projects/[id]/quotes
 *
 * @stateManagement
 * - URL Query Params: 搜尋、過濾、排序、分頁狀態
 * - React Query: 資料快取和即時更新
 * - Local State: 視圖模式、搜尋輸入
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢和快取
 * - shadcn/ui: Card, Badge, Input, Button, Select
 * - lucide-react: 圖示庫
 *
 * @related
 * - packages/api/src/routers/quote.ts - 報價 API Router
 * - apps/web/src/app/[locale]/projects/[id]/quotes/page.tsx - 專案報價頁面
 * - apps/web/src/app/[locale]/purchase-orders/new/page.tsx - 建立採購單頁面
 * - packages/db/prisma/schema.prisma - Quote 資料模型
 *
 * @author IT Department
 * @since Epic 5 - Procurement & Vendor Management
 * @lastModified 2025-11-14
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import { Link } from "@/i18n/routing";
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/select';
import { PaginationControls } from '@/components/ui';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { FileCheck, Building2, FolderKanban, DollarSign, Calendar, AlertCircle, LayoutGrid, List, Plus, Trash2, Link2Off, MoreHorizontal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';

export default function QuotesPage() {
  const t = useTranslations('quotes');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');
  const { toast } = useToast();

  // 狀態管理
  const [page, setPage] = useState(1);
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [vendorId, setVendorId] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // CHANGE-021: 刪除功能狀態
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; hasPO: boolean; allPODraft: boolean } | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<{ id: string; poCount: number } | null>(null);

  // 查詢報價列表
  const { data, isLoading, error, refetch } = api.quote.getAll.useQuery({
    page,
    limit: 10,
    projectId,
    vendorId,
  });

  // CHANGE-021: 刪除 Mutations
  const deleteMutation = api.quote.delete.useMutation({
    onSuccess: () => {
      toast({ title: t('messages.deleteSuccess') });
      refetch();
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast({ title: t('messages.deleteError'), description: error.message, variant: 'destructive' });
    },
  });

  const deleteManyMutation = api.quote.deleteMany.useMutation({
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

  const revertToDraftMutation = api.quote.revertToDraft.useMutation({
    onSuccess: (result) => {
      toast({
        title: t('messages.unlinkSuccess'),
        description: t('messages.unlinkResult', { count: result.unlinkedCount }),
      });
      refetch();
      setUnlinkDialogOpen(false);
      setUnlinkTarget(null);
    },
    onError: (error) => {
      toast({ title: t('messages.unlinkError'), description: error.message, variant: 'destructive' });
    },
  });

  // CHANGE-021: 選擇處理函數
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(quotes.map(q => q.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(i => i !== id));
    }
  };

  // 判斷報價單是否可刪除
  const canDelete = (quote: typeof quotes[0]) => {
    return !quote.purchaseOrders || quote.purchaseOrders.length === 0;
  };

  // 判斷報價單是否可強制刪除（所有 PO 為 Draft）
  const canForceDelete = (quote: typeof quotes[0]) => {
    if (!quote.purchaseOrders || quote.purchaseOrders.length === 0) return false;
    return quote.purchaseOrders.every((po: any) => po.status === 'Draft');
  };

  // 判斷報價單是否可解除關聯
  const canUnlink = (quote: typeof quotes[0]) => {
    if (!quote.purchaseOrders || quote.purchaseOrders.length === 0) return false;
    return quote.purchaseOrders.every((po: any) => po.status === 'Draft');
  };

  // 處理刪除按鈕點擊
  const handleDeleteClick = (quote: typeof quotes[0]) => {
    const hasPO = quote.purchaseOrders && quote.purchaseOrders.length > 0;
    const allPODraft = hasPO ? quote.purchaseOrders.every((po: any) => po.status === 'Draft') : false;
    setDeleteTarget({ id: quote.id, hasPO, allPODraft });
    setDeleteDialogOpen(true);
  };

  // 處理解除關聯按鈕點擊
  const handleUnlinkClick = (quote: typeof quotes[0]) => {
    setUnlinkTarget({ id: quote.id, poCount: quote.purchaseOrders?.length || 0 });
    setUnlinkDialogOpen(true);
  };

  // 查詢所有專案（用於篩選下拉選單）
  const { data: projects } = api.project.getAll.useQuery({
    page: 1,
    limit: 100,
  });

  // 查詢所有供應商（用於篩選下拉選單）
  const { data: vendors } = api.vendor.getAll.useQuery({
    page: 1,
    limit: 100,
  });

  // 載入骨架屏
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <Skeleton className="h-5 w-64" />
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-5 w-64" />
            </div>
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 錯誤處理
  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
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
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-md space-y-6 text-center">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('messages.loadError')}: {error.message}
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const quotes = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* 麵包屑導航 */}
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

        {/* 頁面標題 */}
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
                aria-label={tCommon('viewMode.card')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
                aria-label={tCommon('viewMode.list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            {/* 新增報價單按鈕 */}
            <Link href="/quotes/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('actions.create')}
              </Button>
            </Link>
          </div>
        </div>

        {/* 篩選欄 */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <NativeSelect value={projectId || ''}
              onChange={(e) => {
                setProjectId(e.target.value || undefined);
                setPage(1);
              }}
            >
              <option value="">{t('filters.allProjects')}</option>
              {projects?.items.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="flex-1 min-w-[200px]">
            <NativeSelect value={vendorId || ''}
              onChange={(e) => {
                setVendorId(e.target.value || undefined);
                setPage(1);
              }}
            >
              <option value="">{t('filters.allVendors')}</option>
              {vendors?.items.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>

        {/* 結果計數 */}
        {pagination && (
          <div className="text-sm text-muted-foreground">
            {t('list.showing', {
              from: ((pagination.page - 1) * pagination.limit) + 1,
              to: Math.min(pagination.page * pagination.limit, pagination.total),
              total: pagination.total
            })}
          </div>
        )}

        {/* CHANGE-021: 批量操作工具列 */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <span className="text-sm font-medium">
              {t('messages.selectedCount', { count: selectedIds.length })}
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('actions.bulkDelete')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds([])}
            >
              {tCommon('actions.cancel')}
            </Button>
          </div>
        )}

        {/* 報價單顯示 - 根據視圖模式切換 */}
        {quotes.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <FileCheck className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-lg font-medium text-foreground">{t('list.empty')}</h3>
                <p className="mt-1 text-muted-foreground">
                  {projectId || vendorId ? t('list.noResults') : t('list.uploadHint')}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'card' ? (
          <>
            {/* 卡片視圖 */}
            <div className="space-y-4">
              {quotes.map((quote) => (
                <Card key={quote.id} className="hover:border-primary hover:shadow-md transition">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* CHANGE-021: Checkbox */}
                      <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.includes(quote.id)}
                          onCheckedChange={(checked) => handleSelectOne(quote.id, !!checked)}
                        />
                      </div>

                      {/* 主要內容區域 */}
                      <Link
                        href={`/projects/${quote.projectId}/quotes`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-start justify-between">
                          {/* 左側：主要資訊 */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <FileCheck className="h-6 w-6 text-primary" />
                              <div>
                                <h3 className="text-lg font-semibold text-foreground">
                                  {quote.vendor.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(quote.uploadDate).toLocaleDateString('zh-TW')}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-9">
                              {/* 專案 */}
                              <div className="flex items-center gap-2">
                                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">{t('fields.project')}</p>
                                  <p className="text-sm font-medium text-foreground">
                                    {quote.project.name}
                                  </p>
                                </div>
                              </div>

                              {/* 供應商 */}
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">{t('fields.vendor')}</p>
                                  <p className="text-sm font-medium text-foreground">
                                    {quote.vendor.name}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 右側：金額 */}
                          <div className="text-right space-y-2">
                            <div>
                              <p className="text-xs text-muted-foreground">{t('fields.amount')}</p>
                              <p className="text-2xl font-bold text-primary">
                                <CurrencyDisplay
                                  amount={quote.amount}
                                  currency={quote.project.currency}
                                />
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>

                      {/* CHANGE-021: 操作按鈕 */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canDelete(quote) && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(quote)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t('actions.delete')}
                              </DropdownMenuItem>
                            )}
                            {canForceDelete(quote) && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(quote)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t('actions.forceDelete')}
                              </DropdownMenuItem>
                            )}
                            {canUnlink(quote) && (
                              <DropdownMenuItem onClick={() => handleUnlinkClick(quote)}>
                                <Link2Off className="h-4 w-4 mr-2" />
                                {t('actions.unlink')}
                              </DropdownMenuItem>
                            )}
                            {!canDelete(quote) && !canForceDelete(quote) && !canUnlink(quote) && (
                              <DropdownMenuItem disabled>
                                {t('messages.cannotDelete')}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 分頁 */}
            {pagination && pagination.totalPages > 1 && (
              <PaginationControls
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        ) : (
          <>
            {/* 列表視圖 */}
            <div className="rounded-lg border bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* CHANGE-021: 全選 Checkbox */}
                    <TableHead className="w-12">
                      <Checkbox
                        checked={quotes.length > 0 && selectedIds.length === quotes.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>{t('fields.vendor')}</TableHead>
                    <TableHead>{t('fields.project')}</TableHead>
                    <TableHead className="text-right">{t('fields.amount')}</TableHead>
                    <TableHead>{t('fields.uploadDate')}</TableHead>
                    <TableHead className="text-right">{tCommon('actions.title')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotes.map((quote) => (
                    <TableRow key={quote.id} className="hover:bg-muted/50">
                      {/* CHANGE-021: 單選 Checkbox */}
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(quote.id)}
                          onCheckedChange={(checked) => handleSelectOne(quote.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/projects/${quote.projectId}/quotes`}
                          className="font-medium text-primary hover:underline flex items-center gap-2"
                        >
                          <Building2 className="h-4 w-4" />
                          {quote.vendor.name}
                        </Link>
                      </TableCell>
                      <TableCell>{quote.project.name}</TableCell>
                      <TableCell className="text-right font-medium">
                        <CurrencyDisplay
                          amount={quote.amount}
                          currency={quote.project.currency}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(quote.uploadDate).toLocaleDateString('zh-TW')}
                      </TableCell>
                      <TableCell className="text-right">
                        {/* CHANGE-021: 操作按鈕 */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/projects/${quote.projectId}/quotes`}>
                                {tCommon('actions.view')}
                              </Link>
                            </DropdownMenuItem>
                            {canDelete(quote) && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(quote)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t('actions.delete')}
                              </DropdownMenuItem>
                            )}
                            {canForceDelete(quote) && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(quote)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t('actions.forceDelete')}
                              </DropdownMenuItem>
                            )}
                            {canUnlink(quote) && (
                              <DropdownMenuItem onClick={() => handleUnlinkClick(quote)}>
                                <Link2Off className="h-4 w-4 mr-2" />
                                {t('actions.unlink')}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* 分頁 */}
            {pagination && pagination.totalPages > 1 && (
              <PaginationControls
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>

      {/* CHANGE-021: 刪除確認對話框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.hasPO
                ? deleteTarget?.allPODraft
                  ? t('dialogs.delete.forceDescription')
                  : t('dialogs.delete.cannotDeleteDescription')
                : t('dialogs.delete.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('actions.cancel')}</AlertDialogCancel>
            {deleteTarget && (deleteTarget.allPODraft || !deleteTarget.hasPO) && (
              <AlertDialogAction
                onClick={() => {
                  if (deleteTarget) {
                    deleteMutation.mutate({
                      id: deleteTarget.id,
                      force: deleteTarget.hasPO && deleteTarget.allPODraft,
                    });
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t('actions.delete')}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CHANGE-021: 批量刪除確認對話框 */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.bulkDelete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.bulkDelete.description', { count: selectedIds.length })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteManyMutation.mutate({ ids: selectedIds })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('actions.bulkDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CHANGE-021: 解除關聯確認對話框 */}
      <AlertDialog open={unlinkDialogOpen} onOpenChange={setUnlinkDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.unlink.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.unlink.description', { count: unlinkTarget?.poCount || 0 })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (unlinkTarget) {
                  revertToDraftMutation.mutate({ id: unlinkTarget.id });
                }
              }}
            >
              {t('actions.unlink')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
