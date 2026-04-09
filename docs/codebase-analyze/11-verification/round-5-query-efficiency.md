# Round 5 Verification: Database Query Efficiency & Data Integrity

**Date**: 2026-04-09
**Scope**: 17 tRPC routers, Prisma schema (31 models), seed data
**Files Analyzed**: All files in `packages/api/src/routers/*.ts`, `packages/db/prisma/schema.prisma`, `packages/db/prisma/seed.ts`

---

## Set A: Include Depth Analysis (~20 points)

### Deepest Include Chains Per Router

| Router | Max Depth | Deepest Chain | Line(s) |
|--------|-----------|---------------|---------|
| **chargeOut.ts** | **5** | `chargeOut → items → expense → purchaseOrder → vendor` AND `chargeOut → items → expenseItem → chargeOutOpCo` (in `getById`) | 697-727 |
| **expense.ts** | **4** | `expense → purchaseOrder → project → budgetPool/manager/supervisor` | 223-276 (getById), 570-617 (update) |
| **omExpense.ts** | **4** | `omExpense → sourceExpense → purchaseOrder → project` AND `omExpense → items → monthlyRecords` | 941-968, 1718-1735 |
| **budgetProposal.ts** | **3** | `proposal → project → manager/supervisor/budgetPool` AND `proposal → comments → user` | 134-158 (getAll), 182-207 (getById) |
| **budgetPool.ts** | **3** | `budgetPool → projects → proposals/purchaseOrders → expenses` (in getStats) | 433-458 |
| **dashboard.ts** | **3** | `project → purchaseOrders → expenses` (in export) | 400-448 |
| **project.ts** | **2** | `project → manager (select) / proposals / purchaseOrders → vendor` | 386-487 |
| **purchaseOrder.ts** | **2** | `purchaseOrder → project → manager/vendor` | 203+ |
| **operatingCompany.ts** | **2** | `opCo → various child relations` | 150+ |
| **notification.ts** | **1** | `notification → user` (implicit) | - |
| **vendor.ts** | **1** | Flat queries only | - |
| **quote.ts** | **2** | `quote → project → manager` | 264+ |
| **currency.ts** | **1** | `currency → referencing models count` | 300 |
| **expenseCategory.ts** | **1** | Flat queries | - |
| **permission.ts** | **2** | `permission → rolePermissions → role` | - |
| **user.ts** | **2** | `user → projects → budgetPool` | 120-132 |
| **health.ts** | **2** | `various diagnostic includes` | 336+ |

### Findings

**CRITICAL - 5-level deep include in chargeOut.ts (line 697-727)**:
```
chargeOut
  → project → manager, supervisor
  → items
    → expense → purchaseOrder → vendor, budgetCategory
    → expenseItem → chargeOutOpCo
```
This is the deepest nesting in the entire codebase. The `getById` procedure loads a full object graph across 6+ tables in a single query.

**HIGH - Unpaginated nested includes loading large datasets**:
1. **budgetProposal.ts `getAll` (line 112-165)**: Loads ALL proposals with `comments → user` and `historyItems → user` nested includes, **without pagination**. A project with many proposals could return massive payloads.
2. **dashboard.ts `export` (line 400-448)**: Loads ALL projects with `purchaseOrders → expenses` nested, no pagination. For a supervisor with hundreds of projects, this is a full table scan with nested joins.
3. **budgetPool.ts `getStats` (line 430-460)**: Loads ALL projects under a pool with nested `proposals` and `purchaseOrders → expenses`. For a large budget pool, this loads the entire financial graph.

---

## Set B: Select vs Include Patterns (~15 points)

### Counts

| Pattern | Count (approximate) |
|---------|---------------------|
| `include: {` occurrences across all routers | ~150+ |
| `select: {` occurrences across all routers | ~201 |

**Ratio**: Select is used more frequently than include overall, which is positive. However, usage is inconsistent across routers.

### Select Usage Quality by Router

| Router | Select Usage | Quality |
|--------|-------------|---------|
| **project.ts** | 73 select blocks | EXCELLENT - Almost all queries use select for User relations |
| **expense.ts** | 21 select blocks | GOOD - getById and update use select for managers |
| **purchaseOrder.ts** | 20 select blocks | GOOD |
| **quote.ts** | 17 select blocks | GOOD |
| **dashboard.ts** | 13 select blocks | MIXED - Some queries use select, export uses `include: true` |
| **budgetPool.ts** | 14 select blocks | MIXED |
| **chargeOut.ts** | 9 select blocks | MIXED |
| **budgetProposal.ts** | 0 select blocks for User | POOR - All User relations use `include: true` |
| **user.ts** | 3 select blocks | POOR |

