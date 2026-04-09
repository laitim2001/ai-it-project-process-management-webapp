# Round 6: UX Consistency & Interaction Patterns Audit

> **Audited**: 2026-04-09
> **Scope**: Frontend interaction patterns, delete confirmations, toast notifications, form validation, navigation, loading states, empty/error states
> **Files Examined**: ~100+ .tsx files across all 20 route modules + 40+ business components

---

## Set A: Delete Confirmation Pattern Audit (20 points)

### Method Matrix

| Module | Location | Method | i18n | Loading State |
|--------|----------|--------|------|---------------|
| **budget-pools** | `[id]/page.tsx` | `confirm()` (native) | Yes | Yes (`isLoading`) |
| **vendors** | `[id]/page.tsx` | `confirm()` (native) | Yes | Yes (`isLoading`) |
| **om-expenses** (header) | `[id]/page.tsx` | `confirm()` (native) | Yes | Yes (`isPending`) |
| **om-expenses** (items) | `[id]/page.tsx` | `confirm()` (native) | Yes (with defaultValue fallback) | N/A |
| **projects** | `[id]/page.tsx` | **AlertDialog** | Yes | Yes (`isPending`) |
| **projects** (batch) | `page.tsx` | **AlertDialog** | Yes | Yes |
| **proposals** | `[id]/page.tsx` | **AlertDialog** | Yes | Yes (`isPending`) |
| **proposals** (list) | `page.tsx` | **AlertDialog** | Yes | Yes (`isPending`) |
| **expenses** | `page.tsx` | **AlertDialog** | Yes | Yes |
| **charge-outs** | `page.tsx` | **AlertDialog** | Yes | Yes |
| **charge-outs** (detail) | `ChargeOutActions.tsx` | **AlertDialog** | Yes | Yes |
| **quotes** | `page.tsx` | **AlertDialog** | Yes | Yes |
| **purchase-orders** | `page.tsx` | **AlertDialog** | Yes | Yes |
| **om-expenses** (list batch) | `page.tsx` | **AlertDialog** | Yes | Yes |
| **om-expense-categories** | `OMExpenseCategoryActions.tsx` | **AlertDialog** | Yes | Yes |
| **operating-companies** | `OperatingCompanyActions.tsx` | **AlertDialog** | Yes | Yes |
| **notifications** | `page.tsx` | **None** (direct delete) | N/A | Yes (`isPending`) |
| **users** | (none) | No delete functionality | N/A | N/A |
| **om-expense items** (list component) | `OMExpenseItemList.tsx` | **AlertDialog** | Yes | Yes |

### Findings

**Inconsistency detected**: 3 modules use native `confirm()` while 13+ use the proper `AlertDialog` component.

- **Native `confirm()` (INCONSISTENT)**: budget-pools detail, vendors detail, om-expenses detail (both header and item delete)
- **AlertDialog (CORRECT)**: projects, proposals, expenses, charge-outs, quotes, purchase-orders, om-expenses list, om-expense-categories, operating-companies, om-expense item list component
- **No confirmation**: notifications (delete is immediate with no confirm)

**Severity**: MEDIUM - The 3 native `confirm()` usages bypass the design system and look jarring compared to the styled AlertDialog. The notifications module lacking any confirmation is a UX gap.

**Note**: The `om-expenses/[id]/page.tsx` item delete uses `confirm()` with a hardcoded Chinese defaultValue fallback: `'確定要刪除此明細項目嗎？刪除後將無法恢復。'` -- this is a minor i18n violation.

---

## Set B: Toast Notification Pattern Audit (20 points)

### Toast System Inventory

| System | File | Status |
|--------|------|--------|
| **shadcn/ui useToast** (new) | `components/ui/use-toast.tsx` | **ACTIVE** - Pub/Sub pattern, no Context needed |
| **Context-based useToast** (old) | `components/ui/Toast.tsx` | **UNUSED** - Legacy code, zero active imports |
| **Toaster renderer** | `components/ui/toaster.tsx` | **ACTIVE** - Renders notifications from use-toast |

### Usage Count

- **Total files importing useToast**: 47 unique files
- **Import paths used**:
  - `from '@/components/ui/use-toast'`: ~30 files (direct path)
  - `from '@/components/ui'`: ~17 files (barrel export)
