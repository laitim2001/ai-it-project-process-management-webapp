/**
 * @fileoverview OMSummaryDetailGrid - O&M 明細表格組件
 *
 * @description
 * 顯示 O&M 費用的明細列表，使用階層結構：Category → OpCo → Items。
 * 使用 Accordion 組件實現可展開/收合的分組結構。
 *
 * @component OMSummaryDetailGrid
 *
 * @features
 * - 階層結構顯示（Category → OpCo → Items）
 * - 使用 Accordion 實現可展開/收合
 * - 顯示 FY Budget、FY Actual、Change %、End Date
 * - 每個 OpCo 的小計
 * - 每個 Category 的總計
 * - 金額格式化（千分位）
 * - 百分比顏色區分（正值綠色、負值紅色）
 * - 日期格式化
 * - 響應式設計
 *
 * @dependencies
 * - @/components/ui/accordion - Accordion 組件
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
import { FolderOpen, Building2 } from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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

export interface ItemDetail {
  id: string;
  name: string;
  description: string | null;
  currentYearBudget: number;
  previousYearActual: number | null;
  changePercent: number | null;
  endDate: Date | string;
}

export interface OpCoSubTotal {
  currentYearBudget: number;
  previousYearActual: number;
  changePercent: number | null;
}

export interface OpCoGroup {
  opCoId: string;
  opCoCode: string;
  opCoName: string;
  items: ItemDetail[];
  subTotal: OpCoSubTotal;
}

export interface CategoryTotal {
  currentYearBudget: number;
  previousYearActual: number;
  changePercent: number | null;
}

export interface CategoryDetailGroup {
  category: string;
  opCoGroups: OpCoGroup[];
  categoryTotal: CategoryTotal;
}

interface OMSummaryDetailGridProps {
  data: CategoryDetailGroup[];
  currentYear: number;
  previousYear: number;
  isLoading?: boolean;
  showOpCoGroups?: boolean; // 是否顯示 OpCo 分組（當只選一個 OpCo 時可隱藏）
}

/**
 * 格式化金額（千分位）
 */
