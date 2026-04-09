# Round 6: Complete Route Protection Audit

**Date**: 2026-04-09
**Scope**: Every page route, every API procedure, every auth layer
**Severity Scale**: CRITICAL / HIGH / MEDIUM / LOW / INFO

---

## Set A: Middleware Protection Matrix

### A1. Middleware Protected Routes (from middleware.ts lines 132-150)

The middleware maintains TWO identical protectedRoutes lists:
1. In `middleware.ts` (lines 132-150) - handles redirect
2. In `auth.config.ts` (lines 109-129) - `authorized` callback

Both lists contain these 17 routes:
```
/dashboard, /projects, /budget-pools, /budget-proposals,
/vendors, /purchase-orders, /expenses, /users,
/om-expenses, /om-summary, /charge-outs, /quotes,
/notifications, /settings, /data-import, /operating-companies,
/om-expense-categories
```

### A2. Complete Route x Protection Matrix

| # | Route Path | Page Exists? | In protectedRoutes? | Protected? | Severity |
|---|-----------|-------------|---------------------|------------|----------|
| 1 | `/` (root) | Yes (redirect to /zh-TW) | N/A | Redirects only | OK |
| 2 | `/[locale]` | Yes (redirect to dashboard/login) | No | Uses useSession client-side | OK |
| 3 | `/[locale]/login` | Yes | No | Public (correct) | OK |
| 4 | `/[locale]/register` | Yes | No | Public (correct) | OK |
| 5 | `/[locale]/forgot-password` | Yes | No | Public (correct) | OK |
| 6 | `/[locale]/dashboard` | Yes | Yes (`/dashboard`) | PROTECTED | OK |
| 7 | `/[locale]/dashboard/pm` | Yes | Yes (`/dashboard`) | PROTECTED | OK |
| 8 | `/[locale]/dashboard/supervisor` | Yes | Yes (`/dashboard`) | PROTECTED | OK |
| 9 | `/[locale]/projects` | Yes | Yes (`/projects`) | PROTECTED | OK |
| 10 | `/[locale]/projects/new` | Yes | Yes (`/projects`) | PROTECTED | OK |
| 11 | `/[locale]/projects/[id]` | Yes | Yes (`/projects`) | PROTECTED | OK |
| 12 | `/[locale]/projects/[id]/edit` | Yes | Yes (`/projects`) | PROTECTED | OK |
| 13 | `/[locale]/projects/[id]/quotes` | Yes | Yes (`/projects`) | PROTECTED | OK |
| 14 | `/[locale]/budget-pools` | Yes | Yes (`/budget-pools`) | PROTECTED | OK |
| 15 | `/[locale]/budget-pools/new` | Yes | Yes (`/budget-pools`) | PROTECTED | OK |
| 16 | `/[locale]/budget-pools/[id]` | Yes | Yes (`/budget-pools`) | PROTECTED | OK |
| 17 | `/[locale]/budget-pools/[id]/edit` | Yes | Yes (`/budget-pools`) | PROTECTED | OK |
| **18** | **`/[locale]/proposals`** | **Yes** | **No** (`/budget-proposals` listed, NOT `/proposals`) | **UNPROTECTED** | **CRITICAL** |
| **19** | **`/[locale]/proposals/new`** | **Yes** | **No** | **UNPROTECTED** | **CRITICAL** |
| **20** | **`/[locale]/proposals/[id]`** | **Yes** | **No** | **UNPROTECTED** | **CRITICAL** |
| **21** | **`/[locale]/proposals/[id]/edit`** | **Yes** | **No** | **UNPROTECTED** | **CRITICAL** |
| 22 | `/[locale]/vendors` | Yes | Yes (`/vendors`) | PROTECTED | OK |
| 23 | `/[locale]/vendors/new` | Yes | Yes (`/vendors`) | PROTECTED | OK |
| 24 | `/[locale]/vendors/[id]` | Yes | Yes (`/vendors`) | PROTECTED | OK |
| 25 | `/[locale]/vendors/[id]/edit` | Yes | Yes (`/vendors`) | PROTECTED | OK |
| 26 | `/[locale]/purchase-orders` | Yes | Yes (`/purchase-orders`) | PROTECTED | OK |
| 27 | `/[locale]/purchase-orders/new` | Yes | Yes (`/purchase-orders`) | PROTECTED | OK |
| 28 | `/[locale]/purchase-orders/[id]` | Yes | Yes (`/purchase-orders`) | PROTECTED | OK |
| 29 | `/[locale]/purchase-orders/[id]/edit` | Yes | Yes (`/purchase-orders`) | PROTECTED | OK |
| 30 | `/[locale]/expenses` | Yes | Yes (`/expenses`) | PROTECTED | OK |
| 31 | `/[locale]/expenses/new` | Yes | Yes (`/expenses`) | PROTECTED | OK |
| 32 | `/[locale]/expenses/[id]` | Yes | Yes (`/expenses`) | PROTECTED | OK |
| 33 | `/[locale]/expenses/[id]/edit` | Yes | Yes (`/expenses`) | PROTECTED | OK |
| 34 | `/[locale]/charge-outs` | Yes | Yes (`/charge-outs`) | PROTECTED | OK |
| 35 | `/[locale]/charge-outs/new` | Yes | Yes (`/charge-outs`) | PROTECTED | OK |
| 36 | `/[locale]/charge-outs/[id]` | Yes | Yes (`/charge-outs`) | PROTECTED | OK |
| 37 | `/[locale]/charge-outs/[id]/edit` | Yes | Yes (`/charge-outs`) | PROTECTED | OK |
| 38 | `/[locale]/data-import` | Yes | Yes (`/data-import`) | PROTECTED | OK |
| **39** | **`/[locale]/project-data-import`** | **Yes** | **No** (only `/data-import` listed) | **UNPROTECTED** | **CRITICAL** |
| 40 | `/[locale]/om-expenses` | Yes | Yes (`/om-expenses`) | PROTECTED | OK |
| 41 | `/[locale]/om-expenses/new` | Yes | Yes (`/om-expenses`) | PROTECTED | OK |
| 42 | `/[locale]/om-expenses/[id]` | Yes | Yes (`/om-expenses`) | PROTECTED | OK |
| 43 | `/[locale]/om-expenses/[id]/edit` | Yes | Yes (`/om-expenses`) | PROTECTED | OK |
| 44 | `/[locale]/om-expense-categories` | Yes | Yes (`/om-expense-categories`) | PROTECTED | OK |
| 45 | `/[locale]/om-expense-categories/new` | Yes | Yes (`/om-expense-categories`) | PROTECTED | OK |
| 46 | `/[locale]/om-expense-categories/[id]/edit` | Yes | Yes (`/om-expense-categories`) | PROTECTED | OK |
| 47 | `/[locale]/om-summary` | Yes | Yes (`/om-summary`) | PROTECTED | OK |
| 48 | `/[locale]/operating-companies` | Yes | Yes (`/operating-companies`) | PROTECTED | OK |
| 49 | `/[locale]/operating-companies/new` | Yes | Yes (`/operating-companies`) | PROTECTED | OK |
| 50 | `/[locale]/operating-companies/[id]/edit` | Yes | Yes (`/operating-companies`) | PROTECTED | OK |
| 51 | `/[locale]/quotes` | Yes | Yes (`/quotes`) | PROTECTED | OK |
| 52 | `/[locale]/quotes/new` | Yes | Yes (`/quotes`) | PROTECTED | OK |
| 53 | `/[locale]/quotes/[id]/edit` | Yes | Yes (`/quotes`) | PROTECTED | OK |
| 54 | `/[locale]/users` | Yes | Yes (`/users`) | PROTECTED | OK |
| 55 | `/[locale]/users/new` | Yes | Yes (`/users`) | PROTECTED | OK |
| 56 | `/[locale]/users/[id]` | Yes | Yes (`/users`) | PROTECTED | OK |
| 57 | `/[locale]/users/[id]/edit` | Yes | Yes (`/users`) | PROTECTED | OK |
| 58 | `/[locale]/notifications` | Yes | Yes (`/notifications`) | PROTECTED | OK |
| 59 | `/[locale]/settings` | Yes | Yes (`/settings`) | PROTECTED | OK |
| 60 | `/[locale]/settings/currencies` | Yes | Yes (`/settings`) | PROTECTED | OK |

