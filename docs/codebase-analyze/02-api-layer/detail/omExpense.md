# omExpense Router 詳細分析

> **檔案路徑**: `packages/api/src/routers/omExpense.ts`
> **行數**: 2762 行
> **模組**: `api/routers/omExpense`
> **功能**: O&M (Operations & Maintenance) 費用管理 API

---

## 概述

此 Router 管理 O&M 費用的完整生命週期，採用表頭-明細架構（FEAT-007 重構）：
- **OMExpense** (表頭) -- 年度基本資訊
- **OMExpenseItem** (明細) -- 各項目預算和 OpCo 歸屬
- **OMExpenseMonthly** (月度記錄) -- 追蹤實際支出

同時保留舊版向後兼容的 API。

---

## Procedures 清單（共 19 個）

### 1. `importData` (mutation) — 行 384
- **權限**: protectedProcedure
- **Input Schema** (`importOMExpenseDataSchema`):
  - `financialYear`: number (2000-2100)
  - `items`: array of `importOMExpenseItemSchema` (min 1)
    - `headerName`: string (必填)
    - `headerDescription`: string (可選)
    - `category`: string (必填)
    - `itemName`: string (必填)
    - `itemDescription`: string (可選)
    - `budgetAmount`: number (非負, 預設 0)
    - `opCoName`: string (必填)
    - `endDate`: string (可選)
    - `lastFYActualExpense`: number (可選)
    - `isOngoing`: boolean (預設 false)
  - `importMode`: enum `'skip' | 'update' | 'replace'` (預設 'skip')
- **回傳**: `ImportResult` — 成功/失敗、統計數據（建立/跳過/更新數量）、詳細資訊
- **關鍵業務邏輯**:
  - 使用 Prisma `$transaction`（最大 5 分鐘超時）
  - replace 模式：先刪除該財年所有記錄再導入
  - 自動建立不存在的 OperatingCompany（`generateOpCoCode`）
  - 自動建立不存在的 ExpenseCategory（`generateCategoryCode`）
  - 自動查詢 USD 作為預設幣別
  - 唯一性檢查：Header name + Item name + Description + OpCo + budgetAmount
  - skip 模式：跳過重複；update 模式：更新重複項目
  - 為每個新 Item 建立 12 個月度記錄
  - 最後更新所有受影響 Header 的 totalBudgetAmount

### 2. `createWithItems` (mutation) — 行 777
- **權限**: protectedProcedure
- **Input Schema** (`createOMExpenseWithItemsSchema`):
  - `name`: string (必填, max 200)
  - `description`: string (可選)
  - `financialYear`: number (2000-2100)
  - `category`: string (必填, max 100)
  - `vendorId`: string (可選)
  - `sourceExpenseId`: string (可選)
  - `defaultOpCoId`: string (可選)
  - `items`: array of `omExpenseItemSchema` (min 1)
    - `name`, `description`, `sortOrder`, `budgetAmount`, `lastFYActualExpense`, `opCoId`, `currencyId`, `startDate`, `endDate`, `isOngoing`
- **回傳**: 完整 OMExpense（含 items、monthlyRecords、opCo、vendor、sourceExpense）
- **關鍵業務邏輯**:
  - 驗證所有 OpCo、defaultOpCo、vendor、sourceExpense、currency 是否存在
  - 驗證日期邏輯（startDate < endDate）
  - 使用 transaction 建立表頭 + 明細 + 12 個月度記錄
  - 自動計算 totalBudgetAmount

### 3. `addItem` (mutation) — 行 992
- **權限**: protectedProcedure
- **Input Schema** (`addItemSchema`):
  - `omExpenseId`: string (必填)
  - `item`: omExpenseItemSchema
- **回傳**: 更新後的完整 OMExpense
- **關鍵業務邏輯**: 驗證 OM 費用、OpCo、Currency 存在；建立 Item + 12 月度記錄；更新表頭 totalBudgetAmount

