# Schema 總覽

> 來源檔案：`packages/db/prisma/schema.prisma`（951 行）
> 分析日期：2026-04-09

## Generator 與 Datasource 配置

| 項目 | 設定值 |
|------|--------|
| Generator provider | `prisma-client-js` |
| binaryTargets | `["native", "linux-musl-openssl-3.0.x"]` |
| Datasource provider | `postgresql` |
| Database URL | `env("DATABASE_URL")` |

## Model 清單（共 32 個）

### 1. 認證與權限領域（Auth & Permission）— 8 個

| Model | 行號 | 欄位數 | 主鍵類型 | 用途 |
|-------|------|--------|----------|------|
| User | L19 | 10 資料欄位 + 10 關聯 | UUID | 系統使用者，整合 NextAuth + Azure AD B2C |
| Account | L52 | 12 資料欄位 | UUID | NextAuth OAuth 帳號（Azure AD B2C 連結） |
| Session | L72 | 4 資料欄位 | UUID | NextAuth 使用者會話管理 |
| VerificationToken | L83 | 3 資料欄位 | 複合唯一（無 @id） | NextAuth 信箱驗證令牌 |
| Role | L91 | 2 資料欄位 + 2 關聯 | Auto-increment Int | 使用者角色定義（Admin/Supervisor/ProjectManager） |
| Permission | L106 | 8 資料欄位 + 2 關聯 | UUID | FEAT-011 權限定義表（如 menu:dashboard） |
| RolePermission | L127 | 4 資料欄位 | UUID | 角色預設權限多對多中間表 |
| UserPermission | L143 | 6 資料欄位 | UUID | 使用者自訂權限（可覆蓋角色預設） |

### 2. 預算與專案領域（Budget & Project）— 4 個

| Model | 行號 | 欄位數 | 主鍵類型 | 用途 |
|-------|------|--------|----------|------|
| BudgetPool | L165 | 8 資料欄位 + 3 關聯 | UUID | 年度預算池，含 totalAmount（已棄用，改由 categories 計算） |
| Project | L184 | 30+ 資料欄位 + 9 關聯 | UUID | 核心專案記錄，包含 FEAT-001/006/010 擴展欄位 |
| BudgetProposal | L260 | 14 資料欄位 + 3 關聯 | UUID | 預算提案，含審批工作流（Draft→Approved/Rejected） |
| ProjectBudgetCategory | L574 | 7 資料欄位 | UUID | CHANGE-038 專案預算類別關聯（含申請金額） |

### 3. 採購與供應商領域（Procurement）— 4 個

| Model | 行號 | 欄位數 | 主鍵類型 | 用途 |
|-------|------|--------|----------|------|
| Vendor | L296 | 6 資料欄位 + 3 關聯 | UUID | 供應商主檔 |
| Quote | L311 | 7 資料欄位 + 3 關聯 | UUID | 報價單記錄（含檔案路徑） |
| PurchaseOrder | L329 | 12 資料欄位 + 5 關聯 | UUID | 採購單表頭（含狀態工作流） |
| PurchaseOrderItem | L606 | 8 資料欄位 | UUID | 採購單明細（品項、數量、單價、小計） |

### 4. 費用領域（Expense）— 5 個

| Model | 行號 | 欄位數 | 主鍵類型 | 用途 |
|-------|------|--------|----------|------|
| Expense | L358 | 17 資料欄位 + 6 關聯 | UUID | 費用表頭（含審批工作流和發票資訊） |
| ExpenseItem | L629 | 9 資料欄位 + 4 關聯 | UUID | 費用明細（含 CHANGE-002 轉嫁目標、CHANGE-003 統一類別） |
| ExpenseCategory | L669 | 7 資料欄位 + 2 關聯 | UUID | 統一費用類別（HW/SW/MAINT/LICENSE 等） |
| ChargeOut | L856 | 13 資料欄位 + 4 關聯 | UUID | 費用轉嫁表頭（向 OpCo 收費） |
| ChargeOutItem | L898 | 8 資料欄位 + 3 關聯 | UUID | 費用轉嫁明細（分攤金額） |

### 5. OM 費用領域（O&M Expense）— 3 個

| Model | 行號 | 欄位數 | 主鍵類型 | 用途 |
|-------|------|--------|----------|------|
| OMExpense | L689 | 17 資料欄位 + 7 關聯 | UUID | OM 費用表頭（FEAT-007 重構，含多個已棄用欄位） |
| OMExpenseItem | L763 | 12 資料欄位 + 4 關聯 | UUID | FEAT-007 OM 費用明細（項目預算、OpCo 歸屬） |
| OMExpenseMonthly | L806 | 7 資料欄位 + 3 關聯 | UUID | OM 費用月度支出記錄（1-12月） |

