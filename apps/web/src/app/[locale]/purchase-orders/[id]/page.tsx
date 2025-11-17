/**
 * @fileoverview Purchase Order Detail Page - 採購單詳情頁面
 *
 * @description
 * 顯示單一採購單的完整資訊，包含專案、供應商、報價、採購品項明細和相關費用記錄。
 * 提供編輯操作（僅 Draft 狀態）、工作流操作（提交、批准）和查看關聯的費用記錄。
 * 支援表頭明細結構展示，符合 Epic 5 Module 4 規格。
 *
 * @page /[locale]/purchase-orders/[id]
 *
 * @features
 * - 採購單詳情展示（採購單號、名稱、日期、狀態、總金額）
 * - 專案資訊展示（專案名稱、預算池）
 * - 供應商資訊展示（供應商名稱、聯絡資訊）
 * - 報價資訊展示（報價金額、上傳日期）
 * - 採購品項明細表格（品項名稱、數量、單價、小計）
 * - 相關費用記錄列表（該採購單的所有費用）
 * - 編輯操作按鈕（僅 Draft 狀態可見）
 * - 工作流操作（提交、批准）
 * - 麵包屑導航支援
 *
 * @permissions
 * - ProjectManager: 查看自己專案的採購單詳情
 * - Supervisor: 查看所有採購單詳情
 * - Admin: 完整權限
 *
 * @routing
 * - 詳情頁: /purchase-orders/[id]
 * - 編輯頁: /purchase-orders/[id]/edit
 * - 返回列表: /purchase-orders
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢和快取
 * - shadcn/ui: Card, Table, Badge, Button, Alert
 *
 * @related
 * - packages/api/src/routers/purchaseOrder.ts - 採購單 API Router (getById)
 * - apps/web/src/components/purchase-order/PurchaseOrderActions.tsx - 工作流操作組件
 * - apps/web/src/app/[locale]/purchase-orders/page.tsx - 採購單列表頁面
 * - apps/web/src/app/[locale]/purchase-orders/[id]/edit/page.tsx - 編輯頁面
 * - apps/web/src/app/[locale]/expenses/[id]/page.tsx - 費用詳情頁面
 * - apps/web/src/app/[locale]/projects/[id]/page.tsx - 專案詳情頁面
 * - apps/web/src/app/[locale]/vendors/[id]/page.tsx - 供應商詳情頁面
 *
 * @author IT Department
 * @since Epic 5 - Procurement & Vendor Management
 * @lastModified 2025-11-14
 */

'use client';

import { useRouter } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { useParams } from "next/navigation";
import { api } from '@/lib/trpc';
import { Link } from "@/i18n/routing";
import { useToast } from '@/components/ui';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { ShoppingCart, FileText, Building2, Calendar, DollarSign, Edit, Receipt, AlertCircle, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PurchaseOrderActions } from '@/components/purchase-order/PurchaseOrderActions';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay'; // FEAT-002
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

/**
 * 採購單狀態徽章組件
 */
