# project Router 詳細分析

> **檔案路徑**: `packages/api/src/routers/project.ts`
> **行數**: 2634 行
> **模組**: `api/routers/project`
> **功能**: 專案完整生命週期管理（核心 Router）

---

## 概述

最大的 Router 之一，管理專案從建立到 Charge Out 完成的完整生命週期。包含 FEAT-001（欄位擴展）、FEAT-006（Project Summary）、FEAT-010（Project Import）等多個功能增強。

---

## 匯出的 Zod Schemas / Enums

| Schema/Enum | 用途 |
|-------------|------|
| `projectStatusEnum` | `z.enum(['Draft', 'InProgress', 'Completed', 'Archived'])` |
| `globalFlagEnum` | `z.enum(['RCL', 'Region'])` (FEAT-001) |
| `priorityEnum` | `z.enum(['High', 'Medium', 'Low'])` (FEAT-001) |
| `projectTypeEnum` | `z.enum(['Project', 'Budget'])` (FEAT-006) |
| `expenseTypeEnum` | `z.enum(['Expense', 'Capital', 'Collection'])` (FEAT-006) |
| `probabilityEnum` | `z.enum(['High', 'Medium', 'Low'])` (FEAT-006) |
| `createProjectSchema` | 建立專案（27+ 欄位） |
| `updateProjectSchema` | 更新專案（所有可選） |

---

## Procedures 清單（共 25 個）

### 1. `getAll` (query) — 行 225
- **權限**: protectedProcedure
- **Input** (可選):
  - `page` (預設 1), `limit` (預設 20, max 100), `search`, `status`, `budgetPoolId`, `managerId`, `supervisorId`
  - FEAT-001: `projectCode`, `globalFlag`, `priority`, `currencyId`
  - FEAT-010: `fiscalYear`
  - CHANGE-034: `projectCategory`
  - `sortBy`: enum (name, status, createdAt, projectCode, priority, fiscalYear)
  - `sortOrder`: asc/desc
- **回傳**: `{ items, pagination: {total, page, limit, totalPages} }`
- **關鍵業務邏輯**: 搜尋同時匹配 name 和 projectCode；並行執行查詢和計數

### 2. `getById` (query) — 行 383
- **權限**: protectedProcedure
- **Input**: `{ id: string (uuid) }`
- **回傳**: 完整 Project（含 manager, supervisor, budgetPool, budgetCategory, currency, proposals, purchaseOrders, chargeOutOpCos）

### 3. `getByBudgetPool` (query) — 行 495
- **權限**: protectedProcedure
- **Input**: `{ budgetPoolId: string (uuid) }`
- **回傳**: Project[]（按 name 排序）

### 4. `getBudgetUsage` (query) — 行 549
- **權限**: protectedProcedure
- **Input**: `{ projectId: string (uuid) }`
- **回傳**: `{ projectId, projectName, requestedBudget, approvedBudget, actualSpent, utilizationRate, remainingBudget, budgetCategory }`
- **關鍵業務邏輯**: actualSpent 聚合 Approved + Paid 的 Expense；utilizationRate = actualSpent / approvedBudget * 100

### 5. `create` (mutation) — 行 638
- **權限**: protectedProcedure
- **Input**: `createProjectSchema`（27+ 欄位，含 FEAT-001/006/010 擴展）
- **回傳**: 完整 Project（含所有關聯）
- **關鍵業務邏輯**: 驗證 budgetCategoryId 屬於 budgetPoolId 且 isActive；使用 transaction 建立專案 + chargeOutOpCos 多對多關係

### 6. `update` (mutation) — 行 802
- **權限**: protectedProcedure
- **Input**: `updateProjectSchema`
- **回傳**: 完整 Project
- **關鍵業務邏輯**: 驗證 budgetCategoryId 與 budgetPoolId 關聯；transaction 更新專案 + 替換 chargeOutOpCos 關係

### 7. `delete` (mutation) — 行 958
- **權限**: protectedProcedure
- **Input**: `{ id: string (uuid) }`
- **回傳**: 被刪除的 Project
- **關鍵業務邏輯** (CHANGE-019):
  - 只允許刪除 Draft 狀態
  - 只有 manager 或 Admin 可刪除
  - 檢查 proposals, purchaseOrders, quotes, chargeOuts 關聯
  - Transaction 刪除 ProjectChargeOutOpCo + Project

### 8. `deleteMany` (mutation) — 行 1060
- **權限**: protectedProcedure
- **Input**: `{ ids: string[] (uuid, min 1) }`
- **回傳**: `{ success, deletedCount }`
- **關鍵業務邏輯**: 同 delete 的所有檢查，批量執行

### 9. `getStats` (query) — 行 1166
- **權限**: protectedProcedure
- **Input**: `{ id: string (uuid) }`
- **回傳**: `{ totalProposals, approvedProposals, totalProposedAmount, approvedAmount, totalPurchaseOrders, totalPurchaseAmount, totalExpenses, totalExpenseAmount, paidExpenseAmount }`

### 10. `export` (query) — 行 1258
- **權限**: protectedProcedure
- **Input** (可選): `{ search, status, budgetPoolId, managerId, supervisorId }`
- **回傳**: Project[]（不分頁，用於 CSV/Excel 導出）

### 11. `chargeOut` (mutation) — 行 1333
- **權限**: protectedProcedure
- **Input**: `{ id: string (uuid) }`
- **回傳**: 更新後的 Project
- **關鍵業務邏輯**: 驗證非 Completed/Archived；驗證有費用記錄且全部 Paid；更新狀態為 Completed + 記錄 chargeOutDate

