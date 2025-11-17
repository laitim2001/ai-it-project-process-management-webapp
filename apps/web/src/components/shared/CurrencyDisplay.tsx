/**
 * @fileoverview Currency Display Component - 貨幣金額顯示組件
 *
 * @description
 * 統一的貨幣金額顯示組件，支援多種顯示模式和格式化選項。
 * 用於在整個應用中一致地顯示帶有貨幣符號和代碼的金額。
 *
 * @features
 * - 支援顯示貨幣符號、代碼和名稱
 * - 千分位格式化
 * - 自動小數點處理
 * - 支援自定義樣式
 * - 響應式設計
 *
 * @module components/shared/CurrencyDisplay
 *
 * @example
 * // 基本用法
 * <CurrencyDisplay
 *   amount={1000000}
 *   currency={{ code: 'TWD', symbol: 'NT$', name: '新台幣' }}
 * />
 * // 輸出: NT$ 1,000,000 TWD
 *
 * @example
 * // 只顯示符號
 * <CurrencyDisplay
 *   amount={1500}
 *   currency={{ code: 'USD', symbol: '$' }}
 *   showCode={false}
 * />
 * // 輸出: $ 1,500
 *
 * @related
 * - apps/web/src/components/shared/CurrencySelect.tsx - 貨幣選擇組件
 * - packages/api/src/routers/budgetPool.ts - BudgetPool API
 * - packages/api/src/routers/project.ts - Project API
 *
 * @since FEAT-001 - Project Fields Enhancement
 * @lastModified 2025-11-17 (FEAT-002)
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface CurrencyDisplayProps {
  /** 金額 */
  amount: number;
  /** 貨幣資訊 */
  currency?: {
    code: string;  // ISO 4217 貨幣代碼（如: TWD, USD）
    symbol: string; // 貨幣符號（如: NT$, $）
    name?: string;  // 貨幣名稱（如: 新台幣）
  };
  /** 是否顯示貨幣符號（預設: true） */
  showSymbol?: boolean;
  /** 是否顯示貨幣代碼（預設: true） */
  showCode?: boolean;
  /** 是否顯示貨幣名稱（預設: false） */
  showName?: boolean;
  /** 自定義 CSS 類名 */
  className?: string;
  /** 數字格式化選項 */
  formatOptions?: Intl.NumberFormatOptions;
}

/**
 * 貨幣金額顯示組件
 *
 * 統一格式化並顯示金額，支援多種貨幣和顯示選項。
 * 預設顯示格式: 符號 + 金額 + 代碼（如: NT$ 1,000,000 TWD）
 */
export function CurrencyDisplay({
  amount,
  currency,
  showSymbol = true,
  showCode = true,
  showName = false,
  className,
  formatOptions,
}: CurrencyDisplayProps) {
  // 格式化金額（千分位）
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...formatOptions,
  }).format(amount);

  // 如果沒有貨幣資訊，只顯示金額
  if (!currency) {
    return <span className={cn('font-mono', className)}>{formattedAmount}</span>;
  }

  // 構建顯示字串
  const parts: string[] = [];

  if (showSymbol && currency.symbol) {
    parts.push(currency.symbol);
  }

  parts.push(formattedAmount);

  if (showCode && currency.code) {
    parts.push(currency.code);
  }

  if (showName && currency.name) {
    parts.push(`(${currency.name})`);
  }

  return (
    <span className={cn('font-mono whitespace-nowrap', className)}>
      {parts.join(' ')}
    </span>
  );
}

/**
 * 簡化版貨幣顯示組件（只顯示符號 + 金額）
 *
 * @example
 * <CurrencyDisplayCompact amount={1500} currency={{ symbol: '$' }} />
 * // 輸出: $1,500
 */
export function CurrencyDisplayCompact({
  amount,
  currency,
  className,
  formatOptions,
}: Omit<CurrencyDisplayProps, 'showSymbol' | 'showCode' | 'showName'>) {
  return (
    <CurrencyDisplay
      amount={amount}
      currency={currency}
      showSymbol={true}
      showCode={false}
      showName={false}
      className={className}
      formatOptions={formatOptions}
    />
  );
}

/**
 * 完整版貨幣顯示組件（符號 + 金額 + 代碼 + 名稱）
 *
 * @example
 * <CurrencyDisplayFull amount={1000} currency={{ code: 'TWD', symbol: 'NT$', name: '新台幣' }} />
 * // 輸出: NT$ 1,000 TWD (新台幣)
 */
export function CurrencyDisplayFull({
  amount,
  currency,
  className,
  formatOptions,
}: Omit<CurrencyDisplayProps, 'showSymbol' | 'showCode' | 'showName'>) {
  return (
    <CurrencyDisplay
      amount={amount}
      currency={currency}
      showSymbol={true}
      showCode={true}
      showName={true}
      className={className}
      formatOptions={formatOptions}
    />
  );
}
