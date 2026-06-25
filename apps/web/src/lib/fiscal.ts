/**
 * @fileoverview Fiscal Year 工具 - 財年顯示順序與年份換算
 * @module lib/fiscal
 *
 * @description
 * 公司財年自 4 月起算、至隔年 3 月結束（例：FY26 = 2026-04 ~ 2027-03）。
 * 月度資料的 `month` 仍為曆月（1=Jan…12=Dec），本工具僅處理「顯示順序」與
 * 「跨年月份對應的曆年」，不影響任何資料儲存或加總邏輯。
 *
 * @related
 * - apps/web/src/components/om-expense/OMExpenseItemMonthlyGrid.tsx
 * - apps/web/src/components/project-expense/ProjectExpenseItemMonthlyGrid.tsx
 */

/** 財年起始月（公司財年自 4 月起算）。日後若調整起始月，只改此處。 */
export const FISCAL_START_MONTH = 4;

/** 財年顯示順序：[4,5,…,12,1,2,3]（曆月值，非序號） */
export const FISCAL_MONTH_ORDER: readonly number[] = Array.from(
  { length: 12 },
  (_, i) => ((FISCAL_START_MONTH - 1 + i) % 12) + 1
);

/**
 * 取得某曆月在「以 fyStartYear 為起始曆年的財年」中對應的曆年。
 * 例：FISCAL_START_MONTH=4、fyStartYear=2026 時，4–12 月為 2026、1–3 月為 2027。
 */
export function calendarYearOfFiscalMonth(month: number, fyStartYear: number): number {
  return month >= FISCAL_START_MONTH ? fyStartYear : fyStartYear + 1;
}
