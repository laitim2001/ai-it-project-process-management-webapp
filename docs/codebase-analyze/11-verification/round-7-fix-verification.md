# Round 7: Batch 1 Security Fix Verification (FIX-101 ~ FIX-108)

> **Verification Date**: 2026-04-09
> **Verifier**: Claude Opus 4.6 (1M context)
> **Scope**: FIX-101 through FIX-108 critical security fixes
> **Result**: 95/100 checks passed

---

## Set A: FIX-101 User Router Auth (15/15 points)

| # | Check | Status | Evidence |
|---|-------|--------|----------|
| A1 | `getAll` uses `protectedProcedure` | [FIXED] | Line 93: `getAll: protectedProcedure.query(...)` |
| A2 | `getById` uses `protectedProcedure` | [FIXED] | Line 109: `getById: protectedProcedure` |
| A3 | `getByRole` uses `protectedProcedure` | [FIXED] | Line 146: `getByRole: protectedProcedure` |
| A4 | `create` uses `adminProcedure` | [FIXED] | Line 216: `create: adminProcedure` |
| A5 | `update` uses `adminProcedure` | [FIXED] | Line 269: `update: adminProcedure` |
| A6 | `delete` uses `adminProcedure` | [FIXED] | Line 319: `delete: adminProcedure` |
| A7 | No procedures use `publicProcedure` | [FIXED] | Grep for `publicProcedure` in user.ts returns zero matches. Import line 58 only imports `protectedProcedure` and `adminProcedure`. |

**File**: `packages/api/src/routers/user.ts`
**Score**: 15/15

---

## Set B: FIX-102 Health Router Auth (13/15 points)

| # | Check | Status | Evidence |
|---|-------|--------|----------|
| B1 | All schema-modifying mutations use `adminProcedure` | [FIXED] | All 11 mutations (fixMigration, fixOmExpenseSchema, fixAllTables, fixExpenseItemSchema, fixAllSchemaIssues, createOMExpenseItemTable, fixFeat006AndFeat007Columns, fixProjectSchema, fixAllSchemaComplete, fixPermissionTables, fullSchemaSync) use `adminProcedure`. |
| B2 | Read-only health checks remain `publicProcedure` | [FIXED] | `ping`, `dbCheck`, `echo` remain `publicProcedure` (appropriate for health probes). |
| B3 | Procedure counts | [FIXED] | 10 `publicProcedure` (all read-only), 11 `adminProcedure` (all mutations), 0 `protectedProcedure`. |
| B4 | No schema-modifying procedure left public | [FIXED] | All `.mutation()` calls are on `adminProcedure`. All `.query()` calls are on `publicProcedure`. No mutation is public. |

**Note**: While all mutations are correctly protected, 7 diagnostic read-only queries (`schemaCheck`, `diagOmExpense`, `diagOpCo`, `schemaCompare`, `diagProjectSummary`, `fullSchemaCompare`, `debugUserPermissions`) remain `publicProcedure`. These expose internal schema structure and user permission data without authentication. This is a residual information-disclosure risk (not a schema-modification risk).

**File**: `packages/api/src/routers/health.ts`
**Score**: 13/15 (deducted 2 points for diagnostic info-disclosure queries remaining public)

---

## Set C: FIX-103 Upload API Auth (10/10 points)

### Quote Upload (`apps/web/src/app/api/upload/quote/route.ts`)
| # | Check | Status | Evidence |
|---|-------|--------|----------|
| C1 | Has `import { auth } from '@/auth'` | [FIXED] | Line 82: `import { auth } from '@/auth';` |
| C2 | Session check at top of POST handler | [FIXED] | Lines 104-107: `const session = await auth(); if (!session?.user) { return 401 }` |
| C3 | Unauthorized gets 401 | [FIXED] | Line 106: `return NextResponse.json({ error: '...' }, { status: 401 });` |

### Invoice Upload (`apps/web/src/app/api/upload/invoice/route.ts`)
| # | Check | Status | Evidence |
|---|-------|--------|----------|
| C4 | Has `import { auth } from '@/auth'` | [FIXED] | Line 68: `import { auth } from '@/auth';` |
| C5 | Session check at top of POST handler | [FIXED] | Lines 88-91: `const session = await auth(); if (!session?.user) { return 401 }` |
| C6 | Unauthorized gets 401 | [FIXED] | Line 90: `return NextResponse.json({ error: '...' }, { status: 401 });` |

