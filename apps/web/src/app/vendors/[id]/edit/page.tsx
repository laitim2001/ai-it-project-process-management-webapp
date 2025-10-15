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
import Link from 'next/link';
import { api } from '@/lib/trpc';
import { VendorForm } from '@/components/vendor/VendorForm';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function EditVendorPage() {
  const params = useParams();
  const id = params.id as string;

  // 查詢供應商資料
  const { data: vendor, isLoading, error } = api.vendor.getById.useQuery({ id });

  // 載入狀態
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-lg text-muted-foreground">載入中...</div>
        </div>
      </DashboardLayout>
    );
  }

  // 錯誤或找不到
  if (error || !vendor) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">找不到供應商</h2>
            <p className="text-muted-foreground mb-4">此供應商不存在或已被刪除。</p>
            <Link href="/vendors">
              <Button>返回供應商列表</Button>
            </Link>
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
