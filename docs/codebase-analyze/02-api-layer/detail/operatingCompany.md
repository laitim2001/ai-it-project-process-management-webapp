# operatingCompany Router 詳細分析

> **檔案路徑**: `packages/api/src/routers/operatingCompany.ts`
> **行數**: 439 行
> **模組**: `api/routers/operatingCompany`
> **功能**: 營運公司 (OpCo) 管理 + 數據權限管理 (FEAT-009)

---

## 概述

管理營運公司（Operating Company）的 CRUD 操作，以及 FEAT-009 新增的用戶-OpCo 數據權限系統。營運公司是費用轉嫁和 OM 費用管理的核心實體。

---

## Procedures 清單（共 9 個）

### 1. `create` (mutation) — 行 73
- **權限**: supervisorProcedure
- **Input Schema** (`createOpCoSchema`):
  - `code`: string (1-50)
  - `name`: string (1-200)
  - `description`: string (可選)
- **回傳**: OperatingCompany
- **關鍵業務邏輯**: 檢查 code 唯一性（CONFLICT 錯誤）

### 2. `update` (mutation) — 行 103
- **權限**: supervisorProcedure
- **Input Schema** (`updateOpCoSchema`):
  - `id`: string (必填)
  - `code`, `name`, `description`, `isActive` (皆可選)
- **回傳**: OperatingCompany
- **關鍵業務邏輯**: 更新 code 時檢查新 code 是否衝突

### 3. `getById` (query) — 行 145
- **權限**: protectedProcedure
- **Input**: `{ id: string }`
- **回傳**: OperatingCompany（含 `_count`: chargeOuts, omExpenseItems, omExpensesLegacy）

### 4. `getAll` (query) — 行 176
- **權限**: protectedProcedure
- **Input** (可選): `{ isActive?: boolean, includeInactive?: boolean (預設 false) }`
- **回傳**: OperatingCompany[]（含 `_count`，按 code 排序）
- **關鍵業務邏輯**: 預設只顯示啟用的 OpCo

### 5. `delete` (mutation) — 行 218
- **權限**: supervisorProcedure
- **Input**: `{ id: string }`
- **回傳**: `{ success, message }`
- **關鍵業務邏輯**: 檢查 chargeOuts、omExpenseItems、omExpensesLegacy、omExpenseMonthly 關聯，有關聯則拒絕刪除（PRECONDITION_FAILED）

### 6. `toggleActive` (mutation) — 行 269
- **權限**: supervisorProcedure
- **Input**: `{ id: string }`
- **回傳**: OperatingCompany（切換後）

### 7. `getUserPermissions` (query) — 行 299
- **權限**: supervisorProcedure
- **Input**: `{ userId: string }`
- **回傳**: UserOperatingCompany[]（含 operatingCompany，按 code 排序）

### 8. `setUserPermissions` (mutation) — 行 323
- **權限**: supervisorProcedure
- **Input**: `{ userId: string, operatingCompanyIds: string[] }`
- **回傳**: `{ success, message }`
- **關鍵業務邏輯**: 使用 transaction 整批替換（先刪後建）；驗證用戶和所有 OpCo 存在；記錄 `createdBy`

### 9. `getForCurrentUser` (query) — 行 392
- **權限**: protectedProcedure
- **Input** (可選): `{ isActive?: boolean (預設 true) }`
- **回傳**: OperatingCompany[]
- **關鍵業務邏輯**: Admin 返回所有 OpCo；其他用戶根據 UserOperatingCompany 過濾；向後兼容：無權限記錄的用戶返回所有（寬鬆模式）

---

## 匯出的 Zod Schemas

- `createOpCoSchema` (內部使用)
- `updateOpCoSchema` (內部使用)

---

## 使用的 Prisma Models

| Model | 操作 |
|-------|------|
| `OperatingCompany` | CRUD |
| `UserOperatingCompany` | 讀取 + 整批替換 (FEAT-009) |
| `User` | 讀取（驗證） |

---

## 跨 Router 依賴

- 無直接呼叫其他 Router
- 使用 `../trpc` 的 `createTRPCRouter`, `protectedProcedure`, `supervisorProcedure`

---

## 顯著模式

- **啟用/停用管理**: toggleActive 而非硬刪除
- **級聯刪除保護**: 有關聯資料時拒絕刪除
- **RBAC**: CRUD 操作需要 Supervisor 權限，查詢只需 protected
- **數據權限 (FEAT-009)**: 用戶-OpCo 多對多權限，Admin 繞過，向後兼容寬鬆模式
