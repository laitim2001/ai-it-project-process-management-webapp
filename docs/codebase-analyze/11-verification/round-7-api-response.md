# Round 7 Verification: API Response Shapes vs Frontend Consumption

**Date**: 2026-04-09
**Scope**: All routers with getAll, 10 pages error handling, 5 modules list-detail, 20 mutations, 10 type safety checks
**Verified By**: Claude Opus 4.6 (1M context)

---

## Set A: Pagination Response Consistency (~20 points)

### getAll Response Shape Matrix

| Router | Response Shape | Pagination Style | Has Pagination? |
|--------|---------------|-----------------|-----------------|
| `project.ts` | `{ items, pagination: { total, page, limit, totalPages } }` | **Nested** | Yes |
| `budgetPool.ts` | `{ items, pagination: { total, page, limit, totalPages } }` | **Nested** | Yes |
| `budgetProposal.ts` | `{ items, total, page, limit, totalPages }` | **Flat** | Yes |
| `expense.ts` | `{ items, pagination: { total, page, limit, totalPages } }` | **Nested** | Yes |
| `vendor.ts` | `{ items, pagination: { total, page, limit, totalPages } }` | **Nested** | Yes |
| `quote.ts` | `{ items, pagination: { total, page, limit, totalPages } }` | **Nested** | Yes |
| `purchaseOrder.ts` | `{ items, pagination: { total, page, limit, totalPages } }` | **Nested** | Yes |
| `chargeOut.ts` | `{ items, total, page, limit, totalPages }` | **Flat** | Yes |
| `omExpense.ts` | `{ items, total, page, limit, totalPages }` | **Flat** | Yes |
| `expenseCategory.ts` | `{ categories, total, page, limit, totalPages }` | **Flat** (key: `categories`) | Yes |
| `notification.ts` | `{ notifications, nextCursor }` | **Cursor-based** | Yes (infinite) |
| `operatingCompany.ts` | `OperatingCompany[]` (raw array) | **None** | No |
| `user.ts` | `User[]` (raw array) | **None** | No |
| `currency.ts` | `Currency[]` (raw array) | **None** | No |
| `permission.ts` | Object (permissions map) | **None** | No |

### Inconsistency Findings

**INCONSISTENCY-1: Two pagination response shapes coexist**

- **Group A (Nested)**: project, budgetPool, expense, vendor, quote, purchaseOrder
  - Shape: `{ items, pagination: { total, page, limit, totalPages } }`
  - Frontend accesses: `data?.items`, `data?.pagination?.totalPages`

- **Group B (Flat)**: budgetProposal, chargeOut, omExpense, expenseCategory
  - Shape: `{ items, total, page, limit, totalPages }` (or `{ categories, ... }`)
  - Frontend accesses: `data?.items`, `data?.totalPages`

This is a **real inconsistency** across routers. The two shapes are incompatible -- you cannot write a single generic pagination component that works with both.

**INCONSISTENCY-2: expenseCategory uses `categories` instead of `items`**

- Returns `{ categories, total, page, limit, totalPages }` instead of `{ items, ... }`
- Frontend correctly uses `data?.categories` so it works, but it breaks the naming convention.

**INCONSISTENCY-3: Three routers return raw arrays with no pagination**

- `operatingCompany.getAll`, `user.getAll`, `currency.getAll` return plain arrays
- Frontends do client-side filtering (operating-companies) or just render all (users, currencies)
- These could become problematic at scale but currently work correctly.

### Frontend-API Alignment Verification

| Frontend Page | Accesses | API Returns | Match? |
|--------------|----------|-------------|--------|
| `/projects` | `data?.items`, `data?.pagination` | `{ items, pagination: {...} }` | **YES** |
| `/budget-pools` | `data?.items`, `data?.pagination` | `{ items, pagination: {...} }` | **YES** |
| `/proposals` | `proposalsData?.items` | `{ items, total, ... }` | **YES** |
| `/expenses` | `data?.items`, `data?.pagination` | `{ items, pagination: {...} }` | **YES** |
| `/vendors` | `data?.items`, `data?.pagination` | `{ items, pagination: {...} }` | **YES** |
| `/quotes` | `data?.items`, `data?.pagination` | `{ items, pagination: {...} }` | **YES** |
| `/purchase-orders` | `data?.items`, `data?.pagination` | `{ items, pagination: {...} }` | **YES** |
| `/charge-outs` | `chargeOuts?.items`, `chargeOuts.totalPages` | `{ items, total, ... }` | **YES** |
| `/om-expenses` | `omExpenses?.items`, `omExpenses.totalPages` | `{ items, total, ... }` | **YES** |
| `/om-expense-categories` | `data?.categories` | `{ categories, total, ... }` | **YES** |
| `/notifications` | `page.notifications` (infinite query) | `{ notifications, nextCursor }` | **YES** |
| `/operating-companies` | `data.filter(...)` (array) | `OperatingCompany[]` | **YES** |
| `/users` | `users` (array) | `User[]` | **YES** |
| `/settings/currencies` | `data` (array) | `Currency[]` | **YES** |

