/**
 * @fileoverview Edit Expense Page - 編輯費用記錄頁面
 *
 * @description
 * 提供編輯現有費用記錄的表單頁面，支援修改表頭資訊和費用項目明細。
 * 僅允許編輯 Draft 狀態的費用記錄，已提交或審批的費用需退回 Draft 才能編輯。
 * 支援費用項目的完整 CRUD 操作（新增、更新、刪除），自動計算總金額。
 *
 * @page /[locale]/expenses/[id]/edit
 *
 * @features
 * - 完整的費用編輯表單（預填充現有資料）
 * - 表頭資訊編輯（發票號、日期、檔案）
 * - 費用項目明細 CRUD（新增、更新、刪除項目）
 * - 自動計算總金額（累加所有費用項目）
 * - 狀態檢查（僅允許編輯 Draft 費用）
 * - 即時表單驗證（Zod schema）
 * - 預算類別選擇（從專案預算池載入）
 * - 錯誤處理（權限錯誤、狀態錯誤、網路錯誤）
 * - 樂觀更新（Optimistic UI updates）
 *
 * @permissions
 * - ProjectManager: 可編輯自己專案的 Draft 費用
 * - Supervisor: 可編輯任意專案的 Draft 費用
 * - Admin: 完整權限
 * - 限制: 僅 Draft 狀態的費用可編輯
 *
 * @routing
 * - 編輯頁: /expenses/[id]/edit
 * - 成功後導向: /expenses/[id] (費用詳情頁)
 * - 取消後返回: /expenses/[id] (費用詳情頁)
 * - 權限錯誤: 404 或 403 頁面
 *
 * @stateManagement
 * - Form State: React Hook Form (預填充表頭+明細資料)
 * - Items State: 費用項目陣列狀態（支援 CRUD 操作）
 * - Loading State: 資料載入和提交狀態
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢和 mutation
 * - shadcn/ui: Breadcrumb, Skeleton, Alert
 *
 * @related
 * - packages/api/src/routers/expense.ts - 費用更新 API
 * - apps/web/src/components/expense/ExpenseForm.tsx - 費用表單組件
 * - apps/web/src/app/[locale]/expenses/[id]/page.tsx - 費用詳情頁面
 * - apps/web/src/app/[locale]/expenses/page.tsx - 費用列表頁面
 *
 * @author IT Department
 * @since Epic 6 - Expense Recording & Financial Integration (Module 5: 表頭明細重構)
 * @lastModified 2025-11-14
 */

'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ExpenseForm } from '@/components/expense/ExpenseForm';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from "@/i18n/routing";

export default function EditExpensePage() {
  const t = useTranslations('expenses');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');
  const params = useParams();
  const id = params.id as string;

  // 查詢費用記錄數據
  const { data: expense, isLoading, error } = api.expense.getById.useQuery({ id });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <Skeleton className="h-5 w-[420px]" />
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !expense) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link href="/dashboard">{tNav('menu.dashboard')}</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link href="/expenses">{tNav('menu.expenses')}</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{tCommon('actions.edit')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-md space-y-6 text-center">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('detail.notFound')}
                </AlertDescription>
              </Alert>
              <Link href="/expenses">
                <Button>{t('detail.backToList')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 檢查是否為 Draft 狀態
  if (expense.status !== 'Draft') {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link href="/dashboard">{tNav('menu.dashboard')}</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link href="/expenses">{tNav('menu.expenses')}</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{tCommon('actions.edit')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-md space-y-6 text-center">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('messages.onlyDraftCanEdit')} {t('status.'+expense.status.toLowerCase())}
                </AlertDescription>
              </Alert>
              <Link href={`/expenses/${id}`}>
                <Button>{t('detail.backToDetail')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link href="/dashboard">{tNav('menu.dashboard')}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link href="/expenses">{tNav('menu.expenses')}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link href={`/expenses/${id}`}>
                {expense.name}
              </Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{tCommon('actions.edit')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題 */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('form.edit.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('form.edit.subtitle')}
          </p>
        </div>

        {/* 表單 */}
        <ExpenseForm initialData={expense} isEdit={true} />
      </div>
    </DashboardLayout>
  );
}
