# FIX-140: 移除 FEAT-007 遺留死碼 OMExpenseMonthlyGrid.tsx（含 HKD 硬編碼）

> **建立日期**: 2026-06-02
> **完成日期**: 2026-06-02
> **狀態**: ✅ 已完成
> **優先級**: 🟢 Medium
> **類型**: 死碼清理（技術債務）

## 問題描述

`apps/web/src/components/om-expense/OMExpenseMonthlyGrid.tsx`（487 行）是 **FEAT-007 表頭-明細-月度三層架構重構** 後遺留的死碼：

1. **無人使用**：FEAT-007 已改用 `OMExpenseItemMonthlyGrid.tsx`（針對單一明細的 12 月網格）取代它。整個 `apps/web/src` 內**沒有任何頁面或組件 import 它**。
2. **含硬編碼幣別**：`formatCurrency` 寫死 `currency: 'HKD'`（約 line 227），與專案「金額一律以 USD 為主值」的策略不符（參見 [CHANGE-042](../feature-changes/CHANGE-042-om-expense-dual-currency-display.md) OM Expense 雙幣別顯示）。由於該檔已無人使用，此硬編碼為潛在誤用風險。

## 重現步驟

此為靜態死碼，非執行期 bug。確認方式：

1. 在 `apps/web/src` 下 grep `OMExpenseMonthlyGrid`
2. 觀察 → 只有以下非 import 引用：
   - `components/CLAUDE.md`、`om-expense/CLAUDE.md`（文件描述）
   - `OMExpenseItemMonthlyGrid.tsx:7`（一句註解「與舊版 OMExpenseMonthlyGrid 的區別…」）
   - 檔案本身
3. 確認實際被使用的是 `OMExpenseItemMonthlyGrid`（詳情頁 `om-expenses/[id]/page.tsx:101` import、`:741` 使用）

## 根本原因

FEAT-007 將 OMExpense 由扁平架構重構為「Header → Item → Monthly」三層後，月度編輯改在**明細層級**進行（`OMExpenseItemMonthlyGrid`），原本作用於**整張 OMExpense 彙總**的 `OMExpenseMonthlyGrid` 失去用途，但重構時未一併移除，成為遺留死碼。

## 解決方案

確認為死碼後直接刪除（已先向使用者確認）。

**為何不採「遷移到 DualCurrency」方案**：該組件已完全無人引用，遷移到 `@/components/shared/DualCurrency` + `@/lib/currency` 等於替死碼維護，違反 Karpathy「Simplicity First / 不為死碼建抽象」。刪除是最小且正確的處置。仍在使用的 `OMExpenseItemMonthlyGrid` 不在本次範圍，其幣別顯示由 CHANGE-042 另行處理。

## 修改的檔案

1. **`apps/web/src/components/om-expense/OMExpenseMonthlyGrid.tsx`** — 🗑️ **整檔刪除**（487 行死碼）
2. **`apps/web/src/components/om-expense/OMExpenseItemMonthlyGrid.tsx`** (Line 7)
   - 移除指向已刪除組件的懸空註解「與舊版 OMExpenseMonthlyGrid 的區別…」，改為自含描述「此組件針對單一明細項目（OMExpenseItem），而非整個 OMExpense 表頭層級。」
3. **`apps/web/src/components/CLAUDE.md`**
   - 目錄結構：移除 `OMExpenseMonthlyGrid.tsx` 條目，om-expense 計數 5 → 4
   - 頂端統計：93 個 .tsx（50 業務 + 43 UI）
4. **`apps/web/src/components/om-expense/CLAUDE.md`**
   - 檔案結構區塊：移除 `OMExpenseMonthlyGrid.tsx` 行
   - 「Monthly Grid 組件」對照表：移除死碼列，標題由「組件差異」改為「組件」，並加註歷史說明
5. **`FIXLOG.md`** — 新增 FIX-140 索引與詳細記錄

## 測試驗證

- [x] `apps/web` 內 grep `OMExpenseMonthlyGrid` → 無殘留 import（僅 docs/codebase-analyze 與 claudedocs 歷史規劃文件，屬歷史紀錄不在範圍）
- [x] `pnpm validate:i18n` 通過（本次未動翻譯檔，確認無破壞）
- [x] `apps/web` typecheck 對照 baseline，未新增錯誤（刪除無人引用的檔案不影響型別）

## 已知限制 / 觀察

- **FIXLOG.md 索引債務**：FIXLOG.md 索引表目前停在 FIX-089，FIX-101~139 的詳細文件雖存在於 `bug-fixes/` 但未回填索引。本次僅依規範在最頂端加入 FIX-140，**未**回填中間缺漏（超出本任務範圍，屬獨立文件維護）。
- `docs/codebase-analyze/` 與 `claudedocs/1-planning/features/FEAT-007-*` 等歷史分析/規劃文件仍提及 `OMExpenseMonthlyGrid`，屬當時快照紀錄，刻意保留不動。

## 相關檔案

- 取代它的現役組件: `apps/web/src/components/om-expense/OMExpenseItemMonthlyGrid.tsx`
- 幣別策略來源: `claudedocs/4-changes/feature-changes/CHANGE-042-om-expense-dual-currency-display.md`
- 共用幣別元件（現役組件採用）: `apps/web/src/components/shared/DualCurrency.tsx`、`apps/web/src/lib/currency.ts`
- 原始重構: `claudedocs/1-planning/features/FEAT-007-om-expense-header-detail-refactoring/`
