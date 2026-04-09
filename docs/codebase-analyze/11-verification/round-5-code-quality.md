# Round 5: Code Quality Patterns Analysis

**Date**: 2026-04-09
**Scope**: All 17 API routers, frontend components, tsconfig, import hygiene
**Focus**: N+1 queries, unbounded queries, error handling, duplication, TypeScript strictness, imports

---

## Set A: N+1 Query Detection

### Summary
Found **multiple N+1 patterns** in loop-based Prisma queries. Most occur inside `$transaction` blocks (mitigating connection overhead) but still issue sequential queries.

### Findings

#### A1. `deleteMany` Loop Pattern (3 routers)
All three `deleteMany` procedures use `for...of` loops with individual `findUnique` + `delete` calls:

| Router | File | Line | Pattern |
|--------|------|------|---------|
| `expense.ts` | `packages/api/src/routers/expense.ts` | 693-727 | `for (const id of input.ids) { findUnique + delete }` |
| `chargeOut.ts` | `packages/api/src/routers/chargeOut.ts` | 887-910 | `for (const id of input.ids) { findUnique + delete }` |
| `purchaseOrder.ts` | `packages/api/src/routers/purchaseOrder.ts` | 554-587 | `for (const id of input.ids) { findUnique + delete + transaction }` |
| `quote.ts` | `packages/api/src/routers/quote.ts` | 510-551 | `for (const id of input.ids) { findUnique + delete }` |

**Impact**: Low-Medium. These are user-initiated batch deletes, typically limited to small sets.
**Recommendation**: Could batch the `findMany` lookup and then iterate over results for validation, reducing N queries to 1+N.

#### A2. `budgetPool.ts` Category Upsert Loop (line 354-381)
Inside a `$transaction`, loops through categories with individual `update` or `create`:
```
for (const cat of categories) {
  if (cat.id) { await tx.budgetCategory.update(...) }
  else { await tx.budgetCategory.create(...) }
}
```
**Impact**: Low. Budget categories per pool are typically < 20. Transaction provides atomicity.

#### A3. `omExpense.ts` Data Import Loops (lines 420-655)
The `batchImport` procedure has multiple sequential loops:
- **Line 420**: `for (const name of missingOpCoNames)` -- creates OpCos one by one
- **Line 443**: `for (const name of missingCategoryNames)` -- creates categories one by one
- **Line 484**: `for (const item of items)` -- creates headers one by one
- **Line 529**: `for (const item of items)` -- findFirst + create items one by one
- **Line 638**: `for (const headerId of affectedHeaderIds)` -- findMany + update per header

**Impact**: Medium-High. Import can process hundreds of items. Each item triggers 2-3 queries.
**Recommendation**: Batch creates using `createMany`, pre-fetch all items with `findMany`, reduce in-loop queries.

#### A4. `project.ts` Import Loop (line 1867+)
Inside `$transaction`, processes each project row individually with upsert logic.
**Impact**: Medium. Import batches are bounded by spreadsheet size.

#### A5. `health.ts` Table Count Loop (line 244)
Loops through ~30 tables with `$queryRawUnsafe` per table.
**Impact**: Low. Health check is infrequently called; diagnostic tool only.

### N+1 Risk Matrix

| Router | N+1 Severity | Context | Mitigated? |
|--------|-------------|---------|------------|
| omExpense.ts (batchImport) | **HIGH** | Data import, potentially hundreds of items | Partially (inside tx) |
| project.ts (import) | **MEDIUM** | Data import, bounded by spreadsheet | Partially (inside tx) |
| expense.ts (deleteMany) | **LOW** | User-initiated, small batches | No |
| chargeOut.ts (deleteMany) | **LOW** | User-initiated, small batches | No |
| purchaseOrder.ts (deleteMany) | **LOW** | User-initiated, small batches | No |
| quote.ts (deleteMany) | **LOW** | User-initiated, small batches | No |
| budgetPool.ts (update) | **LOW** | Few categories per pool | Yes (inside tx) |
| health.ts (diagnose) | **NEGLIGIBLE** | Diagnostic tool only | N/A |

---

## Set B: Unbounded Query Detection

### Summary
Found **15+ unbounded `findMany` calls** without `take` limits. Most are scoped by filter conditions but could return large datasets.

### Findings

#### B1. Intentionally Unbounded (Export/Report Queries)

