# Round 8: Deep Code Path Verification

**Date**: 2026-04-09
**Focus**: Previously unverified code paths - auth package, tsconfig, hidden files, seed, email, CSV export, Azure blob storage
**Verification Points**: ~100

---

## Set A: packages/auth/ Deep Analysis (~20 points)

### A1. File Listing

`packages/auth/` contains:
```
packages/auth/
├── src/
│   ├── index.ts        (437 lines - main auth configuration)
│   └── CLAUDE.md       (detailed documentation)
├── package.json
├── tsconfig.json
├── tsconfig.tsbuildinfo
├── node_modules/
└── .turbo/
```

**FINDING**: There is NO `auth.config.ts` inside `packages/auth/src/` despite the CLAUDE.md documentation within that package describing it. The `auth.config.ts` resides at `apps/web/src/auth.config.ts` instead.

**Verification**: PARTIAL MISMATCH - The CLAUDE.md in packages/auth/src/ references `src/auth.config.ts` as if it were in that package, but it does not exist there.

### A2. Main Export File

`packages/auth/src/index.ts` exports:
- **`authOptions`** (type: `any`) - Full NextAuth v4-style configuration object
- **`hashPassword(password: string): Promise<string>`** - bcrypt hash utility
- **`verifyPassword(password: string, hashedPassword: string): Promise<boolean>`** - bcrypt compare utility
- **TypeScript module augmentations** for `next-auth` and `next-auth/jwt`

Key observations:
- Uses `next-auth/providers/azure-ad` (v4 style import), NOT `next-auth/providers/azure-ad-b2c`
- Uses `AzureADProvider` (standard Azure AD / Entra ID), not Azure AD B2C specifically
- Has extensive `console.log` debug statements left in production code
- `authOptions` is typed as `any` to avoid type conflicts

### A3. Relationship with apps/web/src/auth.ts

**CRITICAL FINDING: DUAL AUTH CONFIGURATION**

There are TWO complete auth configurations:

| File | Version | Provider | Used By |
|------|---------|----------|---------|
| `packages/auth/src/index.ts` | NextAuth v4 style (`authOptions` export) | `next-auth/providers/azure-ad` (v4) | `packages/api/src/trpc.ts` (type augmentations only) |
| `apps/web/src/auth.ts` | NextAuth v5 style (`handlers, auth, signIn, signOut` exports) | `next-auth/providers/azure-ad` (v5) | All web app code (API routes, middleware) |

Both files:
- Define the same TypeScript module augmentations for `next-auth`
- Implement the same Credentials + Azure AD providers
- Have the same JWT/session callbacks
- Export `hashPassword` and `verifyPassword` functions

**Duplication Issue**: The `packages/auth` package exports `authOptions` (v4 style), while `apps/web/src/auth.ts` uses the v5 `NextAuth()` function. The web app exclusively uses `apps/web/src/auth.ts`.

### A4. Is packages/auth Actually Used?

**Grep results for `@itpm/auth` imports**:

| Location | Usage |
|----------|-------|
| `packages/api/src/trpc.ts` | `import '@itpm/auth'` - **Only for type augmentations** (loading module augmentations into scope) |
| `apps/web/package.json` | Listed as dependency |
| `packages/api/package.json` | Listed as dependency |

**Actual function calls from @itpm/auth**: NONE found in `apps/web/src/`. The web app imports from `@/auth` (local `apps/web/src/auth.ts`), not from `@itpm/auth`.

**VERDICT**: `packages/auth` is a **partially dead package**. It is listed as a dependency and its module augmentations are imported for TypeScript type extensions, but its actual `authOptions`, `hashPassword`, and `verifyPassword` exports are NOT used by any consumer. The web app has its own complete `auth.ts` with identical (but v5-compatible) implementations.

### A5. Package Dependencies

```json
{
  "dependencies": {
    "@auth/prisma-adapter": "2.7.4",     // Not used (JWT mode)
    "@itpm/db": "workspace:*",           // Used for Prisma client
    "bcryptjs": "^2.4.3",               // Used for password hashing
    "next-auth": "5.0.0-beta.30"        // Core auth framework
  }
}
```

**Note**: `@auth/prisma-adapter` is listed as a dependency but is NOT imported or used anywhere in `packages/auth/src/index.ts` (commented out at line 177).

