# Round 6: ER Diagram Complete Verification

> 驗證日期：2026-04-09
> 驗證對象：`docs/codebase-analyze/09-diagrams/er-diagram.md` vs `packages/db/prisma/schema.prisma`
> 驗證範圍：模型覆蓋率、關聯完整度、欄位準確性、領域分組

---

## Set A: Complete Model Coverage

### A1. Schema.prisma — All 32 Models

| # | Model Name | Schema Line |
|---|-----------|-------------|
| 1 | User | L19 |
| 2 | Account | L52 |
| 3 | Session | L72 |
| 4 | VerificationToken | L83 |
| 5 | Role | L91 |
| 6 | Permission | L106 |
| 7 | RolePermission | L127 |
| 8 | UserPermission | L143 |
| 9 | BudgetPool | L165 |
| 10 | Project | L184 |
| 11 | BudgetProposal | L260 |
| 12 | Vendor | L296 |
| 13 | Quote | L311 |
| 14 | PurchaseOrder | L329 |
| 15 | Expense | L358 |
| 16 | Comment | L409 |
| 17 | History | L423 |
| 18 | Notification | L443 |
| 19 | OperatingCompany | L471 |
| 20 | ProjectChargeOutOpCo | L502 |
| 21 | UserOperatingCompany | L521 |
| 22 | BudgetCategory | L539 |
| 23 | ProjectBudgetCategory | L574 |
| 24 | PurchaseOrderItem | L606 |
| 25 | ExpenseItem | L629 |
| 26 | ExpenseCategory | L669 |
| 27 | OMExpense | L689 |
| 28 | OMExpenseItem | L763 |
| 29 | OMExpenseMonthly | L806 |
| 30 | ChargeOut | L856 |
| 31 | ChargeOutItem | L898 |
| 32 | Currency | L932 |

**Actual model count: 32**

### A2. ER Diagram — Models Mentioned Across All 7 Diagrams

| # | Model in ER Diagram | Exists in Schema? | Which Diagram |
|---|---------------------|-------------------|---------------|
| 1 | User | YES | 2 (Auth) |
| 2 | Role | YES | 2 (Auth) |
| 3 | Account | YES | 2 (Auth) |
| 4 | Session | YES | 2 (Auth) |
| 5 | VerificationToken | YES | 2 (Auth) |
| 6 | Permission | YES | 2 (Auth) |
| 7 | RolePermission | YES | 2 (Auth) |
| 8 | UserPermission | YES | 2 (Auth) |
| 9 | BudgetPool | YES | 3 (Budget) |
| 10 | BudgetCategory | YES | 3 (Budget) |
| 11 | Project | YES | 3 (Budget) |
| 12 | ProjectBudgetCategory | YES | 3 (Budget) |
| 13 | BudgetProposal | YES | 3 (Budget) |
| 14 | Comment | YES | 3 (Budget) |
| 15 | History | YES | 3 (Budget) |
| 16 | Vendor | YES | 4 (Procurement) |
| 17 | Quote | YES | 4 (Procurement) |
| 18 | PurchaseOrder | YES | 4 (Procurement) |
| 19 | PurchaseOrderItem | YES | 4 (Procurement) |
| 20 | Expense | YES | 5 (Expense) |
| 21 | ExpenseItem | YES | 5 (Expense) |
| 22 | ChargeOut | YES | 5 (Expense) |
| 23 | ChargeOutItem | YES | 5 (Expense) |
| 24 | ExpenseCategory | YES | 5 (Expense) |
| 25 | OMExpense | YES | 6 (OM) |
| 26 | OMExpenseItem | YES | 6 (OM) |
| 27 | OMExpenseMonthly | YES | 6 (OM) |
| 28 | OperatingCompany | YES | 7 (System) |
| 29 | ProjectChargeOutOpCo | YES | 7 (System) |
| 30 | UserOperatingCompany | YES | 7 (System) |
| 31 | Currency | YES | 7 (System) |
| 32 | Notification | YES | 7 (System) |

**All 32 models appear in the ER diagrams. No phantom models. No models missing from diagrams.**

### A3. Model Count Error

The ER diagram file states "31 個 Prisma Model" in two places:

