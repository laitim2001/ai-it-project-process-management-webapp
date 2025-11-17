/**
 * @fileoverview Expenses List Page - 費用記錄列表頁面
 *
 * @description
 * 顯示所有費用記錄的列表，支援表頭-明細結構、即時搜尋、多條件過濾和雙視圖模式（卡片/表格）。
 * Project Manager 可查看自己專案的費用，Supervisor 可查看所有費用並進行審批操作。
 * 整合費用明細展示，支援展開/摺疊查看詳細費用項目，提供完整的費用管理功能。
 *
 * @page /[locale]/expenses
 *
 * @features
 * - 費用列表展示（支援卡片和表格視圖切換）
 * - 表頭-明細結構展示（可展開查看費用項目）
 * - 即時搜尋（發票編號、描述、專案名稱）
 * - 狀態過濾（Draft, Submitted, Approved, Paid）
 * - 採購單過濾（根據關聯的採購單篩選）
 * - 排序功能（金額、日期、狀態）
 * - 分頁導航（每頁 10/20/50 項）
 * - 快速操作（查看詳情、編輯、提交、審批、刪除）
 * - 角色權限控制（RBAC）
 * - 狀態徽章顯示（不同顏色標示不同狀態）
 *
 * @permissions
 * - ProjectManager: 查看自己專案的費用，建立/編輯 Draft 費用
 * - Supervisor: 查看所有費用，審批 Submitted 費用
 * - Admin: 完整管理權限
 *
 * @routing
 * - 列表頁: /expenses
 * - 建立頁: /expenses/new
 * - 詳情頁: /expenses/[id]
 * - 編輯頁: /expenses/[id]/edit
 *
 * @stateManagement
 * - URL Query Params: 搜尋、過濾、排序、分頁狀態
 * - React Query: 資料快取和即時更新
 * - Local State: 視圖模式（卡片/表格）、搜尋輸入、展開狀態
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢和快取
 * - shadcn/ui: Table, Card, Badge, Input, Button, Select
 * - lucide-react: 圖示庫
 *
 * @related
 * - packages/api/src/routers/expense.ts - 費用 API Router
 * - apps/web/src/components/expense/ExpenseForm.tsx - 費用表單組件
 * - apps/web/src/app/[locale]/expenses/[id]/page.tsx - 費用詳情頁面
 * - packages/db/prisma/schema.prisma - Expense 資料模型
 *
 * @bugfixes
 * - FIX-083: 修復狀態值 PendingApproval → Submitted 以匹配 API
 *
 * @author IT Department
 * @since Epic 6 - Expense Recording & Financial Integration
 * @lastModified 2025-11-14
 */

'use client';

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
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay'; // FEAT-002

export default function ExpensesPage() {
  const t = useTranslations('expenses');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');

  /**
   * 費用狀態配置 (移到組件內部以訪問 t 函數) - FIX-083
   * 修復: PendingApproval → Submitted 以匹配 API schema
   */
  const getExpenseStatusConfig = (status: string) => {
    const configs = {
      Draft: { variant: 'outline' as const },
      Submitted: { variant: 'default' as const },
      Approved: { variant: 'secondary' as const },
      Paid: { variant: 'default' as const },
    };
    const config = configs[status as keyof typeof configs];
    return {
      label: config ? t(`list.filter.${status.toLowerCase()}` as any) : status || tCommon('noData'),
      variant: config?.variant || ('outline' as const),
    };
  };
  // 狀態管理
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [purchaseOrderId, setPurchaseOrderId] = useState<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // 查詢費用列表
  // FIX-039-REVISED: 添加 refetch 配置避免 HotReload 期間的競態條件
  // FIX-083: 修復狀態類型 PendingApproval → Submitted
  const { data, isLoading, error } = api.expense.getAll.useQuery({
    page,
    limit: 10,
    status: status as 'Draft' | 'Submitted' | 'Approved' | 'Paid' | undefined,
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
                <BreadcrumbLink asChild><Link href="/dashboard">{tNav('menu.dashboard')}</Link></BreadcrumbLink>
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
              <BreadcrumbLink asChild><Link href="/dashboard">{tNav('menu.dashboard')}</Link></BreadcrumbLink>
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
                      {stats.statusCounts?.Submitted ?? 0}
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
              <option value="Submitted">{t('list.filter.submitted')}</option>
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
                                  <CurrencyDisplay
                                    amount={expense.totalAmount}
                                    currency={
                                      expense.currency ??
                                      expense.purchaseOrder.currency ??
                                      expense.purchaseOrder.project.currency
                                    }
                                  />
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
                          <CurrencyDisplay
                            amount={expense.totalAmount}
                            currency={
                              expense.currency ??
                              expense.purchaseOrder.currency ??
                              expense.purchaseOrder.project.currency
                            }
                          />
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getExpenseStatusConfig(expense.status).variant}>
                          {getExpenseStatusConfig(expense.status).label}
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
