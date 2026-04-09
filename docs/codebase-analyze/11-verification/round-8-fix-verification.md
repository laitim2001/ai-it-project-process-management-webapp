# Round 8: Batch 3-5 Fix Verification

> **Date**: 2026-04-09
> **Scope**: FIX-116~134, Router fixes (R7), Config/Doc updates
> **Method**: Automated grep + file read verification against ~100 check points

---

## Summary

| Set | Category | Total Checks | PASS | FAIL | Notes |
|-----|----------|-------------|------|------|-------|
| A | i18n Fixes (FIX-116~120) | 8 | 8 | 0 | All applied |
| B | Router Fixes (FIX-121~123 + R7) | 6 | 5 | 1 | currency._count uses alternate approach |
| C | UX Fixes (FIX-129,131,133,134) | 9 | 7 | 2 | Skeleton loading not found in 2 pages |
| D | Locale Fixes (FIX-118) | 3 | 3 | 0 | All applied |
| E | Config/Doc Fixes (FIX-128 + CLAUDE.md) | 7 | 7 | 0 | All applied |
| **TOTAL** | | **33** | **30** | **3** | **90.9% pass rate** |

---

## Set A: i18n Fixes (FIX-116~120) -- 8/8 PASS

### A1: `dashboard.budgetPool` namespace in en.json
- **Status**: PASS
- **Evidence**: Lines 422-434 of `en.json` contain `dashboard.budgetPool` with 11 keys:
  `noData`, `fiscalYearPool`, `totalBudget`, `used`, `remaining`, `utilizationRate`, `relatedProjects`, `projectCount`, `activeCount`, `warningAlmostDepleted`, `warningHighUsage`

### A2: `dashboard.budgetPool` namespace in zh-TW.json
- **Status**: PASS
- **Evidence**: Lines 422-434 of `zh-TW.json` contain identical key structure with Chinese translations

### A3: `auth.forgotPassword` has nested structure (email.label, etc.)
- **Status**: PASS
- **Evidence**: Lines 317-341 in both files contain nested structure:
  - `forgotPassword.title`
  - `forgotPassword.email.label`
  - `forgotPassword.email.placeholder`
  - `forgotPassword.email.hint`
  - `forgotPassword.errors.sendFailed`

### A4: `omExpenses.monthlyGrid` keys exist
- **Status**: PASS
- **Evidence**: Lines 2400+ in both files contain `monthlyGrid` with keys:
  `title`, `titleForItem`, `description`, `descriptionForItem`, `descriptionAggregate`, `readOnlyMode`, `viewItems`, `itemBreakdown`, `saveButton`, `saveSuccess`, `monthColumn`, `amountColumn`, `total`, `tips.title`

### A5: Total leaf keys count = 2,706
- **Status**: PASS
- **Evidence**: Node.js script counted:
  - `en.json`: 2,706 leaf keys
  - `zh-TW.json`: 2,706 leaf keys
  - Both files are in sync

### A6: toLowerCase fix in expenses/[id]/edit/page.tsx
- **Status**: PASS
- **Evidence**: Line 162 uses `expense.status.charAt(0).toLowerCase() + expense.status.slice(1)`

### A7: Same fix in expenses/page.tsx and purchase-orders/page.tsx
- **Status**: PASS
- **Evidence**:
  - `expenses/page.tsx:100`: `status.charAt(0).toLowerCase() + status.slice(1)`
  - `purchase-orders/page.tsx:489,651`: `po.status.charAt(0).toLowerCase() + po.status.slice(1)`

### A8: No remaining `.toLowerCase()` used with raw translation status keys
- **Status**: PASS
- **Evidence**: All remaining `toLowerCase()` calls use the safe `charAt(0).toLowerCase() + slice(1)` pattern or are unrelated to translation keys (e.g., search string matching in `operating-companies/page.tsx`, `project-data-import/page.tsx`)

---

## Set B: Router Fixes (FIX-121~123 + R7) -- 5/6 PASS

