# vendor Router 詳細分析

> **檔案路徑**: `packages/api/src/routers/vendor.ts`
> **行數**: 347 行
> **模組**: `api/routers/vendor`
> **功能**: 供應商管理 CRUD + 搜尋 + 統計

---

## 概述

標準的 CRUD Router，管理供應商基本資訊。支援分頁、搜尋（名稱/聯絡人/Email）和排序。包含級聯刪除保護。

---

## Procedures 清單（共 6 個）

### 1. `getAll` (query) — 行 94
- **權限**: protectedProcedure
- **Input Schema** (`getVendorsQuerySchema`):
  - `page` (預設 1), `limit` (預設 10, max 100)
  - `search`: string (可選，搜尋 name/contactPerson/contactEmail)
  - `sortBy`: enum (`'name' | 'createdAt' | 'updatedAt'`, 預設 'name')
  - `sortOrder`: asc/desc (預設 asc)
- **回傳**: `{ items (含 _count: quotes/purchaseOrders), pagination }`

### 2. `getById` (query) — 行 148
- **權限**: protectedProcedure
- **Input**: `{ id: string }`
- **回傳**: Vendor（含最近 10 個 quotes 和 10 個 purchaseOrders.project）

### 3. `create` (mutation) — 行 192
- **權限**: protectedProcedure
- **Input Schema** (`createVendorSchema`):
  - `name`: string (必填)
  - `contactPerson`, `phone`: string (可選)
  - `contactEmail`: string (email 格式或空字串, 可選)
- **回傳**: Vendor
- **關鍵業務邏輯**: 檢查名稱唯一性（CONFLICT）

### 4. `update` (mutation) — 行 225
- **權限**: protectedProcedure
- **Input Schema** (`updateVendorSchema`):
  - `id` (必填), `name`, `contactPerson`, `contactEmail`, `phone` (皆可選)
- **回傳**: Vendor
- **關鍵業務邏輯**: 更新名稱時檢查與其他供應商重複；空字串 email 轉為 null

### 5. `delete` (mutation) — 行 278
- **權限**: protectedProcedure
- **Input**: `{ id: string }`
- **回傳**: `{ success, message }`
- **關鍵業務邏輯**: 有 quotes 或 purchaseOrders 關聯時拒絕刪除（PRECONDITION_FAILED）

### 6. `getStats` (query) — 行 322
- **權限**: protectedProcedure
- **Input**: 無
- **回傳**: `{ totalVendors, vendorsWithQuotes, vendorsWithPOs }`

---

## 匯出的 Zod Schemas

| Schema | 用途 |
|--------|------|
| `createVendorSchema` | 建立供應商 |
| `updateVendorSchema` | 更新供應商 |
| `getVendorsQuerySchema` | 查詢參數 |

---

## 使用的 Prisma Models

| Model | 操作 |
|-------|------|
| `Vendor` | CRUD + 統計 |
| `Quote` | 讀取（關聯查詢 + 刪除保護） |
| `PurchaseOrder` | 讀取（關聯查詢 + 刪除保護） |

---

## 顯著模式

- **多欄位搜尋**: 同時搜尋 name、contactPerson、contactEmail（case insensitive）
- **名稱唯一性**: create 和 update 都檢查名稱重複
- **限量關聯**: getById 只加載最近 10 個 quotes 和 POs（避免過載）
- **空字串處理**: contactEmail 空字串轉為 null
