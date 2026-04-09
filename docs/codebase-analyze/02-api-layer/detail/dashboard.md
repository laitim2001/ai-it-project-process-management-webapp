# dashboard.ts - 儀表板數據聚合 Router 分析

## 基本資訊

| 項目 | 值 |
|------|-----|
| 檔案路徑 | `packages/api/src/routers/dashboard.ts` |
| 行數 | 522 行 |
| Procedure 總數 | 4 個 |
| 匯入的 middleware | `protectedProcedure` |
| 自 | Epic 7 - Dashboard and Basic Reporting |

---

## Procedures 清單

### 1. `getProjectManagerDashboard` (query) — 第 60~215 行

- **權限**: `protectedProcedure`
- **Input Schema**: 無（從 session 取 userId）
- **回傳**: `{ myProjects, pendingTasks: { proposalsNeedingInfo, draftExpenses }, stats }`
- **業務邏輯**:
  - 查詢當前用戶負責的專案（managerId = userId）
  - include: budgetPool, manager, supervisor, proposals (PendingApproval/MoreInfoRequired/Approved), purchaseOrders.expenses
  - 待辦任務：MoreInfoRequired 提案 + Draft 費用（限 10 筆）
  - **統計計算**:
    - totalProjects, activeProjects, completedProjects
    - pendingApprovals（PendingApproval 狀態的提案數）
    - pendingTasks（待補充提案 + 草稿費用）
    - totalBudget, usedBudget（去重後的 budgetPool 累加）

### 2. `getSupervisorDashboard` (query) — 第 226~380 行

- **權限**: `protectedProcedure`（內部檢查 Supervisor 角色）
- **Input Schema**:
  - `status`: enum('Draft','InProgress','Completed','Archived'), optional, nullable
  - `managerId`: string.uuid(), optional, nullable
  - `page`: number, min(1), default(1)
  - `limit`: number, min(1), max(100), default(20)
- **回傳**: `{ projects, pagination, stats, budgetPoolOverview }`
- **業務邏輯**:
  - **權限檢查**: 僅 Supervisor 角色可訪問（手動檢查 role.name）
  - 支援狀態和經理人過濾
  - **分頁查詢**: projects + total count 並行查詢
  - **統計**: totalProjects, activeProjects, completedProjects, archivedProjects, pendingApprovals（全局統計，多個並行 count）
  - **預算池概覽**: 所有 budgetPool 的使用率計算（id, fiscalYear, totalAmount, usedAmount, remainingAmount, usagePercentage, projectCount, activeProjectCount）

### 3. `exportProjects` (query) — 第 387~483 行

- **權限**: `protectedProcedure`
- **Input Schema**:
  - `role`: enum('ProjectManager','Supervisor')
  - `status`: string, optional, nullable
  - `managerId`: string.uuid(), optional, nullable
- **回傳**: CSV 友好格式的物件陣列（中文欄位名）
- **業務邏輯**:
  - ProjectManager 只能導出自己的專案
  - Supervisor 可導出所有（需角色檢查）
  - 轉換為 CSV 格式：專案名稱、專案經理、主管、狀態、預算池年度/總額、採購單數量、已批准費用總額、最新提案狀態、創建日期、最後更新

### 4. `getProjectManagers` (query) — 第 488~521 行

- **權限**: `protectedProcedure`（內部檢查 Supervisor 角色）
- **Input Schema**: 無
- **回傳**: `{ id, name, email, _count.projects }[]`
- **業務邏輯**:
  - 僅 Supervisor 可訪問
  - 查詢所有有專案的 ProjectManager 角色用戶
  - 按名稱升序排列

---

## 匯出的 Zod Schemas

此 Router 無匯出的 Zod Schemas。

---

## 使用的 Prisma Models

| Model | 操作 |
|-------|------|
| `Project` | 讀取（列表查詢、統計、導出） |
| `BudgetPool` | 讀取（概覽計算） |
| `BudgetProposal` | 讀取（待辦、統計） |
| `Expense` | 讀取（待辦、費用統計） |
| `User` | 讀取（專案經理列表） |
| `PurchaseOrder` | 讀取（關聯查詢） |

---

## 跨 Router 依賴

- 無直接調用其他 Router
- 是一個純**聚合**層，整合多個 model 的數據

---

## 特殊模式

- **角色分離**: PM dashboard 和 Supervisor dashboard 分開
- **內部權限檢查**: getSupervisorDashboard 和 getProjectManagers 在 procedure 內部手動檢查 `role.name !== 'Supervisor'`（未使用 supervisorProcedure middleware）
- **並行查詢**: 大量使用 `Promise.all` 優化查詢性能
- **CSV 導出**: exportProjects 返回中文欄位名的物件陣列
- **聚合計算**: 從多個 model 即時計算統計數據
- **預算池概覽**: 計算 usagePercentage, remainingAmount, projectCount 等衍生欄位
- **注意**: 使用 `any` 類型構建 where 條件（第 250、424 行）
