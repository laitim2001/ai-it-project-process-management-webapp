# Migration 歷史與資料庫維護

> 來源目錄：`packages/db/prisma/migrations/`
> 分析日期：2026-04-09

## 遷移總覽

共 **7 個遷移**（含 migration_lock.toml），時間跨度 2025-11-26 至 2026-01-27。

所有遷移均採用**冪等設計**（IF NOT EXISTS / DO $$ block），可安全重複執行。

## 遷移時間線

### 1. 20251126100000_add_currency

**日期**：2025-11-26
**功能**：FEAT-001/002 多幣別支援

**變更內容**：
- 建立 `Currency` 表（id, code, name, symbol, exchangeRate, active, createdAt, updatedAt）
- 建立 `Currency_code_key` 唯一索引和 `Currency_code_idx`, `Currency_active_idx` 一般索引
- 對 `BudgetPool`, `Project`, `PurchaseOrder`, `Expense` 四個表新增 `currencyId` 欄位（nullable）
- 建立四個表的 currencyId 外鍵約束（onDelete: SET NULL）和索引

---

### 2. 20251202100000_add_feat001_project_fields

**日期**：2025-12-02
**功能**：FEAT-001 專案欄位擴展

**變更內容**：
- 對 `Project` 表新增 `projectCode`（先 nullable → 填充臨時值 → NOT NULL）、`globalFlag`（預設 "Region"）、`priority`（預設 "Medium"）
- 為現有記錄生成臨時 projectCode（`PRJ-` + UUID 前 8 位）
- 建立 `Project_projectCode_key` 唯一約束
- 建立 projectCode, globalFlag, priority 索引

**特殊處理**：使用 PostgreSQL `DO $$ ... END $$` 區塊確保冪等性，支援在已有這些欄位的環境（如本地開發）安全執行。

---

### 3. 20251202110000_add_postmvp_tables

**日期**：2025-12-02（同日第二個遷移）
**功能**：Post-MVP 批量建表

**變更內容**（最大的一個遷移，533 行）：
- 建立 `ExpenseCategory` 表 + 8 筆預設費用類別種子資料（HW/SW/SV/MAINT/LICENSE/CLOUD/TELECOM/OTHER）
- 建立 `OperatingCompany` 表 + 4 筆預設營運公司種子資料（RCL/OpCo-HK/OpCo-SG/OpCo-TW）
- 建立 `BudgetCategory` 表（含 budgetPoolId+categoryName 複合唯一約束）
- 建立 `PurchaseOrderItem` 表（採購單明細）
- 建立 `ExpenseItem` 表（費用明細，含 categoryId/chargeOutOpCoId 外鍵）
- 建立 `OMExpense` 表（OM 費用表頭）
- 建立 `OMExpenseMonthly` 表（OM 月度記錄，含 omExpenseId+month 唯一約束）
- 建立 `ChargeOut` 表（費用轉嫁表頭，含 debitNoteNumber 唯一約束）
- 建立 `ChargeOutItem` 表（費用轉嫁明細）
- 對 `Expense` 表補充 budgetCategoryId, vendorId, requiresChargeOut, isOperationMaint, currencyId 欄位
- 對 `BudgetPool` 表補充 description, currencyId 欄位
- 對 `PurchaseOrder` 表補充 name, description, status, currencyId, approvedDate 欄位
- 建立所有相關外鍵約束和索引

---

### 4. 20251208100000_feat007_om_expense_item

**日期**：2025-12-08
**功能**：FEAT-007 OM Expense 表頭-明細架構重構

**變更內容**：
- 建立 `OMExpenseItem` 表（OM 費用明細項目）
- 建立 OMExpenseItem 的外鍵約束：omExpenseId(Cascade), opCoId(Restrict), currencyId(SetNull)
- 對 `OMExpenseMonthly` 表新增 `omExpenseItemId` 欄位並建立外鍵（Cascade）和唯一約束
- 將 `OMExpenseMonthly.omExpenseId` 改為可空（DROP NOT NULL）
- 對 `OMExpense` 表新增 `hasItems` 布林欄位（標記是否使用新架構）

---

### 5. 20251210100000_feat008_lastfy_actual_expense

**日期**：2025-12-10
**功能**：FEAT-008 上年度實際支出欄位

