# Verification Round 1-C: Database & Infrastructure
Date: 2026-04-09

## Summary
Total checks: 105 | PASS: 97 | FAIL: 8 | Accuracy: 92.4%

---

## Detailed Results

### Set A: Prisma Model Existence (34 checks)

**A1. Total model count**
- [FAIL] Doc (schema-overview.md) claims 32 models. Actual count via `grep "^model "` is **32** model declarations. However, the Prisma CLAUDE.md in the same repo says **31 models**. The analysis doc says 32, which matches the actual schema.prisma count. PASS for the analysis doc, but noting internal inconsistency with Prisma CLAUDE.md.
- Revised: [PASS] schema-overview.md claims 32 models, actual count is 32.

**A2. Model names in schema-overview.md vs actual schema.prisma**

Auth & Permission domain (8 claimed):
- [PASS] User exists (L19)
- [PASS] Account exists (L52)
- [PASS] Session exists (L72)
- [PASS] VerificationToken exists (L83)
- [PASS] Role exists (L91)
- [PASS] Permission exists (L106)
- [PASS] RolePermission exists (L127)
- [PASS] UserPermission exists (L143)

Budget & Project domain (4 claimed):
- [PASS] BudgetPool exists (L165)
- [PASS] Project exists (L184)
- [PASS] BudgetProposal exists (L260)
- [PASS] ProjectBudgetCategory exists (L574)

Procurement domain (4 claimed):
- [PASS] Vendor exists (L296)
- [PASS] Quote exists (L311)
- [PASS] PurchaseOrder exists (L329)
- [PASS] PurchaseOrderItem exists (L606)

Expense domain (5 claimed):
- [PASS] Expense exists (L358)
- [PASS] ExpenseItem exists (L629)
- [PASS] ExpenseCategory exists (L669)
- [PASS] ChargeOut exists (L856)
- [PASS] ChargeOutItem exists (L898)

OM Expense domain (3 claimed):
- [PASS] OMExpense exists (L689)
- [PASS] OMExpenseItem exists (L763)
- [PASS] OMExpenseMonthly exists (L806)

System domain (8 claimed):
- [PASS] Comment exists (L409)
- [PASS] History exists (L423)
- [PASS] Notification exists (L443)
- [PASS] OperatingCompany exists (L471)
- [PASS] ProjectChargeOutOpCo exists (L502)
- [PASS] UserOperatingCompany exists (L521)
- [PASS] BudgetCategory exists (L539)
- [PASS] Currency exists (L932)

**A3. Models in schema.prisma NOT in docs**
- [PASS] All 32 models in schema.prisma are documented in schema-overview.md. No undocumented models found.

**A4. Schema line count**
- [PASS] Doc claims 951 lines. Actual `wc -l` returns 951. Exact match.

---

### Set B: Model Field Counts (15 checks)

**B1. User model field count**
- [FAIL] schema-overview.md claims "10 data fields + 10 relations". Actual: **9 data fields** (id, email, emailVerified, name, image, password, roleId, createdAt, updatedAt) + **12 relations** (role, projects, approvals, comments, historyItems, notifications, accounts, sessions, approvedProposals, confirmedChargeOuts, operatingCompanyPermissions, permissions). Doc overcounts data fields by 1, undercounts relations by 2.
- [PASS] model-detail.md lists 9 fields in the table (id through updatedAt), which matches the actual schema. The discrepancy is only in schema-overview.md's summary count.
- [PASS] model-detail.md relation list matches actual (12 items listed in line 24).

**B2. Project model field count**
- [PASS] schema-overview.md claims "30+ data fields + 9 relations". Actual: **34 data fields** + **11 relations**. "30+" is technically correct but understated. Relations count is off (9 claimed vs 11 actual - missing chargeOutOpCos and projectBudgetCategories).
- [FAIL] schema-overview.md says 9 relations. Actual is 11 relations (manager, supervisor, budgetPool, budgetCategory, currency, proposals, quotes, purchaseOrders, chargeOuts, chargeOutOpCos, projectBudgetCategories).
- [PASS] model-detail.md field table lists 34 data fields (id through updatedAt), matching actual schema.

**B3. OMExpense model field count**
- [FAIL] schema-overview.md claims "17 data fields + 7 relations". Actual: **19 data fields** (including createdAt, updatedAt) + 7 relations. Data field count off by 2.
- [FAIL] model-detail.md lists `hasItems` field (line 542: `hasItems | Boolean | No | @default(false)`). This field does **NOT exist** in the actual schema.prisma. grep confirms zero matches for "hasItems" in schema.prisma. This is a phantom field documented but not in code.
- [PASS] Relations count (7) matches actual.

