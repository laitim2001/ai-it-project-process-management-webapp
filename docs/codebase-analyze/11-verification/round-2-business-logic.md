# Round 2 Deep Verification: Business Logic & Semantic Correctness

> **Date**: 2026-04-09
> **Scope**: budgetProposal.md, expense.md, chargeOut.md, omExpense.md, project.md, notification.md
> **Focus**: State machines, transaction logic, notification side effects, business rules, Prisma query patterns
> **Methodology**: Read actual source code and compare against documented behavior

---

## Set A: State Machine Transitions (~25 points)

### BudgetProposal State Machine

| # | Check | Result | Notes |
|---|-------|--------|-------|
| A-01 | Doc: "submit: Draft/MoreInfoRequired -> PendingApproval" | **[PASS]** | Code line 332-339 checks `status !== 'Draft' && status !== 'MoreInfoRequired'`, sets to `PendingApproval` |
| A-02 | Doc: "approve: only PendingApproval can be approved" | **[PASS]** | Code line 416 checks `status !== 'PendingApproval'` |
| A-03 | Doc: "approve action sets status to Approved/Rejected/MoreInfoRequired" | **[PASS]** | Code line 431 uses `status: input.action` where action is one of the three |
| A-04 | Doc: "update: only Draft or MoreInfoRequired can edit" | **[PASS]** | Code line 283-286 checks both statuses |
| A-05 | Doc: "delete: only Draft can be deleted" | **[PASS]** | Code line 687 checks `status !== 'Draft'` |
| A-06 | Doc: "revertToDraft: any non-Draft status -> Draft" | **[PASS]** | Code line 847 checks `status === 'Draft'` and rejects; all other statuses proceed |
| A-07 | No undocumented transitions exist | **[PASS]** | All 12 procedures verified; no hidden status changes |

### Expense State Machine

| # | Check | Result | Notes |
|---|-------|--------|-------|
| A-08 | Doc: "submit: Draft -> Submitted" | **[PASS]** | Code line 1006 checks `status !== 'Draft'` |
| A-09 | Doc: "approve: Submitted -> Approved" | **[PASS]** | Code line 1103 checks `status !== 'Submitted'` |
| A-10 | Doc: "reject: Submitted -> Draft" | **[PASS]** | Code line 1221 checks `status !== 'Submitted'`, sets to 'Draft' (line 1233) |
| A-11 | Doc: "markAsPaid: Approved -> Paid" | **[PASS]** | Code line 1292 checks `status !== 'Approved'` |
| A-12 | Doc: "revertToDraft: any non-Draft -> Draft" | **[PASS]** | Code line 772 checks `status === 'Draft'` and rejects |
| A-13 | Doc: "revertToApproved: Paid -> Approved" | **[PASS]** | Code line 860 checks `status !== 'Paid'` |
| A-14 | Doc: "revertToSubmitted: Approved -> Submitted" | **[PASS]** | Code line 919 checks `status !== 'Approved'` |
| A-15 | No undocumented transitions | **[PASS]** | All 15 procedures verified |

### ChargeOut State Machine

| # | Check | Result | Notes |
|---|-------|--------|-------|
| A-16 | Doc: "submit: Draft -> Submitted" | **[PASS]** | Code line 468 checks `status !== 'Draft'` |
| A-17 | Doc: "confirm: Submitted -> Confirmed" | **[PASS]** | Code line 532 checks `status !== 'Submitted'` |
| A-18 | Doc: "reject: Submitted -> Rejected" | **[PASS]** | Code line 595 checks `status !== 'Submitted'`, sets 'Rejected' (line 606) |
| A-19 | Doc: "markAsPaid: Confirmed -> Paid" | **[PASS]** | Code line 658 checks `status !== 'Confirmed'` |
| A-20 | Doc: "delete: only Draft or Rejected" | **[PASS]** | Code line 851 checks both statuses |
| A-21 | Doc: "revertToDraft: Submitted/Confirmed/Paid -> Draft" | **[PASS]** | Code line 940 rejects Draft and Rejected, all others proceed |
| A-22 | No undocumented transitions | **[PASS]** | All procedures verified |

### Project State Machine

