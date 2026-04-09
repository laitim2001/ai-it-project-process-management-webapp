# Round 7 Verification: Runtime Dependency Graph

> Verified: 2026-04-09
> Verifier: Claude Opus 4.6 (1M context)
> Dimension: Actual runtime dependency graph vs documented architecture

---

## Set A: Package Cross-Import Verification (25 points)

### A1. packages/api (package.json)

**Declared dependencies:**
- `@itpm/auth: workspace:*` -- depends on auth
- `@itpm/db: workspace:*` -- depends on db
- `@trpc/server: ^10.45.1`
- `bcryptjs`, `next-auth`, `nodemailer`, `zod`

**Actual imports in source code:**
- `packages/api/src/trpc.ts:60` -- `import { prisma } from '@itpm/db';` (runtime)
- `packages/api/src/trpc.ts:62` -- `import '@itpm/auth';` (side-effect import for type extensions)
- `packages/api/src/routers/chargeOut.ts:58` -- `import type { Prisma } from '@itpm/db';` (type-only)

**Verdict:** MATCH. API depends on both db (runtime) and auth (type-extension side-effect). No undeclared imports.

### A2. packages/auth (package.json)

**Declared dependencies:**
- `@itpm/db: workspace:*` -- depends on db
- `@auth/prisma-adapter`, `bcryptjs`, `next-auth`

**Actual imports in source code:**
- `packages/auth/src/index.ts:92` -- `import { prisma } from '@itpm/db';` (runtime)

**Does NOT import:** `@itpm/api` or `@itpm/web`

**Verdict:** MATCH. Auth depends only on db at runtime. No undeclared imports.

### A3. packages/db (package.json)

**Declared dependencies:**
- `@prisma/client: ^5.9.1`

**Actual imports in source code:**
- `packages/db/src/index.ts` -- only imports from `@prisma/client`

**Does NOT import:** `@itpm/api`, `@itpm/auth`, or any other internal package.

**Verdict:** MATCH. db is a leaf node with zero internal dependencies.

### A4. apps/web (package.json)

**Declared dependencies:**
- `@itpm/api: workspace:*`
- `@itpm/auth: workspace:*`
- `@itpm/db: workspace:*`
- Plus 40+ external dependencies (React, Next.js, Radix UI, etc.)

**Actual imports found:**
- `apps/web/src/lib/trpc.ts:92` -- `import type { AppRouter } from '@itpm/api';` (type-only)
- `apps/web/src/app/api/trpc/[trpc]/route.ts:76` -- `import { appRouter, createInnerTRPCContext } from '@itpm/api';` (runtime)
- `apps/web/src/auth.ts:43` -- `import { prisma } from '@itpm/db';` (runtime)

**Verdict:** MATCH. Web depends on all three internal packages as declared.

### A5-A6. Cross-Import Patterns

| From \ To | @itpm/db | @itpm/auth | @itpm/api |
|-----------|----------|------------|-----------|
| @itpm/db | -- | NO | NO |
| @itpm/auth | YES (runtime) | -- | NO |
| @itpm/api | YES (runtime) | YES (side-effect) | -- |
| @itpm/web | YES (runtime) | YES (implicit via auth.ts) | YES (runtime) |

### A7. Circular Dependencies

**Result:** NO circular dependencies found.
- `db` imports nothing internal
- `auth` imports only `db`
- `api` imports `db` and `auth` (type extension only)
- `web` imports all three

The dependency DAG is strictly: `db` <- `auth` <- `api` <- `web` (with `web` also directly importing `db` and `auth`).

### A8. Comparison with Architecture Diagram

**Documented** (in `09-diagrams/system-architecture.md`):
```
WEB --> API (tRPC Client)
WEB --> AUTH (auth() Session)
API --> DB (ctx.prisma)
API --> AUTH (ctx.session)
AUTH --> DB (prisma User query)
```