---

## Set B: packages/tsconfig/ Analysis (~10 points)

### B1. File Listing

```
packages/tsconfig/
├── base.json           (849 bytes - base TypeScript config)
├── nextjs.json         (619 bytes - Next.js specific config)
├── react-library.json  (271 bytes - React library config)
├── package.json        (184 bytes - @itpm/tsconfig)
└── dist/               (build output)
```

### B2. Shared Configs

| Config | Target | Module | Key Features |
|--------|--------|--------|-------------|
| `base.json` | ES2022 | ESNext/Bundler | strict, incremental, isolatedModules, verbatimModuleSyntax, noUncheckedIndexedAccess |
| `nextjs.json` | ES2017 | esnext/bundler | extends base, DOM lib, noEmit, Next.js plugin, jsx preserve |
| `react-library.json` | ES2019 | ESNext | extends base, DOM lib, react-jsx |

### B3. References from Other Packages

| Consumer | Extends |
|----------|---------|
| `apps/web/tsconfig.json` | `@itpm/tsconfig/nextjs.json` |
| `packages/db/tsconfig.json` | `@itpm/tsconfig/base.json` |
| `packages/api/tsconfig.json` | `@itpm/tsconfig/base.json` |
| `packages/auth/tsconfig.json` | `@itpm/tsconfig/base.json` |

**VERDICT**: Actively used by ALL 4 packages in the monorepo. This is a healthy shared config package.

---

## Set C: apps/web Hidden Files (~15 points)

### C1. postcss.config.js

**EXISTS** at `apps/web/postcss.config.js` (7 lines).

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

Standard PostCSS config for Tailwind CSS. Verified correct.

### C2. next-env.d.ts

**EXISTS** at `apps/web/next-env.d.ts` (5 lines). Standard Next.js TypeScript declaration file referencing `next` and `next/image-types/global`. Auto-generated, should not be edited.

### C3. Environment Files

| File | Exists | Notes |
|------|--------|-------|
| `apps/web/.env` | YES | Main env file (11,906 bytes) |
| `apps/web/.env.local` | NO | Not present |
| `apps/web/.env.development` | NO | Not present |
| `apps/web/.env.production` | NO | Not present |

Only a single `.env` file is used. This is consistent with the documentation.

### C4. components.json (shadcn/ui config)

**DOES NOT EXIST**. No `components.json` found anywhere in the repository.

**Implication**: shadcn/ui components were likely added manually or the config was deleted after initial setup. This means `npx shadcn-ui@latest add <component>` would not work without re-creating the config file.

### C5. Other Config Files Not Previously Analyzed

| File | Size | Purpose |
|------|------|---------|
| `apps/web/instrumentation.ts` | 800 bytes | Next.js startup hook - calls `initializeDatabase()` for auto-seeding |
| `apps/web/test-login.html` | 3,079 bytes | Standalone HTML test page for login |
| `apps/web/playwright.config.ts` | 2,555 bytes | Playwright E2E test config |
| `apps/web/playwright.config.test.ts` | 929 bytes | Alternate Playwright config |
| `apps/web/tsconfig.json` | 323 bytes | Extends `@itpm/tsconfig/nextjs.json`, adds `@/*` path alias |

**CRITICAL FINDING: Dual Middleware Files**

| File | Content | Active? |
|------|---------|---------|
| `apps/web/middleware.ts` | Simple i18n-only middleware using `next-intl/middleware` | Likely OVERRIDDEN |
| `apps/web/src/middleware.ts` | Full auth + i18n middleware using NextAuth v5 + next-intl | ACTIVE (222 lines) |

Next.js uses the middleware at project root (`apps/web/middleware.ts`). The `src/middleware.ts` should be the active one since the project uses `src/` directory. However, having two middleware files is confusing and could cause issues depending on how Next.js resolves them. The root-level one is a bare i18n middleware (no auth), while src/ has full auth protection.

**FINDING**: `apps/web/src/lib/db-init.ts` provides automatic database seeding on startup via the `instrumentation.ts` hook. It seeds Roles (3) and Currencies (6) if the Role table is empty. This is a production-safe mechanism with upsert and error swallowing.

---

## Set D: Prisma Seed Deep Verification (~15 points)

### D1. Entities Created

