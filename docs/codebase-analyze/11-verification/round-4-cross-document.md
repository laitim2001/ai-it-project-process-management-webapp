# Round 4: Cross-Document Consistency Verification

> **Date**: 2026-04-09
> **Scope**: Cross-references between analysis documents in `docs/codebase-analyze/`
> **Total Checks**: ~100 points across 6 sets (A-F)

---

## Set A: Router Index vs Detail Files (~20 points)

Comparison of `02-api-layer/router-index.md` table claims vs each `detail/*.md` file.

| # | Router | Index Procedures | Detail Procedures | Index Lines | Detail Lines | Status |
|---|--------|-----------------|-------------------|-------------|--------------|--------|
| 1 | budgetPool | 11 | 11 | 688 | 688 | [CONSISTENT] |
| 2 | budgetProposal | 12 | 12 | 941 | 941 | [CONSISTENT] |
| 3 | chargeOut | 13 | **14** | 1,040 | 1,040 | [INCONSISTENT] Index says 13 procedures, detail lists 14 (create, update, updateItems, submit, confirm, reject, markAsPaid, getById, getAll, delete, deleteMany, revertToDraft, getEligibleExpenses = 13... but detail header says "共 14 個"). Detail header contradicts both the index AND its own list of 13 procedures. |
| 4 | currency | 7 | 7 | 348 | 348 | [CONSISTENT] |
| 5 | dashboard | 4 | 4 | 522 | 522 | [CONSISTENT] |
| 6 | expense | 15 | 15 | 1,382 | 1,382 | [CONSISTENT] |
| 7 | expenseCategory | 7 | 7 | 337 | 337 | [CONSISTENT] |
| 8 | health | 21 | 21 | 2,421 | 2,421 | [CONSISTENT] |
| 9 | notification | 7 | 7 | 380 | 380 | [CONSISTENT] |
| 10 | omExpense | 19 | 19 | 2,762 | 2,762 | [CONSISTENT] |
| 11 | operatingCompany | 9 | 9 | 439 | 439 | [CONSISTENT] |
| 12 | permission | 7 | 7 | 451 | 451 | [CONSISTENT] |
| 13 | project | 25 | 25 | 2,634 | 2,634 | [CONSISTENT] |
| 14 | purchaseOrder | 13 | 13 | 1,004 | 1,004 | [CONSISTENT] |
| 15 | quote | 11 | 11 | 712 | 712 | [CONSISTENT] |
| 16 | user | 13 | 13 | 519 | 519 | [CONSISTENT] |
| 17 | vendor | 6 | 6 | 347 | 347 | [CONSISTENT] |

**Index total**: 200 procedures. Sum from details: 11+12+14+7+4+15+7+21+7+19+9+7+25+13+11+13+6 = **201** (if chargeOut detail header of 14 is used) vs 200 (if actual list of 13 is used).

### Purpose Description Alignment

| Router | Index Description | Detail Description | Status |
|--------|------------------|--------------------|--------|
| budgetPool | "預算池 CRUD + 統計 + 類別管理" | "預算池管理 Router" | [CONSISTENT] |
| budgetProposal | "預算提案 CRUD + 審批工作流" | "預算提案審批工作流 Router" | [CONSISTENT] |
| chargeOut | "費用轉嫁 CRUD + 狀態機" | "費用轉嫁管理 Router" | [CONSISTENT] |
| health | "健康檢查 + Schema 診斷修復" | "健康檢查與 Schema 同步 Router" | [CONSISTENT] |
| user | "用戶 CRUD + 密碼管理" | "用戶管理 + 密碼設定 + 認證資訊查詢" | [CONSISTENT] |

**Set A Summary**: 1 inconsistency found (chargeOut procedure count: index=13, detail header=14, detail actual list=13).

---

## Set B: Page Index vs Page Detail Groups (~20 points)

Comparison of `03-frontend-pages/page-index.md` with `detail/group1-core-workflow.md`, `detail/group2-om-and-admin.md`, `detail/group3-auth-and-system.md`.

### File Count Comparison

