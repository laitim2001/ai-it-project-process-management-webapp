# Round 4: Undiscovered Security Issues

> **Date**: 2026-04-09
> **Approach**: Reverse verification -- find security issues the analysis MISSED
> **Existing review**: `10-issues-and-debt/security-review.md` (17 issues: SEC-001 to SEC-017)

---

## Set A: Authorization Bypass Scan (~25 points)

### NEW-SEC-018: [High] Budget Proposal `approve` uses `protectedProcedure` instead of `supervisorProcedure`
- **File**: `packages/api/src/routers/budgetProposal.ts`, line 399
- **Description**: The `approve` procedure uses `protectedProcedure`, meaning ANY logged-in user (including ProjectManager) can approve budget proposals. The chargeOut router correctly uses `supervisorProcedure` for `confirm` and `reject` (lines 514, 572), and the expense router correctly uses `supervisorProcedure` for `approve` (line 1073). This is inconsistent and allows privilege escalation.
- **Impact**: A ProjectManager can approve their own proposals, bypassing the intended approval workflow.
- **Evidence**: Line 399: `approve: protectedProcedure` vs expense.ts line 1073: `approve: supervisorProcedure`

### NEW-SEC-019: [High] Budget Proposal accepts `userId` from client input instead of using session
- **File**: `packages/api/src/routers/budgetProposal.ts`, lines 88, 93, 101
- **Description**: The `submit`, `approve`, and `addComment` procedures accept `userId` as a client-provided input parameter rather than deriving it from `ctx.session.user.id`. This allows any authenticated user to impersonate another user when submitting proposals, approving them, or adding comments. The `userId` is used directly in history records (line 366-370) and notifications (line 374-377).
- **Impact**: User A can submit/approve proposals while recording User B as the actor. Audit trail can be falsified.
- **Evidence**: `budgetProposalSubmitInputSchema` line 88: `userId: z.string().min(1)` used at line 366 for history; `budgetProposalApprovalInputSchema` line 93: `userId: z.string().min(1)` used at line 462 for history; `commentInputSchema` line 101: `userId: z.string().min(1)` used at line 545.

### NEW-SEC-020: [Medium] Project `create` and `update` have no ownership validation
- **File**: `packages/api/src/routers/project.ts`, lines 638, 802
- **Description**: Any authenticated user can create projects assigning arbitrary `managerId` and `supervisorId` values. The `update` procedure also allows any authenticated user to modify ANY project (including changing the manager/supervisor), regardless of whether they are the manager or supervisor of that project. Only `delete` has ownership checks (line 958-998).
- **Impact**: User A can modify User B's projects, change budget pools, or reassign managers.

### NEW-SEC-021: [Medium] Budget Pool CRUD has no role-based restriction
- **File**: `packages/api/src/routers/budgetPool.ts`, lines 284 (create), 322 (update), 399 (delete)
- **Description**: All budget pool operations use `protectedProcedure`. Creating, updating, and deleting budget pools should likely be restricted to Supervisor or Admin roles, as these control the top-level financial allocation for the organization.
- **Impact**: Any ProjectManager can create, modify, or delete budget pools.

### NEW-SEC-022: [Medium] Vendor CRUD has no role-based restriction
- **File**: `packages/api/src/routers/vendor.ts`, lines 191 (create), 225 (update), 278 (delete)
- **Description**: All vendor management operations use `protectedProcedure`. Any logged-in user can create, modify, or delete vendors.
- **Impact**: Data integrity risk - any user can manipulate vendor records.

### NEW-SEC-023: [Medium] PurchaseOrder `create` and `update` have no ownership/role check
- **File**: `packages/api/src/routers/purchaseOrder.ts`, lines 225 (create), 323 (update)
- **Description**: Any authenticated user can create POs for any project and update any PO in Draft status. No check verifies the user is the project manager or has any relationship to the project.

