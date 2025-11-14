/**
 * @fileoverview New O&M Expense Page - 建立維運費用頁面
 *
 * @description
 * 提供建立新維運費用的表單頁面，支援預算類別選擇、金額輸入和發票上傳。
 * 使用 React Hook Form 進行表單驗證，提供即時驗證和錯誤提示。
 *
 * @page /[locale]/om-expenses/new
 *
 * @features
 * - 完整的維運費用建立表單（預算類別、金額、描述、發票）
 * - 預算類別選擇（Combobox 組件）
 * - 金額輸入（自動格式化，貨幣符號）
 * - 發票資訊輸入（發票號、日期）
 * - 發票檔案上傳（PDF/圖片，Azure Blob Storage）
 * - 即時表單驗證（Zod schema）
 * - 錯誤處理和成功提示（Toast）
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
 * @author IT Department
 * @since Epic 6 - Expense Recording & Financial Integration
 * @lastModified 2025-11-14
 */

'use client';

import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
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