| Location in er-diagram.md | Stated | Actual | Verdict |
|---------------------------|--------|--------|---------|
| Line 3 (header text) | 31 | 32 | **WRONG** |
| Section 8 table total (line 512) | 31 | 32 | **WRONG** |

The Section 8 statistics table also has internal count/name mismatches:

| Domain | Stated Count | Names Listed | Actual Count | Verdict |
|--------|-------------|--------------|-------------|---------|
| 認證與權限 | 8 | User, Role, Account, Session, VerificationToken, Permission, RolePermission, UserPermission | 8 | CORRECT |
| 預算與專案 | 6 | BudgetPool, BudgetCategory, Project, ProjectBudgetCategory, BudgetProposal, Comment, History | 7 | **WRONG** (says 6, lists 7) |
| 採購與供應商 | 4 | Vendor, Quote, PurchaseOrder, PurchaseOrderItem | 4 | CORRECT |
| 費用管理 | 4 | Expense, ExpenseItem, ExpenseCategory, ChargeOut, ChargeOutItem | 5 | **WRONG** (says 4, lists 5) |
| OM 費用 | 3 | OMExpense, OMExpenseItem, OMExpenseMonthly | 3 | CORRECT |
| 系統輔助 | 5 | OperatingCompany, ProjectChargeOutOpCo, UserOperatingCompany, Currency, Notification | 5 | CORRECT |

The "6" and "4" are undercounts that cause the total to show 31 instead of 32.

---

## Set B: Complete Relationship Coverage

### B1. All 58 FK Relationships in Schema.prisma

Each entry is a concrete FK (the side with `fields: [...], references: [...]`).