### 6. 系統與輔助領域（System）— 8 個

| Model | 行號 | 欄位數 | 主鍵類型 | 用途 |
|-------|------|--------|----------|------|
| Comment | L409 | 4 資料欄位 + 2 關聯 | UUID | 提案評論討論串 |
| History | L423 | 5 資料欄位 + 2 關聯 | UUID | 提案審計追蹤（操作歷史） |
| Notification | L443 | 10 資料欄位 + 1 關聯 | UUID | Epic 8 通知系統（含 email 發送狀態） |
| OperatingCompany | L471 | 6 資料欄位 + 7 關聯 | UUID | 營運公司主檔（如 OpCo-HK, OpCo-SG） |
| ProjectChargeOutOpCo | L502 | 4 資料欄位 | UUID | FEAT-006 專案↔OpCo 多對多中間表 |
| UserOperatingCompany | L521 | 5 資料欄位 | UUID | FEAT-009 使用者 OpCo 數據權限中間表 |
| BudgetCategory | L539 | 10 資料欄位 + 3 關聯 | UUID | 預算類別（隸屬 BudgetPool，含獨立金額追蹤） |
| Currency | L932 | 7 資料欄位 + 5 關聯 | UUID | FEAT-001 多幣別支援（ISO 4217） |

## 關聯摘要

### 核心關聯鏈（業務流程）

```
User ──→ Project ──→ BudgetProposal ──→ Comment / History
  │         │
  │         ├──→ Quote ──→ PurchaseOrder ──→ Expense
  │         │                    │               │
  │         │               PurchaseOrderItem  ExpenseItem
  │         │
  │         ├──→ ChargeOut ──→ ChargeOutItem
  │         │
  │         └──→ ProjectChargeOutOpCo ──→ OperatingCompany
  │
  ├──→ Notification
  ├──→ UserPermission ──→ Permission
  └──→ UserOperatingCompany ──→ OperatingCompany

BudgetPool ──→ BudgetCategory ──→ Project
                                    │
                              ProjectBudgetCategory

OMExpense ──→ OMExpenseItem ──→ OMExpenseMonthly
```

### 具名關聯（Named Relations）

| 關聯名 | 來源 | 目標 | 說明 |
|--------|------|------|------|
| ProjectManager | User | Project | 專案經理（managerId） |
| Supervisor | User | Project | 主管（supervisorId） |
| ProposalApprover | User | BudgetProposal | 提案批准者（approvedBy） |
| ChargeOutConfirmer | User | ChargeOut | 轉嫁確認者（confirmedBy） |
| BudgetPoolCurrency | Currency | BudgetPool | 預算池幣別 |
| ProjectCurrency | Currency | Project | 專案幣別 |
| PurchaseOrderCurrency | Currency | PurchaseOrder | 採購單幣別 |
| ExpenseCurrency | Currency | Expense | 費用幣別 |
| OMExpenseItemCurrency | Currency | OMExpenseItem | OM 明細幣別 |
| ChargeOutExpenseItems | OperatingCompany | ExpenseItem | 費用明細轉嫁目標 |
| OMExpenseItemOpCo | OperatingCompany | OMExpenseItem | OM 明細 OpCo 歸屬 |
| OMExpenseDefaultOpCo | OperatingCompany | OMExpense | OM 費用預設 OpCo |
| OMExpenseLegacyOpCo | OperatingCompany | OMExpense | OM 費用舊版 OpCo（已棄用） |
| DerivedOMExpenses | Expense | OMExpense | CHANGE-001 來源費用追蹤 |
| LegacyOMExpenseMonthly | OMExpense | OMExpenseMonthly | 舊版月度記錄關聯（已棄用） |

## 索引清單

### @unique 欄位索引

| Model | 欄位 | 類型 |
|-------|------|------|
| User | email | 單欄位 |
| Account | (provider, providerAccountId) | 複合 |
| Session | sessionToken | 單欄位 |
| VerificationToken | token | 單欄位 |
| VerificationToken | (identifier, token) | 複合 |
| Role | name | 單欄位 |
| Permission | code | 單欄位 |
| RolePermission | (roleId, permissionId) | 複合 |
| UserPermission | (userId, permissionId) | 複合 |
| Project | projectCode | 單欄位 |
| Vendor | name | 單欄位 |
| PurchaseOrder | poNumber | 單欄位 |
| ChargeOut | debitNoteNumber | 單欄位 |
| ExpenseCategory | code | 單欄位 |
| BudgetCategory | (budgetPoolId, categoryName) | 複合 |
| ProjectBudgetCategory | (projectId, budgetCategoryId) | 複合 |
| ProjectChargeOutOpCo | (projectId, opCoId) | 複合 |
| UserOperatingCompany | (userId, operatingCompanyId) | 複合 |
| OperatingCompany | code | 單欄位 |
| Currency | code | 單欄位 |
| OMExpenseMonthly | (omExpenseItemId, month) | 複合 |
| OMExpenseMonthly | (omExpenseId, month) | 複合（舊版） |

