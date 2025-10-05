/**
 * 預算池概覽組件
 *
 * Epic 7 - Story 7.4: 預算池概覽視圖
 *
 * 顯示所有預算池的財務摘要
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DollarSign, TrendingUp, TrendingDown, Briefcase } from 'lucide-react';

interface BudgetPoolSummary {
  id: string;
  fiscalYear: number; // API returns this field name (mapped from financialYear)
  totalAmount: number;
  usedAmount: number;
  remainingAmount: number;
  usagePercentage: number;
  projectCount: number;
  activeProjectCount: number;
}

interface BudgetPoolOverviewProps {
  budgetPools: BudgetPoolSummary[];
}

export function BudgetPoolOverview({ budgetPools }: BudgetPoolOverviewProps) {
  if (budgetPools.length === 0) {
    return (
      <div className="text-center py-12">
        <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <p className="text-gray-600">尚無預算池數據</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {budgetPools.map((pool) => {
        const isHealthy = pool.usagePercentage < 70;
        const isWarning = pool.usagePercentage >= 70 && pool.usagePercentage < 90;
        const isDanger = pool.usagePercentage >= 90;

        return (
          <Card key={pool.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{pool.fiscalYear} 年度預算池</span>
                <DollarSign
                  className={`h-5 w-5 ${
                    isHealthy
                      ? 'text-green-600'
                      : isWarning
                        ? 'text-orange-600'
                        : 'text-red-600'
                  }`}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 總預算 */}
              <div>
                <p className="text-sm text-gray-600">總預算</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${pool.totalAmount.toLocaleString()}
                </p>
              </div>

              {/* 已用金額 */}
              <div>
                <p className="text-sm text-gray-600">已使用</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-xl font-semibold text-orange-600">
                    ${pool.usedAmount.toLocaleString()}
                  </p>
                  {pool.usedAmount > 0 && (
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                  )}
                </div>
              </div>

              {/* 剩餘金額 */}
              <div>
                <p className="text-sm text-gray-600">剩餘</p>
                <div className="flex items-baseline gap-2">
                  <p
                    className={`text-xl font-semibold ${
                      isHealthy
                        ? 'text-green-600'
                        : isWarning
                          ? 'text-orange-600'
                          : 'text-red-600'
                    }`}
                  >
                    ${pool.remainingAmount.toLocaleString()}
                  </p>
                  {pool.remainingAmount < pool.totalAmount * 0.3 && (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>

              {/* 使用進度條 */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">使用率</span>
                  <span
                    className={`font-medium ${
                      isHealthy
                        ? 'text-green-600'
                        : isWarning
                          ? 'text-orange-600'
                          : 'text-red-600'
                    }`}
                  >
                    {pool.usagePercentage.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={pool.usagePercentage}
                  className={
                    isDanger
                      ? '[&>div]:bg-red-600'
                      : isWarning
                        ? '[&>div]:bg-orange-600'
                        : '[&>div]:bg-green-600'
                  }
                />
              </div>

              {/* 專案數量 */}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">關聯專案</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium text-gray-900">
                      {pool.projectCount} 個
                    </span>
                    <span className="text-gray-500">
                      ({pool.activeProjectCount} 進行中)
                    </span>
                  </div>
                </div>
              </div>

              {/* 健康狀態提示 */}
              {isDanger && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-sm text-red-700">
                  ⚠️ 預算即將用盡，請謹慎審批
                </div>
              )}
              {isWarning && !isDanger && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 text-sm text-orange-700">
                  ⚡ 預算使用率偏高，需要關注
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