| # | From Model | To Model | FK Field | Relation Name | onDelete |
|---|-----------|----------|----------|---------------|----------|
| R1 | User | Role | roleId | (implicit) | default |
| R2 | Account | User | userId | (implicit) | Cascade |
| R3 | Session | User | userId | (implicit) | Cascade |
| R4 | RolePermission | Role | roleId | (implicit) | Cascade |
| R5 | RolePermission | Permission | permissionId | (implicit) | Cascade |
| R6 | UserPermission | User | userId | (implicit) | Cascade |
| R7 | UserPermission | Permission | permissionId | (implicit) | Cascade |
| R8 | BudgetPool | Currency | currencyId | BudgetPoolCurrency | default |
| R9 | Project | User | managerId | ProjectManager | default |
| R10 | Project | User | supervisorId | Supervisor | default |
| R11 | Project | BudgetPool | budgetPoolId | (implicit) | default |
| R12 | Project | BudgetCategory | budgetCategoryId | (implicit) | default |
| R13 | Project | Currency | currencyId | ProjectCurrency | SetNull |
| R14 | BudgetProposal | Project | projectId | (implicit) | default |
| R15 | BudgetProposal | User | approvedBy | ProposalApprover | default |
| R16 | Quote | Vendor | vendorId | (implicit) | default |
| R17 | Quote | Project | projectId | (implicit) | default |
| R18 | PurchaseOrder | Project | projectId | (implicit) | default |
| R19 | PurchaseOrder | Vendor | vendorId | (implicit) | default |
| R20 | PurchaseOrder | Quote | quoteId | (implicit) | default |
| R21 | PurchaseOrder | Currency | currencyId | PurchaseOrderCurrency | default |
| R22 | Expense | PurchaseOrder | purchaseOrderId | (implicit) | default |
| R23 | Expense | BudgetCategory | budgetCategoryId | (implicit) | default |
| R24 | Expense | Vendor | vendorId | (implicit) | default |
| R25 | Expense | Currency | currencyId | ExpenseCurrency | default |
| R26 | Comment | User | userId | (implicit) | default |
| R27 | Comment | BudgetProposal | budgetProposalId | (implicit) | default |
| R28 | History | User | userId | (implicit) | default |
| R29 | History | BudgetProposal | budgetProposalId | (implicit) | default |
| R30 | Notification | User | userId | (implicit) | default |
| R31 | ProjectChargeOutOpCo | Project | projectId | (implicit) | Cascade |
| R32 | ProjectChargeOutOpCo | OperatingCompany | opCoId | (implicit) | Cascade |
| R33 | UserOperatingCompany | User | userId | (implicit) | Cascade |
| R34 | UserOperatingCompany | OperatingCompany | operatingCompanyId | (implicit) | Cascade |
| R35 | BudgetCategory | BudgetPool | budgetPoolId | (implicit) | Cascade |
| R36 | ProjectBudgetCategory | Project | projectId | (implicit) | Cascade |
| R37 | ProjectBudgetCategory | BudgetCategory | budgetCategoryId | (implicit) | Restrict |
| R38 | PurchaseOrderItem | PurchaseOrder | purchaseOrderId | (implicit) | Cascade |
| R39 | ExpenseItem | Expense | expenseId | (implicit) | Cascade |
| R40 | ExpenseItem | ExpenseCategory | categoryId | (implicit) | default |
| R41 | ExpenseItem | OperatingCompany | chargeOutOpCoId | ChargeOutExpenseItems | default |
| R42 | OMExpense | OperatingCompany | defaultOpCoId | OMExpenseDefaultOpCo | default |
| R43 | OMExpense | OperatingCompany | opCoId | OMExpenseLegacyOpCo | default |
| R44 | OMExpense | Vendor | vendorId | (implicit) | default |
| R45 | OMExpense | ExpenseCategory | categoryId | (implicit) | default |
| R46 | OMExpense | Expense | sourceExpenseId | DerivedOMExpenses | default |
| R47 | OMExpenseItem | OMExpense | omExpenseId | (implicit) | Cascade |
| R48 | OMExpenseItem | OperatingCompany | opCoId | OMExpenseItemOpCo | default |
| R49 | OMExpenseItem | Currency | currencyId | OMExpenseItemCurrency | default |
| R50 | OMExpenseMonthly | OMExpenseItem | omExpenseItemId | (implicit) | Cascade |
| R51 | OMExpenseMonthly | OMExpense | omExpenseId | LegacyOMExpenseMonthly | Cascade |
| R52 | OMExpenseMonthly | OperatingCompany | opCoId | (implicit) | default |
| R53 | ChargeOut | Project | projectId | (implicit) | default |
| R54 | ChargeOut | OperatingCompany | opCoId | (implicit) | default |
| R55 | ChargeOut | User | confirmedBy | ChargeOutConfirmer | default |
| R56 | ChargeOutItem | ChargeOut | chargeOutId | (implicit) | Cascade |
| R57 | ChargeOutItem | ExpenseItem | expenseItemId | (implicit) | default |
| R58 | ChargeOutItem | Expense | expenseId | (implicit) | default |

### B2. All 48 Diagram Arrows (Deduplicated Across All 7 Diagrams)

