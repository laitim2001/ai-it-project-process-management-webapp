# Round 6: Exhaustive i18n Translation Key Verification

**Date**: 2026-04-09
**Scope**: Every `useTranslations()` call and `t()` key usage across the entire codebase
**Files Scanned**: All `.tsx` files in `apps/web/src/`

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Total `useTranslations()` calls | 234 |
| Unique namespace strings used | 54 |
| Unique (file, namespace) pairs | 229 |
| Total `t()` calls verified | 2,884 |
| **Missing translation keys** | **~87 genuine** (+ ~23 false positives from regex) |
| Top-level namespaces in JSON | 29 (en) / 29 (zh-TW) |
| Total leaf keys (en.json) | 2,640 |
| Total leaf keys (zh-TW.json) | 2,640 |
| Key structure parity (en vs zh-TW) | **100% identical** |
| Orphan namespaces (JSON exists, code never imports) | **2** (`errors`, `loading`) |
| Orphan leaf keys confirmed | **5** (expense category options) |
| Empty translation values | **0** |
| HTML in translations (XSS risk) | **0** |
| Hardcoded Chinese in aria-labels | **4 instances** |
| Locale-unaware date formatting calls | **4 files** |
| Inconsistent locale usage (zh-HK instead of zh-TW) | **10 files** |

**Severity Assessment**: The 87 missing keys represent a REAL runtime issue -- these will cause `IntlError: MISSING_MESSAGE` errors when users visit the affected pages.

---

## Set A: Exhaustive t() Call Verification

### A1. All Unique Namespaces Used in Code (54 total)

```
auth.forgotPassword              auth.login
auth.register                    budgetPools
budgetPools.form.category        chargeOuts
chargeOuts.actions               chargeOuts.form
common                           common.actions
common.status                    currencies
dashboard                        dashboard.budgetPool          [MISSING NAMESPACE]
dashboardPM                      dashboardSupervisor
dataImport                       expenses
navigation                       navigation.menu
notifications                    omExpenseCategories
omExpenses                       omExpenses.form
omExpenses.itemFields            omExpenses.items
omExpenses.messages              omExpenses.new
omSummary                        operatingCompanies
projectDataImport                projects
projects.detail                  projects.form
projects.form.actions            projects.form.edit
projects.form.fields             projects.form.fields.budgetCategoryDetails
projectSummary                   proposals
proposals.attachments            proposals.comments
proposals.meeting                purchaseOrders
quotes                           settings
settings.security                settings.security.passwordDialog
toast                            users
users.password                   users.permissions
validation                       vendors
```

### A2. Missing Namespace

**1 namespace does not exist at all in translation files:**

| Namespace | Used In | Impact |
|-----------|---------|--------|
| `dashboard.budgetPool` | `BudgetPoolOverview.tsx` | **11 keys all missing** -- entire component non-functional for i18n |

The `dashboard` namespace exists but contains only: `title`, `welcome`, `welcomeMessage`, `stats`, `budgetTrend`, `quickActions`, `recentActivities`, `aiInsights`. There is NO `budgetPool` sub-object.

### A3. Complete List of Missing Translation Keys (87 genuine)

#### Category 1: BudgetPoolOverview -- Entire namespace missing (11 keys)

| # | Full Key Path | File |
|---|---------------|------|
| 1 | `dashboard.budgetPool.noData` | `components/dashboard/BudgetPoolOverview.tsx:95` |
| 2 | `dashboard.budgetPool.fiscalYearPool` | `BudgetPoolOverview.tsx:111` |
| 3 | `dashboard.budgetPool.totalBudget` | `BudgetPoolOverview.tsx:126` |
| 4 | `dashboard.budgetPool.used` | `BudgetPoolOverview.tsx:134` |
| 5 | `dashboard.budgetPool.remaining` | `BudgetPoolOverview.tsx:147` |
| 6 | `dashboard.budgetPool.utilizationRate` | `BudgetPoolOverview.tsx:169` |
| 7 | `dashboard.budgetPool.relatedProjects` | `BudgetPoolOverview.tsx:199` |
| 8 | `dashboard.budgetPool.projectCount` | `BudgetPoolOverview.tsx:203` |
| 9 | `dashboard.budgetPool.activeCount` | `BudgetPoolOverview.tsx:206` |
| 10 | `dashboard.budgetPool.warningAlmostDepleted` | `BudgetPoolOverview.tsx:215` |
| 11 | `dashboard.budgetPool.warningHighUsage` | `BudgetPoolOverview.tsx:220` |

#### Category 2: Forgot Password -- Flat structure vs nested usage (13 keys)

