/**
 * @fileoverview Edit O&M Expense Page - 編輯維運費用頁面
 *
 * @description
 * 提供編輯現有維運費用表頭資訊的表單頁面，支援 FEAT-007 表頭-明細架構。
 * 此頁面僅編輯 OMExpense 表頭欄位，明細項目（OMExpenseItem）的管理
 * 在詳情頁面透過 OMExpenseItemList 組件進行。
 *
 * @page /[locale]/om-expenses/[id]/edit
 *
 * @features
 * - FEAT-007 表頭-明細架構支援
 * - 表頭資訊編輯（名稱、描述、財年、類別、預設 OpCo、供應商）
 * - 向後相容舊資料（opCoId → defaultOpCoId 映射）
 * - 即時表單驗證（Zod schema）
 * - 錯誤處理和成功提示（Toast）
 *
 * @note
 * 明細項目（OMExpenseItem）的新增、編輯、刪除、排序在詳情頁面進行：
 * - `/om-expenses/[id]` - 使用 OMExpenseItemList 組件管理明細
 * - 月度記錄（OMExpenseMonthly）在詳情頁面使用 OMExpenseItemMonthlyGrid 編輯
 *
 * @permissions
 * - ProjectManager: 可編輯維運費用表頭
 * - Supervisor: 完整權限
 * - Admin: 完整權限
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
 * - `packages/db/prisma/schema.prisma` - OMExpense, OMExpenseItem 資料模型
 * - `apps/web/src/components/om-expense/OMExpenseForm.tsx` - OMExpense 表單組件（FEAT-007 重構）
 * - `apps/web/src/components/om-expense/OMExpenseItemList.tsx` - 明細項目列表組件
 * - `apps/web/src/app/[locale]/om-expenses/[id]/page.tsx` - OMExpense 詳情頁（明細管理）
 * - `apps/web/src/app/[locale]/om-expenses/page.tsx` - OMExpense 列表頁
 * - `apps/web/src/components/layout/dashboard-layout.tsx` - Dashboard 佈局組件
 *
 * @author IT Department
 * @since Epic 6 - Expense Recording & Financial Integration
 * @modified FEAT-007 - Header-Detail Architecture (2025-12-05)
 * @lastModified 2025-12-05
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
import { Button } from '@/components/ui/button';
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

  // Prepare initial data for FEAT-007 Header-Detail architecture
  // Note: Edit mode only modifies header fields
  // Items (OMExpenseItem) are managed on the detail page via OMExpenseItemList
  const initialData = {
    id: omExpense.id,
    name: omExpense.name,
    description: omExpense.description ?? undefined,
    financialYear: omExpense.financialYear,
    category: omExpense.category,
    vendorId: omExpense.vendorId ?? undefined,
    sourceExpenseId: omExpense.sourceExpenseId ?? undefined,
    // FEAT-007: Use defaultOpCoId, fallback to legacy opCoId for backward compatibility
    defaultOpCoId: omExpense.defaultOpCoId ?? omExpense.opCoId ?? undefined,
    // Include source expense info if available
    sourceExpense: omExpense.sourceExpense ? {
      id: omExpense.sourceExpense.id,
      name: omExpense.sourceExpense.name,
      purchaseOrder: omExpense.sourceExpense.purchaseOrder ? {
        poNumber: omExpense.sourceExpense.purchaseOrder.poNumber,
        project: omExpense.sourceExpense.purchaseOrder.project ? {
          name: omExpense.sourceExpense.purchaseOrder.project.name,
        } : undefined,
      } : undefined,
    } : undefined,
    // Legacy fields (for backward compatibility with OMExpenseForm)
    opCoId: omExpense.opCoId ?? undefined,
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