| # | Check | Result | Notes |
|---|-------|--------|-------|
| A-23 | Doc: "chargeOut: non-Completed/Archived -> Completed" | **[PASS]** | Code line 1355 checks Completed/Archived |
| A-24 | Doc: "revertToDraft: only InProgress -> Draft" | **[PASS]** | Code line 2574/2581 checks both Draft and non-InProgress |
| A-25 | Doc: "delete: only Draft can be deleted" | **[PASS]** | Code line 988 checks `status !== 'Draft'` |

**Set A Score: 25/25 - All state machine transitions verified correctly**

---

## Set B: Transaction Logic (~25 points)

### BudgetProposal Transactions

| # | Check | Result | Notes |
|---|-------|--------|-------|
| B-01 | Doc: "submit uses $transaction" | **[PASS]** | Code line 343: `ctx.prisma.$transaction` |
| B-02 | Doc: "submit transaction: 1) update status, 2) create History, 3) create Notification" | **[PASS]** | Code lines 345, 364, 378 in that order |
| B-03 | Doc: "approve uses $transaction" | **[PASS]** | Code line 424: `ctx.prisma.$transaction` |
| B-04 | Doc: "approve transaction steps: update status, create History, create Comment, update Project" | **[PASS]** | Steps at lines 426, 462, 473, 485, 517 |
| B-05 | Doc: "approve updates Project.approvedBudget and status to InProgress" | **[PASS]** | Code line 485-491: sets `approvedBudget` and `status: 'InProgress'` |
| B-06 | Doc implies budgetProposal.approve increments BudgetPool.usedAmount | **[PASS]** | Doc does NOT claim this. Doc correctly says it updates Project, not BudgetPool. The budgetProposal.approve does NOT touch BudgetPool.usedAmount. |
| B-07 | Doc: "revertToDraft uses $transaction" | **[PASS]** | Code line 858 |
| B-08 | Doc: "revertToDraft when Approved: decrement Project.approvedBudget" | **[PASS]** | Code line 904-912: checks `originalStatus === 'Approved' && existingProposal.approvedAmount`, then decrements |
| B-09 | Doc: "FIX-008: if no other Approved proposals, revert Project to Draft" | **[PASS]** | Code line 916-933: counts other Approved proposals, reverts to Draft if 0 |
| B-10 | Doc: "delete uses $transaction" | **[PASS]** | Code line 708 |
| B-11 | Doc: "delete transaction: delete History, Comment, then proposal" | **[PASS]** | Code lines 710, 715, 720 in that order |

### Expense Transactions

| # | Check | Result | Notes |
|---|-------|--------|-------|
| B-12 | Doc: "create uses $transaction" | **[PASS]** | Code line 375 |
| B-13 | Doc: "update uses $transaction" | **[PASS]** | Code line 488 |
| B-14 | Doc: "approve uses $transaction" | **[PASS]** | Code line 1122 |
| B-15 | Doc: "approve debits BudgetPool.usedAmount by expense.totalAmount" | **[PASS]** | Code line 1112: `usedAmount = budgetPool.usedAmount + expense.totalAmount`, then line 1148: sets `usedAmount: usedAmount` |
| B-16 | Doc: "approve increments BudgetCategory.usedAmount" | **[PASS]** | Code line 1153-1162: uses `increment: expense.totalAmount` |
| B-17 | Doc: "approve budget check: usedAmount + totalAmount must not exceed totalAmount" | **[PASS]** | Code line 1114: `if (usedAmount > budgetPool.totalAmount)` |
| B-18 | Doc: "revertToDraft uses $transaction for budget reversal" | **[PASS]** | Code line 784 |
| B-19 | Doc: "revertToDraft: Math.max(0,...) safety for BudgetPool" | **[PASS]** | Code line 801: `Math.max(0, budgetPool.usedAmount - expense.totalAmount)` |
| B-20 | Doc: "revertToDraft: Math.max(0,...) safety for BudgetCategory" | **[PASS]** | Code line 818: `Math.max(0, budgetCategory.usedAmount - expense.totalAmount)` |
| B-21 | Doc: "revertToSubmitted uses $transaction with budget reversal" | **[PASS]** | Code line 927: $transaction with Math.max at lines 931 and 947 |
| B-22 | Doc: "revertToApproved: no budget change (Paid->Approved)" | **[PASS]** | Code line 868: simple update without BudgetPool operations |
| B-23 | Doc: "reject uses $transaction" | **[PASS]** | Code line 1229 |
| B-24 | Doc: "submit uses $transaction" | **[PASS]** | Code line 1022 |