| # | Route Module | Index Files | Detail Files | Index Lines | Detail Lines | Status |
|---|-------------|-------------|--------------|-------------|--------------|--------|
| 1 | dashboard | 3 | 3 | 1,036 | 1,036 | [CONSISTENT] |
| 2 | projects | 5 | 5 | 3,090 | 3,090 | [CONSISTENT] |
| 3 | proposals | 4 | 4 | 1,482 | 1,482 | [CONSISTENT] |
| 4 | budget-pools | 4 | 4 | 1,330 | 1,330 | [CONSISTENT] |
| 5 | expenses | 4 | 4 | 1,841 | 1,841 | [CONSISTENT] |
| 6 | charge-outs | 4 | 4 | 1,294 | (in detail) | [CONSISTENT] |
| 7 | purchase-orders | 4 | 4 | 1,650 | (in detail) | [CONSISTENT] |
| 8 | quotes | 3 | 3 | 1,517 | (in detail) | [CONSISTENT] |
| 9 | om-expenses | 4 | 4 | 1,690 | 1,690 | [CONSISTENT] |
| 10 | om-expense-categories | 3 | 3 | 448 | 448 | [CONSISTENT] |
| 11 | om-summary | 1 | 1 | 386 | 386 | [CONSISTENT] |
| 12 | data-import | 1 | 1 | 1,606 | 1,606 | [CONSISTENT] |
| 13 | project-data-import | 1 | 1 | 1,145 | 1,145 | [CONSISTENT] |
| 14 | vendors | 4 | 4 | 1,062 | 1,062 | [CONSISTENT] |
| 15 | operating-companies | 3 | 3 | 567 | 567 | [CONSISTENT] |
| 16 | users | 4 | 4 | 875 | 875 | [CONSISTENT] |
| 17 | notifications | 1 | 1 | 306 | 306 | [CONSISTENT] |
| 18 | settings | 2 | 2 | 877 | 877 | [CONSISTENT] |
| 19 | login | 1 | 1 | 269 | 269 | [CONSISTENT] |
| 20 | register | 1 | 1 | 266 | 266 | [CONSISTENT] |
| 21 | forgot-password | 1 | 1 | 194 | 194 | [CONSISTENT] |

### Index Header Totals vs Detail Headers

| Metric | Index Claims | Detail Group Headers | Status |
|--------|-------------|---------------------|--------|
| Group 1 modules | 8 | 8 | [CONSISTENT] |
| Group 1 files | 31 | 31 | [CONSISTENT] |
| Group 1 lines | ~12,240 | ~12,920 | [INCONSISTENT] Index header says "~12,240 行" but group1 detail header says "約 12,920 行". Difference of ~680 lines. |
| Group 2 modules | 8 | 8 | [CONSISTENT] |
| Group 2 files | 21 | 21 | [CONSISTENT] |
| Group 2 lines | ~7,779 | 7,779 | [CONSISTENT] |
| Group 3 modules | 7 | (5 page modules + layouts/API/middleware) | [CONSISTENT] (Index counts 7, which aligns with 5 page routes + shared system files) |
| Group 3 files | ~21 | 19 source + 1 CSS = 20 | [INCONSISTENT] Index says "~21 檔案" in the header but detail says "19 個原始碼檔案 + 1 個 CSS 檔案" = 20 actual. Minor discrepancy (~21 vs 20). |
| Group 3 lines | ~3,812 | 3,811 | [CONSISTENT] (off by 1, within rounding) |
| Total files | 62 | 31+21+~20 = ~72 | [INCONSISTENT] Index header says "62 個 .tsx 頁面檔案" but Group 3 includes layouts, API routes, and middleware which may not all be .tsx page files. The 62 likely counts only page-level .tsx files while Group 3's count includes non-page files. |

### Coverage Check: All modules in index covered in detail?

- All 21 route modules from page-index.md are covered across the three detail group files.
- [CONSISTENT] No missing modules in either direction.

**Set B Summary**: 2 minor inconsistencies (Group 1 line count difference: ~12,240 vs ~12,920; Group 3 file count: ~21 vs 20).

---

## Set C: Component Index vs Business Components Detail (~15 points)