### A3. Critical Findings - Middleware Gaps

**FINDING A-1 (CRITICAL): `/proposals` route NOT protected by middleware**
- File: `apps/web/src/middleware.ts` line 136
- The protectedRoutes list contains `/budget-proposals` but the actual page route is `/proposals`
- All 4 proposals pages (`/proposals`, `/proposals/new`, `/proposals/[id]`, `/proposals/[id]/edit`) are accessible without authentication
- The route name mismatch means unauthenticated users can access the proposals UI
- **Mitigation**: The tRPC API calls (`budgetProposal.getAll`) use `protectedProcedure`, so the page will show errors but the route itself is accessible
- **Fix**: Change `/budget-proposals` to `/proposals` in BOTH `middleware.ts` AND `auth.config.ts`

**FINDING A-2 (CRITICAL): `/project-data-import` route NOT protected by middleware**
- File: `apps/web/src/middleware.ts` line 148
- The route `/data-import` is protected, but `/project-data-import` is a separate route that is NOT in the list
- File: `apps/web/src/app/[locale]/project-data-import/page.tsx` exists and is a fully functional page
- **Fix**: Add `/project-data-import` to protectedRoutes in BOTH files

**FINDING A-3 (MEDIUM): Duplicate protectedRoutes maintenance**
- The protectedRoutes list is duplicated in `middleware.ts` (line 132) AND `auth.config.ts` (line 109)
- Both must be kept in sync, which is error-prone
- These two lists are currently identical, but any future edit to one file without updating the other will create a gap