| # | From | To | Label | Diagram(s) |
|---|------|----|-------|------------|
| D1 | User | Project | "manages (ProjectManager)" | 1 |
| D2 | User | Project | "supervises (Supervisor)" | 1 |
| D3 | User | Account | "has" | 1, 2 |
| D4 | User | Session | "has" | 1, 2 |
| D5 | User | Comment | "writes" | 1 |
| D6 | User | History | "creates" | 1 |
| D7 | User | Notification | "receives" | 1 |
| D8 | User | UserPermission | "has" | 1, 2 |
| D9 | User | UserOperatingCompany | "assigned" | 1 |
| D10 | User | Role | "belongs to" | 1, 2 |
| D11 | Role | RolePermission | "has defaults" | 1, 2 |
| D12 | Permission | RolePermission | "assigned to role" | 1, 2 |
| D13 | Permission | UserPermission | "assigned to user" | 1, 2 |
| D14 | BudgetPool | BudgetCategory | "contains" | 1, 3 |
| D15 | BudgetPool | Project | "funds" | 1, 3 |
| D16 | BudgetCategory | Project | "categorizes" | 1, 3 |
| D17 | BudgetCategory | Expense | "tracks" | 1 |
| D18 | BudgetCategory | ProjectBudgetCategory | "syncs" | 1, 3 |
| D19 | Project | BudgetProposal | "has" | 1, 3 |
| D20 | Project | Quote | "receives" | 1 |
| D21 | Project | PurchaseOrder | "generates" | 1 |
| D22 | Project | ChargeOut | "charges" | 1 |
| D23 | Project | ProjectChargeOutOpCo | "targets" | 1 |
| D24 | Project | ProjectBudgetCategory | "requests" | 1, 3 |
| D25 | BudgetProposal | Comment | "has" | 1, 3 |
| D26 | BudgetProposal | History | "tracks" | 1, 3 |
| D27 | Vendor | Quote | "submits" | 1, 4 |
| D28 | Vendor | PurchaseOrder | "supplies" | 1, 4 |
| D29 | Quote | PurchaseOrder | "becomes/linked to" | 1, 4 |
| D30 | PurchaseOrder | PurchaseOrderItem | "contains" | 1, 4 |
| D31 | PurchaseOrder | Expense | "incurs" | 1 |
| D32 | Expense | ExpenseItem | "contains" | 1, 5 |
| D33 | ExpenseItem | ChargeOutItem | "charged via" | 1, 5 |
| D34 | ChargeOut | ChargeOutItem | "contains" | 1, 5 |
| D35 | OperatingCompany | ChargeOut | "billed to" | 1, 7 |
| D36 | OperatingCompany | ProjectChargeOutOpCo | "targeted by" | 1, 7 |
| D37 | OperatingCompany | UserOperatingCompany | "accessed by" | 1, 7 |
| D38 | OperatingCompany | OMExpenseItem | "assigned to" | 1, 7 |
| D39 | OMExpense | OMExpenseItem | "contains" | 1, 6 |
| D40 | OMExpenseItem | OMExpenseMonthly | "tracks monthly" | 1, 6 |
| D41 | ExpenseCategory | OMExpense | "categorizes" | 1 |
| D42 | ExpenseCategory | ExpenseItem | "classifies" | 1, 5 |
| D43 | Currency | Project | "denominates" | 1 |
| D44 | Currency | BudgetPool | "denominates" | 1 |
| D45 | Currency | PurchaseOrder | "denominates" | 1 |
| D46 | Currency | Expense | "denominates" | 1 |
| D47 | Currency | OMExpenseItem | "denominates" | 1 |
| D48 | OMExpense | OMExpenseMonthly | "legacy relation (DEPRECATED)" | 6 |

### B3. Cross-Reference: Schema Relations vs ER Diagram Arrows