Comparison of `04-components/component-index.md` with `04-components/detail/business-components.md`.

### Directory File Counts

| # | Directory | Index Files | Index Lines | Detail Files | Detail Lines | Status |
|---|-----------|-------------|-------------|--------------|--------------|--------|
| 1 | budget-pool/ | 3 | 975 | 3 | 975 | [CONSISTENT] |
| 2 | charge-out/ | 2 | 1,076 | 2 | 1,076 | [CONSISTENT] |
| 3 | dashboard/ | 3 | 438 | 3 | 438 | [CONSISTENT] |
| 4 | expense/ | 2 | 1,080 | 2 | 1,080 | [CONSISTENT] |
| 5 | layout/ | 5 | 1,206 | 5 | 1,206 | [CONSISTENT] |
| 6 | notification/ | 2 | 382 | 2 | 382 | [CONSISTENT] |
| 7 | om-expense/ | 5 | 3,032 | 5 | 3,032 | [CONSISTENT] |
| 8 | om-expense-category/ | 2 | 471 | 2 | 471 | [CONSISTENT] |
| 9 | om-summary/ | 3 | 1,610 | 3 | 1,610 | [CONSISTENT] |
| 10 | operating-company/ | 2 | 546 | 2 | 546 | [CONSISTENT] |
| 11 | project/ | 2 | 1,029 | 2 | 1,029 | [CONSISTENT] |
| 12 | project-summary/ | 2 | 837 | 2 | 837 | [CONSISTENT] |
| 13 | proposal/ | 5 | 1,445 | 5 | 1,445 | [CONSISTENT] |
| 14 | providers/ | 1 | 56 | 1 | 56 | [CONSISTENT] |
| 15 | purchase-order/ | 2 | 895 | 2 | 895 | [CONSISTENT] |
| 16 | quote/ | 1 | 339 | 1 | 339 | [CONSISTENT] |
| 17 | settings/ | 2 | 341 | 2 | 341 | [CONSISTENT] |
| 18 | shared/ | 2 | 359 | 2 | 359 | [CONSISTENT] |
| 19 | theme/ | 1 | 125 | 1 | 125 | [CONSISTENT] |
| 20 | user/ | 3 | 1,065 | 3 | 1,065 | [CONSISTENT] |
| 21 | vendor/ | 1 | 293 | 1 | 293 | [CONSISTENT] |

### Total Counts

| Metric | Index | Detail | Status |
|--------|-------|--------|--------|
| Directories | 21 | 21 | [CONSISTENT] |
| Total files | 51 | 51 | [CONSISTENT] |
| Total lines | 17,594 (table sum) | (individual sums match) | [INCONSISTENT] Index header says "約 17,994 行" but the table totals say "17,594". The header and table in the same document disagree by 400 lines. |

### Component Purposes Alignment

Spot-checked 10 components between index category tables and detail descriptions:

| Component | Index Purpose | Detail Purpose | Status |
|-----------|--------------|----------------|--------|
| BudgetPoolForm | "預算池表單" | "預算池建立/編輯統一表單" | [CONSISTENT] |
| ChargeOutActions | "Draft/Submitted/Confirmed/Paid/Rejected" | "ChargeOut 完整狀態流轉操作按鈕組件" | [CONSISTENT] |
| ExpenseForm | "費用記錄表頭明細表單" | "費用記錄建立/編輯表頭明細表單" | [CONSISTENT] |
| OMExpenseItemList | "明細項目列表（拖曳排序）" | "(in index Display section)" | [CONSISTENT] |
| Sidebar | "側邊欄導航（FEAT-011 權限過濾）" | "(in index Layout section)" | [CONSISTENT] |
| StatCard | "統計卡片（舊版）" | "Dashboard 統計卡片（舊版）" | [CONSISTENT] |

**Set C Summary**: 1 inconsistency (component-index.md header says ~17,994 lines but its own table totals 17,594 lines).

---

## Set D: API Layer vs Frontend Pages (~20 points)

For 10 key pages, verify that tRPC calls documented in frontend pages reference procedures that exist in the API analysis.