### 4. `updateItem` (mutation) — 行 1143
- **權限**: protectedProcedure
- **Input Schema** (`updateItemSchema`):
  - `id`: string (必填)
  - `name`, `description`, `sortOrder`, `budgetAmount`, `lastFYActualExpense`, `opCoId`, `currencyId`, `startDate`, `endDate`, `isOngoing` (皆可選)
- **回傳**: 更新後的完整 OMExpense
- **關鍵業務邏輯**: 驗證 OpCo/Currency；isOngoing=true 時清空 endDate；更新 budgetAmount 時重算表頭；更新 OpCo 時同步月度記錄

### 5. `removeItem` (mutation) — 行 1322
- **權限**: protectedProcedure
- **Input**: `{ id: string }`
- **回傳**: 更新後的完整 OMExpense
- **關鍵業務邏輯**: 不允許刪除最後一個項目；級聯刪除月度記錄；重算表頭 totalBudgetAmount/totalActualSpent

### 6. `reorderItems` (mutation) — 行 1429
- **權限**: protectedProcedure
- **Input Schema** (`reorderItemsSchema`):
  - `omExpenseId`: string
  - `itemIds`: string[] (按新順序排列)
- **回傳**: 更新後的完整 OMExpense
- **關鍵業務邏輯**: 驗證所有 itemIds 屬於該 OM 費用；批量更新 sortOrder

### 7. `updateItemMonthlyRecords` (mutation) — 行 1510
- **權限**: protectedProcedure
- **Input Schema** (`updateItemMonthlyRecordsSchema`):
  - `omExpenseItemId`: string
  - `monthlyData`: array (length 12) of `{ month: number, actualAmount: number }`
- **回傳**: 更新後的完整 OMExpense
- **關鍵業務邏輯**: 驗證 12 個月完整；使用 upsert 更新/建立月度記錄；重算 Item 的 actualSpent 和表頭 totalActualSpent

### 8. `create` (mutation, @deprecated) — 行 1630
- **權限**: protectedProcedure
- **Input Schema** (`createOMExpenseSchema`): 舊版單一結構
  - `name`, `description`, `financialYear`, `category`, `opCoId`, `budgetAmount`, `vendorId`, `sourceExpenseId`, `startDate`, `endDate`
- **回傳**: OMExpense（含月度記錄）
- **關鍵業務邏輯**: 舊版向後兼容；建立表頭 + 12 月度記錄

### 9. `update` (mutation) — 行 1758
- **權限**: protectedProcedure
- **Input Schema** (`updateOMExpenseSchema`):
  - `id` (必填), `name`, `description`, `category`, `vendorId`, `sourceExpenseId`, `defaultOpCoId` (皆可選)
- **回傳**: 更新後的 OMExpense

### 10. `updateMonthlyRecords` (mutation) — 行 1861
- **權限**: protectedProcedure
- **Input Schema** (`updateMonthlyRecordsSchema`): 舊版月度記錄更新
  - `omExpenseId`: string
  - `monthlyData`: array (length 12)
- **回傳**: 更新後的 OMExpense

### 11. `calculateYoYGrowth` (mutation) — 行 1952
- **權限**: protectedProcedure
- **Input**: `{ id: string }`
- **回傳**: `{ yoyGrowthRate, currentYear, currentAmount, previousYear, previousAmount }`
- **關鍵業務邏輯**: 查找上年度同名/同類別/同 OpCo 的記錄；計算增長率 = (本年 - 上年) / 上年 * 100

### 12. `getById` (query) — 行 2023
- **權限**: protectedProcedure
- **Input**: `{ id: string }`
- **回傳**: 完整 OMExpense（含 items、月度記錄、opCo、vendor、sourceExpense）

### 13. `getAll` (query) — 行 2089
- **權限**: protectedProcedure
- **Input** (可選):
  - `financialYear`, `opCoId`, `category`, `search`, `page` (預設 1), `limit` (預設 20, max 100)
- **回傳**: `{ items, total, page, limit, totalPages }`

### 14. `delete` (mutation) — 行 2164
- **權限**: protectedProcedure
- **Input**: `{ id: string }`
- **回傳**: `{ success, message }`
- **關鍵業務邏輯**: cascade 自動刪除 Items 和 Monthly

