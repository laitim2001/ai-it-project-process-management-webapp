/**
 * @fileoverview OMSummaryDetailGrid - O&M 明細表格組件
 *
 * @description
 * 顯示 O&M 費用的明細列表，使用階層結構。
 * CHANGE-031 重構：層級結構從 Category → OpCo → Header → Item
 * 變更為 Category → Header → OpCo → Item。
 * 使用 Accordion 組件實現可展開/收合的分組結構。
 * FEAT-007 更新：支援新的 OMExpenseItem 架構，項目點擊可導航至詳情頁。
 *
 * @component OMSummaryDetailGrid
 *
 * @features
 * - CHANGE-031: 新階層結構顯示（Category → Header → OpCo → Items）
 * - 使用 Accordion 實現可展開/收合
 * - 顯示 FY Budget、FY Actual、Change %、End Date
 * - 每個層級的小計和 item count 顯示
 * - 金額格式化（千分位）
 * - 百分比顏色區分（正值綠色、負值紅色）
 * - 日期格式化
 * - 響應式設計
 * - 項目可點擊導航（FEAT-007）
 * - Dark Mode 支援
 * - CHANGE-030: 搜索過濾和高亮
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
 * @lastModified 2025-12-16 CHANGE-031
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
  /** FIX-010: endDate 可為 null（對應 isOngoing=true 的項目） */
  endDate: Date | string | null;
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

// ============================================================
// CHANGE-031: 新層級結構類型定義
// 轉換後的結構: Category → Header → OpCo → Item
// ============================================================

/**
 * CHANGE-031: 新層級結構 - Header 下的 OpCo 分組
 */
interface HeaderOpCoGroup {
  opCoId: string;
  opCoCode: string;
  opCoName: string;
  items: ItemDetail[];
  subTotal: {
    currentYearBudget: number;
    previousYearActual: number;
    changePercent: number | null;
  };
}

/**
 * CHANGE-031: 新層級結構 - Category 下的 Header 分組
 */
interface CategoryHeaderGroup {
  omExpenseId: string;
  omExpenseName: string;
  omExpenseDescription: string | null;
  opCoGroups: HeaderOpCoGroup[];
  headerTotal: {
    currentYearBudget: number;
    previousYearActual: number;
    changePercent: number | null;
    itemCount: number;
  };
}

/**
 * CHANGE-031: 新層級結構 - 頂層 Category 分組
 */
