/**
 * @fileoverview Expense Detail Page - 費用記錄詳情頁面
 *
 * @description
 * 顯示單一費用記錄的完整資訊，採用表頭-明細結構展示，整合審批工作流和檔案管理功能。
 * 提供費用項目明細表格、關聯專案/採購單資訊、發票預覽和審批操作。
 * 支援即時狀態更新和權限控制，Supervisor 可在此頁面進行審批操作。
 *
 * @page /[locale]/expenses/[id]
 *
 * @features
 * - 費用詳情展示（表頭資訊：發票號、日期、總金額）
 * - 費用項目明細表格（項目名稱、預算類別、金額）
 * - 關聯資訊展示（專案、採購單、供應商）
 * - 發票檔案預覽和下載（Azure Blob Storage）
 * - 審批工作流（提交、審批、拒絕）
 * - 狀態徽章顯示（Draft, Submitted, Approved, Paid）
 * - 審批歷史記錄（狀態變更軌跡）
 * - 編輯操作（僅 Draft 狀態可編輯）
 * - 權限控制（根據角色和費用狀態控制操作權限）
 * - 麵包屑導航和快速操作按鈕
 *
 * @permissions
 * - ProjectManager: 查看自己專案的費用詳情，編輯 Draft 費用
 * - Supervisor: 查看所有費用詳情，審批 Submitted 費用
 * - Admin: 完整權限
 *
 * @routing
 * - 詳情頁: /expenses/[id]
 * - 編輯頁: /expenses/[id]/edit
 * - 返回列表: /expenses
 *
 * @stateManagement
 * - React Query: 費用資料快取和即時更新
 * - Local State: 檔案預覽狀態
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢和 mutation
 * - shadcn/ui: Card, Badge, Table, Button, Breadcrumb
 * - lucide-react: 圖示庫
 *
 * @related
 * - packages/api/src/routers/expense.ts - 費用 API Router
 * - apps/web/src/components/expense/ExpenseForm.tsx - 費用表單組件
 * - apps/web/src/app/[locale]/expenses/[id]/edit/page.tsx - 編輯頁面
 * - apps/web/src/app/[locale]/expenses/page.tsx - 費用列表頁面
 *
 * @author IT Department
 * @since Epic 6 - Expense Recording & Financial Integration (Module 5: 表頭明細重構)
 * @lastModified 2025-11-14
 */

'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import { Link } from "@/i18n/routing";
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import {
  Receipt,
  FileText,
  Calendar,
  DollarSign,
  Edit,
  AlertCircle,
  ShoppingCart,
  Package,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExpenseActions } from '@/components/expense/ExpenseActions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

/**
 * 費用記錄狀態徽章組件
 */
