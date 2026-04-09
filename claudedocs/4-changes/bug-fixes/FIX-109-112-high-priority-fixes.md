# FIX-109 ~ FIX-112: High Priority Fixes

> **Date**: 2026-04-09
> **Severity**: HIGH
> **Status**: Complete

---

## FIX-109: Add Security Headers to Next.js Config

**Problem**: No security headers configured, leaving the application vulnerable to clickjacking, MIME sniffing, and other common web attacks.

**Solution**: Added `headers()` function to `nextConfig` in `apps/web/next.config.mjs` that applies to all routes `/(.*)`

**Headers Added**:
| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME type sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer information |
| `X-DNS-Prefetch-Control` | `on` | Enables DNS prefetching for performance |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Forces HTTPS |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disables unused browser APIs |

**Modified Files**:
- `apps/web/next.config.mjs`

---

## FIX-110: Install and Configure tailwindcss-animate

**Problem**: 20+ shadcn/ui components reference animation classes (`animate-in`, `fade-in-0`, `slide-in-from-*`, etc.) that silently fail because `tailwindcss-animate` is neither installed nor configured.

**Solution**: Added `require('tailwindcss-animate')` to the `plugins` array in `tailwind.config.ts`.

**Manual Step Required**:
```bash
pnpm add -D tailwindcss-animate --filter=web
```

**Modified Files**:
- `apps/web/tailwind.config.ts`

**Note**: The package is NOT in `package.json` yet. The config change includes a comment noting the manual install requirement. After running the install command, the plugin will activate and all shadcn/ui animation classes will work correctly.

---

## FIX-111: Move Email Sending Outside Database Transactions

**Problem Statement**: Email sending inside `$transaction` blocks could cause timeout risks.

**Investigation Result**: **No action required.**

After thorough analysis of both `budgetProposal.ts` and `expense.ts`:

- **budgetProposal.ts**: Contains `$transaction` blocks in `submit`, `approve`, `delete`, `deleteMany`, and `revertToDraft` procedures. None of them call `EmailService` or any external email-sending functions. The `prisma.notification.create()` calls inside transactions are **database writes** (creating notification records), not HTTP email sends.

- **expense.ts**: Contains `$transaction` blocks in `create`, `update`, `submit`, `approve`, `reject`, `revertToDraft`, and `revertToSubmitted` procedures. Same pattern: only `prisma.notification.create()` database writes inside transactions, no external email calls.

- **notification.ts**: The actual `EmailService` email sending happens in the notification router's `createWithEmail` procedure, which does NOT use `$transaction` at all. Email sending is already outside of any transaction.

**Architecture**: The codebase correctly separates concerns:
1. Routers create `Notification` records in the database (inside transactions when needed)
2. The `notification.ts` router handles email sending separately via `EmailService`
3. No `EmailService` import or usage exists in `budgetProposal.ts` or `expense.ts`

**Modified Files**: None

---

## FIX-112: Add Pagination to budgetProposal.getAll

**Problem**: The `budgetProposal.getAll` procedure returned all records without pagination, which could cause performance issues with large datasets.

**Solution**:
1. **Backend** (`packages/api/src/routers/budgetProposal.ts`):
   - Added `page` (default: 1) and `limit` (default: 20, max: 100) to input schema
   - Added `skip`/`take` to `findMany` query
   - Added parallel `count` query for total
   - Changed return format from array to `{ items, total, page, limit, totalPages }`

2. **Frontend** (`apps/web/src/app/[locale]/proposals/page.tsx`):
   - Updated query to use `proposalsData` for the raw response
   - Extracted `proposals = proposalsData?.items` for backward-compatible usage
   - Set `limit: 100` as a reasonable default for the list page
   - All existing `.filter()`, `.map()`, `.length` usages continue to work unchanged

**Modified Files**:
- `packages/api/src/routers/budgetProposal.ts`
- `apps/web/src/app/[locale]/proposals/page.tsx`

---

## Summary

| Fix | Status | Files Changed |
|-----|--------|---------------|
| FIX-109 | Done | 1 |
| FIX-110 | Done (needs `pnpm add`) | 1 |
| FIX-111 | No action needed | 0 |
| FIX-112 | Done | 2 |
| **Total** | **4 investigated, 3 fixed** | **4 files** |