**Result**: All 14 frontend pages correctly consume their corresponding API response shapes. No mismatches found.

### Cross-module consumption

The purchase-orders page and quotes page also query `api.project.getAll` and `api.vendor.getAll` for dropdown filters:
- PO page: `projects?.items.map(...)` -- correctly accesses nested `items` from project getAll
- PO page: `vendors?.items.map(...)` -- correctly accesses nested `items` from vendor getAll
- Projects page: `budgetPoolsData?.items` -- correctly accesses nested `items` from budgetPool getAll

---

## Set B: Error Response Handling (~20 points)

### Query Error Handling Matrix (10 pages)

| Page | Query Error Check (`if (error)`) | Error Display | Inline/Toast |
|------|----------------------------------|---------------|-------------|
| `/projects` | YES | `error.message` in CardContent | Inline |
| `/expenses` | YES | `error.message` in Alert | Inline |
| `/vendors` | YES | `error.message` in Alert | Inline |
| `/budget-pools` | YES | `error.message` in Alert | Inline |
| `/proposals` | **NO** | N/A | **MISSING** |
| `/charge-outs` | Partial (isLoading check only) | N/A | **MISSING** |
| `/om-expenses` | Partial (isLoading check only) | N/A | **MISSING** |
| `/purchase-orders` | YES | `error.message` in Alert | Inline |
| `/quotes` | YES | refetch button with error state | Inline |
| `/notifications` | Partial (hasNextPage check) | N/A | Partial |

### Mutation Error Handling Matrix (10 pages)

| Page | Mutation Error Handling | Display Method | Uses i18n? |
|------|----------------------|----------------|------------|
| `/projects` | `onError` callback | Toast (destructive) | YES (`tToast('error.title')`) |
| `/expenses` | `onError` callback | Toast (destructive) | YES (`t('messages.deleteError')`) |
| `/proposals` | `onError` callback | Toast (destructive) | YES (`t('actions.deleteError')`) |
| `/charge-outs` | `onError` callback | Toast (destructive) | YES (`t('messages.deleteError')`) |
| `/om-expenses` | `onError` callback | Toast (destructive) | YES (`t('list.batchActions.deleteError')`) |
| `/vendors/[id]` | `onError` callback | Toast (destructive) | YES |
| `/purchase-orders` | `onError` callback | Toast (destructive) | YES |
| `/quotes` | `onError` callback | Toast (destructive) | YES |
| `/budget-pools/[id]` | `onError` callback | Toast (destructive) | YES |
| `/notifications` | No explicit onError | N/A | N/A |

### Key Findings

**FINDING-B1: No TRPCError code differentiation**
- Zero pages check `error.data?.code` for specific handling (NOT_FOUND, FORBIDDEN, BAD_REQUEST)
- All mutation errors use `error.message` generically
- This means a 403 Forbidden shows the same UI as a 404 Not Found

**FINDING-B2: 3 list pages missing query error handling**
- `/proposals`, `/charge-outs`, `/om-expenses` have NO `if (error)` check for the getAll query
- If the API returns an error, these pages will show `isLoading` skeleton indefinitely or render with no data and no error message
- This is a **real bug** -- users would see a blank page with no explanation

**FINDING-B3: Consistent toast pattern for mutations**
- All 35+ mutations across the codebase consistently use `onError` with toast + destructive variant
- All use `error.message` (the tRPC error message) as the description
- i18n is used for the title but not for the error description (which comes from the server)

---

## Set C: List-to-Detail Data Consistency (~20 points)

### Module 1: Projects

