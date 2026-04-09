# expense.ts - 費用記錄與審批工作流 Router 分析

## 基本資訊

| 項目 | 值 |
|------|-----|
| 檔案路徑 | `packages/api/src/routers/expense.ts` |
| 行數 | 1,382 行 |
| Procedure 總數 | 15 個 |
| 匯入的 middleware | `protectedProcedure`, `supervisorProcedure` |
| 自 | Epic 6 - Expense Recording and Approval |

---

## Procedures 清單

### 1. `getAll` (query) — 第 152~211 行

- **權限**: `protectedProcedure`
- **Input Schema**: `getExpensesQuerySchema`
  - `page`: number, default(1)
  - `limit`: number, default(10), max(100)
  - `purchaseOrderId`: string, optional
  - `status`: enum('Draft','Submitted','Approved','Paid'), optional
  - `sortBy`: enum('expenseDate','amount','createdAt'), default('expenseDate')
  - `sortOrder`: enum('asc','desc'), default('desc')
- **回傳**: `{ items: Expense[], pagination }`
- **業務邏輯**: include purchaseOrder (project, vendor, currency), currency (FEAT-002)

### 2. `getById` (query) — 第 218~287 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ id: string }`
- **回傳**: Expense 完整詳情（含 items, purchaseOrder, vendor, budgetCategory, currency）
- **業務邏輯**: CHANGE-002 include items.chargeOutOpCo

### 3. `create` (mutation) — 第 297~440 行

- **權限**: `protectedProcedure`
- **Input Schema**: `createExpenseSchema`
  - `name`: string, min(1)
  - `description`: string, optional
  - `purchaseOrderId`: string, min(1)
  - `projectId`: string, min(1)
  - `budgetCategoryId`: string, optional
  - `vendorId`: string, optional
  - `invoiceNumber`: string, min(1)
  - `invoiceDate`: date/string
  - `invoiceFilePath`: string, optional
  - `expenseDate`: date/string, optional
  - `requiresChargeOut`: boolean, default(false)
  - `isOperationMaint`: boolean, default(false)
  - `items`: expenseItemSchema[], min(1)
- **回傳**: 新建的 Expense（含 items, purchaseOrder, vendor）
- **業務邏輯**:
  - 驗證 project 和 purchaseOrder 存在
  - 驗證 projectId 與 PO 的 projectId 一致
  - FIX-006: budgetCategoryId 驗證（優先用戶輸入，否則從 project 繼承）
  - **$transaction**: 建立 expense + items
  - CHANGE-002: items 含 chargeOutOpCoId
  - 自動計算 totalAmount

### 4. `update` (mutation) — 第 450~622 行

- **權限**: `protectedProcedure`
- **Input Schema**: `updateExpenseSchema`（所有欄位 optional，含 items[]）
- **回傳**: 更新後的 Expense
- **業務邏輯**:
  - 僅 Draft 可修改
  - **$transaction**:
    - 刪除 `_delete` 標記的 items
    - 更新/新增其他 items
    - 重新計算 totalAmount
    - requiresChargeOut false->true 時清除 items 的 chargeOutOpCoId

### 5. `delete` (mutation) — 第 633~675 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ id: string }`
- **回傳**: `{ success: true, message }`
- **業務邏輯**:
  - CHANGE-023: 僅 Draft 可刪除
  - CHANGE-023: ChargeOut 關聯檢查（有 chargeOutItems 時禁止）
  - ExpenseItem 透過 Cascade 刪除

### 6. `deleteMany` (mutation) — 第 686~728 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ ids: string[] }`
- **回傳**: `{ deleted, skipped, errors[] }`
- **業務邏輯**: CHANGE-023 批量刪除，逐筆檢查狀態和 chargeOut 關聯

### 7. `revertToDraft` (mutation) — 第 743~831 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ id: string }`
- **回傳**: `{ success: true }`
- **業務邏輯**:
  - CHANGE-023/026: 任何非 Draft -> Draft
  - **$transaction（CHANGE-026 預算回沖）**:
    1. 更新狀態，清除 approvedDate, paidDate
    2. 若原狀態 Approved/Paid: **回沖 BudgetPool.usedAmount 和 BudgetCategory.usedAmount**
    3. usedAmount 不低於 0（Math.max）

### 8. `revertToApproved` (mutation) — 第 843~877 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ id: string }`
- **回傳**: `{ success: true }`
- **業務邏輯**: CHANGE-026 Phase 2: Paid -> Approved，清除 paidDate，無預算變動

