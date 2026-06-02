/**
 * @fileoverview Project Expense Item Monthly Grid - 專案費用明細月度網格（FEAT-015）
 * @component ProjectExpenseItemMonthlyGrid
 *
 * @description
 * 單一明細的 12 個月編輯網格。比照 OMExpenseItemMonthlyGrid，但**每月兩欄**：
 * 月度預算（budgetAmount）+ 月度實際（actualAmount），兩者皆以 USD 儲存。
 * 儲存後由 API 回算明細與表頭彙總。
 *
 * @features
 * - 12 個月（Jan-Dec）的「預算 + 實際」雙欄編輯
 * - 即時加總（年度預算、年度實際、執行率）
 * - 雙幣別顯示（重用 CHANGE-042 DualCurrency）
 * - LoadingButton 提交
 *
 * @related
 * - packages/api/src/routers/projectExpense.ts（updateItemMonthlyRecords）
 * - apps/web/src/components/project-expense/ProjectExpenseItemList.tsx
 *
 * @since FEAT-015 - Project Expense 月度模組
 */

'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useEffect, useMemo } from 'react';

import { DualCurrency } from '@/components/shared/DualCurrency';
import { useToast } from '@/components/ui';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoadingButton } from '@/components/ui/loading/LoadingButton';
import { api } from '@/lib/trpc';
import { cn } from '@/lib/utils';

import type { ProjectExpenseItemData, ProjectExpenseMonthlyData } from './types';

interface ProjectExpenseItemMonthlyGridProps {
  item: ProjectExpenseItemData;
  onSaved?: () => void;
  onClose?: () => void;
}

/** 由明細的月度記錄初始化 12 筆（缺漏者補 0） */
function buildMonthlyState(
  item: ProjectExpenseItemData
): ProjectExpenseMonthlyData[] {
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const existing = item.monthly?.find((r) => r.month === month);
    return {
      month,
      budgetAmount: existing?.budgetAmount ?? 0,
      actualAmount: existing?.actualAmount ?? 0,
    };
  });
}

export default function ProjectExpenseItemMonthlyGrid({
  item,
  onSaved,
  onClose,
}: ProjectExpenseItemMonthlyGridProps) {
  const t = useTranslations('projectExpenses');
  const tCommon = useTranslations('common');
  const { toast } = useToast();

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

  const [monthlyData, setMonthlyData] = useState<ProjectExpenseMonthlyData[]>(
    () => buildMonthlyState(item)
  );

  // item 變動時重置
  useEffect(() => {
    setMonthlyData(buildMonthlyState(item));
  }, [item]);

  const totalBudget = useMemo(
    () => monthlyData.reduce((sum, r) => sum + r.budgetAmount, 0),
    [monthlyData]
  );
  const totalActual = useMemo(
    () => monthlyData.reduce((sum, r) => sum + r.actualAmount, 0),
    [monthlyData]
  );

  const utilizationRate = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

  const getUtilizationColor = (rate: number) => {
    if (rate > 100) return 'text-red-600 dark:text-red-400';
    if (rate > 90) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const updateMonth = (
    month: number,
    field: 'budgetAmount' | 'actualAmount',
    amount: number
  ) => {
    setMonthlyData((prev) =>
      prev.map((r) => (r.month === month ? { ...r, [field]: amount } : r))
    );
  };

  const updateMutation = api.projectExpense.updateItemMonthlyRecords.useMutation({
    onSuccess: () => {
      toast({
        title: tCommon('success'),
        description: t('monthlyGrid.saveSuccess'),
      });
      onSaved?.();
    },
    onError: (error) => {
      toast({
        title: tCommon('error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      projectExpenseItemId: item.id,
      monthlyData,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {t('monthlyGrid.title')}
              <span className="font-normal text-muted-foreground">
                - {item.name}
              </span>
            </CardTitle>
            <CardDescription>{t('monthlyGrid.description')}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <LoadingButton
              onClick={handleSave}
              isLoading={updateMutation.isPending}
              loadingText={tCommon('saving')}
            >
              {t('monthlyGrid.saveButton')}
            </LoadingButton>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 概覽 */}
        <div className="mb-6 grid grid-cols-1 gap-4 rounded-lg bg-muted p-4 md:grid-cols-3">
          <div>
            <div className="text-sm text-muted-foreground">
              {t('fields.annualBudget')}
            </div>
            <div className="text-lg font-semibold">
              <DualCurrency amountUSD={totalBudget} currency={item.currency} />
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">
              {t('fields.annualActual')}
            </div>
            <div
              className={cn(
                'text-lg font-semibold',
                getUtilizationColor(utilizationRate)
              )}
            >
              <DualCurrency amountUSD={totalActual} currency={item.currency} />
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">
              {t('fields.utilizationRate')}
            </div>
            <div
              className={cn(
                'text-lg font-semibold',
                getUtilizationColor(utilizationRate)
              )}
            >
              {utilizationRate.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* 月度網格：每月兩欄（預算 + 實際） */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left font-medium">
                  {t('monthlyGrid.monthColumn')}
                </th>
                <th className="p-2 text-right font-medium">
                  {t('monthlyGrid.budgetColumn')}
                </th>
                <th className="p-2 text-right font-medium">
                  {t('monthlyGrid.actualColumn')}
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
                      <span className="text-sm font-medium">
                        {MONTH_NAMES[record.month - 1]}
                      </span>
                    </div>
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={record.budgetAmount}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        updateMonth(
                          record.month,
                          'budgetAmount',
                          isNaN(value) ? 0 : value
                        );
                      }}
                      className="text-right"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={record.actualAmount}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        updateMonth(
                          record.month,
                          'actualAmount',
                          isNaN(value) ? 0 : value
                        );
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
                <td className="p-2 text-right">
                  <DualCurrency amountUSD={totalBudget} currency={item.currency} />
                </td>
                <td
                  className={cn(
                    'p-2 text-right',
                    getUtilizationColor(utilizationRate)
                  )}
                >
                  <DualCurrency amountUSD={totalActual} currency={item.currency} />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 提示 */}
        <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
          <p className="font-medium">💡 {t('monthlyGrid.tips.title')}</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>{t('monthlyGrid.tips.enterAmounts')}</li>
            <li>{t('monthlyGrid.tips.autoCalculate')}</li>
            <li>{t('monthlyGrid.tips.clickSave')}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