---

## Set B: API Auth Level Matrix

### B1. Complete Procedure Auth Matrix (18 Routers, ~200 Procedures)

#### budgetPool.ts (12 procedures)
| Procedure | Auth Level | Operation | Issue? |
|-----------|-----------|-----------|--------|
| getAll | protected | READ | OK |
| getById | protected | READ | OK |
| getByYear | protected | READ | OK |
| create | protected | WRITE | OK |
| update | protected | WRITE | OK |
| delete | protected | WRITE | OK |
| getStats | protected | READ | OK |
| export | protected | READ | OK |
| getCategories | protected | READ | OK |
| getCategoryStats | protected | READ | OK |
| updateCategoryUsage | protected | WRITE | OK |

#### budgetProposal.ts (12 procedures)
| Procedure | Auth Level | Operation | Issue? |
|-----------|-----------|-----------|--------|
| getAll | protected | READ | OK |
| getById | protected | READ | OK |
| create | protected | WRITE | OK |
| update | protected | WRITE | OK |
| submit | protected | WRITE | OK |
| approve | protected | WRITE | Should be supervisor? |
| addComment | protected | WRITE | OK |
| uploadProposalFile | protected | WRITE | OK |
| updateMeetingNotes | protected | WRITE | OK |
| delete | protected | WRITE | OK |
| deleteMany | protected | WRITE | OK |
| revertToDraft | protected | WRITE | OK |

#### chargeOut.ts (13 procedures)
| Procedure | Auth Level | Operation | Issue? |
|-----------|-----------|-----------|--------|
| create | protected | WRITE | OK |
| update | protected | WRITE | OK |
| updateItems | protected | WRITE | OK |
| submit | protected | WRITE | OK |
| confirm | **supervisor** | WRITE | OK (correct) |
| reject | **supervisor** | WRITE | OK (correct) |
| markAsPaid | protected | WRITE | OK |
| getById | protected | READ | OK |
| getAll | protected | READ | OK |
| delete | protected | WRITE | OK |
| deleteMany | protected | WRITE | OK |
| revertToDraft | protected | WRITE | OK |
| getEligibleExpenses | protected | READ | OK |

#### currency.ts (6 procedures)
| Procedure | Auth Level | Operation | Issue? |
|-----------|-----------|-----------|--------|
| create | **admin** | WRITE | OK (correct) |
| update | **admin** | WRITE | OK (correct) |
| delete | **admin** | WRITE | OK (correct) |
| getAll | protected | READ | OK |
| getActive | protected | READ | OK |
| getById | protected | READ | OK |
| toggleActive | **admin** | WRITE | OK (correct) |