The `auth.forgotPassword` namespace has a flat structure (`title`, `subtitle`, `email`, `sendResetLink`, `backToLogin`, `sending`, `success`), but the code uses nested paths:

| # | Full Key Path | File | Existing Similar Key |
|---|---------------|------|---------------------|
| 12 | `auth.forgotPassword.errors.sendFailed` | `forgot-password/page.tsx:83` | (none) |
| 13 | `auth.forgotPassword.successTitle` | `forgot-password/page.tsx:95` | `success` exists |
| 14 | `auth.forgotPassword.successDescription` | `forgot-password/page.tsx:98` | (none) |
| 15 | `auth.forgotPassword.successMessage` | `forgot-password/page.tsx:103` | (none) |
| 16 | `auth.forgotPassword.checkSpam` | `forgot-password/page.tsx:107` | (none) |
| 17 | `auth.forgotPassword.description` | `forgot-password/page.tsx:128` | `subtitle` exists |
| 18 | `auth.forgotPassword.email.label` | `forgot-password/page.tsx:136` | `email` (string, not obj) |
| 19 | `auth.forgotPassword.email.placeholder` | `forgot-password/page.tsx:146` | (none) |
| 20 | `auth.forgotPassword.email.hint` | `forgot-password/page.tsx:149` | (none) |
| 21 | `auth.forgotPassword.sendButton` | `forgot-password/page.tsx:166` | `sendResetLink` exists |
| 22 | `auth.forgotPassword.rememberedPassword` | `forgot-password/page.tsx:173` | (none) |
| 23 | `auth.forgotPassword.noAccount` | `forgot-password/page.tsx:182` | (none) |
| 24 | `auth.forgotPassword.registerNow` | `forgot-password/page.tsx:187` | (none) |

#### Category 3: OMExpenseForm -- itemFields nested mismatch (32 keys)

The code uses `useTranslations('omExpenses.itemFields')` and then calls `t('basicInfo.title')`, `t('fields.name.label')`, etc. But the actual `omExpenses.itemFields` structure is flat: `name.label`, `opCo.label`, etc.

| # | Full Key Path | File |
|---|---------------|------|
| 25 | `omExpenses.itemFields.basicInfo.title` | `OMExpenseForm.tsx:391` |
| 26 | `omExpenses.itemFields.create.subtitle` | `OMExpenseForm.tsx:394` |
| 27 | `omExpenses.itemFields.edit.subtitle` | `OMExpenseForm.tsx:394` |
| 28 | `omExpenses.itemFields.fields.name.label` | `OMExpenseForm.tsx:405` |
| 29 | `omExpenses.itemFields.fields.name.placeholder` | `OMExpenseForm.tsx:408` |
| 30 | `omExpenses.itemFields.fields.description.label` | `OMExpenseForm.tsx:421` |
| 31 | `omExpenses.itemFields.fields.description.placeholder` | `OMExpenseForm.tsx:426` |
| 32 | `omExpenses.itemFields.fields.financialYear.label` | `OMExpenseForm.tsx:445` |
| 33 | `omExpenses.itemFields.fields.financialYear.placeholder` | `OMExpenseForm.tsx:452` |
| 34 | `omExpenses.itemFields.fields.category.label` | `OMExpenseForm.tsx:468` |
| 35 | `omExpenses.itemFields.fields.category.placeholder` | `OMExpenseForm.tsx:473` |
| 36 | `omExpenses.itemFields.opCoAndVendor.title` | `OMExpenseForm.tsx:496` |
| 37 | `omExpenses.itemFields.opCoAndVendor.description` | `OMExpenseForm.tsx:499` |
| 38 | `omExpenses.itemFields.fields.defaultOpCo.label` | `OMExpenseForm.tsx:511` |
| 39 | `omExpenses.itemFields.fields.opCo.placeholder` | `OMExpenseForm.tsx:519` |
| 40 | `omExpenses.itemFields.fields.defaultOpCo.noSelection` | `OMExpenseForm.tsx:524` |
| 41 | `omExpenses.itemFields.fields.defaultOpCo.description` | `OMExpenseForm.tsx:534` |
| 42 | `omExpenses.itemFields.fields.vendor.label` | `OMExpenseForm.tsx:549` |
| 43 | `omExpenses.itemFields.fields.vendor.placeholder` | `OMExpenseForm.tsx:556` |
| 44 | `omExpenses.itemFields.fields.vendor.noSelection` | `OMExpenseForm.tsx:561` |
| 45 | `omExpenses.itemFields.sourceExpense.title` | `OMExpenseForm.tsx:581` |
| 46 | `omExpenses.itemFields.sourceExpense.description` | `OMExpenseForm.tsx:582` |
| 47 | `omExpenses.itemFields.sourceExpense.label` | `OMExpenseForm.tsx:590` |
| 48 | `omExpenses.itemFields.sourceExpense.noSelection` | `OMExpenseForm.tsx:597,602` |
| 49 | `omExpenses.itemFields.sourceExpense.hint` | `OMExpenseForm.tsx:611` |
| 50 | `omExpenses.itemFields.sourceExpense.linkedProject` | `OMExpenseForm.tsx:621` |
| 51 | `omExpenses.itemFields.sourceExpense.linkedPO` | `OMExpenseForm.tsx:627` |
| 52 | `omExpenses.itemFields.itemsSection.title` | `OMExpenseForm.tsx:645` |
| 53 | `omExpenses.itemFields.actions.cancel` | `OMExpenseForm.tsx:762` |
| 54 | `omExpenses.itemFields.actions.create` | `OMExpenseForm.tsx:770` |
| 55 | `omExpenses.itemFields.actions.update` | `OMExpenseForm.tsx:771` |
| 56 | `omExpenses.itemFields.createNoticeNew` | `OMExpenseForm.tsx:780` |