| Router | Procedure | Line | Notes |
|--------|-----------|------|-------|
| `project.ts` | `export` | 1288 | Intentionally unbounded for CSV export |
| `dashboard.ts` | `exportProjects` | 400, 434 | Export queries -- no `take` by design |
| `project.ts` | `getProjectSummary` | 1529 | Summary report, all projects for FY |
| `dashboard.ts` | `getBudgetPoolOverview` | 336 | All budget pools (low cardinality) |

**Risk**: Medium for export queries if dataset grows large. No server-side limit protects against OOM.

#### B2. Scoped but Unbounded Relation Queries

| Router | Procedure | Line | Scope | Risk |
|--------|-----------|------|-------|------|
| `project.ts` | `getByBudgetPool` | 498 | Per budget pool | Low-Medium |
| `quote.ts` | `getByProject` | 191 | Per project | Low |
| `quote.ts` | `getByVendor` | 226 | Per vendor | Low |
| `chargeOut.ts` | `getEligibleExpenses` | 993 | Approved expenses | Medium |
| `dashboard.ts` | `getProjectManagerDashboard` | 64 | Per user's projects | Medium |
| `dashboard.ts` | `proposalsNeedingInfo` | 122 | Per user | Low |
| `operatingCompany.ts` | `getAll` | 195, 408, 425 | All OpCos | Low (small table) |
| `currency.ts` | `getAll` | 260, 277 | All currencies | Low (small table) |

#### B3. Dashboard Nested Unbounded Includes

`dashboard.ts` lines 98-113: `getProjectManagerDashboard` includes `purchaseOrders` with nested `expenses` but no `take` on POs or expenses per project. For a PM with many projects, this could load a very large dataset.

**Recommendation**: Add `take` limits on nested includes, or use separate paginated queries.

#### B4. Export Queries with Full Includes

`dashboard.ts` lines 400-412: `exportProjects` includes `budgetPool: true, manager: true, supervisor: true, proposals: true, purchaseOrders: { include: { expenses: true } }` -- all without limits. This loads entire relationship trees.

---

## Set C: Error Handling Consistency

### Summary
**29 `throw new Error()` calls** found across 4 routers that should use `TRPCError` instead. 3 routers do not import `TRPCError` at all.

### Error Pattern Matrix

| Router | TRPCError Count | throw Error Count | Has try-catch | Imports TRPCError |
|--------|----------------|-------------------|---------------|-------------------|
| budgetProposal.ts | 19 | 0 | 0 | YES |
| chargeOut.ts | 24 | 0 | 0 | YES |
| expense.ts | 27 | 0 | 0 | YES |
| omExpense.ts | 34 | 0 | 1 | YES |
| project.ts | 24 | **6** | 1 | YES |
| purchaseOrder.ts | 23 | 0 | 0 | YES |
| quote.ts | 12 | 0 | 0 | YES |
| budgetPool.ts | 6 | **3** | 0 | YES |
| currency.ts | 6 | 0 | 0 | YES |
| expenseCategory.ts | 7 | 0 | 0 | YES |
| vendor.ts | 6 | 0 | 0 | YES |
| operatingCompany.ts | 9 | 0 | 0 | YES |
| dashboard.ts | 3 | 0 | 0 | YES |
| permission.ts | 4 | 0 | 0 | YES |
| **notification.ts** | **0** | **3** | 1 | **NO** |
| **user.ts** | **0** | **17** | 0 | **NO** |
| **health.ts** | **0** | **0** | 29 | **NO** |

### Critical Issues

#### C1. `user.ts` -- 17 `throw new Error()`, no TRPCError (CRITICAL)
All error handling in user.ts uses plain `throw new Error()` with Chinese messages:
- Line 136: `throw new Error('找不到該使用者')`
- Line 227: `throw new Error('此電子郵件已被使用')`
- Line 246: `throw new Error(passwordValidation.errors.join('；'))`
- ...13 more instances

**Impact**: tRPC wraps raw errors as `INTERNAL_SERVER_ERROR` with no structured error code. Frontend cannot distinguish 404 vs 400 vs 403.

#### C2. `notification.ts` -- 3 `throw new Error()`, no TRPCError
- Line 141: `throw new Error("通知不存在或無權訪問")`
- Line 184: `throw new Error("通知不存在或無權訪問")`
- Line 236: `throw new Error("通知不存在或無權訪問")`

#### C3. `project.ts` -- Mixed error handling (6 `throw new Error()` + 24 `TRPCError`)
Some procedures use `TRPCError` (getBudgetUsage, create, update) while others use raw Error (getById, chargeOut, getStats):
- Line 480: `throw new Error('Project not found')` (getById)
- Lines 1351-1370: 4x `throw new Error(...)` (chargeOut procedure)
- Line 1193: `throw new Error('Project not found')` (getStats)

