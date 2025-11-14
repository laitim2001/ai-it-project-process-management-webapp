/**
 * @fileoverview Stat Card Component - 統計卡片組件（舊版）
 *
 * @description
 * Dashboard 統計數據展示卡片組件（舊版本），支援顯示統計值、圖示和趨勢百分比。
 * 使用 shadcn/ui Card 組件，提供簡潔的統計數據展示介面。
 * 注意：此為舊版組件，新功能建議使用 StatsCard.tsx。
 *
 * @component StatCard
 *
 * @features
 * - 統計數據值顯示（支援字串和數字）
 * - 圖示顯示（支援 Lucide React 圖示）
 * - 趨勢百分比顯示（正向/負向）
 * - 自定義圖示顏色
 * - 基於 shadcn/ui Card 組件
 *
 * @props
 * @param {Object} props - 組件屬性
 * @param {string} props.title - 統計數據標題
 * @param {number | string} props.value - 統計數據值
 * @param {LucideIcon} props.icon - Lucide React 圖示組件
 * @param {string} [props.iconColor='text-blue-600'] - 圖示顏色類別
 * @param {Object} [props.trend] - 趨勢資訊
 * @param {number} props.trend.value - 趨勢百分比值
 * @param {boolean} props.trend.isPositive - 是否為正向趨勢
 *
 * @example
 * ```tsx
 * import { DollarSign } from 'lucide-react';
 *
 * <StatCard
 *   title="總預算"
 *   value="$1,250,000"
 *   icon={DollarSign}
 *   iconColor="text-blue-600"
 *   trend={{
 *     value: 5.2,
 *     isPositive: true
 *   }}
 * />
 * ```
 *
 * @dependencies
 * - shadcn/ui: Card, CardContent
 * - lucide-react: LucideIcon 類型
 *
 * @related
 * - apps/web/src/components/dashboard/StatsCard.tsx - 新版統計卡片組件（建議使用）
 * - apps/web/src/app/[locale]/dashboard/page.tsx - Dashboard 頁面
 *
 * @author IT Department
 * @since Epic 7 - Dashboard and Basic Reporting
 * @lastModified 2025-11-14
 */

import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-blue-600',
  trend,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            {trend && (
              <p
                className={`text-sm mt-2 ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </p>
            )}
          </div>
          <div className={`${iconColor}`}>
            <Icon className="h-8 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