| Rel # | From | To | FK | In Diagram? | Matched By |
|-------|------|----|-----|-------------|------------|
| R1 | User | Role | roleId | YES | D10 |
| R2 | Account | User | userId | YES | D3 |
| R3 | Session | User | userId | YES | D4 |
| R4 | RolePermission | Role | roleId | YES | D11 |
| R5 | RolePermission | Permission | permissionId | YES | D12 |
| R6 | UserPermission | User | userId | YES | D8 |
| R7 | UserPermission | Permission | permissionId | YES | D13 |
| R8 | BudgetPool | Currency | currencyId | YES | D44 |
| R9 | Project | User (manager) | managerId | YES | D1 |
| R10 | Project | User (supervisor) | supervisorId | YES | D2 |
| R11 | Project | BudgetPool | budgetPoolId | YES | D15 |
| R12 | Project | BudgetCategory | budgetCategoryId | YES | D16 |
| R13 | Project | Currency | currencyId | YES | D43 |
| R14 | BudgetProposal | Project | projectId | YES | D19 |
| R15 | BudgetProposal | User | approvedBy | **MISSING** | -- |
| R16 | Quote | Vendor | vendorId | YES | D27 |
| R17 | Quote | Project | projectId | YES | D20 |
| R18 | PurchaseOrder | Project | projectId | YES | D21 |
| R19 | PurchaseOrder | Vendor | vendorId | YES | D28 |
| R20 | PurchaseOrder | Quote | quoteId | YES | D29 |
| R21 | PurchaseOrder | Currency | currencyId | YES | D45 |
| R22 | Expense | PurchaseOrder | purchaseOrderId | YES | D31 |
| R23 | Expense | BudgetCategory | budgetCategoryId | YES | D17 |
| R24 | Expense | Vendor | vendorId | **MISSING** | -- |
| R25 | Expense | Currency | currencyId | YES | D46 |
| R26 | Comment | User | userId | YES | D5 |
| R27 | Comment | BudgetProposal | budgetProposalId | YES | D25 |
| R28 | History | User | userId | YES | D6 |
| R29 | History | BudgetProposal | budgetProposalId | YES | D26 |
| R30 | Notification | User | userId | YES | D7 |
| R31 | ProjectChargeOutOpCo | Project | projectId | YES | D23 |
| R32 | ProjectChargeOutOpCo | OperatingCompany | opCoId | YES | D36 |
| R33 | UserOperatingCompany | User | userId | YES | D9 |
| R34 | UserOperatingCompany | OperatingCompany | operatingCompanyId | YES | D37 |
| R35 | BudgetCategory | BudgetPool | budgetPoolId | YES | D14 |
| R36 | ProjectBudgetCategory | Project | projectId | YES | D24 |
| R37 | ProjectBudgetCategory | BudgetCategory | budgetCategoryId | YES | D18 |
| R38 | PurchaseOrderItem | PurchaseOrder | purchaseOrderId | YES | D30 |
| R39 | ExpenseItem | Expense | expenseId | YES | D32 |
| R40 | ExpenseItem | ExpenseCategory | categoryId | YES | D42 |
| R41 | ExpenseItem | OperatingCompany | chargeOutOpCoId | **MISSING** | -- |
| R42 | OMExpense | OperatingCompany | defaultOpCoId | **MISSING** | -- |
| R43 | OMExpense | OperatingCompany | opCoId (legacy) | **MISSING** | -- |
| R44 | OMExpense | Vendor | vendorId | **MISSING** | -- |
| R45 | OMExpense | ExpenseCategory | categoryId | YES | D41 |
| R46 | OMExpense | Expense | sourceExpenseId | **MISSING** | -- |
| R47 | OMExpenseItem | OMExpense | omExpenseId | YES | D39 |
| R48 | OMExpenseItem | OperatingCompany | opCoId | YES | D38 |
| R49 | OMExpenseItem | Currency | currencyId | YES | D47 |
| R50 | OMExpenseMonthly | OMExpenseItem | omExpenseItemId | YES | D40 |
| R51 | OMExpenseMonthly | OMExpense | omExpenseId (legacy) | YES | D48 |
| R52 | OMExpenseMonthly | OperatingCompany | opCoId | YES | D7-line497 |
| R53 | ChargeOut | Project | projectId | YES | D22 |
| R54 | ChargeOut | OperatingCompany | opCoId | YES | D35 |
| R55 | ChargeOut | User | confirmedBy | **MISSING** | -- |
| R56 | ChargeOutItem | ChargeOut | chargeOutId | YES | D34 |
| R57 | ChargeOutItem | ExpenseItem | expenseItemId | YES | D33 |
| R58 | ChargeOutItem | Expense | expenseId (legacy) | **MISSING** | -- |

### B4. Phantom Relationship Check

Every one of the 48 diagram arrows maps to a real schema relationship. **0 phantom relationships.**

### B5. Missing Relationships Summary

**9 out of 58 schema relationships (15.5%) are MISSING from the ER diagrams:**

| # | Rel | From | To | FK Field | Named Relation | Why It Matters |
|---|-----|------|----|----------|----------------|----------------|
| 1 | R15 | BudgetProposal | User | approvedBy | ProposalApprover | Shows who approved a proposal |
| 2 | R24 | Expense | Vendor | vendorId | (implicit) | Direct vendor link on expense records |
| 3 | R41 | ExpenseItem | OperatingCompany | chargeOutOpCoId | ChargeOutExpenseItems | CHANGE-002: per-item charge-out target |
| 4 | R42 | OMExpense | OperatingCompany | defaultOpCoId | OMExpenseDefaultOpCo | FEAT-007: default OpCo for new items |
| 5 | R43 | OMExpense | OperatingCompany | opCoId | OMExpenseLegacyOpCo | Legacy OpCo (deprecated but still in schema) |
| 6 | R44 | OMExpense | Vendor | vendorId | (implicit) | OM Expense vendor association |
| 7 | R46 | OMExpense | Expense | sourceExpenseId | DerivedOMExpenses | CHANGE-001: source expense tracking |
| 8 | R55 | ChargeOut | User | confirmedBy | ChargeOutConfirmer | Shows who confirmed a charge-out |
| 9 | R58 | ChargeOutItem | Expense | expenseId | (implicit) | Legacy backward-compatible expense link |