#### C4. `budgetPool.ts` -- 3 `throw new Error()` mixed with 6 `TRPCError`
- Line 413: `throw new Error('Budget pool not found')` (delete)
- Line 417: `throw new Error(...)` (delete - has projects)
- Line 466: `throw new Error('Budget pool not found')` (getUsage)

#### C5. `health.ts` -- Uses try-catch extensively (29 blocks) but no TRPCError
Appropriate for a diagnostic tool that returns structured results rather than throwing.

---

## Set D: Code Duplication Detection

### Summary
Found **4 significant duplication patterns** across routers.

### D1. `deleteMany` Pattern (4 identical implementations)
The following 4 routers have near-identical `deleteMany` procedures:
- `expense.ts` (lines 686-730)
- `chargeOut.ts` (lines 874-910)
- `purchaseOrder.ts` (lines 547-590)
- `quote.ts` (lines 497-555)

All follow the exact same structure:
```typescript
const results = { deleted: 0, skipped: 0, errors: [] };
for (const id of input.ids) {
  const entity = await findUnique({ where: { id } });
  if (!entity) { results.errors.push(...); continue; }
  if (entity.status !== 'Draft') { results.skipped++; ... continue; }
  await delete({ where: { id } });
  results.deleted++;
}
return results;
```

**Instances**: 4
**Recommendation**: Extract a generic `createDeleteManyProcedure(model, statusCheck)` factory.

### D2. Notification Creation Pattern (5 instances across 2 routers)
Notification creation is duplicated inline:
- `budgetProposal.ts`: 2 instances (lines 378, 517)
- `expense.ts`: 3 instances (lines 1046, 1165, 1252)

All follow the same structure:
```typescript
await prisma.notification.create({
  data: {
    userId: targetUserId,
    type: 'TYPE_STRING',
    title: 'hardcoded Chinese string',
    message: `template ${variable}`,
    link: `/path/${id}`,
    entityType: 'ENTITY',
    entityId: id,
  },
});
```

**Issues**:
1. Hardcoded Chinese strings (should use i18n keys)
2. No email notification integration (only in-app)
3. Could be extracted to a `createNotification(type, entity, recipient)` helper

### D3. Pagination Response Pattern (6+ routers)
All paginated `getAll` procedures construct identical response shapes:
```typescript
return {
  items,
  pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
};
```
Repeated in: project.ts, budgetPool.ts, expense.ts, chargeOut.ts, purchaseOrder.ts, quote.ts, omExpense.ts, user.ts.

**Recommendation**: Extract `buildPaginatedResponse(items, total, page, limit)` utility.

### D4. Manager/Supervisor Select Pattern
The following `select` pattern appears 10+ times across routers:
```typescript
manager: { select: { id: true, name: true, email: true } },
supervisor: { select: { id: true, name: true, email: true } },
```
Found in: project.ts (5x), dashboard.ts (3x), budgetPool.ts (1x), expense.ts (2x).

**Recommendation**: Define a shared `userBasicSelect` constant.

### D5. `whereCondition: any` Pattern (4 routers)
Building where conditions with `any` type:
- `dashboard.ts` lines 250, 424
- `expense.ts` line 159
- `purchaseOrder.ts` line 128
- `quote.ts` lines 115, 183

All could use `Prisma.[Entity]WhereInput` instead of `any`.

---

## Set E: TypeScript Strictness

### Summary
TypeScript strict mode is **enabled** in `base.json`. Overall discipline is good with few escape hatches.

### E1. `as any` Occurrences

**API Layer (`packages/api/src/routers/`)**: 8 occurrences
| File | Line | Context |
|------|------|---------|
| dashboard.ts | 250 | `const where: any = {}` |
| dashboard.ts | 424 | `const where: any = {}` |
| expense.ts | 159 | `const whereCondition: any = {}` |
| expense.ts | 490 | `const updateData: any = {}` |
| purchaseOrder.ts | 128 | `const whereCondition: any = {}` |
| purchaseOrder.ts | 389 | `const updateData: any = {}` |
| quote.ts | 115 | `const whereCondition: any = {}` |
| quote.ts | 183 | `const whereCondition: any = {}` |

