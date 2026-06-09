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

// ============================================================
// CHANGE-045: 輸入幣別換算（OM 明細以選定幣別輸入、存檔換算為 USD）
// ============================================================

/** 取得可用於換算的匯率；USD 自身、無幣別、或無有效匯率時回傳 null（呼叫端視為不換算） */
function entryRate(currency?: CurrencyInfo | null): number | null {
  if (!currency || currency.code === 'USD') return null;
  if (!currency.exchangeRate || currency.exchangeRate <= 0) return null;
  return currency.exchangeRate;
}

/**
 * 將「以某幣別計」的金額換算為 USD（存檔用）。
 * 匯率語意：1 USD = `exchangeRate` 個該幣別 → USD = 金額 ÷ exchangeRate。
 * 無有效匯率（USD/未設匯率）時，原值視為 USD 直接回傳。
 */
export function toUSD(amountInCurrency: number, currency?: CurrencyInfo | null): number {
  const rate = entryRate(currency);
  return rate ? amountInCurrency / rate : amountInCurrency;
}

/**
 * 將 USD 金額換算為某幣別（編輯載入時顯示用），四捨五入至 2 位小數。
 * 無有效匯率時，原值（USD）直接回傳。
 */
export function fromUSD(amountUSD: number, currency?: CurrencyInfo | null): number {
  const converted = convertFromUSD(amountUSD, currency);
  return converted === null ? amountUSD : Math.round(converted * 100) / 100;
}

/**
 * 建立「固定 HKD」顯示用的幣別資訊（供 OM 各處統一顯示 USD 主值 + ≈ HK$ 次值）。
 * @param rate HKD 匯率（1 USD = rate HKD）；無有效匯率時回傳 null（次值優雅降級不顯示）
 */
export function hkdCurrencyInfo(rate?: number | null): CurrencyInfo | null {
  return rate && rate > 0 ? { code: 'HKD', symbol: 'HK$', exchangeRate: rate } : null;
}