---

## Set C: Field Accuracy in ER Diagrams

### C1. Phantom Fields

| Model | Field in Diagram | Exists in Schema? | Verdict |
|-------|-----------------|-------------------|---------|
| OMExpense | `hasItems` (line 408 of er-diagram.md) | **NO** — confirmed by grep: zero matches in schema.prisma | **PHANTOM FIELD** |

`hasItems Boolean @default(false)` is mentioned in the CLAUDE.md embedded documentation but does NOT appear in the actual `schema.prisma` file. The ER diagram incorrectly includes it.

### C2. Field-by-Field Verification Per Model (showing only issues)

All other fields shown in the ER diagrams were verified against schema.prisma. Below are the findings:

#### Models with COMPLETE field accuracy (no issues):
- User, Role, Account, Session, VerificationToken, Permission, RolePermission, UserPermission
- BudgetPool, BudgetCategory, ProjectBudgetCategory, BudgetProposal, Comment, History
- Vendor, Quote, PurchaseOrder, PurchaseOrderItem
- Expense, ExpenseItem, ChargeOut, ChargeOutItem, ExpenseCategory
- OMExpenseItem, OMExpenseMonthly
- OperatingCompany, ProjectChargeOutOpCo, UserOperatingCompany, Currency, Notification

#### Models with field issues:
| Model | Issue | Severity |
|-------|-------|----------|
| OMExpense | Phantom field `hasItems` shown | **HIGH** — field does not exist |
| Project | `currencyId` FK not shown in Diagram 3 entity box, but Currency->Project arrow exists in Diagram 1 | LOW — the relationship is still represented |

### C3. Fields Omitted from Diagrams (Acceptable)

Many models show a reasonable subset of fields. Commonly omitted fields across all models:
- `createdAt` / `updatedAt` timestamps (consistently omitted, acceptable)
- Account: `token_type`, `scope`, `session_state` (minor OAuth fields)
- Project: 15+ fields omitted (30+ total fields, diagram shows key 17)
- BudgetProposal: 6 fields omitted (meeting/file fields)
- OMExpense: deprecated fields `opCoId`, `budgetAmount`, `actualSpent`, `startDate`, `endDate` not individually listed but `vendorId` FK is also missing

### C4. Field Type Accuracy

All field types shown in the ER diagrams match the schema types. No type mismatches found.

---

## Set D: Domain Grouping Accuracy

### D1. Model-to-Domain Assignment

| Model | ER Diagram Domain | schema-overview.md Domain | Match? |
|-------|-------------------|---------------------------|--------|
| User | Auth (Diagram 2) | Auth & Permission | YES |
| Account | Auth (Diagram 2) | Auth & Permission | YES |
| Session | Auth (Diagram 2) | Auth & Permission | YES |
| VerificationToken | Auth (Diagram 2) | Auth & Permission | YES |
| Role | Auth (Diagram 2) | Auth & Permission | YES |
| Permission | Auth (Diagram 2) | Auth & Permission | YES |
| RolePermission | Auth (Diagram 2) | Auth & Permission | YES |
| UserPermission | Auth (Diagram 2) | Auth & Permission | YES |
| BudgetPool | Budget (Diagram 3) | Budget & Project | YES |
| BudgetCategory | Budget (Diagram 3) | System (schema-overview) | **MISMATCH** |
| Project | Budget (Diagram 3) | Budget & Project | YES |
| ProjectBudgetCategory | Budget (Diagram 3) | Budget & Project (implied) | YES |
| BudgetProposal | Budget (Diagram 3) | Budget & Project | YES |
| Comment | Budget (Diagram 3) | System | **MISMATCH** |
| History | Budget (Diagram 3) | System | **MISMATCH** |
| Vendor | Procurement (Diagram 4) | Procurement | YES |
| Quote | Procurement (Diagram 4) | Procurement | YES |
| PurchaseOrder | Procurement (Diagram 4) | Procurement | YES |
| PurchaseOrderItem | Procurement (Diagram 4) | Procurement | YES |
| Expense | Expense (Diagram 5) | Expense | YES |
| ExpenseItem | Expense (Diagram 5) | Expense | YES |
| ChargeOut | Expense (Diagram 5) | Expense | YES |
| ChargeOutItem | Expense (Diagram 5) | Expense | YES |
| ExpenseCategory | Expense (Diagram 5) | Expense | YES |
| OMExpense | OM (Diagram 6) | OM Expense | YES |
| OMExpenseItem | OM (Diagram 6) | OM Expense | YES |
| OMExpenseMonthly | OM (Diagram 6) | OM Expense | YES |
| OperatingCompany | System (Diagram 7) | System | YES |
| ProjectChargeOutOpCo | System (Diagram 7) | System | YES |
| UserOperatingCompany | System (Diagram 7) | System | YES |
| Currency | System (Diagram 7) | System | YES |
| Notification | System (Diagram 7) | System | YES |