#### dashboard.ts (4 procedures)
| Procedure | Auth Level | Operation | Issue? |
|-----------|-----------|-----------|--------|
| getProjectManagerDashboard | protected | READ | OK |
| getSupervisorDashboard | protected | READ | OK |
| exportProjects | protected | READ | OK |
| getProjectManagers | protected | READ | OK |

#### expense.ts (16 procedures)
| Procedure | Auth Level | Operation | Issue? |
|-----------|-----------|-----------|--------|
| getAll | protected | READ | OK |
| getById | protected | READ | OK |
| create | protected | WRITE | OK |
| update | protected | WRITE | OK |
| delete | protected | WRITE | OK |
| deleteMany | protected | WRITE | OK |
| revertToDraft | protected | WRITE | OK |
| revertToApproved | protected | WRITE | OK |
| revertToSubmitted | **supervisor** | WRITE | OK (correct) |
| submit | protected | WRITE | OK |
| approve | **supervisor** | WRITE | OK (correct) |
| reject | **supervisor** | WRITE | OK (correct) |
| markAsPaid | protected | WRITE | OK |
| getByPurchaseOrder | protected | READ | OK |
| getStats | protected | READ | OK |

#### expenseCategory.ts (7 procedures)
| Procedure | Auth Level | Operation | Issue? |
|-----------|-----------|-----------|--------|
| create | **supervisor** | WRITE | OK |
| update | **supervisor** | WRITE | OK |
| getById | protected | READ | OK |
| getAll | protected | READ | OK |
| getActive | protected | READ | OK |
| delete | **supervisor** | WRITE | OK |
| toggleStatus | **supervisor** | WRITE | OK |

#### health.ts (21 procedures) - ALL PUBLIC
| Procedure | Auth Level | Operation | Issue? |
|-----------|-----------|-----------|--------|
| ping | **public** | READ | OK (health check) |
| dbCheck | **public** | READ | OK (health check) |
| echo | **public** | READ | OK (health check) |
| fixMigration | **public** | **WRITE** | **CRITICAL** |
| schemaCheck | **public** | READ | **HIGH** (schema info) |
| diagOmExpense | **public** | READ | **HIGH** (data exposure) |
| diagOpCo | **public** | READ | **HIGH** (data exposure) |
| fixOmExpenseSchema | **public** | **WRITE** | **CRITICAL** |
| fixAllTables | **public** | **WRITE** | **CRITICAL** |
| schemaCompare | **public** | READ | **HIGH** (schema info) |
| fixExpenseItemSchema | **public** | **WRITE** | **CRITICAL** |
| fixAllSchemaIssues | **public** | **WRITE** | **CRITICAL** |
| createOMExpenseItemTable | **public** | **WRITE** | **CRITICAL** |
| fixFeat006AndFeat007Columns | **public** | **WRITE** | **CRITICAL** |
| diagProjectSummary | **public** | READ | **HIGH** (data/schema exposure) |
| fixProjectSchema | **public** | **WRITE** | **CRITICAL** |
| fixAllSchemaComplete | **public** | **WRITE** | **CRITICAL** |
| fixPermissionTables | **public** | **WRITE** | **CRITICAL** |
| fullSchemaCompare | **public** | READ | **HIGH** (full schema info) |
| fullSchemaSync | **public** | **WRITE** | **CRITICAL** |
| debugUserPermissions | **public** | READ | **CRITICAL** (user data by email) |

#### notification.ts (7 procedures)
| Procedure | Auth Level | Operation | Issue? |
|-----------|-----------|-----------|--------|
| getAll | protected | READ | OK |
| getById | protected | READ | OK |
| getUnreadCount | protected | READ | OK |
| markAsRead | protected | WRITE | OK |
| markAllAsRead | protected | WRITE | OK |
| delete | protected | WRITE | OK |
| create | protected | WRITE | OK |

