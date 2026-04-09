# FIX-129, FIX-133, FIX-134: UX Consistency Fixes

## FIX-129: Standardize Delete Confirmation to AlertDialog

### Problem
Three modules used native browser `confirm()` for delete confirmation instead of the project's AlertDialog component, creating an inconsistent user experience.

### Affected Pages
1. `apps/web/src/app/[locale]/budget-pools/[id]/page.tsx`
2. `apps/web/src/app/[locale]/vendors/[id]/page.tsx`
3. `apps/web/src/app/[locale]/om-expenses/[id]/page.tsx` (both main delete and item delete)

### Solution
Replaced all `confirm()` calls with AlertDialog pattern matching `projects/[id]/page.tsx` (CHANGE-019).

### Changes

#### budget-pools/[id]/page.tsx
- Added AlertDialog component imports
- Replaced `confirm()` in `handleDelete()` with direct mutation call
- Wrapped delete button with `AlertDialog` + `AlertDialogTrigger`
- Added confirmation dialog with title, description, cancel, and destructive action

#### vendors/[id]/page.tsx
- Added AlertDialog component imports
- Replaced `confirm()` in `handleDelete()` with direct mutation call
- Wrapped delete button with `AlertDialog` + `AlertDialogTrigger`
- Added confirmation dialog matching project pattern

#### om-expenses/[id]/page.tsx
- Added AlertDialog imports + Trash2 icon import
- Added `tDetail` translations reference for `omExpenses.detail` namespace
- **Main delete**: Replaced `confirm()` with AlertDialog wrapping the destructive button
- **Item delete**: Added `deleteItemId` state + `confirmDeleteItem` callback
  - `handleDeleteItem` now sets `deleteItemId` instead of calling `confirm()`
  - Separate AlertDialog at bottom of component for item deletion
- Added Skeleton import for loading state improvement

### i18n Keys Added
Both `en.json` and `zh-TW.json`:
- `budgetPools.deleteDialog.title` / `budgetPools.deleteDialog.description`
- `vendors.deleteDialog.title` / `vendors.deleteDialog.description`
- `omExpenses.detail.deleteDialog.title` / `omExpenses.detail.deleteDialog.description`
- `omExpenses.detail.itemDeleteDialog.title` / `omExpenses.detail.itemDeleteDialog.description`

---

## FIX-133: Fix Loading States - Replace Text with Skeleton

### Problem
Several pages used plain text loading indicators (`"Loading..."`, `{t('detail.loading')}`, `"載入中..."`) instead of proper Skeleton components, inconsistent with the project's established pattern in expenses, budget-pools, etc.

### Affected Pages
1. `apps/web/src/app/[locale]/charge-outs/[id]/edit/page.tsx`
2. `apps/web/src/app/[locale]/om-expenses/[id]/page.tsx`
3. `apps/web/src/app/[locale]/om-expenses/[id]/edit/page.tsx`

### Solution
Replaced text-only loading states with Skeleton components matching the established pattern from `expenses/[id]/page.tsx` and `budget-pools/[id]/page.tsx`.

### Changes

#### charge-outs/[id]/edit/page.tsx
- Added Skeleton import
- Replaced `<div className="text-center py-8">` with structured Skeleton layout (breadcrumb, header, form area)

#### om-expenses/[id]/page.tsx
- Added Skeleton import
- Replaced `<div className="text-center py-8">{t('detail.loading')}</div>` with full Skeleton layout matching the page's 3-column grid structure

#### om-expenses/[id]/edit/page.tsx
- Added Skeleton import
- Replaced `<div className="text-center py-8">{t('detail.loading')}</div>` with Skeleton layout (breadcrumb, header, form area)

---

## FIX-134: Add Frontend Role Checks for Admin/Supervisor Pages

### Problem
Admin-only and supervisor-only pages lacked frontend role validation. While the API enforces RBAC, unauthorized users could briefly see the page layout before the API error appeared, creating a poor UX.

### Affected Pages
1. `apps/web/src/app/[locale]/users/page.tsx` - Admin only
2. `apps/web/src/app/[locale]/dashboard/supervisor/page.tsx` - Supervisor/Admin only
3. `apps/web/src/app/[locale]/settings/currencies/page.tsx` - Admin only

### Solution
Added `useSession()` + role check at the top of each component, redirecting unauthorized users to `/dashboard`. Follows the existing pattern from `projects/[id]/page.tsx` where `session.user.role?.name` is used for role checks.

### Changes

#### users/page.tsx
- Added `useSession` from `next-auth/react` and `useRouter` imports
- Added `isAdmin` check: `session?.user?.role?.name === 'Admin'`
- Redirects non-admin users to `/dashboard`

#### dashboard/supervisor/page.tsx
- Added `useSession` from `next-auth/react` and `useRouter` imports
- Added `isSupervisorOrAdmin` check: Supervisor or Admin role
- Redirects non-supervisor/admin users to `/dashboard`

#### settings/currencies/page.tsx
- Added `useSession` from `next-auth/react` and `useRouter` imports
- Added `isAdmin` check: `session?.user?.role?.name === 'Admin'`
- Redirects non-admin users to `/dashboard`

---

## Files Modified

### Page Files (7)
- `apps/web/src/app/[locale]/budget-pools/[id]/page.tsx`
- `apps/web/src/app/[locale]/vendors/[id]/page.tsx`
- `apps/web/src/app/[locale]/om-expenses/[id]/page.tsx`
- `apps/web/src/app/[locale]/charge-outs/[id]/edit/page.tsx`
- `apps/web/src/app/[locale]/om-expenses/[id]/edit/page.tsx`
- `apps/web/src/app/[locale]/users/page.tsx`
- `apps/web/src/app/[locale]/dashboard/supervisor/page.tsx`
- `apps/web/src/app/[locale]/settings/currencies/page.tsx`

### i18n Files (2)
- `apps/web/src/messages/en.json`
- `apps/web/src/messages/zh-TW.json`

## Testing Checklist
- [ ] Budget Pool detail page: Delete button opens AlertDialog, cancel works, confirm deletes
- [ ] Vendor detail page: Delete button opens AlertDialog, cancel works, confirm deletes
- [ ] OM Expense detail page: Main delete opens AlertDialog
- [ ] OM Expense detail page: Item delete opens AlertDialog
- [ ] Charge Out edit page: Loading shows Skeleton instead of text
- [ ] OM Expense detail page: Loading shows Skeleton instead of text
- [ ] OM Expense edit page: Loading shows Skeleton instead of text
- [ ] Users page: Non-admin redirected to dashboard
- [ ] Supervisor dashboard: Non-supervisor redirected to dashboard
- [ ] Currencies page: Non-admin redirected to dashboard
- [ ] Test in both en and zh-TW locales

---

**Date**: 2026-04-09
**Author**: AI Assistant (Claude)
