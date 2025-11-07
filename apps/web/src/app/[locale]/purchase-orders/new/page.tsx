'use client';

/**
 * 創建新採購單頁面
 *
 * 功能說明：
 * - 使用 PurchaseOrderForm 組件創建新採購單
 * - 支持表頭-明細結構
 * - 自動計算總金額
 *
 * Module 4: PurchaseOrder 表頭明細重構 - 前端實施
 */

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useTranslations } from 'next-intl';
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
