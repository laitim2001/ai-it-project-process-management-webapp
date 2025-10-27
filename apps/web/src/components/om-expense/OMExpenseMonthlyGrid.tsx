'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/trpc';

/**
 * OMExpenseMonthlyGrid - OM 費用月度網格編輯器組件
 *
 * 功能：
 * 1. 顯示 1-12 月的月度支出記錄
 * 2. Excel 風格的網格編輯
 * 3. 自動計算總額
 * 4. 批量保存功能
 * 5. 即時更新 actualSpent
 *
 * 設計：
 * - 使用 Table 組件顯示 12 個月
 * - 每月一個輸入框
 * - 即時計算總額並顯示
 * - 保存時調用 updateMonthlyRecords API
 */

interface MonthlyRecord {
  month: number;
  actualAmount: number;
}

interface OMExpenseMonthlyGridProps {
  omExpenseId: string;
  budgetAmount: number;
  initialRecords?: MonthlyRecord[];
  onSave?: () => void; // 保存後的回調函數（用於重新獲取資料）
}

// 月份名稱（中文）
const MONTH_NAMES = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
];

export default function OMExpenseMonthlyGrid({
  omExpenseId,
  budgetAmount,
  initialRecords = [],
  onSave,
}: OMExpenseMonthlyGridProps) {
  const { toast } = useToast();

  // 初始化 12 個月的資料（如果沒有記錄，預設為 0）
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

  // 當 initialRecords 更新時，重新設置 monthlyData
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

  // 計算總額
  const totalActual = monthlyData.reduce((sum, record) => sum + record.actualAmount, 0);

  // 計算使用率
  const utilizationRate = budgetAmount > 0 ? (totalActual / budgetAmount) * 100 : 0;

  // 使用率顏色
  const getUtilizationColor = () => {
    if (utilizationRate > 100) return 'text-red-600';
    if (utilizationRate > 90) return 'text-yellow-600';
    return 'text-green-600';
  };

  // 格式化金額
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-HK', {
      style: 'currency',
      currency: 'HKD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // 更新單月數據
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
        title: '保存成功',
        description: `月度記錄已更新，總實際支出：${formatCurrency(data?.actualSpent ?? totalActual)}`,
      });
      if (onSave) {
        onSave(); // 調用回調函數重新獲取資料
      }
    },
    onError: (error) => {
      toast({
        title: '保存失敗',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // 保存月度記錄
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
            <CardTitle>月度支出記錄</CardTitle>
            <CardDescription>
              編輯 1-12 月的實際支出金額，系統將自動計算總額
            </CardDescription>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? '保存中...' : '保存月度記錄'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* 預算概覽 */}
        <div className="mb-6 grid grid-cols-1 gap-4 rounded-lg bg-muted p-4 md:grid-cols-4">
          <div>
            <div className="text-sm text-muted-foreground">年度預算</div>
            <div className="text-lg font-semibold">{formatCurrency(budgetAmount)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">實際支出</div>
            <div className={`text-lg font-semibold ${getUtilizationColor()}`}>
              {formatCurrency(totalActual)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">剩餘預算</div>
            <div className="text-lg font-semibold">
              {formatCurrency(budgetAmount - totalActual)}
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">使用率</div>
            <div className={`text-lg font-semibold ${getUtilizationColor()}`}>
              {utilizationRate.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* 月度網格 */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left font-medium">月份</th>
                <th className="p-2 text-right font-medium">實際支出 (HKD)</th>
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
                <td className="p-2">總計</td>
                <td className={`p-2 text-right ${getUtilizationColor()}`}>
                  {formatCurrency(totalActual)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 提示訊息 */}
        <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
          <p className="font-medium">💡 使用提示</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>輸入每月的實際支出金額</li>
            <li>系統會自動計算總實際支出和使用率</li>
            <li>點擊「保存月度記錄」按鈕保存所有變更</li>
            <li>保存後系統會自動更新 OM 費用的 actualSpent 欄位</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