### D2. Domain Grouping Discrepancies

| Model | ER Diagram Placement | schema-overview.md Placement | Assessment |
|-------|---------------------|------------------------------|------------|
| BudgetCategory | Budget domain (Diagram 3) | System domain | ER diagram is **more logical** — BudgetCategory belongs to BudgetPool, so placing it in Budget domain makes sense |
| Comment | Budget domain (Diagram 3) | System domain | ER diagram is **more logical** — Comment is exclusively tied to BudgetProposal |
| History | Budget domain (Diagram 3) | System domain | ER diagram is **more logical** — History is exclusively tied to BudgetProposal |

These are not errors in the ER diagram but rather reflect a reasonable domain-assignment choice. The ER diagram groups models by their primary business relationship (Comment/History belong to BudgetProposal) while schema-overview.md groups them by technical nature (they are "auxiliary" models). Both approaches are defensible.

### D3. Cross-Domain References in Diagrams

Some models appear as relationship targets in diagrams outside their primary domain, which is correct and expected:

| Model | Primary Domain | Also Referenced In |
|-------|---------------|--------------------|
| OperatingCompany | System (Diagram 7) | Expense (implicit via ChargeOut), OM (via OMExpenseItem) |
| ExpenseCategory | Expense (Diagram 5) | OM (via OMExpense) |
| Currency | System (Diagram 7) | Budget, Procurement, Expense, OM (via denominates arrows) |
| User | Auth (Diagram 2) | Budget (via Project manager/supervisor — shown in Diagram 1 only) |

---

## Summary of All Issues Found

### Critical Issues (must fix)

| # | Issue | Location | Description |
|---|-------|----------|-------------|
| 1 | **Wrong model count** | er-diagram.md line 3, line 512 | States "31 個 Prisma Model" but actual count is 32 |
| 2 | **Phantom field** | er-diagram.md line 408 (OMExpense entity) | `hasItems` field does not exist in schema.prisma |
| 3 | **Statistics table count errors** | er-diagram.md Section 8 | "預算與專案" says 6 but lists 7 names; "費用管理" says 4 but lists 5 names |

### Missing Relationships (should add)

| # | Relationship | Suggested Diagram | Arrow to Add |
|---|-------------|-------------------|--------------|
| 1 | R15: BudgetProposal -> User (approvedBy) | Diagram 1 (Overview), Diagram 3 (Budget) | `User \|\|--o{ BudgetProposal : "approves (ProposalApprover)"` |
| 2 | R24: Expense -> Vendor (vendorId) | Diagram 1 (Overview), Diagram 5 (Expense) | `Vendor \|\|--o{ Expense : "invoiced by"` |
| 3 | R41: ExpenseItem -> OperatingCompany (chargeOutOpCoId) | Diagram 1 (Overview), Diagram 5 (Expense) | `OperatingCompany \|\|--o{ ExpenseItem : "charge-out target"` |
| 4 | R42: OMExpense -> OperatingCompany (defaultOpCoId) | Diagram 1 (Overview), Diagram 6 (OM) | `OperatingCompany \|\|--o{ OMExpense : "default OpCo"` |
| 5 | R43: OMExpense -> OperatingCompany (opCoId, legacy) | Diagram 6 (OM) | `OperatingCompany \|\|--o{ OMExpense : "legacy OpCo (DEPRECATED)"` |
| 6 | R44: OMExpense -> Vendor (vendorId) | Diagram 1 (Overview), Diagram 6 (OM) | `Vendor \|\|--o{ OMExpense : "supplies"` |
| 7 | R46: OMExpense -> Expense (sourceExpenseId) | Diagram 1 (Overview), Diagram 6 (OM) | `Expense \|\|--o{ OMExpense : "source (CHANGE-001)"` |
| 8 | R55: ChargeOut -> User (confirmedBy) | Diagram 1 (Overview), Diagram 5 (Expense) | `User \|\|--o{ ChargeOut : "confirms (ChargeOutConfirmer)"` |
| 9 | R58: ChargeOutItem -> Expense (expenseId, legacy) | Diagram 5 (Expense) | `Expense \|\|--o{ ChargeOutItem : "legacy link"` |