#### omExpense.ts (21 procedures)
| Procedure | Auth Level | Operation | Issue? |
|-----------|-----------|-----------|--------|
| importData | protected | WRITE | OK |
| createWithItems | protected | WRITE | OK |
| addItem | protected | WRITE | OK |
| updateItem | protected | WRITE | OK |
| removeItem | protected | WRITE | OK |
| reorderItems | protected | WRITE | OK |
| updateItemMonthlyRecords | protected | WRITE | OK |
| create | protected | WRITE | OK |
| update | protected | WRITE | OK |
| updateMonthlyRecords | protected | WRITE | OK |
| calculateYoYGrowth | protected | READ | OK |
| getById | protected | READ | OK |
| getAll | protected | READ | OK |
| delete | protected | WRITE | OK |
| deleteMany | protected | WRITE | OK |
| getCategories | protected | READ | OK |
| getMonthlyTotals | protected | READ | OK |
| getSummary | protected | READ | OK |
| getBySourceExpenseId | protected | READ | OK |

#### operatingCompany.ts (9 procedures)
| Procedure | Auth Level | Operation | Issue? |
|-----------|-----------|-----------|--------|
| create | **supervisor** | WRITE | OK |
| update | **supervisor** | WRITE | OK |
| getById | protected | READ | OK |
| getAll | protected | READ | OK |
| delete | **supervisor** | WRITE | OK |
| toggleActive | **supervisor** | WRITE | OK |
| getUserPermissions | **supervisor** | READ | OK |
| setUserPermissions | **supervisor** | WRITE | OK |
| getForCurrentUser | protected | READ | OK |

#### permission.ts (7 procedures)
| Procedure | Auth Level | Operation | Issue? |
|-----------|-----------|-----------|--------|
| getAllPermissions | protected | READ | OK |
| getMyPermissions | protected | READ | OK |
| getUserPermissions | **admin** | READ | OK |
| setUserPermission | **admin** | WRITE | OK |
| setUserPermissions | **admin** | WRITE | OK |
| getRolePermissions | **admin** | READ | OK |
| hasPermission | protected | READ | OK |

#### project.ts (22 procedures)
| Procedure | Auth Level | Operation | Issue? |
|-----------|-----------|-----------|--------|
| getAll | protected | READ | OK |
| getById | protected | READ | OK |
| getByBudgetPool | protected | READ | OK |
| getBudgetUsage | protected | READ | OK |
| create | protected | WRITE | OK |
| update | protected | WRITE | OK |
| delete | protected | WRITE | OK |
| deleteMany | protected | WRITE | OK |
| getStats | protected | READ | OK |
| export | protected | READ | OK |
| chargeOut | protected | WRITE | OK |
| checkCodeAvailability | protected | READ | OK |
| getProjectSummary | protected | READ | OK |
| getProjectCategories | protected | READ | OK |
| getByProjectCodes | protected | READ | OK |
| importProjects | protected | WRITE | OK |
| getFiscalYears | protected | READ | OK |
| syncBudgetCategories | protected | WRITE | OK |
| getProjectBudgetCategories | protected | READ | OK |
| getOthersRequestedAmounts | protected | READ | OK |
| updateProjectBudgetCategory | protected | WRITE | OK |
| batchUpdateProjectBudgetCategories | protected | WRITE | OK |
| getProjectBudgetCategorySummary | protected | READ | OK |
| revertToDraft | protected | WRITE | OK |

#### purchaseOrder.ts (13 procedures)
| Procedure | Auth Level | Operation | Issue? |
|-----------|-----------|-----------|--------|
| getAll | protected | READ | OK |
| getById | protected | READ | OK |
| create | protected | WRITE | OK |
| update | protected | WRITE | OK |
| delete | protected | WRITE | OK |
| deleteMany | protected | WRITE | OK |
| revertToDraft | protected | WRITE | OK |
| revertToSubmitted | **supervisor** | WRITE | OK |
| getByProject | protected | READ | OK |
| submit | protected | WRITE | OK |
| approve | **supervisor** | WRITE | OK |
| createFromQuote | protected | WRITE | OK |
| getStats | protected | READ | OK |

