/**
 * @fileoverview New Purchase Order Page - 建立採購單頁面
 *
 * @description
 * 提供建立新採購單的表單頁面，支援專案、供應商、報價選擇和採購品項明細輸入。
 * 使用 React Hook Form 進行表單驗證，整合報價資訊自動填充金額。
 * 支援表頭明細結構（採購單表頭 + 品項明細），符合 Epic 5 Module 4 規格。
 *
 * @page /[locale]/purchase-orders/new
 *
 * @features
 * - 完整的採購單建立表單（專案、供應商、報價、金額、日期、品項明細）
 * - 專案選擇（Combobox 組件）
 * - 供應商選擇（Combobox 組件）
 * - 報價選擇（根據選定的專案和供應商載入）
 * - 自動填充金額（從報價資料）
 * - 採購品項明細管理（新增、編輯、刪除品項）
 * - 即時表單驗證（Zod schema）
 * - 錯誤處理和成功提示（Toast）
 * - 麵包屑導航支援
 *
 * @permissions
 * - ProjectManager: 可建立自己專案的採購單
 * - Supervisor: 可建立任意專案的採購單
 * - Admin: 完整權限
 *
 * @routing
 * - 建立頁: /purchase-orders/new
 * - 成功後導向: /purchase-orders/[id] (新建立的採購單詳情頁)
 * - 取消後返回: /purchase-orders (採購單列表頁)
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC mutation 和快取更新
 * - shadcn/ui: Breadcrumb, Card, Form
 *
 * @related
 * - apps/web/src/components/purchase-order/PurchaseOrderForm.tsx - 採購單表單組件
 * - packages/api/src/routers/purchaseOrder.ts - 採購單 API Router (create)
 * - apps/web/src/app/[locale]/purchase-orders/page.tsx - 採購單列表頁面
 * - apps/web/src/app/[locale]/purchase-orders/[id]/page.tsx - 採購單詳情頁面
 * - packages/db/prisma/schema.prisma - PurchaseOrder, PurchaseOrderItem 資料模型
 *
 * @author IT Department
 * @since Epic 5 - Procurement & Vendor Management
 * @lastModified 2025-11-14
 */

'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useTranslations } from 'next-intl';
import { Link } from "@/i18n/routing";
import { useParams } from 'next/navigation';
import { PurchaseOrderForm } from '@/components/purchase-order/PurchaseOrderForm';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';

export default function NewPurchaseOrderPage() {
  const t = useTranslations('purchaseOrders');
  const tNav = useTranslations('navigation');
  const params = useParams();
  const locale = params.locale as string;
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link href="/dashboard">{tNav('dashboard')}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link href="/purchase-orders">{t('title')}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('new.breadcrumb')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題 */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('new.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('new.description')}
          </p>
        </div>

        {/* 表單 */}
        <PurchaseOrderForm />
      </div>
    </DashboardLayout>
  );
}
