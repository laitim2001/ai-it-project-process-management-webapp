# budgetPool.ts - 預算池管理 Router 分析

## 基本資訊

| 項目 | 值 |
|------|-----|
| 檔案路徑 | `packages/api/src/routers/budgetPool.ts` |
| 行數 | 688 行 |
| Procedure 總數 | 11 個 |
| 匯入的 middleware | `protectedProcedure` |
| 自 | Epic 3 - Budget and Project Setup |

---

## Procedures 清單

### 1. `getAll` (query) — 第 89~171 行

- **權限**: `protectedProcedure`
- **Input Schema** (optional object):
  - `page`: number, min(1), default(1)
  - `limit`: number, min(1), max(100), default(20)
  - `search`: string, optional
  - `financialYear`: number, int, optional
  - `sortBy`: enum('name', 'year'), default('year')
  - `sortOrder`: enum('asc', 'desc'), default('desc')
- **回傳**: `{ items: BudgetPool[] (含 computedTotalAmount, computedUsedAmount, utilizationRate), pagination: { total, page, limit, totalPages } }`
- **業務邏輯**:
  - 支援名稱模糊搜尋（case-insensitive）和財年過濾
  - include: currency, categories (isActive=true), _count.projects
  - 從 categories 累加計算 totalAmount 和 usedAmount
  - 計算 utilizationRate 百分比

### 2. `getById` (query) — 第 174~267 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ id: string.uuid() }`
- **回傳**: BudgetPool 完整資訊（含 categories 使用率、projects 列表、computedTotalAmount/UsedAmount/TotalRequested、utilizationRate）
- **業務邏輯**:
  - include: currency, categories (含 _count.projects/expenses), projects
  - CHANGE-040: 使用 `projectBudgetCategory.groupBy` 查詢各 Category 的已申請金額
  - 為每個類別計算 utilizationRate 和 totalRequestedAmount
  - 計算 Pool 級 computedTotalRequested
  - 拋出 NOT_FOUND 錯誤若 pool 不存在

### 3. `getByYear` (query) — 第 270~281 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ year: number.int() }`
- **回傳**: BudgetPool[]
- **業務邏輯**: 簡單按財年查詢，按名稱升序排列

### 4. `create` (mutation) — 第 284~319 行

- **權限**: `protectedProcedure`
- **Input Schema**: `createBudgetPoolSchema`
  - `name`: string, min(1), max(255)
  - `financialYear`: number, int, min(2000), max(2100)
  - `description`: string, optional
  - `currencyId`: string.uuid() (FEAT-002, 必填)
  - `categories`: array of budgetCategorySchema (至少 1 個)
- **回傳**: 新建的 BudgetPool（含 currency, categories）
- **業務邏輯**:
  - FEAT-002: 驗證 currency 存在且 active
  - 計算 totalAmount（從 categories 累加，存入 deprecated 欄位做向後兼容）
  - 使用 nested create 同時建立 categories

### 5. `update` (mutation) — 第 322~396 行

- **權限**: `protectedProcedure`
- **Input Schema**: `updateBudgetPoolSchema`
  - `id`: string.uuid()
  - `name`: string, min(1), max(255), optional
  - `description`: string, optional
  - `currencyId`: string.uuid(), optional (FEAT-002)
  - `categories`: array of budgetCategorySchema, optional
- **回傳**: 更新後的 BudgetPool
- **業務邏輯**:
  - FEAT-002: 驗證 currency 有效性（若提供）
  - **使用 $transaction 確保一致性**
  - categories 更新策略：有 id = 更新現有，無 id = 新增
  - 回傳含 currency、active categories

### 6. `delete` (mutation) — 第 399~425 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ id: string.uuid() }`
- **回傳**: 刪除的 BudgetPool
- **業務邏輯**:
  - **級聯刪除檢查**: 若有關聯 projects，禁止刪除
  - 使用 `throw new Error` (非 TRPCError)

### 7. `getStats` (query) — 第 428~509 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ id: string.uuid() }`
- **回傳**: `{ totalBudget, totalAllocated, totalSpent, remaining, utilizationRate, projectCount }`
- **業務邏輯**:
  - 從 categories 累加 totalBudget
  - 從 projects.proposals (Approved) 計算 totalAllocated
  - 從 projects.purchaseOrders.expenses (Approved/Paid) 計算 totalSpent
  - 計算 remaining 和 utilizationRate

### 8. `export` (query) — 第 512~547 行

- **權限**: `protectedProcedure`
- **Input Schema** (optional): `{ search?: string, year?: number.int() }`
- **回傳**: BudgetPool[]（含 _count.projects）
- **業務邏輯**: 用於 CSV/Excel 導出，支援搜尋和年份過濾

### 9. `getCategories` (query) — 第 554~578 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ budgetPoolId: string.min(1) }`
- **回傳**: BudgetCategory[]（active, 按 sortOrder 排序）
- **業務邏輯**: 查詢指定預算池的所有啟用類別

### 10. `getCategoryStats` (query) — 第 583~640 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ categoryId: string.uuid() }`
- **回傳**: `{ category, utilizationRate, remainingAmount }`
- **業務邏輯**:
  - include: budgetPool, _count(projects/expenses), projects, expenses(Approved/Paid)
  - 計算使用率和剩餘金額

### 11. `updateCategoryUsage` (mutation) — 第 645~687 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ categoryId: string.uuid(), amount: number }`
- **回傳**: 更新後的 BudgetCategory
- **業務邏輯**:
  - 內部使用（費用審批時調用）
  - 正數=增加，負數=減少
  - 增加時檢查可用預算（避免超支）
  - 使用 `increment` 操作更新 usedAmount

---

## 匯出的 Zod Schemas

| Schema 名稱 | 用途 | 主要欄位 |
|---|---|---|
| `budgetCategorySchema` | 類別 CRUD | id?, categoryName, categoryCode?, totalAmount, description?, sortOrder, isActive |
| `createBudgetPoolSchema` | 建立預算池 | name, financialYear, description?, currencyId, categories[] |
| `updateBudgetPoolSchema` | 更新預算池 | id, name?, description?, currencyId?, categories?[] |

---

## 使用的 Prisma Models

| Model | 操作 |
|-------|------|
| `BudgetPool` | 讀/寫（CRUD 全部操作） |
| `BudgetCategory` | 讀/寫（建立、更新、查詢、使用額更新） |
| `Currency` | 讀取（驗證存在性和 active 狀態） |
| `Project` | 讀取（關聯查詢、刪除檢查） |
| `BudgetProposal` | 讀取（統計：Approved proposals） |
| `PurchaseOrder` | 讀取（統計：expenses） |
| `Expense` | 讀取（統計：totalAmount） |
| `ProjectBudgetCategory` | 讀取（CHANGE-040: 申請金額 groupBy） |

---

## 跨 Router 依賴

- 無直接調用其他 Router
- `updateCategoryUsage` 設計為內部使用，供 expense Router 的審批邏輯調用

---

## 特殊模式

- **分頁**: getAll 支援完整分頁（page/limit/total/totalPages）
- **搜尋**: 支援名稱模糊搜尋（case-insensitive）
- **排序**: 支援 name 和 year 兩種排序
- **計算欄位**: computedTotalAmount, computedUsedAmount, utilizationRate（從 categories 即時累加）
- **Transaction**: update 使用 $transaction 確保表頭-明細一致性
- **級聯保護**: delete 檢查是否有關聯 projects
- **導出**: export procedure 專門為 CSV/Excel 準備數據
