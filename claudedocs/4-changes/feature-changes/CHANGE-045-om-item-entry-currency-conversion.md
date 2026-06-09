# CHANGE-045: OM 明細以選定幣別輸入、存檔換算為 USD + 顯示固定 USD/HKD

> **建立日期**: 2026-06-03
> **完成日期**: 2026-06-03
> **狀態**: ✅ 已完成（純前端；待手測）
> **優先級**: High（修正 CHANGE-042 遺留的金額語意矛盾）
> **類型**: 現有功能增強 + Bug 修復（延續 CHANGE-042 / CHANGE-044）
> **前置依賴**: CHANGE-042（`lib/currency.ts`、`DualCurrency`）、CHANGE-044（月度 HKD、`hkdRate` 取得）；Admin 已於 `/settings/currencies` 填 HKD `exchangeRate`
> **⚠️ 流程償還註記**: 本文件為**實作後補寫**，偏離 doc-first 流程（規劃文件應先於實作、經 review 核准）。後續 FEAT/CHANGE/FIX 一律「先文件 → review → 核准 → 實作」，見 `CLAUDE.md`「協作行為邊界 → 規劃文件先行」。

---

## 1. 變更概述

OM 明細的 **Edit Item 表單** 對「金額 + 幣別」的處理與「儲存 / 顯示」層互相矛盾：

| 層 | 對「輸入 500,000 + 幣別 HKD」的解讀 | 結果 |
|----|--------------------------------------|------|
| **Edit 表單**（FEAT-007） | 欄位說明「指定此項目使用的幣別」→ 暗示 **500,000 是 HKD**（HK$500,000） | 使用者以為輸入了 HK$500,000 |
| **儲存 + 顯示**（CHANGE-042） | `budgetAmount`(500,000) 一律當 **USD**，`currencyId` 僅作次要換算 | 顯示 `US$500,000 (≈ HK$3,900,000)` |

`OMExpenseItemForm.onSubmit` **完全沒有換算**——`budgetAmount` 與 `currencyId` 各自獨立儲存。於是使用者輸入 HK$500,000，外部卻顯示「US$500,000」+「≈HK$3.9M」，兩者都不是預期值。

**本次變更**（使用者拍板方向）：
- **Edit Item**：可選幣別 + 輸入金額；**存檔時依該幣別匯率把輸入金額換算為 USD 儲存**（HK$500,000 ÷ 7.8 = US$64,103）。
- **顯示**（item list / monthly / detail）：一律**固定顯示 USD（主）+ HKD（次）**，不再跟隨各 item 幣別。

**變更前**：輸入 HK$500,000 → 顯示 `US$500,000 (≈ HK$3,900,000)`（錯）
**變更後**：輸入 HK$500,000 → 儲存 US$64,103 → 顯示 `US$64,103 (≈ HK$500,000)`（與輸入一致）

---

## 2. 設計決策（討論後拍板）

| 決策 | 結果 |
|---|---|
| **D1 金額語意** | 輸入金額視為「所選幣別」，存檔換算為 USD（系統主帳幣別不變） |
| **D2 顯示幣別** | 固定 USD + HKD（item list / monthly / detail 一致），取代 CHANGE-042「次值跟隨各 item 幣別」 |
| **D3 換算位置** | 放前端表單（輸入正規化）：不改 API 合約、不需 migration；與 CHANGE-044 前端換算一致；載入方向本就需在表單做，故save/load 對稱 |
| **D4 幣別切換** | 編輯中切換幣別，已輸入的「數字不變」、僅重算 USD 預覽（不偷改使用者數字） |
| **D5 既有資料** | 不自動轉換；重新編輯該 item 即修正（見 §7.2） |

> **關鍵前提（沿用 D1@CHANGE-042）**：USD 仍為系統主帳幣別；`budgetAmount` 一律以 USD 儲存，所有彙總（表頭 / OM Summary / 使用率）維持 USD。`currencyId` 改為「**輸入金額所用幣別**」的語意。

---

## 3. 功能需求

| ID | 需求 | 說明 |
|---|---|---|
| R1 | 以選定幣別輸入金額 | Edit Item 的金額（budget + lastFY）視為「所選幣別」的數值 |
| R2 | 存檔換算為 USD | `USD = 輸入金額 ÷ exchangeRate`（1 USD = rate × 該幣）；USD/無匯率時不換算 |
| R3 | 編輯載入換回幣別 | 載入時 `所選幣別金額 = 儲存USD × exchangeRate`（四捨五入 2 位） |
| R4 | USD 即時預覽 | 金額欄下方顯示 `≈ US$X（將以 USD 儲存）`，僅在會發生換算時顯示 |
| R5 | 顯示固定 USD + HKD | item list / detail / monthly 次值一律 HKD（取 HKD 匯率），不跟隨 item 幣別 |
| R6 | 不動 USD 彙總 | item/表頭 `actualSpent`、使用率、Summary 仍以 USD 計算 |
| R7 | 優雅降級 | 無 HKD 匯率時次值不顯示；無選幣別/選 USD 時輸入即 USD（不換算） |

---

## 4. 技術設計

### 4.1 共用 helper（`lib/currency.ts`，新增 3 個）
```typescript
// 1 USD = exchangeRate × 該幣；USD/無匯率時視為不換算
export function toUSD(amountInCurrency, currency): number   // 存檔：金額 ÷ rate
export function fromUSD(amountUSD, currency): number         // 載入：USD × rate（round2）
export function hkdCurrencyInfo(rate): CurrencyInfo | null   // 固定 HKD 顯示用 { code:'HKD', symbol:'HK$', exchangeRate:rate }
```