**Frontend (`apps/web/src/`)**: 14 occurrences across 12 files
| Category | Count | Files |
|----------|-------|-------|
| `session?.user as any` (role access) | 5 | TopBar.tsx, Sidebar.tsx, charge-outs/[id]/page.tsx, users/[id]/page.tsx, settings/page.tsx |
| `locale as any` (i18n routing) | 2 | request.ts, layout.tsx |
| `t('key' as any)` (dynamic i18n) | 4 | dashboard/pm/page.tsx (2x), dashboard/supervisor/page.tsx (2x), expenses/page.tsx |
| `currency as any` | 1 | settings/currencies/page.tsx |
| Other | 2 | i18n/CLAUDE.md (doc), expenses/page.tsx |

**Root Cause for `session?.user as any`**: The NextAuth session type does not include the custom `role` property. Fix: Extend the session type declaration.

### E2. `@ts-ignore` / `@ts-expect-error`: **0 occurrences** (excellent)

### E3. `eslint-disable` Occurrences: **3 total**
| File | Rule Disabled |
|------|---------------|
| `packages/db/src/index.ts:29` | `@typescript-eslint/no-require-imports` |
| `packages/auth/src/index.ts:174` | `@typescript-eslint/no-explicit-any` |
| `packages/api/src/routers/expenseCategory.ts:197` | `@typescript-eslint/no-explicit-any` |

### E4. TypeScript Configuration
| Setting | Value | Assessment |
|---------|-------|------------|
| `strict` | `true` | Good |
| `noUnusedLocals` | `false` | Lenient -- could enable |
| `noUnusedParameters` | `false` | Lenient -- could enable |
| `noFallthroughCasesInSwitch` | `true` | Good |
| `noUncheckedIndexedAccess` | `true` | Excellent (strictest) |

---

## Set F: Import/Export Hygiene

### F1. Circular Imports: **None detected**
Checked all cross-package imports:
- `packages/api` imports from `@itpm/db` (2 files) -- correct direction
- `packages/db` does NOT import from `@itpm/api` -- no cycle
- `packages/auth` does NOT import from `@itpm/api` -- no cycle
- `packages/api` references `@itpm/auth` only in a JSDoc comment, not an actual import

### F2. Barrel Exports
- `packages/api/src/index.ts`: Properly exports `appRouter`, `AppRouter`, `createInnerTRPCContext`
- `packages/api/src/root.ts`: Properly registers all 17 routers
- `packages/db/src/index.ts`: Exports Prisma client singleton
- Individual routers do NOT have barrel exports (imported directly by root.ts) -- appropriate pattern

### F3. Direct `node_modules` Imports: **Not found**
All imports use package names (`@trpc/server`, `zod`, `@prisma/client`, etc.) rather than direct `node_modules` paths.

### F4. Unused Imports
Not systematically verified (would require TypeScript compiler analysis), but the `noUnusedLocals: false` setting means the compiler does not catch unused imports at build time.

---

## Overall Code Quality Score

| Category | Score | Key Issues |
|----------|-------|------------|
| **N+1 Queries** | 6/10 | batchImport in omExpense has significant N+1; deleteMany patterns are minor |
| **Unbounded Queries** | 7/10 | Export queries intentionally unbounded; dashboard nested includes lack limits |
| **Error Handling** | 5/10 | user.ts and notification.ts entirely use raw Error; project.ts mixed |
| **Code Duplication** | 6/10 | deleteMany x4, notification x5, pagination x8 could be extracted |
| **TypeScript Strictness** | 8/10 | Strict mode on; 22 total `as any` (8 API + 14 frontend); 0 ts-ignore |
| **Import Hygiene** | 9/10 | No circular imports; clean barrel exports; proper package references |

### Top 5 Recommendations (Priority Order)

1. **[HIGH] Fix error handling in `user.ts`**: Replace all 17 `throw new Error()` with `TRPCError`. This router handles authentication-adjacent operations (password changes, user CRUD) where proper error codes matter.

2. **[HIGH] Fix error handling in `notification.ts`**: Replace 3 `throw new Error()` with `TRPCError`. Also add TRPCError import.

3. **[HIGH] Fix mixed errors in `project.ts`**: Convert remaining 6 `throw new Error()` to `TRPCError` with proper codes (NOT_FOUND, BAD_REQUEST).

4. **[MEDIUM] Extend NextAuth session type**: Properly type the `role` property on the session user to eliminate 5 `as any` casts in layout components. Define a module augmentation for `next-auth`.

5. **[MEDIUM] Extract shared patterns**: Create `createDeleteManyProcedure`, `createNotificationHelper`, `userBasicSelect`, and `buildPaginatedResponse` utilities to reduce duplication across routers.