### 9. `revertToSubmitted` (mutation) — 第 890~968 行

- **權限**: `supervisorProcedure`
- **Input Schema**: `{ id: string }`
- **回傳**: `{ success: true }`
- **業務邏輯**:
  - CHANGE-026 Phase 2: Approved -> Submitted
  - **$transaction**: 回沖 BudgetPool 和 BudgetCategory + 更新狀態 + 清除 approvedDate
  - 僅 Supervisor 可執行

### 10. `submit` (mutation) — 第 977~1062 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ id: string }`
- **回傳**: 更新後的 Expense
- **業務邏輯**:
  - Draft -> Submitted
  - 驗證至少有一個 item
  - **$transaction**: 更新狀態 + **建立 Notification 給 Supervisor**

### 11. `approve` (mutation) — 第 1073~1181 行

- **權限**: `supervisorProcedure`
- **Input Schema**: `{ id: string, comment?: string }`
- **回傳**: 更新後的 Expense
- **業務邏輯**:
  - Submitted -> Approved
  - **預算檢查**: usedAmount + expense.totalAmount 不可超過 budgetPool.totalAmount
  - **$transaction**:
    1. 更新費用狀態
    2. **扣除 BudgetPool.usedAmount**
    3. **增加 BudgetCategory.usedAmount**（若有 budgetCategoryId）
    4. **建立 Notification 給 Project Manager**

### 12. `reject` (mutation) — 第 1192~1268 行

- **權限**: `supervisorProcedure`
- **Input Schema**: `{ id: string, comment: string.min(1) }`
- **回傳**: 更新後的 Expense
- **業務邏輯**:
  - Submitted -> Draft（允許重新提交）
  - **$transaction**: 更新狀態 + **建立 Notification 給 PM**（含拒絕原因）

### 13. `markAsPaid` (mutation) — 第 1277~1316 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ id: string }`
- **回傳**: 更新後的 Expense
- **業務邏輯**: Approved -> Paid

### 14. `getByPurchaseOrder` (query) — 第 1323~1341 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ purchaseOrderId: string }`
- **回傳**: Expense[]
- **業務邏輯**: 按 expenseDate desc 排序

### 15. `getStats` (query) — 第 1347~1381 行

- **權限**: `protectedProcedure`
- **Input Schema**: 無
- **回傳**: `{ totalExpenses, totalAmount, byStatus[], pendingApprovalAmount, approvedAmount, paidAmount }`
- **業務邏輯**: 使用 count, aggregate, groupBy 計算全局統計

---

## 匯出的 Zod Schemas

此 Router 無匯出的 Zod Schemas（皆為檔案內部定義）。

---

## 使用的 Prisma Models

| Model | 操作 |
|-------|------|
| `Expense` | 讀/寫（完整 CRUD + 狀態流轉 + 統計） |
| `ExpenseItem` | 讀/寫（建立、更新、刪除） |
| `PurchaseOrder` | 讀取（驗證、關聯查詢） |
| `Project` | 讀取（驗證、預算池關聯） |
| `BudgetPool` | 寫入（approve 扣款、revert 回沖） |
| `BudgetCategory` | 讀/寫（approve 扣款、revert 回沖、驗證存在） |
| `Notification` | 寫入（submit/approve/reject 時建立通知） |

---

## 跨 Router 依賴

- 無直接調用其他 Router
- approve 直接操作 BudgetPool 和 BudgetCategory（未透過 budgetPool Router）

---

## 特殊模式

- **審批工作流**: Draft -> Submitted -> Approved -> Paid
- **三級退回**: revertToDraft（任意->Draft）、revertToApproved（Paid->Approved）、revertToSubmitted（Approved->Submitted）
- **預算自動扣款**: approve 時扣除 BudgetPool 和 BudgetCategory
- **預算回沖**: revert 時回沖（CHANGE-026，使用 Math.max(0,...) 防負數）
- **表頭-明細架構**: Expense + ExpenseItem[]
- **通知整合**: submit/approve/reject 直接建立 Notification
- **批量操作**: deleteMany 支援批量刪除（含錯誤容忍）
- **Supervisor 專用**: approve, reject, revertToSubmitted 使用 `supervisorProcedure`
- **CHANGE-002**: ExpenseItem 支援 chargeOutOpCoId（費用轉嫁目標）
