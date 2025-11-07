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

/**
 * Edit OM Expense Page
 */

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
