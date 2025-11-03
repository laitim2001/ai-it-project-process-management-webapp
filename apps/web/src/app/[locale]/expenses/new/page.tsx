'use client';

/**
 * 創建新費用記錄頁面
 *
 * 功能說明：
 * - 使用 ExpenseForm 組件創建新費用記錄
 * - 支持表頭-明細結構
 * - 自動計算總金額
 *
 * Module 5: Expense 表頭明細重構 - 前端實施
 */

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useTranslations } from 'next-intl';
import { ExpenseForm } from '@/components/expense/ExpenseForm';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';

export default function NewExpensePage() {
  const t = useTranslations('expenses');
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">首頁</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/expenses">費用記錄</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>新建</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題 */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">創建新費用記錄</h1>
          <p className="text-muted-foreground mt-2">
            填寫費用記錄基本信息並添加費用項目明細
          </p>
        </div>

        {/* 表單 */}
        <ExpenseForm />
      </div>
    </DashboardLayout>
  );
}