### ChargeOut Transactions

| # | Check | Result | Notes |
|---|-------|--------|-------|
| B-25 | Doc: "create uses $transaction" | **[PASS]** | Code line 188 |

**Set B Score: 25/25 - All transaction logic verified correctly**

---

## Set C: Notification Side Effects (~15 points)

### BudgetProposal Notifications

| # | Check | Result | Notes |
|---|-------|--------|-------|
| C-01 | Doc: "submit creates notification to Supervisor" | **[PASS]** | Code line 378: `userId: proposal.project.supervisorId`, type: 'PROPOSAL_SUBMITTED' |
| C-02 | Doc: "submit notification type: PROPOSAL_SUBMITTED" | **[PASS]** | Code line 381: `type: 'PROPOSAL_SUBMITTED'` |
| C-03 | Doc: "approve creates notification to Project Manager" | **[PASS]** | Code line 519: `userId: proposal.project.managerId` |
| C-04 | Doc: "approve notification types: PROPOSAL_APPROVED/REJECTED/MORE_INFO" | **[PASS]** | Code lines 499-503: notificationTypeMap matches exactly |

### Expense Notifications

| # | Check | Result | Notes |
|---|-------|--------|-------|
| C-05 | Doc: "submit creates notification to Supervisor" | **[PASS]** | Code line 1048: `userId: updated.purchaseOrder.project.supervisorId`, type: 'EXPENSE_SUBMITTED' |
| C-06 | Doc: "approve creates notification to Project Manager" | **[PASS]** | Code line 1167: `userId: updatedExpense.purchaseOrder.project.managerId`, type: 'EXPENSE_APPROVED' |
| C-07 | Doc: "reject creates notification to PM" | **[PASS]** | Code line 1253: `userId: updatedExpense.purchaseOrder.project.managerId` |
| C-08 | Doc: expense.reject notification type | **[FAIL]** | **Doc says notification is created for PM, but uses type 'EXPENSE_REJECTED' (line 1255). The NotificationType enum in notification.ts does NOT include 'EXPENSE_REJECTED'. Doc does not flag this mismatch.** |

### ChargeOut Notifications

| # | Check | Result | Notes |
|---|-------|--------|-------|
| C-09 | Doc: "submit, confirm, reject have TODO for notifications" | **[PASS]** | Code has `// TODO: 發送通知給主管` (line 501) and `// TODO: 發送通知給創建者` (lines 560, 623). No actual notification.create calls exist. |

### Notification Router

| # | Check | Result | Notes |
|---|-------|--------|-------|
| C-10 | Doc: "6 notification types" | **[PASS]** | NotificationType enum has exactly 6: PROPOSAL_SUBMITTED, PROPOSAL_APPROVED, PROPOSAL_REJECTED, PROPOSAL_MORE_INFO, EXPENSE_SUBMITTED, EXPENSE_APPROVED |
| C-11 | Doc: "budgetProposal and expense directly create Notification, not through notification.create" | **[PASS]** | Both routers use `prisma.notification.create` directly in transactions, not the notification router's `create` procedure |
| C-12 | Doc: "email failure does not block notification creation" | **[PASS]** | Code line 372-374: try/catch around email sending, `console.error` only |
| C-13 | Doc: "notification.create uses emailData: z.any()" | **[PASS]** | Code line 265: `emailData: z.any().optional()` |
| C-14 | Doc: "getById and delete use throw new Error, not TRPCError" | **[PASS]** | Code lines 141, 184, 236 all use `throw new Error(...)` |
| C-15 | Doc: notification.create email type routing matches | **[PASS]** | Switch cases at lines 313-358 match all 6 types with correct email method names |

**Set C Score: 14/15 - One failure: EXPENSE_REJECTED type used in expense.reject but not in NotificationType enum; doc fails to flag this**

---

## Set D: Business Rule Validation (~20 points)

### BudgetProposal Rules

