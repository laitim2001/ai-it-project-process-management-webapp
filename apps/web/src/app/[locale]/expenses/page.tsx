'use client';

/**
 * 費用列表頁面
 *
 * 功能說明:
 * - 費用列表展示（分頁）
 * - 按狀態篩選（Draft, PendingApproval, Approved, Paid）
 * - 按採購單篩選
 * - 搜尋功能
 * - 導航到詳情/新增/編輯頁面
 *
 * Epic 6 - Story 6.1 & 6.2: 費用記錄與審批
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import { Link } from "@/i18n/routing";
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/select';
import { PaginationControls } from '@/components/ui';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Receipt, Calendar, DollarSign, FileText, ShoppingCart, AlertCircle, LayoutGrid, List } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * 費用狀態配置
 */
const EXPENSE_STATUS_CONFIG = {
  Draft: { label: 'list.filter.draft', variant: 'outline' as const },
  PendingApproval: { label: 'list.filter.pendingApproval', variant: 'default' as const },
  Approved: { label: 'list.filter.approved', variant: 'secondary' as const },
  Paid: { label: 'list.filter.paid', variant: 'default' as const },
} as const;

/**
 * 安全獲取費用狀態配置
 */
const getExpenseStatusConfig = (status: string, t: any) => {
  const config = EXPENSE_STATUS_CONFIG[status as keyof typeof EXPENSE_STATUS_CONFIG];
  return {
    label: config ? t(config.label) : status || t('common.noData'),
    variant: config?.variant || ('outline' as const),
  };
};

