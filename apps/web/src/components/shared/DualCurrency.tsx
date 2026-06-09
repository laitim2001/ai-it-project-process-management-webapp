/**
 * @fileoverview Dual Currency Display - 雙幣別顯示組件（CHANGE-042）
 * @component DualCurrency
 *
 * @description
 * 顯示「USD 主值 + （≈ 換算後次要幣別）」。系統金額一律以 USD 儲存，主值即為 USD；
 * 次值依傳入幣別的匯率換算（1 USD = currency.exchangeRate 個該幣別）。
 * 當幣別缺失、幣別即 USD、或無有效匯率時，僅顯示 USD（優雅降級，不報錯）。
 *
 * @example
 * <DualCurrency amountUSD={500000} currency={{ code: 'HKD', symbol: 'HK$', exchangeRate: 7.8 }} />
 * // → US$500,000 (≈ HK$3,900,000)
 * <DualCurrency amountUSD={500000} currency={{ code: 'USD', symbol: '$' }} />
 * // → US$500,000
 *
 * @related
 * - apps/web/src/lib/currency.ts - convertFromUSD / formatUSD / formatSecondary
 *
 * @since CHANGE-042 - OM Expense 雙幣別顯示
 */

import { cn } from '@/lib/utils';
import {
  convertFromUSD,
  formatUSD,
  formatSecondary,
  type CurrencyInfo,
} from '@/lib/currency';

export interface DualCurrencyProps {
  /** 以 USD 計的金額（系統儲存值） */
  amountUSD: number;
  /** 次要顯示幣別（含匯率）；缺失或無匯率時只顯示 USD */
  currency?: CurrencyInfo | null;
  /** 外層樣式（套在 USD 主值上） */
  className?: string;
  /** 次值樣式（預設 muted） */
  secondaryClassName?: string;
  /**
   * CHANGE-048: 直式堆疊——USD 主值一行、次幣別換算另起一行。
   * 用於窄欄位（如月度卡片）避免單行 `whitespace-nowrap` 撐爆容器造成重疊。
   */
  stacked?: boolean;
}

export function DualCurrency({
  amountUSD,
  currency,
  className,
  secondaryClassName,
  stacked = false,
}: DualCurrencyProps) {
  const converted = convertFromUSD(amountUSD, currency);
  const hasSecondary = converted !== null && currency;

  if (stacked) {
    return (
      <span className={cn('flex flex-col leading-tight', className)}>
        <span>{formatUSD(amountUSD)}</span>
        {hasSecondary && (
          <span className={cn('text-xs font-normal text-muted-foreground', secondaryClassName)}>
            ≈ {formatSecondary(converted, currency)}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className={cn('whitespace-nowrap', className)}>
      {formatUSD(amountUSD)}
      {hasSecondary && (
        <span className={cn('ml-1 text-muted-foreground', secondaryClassName)}>
          (≈ {formatSecondary(converted, currency)})
        </span>
      )}
    </span>
  );
}