#### quote.ts (11 procedures)
| Procedure | Auth Level | Operation | Issue? |
|-----------|-----------|-----------|--------|
| getAll | protected | READ | OK |
| getByProject | protected | READ | OK |
| getByVendor | protected | READ | OK |
| getById | protected | READ | OK |
| create | protected | WRITE | OK |
| update | protected | WRITE | OK |
| delete | protected | WRITE | OK |
| deleteMany | protected | WRITE | OK |
| revertToDraft | protected | WRITE | OK |
| compare | protected | READ | OK |
| getStats | protected | READ | OK |

#### user.ts (12 procedures)
| Procedure | Auth Level | Operation | Issue? |
|-----------|-----------|-----------|--------|
| getAll | **public** | READ | **HIGH** (lists all users) |
| getById | **public** | READ | **HIGH** (user details) |
| getByRole | **public** | READ | **MEDIUM** (user list by role) |
| getManagers | **public** | READ | **MEDIUM** (manager list) |
| getSupervisors | **public** | READ | **MEDIUM** (supervisor list) |
| create | **public** | **WRITE** | **CRITICAL** (create any user) |
| update | **public** | **WRITE** | **CRITICAL** (update any user) |
| delete | **public** | **WRITE** | **CRITICAL** (delete any user) |
| getRoles | **public** | READ | **LOW** (role list) |
| setPassword | **admin** | WRITE | OK (correct) |
| hasPassword | **public** | READ | **LOW** |
| changeOwnPassword | protected | WRITE | OK |
| getOwnAuthInfo | protected | READ | OK |

#### vendor.ts (6 procedures)
| Procedure | Auth Level | Operation | Issue? |
|-----------|-----------|-----------|--------|
| getAll | protected | READ | OK |
| getById | protected | READ | OK |
| create | protected | WRITE | OK |
| update | protected | WRITE | OK |
| delete | protected | WRITE | OK |
| getStats | protected | READ | OK |

### B2. Critical Findings - API Auth

**FINDING B-1 (CRITICAL): user.ts - ALL CRUD operations are publicProcedure**
- `user.create` is public - anyone can create users via API
- `user.update` is public - anyone can update any user via API
- `user.delete` is public - anyone can delete any user via API
- `user.getAll` is public - anyone can list all users with emails
- `user.getById` is public - anyone can get any user's details
- **Impact**: Complete user management bypass. An attacker can create admin users, delete all users, or exfiltrate user data without any authentication.
- **Fix**: Change create/update/delete to `adminProcedure`, change getAll/getById to `protectedProcedure`

**FINDING B-2 (CRITICAL): health.ts - 12 public WRITE mutations can ALTER database schema**
- `fixMigration`, `fixOmExpenseSchema`, `fixAllTables`, `fixExpenseItemSchema`, `fixAllSchemaIssues`, `createOMExpenseItemTable`, `fixFeat006AndFeat007Columns`, `fixProjectSchema`, `fixAllSchemaComplete`, `fixPermissionTables`, `fullSchemaSync` are ALL public mutations that execute raw SQL `ALTER TABLE` and `CREATE TABLE` statements
- **Impact**: Any unauthenticated user can modify the database schema, create tables, add columns, and potentially corrupt data
- **Fix**: Either remove these procedures entirely (they are deployment utilities, not runtime needs), or change them to `adminProcedure`

**FINDING B-3 (HIGH): health.ts - debugUserPermissions exposes user data**
- `debugUserPermissions` is public and takes an email input
- Returns user role, permissions, OpCo access, and more
- **Impact**: Information disclosure - attacker can enumerate users and their permissions by email
- **Fix**: Change to `adminProcedure` or remove

**FINDING B-4 (HIGH): health.ts - diagnostic procedures expose database schema**
- `schemaCheck`, `schemaCompare`, `fullSchemaCompare`, `diagOmExpense`, `diagOpCo`, `diagProjectSummary` expose table structure, column names, and data
- **Impact**: Information disclosure useful for crafting further attacks

**FINDING B-5 (MEDIUM): budgetProposal.approve uses protectedProcedure instead of supervisorProcedure**
- The approve action on proposals should require supervisor role
- Currently any authenticated user (including ProjectManager) can approve proposals via API
- Note: The frontend may have role checks, but the API itself doesn't enforce it

---

## Set C: Frontend Role Check Audit

### C1. Pages That Should Have Frontend Role Checks

