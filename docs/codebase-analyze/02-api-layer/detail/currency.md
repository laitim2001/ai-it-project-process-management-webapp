# currency.ts - 貨幣管理 Router 分析

## 基本資訊

| 項目 | 值 |
|------|-----|
| 檔案路徑 | `packages/api/src/routers/currency.ts` |
| 行數 | 348 行 |
| Procedure 總數 | 7 個 |
| 匯入的 middleware | `protectedProcedure`, `adminProcedure` |
| 自 | FEAT-001 - Project Fields Enhancement |

---

## Procedures 清單

### 1. `create` (mutation) — 第 121~146 行

- **權限**: `adminProcedure`
- **Input Schema**: `createCurrencySchema`
  - `code`: string, length(3), regex(/^[A-Z]{3}$/)（ISO 4217）
  - `name`: string, min(1), max(100)
  - `symbol`: string, min(1), max(10)
  - `exchangeRate`: number, positive, optional
- **回傳**: 新建的 Currency
- **業務邏輯**: 檢查 code 唯一性（拋 CONFLICT）

### 2. `update` (mutation) — 第 161~197 行

- **權限**: `adminProcedure`
- **Input Schema**: `updateCurrencySchema`
  - `id`: string.uuid()
  - `code`: string, length(3), regex, optional
  - `name`: string, min(1), max(100), optional
  - `symbol`: string, min(1), max(10), optional
  - `exchangeRate`: number, positive, nullable, optional
- **回傳**: 更新後的 Currency
- **業務邏輯**: 若更新 code，檢查新 code 不與其他衝突

### 3. `delete` (mutation) — 第 211~231 行

- **權限**: `adminProcedure`
- **Input Schema**: `{ id: string.uuid() }`
- **回傳**: 更新後的 Currency (active: false)
- **業務邏輯**: **軟刪除** — 設為 active=false，不影響已使用該貨幣的專案

### 4. `getAll` (query) — 第 253~264 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ includeInactive: boolean, default(false) }`
- **回傳**: Currency[]
- **業務邏輯**: 按 code 升序排列，支援包含/排除停用貨幣

### 5. `getActive` (query) — 第 276~281 行

- **權限**: `protectedProcedure`
- **Input Schema**: 無
- **回傳**: Currency[]（active=true）
- **業務邏輯**: 快捷方法，供表單下拉選單使用

### 6. `getById` (query) — 第 295~315 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ id: string.uuid() }`
- **回傳**: Currency + _count.projects
- **業務邏輯**: 包含使用該貨幣的專案數量統計

### 7. `toggleActive` (mutation) — 第 329~347 行

- **權限**: `adminProcedure`
- **Input Schema**: `{ id: string.uuid() }`
- **回傳**: 更新後的 Currency
- **業務邏輯**: 切換 active 狀態（true <-> false）

---

## 匯出的 Zod Schemas

| Schema 名稱 | 用途 | 主要驗證 |
|---|---|---|
| `createCurrencySchema` | 建立貨幣 | ISO 4217 code 驗證、正數匯率 |
| `updateCurrencySchema` | 更新貨幣 | 部分更新、nullable exchangeRate |

---

## 使用的 Prisma Models

| Model | 操作 |
|-------|------|
| `Currency` | 讀/寫（完整 CRUD + toggleActive） |

---

## 跨 Router 依賴

- 無直接調用其他 Router
- 被 budgetPool Router 的 create/update 驗證所引用

---

## 特殊模式

- **Admin 專用**: create, update, delete, toggleActive 使用 `adminProcedure`
- **軟刪除**: delete 不真正刪除，僅設 active=false
- **唯一性檢查**: code 唯一（create 和 update 均檢查）
- **ISO 4217**: code 必須為 3 個大寫字母
- **無分頁**: getAll 返回所有貨幣（數量有限，不需分頁）
