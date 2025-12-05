/**
 * @fileoverview New O&M Expense Page - 建立維運費用頁面
 *
 * @description
 * 提供建立新維運費用的表單頁面，支援 FEAT-007 表頭-明細架構。
 * 使用者可以建立 OMExpense（表頭）並新增多個 OMExpenseItem（明細項目），
 * 每個明細項目可以有獨立的 OpCo、預算金額和結束日期。
 *
 * @page /[locale]/om-expenses/new
 *
 * @features
 * - FEAT-007 表頭-明細架構支援
 * - 表頭資訊輸入（名稱、描述、財年、類別、預設 OpCo、供應商）
 * - 明細項目管理（新增、編輯、刪除）
 * - 每個明細項目支援獨立 OpCo、預算金額、幣別、日期
 * - 即時預算總額計算
 * - 完整表單驗證（Zod schema）
 * - 錯誤處理和成功提示（Toast）
 * - 一次提交表頭 + 所有明細（createWithItems API）
 *
 * @permissions
 * - ProjectManager: 可建立維運費用
 * - Supervisor: 完整權限
 * - Admin: 完整權限
 *
 * @routing
 * - 建立頁: /om-expenses/new
 * - 成功後導向: /om-expenses/[id] (新建立的維運費用詳情頁)
 * - 取消後返回: /om-expenses (維運費用列表頁)
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢和快取
 * - shadcn/ui: UI 組件庫
 *
 * @related
 * - `packages/api/src/routers/omExpense.ts` - OMExpense API Router（createWithItems 操作）
 * - `packages/db/prisma/schema.prisma` - OMExpense, OMExpenseItem, OMExpenseMonthly 資料模型
 * - `apps/web/src/components/om-expense/OMExpenseForm.tsx` - OMExpense 表單組件（FEAT-007 重構）
 * - `apps/web/src/app/[locale]/om-expenses/page.tsx` - OMExpense 列表頁
 * - `apps/web/src/app/[locale]/om-expenses/[id]/page.tsx` - OMExpense 詳情頁
 * - `apps/web/src/components/layout/dashboard-layout.tsx` - Dashboard 佈局組件
 *
 * @author IT Department
 * @since Epic 6 - Expense Recording & Financial Integration
 * @modified FEAT-007 - Header-Detail Architecture (2025-12-05)
 * @lastModified 2025-12-05
 */

'use client';

import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import OMExpenseForm from '@/components/om-expense/OMExpenseForm';
import { useRouter } from "@/i18n/routing";

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