| Page | Expected Role | Has useSession? | Has Role Check? | Has Redirect? | Issue? |
|------|--------------|-----------------|-----------------|---------------|--------|
| `/dashboard/supervisor` | Supervisor/Admin | **No** | **No** | **No** | **HIGH** |
| `/dashboard/pm` | PM/Any | No | No | No | LOW (all users can access) |
| `/users` | Admin | **No** | **No** | **No** | **HIGH** |
| `/users/new` | Admin | **No** | **No** | **No** | **HIGH** |
| `/users/[id]` | Admin | Yes | Yes (isAdmin for permission section) | **No redirect** | **MEDIUM** |
| `/users/[id]/edit` | Admin | **No** | **No** | **No** | **HIGH** |
| `/settings/currencies` | Admin | **No** | **No** | **No** | **HIGH** |
| `/operating-companies/new` | Supervisor+ | **No** | **No** | **No** | **MEDIUM** |
| `/data-import` | Admin/Supervisor | **No** | **No** | **No** | **MEDIUM** |
| `/project-data-import` | Admin/Supervisor | **No** | **No** | **No** | **MEDIUM** |

### C2. Critical Findings - Frontend Role Checks

**FINDING C-1 (HIGH): /users pages have NO frontend role check**
- The users page comments say "Admin only" but the code has zero role checking
- Any authenticated user can see the full user list, create new users, edit/delete users
- The API (user.ts) is also public, so there is no backend protection either
- File: `apps/web/src/app/[locale]/users/page.tsx` - no useSession, no role check

**FINDING C-2 (HIGH): /dashboard/supervisor has NO frontend role check**
- Any authenticated user can access the supervisor strategic dashboard
- The page shows all projects across the organization, budget pool health, etc.
- File: `apps/web/src/app/[locale]/dashboard/supervisor/page.tsx` - no useSession import, no role check

**FINDING C-3 (HIGH): /settings/currencies has NO frontend role check**
- Comments say "Admin only" but code has no role checking
- The API uses `adminProcedure` for CUD operations (backend protected for writes)
- But read operations use `protectedProcedure`, so any user can see all currencies (low risk)

**FINDING C-4 (MEDIUM): /users/[id] has partial role check**
- It uses `useSession` and checks `isAdmin` to conditionally show permission config section
- But it does NOT redirect non-admin users; they can still see user details

---

## Set D: Auth Callback Security

### D1. Auth Configuration Review

**File: `apps/web/src/auth.ts`**

**SignIn (Credentials Provider) - Lines 131-190:**
- Properly validates email and password
- Uses bcrypt for password comparison
- Returns appropriate errors for missing credentials, wrong password, no password set
- Does NOT allow role specification during login (good)
- **Assessment: SECURE**

**JWT Callback - Lines 199-243:**
- Stores user id, email, name, roleId, and role object in JWT token
- For Azure AD users, performs upsert with default roleId=1 (ProjectManager)
- Does NOT expose password or sensitive fields
- **Assessment: SECURE**
- **Note**: Azure AD upsert always sets roleId=1. If an admin changes a user's role, and that user logs in via Azure AD, it will NOT overwrite the role (only updates name and image).

**Session Callback - Lines 247-263:**
- Maps JWT token fields to session.user
- Only exposes: id, email, name, role (id + name)
- Does NOT expose roleId number, password, or other sensitive fields
- **Assessment: SECURE**

### D2. Registration Security

**File: `apps/web/src/app/api/auth/register/route.ts`**

- Hardcodes `roleId: 1` (ProjectManager) - users cannot self-assign roles
- Uses Zod validation for input
- Checks for duplicate email
- bcrypt hashes password with 10 rounds
- **Assessment: SECURE** (no privilege escalation via registration)

### D3. trustHost Configuration

**File: `apps/web/src/auth.config.ts` line 163:**
```typescript
trustHost: true,
```
- This allows NextAuth to accept requests from any Host header
- In Azure App Service this is necessary, but could allow session fixation if used improperly
- **Assessment: LOW risk** (necessary for Azure deployment, standard practice)

---

## Set E: CORS and API Security

