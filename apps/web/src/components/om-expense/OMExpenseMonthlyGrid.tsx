/**
 * @fileoverview OM Expense Monthly Grid Component - OM 費用月度記錄網格編輯器
 *
 * @description
 * Excel 風格的月度費用記錄網格組件，支援兩種模式：
 * 1. legacy 模式：直接編輯 OMExpense 級別的月度記錄（向後相容）
 * 2. aggregate 模式：顯示所有 Items 的月度匯總（唯讀，用於 FEAT-007 新架構）
 *
 * 提供即時總金額計算、預算使用率顯示，legacy 模式支援批次儲存功能。
 *
 * @component OMExpenseMonthlyGrid
 *
 * @features
 * - 12 個月度記錄的網格顯示（Jan-Dec）
 * - Excel 風格的表格介面
 * - 即時總金額計算和顯示
 * - 預算使用率計算和顏色警示（綠色/黃色/紅色）
 * - 剩餘預算自動計算
 * - legacy 模式：批次儲存功能（一次更新所有月度記錄）
 * - aggregate 模式：顯示項目匯總（唯讀）
 * - 資料初始化和自動重置（useEffect）
 * - 國際化支援（繁中/英文）
 * - 完整的 Dark Mode 支援
 *
 * @props
 * @param {Object} props - 組件屬性
 * @param {string} props.omExpenseId - OM 費用 ID
 * @param {number} props.budgetAmount - 年度預算金額
 * @param {Array<MonthlyRecord>} [props.initialRecords=[]] - 初始月度記錄
 * @param {Function} [props.onSave] - 儲存成功後的回調函數（用於重新獲取資料）
 * @param {'legacy' | 'aggregate'} [props.mode='legacy'] - 組件模式
 * @param {Array<ItemMonthlyData>} [props.itemsMonthlyData] - aggregate 模式的項目月度資料
 * @param {Function} [props.onViewItems] - 點擊查看項目詳情的回調
 *
 * @example
 * ```tsx
 * // Legacy 模式（直接編輯）
 * <OMExpenseMonthlyGrid
 *   omExpenseId="om-expense-1"
 *   budgetAmount={1200000}
 *   mode="legacy"
 *   initialRecords={[
 *     { month: 1, actualAmount: 100000 },
 *     { month: 2, actualAmount: 105000 }
 *   ]}
 *   onSave={() => refetch()}
 * />
 *
 * // Aggregate 模式（唯讀匯總）
 * <OMExpenseMonthlyGrid
 *   omExpenseId="om-expense-1"
 *   budgetAmount={1200000}
 *   mode="aggregate"
 *   itemsMonthlyData={[
 *     { itemId: '1', itemName: 'Item A', monthlyRecords: [...] },
 *     { itemId: '2', itemName: 'Item B', monthlyRecords: [...] }
 *   ]}
 *   onViewItems={() => router.push('/om-expenses/om-expense-1?tab=items')}
 * />
 * ```
 *
 * @dependencies
 * - React: useState, useEffect, useMemo
 * - @tanstack/react-query: tRPC 查詢和 mutation
 * - shadcn/ui: Card, Input, Button
 * - lucide-react: 圖標
 * - next-intl: 國際化
 * - Intl.NumberFormat: 貨幣格式化
 *
 * @related
 * - packages/api/src/routers/omExpense.ts - OM 費用 API Router（updateMonthlyRecords procedure）
 * - apps/web/src/components/om-expense/OMExpenseForm.tsx - OM 費用表單組件
 * - apps/web/src/components/om-expense/OMExpenseItemMonthlyGrid.tsx - 項目級別月度編輯
 * - apps/web/src/app/[locale]/om-expenses/[id]/page.tsx - OM 費用詳情頁面
 * - packages/db/prisma/schema.prisma - OMExpenseMonthlyRecord 資料模型
 *
 * @author IT Department
 * @since Module 4 - OM Expense Management
 * @lastModified 2025-12-05
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Eye, Lock } from 'lucide-react';
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

/** 項目月度資料（用於 aggregate 模式） */
interface ItemMonthlyData {
  itemId: string;
  itemName: string;
  opCoCode?: string;
  budgetAmount: number;
  monthlyRecords: MonthlyRecord[];
}

