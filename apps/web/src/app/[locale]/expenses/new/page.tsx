/**
 * @fileoverview New Expense Page - 建立費用記錄頁面
 *
 * @description
 * 提供建立新費用記錄的表單頁面，支援表頭-明細結構、採購單選擇、發票上傳和費用項目管理。
 * 使用 ExpenseForm 組件提供完整的表單驗證和自動計算功能。
 * 支援多費用項目輸入，自動計算總金額，提供即時驗證和錯誤提示。
 *
 * @page /[locale]/expenses/new
 *
 * @features
 * - 完整的費用建立表單（表頭+明細結構）
 * - 採購單選擇（Combobox 組件，支援搜尋）
 * - 發票資訊輸入（發票編號、日期、金額）
 * - 發票檔案上傳（PDF/圖片，Azure Blob Storage）
 * - 費用項目管理（新增/刪除多個費用項目）
 * - 預算類別選擇（從專案預算池載入）
 * - 自動計算總金額（累加所有費用項目）
 * - 即時表單驗證（Zod schema）
 * - 錯誤處理和成功提示（Toast）
 *
 * @permissions
 * - ProjectManager: 可建立自己專案的費用記錄
 * - Supervisor: 可建立任意專案的費用記錄
 * - Admin: 完整權限
 *
 * @routing
 * - 建立頁: /expenses/new
 * - 成功後導向: /expenses/[id] (新建立的費用詳情頁)
 * - 取消後返回: /expenses (費用列表頁)
 *
 * @stateManagement
 * - Form State: React Hook Form (表頭+明細陣列)
 * - Items State: 費用項目陣列狀態
 * - Total Amount: 自動計算欄位
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC mutation
 * - shadcn/ui: Breadcrumb, Card
 *
 * @related
 * - packages/api/src/routers/expense.ts - 費用建立 API
 * - apps/web/src/components/expense/ExpenseForm.tsx - 費用表單組件
 * - apps/web/src/app/[locale]/expenses/page.tsx - 費用列表頁面
 * - apps/web/src/app/[locale]/expenses/[id]/page.tsx - 費用詳情頁面
 *
 * @author IT Department
 * @since Epic 6 - Expense Recording & Financial Integration (Module 5: 表頭明細重構)
 * @lastModified 2025-11-14
 */

'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useTranslations } from 'next-intl';
import { Link } from "@/i18n/routing";
import { useParams } from 'next/navigation';
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
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');
  const params = useParams();
  const locale = params.locale as string;
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
              <BreadcrumbPage>{tCommon('actions.create')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題 */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('new.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('new.subtitle')}
          </p>
        </div>

        {/* 表單 */}
        <ExpenseForm />
      </div>
    </DashboardLayout>
  );
}
