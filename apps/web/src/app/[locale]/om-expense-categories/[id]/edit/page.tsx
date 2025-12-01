/**
 * @fileoverview Edit OM Expense Category Page - 編輯 OM 費用類別頁面
 *
 * @description
 * 編輯現有 OM 費用類別的頁面。
 *
 * @page /[locale]/om-expense-categories/[id]/edit
 *
 * @author IT Department
 * @since FEAT-005 - OM Expense Category Management
 * @lastModified 2025-12-01
 */

'use client';

import { Tags, AlertCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { OMExpenseCategoryForm } from '@/components/om-expense-category';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/routing';
import { api } from '@/lib/trpc';

export default function EditOMExpenseCategoryPage() {
  const params = useParams();
  const id = params.id as string;

  const t = useTranslations('omExpenseCategories');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');

  // 獲取類別資料
  const { data: category, isLoading, error } = api.omExpenseCategory.getById.useQuery({ id });

  // 載入中狀態
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-48" />
          <div className="max-w-2xl space-y-4">
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 錯誤狀態
  if (error || !category) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-xl font-semibold">{tCommon('messages.notFound')}</h2>
          <p className="mt-2 text-muted-foreground">
            {error?.message || t('messages.categoryNotFound')}
          </p>
          <Link href="/om-expense-categories" className="mt-4">
            <span className="text-primary hover:underline">{t('actions.backToList')}</span>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 麵包屑導航 */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">{tNav('dashboard')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/om-expense-categories">{t('title')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{category.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題 */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Tags className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('form.editTitle')}</h1>
            <p className="text-muted-foreground">
              {t('form.editDescription', { name: category.name })}
            </p>
          </div>
        </div>

        {/* 表單 */}
        <div className="max-w-2xl">
          <OMExpenseCategoryForm mode="edit" initialData={category} />
        </div>
      </div>
    </DashboardLayout>
  );
}
