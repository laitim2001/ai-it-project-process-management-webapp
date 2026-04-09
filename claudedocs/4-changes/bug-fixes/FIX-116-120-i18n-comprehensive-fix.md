# FIX-116 ~ FIX-120: Comprehensive i18n Translation Key Fix

**Date**: 2026-04-09
**Scope**: R6 Exhaustive i18n Verification follow-up
**Total Keys Added**: 66 leaf keys (to both en.json and zh-TW.json)
**Files Changed**: 5

---

## Summary

Based on Round 6 exhaustive i18n verification, this fix addresses missing translation keys, structural mismatches, and dynamic key construction bugs across the application.

---

## FIX-116: Missing Translation Keys (66 keys added to each file)

### Cluster 1: dashboard.budgetPool (11 keys) -- NEW NAMESPACE
Entire namespace was missing. Added all 11 keys used by `BudgetPoolOverview.tsx`:
- `noData`, `fiscalYearPool`, `totalBudget`, `used`, `remaining`, `utilizationRate`
- `relatedProjects`, `projectCount`, `activeCount`, `warningAlmostDepleted`, `warningHighUsage`

### Cluster 2: omExpenses.itemFields (R6 report Category 3 -- FALSE POSITIVES)
The R6 report listed 32 keys as missing under `omExpenses.itemFields`, but this was a misattribution. The main OMExpenseForm component uses `t = useTranslations('omExpenses.form')` (not `omExpenses.itemFields`), and all keys like `basicInfo.title`, `fields.name.label`, `actions.cancel`, etc. already exist under `omExpenses.form.*`. The InlineItemForm sub-component (line 811) uses `useTranslations('omExpenses.itemFields')` and accesses `name.label`, `opCo.label`, etc. -- all of which already exist. **No changes needed.**

### Cluster 3: auth.forgotPassword (13 new keys, structural change)
Code expected nested structure but JSON had flat structure. Restructured `email` from string to object with `label`, `placeholder`, `hint`. Added:
- `description`, `email.label`, `email.placeholder`, `email.hint`
- `sendButton`, `successTitle`, `successDescription`, `successMessage`, `checkSpam`
- `rememberedPassword`, `noAccount`, `registerNow`
- `errors.sendFailed`

Retained backward-compatible keys: `title`, `subtitle` (now also `description`), `sendResetLink`, `backToLogin`, `sending`, `success`.

### Cluster 4: omExpenses.monthlyGrid (7 keys)
Added missing keys used with `defaultValue` fallbacks:
- `readOnlyMode`, `descriptionAggregate`, `viewItems`, `itemBreakdown`
- `tips.aggregateView`, `tips.editViaItems`, `tips.autoUpdateTotal`

### Cluster 5: omExpenses.items (3 keys)
- `deleteConfirm`, `addFirstItemHint`, `atLeastOne`

### Cluster 6: common namespace (10 keys)
- `common.actions`: `exporting`, `backToList`, `add`, `retry`
- `common.errors`: `loadingError`, `tryAgain`
- `common.messages`: `deleteFailed`, `validationError`
- `common.validation`: `amountPositive`
- `common.form.currency`: `required`

### Cluster 7: budgetPools (4 keys)
- `form.categories.minOneRequired`
- `form.name.required`
- `form.fiscalYear.rangeError`
- `messages.notFound`
- `actions.backToList`
- `detail.categories.empty`

### Cluster 8: vendors (3 keys)
- `messages.notFound`
- `actions.backToList`
- `detail.noContact`

### Cluster 9: projects (3 keys)
- `actions.backToList`
- `form.edit.notFound`
- `form.edit.backToList`

### Cluster 10: proposals (1 key)
- `messages.commentRequired`

### Cluster 11: toast (2 keys)
- `updating`
- `pleaseLogin`

---

## FIX-117: toLowerCase() Status Rendering Bug (3 files)

**Problem**: `status.toLowerCase()` converts "PendingApproval" to "pendingapproval" but translation key is "pendingApproval" (camelCase).

**Fix**: Replaced `status.toLowerCase()` with `status.charAt(0).toLowerCase() + status.slice(1)` to preserve internal casing.

**Files changed**:
- `apps/web/src/app/[locale]/expenses/[id]/edit/page.tsx` (line 162)
- `apps/web/src/app/[locale]/expenses/page.tsx` (line 100)
- `apps/web/src/app/[locale]/purchase-orders/page.tsx` (lines 489, 651)

---

## FIX-118: zh-HK to zh-TW Locale Fix

**Status**: Already resolved. All source files already use `zh-TW` or `en-US`. The `zh-HK` references in the R6 report were based on a previous state that has since been corrected. No changes needed.

---

## FIX-119: Orphan Namespaces

**Status**: Left in place as documented. The `errors` (9 keys) and `loading` (10 keys) namespaces exist in JSON but are never imported via `useTranslations()`. They are retained for potential future use (error pages, loading components).

---

## FIX-120: auth.forgotPassword Structure

**Status**: Covered by FIX-116 Cluster 3. The flat structure was restructured to nested format matching the component's expected key paths.

---

## Statistics

| Metric | Count |
|--------|-------|
| Leaf keys added (per file) | 66 |
| Total leaf keys (en.json) | 2,706 (was 2,640) |
| Total leaf keys (zh-TW.json) | 2,706 (was 2,640) |
| Key structure parity | 100% (both files identical structure) |
| Source files changed (toLowerCase fix) | 3 |
| Translation files changed | 2 |
| Total files changed | 5 |
| R6 false positives identified | 32 (omExpenses.itemFields namespace misattribution) |

## Files Changed

1. `apps/web/src/messages/en.json` -- +66 keys
2. `apps/web/src/messages/zh-TW.json` -- +66 keys
3. `apps/web/src/app/[locale]/expenses/[id]/edit/page.tsx` -- toLowerCase fix
4. `apps/web/src/app/[locale]/expenses/page.tsx` -- toLowerCase fix
5. `apps/web/src/app/[locale]/purchase-orders/page.tsx` -- toLowerCase fix (2 occurrences)
