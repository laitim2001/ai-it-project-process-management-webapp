'use client';

/**
 * 採購單詳情頁面
 *
 * 功能說明:
 * - 顯示採購單完整資訊
 * - 顯示關聯的專案、供應商、報價單
 * - 顯示關聯的費用記錄列表
 * - 編輯和刪除操作
 *
 * Epic 5 - Story 5.4: 生成採購單記錄
 */

import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/trpc';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { ShoppingCart, FileText, Building2, Calendar, DollarSign, Edit, Trash2, Receipt, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const id = params.id as string;

  // 查詢採購單詳情
  const { data: purchaseOrder, isLoading } = api.purchaseOrder.getById.useQuery({ id });

  // 刪除 Mutation
  const deleteMutation = api.purchaseOrder.delete.useMutation({
    onSuccess: () => {
      showToast('採購單已成功刪除!', 'success');
      router.push('/purchase-orders');
      router.refresh();
    },
    onError: (error) => {
      showToast(`刪除失敗: ${error.message}`, 'error');
    },
  });

  /**
   * 刪除確認處理
   */
  const handleDelete = () => {
    if (confirm('確定要刪除此採購單嗎?\n\n注意: 如果採購單有關聯的費用記錄,將無法刪除。')) {
      deleteMutation.mutate({ id });
    }
  };

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
              <h1 className="text-3xl font-bold text-foreground">{purchaseOrder.poNumber}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                創建於 {new Date(purchaseOrder.date).toLocaleDateString('zh-TW')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteMutation.isLoading ? '刪除中...' : '刪除'}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* 基本資訊卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>採購資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 採購單編號 */}
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">採購單編號</p>
                  <p className="text-base text-foreground font-mono">{purchaseOrder.poNumber}</p>
                </div>
              </div>

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
                    ${purchaseOrder.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 關聯資訊卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>關聯資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                      ${purchaseOrder.quote.amount.toLocaleString()}
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
                            ${expense.amount.toLocaleString()}
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
