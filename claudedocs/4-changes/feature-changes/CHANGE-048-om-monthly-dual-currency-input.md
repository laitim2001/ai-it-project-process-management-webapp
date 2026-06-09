# CHANGE-048: OM Monthly 可輸入並持久化的 HKD 金額欄（USD→HKD 自動換算）+ 修月度卡片重疊

> **建立日期**: 2026-06-03
> **完成日期**: 2026-06-03
> **狀態**: ✅ 已完成（程式 + migration；待 dev server 重啟後手測）
> **優先級**: Medium
> **類型**: 現有功能增強（延續 CHANGE-042 雙幣別）+ UI 修復
> **前置依賴**: CHANGE-042（雙幣別顯示、`lib/currency.ts`、`DualCurrency`）；Admin 於 `/settings/currencies` 已填 HKD `exchangeRate`
> **⚠️ 流程償還註記**: 本文件為**實作後補寫**，偏離 doc-first 流程（規劃文件應先於實作、經 review 核准）。後續 FEAT/CHANGE/FIX 一律「先文件 → review → 核准 → 實作」，見 `CLAUDE.md`「協作行為邊界 → 規劃文件先行」。
> **🔢 編號變更（2026-06-09）**: 本變更原號為 **CHANGE-044**（2026-06-03 規劃/實作，OM 月度雙幣輸入）。該批工作（含 045/046）從未合併進 main 且擱置於 git stash；main 於 2026-06-09 另行使用 CHANGE-044（專案詳情頁 Tab 化）。為解撞號，本批 OM 工作統一重配：**044→048、045→049、046→050**。原始碼存於分支 `wip/om-dual-currency-044-046`。

---

## 1. 變更概述

OM Expense 詳情頁的 **Monthly Records** tab 有兩個問題：

1. **上方卡片重疊**：「Item Budget / Actual Spent / Remaining Budget / Utilization Rate」四張卡片用 `md:grid-cols-4`（每格約 250px），但 CHANGE-042 的 `DualCurrency` 以 `whitespace-nowrap` 單行輸出 `US$500,000 (≈ HK$3,900,000)`，過長撐爆窄欄、溢位到隔壁格造成視覺重疊。
2. **只能輸入 USD**：月度只有一個「Actual Spending (USD)」輸入欄。實務上 OM 支出（如 Ricoh Hong Kong）真實幣別是 HKD，使用者希望能直接看到/輸入 HKD。

**本次變更**：
- **修重疊**：`DualCurrency` 新增 `stacked` 變體（USD 一行、次幣別另起一行），月度卡片改用之。
- **新增可輸入 HKD 欄**：月度每月新增「Actual Spending (HKD)」輸入欄，**輸入 USD 時自動以匯率帶入 HKD**；HKD 亦可手動覆寫。HKD **獨立持久化**到新欄位 `OMExpenseMonthly.actualAmountHKD`。

**變更前**：月度單欄 USD；卡片雙幣別單行重疊。
**變更後**：月度雙欄（USD / HKD，USD→HKD 自動換算）；卡片雙幣別直式堆疊不重疊。

---

## 2. 設計決策（討論後拍板）

實作前以兩個提問與使用者對齊：

| 決策 | 選項 | 結果 |
|---|---|---|
| **D1 儲存策略** | (A) 只存 USD、HKD 為換算輔助 / (B) 新增 HKD 欄位持久化 | **(B) 持久化** — 新增 `actualAmountHKD`，HKD 為被釘住的真實收據金額，不受日後匯率調整影響 |
| **D2 第二幣別來源** | (A) 跟隨 item 幣別動態 / (B) 固定 HKD | **(B) 固定 HKD** |
| **D3 連動行為** | 單向 USD→HKD（HKD 可獨立覆寫）/ 雙向 | **單向**：改 USD 自動覆寫 HKD；改 HKD 不回寫 USD；兩者皆存 |

**關鍵前提（沿用 CHANGE-042 / D1）**：USD 仍是系統主帳幣別，`OMExpenseItem.actualSpent`、表頭 `totalActualSpent`、使用率/Summary **全部維持以 USD 計算**。新增的 HKD 為**額外**持久化欄位，**不影響任何既有彙總邏輯**。

---

## 3. 功能需求

