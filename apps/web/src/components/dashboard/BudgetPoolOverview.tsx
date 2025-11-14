/**
 * @fileoverview Budget Pool Overview Component - 預算池概覽組件
 *
 * @description
 * 在 Dashboard 顯示預算池財務摘要卡片，提供預算使用情況的視覺化概覽。
 * 以卡片形式展示每個財年的預算池，包含總預算、已用金額、剩餘金額、
 * 使用率進度條和健康狀態指示器，支援 70%/90% 預警閾值。
 *
 * @component BudgetPoolOverview
 *
 * @features
 * - 預算池卡片展示（網格佈局，響應式）
 * - 財務數據展示（總預算、已用、剩餘）
 * - 使用率進度條（顏色編碼：綠/橙/紅）
 * - 健康狀態指示器（<70% 健康，70-90% 警告，≥90% 危險）
 * - 關聯專案統計（總數和活躍數）
 * - 空狀態處理（無預算池時顯示提示）
 * - 多語言支援（繁中/英文）
 *
 * @props
 * @param {Object} props - 組件屬性
 * @param {BudgetPoolSummary[]} props.budgetPools - 預算池摘要陣列
 * @param {string} props.budgetPools[].id - 預算池 ID
 * @param {number} props.budgetPools[].fiscalYear - 財年
 * @param {number} props.budgetPools[].totalAmount - 總預算金額
 * @param {number} props.budgetPools[].usedAmount - 已使用金額
 * @param {number} props.budgetPools[].remainingAmount - 剩餘金額
 * @param {number} props.budgetPools[].usagePercentage - 使用率百分比
 * @param {number} props.budgetPools[].projectCount - 總專案數
 * @param {number} props.budgetPools[].activeProjectCount - 活躍專案數
 *
 * @example
 * ```tsx
 * <BudgetPoolOverview
 *   budgetPools={[
 *     {
 *       id: '123',
 *       fiscalYear: 2024,
 *       totalAmount: 1000000,
 *       usedAmount: 750000,
 *       remainingAmount: 250000,
 *       usagePercentage: 75,
 *       projectCount: 5,
 *       activeProjectCount: 3
 *     }
 *   ]}
 * />
 * ```
 *
 * @dependencies
 * - next-intl: 國際化翻譯
 * - lucide-react: 圖示組件（DollarSign, TrendingUp, TrendingDown, Briefcase）
 * - shadcn/ui: Card, Progress 組件
 *
 * @related
 * - packages/api/src/routers/dashboard.ts - Dashboard API Router
 * - apps/web/src/app/[locale]/dashboard/page.tsx - Dashboard 頁面
 * - apps/web/src/components/ui/card.tsx - Card 組件
 * - apps/web/src/components/ui/progress.tsx - Progress 組件
 *
 * @author IT Department
 * @since Epic 7 - Dashboard & Basic Reporting
 * @lastModified 2025-11-14
 */

'use client';

import { useTranslations } from 'next-intl';
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
  const t = useTranslations('dashboard.budgetPool');

  if (budgetPools.length === 0) {
    return (
      <div className="text-center py-12">
        <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <p className="text-gray-600">{t('noData')}</p>
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
                <span>{t('fiscalYearPool', { year: pool.fiscalYear })}</span>
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
                <p className="text-sm text-gray-600">{t('totalBudget')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${pool.totalAmount.toLocaleString()}
                </p>
              </div>

              {/* 已用金額 */}
              <div>
                <p className="text-sm text-gray-600">{t('used')}</p>
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
                <p className="text-sm text-gray-600">{t('remaining')}</p>
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
                  <span className="text-gray-600">{t('utilizationRate')}</span>
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
                    <span className="text-gray-600">{t('relatedProjects')}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium text-gray-900">
                      {t('projectCount', { count: pool.projectCount })}
                    </span>
                    <span className="text-gray-500">
                      ({t('activeCount', { count: pool.activeProjectCount })})
                    </span>
                  </div>
                </div>
              </div>

              {/* 健康狀態提示 */}
              {isDanger && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-sm text-red-700">
                  ⚠️ {t('warningAlmostDepleted')}
                </div>
              )}
              {isWarning && !isDanger && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 text-sm text-orange-700">
                  ⚡ {t('warningHighUsage')}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