function StatusBadge({ status, t }: { status: string; t: any }) {
  const statusConfig = {
    Draft: { label: t('status.draft'), variant: 'outline' as const },
    Submitted: { label: t('status.submitted'), variant: 'default' as const },
    Approved: { label: t('status.approved'), variant: 'secondary' as const },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

/**
 * 費用狀態徽章組件
 */
function ExpenseStatusBadge({ status, t }: { status: string; t: any }) {
  const statusConfig = {
    Draft: { label: t('expenseStatus.draft'), variant: 'outline' as const },
    PendingApproval: { label: t('expenseStatus.pending'), variant: 'default' as const },
    Approved: { label: t('expenseStatus.approved'), variant: 'secondary' as const },
    Paid: { label: t('expenseStatus.paid'), variant: 'default' as const },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default function PurchaseOrderDetailPage() {
  const t = useTranslations('purchaseOrders');
  const tNav = useTranslations('navigation');
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  // 查詢採購單詳情
  const { data: purchaseOrder, isLoading } = api.purchaseOrder.getById.useQuery({ id });

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

  // 找不到採購單
  if (!purchaseOrder) {
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
                <BreadcrumbLink asChild><Link href="/purchase-orders">{t('title')}</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{t('detail.breadcrumb')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-md space-y-6 text-center">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('errors.notFound')}
                </AlertDescription>
              </Alert>
              <Link href="/purchase-orders">
                <Button>{t('actions.backToList')}</Button>
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
              <BreadcrumbLink asChild><Link href="/dashboard">{tNav('dashboard')}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link href="/purchase-orders">{t('title')}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{purchaseOrder.poNumber}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題和操作按鈕 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-primary" />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-foreground">{purchaseOrder.name}</h1>
                <StatusBadge status={purchaseOrder.status} t={t} />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {t('detail.createdAt', { date: new Date(purchaseOrder.date).toLocaleDateString('zh-TW') })}
              </p>
            </div>
          </div>
          {/* 編輯按鈕 - 僅 Draft 狀態可見 */}
          {purchaseOrder.status === 'Draft' && (
            <Link href={`/purchase-orders/${purchaseOrder.id}/edit`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                {t('actions.edit')}
              </Button>
            </Link>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* 基本資訊卡片 */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{t('detail.purchaseInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 採購單名稱 */}
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{t('fields.name')}</p>
                  <p className="text-base text-foreground font-medium">{purchaseOrder.name}</p>
                </div>
              </div>

              {/* 描述 */}
              {purchaseOrder.description && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{t('fields.description')}</p>
                    <p className="text-base text-foreground">{purchaseOrder.description}</p>
                  </div>
                </div>
              )}

              {/* 採購日期 */}
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('fields.date')}</p>
                  <p className="text-base text-foreground">
                    {new Date(purchaseOrder.date).toLocaleDateString('zh-TW', {
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
                  <p className="text-sm font-medium text-muted-foreground">{t('fields.totalAmount')}</p>
                  <p className="text-2xl font-bold text-primary">
                    <CurrencyDisplay
                      amount={purchaseOrder.totalAmount}
                      currency={purchaseOrder.currency ?? purchaseOrder.project.currency}
                    />
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 操作按鈕卡片 - Module 4 工作流 */}
          <PurchaseOrderActions
            purchaseOrderId={purchaseOrder.id}
            status={purchaseOrder.status}
            itemsCount={purchaseOrder.items?.length || 0}
          />

          {/* 關聯資訊卡片 */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>{t('detail.relatedInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-3">
              {/* 專案 */}
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{t('fields.project')}</p>
                  <Link
                    href={`/projects/${purchaseOrder.project.id}`}
                    className="text-base text-primary hover:underline"
                  >
                    {purchaseOrder.project.name}
                  </Link>
                </div>
              </div>

              {/* 供應商 */}
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">{t('fields.vendor')}</p>
                  <Link
                    href={`/vendors/${purchaseOrder.vendor.id}`}
                    className="text-base text-primary hover:underline"
                  >
                    {purchaseOrder.vendor.name}
                  </Link>
                </div>
              </div>

              {/* 關聯報價單 */}
              {purchaseOrder.quote && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{t('fields.relatedQuote')}</p>
                    <Link
                      href={`/projects/${purchaseOrder.projectId}/quotes`}
                      className="text-base text-primary hover:underline font-medium"
                    >
                      {purchaseOrder.vendor.name} - <CurrencyDisplay
                        amount={purchaseOrder.quote.amount}
                        currency={purchaseOrder.currency ?? purchaseOrder.project.currency}
                      />
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {t('detail.uploadedAt', { date: new Date(purchaseOrder.quote.uploadDate).toLocaleDateString('zh-TW') })}
                    </p>
                    {purchaseOrder.quote.filePath && (
                      <a
                        href={purchaseOrder.quote.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                      >
                        <FileText className="h-3 w-3" />
                        {t('actions.viewDocument')}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 採購品項明細 - Module 4 表頭明細實施 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t('detail.items.title')}
              </CardTitle>
              <Badge variant="outline">
                {t('detail.items.count', { count: purchaseOrder.items?.length || 0 })}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {purchaseOrder.items && purchaseOrder.items.length > 0 ? (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">#</TableHead>
                      <TableHead>{t('items.itemName')}</TableHead>
                      <TableHead>{t('items.description')}</TableHead>
                      <TableHead className="text-right w-[100px]">{t('items.quantity')}</TableHead>
                      <TableHead className="text-right w-[120px]">{t('items.unitPrice')}</TableHead>
                      <TableHead className="text-right w-[140px]">{t('items.subtotal')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrder.items
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((item, index) => {
                        const subtotal = item.quantity * item.unitPrice;
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
                            <TableCell className="text-right">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right">
                              <CurrencyDisplay
                                amount={item.unitPrice}
                                currency={purchaseOrder.currency ?? purchaseOrder.project.currency}
                              />
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              <CurrencyDisplay
                                amount={subtotal}
                                currency={purchaseOrder.currency ?? purchaseOrder.project.currency}
                              />
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
                      <span className="text-base font-medium text-muted-foreground">{t('detail.items.total')}</span>
                      <span className="text-2xl font-bold text-primary">
                        <CurrencyDisplay
                          amount={purchaseOrder.totalAmount}
                          currency={purchaseOrder.currency ?? purchaseOrder.project.currency}
                        />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">{t('detail.items.empty')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 費用記錄列表 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('detail.expenses.title')}</CardTitle>
              <Link href={`/expenses/new?purchaseOrderId=${purchaseOrder.id}`}>
                <Button size="sm">
                  <Receipt className="h-4 w-4 mr-2" />
                  {t('detail.expenses.addExpense')}
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {purchaseOrder.expenses && purchaseOrder.expenses.length > 0 ? (
              <div className="space-y-3">
                {purchaseOrder.expenses.map((expense) => (
                  <Link
                    key={expense.id}
                    href={`/expenses/${expense.id}`}
                    className="block p-4 border border-border rounded-lg hover:border-primary hover:shadow-sm transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium text-foreground">
                            ${expense.totalAmount.toLocaleString()}
                          </p>
                          <ExpenseStatusBadge status={expense.status} t={t} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {t('detail.expenses.expenseDate')}: {new Date(expense.expenseDate).toLocaleDateString('zh-TW')}
                        </p>
                        {expense.invoiceFilePath && (
                          <p className="text-sm text-muted-foreground">
                            {t('detail.expenses.invoice')}: {expense.invoiceFilePath.split('/').pop()}
                          </p>
                        )}
                      </div>
                      <Receipt className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </Link>
                ))}

                {/* 費用統計摘要 */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('detail.expenses.totalCount')}</p>
                      <p className="text-xl font-bold text-foreground">
                        {t('detail.expenses.countLabel', { count: purchaseOrder.expenses.length })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('detail.expenses.cumulativeAmount')}</p>
                      <p className="text-xl font-bold text-foreground">
                        ${purchaseOrder.expenses.reduce((sum, exp) => sum + exp.amount, 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">{t('detail.expenses.empty')}</p>
                <Link href={`/expenses/new?purchaseOrderId=${purchaseOrder.id}`}>
                  <Button variant="outline" size="sm" className="mt-3">
                    {t('detail.expenses.addFirst')}
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
