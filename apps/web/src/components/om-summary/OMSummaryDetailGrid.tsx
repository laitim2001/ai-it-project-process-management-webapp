/**
 * @fileoverview OMSummaryDetailGrid - O&M 明細表格組件
 *
 * @description
 * 顯示 O&M 費用的明細列表，使用階層結構：Category → OpCo → Items。
 * 使用 Accordion 組件實現可展開/收合的分組結構。
 * FEAT-007 更新：支援新的 OMExpenseItem 架構，項目點擊可導航至詳情頁。
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
 * - 項目可點擊導航（FEAT-007）
 * - Dark Mode 支援
 *
 * @dependencies
 * - @/components/ui/accordion - Accordion 組件
 * - @/components/ui/table - Table 組件
 * - lucide-react - 圖標
 * - next-intl - 國際化
 *
 * @related
 * - apps/web/src/app/[locale]/om-summary/page.tsx - 主頁面
 * - apps/web/src/app/[locale]/om-expenses/[id]/page.tsx - OM 費用詳情頁面
 * - packages/api/src/routers/omExpense.ts - API (getSummary)
 * - packages/db/prisma/schema.prisma - OMExpense, OMExpenseItem 資料模型
 *
 * @author IT Department
 * @since FEAT-003 - O&M Summary Page
 * @lastModified 2025-12-05
 */

'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { FolderOpen, Building2, ExternalLink, FileText } from 'lucide-react';

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

// ============================================================
// Types
// ============================================================

export interface ItemDetail {
  id: string;
  name: string;
  description: string | null;
  currentYearBudget: number;
  previousYearActual: number | null;
  changePercent: number | null;
  endDate: Date | string;
  /** FEAT-007/CHANGE-004: 關聯的 OM Expense ID（用於導航） */
  omExpenseId?: string;
  /** FEAT-007/CHANGE-004: 是否為 OMExpenseItem（新架構）或舊 OMExpense */
  isNewArchitecture?: boolean;
}

/**
 * CHANGE-004: OM Expense 表頭分組
 * 用於在 OpCo 層下方顯示按 OMExpense 表頭分組的明細
 */
export interface OMExpenseHeaderGroup {
  omExpenseId: string;
  omExpenseName: string;
  omExpenseDescription: string | null;
  createdByName: string;
  createdAt: Date | string;
  items: ItemDetail[];
  headerTotal: {
    currentYearBudget: number;
    previousYearActual: number;
    changePercent: number | null;
  };
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
  /** 舊架構：直接項目列表（用於沒有 OMExpenseItem 的記錄） */
  items: ItemDetail[];
  /** CHANGE-004: 新架構：按 OMExpense 表頭分組的項目列表 */
  omExpenseHeaders?: OMExpenseHeaderGroup[];
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
  /** 是否顯示 OpCo 分組（當只選一個 OpCo 時可隱藏） */
  showOpCoGroups?: boolean;
  /** FEAT-007: 項目點擊回調（用於導航到詳情頁） */
  onItemClick?: (item: ItemDetail) => void;
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
  onItemClick,
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
                            <span className="font-medium">{opCoGroup.opCoName}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-0">
                          {/* CHANGE-004: 檢查是否有新架構的表頭分組 */}
                          {opCoGroup.omExpenseHeaders && opCoGroup.omExpenseHeaders.length > 0 ? (
                            <OMExpenseHeaderSection
                              headers={opCoGroup.omExpenseHeaders}
                              currentBudgetHeader={currentBudgetHeader}
                              previousActualHeader={previousActualHeader}
                              t={t}
                              onItemClick={onItemClick}
                            />
                          ) : (
                            <ItemTable
                              items={opCoGroup.items}
                              subTotal={opCoGroup.subTotal}
                              currentBudgetHeader={currentBudgetHeader}
                              previousActualHeader={previousActualHeader}
                              t={t}
                              onItemClick={onItemClick}
                            />
                          )}
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
                          <span>{opCoGroup.opCoName}</span>
                        </div>
                      )}
                      {/* CHANGE-004: 檢查是否有新架構的表頭分組 */}
                      {opCoGroup.omExpenseHeaders && opCoGroup.omExpenseHeaders.length > 0 ? (
                        <OMExpenseHeaderSection
                          headers={opCoGroup.omExpenseHeaders}
                          currentBudgetHeader={currentBudgetHeader}
                          previousActualHeader={previousActualHeader}
                          t={t}
                          onItemClick={onItemClick}
                        />
                      ) : (
                        <ItemTable
                          items={opCoGroup.items}
                          subTotal={opCoGroup.subTotal}
                          currentBudgetHeader={currentBudgetHeader}
                          previousActualHeader={previousActualHeader}
                          t={t}
                          onItemClick={onItemClick}
                        />
                      )}
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
 * CHANGE-004: OM Expense 表頭區段組件
 * 顯示按 OMExpense 表頭分組的明細，包含：
 * - 表頭層 Accordion（可展開/收合）
 * - 每個表頭下的明細 Table（含小計）
 */