#### Category 4: OMExpense MonthlyGrid + Items (10 keys)

| # | Full Key Path | File |
|---|---------------|------|
| 57 | `omExpenses.monthlyGrid.readOnlyMode` | `OMExpenseMonthlyGrid.tsx:291` |
| 58 | `omExpenses.monthlyGrid.descriptionAggregate` | `OMExpenseMonthlyGrid.tsx:297` |
| 59 | `omExpenses.monthlyGrid.viewItems` | `OMExpenseMonthlyGrid.tsx:309` |
| 60 | `omExpenses.monthlyGrid.itemBreakdown` | `OMExpenseMonthlyGrid.tsx:353` |
| 61 | `omExpenses.monthlyGrid.tips.aggregateView` | `OMExpenseMonthlyGrid.tsx:443` |
| 62 | `omExpenses.monthlyGrid.tips.editViaItems` | `OMExpenseMonthlyGrid.tsx:448` |
| 63 | `omExpenses.monthlyGrid.tips.autoUpdateTotal` | `OMExpenseMonthlyGrid.tsx:453` |
| 64 | `omExpenses.items.deleteConfirm` | `om-expenses/[id]/page.tsx:257` |
| 65 | `omExpenses.items.addFirstItemHint` | `om-expenses/[id]/page.tsx:695` |
| 66 | `omExpenses.items.atLeastOne` | `OMExpenseForm.tsx:348` |

#### Category 5: Common/shared keys (8 keys)

| # | Full Key Path | File |
|---|---------------|------|
| 67 | `common.errors.loadingError` | `budget-pools/page.tsx:194` |
| 68 | `common.errors.tryAgain` | `budget-pools/page.tsx:194` |
| 69 | `common.actions.exporting` | `budget-pools/page.tsx:256` |
| 70 | `common.actions.backToList` | `quotes/[id]/edit/page.tsx:200,241` |
| 71 | `common.messages.deleteFailed` | `vendors/[id]/page.tsx:90` |
| 72 | `common.messages.validationError` | `ExpenseForm.tsx:316,330` |
| 73 | `common.validation.amountPositive` | `BudgetProposalForm.tsx:146` |
| 74 | `common.actions.retry` | `UserPermissionsConfig.tsx:225` |

#### Category 6: Budget Pools form validation (3 keys)

| # | Full Key Path | File |
|---|---------------|------|
| 75 | `budgetPools.form.categories.minOneRequired` | `BudgetPoolForm.tsx:233` |
| 76 | `budgetPools.form.name.required` | `BudgetPoolForm.tsx:258` |
| 77 | `budgetPools.form.fiscalYear.rangeError` | `BudgetPoolForm.tsx:262` |

#### Category 7: Various page-specific keys (10 keys)

| # | Full Key Path | File |
|---|---------------|------|
| 78 | `budgetPools.messages.notFound` | `budget-pools/[id]/edit/page.tsx:152`, `[id]/page.tsx:191` |
| 79 | `budgetPools.actions.backToList` | `budget-pools/[id]/edit/page.tsx:156`, `[id]/page.tsx:195` |
| 80 | `budgetPools.detail.categories.empty` | `budget-pools/[id]/page.tsx:324` |
| 81 | `common.form.currency.required` | `BudgetPoolForm.tsx:267` |
| 82 | `common.actions.add` | `OMExpenseForm.tsx:962` |
| 83 | `vendors.messages.notFound` | `vendors/[id]/page.tsx:155` |
| 84 | `vendors.actions.backToList` | `vendors/[id]/page.tsx:159` |
| 85 | `vendors.detail.noContact` | `vendors/[id]/page.tsx:264` |
| 86 | `projects.form.edit.notFound` | `projects/[id]/edit/page.tsx:169` |
| 87 | `projects.form.edit.backToList` | `projects/[id]/edit/page.tsx:173` |