**Actual (verified):**
- WEB -> API: via `import { appRouter, createInnerTRPCContext } from '@itpm/api'` in route handler, and `import type { AppRouter } from '@itpm/api'` in tRPC client. **MATCH**
- WEB -> AUTH: via `import { prisma } from '@itpm/db'` in `auth.ts` and session provider setup. Note: web imports `@itpm/db` directly (not just through auth/api). **MATCH** (diagram shows this as indirect)
- API -> DB: via `import { prisma } from '@itpm/db'` in `trpc.ts`. **MATCH**
- API -> AUTH: via `import '@itpm/auth'` (side-effect for type extensions). **PARTIAL MATCH** -- documented as "ctx.session 認證中介層" but actual runtime relationship is weaker (only type extension side-effect; session is injected from web's route handler, not from API package directly calling auth).
- AUTH -> DB: via `import { prisma } from '@itpm/db'` in `index.ts`. **MATCH**

**Score: 24/25** -- One minor inaccuracy: the diagram implies API directly calls AUTH for session management, but actually the session is obtained by web's route handler (`auth()`) and passed into API's `createInnerTRPCContext()`. The API package only imports `@itpm/auth` for TypeScript type extensions, not for runtime auth calls.

---

## Set B: tRPC Client-Server Contract (25 points)

### B1. AppRouter Type Export

**File:** `packages/api/src/root.ts` (line 102)
```typescript
export type AppRouter = typeof appRouter;
```

**Re-exported from:** `packages/api/src/index.ts` (line 59)
```typescript
export { appRouter, type AppRouter } from './root';
```

The appRouter merges 17 sub-routers: health, budgetPool, project, user, budgetProposal, vendor, quote, purchaseOrder, expense, dashboard, notification, currency, operatingCompany, omExpense, expenseCategory, chargeOut, permission.

### B2. tRPC Client Import

**File:** `apps/web/src/lib/trpc.ts` (line 92)
```typescript
import type { AppRouter } from '@itpm/api';
export const api = createTRPCReact<AppRouter>();
```

**Verdict:** CORRECT. The client imports `AppRouter` type from `@itpm/api` and creates a typed tRPC client. End-to-end type safety is maintained.

### B3-B5. Frontend-to-Router Procedure Tracing (10 calls)

| # | Frontend Page | tRPC Call | Router.Procedure | Input Match | Return Type |
|---|---------------|-----------|------------------|-------------|-------------|
| 1 | budget-pools/page.tsx | `api.budgetPool.getAll.useQuery({page, limit:9, search, year, sortBy, sortOrder})` | `budgetPool.getAll` | **MISMATCH** -- page sends `year` but router expects `financialYear` | items + pagination |
| 2 | budget-pools/[id]/page.tsx | `api.budgetPool.getById.useQuery({id})` | `budgetPool.getById` | MATCH | single budget pool |
| 3 | budget-pools/[id]/page.tsx | `api.budgetPool.getStats.useQuery({id})` | `budgetPool.getStats` | MATCH | stats object |
| 4 | dashboard/pm/page.tsx | `api.dashboard.getProjectManagerDashboard.useQuery()` | `dashboard.getProjectManagerDashboard` | MATCH (no input) | dashboard data |
| 5 | dashboard/supervisor/page.tsx | `api.dashboard.getSupervisorDashboard.useQuery({...})` | `dashboard.getSupervisorDashboard` | MATCH | dashboard data |
| 6 | expenses/page.tsx | `api.expense.getAll.useQuery({page, limit, search, ...})` | `expense.getAll` | MATCH | items + pagination |
| 7 | vendors/[id]/page.tsx | `api.vendor.getById.useQuery({id})` | `vendor.getById` | MATCH | single vendor |
| 8 | notifications/page.tsx | `api.notification.getAll.useInfiniteQuery({limit:20, isRead})` | `notification.getAll` | MATCH (infinite query) | paginated notifications |
| 9 | charge-outs/page.tsx | `api.chargeOut.getAll.useQuery({...})` | `chargeOut.getAll` | MATCH | items + pagination |
| 10 | data-import/page.tsx | `api.omExpense.importData.useMutation({...})` | `omExpense.importData` | MATCH | import result |

### CRITICAL FINDING: Budget Pool Year Filter Bug

**File:** `apps/web/src/app/[locale]/budget-pools/page.tsx` line 101
```typescript
year: yearFilter,  // sends "year" field
```

**File:** `packages/api/src/routers/budgetPool.ts` line 96
```typescript
financialYear: z.number().int().optional(),  // expects "financialYear" field
```

The frontend sends `year` but the Zod schema expects `financialYear`. Since the entire input is `.optional()` and Zod strips unknown keys by default, the `year` field is silently ignored. **The year filter on the Budget Pools list page is non-functional** -- it always shows all years regardless of the selected filter.

This is a runtime bug (not caught by TypeScript because tRPC type inference would normally flag this, but the Zod `.optional()` wrapping the entire object makes the input `undefined | {...}`, and unknown keys are stripped at runtime). However, the frontend TypeScript type checker should catch this since `year` is not in the Zod inferred type. This may be suppressed.

**Score: 22/25** -- All 10 traced calls have correct procedure-to-router mapping. One field name mismatch found (year vs financialYear) that constitutes a runtime bug.

---

## Set C: Provider Chain Verification (15 points)

### C1. Layout Provider Nesting

**File:** `apps/web/src/app/[locale]/layout.tsx` (lines 96-122)

Actual nesting order (outermost to innermost):
```
<>
  <Script> (sets html lang attribute)
  <Suspense fallback={null}>
    <GlobalProgress />       ← FEAT-012: top navigation progress bar
  </Suspense>
  <SessionProvider>          ← NextAuth SessionProvider wrapper
    <NextIntlClientProvider> ← next-intl i18n provider
      <TRPCProvider>         ← tRPC + React Query provider
        {children}           ← actual page content
        <Toaster />          ← shadcn/ui Toast notifications
      </TRPCProvider>
    </NextIntlClientProvider>
  </SessionProvider>
</>
```

### C2. Providers Inventory

**Providers found in `apps/web/src/components/providers/`:**
- `SessionProvider.tsx` -- wraps `next-auth/react`'s `SessionProvider`

**Provider in `apps/web/src/lib/`:**
- `trpc-provider.tsx` -- `TRPCProvider` wrapping `api.Provider` + `QueryClientProvider`

### C3. Documented vs Actual Chain

**Documented chain:** GlobalProgress -> SessionProvider -> NextIntlClientProvider -> TRPCProvider -> Toaster

**Actual chain (verified):**
1. `<Script>` (lang attribute)
2. `<GlobalProgress>` (wrapped in Suspense)
3. `<SessionProvider>`
4. `<NextIntlClientProvider>`
5. `<TRPCProvider>`
6. `{children}` + `<Toaster />`

**Verdict:** MATCH. The documented order matches exactly.

### C4. Provider Dependencies

- **TRPCProvider** does NOT depend on SessionProvider at the React level. The tRPC client uses `httpBatchLink` to call `/api/trpc` endpoint, which is a plain HTTP call. Session cookies are sent automatically by the browser. The session dependency is at the API route handler level (`apps/web/src/app/api/trpc/[trpc]/route.ts`) where `auth()` is called to inject session into tRPC context.
- **NextIntlClientProvider** is independent of session state.
- **SessionProvider** must be above any component using `useSession()` hook.

### C5. Toaster Rendering

**Verified:** `<Toaster />` is rendered (not just imported) inside `TRPCProvider` on line 118 of the locale layout. It uses `@/components/ui/toaster` which is the shadcn/ui toast notification component.

**Score: 15/15** -- Provider chain matches documentation exactly.

---

## Set D: Middleware Execution Order (15 points)

### D1. Middleware Structure

**File:** `apps/web/src/middleware.ts` (220 lines)

```typescript
const handleI18nRouting = createMiddleware(routing);  // line 77
const { auth } = NextAuth(authConfig);                // line 84
export default auth((req) => { ... });                // line 114
```

### D2. Actual Execution Order

```
1. Matcher filters request (exclude api, _next/static, _next/image, favicon.ico, login, register, forgot-password)
2. NextAuth auth() wrapper executes:
   a. Calls authorized callback (auth.config.ts line 88)
      - Strips locale prefix from pathname
      - Checks against 18 protected route prefixes
      - Returns false if protected + unauthenticated
   b. Passes control to middleware main function
3. Middleware main function (line 114):
   a. Checks isLoggedIn (!!req.auth?.user)
   b. Strips locale prefix (same logic, duplicated)
   c. Checks protected routes (same list, duplicated)
   d. If protected + not logged in → Response.redirect('/zh-TW/login?callbackUrl=...')
   e. Otherwise → handleI18nRouting(req) processes locale routing
```

### D3. Comparison with Documented Flow

**Documented** (in `06-auth-and-config/middleware.md`):
```
Request → matcher filter → NextAuth auth() → authorized callback → middleware main → i18n routing → Response
```

**Actual:** MATCH. The documented flow accurately describes the execution order.

### D4. Edge Cases

| Path | Behavior | Verified |
|------|----------|----------|
| `/` | Matches middleware. Passes auth (not protected). `handleI18nRouting` redirects to `/zh-TW`. | YES |
| `/api/trpc/...` | Excluded by matcher (`api` pattern). Middleware does NOT execute. | YES |
| `/_next/static/...` | Excluded by matcher. | YES |
| `/login` | Excluded by matcher (`login` in exclusion list). | YES |
| `/en/login` | **Potentially matched** -- `login` exclusion has no slash prefix, but the regex `(?!...login...)` applies to the beginning. `/en/login` starts with `/en` not `login`, so it WOULD match the middleware. However, since `/login` is not in protectedRoutes, no redirect happens. The i18n routing processes it normally. | CORRECT behavior, but matcher design is fragile. |
| `/zh-TW/projects/123` | Matched. Locale stripped -> `/projects/123`. `startsWith('/projects')` -> protected. If logged in, i18n routing handles it. If not, redirected to login. | YES |

### D5. Matcher Pattern

```typescript
matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login|register|forgot-password).*)']
```

**Known issue (documented):** The exclusion patterns lack path separators, meaning theoretical paths like `/login-history` would also be excluded. In practice this is unlikely to cause issues since no such routes exist.

**Score: 14/15** -- Execution order matches documentation. One minor: the documented middleware.md mentions `/budget-proposals` in the protected routes list (line 56), but the actual code uses `/proposals` (line 137 of middleware.ts). This is a documentation discrepancy.

---

## Set E: Session Data Flow (20 points)

### E1. Sign-In (Credentials Provider)

**File:** `apps/web/src/auth.ts` lines 131-191

On successful login, `authorize()` returns:
```typescript
{
  id: user.id,        // string (UUID)
  email: user.email,  // string
  name: user.name,    // string | null
  roleId: user.roleId, // number (1, 2, or 3)
  role: user.role,    // { id: number, name: string } from Prisma include
}
```

### E2. JWT Callback

**File:** `apps/web/src/auth.ts` lines 199-243

When `user` exists (initial login):
```typescript
token.id = user.id;
token.email = user.email;
token.name = user.name;
token.roleId = user.roleId!;   // non-null assertion
token.role = user.role!;        // non-null assertion
```

For Azure AD logins, additionally:
```typescript
// Upsert user in database
const dbUser = await prisma.user.upsert({...});
token.id = dbUser.id;
token.email = dbUser.email;
token.name = dbUser.name;
token.roleId = dbUser.roleId;
token.role = dbUser.role;       // from include: { role: true }
```

**JWT fields stored:** `id`, `email`, `name`, `roleId`, `role`

### E3. Session Callback

**File:** `apps/web/src/auth.ts` lines 247-263

```typescript
session.user = {
  id: token.id,
  email: token.email,
  name: token.name,
  role: token.role,
  // NOTE: roleId is NOT included in session.user (only in token)
};
```

**Session fields exposed:** `id`, `email`, `name`, `role` (but NOT `roleId`)

### E4. tRPC Context Creation

**File:** `apps/web/src/app/api/trpc/[trpc]/route.ts` lines 88-106

```typescript
const handler = async (req: NextRequest) => {
  const session = await auth();  // Gets NextAuth session
  return fetchRequestHandler({
    ...
    createContext: () => createInnerTRPCContext({ session }),
    ...
  });
};
```

**File:** `packages/api/src/trpc.ts` lines 124-129

```typescript
export const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,  // The full NextAuth session object
    prisma,                 // Prisma client instance
  };
};
```

### E5. protectedProcedure

**File:** `packages/api/src/trpc.ts` lines 323-333

```typescript
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});
```

In `ctx.session.user`, the following fields are available:
- `id` (string)
- `email` (string)
- `name` (string | null)
- `role` (object: `{ id: number, name: string }`)

The `supervisorProcedure` (line 393) accesses `ctx.session.user.role.name` for role checking.

### E6. Client-Side useSession()

**SessionProvider** wraps the app (line 112 of locale layout). Any client component can use:
```typescript
const { data: session, status } = useSession();
// session.user.id, session.user.email, session.user.name, session.user.role
```

### E7. Comparison with auth-system.md

**Documented JWT fields** (auth-system.md section 3.2):
```
JWT: id, email, name, roleId, role
```
**Actual:** MATCH.

**Documented Session fields** (auth-system.md section 3.4):
```
session.user: id, email, name, role
```
**Actual (auth.ts):** MATCH -- `roleId` is NOT in session.user per auth.ts.

**HOWEVER**, the documented discrepancy is real: `packages/auth/src/index.ts` (line 348 of session callback) DOES include `roleId` in session:
```typescript
session.user = {
  id: token.id,
  email: token.email,
  name: token.name,
  roleId: token.roleId,  // <-- Present in packages/auth
  role: token.role,
};
```

While `apps/web/src/auth.ts` (line 251) does NOT include `roleId`:
```typescript
session.user = {
  id: token.id,
  email: token.email,
  name: token.name,
  role: token.role,       // <-- roleId missing
};
```

Since the actual NextAuth instance used by the app is created from `apps/web/src/auth.ts` (line 270: `export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)`), the **runtime session does NOT include `roleId`**.

The `packages/auth/src/index.ts` configuration appears to be an older/legacy configuration that exports `authOptions` (typed as `any`) and is no longer the active auth configuration. The auth-system.md document correctly identifies this dual-config issue (section 10, point 1-2).

### E8. 24-Hour Session Duration

**auth.config.ts** line 149-151:
```typescript
session: {
  strategy: 'jwt',
  maxAge: 24 * 60 * 60, // 24 hours
},
```

**auth.ts** inherits from auth.config.ts via:
```typescript
export const authConfig: NextAuthConfig = {
  ...baseAuthConfig,  // includes session config
  ...
};
```

**Verdict:** CONFIRMED. The 24-hour session duration is set in auth.config.ts and inherited by auth.ts.

### Session Flow Summary

```
Login (Credentials/AzureAD)
  ↓
authorize() returns: { id, email, name, roleId, role }
  ↓
JWT callback: token = { id, email, name, roleId, role }
  (Azure AD: additionally upserts user in DB)
  ↓
Session callback: session.user = { id, email, name, role }
  (NOTE: roleId is dropped from session but kept in JWT)
  ↓
API Route: auth() → session → createInnerTRPCContext({ session })
  ↓
tRPC: ctx.session.user = { id, email, name, role }
  ↓
protectedProcedure: checks ctx.session.user exists
supervisorProcedure: checks ctx.session.user.role.name
adminProcedure: checks ctx.session.user.role.name === 'Admin'
```

**Score: 19/20** -- Session flow fully traced and matches documentation. One point deducted for the confirmed roleId inconsistency between packages/auth and apps/web/src/auth.ts (which auth-system.md correctly identifies but could be more prominent).

---

## Summary

| Set | Topic | Score | Max | Key Findings |
|-----|-------|-------|-----|--------------|
| A | Package Cross-Import | 24 | 25 | Dependency graph correct. Minor: diagram implies API calls AUTH for session, but actually session is injected by web's route handler. |
| B | tRPC Client-Server Contract | 22 | 25 | **BUG FOUND**: Budget Pools page sends `year` but router expects `financialYear` -- year filter is silently non-functional. |
| C | Provider Chain | 15 | 15 | Perfect match. Chain: GlobalProgress -> SessionProvider -> NextIntlClientProvider -> TRPCProvider -> Toaster. |
| D | Middleware Execution | 14 | 15 | Matches documentation. Minor: middleware.md mentions `/budget-proposals` but actual code uses `/proposals`. |
| E | Session Data Flow | 19 | 20 | Complete flow verified. roleId dropped from session (auth.ts) but present in JWT. Dual auth config confirmed. |
| **Total** | | **94** | **100** | |

### Critical Issues Found

1. **BUG (Set B):** Budget Pools list page year filter is broken -- frontend sends `year` field but API expects `financialYear`. Zod silently strips the unknown key.

### Notable Issues

2. **Dual auth config (Set E):** `packages/auth/src/index.ts` and `apps/web/src/auth.ts` contain independent auth configurations with type inconsistencies (roleId in session). Only auth.ts is active at runtime.

3. **Duplicated protected routes list (Set D):** The same 18 protected routes are defined in both `auth.config.ts` (authorized callback) and `middleware.ts` (main function), creating a maintenance burden and risk of desynchronization.

4. **Hardcoded locale in redirect (Set D):** Unauthenticated redirect goes to `/zh-TW/login` regardless of user's language preference.

5. **Architecture diagram minor inaccuracy (Set A):** The system-architecture.md implies API package directly calls AUTH for session management, but actually the web layer mediates this: web calls `auth()` and passes session into API's context.