| Field | getAll Includes | getById Includes | Notes |
|-------|----------------|------------------|-------|
| `manager` | `{ id, name, email }` | `{ id, name, email, role: { name } }` | getById adds role |
| `supervisor` | `{ id, name, email }` | `{ id, name, email, role: { name } }` | getById adds role |
| `budgetPool` | `{ id, name, totalAmount, financialYear }` | `{ id, name, totalAmount, financialYear }` | Same |
| `budgetCategory` | Not included | `{ id, categoryName, categoryCode }` | Detail only |
| `currency` | Not included | `{ id, code, name, symbol }` | Detail only |
| `proposals` | Not included (only `_count`) | Full array with `{ id, title, amount, status, createdAt }` | Detail only |
| `purchaseOrders` | Not included (only `_count`) | Full array with vendor | Detail only |
| `chargeOutOpCos` | Not included | Full array with opCo | Detail only |
| `_count` | `{ proposals, purchaseOrders }` | Not included | List only |

**List page field usage verification**: Projects list page uses:
- `item.name`, `item.status`, `item.projectCode`, `item.managerId`, `item.manager?.name`, `item.budgetPool?.name`, `item._count?.proposals`
- All these fields exist in getAll response. **No issues**.

### Module 2: Expenses

| Field | getAll Includes | getById Includes |
|-------|----------------|------------------|
| `purchaseOrder.project` | `{ id, name, budgetPoolId, currency }` | Full with budgetPool, manager, supervisor |
| `purchaseOrder.vendor` | `{ id, name }` | Full vendor object |
| `currency` | Yes | Yes |
| `items` | Not included | Yes (with chargeOutOpCo) |
| `vendor` | Not included | `{ id, name }` |
| `budgetCategory` | Not included | `{ id, name, code }` |

**List page field usage**: Expenses list uses `expense.name`, `expense.status`, `expense.amount`, `expense.purchaseOrder?.project?.name`, `expense.purchaseOrder?.vendor?.name`. All present in getAll. **No issues**.

### Module 3: Proposals

| Field | getAll Includes | getById Includes |
|-------|----------------|------------------|
| `project` | Full (with manager, supervisor, budgetPool, currency) | Same |
| `comments` | Full (with user) | Same |
| `historyItems` | Full (with user) | Same |

Both getAll and getById return the **same include structure** for proposals. This is unusual -- getAll fetches heavier data than typical. **No data inconsistency but potential over-fetching on list page**.

### Module 4: OM Expenses

| Field | getAll Includes | getById Includes |
|-------|----------------|------------------|
| `defaultOpCo` | Yes | Yes |
| `opCo` | Yes | Yes |
| `vendor` | Yes | Yes |
| `items` | Only `_count` | Full array with opCo, currency, monthlyRecords |
| `monthlyRecords` | Only `_count` | Full array |
| `sourceExpense` | Not included | Yes (with purchaseOrder, project) |

**List page field usage**: OM expenses list uses `om.name`, `om.category`, `om.financialYear`, `om._count?.items`, `om.defaultOpCo?.name`. All present in getAll. **No issues**.

### Module 5: Charge-Outs

| Field | getAll Includes | getById Includes |
|-------|----------------|------------------|
| `project` | `{ id, name }` | Full with manager, supervisor |
| `opCo` | `{ id, code, name }` | Full |
| `confirmer` | `{ id, name, email }` | Same |
| `items` | Only `_count` | Full with expense, expenseItem |

**List page field usage**: Charge-outs list uses `chargeOut.project?.name`, `chargeOut.opCo?.name`, `chargeOut.status`, `chargeOut._count?.items`. All present in getAll. **No issues**.

### N+1 Query Check

**No N+1 patterns detected** at the UI level. No list pages call getById for individual items. All list data comes exclusively from getAll responses.

---

## Set D: Mutation Success Handling (~20 points)

### Create Mutations (7 mutations)

| Component | Mutation | onSuccess: Toast? | onSuccess: Redirect? | onSuccess: Invalidate? | i18n Toast? |
|-----------|---------|-------------------|---------------------|----------------------|-------------|
| `ProjectForm` | `project.create` | YES | `/projects/${data.id}` | No (router.push) | YES |
| `BudgetProposalForm` | `budgetProposal.create` | YES | `/proposals/${proposal.id}` | No (router.push + refresh) | YES |
| `ExpenseForm` | `expense.create` | YES | `/expenses/${data.id}` | No (router.push) | YES |
| `VendorForm` | `vendor.create` | YES | `/vendors` (list) | No (router.push + refresh) | YES |
| `ChargeOutForm` | `chargeOut.create` | YES | `/charge-outs/${data.id}` | No (router.push) | YES |
| `OMExpenseForm` | `omExpense.createWithItems` | YES | `/om-expenses/${data?.id}` | No (router.push) | YES |
| `BudgetPoolForm` | `budgetPool.create` | YES | `/budget-pools/${data.id}` | No (router.push) | YES |

