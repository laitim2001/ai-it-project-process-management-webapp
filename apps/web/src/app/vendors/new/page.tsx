'use client';

/**
 * 新增供應商頁面
 *
 * 功能說明:
 * - 使用 VendorForm 組件創建新供應商
 * - 麵包屑導航
 * - 表單提交後跳轉到列表頁
 *
 * Epic 4 - Story 5.1: 管理供應商基本資訊
 */

import { VendorForm } from '@/components/vendor/VendorForm';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card } from '@/components/ui/card';

export default function NewVendorPage() {
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
              <BreadcrumbPage>新增供應商</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題 */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">新增供應商</h1>
          <p className="mt-2 text-muted-foreground">填寫供應商基本資訊</p>
        </div>

        {/* 表單卡片 */}
        <Card className="p-6">
          <VendorForm mode="create" />
        </Card>
      </div>
    </DashboardLayout>
  );
}