**變更內容**：
- 對 `OMExpenseItem` 表新增 `lastFYActualExpense` 欄位（DOUBLE PRECISION, nullable）
- 用於 Summary 年度比較功能

最小的遷移，僅 28 行。

---

### 6. 20251214100000_feat011_permission_tables

**日期**：2025-12-14
**功能**：FEAT-011 權限管理系統

**變更內容**：
- 建立 `Permission` 表（權限定義）+ code 唯一約束 + category/code/isActive 索引
- 建立 `RolePermission` 表（角色預設權限）+ roleId+permissionId 複合唯一 + 雙端 Cascade 外鍵
- 建立 `UserPermission` 表（使用者自訂權限）+ userId+permissionId 複合唯一 + 雙端 Cascade 外鍵

**注意**：此遷移未使用 IF NOT EXISTS 冪等模式，直接使用 CREATE TABLE。

---

### 7. 20260127100000_change038_project_budget_category

**日期**：2026-01-27
**功能**：CHANGE-038 專案預算類別同步

**變更內容**：
- 建立 `ProjectBudgetCategory` 表（projectId, budgetCategoryId, requestedAmount, sortOrder, isActive）
- projectId+budgetCategoryId 複合唯一約束
- project 外鍵 onDelete: Cascade, budgetCategory 外鍵 onDelete: Restrict
- projectId, budgetCategoryId, isActive 索引

最新的遷移，32 行。

---

## Seed 資料

### 主要 Seed 腳本（seed.ts）

執行指令：`pnpm db:seed`

建立的資料：

| 類別 | 內容 | 數量 |
|------|------|------|
| Role | Admin, ProjectManager, Supervisor | 3 |
| Permission | 菜單權限（menu:dashboard 等） | 18 |
| RolePermission | 角色預設權限映射 | ~50 |
| ExpenseCategory | HW, SW, SV, MAINT, LICENSE, CLOUD, TELECOM, OTHER | 8 |
| User | admin@itpm.local, pm@itpm.local, supervisor@itpm.local | 3 |
| BudgetPool | 2024/2025 IT 部門預算池 | 2 |
| Project | ERP 系統升級、雲端遷移 | 2 |
| Vendor | Microsoft Taiwan, Dell Technologies | 2 |
| BudgetProposal | 涵蓋 5 種狀態（Draft/Pending/Approved/Rejected/MoreInfo） | 6 |
| History | 審批歷史記錄 | 7 |
| Comment | 提案評論 | 7+ |

**測試帳號**：
- admin@itpm.local / admin123（管理員）
- pm@itpm.local / pm123（專案經理）
- supervisor@itpm.local / supervisor123（主管）

### 最小 Seed 腳本（seed-minimal.ts）

執行指令：`pnpm db:seed:minimal`
用途：僅建立最基本的運行所需資料，適合生產環境初始化。

## 資料庫相關腳本

| 腳本 | 路徑 | 用途 |
|------|------|------|
| db:generate | packages/db | 重新生成 Prisma Client |
| db:migrate | packages/db | 建立並應用遷移 |
| db:push | packages/db | 快速同步 Schema（不建立遷移，僅開發用） |
| db:studio | packages/db | 開啟 Prisma Studio GUI |
| db:seed | packages/db | 執行完整種子資料 |
| db:seed:minimal | packages/db | 執行最小種子資料 |
| init-db.sql | scripts/ | 資料庫初始化 SQL |
| test-db-connection.js | scripts/ | 測試資料庫連線 |

## Package 依賴

```json
{
  "dependencies": {
    "@prisma/client": "^5.9.1"
  },
  "devDependencies": {
    "bcryptjs": "^2.4.3",
    "prisma": "^5.9.1",
    "tsx": "^4.7.1"
  }
}
```

## 遷移設計模式觀察

1. **冪等設計**：遷移 1-5 大量使用 `IF NOT EXISTS`、`DO $$ ... END $$` 確保可重複執行
2. **向後兼容**：新增欄位優先設為 nullable 或提供預設值，避免破壞現有資料
3. **包含種子資料**：遷移 3 直接在 migration.sql 中 INSERT 預設費用類別和營運公司
4. **遷移頻率**：2025 年底密集開發（11月-12月 6 個遷移），2026 年 1 月 1 個
5. **漸進式 NOT NULL**：如 projectCode 欄位先 nullable → 填充預設值 → 設 NOT NULL
