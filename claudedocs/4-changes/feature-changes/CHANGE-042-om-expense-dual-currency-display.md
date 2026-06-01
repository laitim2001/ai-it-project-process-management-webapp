# CHANGE-042: OM Expense 雙幣別顯示（USD 主值 + 依 currencyId 換算次值）

> **建立日期**: 2026-06-01
> **完成日期**: —
> **狀態**: 📋 設計中
> **優先級**: Medium
> **類型**: 現有功能增強 + Bug 修復（取代 CHANGE-037 的硬編碼做法）
> **前置依賴**: 無（但實作前需 Admin 在 `/settings/currencies` 填妥各幣別 `exchangeRate`）

---

## 1. 變更概述

OM Expense 詳情頁目前同一畫面出現**三種幣別不一致**：
- 下拉選單顯示明細真實幣別為 **TWD 500,000**（資料庫 `OMExpenseItem.currencyId`）
- 「Budget Overview」區塊硬編碼顯示 **US$500,000**
- 「Line Items / Monthly Records」區塊硬編碼顯示 **HK$500,000**、欄頭硬編碼「實際支出 (HKD)」

**根因**：`CHANGE-037`（2025-01-02）將 OM 金額由 HK$ 改為硬編碼 US$，但**只改了 3 個檔案**，遺漏 `OMExpenseItemMonthlyGrid.tsx`，使其保留舊的 HKD 硬編碼。兩處硬編碼互不相干，且都**不讀取**明細真實的 `currencyId`。

**本次變更**：將「硬編碼幣別」改為**正確的雙幣別顯示**：
- **主值**：USD（系統記帳幣別，金額即以 USD 儲存）
- **次值**：依該明細 `currencyId` 用匯率換算（如 `≈ HK$…`）

**變更前**：`US$500,000`（Budget Overview）／`HK$500,000`（月度網格）— 兩者皆與真實幣別 TWD 無關
**變更後**：`US$500,000 (≈ NT$15,500,000)` — 主值 USD，次值依明細 `currencyId` 換算

---

## 2. 功能需求

| ID | 需求 | 說明 |
|---|---|---|
| R1 | 金額以 USD 為主值顯示 | 沿用「USD 為記帳幣別」決策（D1）；資料庫金額即視為 USD |
| R2 | 次值依明細 `currencyId` 換算 | 每個 `OMExpenseItem` 的金額，依其 `currencyId` 換算為次要幣別顯示（D2） |
| R3 | 換算重用既有貨幣模組 | 使用 `Currency.exchangeRate`（`/settings/currencies` 維護），**不新增貨幣模組**（D3） |
| R4 | 匯率語意統一 | 定義 **1 USD = `exchangeRate` × 該幣別**；USD 自身 rate 視為 1 |
| R5 | 次值顯示樣式 | `US$500,000 (≈ HK$3,900,000)`（D4） |
| R6 | 優雅降級 | 明細無 `currencyId`、或該幣別未設 `exchangeRate`、或 `currencyId` 即 USD → **只顯示 USD**，不顯示括號、不報錯 |
| R7 | 彙總列處理 | Budget Overview 的**跨明細總計**：若所有明細同一 `currencyId` 才顯示次值，否則只顯示 USD（避免把不同幣別的換算值混加） |
| R8 | 補齊遺漏檔案 | 修正 CHANGE-037 漏改的 `OMExpenseItemMonthlyGrid.tsx`，並移除其「(HKD)」欄頭硬編碼 |

---

## 3. 技術設計

### 3.1 不需改 Schema
`OMExpenseItem.currencyId`（FK→Currency）已存在；`Currency.exchangeRate` 已存在。本變更**純前端 + 一個共用 helper**，無 Prisma migration。

### 3.2 新增換算 helper（共用）

`apps/web/src/lib/currency.ts`（新檔）：

```typescript
// 匯率語意：1 USD = currency.exchangeRate 個該幣別
export function convertFromUSD(
  amountUSD: number,
  currency?: { code: string; exchangeRate?: number | null } | null
): number | null {
  if (!currency) return null;
  if (currency.code === 'USD') return null;            // 與主值相同，免顯示
  if (!currency.exchangeRate || currency.exchangeRate <= 0) return null; // 缺匯率 → 降級
  return amountUSD * currency.exchangeRate;
}
```

### 3.3 雙幣別顯示組件（擴充既有 `CurrencyDisplay`）

新增包裝組件（或在 `CurrencyDisplay` 加 prop），輸出「主值 + (≈ 次值)」：

```tsx
// 主值固定 USD，次值依 itemCurrency 換算；次值為 null 時只顯示主值
<DualCurrency amountUSD={item.budgetAmount} itemCurrency={item.currency} />
// → "US$500,000 (≈ HK$3,900,000)" 或 "US$500,000"
```

