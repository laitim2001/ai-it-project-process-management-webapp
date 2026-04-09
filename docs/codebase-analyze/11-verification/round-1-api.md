# Verification Round 1-A: API Layer
Date: 2026-04-09

## Summary
Total checks: 102 | PASS: 98 | FAIL: 4 | Accuracy: 96.1%

---

## Detailed Results

### Set A: File Existence & Line Counts (21 checks)

#### Router Files — Existence and Line Count (17 checks)
- [PASS] A01: budgetPool.ts exists at `packages/api/src/routers/budgetPool.ts`, doc says 688 lines, actual 688
- [PASS] A02: budgetProposal.ts exists, doc says 941 lines, actual 941
- [PASS] A03: chargeOut.ts exists, doc says 1,040 lines, actual 1,040
- [PASS] A04: currency.ts exists, doc says 348 lines, actual 348
- [PASS] A05: dashboard.ts exists, doc says 522 lines, actual 522
- [PASS] A06: expense.ts exists, doc says 1,382 lines, actual 1,382
- [PASS] A07: expenseCategory.ts exists, doc says 337 lines, actual 337
- [PASS] A08: health.ts exists, doc says 2,421 lines, actual 2,421
- [PASS] A09: notification.ts exists, doc says 380 lines, actual 380
- [PASS] A10: omExpense.ts exists, doc says 2,762 lines, actual 2,762
- [PASS] A11: operatingCompany.ts exists, doc says 439 lines, actual 439
- [PASS] A12: permission.ts exists, doc says 451 lines, actual 451
- [PASS] A13: project.ts exists, doc says 2,634 lines, actual 2,634
- [PASS] A14: purchaseOrder.ts exists, doc says 1,004 lines, actual 1,004
- [PASS] A15: quote.ts exists, doc says 712 lines, actual 712
- [PASS] A16: user.ts exists, doc says 519 lines, actual 519
- [PASS] A17: vendor.ts exists, doc says 347 lines, actual 347

#### Infrastructure Files (4 checks)
- [FAIL] **A18: Total line count in router-index.md header**: Doc says "~13,859 行程式碼" but the sum of individual file lines is 16,927. All 17 individual per-file counts are correct; only the aggregate total in the header is wrong (off by 3,068).
- [PASS] A19: lib/email.ts exists, doc says 466 lines, actual 465 (within +/-5 tolerance)
- [PASS] A20: lib/passwordValidation.ts exists, doc says 147 lines, actual 147
- [PASS] A21: lib/schemaDefinition.ts exists, doc says 599 lines, actual 599

### Set B: Procedure Counts (18 checks)

Methodology: counting named procedure definitions matching `name: xxxProcedure` pattern.

- [PASS] B01: budgetPool: doc says 11, actual 11
- [PASS] B02: budgetProposal: doc says 12, actual 12
- [FAIL] **B03: chargeOut**: doc (router-index.md header AND chargeOut.md header) says **14**, actual **13**. The detail doc (chargeOut.md) body lists only 13 procedures (numbered 1-13) but its own header also claims "14".
- [PASS] B04: currency: doc says 7, actual 7
- [PASS] B05: dashboard: doc says 4, actual 4
- [PASS] B06: expense: doc says 15, actual 15
- [PASS] B07: expenseCategory: doc says 7, actual 7
- [PASS] B08: health: doc says 21, actual 21
- [PASS] B09: notification: doc says 7, actual 7
- [PASS] B10: omExpense: doc says 19, actual 19
- [PASS] B11: operatingCompany: doc says 9, actual 9
- [PASS] B12: permission: doc says 7, actual 7
- [PASS] B13: project: doc says 25, actual 25
- [PASS] B14: purchaseOrder: doc says 13, actual 13
- [PASS] B15: quote: doc says 11, actual 11
- [PASS] B16: user: doc says 13, actual 13
- [PASS] B17: vendor: doc says 6, actual 6
- [PASS] B18: Total procedures across all routers: doc says 200, actual 200

### Set C: Procedure Names & Line Numbers (30 checks)

#### project.ts — 10 sampled from 25 procedures
- [PASS] C01: `getAll` exists at line 225 (doc says "行 225")
- [PASS] C02: `getById` exists at line 383 (doc says "行 383")
- [PASS] C03: `create` exists at line 638 (doc says "行 638")
- [PASS] C04: `chargeOut` exists at line 1333 (doc says "行 1333")
- [PASS] C05: `importProjects` exists at line 1717 (doc says "行 1717")
- [PASS] C06: `syncBudgetCategories` exists at line 2160 (doc says "行 2160")
- [PASS] C07: `getOthersRequestedAmounts` exists at line 2318 (doc says "行 2318")
- [PASS] C08: `batchUpdateProjectBudgetCategories` exists at line 2409 (doc says "行 2409")
- [PASS] C09: `revertToDraft` exists at line 2543 (doc says "行 2543")
- [PASS] C10: Duplicate `getProjectCategories` confirmed at lines 1627 and 2118 (doc notes this at items 14 and 18)

