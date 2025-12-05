/**
 * @fileoverview OM Expense Item Monthly Grid Component - OM 費用明細項目月度記錄編輯器
 *
 * @description
 * 單一明細項目的月度費用記錄網格編輯組件，支援 12 個月（Jan-Dec）的實際支出金額編輯。
 * 這是 FEAT-007 新架構中的組件，用於編輯單一 OMExpenseItem 的月度記錄。
 * 與舊版 OMExpenseMonthlyGrid 的區別是這個組件針對單一項目，而非整個 OMExpense。
 *
 * @component OMExpenseItemMonthlyGrid
 *
 * @features
 * - 12 個月度記錄的網格顯示（Jan-Dec）
 * - Excel 風格的表格編輯介面
 * - 即時總金額計算和顯示
 * - 預算使用率計算和顏色警示
 * - 剩餘預算自動計算
 * - 批次儲存功能
 * - 顯示項目資訊（名稱、OpCo、預算）
 * - 國際化支援
 *
 * @props
 * @param {OMExpenseItemData} item - 明細項目資料
 * @param {Function} [onSave] - 儲存成功後的回調函數
 * @param {Function} [onClose] - 關閉回調函數
 *
 * @dependencies
 * - React: useState, useEffect
 * - @tanstack/react-query: tRPC 查詢和 mutation
 * - shadcn/ui: Card, Input, Button
 * - next-intl: 國際化
 *
 * @related
 * - packages/api/src/routers/omExpense.ts - OM 費用 API Router (updateItemMonthlyRecords)
 * - apps/web/src/components/om-expense/OMExpenseItemList.tsx - 明細項目列表組件
 * - apps/web/src/app/[locale]/om-expenses/[id]/page.tsx - OM 費用詳情頁面
 *
 * @author IT Department
 * @since FEAT-007 - OM Expense Header-Detail Refactoring
 * @lastModified 2025-12-05
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui';
import { api } from '@/lib/trpc';
import { cn } from '@/lib/utils';

// ============================================================
// Types
// ============================================================

interface MonthlyRecord {
  month: number;
  actualAmount: number;
}

export interface OMExpenseItemData {
  id: string;
  name: string;
  description?: string | null;
  budgetAmount: number;
  actualSpent: number;
  opCoId: string;
  opCo?: {
    id: string;
    code: string;
    name: string;
  };
  monthlyRecords?: MonthlyRecord[];
}

interface OMExpenseItemMonthlyGridProps {
  item: OMExpenseItemData;
  onSave?: () => void;
  onClose?: () => void;
}

// ============================================================
// Component
// ============================================================

export default function OMExpenseItemMonthlyGrid({
  item,
  onSave,
  onClose,
}: OMExpenseItemMonthlyGridProps) {
  const t = useTranslations('omExpenses');
  const tCommon = useTranslations('common');
  const { toast } = useToast();

  // Month names from translation keys
  const MONTH_NAMES = useMemo(
    () => [
      t('monthlyGrid.months.jan'),
      t('monthlyGrid.months.feb'),
      t('monthlyGrid.months.mar'),
      t('monthlyGrid.months.apr'),
      t('monthlyGrid.months.may'),
      t('monthlyGrid.months.jun'),
      t('monthlyGrid.months.jul'),
      t('monthlyGrid.months.aug'),
      t('monthlyGrid.months.sep'),
      t('monthlyGrid.months.oct'),
      t('monthlyGrid.months.nov'),
      t('monthlyGrid.months.dec'),
    ],
    [t]
  );

  // Initialize 12 months of data
  const [monthlyData, setMonthlyData] = useState<MonthlyRecord[]>(() => {
    const data: MonthlyRecord[] = [];
    for (let month = 1; month <= 12; month++) {
      const existing = item.monthlyRecords?.find((r) => r.month === month);
      data.push({
        month,
        actualAmount: existing?.actualAmount ?? 0,
      });
    }
    return data;
  });

  // Reset monthlyData when item changes
  useEffect(() => {
    const data: MonthlyRecord[] = [];
    for (let month = 1; month <= 12; month++) {
      const existing = item.monthlyRecords?.find((r) => r.month === month);
      data.push({
        month,
        actualAmount: existing?.actualAmount ?? 0,
      });
    }
    setMonthlyData(data);
  }, [item.monthlyRecords]);

  // Calculate total amount
  const totalActual = useMemo(
    () => monthlyData.reduce((sum, record) => sum + record.actualAmount, 0),
    [monthlyData]
  );

  // Calculate utilization rate
  const utilizationRate = item.budgetAmount > 0 ? (totalActual / item.budgetAmount) * 100 : 0;

  // Utilization rate color
  const getUtilizationColor = (rate: number) => {
    if (rate > 100) return 'text-red-600 dark:text-red-400';
    if (rate > 90) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-HK', {
      style: 'currency',
      currency: 'HKD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Update single month data
  const updateMonth = (month: number, amount: number) => {
    setMonthlyData((prev) =>
      prev.map((record) =>
        record.month === month ? { ...record, actualAmount: amount } : record
      )
    );
  };

  // tRPC Mutation
  const updateMutation = api.omExpense.updateItemMonthlyRecords.useMutation({
    onSuccess: (data) => {
      toast({
        title: tCommon('success'),
        description: t('monthlyGrid.saveSuccess', {
          defaultValue: `月度記錄已更新，項目實際支出: ${formatCurrency(data?.actualSpent ?? totalActual)}`,
          amount: formatCurrency(data?.actualSpent ?? totalActual),
        }),
      });
      if (onSave) {
        onSave();
      }
    },
    onError: (error) => {
      toast({
        title: tCommon('error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Save monthly records
  const handleSave = () => {
    updateMutation.mutate({
      omExpenseItemId: item.id,
      monthlyData,
    });
  };

  const isSaving = updateMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {t('monthlyGrid.titleForItem', { defaultValue: '月度記錄' })}
              <span className="font-normal text-muted-foreground">- {item.name}</span>
            </CardTitle>
            <CardDescription>
              {item.opCo && (
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary mr-2">
                  {item.opCo.code}
                </span>
              )}
              {t('monthlyGrid.descriptionForItem', {
                defaultValue: '編輯此項目各月份的實際支出金額',
              })}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving
                ? tCommon('saving')
                : t('monthlyGrid.saveButton', { defaultValue: '儲存月度記錄' })}
            </Button>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Budget Overview */}
        <div className="mb-6 grid grid-cols-1 gap-4 rounded-lg bg-muted p-4 md:grid-cols-4">
          <div>
            <div className="text-sm text-muted-foreground">
              {t('items.itemBudget', { defaultValue: '項目預算' })}
            </div>
            <div className="text-lg font-semibold">{formatCurrency(item.budgetAmount)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">
              {t('detail.actualSpent')}
            </div>
            <div className={cn('text-lg font-semibold', getUtilizationColor(utilizationRate))}>
              {formatCurrency(totalActual)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">
              {t('detail.remainingBudget')}
            </div>
            <div className="text-lg font-semibold">
              {formatCurrency(item.budgetAmount - totalActual)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">
              {t('detail.utilizationRate')}
            </div>
            <div className={cn('text-lg font-semibold', getUtilizationColor(utilizationRate))}>
              {utilizationRate.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Monthly Grid */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left font-medium">
                  {t('monthlyGrid.monthColumn', { defaultValue: '月份' })}
                </th>
                <th className="p-2 text-right font-medium">
                  {t('monthlyGrid.amountColumn', { defaultValue: '實際支出 (HKD)' })}
                </th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((record) => (
                <tr key={record.month} className="border-b hover:bg-muted/50">
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {record.month}
                      </span>
                      <span className="text-sm font-medium">{MONTH_NAMES[record.month - 1]}</span>
                    </div>
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={record.actualAmount}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        updateMonth(record.month, isNaN(value) ? 0 : value);
                      }}
                      className="text-right"
                      placeholder="0.00"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 font-semibold">
                <td className="p-2">{t('monthlyGrid.total')}</td>
                <td className={cn('p-2 text-right', getUtilizationColor(utilizationRate))}>
                  {formatCurrency(totalActual)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Usage Tips */}
        <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
          <p className="font-medium">
            💡 {t('monthlyGrid.tips.title', { defaultValue: '使用提示' })}
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              {t('monthlyGrid.tips.enterAmounts', {
                defaultValue: '輸入每個月的實際支出金額',
              })}
            </li>
            <li>
              {t('monthlyGrid.tips.autoCalculate', {
                defaultValue: '系統會自動計算總實際支出和利用率',
              })}
            </li>
            <li>
              {t('monthlyGrid.tips.clickSave', {
                defaultValue: '點擊「儲存月度記錄」按鈕儲存所有變更',
              })}
            </li>
            <li>
              {t('monthlyGrid.tips.autoUpdateItem', {
                defaultValue: '儲存後，系統會自動更新此項目和表頭的實際支出',
              })}
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