### CRITICAL - Password Field Exposure via `include: true`

When `manager: true`, `supervisor: true`, `user: true`, or `confirmer: true` is used, **ALL fields of the User model are loaded, including the `password` hash**. This is a security concern as the password hash is sent to the frontend.

**Routers exposing password hash via `include: User: true`:**

| Router | Procedure(s) | Line(s) | User Relation |
|--------|-------------|---------|---------------|
| **budgetProposal.ts** | getAll, getById, submit, approve, reject, requestMoreInfo, revertToDraft | 137-138, 145, 153, 185-186, 193, 201, 250-251, 301-302, 355-356, 446-447, 548, 596-597, 648-649, 873-874, 879, 883 | manager, supervisor, user (comments/history) |
| **dashboard.ts** | export (PM and Supervisor paths) | 404-405, 438-439 | manager, supervisor |
| **expense.ts** | approve, reject, revertToDraft (multiple procedures) | 988-989, 1035-1036, 1134-1135, 1205, 1242 | manager, supervisor |
| **chargeOut.ts** | getAll, getById, multiple procedures | 550, 675, 700-701, 705 | confirmer, manager, supervisor |
| **project.ts** | export | 2558 | manager |

**Total: ~43 instances of `User: true` include (exposing password)**

**Routers that correctly use `select` for User relations:**
- `project.ts` (getAll, getById, create, update) - selects only `id, name, email, role`
- `expense.ts` (getAll, getById) - selects `id, name, email`
- `quote.ts` - selects `id, name`
- `purchaseOrder.ts` - selects `id, name`

### Recommendation
All `manager: true`, `supervisor: true`, `user: true`, `confirmer: true` patterns should be replaced with:
```typescript
manager: {
  select: { id: true, name: true, email: true }
}
```

---

## Set C: Transaction Isolation (~15 points)

### Complete Transaction Inventory

| Router | Procedure | Line | Operations | Scope Assessment |
|--------|-----------|------|------------|------------------|
| **project.ts** | create | 678 | Create project + createMany chargeOutOpCos + findUnique (re-read) | OK - All DB ops |
| **project.ts** | update | 858 | Delete old OpCos + update project + createMany new OpCos + sync budgetCategories + findUnique | OK - All DB ops |
| **project.ts** | delete | 1031 | Delete chargeOutOpCos + delete projectBudgetCategories + delete project | OK - Minimal scope |
| **project.ts** | updateBudgetCategories | 1130 | Multiple delete/create/update for budgetCategories | OK - Atomic batch |
| **project.ts** | bulkUpdateField | 1885 | Batch update array | OK - Simple batch |
| **project.ts** | import | 2197 | Upsert project + manage chargeOutOpCos + manage budgetCategories | OK - Multi-table sync |
| **project.ts** | bulkImport | 2422 | Loop of upsert + manage relations | MEDIUM RISK - Large loop inside transaction could hold locks long |
| **expense.ts** | create | 375 | Create expense + createMany items + findUnique | OK |
| **expense.ts** | update | 488 | Delete old items + create new items + update expense | OK |
| **expense.ts** | delete | 784 | Delete items + delete expense | OK |
| **expense.ts** | approve | 927 | Update expense status + create notification | OK |
| **expense.ts** | submitForApproval | 1022 | Update status + find manager + create notification + send email | **RISK** - Email send inside transaction |
| **expense.ts** | approve (full) | 1122 | Update status + update budget pool + create notification + send email | **RISK** - Email send inside transaction |
| **expense.ts** | reject | 1229 | Update status + create notification + send email | **RISK** - Email send inside transaction |
| **purchaseOrder.ts** | create | 297 | Create PO + createMany items + findUnique | OK |
| **purchaseOrder.ts** | update | 387 | Delete old items + create/update items + update PO | OK |
| **purchaseOrder.ts** | delete | 524 | Delete items + delete PO | OK |
| **purchaseOrder.ts** | approve | 582 | Update status | OK |
| **purchaseOrder.ts** | import (bulkCreate) | 910 | Loop of create PO + createMany items | MEDIUM RISK - Large loop |
| **omExpense.ts** | importFromExpense | 393 | Create OMExpense + create items + create monthly records | OK |
| **omExpense.ts** | createWithItems | 874 | Create OMExpense + loop create items + createMany monthly | OK |
| **omExpense.ts** | addItem | 1053 | Create item + createMany monthly + update totals | OK |
| **omExpense.ts** | removeItem | 1246 | Delete monthly + delete item + update totals | OK |
| **omExpense.ts** | updateItem | 1353 | Update item + update totals | OK |
| **omExpense.ts** | reorderItems | 1459 | Batch update sortOrder | OK |
| **omExpense.ts** | updateItemMonthlyRecords | 1538 | Upsert monthly records + update item totals + update header totals | OK |
| **omExpense.ts** | update (legacy) | 1685 | Create OMExpense + items + monthly | OK |
| **omExpense.ts** | updateMonthlyRecords (legacy) | 1892 | Loop upsert monthly + update totals | OK |
| **omExpense.ts** | delete | 2219 | Delete monthly + delete items + delete header | OK |
| **chargeOut.ts** | create | 188 | Create ChargeOut + createMany items + findUnique | OK |
| **chargeOut.ts** | update | 364 | Delete old items + createMany new items + update ChargeOut | OK |
| **budgetPool.ts** | update | 342 | Manage categories + update pool | OK |
| **budgetProposal.ts** | submit | 343 | Update status + create history + create notification + send email | **RISK** - Email inside txn |
| **budgetProposal.ts** | approve | 424 | Update proposal + update project budget + create history + notify + email | **RISK** - Email inside txn |
| **budgetProposal.ts** | addComment | 708 | Create comment (simple) | OK |
| **budgetProposal.ts** | reject | 782 | Update status + create history + notify | OK |
| **budgetProposal.ts** | revertToDraft | 858 | Update status + create history | OK |
| **operatingCompany.ts** | update | 360 | Update OpCo + manage user permissions | OK |
| **permission.ts** | setUserPermissions | 333 | Delete old + createMany new | OK |