#### omExpense.ts — 8 sampled from 19 procedures
- [PASS] C11: `importData` exists at line 384 (doc says "行 384")
- [PASS] C12: `createWithItems` exists at line 777 (doc says "行 777")
- [PASS] C13: `updateItemMonthlyRecords` exists at line 1510 (doc says "行 1510")
- [PASS] C14: `calculateYoYGrowth` exists at line 1952, confirmed as mutation (doc says "行 1952", mutation)
- [PASS] C15: `getSummary` exists at line 2329 (doc says "行 2329")
- [PASS] C16: `getBySourceExpenseId` exists at line 2745 (doc says "行 2745")
- [PASS] C17: `getCategories` exists at line 2240
- [PASS] C18: `getMonthlyTotals` exists at line 2254

#### expense.ts — 6 sampled from 15 procedures
- [PASS] C19: `revertToSubmitted` exists at line 890, uses supervisorProcedure (doc says "行 890~968", supervisorProcedure)
- [PASS] C20: `approve` exists at line 1073, uses supervisorProcedure (doc says "行 1073~1181")
- [PASS] C21: `reject` exists at line 1192, uses supervisorProcedure, sets status to Draft (doc says "Submitted -> Draft")
- [PASS] C22: `submit` exists at line 977 (doc says "行 977~1062")
- [PASS] C23: `revertToApproved` exists at line 843 (doc says "行 843~877")
- [PASS] C24: `getStats` exists at line 1347 (doc says "行 1347~1381")

#### health.ts — 4 sampled from 21 procedures
- [PASS] C25: `ping` exists at line 44 (doc says "行 44~46")
- [PASS] C26: `fullSchemaSync` exists at line 1974 (doc says "行 1974")
- [PASS] C27: `debugUserPermissions` exists at line 2315 (doc says "行 2315")
- [PASS] C28: `fixPermissionTables` exists at line 1657 (doc says "行 1657~1846")

#### chargeOut.ts — 2 sampled from 13 procedures
- [PASS] C29: `getEligibleExpenses` exists at line 969 (doc says "行 969~1039")
- [PASS] C30: `confirm` exists at line 514, uses supervisorProcedure (doc says "行 514~563", supervisorProcedure)

### Set D: Auth Levels (22 checks)

#### user.ts Auth Distribution (7 checks)
- [PASS] D01: publicProcedure for getAll, getById, getByRole, getManagers, getSupervisors, create, update, delete, getRoles, hasPassword — all 10 verified as publicProcedure
- [PASS] D02: protectedProcedure for changeOwnPassword — verified
- [PASS] D03: protectedProcedure for getOwnAuthInfo — verified
- [PASS] D04: adminProcedure for setPassword — verified
- [PASS] D05: Doc claim "大部分操作使用 publicProcedure，包括 create/update/delete" — verified: 10/13 are public, create/update/delete confirmed public
- [PASS] D06: user.ts total public count = 10, protected = 2, admin = 1 — matches doc
- [PASS] D07: Doc claim about bcrypt and validatePasswordStrength usage — `bcryptjs` and `validatePasswordStrength` import confirmed in source

#### health.ts Auth Distribution (2 checks)
- [PASS] D08: Doc says "全部 publicProcedure" — verified: all 21 procedures use publicProcedure
- [PASS] D09: Doc says "所有端點無需認證" — verified: 0 protected, 0 supervisor, 0 admin

#### Global Auth Distribution (4 checks)
- [FAIL] **D10: protectedProcedure count**: Doc says ~160, actual is **143**. Off by 17 (11% error).
- [PASS] D11: supervisorProcedure count: Doc says ~15, actual is 17. Off by 2, within tilde approximation tolerance.
- [PASS] D12: adminProcedure count: Doc says ~10, actual is 9. Off by 1, within tilde approximation tolerance.
- [FAIL] **D13: publicProcedure count**: Doc says ~15, actual is **31**. Off by 16 — more than double the stated value. health.ts alone has 21 public procedures.

