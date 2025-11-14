/**
 * @fileoverview New Budget Proposal Page - 建立預算提案頁面
 *
 * @description
 * 提供建立新預算提案的表單頁面，支援專案選擇、金額輸入、說明撰寫等功能。
 * 使用動態載入優化首次載入速度，整合 React Hook Form 進行表單驗證。
 * 提供自動儲存草稿功能，避免用戶意外流失資料。
 *
 * @page /[locale]/proposals/new
 *
 * @features
 * - 完整的提案建立表單（專案、金額、說明、附件）
 * - 即時表單驗證（Zod schema）
 * - 專案選擇（Combobox 組件，支援搜尋）
 * - 金額輸入（自動格式化，貨幣符號）
 * - 說明文字輸入（支援多行文字）
 * - 附件上傳（支援多檔案）
 * - 自動儲存草稿（每 30 秒自動儲存）
 * - 錯誤處理和成功提示（Toast）
 * - 動態載入表單組件（優化首次載入）
 *
 * @permissions
 * - ProjectManager: 可建立自己專案的提案
 * - Supervisor: 可建立任意專案的提案
 * - Admin: 完整權限
 *
 * @routing
 * - 建立頁: /proposals/new
 * - 成功後導向: /proposals/[id] (新建立的提案詳情頁)
 * - 取消後返回: /proposals (提案列表頁)
 *
 * @stateManagement
 * - Form State: React Hook Form
 * - Draft State: LocalStorage (自動儲存草稿)
 * - Loading State: 動態載入狀態
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - next/dynamic: 動態載入組件
 * - @tanstack/react-query: tRPC mutation
 * - shadcn/ui: Card, Skeleton, Breadcrumb
 *
 * @related
 * - packages/api/src/routers/budgetProposal.ts - 提案建立 API
 * - apps/web/src/components/proposal/BudgetProposalForm.tsx - 提案表單組件
 * - apps/web/src/app/[locale]/proposals/page.tsx - 提案列表頁面
 * - apps/web/src/app/[locale]/proposals/[id]/page.tsx - 提案詳情頁面
 *
 * @author IT Department
 * @since Epic 3 - Budget Proposal Workflow
 * @lastModified 2025-11-14
 */

'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Link } from "@/i18n/routing";
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const BudgetProposalForm = dynamic(
  () => import('@/components/proposal/BudgetProposalForm').then((mod) => ({ default: mod.BudgetProposalForm })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  }
);

export default function NewProposalPage() {
  const t = useTranslations('proposals');
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
              <BreadcrumbLink asChild><Link href="/proposals">{t('title')}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('new.title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('new.title')}</h1>
          <p className="mt-2 text-muted-foreground">
            {t('new.description')}
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <CardContent className="pt-6">
            <BudgetProposalForm mode="create" />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