### Critical Findings

1. **Email sends inside transactions (HIGH RISK)**: In `expense.ts` (lines 1022, 1122, 1229) and `budgetProposal.ts` (lines 343, 424), email notification calls occur inside `$transaction` blocks. If the email service is slow or fails, the transaction will hold database locks for the duration. This could cause:
   - Transaction timeouts (Prisma default: 5 seconds)
   - Database connection pool exhaustion
   - Cascading failures during email outages

2. **Bulk import loops inside transactions**: `project.ts` line 2422 and `purchaseOrder.ts` line 910 run import loops inside a single transaction. For large imports (100+ records), this could exceed the transaction timeout.

3. **No nested transactions found** - this is correct behavior.

---

## Set D: Cascade Delete Safety (~15 points)

### Cascade Delete Map

```
User (DELETE)
  ├── Account (CASCADE)           ← User.accounts
  ├── Session (CASCADE)           ← User.sessions
  ├── UserPermission (CASCADE)    ← User.permissions
  ├── UserOperatingCompany (CASCADE) ← User.operatingCompanyPermissions
  ├── Comment (NO CASCADE)        ← Would block delete
  ├── History (NO CASCADE)        ← Would block delete
  ├── Notification (NO CASCADE)   ← Would block delete
  ├── Project (NO CASCADE)        ← Would block delete (manager/supervisor)
  ├── BudgetProposal (NO CASCADE) ← Would block delete (approver)
  └── ChargeOut (NO CASCADE)      ← Would block delete (confirmer)

Role (DELETE)
  └── RolePermission (CASCADE)

Permission (DELETE)
  ├── RolePermission (CASCADE)
  └── UserPermission (CASCADE)

Project (DELETE)
  ├── ProjectChargeOutOpCo (CASCADE)
  ├── ProjectBudgetCategory (CASCADE)
  ├── BudgetProposal (NO CASCADE) ← Would block
  ├── Quote (NO CASCADE)          ← Would block
  ├── PurchaseOrder (NO CASCADE)  ← Would block
  └── ChargeOut (NO CASCADE)      ← Would block

BudgetPool (DELETE)
  └── BudgetCategory (CASCADE)    ← Chain!
      ├── Project (NO CASCADE)    ← blocks BudgetCategory delete
      ├── Expense (NO CASCADE)    ← blocks BudgetCategory delete
      └── ProjectBudgetCategory (RESTRICT) ← explicitly blocks

PurchaseOrder (DELETE)
  ├── PurchaseOrderItem (CASCADE)
  └── Expense (NO CASCADE)        ← Would block

Expense (DELETE)
  ├── ExpenseItem (CASCADE)       ← Chain!
  │   └── ChargeOutItem (NO CASCADE) ← blocks ExpenseItem delete
  ├── ChargeOutItem (NO CASCADE)  ← Would block
  └── OMExpense (NO CASCADE)      ← Would block (sourceExpense)

OMExpense (DELETE)
  └── OMExpenseItem (CASCADE)     ← Chain!
      └── OMExpenseMonthly (CASCADE) ← 3-level cascade chain

ChargeOut (DELETE)
  └── ChargeOutItem (CASCADE)

OperatingCompany (DELETE)
  ├── ProjectChargeOutOpCo (CASCADE)
  ├── UserOperatingCompany (CASCADE)
  └── ChargeOut (NO CASCADE)      ← Would block
  └── OMExpenseItem (NO CASCADE)  ← Would block
  └── OMExpenseMonthly (NO CASCADE) ← Would block
```