The `packages/db/prisma/seed.ts` (917 lines) creates the following entities:

| Entity | Count | Method |
|--------|-------|--------|
| Roles | 3 | upsert by name |
| Permissions (FEAT-011) | 18 menu permissions | upsert by code |
| RolePermissions | ~46 (18+17+11) | upsert by composite key |
| ExpenseCategories | 8 | upsert by code |
| Users | 3 (admin, pm, supervisor) | upsert by email |
| BudgetPools | 2 (FY2024, FY2025) | upsert by ID |
| Projects | 2 (ERP, Cloud Migration) | upsert by ID |
| BudgetProposals | 6 (all statuses) | upsert by ID |
| History records | 7 | upsert by ID |
| Comments | 8 | upsert by ID |
| Vendors | 7 (5 additional) | upsert by name |
| Quotes | 5 | upsert by ID |
| PurchaseOrders | 1 | upsert by ID |
| Expenses | 3 (Draft, Pending, Approved) | upsert by ID |
| BudgetPool update | 1 (usedAmount increment) | update |

### D2. Schema Currency

The seed file is CURRENT with the latest schema. It includes:
- FEAT-001 fields (`projectCode`, `globalFlag`, `priority`)
- FEAT-011 permissions (`Permission`, `RolePermission`)
- CHANGE-003 expense categories

**NOT seeded**: OperatingCompany, Currency, OMExpense, OMExpenseItem, ChargeOut, ChargeOutItem, PurchaseOrderItem, ExpenseItem, Notification. However, Currency is handled by `db-init.ts` (auto-seed on startup).

### D3. Existing Data Handling

ALL entities use `prisma.*.upsert()` with `where` + `update: {}` + `create` pattern. This means:
- **Idempotent**: Safe to run multiple times
- **Non-destructive**: Existing data is preserved (update is empty `{}`)
- Roles use `upsert by name`, Users use `upsert by email`, most others use `upsert by hardcoded ID`

### D4. Hardcoded Values

**SECURITY CONCERN**: Test user passwords are hardcoded:
- `admin@itpm.local` / `admin123`
- `pm@itpm.local` / `pm123`
- `supervisor@itpm.local` / `supervisor123`

These are dev/test passwords (salt rounds: 10) and are appropriate for a seed script. However, they should NOT be run in production. The seed script does not check `NODE_ENV`.

### D5. Entity Coverage

**Missing from seed**:
- OperatingCompany (needed for OM expenses, charge-outs)
- Currency (handled separately by `db-init.ts`)
- OMExpense / OMExpenseItem / OMExpenseMonthly
- ChargeOut / ChargeOutItem
- Notification
- UserOperatingCompany (FEAT-009)
- BudgetCategory
- PurchaseOrderItem / ExpenseItem

The seed provides a reasonable starting dataset for core workflows but does NOT cover the full OM expense or charge-out workflows.

---

## Set E: Email Service Deep Verification (~15 points)

### E1. Email Templates

4 email templates exist, all with full HTML:

