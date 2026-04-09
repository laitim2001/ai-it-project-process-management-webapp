# expenseCategory.ts - 統一費用類別管理 Router 分析

## 基本資訊

| 項目 | 值 |
|------|-----|
| 檔案路徑 | `packages/api/src/routers/expenseCategory.ts` |
| 行數 | 337 行 |
| Procedure 總數 | 7 個 |
| 匯入的 middleware | `protectedProcedure`, `supervisorProcedure` |
| 自 | FEAT-005 / CHANGE-003 - 統一費用類別系統 |

---

## Procedures 清單

### 1. `create` (mutation) — 第 94~117 行

- **權限**: `supervisorProcedure`
- **Input Schema**: `createCategorySchema`
  - `code`: string, min(1), max(20), regex(/^[A-Z0-9_]+$/)
  - `name`: string, min(1), max(100)
  - `description`: string, max(500), optional
  - `sortOrder`: number, int, min(0), default(0)
- **回傳**: 新建的 ExpenseCategory
- **業務邏輯**: 檢查 code 唯一性（拋 CONFLICT）

### 2. `update` (mutation) — 第 123~158 行

- **權限**: `supervisorProcedure`
- **Input Schema**: `updateCategorySchema`
  - `id`: string, min(1)
  - `code`: string, optional
  - `name`: string, optional
  - `description`: string, optional, nullable
  - `sortOrder`: number, optional
  - `isActive`: boolean, optional
- **回傳**: 更新後的 ExpenseCategory
- **業務邏輯**: 若更新 code，檢查新 code 不與其他衝突

### 3. `getById` (query) — 第 163~186 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ id: string.min(1) }`
- **回傳**: ExpenseCategory + _count(expenseItems, omExpenses)
- **業務邏輯**: CHANGE-003 統一計數

### 4. `getAll` (query) — 第 192~241 行

- **權限**: `protectedProcedure`
- **Input Schema** (optional):
  - `page`: number, default(1)
  - `limit`: number, default(20), max(100)
  - `search`: string, optional
  - `isActive`: boolean, optional
  - `includeInactive`: boolean, optional, default(false)
- **回傳**: `{ categories, total, page, limit, totalPages }`
- **業務邏輯**:
  - 搜尋：code, name, description（case-insensitive）
  - 預設只顯示 active
  - include _count(expenseItems, omExpenses)
  - 按 sortOrder, code 排序

### 5. `getActive` (query) — 第 247~259 行

- **權限**: `protectedProcedure`
- **Input Schema**: 無
- **回傳**: `{ id, code, name }[]`
- **業務邏輯**: 快捷方法，供 ExpenseForm 和 OMExpenseForm 下拉選單使用

### 6. `delete` (mutation) — 第 266~310 行

- **權限**: `supervisorProcedure`
- **Input Schema**: `{ id: string.min(1) }`
- **回傳**: `{ success: true, message }`
- **業務邏輯**:
  - **級聯刪除保護**: 檢查 expenseItems 和 omExpenses 關聯計數
  - 有關聯資料時拋 PRECONDITION_FAILED（含中文詳細說明）

### 7. `toggleStatus` (mutation) — 第 316~336 行

- **權限**: `supervisorProcedure`
- **Input Schema**: `{ id: string.min(1) }`
- **回傳**: 更新後的 ExpenseCategory
- **業務邏輯**: 切換 isActive（true <-> false）

---

## 匯出的 Zod Schemas

此 Router 無匯出的 Zod Schemas（皆為檔案內部定義）。

---

## 使用的 Prisma Models

| Model | 操作 |
|-------|------|
| `ExpenseCategory` | 讀/寫（完整 CRUD + toggleStatus） |

_count 聚合查詢涉及 `ExpenseItem` 和 `OMExpense`（CHANGE-003 統一計數）

---

## 跨 Router 依賴

- 無直接調用其他 Router
- 被 expense Router 和 omExpense Router 引用（透過 categoryId 外鍵）

---

## 特殊模式

- **Supervisor 專用**: create, update, delete, toggleStatus 使用 `supervisorProcedure`
- **級聯保護**: delete 前檢查 expenseItems 和 omExpenses 關聯
- **唯一性檢查**: code 唯一（大寫字母+數字+底線格式）
- **統一類別**: CHANGE-003 讓 ExpenseItem 和 OMExpense 共用同一套類別
- **分頁+搜尋**: getAll 支援完整分頁和多欄位搜尋
