# quote Router 詳細分析

> **檔案路徑**: `packages/api/src/routers/quote.ts`
> **行數**: 712 行
> **模組**: `api/routers/quote`
> **功能**: 報價單管理（含報價比較和統計）

---

## 概述

管理報價單的 CRUD 和報價比較功能。報價單關聯專案和供應商，用於採購決策。支援檔案路徑記錄（本地或 Azure Blob Storage）。

---

## Procedures 清單（共 11 個）

### 1. `getAll` (query) — 行 103
- **權限**: protectedProcedure
- **Input**: `{ page (預設 1), limit (預設 10, max 100), projectId?, vendorId? }`
- **回傳**: `{ items (含 vendor, project, purchaseOrders), pagination }`

### 2. `getByProject` (query) — 行 180
- **權限**: protectedProcedure
- **Input Schema** (`getQuotesByProjectSchema`): `{ projectId: string, vendorId?: string }`
- **回傳**: Quote[]（含 vendor, purchaseOrders，按 uploadDate desc 排序）

### 3. `getByVendor` (query) — 行 223
- **權限**: protectedProcedure
- **Input**: `{ vendorId: string }`
- **回傳**: Quote[]（含 project, purchaseOrders）

### 4. `getById` (query) — 行 255
- **權限**: protectedProcedure
- **Input**: `{ id: string (uuid) }`
- **回傳**: Quote（含 vendor, project.manager/supervisor, purchaseOrders）

### 5. `create` (mutation) — 行 302
- **權限**: protectedProcedure
- **Input Schema** (`createQuoteSchema`):
  - `projectId`, `vendorId`, `filePath`: string (必填)
  - `amount`: number (非負, 必填)
  - `fileName`, `description`: string (可選)
- **回傳**: Quote（含 vendor, project）
- **關鍵業務邏輯**: 驗證專案存在且有已批准的提案（proposals.status = Approved）；驗證供應商存在

### 6. `update` (mutation) — 行 373
- **權限**: protectedProcedure
- **Input Schema** (`updateQuoteSchema`): `{ id: string (uuid), amount?: number, description?: string }`
- **回傳**: Quote
- **關鍵業務邏輯**: 已被選為採購單的報價無法修改（PRECONDITION_FAILED）

### 7. `delete` (mutation) — 行 427
- **權限**: protectedProcedure
- **Input**: `{ id: string (uuid), force?: boolean (預設 false) }`
- **回傳**: `{ success, message }`
- **關鍵業務邏輯** (CHANGE-021): 有 PO 關聯時預設拒絕；force=true 時僅當所有 PO 為 Draft 才允許（解除 PO 的 quoteId 關聯後再刪除）

### 8. `deleteMany` (mutation) — 行 498
- **權限**: protectedProcedure
- **Input**: `{ ids: string[] (uuid, min 1), force?: boolean (預設 false) }`
- **回傳**: `{ deleted, skipped, errors }`

### 9. `revertToDraft` (mutation) — 行 567
- **權限**: protectedProcedure
- **Input**: `{ id: string (uuid) }`
- **回傳**: `{ success, unlinkedCount, message }`
- **關鍵業務邏輯** (CHANGE-021): 解除所有 Draft PO 的 quoteId 關聯；非 Draft PO 存在時拒絕

### 10. `compare` (query) — 行 627
- **權限**: protectedProcedure
- **Input**: `{ projectId: string }`
- **回傳**: `{ quotes (按金額升序), stats: {total, avgAmount, minAmount, maxAmount, selectedVendorId, selectedQuoteId} }`

### 11. `getStats` (query) — 行 670
- **權限**: protectedProcedure
- **Input**: 無
- **回傳**: `{ totalQuotes, quotesByProject (前10個), quotesWithPO, quotesWithoutPO }`

---

## 匯出的 Zod Schemas

| Schema | 用途 |
|--------|------|
| `createQuoteSchema` | 建立報價單 |
| `updateQuoteSchema` | 更新報價單 |
| `getQuotesByProjectSchema` | 按專案查詢 |

---

## 使用的 Prisma Models

| Model | 操作 |
|-------|------|
| `Quote` | CRUD |
| `Project` | 讀取（驗證 + 統計） |
| `Vendor` | 讀取（驗證） |
| `PurchaseOrder` | 讀取（關聯檢查）+ 更新（解除 quoteId） |
| `BudgetProposal` | 讀取（驗證已批准提案） |

---

## 顯著模式

- **業務門檻**: create 要求專案有已批准的提案
- **保護機制**: 已選為 PO 的報價無法修改或刪除
- **強制刪除**: force 選項允許解除 Draft PO 關聯後刪除
- **報價比較**: compare 提供統計分析（平均/最小/最大金額、已選供應商）
