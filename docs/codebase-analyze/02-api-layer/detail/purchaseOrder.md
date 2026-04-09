# purchaseOrder Router 詳細分析

> **檔案路徑**: `packages/api/src/routers/purchaseOrder.ts`
> **行數**: 1004 行
> **模組**: `api/routers/purchaseOrder`
> **功能**: 採購單管理（表頭-明細架構 + 狀態工作流）

---

## 概述

管理採購單的完整生命週期，採用表頭-明細架構（PurchaseOrder -> PurchaseOrderItem）。支援從報價單生成或手動建立，包含 Draft -> Submitted -> Approved 的狀態工作流。

---

## Procedures 清單（共 13 個）

### 1. `getAll` (query) — 行 121
- **權限**: protectedProcedure
- **Input Schema** (`getPOsQuerySchema`):
  - `page` (預設 1), `limit` (預設 10, max 100)
  - `projectId`, `vendorId` (可選過濾)
  - `sortBy`: enum (`'poNumber' | 'date' | 'totalAmount'`, 預設 'date')
  - `sortOrder`: asc/desc (預設 desc)
- **回傳**: `{ items (含 project, vendor, quote, currency, _count.expenses), pagination }`

### 2. `getById` (query) — 行 195
- **權限**: protectedProcedure
- **Input**: `{ id: string }`
- **回傳**: 完整 PurchaseOrder（含 project.manager/supervisor/budgetPool/currency、vendor、quote、currency、items、expenses）

### 3. `create` (mutation) — 行 257
- **權限**: protectedProcedure
- **Input Schema** (`createPOSchema`):
  - `name`: string (必填)
  - `description`: string (可選)
  - `projectId`, `vendorId`: string (必填)
  - `quoteId`: string (可選)
  - `date`: string (可選)
  - `items`: array of `purchaseOrderItemSchema` (min 1)
    - `itemName`, `description`, `quantity`, `unitPrice`, `sortOrder`, `_delete`
- **回傳**: PurchaseOrder（含 items, project, vendor）
- **關鍵業務邏輯**: 驗證 project 和 vendor 存在；自動計算 totalAmount = sum(quantity * unitPrice)；Transaction 建立表頭 + 明細

### 4. `update` (mutation) — 行 359
- **權限**: protectedProcedure
- **Input Schema** (`updatePOSchema`):
  - `id` (必填), `name`, `description`, `vendorId`, `date`, `items` (皆可選)
  - items 支援 `_delete: true` 標記刪除、有 id 為更新、無 id 為新增
- **回傳**: 更新後的 PurchaseOrder
- **關鍵業務邏輯**: 只有 Draft 狀態可修改；Transaction 處理 items 的新增/更新/刪除；重新計算 totalAmount

### 5. `delete` (mutation) — 行 484
- **權限**: protectedProcedure
- **Input**: `{ id: string }`
- **回傳**: `{ success, message }`
- **關鍵業務邏輯** (CHANGE-022): 僅 Draft 可刪除；有 expenses 關聯時拒絕刪除；Transaction 先刪明細再刪表頭

### 6. `deleteMany` (mutation) — 行 547
- **權限**: protectedProcedure
- **Input**: `{ ids: string[] (min 1) }`
- **回傳**: `{ deleted, skipped, errors: Array<{id, reason}> }`
- **關鍵業務邏輯**: 逐筆檢查狀態和 expenses 關聯

### 7. `revertToDraft` (mutation) — 行 600
- **權限**: protectedProcedure
- **Input**: `{ id: string }`
- **回傳**: `{ success }`
- **關鍵業務邏輯**: 僅 Submitted 和 Cancelled 可退回 Draft

### 8. `revertToSubmitted` (mutation) — 行 644
- **權限**: supervisorProcedure
- **Input**: `{ id: string }`
- **回傳**: `{ success }`
- **關鍵業務邏輯** (CHANGE-025): 僅 Approved 可退回 Submitted；清除 approvedDate

### 9. `getByProject` (query) — 行 685
- **權限**: protectedProcedure
- **Input**: `{ projectId: string }`
- **回傳**: PurchaseOrder | null（含 vendor, quote, expenses, _count）

### 10. `submit` (mutation) — 行 720
- **權限**: protectedProcedure
- **Input**: `{ id: string }`
- **回傳**: PurchaseOrder（含 items）
- **關鍵業務邏輯**: 僅 Draft 可提交；至少一個品項；狀態變更為 Submitted

### 11. `approve` (mutation) — 行 775
- **權限**: supervisorProcedure
- **Input**: `{ id: string }`
- **回傳**: PurchaseOrder（含 items）
- **關鍵業務邏輯**: 僅 Submitted 可批准；狀態變更為 Approved + 記錄 approvedDate

### 12. `createFromQuote` (mutation) — 行 819
- **權限**: protectedProcedure
- **Input**: `{ projectId: string, quoteId: string }`
- **回傳**: PurchaseOrder（含 items, project, vendor, quote）
- **關鍵業務邏輯**: 驗證 quote 屬於 project；一個專案只能選一份報價單（從報價生成的 PO）；生成 PO 編號 `PO-{projectCode}-{序號}`；Transaction 建立 PO + 預設品項

### 13. `getStats` (query) — 行 973
- **權限**: protectedProcedure
- **Input**: 無
- **回傳**: `{ totalPOs, totalAmount, POsWithExpenses, POsWithoutExpenses, projectsWithPOs }`

---

## 匯出的 Zod Schemas

| Schema | 用途 |
|--------|------|
| `purchaseOrderItemSchema` | 品項明細 |
| `createPOSchema` | 建立 PO |
| `updatePOSchema` | 更新 PO |
| `getPOsQuerySchema` | 查詢參數 |

---

## 使用的 Prisma Models

| Model | 操作 |
|-------|------|
| `PurchaseOrder` | CRUD + 狀態變更 |
| `PurchaseOrderItem` | CRUD |
| `Project` | 讀取（驗證） |
| `Vendor` | 讀取（驗證） |
| `Quote` | 讀取（驗證 + 生成 PO） |
| `Expense` | 讀取（刪除檢查） |

---

## 顯著模式

- **狀態工作流**: Draft -> Submitted -> Approved，含雙向退回（revertToDraft, revertToSubmitted）
- **表頭-明細架構**: items 支援新增/更新/刪除（`_delete` 標記）
- **從報價單生成**: createFromQuote 含唯一性保護（一個專案一份報價單的 PO）
- **自動計算**: totalAmount 在建立和更新時自動重算
- **批量操作**: deleteMany 支援逐筆錯誤回報