### Check 1: dashboard/pm - getProjectManagerDashboard

| Frontend Claim | API Doc Exists? | Auth Level Match? | Status |
|---------------|-----------------|-------------------|--------|
| `api.dashboard.getProjectManagerDashboard` | Yes (dashboard.md #1) | Frontend: protectedProcedure; API: protectedProcedure | [CONSISTENT] |

### Check 2: dashboard/supervisor - getSupervisorDashboard, getProjectManagers, exportProjects

| Frontend Claim | API Doc Exists? | Auth Level Match? | Status |
|---------------|-----------------|-------------------|--------|
| `api.dashboard.getSupervisorDashboard` | Yes (dashboard.md #2) | Both: protectedProcedure (internal role check) | [CONSISTENT] |
| `api.dashboard.getProjectManagers` | Yes (dashboard.md #4) | Both: protectedProcedure (internal role check) | [CONSISTENT] |
| `api.dashboard.exportProjects` | Yes (dashboard.md #3) | Both: protectedProcedure | [CONSISTENT] |

### Check 3: projects/page.tsx - project.getAll, project.deleteMany

| Frontend Claim | API Doc Exists? | Input Fields Match? | Status |
|---------------|-----------------|---------------------|--------|
| `api.project.getAll` (page/limit/search/status/budgetPoolId/managerId/supervisorId/sortBy/sortOrder) | Yes (project.md #1) | API has page, limit, search, status, budgetPoolId, managerId, supervisorId, projectCode, globalFlag, priority, currencyId, fiscalYear, projectCategory, sortBy, sortOrder. Frontend uses a subset. | [CONSISTENT] |
| `api.project.deleteMany` | Yes (project.md #8) | Input: `{ ids: string[] }` | [CONSISTENT] |

### Check 4: projects/[id]/page.tsx - project.getById, project.getStats, project.getBudgetUsage

| Frontend Claim | API Doc Exists? | Status |
|---------------|-----------------|--------|
| `api.project.getById` | Yes (project.md #2) | [CONSISTENT] |
| `api.project.getStats` | Yes (project.md #9) | [CONSISTENT] |
| `api.project.getBudgetUsage` | Yes (project.md #4) | [CONSISTENT] |
| `api.quote.getByProject` | Yes (quote.md #2) | [CONSISTENT] |
| `api.project.delete` | Yes (project.md #7) | [CONSISTENT] |
| `api.project.revertToDraft` | Yes (project.md #25) | [CONSISTENT] |

### Check 5: proposals/page.tsx - budgetProposal.getAll, delete, deleteMany

| Frontend Claim | API Doc Exists? | Status |
|---------------|-----------------|--------|
| `api.budgetProposal.getAll` | Yes (budgetProposal.md #1) | [CONSISTENT] |
| `api.budgetProposal.delete` | Yes (budgetProposal.md #10) | [CONSISTENT] |
| `api.budgetProposal.deleteMany` | Yes (budgetProposal.md #11) | [CONSISTENT] |

### Check 6: budget-pools/[id]/page.tsx - budgetPool.getById, getStats, delete

| Frontend Claim | API Doc Exists? | Status |
|---------------|-----------------|--------|
| `api.budgetPool.getById` | Yes (budgetPool.md #2) | [CONSISTENT] |
| `api.budgetPool.getStats` | Yes (budgetPool.md #7) | [CONSISTENT] |
| `api.budgetPool.delete` | Yes (budgetPool.md #6) | [CONSISTENT] |

### Check 7: expenses/page.tsx - expense.getAll, expense.getStats, purchaseOrder.getAll

| Frontend Claim | API Doc Exists? | Status |
|---------------|-----------------|--------|
| `api.expense.getAll` | Yes (expense.md #1) | [CONSISTENT] |
| `api.expense.getStats` | Yes (expense.md #15) | [CONSISTENT] |
| `api.purchaseOrder.getAll` | Yes (purchaseOrder.md #1) | [CONSISTENT] |
| `api.expense.delete` | Yes (expense.md #5) | [CONSISTENT] |

### Check 8: om-expenses/page.tsx - omExpense.getAll, omExpense.getCategories, omExpense.deleteMany

| Frontend Claim | API Doc Exists? | Status |
|---------------|-----------------|--------|
| `api.omExpense.getAll` | Yes (omExpense.md #13) | [CONSISTENT] |
| `api.omExpense.getCategories` | Yes (omExpense.md #16) | [CONSISTENT] |
| `api.omExpense.deleteMany` | Yes (omExpense.md #15) | [CONSISTENT] |
| `api.operatingCompany.getAll` | Yes (operatingCompany.md #4) | [CONSISTENT] |

### Check 9: settings/currencies/page.tsx - currency.getAll, create, update, toggleActive

| Frontend Claim | API Doc Exists? | Auth Match? | Status |
|---------------|-----------------|-------------|--------|
| `api.currency.getAll` | Yes (currency.md #4) | Both: protectedProcedure | [CONSISTENT] |
| `api.currency.create` | Yes (currency.md #1) | API: adminProcedure. Frontend claims Admin-only in JSDoc but no frontend guard. | [CONSISTENT] (API enforces correctly) |
| `api.currency.update` | Yes (currency.md #2) | API: adminProcedure | [CONSISTENT] |
| `api.currency.toggleActive` | Yes (currency.md #7) | API: adminProcedure | [CONSISTENT] |

### Check 10: notifications/page.tsx - notification.getAll (infinite), markAsRead, markAllAsRead, delete

| Frontend Claim | API Doc Exists? | Status |
|---------------|-----------------|--------|
| `notification.getAll` (useInfiniteQuery) | Yes (notification.md #1, cursor-based) | [CONSISTENT] |
| `notification.markAsRead` | Yes (notification.md #4) | [CONSISTENT] |
| `notification.markAllAsRead` | Yes (notification.md #5) | [CONSISTENT] |
| `notification.delete` | Yes (notification.md #6) | [CONSISTENT] |

**Set D Summary**: All 10 key pages pass. Every tRPC procedure referenced in frontend pages exists in the corresponding API router analysis. Auth levels and input schemas align. 0 inconsistencies.

---

## Set E: Database Schema vs API Router Usage (~15 points)

For each of the 32 Prisma models in schema-overview.md, verify if at least one router in API analysis references it.

| # | Model | Referenced in Router(s) | Status |
|---|-------|------------------------|--------|
| 1 | User | user, dashboard, budgetProposal, permission, operatingCompany | [CONSISTENT] |
| 2 | Account | (Auth layer, not in tRPC routers) | [CONSISTENT] (NextAuth internal) |
| 3 | Session | (Auth layer) | [CONSISTENT] (NextAuth internal) |
| 4 | VerificationToken | (Auth layer) | [CONSISTENT] (NextAuth internal) |
| 5 | Role | user (getRoles), permission (getRolePermissions) | [CONSISTENT] |
| 6 | Permission | permission router | [CONSISTENT] |
| 7 | RolePermission | permission router | [CONSISTENT] |
| 8 | UserPermission | permission router | [CONSISTENT] |
| 9 | BudgetPool | budgetPool, expense, dashboard | [CONSISTENT] |
| 10 | Project | project, dashboard, budgetProposal, expense, chargeOut, purchaseOrder, quote | [CONSISTENT] |
| 11 | BudgetProposal | budgetProposal, dashboard, project (stats) | [CONSISTENT] |
| 12 | ProjectBudgetCategory | project (sync/update/get), budgetPool (CHANGE-040 groupBy) | [CONSISTENT] |
| 13 | Vendor | vendor, purchaseOrder, quote | [CONSISTENT] |
| 14 | Quote | quote, purchaseOrder (createFromQuote), project (delete check) | [CONSISTENT] |
| 15 | PurchaseOrder | purchaseOrder, expense | [CONSISTENT] |
| 16 | PurchaseOrderItem | purchaseOrder | [CONSISTENT] |
| 17 | Expense | expense, chargeOut (getEligibleExpenses), dashboard | [CONSISTENT] |
| 18 | ExpenseItem | expense, chargeOut | [CONSISTENT] |
| 19 | ExpenseCategory | expenseCategory, omExpense (importData auto-create) | [CONSISTENT] |
| 20 | ChargeOut | chargeOut, project (delete check) | [CONSISTENT] |
| 21 | ChargeOutItem | chargeOut | [CONSISTENT] |
| 22 | OMExpense | omExpense | [CONSISTENT] |
| 23 | OMExpenseItem | omExpense | [CONSISTENT] |
| 24 | OMExpenseMonthly | omExpense | [CONSISTENT] |
| 25 | Comment | budgetProposal | [CONSISTENT] |
| 26 | History | budgetProposal | [CONSISTENT] |
| 27 | Notification | notification, budgetProposal (inline create), expense (inline create) | [CONSISTENT] |
| 28 | OperatingCompany | operatingCompany, omExpense (importData), chargeOut | [CONSISTENT] |
| 29 | ProjectChargeOutOpCo | project (create/update/delete) | [CONSISTENT] |
| 30 | UserOperatingCompany | operatingCompany (FEAT-009) | [CONSISTENT] |
| 31 | BudgetCategory | budgetPool, expense (approve/revert), project | [CONSISTENT] |
| 32 | Currency | currency, budgetPool (validation), omExpense (validation) | [CONSISTENT] |

### Model Count Discrepancy

| Document | Claimed Model Count | Status |
|----------|-------------------|--------|
| schema-overview.md | **32** models | - |
| router-index.md (header) | N/A (doesn't claim model count) | - |
| system-architecture.md diagram | **31** models (in DB package box) | [INCONSISTENT] |
| er-diagram.md | **31** models | [INCONSISTENT] |
| CLAUDE.md | **27** models (lists specific names) | [INCONSISTENT] |

**Finding**: schema-overview.md counts 32 models (8 Auth + 4 Budget/Project + 4 Procurement + 5 Expense + 3 OM + 8 System). The ER diagram and system architecture claim 31. CLAUDE.md claims 27. The discrepancy arises because:
- schema-overview.md counts Permission, RolePermission, UserPermission (FEAT-011) which are newer additions
- CLAUDE.md's list of 27 specific model names omits Permission, RolePermission, UserPermission, UserOperatingCompany, ProjectBudgetCategory (5 models)

### Include Relations Cross-Check (5 spot checks)

| Router | Documented Include | Schema Relations Match? | Status |
|--------|-------------------|------------------------|--------|
| budgetPool.getById | currency, categories, projects | BudgetPool has currency, BudgetCategory[], Project[] in schema | [CONSISTENT] |
| expense.getById | items, purchaseOrder, vendor, budgetCategory, currency | Expense has ExpenseItem[], PurchaseOrder, BudgetCategory, Currency in schema | [CONSISTENT] |
| chargeOut.getById | project (manager, supervisor), opCo, confirmer, items.expense | ChargeOut has Project, OperatingCompany, User (confirmer), ChargeOutItem[] in schema | [CONSISTENT] |
| omExpense.getById | items, monthlyRecords, opCo, vendor, sourceExpense | OMExpense has OMExpenseItem[], defaultOpCo, vendor, sourceExpense in schema | [CONSISTENT] |
| notification.getAll | (no includes, just Notification fields) | Notification model has userId relation | [CONSISTENT] |

**Set E Summary**: All 32 models are referenced by at least one router (or are NextAuth internal models). 1 inconsistency in model counts across documents (32 vs 31 vs 27).

---

## Set F: Diagrams vs Text Documentation (~10 points)

### F1: system-architecture.md vs architecture-patterns.md

| Claim | Architecture Diagram | Architecture Patterns Text | Status |
|-------|---------------------|---------------------------|--------|
| Monorepo structure | Turborepo with apps/web, packages/api, packages/db, packages/auth, packages/tsconfig, packages/eslint-config | Same structure described | [CONSISTENT] |
| Router count | "17 個業務 Router" | "共 17 個 Router 註冊於 appRouter" | [CONSISTENT] |
| Prisma models | "31 個 Model" | N/A in patterns doc | (Not cross-checkable here) |
| Communication | tRPC Client (@trpc/react-query) between web and api | "httpBatchLink 進行 HTTP 批次請求" + "端點 URL：/api/trpc" | [CONSISTENT] |
| Auth method | "JWT Session" + "Azure AD + Credentials" | "JWT (無資料庫 Session 表)" + "Azure AD SSO" + "本地密碼" | [CONSISTENT] |
| Provider chain | Not in architecture diagram | SessionProvider → NextIntlClientProvider → TRPCProvider | (Only in patterns, not diagram) |

**F1 Result**: [CONSISTENT] - Architecture diagram and patterns text align on all cross-checkable claims.

### F2: business-process.md approval flow vs API router docs

**BudgetProposal Approval Flow:**

| Diagram Claim | API Router Doc (budgetProposal.md) | Status |
|--------------|-----------------------------------|--------|
| Draft -> PendingApproval via submit() | submit: "Draft/MoreInfoRequired -> PendingApproval" | [CONSISTENT] |
| PendingApproval -> Approved via approve(Approved) | approve: "僅 PendingApproval 可審批" with action='Approved' | [CONSISTENT] |
| PendingApproval -> Rejected via approve(Rejected) | approve: action='Rejected' | [CONSISTENT] |
| PendingApproval -> MoreInfoRequired via approve(MoreInfoRequired) | approve: action='MoreInfoRequired' | [CONSISTENT] |
| MoreInfoRequired -> PendingApproval via submit() | submit: "Draft/MoreInfoRequired -> PendingApproval" | [CONSISTENT] |
| Any -> Draft via revertToDraft | revertToDraft: "任何非 Draft 狀態 -> Draft" | [CONSISTENT] |
| revertToDraft actors: "Admin/PM" | revertToDraft: "Admin 或 Supervisor 才能執行" | [INCONSISTENT] Diagram says "Admin/PM" can revertToDraft, but the API doc says "Admin 或 Supervisor". The diagram is wrong about PM being able to revert — it should be Supervisor. |
| History records | All transitions create History records | [CONSISTENT] |
| Notification on submit to Supervisor | submit: "建立 Notification 給 Supervisor" | [CONSISTENT] |

**Expense Approval Flow:**

| Diagram Claim | API Router Doc (expense.md) | Status |
|--------------|---------------------------|--------|
| Draft -> Submitted via submit() | submit: "Draft -> Submitted" | [CONSISTENT] |
| Submitted -> Approved via approve() [supervisorProcedure] | approve: supervisorProcedure, "Submitted -> Approved" | [CONSISTENT] |
| Submitted -> Draft via reject() | reject: "Submitted -> Draft" | [CONSISTENT] |
| Approved -> Paid via markAsPaid() | markAsPaid: "Approved -> Paid" | [CONSISTENT] |
| Approved -> Draft via revertToDraft() | revertToDraft: includes budget revert | [CONSISTENT] |
| approve triggers BudgetPool.usedAmount increment | approve: "BudgetPool.usedAmount += totalAmount" | [CONSISTENT] |
| revertToDraft triggers BudgetPool.usedAmount decrement | revertToDraft: "BudgetPool.usedAmount -= totalAmount" | [CONSISTENT] |

**ChargeOut Flow:**

| Diagram Claim | API Router Doc (chargeOut.md) | Status |
|--------------|-------------------------------|--------|
| Draft -> Submitted -> Confirmed -> Paid | Same flow documented | [CONSISTENT] |
| Submitted -> Rejected | reject: "Submitted -> Rejected" | [CONSISTENT] |
| confirm uses supervisorProcedure | confirm: supervisorProcedure | [CONSISTENT] |
| Draft and Rejected can be deleted | delete: "僅 Draft 或 Rejected 可刪除" | [CONSISTENT] |

### F3: ER Diagram Model Count vs schema-overview.md

| Document | Model Count | Status |
|----------|------------|--------|
| er-diagram.md header | 31 | [INCONSISTENT] |
| schema-overview.md | 32 | (see Set E analysis above) |

The ER diagram claims 31 models. Schema-overview lists 32. The difference is likely one of the FEAT-011 permission models not being included in the ER diagram count, or a counting error in one document.

### F4: data-flow.md budget tracking vs expense.md and budgetPool.md

| Data-flow Claim | Router Doc Claim | Status |
|----------------|-----------------|--------|
| expense.approve() increments BudgetPool.usedAmount and BudgetCategory.usedAmount | expense.md #11: "BudgetPool.usedAmount += totalAmount" + "BudgetCategory.usedAmount += totalAmount" | [CONSISTENT] |
| expense.revertToDraft() decrements both | expense.md #7: "回沖 BudgetPool.usedAmount 和 BudgetCategory.usedAmount" | [CONSISTENT] |
| Math.max(0,...) safety guard | expense.md: "usedAmount 不低於 0（Math.max）" | [CONSISTENT] |
| Budget tracking shown in Dashboard (usage rate, health status) | dashboard.md: getSupervisorDashboard returns budgetPoolOverview with usagePercentage | [CONSISTENT] |

### F5: Expense Status Values

| Document | Expense Status Values | Status |
|----------|---------------------|--------|
| schema-overview.md | Draft, PendingApproval, Approved, Paid, Rejected | - |
| router-index.md | Draft, Submitted, Approved, Paid | [INCONSISTENT] |
| expense.md detail | Draft, Submitted, Approved, Paid (in status flow); reject sends back to Draft | - |
| business-process.md diagram | Draft, Submitted, Approved, Paid | - |

**Finding**: schema-overview.md lists "PendingApproval" as a possible Expense status value, but the actual expense router uses "Submitted" (not "PendingApproval"). The router-index.md also says "Submitted". Additionally, schema-overview.md lists "Rejected" but the expense router's reject procedure actually sets status back to "Draft", not "Rejected". The schema-overview.md Expense status enum appears to be incorrect or outdated.

**Set F Summary**: 3 inconsistencies found:
1. business-process.md says "Admin/PM" can revertToDraft proposals but API doc says "Admin 或 Supervisor"
2. ER diagram claims 31 models vs schema-overview's 32
3. schema-overview.md lists wrong Expense status values (PendingApproval, Rejected instead of Submitted; reject goes to Draft not Rejected)

---

## Grand Summary

| Set | Checks | Consistent | Inconsistent | Details |
|-----|--------|------------|--------------|---------|
| A: Router Index vs Detail | 17 routers + descriptions | 16 | 1 | chargeOut procedure count mismatch (13 vs 14 in header) |
| B: Page Index vs Detail Groups | 21 modules + totals | 19 | 2 | Group 1 line total (~12,240 vs ~12,920); Group 3 file count (~21 vs 20) |
| C: Component Index vs Detail | 21 dirs + totals | 20 | 1 | Index header says ~17,994 lines but table sums to 17,594 |
| D: API Layer vs Frontend Pages | 10 pages, ~35 procedures | 35 | 0 | All procedures exist and auth levels match |
| E: Database Schema vs API Router | 32 models + relations | 31 | 1 | Model count varies across docs (32/31/27) |
| F: Diagrams vs Text | 15+ claims | 12 | 3 | revertToDraft actors wrong in diagram; ER count 31 vs 32; Expense status enum wrong in schema-overview |
| **Total** | **~100** | **~92** | **8** | |

### Critical Inconsistencies (should fix)

1. **schema-overview.md Expense status values**: Lists "PendingApproval" and "Rejected" but actual router uses "Submitted" and reject-to-Draft. This is misleading for anyone reading the database documentation.
2. **business-process.md revertToDraft actors**: Claims "Admin/PM" but should be "Admin/Supervisor" per the actual API code.
3. **Model count across documents**: 32 (schema-overview) vs 31 (ER diagram, architecture) vs 27 (CLAUDE.md). Should be unified.

### Minor Inconsistencies (low priority)

4. chargeOut detail header says 14 procedures but lists 13.
5. Group 1 line count: ~12,240 (index) vs ~12,920 (detail header).
6. Group 3 file count: ~21 (index) vs 20 (detail).
7. component-index.md header says ~17,994 lines but table sums to 17,594.
8. router-index total 200 could be 201 depending on chargeOut count interpretation.