### Cascade Chain Analysis

**Longest cascade chain**: 3 levels
- `OMExpense → OMExpenseItem (CASCADE) → OMExpenseMonthly (CASCADE)`
- Deleting one OMExpense could cascade-delete dozens of items and hundreds of monthly records.

**Potentially dangerous cascade**:
- `BudgetPool → BudgetCategory (CASCADE)`: Deleting a budget pool cascades to all its categories. However, the BudgetCategory model has projects and expenses relations without cascade, so this would fail if categories have linked data. The budget pool delete procedure (line 399) checks for projects but **does not check for categories with linked expenses or ProjectBudgetCategory records**.

### Delete Procedure Verification

| Router | Checks Dependencies? | Quality |
|--------|----------------------|---------|
| **project.ts** | YES - checks proposals, POs, quotes, chargeOuts counts | GOOD |
| **budgetPool.ts** | PARTIAL - checks projects count only, not categories with linked data | MEDIUM |
| **user.ts** | PARTIAL - checks projects and approvals, but NOT comments, history, notifications | MEDIUM |
| **expense.ts** | YES - checks status (only Draft can be deleted) | GOOD |
| **purchaseOrder.ts** | YES - checks status (only Draft) and expense count | GOOD |
| **chargeOut.ts** | YES - checks status (only Draft) | GOOD |
| **budgetProposal.ts** | YES - checks status (only Draft) | GOOD |
| **vendor.ts** | YES - checks quotes, POs, expenses counts | GOOD |
| **omExpense.ts** | Minimal - relies on CASCADE | ACCEPTABLE |
| **operatingCompany.ts** | YES - checks related chargeOuts, OM expenses | GOOD |
| **quote.ts** | YES - checks linked POs | GOOD |
| **notification.ts** | N/A - simple delete by ID | OK |

**CRITICAL - user.ts delete uses `publicProcedure`** (line 319): The user delete endpoint has no authentication requirement. Anyone can delete any user by providing their UUID. This was already flagged in security reviews but remains unfixed.

---

## Set E: Data Integrity Constraints (~20 points)

### 1. Required Fields Without Defaults That Could Cause Insert Failures

| Model | Field | Risk |
|-------|-------|------|
| **Project** | `projectCode` (String, required, unique) | HIGH - Must be provided; no default or auto-generation. Seed data provides it manually. |
| **Project** | `startDate` (DateTime, required) | MEDIUM - No default. Must always be provided. |
| **Project** | `managerId`, `supervisorId`, `budgetPoolId` (String, required) | LOW - FK references, always provided in create schema |
| **BudgetProposal** | `title`, `amount`, `projectId` | LOW - Always required in Zod schema |
| **OMExpenseItem** | `opCoId` (String, required) | MEDIUM - Required FK, no default |
| **OMExpenseItem** | `budgetAmount` (Float, required) | LOW - Always provided |
| **OMExpenseMonthly** | `opCoId` (String, required) | MEDIUM - Required, must be consistent with parent item |
| **Notification** | `title`, `message` (String, required) | LOW - Always set programmatically |

**Key risk**: `Project.projectCode` is `@unique` and required. The Zod schema validates it, but there's no auto-generation fallback. If a user leaves it blank (despite frontend validation), the insert will fail with a Prisma error rather than a friendly message.

