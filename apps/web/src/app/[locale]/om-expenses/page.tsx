/**
 * @fileoverview O&M Expenses List Page - 維運費用列表頁面
 *
 * @description
 * 顯示所有維運（O&M）費用的列表，支援 FEAT-007 表頭-明細架構。
 * 每個 OMExpense 可以有多個 OMExpenseItem（明細項目），
 * 每個明細項目有獨立的 OpCo、預算金額和結束日期。
 *
 * @page /[locale]/om-expenses
 *
 * @features
 * - FEAT-007 表頭-明細架構支援
 * - 維運費用列表展示（卡片視圖）
 * - 顯示總預算、總實際支出（所有明細項目加總）
 * - 顯示明細項目數量
 * - 即時搜尋和過濾（財年、OpCo、類別）
 * - 分頁導航
 * - 快速操作（查看詳情、編輯）
 * - 狀態徽章顯示（增長率、使用率）
 * - 向後相容舊資料格式
 *
 * @permissions
 * - ProjectManager: 查看和建立維運費用
 * - Supervisor: 查看所有維運費用
 * - Admin: 完整權限
 *
 * @routing
 * - 列表頁: /om-expenses
 * - 建立頁: /om-expenses/new
 * - 詳情頁: /om-expenses/[id]
 * - 編輯頁: /om-expenses/[id]/edit
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢和快取
 * - shadcn/ui: UI 組件庫
 *
 * @related
 * - `packages/api/src/routers/omExpense.ts` - OMExpense API Router
 * - `packages/db/prisma/schema.prisma` - OMExpense, OMExpenseItem 資料模型
 * - `apps/web/src/app/[locale]/om-expenses/new/page.tsx` - OMExpense 建立頁
 * - `apps/web/src/app/[locale]/om-expenses/[id]/page.tsx` - OMExpense 詳情頁（明細管理）
 * - `apps/web/src/components/om-expense/OMExpenseItemList.tsx` - 明細項目列表組件
 * - `apps/web/src/components/layout/dashboard-layout.tsx` - Dashboard 佈局組件
 *
 * @author IT Department
 * @since Epic 6 - Expense Recording & Financial Integration
 * @modified FEAT-007 - Header-Detail Architecture (2025-12-05)
 * @lastModified 2025-12-05
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from "@/i18n/routing";
import { Plus, LayoutGrid, List, Trash2, Search } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
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

export default function OMExpensesPage() {
  const t = useTranslations('omExpenses');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();

  // 視圖模式狀態
  // CHANGE-006: 預設為 list view
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list');

  // CHANGE-005: 批量選擇狀態
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // 過濾狀態
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedOpCo, setSelectedOpCo] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  // CHANGE-035: 新增搜尋狀態
  const [search, setSearch] = useState<string>('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const limit = 12;

  // 獲取 OpCo 列表（用於過濾器）
  const { data: opCos } = api.operatingCompany.getAll.useQuery();

  // 獲取 OM 類別列表（用於過濾器）
  const { data: categories } = api.omExpense.getCategories.useQuery();

  // 獲取 OM 費用列表
  const { data: omExpenses, isLoading, refetch } = api.omExpense.getAll.useQuery({
    financialYear: selectedYear,
    opCoId: selectedOpCo || undefined,
    category: selectedCategory || undefined,
    // CHANGE-035: 新增搜尋參數
    search: debouncedSearch || undefined,
    page,
    limit,
  });

  // CHANGE-005: 批量刪除 mutation
  const deleteManyMutation = api.omExpense.deleteMany.useMutation({
    onSuccess: (data) => {
      toast({
        title: t('list.batchActions.deleteSuccess', { count: data.deletedCount }),
        variant: 'default',
      });
      setSelectedIds([]);
      setIsDeleteDialogOpen(false);
      void refetch();
    },
    onError: (error) => {
      toast({
        title: t('list.batchActions.deleteError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // CHANGE-005: 選擇處理函數
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (!omExpenses?.items) return;
    const allIds = omExpenses.items.map((om) => om.id);
    setSelectedIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const isAllSelected = omExpenses?.items && omExpenses.items.length > 0 &&
    omExpenses.items.every((om) => selectedIds.includes(om.id));

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    deleteManyMutation.mutate({ ids: selectedIds });
  };

  // 格式化金額
  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
    return `US$${formatted}`;
  };

  // 格式化增長率
  const formatGrowthRate = (rate: number | null) => {
    if (rate === null) return 'N/A';
    const sign = rate >= 0 ? '+' : '';
    return `${sign}${rate.toFixed(1)}%`;
  };

  // 增長率顏色
  const getGrowthRateColor = (rate: number | null) => {
    if (rate === null) return 'bg-gray-500';
    if (rate > 10) return 'bg-red-500'; // 高增長（警告）
    if (rate > 0) return 'bg-yellow-500'; // 正增長
    if (rate < 0) return 'bg-green-500'; // 負增長（節省）
    return 'bg-gray-500'; // 零增長
  };

  // 預算使用率顏色
  const getUtilizationColor = (utilizationRate: number) => {
    if (utilizationRate > 100) return 'text-red-600';
    if (utilizationRate > 90) return 'text-yellow-600';
    return 'text-green-600';
  };

  // 年度選項（過去 3 年 + 當前年 + 未來 3 年，從新到舊排序）
  const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear + 3 - i);

  return (
    <DashboardLayout>
      {/* Breadcrumb 導航 */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">{t('breadcrumb.home')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t('breadcrumb.omExpenses')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 頁面標題 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('title')}</h1>
            <p className="mt-2 text-muted-foreground">
              {t('description')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* 視圖切換按鈕 */}
            <div className="flex border border-input rounded-md">
              <Button
                variant={viewMode === 'card' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('card')}
                className="rounded-r-none"
                title={t('list.viewMode.card')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
                title={t('list.viewMode.list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={() => router.push('/om-expenses/new')}>
              <Plus className="mr-2 h-4 w-4" />
              {t('list.newOMExpense')}
            </Button>
          </div>
        </div>
      </div>

      {/* 過濾器 - CHANGE-035: 新增搜尋功能 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* CHANGE-035: 搜尋輸入框 */}
            <div>
              <label className="mb-2 block text-sm font-medium">{t('list.filters.search')}</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder={t('list.filters.searchPlaceholder')}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            {/* 年度選擇 */}
            <div>
              <label className="mb-2 block text-sm font-medium">{t('list.filters.financialYear')}</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(parseInt(e.target.value));
                  setPage(1);
                }}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    FY{year}
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
                    {opCo.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 類別選擇 */}
            <div>
              <label className="mb-2 block text-sm font-medium">{t('list.filters.category')}</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">{t('list.filters.allCategories')}</option>
                {categories?.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CHANGE-005: 批量操作工具列 */}
      {omExpenses && omExpenses.items.length > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-3">
          <div className="flex items-center gap-4">
            <Checkbox
              id="select-all"
              checked={isAllSelected}
              onCheckedChange={(checked) => {
                if (checked) {
                  handleSelectAll();
                } else {
                  handleDeselectAll();
                }
              }}
            />
            <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
              {isAllSelected ? t('list.batchActions.deselectAll') : t('list.batchActions.selectAll')}
            </label>
            {selectedIds.length > 0 && (
              <Badge variant="secondary">
                {t('list.batchActions.selected', { count: selectedIds.length })}
              </Badge>
            )}
          </div>
          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={deleteManyMutation.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('list.batchActions.delete')}
            </Button>
          )}
        </div>
      )}

      {/* OM 費用列表 */}
      {isLoading ? (
        <div className="text-center py-8">{tCommon('loading')}</div>
      ) : omExpenses && omExpenses.items.length > 0 ? (
        <>
          {/* 卡片視圖 */}
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {omExpenses.items.map((om) => {
                // FEAT-007: Use totalBudgetAmount/totalActualSpent with fallback to legacy fields
                const totalBudget = om.totalBudgetAmount ?? om.budgetAmount ?? 0;
                const totalActual = om.totalActualSpent ?? om.actualSpent ?? 0;
                const itemsCount = om._count?.items ?? 0;
                const utilizationRate = totalBudget > 0
                  ? (totalActual / totalBudget) * 100
                  : 0;
                // FEAT-007: Use defaultOpCo, fallback to legacy opCo
                const displayOpCo = om.defaultOpCo ?? om.opCo;

                const isSelected = selectedIds.includes(om.id);

                return (
                  <Card
                    key={om.id}
                    className={`cursor-pointer transition-shadow hover:shadow-lg ${isSelected ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => router.push(`/om-expenses/${om.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        {/* CHANGE-005: Checkbox */}
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleSelect(om.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <CardTitle className="text-lg">{om.name}</CardTitle>
                            <CardDescription className="mt-1">
                              {om.category}
                            </CardDescription>
                          </div>
                        </div>
                        {om.yoyGrowthRate !== null && (
                          <Badge className={getGrowthRateColor(om.yoyGrowthRate)}>
                            {formatGrowthRate(om.yoyGrowthRate)}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* FEAT-007: 明細項目數量 */}
                        {itemsCount > 0 && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {itemsCount} {t('list.card.items', { defaultValue: '個項目' })}
                            </Badge>
                          </div>
                        )}

                        {/* OpCo（預設或舊版）和供應商 */}
                        {displayOpCo && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">
                              {itemsCount > 0
                                ? t('list.card.defaultOpCo', { defaultValue: '預設 OpCo' })
                                : t('list.card.opCo')}:{' '}
                            </span>
                            <span className="font-medium">{displayOpCo.code}</span>
                          </div>
                        )}
                        {om.vendor && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">{t('list.card.vendor')}: </span>
                            <span className="font-medium">{om.vendor.name}</span>
                          </div>
                        )}

                        {/* 預算金額（總計） */}
                        <div className="flex items-center justify-between border-t pt-3">
                          <span className="text-sm text-muted-foreground">
                            {itemsCount > 0
                              ? t('list.card.totalBudget', { defaultValue: '總預算' })
                              : t('list.card.budget')}
                          </span>
                          <span className="font-semibold">{formatCurrency(totalBudget)}</span>
                        </div>

                        {/* 實際支出（總計） */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {itemsCount > 0
                              ? t('list.card.totalActualSpent', { defaultValue: '總實際支出' })
                              : t('list.card.actualSpent')}
                          </span>
                          <span className={`font-semibold ${getUtilizationColor(utilizationRate)}`}>
                            {formatCurrency(totalActual)}
                          </span>
                        </div>

                        {/* 使用率 */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{t('list.card.utilizationRate')}</span>
                          <span className={`text-sm font-medium ${getUtilizationColor(utilizationRate)}`}>
                            {utilizationRate.toFixed(1)}%
                          </span>
                        </div>

                        {/* 月度記錄數（顯示所有項目的月度記錄總數） */}
                        <div className="border-t pt-3">
                          <span className="text-xs text-muted-foreground">
                            {t('list.card.monthlyRecords')}: {om._count?.monthlyRecords ?? 0} / {itemsCount > 0 ? itemsCount * 12 : 12}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* 表格視圖 */
            <div className="rounded-lg border bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* CHANGE-005: Checkbox 列 */}
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleSelectAll();
                          } else {
                            handleDeselectAll();
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>{t('list.table.name')}</TableHead>
                    <TableHead>{t('list.table.category')}</TableHead>
                    <TableHead>{t('list.table.opCo')}</TableHead>
                    <TableHead className="text-right">{t('list.table.budget')}</TableHead>
                    <TableHead className="text-right">{t('list.table.actualSpent')}</TableHead>
                    <TableHead className="text-right">{t('list.table.utilizationRate')}</TableHead>
                    <TableHead className="text-center">{t('list.table.items')}</TableHead>
                    <TableHead className="text-right">{tCommon('fields.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {omExpenses.items.map((om) => {
                    const totalBudget = om.totalBudgetAmount ?? om.budgetAmount ?? 0;
                    const totalActual = om.totalActualSpent ?? om.actualSpent ?? 0;
                    const itemsCount = om._count?.items ?? 0;
                    const utilizationRate = totalBudget > 0
                      ? (totalActual / totalBudget) * 100
                      : 0;
                    const displayOpCo = om.defaultOpCo ?? om.opCo;
                    const isSelected = selectedIds.includes(om.id);

                    return (
                      <TableRow key={om.id} className={`hover:bg-muted/50 ${isSelected ? 'bg-muted/30' : ''}`}>
                        {/* CHANGE-005: Checkbox */}
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleSelect(om.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/om-expenses/${om.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {om.name}
                          </Link>
                        </TableCell>
                        <TableCell>{om.category}</TableCell>
                        <TableCell>{displayOpCo?.name ?? '-'}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(totalBudget)}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${getUtilizationColor(utilizationRate)}`}>
                          {formatCurrency(totalActual)}
                        </TableCell>
                        <TableCell className={`text-right ${getUtilizationColor(utilizationRate)}`}>
                          {utilizationRate.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-center">
                          {itemsCount > 0 ? (
                            <Badge variant="outline" className="text-xs">
                              {itemsCount}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/om-expenses/${om.id}`}
                            className="text-primary hover:underline"
                          >
                            {tCommon('actions.view')}
                          </Link>
                          <span className="mx-2 text-muted-foreground">|</span>
                          <Link
                            href={`/om-expenses/${om.id}/edit`}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {tCommon('actions.edit')}
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* 分頁控制 */}
          {omExpenses.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                {t('list.pagination.previous')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t('list.pagination.page', { current: page, total: omExpenses.totalPages })}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(omExpenses.totalPages, p + 1))}
                disabled={page === omExpenses.totalPages}
              >
                {t('list.pagination.next')}
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              {selectedYear || selectedOpCo || selectedCategory
                ? t('list.empty.noResults')
                : t('list.empty.noRecords')}
            </p>
            {!selectedYear && !selectedOpCo && !selectedCategory && (
              <Button className="mt-4" onClick={() => router.push('/om-expenses/new')}>
                <Plus className="mr-2 h-4 w-4" />
                {t('list.empty.createFirst')}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* CHANGE-005: 批量刪除確認對話框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('list.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('list.deleteDialog.message', { count: selectedIds.length })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteManyMutation.isPending}>
              {t('list.deleteDialog.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDelete}
              disabled={deleteManyMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteManyMutation.isPending
                ? tCommon('loading')
                : t('list.deleteDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
