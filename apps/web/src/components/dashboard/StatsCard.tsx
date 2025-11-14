/**
 * @fileoverview Stats Card Component - 統計數據卡片組件
 *
 * @description
 * Dashboard 統計數據展示卡片組件，支援顯示關鍵指標、變化趨勢和視覺化圖示。
 * 採用現代化卡片設計，支援正向/負向趨勢顯示和自定義背景色，提供良好的視覺層次感。
 *
 * @component StatsCard
 *
 * @features
 * - 關鍵指標值顯示（支援字串和數字）
 * - 變化趨勢顯示（increase/decrease）
 * - 趨勢圖示（TrendingUp/TrendingDown）
 * - 自定義圖示和背景色
 * - Hover 陰影效果
 * - 響應式設計（支援不同螢幕尺寸）
 * - 語意化顏色系統（success/error）
 *
 * @props
 * @param {Object} props - 組件屬性
 * @param {string} props.title - 統計數據標題
 * @param {string | number} props.value - 統計數據值
 * @param {Object} [props.change] - 變化趨勢資訊
 * @param {string} props.change.value - 變化值（如 "+5.2%"）
 * @param {'increase' | 'decrease'} props.change.type - 變化類型
 * @param {string} props.change.label - 變化標籤（如 "vs last month"）
 * @param {React.ReactNode} [props.icon] - 自定義圖示
 * @param {string} [props.bgColor='bg-primary-500'] - 圖示背景色
 *
 * @example
 * ```tsx
 * <StatsCard
 *   title="總預算"
 *   value="$1,250,000"
 *   change={{
 *     value: "+5.2%",
 *     type: "increase",
 *     label: "vs last month"
 *   }}
 *   icon={<DollarSign />}
 *   bgColor="bg-blue-500"
 * />
 * ```
 *
 * @dependencies
 * - lucide-react: 圖示（TrendingUp, TrendingDown）
 * - Tailwind CSS: 樣式系統
 *
 * @related
 * - apps/web/src/app/[locale]/dashboard/page.tsx - Dashboard 頁面
 * - apps/web/src/components/dashboard/StatCard.tsx - 替代統計卡片組件（舊版）
 *
 * @author IT Department
 * @since Epic 7 - Dashboard and Basic Reporting
 * @lastModified 2025-11-14
 */

'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    type: 'increase' | 'decrease';
    label: string;
  };
  icon?: React.ReactNode;
  bgColor?: string;
}

export function StatsCard({ title, value, change, icon, bgColor = 'bg-primary-500' }: StatsCardProps) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-neutral-600 mb-1.5">{title}</p>
          <p className="text-[22px] lg:text-[24px] font-bold leading-tight text-neutral-950 mb-1">{value}</p>
          {change && (
            <div className="flex items-center gap-1">
              {change.type === 'increase' ? (
                <TrendingUp className="h-3 w-3 text-semantic-success flex-shrink-0" />
              ) : (
                <TrendingDown className="h-3 w-3 text-semantic-error flex-shrink-0" />
              )}
              <span
                className={`text-[12px] font-medium ${
                  change.type === 'increase' ? 'text-semantic-success' : 'text-semantic-error'
                }`}
              >
                {change.value}
              </span>
              <span className="text-[12px] text-neutral-500">{change.label}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`rounded-lg ${bgColor} p-3 text-white flex-shrink-0`}>
            <div className="h-6 w-6">{icon}</div>
          </div>
        )}
      </div>
    </div>
  );
}
