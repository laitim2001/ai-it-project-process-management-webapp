# FIX-118, FIX-131, FIX-131b: Locale & Required Field Indicator Fixes

> **Date**: 2026-04-09
> **Status**: Completed (partial for FIX-131b)

---

## FIX-131: Standardize Required Field Indicators

### Problem
Required field asterisks (`*`) used inconsistent CSS classes:
- Some forms used `text-red-500` (hardcoded, breaks dark mode)
- Should use `text-destructive` (theme-aware, respects dark mode)

### Changes Made
Replaced `<span className="text-red-500">*</span>` with `<span className="text-destructive">*</span>` in all form components.

**Total replacements: 21 occurrences across 6 files**

| File | Count |
|------|-------|
| `apps/web/src/components/project/ProjectForm.tsx` | 11 |
| `apps/web/src/components/budget-pool/BudgetPoolForm.tsx` | 3 |
| `apps/web/src/components/budget-pool/CategoryFormRow.tsx` | 2 |
| `apps/web/src/components/quote/QuoteUploadForm.tsx` | 3 |
| `apps/web/src/components/vendor/VendorForm.tsx` | 1 |
| `apps/web/src/components/proposal/ProposalActions.tsx` | 1 |

### Note
Only `text-red-500` used specifically for required field asterisks was replaced. Other uses of `text-red-500` (error messages, validation borders) were left unchanged as they are separate concerns.

---

## FIX-118: Fix zh-HK to zh-TW

### Problem
Multiple files used `'zh-HK'` locale for `Intl.NumberFormat` and `Intl.DateTimeFormat`, inconsistent with the app's locale configuration which supports `en` and `zh-TW`.

### Changes Made
Replaced all `'zh-HK'` with `'zh-TW'` across 8 files.

**Total replacements: 11 occurrences across 8 files**

| File | Occurrences | Context |
|------|------------|---------|
| `apps/web/src/app/[locale]/charge-outs/[id]/page.tsx` | 3 | NumberFormat, DateTimeFormat (x2) |
| `apps/web/src/app/[locale]/charge-outs/page.tsx` | 2 | NumberFormat, DateTimeFormat |
| `apps/web/src/app/[locale]/om-expenses/[id]/page.tsx` | 1 | toLocaleDateString |
| `apps/web/src/components/charge-out/ChargeOutForm.tsx` | 1 | NumberFormat |
| `apps/web/src/components/om-expense/OMExpenseForm.tsx` | 1 | NumberFormat |
| `apps/web/src/components/om-expense/OMExpenseItemMonthlyGrid.tsx` | 1 | NumberFormat |
| `apps/web/src/components/om-expense/OMExpenseMonthlyGrid.tsx` | 1 | NumberFormat |
| `apps/web/e2e/fixtures/test-data.ts` | 1 | NumberFormat |

---

## FIX-118 (part 2): Fix toLocaleDateString() without locale

### Problem
Some `toLocaleDateString()` calls had no locale parameter, causing browser-dependent date formatting.

### Changes Made
Added `locale` parameter from `useLocale()` (next-intl) to 3 occurrences across 2 files.

| File | Line | Change |
|------|------|--------|
| `apps/web/src/app/[locale]/users/page.tsx` | 214 | Added `useLocale` import and `locale` variable; changed `.toLocaleDateString()` to `.toLocaleDateString(locale)` |
| `apps/web/src/app/[locale]/dashboard/pm/page.tsx` | 388 | Added `useLocale` import and `locale` variable; changed `.toLocaleDateString()` to `.toLocaleDateString(locale)` for proposal date |
| `apps/web/src/app/[locale]/dashboard/pm/page.tsx` | 429 | Changed `.toLocaleDateString()` to `.toLocaleDateString(locale)` for expense date |

---

## FIX-131b: Hardcoded Chinese Text Cleanup

### Problem
Three edit pages contained hardcoded Chinese text that should use i18n translation keys.

### Changes Made

#### `apps/web/src/app/[locale]/charge-outs/[id]/edit/page.tsx`
Added `tNav` (`navigation`) and `tCommon` (`common`) translation hooks.

| Hardcoded Chinese | Replacement | i18n Key |
|------------------|-------------|----------|
| `載入中...` | `{tCommon('loading')}` | `common.loading` |
| `找不到 ChargeOut 記錄` | `{t('detail.notFound')}` | `chargeOuts.detail.notFound` |
| `返回列表` | `{tCommon('actions.back')}` | `common.actions.back` |
| `返回詳情` | `{tCommon('actions.back')}` | `common.actions.back` |
| `首頁` (breadcrumb) | `{tNav('dashboard')}` | `navigation.dashboard` |
| `費用轉嫁` (breadcrumb) | `{tNav('menu.chargeOuts')}` | `navigation.menu.chargeOuts` |
| `編輯` (breadcrumb) | `{tCommon('actions.edit')}` | `common.actions.edit` |

**Remaining (need new i18n keys):**
- `只有草稿 (Draft) 狀態的 ChargeOut 可以編輯` - needs `chargeOuts.edit.draftOnly` key
- `編輯 ChargeOut` (page title) - needs `chargeOuts.form.edit.title` key