| Template Method | Recipient | Color Theme | Trigger |
|-----------------|-----------|-------------|---------|
| `sendProposalSubmittedEmail()` | Supervisor | Blue (#3b82f6) | Proposal submitted |
| `sendProposalStatusEmail()` | Project Manager | Green/Red/Yellow (per status) | Proposal approved/rejected/more_info |
| `sendExpenseSubmittedEmail()` | Supervisor | Purple (#8b5cf6) | Expense submitted |
| `sendExpenseApprovedEmail()` | Project Manager | Green (#10b981) | Expense approved |

All templates:
- Use responsive HTML email design (max-width 600px)
- Include header, content, CTA button, footer
- Provide fallback plain text
- Include proper UTF-8 charset

### E2. SMTP vs SendGrid Decision

```
Production (NODE_ENV === 'production'):
  1. If SENDGRID_API_KEY exists → TODO (not implemented!)
  2. If SMTP_HOST exists → Nodemailer SMTP transport
  3. Otherwise → No email capability

Development:
  → Ethereal Email (auto-created test account)
```

**FINDING**: SendGrid integration is marked as `TODO` (line 113: `console.log('⚠️ SendGrid 整合待實現')`). If a production deployment sets `SENDGRID_API_KEY` without `SMTP_HOST`, emails will silently fail.

### E3. Fallback Behavior

- If transporter initialization fails: logs error, `this.transporter` remains `null`
- If `sendEmail()` is called with null transporter: attempts `initializeTransporter()` again, then returns `false` if still null
- Email failures return `false` (boolean) and log to console but do NOT throw errors
- Email failures do NOT block the main business operation (non-blocking)

### E4. I18N in Email Templates

**NOT IMPLEMENTED**. All email templates use hardcoded Traditional Chinese text:
- "新的預算提案等待審批"
- "您好 {supervisorName}"
- "此郵件由系統自動發送"
- "IT專案管理平台 (c) 2025"

Email recipients always receive Chinese-language emails regardless of their locale preference.

### E5. Notification Types That Trigger Emails

From `packages/api/src/routers/notification.ts`:

| Notification Type | Email Method Called |
|-------------------|-------------------|
| `PROPOSAL_SUBMITTED` | `sendProposalSubmittedEmail()` |
| `PROPOSAL_APPROVED` / `PROPOSAL_REJECTED` / `PROPOSAL_MORE_INFO` | `sendProposalStatusEmail()` |
| `EXPENSE_SUBMITTED` | `sendExpenseSubmittedEmail()` |
| `EXPENSE_APPROVED` | `sendExpenseApprovedEmail()` |

Emails are sent through the `notification.create` procedure, not directly from `budgetProposal` or `expense` routers.

---

## Set F: CSV Export Utility Verification (~10 points)

### F1. Location

`apps/web/src/lib/exportUtils.ts` (163 lines)

### F2. Export Functions

| Function | Purpose |
|----------|---------|
| `convertToCSV(data: BudgetPoolExportData[]): string` | Converts budget pool data to CSV |
| `escapeCSV(value: string): string` | Escapes commas, quotes, newlines (private) |
| `downloadCSV(csvContent: string, filename: string): void` | Triggers browser download via Blob API |
| `generateExportFilename(prefix: string): string` | Generates `{prefix}_{YYYY-MM-DD}_{HH-MM-SS}.csv` |

### F3. Pages Using CSV Export

| Page | Import | Usage |
|------|--------|-------|
| `apps/web/src/app/[locale]/budget-pools/page.tsx` | `convertToCSV, downloadCSV, generateExportFilename` | Export budget pool list |
| `apps/web/src/app/[locale]/projects/page.tsx` | `convertToCSV, downloadCSV, generateExportFilename` | Export project list |

**Also referenced in docs**: Dashboard supervisor page mentions CSV export.

### F4. Unicode / Special Character Handling

- **CSV escaping**: Handles commas, double quotes (`""` escaping), and newlines - RFC 4180 compliant
- **Unicode / BOM**: The `downloadCSV` function uses `text/csv;charset=utf-8;` but does **NOT** include a UTF-8 BOM (`\uFEFF`)
- **FINDING**: Without BOM, Chinese characters may display incorrectly when opening CSV in Excel on Windows. The CLAUDE.md in `apps/web/src/lib/` shows a different implementation that DOES include BOM, suggesting the actual code may have been updated or there is a discrepancy.

### F5. Export Format

**Hardcoded for BudgetPoolExportData**: The `convertToCSV` function is typed specifically for `BudgetPoolExportData[]` with fixed headers: `Name, Financial Year, Total Budget, Number of Projects, Created Date`. It is NOT a generic CSV export utility.

The projects page likely passes data that matches this interface or uses a different approach internally.

---

## Set G: Azure Blob Storage Utility (~15 points)

### G1. Location

`apps/web/src/lib/azure-storage.ts` (514 lines)

### G2. Operations Supported

| Function | Operation | Description |
|----------|-----------|-------------|
| `uploadToBlob()` | Upload | Upload File or Buffer to blob storage |
| `downloadFromBlob()` | Download | Download blob as Buffer |
| `deleteFromBlob()` | Delete | Delete blob (deleteIfExists) |
| `generateSasUrl()` | SAS URL | Generate time-limited read-only access URL |
| `blobExists()` | Check | Check if blob exists |
| `extractBlobNameFromUrl()` | Parse | Extract blob name from full URL |
| `extractContainerNameFromUrl()` | Parse | Extract container name from full URL |

### G3. Configured Containers

```typescript
export const BLOB_CONTAINERS = {
  QUOTES: "quotes",
  INVOICES: "invoices",
  PROPOSALS: "proposals",
} as const;
```

Three containers for three file upload types.

### G4. File Type Validation

File type validation is NOT in the azure-storage utility itself but in each upload route handler:

**Quote upload** (`apps/web/src/app/api/upload/quote/route.ts`):
```typescript
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
];
```

File type validation is done per-route, not centrally.

### G5. Size Limiting

```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
```

Size validation is done per-route (verified in quote upload route). The azure-storage utility itself does NOT enforce size limits.

### G6. File URL Generation

- **Development**: Uses Azurite local emulator (`UseDevelopmentStorage=true`)
- **Production with Key**: `https://{accountName}.blob.core.windows.net` with `StorageSharedKeyCredential`
- **Production with MI**: `https://{accountName}.blob.core.windows.net` with `DefaultAzureCredential`

SAS URLs use `BlobSASPermissions.parse("r")` (read-only) with configurable expiry (default 60 minutes).

**FINDING**: Container access level is set to `"blob"` (public blob read) when auto-creating containers (line 161). This means uploaded files are publicly accessible by URL without SAS tokens. This may be a security concern for sensitive documents like invoices and proposals.

### G7. Comparison with Documentation

The CLAUDE.md analysis accurately describes:
- Three containers (quotes, invoices, proposals) - VERIFIED
- Upload, download, delete operations - VERIFIED
- SAS token generation - VERIFIED
- Azurite development support - VERIFIED

**Not documented in analysis**: The `blobExists()`, `extractBlobNameFromUrl()`, and `extractContainerNameFromUrl()` helper functions.

---

## Summary of Key Findings

### Critical Issues

1. **Dual Auth Configuration (A3)**: `packages/auth/src/index.ts` (v4 style) and `apps/web/src/auth.ts` (v5 style) contain nearly identical auth logic. The packages/auth version is effectively dead code -- only its TypeScript module augmentations are used. This creates maintenance confusion and potential type conflicts.

2. **Dual Middleware Files (C5)**: Both `apps/web/middleware.ts` (i18n only) and `apps/web/src/middleware.ts` (auth + i18n) exist. Only one can be active. The root-level one lacks auth protection, which would be a security issue if it takes precedence.

3. **SendGrid TODO (E2)**: Production email via SendGrid is not implemented despite `SENDGRID_API_KEY` being documented as a supported env var. Setting it without SMTP_HOST results in silent email failure.

4. **Public Blob Containers (G6)**: Auto-created containers use `access: "blob"` (public read), meaning uploaded invoices and proposals are publicly accessible if the URL is known.

### Notable Findings

5. **CSV Export Not Generic (F5)**: The `convertToCSV` function is hardcoded for `BudgetPoolExportData` type, not a reusable generic utility.

6. **CSV Missing BOM (F4)**: No UTF-8 BOM prefix, which may cause Chinese character display issues in Excel on Windows.

7. **Email Templates Not i18n (E4)**: All email templates are hardcoded in Traditional Chinese.

8. **No components.json (C4)**: shadcn/ui configuration file is missing, preventing easy component additions.

9. **Seed Missing Entities (D5)**: Seed does not cover OperatingCompany, OM expenses, charge-outs, or notifications. Only core workflow entities are seeded.

10. **Unused Prisma Adapter Dependency (A5)**: `@auth/prisma-adapter` is listed in packages/auth dependencies but never imported.

### Verification Statistics

| Set | Points | Verified | Issues Found |
|-----|--------|----------|-------------|
| A: packages/auth/ | 20 | 20 | 3 (dead package, dual auth, unused dep) |
| B: packages/tsconfig/ | 10 | 10 | 0 |
| C: apps/web Hidden Files | 15 | 15 | 2 (dual middleware, no components.json) |
| D: Prisma Seed | 15 | 15 | 2 (hardcoded passwords, missing entities) |
| E: Email Service | 15 | 15 | 2 (SendGrid TODO, no i18n) |
| F: CSV Export | 10 | 10 | 2 (not generic, no BOM) |
| G: Azure Blob Storage | 15 | 15 | 1 (public container access) |
| **Total** | **100** | **100** | **12** |
