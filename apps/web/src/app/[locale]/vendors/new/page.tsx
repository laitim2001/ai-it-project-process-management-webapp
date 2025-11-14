/**
 * @fileoverview New Vendor Page - 建立供應商頁面
 *
 * @description
 * 提供建立新供應商的表單頁面，支援完整的供應商資訊輸入。
 * 使用 React Hook Form 進行表單驗證，提供即時驗證和錯誤提示。
 * 建立成功後自動導向供應商詳情頁，支援取消操作返回列表頁。
 *
 * @page /[locale]/vendors/new
 *
 * @features
 * - 完整的供應商建立表單（名稱、聯絡人、電話、電郵、地址）
 * - 即時表單驗證（Zod schema）
 * - 電郵格式驗證（RFC 5322）
 * - 電話號碼格式驗證
 * - 錯誤處理和成功提示（Toast）
 * - 麵包屑導航支援
 * - 國際化表單標籤和錯誤訊息
 *
 * @permissions
 * - ProjectManager: 可建立供應商
 * - Supervisor: 完整權限
 * - Admin: 完整權限
 *
 * @routing
 * - 建立頁: /vendors/new
 * - 成功後導向: /vendors/[id] (新建立的供應商詳情頁)
 * - 取消後返回: /vendors (供應商列表頁)
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC mutation 和快取更新
 * - shadcn/ui: Card, Breadcrumb, Form
 *
 * @related
 * - apps/web/src/components/vendor/VendorForm.tsx - 供應商表單組件
 * - packages/api/src/routers/vendor.ts - 供應商 API Router (create procedure)
 * - apps/web/src/app/[locale]/vendors/page.tsx - 供應商列表頁面
 * - apps/web/src/app/[locale]/vendors/[id]/page.tsx - 供應商詳情頁面
 *
 * @author IT Department
 * @since Epic 5 - Procurement & Vendor Management
 * @lastModified 2025-11-14
 */

'use client';

import { VendorForm } from '@/components/vendor/VendorForm';
import { useTranslations } from 'next-intl';
import { Link } from "@/i18n/routing";
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card } from '@/components/ui/card';

export default function NewVendorPage() {
  const t = useTranslations('vendors');
  const tNav = useTranslations('navigation');
  const params = useParams();
  const locale = params.locale as string;
  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-3xl">
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
