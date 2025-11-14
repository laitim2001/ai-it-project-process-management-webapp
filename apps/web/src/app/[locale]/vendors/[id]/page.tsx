/**
 * @fileoverview Vendor Detail Page - 供應商詳情頁面
 *
 * @description
 * 顯示單一供應商的完整資訊，包含基本資料和相關的報價、採購單記錄。
 * 提供編輯和刪除操作，支援查看供應商的交易歷史和統計資料。
 * 整合關聯資料查詢，提供完整的供應商檔案視圖。
 *
 * @page /[locale]/vendors/[id]
 *
 * @features
 * - 供應商詳情展示（名稱、聯絡人、電話、電郵、地址）
 * - 相關報價列表（該供應商的所有報價）
 * - 相關採購單列表（該供應商的所有採購單）
 * - 統計資訊卡片（報價數量、採購單數量）
 * - 編輯操作按鈕（導向編輯頁）
 * - 刪除操作（檢查是否有相關記錄，提供確認對話框）
 * - 聯絡資訊快速操作（電郵和電話點擊呼叫）
 * - 麵包屑導航支援
 *
 * @permissions
 * - ProjectManager: 查看供應商詳情
 * - Supervisor: 完整權限
 * - Admin: 完整權限
 *
 * @routing
 * - 詳情頁: /vendors/[id]
 * - 編輯頁: /vendors/[id]/edit
 * - 返回列表: /vendors
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢、mutation 和快取
 * - shadcn/ui: Card, Button, Alert, Badge
 *
 * @related
 * - packages/api/src/routers/vendor.ts - 供應商 API Router (getById, delete)
 * - apps/web/src/app/[locale]/vendors/page.tsx - 供應商列表頁面
 * - apps/web/src/app/[locale]/vendors/[id]/edit/page.tsx - 編輯頁面
 * - apps/web/src/app/[locale]/quotes/[id]/page.tsx - 報價詳情頁面
 * - apps/web/src/app/[locale]/purchase-orders/[id]/page.tsx - 採購單詳情頁面
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
import { useToast } from '@/components/ui/use-toast';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Building2, Mail, Phone, User, Edit, Trash2, FileText, ShoppingCart, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function VendorDetailPage() {
  const t = useTranslations('vendors');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  // 查詢供應商詳情
  const { data: vendor, isLoading } = api.vendor.getById.useQuery({ id });

  // 刪除 Mutation
  const deleteMutation = api.vendor.delete.useMutation({
    onSuccess: () => {
      toast({
        title: tCommon('messages.success'),
        description: t('messages.deleteSuccess'),
        variant: 'success',
      });
      router.push('/vendors');
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: tCommon('messages.error'),
        description: `${tCommon('messages.deleteFailed')}: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  /**
   * 刪除確認處理
   */
  const handleDelete = () => {
    if (confirm(t('messages.confirmDelete'))) {
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
                <BreadcrumbLink asChild><Link href="/dashboard">{tNav('dashboard')}</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link href="/vendors">{t('title')}</Link></BreadcrumbLink>
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
                  {t('messages.notFound')}
                </AlertDescription>
              </Alert>
              <Link href="/vendors">
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
              <BreadcrumbLink asChild><Link href="/vendors">{t('title')}</Link></BreadcrumbLink>
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
                {tCommon('actions.edit')}
              </Button>
            </Link>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteMutation.isLoading ? tCommon('actions.deleting') : tCommon('actions.delete')}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* 基本資訊卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>{t('detail.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 聯絡人 */}
              {vendor.contactPerson && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('fields.contactPerson')}</p>
                    <p className="text-base text-foreground">{vendor.contactPerson}</p>
                  </div>
                </div>
              )}

              {/* 聯絡郵箱 */}
              {vendor.contactEmail && (
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('fields.email')}</p>
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
                    <p className="text-sm font-medium text-muted-foreground">{t('fields.phone')}</p>
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
                <p className="text-sm text-muted-foreground italic">{t('detail.noContact')}</p>
              )}
            </CardContent>
          </Card>

          {/* 統計資訊卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>{t('detail.statistics')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">{t('fields.quotesCount')}</span>
                </div>
                <span className="text-2xl font-bold text-foreground">
                  {vendor.quotes?.length ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">{t('fields.purchaseOrdersCount')}</span>
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
              <CardTitle>{t('detail.recentQuotes')}</CardTitle>
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
                          {tCommon('fields.amount')}: ${quote.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {tCommon('fields.uploadDate')}: {new Date(quote.uploadDate).toLocaleDateString('zh-TW')}
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
              <CardTitle>{t('detail.recentPurchaseOrders')}</CardTitle>
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
                          {tCommon('fields.project')}: {po.project.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {tCommon('fields.amount')}: ${po.totalAmount.toLocaleString()}
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