| ID | 需求 | 說明 |
|---|---|---|
| R1 | 月度新增可輸入 HKD 欄 | 每月一個 HKD `<Input type="number">`，可編輯 |
| R2 | USD→HKD 自動換算 | 輸入/變更 USD 欄時，以匯率自動帶入（覆寫）HKD 欄；四捨五入至 2 位小數 |
| R3 | HKD 可獨立覆寫 | 手動改 HKD 不回寫 USD（記錄真實收據金額） |
| R4 | HKD 持久化 | 存檔時 USD 與 HKD 各自寫入 DB（`actualAmount` / `actualAmountHKD`） |
| R5 | 既有資料優雅升級 | 既有 `actualAmountHKD=null` 載入時以 `USD × 匯率` 帶入顯示，首次存檔後寫死；無匯率則顯示 0 |
| R6 | 固定 HKD 匯率來源 | 優先取 HKD `Currency.exchangeRate`；抓不到退回 item 幣別（為 HKD 時）的匯率；皆無則停用自動帶入、HKD 欄仍可手填 |
| R7 | 修卡片重疊 | 月度上方 4 卡片改直式堆疊雙幣別，不再單行溢位 |
| R8 | 不動 USD 彙總 | item/表頭 `actualSpent`、使用率仍以 USD 計算，邏輯零變更 |

---

## 4. 技術設計

### 4.1 Schema（需 migration）
`OMExpenseMonthly` 新增：
```prisma
actualAmountHKD Float?  // CHANGE-048: HKD 實際支出（可 null；既有資料以換算值帶入顯示，存檔後寫死）
```
- **可為 null** 的理由：既有 row 無此值，避免脆弱的 SQL backfill；改由前端載入時以換算值帶入。
- Migration：`20260603032209_change048_om_monthly_hkd` —
  `ALTER TABLE "OMExpenseMonthly" ADD COLUMN "actualAmountHKD" DOUBLE PRECISION;`（additive nullable、無資料遺失、向後相容）。

### 4.2 API（`omExpense.ts`）
- `monthlyRecordSchema` 新增 `actualAmountHKD: z.number().nonnegative().nullable().optional()`。
- `updateItemMonthlyRecords` 的 `upsert` 於 `update` / `create` 寫入 `actualAmountHKD: monthData.actualAmountHKD ?? null`。
- `itemActualSpent` / `totalActualSpent` 計算**維持以 `actualAmount`(USD) 加總，零變更**。
- `getById` 為整 model 載入（無 `select`），自動帶出新欄位，前端無需額外調整查詢。

### 4.3 前端
- **`DualCurrency.tsx`**：新增 `stacked?: boolean`。`stacked` 時以 `flex flex-col` 輸出「USD 一行 + ≈ 次幣別小字一行」；非 stacked 維持原 inline 行為（向後相容，不影響既有呼叫端）。
- **`OMExpenseItemMonthlyGrid.tsx`**（核心）：
  - 新增 prop `hkdRate?: number | null`；`effectiveHkdRate = hkdRate ?? (item.currency?.code==='HKD' ? item.currency.exchangeRate : null)`。
  - state `MonthlyRecord` 加 `actualAmountHKD: number`；初始化以 `existing.actualAmountHKD ?? (USD×匯率) ?? 0`；匯率較晚載入時 effect 重建。
  - `updateMonthUSD`（設 USD + 自動覆寫 HKD）/ `updateMonthHKD`（僅設 HKD）。
  - 表格由 2 欄 → 3 欄（月份 / USD / HKD）；footer 加 HKD 總計；上方 4 卡片改 `stacked`。
- **`[id]/page.tsx`**：`api.currency.getActive` 找 `code==='HKD'` 取 `exchangeRate` 傳 `hkdRate`；`transformedItems` 帶出 `actualAmountHKD`。
- **`OMExpenseItemList.tsx`**：`OMExpenseItemData.monthlyRecords` 型別加 `actualAmountHKD?: number | null`（維持資料流型別一致）。

### 4.4 i18n
`omExpenses.monthlyGrid` 新增 `amountColumnUSD` / `amountColumnHKD`（en + zh-TW）；保留舊 `amountColumn` 不刪。

---

## 5. 影響範圍

- **Schema**: `OMExpenseMonthly` +1 欄（migration）
- **API**: `omExpense.ts`（schema + 1 個 procedure 寫入；彙總邏輯不動）
- **前端組件**: `DualCurrency.tsx`、`OMExpenseItemMonthlyGrid.tsx`、`OMExpenseItemList.tsx`
- **前端頁面**: `om-expenses/[id]/page.tsx`
- **i18n**: `en.json` + `zh-TW.json`
- **未受影響**: OM Summary、data-import（FEAT-008）、`getMonthlyTotals` 等既有 USD 消費端（HKD 為附加欄，預設 null）