### Proposal Upload (`apps/web/src/app/api/upload/proposal/route.ts`)
| # | Check | Status | Evidence |
|---|-------|--------|----------|
| C7 | Has `import { auth } from '@/auth'` | [FIXED] | Line 68: `import { auth } from '@/auth';` |
| C8 | Session check at top of POST handler | [FIXED] | Lines 94-97: `const session = await auth(); if (!session?.user) { return 401 }` |
| C9 | Unauthorized gets 401 | [FIXED] | Line 96: `return NextResponse.json({ error: '...' }, { status: 401 });` |

**Score**: 10/10

---

## Set D: FIX-104 Proposal Approve Auth (5/5 points)

| # | Check | Status | Evidence |
|---|-------|--------|----------|
| D1 | `approve` uses `supervisorProcedure` | [FIXED] | Line 401: `approve: supervisorProcedure` |
| D2 | `reject` logic integrated into `approve` | [FIXED] | The `approve` procedure handles all three actions: `Approved`, `Rejected`, `MoreInfoRequired` (line 97 schema). There is no separate `reject` procedure; rejection is handled via `approve` with `action: 'Rejected'`, which correctly requires `supervisorProcedure`. |

**File**: `packages/api/src/routers/budgetProposal.ts`
**Score**: 5/5

---

## Set E: FIX-105 userId Spoofing (15/15 points)

| # | Check | Status | Evidence |
|---|-------|--------|----------|
| E1 | `submit` uses `ctx.session.user.id` | [FIXED] | Line 371: `userId: ctx.session.user.id` (in history creation). No `input.userId` used. |
| E2 | `approve` uses `ctx.session.user.id` | [FIXED] | Lines 437, 469, 479, 498: All use `ctx.session.user.id` for approvedBy, history, comment, and notification lookup. |
| E3 | `addComment` uses `ctx.session.user.id` | [FIXED] | Line 544: `userId: ctx.session.user.id` |
| E4 | `input.userId` not found in file | [FIXED] | Grep for `input.userId` in budgetProposal.ts returns zero results. |
| E5 | ProposalActions.tsx does not pass userId | [FIXED] | `submitMutation.mutateAsync({ id: proposalId })` (line 179-181). `approveMutation.mutateAsync({ id: proposalId, action, comment })` (lines 208-212). No userId passed. |
| E6 | CommentSection.tsx does not reference userId | [FIXED] | Grep for `userId` in CommentSection.tsx returns zero results. |

**Score**: 15/15

---

## Set F: FIX-106 Password Hash Fix (20/20 points)

### budgetProposal.ts
| # | Check | Status | Evidence |
|---|-------|--------|----------|
| F1 | `safeUserSelect` defined | [FIXED] | Line 63: `const safeUserSelect = { id: true, name: true, email: true, image: true } as const;` |
| F2 | No bare `user: true` / `manager: true` / `supervisor: true` | [FIXED] | Grep returns zero matches. All 26 uses of `safeUserSelect` confirm proper select patterns. |

### chargeOut.ts
| # | Check | Status | Evidence |
|---|-------|--------|----------|
| F3 | `safeUserSelect` defined | [FIXED] | Line 63: `const safeUserSelect = { id: true, name: true, email: true, image: true } as const;` |
| F4 | No bare `user: true` / `manager: true` / `supervisor: true` | [FIXED] | Grep returns zero matches. 6 uses of `safeUserSelect` confirmed. |

### dashboard.ts
| # | Check | Status | Evidence |
|---|-------|--------|----------|
| F5 | `safeUserSelect` defined | [FIXED] | Line 51: `const safeUserSelect = { id: true, name: true, email: true, image: true } as const;` |
| F6 | No bare `manager: true` / `supervisor: true` | [FIXED] | Grep returns zero matches. Uses explicit `select: { id, name, email }` patterns, and 5 uses of `safeUserSelect` in exportProjects. |

