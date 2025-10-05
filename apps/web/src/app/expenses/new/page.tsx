'use client';

/**
 * 新增費用頁面
 *
 * Epic 6 - Story 6.1: 針對採購單記錄發票與費用
 */

import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { ExpenseForm } from '@/components/expense/ExpenseForm';

export default function NewExpensePage() {
  const searchParams = useSearchParams();
  const purchaseOrderId = searchParams.get('purchaseOrderId') || undefined;

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
              <BreadcrumbPage>新增費用</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題 */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">新增費用</h1>
          <p className="mt-2 text-gray-600">記錄新的費用和發票</p>
        </div>

        {/* 表單 */}
        <ExpenseForm defaultPurchaseOrderId={purchaseOrderId} />
      </div>
    </DashboardLayout>
  );
}