### @@index 索引（共約 80+ 個）

索引分佈最多的 Model：
- **Project**：16 個 @@index（含 FEAT-001/006/010 擴展欄位索引）
- **Expense**：7 個 @@index
- **OMExpense**：7 個 @@index
- **OMExpenseMonthly**：4 個 @@index
- **Notification**：4 個 @@index（含複合 entityType+entityId）

## 枚舉模式

本專案不使用 Prisma enum，所有狀態欄位以 String 儲存，由 API 層 Zod schema 驗證：

| Model | 欄位 | 可能值 |
|-------|------|--------|
| Project | status | Draft, InProgress, Completed, Archived |
| Project | globalFlag | RCL, Region |
| Project | priority | High, Medium, Low |
| Project | projectType | Project, Budget |
| Project | expenseType | Expense, Capital, Collection |
| Project | probability | High, Medium, Low |
| BudgetProposal | status | Draft, PendingApproval, Approved, Rejected, MoreInfoRequired |
| PurchaseOrder | status | Draft, Submitted, Approved, Completed, Cancelled |
| Expense | status | Draft, Submitted, Approved, Paid |
| ChargeOut | status | Draft, Submitted, Confirmed, Paid, Rejected |
| History | action | SUBMITTED, APPROVED, REJECTED, MORE_INFO_REQUIRED |
| Notification | type | PROPOSAL_SUBMITTED, PROPOSAL_APPROVED, PROPOSAL_REJECTED, PROPOSAL_MORE_INFO, EXPENSE_SUBMITTED, EXPENSE_APPROVED |

## 已棄用欄位（@deprecated）

| Model | 欄位 | 說明 | 替代方案 |
|-------|------|------|----------|
| BudgetPool | totalAmount | 改由 categories 計算 | SUM(BudgetCategory.totalAmount) |
| BudgetPool | usedAmount | 改由 categories 計算 | SUM(BudgetCategory.usedAmount) |
| OMExpense | opCoId | FEAT-007 | items.opCoId |
| OMExpense | budgetAmount | FEAT-007 | totalBudgetAmount（由 items 計算） |
| OMExpense | actualSpent | FEAT-007 | totalActualSpent（由 items 計算） |
| OMExpense | startDate | FEAT-007 | items.startDate |
| OMExpense | endDate | FEAT-007 | items.endDate |
| OMExpenseMonthly | omExpenseId | FEAT-007 | omExpenseItemId |

## 級聯刪除策略

| 關聯 | 策略 | 說明 |
|------|------|------|
| Account → User | Cascade | 刪除使用者時一同刪除 OAuth 帳號 |
| Session → User | Cascade | 刪除使用者時一同刪除會話 |
| RolePermission → Role/Permission | Cascade | 刪除角色或權限時一同刪除 |
| UserPermission → User/Permission | Cascade | 刪除使用者或權限時一同刪除 |
| BudgetCategory → BudgetPool | Cascade | 刪除預算池時一同刪除類別 |
| ProjectBudgetCategory → Project | Cascade | 刪除專案時一同刪除 |
| ProjectBudgetCategory → BudgetCategory | Restrict | 有關聯時禁止刪除 |
| ProjectChargeOutOpCo → Project/OpCo | Cascade | 刪除專案或 OpCo 時一同刪除 |
| UserOperatingCompany → User/OpCo | Cascade | 刪除使用者或 OpCo 時一同刪除 |
| PurchaseOrderItem → PurchaseOrder | Cascade | 刪除 PO 時一同刪除明細 |
| ExpenseItem → Expense | Cascade | 刪除費用時一同刪除明細 |
| OMExpenseItem → OMExpense | Cascade | 刪除 OM 費用時一同刪除明細 |
| OMExpenseMonthly → OMExpenseItem | Cascade | 刪除明細時一同刪除月度記錄 |
| OMExpenseMonthly → OMExpense | Cascade | 舊版級聯（向後兼容） |
| ChargeOutItem → ChargeOut | Cascade | 刪除轉嫁表頭時一同刪除明細 |
| Project → Currency | SetNull | 刪除幣別時設為 null |