function formatCurrency(amount: number | null): string {
  if (amount === null) return '-';
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
 * 格式化日期
 */
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
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

export function OMSummaryDetailGrid({
  data,
  currentYear,
  previousYear,
  isLoading = false,
  showOpCoGroups = true,
}: OMSummaryDetailGridProps) {
  const t = useTranslations('omSummary');

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-4">{t('detailGrid.title')}</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
          <div className="h-12 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-4">{t('detailGrid.title')}</h2>
        <div className="text-center py-8 text-muted-foreground">
          {t('detailGrid.noData')}
        </div>
      </div>
    );
  }

  // 動態替換年度 - 使用 next-intl 的參數傳遞方式
  const currentBudgetHeader = t('summaryGrid.currentBudget', { year: currentYear.toString().slice(-2) });
  const previousActualHeader = t('summaryGrid.previousActual', { year: previousYear.toString().slice(-2) });

  // 預設展開所有 Category
  const defaultExpandedCategories = data.map((cat) => cat.category);

  return (
    <div className="bg-card rounded-lg border p-4">
      <h2 className="text-lg font-semibold mb-4">{t('detailGrid.title')}</h2>

      <Accordion
        type="multiple"
        defaultValue={defaultExpandedCategories}
        className="space-y-4"
      >
        {data.map((categoryGroup) => (
          <AccordionItem
            key={categoryGroup.category}
            value={categoryGroup.category}
            className="border rounded-lg overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-3 bg-muted/50 hover:bg-muted/70 hover:no-underline">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                <span className="font-semibold">{t('detailGrid.category')}: {categoryGroup.category}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-0">
              <div className="p-4 space-y-4">
                {showOpCoGroups && categoryGroup.opCoGroups.length > 1 ? (
                  // 多個 OpCo，顯示 OpCo 子分組
                  <Accordion
                    type="multiple"
                    defaultValue={categoryGroup.opCoGroups.map((g) => g.opCoId)}
                    className="space-y-2"
                  >
                    {categoryGroup.opCoGroups.map((opCoGroup) => (
                      <AccordionItem
                        key={opCoGroup.opCoId}
                        value={opCoGroup.opCoId}
                        className="border rounded-lg overflow-hidden"
                      >
                        <AccordionTrigger className="px-4 py-2 bg-muted/30 hover:bg-muted/50 hover:no-underline">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{opCoGroup.opCoCode} - {opCoGroup.opCoName}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-0">
                          <ItemTable
                            items={opCoGroup.items}
                            subTotal={opCoGroup.subTotal}
                            currentBudgetHeader={currentBudgetHeader}
                            previousActualHeader={previousActualHeader}
                            t={t}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  // 單個 OpCo 或不顯示分組，直接顯示項目
                  categoryGroup.opCoGroups.map((opCoGroup) => (
                    <div key={opCoGroup.opCoId}>
                      {showOpCoGroups && categoryGroup.opCoGroups.length === 1 && (
                        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          <span>{opCoGroup.opCoCode} - {opCoGroup.opCoName}</span>
                        </div>
                      )}
                      <ItemTable
                        items={opCoGroup.items}
                        subTotal={opCoGroup.subTotal}
                        currentBudgetHeader={currentBudgetHeader}
                        previousActualHeader={previousActualHeader}
                        t={t}
                      />
                    </div>
                  ))
                )}

                {/* Category 總計 - 使用 Table 結構確保與 ItemTable 完全對齊 */}
                <div className="mt-4">
                  <Table className="table-fixed w-full">
                    <colgroup>
                      <col style={{ width: '5%' }} />
                      <col style={{ width: '49%' }} />
                      <col style={{ width: '13%' }} />
                      <col style={{ width: '13%' }} />
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '10%' }} />
                    </colgroup>
                    <TableBody>
                      <TableRow className="bg-primary/10 hover:bg-primary/15">
                        <TableCell></TableCell>
                        <TableCell className="font-bold">{t('detailGrid.categoryTotal')}</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(categoryGroup.categoryTotal.currentYearBudget)}</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(categoryGroup.categoryTotal.previousYearActual)}</TableCell>
                        <TableCell className={cn('text-right font-bold', getPercentColorClass(categoryGroup.categoryTotal.changePercent))}>
                          {formatPercent(categoryGroup.categoryTotal.changePercent)}
                        </TableCell>
                        <TableCell className="text-right">-</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

/**
 * 項目表格內部組件
 * 使用與 OMSummaryCategoryGrid 相同的百分比寬度確保對齊
 * 右側 4 欄：FY預算(13%) + FY實際(13%) + 變動%(10%) + 最後欄(10%) = 46%
 * 左側欄位：#(5%) + 項目(49%) = 54%
 */
function ItemTable({
  items,
  subTotal,
  currentBudgetHeader,
  previousActualHeader,
  t,
}: {
  items: ItemDetail[];
  subTotal: OpCoSubTotal;
  currentBudgetHeader: string;
  previousActualHeader: string;
  t: ReturnType<typeof useTranslations<'omSummary'>>;
}) {
  return (
    <Table className="table-fixed w-full">
      <colgroup>
        <col style={{ width: '5%' }} />
        <col style={{ width: '49%' }} />
        <col style={{ width: '13%' }} />
        <col style={{ width: '13%' }} />
        <col style={{ width: '10%' }} />
        <col style={{ width: '10%' }} />
      </colgroup>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>{t('detailGrid.item')}</TableHead>
          <TableHead className="text-right">{currentBudgetHeader}</TableHead>
          <TableHead className="text-right">{previousActualHeader}</TableHead>
          <TableHead className="text-right">{t('summaryGrid.changePercent')}</TableHead>
          <TableHead className="text-right">{t('detailGrid.endDate')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, index) => (
          <TableRow key={item.id}>
            <TableCell className="text-muted-foreground">{index + 1}</TableCell>
            <TableCell>
              <div>
                <div className="font-medium">{item.name}</div>
                {item.description && (
                  <div className="text-sm text-muted-foreground">{item.description}</div>
                )}
              </div>
            </TableCell>
            <TableCell className="text-right">{formatCurrency(item.currentYearBudget)}</TableCell>
            <TableCell className="text-right">{formatCurrency(item.previousYearActual)}</TableCell>
            <TableCell className={cn('text-right', getPercentColorClass(item.changePercent))}>
              {formatPercent(item.changePercent)}
            </TableCell>
            <TableCell className="text-right">{formatDate(item.endDate)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2} className="font-semibold">{t('detailGrid.subTotal')}</TableCell>
          <TableCell className="text-right font-semibold">{formatCurrency(subTotal.currentYearBudget)}</TableCell>
          <TableCell className="text-right font-semibold">{formatCurrency(subTotal.previousYearActual)}</TableCell>
          <TableCell className={cn('text-right font-semibold', getPercentColorClass(subTotal.changePercent))}>
            {formatPercent(subTotal.changePercent)}
          </TableCell>
          <TableCell className="text-right">-</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

export default OMSummaryDetailGrid;
