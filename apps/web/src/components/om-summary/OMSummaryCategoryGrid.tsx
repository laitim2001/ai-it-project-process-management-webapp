/**
 * @fileoverview OMSummaryCategoryGrid - O&M 類別匯總表格組件
 *
 * @description
 * 顯示 O&M 費用按類別分組的匯總表格，包含當前年度預算、上年度實際支出、
 * 變化百分比和項目數量。表格底部顯示總計行。
 *
 * @component OMSummaryCategoryGrid
 *
 * @features
 * - 按 O&M Category 分組顯示
 * - 顯示 FY Budget、FY Actual、Change %、Item Count
 * - 金額格式化（千分位）
 * - 百分比顏色區分（正值綠色、負值紅色）
 * - 總計行
 * - 響應式設計
 *
 * @dependencies
 * - @/components/ui/table - Table 組件
 * - next-intl - 國際化
 *
 * @related
 * - apps/web/src/app/[locale]/om-summary/page.tsx - 主頁面
 * - packages/api/src/routers/omExpense.ts - API
 *
 * @author IT Department
 * @since FEAT-003 - O&M Summary Page
 * @lastModified 2025-11-29
 */

'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface CategorySummaryItem {
  category: string;
  currentYearBudget: number;
  previousYearActual: number;
  changePercent: number | null;
  itemCount: number;
}

export interface GrandTotal {
  currentYearBudget: number;
  previousYearActual: number;
  changePercent: number | null;
  itemCount: number;
}

interface OMSummaryCategoryGridProps {
  data: CategorySummaryItem[];
  grandTotal: GrandTotal;
  currentYear: number;
  previousYear: number;
  isLoading?: boolean;
}

/**
 * 格式化金額（千分位）
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * 格式化百分比
 */
function formatPercent(value: number | null): string {
  if (value === null) return '-';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * 獲取百分比顏色類名
 */
function getPercentColorClass(value: number | null): string {
  if (value === null) return 'text-muted-foreground';
  if (value > 0) return 'text-green-600 dark:text-green-400';
  if (value < 0) return 'text-red-600 dark:text-red-400';
  return 'text-muted-foreground';
}

export function OMSummaryCategoryGrid({
  data,
  grandTotal,
  currentYear,
  previousYear,
  isLoading = false,
}: OMSummaryCategoryGridProps) {
  const t = useTranslations('omSummary');

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">{t('summaryGrid.title')}</h2>
        <div className="animate-pulse">
          <div className="h-10 bg-muted rounded mb-2" />
          <div className="h-8 bg-muted rounded mb-2" />
          <div className="h-8 bg-muted rounded mb-2" />
          <div className="h-8 bg-muted rounded mb-2" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">{t('summaryGrid.title')}</h2>
        <div className="text-center py-8 text-muted-foreground">
          {t('summaryGrid.noData')}
        </div>
      </div>
    );
  }

  // 動態替換年度 - 使用 next-intl 的參數傳遞方式
  const currentBudgetHeader = t('summaryGrid.currentBudget', { year: currentYear.toString().slice(-2) });
  const previousActualHeader = t('summaryGrid.previousActual', { year: previousYear.toString().slice(-2) });

  // 使用百分比寬度確保與 OMSummaryDetailGrid 對齊
  // 右側 4 欄使用相同百分比：FY預算(13%) + FY實際(13%) + 變動%(10%) + 最後欄(10%) = 46%
  // 左側欄位使用剩餘空間 54%

  return (
    <div className="bg-card rounded-lg border p-4 mb-6">
      <h2 className="text-lg font-semibold mb-4">{t('summaryGrid.title')}</h2>
      <Table className="table-fixed w-full">
        <colgroup>
          <col style={{ width: '54%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '13%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '10%' }} />
        </colgroup>
        <TableHeader>
          <TableRow>
            <TableHead>{t('summaryGrid.category')}</TableHead>
            <TableHead className="text-right">{currentBudgetHeader}</TableHead>
            <TableHead className="text-right">{previousActualHeader}</TableHead>
            <TableHead className="text-right">{t('summaryGrid.changePercent')}</TableHead>
            <TableHead className="text-right">{t('summaryGrid.itemCount')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.category}>
              <TableCell className="font-medium">{row.category}</TableCell>
              <TableCell className="text-right">{formatCurrency(row.currentYearBudget)}</TableCell>
              <TableCell className="text-right">{formatCurrency(row.previousYearActual)}</TableCell>
              <TableCell className={cn('text-right', getPercentColorClass(row.changePercent))}>
                {formatPercent(row.changePercent)}
              </TableCell>
              <TableCell className="text-right">{row.itemCount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-bold">{t('totals.grandTotal')}</TableCell>
            <TableCell className="text-right font-bold">{formatCurrency(grandTotal.currentYearBudget)}</TableCell>
            <TableCell className="text-right font-bold">{formatCurrency(grandTotal.previousYearActual)}</TableCell>
            <TableCell className={cn('text-right font-bold', getPercentColorClass(grandTotal.changePercent))}>
              {formatPercent(grandTotal.changePercent)}
            </TableCell>
            <TableCell className="text-right font-bold">{grandTotal.itemCount}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

export default OMSummaryCategoryGrid;
