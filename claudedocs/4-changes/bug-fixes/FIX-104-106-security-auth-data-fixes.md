# FIX-104, FIX-105, FIX-106: Security Auth & Data Exposure Fixes

> **Date**: 2026-04-09
> **Severity**: CRITICAL
> **Status**: COMPLETE
> **Affected Files**: 7 router files + 2 frontend components

---

## FIX-104: budgetProposal.approve - Change to supervisorProcedure

### Problem
The `approve` procedure in `budgetProposal.ts` used `protectedProcedure`, allowing any authenticated user (including ProjectManagers) to approve/reject budget proposals. Only Supervisors and Admins should have this authority.

### Fix
Changed `approve` from `protectedProcedure` to `supervisorProcedure`.

### Verification
- `submit` remains `protectedProcedure` (PM submits their own proposals)
- `approve` now uses `supervisorProcedure` (only Supervisor/Admin can approve)
- `addComment` remains `protectedProcedure` (any authenticated user can comment)
- `revertToDraft` already has internal role check (`Admin` or `Supervisor`) via `ctx.session.user.role.name`

### File Changed
- `packages/api/src/routers/budgetProposal.ts` - Line ~401: `protectedProcedure` -> `supervisorProcedure`

---

## FIX-105: budgetProposal - Use ctx.session.user.id Instead of Client userId

### Problem
Three procedures (`submit`, `approve`, `addComment`) accepted `userId` from client input for audit/tracking purposes. This is a security issue because:
1. A malicious client could spoof another user's ID for audit trails
2. The server should always use the authenticated session user for "who performed this action"

### Fix

**Schema changes** (removed `userId` from input):
- `budgetProposalSubmitInputSchema`: Removed `userId` field
- `budgetProposalApprovalInputSchema`: Removed `userId` field
- `commentInputSchema`: Removed `userId` field

**Procedure body changes** (replaced `input.userId` with `ctx.session.user.id`):
- `submit`: History creation, submitter lookup for notification
- `approve`: `approvedBy` field, history creation, comment creation, reviewer lookup for notification
- `addComment`: Comment creation `userId` field

**Frontend changes** (removed `userId` from mutation calls):
- `ProposalActions.tsx`: Removed `userId` from `submitMutation.mutateAsync()` and `approveMutation.mutateAsync()`
- `CommentSection.tsx`: Removed `userId` from `addCommentMutation.mutateAsync()`

### Files Changed
- `packages/api/src/routers/budgetProposal.ts` - Schema definitions + 8 occurrences of `input.userId`
- `apps/web/src/components/proposal/ProposalActions.tsx` - 2 mutation calls
- `apps/web/src/components/proposal/CommentSection.tsx` - 1 mutation call

---

## FIX-106: Password Hash Exposure - Fix User Includes Across All Routers

### Problem
When using `include: { manager: true }` or `include: { user: true }` in Prisma queries, ALL user fields are returned including the `password` field (bcrypt hash). This data is then sent to the frontend via tRPC responses, exposing password hashes to the client.

### Fix
Added a reusable constant to each affected router file:
```typescript
const safeUserSelect = { id: true, name: true, email: true, image: true } as const;
```

Then replaced all bare `true` includes with safe selects:
```typescript
// BEFORE (leaks password)
include: { manager: true }

// AFTER (safe)
include: { manager: { select: safeUserSelect } }
```

### Affected Files and Fix Counts

| File | Patterns Fixed | Relations Fixed |
|------|---------------|-----------------|
| `budgetProposal.ts` | 19 occurrences | `manager`, `supervisor`, `user` (comments/history) |
| `chargeOut.ts` | 4 occurrences | `manager`, `supervisor`, `confirmer` |
| `dashboard.ts` | 4 occurrences | `manager`, `supervisor` (exportProjects) |
| `expense.ts` | 6 occurrences | `manager`, `supervisor` |
| `project.ts` | 1 occurrence | `manager` (revertToDraft) |

### Files Already Safe (no changes needed)
- `project.ts` (getAll, getById) - Already used `select: { id, name, email }`
- `dashboard.ts` (PM/Supervisor dashboards) - Already used `select: { id, name, email }`
- `purchaseOrder.ts` - Already used `select` patterns
- `quote.ts` - Already used `select` patterns for manager/supervisor
- `notification.ts` - Already used `select: { email: true }` for email lookup
- `chargeOut.ts` (getAll) - Already used `select` for confirmer
- `budgetPool.ts` - No user includes
- `omExpense.ts` - No user includes
- `vendor.ts` - No user includes
- `currency.ts` - No user includes
- `health.ts` - No user includes
- `permission.ts` - No user includes
- `operatingCompany.ts` - No user includes
- `expenseCategory.ts` - No user includes
- `user.ts` - Manages users directly (separate concern)

---

## Summary of All Changes

### Backend (packages/api/src/routers/)
| File | FIX-104 | FIX-105 | FIX-106 |
|------|---------|---------|---------|
| `budgetProposal.ts` | `approve` -> `supervisorProcedure` | Removed `userId` from 3 schemas, replaced 8 `input.userId` | 19 user includes fixed |
| `chargeOut.ts` | - | - | 4 user includes fixed |
| `dashboard.ts` | - | - | 4 user includes fixed |
| `expense.ts` | - | - | 6 user includes fixed |
| `project.ts` | - | - | 1 user include fixed |

### Frontend (apps/web/src/components/)
| File | Change |
|------|--------|
| `proposal/ProposalActions.tsx` | Removed `userId` from submit + approve mutation calls |
| `proposal/CommentSection.tsx` | Removed `userId` from addComment mutation call |

---

## Testing Recommendations

1. **FIX-104**: Test that a ProjectManager user cannot call the `approve` endpoint (should get FORBIDDEN error)
2. **FIX-105**: Test that history records, comments, and `approvedBy` fields correctly record the session user's ID
3. **FIX-106**: Verify API responses no longer contain `password` field in any user-related nested objects
4. **Regression**: Test full proposal workflow (create -> submit -> approve -> reject), expense workflow, and chargeOut workflow to ensure no broken data dependencies
