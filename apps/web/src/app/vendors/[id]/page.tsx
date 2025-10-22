'use client';

/**
 * 供應商詳情頁面
 *
 * 功能說明:
 * - 顯示供應商完整資訊
 * - 顯示關聯的報價單和採購單
 * - 編輯和刪除操作
 *
 * Epic 4 - Story 5.1: 管理供應商基本資訊
 */

import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/trpc';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Building2, Mail, Phone, User, Edit, Trash2, FileText, ShoppingCart, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const id = params.id as string;

  // 查詢供應商詳情
  const { data: vendor, isLoading } = api.vendor.getById.useQuery({ id });

  // 刪除 Mutation
  const deleteMutation = api.vendor.delete.useMutation({
    onSuccess: () => {
      showToast('供應商已成功刪除!', 'success');
      router.push('/vendors');
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
    if (confirm('確定要刪除此供應商嗎?\n\n注意: 如果供應商有關聯的報價單或採購單,將無法刪除。')) {
      deleteMutation.mutate({ id });
    }
  };

  // 載入狀態
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <Skeleton className="h-5 w-[420px]" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-9 w-64" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 找不到供應商
  if (!vendor) {
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
                <BreadcrumbLink href="/vendors">供應商管理</BreadcrumbLink>
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
                  找不到供應商。此供應商可能不存在或已被刪除。
                </AlertDescription>
              </Alert>
              <Link href="/vendors">
                <Button>返回供應商列表</Button>
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
              <BreadcrumbLink href="/vendors">供應商管理</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{vendor.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題和操作按鈕 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">{vendor.name}</h1>
          </div>
          <div className="flex gap-2">
            <Link href={`/vendors/${id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                編輯
              </Button>
            </Link>
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
              <CardTitle>基本資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 聯絡人 */}
              {vendor.contactPerson && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">聯絡人</p>
                    <p className="text-base text-foreground">{vendor.contactPerson}</p>
                  </div>
                </div>
              )}

              {/* 聯絡郵箱 */}
              {vendor.contactEmail && (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">聯絡郵箱</p>
                    <a
                      href={`mailto:${vendor.contactEmail}`}
                      className="text-base text-primary hover:underline"
                    >
                      {vendor.contactEmail}
                    </a>
                  </div>
                </div>
              )}

              {/* 聯絡電話 */}
              {vendor.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">聯絡電話</p>
                    <a
                      href={`tel:${vendor.phone}`}
                      className="text-base text-primary hover:underline"
                    >
                      {vendor.phone}
                    </a>
                  </div>
                </div>
              )}

              {/* 如果沒有任何聯絡資訊 */}
              {!vendor.contactPerson && !vendor.contactEmail && !vendor.phone && (
                <p className="text-sm text-muted-foreground italic">尚未提供聯絡資訊</p>
              )}
            </CardContent>
          </Card>

          {/* 統計資訊卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>統計資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">報價單數量</span>
                </div>
                <span className="text-2xl font-bold text-foreground">
                  {vendor.quotes?.length ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">採購單數量</span>
                </div>
                <span className="text-2xl font-bold text-foreground">
                  {vendor.purchaseOrders?.length ?? 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 最近報價單 */}
        {vendor.quotes && vendor.quotes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>最近報價單</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vendor.quotes.map((quote) => (
                  <Link
                    key={quote.id}
                    href={`/quotes/${quote.id}`}
                    className="block p-4 border border-border rounded-lg hover:border-primary hover:shadow-sm transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">
                          金額: ${quote.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          上傳日期: {new Date(quote.uploadDate).toLocaleDateString('zh-TW')}
                        </p>
                      </div>
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 最近採購單 */}
        {vendor.purchaseOrders && vendor.purchaseOrders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>最近採購單</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vendor.purchaseOrders.map((po) => (
                  <Link
                    key={po.id}
                    href={`/purchase-orders/${po.id}`}
                    className="block p-4 border border-border rounded-lg hover:border-primary hover:shadow-sm transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">
                          PO#{po.poNumber}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          專案: {po.project.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          金額: ${po.totalAmount.toLocaleString()}
                        </p>
                      </div>
                      <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
