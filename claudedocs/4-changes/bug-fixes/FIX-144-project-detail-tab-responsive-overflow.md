# FIX-144: 專案詳情頁 Tab 標籤在窄寬度溢出重疊

> **建立日期**: 2026-06-09
> **完成日期**: 2026-06-09
> **狀態**: ✅ 已完成
> **優先級**: Medium
> **類型**: Bug 修復（UI / 響應式）
> **相關**: CHANGE-044（專案詳情頁 Tab 化 + 專案費用 master-detail，本 FIX 修其響應式缺陷）

## 問題描述

CHANGE-044 將專案詳情頁左欄改為 5 個 Tab（Overview / Classification & Charge-Out / Budget & Stats / Proposals & Procurement / Project Expense）。`TabsList` 使用 `grid grid-cols-5` 強制 5 等寬欄，配合 shadcn `TabsTrigger` 基礎樣式的 `whitespace-nowrap`，導致：在 `lg` 斷點下左欄僅佔 2/3 寬度（每欄約 110–120px）時，較長的英文標籤無法換行，直接溢出格子邊界，**與相鄰標籤文字視覺重疊**。

## 重現步驟

1. 以 `lg`～中等桌機寬度（約 1024–1200px）開啟任一專案詳情頁 `/projects/[id]`。
2. 觀察左欄頂部的 Tab 列。
3. 「Classification & Charge-Out」「Proposals & Procurement」等長標籤溢出、與鄰格重疊。

## 根本原因

- `TabsList` 固定 `grid-cols-5` + 固定 `h-10`，每欄寬度被強制均分，窄寬度下不足以容納長標籤。
- `TabsTrigger` 基礎樣式含 `whitespace-nowrap`（`components/ui/tabs.tsx`），文字不換行，超出格寬即溢位。

## 解決方案

僅修改頁面層（不動共用的 `components/ui/tabs.tsx`，以免影響 settings 等其他使用 Tabs 的頁面）：

1. **`TabsList`** 改為響應式網格 + 高度自適應：
   `grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-5`
   （手機 2 欄 / 平板 3 欄 / 桌機 5 欄）。
2. **`TabsTrigger`** 加上：`h-full whitespace-normal py-1.5 text-center text-xs leading-tight sm:text-sm`
   — `whitespace-normal` 覆蓋基礎的 `whitespace-nowrap`，允許文字在格內換行；響應式字級 + 置中 + 緊湊行高，確保換行後仍整齊、永不溢出。

## 修改的檔案

- `apps/web/src/app/[locale]/projects/[id]/page.tsx` — `TabsList` / 5 個 `TabsTrigger` className 調整

## 測試驗證

- [x] `pnpm --filter web typecheck` 全綠
- [x] `next lint --file`（改動檔）：本次改動 0 新增問題（其餘為既有 baseline，未順手處理）
- [x] 瀏覽器 1120px（`lg`，左欄最窄）：5 個 Tab 一排，長標籤換兩行，**無重疊**
- [x] 瀏覽器 560px（手機）：降為 2 欄 3 排，全部可見，**無重疊**
