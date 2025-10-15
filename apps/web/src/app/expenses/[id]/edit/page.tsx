'use client';

/**
 * 編輯費用頁面
 *
 * Epic 6 - Story 6.1: 針對採購單記錄發票與費用
 */

import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { ExpenseForm } from '@/components/expense/ExpenseForm';

export default function EditExpensePage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* 麵包屑導航 */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">首頁</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/expenses">費用管理</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/expenses/${id}`}>費用詳情</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>編輯</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題 */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">編輯費用</h1>
          <p className="mt-2 text-muted-foreground">修改費用資訊和發票</p>
        </div>

        {/* 表單 */}
        <ExpenseForm expenseId={id} />
      </div>
    </DashboardLayout>
  );
}
