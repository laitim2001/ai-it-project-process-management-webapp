/**
 * @fileoverview Create OM Expense Category Page - 新增 OM 費用類別頁面
 *
 * @description
 * 建立新 OM 費用類別的頁面。
 *
 * @page /[locale]/om-expense-categories/new
 *
 * @author IT Department
 * @since FEAT-005 - OM Expense Category Management
 * @lastModified 2025-12-01
 */

'use client';

import { Tags } from 'lucide-react';
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
import { Link } from '@/i18n/routing';

export default function CreateOMExpenseCategoryPage() {
  const t = useTranslations('omExpenseCategories');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');

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
              <BreadcrumbPage>{t('form.createTitle')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題 */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Tags className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('form.createTitle')}</h1>
            <p className="text-muted-foreground">{t('form.createDescription')}</p>
          </div>
        </div>

        {/* 表單 */}
        <div className="max-w-2xl">
          <OMExpenseCategoryForm mode="create" />
        </div>
      </div>
    </DashboardLayout>
  );
}