---

## 6. 驗收標準

- [x] `pnpm typecheck`（api + web）全綠
- [x] `pnpm validate:i18n` 通過（2848 keys 兩語系一致）
- [x] Migration 建立並套用，`prisma migrate status` 無漂移
- [x] 本變更檔案 `lint` **零新增 error**（既有 7 個 web error / api `headerKeys` error 均為未改動行的 baseline 債務）
- [ ] 瀏覽器手測（**需先重啟 dev server**，見 §8.2）：
  - 上方 4 卡片不再重疊（USD/HKD 直式堆疊）
  - USD 欄輸入 → HKD 自動帶入換算值
  - 手動改 HKD → USD 不變
  - 存檔後重整，USD/HKD 兩欄值皆正確保留
  - 既有資料（HKD=null）載入顯示換算值

---

## 7. 實施記錄（2026-06-03）

### 7.1 實際變更檔案
**Schema / Migration（1 + 1）：**
- `packages/db/prisma/schema.prisma` — `OMExpenseMonthly.actualAmountHKD Float?`
- `packages/db/prisma/migrations/20260603032209_change048_om_monthly_hkd/`

**API（1）：**
- `packages/api/src/routers/omExpense.ts` — `monthlyRecordSchema` + `updateItemMonthlyRecords` upsert

**前端（4）：**
- `apps/web/src/components/shared/DualCurrency.tsx` — `stacked` 變體
- `apps/web/src/components/om-expense/OMExpenseItemMonthlyGrid.tsx` — HKD 欄、自動換算、HKD 總計、卡片 stacked
- `apps/web/src/components/om-expense/OMExpenseItemList.tsx` — `monthlyRecords` 型別補欄位
- `apps/web/src/app/[locale]/om-expenses/[id]/page.tsx` — HKD 匯率查詢 + 傳 prop + 帶出欄位

**i18n（2）：**
- `apps/web/src/messages/{en,zh-TW}.json` — `amountColumnUSD` / `amountColumnHKD`

### 7.2 已知注意事項
- 🟡 **dev server 需重啟**：`prisma generate` 因執行中 dev server 鎖住同版本 engine DLL 出現 EPERM（型別與 JS client 已更新、屬 no-op），但**執行中的 server 記憶體仍是舊 Prisma Client**，不認得新欄位 → 存檔會失敗，**重啟 `pnpm dev` 後方可手測**。
- 🟡 **編號歷史**：本變更歷經兩次配號 — 原誤用 `CHANGE-043`（被 `CHANGE-043-budget-proposal-meeting-minutes-fields` 占用）→ 一度配為 `CHANGE-044` → 因與 main 已發布的 `CHANGE-044`（專案詳情頁 Tab）撞號，於 2026-06-09 最終配為 **CHANGE-048**（同步 045→049、046→050）。涉及 migration 資料夾名、原始碼檔註解、文件交叉引用。migration 從未套用至 main DB，故以單純 rename 處理（`migration.sql` 內容不變）。
- 🟡 **UAT/PRD 部署**：此 migration 將隨 `prisma migrate deploy` 套用；屬 additive nullable 欄位，安全。
- 🟢 **資料前置**：HKD 自動換算需 `Currency` 表的 HKD `exchangeRate` 已填（沿用 CHANGE-042 前置）；未填則 HKD 欄仍可手動輸入，僅自動帶入停用。

### 7.3 連動/語意說明
- 因 D3 採單向（改 HKD 不回寫 USD）+ D1 持久化雙存，理論上 USD×匯率 與儲存 HKD 可能不一致（使用者刻意覆寫 HKD 時）。此為「記錄真實 HKD 收據」的預期行為；使用率/彙總一律以 USD 為準，不受 HKD 覆寫影響。

---

## 8. 相關文檔

- 延續：`CHANGE-042-om-expense-dual-currency-display.md`（雙幣別顯示、`lib/currency.ts`、`DualCurrency`）
- 架構背景：`apps/web/src/components/om-expense/CLAUDE.md`（FEAT-007 表頭-明細-月度三層）
- Schema：`packages/db/prisma/schema.prisma`（`OMExpenseMonthly`）
- 既有資產：`routers/currency.ts`、`settings/currencies/page.tsx`