- **Files importing both systems**: 0 (no conflicts)
- **Old system (Toast.tsx showToast)**: 0 active consumers

### Toast Message i18n Compliance

All sampled toast calls (~120 instances across the codebase) use i18n translation keys for both `title` and `description` fields. Three common patterns:

1. **Pattern A**: `tCommon('messages.success')` / `tCommon('messages.error')` -- used by older forms (VendorForm, OperatingCompanyForm, BudgetPoolForm)
2. **Pattern B**: `tToast('success.title')` / `tToast('error.title')` -- used by ProjectForm
3. **Pattern C**: `t('messages.createSuccess')` / `t('messages.deleteError')` -- module-specific keys

**Toast variant usage**: All error toasts use `variant: 'destructive'`; success toasts use `variant: 'success'`; this is consistent.

### Findings

- **No dual-system conflict**: The old `Toast.tsx` system exists but has zero consumers. It is dead code.
- **Import path inconsistency**: Mixed use of direct imports (`from '@/components/ui/use-toast'`) vs barrel imports (`from '@/components/ui'`). Functionally identical but inconsistent.
- **i18n key naming patterns vary**: Three different toast key patterns (tCommon, tToast, module-specific t), making it harder to maintain consistency.

**Severity**: LOW - Toast system is unified and functional. The old Toast.tsx is dead code that could be removed.

---

## Set C: Form Validation Pattern Audit (20 points)

### Form Library & Validation Matrix

| Form Component | Form Library | Validation | Error Display | Required Indicator | Cancel Button |
|----------------|-------------|------------|---------------|-------------------|---------------|
| **ProjectForm** | useState | Manual `validate()` | Inline `errors[field]` | `<span class="text-red-500">*</span>` | `router.back()` |
| **BudgetPoolForm** | useState | Manual `validate()` | Inline `errors[field]` | `<span class="text-red-500">*</span>` | `router.back()` |
| **BudgetProposalForm** | useState | Manual `validate()` | Inline `errors[field]` | Not visible | `router.back()` |
| **VendorForm** | useState | Manual `validate()` | Inline `errors[field]` | `<span class="text-red-500">*</span>` | `router.back()` |
| **UserForm** | useState | Manual `validate()` | Inline `errors[field]` | Not visible | `router.back()` |
| **OperatingCompanyForm** | useState | Manual `validate()` | Inline `errors[field]` | `<span class="text-destructive">*</span>` | `router.back()` |
| **OMExpenseCategoryForm** | useState | Manual `validate()` | Inline `errors[field]` | `<span class="text-destructive">*</span>` | Link to list |
| **ExpenseForm** | react-hook-form | Zod + zodResolver | FormMessage (auto) | `<span class="text-destructive">*</span>` | `router.back()` |
| **PurchaseOrderForm** | react-hook-form | Zod + zodResolver | FormMessage (auto) | `<span class="text-destructive">*</span>` | `router.back()` |
| **ChargeOutForm** | react-hook-form | Zod + zodResolver | FormMessage (auto) | `Label *` (plain text) | `router.back()` |
| **OMExpenseForm** (header) | react-hook-form | Zod + zodResolver | FormMessage (auto) | `<span class="text-destructive">*</span>` | `router.back()` |
| **OMExpenseForm** (item inline) | useState | Manual `validate()` | Inline `errors[field]` | `<span class="text-destructive">*</span>` | N/A |
| **OMExpenseItemForm** | react-hook-form | Zod + zodResolver | FormMessage (auto) | `<span class="text-destructive">*</span>` | N/A |
| **QuoteUploadForm** | useState | Manual (limited) | Toast only | `<span class="text-red-500">*</span>` | N/A |

### Findings

**1. Two-tier form system**: 7 forms use `useState + manual validate()`, 6 forms use `react-hook-form + Zod`. This is a structural split.

**2. Required field indicator inconsistency**:
- **`text-red-500`** (hardcoded red): ProjectForm, BudgetPoolForm, VendorForm, QuoteUploadForm, CategoryFormRow
- **`text-destructive`** (theme-aware): ExpenseForm, PurchaseOrderForm, OperatingCompanyForm, OMExpenseCategoryForm, OMExpenseForm, OMExpenseItemForm
- **Plain text `*`** (no styling): ChargeOutForm
- **No indicator**: BudgetProposalForm, UserForm