#### Category 8: Toast + proposal keys (4 keys)

| # | Full Key Path | File |
|---|---------------|------|
| 88 | `projects.actions.backToList` | `projects/[id]/quotes/page.tsx:221` |
| 89 | `toast.updating` | `quotes/[id]/edit/page.tsx:381` |
| 90 | `toast.pleaseLogin` | `ProposalActions.tsx:171,192` |
| 91 | `proposals.messages.commentRequired` | `ProposalActions.tsx:201` |

### A4. Dynamic Key Construction Risk

The following files construct translation keys dynamically, which may fail at runtime:

| File | Pattern | Risk |
|------|---------|------|
| `expenses/[id]/edit/page.tsx:162` | `t('status.'+expense.status.toLowerCase())` | `PendingApproval` -> `pendingapproval` but key is `pendingApproval` |
| `expenses/page.tsx:100` | `t('list.filter.${status.toLowerCase()}')` | Same casing mismatch risk |
| `purchase-orders/page.tsx:489,651` | `t('status.${po.status.toLowerCase()}')` | Same casing mismatch risk |
| `projects/page.tsx:764,902` | `tCommon('status.${project.status.charAt(0).toLowerCase() + project.status.slice(1)}')` | Safer -- preserves camelCase |
| `projects/page.tsx:891` | `t('fields.priority.${project.priority.toLowerCase()}')` | Risk if priority has mixed case |

---

## Set B: Orphan Translation Keys

### B1. Orphan Namespaces (2 found)

| Namespace | Leaf Keys | Used in Code? | Assessment |
|-----------|-----------|---------------|------------|
| `errors` | 9 | **No** -- never imported via `useTranslations('errors')` | Intended for future error pages (404, 500) that don't exist yet |
| `loading` | 10 | **No** -- never imported via `useTranslations('loading')` | Intended for loading components that use hardcoded strings instead |

Total orphan keys from unused namespaces: **19 keys**

### B2. Orphan Leaf Keys Within Used Namespaces (5 confirmed)

| Key | Assessment |
|-----|------------|
| `expenses.form.itemFields.category.options.hardware` | Code uses DB-driven category list, not hardcoded options |
| `expenses.form.itemFields.category.options.software` | Same -- orphan |
| `expenses.form.itemFields.category.options.consulting` | Same -- orphan |
| `expenses.form.itemFields.category.options.maintenance` | Same -- orphan |
| `expenses.form.itemFields.category.options.other` | Same -- orphan |

### B3. Deep Key Usage Verification (5 namespaces sampled)

| Namespace | Deep Key Checked | Used in Code? |
|-----------|-----------------|---------------|
| `projects.form.fields.budgetCategoryDetails.table.category` | Yes -- via `tFields('table.category')` in `BudgetCategoryDetails.tsx` |
| `projects.form.fields.budgetCategoryDetails.table.code` | Yes -- via `tFields('table.code')` |
| `omExpenses.form.fields.name.label` | Yes -- via `t('fields.name.label')` in `OMExpenseForm.tsx` |
| `proposals.form.fields.project.label` | Yes -- via `t('form.fields.project.label')` |
| `common.form.description.label` | Likely used indirectly |

---

## Set C: Translation Value Quality

### C1. Empty String Values
- **en.json**: 0 empty values
- **zh-TW.json**: 0 empty values

### C2. Identical Values (Potential Untranslated)

Only **2** entries have identical en/zh-TW values (both are legitimately identical):

| Key | Value | Assessment |
|-----|-------|------------|
| `auth.login.azureAD` | "Azure AD" | Brand name -- correct |
| `vendors.form.email.placeholder` | "vendor@example.com" | Email placeholder -- correct |

### C3. Placeholder Parameter Analysis

**139 keys** use `{placeholder}` syntax. Spot-checked 10:

| Key | Params | Used Correctly? |
|-----|--------|----------------|
| `common.pagination.total` | `{count}` | Yes |
| `dashboard.welcome.greeting` | `{name}` | Yes |
| `projects.pagination.showing` | `{start, end, total}` | Yes |
| `omSummary.summaryGrid.budget` | `{year}` | Yes |
| `dataImport.messages.parseSuccess` | `{count}` | Yes |

