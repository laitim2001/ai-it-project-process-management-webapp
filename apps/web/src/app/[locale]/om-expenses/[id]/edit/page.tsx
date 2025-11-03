'use client';

import { useRouter } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import OMExpenseForm from '@/components/om-expense/OMExpenseForm';
import { api } from '@/lib/trpc';

/**
 * 編輯 OM 費用頁面
 */

export default function EditOMExpensePage({ params }: { params: { id: string } }) {
  const t = useTranslations('omExpenses');
  const router = useRouter();

  // 獲取 OM 費用詳情
  const { data: omExpense, isLoading } = api.omExpense.getById.useQuery({
    id: params.id,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">載入中...</div>
      </DashboardLayout>
    );
  }

  if (!omExpense) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">OM 費用不存在</p>
          <Button className="mt-4" onClick={() => router.push('/om-expenses')}>
            返回列表
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // 準備初始資料
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
      {/* 返回按鈕和標題 */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/om-expenses/${params.id}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回詳情
        </Button>
        <div>
          <h1 className="text-3xl font-bold">編輯 OM 費用</h1>
          <p className="mt-2 text-muted-foreground">{omExpense.name}</p>
        </div>
      </div>

      {/* OM 費用表單 */}
      <OMExpenseForm mode="edit" initialData={initialData} />
    </DashboardLayout>
  );
}