function OMExpenseHeaderSection({
  headers,
  currentBudgetHeader,
  previousActualHeader,
  t,
  onItemClick,
}: {
  headers: OMExpenseHeaderGroup[];
  currentBudgetHeader: string;
  previousActualHeader: string;
  t: ReturnType<typeof useTranslations<'omSummary'>>;
  onItemClick?: (item: ItemDetail) => void;
}) {
  const isClickable = !!onItemClick;

  // 預設展開所有表頭
  const defaultExpandedHeaders = headers.map((h) => h.omExpenseId);

  return (
    <div className="space-y-2">
      {/* OMExpense 表頭 Accordion */}
      <Accordion
        type="multiple"
        defaultValue={defaultExpandedHeaders}
        className="space-y-2"
      >
        {headers.map((header) => (
          <AccordionItem
            key={header.omExpenseId}
            value={header.omExpenseId}
            className="border rounded-lg overflow-hidden"
          >
            <AccordionTrigger className="px-4 py-2 bg-muted/10 hover:bg-muted/20 hover:no-underline">
              <div className="flex items-center gap-2 flex-1">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <div className="flex-1 text-left">
                  <span className="font-medium">{header.omExpenseName}</span>
                  {/* CHANGE-006: 隱藏 OM Expense Header Description */}
                  {/* {header.omExpenseDescription && (
                    <span className="text-sm text-muted-foreground ml-2">
                      - {header.omExpenseDescription}
                    </span>
                  )} */}
                </div>
                {/* 表頭小計 */}
                <div className="flex items-center gap-4 text-sm mr-4">
                  <span className="text-muted-foreground">
                    {t('detailGrid.headerTotal')}:
                  </span>
                  <span className="font-medium">
                    {formatCurrency(header.headerTotal.currentYearBudget)}
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-0">
              {/* 明細項目表格 */}
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
                  {header.items.map((item, index) => (
                    <TableRow
                      key={item.id}
                      className={cn(
                        isClickable && 'cursor-pointer hover:bg-accent/50 transition-colors'
                      )}
                      onClick={isClickable ? () => onItemClick(item) : undefined}
                    >
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="font-medium">{item.name}</div>
                            {/* CHANGE-006: 隱藏 Item Description */}
                            {/* {item.description && (
                              <div className="text-sm text-muted-foreground">{item.description}</div>
                            )} */}
                          </div>
                          {isClickable && (
                            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
                {/* 表頭小計 */}
                <TableFooter>
                  <TableRow className="bg-blue-50/50 dark:bg-blue-900/20">
                    <TableCell colSpan={2} className="font-medium text-blue-700 dark:text-blue-300">
                      {t('detailGrid.headerSubTotal')}
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(header.headerTotal.currentYearBudget)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(header.headerTotal.previousYearActual)}</TableCell>
                    <TableCell className={cn('text-right font-medium', getPercentColorClass(header.headerTotal.changePercent))}>
                      {formatPercent(header.headerTotal.changePercent)}
                    </TableCell>
                    <TableCell className="text-right">-</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
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
 *
 * FEAT-007: 支援項目點擊導航
 */
function ItemTable({
  items,
  subTotal,
  currentBudgetHeader,
  previousActualHeader,
  t,
  onItemClick,
}: {
  items: ItemDetail[];
  subTotal: OpCoSubTotal;
  currentBudgetHeader: string;
  previousActualHeader: string;
  t: ReturnType<typeof useTranslations<'omSummary'>>;
  onItemClick?: (item: ItemDetail) => void;
}) {
  const isClickable = !!onItemClick;
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
          <TableRow
            key={item.id}
            className={cn(
              isClickable && 'cursor-pointer hover:bg-accent/50 transition-colors'
            )}
            onClick={isClickable ? () => onItemClick(item) : undefined}
          >
            <TableCell className="text-muted-foreground">{index + 1}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  {/* CHANGE-006: 隱藏 Item Description */}
                  {/* {item.description && (
                    <div className="text-sm text-muted-foreground">{item.description}</div>
                  )} */}
                </div>
                {isClickable && (
                  <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
