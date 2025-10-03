/**
 * 統計數據卡片組件
 *
 * 顯示關鍵指標和趨勢
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
