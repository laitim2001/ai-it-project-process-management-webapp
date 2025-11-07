'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui';
import { api } from '@/lib/trpc';

/**
 * OMExpenseMonthlyGrid - OM Expense Monthly Grid Editor Component
 *
 * Features:
 * 1. Display monthly expense records for months 1-12
 * 2. Excel-style grid editing
 * 3. Automatic total calculation
 * 4. Batch save functionality
 * 5. Real-time actualSpent updates
 *
 * Design:
 * - Uses Table component to display 12 months
 * - One input field per month
 * - Real-time total calculation and display
 * - Calls updateMonthlyRecords API on save
 */

interface MonthlyRecord {
  month: number;
  actualAmount: number;
}

interface OMExpenseMonthlyGridProps {
  omExpenseId: string;
  budgetAmount: number;
  initialRecords?: MonthlyRecord[];
  onSave?: () => void; // Callback function after save (for refetching data)
}

export default function OMExpenseMonthlyGrid({
  omExpenseId,
  budgetAmount,
  initialRecords = [],
  onSave,
}: OMExpenseMonthlyGridProps) {
  const t = useTranslations('omExpenses');
  const tCommon = useTranslations('common');
  const { toast } = useToast();

  // Month names from translation keys
  const MONTH_NAMES = [
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
  ];

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

  // Calculate total amount
  const totalActual = monthlyData.reduce((sum, record) => sum + record.actualAmount, 0);

  // Calculate utilization rate
  const utilizationRate = budgetAmount > 0 ? (totalActual / budgetAmount) * 100 : 0;

  // Utilization rate color
  const getUtilizationColor = () => {
    if (utilizationRate > 100) return 'text-red-600';
    if (utilizationRate > 90) return 'text-yellow-600';
    return 'text-green-600';
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
        record.month === month
          ? { ...record, actualAmount: amount }
          : record
      )
    );
  };

  // tRPC Mutation
  const updateMutation = api.omExpense.updateMonthlyRecords.useMutation({
    onSuccess: (data) => {
      toast({
        title: tCommon('success'),
        description: t('monthlyGrid.saveSuccess', {
          defaultValue: `Monthly records updated, total actual spending: ${formatCurrency(data?.actualSpent ?? totalActual)}`,
          amount: formatCurrency(data?.actualSpent ?? totalActual)
        }),
      });
      if (onSave) {
        onSave(); // Call callback function to refetch data
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
      omExpenseId,
      monthlyData,
    });
  };

  const isSaving = updateMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{t('monthlyGrid.title', { defaultValue: 'Monthly Expense Records' })}</CardTitle>
            <CardDescription>
              {t('monthlyGrid.description', { defaultValue: 'Edit actual spending amounts for months 1-12, system will automatically calculate total' })}
            </CardDescription>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? tCommon('saving') : t('monthlyGrid.saveButton', { defaultValue: 'Save Monthly Records' })}
          </Button>
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
            <div className={`text-lg font-semibold ${getUtilizationColor()}`}>
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
            <div className={`text-lg font-semibold ${getUtilizationColor()}`}>
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
                  {t('monthlyGrid.monthColumn', { defaultValue: 'Month' })}
                </th>
                <th className="p-2 text-right font-medium">
                  {t('monthlyGrid.amountColumn', { defaultValue: 'Actual Spending (HKD)' })}
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
                <td className={`p-2 text-right ${getUtilizationColor()}`}>
                  {formatCurrency(totalActual)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Usage Tips */}
        <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
          <p className="font-medium">💡 {t('monthlyGrid.tips.title', { defaultValue: 'Usage Tips' })}</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>{t('monthlyGrid.tips.enterAmounts', { defaultValue: 'Enter actual spending amount for each month' })}</li>
            <li>{t('monthlyGrid.tips.autoCalculate', { defaultValue: 'System will automatically calculate total actual spending and utilization rate' })}</li>
            <li>{t('monthlyGrid.tips.clickSave', { defaultValue: 'Click "Save Monthly Records" button to save all changes' })}</li>
            <li>{t('monthlyGrid.tips.autoUpdate', { defaultValue: 'After saving, system will automatically update OM expense actualSpent field' })}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