### Accuracy Metrics

| Category | Total | Correct | Issues | Accuracy |
|----------|-------|---------|--------|----------|
| **Models** | 32 | 32 in diagrams, 0 phantom | Count text says 31 | 100% coverage, text error |
| **Relationships** | 58 | 49 shown | 9 missing | **84.5%** |
| **Phantom relationships** | 48 arrows | 48 verified | 0 phantom | **100%** |
| **Phantom fields** | ~130+ fields checked | 129+ correct | 1 phantom (`hasItems`) | **99.2%** |
| **Field types** | All shown fields | All match | 0 type mismatches | **100%** |
| **Domain grouping** | 32 models | 29 match, 3 deliberate differences | 0 errors | **100%** (differences are defensible) |

### Overall ER Diagram Accuracy: ~88%

Breakdown:
- Model coverage: 100% (all 32 models present)
- Relationship coverage: 84.5% (49/58)
- Field accuracy: 99.2% (1 phantom field)
- No phantom models or phantom relationships
- Metadata text errors (count "31" should be "32")

---

## Complete Fix List

To bring the ER diagrams to 100% accuracy, the following changes are needed:

### Text Fixes
1. Line 3: Change "31 個 Prisma Model" to "32 個 Prisma Model"
2. Section 8 table: Fix "預算與專案" count from 6 to 7
3. Section 8 table: Fix "費用管理" count from 4 to 5
4. Section 8 total: Change from 31 to 32

### Phantom Field Removal
5. Remove `hasItems` from OMExpense entity in Diagram 6 (line 408)

### Missing Relationships to Add to Diagram 1 (Overview)
6. `User ||--o{ BudgetProposal : "approves (ProposalApprover)"`
7. `Vendor ||--o{ Expense : "invoiced by"`
8. `OperatingCompany ||--o{ ExpenseItem : "charge-out target"`
9. `OperatingCompany ||--o{ OMExpense : "default OpCo"`
10. `Vendor ||--o{ OMExpense : "supplies"`
11. `Expense ||--o{ OMExpense : "derives (CHANGE-001)"`
12. `User ||--o{ ChargeOut : "confirms (ChargeOutConfirmer)"`

### Missing Relationships to Add to Domain Diagrams
13. Diagram 3 (Budget): Add `BudgetProposal -> User (approvedBy)` arrow
14. Diagram 5 (Expense): Add `Expense -> Vendor` arrow, `ExpenseItem -> OperatingCompany (chargeOutOpCoId)` arrow, `ChargeOut -> User (confirmedBy)` arrow, `ChargeOutItem -> Expense (legacy)` arrow
15. Diagram 6 (OM): Add `OMExpense -> OperatingCompany (defaultOpCoId)` arrow, `OMExpense -> OperatingCompany (opCoId, legacy)` arrow, `OMExpense -> Vendor` arrow, `OMExpense -> Expense (sourceExpenseId)` arrow

### Optional (Legacy/Deprecated Relationships)
16. R43 (OMExpense -> OperatingCompany via opCoId, legacy) — could be shown with "(DEPRECATED)" label
17. R58 (ChargeOutItem -> Expense via expenseId, legacy) — could be shown with "(DEPRECATED)" label
