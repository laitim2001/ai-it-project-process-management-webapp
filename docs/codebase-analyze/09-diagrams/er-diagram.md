# ER 關聯圖

本文件描述 IT 專案流程管理平台的資料庫 Entity-Relationship 圖。共 31 個 Prisma Model，按業務領域分組呈現。資料來源為 `packages/db/prisma/schema.prisma`。

---

## 1. 完整 ER 總覽 (精簡版)

此圖以精簡方式展示所有 31 個 Model 之間的關聯關係，不顯示欄位細節。

```mermaid
erDiagram
    User ||--o{ Project : "manages (ProjectManager)"
    User ||--o{ Project : "supervises (Supervisor)"
    User ||--o{ Account : "has"
    User ||--o{ Session : "has"
    User ||--o{ Comment : "writes"
    User ||--o{ History : "creates"
    User ||--o{ Notification : "receives"
    User ||--o{ UserPermission : "has"
    User ||--o{ UserOperatingCompany : "assigned"
    User }o--|| Role : "belongs to"

    Role ||--o{ RolePermission : "has defaults"
    Permission ||--o{ RolePermission : "assigned to role"
    Permission ||--o{ UserPermission : "assigned to user"

    BudgetPool ||--o{ BudgetCategory : "contains"
    BudgetPool ||--o{ Project : "funds"
    BudgetCategory ||--o{ Project : "categorizes"
    BudgetCategory ||--o{ Expense : "tracks"
    BudgetCategory ||--o{ ProjectBudgetCategory : "syncs"

    Project ||--o{ BudgetProposal : "has"
    Project ||--o{ Quote : "receives"
    Project ||--o{ PurchaseOrder : "generates"
    Project ||--o{ ChargeOut : "charges"
    Project ||--o{ ProjectChargeOutOpCo : "targets"
    Project ||--o{ ProjectBudgetCategory : "requests"

    BudgetProposal ||--o{ Comment : "has"
    BudgetProposal ||--o{ History : "tracks"

    Vendor ||--o{ Quote : "submits"
    Vendor ||--o{ PurchaseOrder : "supplies"
    Quote ||--o{ PurchaseOrder : "becomes"

    PurchaseOrder ||--o{ PurchaseOrderItem : "contains"
    PurchaseOrder ||--o{ Expense : "incurs"

    Expense ||--o{ ExpenseItem : "contains"
    ExpenseItem ||--o{ ChargeOutItem : "charged via"

    ChargeOut ||--o{ ChargeOutItem : "contains"
    OperatingCompany ||--o{ ChargeOut : "billed to"
    OperatingCompany ||--o{ ProjectChargeOutOpCo : "targeted by"
    OperatingCompany ||--o{ UserOperatingCompany : "accessed by"
    OperatingCompany ||--o{ OMExpenseItem : "assigned to"

    OMExpense ||--o{ OMExpenseItem : "contains"
    OMExpenseItem ||--o{ OMExpenseMonthly : "tracks monthly"

    ExpenseCategory ||--o{ OMExpense : "categorizes"
    ExpenseCategory ||--o{ ExpenseItem : "classifies"

    Currency ||--o{ Project : "denominates"
    Currency ||--o{ BudgetPool : "denominates"
    Currency ||--o{ PurchaseOrder : "denominates"
    Currency ||--o{ Expense : "denominates"
    Currency ||--o{ OMExpenseItem : "denominates"
```

---

## 2. 認證與權限領域 (Auth Domain)

包含使用者、角色、NextAuth 模型，以及 FEAT-011 的權限管理系統。