### 4.2 表單（`OMExpenseItemForm.tsx`）
- 由 `currencies`（`currency.getAll`）+ 監看的 `currencyId` 推得 `selectedCurrency`、`conversionActive`。
- **載入**（edit reset effect，deps 加 `currencies`）：`budgetAmount`/`lastFYActualExpense` 以 `fromUSD(storedUSD, loadCurrency)` 換回幣別顯示；以 `initialData` 原值為源，匯率較晚載入時重算 → 冪等。
- **存檔**（onSubmit）：`budgetAmount = toUSD(data.budgetAmount, submitCurrency)`；`lastFYActualExpense` 同。
- **預覽**：budget/lastFY 下方 `≈ US$X` FormDescription（`conversionActive` 時顯示）。
- 幣別欄說明改為「輸入金額所用幣別、存檔換算 USD（顯示一律 USD+HKD）」。

### 4.3 顯示固定 HKD
- `om-expenses/[id]/page.tsx`：Budget Overview 由 `sharedCurrency`（CHANGE-042）→ `hkdCurrencyInfo(hkdRate)`；移除孤兒 `sharedCurrency` memo；傳 `hkdRate` 給 list。
- `OMExpenseItemList.tsx`：新增 `hkdRate` prop；每列 + 總計次值改 `hkdCurrencyInfo(hkdRate)`（取代 `item.currency` / `sharedCurrency`）。
- `OMExpenseItemMonthlyGrid.tsx`：上方概覽卡片次值由 `item.currency` → `hkdCurrencyInfo(effectiveHkdRate)`。

### 4.4 不需改的部分
- **Schema / Migration**：無（`budgetAmount` 仍 USD、`currencyId` 已存在）。
- **API**：無（`addItem`/`updateItem` 合約不變，收到的 `budgetAmount` 已是換算後 USD）。

---

## 5. 影響範圍

- **前端組件**: `OMExpenseItemForm.tsx`、`OMExpenseItemList.tsx`、`OMExpenseItemMonthlyGrid.tsx`
- **前端頁面**: `om-expenses/[id]/page.tsx`
- **工具**: `lib/currency.ts`（+3 export）
- **i18n**: `omExpenses.itemFields.amountUsdPreview`（新）、`omExpenses.itemFields.currency.description`（改值）
- **未受影響**: Schema、API、OM Summary（仍讀 USD）、CHANGE-044 月度欄

---

## 6. 驗收標準

- [x] `pnpm typecheck`（api+web）全綠
- [x] `pnpm validate:i18n` 通過（2849 keys 一致）
- [x] 改動檔 `lint` 零新增 error（既有 7 個 baseline error 均在未改動行）
- [ ] 瀏覽器手測：
  - 選 HKD 輸入 500,000 → 存檔 → item list/detail/monthly 顯示 `US$64,103 (≈ HK$500,000)`
  - 編輯該 item → 金額欄顯示 500,000、預覽 ≈US$64,103
  - 切換幣別 → 數字不變、預覽重算
  - 無 HKD 匯率時 → 僅顯示 USD（不報錯）

---

## 7. 實施記錄（2026-06-03）

### 7.1 實際變更檔案
- `apps/web/src/lib/currency.ts` — `toUSD` / `fromUSD` / `hkdCurrencyInfo`
- `apps/web/src/components/om-expense/OMExpenseItemForm.tsx` — 輸入幣別 ↔ USD 換算 + USD 預覽 + 說明
- `apps/web/src/app/[locale]/om-expenses/[id]/page.tsx` — Budget Overview 固定 HKD、移除 `sharedCurrency`、傳 `hkdRate`
- `apps/web/src/components/om-expense/OMExpenseItemList.tsx` — 列 + 總計固定 HKD（`hkdRate` prop）
- `apps/web/src/components/om-expense/OMExpenseItemMonthlyGrid.tsx` — 概覽卡片固定 HKD
- `apps/web/src/messages/{en,zh-TW}.json` — `amountUsdPreview` + `currency.description`

### 7.2 既有資料（須注意）
舊資料的 `budgetAmount` 是在舊模型下存的（如 sample item 的 `500000` 當 USD），**不自動轉換**：
- 列表仍顯示 `US$500,000 (≈ HK$3,900,000)`（值未變）。
- 打開 Edit，金額欄會顯示 `3,900,000`（= US$500,000 換算成 HKD）→ 改成 `500,000` 存檔即修正為 `US$64,103 (≈ HK$500,000)`。

### 7.3 注意事項
- 🟡 **dev server**：本變更純前端，hot-reload 即生效，不需重啟（但 CHANGE-044 的月度 HKD 存檔仍需重啟以載入新 Prisma Client）。
- 🟡 **換算位置在前端**：屬輸入正規化（與 CHANGE-044 一致、載入方向本就需在表單做）；業務彙總邏輯仍在 API/USD。若日後要嚴格遵守「業務邏輯在 API」，可改由 `addItem`/`updateItem` 內換算（須同步調整載入方向）。
- 🟡 **編號**：CHANGE-044 已占用 044（OM 月度 HKD），本變更取下一個編號 045。

---

## 8. 相關文檔

- 延續：`CHANGE-042-om-expense-dual-currency-display.md`（雙幣別顯示、`lib/currency.ts`）、`CHANGE-044-om-monthly-dual-currency-input.md`（月度 HKD、`hkdRate`）
- 架構背景：`apps/web/src/components/om-expense/CLAUDE.md`
- 既有資產：`routers/currency.ts`、`settings/currencies/page.tsx`、`components/shared/DualCurrency.tsx`
