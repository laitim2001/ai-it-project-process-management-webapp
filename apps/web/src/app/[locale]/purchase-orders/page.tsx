/**
 * @fileoverview Purchase Orders List Page - 採購單列表頁面
 *
 * @description
 * 顯示所有採購單的列表，支援即時搜尋、多條件過濾和分頁功能。
 * Project Manager 可查看自己專案的採購單，Supervisor 可查看所有採購單。
 * 整合專案、供應商和報價資訊，提供完整的採購管理功能。
 *
 * @page /[locale]/purchase-orders
 *
 * @features
 * - 採購單列表展示（卡片視圖和表格視圖切換）
 * - 即時搜尋（採購單號、描述）
 * - 專案過濾（根據所屬專案篩選）
 * - 供應商過濾（根據供應商篩選）
 * - 排序功能（金額、日期）
 * - 分頁導航（每頁 10/20/50 項）
 * - 快速操作（查看詳情、編輯）
 * - 採購單統計資訊（費用數量、累計金額）
 * - 角色權限控制（RBAC）
 *
 * @permissions
 * - ProjectManager: 查看自己專案的採購單
 * - Supervisor: 查看所有採購單
 * - Admin: 完整權限
 *
 * @routing
 * - 列表頁: /purchase-orders
 * - 建立頁: /purchase-orders/new
 * - 詳情頁: /purchase-orders/[id]
 * - 編輯頁: /purchase-orders/[id]/edit
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢和快取
 * - shadcn/ui: Table, Card, Input, Select, Pagination
 *
 * @related
 * - packages/api/src/routers/purchaseOrder.ts - 採購單 API Router
 * - apps/web/src/components/purchase-order/PurchaseOrderForm.tsx - 採購單表單組件
 * - apps/web/src/app/[locale]/purchase-orders/[id]/page.tsx - 採購單詳情頁面
 * - packages/db/prisma/schema.prisma - PurchaseOrder 資料模型
 * - apps/web/src/app/[locale]/projects/[id]/page.tsx - 專案詳情頁面
 * - apps/web/src/app/[locale]/vendors/[id]/page.tsx - 供應商詳情頁面
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
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/select';
import { PaginationControls } from '@/components/ui';
import { useDebounce } from '@/hooks/useDebounce';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Building2, FileText, Calendar, DollarSign, AlertCircle, LayoutGrid, List, Plus, Trash2, RotateCcw, MoreHorizontal } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay'; // FEAT-002
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';

export default function PurchaseOrdersPage() {
  const t = useTranslations('purchaseOrders');
  const tNav = useTranslations('navigation');
  const { toast } = useToast();

  // 狀態管理
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [vendorId, setVendorId] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // CHANGE-022: 刪除功能狀態
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; status: string; hasExpenses: boolean } | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [revertTarget, setRevertTarget] = useState<{ id: string; poNumber: string } | null>(null);
  // CHANGE-025: 退回已提交狀態
  const [revertToSubmittedDialogOpen, setRevertToSubmittedDialogOpen] = useState(false);
  const [revertToSubmittedTarget, setRevertToSubmittedTarget] = useState<{ id: string; poNumber: string } | null>(null);

  // Debounce 搜尋避免過多 API 請求
  const debouncedSearch = useDebounce(search, 300);

  // 查詢採購單列表
  const { data, isLoading, error, refetch } = api.purchaseOrder.getAll.useQuery({
    page,
    limit: 10,
    projectId,
    vendorId,
  });

  // CHANGE-022: 刪除相關 mutations
  const deleteMutation = api.purchaseOrder.delete.useMutation({
    onSuccess: () => {
      toast({ title: t('messages.deleteSuccess') });
      refetch();
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast({
        title: t('messages.deleteError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteManyMutation = api.purchaseOrder.deleteMany.useMutation({
    onSuccess: (result) => {
      toast({
        title: t('messages.bulkDeleteSuccess'),
        description: t('messages.bulkDeleteResult', {
          deleted: result.deleted,
          skipped: result.skipped,
        }),
      });
      refetch();
      setBulkDeleteDialogOpen(false);
      setSelectedIds([]);
    },
    onError: (error) => {
      toast({
        title: t('messages.deleteError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const revertToDraftMutation = api.purchaseOrder.revertToDraft.useMutation({
    onSuccess: () => {
      toast({ title: t('messages.revertSuccess') });
      refetch();
      setRevertDialogOpen(false);
      setRevertTarget(null);
    },
    onError: (error) => {
      toast({
        title: t('messages.revertError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // CHANGE-025: 退回已提交狀態 mutation
  const revertToSubmittedMutation = api.purchaseOrder.revertToSubmitted.useMutation({
    onSuccess: () => {
      toast({ title: t('messages.revertToSubmittedSuccess') });
      refetch();
      setRevertToSubmittedDialogOpen(false);
      setRevertToSubmittedTarget(null);
    },
    onError: (error) => {
      toast({
        title: t('messages.revertToSubmittedError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // 查詢所有專案（用於篩選下拉選單）
  // 注意：API 限制最大 limit 為 100，如需更多數據請使用分頁
  const { data: projects } = api.project.getAll.useQuery({
    page: 1,
    limit: 100,
  });

  // 查詢所有供應商（用於篩選下拉選單）
  // 注意：API 限制最大 limit 為 100，如需更多數據請使用分頁
  const { data: vendors } = api.vendor.getAll.useQuery({
    page: 1,
    limit: 100,
  });

  // CHANGE-022: Helper 函數
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const draftIds = (data?.items ?? [])
        .filter((po) => po.status === 'Draft' && (po._count?.expenses ?? 0) === 0)
        .map((po) => po.id);
      setSelectedIds(draftIds);
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

  // 判斷是否可刪除（僅 Draft 且無 Expense）
  const canDelete = (po: { status: string; _count?: { expenses: number } }) => {
    return po.status === 'Draft' && (po._count?.expenses ?? 0) === 0;
  };

  // 判斷是否可退回 Draft（Submitted 或 Cancelled）
  const canRevert = (status: string) => {
    return status === 'Submitted' || status === 'Cancelled';
  };

  // CHANGE-025: 判斷是否可退回 Submitted（僅 Approved 可以）
  const canRevertToSubmitted = (status: string) => {
    return status === 'Approved';
  };

  // 處理刪除點擊
  const handleDeleteClick = (po: { id: string; status: string; _count?: { expenses: number } }) => {
    setDeleteTarget({
      id: po.id,
      status: po.status,
      hasExpenses: (po._count?.expenses ?? 0) > 0,
    });
    setDeleteDialogOpen(true);
  };

  // 處理退回草稿點擊
  const handleRevertClick = (po: { id: string; poNumber: string }) => {
    setRevertTarget(po);
    setRevertDialogOpen(true);
  };

  // CHANGE-025: 處理退回已提交點擊
  const handleRevertToSubmittedClick = (po: { id: string; poNumber: string }) => {
    setRevertToSubmittedTarget(po);
    setRevertToSubmittedDialogOpen(true);
  };

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
                  {t('errors.loadFailed')}: {error.message}
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const purchaseOrders = data?.items ?? [];
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
                aria-label={t('viewMode.cardView')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
                aria-label={t('viewMode.listView')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            {/* 新增採購單按鈕 */}
            <Link href="/purchase-orders/new">
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
            {t('pagination.showing', {
              start: ((pagination.page - 1) * pagination.limit) + 1,
              end: Math.min(pagination.page * pagination.limit, pagination.total),
              total: pagination.total
            })}
          </div>
        )}

        {/* CHANGE-022: 批量操作工具列 */}
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
              {t('actions.clearSelection')}
            </Button>
          </div>
        )}

        {/* 採購單顯示 - 根據視圖模式切換 */}
        {purchaseOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-lg font-medium text-foreground">{t('empty.title')}</h3>
                <p className="mt-1 text-muted-foreground">
                  {projectId || vendorId ? t('empty.noFiltered') : t('empty.noItems')}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'card' ? (
          <>
            {/* 卡片視圖 */}
            <div className="space-y-4">
              {purchaseOrders.map((po) => (
                <Card key={po.id} className="hover:border-primary hover:shadow-md transition">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* CHANGE-022: Checkbox */}
                      {canDelete(po) && (
                        <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.includes(po.id)}
                            onCheckedChange={(checked) => handleSelectOne(po.id, checked as boolean)}
                          />
                        </div>
                      )}

                      {/* 主要內容區 - 可點擊導航 */}
                      <Link href={`/purchase-orders/${po.id}`} className="flex-1 cursor-pointer">
                        <div className="flex items-start justify-between">
                          {/* 左側：主要資訊 */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <ShoppingCart className="h-6 w-6 text-primary" />
                              <div>
                                <h3 className="text-lg font-semibold text-foreground">
                                  {po.poNumber}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(po.date).toLocaleDateString('zh-TW')}
                                  </p>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    po.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                                    po.status === 'Submitted' ? 'bg-yellow-100 text-yellow-800' :
                                    po.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                    po.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {t(`status.${po.status.toLowerCase()}`)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-9">
                              {/* 專案 */}
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">{t('fields.project')}</p>
                                  <p className="text-sm font-medium text-foreground">
                                    {po.project.name}
                                  </p>
                                </div>
                              </div>

                              {/* 供應商 */}
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-xs text-muted-foreground">{t('fields.vendor')}</p>
                                  <p className="text-sm font-medium text-foreground">
                                    {po.vendor.name}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* 右側：金額和費用統計 */}
                          <div className="text-right space-y-2">
                            <div>
                              <p className="text-xs text-muted-foreground">{t('fields.totalAmount')}</p>
                              <div className="text-2xl font-bold text-primary">
                                <CurrencyDisplay
                                  amount={po.totalAmount}
                                  currency={po.currency ?? po.project.currency}
                                />
                              </div>
                            </div>
                            {po._count && (
                              <div className="text-sm text-muted-foreground">
                                {t('card.expenseCount', { count: po._count.expenses })}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>

                      {/* CHANGE-022: 操作下拉選單 */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/purchase-orders/${po.id}`}>
                                {t('actions.view')}
                              </Link>
                            </DropdownMenuItem>
                            {/* CHANGE-025: 退回已提交選項（僅 Approved 狀態可用） */}
                            {canRevertToSubmitted(po.status) && (
                              <DropdownMenuItem onClick={() => handleRevertToSubmittedClick({ id: po.id, poNumber: po.poNumber })}>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                {t('actions.revertToSubmitted')}
                              </DropdownMenuItem>
                            )}
                            {canRevert(po.status) && (
                              <DropdownMenuItem onClick={() => handleRevertClick({ id: po.id, poNumber: po.poNumber })}>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                {t('actions.revertToDraft')}
                              </DropdownMenuItem>
                            )}
                            {canDelete(po) && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(po)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t('actions.delete')}
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
                    {/* CHANGE-022: 全選 Checkbox */}
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.length > 0 && selectedIds.length === purchaseOrders.filter(canDelete).length}
                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                      />
                    </TableHead>
                    <TableHead>{t('table.poNumber')}</TableHead>
                    <TableHead>{t('fields.project')}</TableHead>
                    <TableHead>{t('fields.vendor')}</TableHead>
                    <TableHead>{t('table.status')}</TableHead>
                    <TableHead className="text-right">{t('fields.totalAmount')}</TableHead>
                    <TableHead className="text-center">{t('table.expenses')}</TableHead>
                    <TableHead>{t('fields.date')}</TableHead>
                    <TableHead className="text-right">{t('table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.map((po) => (
                    <TableRow key={po.id} className="hover:bg-muted/50">
                      {/* CHANGE-022: 行選擇 Checkbox */}
                      <TableCell>
                        {canDelete(po) ? (
                          <Checkbox
                            checked={selectedIds.includes(po.id)}
                            onCheckedChange={(checked) => handleSelectOne(po.id, checked as boolean)}
                          />
                        ) : (
                          <span className="w-4" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/purchase-orders/${po.id}`}
                          className="font-medium text-primary hover:underline flex items-center gap-2"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          {po.poNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{po.project.name}</TableCell>
                      <TableCell>{po.vendor.name}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          po.status === 'Draft' ? 'bg-gray-100 text-gray-800' :
                          po.status === 'Submitted' ? 'bg-yellow-100 text-yellow-800' :
                          po.status === 'Approved' ? 'bg-green-100 text-green-800' :
                          po.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {t(`status.${po.status.toLowerCase()}`)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <CurrencyDisplay
                          amount={po.totalAmount}
                          currency={po.currency ?? po.project.currency}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        {po._count ? po._count.expenses : 0}
                      </TableCell>
                      <TableCell>
                        {new Date(po.date).toLocaleDateString('zh-TW')}
                      </TableCell>
                      <TableCell className="text-right">
                        {/* CHANGE-022: 操作下拉選單 */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/purchase-orders/${po.id}`}>
                                {t('actions.view')}
                              </Link>
                            </DropdownMenuItem>
                            {/* CHANGE-025: 退回已提交選項（僅 Approved 狀態可用） */}
                            {canRevertToSubmitted(po.status) && (
                              <DropdownMenuItem onClick={() => handleRevertToSubmittedClick({ id: po.id, poNumber: po.poNumber })}>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                {t('actions.revertToSubmitted')}
                              </DropdownMenuItem>
                            )}
                            {canRevert(po.status) && (
                              <DropdownMenuItem onClick={() => handleRevertClick({ id: po.id, poNumber: po.poNumber })}>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                {t('actions.revertToDraft')}
                              </DropdownMenuItem>
                            )}
                            {canDelete(po) && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(po)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t('actions.delete')}
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

        {/* CHANGE-022: 刪除確認對話框 */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('dialogs.delete.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteTarget?.status !== 'Draft'
                  ? t('dialogs.delete.cannotDeleteDescription', { status: deleteTarget?.status })
                  : deleteTarget?.hasExpenses
                    ? t('dialogs.delete.hasExpensesDescription')
                    : t('dialogs.delete.description')
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('dialogs.cancel')}</AlertDialogCancel>
              {deleteTarget && deleteTarget.status === 'Draft' && !deleteTarget.hasExpenses && (
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate({ id: deleteTarget.id })}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t('actions.delete')}
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* CHANGE-022: 批量刪除確認對話框 */}
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
                onClick={() => deleteManyMutation.mutate({ ids: selectedIds })}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t('actions.bulkDelete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* CHANGE-022: 退回草稿確認對話框 */}
        <AlertDialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('dialogs.revert.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('dialogs.revert.description', { poNumber: revertTarget?.poNumber })}
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

        {/* CHANGE-025: 退回已提交確認對話框 */}
        <AlertDialog open={revertToSubmittedDialogOpen} onOpenChange={setRevertToSubmittedDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('dialogs.revertToSubmitted.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('dialogs.revertToSubmitted.description', { poNumber: revertToSubmittedTarget?.poNumber })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('dialogs.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => revertToSubmittedTarget && revertToSubmittedMutation.mutate({ id: revertToSubmittedTarget.id })}
              >
                {t('actions.revertToSubmitted')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