### expense.ts
| # | Check | Status | Evidence |
|---|-------|--------|----------|
| F7 | `safeUserSelect` defined | [FIXED] | Line 66: `const safeUserSelect = { id: true, name: true, email: true, image: true } as const;` |
| F8 | No bare `user: true` / `manager: true` / `supervisor: true` | [FIXED] | Grep returns zero matches. 9 uses of `safeUserSelect` confirmed. |

### project.ts
| # | Check | Status | Evidence |
|---|-------|--------|----------|
| F9 | `safeUserSelect` defined | [FIXED] | Line 59: `const safeUserSelect = { id: true, name: true, email: true, image: true } as const;` |
| F10 | No bare `manager: true` / `supervisor: true` | [FIXED] | Grep returns zero matches. All manager/supervisor includes use explicit `select: { id, name, email }` or `select: { id, name, email, role: { select: { name: true } } }` patterns. 2 uses of `safeUserSelect`. |

**Score**: 20/20

---

## Set G: FIX-107~108 Git/Routes/Docs (17/20 points)

| # | Check | Status | Evidence |
|---|-------|--------|----------|
| G1 | `.gitignore` has `azure/output/` (no leading dot) | [FIXED] | Line 191: `azure/output/` |
| G2 | middleware.ts: `/proposals` in protected routes | [FIXED] | Line 136: `'/proposals'` (not `/budget-proposals`) |
| G3 | middleware.ts: `/project-data-import` in protected routes | [FIXED] | Line 148: `'/project-data-import'` |
| G4 | auth.config.ts: same route fixes applied | [FIXED] | Lines 114, 127-128: `'/proposals'` and `'/project-data-import'` both present in auth.config.ts protected routes. All 18 routes match middleware.ts exactly. |
| G5 | er-diagram.md: `hasItems` removed from OMExpense | [FIXED] | Grep for `hasItems` in er-diagram.md returns zero results. |
| G6 | schema-overview.md: Expense status is `Draft,Submitted,Approved,Paid` | [FIXED] | Line 177: `Expense | status | Draft, Submitted, Approved, Paid` |
| G7 | business-process.md: revertToDraft says Admin/Supervisor | [FIXED] | Lines 100-102: `Admin/Supervisor:<br/>revertToDraft?` |
| G8 | model-detail.md: `hasItems` removed | [FIXED] | Grep for `hasItems` in model-detail.md returns zero results. |
| G9 | page-index.md: page count is 60 | [FIXED] | Line 4: `**總計**: 23 個路由模組, 60 個 .tsx 頁面檔案` |
| G10 | SUMMARY.md: page count 60, Mermaid 30 | [FIXED] | Line 17: `23 個模組, 60 個 .tsx 頁面檔`, Line 22/155: `Mermaid 圖表 | 30` |

**Score**: 17/20 (deducted 3 points for health.ts diagnostic info-disclosure noted in Set B)

---

## Summary

| Set | Fix ID | Description | Score | Max |
|-----|--------|-------------|-------|-----|
| A | FIX-101 | User Router Auth | 15 | 15 |
| B | FIX-102 | Health Router Auth | 13 | 15 |
| C | FIX-103 | Upload API Auth | 10 | 10 |
| D | FIX-104 | Proposal Approve Auth | 5 | 5 |
| E | FIX-105 | userId Spoofing | 15 | 15 |
| F | FIX-106 | Password Hash Fix | 20 | 20 |
| G | FIX-107~108 | Git/Routes/Docs | 17 | 20 |
| **Total** | | | **95** | **100** |

## Overall Verdict

**All 8 FIX items (FIX-101 through FIX-108) have been correctly applied.**

### Residual Finding

**INFO-DISCLOSURE in health.ts**: 7 diagnostic read-only queries remain `publicProcedure` and expose:
- Database schema structure (`schemaCheck`, `schemaCompare`, `fullSchemaCompare`)
- OM expense table structure (`diagOmExpense`)
- Operating company data (`diagOpCo`)
- Project summary data (`diagProjectSummary`)
- User permission details by email (`debugUserPermissions`)

These are not schema-modifying and are likely intended for deployment debugging, but they should be promoted to `protectedProcedure` or `adminProcedure` in a future hardening pass to prevent unauthenticated information disclosure.