| # | Check | Result | Notes |
|---|-------|--------|-------|
| D-01 | Doc: "cannot delete non-Draft proposals" | **[PASS]** | Code line 687: `status !== 'Draft'` throws FORBIDDEN |
| D-02 | Doc: "delete permission: only managerId or Admin" | **[PASS]** | Code lines 695-704: checks `isProjectManager` and `isAdmin` |
| D-03 | Doc: "revertToDraft permission: Admin or Supervisor" | **[PASS]** | Code line 824: checks role name |
| D-04 | Doc: "revertToDraft: Draft status rejected (already Draft)" | **[PASS]** | Code line 847-852: BAD_REQUEST |
| D-05 | Doc: "approve: approvedAmount defaults to proposal.amount if not provided" | **[PASS]** | Code line 434/484: `input.approvedAmount \|\| existingProposal.amount` |

### Expense Rules

| # | Check | Result | Notes |
|---|-------|--------|-------|
| D-06 | Doc: "create validates project and PO exist" | **[PASS]** | Code lines 301-340 |
| D-07 | Doc: "create validates projectId matches PO's projectId" | **[PASS]** | Code line 335 |
| D-08 | Doc: "submit validates at least one item" | **[PASS]** | Code line 1014 |
| D-09 | Doc: "approve checks budget pool sufficiency" | **[PASS]** | Code line 1114 |
| D-10 | Doc: "delete only Draft, with chargeOut check" (CHANGE-023) | **[PASS]** | Code lines 654 (status), 662 (chargeOutItems count) |
| D-11 | Doc: "update only Draft can modify" | **[PASS]** | Code line 468: PRECONDITION_FAILED |
| D-12 | Doc: "reject requires comment (min 1)" | **[PASS]** | Code line 1195: `z.string().min(1, '請提供拒絕原因')` |

### ChargeOut Rules

| # | Check | Result | Notes |
|---|-------|--------|-------|
| D-13 | Doc: "create validates requiresChargeOut=true for expenses" | **[PASS]** | Code line 175: filters `!exp.requiresChargeOut` |
| D-14 | Doc: "update and updateItems: only Draft can edit" | **[PASS]** | Code lines 259 and 326 |
| D-15 | Doc: "submit: validates at least one item" | **[PASS]** | Code line 476 |
| D-16 | Doc: "confirm records confirmedBy and confirmedAt" | **[PASS]** | Code lines 544-545 |
| D-17 | Doc: "reject appends reason to description" | **[PASS]** | Code line 607-609: concatenates reason |

### Project Rules

| # | Check | Result | Notes |
|---|-------|--------|-------|
| D-18 | Doc: "delete only Draft, only manager or Admin, checks relations" | **[PASS]** | Code lines 988, 996-1001, 1004-1028 |
| D-19 | Doc: "chargeOut: requires all expenses Paid" | **[PASS]** | Code line 1367-1373 |
| D-20 | Doc: "revertToDraft: InProgress only, no Approved proposals, Admin/Supervisor/Manager" | **[PASS]** | Code lines 2574-2607 |

**Set D Score: 20/20 - All business rules verified correctly**

---

## Set E: Prisma Query Patterns (~15 points)

### BudgetProposal Queries

| # | Check | Result | Notes |
|---|-------|--------|-------|
| E-01 | Doc: "getAll include: project (manager, supervisor, budgetPool, currency), comments (user), historyItems (user)" | **[PASS]** | Code lines 134-159 match exactly |
| E-02 | Doc: "getAll orderBy: createdAt desc" | **[PASS]** | Code line 161 |
| E-03 | Doc: "getAll is NOT paginated" | **[PASS]** | No skip/take parameters in the query |

### Expense Queries

| # | Check | Result | Notes |
|---|-------|--------|-------|
| E-04 | Doc: "getAll has pagination with skip/take" | **[PASS]** | Code lines 156, 175-176: `skip`, `take: limit` |
| E-05 | Doc: "getAll sortBy default: expenseDate, sortOrder default: desc" | **[PASS]** | Schema lines 138-139 |
| E-06 | Doc: "getById includes items, purchaseOrder (project, budgetPool, manager, supervisor), vendor, budgetCategory, currency" | **[PASS]** | Code lines 224-276 match documented structure |
| E-07 | Doc: "getByPurchaseOrder orderBy: expenseDate desc" | **[PASS]** | Code line 1328 |