function StatusBadge({ status, t }: { status: string; t: any }) {
  const statusConfig = {
    Draft: { labelKey: 'status.draft', variant: 'outline' as const },
    Submitted: { labelKey: 'status.submitted', variant: 'default' as const },
    Approved: { labelKey: 'status.approved', variant: 'secondary' as const },
    Paid: { labelKey: 'status.paid', variant: 'default' as const },
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  const label = config ? t(config.labelKey) : status;

  return <Badge variant={config?.variant || 'outline'}>{label}</Badge>;
}

/**
 * 格式化貨幣顯示
 */
function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('zh-TW', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function ExpenseDetailPage() {
  const t = useTranslations('expenses');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');
  const params = useParams();
  const id = params.id as string;

  // 查詢費用記錄詳情
  const { data: expense, isLoading } = api.expense.getById.useQuery({ id });

  // 載入狀態
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <Skeleton className="h-5 w-[480px]" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded" />
              <div className="space-y-2">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  // 找不到費用記錄
  if (!expense) {
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
                <BreadcrumbLink asChild><Link href="/expenses">{tNav('menu.expenses')}</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{t('detail.title')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-md space-y-6 text-center">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('detail.notFound')}
                </AlertDescription>
              </Alert>
              <Link href="/expenses">
                <Button>{t('detail.backToList')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
              <BreadcrumbLink asChild><Link href="/expenses">{tNav('menu.expenses')}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{expense.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題和操作按鈕 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Receipt className="h-8 w-8 text-primary" />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-foreground">
                  {expense.name}
                </h1>
                <StatusBadge status={expense.status} t={t} />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {t('detail.fields.expenseDate')}：{new Date(expense.expenseDate).toLocaleDateString('zh-TW')}
              </p>
            </div>
          </div>
          {/* 編輯按鈕 - 僅 Draft 狀態可見 */}
          {expense.status === 'Draft' && (
            <Link href={`/expenses/${expense.id}/edit`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                {tCommon('actions.edit')}
              </Button>
            </Link>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* 基本資訊卡片 */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{t('detail.expenseInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 費用記錄名稱 */}
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('detail.fields.name')}
                  </p>
                  <p className="text-base text-foreground font-medium">
                    {expense.name}
                  </p>
                </div>
              </div>

              {/* 描述 */}
              {expense.description && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{t('detail.fields.description')}</p>
                    <p className="text-base text-foreground">{expense.description}</p>
                  </div>
                </div>
              )}

              {/* 發票信息 */}
              <div className="flex items-start gap-3">
                <Receipt className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('detail.fields.invoiceNumber')}
                  </p>
                  <p className="text-base text-foreground">{expense.invoiceNumber}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('detail.fields.invoiceDate')}
                  </p>
                  <p className="text-base text-foreground">
                    {new Date(expense.invoiceDate).toLocaleDateString('zh-TW', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* 費用日期 */}
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('detail.fields.expenseDate')}
                  </p>
                  <p className="text-base text-foreground">
                    {new Date(expense.expenseDate).toLocaleDateString('zh-TW', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* 總金額 */}
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('detail.fields.totalAmount')}</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(expense.totalAmount)}
                  </p>
                </div>
              </div>

              {/* 額外屬性 */}
              {(expense.requiresChargeOut || expense.isOperationMaint) && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {expense.requiresChargeOut && (
                    <Badge variant="outline">{t('detail.fields.chargeOut')}</Badge>
                  )}
                  {expense.isOperationMaint && (
                    <Badge variant="outline">{t('detail.fields.operationMaint')}</Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 操作按鈕卡片 - Module 5 工作流 */}
          <ExpenseActions
            expenseId={expense.id}
            status={expense.status}
            itemsCount={expense.items?.length || 0}
          />

          {/* 關聯資訊卡片 */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>{t('detail.relatedInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-3">
              {/* 專案 */}
              {expense.project && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{t('detail.fields.project')}</p>
                    <Link
                      href={`/projects/${expense.project.id}`}
                      className="text-base text-primary hover:underline"
                    >
                      {expense.project.name}
                    </Link>
                  </div>
                </div>
              )}

              {/* 採購單 */}
              {expense.purchaseOrder && (
                <div className="flex items-start gap-3">
                  <ShoppingCart className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('detail.fields.purchaseOrder')}
                    </p>
                    <Link
                      href={`/purchase-orders/${expense.purchaseOrder.id}`}
                      className="text-base text-primary hover:underline"
                    >
                      {expense.purchaseOrder.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(expense.purchaseOrder.totalAmount)}
                    </p>
                  </div>
                </div>
              )}

              {/* 供應商 */}
              {expense.vendor && (
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('detail.fields.vendor')}
                    </p>
                    <Link
                      href={`/vendors/${expense.vendor.id}`}
                      className="text-base text-primary hover:underline"
                    >
                      {expense.vendor.name}
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 費用項目明細 - Module 5 表頭明細實施 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                {t('detail.items')}
              </CardTitle>
              <Badge variant="outline">
                {t('detail.itemsCount', { count: expense.items?.length || 0 })}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {expense.items && expense.items.length > 0 ? (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>{t('form.itemFields.itemName.label')}</TableHead>
                      <TableHead>{t('form.itemFields.description.label')}</TableHead>
                      <TableHead>{t('form.itemFields.category.label')}</TableHead>
                      <TableHead className="text-right w-[140px]">{tCommon('currency.amount')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expense.items
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((item, index) => {
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium text-muted-foreground">
                              {index + 1}
                            </TableCell>
                            <TableCell className="font-medium">
                              {item.itemName}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {item.description || '-'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {item.category || '-'}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(item.amount)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>

                {/* 總計 */}
                <div className="flex justify-end pt-4 border-t border-border">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-8">
                      <span className="text-base font-medium text-muted-foreground">
                        {t('detail.total')}
                      </span>
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(expense.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">{t('detail.noItems')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
