# CHANGE-053: OM Expense / Project Expense 月度記錄改用財年（Fiscal Year）顯示順序

> **狀態**: ✅ 已實作並通過驗證（typecheck + lint + 瀏覽器 runtime；OM 與 Project 兩個網格皆已實測）
> **建立日期**: 2026-06-25
> **類型**: CHANGE（純前端顯示層調整，不動資料、不需 migration）
> **觸發頁面**: `/[locale]/om-expenses/[id]`（monthly records 區塊）

## 概述

OM Expense 與 Project Expense 的月度記錄網格目前以**曆年順序**顯示（一月 → 十二月）。但公司採**財年（Fiscal Year）**，自 **4 月起算、至隔年 3 月結束**（例：FY26 = 2026 年 4 月 – 2027 年 3 月）。本變更將月度網格的**顯示順序**改為財年順序（4 月開頭、隔年 3 月結尾），並移除月份序號、為跨年的後三個月加註年份。

## 根本問題分析（為何是「重新排序」而非「轉 label」）

- `OMExpenseMonthly.month` / `ProjectExpenseMonthly.month` 的語意為**曆月**（schema 註明 `1 = January … 12 = December`）。
- 月度金額**僅能透過月度網格手動輸入**（FEAT-008 Excel 匯入**不**帶月份資料）。使用者在標示「四月」的列輸入的金額即儲存為 `month = 4`。
- 因此**每一列的月份名稱與其底層資料早已對齊**，目前畫面只是單純按 1→12 排序。
- ✅ 正確做法：把 12 列的**渲染順序**改為 `[4,5,6,7,8,9,10,11,12,1,2,3]`，月份名稱維持不變。
- ❌ 錯誤做法（要避免）：把第一列的「一月」直接改寫成「四月」、底下仍是 `month=1` 的資料 → 造成「1 月的金額顯示在 April」，label 與資料不符。

> **結論**：本質是 **reorder（改順序）**，資料完全不動、無需 migration、不影響加總與存檔邏輯。

## 需求（已與使用者確認的決策）

| # | 決策項 | 選擇 |
|---|--------|------|
| 1 | 月份左側圓圈「序號」 | **移除**，只保留月份名稱 |
| 2 | 跨年的後三個月（1/2/3 月，屬隔年） | **加註隔年年份** |
| 3 | 套用範圍 | **OM Expense 月度網格** + **Project Expense 月度網格** |
| 4 | 財年起始月 | **寫死 4 月**（抽成常數，方便日後調整） |

## ⚠️ 待使用者確認的假設

**財年標記慣例**：本設計假設 `financialYear` 儲存的是**財年起始的曆年**，即 `FY{financialYear}` = 「{financialYear} 年 4 月 – {financialYear + 1} 年 3 月」。

- 依據：資料匯入欄位標示「FY26 Budget / FY25 Actual」，且今日為 2026-06（正落在 FY26 = 2026-04 ~ 2027-03 區間內），與此慣例一致。
- 影響：跨年的 **1/2/3 月** 標註的年份為 `financialYear + 1`；4–12 月為 `financialYear`。
- 👉 **若貴司的 FY 標記慣例相反**（FY26 = 2025-04 ~ 2026-03，即以結束年命名），則 1/2/3 月年份應改為 `financialYear`、4–12 月為 `financialYear − 1`。請於 review 時確認。

## 技術設計

### 新增共用小工具 `apps/web/src/lib/fiscal.ts`

兩個網格共用同一份財年邏輯，避免日後分歧：

```typescript
/** 財年起始月（公司財年自 4 月起算）。日後若調整起始月，只改此處。 */
export const FISCAL_START_MONTH = 4;

/** 財年顯示順序：4,5,…,12,1,2,3 */
export const FISCAL_MONTH_ORDER: readonly number[] =
  Array.from({ length: 12 }, (_, i) => ((FISCAL_START_MONTH - 1 + i) % 12) + 1);

/** 取得某曆月在「以 fyStartYear 為起始曆年的財年」中對應的曆年 */
export function calendarYearOfFiscalMonth(month: number, fyStartYear: number): number {
  return month >= FISCAL_START_MONTH ? fyStartYear : fyStartYear + 1;
}
```

### 兩個網格的修改（同樣模式）