**Pattern**: All create mutations: toast + redirect to detail page. Vendor is the exception (redirects to list).

### Update Mutations (7 mutations)

| Component | Mutation | onSuccess: Toast? | onSuccess: Redirect? | i18n Toast? |
|-----------|---------|-------------------|---------------------|-------------|
| `ProjectForm` | `project.update` | YES | `/projects/${id}` | YES |
| `BudgetProposalForm` | `budgetProposal.update` | YES | `/proposals/${id}` | YES |
| `ExpenseForm` | `expense.update` | YES | `/expenses/${id}` | YES |
| `VendorForm` | `vendor.update` | YES | `/vendors/${id}` | YES |
| `ChargeOutForm` | `chargeOut.update` | YES | `/charge-outs/${id}` | YES |
| `OMExpenseForm` | `omExpense.update` | YES | `/om-expenses/${id}` | YES |
| `BudgetPoolForm` | `budgetPool.update` | YES | `/budget-pools/${id}` | YES |

**Pattern**: All update mutations: toast + redirect to detail page. Consistent.

### Delete Mutations on List Pages (6 mutations)

| Page | Mutation | Cache Strategy | Refreshes List? |
|------|---------|---------------|-----------------|
| `/projects` | `project.deleteMany` | `utils.project.getAll.invalidate()` | YES (invalidate) |
| `/expenses` | `expense.delete` | `utils.expense.getAll.invalidate()` + `utils.expense.getStats.invalidate()` | YES (invalidate) |
| `/proposals` | `budgetProposal.delete` | `refetch()` | YES (refetch) |
| `/charge-outs` | `chargeOut.delete` | `refetch()` | YES (refetch) |
| `/om-expenses` | `omExpense.deleteMany` | `refetch()` | YES (refetch) |
| `/quotes` | `quote.delete` | `refetch()` | YES (refetch) |

**FINDING-D1: Inconsistent cache invalidation strategy**
- Projects and expenses use `utils.[entity].getAll.invalidate()` (React Query cache invalidation)
- Proposals, charge-outs, om-expenses, quotes use `refetch()` (direct re-fetch)
- Both work, but `invalidate()` is the preferred tRPC pattern (invalidates all matching queries)
- `refetch()` only refreshes the specific query instance, not other components using the same query

**FINDING-D2: Expenses page invalidates multiple queries**
- `utils.expense.getAll.invalidate()` AND `utils.expense.getStats.invalidate()` on every mutation
- This is the most thorough approach -- other pages only refresh the list

### Status Change Mutations (6 mutations)

| Page | Mutation | onSuccess Actions |
|------|---------|-------------------|
| `/expenses` | `expense.revertToDraft` | `invalidate()` + `invalidate(stats)` |
| `/expenses` | `expense.revertToApproved` | `invalidate()` + `invalidate(stats)` |
| `/expenses` | `expense.revertToSubmitted` | `invalidate()` + `invalidate(stats)` |
| `/charge-outs` | `chargeOut.revertToDraft` | `refetch()` |
| `/purchase-orders` | `purchaseOrder.revertToDraft` | `refetch()` |
| `/purchase-orders` | `purchaseOrder.revertToSubmitted` | `refetch()` |

---

## Set E: Type Safety Verification (~20 points)

### `as any` Usage Analysis

| Location | Pattern | Why | Severity |
|----------|---------|-----|----------|
| `TopBar.tsx:260` | `(session?.user as any)?.role?.name` | NextAuth session type doesn't include `role` | **Medium** - Type gap |
| `Sidebar.tsx:337` | `(session?.user as any)?.role?.name` | Same | **Medium** |
| `users/[id]/page.tsx:99` | `(session?.user as any)?.role?.name` | Same | **Medium** |
| `settings/page.tsx:209` | `(session?.user as any)?.role?.name` | Same | **Medium** |
| `charge-outs/[id]/page.tsx:215` | `(session?.user as any)?.role?.name` | Same | **Medium** |
| `currencies/page.tsx:300` | `(currency as any)._count?.projects` | Currency getAll doesn't include `_count` | **High** - Always returns 0 |
| `dashboard/supervisor/page.tsx:100` | `t(\`projectStatus.${status}\` as any)` | Dynamic i18n key | **Low** - Workaround |
| `dashboard/pm/page.tsx:94` | `t(\`projectStatus.${status}\` as any)` | Dynamic i18n key | **Low** - Workaround |
| `expenses/page.tsx:100` | `t(\`list.filter.${...}\` as any)` | Dynamic i18n key | **Low** - Workaround |
| `expenses/page.tsx:708+` | `e as unknown as React.MouseEvent` | Event type mismatch | **Low** - Harmless cast |
| `data-import/page.tsx:382` | `XLSX.utils.sheet_to_json(...) as unknown[][]` | Third-party library type | **Low** - Expected |
| `layout.tsx:87` | `locale as any` | Routing type narrow | **Low** |
| `OMExpenseItemForm.tsx:221` | `data as unknown as OMExpenseItemData` | Mutation return type mismatch | **Medium** |