### NEW-SEC-024: [Medium] Expense `create` and `update` have no ownership validation
- **File**: `packages/api/src/routers/expense.ts`, lines 297 (create), 450 (update)
- **Description**: Any authenticated user can create expenses for any PO/project and update any Draft expense, with no check that the user is related to the project.

### NEW-SEC-025: [Low] Notification `create` procedure allows sending notifications to arbitrary users
- **File**: `packages/api/src/routers/notification.ts`, line 254
- **Description**: The `create` procedure accepts an arbitrary `userId` as the notification target and sends emails to that user. While intended as an "internal" method, it is exposed as a `protectedProcedure` that any authenticated user can call, potentially enabling spam or social engineering attacks via crafted notification messages.

---

## Set B: Input Validation Gaps (~20 points)

### NEW-SEC-026: [Medium] `$queryRawUnsafe` used with string interpolation in health router
- **File**: `packages/api/src/routers/health.ts`, line 246
- **Description**: The `diagnoseTables` procedure uses `$queryRawUnsafe` with a template literal that embeds table names from a hardcoded array. While the table names are not from user input (they are hardcoded at line 230-240), using `$queryRawUnsafe` is inherently dangerous and sets a bad precedent. If the array were ever changed to accept dynamic input, it would become a SQL injection vector.
- **Status**: [DUPLICATE - partially covered by SEC-010, but SEC-010 did not mention `$queryRawUnsafe` specifically]

### NEW-SEC-027: [Medium] Multiple string inputs lack `.max()` length limits
- **Files**: Multiple routers
- **Description**: Several Zod schemas accept strings with only `.min(1)` but no `.max()` limit, enabling potential DoS via oversized payloads:
  - `budgetProposal.ts` line 75: `title: z.string().min(1)` -- no max
  - `budgetProposal.ts` line 82: `title: z.string().min(1)` -- no max
  - `budgetProposal.ts` line 95: `comment: z.string().optional()` -- no max
  - `budgetProposal.ts` line 102: `content: z.string().min(1)` -- no max (comment body)
  - `budgetProposal.ts` line 563: `filePath: z.string().min(1)` -- no max
  - `budgetProposal.ts` line 564: `fileName: z.string().min(1)` -- no max
  - `expense.ts` line 80: `itemName: z.string().min(1)` -- no max
  - `expense.ts` line 81: `description: z.string().optional()` -- no max
  - `expense.ts` line 94: `name: z.string().min(1)` -- no max
  - `chargeOut.ts` line 80: `description: z.string().optional()` -- no max
  - `purchaseOrder.ts` line 66: `itemName: z.string().min(1)` -- no max
- **Impact**: Database storage exhaustion, potential buffer overflow in downstream processing.

### NEW-SEC-028: [Medium] Budget proposal `amount` field has no upper bound
- **File**: `packages/api/src/routers/budgetProposal.ts`, line 76
- **Description**: `amount: z.number().positive()` has no maximum value. A user could submit a proposal with an astronomically large amount (e.g., `Number.MAX_SAFE_INTEGER`), potentially causing arithmetic overflow in budget calculations.
- **Impact**: Financial data integrity issues.

### NEW-SEC-029: [Low] `emailData: z.any()` bypasses type validation
- **File**: `packages/api/src/routers/notification.ts`, line 265
- **Description**: The notification `create` procedure accepts `emailData: z.any().optional()`, completely bypassing Zod validation for this field. While it is used internally, if an attacker calls this endpoint they could pass arbitrary data structures that may cause unexpected behavior in the email service.

### NEW-SEC-030: [No Issue] File upload path traversal
- Already documented in SEC-011. [DUPLICATE]

---

## Set C: Sensitive Data Exposure (~20 points)