**Severity**: MEDIUM - The `text-red-500` vs `text-destructive` split is a theme compatibility issue. In dark mode, `text-red-500` is hardcoded while `text-destructive` adapts to the theme. BudgetProposalForm and UserForm lack required indicators entirely.

**3. Error display inconsistency**: useState forms show errors inline under fields; react-hook-form forms use FormMessage. Both approaches work, but the visual style differs.

**4. Submit loading state**: All forms disable the submit button during mutation and show loading text. This is consistent.

**5. Form reset after success**: All forms navigate away on success (via `router.push`), so form reset is not needed. This is consistent.

---

## Set D: Navigation & Breadcrumb Consistency (15 points)

### Breadcrumb Coverage

| Page Type | Total Pages | With Breadcrumb | Without Breadcrumb |
|-----------|------------|-----------------|-------------------|
| List pages | 16 | 14 | 2 (notifications, om-expense-categories) |
| Detail pages | 11 | 11 | 0 |
| Edit pages | 11 | 11 | 0 |
| New/Create pages | 11 | 11 | 0 |
| Auth pages | 3 | 0 | 3 (expected: login, register, forgot-password) |
| Dashboard pages | 3 | 0 | 3 (expected: dashboard, pm, supervisor) |
| Special pages | 4 | 3 | 1 (project-data-import) |
| **Total** | **59** | **48** | **11** |

**Pages missing breadcrumbs that SHOULD have them**:
1. `notifications/page.tsx` - List page without breadcrumb
2. `om-expense-categories/page.tsx` - List page without breadcrumb
3. `project-data-import/page.tsx` - Utility page without breadcrumb

### "Back"/"Cancel" Button Behavior

| Form | Cancel Behavior |
|------|----------------|
| Most forms (11/14) | `router.back()` - standard browser back |
| OMExpenseCategoryForm | `<Link href="/om-expense-categories">` - explicit list link |
| QuoteUploadForm | No explicit cancel button |
| OMExpenseItemForm | No cancel (inline form) |

**Finding**: `router.back()` is the dominant pattern (consistent). One form uses a static Link, which is fine but different.

### "Create New" Button on List Pages

All 14 CRUD list pages have a "Create New" button linking to `/[module]/new`. Verified:
- budget-pools, projects, proposals, vendors, expenses, purchase-orders, charge-outs, om-expenses, om-expense-categories, operating-companies, users, quotes

### Pagination Consistency

| Pagination Method | Modules |
|-------------------|---------|
| **PaginationControls component** | budget-pools, vendors, expenses, purchase-orders, quotes, dashboard/supervisor (6) |
| **Inline custom pagination** | projects, charge-outs (2) - own prev/next buttons with page number display |
| **No pagination** | proposals, om-expenses, om-expense-categories, operating-companies, users, notifications, om-summary, data-import (8) |

**Severity**: MEDIUM - 8 list pages have no pagination at all, relying on loading all items. The 2 custom pagination implementations (projects, charge-outs) look different from the PaginationControls component.

---

## Set E: Loading State Consistency (15 points)

### Loading State Method Matrix

| Page | Query Loading | Loading UI Component | Mutation Loading |
|------|-------------|---------------------|-----------------|
| **budget-pools** (list) | `isLoading` | `BudgetPoolListSkeleton` (custom) | N/A |
| **budget-pools** (detail) | `isLoading` | `Skeleton` (multiple blocks) | Button disabled + text |
| **projects** (list) | `isLoading` | Inline skeleton placeholders | Button disabled |
| **proposals** (list) | `isLoading` | Inline text `loading...` | Button disabled + text |
| **expenses** (list) | `isLoading` | `Skeleton` (multiple blocks) | Button disabled |
| **charge-outs** (list) | `isLoading` | Inline text `tCommon('loading')` | Button disabled |
| **om-expenses** (list) | `isLoading` | Inline text `tCommon('loading')` | Button disabled |
| **om-expense-categories** (list) | `isLoading` | `Loader2` (animate-spin icon) | N/A |
| **vendors** (list) | `isLoading` | Inline skeleton structure | N/A |
| **purchase-orders** (list) | `isLoading` | Inline skeleton structure | Button disabled |
| **quotes** (list) | `isLoading` | Inline skeleton structure | Button disabled |
| **dashboard/pm** | `isLoading` | `Skeleton` (multiple blocks) | N/A |
| **dashboard/supervisor** | `isLoading` | `Skeleton` (multiple blocks) | N/A |
| **notifications** | `isLoading` | Inline text `t('states.loading')` | Button disabled |
| **settings/currencies** | `isLoading` | `Skeleton` rows | Button disabled |