#### Specific Router Auth Levels (9 checks)
- [PASS] D14: expense.ts — approve, reject, revertToSubmitted confirmed as supervisorProcedure
- [PASS] D15: chargeOut.ts — confirm, reject confirmed as supervisorProcedure
- [PASS] D16: budgetProposal.ts — confirmed 0 supervisor/admin procedures, only protectedProcedure
- [PASS] D17: expenseCategory.ts — create, update, delete, toggleStatus confirmed as supervisorProcedure (4 total)
- [PASS] D18: operatingCompany.ts — 6 supervisorProcedure confirmed (create, update, delete, toggleActive, getUserPermissions, setUserPermissions)
- [PASS] D19: currency.ts — 4 adminProcedure confirmed (create, update, delete, toggleActive)
- [PASS] D20: permission.ts — 4 adminProcedure confirmed (getUserPermissions, setUserPermission, setUserPermissions, getRolePermissions)
- [PASS] D21: omExpense.ts — all 19 procedures are protectedProcedure, 0 supervisor/admin
- [PASS] D22: project.ts — all 25 procedures are protectedProcedure, 0 supervisor/admin

### Set E: Cross-References (11 checks)

#### root.ts Registration (3 checks)
- [PASS] E01: root.ts registers exactly 17 routers (verified by grep count)
- [PASS] E02: All 17 router names in root.ts match the documented list: budgetPool, budgetProposal, chargeOut, currency, dashboard, expense, expenseCategory, health, notification, omExpense, operatingCompany, permission, project, purchaseOrder, quote, user, vendor
- [PASS] E03: root.ts location is `packages/api/src/root.ts` — doc reference is correct

#### Shared Libraries (3 checks)
- [PASS] E04: `packages/api/src/lib/email.ts` exists (465 lines)
- [PASS] E05: `packages/api/src/lib/passwordValidation.ts` exists (147 lines)
- [PASS] E06: `packages/api/src/lib/schemaDefinition.ts` exists (599 lines)

#### trpc.ts (2 checks)
- [PASS] E07: `packages/api/src/trpc.ts` exists (455 lines)
- [PASS] E08: Exports exactly 4 procedure types: publicProcedure (line 286), protectedProcedure (line 323), supervisorProcedure (line 392), adminProcedure (line 442)

#### Status Machine Flows (3 checks)
- [PASS] E09: BudgetProposal status enum: Draft, PendingApproval, Approved, Rejected, MoreInfoRequired — verified at budgetProposal.ts line 63
- [PASS] E10: Expense status enum: Draft, Submitted, Approved, Paid — verified at expense.ts line 71
- [PASS] E11: ChargeOut status enum: Draft, Submitted, Confirmed, Paid, Rejected — verified at chargeOut.ts line 63

---

## Failure Summary

| # | ID | Set | Item | Doc Claims | Actual | Severity |
|---|-----|-----|------|-----------|--------|----------|
| 1 | A18 | A | Total line count in router-index.md header | ~13,859 | 16,927 | **High** — off by 3,068 (22%). Individual counts correct; only the sum is wrong. |
| 2 | B03 | B | chargeOut procedure count (both index and detail header) | 14 | 13 | **Low** — off by 1. Detail body lists 13 correctly; only headers say 14. |
| 3 | D10 | D | protectedProcedure global count | ~160 | 143 | **Medium** — off by 17 (11%). |
| 4 | D13 | D | publicProcedure global count | ~15 | 31 | **High** — off by 16 (107% undercount). health.ts has 21 public + user.ts has 10 = 31. |

Note: supervisorProcedure (~15 vs 17) and adminProcedure (~10 vs 9) were deemed within acceptable tolerance for tilde-prefixed approximations and scored as PASS.

---

## Key Findings

### Strengths
1. **Individual router file line counts are 100% accurate** — all 17 files match exactly.
2. **Procedure names and line numbers are highly accurate** — every sampled procedure name and starting line matched the source code exactly.
3. **Procedure counts are 17/18 correct** (94.4%) — only chargeOut is off by 1.
4. **Status machine flows are 100% accurate** across all 3 documented workflows.
5. **Cross-references are 100% accurate** — root.ts registration, shared libs, trpc.ts all verified.
6. **Detail-level auth claims are accurate** — user.ts and health.ts auth levels match exactly.

### Issues
1. **router-index.md header total line count (13,859) is significantly wrong** — actual is 16,927. The sum of the individually-listed (correct) counts yields 16,927, so the header was likely computed from an earlier version or with a calculation error.
2. **Global auth distribution table is inaccurate** — especially publicProcedure (~15 vs 31). The doc appears to have undercounted the health.ts public procedures.
3. **chargeOut.md header says 14 procedures but body lists 13** — internal inconsistency in the detail doc.

### Recommendations
1. Recalculate the header total in router-index.md (should be ~16,927).
2. Fix the global auth distribution table: protected=143, supervisor=17, admin=9, public=31.
3. Fix chargeOut procedure count to 13 (in both router-index.md and chargeOut.md header).
