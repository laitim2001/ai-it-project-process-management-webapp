'use client';

/**
 * 編輯供應商頁面
 *
 * 功能說明:
 * - 使用 VendorForm 組件編輯現有供應商
 * - 自動載入現有資料
 * - 表單提交後跳轉到詳情頁
 *
 * Epic 4 - Story 5.1: 管理供應商基本資訊
 */

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from "@/i18n/routing";
import { api } from '@/lib/trpc';
import { VendorForm } from '@/components/vendor/VendorForm';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function EditVendorPage() {
  const t = useTranslations('vendors');
  const params = useParams();
  const id = params.id as string;

  // 查詢供應商資料
  const { data: vendor, isLoading, error } = api.vendor.getById.useQuery({ id });

  // 載入狀態
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8 max-w-3xl">
          <Skeleton className="h-5 w-[520px]" />
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Card className="p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // 錯誤或找不到
  if (error || !vendor) {
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
                <BreadcrumbPage>編輯</BreadcrumbPage>
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
      <div className="space-y-8 max-w-3xl">
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
              <BreadcrumbLink href={`/vendors/${id}`}>{vendor.name}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>編輯</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題 */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">編輯供應商</h1>
          <p className="mt-2 text-muted-foreground">更新 {vendor.name} 的資訊</p>
        </div>

        {/* 表單卡片 */}
        <Card className="p-6">
          <VendorForm
            mode="edit"
            initialData={{
              id: vendor.id,
              name: vendor.name,
              contactPerson: vendor.contactPerson,
              contactEmail: vendor.contactEmail,
              phone: vendor.phone,
            }}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