### Findings

**Loading component choice varies significantly**:
- **Skeleton blocks**: budget-pools detail, projects list, expenses list, dashboards, settings/currencies (BEST practice)
- **Custom ListSkeleton**: budget-pools list only (most polished)
- **Inline text "Loading..."**: charge-outs, om-expenses, notifications, proposals (LEAST polished)
- **Loader2 spinner icon**: om-expense-categories only

**Mutation loading states**: Consistent across all forms - buttons show disabled state and text changes to indicate processing (e.g., "Deleting...", "Saving..."). This is well-done.

### GlobalProgress

- Installed in `[locale]/layout.tsx` as `<GlobalProgress />` at the root level
- Active during Next.js route navigation transitions
- Provides a top-of-page progress bar (NProgress style)
- **Consistent**: Applied globally, no per-page configuration needed

**Severity**: MEDIUM - The 4 modules using inline text ("Loading...") instead of Skeleton placeholders provide a noticeably worse UX compared to the skeleton-based modules.

---

## Set F: Empty State & Error State Consistency (10 points)

### Empty State Matrix (List Pages)

| Module | Empty State UI | i18n | "Create First" CTA |
|--------|---------------|------|---------------------|
| **expenses** | Card with icon + title + description | Yes | Yes (conditional) |
| **om-expenses** | Text message | Yes | Yes (conditional) |
| **notifications** | Icon + text in rounded card | Yes (3 variants: all/unread/read) | No |
| **dashboard/pm** | Icon + text + create button | Yes | Yes |
| **dashboard/supervisor** | Icon + text | Yes | No |
| **settings/currencies** | Centered text | Yes | No |
| **charge-outs** | Not visible (table just empty) | Unclear | No |
| **budget-pools** | Handled by BudgetPoolListSkeleton | Unclear | Unclear |
| **vendors** | Not checked (likely similar pattern) | -- | -- |
| **projects** | Custom empty state with buttons | Yes | Yes |

### Error State Matrix (API Error)

| Module | Error Display Method | i18n |
|--------|---------------------|------|
| **budget-pools** (list) | `Alert variant="destructive"` inline | Yes |
| **budget-pools** (detail) | `Alert variant="destructive"` inline | Yes |
| **expenses** (list) | `Alert variant="destructive"` inline | Yes |
| **vendors** (list) | `Alert variant="destructive"` inline | Yes |
| **vendors** (detail) | `Alert variant="destructive"` inline | Yes |
| **settings/currencies** | `Alert variant="destructive"` inline | Yes |
| **proposals** (detail) | `Alert variant="destructive"` inline | Yes |
| **charge-outs** (list) | Toast only (no inline) | Yes |
| **om-expenses** (list) | Toast only (no inline) | Yes |
| **dashboard** pages | No visible error handling | N/A |

### Findings

**Empty states**: Inconsistent. Some modules (expenses, projects) have well-designed empty states with icons and CTAs. Others (charge-outs, budget-pools) show nothing or just an empty table.

**Error states**: Generally consistent using `Alert variant="destructive"` for query errors. However, charge-outs and om-expenses only show errors via toast, missing the inline error display. Dashboard pages appear to have no error handling at all.

**Severity**: LOW-MEDIUM - Empty state inconsistency affects UX but is not a functional issue. The dashboard pages missing error handling is more concerning.

---

## Summary: Consistency Scores