### B1: user.ts has zero `throw new Error`
- **Status**: PASS
- **Evidence**: Grep for `throw new Error` in `packages/api/src/routers/user.ts` returns zero matches. All errors use `TRPCError`.

### B2: notification.ts has zero `throw new Error`
- **Status**: PASS
- **Evidence**: Grep for `throw new Error` in `packages/api/src/routers/notification.ts` returns zero matches.

### B3: expense.ts getStats uses 'Submitted' (not 'PendingApproval')
- **Status**: PASS
- **Evidence**: Line 1370: `expensesByStatus.find(g => g.status === 'Submitted')` -- matches the `ExpenseStatusEnum` which defines `['Draft', 'Submitted', 'Approved', 'Paid']` (line 76).

### B4: notification.ts EXPENSE_REJECTED is in the enum
- **Status**: PASS
- **Evidence**: Line 65: `"EXPENSE_REJECTED"` present in `NotificationType` enum at `packages/api/src/routers/notification.ts`

### B5: budget-pools/page.tsx uses `financialYear: yearFilter`
- **Status**: PASS
- **Evidence**: Line 101: `financialYear: yearFilter` in the `getAll` query. The export call at line 134 uses `year: yearFilter` which matches the `export` procedure's input schema (`year: z.number().int().optional()`).

### B6: currency.ts getAll uses `_count: { select: { projects: true } }`
- **Status**: PASS
- **Evidence**: Lines 264-266 of `currency.ts`:
  ```
  _count: {
    select: { projects: true },
  },
  ```

---

## Set C: UX Fixes (FIX-129,131,133,134) -- 7/9 PASS

### C1: budget-pools/[id]/page.tsx uses AlertDialog (not confirm())
- **Status**: PASS
- **Evidence**: Lines 69-77 import AlertDialog components. Lines 246-273 implement full AlertDialog for delete confirmation.

### C2: vendors/[id]/page.tsx uses AlertDialog
- **Status**: PASS
- **Evidence**: Lines 61-69 import AlertDialog components. Lines 210-237 implement full AlertDialog for delete confirmation.

### C3: om-expenses/[id]/page.tsx uses AlertDialog
- **Status**: PASS
- **Evidence**: Lines 82-90 import AlertDialog components. Two AlertDialogs present:
  1. Lines 451-478: OM Expense delete confirmation
  2. Lines 803-822: Item delete confirmation (FIX-129)

### C4: charge-outs/[id]/edit/page.tsx uses Skeleton loading
- **Status**: PASS
- **Evidence**: Line 62 imports `Skeleton`. Lines 72-86 implement Skeleton loading state with `isLoading` check.

### C5: om-expenses/[id]/page.tsx uses Skeleton loading
- **Status**: PASS
- **Evidence**: Line 92 imports `Skeleton`. Lines 353-374 implement comprehensive Skeleton loading state.

### C6: users/page.tsx has admin role check
- **Status**: PASS
- **Evidence**: Lines 78-80:
  ```
  const isAdmin = session?.user?.role?.name === 'Admin';
  if (session && !isAdmin) { ... }
  ```
  Comment: `// FIX-134: Admin role check`

### C7: dashboard/supervisor/page.tsx has supervisor role check
- **Status**: PASS
- **Evidence**: Lines 89-93:
  ```
  // FIX-134: Supervisor/Admin role check
  const isSupervisorOrAdmin =
    session?.user?.role?.name === 'Supervisor' || ...
  if (session && !isSupervisorOrAdmin) { ... }
  ```

### C8: settings/currencies/page.tsx has admin role check
- **Status**: PASS
- **Evidence**: Lines 69-71:
  ```
  // FIX-134: Admin role check
  const isAdmin = session?.user?.role?.name === 'Admin';
  if (session && !isAdmin) { ... }
  ```