### 2. Unique Constraints and Race Conditions

| Model | Unique Constraint | Race Condition Risk |
|-------|-------------------|---------------------|
| **User.email** | `@unique` | LOW - Checked before insert in create procedure |
| **Project.projectCode** | `@unique` | **MEDIUM** - Checked in create procedure but between check and insert, another request could create the same code |
| **Vendor.name** | `@unique` | **MEDIUM** - Same TOCTOU (time-of-check-time-of-use) pattern |
| **PurchaseOrder.poNumber** | `@unique @default(cuid())` | LOW - Auto-generated, collision extremely unlikely |
| **ChargeOut.debitNoteNumber** | `@unique` (nullable) | LOW - Only set manually |
| **BudgetCategory [budgetPoolId, categoryName]** | `@@unique` | MEDIUM - Checked in procedure but TOCTOU possible |
| **ProjectBudgetCategory [projectId, budgetCategoryId]** | `@@unique` | LOW - Managed inside transactions |
| **ProjectChargeOutOpCo [projectId, opCoId]** | `@@unique` | LOW - Managed inside transactions |

**Note**: The TOCTOU race conditions on `User.email`, `Project.projectCode`, and `Vendor.name` are low-probability in normal use but could occur under concurrent bulk imports. The existing approach of checking first then inserting is acceptable for this application's scale, but a `try-catch` around the Prisma error would be more robust.

### 3. Float vs Decimal for Monetary Fields

**Pattern**: The entire codebase uses `Float` for ALL monetary fields. No `Decimal` type is used anywhere.

**All monetary Float fields** (27 fields across the schema):
- `BudgetPool.totalAmount`, `BudgetPool.usedAmount`
- `Project.requestedBudget`, `Project.approvedBudget`, `Project.lastFYActualExpense`
- `BudgetProposal.amount`, `BudgetProposal.approvedAmount`
- `Quote.amount`
- `PurchaseOrder.totalAmount`
- `PurchaseOrderItem.unitPrice`, `PurchaseOrderItem.subtotal`
- `Expense.totalAmount`
- `ExpenseItem.amount`
- `BudgetCategory.totalAmount`, `BudgetCategory.usedAmount`
- `ProjectBudgetCategory.requestedAmount`
- `OMExpense.totalBudgetAmount`, `OMExpense.totalActualSpent`, `OMExpense.budgetAmount`, `OMExpense.actualSpent`, `OMExpense.yoyGrowthRate`
- `OMExpenseItem.budgetAmount`, `OMExpenseItem.actualSpent`, `OMExpenseItem.lastFYActualExpense`
- `OMExpenseMonthly.actualAmount`
- `ChargeOut.totalAmount`
- `ChargeOutItem.amount`
- `Currency.exchangeRate`

**Risk Assessment**:
- `Float` (IEEE 754 double-precision) can represent values up to ~2^53 accurately for integers
- For monetary calculations, floating-point arithmetic can cause rounding errors (e.g., `0.1 + 0.2 !== 0.3`)
- **Practical impact**: For this application (IT budget management with amounts in the millions), the precision loss from Float is negligible for individual transactions. However, when summing thousands of small amounts (e.g., monthly expense records), cumulative rounding errors could reach a few cents.
- **Recommendation**: For a v2 migration, consider `Decimal @db.Decimal(15, 2)` for monetary fields. For current scale, Float is acceptable.

### 4. String Fields Storing Structured Data

**No JSON-in-string-field anti-pattern found.** The codebase does not store JSON strings in regular String fields. Structured data is properly modeled as separate tables/relations.

The only `JSON.stringify/JSON.parse` usage (omExpense.ts lines 1530, 1880) is for comparison purposes, not for storage.

### 5. Enum-like String Fields Without Zod Validation