| Category | Score | Severity | Key Issue |
|----------|-------|----------|-----------|
| **A: Delete Confirmation** | 14/20 | MEDIUM | 3 modules use native `confirm()`, 1 has no confirmation at all |
| **B: Toast Notifications** | 18/20 | LOW | Dead old Toast system, minor import path inconsistency |
| **C: Form Validation** | 14/20 | MEDIUM | Mixed `text-red-500` vs `text-destructive`, mixed form libraries |
| **D: Navigation** | 12/15 | MEDIUM | 3 list pages missing breadcrumbs, 8 pages with no pagination |
| **E: Loading States** | 11/15 | MEDIUM | 4 modules use inline text instead of Skeleton components |
| **F: Empty/Error States** | 7/10 | LOW-MEDIUM | Inconsistent empty states, dashboards lack error handling |
| **TOTAL** | **76/100** | | |

---

## Top Priority Fixes (Recommended)

### P1 - Quick Wins
1. **Replace 3 native `confirm()` with AlertDialog** in: `budget-pools/[id]/page.tsx`, `vendors/[id]/page.tsx`, `om-expenses/[id]/page.tsx` (header + item delete)
2. **Add confirmation to notifications delete** in `notifications/page.tsx`
3. **Standardize required field indicator** to `text-destructive` across all forms (replace `text-red-500`)
4. **Remove dead Toast.tsx** file or add deprecation notice

### P2 - Medium Effort
5. **Add breadcrumbs** to `notifications/page.tsx`, `om-expense-categories/page.tsx`, `project-data-import/page.tsx`
6. **Replace inline "Loading..." text** with Skeleton components in charge-outs, om-expenses, notifications, proposals list pages
7. **Add pagination** to proposals, om-expense-categories, operating-companies, users list pages
8. **Add error handling** to dashboard/pm and dashboard/supervisor pages

### P3 - Architecture Consideration
9. **Standardize form library choice**: Consider migrating remaining useState forms to react-hook-form + Zod for consistency (lower priority as both work correctly)
10. **Standardize toast i18n key patterns**: Consolidate the 3 different toast key naming patterns into one

---

## Files Referenced

### Delete confirmation (native confirm - needs fix)
- `apps/web/src/app/[locale]/budget-pools/[id]/page.tsx` (line 125)
- `apps/web/src/app/[locale]/vendors/[id]/page.tsx` (line 100)
- `apps/web/src/app/[locale]/om-expenses/[id]/page.tsx` (lines 235, 257)

### Delete confirmation (AlertDialog - correct pattern)
- `apps/web/src/app/[locale]/projects/[id]/page.tsx`
- `apps/web/src/app/[locale]/proposals/[id]/page.tsx`
- `apps/web/src/app/[locale]/expenses/page.tsx`
- `apps/web/src/app/[locale]/charge-outs/page.tsx`
- `apps/web/src/app/[locale]/quotes/page.tsx`
- `apps/web/src/app/[locale]/purchase-orders/page.tsx`
- `apps/web/src/app/[locale]/proposals/page.tsx`
- `apps/web/src/app/[locale]/projects/page.tsx`
- `apps/web/src/app/[locale]/om-expenses/page.tsx`
- `apps/web/src/components/om-expense-category/OMExpenseCategoryActions.tsx`
- `apps/web/src/components/operating-company/OperatingCompanyActions.tsx`
- `apps/web/src/components/charge-out/ChargeOutActions.tsx`
- `apps/web/src/components/om-expense/OMExpenseItemList.tsx`

### Toast systems
- `apps/web/src/components/ui/use-toast.tsx` (ACTIVE)
- `apps/web/src/components/ui/Toast.tsx` (DEAD CODE)
- `apps/web/src/components/ui/toaster.tsx` (ACTIVE renderer)

### Forms using text-red-500 (needs theme migration)
- `apps/web/src/components/project/ProjectForm.tsx`
- `apps/web/src/components/budget-pool/BudgetPoolForm.tsx`
- `apps/web/src/components/budget-pool/CategoryFormRow.tsx`
- `apps/web/src/components/vendor/VendorForm.tsx`
- `apps/web/src/components/quote/QuoteUploadForm.tsx`

### Pages missing breadcrumbs
- `apps/web/src/app/[locale]/notifications/page.tsx`
- `apps/web/src/app/[locale]/om-expense-categories/page.tsx`
- `apps/web/src/app/[locale]/project-data-import/page.tsx`

### GlobalProgress (verified active)
- `apps/web/src/app/[locale]/layout.tsx` (line 109)