**B4. BudgetPool model field count**
- [FAIL] schema-overview.md claims "8 data fields + 3 relations". Actual: **9 data fields** (id, name, totalAmount, usedAmount, financialYear, description, currencyId, createdAt, updatedAt) + 3 relations. Off by 1 on data fields.
- [PASS] model-detail.md field table lists 9 fields, which matches actual.
- [PASS] Relations count (3) matches actual.

**B5. Expense model field count**
- [FAIL] schema-overview.md claims "17 data fields + 6 relations". Actual: **19 data fields** + **7 relations** (purchaseOrder, budgetCategory, vendor, currency, items, chargeOutItems, derivedOMExpenses). Off by 2 on data fields and 1 on relations.
- [PASS] model-detail.md relation list (line 322) includes derivedOMExpenses, matching 7 relations total.
- [PASS] model-detail.md field table lists the correct fields.

---

### Set C: Migration Count (5 checks)

- [PASS] Doc (migration-history.md) claims 7 migrations. Actual `ls -d migrations/*/` returns exactly 7 directories.
- [PASS] Migration 1: `20251126100000_add_currency` exists and date matches (2025-11-26).
- [PASS] Migration 2: `20251202100000_add_feat001_project_fields` exists and date matches (2025-12-02).
- [PASS] Migration 3: `20251202110000_add_postmvp_tables` exists and date matches (2025-12-02).
- [PASS] Migration 4: `20251208100000_feat007_om_expense_item` exists and date matches (2025-12-08).
- [PASS] Migration 5: `20251210100000_feat008_lastfy_actual_expense` exists and date matches (2025-12-10).
- [PASS] Migration 6: `20251214100000_feat011_permission_tables` exists and date matches (2025-12-14).
- [PASS] Migration 7: `20260127100000_change038_project_budget_category` exists and date matches (2026-01-27).

---

### Set D: Package Versions (15 checks)

**D1. Next.js version**
- [PASS] Doc (tech-stack.md) claims `14.2.33`. Actual in `apps/web/package.json:62`: `"next": "14.2.33"`. Exact match.

**D2. React version**
- [PASS] Doc claims `^18.2.0`. Actual in `apps/web/package.json:65`: `"react": "^18.2.0"`. Exact match.

**D3. tRPC server version**
- [PASS] Doc claims `^10.45.1`. Actual in `packages/api/package.json:15`: `"@trpc/server": "^10.45.1"`. Exact match.

**D4. tRPC client version**
- [PASS] Doc claims `^10.45.1`. Actual in `apps/web/package.json:50`: `"@trpc/client": "^10.45.1"`. Exact match.

**D5. Prisma Client version**
- [PASS] Doc claims `^5.9.1`. Actual in `packages/db/package.json:17`: `"@prisma/client": "^5.9.1"`. Exact match.

**D6. Prisma CLI version**
- [PASS] Doc claims `^5.9.1`. Actual in `packages/db/package.json:23`: `"prisma": "^5.9.1"`. Exact match.

**D7. NextAuth.js version**
- [PASS] Doc claims `5.0.0-beta.30`. Actual in `packages/auth/package.json:16`: `"next-auth": "5.0.0-beta.30"`. Exact match.

**D8. TypeScript version**
- [PASS] Doc claims `^5.3.3`. Actual in root `package.json:67`: `"typescript": "^5.3.3"`. Exact match.

**D9. Node.js version requirement**
- [PASS] Doc claims `>= 20.0.0 (fixed 20.11.0)`. Actual in root `package.json:71`: `"node": ">=20.0.0"`. Match.

**D10. pnpm version**
- [PASS] Doc claims `>= 8.0.0 (fixed 8.15.3)`. Actual in root `package.json:69`: `"pnpm@8.15.3"`. Match.

**D11. Turborepo version**
- [PASS] Doc claims `^1.12.4`. Actual in root `package.json:66`: `"turbo": "^1.12.4"`. Exact match.

**D12. next-intl version**
- [PASS] Doc claims `^4.4.0`. Actual in `apps/web/package.json:64`: `"next-intl": "^4.4.0"`. Exact match.

**D13. Zod version (web)**
- [PASS] Doc claims `^3.25.76` for web. Actual in `apps/web/package.json:72`: `"zod": "^3.25.76"`. Exact match.

**D14. Zod version (api) -- cross-check**
- [PASS] Actual in `packages/api/package.json:19`: `"zod": "^3.22.4"`. Doc mentions the web version (`^3.25.76`) and does not claim a different api version, which is acceptable. Doc does not claim both are the same version.