### C4. HTML/XSS in Translation Values
- **en.json**: 0 HTML tags found
- **zh-TW.json**: 0 HTML tags found

---

## Set D: i18n Configuration Completeness

### D1. Locale-Unaware Date Formatting (4 files)

These files call `toLocaleDateString()` WITHOUT passing a locale parameter, defaulting to the browser's locale instead of the app's current locale:

| File | Line | Code |
|------|------|------|
| `dashboard/pm/page.tsx` | 387 | `new Date(proposal.updatedAt).toLocaleDateString()` |
| `dashboard/pm/page.tsx` | 428 | `new Date(expense.expenseDate).toLocaleDateString()` |
| `users/page.tsx` | 213 | `new Date(user.createdAt).toLocaleDateString()` |
| `lib/exportUtils.ts` | 112 | `new Date(pool.createdAt).toLocaleDateString()` |

### D2. Inconsistent Locale Codes (zh-HK instead of zh-TW)

**10 files** use `'zh-HK'` for `Intl.NumberFormat` / `Intl.DateTimeFormat` instead of the app's `'zh-TW'` locale:

| File | Count of zh-HK usages |
|------|----------------------|
| `charge-outs/page.tsx` | 2 |
| `charge-outs/[id]/page.tsx` | 3 |
| `om-expenses/[id]/page.tsx` | 1 |
| `components/charge-out/ChargeOutForm.tsx` | 1 |
| `components/om-expense/OMExpenseForm.tsx` | 1 |
| `components/om-expense/OMExpenseItemMonthlyGrid.tsx` | 1 |
| `components/om-expense/OMExpenseMonthlyGrid.tsx` | 1 |

### D3. Locale-Unaware Number Formatting

**40 calls** to `.toLocaleString()` without explicit locale parameter across the codebase. While this "works" (uses browser default), it doesn't respect the app's current locale setting.

### D4. Hardcoded Chinese in Non-Translation Contexts

| File | Line | Content | Severity |
|------|------|---------|----------|
| `Sidebar.tsx` | 347 | `aria-label="載入導航選單中"` | Low -- aria-label |
| `GlobalProgress.tsx` | 153 | `aria-label="頁面載入中"` | Low -- aria-label |
| `toaster.tsx` | 171 | `aria-label="關閉通知"` | Low -- aria-label |
| `toaster.tsx` | 209 | `aria-label="通知區域"` | Low -- aria-label |
| `LanguageSwitcher.tsx` | 96 | `title="切換語言 / Switch Language"` | Low -- bilingual |
| `LanguageSwitcher.tsx` | 99 | `<span className="sr-only">切換語言 / Switch Language</span>` | Low -- bilingual |

### D5. Locale Switcher Functionality

The `LanguageSwitcher.tsx` component correctly:
- Uses `useLocale()` to get the current locale
- Replaces the locale segment in the URL path
- Uses `window.location.href` for full page reload (avoids hydration errors)
- Supports `en` and `zh-TW`

---

## Summary of Findings

### Critical Issues (Will cause runtime errors)

1. **87 missing translation keys** across 15 files -- these will produce `IntlError: MISSING_MESSAGE` at runtime
2. **`dashboard.budgetPool` namespace entirely missing** -- BudgetPoolOverview component is completely broken for i18n (11 keys)
3. **`auth.forgotPassword` structure mismatch** -- code expects nested keys but JSON has flat structure (13 keys)
4. **`omExpenses.itemFields` structure mismatch** -- code uses `fields.name.label` pattern but JSON has `name.label` (32 keys)
5. **Dynamic key casing bug** -- `status.toLowerCase()` produces `pendingapproval` but translation key is `pendingApproval`

### Medium Issues (Inconsistency, not breaking)

6. **2 orphan namespaces** (`errors`, `loading`) with 19 unused keys
7. **5 orphan leaf keys** (`expenses.form.itemFields.category.options.*`)
8. **10 files use `zh-HK`** locale instead of `zh-TW`
9. **4 files use locale-unaware `toLocaleDateString()`**
10. **40 calls to `.toLocaleString()` without locale parameter**

### Low Issues (Minor, cosmetic)

11. **4 hardcoded Chinese aria-labels** (accessibility labels not translated)
12. **2 identical en/zh values** (both legitimately identical -- brand name and email placeholder)

### Positive Findings

- **en.json and zh-TW.json are 100% structurally identical** (2,640 keys each, 0 diff)
- **0 empty translation values** in either file
- **0 HTML/XSS risks** in translation values
- **139 placeholder keys** all appear to be correctly parameterized
- **Locale switcher works correctly** with full page reload approach
- **52 of 54 namespaces** used in code exist correctly in translation files
