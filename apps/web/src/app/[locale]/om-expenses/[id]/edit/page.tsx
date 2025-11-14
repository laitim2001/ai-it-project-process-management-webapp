/**
 * @fileoverview Edit O&M Expense Page - 編輯維運費用頁面
 *
 * @description
 * 提供編輯現有維運費用的表單頁面，支援修改費用資訊。
 * 僅允許編輯 Draft 狀態的維運費用，使用 React Hook Form 進行表單驗證。
 *
 * @page /[locale]/om-expenses/[id]/edit
 *
 * @features
 * - 完整的維運費用編輯表單（預填充現有資料）
 * - 修改預算類別、金額、描述、發票
 * - 狀態檢查（僅允許編輯 Draft 費用）
 * - 即時表單驗證（Zod schema）
 * - 錯誤處理（權限錯誤、狀態錯誤、網路錯誤）
 *
 * @permissions
 * - ProjectManager: 可編輯自己的 Draft 維運費用
 * - Supervisor: 可編輯任意 Draft 維運費用
 * - Admin: 完整權限
 * - 限制: 僅 Draft 狀態的費用可編輯
 *
 * @routing
 * - 編輯頁: /om-expenses/[id]/edit
 * - 成功後導向: /om-expenses/[id] (維運費用詳情頁)
 * - 取消後返回: /om-expenses/[id] (維運費用詳情頁)
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢和快取
 * - shadcn/ui: UI 組件庫
 *
 * @related
 * - `packages/api/src/routers/omExpense.ts` - OMExpense API Router（getById、update 操作）
 * - `packages/db/prisma/schema.prisma` - OMExpense 資料模型定義
 * - `apps/web/src/components/om-expense/OMExpenseForm.tsx` - OMExpense 表單組件（編輯模式）
 * - `apps/web/src/app/[locale]/om-expenses/[id]/page.tsx` - OMExpense 詳情頁（編輯成功後返回）
 * - `apps/web/src/app/[locale]/om-expenses/page.tsx` - OMExpense 列表頁
 * - `apps/web/src/components/layout/dashboard-layout.tsx` - Dashboard 佈局組件
 * - `apps/web/src/components/ui/breadcrumb.tsx` - Breadcrumb 導航組件
 *
 * @author IT Department
 * @since Epic 6 - Expense Recording & Financial Integration
 * @lastModified 2025-11-14
 */

'use client';

import { Link, useRouter } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/Button';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import OMExpenseForm from '@/components/om-expense/OMExpenseForm';
import { api } from '@/lib/trpc';

export default function EditOMExpensePage({ params }: { params: { id: string } }) {
  const t = useTranslations('omExpenses');
  const tNav = useTranslations('navigation');
  const router = useRouter();

  // Get OM expense details
  const { data: omExpense, isLoading } = api.omExpense.getById.useQuery({
    id: params.id,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">{t('detail.loading')}</div>
      </DashboardLayout>
    );
  }

  if (!omExpense) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t('list.empty.notFound')}</p>
          <Button className="mt-4" onClick={() => router.push('/om-expenses')}>
            {t('breadcrumb.backToList')}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Prepare initial data
  const initialData = {
    id: omExpense.id,
    name: omExpense.name,
    description: omExpense.description ?? undefined,
    financialYear: omExpense.financialYear,
    category: omExpense.category,
    opCoId: omExpense.opCoId,
    budgetAmount: omExpense.budgetAmount,
    vendorId: omExpense.vendorId ?? undefined,
    startDate: new Date(omExpense.startDate).toISOString().split('T')[0],
    endDate: new Date(omExpense.endDate).toISOString().split('T')[0],
  };

  return (
    <DashboardLayout>
      {/* Breadcrumb Navigation */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">{tNav('home')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/om-expenses">{tNav('menu.omExpenses')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/om-expenses/${params.id}`}>{omExpense.name}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t('form.actions.edit')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/om-expenses/${params.id}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('detail.title')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t('form.edit.title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('form.edit.subtitle')}: {omExpense.name}</p>
        </div>
      </div>

      {/* OM Expense Form */}
      <OMExpenseForm mode="edit" initialData={initialData} />
    </DashboardLayout>
  );
}