### 12. `checkCodeAvailability` (query) — 行 1446
- **權限**: protectedProcedure
- **Input**: `{ projectCode: string, excludeProjectId?: string (uuid) }`
- **回傳**: `{ available: boolean, message: string }`

### 13. `getProjectSummary` (query) — 行 1502
- **權限**: protectedProcedure
- **Input** (可選): `{ financialYear?: number, budgetCategoryIds?: string[] (uuid) }`
- **回傳**: `{ projects, summary (按 budgetCategory 分組), financialYear }`

### 14. `getProjectCategories` (query) — 行 1627
- **權限**: protectedProcedure
- **Input**: 無
- **回傳**: `{ categories: string[] }` (所有不重複的 projectCategory)

### 15. `getByProjectCodes` (query) — 行 1672
- **權限**: protectedProcedure
- **Input**: `{ projectCodes: string[] }`
- **回傳**: `Array<{id, projectCode, name, fiscalYear}>`

### 16. `importProjects` (mutation) — 行 1717
- **權限**: protectedProcedure
- **Input**:
  - `projects`: array of 導入欄位（fiscalYear, projectCategory, name, projectCode, 等 20+ 欄位）
  - `defaultManagerId`, `defaultSupervisorId`, `defaultBudgetPoolId` (皆可選)
- **回傳**: `{ success, totalProcessed, created, updated, skipped, errors, warnings }`
- **關鍵業務邏輯**: 自動查找 BudgetCategory/Currency/OpCo 映射；支援新建和更新（根據 projectCode）；使用 Transaction（5 分鐘超時）

### 17. `getFiscalYears` (query) — 行 2082
- **權限**: protectedProcedure
- **Input**: 無
- **回傳**: `{ fiscalYears: number[] }` (降序排列)

### 18. `getProjectCategories` (query, CHANGE-034 版) — 行 2118
- **權限**: protectedProcedure
- **Input**: 無
- **回傳**: `{ projectCategories: string[] }`
- **備註**: 與第 14 號重複定義，此版本為 CHANGE-034 更新版

### 19. `syncBudgetCategories` (mutation) — 行 2160
- **權限**: protectedProcedure
- **Input**: `{ projectId: string }`
- **回傳**: ProjectBudgetCategory[]（含 budgetCategory）
- **關鍵業務邏輯** (CHANGE-038): 同步 BudgetPool 的類別到 Project；保留現有金額；新類別預設金額 0；Pool 中不存在的類別標記 inactive；使用 Transaction

### 20. `getProjectBudgetCategories` (query) — 行 2278
- **權限**: protectedProcedure
- **Input**: `{ projectId: string }`
- **回傳**: ProjectBudgetCategory[]（含 budgetCategory 詳情）

### 21. `getOthersRequestedAmounts` (query) — 行 2318
- **權限**: protectedProcedure
- **Input**: `{ budgetPoolId: string, excludeProjectId?: string }`
- **回傳**: `Record<budgetCategoryId, totalOthersRequested>`
- **關鍵業務邏輯** (CHANGE-039): 計算同一 BudgetPool 下其他專案的 requestedAmount 總和

### 22. `updateProjectBudgetCategory` (mutation) — 行 2361
- **權限**: protectedProcedure
- **Input**: `{ id: string, requestedAmount: number (>= 0) }`
- **回傳**: ProjectBudgetCategory（含 budgetCategory）

### 23. `batchUpdateProjectBudgetCategories` (mutation) — 行 2409
- **權限**: protectedProcedure
- **Input**: `{ projectId: string, categories: Array<{budgetCategoryId, requestedAmount}> }`
- **回傳**: ProjectBudgetCategory[]
- **關鍵業務邏輯** (CHANGE-038): 使用 Transaction + upsert 批量更新（舊專案可能沒有記錄）

### 24. `getProjectBudgetCategorySummary` (query) — 行 2476
- **權限**: protectedProcedure
- **Input**: `{ projectId: string }`
- **回傳**: `{ categories, summary: {totalBudgetAmount, totalRequestedAmount, categoryCount} }`

### 25. `revertToDraft` (mutation) — 行 2543
- **權限**: protectedProcedure
- **Input**: `{ id: string, reason: string }`
- **回傳**: `{ success, project }`
- **關鍵業務邏輯** (FIX-008): 僅 InProgress 可回退到 Draft；不能有 Approved 提案；僅 Admin/Supervisor/Manager 可執行；重置 approvedBudget 為 0

---

## 使用的 Prisma Models

| Model | 操作 |
|-------|------|
| `Project` | CRUD + 匯總 |
| `BudgetPool` | 讀取 |
| `BudgetCategory` | 讀取 + 驗證 |
| `BudgetProposal` | 讀取（統計） |
| `PurchaseOrder` | 讀取（統計） |
| `Expense` | 讀取（聚合） |
| `Quote` | 讀取（刪除檢查） |
| `ChargeOut` | 讀取（刪除檢查） |
| `ProjectChargeOutOpCo` | CRUD（多對多） |
| `ProjectBudgetCategory` | CRUD (CHANGE-038/039) |
| `User` | 讀取 |
| `Currency` | 讀取 |
| `OperatingCompany` | 讀取 (import) |

---

## 跨 Router 依賴

- 無直接呼叫其他 Router

---

## 顯著模式

- **多對多關係管理**: chargeOutOpCos 使用中間表 ProjectChargeOutOpCo
- **批量導入 (FEAT-010)**: 支援 Excel 導入，自動映射 BudgetCategory/Currency/OpCo
- **狀態工作流**: Draft -> InProgress -> Completed（chargeOut）-> Archived
- **權限檢查**: delete 僅限 manager 或 Admin
- **分頁 + 多條件過濾**: getAll 支援 10+ 過濾條件
- **預算追蹤**: getBudgetUsage 計算實際支出和使用率
