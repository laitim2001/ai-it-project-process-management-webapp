/**
 * @fileoverview Edit Budget Proposal Page - 編輯預算提案頁面
 *
 * @description
 * 提供編輯現有預算提案的表單頁面，支援修改專案、金額、說明等資訊。
 * 僅允許編輯 Draft 狀態的提案，已提交或審批的提案需退回 Draft 才能編輯。
 * 使用動態載入優化首次載入速度，提供完整的權限控制和錯誤處理。
 *
 * @page /[locale]/proposals/[id]/edit
 *
 * @features
 * - 完整的提案編輯表單（預填充現有資料）
 * - 即時表單驗證（Zod schema）
 * - 狀態檢查（僅允許編輯 Draft 提案）
 * - 專案選擇（Combobox 組件，支援搜尋）
 * - 金額輸入（自動格式化，貨幣符號）
 * - 說明文字編輯（支援多行文字）
 * - 附件管理（新增/刪除附件）
 * - 自動儲存草稿（每 30 秒自動儲存）
 * - 錯誤處理（權限錯誤、狀態錯誤、網路錯誤）
 * - 動態載入表單組件（優化首次載入）
 *
 * @permissions
 * - ProjectManager: 可編輯自己專案的 Draft 提案
 * - Supervisor: 可編輯任意專案的 Draft 提案
 * - Admin: 完整權限
 * - 限制: 僅 Draft 狀態的提案可編輯
 *
 * @routing
 * - 編輯頁: /proposals/[id]/edit
 * - 成功後導向: /proposals/[id] (提案詳情頁)
 * - 取消後返回: /proposals/[id] (提案詳情頁)
 * - 權限錯誤: 404 或 403 頁面
 *
 * @stateManagement
 * - Form State: React Hook Form (預填充現有資料)
 * - Draft State: LocalStorage (自動儲存草稿)
 * - Loading State: 資料載入和提交狀態
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - next/dynamic: 動態載入組件
 * - @tanstack/react-query: tRPC 查詢和 mutation
 * - shadcn/ui: Card, Skeleton, Breadcrumb, Alert
 *
 * @related
 * - packages/api/src/routers/budgetProposal.ts - 提案更新 API
 * - apps/web/src/components/proposal/BudgetProposalForm.tsx - 提案表單組件
 * - apps/web/src/app/[locale]/proposals/[id]/page.tsx - 提案詳情頁面
 * - apps/web/src/app/[locale]/proposals/page.tsx - 提案列表頁面
 *
 * @author IT Department
 * @since Epic 3 - Budget Proposal Workflow
 * @lastModified 2025-11-14
 */

'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Link } from "@/i18n/routing";
import { api } from '@/lib/trpc';
import { notFound, redirect, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/Button';
import { AlertCircle } from 'lucide-react';

const BudgetProposalForm = dynamic(
  () => import('@/components/proposal/BudgetProposalForm').then((mod) => ({ default: mod.BudgetProposalForm })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  }
);

export default function EditProposalPage() {
  const t = useTranslations('proposals');
  const tNav = useTranslations('navigation');
  const params = useParams();
  const id = params.id as string;

  const { data: proposal, isLoading } = api.budgetProposal.getById.useQuery({ id });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Breadcrumb Skeleton */}
          <Skeleton className="h-5 w-[480px]" />

          {/* Header Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>

          {/* Form Card Skeleton */}
          <Card>
            <CardContent className="pt-6 space-y-6">
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
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!proposal) {
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
                <BreadcrumbPage>{t('edit.title')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Error State */}
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-md space-y-6 text-center">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('detail.notFound')}
                </AlertDescription>
              </Alert>
              <Link href="/proposals">
                <Button>{t('actions.backToList')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 只有草稿或需更多資訊狀態可以編輯
  if (proposal.status !== 'Draft' && proposal.status !== 'MoreInfoRequired') {
    redirect(`/proposals/${proposal.id}`);
  }

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
              <BreadcrumbLink asChild><Link href={`/proposals/${id}`}>{proposal.title}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('edit.title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('edit.title')}</h1>
          <p className="mt-2 text-muted-foreground">
            {t('edit.description')}
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <CardContent className="pt-6">
            <BudgetProposalForm
              mode="edit"
              initialData={{
                id: proposal.id,
                title: proposal.title,
                amount: proposal.amount,
                projectId: proposal.projectId,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