### NEW-SEC-031: [High] Budget Proposal `getAll` and `getById` leak User passwords via nested includes
- **File**: `packages/api/src/routers/budgetProposal.ts`, lines 134-161, 182-208
- **Description**: The `getAll` procedure includes `project: { include: { manager: true, supervisor: true } }` (lines 136-139) WITHOUT using `select` to exclude the `password` field. Similarly, `getById` (lines 184-187) includes the full manager and supervisor User objects. The `comments` and `historyItems` also include `user: true` (lines 144-145, 152-153, 192-193, 200-201) without excluding password.
  This means the API response contains the bcrypt password hash for:
  - Project managers
  - Project supervisors
  - All comment authors
  - All history item actors
- **Impact**: Unlike SEC-012 (User router), this affects an authenticated endpoint that returns User data as nested relations. Combined with SEC-001 (the User router being public), this creates multiple avenues for password hash exposure.
- **Evidence**: Line 137: `manager: true,` (no select), Line 138: `supervisor: true,` (no select), Line 145: `user: true,` (no select)

### NEW-SEC-032: [High] Multiple routers expose User password hashes via `manager: true` / `supervisor: true`
- **Files**:
  - `chargeOut.ts` lines 700-701: `manager: true, supervisor: true` (in getById)
  - `expense.ts` lines 988-989, 1035-1036, 1134-1135, 1205, 1242: `manager: true` and/or `supervisor: true`
  - `dashboard.ts` lines 404-405, 438-439: `manager: true, supervisor: true`
  - `project.ts` line 2558: `manager: true`
- **Description**: All these `include: { manager: true }` and `include: { supervisor: true }` patterns return the FULL User object including the `password` field. Only the project router's `getAll` and `getById` properly use `select` to pick specific fields (id, name, email).
- **Impact**: Password hashes are sent to the client in multiple API responses across the application.

### NEW-SEC-033: [Medium] Admin seed endpoint error responses leak internal details
- **File**: `apps/web/src/app/api/admin/seed/route.ts`, line 87
- **Description**: The GET endpoint (which has no auth - SEC-007) returns error details in the response: `details: error instanceof Error ? error.message : String(error)`. This can leak database connection strings, table structures, or Prisma error details to unauthenticated users.
- **Impact**: Information disclosure about database internals.

### NEW-SEC-034: [Medium] Register endpoint logs full error stack traces
- **File**: `apps/web/src/app/api/auth/register/route.ts`, lines 209-218
- **Description**: The error handler logs the complete error object including constructor name, message, and full stack trace. In Azure App Service, these logs are accessible to anyone with log access. More critically, the catch block at line 222 checks for "Unique constraint" in the error message and returns it as a response, potentially leaking Prisma-specific error patterns.
- **Status**: [PARTIALLY DUPLICATE with SEC-004 which covers auth logs, but this is about the register endpoint specifically]

### NEW-SEC-035: [Low] CORS not explicitly configured
- **Description**: No CORS configuration was found in `next.config.mjs` or middleware. Next.js API routes default to same-origin, which is secure by default. However, the `trustHost: true` setting in `auth.config.ts` (line 163) means NextAuth accepts requests from any Host header, which could be exploited in certain proxy configurations.
- **File**: `apps/web/src/auth.config.ts`, line 163
- **Impact**: Low risk in Azure App Service context, but worth documenting.

---

## Set D: Client-Side Security (~15 points)

### NEW-SEC-036: [No Issue] `dangerouslySetInnerHTML`
- Already documented in SEC-015. Only one instance, low risk. [DUPLICATE]

### NEW-SEC-037: [No Issue] `eval()` or `new Function()`
- **Result**: No matches found in any `.ts` or `.tsx` files under `apps/web/src/`. [NO ISSUE]

### NEW-SEC-038: [No Issue] localStorage stores only theme preference
- **File**: `apps/web/src/hooks/use-theme.ts`, line 177
- **Description**: localStorage is only used to store the theme preference (`'theme'` key with values like `'light'`, `'dark'`, `'system'`). No sensitive data (tokens, session, user data) is stored in localStorage. [NO ISSUE]