interface OMExpenseMonthlyGridProps {
  omExpenseId: string;
  budgetAmount: number;
  initialRecords?: MonthlyRecord[];
  onSave?: () => void;
  /** 組件模式：legacy（可編輯）或 aggregate（唯讀匯總） */
  mode?: 'legacy' | 'aggregate';
  /** aggregate 模式的項目月度資料 */
  itemsMonthlyData?: ItemMonthlyData[];
  /** 點擊查看項目詳情的回調 */
  onViewItems?: () => void;
}

// ============================================================
// Component
// ============================================================

export default function OMExpenseMonthlyGrid({
  omExpenseId,
  budgetAmount,
  initialRecords = [],
  onSave,
  mode = 'legacy',
  itemsMonthlyData = [],
  onViewItems,
}: OMExpenseMonthlyGridProps) {
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

  // ========== Legacy Mode State ==========
  // Initialize 12 months of data (default to 0 if no records)
  const [monthlyData, setMonthlyData] = useState<MonthlyRecord[]>(() => {
    const data: MonthlyRecord[] = [];
    for (let month = 1; month <= 12; month++) {
      const existing = initialRecords.find((r) => r.month === month);
      data.push({
        month,
        actualAmount: existing?.actualAmount ?? 0,
      });
    }
    return data;
  });

  // Reset monthlyData when initialRecords updates
  useEffect(() => {
    const data: MonthlyRecord[] = [];
    for (let month = 1; month <= 12; month++) {
      const existing = initialRecords.find((r) => r.month === month);
      data.push({
        month,
        actualAmount: existing?.actualAmount ?? 0,
      });
    }
    setMonthlyData(data);
  }, [initialRecords]);

  // ========== Aggregate Mode Data Calculation ==========
  // 計算所有項目的月度匯總
  const aggregatedMonthlyData = useMemo(() => {
    if (mode !== 'aggregate' || itemsMonthlyData.length === 0) {
      return [];
    }

    const monthlyTotals: MonthlyRecord[] = [];
    for (let month = 1; month <= 12; month++) {
      let total = 0;
      for (const item of itemsMonthlyData) {
        const monthRecord = item.monthlyRecords.find((r) => r.month === month);
        total += monthRecord?.actualAmount ?? 0;
      }
      monthlyTotals.push({ month, actualAmount: total });
    }
    return monthlyTotals;
  }, [mode, itemsMonthlyData]);

  // 使用的月度資料（根據模式選擇）
  const displayMonthlyData = mode === 'aggregate' ? aggregatedMonthlyData : monthlyData;

  // Calculate total amount
  const totalActual = useMemo(
    () => displayMonthlyData.reduce((sum, record) => sum + record.actualAmount, 0),
    [displayMonthlyData]
  );

  // Calculate utilization rate
  const utilizationRate = budgetAmount > 0 ? (totalActual / budgetAmount) * 100 : 0;

  // Utilization rate color with dark mode support
  const getUtilizationColor = (rate: number) => {
    if (rate > 100) return 'text-red-600 dark:text-red-400';
    if (rate > 90) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'HKD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Update single month data (only for legacy mode)
  const updateMonth = (month: number, amount: number) => {
    if (mode === 'aggregate') return; // 禁止在 aggregate 模式下編輯
    setMonthlyData((prev) =>
      prev.map((record) =>
        record.month === month ? { ...record, actualAmount: amount } : record
      )
    );
  };

  // tRPC Mutation (only for legacy mode)
  const updateMutation = api.omExpense.updateMonthlyRecords.useMutation({
    onSuccess: (data) => {
      toast({
        title: tCommon('success'),
        description: t('monthlyGrid.saveSuccess', {
          defaultValue: `月度記錄已更新，實際支出總計: ${formatCurrency(data?.actualSpent ?? totalActual)}`,
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

  // Save monthly records (only for legacy mode)
  const handleSave = () => {
    if (mode === 'aggregate') return;
    updateMutation.mutate({
      omExpenseId,
      monthlyData,
    });
  };

  const isSaving = updateMutation.isPending;
  const isReadOnly = mode === 'aggregate';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {t('monthlyGrid.title', { defaultValue: '月度費用記錄' })}
              {isReadOnly && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  {t('monthlyGrid.readOnlyMode', { defaultValue: '唯讀' })}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {isReadOnly
                ? t('monthlyGrid.descriptionAggregate', {
                    defaultValue: '顯示所有明細項目的月度支出匯總。如需編輯，請點擊查看項目詳情。',
                  })
                : t('monthlyGrid.description', {
                    defaultValue: '編輯 1-12 月的實際支出金額，系統會自動計算總額',
                  })}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isReadOnly && onViewItems && (
              <Button variant="outline" onClick={onViewItems}>
                <Eye className="mr-2 h-4 w-4" />
                {t('monthlyGrid.viewItems', { defaultValue: '查看項目詳情' })}
              </Button>
            )}
            {!isReadOnly && (
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving
                  ? tCommon('saving')
                  : t('monthlyGrid.saveButton', { defaultValue: '儲存月度記錄' })}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Budget Overview */}
        <div className="mb-6 grid grid-cols-1 gap-4 rounded-lg bg-muted p-4 md:grid-cols-4">
          <div>
            <div className="text-sm text-muted-foreground">{t('detail.budgetAmount')}</div>
            <div className="text-lg font-semibold">{formatCurrency(budgetAmount)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{t('detail.actualSpent')}</div>
            <div className={cn('text-lg font-semibold', getUtilizationColor(utilizationRate))}>
              {formatCurrency(totalActual)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{t('detail.remainingBudget')}</div>
            <div className="text-lg font-semibold">
              {formatCurrency(budgetAmount - totalActual)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{t('detail.utilizationRate')}</div>
            <div className={cn('text-lg font-semibold', getUtilizationColor(utilizationRate))}>
              {utilizationRate.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Aggregate Mode: Item Breakdown Summary */}
        {isReadOnly && itemsMonthlyData.length > 0 && (
          <div className="mb-4 rounded-lg border bg-muted/30 p-4">
            <h4 className="mb-2 text-sm font-medium">
              {t('monthlyGrid.itemBreakdown', { defaultValue: '項目分解' })} ({itemsMonthlyData.length})
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
              {itemsMonthlyData.map((item) => {
                const itemTotal = item.monthlyRecords.reduce((sum, r) => sum + r.actualAmount, 0);
                return (
                  <div key={item.itemId} className="rounded bg-background p-2">
                    <div className="truncate font-medium" title={item.itemName}>
                      {item.opCoCode && (
                        <span className="mr-1 text-xs text-muted-foreground">
                          [{item.opCoCode}]
                        </span>
                      )}
                      {item.itemName}
                    </div>
                    <div className="text-muted-foreground">{formatCurrency(itemTotal)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
              {displayMonthlyData.map((record) => (
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
                    {isReadOnly ? (
                      <div className="text-right font-medium">
                        {formatCurrency(record.actualAmount)}
                      </div>
                    ) : (
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
                    )}
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
            {isReadOnly ? (
              <>
                <li>
                  {t('monthlyGrid.tips.aggregateView', {
                    defaultValue: '此視圖顯示所有明細項目的月度支出匯總',
                  })}
                </li>
                <li>
                  {t('monthlyGrid.tips.editViaItems', {
                    defaultValue: '如需編輯月度記錄，請點擊「查看項目詳情」進入各項目的月度編輯',
                  })}
                </li>
                <li>
                  {t('monthlyGrid.tips.autoUpdateTotal', {
                    defaultValue: '編輯項目月度記錄後，匯總會自動更新',
                  })}
                </li>
              </>
            ) : (
              <>
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
                  {t('monthlyGrid.tips.autoUpdate', {
                    defaultValue: '儲存後，系統會自動更新 OM 費用的實際支出欄位',
                  })}
                </li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