### Specific Type Issues

**ISSUE-E1: Session type missing `role` property (5 occurrences)**
- `(session?.user as any)?.role?.name` appears in 5 files
- Root cause: NextAuth.js session type definition doesn't extend `user` to include `role`
- The actual session object includes `role` at runtime (set in auth callbacks), but TypeScript doesn't know about it
- Fix: Extend `next-auth` types in a `.d.ts` file

**ISSUE-E2: Currency `_count` always undefined (1 occurrence)**
- `currencies/page.tsx:300` accesses `(currency as any)._count?.projects || 0`
- The currency getAll API does NOT include `_count` in its Prisma query
- This means the "projects using this currency" column always shows 0
- This is a **functional bug** masked by `as any`

**ISSUE-E3: OMExpenseItemForm mutation return type cast (2 occurrences)**
- `data as unknown as OMExpenseItemData` in addItem and updateItem success callbacks
- The tRPC-inferred return type doesn't match the locally defined `OMExpenseItemData` interface
- Likely because the API return includes Prisma relations that differ from the local type

### Optional Chaining Analysis

Extensive use of optional chaining (`?.`) throughout the codebase is mostly **appropriate**:
- `data?.items` -- query data may be undefined during loading
- `session?.user` -- session may not be loaded
- `item._count?.proposals` -- `_count` is a Prisma computed field that may be undefined
- `om.defaultOpCo?.name` -- nullable relation

No instances found where `?.` masks a real type error (outside the `as any` cases documented above).

---

## Summary

### Critical Findings

| ID | Severity | Finding | Impact |
|----|----------|---------|--------|
| A-1 | **Medium** | Two incompatible pagination response shapes (nested vs flat) across routers | No runtime bug but prevents generic pagination component |
| A-2 | **Low** | expenseCategory uses `categories` key instead of `items` | Naming inconsistency only |
| B-1 | **Medium** | 3 list pages missing query error handling (proposals, charge-outs, om-expenses) | Users see blank page on API error |
| B-2 | **Low** | No TRPCError code differentiation anywhere in frontend | Same UI for all error types |
| D-1 | **Low** | Inconsistent cache strategy: some use `invalidate()`, some use `refetch()` | Both work; `invalidate` is preferred |
| E-1 | **Medium** | `session.user.role` requires `as any` in 5 places due to missing type extension | Type safety gap |
| E-2 | **High** | Currency page `_count.projects` always returns 0/undefined -- API doesn't include it | **Functional bug** |
| E-3 | **Low** | OMExpenseItemForm casts mutation return with `as unknown as` | Type mismatch workaround |

### Verification Scores

| Set | Area | Score | Notes |
|-----|------|-------|-------|
| A | Pagination Response Consistency | 16/20 | Two shapes coexist; all frontend-API pairs match correctly |
| B | Error Response Handling | 14/20 | 3 pages missing query error handling; no error code differentiation |
| C | List-to-Detail Data Consistency | 20/20 | Perfect -- no N+1, all list pages use only getAll fields |
| D | Mutation Success Handling | 18/20 | All mutations have toast + redirect; cache strategy inconsistent |
| E | Type Safety Verification | 15/20 | 5 session type gaps, 1 functional bug (currency _count), 2 mutation casts |

**Total: 83/100**

### Recommendations

1. **Standardize pagination response shape** -- pick either nested (`{ items, pagination: {...} }`) or flat (`{ items, total, ... }`) and migrate all routers
2. **Add query error handling** to proposals, charge-outs, and om-expenses list pages
3. **Fix currency getAll** to include `_count: { select: { projects: true } }` in Prisma query
4. **Extend NextAuth session types** to include `role` property, eliminating 5 `as any` casts
5. **Standardize cache invalidation** -- use `utils.[entity].getAll.invalidate()` instead of `refetch()` for consistency