1. **新增 prop** `financialYear: number`（財年起始曆年）。
2. **改渲染順序**：tbody 由 `monthlyData.map(...)` 改為遍歷 `FISCAL_MONTH_ORDER`，對每個月份 `find` 出對應 record 後渲染。
   - ⚠️ `monthlyData` **state 結構不變**（仍以 `month` 1–12 為 key）；`totalActual` / `totalBudget` / 存檔 mutation 全部**不動**（與順序無關）。
3. **移除圓圈序號**：刪除 `<span class="...rounded-full...">{record.month}</span>`，僅留月份名稱。
4. **加註隔年**：對 `month < FISCAL_START_MONTH`（即 1/2/3 月）的列，在月份名稱後以 muted 樣式附上 `calendarYearOfFiscalMonth(month, financialYear)`（純數字，無需新增 i18n key）。

### 傳參路徑

| 頁面 | 現況 | 調整 |
|------|------|------|
| `om-expenses/[id]/page.tsx` | 已有 `omExpense.financialYear` | `<OMExpenseItemMonthlyGrid ... financialYear={omExpense.financialYear} />` |
| `projects/[id]/page.tsx` | `selectedExpenseItem` 由 header 清單推導（header 有 `financialYear`） | 擴充推導，順帶帶出該 header 的 `financialYear`，傳入 `<ProjectExpenseItemMonthlyGrid ... financialYear={...} />` |

## 影響範圍

- **資料模型 / Migration**: 無
- **API**: 無
- **頁面**: `apps/web/src/app/[locale]/om-expenses/[id]/page.tsx`、`apps/web/src/app/[locale]/projects/[id]/page.tsx`
- **組件**: `OMExpenseItemMonthlyGrid.tsx`、`ProjectExpenseItemMonthlyGrid.tsx`
- **新增檔案**: `apps/web/src/lib/fiscal.ts`
- **i18n**: 無新增 key（年份為純數字）

## 不在本次範圍（Out of Scope）

- **OM Summary 報表**：無 Jan–Dec 逐月列，不受影響。
- **OM 與 Project 月份 i18n 不一致**（OM 英文用全名「January」、Project 用縮寫「Jan」）：既有差異，非本次處理。
- **財年起始月可設定化**：本次寫死 4 月（已抽常數）。

## 實作步驟與驗證

```
1. 新增 lib/fiscal.ts（常數 + 純函式）
   → 驗證：pnpm typecheck 通過
2. 改 OMExpenseItemMonthlyGrid（加 prop、reorder、移序號、加隔年）
   → 驗證：pnpm typecheck 通過
3. 改 ProjectExpenseItemMonthlyGrid（同上）
   → 驗證：pnpm typecheck 通過
4. 兩頁面傳入 financialYear
   → 驗證：pnpm typecheck + next lint --file（僅改動檔）
5. 瀏覽器手測
   → /en/om-expenses/8404ef72-... monthly tab：順序為 Apr→Mar、無序號、Jan/Feb/Mar 顯示隔年
   → 專案詳情頁「專案費用」tab 選明細：右欄月度網格同樣行為
   → 輸入金額存檔，確認總額與使用率與改動前一致（順序不影響計算）
```

## 驗證清單

- [x] 月度網格顯示順序為 4 月 → 隔年 3 月（OM：April→March；Project：Apr→Mar）
- [x] 月份左側不再有序號圓圈
- [x] 1/2/3 月顯示 `financialYear + 1` 的年份（FY2026 → Jan/Feb/Mar 標 2027；慣例已確認）
- [x] 各月金額仍對應正確月份（OM 測試項 1 月 12.82 USD / 100 HKD 仍在 January 列，未錯位）
- [x] 年度總額、使用率與改動前一致（OM Total 仍為 US$13）
- [x] OM 與 Project 兩個網格行為一致
- [x] `pnpm typecheck` 通過；改動檔 `next lint` 0 errors（僅既有 baseline warnings）

## 相關文件

- `apps/web/src/components/om-expense/CLAUDE.md` — FEAT-007 三層架構
- `docs/codebase-analyze/05-database/model-detail.md` — OMExpenseMonthly / ProjectExpenseMonthly
- 前置變更：CHANGE-048/049/050（OM 月度雙幣別）、FEAT-015（Project Expense 月度模組）