#### `apps/web/src/app/[locale]/purchase-orders/[id]/edit/page.tsx`
Added `tNav` (`navigation`) and `tCommon` (`common`) translation hooks.

| Hardcoded Chinese | Replacement | i18n Key |
|------------------|-------------|----------|
| `首頁` (breadcrumb, x3) | `{tNav('dashboard')}` | `navigation.dashboard` |
| `採購單` (breadcrumb, x3) | `{tNav('menu.purchaseOrders')}` | `navigation.menu.purchaseOrders` |
| `編輯` (breadcrumb, x3) | `{tCommon('actions.edit')}` | `common.actions.edit` |
| `找不到採購單。此採購單...` | `{t('errors.notFound')}` | `purchaseOrders.errors.notFound` |
| `返回採購單列表` | `{t('actions.backToList')}` | `purchaseOrders.actions.backToList` |
| `返回詳情頁面` | `{tCommon('actions.goBack')}` | `common.actions.goBack` |
| `編輯採購單` (page title) | `{t('form.editTitle')}` | `purchaseOrders.form.editTitle` |

**Remaining (need new i18n keys):**
- `只有草稿狀態的採購單才能編輯。當前狀態：{status}` - needs `purchaseOrders.edit.draftOnly` key
- `修改採購單信息和品項明細` - needs `purchaseOrders.form.editDescription` key

#### `apps/web/src/app/[locale]/vendors/[id]/edit/page.tsx`
Added `tNav` (`navigation`) and `tCommon` (`common`) translation hooks.

| Hardcoded Chinese | Replacement | i18n Key |
|------------------|-------------|----------|
| `首頁` (breadcrumb, x2) | `{tNav('dashboard')}` | `navigation.dashboard` |
| `供應商管理` (breadcrumb, x2) | `{tNav('menu.vendors')}` | `navigation.menu.vendors` |
| `編輯` (breadcrumb, x2) | `{tCommon('actions.edit')}` | `common.actions.edit` |
| `編輯供應商` (page title) | `{t('form.edit.title')}` | `vendors.form.edit.title` |
| `更新 {name} 的資訊` | `{t('form.edit.subtitle')}` | `vendors.form.edit.subtitle` |

**Remaining (need new i18n keys):**
- `找不到供應商。此供應商可能不存在或已被刪除。` - needs `vendors.errors.notFound` or `vendors.edit.notFound` key
- `返回供應商列表` - needs `vendors.actions.backToList` key

---

## Summary of New i18n Keys Needed

The following keys need to be added to both `en.json` and `zh-TW.json` by the i18n agent:

```json
{
  "chargeOuts": {
    "edit": {
      "title": "Edit Charge Out",
      "draftOnly": "Only Draft status charge outs can be edited"
    }
  },
  "purchaseOrders": {
    "edit": {
      "draftOnly": "Only Draft status purchase orders can be edited. Current status: {status}",
      "description": "Modify purchase order information and item details"
    }
  },
  "vendors": {
    "errors": {
      "notFound": "Vendor not found. This vendor may not exist or has been deleted."
    },
    "actions": {
      "backToList": "Back to Vendor List"
    }
  }
}
```

---

## Files Modified (Complete List)

### FIX-131 (text-red-500 -> text-destructive)
1. `apps/web/src/components/project/ProjectForm.tsx`
2. `apps/web/src/components/budget-pool/BudgetPoolForm.tsx`
3. `apps/web/src/components/budget-pool/CategoryFormRow.tsx`
4. `apps/web/src/components/quote/QuoteUploadForm.tsx`
5. `apps/web/src/components/vendor/VendorForm.tsx`
6. `apps/web/src/components/proposal/ProposalActions.tsx`

### FIX-118 (zh-HK -> zh-TW)
7. `apps/web/src/app/[locale]/charge-outs/[id]/page.tsx`
8. `apps/web/src/app/[locale]/charge-outs/page.tsx`
9. `apps/web/src/app/[locale]/om-expenses/[id]/page.tsx`
10. `apps/web/src/components/charge-out/ChargeOutForm.tsx`
11. `apps/web/src/components/om-expense/OMExpenseForm.tsx`
12. `apps/web/src/components/om-expense/OMExpenseItemMonthlyGrid.tsx`
13. `apps/web/src/components/om-expense/OMExpenseMonthlyGrid.tsx`
14. `apps/web/e2e/fixtures/test-data.ts`

### FIX-118 (toLocaleDateString locale)
15. `apps/web/src/app/[locale]/users/page.tsx`
16. `apps/web/src/app/[locale]/dashboard/pm/page.tsx`

### FIX-131b (hardcoded Chinese -> i18n)
17. `apps/web/src/app/[locale]/charge-outs/[id]/edit/page.tsx`
18. `apps/web/src/app/[locale]/purchase-orders/[id]/edit/page.tsx`
19. `apps/web/src/app/[locale]/vendors/[id]/edit/page.tsx`