```mermaid
erDiagram
    User {
        string id PK "UUID"
        string email UK "唯一"
        datetime emailVerified "可空"
        string name "可空"
        string image "可空"
        string password "可空, bcrypt hash"
        int roleId FK "預設 1"
        datetime createdAt
        datetime updatedAt
    }

    Role {
        int id PK "自增"
        string name UK "ProjectManager/Supervisor/Admin"
    }

    Account {
        string id PK "UUID"
        string userId FK
        string type "oauth/credentials"
        string provider "azure-ad-b2c"
        string providerAccountId
        string refresh_token "Text, 可空"
        string access_token "Text, 可空"
        int expires_at "可空"
        string id_token "Text, 可空"
    }

    Session {
        string id PK "UUID"
        string sessionToken UK
        string userId FK
        datetime expires
    }

    VerificationToken {
        string identifier
        string token UK
        datetime expires
    }

    Permission {
        string id PK "UUID"
        string code UK "如 menu:dashboard"
        string name "權限名稱"
        string category "menu/project/proposal"
        string description "可空"
        boolean isActive "預設 true"
        int sortOrder "預設 0"
    }

    RolePermission {
        string id PK "UUID"
        int roleId FK
        string permissionId FK
    }

    UserPermission {
        string id PK "UUID"
        string userId FK
        string permissionId FK
        boolean granted "true=授予, false=撤銷"
        string createdBy "可空"
    }

    User }o--|| Role : "belongs to"
    User ||--o{ Account : "has (onDelete: Cascade)"
    User ||--o{ Session : "has (onDelete: Cascade)"
    User ||--o{ UserPermission : "has (onDelete: Cascade)"
    Role ||--o{ RolePermission : "has defaults (onDelete: Cascade)"
    Permission ||--o{ RolePermission : "assigned (onDelete: Cascade)"
    Permission ||--o{ UserPermission : "assigned (onDelete: Cascade)"
```

---

## 3. 預算與專案領域 (Budget Domain)

包含預算池、預算類別、專案、預算提案，以及審批相關的評論和歷史記錄。

```mermaid
erDiagram
    BudgetPool {
        string id PK "UUID"
        string name
        float totalAmount "DEPRECATED"
        float usedAmount "DEPRECATED, 預設 0"
        int financialYear
        string description "可空"
        string currencyId FK "可空"
    }

    BudgetCategory {
        string id PK "UUID"
        string budgetPoolId FK
        string categoryName "如 Hardware, Software"
        string categoryCode "可空, 如 HW, SW"
        float totalAmount
        float usedAmount "預設 0"
        int sortOrder "預設 0"
        boolean isActive "預設 true"
    }

    Project {
        string id PK "UUID"
        string name
        string description "可空"
        string status "Draft/InProgress/Completed/Archived"
        string managerId FK
        string supervisorId FK
        string budgetPoolId FK
        string budgetCategoryId FK "可空"
        float requestedBudget "可空"
        float approvedBudget "可空"
        string projectCode UK
        string globalFlag "Region/RCL"
        string priority "High/Medium/Low"
        string projectType "Project/Budget"
        string expenseType "Expense/Capital/Collection"
        boolean isOngoing "預設 false"
        int fiscalYear "可空"
    }

    ProjectBudgetCategory {
        string id PK "UUID"
        string projectId FK
        string budgetCategoryId FK
        float requestedAmount "預設 0"
        int sortOrder
        boolean isActive
    }

    BudgetProposal {
        string id PK "UUID"
        string title
        float amount
        string status "Draft/PendingApproval/Approved/Rejected/MoreInfoRequired"
        string projectId FK
        float approvedAmount "可空"
        string approvedBy FK "可空"
        datetime approvedAt "可空"
        string rejectionReason "可空, Text"
    }

    Comment {
        string id PK "UUID"
        string content
        string userId FK
        string budgetProposalId FK
        datetime createdAt
    }

    History {
        string id PK "UUID"
        string action "SUBMITTED/APPROVED/REJECTED/MORE_INFO_REQUIRED"
        string details "可空"
        string userId FK
        string budgetProposalId FK
        datetime createdAt
    }

    BudgetPool ||--o{ BudgetCategory : "contains (onDelete: Cascade)"
    BudgetPool ||--o{ Project : "funds"
    BudgetCategory ||--o{ Project : "categorizes"
    BudgetCategory ||--o{ ProjectBudgetCategory : "syncs"
    Project ||--o{ BudgetProposal : "has"
    Project ||--o{ ProjectBudgetCategory : "requests (onDelete: Cascade)"
    BudgetProposal ||--o{ Comment : "has"
    BudgetProposal ||--o{ History : "tracks"
```