### 15. `deleteMany` (mutation) — 行 2193
- **權限**: protectedProcedure
- **Input**: `{ ids: string[] (uuid, min 1) }`
- **回傳**: `{ success, deletedCount, message }`

### 16. `getCategories` (query, @deprecated) — 行 2240
- **權限**: protectedProcedure
- **Input**: 無
- **回傳**: string[] (費用類別名稱)

### 17. `getMonthlyTotals` (query) — 行 2254
- **權限**: protectedProcedure
- **Input**: `{ financialYear: number, opCoId?: string }`
- **回傳**: `Array<{ month: number, totalAmount: number }>` (12 項)

### 18. `getBySourceExpenseId` (query) — 行 2745
- **權限**: protectedProcedure
- **Input**: `{ sourceExpenseId: string }`
- **回傳**: OMExpense[]（含 opCo, vendor, monthlyRecords，按 financialYear desc 排序）
- **關鍵業務邏輯** (CHANGE-001): 追蹤 Expense 轉換為 OM 費用的歷史

### 19. `getSummary` (query) — 行 2329
- **權限**: protectedProcedure
- **Input Schema** (`getSummarySchema`):
  - `currentYear`: number (2000-2100)
  - `previousYear`: number (2000-2100)
  - `opCoIds`: string[] (可選)
  - `categories`: string[] (可選)
- **回傳**: `OMSummaryResponse` — categorySummary、detailData (Category -> OpCo -> Headers -> Items)、grandTotal、meta
- **關鍵業務邏輯**: 跨年度比較；同時支援新架構（OMExpenseItem）和舊架構（OMExpense 表頭）；OpCo 過濾使用 OR 條件支援雙架構

---

## 匯出的 Zod Schemas

| Schema | 用途 |
|--------|------|
| `monthlyRecordSchema` | 月度記錄 |
| `omExpenseItemSchema` | 明細項目 |
| `createOMExpenseWithItemsSchema` | 建立（新版含明細） |
| `createOMExpenseSchema` | 建立（舊版向後兼容） |
| `updateOMExpenseSchema` | 更新表頭 |
| `addItemSchema` | 新增明細 |
| `updateItemSchema` | 更新明細 |
| `reorderItemsSchema` | 排序 |
| `updateItemMonthlyRecordsSchema` | 更新月度記錄 |
| `updateMonthlyRecordsSchema` | 舊版月度記錄 |
| `getSummarySchema` | Summary 查詢 |
| `importOMExpenseDataSchema` | 資料導入 |
| `importModeSchema` | 導入模式 |

---

## 使用的 Prisma Models

| Model | 操作 |
|-------|------|
| `OMExpense` (oMExpense) | CRUD + 匯總計算 |
| `OMExpenseItem` (oMExpenseItem) | CRUD + 排序 |
| `OMExpenseMonthly` (oMExpenseMonthly) | CRUD + 匯總計算 |
| `OperatingCompany` | 讀取 + 自動建立 (importData) |
| `ExpenseCategory` | 讀取 + 自動建立 (importData) |
| `Currency` | 讀取（驗證） |
| `Vendor` | 讀取（驗證） |
| `Expense` | 讀取（驗證 sourceExpenseId） |

---

## 跨 Router 依賴

- 無直接呼叫其他 Router
- 使用 `../trpc` 的 `createTRPCRouter`, `protectedProcedure`
- importData 會自動建立 OperatingCompany 和 ExpenseCategory

---

## 顯著模式

- **表頭-明細架構**: FEAT-007 核心設計，一對多關係 + 12 月度記錄
- **向後兼容**: 保留舊版 create/updateMonthlyRecords，同時維護新舊架構欄位
- **批量導入**: FEAT-008，支援 skip/update/replace 三種模式，完整 rollback
- **Summary 計算**: 複雜的跨年度比較 + 多層級分組（Category -> OpCo -> Header -> Items）
- **Transaction 大量使用**: 幾乎所有寫入操作都使用 transaction 確保原子性
- **自動匯總**: budgetAmount 變更時自動重算 totalBudgetAmount/totalActualSpent
