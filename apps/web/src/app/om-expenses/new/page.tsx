'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import OMExpenseForm from '@/components/om-expense/OMExpenseForm';
import { useRouter } from 'next/navigation';

/**
 * 創建新 OM 費用頁面
 */

export default function NewOMExpensePage() {
  const router = useRouter();

  return (
    <DashboardLayout>
      {/* 返回按鈕和標題 */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/om-expenses')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回列表
        </Button>
        <div>
          <h1 className="text-3xl font-bold">新增 OM 費用</h1>
          <p className="mt-2 text-muted-foreground">
            創建新的操作與維護費用記錄，系統將自動初始化 12 個月度記錄
          </p>
        </div>
      </div>

      {/* OM 費用表單 */}
      <OMExpenseForm mode="create" />
    </DashboardLayout>
  );
}
