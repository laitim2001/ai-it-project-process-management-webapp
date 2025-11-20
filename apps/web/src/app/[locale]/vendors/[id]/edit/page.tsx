/**
 * @fileoverview Edit Vendor Page - 編輯供應商頁面
 *
 * @description
 * 提供編輯現有供應商的表單頁面，支援修改供應商資訊。
 * 使用 React Hook Form 進行表單驗證，預填充現有資料。
 * 提供完整的錯誤處理和載入狀態管理。
 *
 * @page /[locale]/vendors/[id]/edit
 *
 * @features
 * - 完整的供應商編輯表單（預填充現有資料）
 * - 即時表單驗證（Zod schema）
 * - 電郵格式驗證（RFC 5322）
 * - 電話號碼格式驗證
 * - 錯誤處理（供應商不存在、權限錯誤、網路錯誤）
 * - 載入狀態骨架屏
 * - 麵包屑導航支援
 * - 國際化表單標籤和錯誤訊息
 *
 * @permissions
 * - ProjectManager: 可編輯供應商
 * - Supervisor: 完整權限
 * - Admin: 完整權限
 *
 * @routing
 * - 編輯頁: /vendors/[id]/edit
 * - 成功後導向: /vendors/[id] (供應商詳情頁)
 * - 取消後返回: /vendors/[id] (供應商詳情頁)
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢、mutation 和快取
 * - shadcn/ui: Card, Skeleton, Alert, Breadcrumb
 *
 * @related
 * - apps/web/src/components/vendor/VendorForm.tsx - 供應商表單組件
 * - packages/api/src/routers/vendor.ts - 供應商 API Router (getById, update)
 * - apps/web/src/app/[locale]/vendors/[id]/page.tsx - 供應商詳情頁面
 * - apps/web/src/app/[locale]/vendors/page.tsx - 供應商列表頁面
 *
 * @author IT Department
 * @since Epic 5 - Procurement & Vendor Management
 * @lastModified 2025-11-14
 */

'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from "@/i18n/routing";
import { api } from '@/lib/trpc';
import { VendorForm } from '@/components/vendor/VendorForm';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
                <BreadcrumbLink asChild><Link href="/dashboard">首頁</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link href="/vendors">供應商管理</Link></BreadcrumbLink>
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
              <BreadcrumbLink asChild><Link href="/dashboard">首頁</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link href="/vendors">供應商管理</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link href={`/vendors/${id}`}>{vendor.name}</Link></BreadcrumbLink>
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