---

## 4. 採購與供應商領域 (Procurement Domain)

包含供應商、報價單、採購單及其明細。

```mermaid
erDiagram
    Vendor {
        string id PK "UUID"
        string name UK
        string contactPerson "可空"
        string contactEmail "可空"
        string phone "可空"
    }

    Quote {
        string id PK "UUID"
        string filePath
        datetime uploadDate
        float amount
        string vendorId FK
        string projectId FK
    }

    PurchaseOrder {
        string id PK "UUID"
        string poNumber UK "cuid()"
        string name
        string description "可空, Text"
        datetime date
        float totalAmount "由明細計算"
        string currencyId FK "可空"
        string status "Draft/Submitted/Approved/Completed/Cancelled"
        string projectId FK
        string vendorId FK
        string quoteId FK "可空"
        datetime approvedDate "可空"
    }

    PurchaseOrderItem {
        string id PK "UUID"
        string purchaseOrderId FK
        string itemName
        string description "可空, Text"
        int quantity
        float unitPrice
        float subtotal "quantity * unitPrice"
        int sortOrder "預設 0"
    }

    Vendor ||--o{ Quote : "submits"
    Vendor ||--o{ PurchaseOrder : "supplies"
    Quote ||--o{ PurchaseOrder : "linked to"
    PurchaseOrder ||--o{ PurchaseOrderItem : "contains (onDelete: Cascade)"
```

---

## 5. 費用領域 (Expense Domain)

包含費用、費用明細、費用轉嫁 (ChargeOut)。

```mermaid
erDiagram
    Expense {
        string id PK "UUID"
        string name
        string description "可空, Text"
        float totalAmount "由明細計算"
        string currencyId FK "可空"
        string status "Draft/Submitted/Approved/Paid"
        string invoiceNumber "可空"
        datetime invoiceDate
        string invoiceFilePath "可空"
        boolean requiresChargeOut "預設 false"
        boolean isOperationMaint "預設 false"
        string purchaseOrderId FK
        string budgetCategoryId FK "可空"
        string vendorId FK "可空"
    }

    ExpenseItem {
        string id PK "UUID"
        string expenseId FK
        string itemName
        string description "可空, Text"
        float amount
        string category "可空, 舊欄位"
        string categoryId FK "可空, → ExpenseCategory"
        string chargeOutOpCoId FK "可空, → OperatingCompany"
        int sortOrder "預設 0"
    }

    ChargeOut {
        string id PK "UUID"
        string name
        string description "可空, Text"
        string projectId FK
        string opCoId FK
        float totalAmount "由明細計算"
        string status "Draft/Submitted/Confirmed/Paid/Rejected"
        string debitNoteNumber UK "可空"
        datetime issueDate "可空"
        datetime paymentDate "可空"
        string confirmedBy FK "可空"
        datetime confirmedAt "可空"
    }

    ChargeOutItem {
        string id PK "UUID"
        string chargeOutId FK
        string expenseItemId FK "可空"
        string expenseId FK "可空, 向後兼容"
        float amount
        string description "可空, Text"
        int sortOrder "預設 0"
    }

    ExpenseCategory {
        string id PK "UUID"
        string code UK "HW/SW/MAINT/LICENSE"
        string name
        string description "可空"
        int sortOrder "預設 0"
        boolean isActive "預設 true"
    }

    Expense ||--o{ ExpenseItem : "contains (onDelete: Cascade)"
    ExpenseItem ||--o{ ChargeOutItem : "charged via"
    ChargeOut ||--o{ ChargeOutItem : "contains (onDelete: Cascade)"
    ExpenseCategory ||--o{ ExpenseItem : "classifies"
```

---

## 6. OM 費用領域 (OM Domain)

包含 FEAT-007 重構後的三層架構：OMExpense (表頭) -> OMExpenseItem (明細) -> OMExpenseMonthly (月度記錄)。

