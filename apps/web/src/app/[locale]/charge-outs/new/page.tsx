'use client';

import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Link } from "@/i18n/routing";
import { ChargeOutForm } from '@/components/charge-out/ChargeOutForm';
import { useRouter } from "@/i18n/routing";

/**
 * ChargeOut 新增頁面
 *
 * 功能：
 * - 創建新的 ChargeOut 記錄
 * - 使用 ChargeOutForm 組件
 */

export default function NewChargeOutPage() {
  const t = useTranslations('chargeOuts');
  const tNav = useTranslations('navigation');
  const router = useRouter();

  return (
    <DashboardLayout>
      {/* Breadcrumb 導航 */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link href="/dashboard">{tNav('home')}</Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <Link href="/charge-outs">{tNav('menu.chargeOuts')}</Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t('form.create.title')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 頁面標題 */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t('form.create.title')}</h1>
            <p className="mt-2 text-muted-foreground">
              {t('form.create.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* ChargeOut 表單 */}
      <ChargeOutForm />
    </DashboardLayout>
  );
}
