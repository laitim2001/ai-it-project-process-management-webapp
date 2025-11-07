'use client';

import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import OMExpenseForm from '@/components/om-expense/OMExpenseForm';
import { useRouter } from "@/i18n/routing";

/**
 * 創建新 OM 費用頁面
 */

export default function NewOMExpensePage() {
  const t = useTranslations('omExpenses.new');
  const tCommon = useTranslations('common');
  const router = useRouter();

  return (
    <DashboardLayout>
      {/* 返回按鈕和標題 */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {tCommon('actions.back')}
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="mt-2 text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* OM 費用表單 */}
      <OMExpenseForm mode="create" />
    </DashboardLayout>
  );
}