```mermaid
erDiagram
    OMExpense {
        string id PK "UUID"
        string name
        string description "可空, Text"
        int financialYear
        string category "舊欄位"
        string categoryId FK "可空, → ExpenseCategory"
        float totalBudgetAmount "預設 0, 自動匯總"
        float totalActualSpent "預設 0, 自動匯總"
        string defaultOpCoId FK "可空"
        string vendorId FK "可空"
        string sourceExpenseId FK "可空, CHANGE-001"
        float yoyGrowthRate "可空"
    }

    OMExpenseItem {
        string id PK "UUID"
        string omExpenseId FK
        string name "如 TGT-DC, RDC2"
        string description "可空, Text"
        int sortOrder "預設 0, 拖曳排序"
        float budgetAmount
        float actualSpent "預設 0"
        float lastFYActualExpense "可空, FEAT-008"
        string currencyId FK "可空"
        string opCoId FK
        datetime startDate "可空"
        datetime endDate "可空"
        boolean isOngoing "預設 false, CHANGE-011"
    }

    OMExpenseMonthly {
        string id PK "UUID"
        string omExpenseItemId FK "可空"
        string omExpenseId FK "可空, DEPRECATED"
        int month "1-12"
        float actualAmount
        string opCoId FK
    }

    OMExpense ||--o{ OMExpenseItem : "contains (onDelete: Cascade)"
    OMExpenseItem ||--o{ OMExpenseMonthly : "tracks monthly (onDelete: Cascade)"
    OMExpense ||--o{ OMExpenseMonthly : "legacy relation (DEPRECATED)"
```

---

## 7. 系統輔助領域 (System Domain)

包含營運公司、貨幣、通知，以及使用者與營運公司的權限關聯。

```mermaid
erDiagram
    OperatingCompany {
        string id PK "UUID"
        string code UK "如 OpCo-HK"
        string name
        string description "可空"
        boolean isActive "預設 true"
    }

    ProjectChargeOutOpCo {
        string id PK "UUID"
        string projectId FK
        string opCoId FK
    }

    UserOperatingCompany {
        string id PK "UUID"
        string userId FK
        string operatingCompanyId FK
        string createdBy "可空"
    }

    Currency {
        string id PK "UUID"
        string code UK "ISO 4217: TWD, USD, EUR"
        string name "新台幣, 美元"
        string symbol "NT$, $"
        float exchangeRate "可空"
        boolean active "預設 true"
    }

    Notification {
        string id PK "UUID"
        string userId FK
        string type "PROPOSAL_SUBMITTED/APPROVED/..."
        string title
        string message
        string link "可空"
        boolean isRead "預設 false"
        boolean emailSent "預設 false"
        string entityType "可空, PROPOSAL/EXPENSE/PROJECT"
        string entityId "可空"
        datetime createdAt
    }

    OperatingCompany ||--o{ ProjectChargeOutOpCo : "targeted by (onDelete: Cascade)"
    OperatingCompany ||--o{ UserOperatingCompany : "accessed by (onDelete: Cascade)"
    OperatingCompany ||--o{ ChargeOut : "billed to"
    OperatingCompany ||--o{ OMExpenseItem : "assigned to"
    OperatingCompany ||--o{ OMExpenseMonthly : "tracks"
```

---

## 8. Model 統計

| 領域 | Model 數量 | Models |
|------|-----------|--------|
| 認證與權限 | 8 | User, Role, Account, Session, VerificationToken, Permission, RolePermission, UserPermission |
| 預算與專案 | 6 | BudgetPool, BudgetCategory, Project, ProjectBudgetCategory, BudgetProposal, Comment, History |
| 採購與供應商 | 4 | Vendor, Quote, PurchaseOrder, PurchaseOrderItem |
| 費用管理 | 4 | Expense, ExpenseItem, ExpenseCategory, ChargeOut, ChargeOutItem |
| OM 費用 | 3 | OMExpense, OMExpenseItem, OMExpenseMonthly |
| 系統輔助 | 5 | OperatingCompany, ProjectChargeOutOpCo, UserOperatingCompany, Currency, Notification |
| **總計** | **31** | |