interface HeaderCentricCategoryGroup {
  category: string;
  headers: CategoryHeaderGroup[];
  categoryTotal: {
    currentYearBudget: number;
    previousYearActual: number;
    changePercent: number | null;
    itemCount: number;
  };
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
  /** CHANGE-030: 搜索詞（用於過濾和高亮） */
  searchTerm?: string;
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
 * FIX-010: 處理 null/空值，避免顯示 01/01/1970
 */
function formatDate(date: Date | string | null | undefined): string {
  // FIX-010: 如果日期為空，返回空白
  if (!date) return '-';

  const d = typeof date === 'string' ? new Date(date) : date;

  // FIX-010: 檢查日期是否有效，以及是否為 Unix epoch (1970-01-01)
  if (isNaN(d.getTime()) || d.getTime() === 0 || d.getFullYear() === 1970) {
    return '-';
  }

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

/**
 * CHANGE-030: 高亮匹配文字的組件
 */
function HighlightText({ text, searchTerm }: { text: string; searchTerm?: string }) {
  if (!searchTerm || !text) {
    return <>{text}</>;
  }

  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

/**
 * CHANGE-030: 過濾數據的函數
 */
function filterDataBySearchTerm(data: CategoryDetailGroup[], searchTerm?: string): CategoryDetailGroup[] {
  if (!searchTerm || searchTerm.trim() === '') {
    return data;
  }

  const lowerSearch = searchTerm.toLowerCase();

  return data.map((categoryGroup) => {
    // 過濾 OpCo 組
    const filteredOpCoGroups = categoryGroup.opCoGroups.map((opCoGroup) => {
      // 過濾表頭分組（新架構）
      const filteredHeaders = opCoGroup.omExpenseHeaders?.map((header) => {
        // 檢查表頭名稱是否匹配
        const headerMatches = header.omExpenseName.toLowerCase().includes(lowerSearch);

        // 過濾項目
        const filteredItems = header.items.filter((item) =>
          item.name.toLowerCase().includes(lowerSearch)
        );

        // 如果表頭匹配，返回所有項目；否則只返回匹配的項目
        return {
          ...header,
          items: headerMatches ? header.items : filteredItems,
        };
      }).filter((header) => header.items.length > 0 || header.omExpenseName.toLowerCase().includes(lowerSearch));

      // 過濾舊架構項目
      const filteredItems = opCoGroup.items.filter((item) =>
        item.name.toLowerCase().includes(lowerSearch)
      );

      return {
        ...opCoGroup,
        omExpenseHeaders: filteredHeaders,
        items: filteredItems,
      };
    }).filter((opCoGroup) =>
      (opCoGroup.omExpenseHeaders && opCoGroup.omExpenseHeaders.length > 0) ||
      opCoGroup.items.length > 0
    );

    return {
      ...categoryGroup,
      opCoGroups: filteredOpCoGroups,
    };
  }).filter((categoryGroup) => categoryGroup.opCoGroups.length > 0);
}

/**
 * CHANGE-031: 轉換數據結構
 * 將原有結構 (Category → OpCo → Header → Item)
 * 轉換為新結構 (Category → Header → OpCo → Item)
 */
function transformToHeaderCentric(data: CategoryDetailGroup[]): HeaderCentricCategoryGroup[] {
  return data.map((categoryGroup) => {
    // 收集該 Category 下所有 Header
    const headersMap = new Map<string, {
      omExpenseId: string;
      omExpenseName: string;
      omExpenseDescription: string | null;
      opCoItemsMap: Map<string, {
        opCoId: string;
        opCoCode: string;
        opCoName: string;
        items: ItemDetail[];
      }>;
    }>();

    // 遍歷每個 OpCo
    for (const opCoGroup of categoryGroup.opCoGroups) {
      // 處理新架構的 headers
      if (opCoGroup.omExpenseHeaders) {
        for (const header of opCoGroup.omExpenseHeaders) {
          if (!headersMap.has(header.omExpenseId)) {
            headersMap.set(header.omExpenseId, {
              omExpenseId: header.omExpenseId,
              omExpenseName: header.omExpenseName,
              omExpenseDescription: header.omExpenseDescription,
              opCoItemsMap: new Map(),
            });
          }
          const headerData = headersMap.get(header.omExpenseId)!;

          // 將該 OpCo 的 items 添加到 Header 下
          if (!headerData.opCoItemsMap.has(opCoGroup.opCoId)) {
            headerData.opCoItemsMap.set(opCoGroup.opCoId, {
              opCoId: opCoGroup.opCoId,
              opCoCode: opCoGroup.opCoCode,
              opCoName: opCoGroup.opCoName,
              items: [],
            });
          }
          headerData.opCoItemsMap.get(opCoGroup.opCoId)!.items.push(...header.items);
        }
      }

      // 處理舊架構的直接 items (沒有 header 的項目)
      if (opCoGroup.items && opCoGroup.items.length > 0) {
        // 為舊架構的 items 創建一個虛擬的 header
        const virtualHeaderId = `legacy-${opCoGroup.opCoId}`;
        if (!headersMap.has(virtualHeaderId)) {
          headersMap.set(virtualHeaderId, {
            omExpenseId: virtualHeaderId,
            omExpenseName: 'Legacy Items',
            omExpenseDescription: null,
            opCoItemsMap: new Map(),
          });
        }
        const headerData = headersMap.get(virtualHeaderId)!;

        if (!headerData.opCoItemsMap.has(opCoGroup.opCoId)) {
          headerData.opCoItemsMap.set(opCoGroup.opCoId, {
            opCoId: opCoGroup.opCoId,
            opCoCode: opCoGroup.opCoCode,
            opCoName: opCoGroup.opCoName,
            items: [],
          });
        }
        headerData.opCoItemsMap.get(opCoGroup.opCoId)!.items.push(...opCoGroup.items);
      }
    }

    // 計算 changePercent 的輔助函數
    const calculateChangePercent = (budget: number, actual: number): number | null => {
      if (actual === 0) return null;
      return ((budget - actual) / actual) * 100;
    };

    // 轉換為新結構
    const headers: CategoryHeaderGroup[] = [];
    let categoryTotalBudget = 0;
    let categoryTotalActual = 0;
    let categoryItemCount = 0;

    for (const [, headerData] of headersMap) {
      const opCoGroups: HeaderOpCoGroup[] = [];
      let headerTotalBudget = 0;
      let headerTotalActual = 0;
      let headerItemCount = 0;

      for (const [, opCoData] of headerData.opCoItemsMap) {
        const opCoTotalBudget = opCoData.items.reduce((sum, item) => sum + item.currentYearBudget, 0);
        const opCoTotalActual = opCoData.items.reduce((sum, item) => sum + (item.previousYearActual ?? 0), 0);

        opCoGroups.push({
          opCoId: opCoData.opCoId,
          opCoCode: opCoData.opCoCode,
          opCoName: opCoData.opCoName,
          items: opCoData.items,
          subTotal: {
            currentYearBudget: opCoTotalBudget,
            previousYearActual: opCoTotalActual,
            changePercent: calculateChangePercent(opCoTotalBudget, opCoTotalActual),
          },
        });

        headerTotalBudget += opCoTotalBudget;
        headerTotalActual += opCoTotalActual;
        headerItemCount += opCoData.items.length;
      }

      // 按 OpCo 名稱排序
      opCoGroups.sort((a, b) => a.opCoName.localeCompare(b.opCoName));

      headers.push({
        omExpenseId: headerData.omExpenseId,
        omExpenseName: headerData.omExpenseName,
        omExpenseDescription: headerData.omExpenseDescription,
        opCoGroups,
        headerTotal: {
          currentYearBudget: headerTotalBudget,
          previousYearActual: headerTotalActual,
          changePercent: calculateChangePercent(headerTotalBudget, headerTotalActual),
          itemCount: headerItemCount,
        },
      });

      categoryTotalBudget += headerTotalBudget;
      categoryTotalActual += headerTotalActual;
      categoryItemCount += headerItemCount;
    }

    // 按 Header 名稱排序
    headers.sort((a, b) => a.omExpenseName.localeCompare(b.omExpenseName));

    return {
      category: categoryGroup.category,
      headers,
      categoryTotal: {
        currentYearBudget: categoryTotalBudget,
        previousYearActual: categoryTotalActual,
        changePercent: calculateChangePercent(categoryTotalBudget, categoryTotalActual),
        itemCount: categoryItemCount,
      },
    };
  });
}

export function OMSummaryDetailGrid({
  data,
  currentYear,
  previousYear,
  isLoading = false,
  showOpCoGroups = true,
  onItemClick,
  searchTerm = '',
}: OMSummaryDetailGridProps) {
  const t = useTranslations('omSummary');

  // CHANGE-030: 過濾數據
  const filteredData = React.useMemo(
    () => filterDataBySearchTerm(data, searchTerm),
    [data, searchTerm]
  );

  // CHANGE-031: 轉換為 Header-Centric 結構
  const headerCentricData = React.useMemo(
    () => transformToHeaderCentric(filteredData),
    [filteredData]
  );

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

  // CHANGE-030: 搜索無結果提示
  if (filteredData.length === 0 && searchTerm) {
    return (
      <div className="bg-card rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-4">{t('detailGrid.title')}</h2>
        <div className="text-center py-8 text-muted-foreground">
          {t('search.noResults')}
        </div>
      </div>
    );
  }

  // 動態替換年度 - 使用 next-intl 的參數傳遞方式
  const currentBudgetHeader = t('summaryGrid.currentBudget', { year: currentYear.toString().slice(-2) });
  const previousActualHeader = t('summaryGrid.previousActual', { year: previousYear.toString().slice(-2) });

  // CHANGE-031: 預設展開所有 Category（使用轉換後的數據）
  const defaultExpandedCategories = headerCentricData.map((cat) => cat.category);

  // CHANGE-031: 層級樣式定義
  // FIX: Item 行改為白色背景，Subtotal 改為淺灰色 (#e5e7eb)
  const levelStyles = {
    category: 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/40',
    header: 'bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/40',
    opCo: 'bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/40',
    item: 'bg-white dark:bg-gray-900',
  };

  return (
    <div className="bg-card rounded-lg border p-4">
      <h2 className="text-lg font-semibold mb-4">{t('detailGrid.title')}</h2>

      {/* CHANGE-031: 新層級結構 - Category → Header → OpCo → Item */}
      <Accordion
        type="multiple"
        defaultValue={defaultExpandedCategories}
        className="space-y-4"
      >
        {headerCentricData.map((categoryGroup) => (
          <AccordionItem
            key={categoryGroup.category}
            value={categoryGroup.category}
            className="border rounded-lg overflow-hidden"
          >
            {/* 第1層：Category (藍色) */}
            <AccordionTrigger className={cn('px-4 py-3 hover:no-underline', levelStyles.category)}>
              <div className="flex items-center gap-2 flex-1">
                <FolderOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold">{categoryGroup.category}</span>
                <span className="text-sm text-muted-foreground ml-2">
                  ({categoryGroup.categoryTotal.itemCount} items)
                </span>
                <span className="ml-auto mr-4 font-medium">
                  {formatCurrency(categoryGroup.categoryTotal.currentYearBudget)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-0">
              <div className="pl-4 space-y-2 py-2">
                {/* 第2層：Header (黃色) */}
                <Accordion
                  type="multiple"
                  defaultValue={categoryGroup.headers.map((h) => h.omExpenseId)}
                  className="space-y-2"
                >
                  {categoryGroup.headers.map((header) => (
                    <AccordionItem
                      key={header.omExpenseId}
                      value={header.omExpenseId}
                      className="border rounded-lg overflow-hidden"
                    >
                      <AccordionTrigger className={cn('px-4 py-2 hover:no-underline', levelStyles.header)}>
                        <div className="flex items-center gap-2 flex-1">
                          <FileText className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          <span className="font-medium">
                            <HighlightText text={header.omExpenseName} searchTerm={searchTerm} />
                          </span>
                          <span className="text-sm text-muted-foreground ml-2">
                            ({header.headerTotal.itemCount} items)
                          </span>
                          <span className="ml-auto mr-4 font-medium">
                            {formatCurrency(header.headerTotal.currentYearBudget)}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-0">
                        <div className="pl-4 space-y-2 py-2">
                          {/* 第3層：OpCo (橙色) - FIX: 統一使用 Accordion 確保所有 OpCo 都有展開/收合功能 */}
                          <Accordion
                            type="multiple"
                            defaultValue={header.opCoGroups.map((o) => o.opCoId)}
                            className="space-y-2"
                          >
                            {header.opCoGroups.map((opCoGroup) => (
                              <AccordionItem
                                key={opCoGroup.opCoId}
                                value={opCoGroup.opCoId}
                                className="border rounded-lg overflow-hidden"
                              >
                                <AccordionTrigger className={cn('px-4 py-2 hover:no-underline', levelStyles.opCo)}>
                                  <div className="flex items-center gap-2 flex-1">
                                    <Building2 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                    <span className="font-medium">{opCoGroup.opCoName}</span>
                                    <span className="text-sm text-muted-foreground ml-2">
                                      ({opCoGroup.items.length} items)
                                    </span>
                                    <span className="ml-auto mr-4 font-medium">
                                      {formatCurrency(opCoGroup.subTotal.currentYearBudget)}
                                    </span>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-0">
                                  {/* 第4層：Item (粉色) */}
                                  <ItemTableNew
                                    items={opCoGroup.items}
                                    subTotal={opCoGroup.subTotal}
                                    currentBudgetHeader={currentBudgetHeader}
                                    previousActualHeader={previousActualHeader}
                                    t={t}
                                    onItemClick={onItemClick}
                                    searchTerm={searchTerm}
                                    levelStyle={levelStyles.item}
                                  />
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                {/* Category 總計 */}
                <div className="mt-4 border-t pt-4">
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
                      <TableRow className="bg-blue-200/50 dark:bg-blue-800/30 hover:bg-blue-200/70 dark:hover:bg-blue-800/40">
                        <TableCell></TableCell>
                        <TableCell className="font-bold text-blue-700 dark:text-blue-300">
                          {t('detailGrid.categoryTotal')} ({categoryGroup.categoryTotal.itemCount} items)
                        </TableCell>
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
  searchTerm,
}: {
  headers: OMExpenseHeaderGroup[];
  currentBudgetHeader: string;
  previousActualHeader: string;
  t: ReturnType<typeof useTranslations<'omSummary'>>;
  onItemClick?: (item: ItemDetail) => void;
  searchTerm?: string;
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
                  <span className="font-medium">
                    <HighlightText text={header.omExpenseName} searchTerm={searchTerm} />
                  </span>
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
                            <div className="font-medium">
                              <HighlightText text={item.name} searchTerm={searchTerm} />
                            </div>
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
 * CHANGE-031: 新版項目表格組件
 * 支援層級樣式和 CHANGE-031 的新結構
 */
function ItemTableNew({
  items,
  subTotal,
  currentBudgetHeader,
  previousActualHeader,
  t,
  onItemClick,
  searchTerm,
  levelStyle,
}: {
  items: ItemDetail[];
  subTotal: {
    currentYearBudget: number;
    previousYearActual: number;
    changePercent: number | null;
  };
  currentBudgetHeader: string;
  previousActualHeader: string;
  t: ReturnType<typeof useTranslations<'omSummary'>>;
  onItemClick?: (item: ItemDetail) => void;
  searchTerm?: string;
  levelStyle?: string;
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
              levelStyle,
              isClickable && 'cursor-pointer hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors'
            )}
            onClick={isClickable ? () => onItemClick(item) : undefined}
          >
            <TableCell className="text-muted-foreground">{index + 1}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="font-medium">
                    <HighlightText text={item.name} searchTerm={searchTerm} />
                  </div>
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
        {/* FIX: Subtotal 背景色改為 #e5e7eb (gray-200) */}
        <TableRow className="bg-gray-200 dark:bg-gray-700">
          <TableCell colSpan={2} className="font-semibold text-gray-700 dark:text-gray-300">
            {t('detailGrid.subTotal')}
          </TableCell>
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

/**
 * 項目表格內部組件（舊版，保留兼容性）
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
  searchTerm,
}: {
  items: ItemDetail[];
  subTotal: OpCoSubTotal;
  currentBudgetHeader: string;
  previousActualHeader: string;
  t: ReturnType<typeof useTranslations<'omSummary'>>;
  onItemClick?: (item: ItemDetail) => void;
  searchTerm?: string;
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
                  <div className="font-medium">
                    <HighlightText text={item.name} searchTerm={searchTerm} />
                  </div>
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