### ChargeOut Queries

| # | Check | Result | Notes |
|---|-------|--------|-------|
| E-08 | Doc: "getAll include: project, opCo, confirmer, _count.items" | **[PASS]** | Code lines 787-812 |
| E-09 | Doc: "getAll pagination with skip/take" | **[PASS]** | Code lines 777, 785 |
| E-10 | Doc: "getById include: expenseItem with chargeOutOpCo (CHANGE-002)" | **[PASS]** | Code lines 719-722 |
| E-11 | Doc: "getEligibleExpenses: requiresChargeOut=true, status in Approved/Paid" | **[PASS]** | Code lines 979-983 |

### Notification Queries

| # | Check | Result | Notes |
|---|-------|--------|-------|
| E-12 | Doc: "getAll uses cursor-based pagination" | **[PASS]** | Code lines 101-102: `take: limit + 1`, cursor |
| E-13 | Doc: "getAll filters by userId = session.user.id" | **[PASS]** | Code line 90, 93 |

### Project Queries

| # | Check | Result | Notes |
|---|-------|--------|-------|
| E-14 | Doc: "getAll uses parallel Promise.all for query and count" | **[PASS]** | Code line 309 |
| E-15 | Doc: "getBudgetUsage aggregates Approved+Paid expenses, utilizationRate = actualSpent/approvedBudget*100" | **[PASS]** | Code lines 585-600 match formula exactly |

**Set E Score: 15/15 - All Prisma query patterns verified correctly**

---

## Additional Findings (Not in Scope but Noteworthy)

| # | Finding | Severity | Details |
|---|---------|----------|---------|
| X-01 | chargeOut.md claims 14 procedures | **Minor** | Actual count is 13 procedures. This is a Round 1 count error, not a semantic issue. |
| X-02 | expense.getStats references 'PendingApproval' status | **Info** | Code line 1365 looks for 'PendingApproval' but expense enum only has 'Submitted'. This is a code bug (will always return 0) but doc correctly documents the code's output fields. |
| X-03 | notification.md correctly identifies that budgetProposal/expense routers bypass notification.create | **Good** | This is an important architectural observation that is accurate. |
| X-04 | expense.reject uses 'EXPENSE_REJECTED' notification type | **Medium** | This type is not in the NotificationType z.enum, meaning the notification.create router could NOT be called with this type. However, expense.reject creates the notification directly via prisma.notification.create (bypassing the enum validation), so it works at runtime. The doc omits this inconsistency. |
| X-05 | project.chargeOut uses `throw new Error` instead of TRPCError | **Info** | Code lines 1351-1371 use plain Error instead of TRPCError. project.md doc does not note this inconsistency. |

---

## Summary

| Set | Topic | Score | Max |
|-----|-------|-------|-----|
| A | State Machine Transitions | 25 | 25 |
| B | Transaction Logic | 25 | 25 |
| C | Notification Side Effects | 14 | 15 |
| D | Business Rule Validation | 20 | 20 |
| E | Prisma Query Patterns | 15 | 15 |
| **Total** | | **99** | **100** |

### Failure Details

1. **[C-08] EXPENSE_REJECTED notification type undocumented mismatch** (1 point deduction)
   - **What the doc says**: expense.reject "creates Notification to PM with reject reason" (true)
   - **What the doc misses**: The notification type 'EXPENSE_REJECTED' used in expense.reject (line 1255) is NOT defined in the NotificationType z.enum in notification.ts. The enum only has 6 types: PROPOSAL_SUBMITTED, PROPOSAL_APPROVED, PROPOSAL_REJECTED, PROPOSAL_MORE_INFO, EXPENSE_SUBMITTED, EXPENSE_APPROVED. The doc should have flagged this as a potential inconsistency since the notification router's create procedure would reject this type, though the direct prisma.notification.create call bypasses this validation.

### Overall Assessment

The documentation is **exceptionally accurate** at the semantic/business logic level. All state machine transitions, transaction ordering, budget formulas (increment/decrement/Math.max safety), permission checks, and Prisma query patterns match the actual code precisely. The only gap is a missing note about the EXPENSE_REJECTED notification type inconsistency between the expense router and the notification router's enum definition.