### NEW-SEC-039: [Low] Cookie security flags not explicitly configured
- **File**: `packages/auth/src/index.ts`
- **Description**: No explicit `cookies` configuration found in the NextAuth config. NextAuth.js defaults to `httpOnly: true`, `secure: true` in production (when using HTTPS), and `sameSite: 'lax'`. While the defaults are reasonable, they are not explicitly set, meaning configuration relies entirely on library defaults. The CLAUDE.md for auth mentions `httpOnly: true` but this is inherited from NextAuth defaults, not explicitly configured.
- **Impact**: If NextAuth defaults change in a future version, cookie security could degrade silently.

---

## Set E: Dependencies Security (~10 points)

### NEW-SEC-040: [DUPLICATE] bcrypt and bcryptjs dual installation
- Already documented in SEC-017. [DUPLICATE]

### NEW-SEC-041: [Medium] TypeScript and ESLint checks disabled during build
- **File**: `apps/web/next.config.mjs`, lines 30, 34
- **Description**: `typescript: { ignoreBuildErrors: true }` and `eslint: { ignoreDuringBuilds: true }` are both set. This means type errors and lint violations (which can catch security issues like unsafe type casts, missing null checks, etc.) are silently ignored during production builds. The comment says "Temporarily" but this is a permanent security concern.
- **Impact**: Type safety violations that could lead to runtime errors or security vulnerabilities are not caught at build time.

---

## Set F: Missing Security Features (~10 points)

### NEW-SEC-042: [High] No security headers configured
- **File**: `apps/web/next.config.mjs`
- **Description**: No security headers are configured anywhere:
  - No `X-Frame-Options` (clickjacking protection)
  - No `X-Content-Type-Options: nosniff` (MIME sniffing protection)
  - No `Content-Security-Policy` (XSS mitigation)
  - No `Strict-Transport-Security` (HSTS)
  - No `Referrer-Policy`
  - No `Permissions-Policy`
  Searched for these headers across `next.config.mjs`, `middleware.ts`, and all route files -- zero matches.
- **Impact**: The application is vulnerable to clickjacking, MIME sniffing attacks, and lacks defense-in-depth against XSS.
- **Recommendation**: Add headers via `next.config.mjs`:
  ```javascript
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    }];
  }
  ```

### NEW-SEC-043: [Medium] No request body size limiting on tRPC endpoint
- **File**: `apps/web/src/app/api/trpc/[trpc]/route.ts`
- **Description**: The tRPC handler has no explicit request body size limit. Combined with NEW-SEC-027 (string inputs without `.max()`), an attacker could send extremely large JSON payloads to any tRPC mutation. While Next.js has a default body size limit of 1MB for API routes, this is not explicitly configured and could be overridden.
- **Impact**: Potential DoS via large request payloads.

### NEW-SEC-044: [Medium] No audit logging for auth events
- **Description**: There is no structured audit logging for authentication events (successful logins, failed logins, password changes, role changes). The only logging is via `console.log` statements (SEC-004). There is no:
  - Login attempt tracking (for brute force detection)
  - Failed authentication alerting
  - Session creation/destruction logging
  - Role change audit trail
- **Impact**: Cannot detect or investigate unauthorized access attempts.

### NEW-SEC-045: [Low] No input sanitization middleware
- **Description**: There is no middleware-level input sanitization for HTML/script content. While tRPC uses Zod for validation, Zod validates structure but does not sanitize content. A user could store `<script>alert('xss')</script>` in any text field (project name, description, comments). React's default escaping prevents XSS in most cases, but any future use of `dangerouslySetInnerHTML` or SSR template injection could be exploited.
- **Impact**: Low risk currently (React escapes by default), but lack of defense-in-depth.

---

## Summary of New Findings