| Model Field | Schema Values | Has Zod Enum in Router? |
|-------------|---------------|------------------------|
| **Project.status** | "Draft", "InProgress", "Completed", "Archived" | YES - `projectStatusEnum` |
| **Project.globalFlag** | "RCL", "Region" | YES - `globalFlagEnum` |
| **Project.priority** | "High", "Medium", "Low" | YES - `priorityEnum` |
| **Project.projectType** | "Project", "Budget" | YES - `projectTypeEnum` |
| **Project.expenseType** | "Expense", "Capital", "Collection" | YES - `expenseTypeEnum` |
| **Project.probability** | "High", "Medium", "Low" | YES - `probabilityEnum` |
| **BudgetProposal.status** | "Draft", "PendingApproval", "Approved", "Rejected", "MoreInfoRequired" | YES - `ProposalStatus` |
| **Expense.status** | "Draft", "Submitted", "Approved", "Paid", "Rejected" | YES - `ExpenseStatusEnum` |
| **ChargeOut.status** | "Draft", "Submitted", "Confirmed", "Paid", "Rejected" | YES - `ChargeOutStatusEnum` |
| **PurchaseOrder.status** | "Draft", "Submitted", "Approved", "Completed", "Cancelled" | **NO** - No Zod enum defined |
| **Notification.type** | "PROPOSAL_SUBMITTED", etc. | YES - `NotificationType` |
| **Notification.entityType** | "PROPOSAL", "EXPENSE", "PROJECT" | YES - `EntityType` |
| **OMExpense.category** | Free text string | **NO** - No validation (legacy field) |
| **History.action** | "SUBMITTED", "APPROVED", "REJECTED", etc. | **NO** - No Zod enum; hardcoded strings only |
| **Role.name** | "ProjectManager", "Supervisor", "Admin" | Partial - validated in `getByRole` input |

**Missing Zod enums for**:
1. `PurchaseOrder.status` - Status transitions are hardcoded as string comparisons
2. `History.action` - Action values are never validated
3. `OMExpense.category` - Legacy free-text field

---

## Set F: Seed Data vs Schema Consistency (~15 points)

### 1. Schema Compatibility

The seed file (`packages/db/prisma/seed.ts`, ~916 lines) was reviewed against the current schema.

**Compatible fields verified**:
- User: `email`, `name`, `password`, `roleId` - all match schema
- BudgetPool: `name`, `totalAmount`, `financialYear` - match (no `currencyId` set, which is nullable - OK)
- Project: `name`, `description`, `status`, `managerId`, `supervisorId`, `budgetPoolId`, `startDate`, `endDate`, `projectCode`, `globalFlag`, `priority` - all match
- BudgetProposal: `title`, `amount`, `status`, `projectId` - match
- Vendor: `name`, `contactPerson`, `contactEmail`, `phone` - match
- Quote: `filePath`, `uploadDate`, `amount`, `vendorId`, `projectId` - match
- PurchaseOrder: `poNumber`, `name`, `description`, `projectId`, `vendorId`, `quoteId`, `totalAmount`, `date` - match
- Expense: `name`, `description`, `purchaseOrderId`, `totalAmount`, `expenseDate`, `invoiceDate`, `invoiceFilePath`, `status` - match

**Potential issues**:
- Seed creates PurchaseOrder without `items` (PurchaseOrderItem). The PO has `totalAmount: 1200000` but no line items. This is inconsistent with the header-detail pattern but won't cause schema errors since items aren't required.
- Seed creates Expenses without `items` (ExpenseItem). Same issue as above.
- Seed does not create any `OperatingCompany` records, which are required by many features (ChargeOut, OMExpense). Any manual testing of these features after seeding would need manual OpCo creation first.

### 2. Lookup Table Coverage

| Lookup Table | Seeded? | Records | Notes |
|-------------|---------|---------|-------|
| **Role** | YES | 3 (Admin, ProjectManager, Supervisor) | Complete |
| **Permission** | YES | 18 menu permissions | Complete |
| **RolePermission** | YES | Admin=18, Supervisor=17, PM=11 | Complete |
| **ExpenseCategory** | YES | 8 categories (HW, SW, SV, MAINT, LICENSE, CLOUD, TELECOM, OTHER) | Complete |
| **Currency** | **NO** | 0 | MISSING - Features FEAT-001/002 require currencies |
| **OperatingCompany** | **NO** | 0 | MISSING - Required by ChargeOut, OMExpense |

**Missing seed data**:
1. **Currency** - No currencies are seeded, but `currencyId` is referenced in Project, BudgetPool, PurchaseOrder, Expense, OMExpenseItem. Testing currency features requires manual setup.
2. **OperatingCompany** - No OpCos are seeded, but they are required for ChargeOut, OMExpense, ExpenseItem charge-out targets.

### 3. Role Name Verification