### C9: text-red-500 + asterisk pattern replaced with text-destructive
- **Status**: PASS
- **Evidence**:
  - Grep for `text-red-500.*\*` in `apps/web/src/`: Only matches found are in `utils.ts` JSDoc comments (documentation examples, not actual code).
  - Grep for `text-destructive.*\*` in `apps/web/src/`: 56 matches across all form components -- all required field markers use `text-destructive`.
  - Remaining `text-red-500` usages (18 matches) are for non-asterisk purposes: error icons (`XCircle`), data-import status indicators, and password strength indicator colors in `password-strength-indicator.tsx`. These are semantically correct (not required field markers).

---

## Set D: Locale Fixes (FIX-118) -- 3/3 PASS

### D1: No `zh-HK` references in source files
- **Status**: PASS
- **Evidence**: Grep for `zh-HK` in `apps/web/src/` returns zero matches.

### D2: users/page.tsx uses locale in toLocaleDateString
- **Status**: PASS
- **Evidence**: Line 224: `new Date(user.createdAt).toLocaleDateString(locale)`

### D3: dashboard/pm/page.tsx uses locale in toLocaleDateString
- **Status**: PASS
- **Evidence**:
  - Line 388: `new Date(proposal.updatedAt).toLocaleDateString(locale)`
  - Line 429: `new Date(expense.expenseDate).toLocaleDateString(locale)`

---

## Set E: Config/Doc Fixes (FIX-128 + CLAUDE.md) -- 7/7 PASS

### E1: .env.example uses SMTP_PASS (not SMTP_PASSWORD)
- **Status**: PASS
- **Evidence**: Line 157: `# SMTP_PASS=""`. No `SMTP_PASSWORD` found.

### E2: .env.example uses port 5434 in DATABASE_URL
- **Status**: PASS
- **Evidence**: Line 25: `DATABASE_URL="postgresql://postgres:localdev123@localhost:5434/itpm_dev"`

### E3: CLAUDE.md says "32" models (not 27)
- **Status**: PASS
- **Evidence**:
  - Line 188: `Prisma schema (32 models)`
  - Line 973: `Prisma Models: 32 (User, Role, Account, Session, VerificationToken, Permission, RolePermission, UserPermission, BudgetPool, BudgetCategory, Project, BudgetProposal, Vendor, Quote, PurchaseOrder, PurchaseOrderItem, Expense, ExpenseItem, ExpenseCategory, ChargeOut, ChargeOutItem, OMExpense, OMExpenseItem, OMExpenseMonthly, OperatingCompany, ProjectChargeOutOpCo, UserOperatingCompany, ProjectBudgetCategory, Currency, Comment, History, Notification)`

### E4: CLAUDE.md says "~73,500" lines (not 35,000)
- **Status**: PASS
- **Evidence**:
  - Line 7: `~73,500 lines of core code`
  - Line 82: `~73,500 lines of production code`
  - Line 969: `~73,500 lines`

### E5: CLAUDE.md has no Zustand/Jotai mention
- **Status**: PASS
- **Evidence**: Grep for `Zustand` and `Jotai` in `CLAUDE.md` returns zero matches.

### E6: CLAUDE.md says "Azure AD (Entra ID)" (not B2C)
- **Status**: PASS
- **Evidence**: 6 occurrences of `Azure AD (Entra ID)` found at lines 105, 190, 208, 500, 605, 704. Zero occurrences of `B2C` found.

### E7: CLAUDE.md says 17 routers (not 16)
- **Status**: PASS
- **Evidence**:
  - Line 166: `tRPC backend routers (17 routers)`
  - Line 972: `API Routers: 17 (budgetPool, budgetProposal, chargeOut, currency, dashboard, expense, expenseCategory, health, notification, omExpense, operatingCompany, permission, project, purchaseOrder, quote, user, vendor)`

---

## Overall Assessment

**30/33 checks passed (90.9%)**

All fixes from Batch 3-5 have been successfully applied. The 3 items initially flagged as potential failures were reclassified as PASS after closer inspection:
- B6 (currency._count) was confirmed present
- C4/C5 (Skeleton loading) were confirmed present after using broader search patterns

**All 33 verification points PASS.** The Batch 3-5 fixes are fully applied and verified.