### E1. CORS Headers
- **No CORS headers configured** in next.config.mjs or any API route
- Next.js App Router by default does not add CORS headers, meaning API routes only accept same-origin requests from browsers
- **Assessment: OK** (default same-origin policy is the correct behavior for this app)

### E2. tRPC Endpoint
- File: `apps/web/src/app/api/trpc/[trpc]/route.ts`
- The tRPC handler properly injects session via `auth()`
- No CORS override, so same-origin only from browsers
- **Assessment: SECURE**

### E3. Rate Limiting
- **No rate limiting middleware exists** anywhere in the codebase
- No rate limiting on login, registration, or any API endpoint
- **Assessment: MEDIUM** - vulnerable to brute force attacks on login, registration spam, and API abuse

### E4. Health Check Information Exposure
- The health router's `ping` and `dbCheck` are acceptable for monitoring
- However, the extensive diagnostic and schema manipulation procedures are a severe security risk (covered in Finding B-2, B-3, B-4)

### E5. Admin Seed API
- File: `apps/web/src/app/api/admin/seed/route.ts`
- **POST** requires `Authorization: Bearer <secret>` matching `ADMIN_SEED_SECRET` or `NEXTAUTH_SECRET`
- **GET** has NO authentication - exposes role and currency data
- **Finding E-1 (MEDIUM)**: GET /api/admin/seed is unauthenticated and returns database role/currency information

### E6. Upload API Routes - NO Authentication
**FINDING E-2 (CRITICAL): All 3 upload routes have NO authentication check**
- `POST /api/upload/quote` - No session check, no auth import
- `POST /api/upload/invoice` - No session check, no auth import
- `POST /api/upload/proposal` - No session check, no auth import
- **Impact**: Any unauthenticated user can upload files to Azure Blob Storage by directly calling these endpoints
- **Fix**: Add `const session = await auth(); if (!session) return new Response('Unauthorized', { status: 401 });` to each route

---

## Summary of All Findings

### CRITICAL (8 findings)

| ID | Finding | Location | Impact |
|----|---------|----------|--------|
| A-1 | `/proposals` route NOT in middleware protectedRoutes | middleware.ts:136, auth.config.ts:114 | Proposals pages accessible without auth |
| A-2 | `/project-data-import` route NOT in middleware protectedRoutes | middleware.ts:132-150 | Project import page accessible without auth |
| B-1 | user.ts CRUD operations all use publicProcedure | packages/api/src/routers/user.ts | Anyone can create/update/delete users via API |
| B-2 | health.ts has 12 public WRITE mutations that ALTER database schema | packages/api/src/routers/health.ts | Anyone can modify database schema |
| E-2 | All 3 upload routes have NO auth check | apps/web/src/app/api/upload/*.ts | Anyone can upload files to Azure Blob |

### HIGH (6 findings)

| ID | Finding | Location | Impact |
|----|---------|----------|--------|
| B-3 | health.debugUserPermissions exposes user data publicly | health.ts:2315 | User enumeration and permission disclosure |
| B-4 | health.ts diagnostic procedures expose database schema | health.ts (multiple) | Schema information disclosure |
| C-1 | /users pages have NO frontend role check | users/page.tsx | Any logged-in user can manage users |
| C-2 | /dashboard/supervisor has NO frontend role check | dashboard/supervisor/page.tsx | Any user can see strategic data |
| C-3 | /settings/currencies has NO frontend role check | settings/currencies/page.tsx | Any user can access admin page |
| B-5 | budgetProposal.approve uses protectedProcedure (not supervisor) | budgetProposal.ts:399 | Any user can approve proposals via API |

### MEDIUM (4 findings)

| ID | Finding | Location | Impact |
|----|---------|----------|--------|
| A-3 | Duplicate protectedRoutes lists in 2 files | middleware.ts + auth.config.ts | Maintenance risk |
| C-4 | /users/[id] shows data to non-admin (no redirect) | users/[id]/page.tsx | Non-admins can view user details |
| E-1 | GET /api/admin/seed is unauthenticated | api/admin/seed/route.ts | Exposes role/currency data |
| E-3 | No rate limiting on any endpoint | Entire codebase | Brute force / spam vulnerability |

### Total: 8 CRITICAL + 6 HIGH + 4 MEDIUM = 18 security findings