> 主值統一用 `US$` 前綴 + 千分位（沿用既有格式）；次值用 `CurrencyDisplay` 的 symbol + 千分位。「≈」與括號文字走 i18n（避免硬編碼）。

### 3.4 移除硬編碼、改用組件的位置

| 檔案 | 現況（硬編碼） | 改為 |
|---|---|---|
| `apps/web/src/app/[locale]/om-expenses/[id]/page.tsx:206-213` | `formatCurrency` 硬編碼 `US$` | Budget Overview 用 `DualCurrency`（彙總列依 R7） |
| `apps/web/src/components/om-expense/OMExpenseItemMonthlyGrid.tsx:158-166` | `formatCurrency` 硬編碼 `HKD` | 用 `DualCurrency`（每列依該明細 currencyId） |
| `apps/web/src/components/om-expense/OMExpenseItemMonthlyGrid.tsx:288` | 欄頭 `'實際支出 (HKD)'` 硬編碼 | i18n key，動態帶該明細幣別代碼或移除幣別後綴 |
| `apps/web/src/components/om-expense/OMExpenseItemList.tsx`（CHANGE-037 改過的 `formatCurrency`） | 硬編碼 `US$` | 用 `DualCurrency`（每列依 currencyId） |
| `apps/web/src/app/[locale]/om-expenses/page.tsx`（列表頁，CHANGE-037 改過） | 硬編碼 `US$` | 列表彙總依 R7（多半只顯示 USD） |

### 3.5 資料前置（上線前）
- Admin 於 `/settings/currencies` 為 OM 會用到的幣別（至少 HKD，視資料亦含 TWD）填 `exchangeRate`，依 R4 語意（1 USD = rate × 該幣）。
- 上線前驗一次既有 `exchangeRate` 數值方向是否符合 R4（目前 schema 註解僅寫「對基準貨幣」，語意未定，需校正）。

---

## 4. 影響範圍

- **Schema**: 無
- **API**: 可能需小幅調整（`currency.getAll/getActive` 已回傳 `exchangeRate`；但須**確認 OM 查詢有 `include` 明細的 `currency`，若無則補 `include`** — 此為次值換算的前提）
- **前端頁面**: `om-expenses/page.tsx`、`om-expenses/[id]/page.tsx`
- **組件**: `OMExpenseItemMonthlyGrid.tsx`、`OMExpenseItemList.tsx`、新增 `lib/currency.ts` + 雙幣別顯示組件（建議放 `components/shared/`）
- **i18n**: 新增「≈」/ 約等於 與月度欄頭的 key（`en.json` + `zh-TW.json` 同步）
- **資料**: `/settings/currencies` 的 `exchangeRate` 需填妥

---

## 5. 驗收標準

- [ ] OM 明細 `currencyId=HKD` 且已設匯率 → 顯示 `US$X (≈ HK$Y)`，Y = X × rate
- [ ] 明細 `currencyId=TWD`（截圖情境）→ 顯示 `US$X (≈ NT$Y)`，不再出現無關的 HK$
- [ ] 明細無 currencyId / 幣別無匯率 / currencyId=USD → 只顯示 `US$X`，無括號、無錯誤
- [ ] 月度網格（`OMExpenseItemMonthlyGrid`）金額與欄頭不再出現硬編碼 HKD
- [ ] Budget Overview 跨明細總計：同幣別才顯示次值，混幣別只顯示 USD（不錯加）
- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm validate:i18n` 通過

---

## 6. 實施計劃

1. 新增 `lib/currency.ts` 的 `convertFromUSD` → 驗證：typecheck 通過
2. 新增/擴充雙幣別顯示組件 → 驗證：typecheck 通過
3. 替換 4~5 處硬編碼 `formatCurrency` → 驗證：瀏覽器逐頁目視（HKD/TWD/無匯率 三情境）
4. 月度欄頭 i18n 化 → 驗證：`pnpm validate:i18n`
5. 確認 OM 查詢 include 明細 `currency`（缺則補）→ 驗證：次值能正確換算

---

## 7. 相關文檔

- 取代：`CHANGE-037`（OM 幣別 HK$→US$ 硬編碼，本變更改為幣別感知的雙幣別顯示）
- 批次總覽：`1-planning/roadmap/2026-06-expense-approval-batch.md`（決策 D1~D4）
- 重用方：`FEAT-015`（Project Expense 將沿用本變更的換算 helper 與顯示組件）
- 既有資產：`components/shared/CurrencyDisplay.tsx`、`routers/currency.ts`、`settings/currencies/page.tsx`