**D15. Dependency count totals**
- [PASS] Doc claims `apps/web`: 42 dependencies + 13 devDependencies. Actual count from package.json: dependencies object has 42 entries, devDependencies has 13 entries. Exact match.

---

### Set E: Auth Configuration (15 checks)

**E1. Dual-layer architecture**
- [PASS] Doc claims Edge Config in `auth.config.ts` and Full Config in `auth.ts`. Both files confirmed to exist with described separation.

**E2. JWT session strategy**
- [PASS] Doc claims `strategy: 'jwt'` at line 148 of `auth.config.ts`. Actual: line 148 reads `strategy: 'jwt'`. Exact match.

**E3. Session maxAge (24 hours)**
- [PASS] Doc claims `maxAge: 24 * 60 * 60` (86400 seconds). Actual at line 149: `maxAge: 24 * 60 * 60`. Exact match.

**E4. Auth secret configuration**
- [PASS] Doc claims `process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET` at line 155. Actual: line 155 reads exactly that. Match.

**E5. Azure AD provider (not B2C)**
- [PASS] Doc correctly notes provider is `next-auth/providers/azure-ad` (not azure-ad-b2c). Actual: line 42 imports `AzureAD from 'next-auth/providers/azure-ad'`. Match.

**E6. Azure AD conditional loading**
- [PASS] Doc claims Azure AD enabled only when `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID` all set. Actual: lines 103-105 check exactly these three variables. Match.

**E7. Credentials provider**
- [PASS] Doc claims Credentials provider at lines 131-191. Actual: Credentials provider defined starting line 131, authorize function through line 190. Match.

**E8. RBAC - 4 procedure levels**
- [PASS] Doc claims 4 levels: publicProcedure, protectedProcedure, supervisorProcedure, adminProcedure. All four confirmed in `packages/api/src/trpc.ts` at lines 286, 323, 392, 442.

**E9. publicProcedure line number**
- [PASS] Doc claims line 286. Actual: line 286 `export const publicProcedure = t.procedure;`. Match.

**E10. protectedProcedure line numbers**
- [PASS] Doc claims lines 323-333. Actual: lines 323-333. Match.

**E11. supervisorProcedure line numbers**
- [PASS] Doc claims lines 392-403. Actual: lines 392-403. Match.

**E12. adminProcedure line numbers**
- [PASS] Doc claims lines 442-453. Actual: lines 442-453. Match.

**E13. Role check mechanism**
- [PASS] Doc claims check is `role.name` string comparison (not roleId). Actual: `ctx.session.user.role.name` at lines 393-395 and 443-445. Match.

**E14. Trust host enabled**
- [PASS] Doc claims `trustHost: true`. Actual: line 163 `trustHost: true`. Match.

**E15. Custom sign-in page path**
- [PASS] Doc claims `signIn: '/zh-TW/login'` (hardcoded locale). Actual: line 74 `signIn: '/zh-TW/login'`. Match.

---

### Set F: Docker & Environment (18 checks)

**F1. Docker Compose service count**
- [PASS] Doc (config-and-env.md) claims 5 services (PostgreSQL, pgAdmin, Redis, Mailhog, Azurite). Actual docker-compose.yml defines exactly 5 services. Match.

**F2. Docker Compose line count**
- [FAIL] Doc claims 105 lines. Actual `wc -l` returns **104 lines** (no trailing `version:` line, file ends at line 104 with `driver: bridge`). Off by 1.

**F3. PostgreSQL image**
- [PASS] Doc claims `postgres:16-alpine`. Actual: line 4 `image: postgres:16-alpine`. Match.

**F4. PostgreSQL port mapping**
- [PASS] Doc claims `5434 -> 5432`. Actual: line 13 `'5434:5432'`. Match.

**F5. PostgreSQL container name**
- [PASS] Doc claims `itpm-postgres-dev`. Actual: line 5 `container_name: itpm-postgres-dev`. Match.

**F6. pgAdmin port**
- [PASS] Doc claims `5050 -> 80`. Actual: line 35 `'5050:80'`. Match.

**F7. Redis image**
- [PASS] Doc claims `redis:7-alpine`. Actual: line 46 `image: redis:7-alpine`. Match.

**F8. Redis port mapping**
- [PASS] Doc claims `6381 -> 6379`. Actual: line 50 `'6381:6379'`. Match.

**F9. Mailhog ports**
- [PASS] Doc claims `1025 -> 1025 (SMTP), 8025 -> 8025 (Web UI)`. Actual: lines 67-68 match. Match.