export default function ExpensesPage() {
  const t = useTranslations('expenses');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');
  // 狀態管理
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [purchaseOrderId, setPurchaseOrderId] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // 查詢費用列表
  // FIX-039-REVISED: 添加 refetch 配置避免 HotReload 期間的競態條件
  const { data, isLoading, error } = api.expense.getAll.useQuery({
    page,
    limit: 10,
    status: status as 'Draft' | 'PendingApproval' | 'Approved' | 'Paid' | undefined,
    purchaseOrderId,
  }, {
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // 查詢所有採購單（用於篩選）
  // 注意：API 限制最大 limit 為 100，如需更多數據請使用分頁
  // FIX-039-REVISED: 添加 refetch 配置避免 HotReload 期間的競態條件
  const { data: purchaseOrders } = api.purchaseOrder.getAll.useQuery({
    page: 1,
    limit: 100,
  }, {
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // 查詢統計資訊
  // FIX-039-REVISED: 添加 refetch 配置避免 HotReload 期間的競態條件
  const { data: stats } = api.expense.getStats.useQuery(undefined, {
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
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
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
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
                <BreadcrumbLink href="/dashboard">{tNav('menu.dashboard')}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{tNav('menu.expenses')}</BreadcrumbPage>
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

  const expenses = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* 麵包屑導航 */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">{tNav('menu.dashboard')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{tNav('menu.expenses')}</BreadcrumbPage>
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
            <Link href="/expenses/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('list.newExpense')}
              </Button>
            </Link>
          </div>
        </div>

        {/* 統計卡片 */}
        {stats && (
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('list.stats.totalRecords')}</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalExpenses}</p>
                  </div>
                  <Receipt className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('list.stats.totalAmount')}</p>
                    <p className="text-2xl font-bold text-primary">
                      ${stats.totalAmount?.toLocaleString() ?? 0}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('list.stats.pendingCount')}</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {stats.statusCounts?.PendingApproval ?? 0}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('list.stats.paidCount')}</p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.statusCounts?.Paid ?? 0}
                    </p>
                  </div>
                  <Receipt className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 篩選欄 */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Select
              value={status || ''}
              onChange={(e) => {
                setStatus(e.target.value || undefined);
                setPage(1);
              }}
            >
              <option value="">{t('list.filter.allStatus')}</option>
              <option value="Draft">{t('list.filter.draft')}</option>
              <option value="PendingApproval">{t('list.filter.pendingApproval')}</option>
              <option value="Approved">{t('list.filter.approved')}</option>
              <option value="Paid">{t('list.filter.paid')}</option>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <Select
              value={purchaseOrderId || ''}
              onChange={(e) => {
                setPurchaseOrderId(e.target.value || undefined);
                setPage(1);
              }}
            >
              <option value="">{t('list.filter.allPurchaseOrders')}</option>
              {purchaseOrders?.items.map((po) => (
                <option key={po.id} value={po.id}>
                  {po.poNumber} - {po.project.name}
                </option>
              ))}
            </Select>
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

        {/* 費用顯示 - 根據視圖模式切換 */}
        {expenses.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Receipt className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-lg font-medium text-foreground">{t('list.empty')}</h3>
                <p className="mt-1 text-muted-foreground">
                  {status || purchaseOrderId ? t('list.noResults') : t('list.startRecording')}
                </p>
                <Link href="/expenses/new">
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    {t('list.addFirstExpense')}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'card' ? (
          <>
            {/* 卡片視圖 */}
            <div className="space-y-4">
              {expenses.map((expense) => (
                <Link key={expense.id} href={`/expenses/${expense.id}`} className="block">
                  <Card className="hover:border-primary hover:shadow-md transition cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        {/* 左側：主要資訊 */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <Receipt className="h-6 w-6 text-primary" />
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold text-foreground">
                                  ${expense.totalAmount.toLocaleString()}
                                </h3>
                                <Badge variant={getExpenseStatusConfig(expense.status).variant}>
                                  {getExpenseStatusConfig(expense.status).label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {new Date(expense.expenseDate).toLocaleDateString('zh-TW')}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-9">
                            {/* 採購單 */}
                            <div className="flex items-center gap-2">
                              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">{t('list.card.purchaseOrder')}</p>
                                <p className="text-sm font-medium text-foreground">
                                  {expense.purchaseOrder.poNumber}
                                </p>
                              </div>
                            </div>

                            {/* 專案 */}
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">{t('list.card.project')}</p>
                                <p className="text-sm font-medium text-foreground">
                                  {expense.purchaseOrder.project.name}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* 發票 */}
                          {expense.invoiceFilePath && (
                            <div className="flex items-center gap-2 pl-9 text-sm text-muted-foreground">
                              <FileText className="h-4 w-4" />
                              <span>{expense.invoiceFilePath.split('/').pop()}</span>
                            </div>
                          )}
                        </div>

                        {/* 右側：日期 */}
                        <div className="text-right text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          {new Date(expense.createdAt).toLocaleDateString('zh-TW')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
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
                    <TableHead className="text-right">{t('list.table.amount')}</TableHead>
                    <TableHead>{t('list.table.status')}</TableHead>
                    <TableHead>{t('list.table.purchaseOrder')}</TableHead>
                    <TableHead>{t('list.table.project')}</TableHead>
                    <TableHead>{t('list.table.date')}</TableHead>
                    <TableHead>{t('list.table.invoice')}</TableHead>
                    <TableHead className="text-right">{t('list.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id} className="hover:bg-muted/50">
                      <TableCell className="text-right font-medium">
                        <Link
                          href={`/expenses/${expense.id}`}
                          className="text-primary hover:underline flex items-center justify-end gap-2"
                        >
                          <Receipt className="h-4 w-4" />
                          ${expense.totalAmount.toLocaleString()}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getExpenseStatusConfig(expense.status, t).variant}>
                          {getExpenseStatusConfig(expense.status, t).label}
                        </Badge>
                      </TableCell>
                      <TableCell>{expense.purchaseOrder.poNumber}</TableCell>
                      <TableCell>{expense.purchaseOrder.project.name}</TableCell>
                      <TableCell>
                        {new Date(expense.expenseDate).toLocaleDateString('zh-TW')}
                      </TableCell>
                      <TableCell>
                        {expense.invoiceFilePath ? (
                          <span className="text-sm text-muted-foreground">
                            {expense.invoiceFilePath.split('/').pop()}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/expenses/${expense.id}`}
                          className="text-primary hover:underline"
                        >
                          {tCommon('actions.view')}
                        </Link>
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
    </DashboardLayout>
  );
}