| ID | Severity | Category | Description |
|----|----------|----------|-------------|
| NEW-SEC-018 | High | AuthZ Bypass | Proposal `approve` uses `protectedProcedure` not `supervisorProcedure` |
| NEW-SEC-019 | High | AuthZ Bypass | Proposal procedures accept client-provided `userId` (impersonation) |
| NEW-SEC-020 | Medium | AuthZ Gap | Project create/update has no ownership validation |
| NEW-SEC-021 | Medium | AuthZ Gap | BudgetPool CRUD not restricted to Supervisor/Admin |
| NEW-SEC-022 | Medium | AuthZ Gap | Vendor CRUD not restricted by role |
| NEW-SEC-023 | Medium | AuthZ Gap | PurchaseOrder create/update no ownership check |
| NEW-SEC-024 | Medium | AuthZ Gap | Expense create/update no ownership check |
| NEW-SEC-025 | Low | AuthZ Gap | Notification create exposed to all authenticated users |
| NEW-SEC-027 | Medium | Input Validation | Multiple string inputs lack max length limits |
| NEW-SEC-028 | Medium | Input Validation | Amount fields have no upper bound |
| NEW-SEC-029 | Low | Input Validation | `emailData: z.any()` bypasses validation |
| NEW-SEC-031 | High | Data Exposure | Proposal queries leak User passwords via nested includes |
| NEW-SEC-032 | High | Data Exposure | Multiple routers expose passwords via `manager: true` / `supervisor: true` |
| NEW-SEC-033 | Medium | Data Exposure | Seed endpoint error responses leak internals |
| NEW-SEC-034 | Medium | Data Exposure | Register endpoint logs full stack traces |
| NEW-SEC-035 | Low | Config | CORS not explicitly configured + trustHost: true |
| NEW-SEC-039 | Low | Config | Cookie flags rely on library defaults |
| NEW-SEC-041 | Medium | Build | TypeScript/ESLint checks disabled in production build |
| NEW-SEC-042 | High | Missing Feature | No security headers (X-Frame-Options, CSP, HSTS, etc.) |
| NEW-SEC-043 | Medium | Missing Feature | No request body size limiting on tRPC |
| NEW-SEC-044 | Medium | Missing Feature | No structured audit logging for auth events |
| NEW-SEC-045 | Low | Missing Feature | No input sanitization middleware |

### Severity Distribution (New Issues Only)

| Severity | Count | Issue IDs |
|----------|-------|-----------|
| **High** | 5 | NEW-SEC-018, 019, 031, 032, 042 |
| **Medium** | 11 | NEW-SEC-020, 021, 022, 023, 024, 027, 028, 033, 034, 041, 043, 044 |
| **Low** | 6 | NEW-SEC-025, 029, 035, 039, 045 |
| **Total New** | **22** | |

### Top Priority Fixes (New Issues)

1. **NEW-SEC-018 + NEW-SEC-019**: Fix budget proposal `approve` to use `supervisorProcedure` and replace client-provided `userId` with `ctx.session.user.id`
2. **NEW-SEC-031 + NEW-SEC-032**: Add `select` clauses to ALL `include: { manager: true }`, `include: { supervisor: true }`, and `include: { user: true }` patterns to exclude `password` field
3. **NEW-SEC-042**: Add security headers in `next.config.mjs`
4. **NEW-SEC-020~024**: Add ownership/role checks for project, budget pool, vendor, PO, and expense CRUD operations
5. **NEW-SEC-027**: Add `.max()` limits to all string Zod schemas

### Duplicates Found (Already in security-review.md)

| Check | Status |
|-------|--------|
| SEC-011 Path traversal | DUPLICATE |
| SEC-010 Raw SQL in health | PARTIALLY DUPLICATE (NEW-SEC-026 extends) |
| SEC-015 dangerouslySetInnerHTML | DUPLICATE |
| SEC-017 bcrypt dual install | DUPLICATE |
| SEC-004 Auth logs | PARTIALLY DUPLICATE (NEW-SEC-034 extends to register) |
