/**
 * @fileoverview New Charge Out Page - 建立費用轉嫁頁面
 *
 * @description
 * 提供建立新費用轉嫁的表單頁面，支援專案選擇、預算類別選擇和成本中心輸入。
 * 使用 React Hook Form 進行表單驗證，提供即時驗證和錯誤提示。
 *
 * @page /[locale]/charge-outs/new
 *
 * @features
 * - 完整的費用轉嫁建立表單（專案、預算類別、成本中心、金額、描述）
 * - 專案選擇（Combobox 組件）
 * - 預算類別選擇（從專案預算池載入）
 * - 成本中心輸入（目標部門/成本中心代碼）
 * - 金額輸入（自動格式化，貨幣符號）
 * - 即時表單驗證（Zod schema）
 * - 錯誤處理和成功提示（Toast）
 *
 * @permissions
 * - ProjectManager: 可建立自己專案的費用轉嫁
 * - Supervisor: 可建立任意專案的費用轉嫁
 * - Admin: 完整權限
 *
 * @routing
 * - 建立頁: /charge-outs/new
 * - 成功後導向: /charge-outs/[id] (新建立的費用轉嫁詳情頁)
 * - 取消後返回: /charge-outs (費用轉嫁列表頁)
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢和快取
 * - shadcn/ui: UI 組件庫
 *
 * @author IT Department
 * @since Epic 6 - Expense Recording & Financial Integration
 * @lastModified 2025-11-14
 */

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