The seed creates exactly these roles (via `upsert`):
- `Admin` (auto-increment ID)
- `ProjectManager` (auto-increment ID)
- `Supervisor` (auto-increment ID)

The auth system expects these exact names:
- `packages/api/src/trpc.ts` uses `ctx.session.user.role.name` for middleware checks
- `supervisorProcedure` checks for `role.name === 'Supervisor'` or `'Admin'`
- `adminProcedure` checks for `role.name === 'Admin'`
- Multiple routers check `role.name === 'ProjectManager'`

**Seed role names match auth expectations: PASS**

**Note**: The seed uses `where: { name: 'Admin' }` for upsert, relying on the `@unique` constraint on `Role.name`. The auto-increment `id` means role IDs may vary between environments. Code that checks `roleId` numerically (e.g., `@default(1)` on User) could be fragile if roles are created in different order. However, the seed creates roles consistently in the same order (Admin first), so this is low risk in practice.

### 4. Test User Role Assignments

| User | Email | Role | Password | Valid? |
|------|-------|------|----------|--------|
| Admin | admin@itpm.local | Admin (`adminRole.id`) | admin123 (bcrypt) | YES - But weak password |
| PM | pm@itpm.local | ProjectManager (`pmRole.id`) | pm123 (bcrypt) | YES - But weak password |
| Supervisor | supervisor@itpm.local | Supervisor (`supervisorRole.id`) | supervisor123 (bcrypt) | YES - But weak password |

**Note**: The seed file uses bcrypt with cost factor 10 (`bcrypt.hash(password, 10)`), while the user creation API uses cost factor 12. This inconsistency doesn't cause functional issues but means seed passwords are slightly less secure.

**Also note**: The user create API (`user.ts` line 216) uses `publicProcedure` - no authentication required to create users.

---

## Summary of Critical Findings

### Severity: CRITICAL

| # | Finding | Location | Impact |
|---|---------|----------|--------|
| C1 | **Password hash exposed in 43+ API responses** | budgetProposal.ts, dashboard.ts, expense.ts, chargeOut.ts | User password hashes sent to frontend when `User: true` include is used |
| C2 | **User CRUD uses `publicProcedure`** (no auth) | user.ts lines 92, 109, 146, 173, 216, 269, 319 | Anyone can list, create, update, and delete users without authentication |

### Severity: HIGH

| # | Finding | Location | Impact |
|---|---------|----------|--------|
| H1 | **Email sends inside database transactions** | expense.ts (1022, 1122, 1229), budgetProposal.ts (343, 424) | Email service delays/failures will cause transaction timeouts and rollbacks |
| H2 | **budgetProposal.getAll has no pagination** | budgetProposal.ts line 112-165 | Loads ALL proposals with nested comments and history; potential OOM for large datasets |
| H3 | **Dashboard export loads all projects without pagination** | dashboard.ts line 400-448 | Full table scan with nested includes for supervisor export |

### Severity: MEDIUM

| # | Finding | Location | Impact |
|---|---------|----------|--------|
| M1 | **5-level deep include chain** | chargeOut.ts line 697-727 | Performance concern for complex charge-outs with many items |
| M2 | **No Zod enum for PurchaseOrder.status** | purchaseOrder.ts | Invalid status values could be written to DB |
| M3 | **User delete doesn't check Comment/History/Notification** | user.ts line 326-344 | Delete will fail with FK violation at DB level instead of friendly error |
| M4 | **BudgetPool delete doesn't check categories with linked data** | budgetPool.ts line 399-425 | Cascade delete of categories could fail if they have linked projects/expenses |
| M5 | **All monetary fields use Float, not Decimal** | schema.prisma (27 fields) | Potential rounding errors in financial calculations at scale |
| M6 | **Seed missing Currency and OperatingCompany** | seed.ts | Post-MVP features untestable without manual data setup |
| M7 | **TOCTOU race on unique fields** | project.ts, vendor.ts, user.ts | Concurrent requests could cause duplicate key errors instead of friendly messages |

### Severity: LOW

| # | Finding | Location | Impact |
|---|---------|----------|--------|
| L1 | **No Zod enum for History.action** | budgetProposal.ts | History action values are hardcoded strings |
| L2 | **Seed password bcrypt cost differs from API** | seed.ts (10) vs user.ts (12) | Inconsistency, no functional impact |
| L3 | **Seed creates PO/Expenses without line items** | seed.ts | Inconsistent with header-detail pattern |
