/**
 * @fileoverview 貨幣換算與顯示工具 - CHANGE-042
 * @module lib/currency
 *
 * @description
 * 系統以 USD 為記帳幣別，所有金額一律以 USD 儲存。此工具提供「USD → 次要幣別」
 * 的換算，供雙幣別顯示（主值 USD + 約等於次值）使用。
 *
 * 匯率語意（重要）：`Currency.exchangeRate` 定義為「1 USD = exchangeRate 個該幣別」。
 * USD 自身、或幣別未設匯率時，不做換算（次值不顯示）。
 *
 * @related
 * - apps/web/src/components/shared/DualCurrency.tsx - 雙幣別顯示組件
 * - apps/web/src/app/[locale]/settings/currencies/page.tsx - 匯率維護（Admin）
 *
 * @since CHANGE-042 - OM Expense 雙幣別顯示
 */

/** 換算 / 顯示所需的最小貨幣資訊（相容 Prisma Currency） */
export interface CurrencyInfo {
  code: string;
  symbol?: string | null;
  exchangeRate?: number | null;
}

/**
 * 將 USD 金額換算為指定幣別。
 * 匯率語意：1 USD = `currency.exchangeRate` 個該幣別。
 *
 * @returns 換算後金額；若無法換算（無幣別 / 幣別即 USD / 無有效匯率）則回傳 null（呼叫端據此降級為只顯示 USD）
 */
export function convertFromUSD(
  amountUSD: number,
  currency?: CurrencyInfo | null
): number | null {
  if (!currency) return null;
  if (currency.code === 'USD') return null;
  if (!currency.exchangeRate || currency.exchangeRate <= 0) return null;
  return amountUSD * currency.exchangeRate;
}

/** 格式化 USD 主值：US$1,234,567（千分位、無小數） */
export function formatUSD(amount: number): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `US$${formatted}`;
}

/** 格式化次要幣別值：HK$1,234,567（使用該幣別符號，千分位、無小數） */
export function formatSecondary(amount: number, currency: CurrencyInfo): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  const symbol = currency.symbol || `${currency.code} `;
  return `${symbol}${formatted}`;
}
