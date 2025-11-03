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
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card } from '@/components/ui/card';

export default function NewVendorPage() {
  const t = useTranslations('vendors');
  const tNav = useTranslations('navigation');
  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-3xl">
        {/* 麵包屑導航 */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">{tNav('dashboard')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/vendors">{t('title')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('new.title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題 */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('new.title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('new.description')}</p>
        </div>

        {/* 表單卡片 */}
        <Card className="p-6">
          <VendorForm mode="create" />
        </Card>
      </div>
    </DashboardLayout>
  );
}
