'use client';

/**
 * 採購單詳情頁面 - Module 4 表頭明細實施
 *
 * 功能說明:
 * - 顯示採購單完整資訊（表頭+明細）
 * - 顯示關聯的專案、供應商、報價單
 * - 顯示採購品項明細表格
 * - 顯示關聯的費用記錄列表
 * - 編輯操作（僅 Draft 狀態）
 * - 提交/審批工作流按鈕
 *
 * Epic 5 - Story 5.4: 生成採購單記錄
 * Module 4: PurchaseOrder 表頭明細重構 - 前端實施
 */

import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/trpc';
import Link from 'next/link';
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
function StatusBadge({ status }: { status: string }) {
  const statusConfig = {
    Draft: { label: '草稿', variant: 'outline' as const },
    Submitted: { label: '已提交', variant: 'default' as const },
    Approved: { label: '已批准', variant: 'secondary' as const },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

/**
 * 費用狀態徽章組件
 */
function ExpenseStatusBadge({ status }: { status: string }) {
  const statusConfig = {
    Draft: { label: '草稿', variant: 'outline' as const },
    PendingApproval: { label: '待審批', variant: 'default' as const },
    Approved: { label: '已批准', variant: 'secondary' as const },
    Paid: { label: '已支付', variant: 'default' as const },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

/**
 * 格式化貨幣顯示
 */
function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PurchaseOrderDetailPage() {
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
                <BreadcrumbLink href="/dashboard">首頁</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/purchase-orders">採購單管理</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>詳情</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-md space-y-6 text-center">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  找不到採購單。此採購單可能不存在或已被刪除。
                </AlertDescription>
              </Alert>
              <Link href="/purchase-orders">
                <Button>返回採購單列表</Button>
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
              <BreadcrumbLink href="/dashboard">首頁</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/purchase-orders">採購單管理</BreadcrumbLink>
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
                <StatusBadge status={purchaseOrder.status} />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                創建於 {new Date(purchaseOrder.date).toLocaleDateString('zh-TW')}
              </p>
            </div>
          </div>
          {/* 編輯按鈕 - 僅 Draft 狀態可見 */}
          {purchaseOrder.status === 'Draft' && (
            <Link href={`/purchase-orders/${purchaseOrder.id}/edit`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                編輯
              </Button>
            </Link>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* 基本資訊卡片 */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>採購資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 採購單名稱 */}
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">採購單名稱</p>
                  <p className="text-base text-foreground font-medium">{purchaseOrder.name}</p>
                </div>
              </div>

              {/* 描述 */}
              {purchaseOrder.description && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">描述</p>
                    <p className="text-base text-foreground">{purchaseOrder.description}</p>
                  </div>
                </div>
              )}

              {/* 採購日期 */}
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">採購日期</p>
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
                  <p className="text-sm font-medium text-muted-foreground">總金額</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(purchaseOrder.totalAmount)}
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
              <CardTitle>關聯資訊</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-3">
              {/* 專案 */}
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">專案</p>
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
                  <p className="text-sm font-medium text-muted-foreground">供應商</p>
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
                    <p className="text-sm font-medium text-muted-foreground">關聯報價單</p>
                    <p className="text-base text-foreground">
                      {formatCurrency(purchaseOrder.quote.amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      上傳於 {new Date(purchaseOrder.quote.uploadDate).toLocaleDateString('zh-TW')}
                    </p>
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
                採購品項明細
              </CardTitle>
              <Badge variant="outline">
                共 {purchaseOrder.items?.length || 0} 項
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
                      <TableHead>品項名稱</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead className="text-right w-[100px]">數量</TableHead>
                      <TableHead className="text-right w-[120px]">單價</TableHead>
                      <TableHead className="text-right w-[140px]">小計</TableHead>
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
                              {formatCurrency(item.unitPrice)}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(subtotal)}
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
                      <span className="text-base font-medium text-muted-foreground">總計</span>
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(purchaseOrder.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">尚無採購品項</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 費用記錄列表 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>費用記錄</CardTitle>
              <Link href={`/expenses/new?purchaseOrderId=${purchaseOrder.id}`}>
                <Button size="sm">
                  <Receipt className="h-4 w-4 mr-2" />
                  新增費用
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
                          <ExpenseStatusBadge status={expense.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          費用日期: {new Date(expense.expenseDate).toLocaleDateString('zh-TW')}
                        </p>
                        {expense.invoiceFilePath && (
                          <p className="text-sm text-muted-foreground">
                            發票: {expense.invoiceFilePath.split('/').pop()}
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
                      <p className="text-sm text-muted-foreground">總費用記錄</p>
                      <p className="text-xl font-bold text-foreground">
                        {purchaseOrder.expenses.length} 筆
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">累計金額</p>
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
                <p className="text-muted-foreground">尚無費用記錄</p>
                <Link href={`/expenses/new?purchaseOrderId=${purchaseOrder.id}`}>
                  <Button variant="outline" size="sm" className="mt-3">
                    新增第一筆費用
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