**F10. Azurite ports**
- [PASS] Doc claims `10000-10002 -> 10000-10002`. Actual: lines 78-80 match individually. Match.

**F11. Volume count**
- [PASS] Doc claims 4 volumes (postgres_data, pgadmin_data, redis_data, azurite_data). Actual: lines 92-100 define exactly 4 volumes. Match.

**F12. Network**
- [PASS] Doc claims `itpm-network` bridge network. Actual: lines 102-104 `itpm-network: driver: bridge`. Match.

**F13. PostgreSQL credentials**
- [PASS] Doc claims `POSTGRES_USER: postgres`, `POSTGRES_PASSWORD: localdev123`, `POSTGRES_DB: itpm_dev`. Actual: lines 8-10. Match.

**F14. Next.js config - standalone output**
- [PASS] Doc claims `output: 'standalone'`. Actual: next.config.mjs line 10 `output: 'standalone'`. Match.

**F15. Next.js config - line count**
- [FAIL] Doc claims 38 lines. Actual: next.config.mjs has **38** lines (ending line 38 with blank, file has 39 if counting trailing newline). Let me re-check: the file Read shows 38 lines of content. Match.
- Revised: [PASS] 38 lines of content matches doc claim.

**F16. Next.js config - ignoreBuildErrors**
- [PASS] Doc claims `typescript: { ignoreBuildErrors: true }`. Actual: line 30 `ignoreBuildErrors: true`. Match.

**F17. turbo.json globalEnv inconsistency**
- [PASS] Doc correctly identifies that turbo.json lists `AZURE_AD_B2C_*` variables while code uses `AZURE_AD_*` (without B2C suffix). Actual turbo.json lines 9-11 confirm `AZURE_AD_B2C_TENANT_NAME`, `AZURE_AD_B2C_CLIENT_ID`, `AZURE_AD_B2C_CLIENT_SECRET`. Code uses `AZURE_AD_TENANT_ID`, `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`. Inconsistency correctly documented.

**F18. @@index count**
- [FAIL] schema-overview.md claims "approximately 80+ @@index". Actual `grep -c '@@index'` in schema.prisma returns **94**. While "80+" technically includes 94, the approximation is significantly understated. More accurately should say "approximately 90+".

---

## Failure Summary

| # | Document | Claim | Actual | Severity |
|---|----------|-------|--------|----------|
| B1 | schema-overview.md | User: 10 data fields + 10 relations | 9 data fields + 12 relations | Medium |
| B2 | schema-overview.md | Project: 9 relations | 11 relations (missing chargeOutOpCos, projectBudgetCategories) | Low |
| B3a | schema-overview.md | OMExpense: 17 data fields | 19 data fields (likely excludes createdAt/updatedAt) | Low |
| B3b | model-detail.md | OMExpense has `hasItems` field | Field does **NOT** exist in schema.prisma | **High** |
| B4 | schema-overview.md | BudgetPool: 8 data fields | 9 data fields (likely excludes updatedAt) | Low |
| B5 | schema-overview.md | Expense: 17 data fields + 6 relations | 19 data fields + 7 relations (missing derivedOMExpenses) | Low |
| F2 | config-and-env.md | docker-compose.yml: 105 lines | 104 lines | Trivial |
| F18 | schema-overview.md | ~80+ @@index | 94 @@index (understated approximation) | Low |

### Recurring Pattern
The schema-overview.md summary table consistently undercounts data fields (likely excluding `createdAt`/`updatedAt` from the count) and occasionally undercounts relations. The model-detail.md field tables are generally more accurate since they enumerate each field individually.

### Critical Finding
The **`hasItems`** field documented in model-detail.md (OMExpense section, line 542 of the doc) does **not exist** in the actual `schema.prisma`. It appears in the Prisma CLAUDE.md file as part of a documentation block but was never added to the actual schema. This is the most significant accuracy issue found.

---

## Cross-Document Consistency Notes

1. **Prisma CLAUDE.md says 31 models** while **schema-overview.md says 32 models**. The actual schema has 32. The 32nd model (`ProjectBudgetCategory`) was added in the latest migration (2026-01-27) and the Prisma CLAUDE.md was not updated.
2. **config-and-env.md correctly identifies** that Redis is defined in Docker Compose but not actually used in code.
3. **config-and-env.md correctly identifies** that Container name environment variables in `.env.example` are not used (hardcoded in code).
4. **auth-system.md accurately describes** the dual-layer auth architecture, provider configuration, and RBAC implementation with correct line numbers.
