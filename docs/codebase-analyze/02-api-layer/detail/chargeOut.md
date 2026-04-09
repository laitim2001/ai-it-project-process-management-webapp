# chargeOut.ts - 費用轉嫁管理 Router 分析

## 基本資訊

| 項目 | 值 |
|------|-----|
| 檔案路徑 | `packages/api/src/routers/chargeOut.ts` |
| 行數 | 1,040 行 |
| Procedure 總數 | 14 個 |
| 匯入的 middleware | `protectedProcedure`, `supervisorProcedure` |
| 自 | Epic 6.5 - ChargeOut Management |

---

## Procedures 清單

### 1. `create` (mutation) — 第 127~231 行

- **權限**: `protectedProcedure`
- **Input Schema**: `createChargeOutSchema`
  - `name`: string, min(1), max(200)
  - `description`: string, optional
  - `projectId`: string, min(1)
  - `opCoId`: string, min(1)
  - `items`: array of chargeOutItemSchema, min(1)
- **回傳**: ChargeOut（含 project, opCo, items.expense）
- **業務邏輯**:
  - 驗證 Project 和 OpCo 存在
  - CHANGE-002: expenseId 可選（支援 expenseItemId）
  - 驗證 Expense 存在且 requiresChargeOut=true
  - **$transaction**: 建立 ChargeOut + ChargeOutItems
  - 自動計算 totalAmount

### 2. `update` (mutation) — 第 241~296 行

- **權限**: `protectedProcedure`
- **Input Schema**: `updateChargeOutSchema`
  - `id`: string, min(1)
  - `name`, `description`, `debitNoteNumber`, `issueDate`, `paymentDate`: 皆 optional
- **回傳**: 更新後的 ChargeOut
- **業務邏輯**: 僅 Draft 可更新基本資訊

### 3. `updateItems` (mutation) — 第 308~437 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ chargeOutId: string, items: chargeOutItemSchema[] }`
- **回傳**: 更新後的 ChargeOut
- **業務邏輯**:
  - 僅 Draft 可更新
  - **$transaction**: 刪除標記 `_delete` 的項目、更新/新增其他項目、重新計算 totalAmount

### 4. `submit` (mutation) — 第 447~504 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ id: string }`
- **回傳**: 更新後的 ChargeOut
- **業務邏輯**: Draft -> Submitted，驗證至少有一個 item

### 5. `confirm` (mutation) — 第 514~563 行

- **權限**: `supervisorProcedure`
- **Input Schema**: `{ id: string }`
- **回傳**: 更新後的 ChargeOut（含 confirmer）
- **業務邏輯**: Submitted -> Confirmed，記錄 confirmedBy 和 confirmedAt

### 6. `reject` (mutation) — 第 572~626 行

- **權限**: `supervisorProcedure`
- **Input Schema**: `{ id: string, reason?: string }`
- **回傳**: 更新後的 ChargeOut
- **業務邏輯**: Submitted -> Rejected，拒絕原因附加到 description

### 7. `markAsPaid` (mutation) — 第 635~686 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ id: string, paymentDate: string }`
- **回傳**: 更新後的 ChargeOut
- **業務邏輯**: Confirmed -> Paid，記錄 paymentDate

### 8. `getById` (query) — 第 692~738 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ id: string }`
- **回傳**: ChargeOut 完整詳情
- **業務邏輯**:
  - CHANGE-002: include expenseItem（含 chargeOutOpCo）
  - include: project (manager, supervisor), opCo, confirmer, items.expense (purchaseOrder.vendor, budgetCategory)

### 9. `getAll` (query) — 第 748~824 行

- **權限**: `protectedProcedure`
- **Input Schema**:
  - `page`: number, default(1)
  - `limit`: number, default(10), max(100)
  - `status`: ChargeOutStatusEnum, optional
  - `opCoId`: string, optional
  - `projectId`: string, optional
- **回傳**: `{ items, total, page, limit, totalPages }`
- **業務邏輯**: 支援狀態、OpCo、專案過濾；include project, opCo, confirmer, _count.items

### 10. `delete` (mutation) — 第 833~864 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ id: string }`
- **回傳**: `{ success: true, id }`
- **業務邏輯**: 僅 Draft 或 Rejected 可刪除，items 透過 Cascade 自動刪除

### 11. `deleteMany` (mutation) — 第 874~910 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ ids: string[] }`
- **回傳**: `{ deleted, skipped, errors[] }`
- **業務邏輯**: CHANGE-024 批量刪除，逐筆檢查狀態，跳過不合格項目

### 12. `revertToDraft` (mutation) — 第 921~959 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ id: string }`
- **回傳**: `{ success: true }`
- **業務邏輯**:
  - CHANGE-024: Submitted/Confirmed/Paid -> Draft
  - 清除 confirmedBy, confirmedAt, paymentDate
  - Draft/Rejected 不需要退回（可直接刪除）

### 13. `getEligibleExpenses` (query) — 第 969~1039 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ projectId?: string }`
- **回傳**: Expense[]（requiresChargeOut=true, status in Approved/Paid）
- **業務邏輯**:
  - CHANGE-002: include items 含 chargeOutOpCo
  - include: purchaseOrder (project, vendor), budgetCategory

---

## 匯出的 Zod Schemas

| Schema 名稱 | 用途 |
|---|---|
| `ChargeOutStatusEnum` | 狀態枚舉（export） |

其他 schemas（chargeOutItemSchema, createChargeOutSchema, updateChargeOutSchema, updateItemsSchema）為檔案內部使用。

---

## 使用的 Prisma Models

| Model | 操作 |
|-------|------|
| `ChargeOut` | 讀/寫（完整 CRUD + 狀態流轉） |
| `ChargeOutItem` | 讀/寫（建立、更新、刪除） |
| `Project` | 讀取（驗證存在） |
| `OperatingCompany` | 讀取（驗證存在） |
| `Expense` | 讀取（驗證 requiresChargeOut、查詢可轉嫁費用） |
| `ExpenseItem` | 讀取（CHANGE-002 關聯） |

---

## 跨 Router 依賴

- 匯入 `Prisma` 類型（from `@itpm/db`）
- 無直接調用其他 Router

---

## 特殊模式

- **審批工作流**: Draft -> Submitted -> Confirmed -> Paid（或 Rejected）
- **Supervisor 專用**: confirm 和 reject 使用 `supervisorProcedure`
- **表頭-明細架構**: ChargeOut + ChargeOutItem[]
- **批量操作**: deleteMany 支援批量刪除（含錯誤容忍）
- **狀態回退**: revertToDraft 支援從任何非 Draft/Rejected 狀態退回
- **CHANGE-002**: 支援 expenseItemId 級別的轉嫁（expenseId 可選）
- **自動計算**: totalAmount 從 items 自動累加
- **TODO**: submit, confirm, reject 有 TODO 標記待實作通知
