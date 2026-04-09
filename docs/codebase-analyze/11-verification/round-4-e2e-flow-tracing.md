# Round 4: End-to-End Flow Tracing Verification

This document traces 5 complete business flows from UI through API to database, verifying that the documented data-flow diagrams and business-process diagrams accurately represent the actual code paths.

**Verification Date**: 2026-04-09
**Methodology**: Read actual source code at each layer; compare against `09-diagrams/data-flow.md` and `09-diagrams/business-process.md`

---

## Flow 1: Budget Proposal Submission & Approval (~25 points)

### Step 1: Page renders the form
- **File**: `apps/web/src/app/[locale]/proposals/new/page.tsx`
- **Action**: Page uses `next/dynamic` to lazy-load `BudgetProposalForm` from `@/components/proposal/BudgetProposalForm`
- **Wrap**: Content wrapped in `<DashboardLayout>`, breadcrumb navigation included
- **[MATCH]** Diagram shows "PM creates proposal" starting from the form page

### Step 2: Form component and tRPC mutation on submit
- **File**: `apps/web/src/components/proposal/BudgetProposalForm.tsx`
- **Props**: `mode: 'create' | 'edit'`, optional `initialData`
- **State**: Local `formData` state (`title`, `amount`, `projectId`), manual `errors` state
- **Mutation**: `api.budgetProposal.create.useMutation()` on mode='create'
- **Client validation**: `validate()` checks: title non-empty, amount > 0, projectId non-empty
- **On success**: Redirects to `/proposals/${proposal.id}` (detail page)
- **[MATCH]** Consistent with documented create flow; proposal starts as Draft

### Step 3: Router procedure - create
- **File**: `packages/api/src/routers/budgetProposal.ts` (line 223)
- **Procedure**: `protectedProcedure` (any logged-in user)
- **Zod validation**: `budgetProposalCreateInputSchema` - title min(1), amount positive, projectId min(1)
- **Business logic**:
  1. Verify project exists via `prisma.project.findUnique`
  2. Create proposal with `status: 'Draft'`
  3. Return proposal with project includes
- **No notification on create** (correct - notifications only on submit)
- **[MATCH]** Diagram shows `create()` producing Draft state with no side effects

### Step 4: Validation at each layer
- **Client-side**: Manual validation in `BudgetProposalForm.validate()` - title, amount, projectId
- **Zod schema**: Server-side enforces `title.min(1)`, `amount.positive()`, `projectId.min(1)`
- **Business logic**: Project existence check via Prisma query
- **[MATCH]** Three-layer validation documented correctly

### Step 5: Submit flow (Draft -> PendingApproval)
- **File**: `apps/web/src/components/proposal/ProposalActions.tsx`
- **UI trigger**: Button shown when `status === 'Draft' || status === 'MoreInfoRequired'`
- **Mutation**: `api.budgetProposal.submit.useMutation()` with `{ id, userId }`
- **Router** (line 315): `protectedProcedure`
  1. Check proposal exists
  2. Validate status is Draft or MoreInfoRequired (throws BAD_REQUEST otherwise)
  3. **$transaction**:
     - Update status to `PendingApproval`
     - Create History record with action `SUBMITTED`
     - Look up submitter name
     - Create Notification for `proposal.project.supervisorId` with type `PROPOSAL_SUBMITTED`
- **[MATCH]** Diagram accurately shows: History "SUBMITTED" + Notification to Supervisor

### Step 6: Approval flow
- **UI**: `ProposalActions` shows approve/reject/requestInfo buttons when `status === 'PendingApproval'`
- **Mutation**: `api.budgetProposal.approve.useMutation()` with `{ id, userId, action, comment, approvedAmount }`
- **Router** (line 399): `protectedProcedure` (NOTE: not `supervisorProcedure`)
  1. Check proposal exists + status is PendingApproval
  2. **$transaction**:
     - Update proposal status to Approved/Rejected/MoreInfoRequired
     - If Approved: set `approvedAmount`, `approvedBy`, `approvedAt`
     - If Rejected: set `rejectionReason`
     - Create History record (APPROVED/REJECTED/MORE_INFO_REQUIRED)
     - If comment provided: also create Comment record
     - If Approved: update `project.approvedBudget` and `project.status = 'InProgress'`
     - Create Notification for `project.managerId` with appropriate type
- **[MISMATCH]** The `approve` procedure uses `protectedProcedure`, not `supervisorProcedure`. Any logged-in user can approve. The CLAUDE.md and diagram imply supervisor-only approval but the code does NOT enforce this at the middleware level. However, the frontend only shows approval buttons contextually, so the security gap is real but UI-mitigated.

### Step 7: Notification reaches supervisor
- **On submit**: Notification created for `proposal.project.supervisorId` with link `/proposals/${id}`
- **Notification type**: `PROPOSAL_SUBMITTED`
- **On approve**: Notification created for `proposal.project.managerId` with type `PROPOSAL_APPROVED/REJECTED/MORE_INFO`
- **[MATCH]** Notification flow matches diagram - supervisor gets notified on submit, PM gets notified on approval action

### Step 8: Revert to Draft (CHANGE-018)
- **UI**: `ProposalActions` shows revert button when `canRevert = (Admin || Supervisor) && status !== 'Draft'`
- **Mutation**: `api.budgetProposal.revertToDraft.useMutation()` with `{ id, reason }`
- **Router** (line 814): Explicitly checks `userRole !== 'Admin' && userRole !== 'Supervisor'` (manual RBAC)
- **$transaction**:
  1. Update status to Draft, clear approval fields
  2. Create History `REVERTED_TO_DRAFT`
  3. If original was Approved: decrement `project.approvedBudget`
  4. If no other approved proposals: revert `project.status` to Draft
- **[MATCH]** Diagram shows `revertToDraft()` with correct side effects

### Flow 1 Score: 23/25
- 1 MISMATCH: `approve` uses `protectedProcedure` instead of `supervisorProcedure`
- 1 minor: No email notification integration visible (only in-app notification)

---

## Flow 2: Expense Creation -> Approval -> Budget Deduction (~25 points)

### Step 1: Page -> Component -> API
- **Page**: `apps/web/src/app/[locale]/expenses/new/page.tsx` renders `<ExpenseForm />`
- **Component**: `apps/web/src/components/expense/ExpenseForm.tsx`
- **Mutation**: `api.expense.create.useMutation()` at line 232
- **[MATCH]** Standard CRUD page pattern

### Step 2: Create procedure
- **File**: `packages/api/src/routers/expense.ts` (line 297)
- **Procedure**: `protectedProcedure`
- **Input**: `createExpenseSchema` - requires name, purchaseOrderId, projectId, invoiceNumber, invoiceDate, items[]
- **Business logic**:
  1. Verify project exists
  2. Verify purchaseOrder exists
  3. Verify projectId matches PO's projectId
  4. Verify at least 1 item
  5. Calculate `totalAmount = SUM(items.amount)`
  6. Validate budgetCategoryId (FIX-006)
  7. **$transaction**: Create expense header (status: Draft) + create ExpenseItems
- **No budget impact on create** - correct, budget only affected on approve
- **[MATCH]** Diagram shows `create()` producing Draft with header + items, no budget impact

### Step 3: Submit procedure (Draft -> Submitted)
- **UI**: `ExpenseActions.tsx` shows submit button when `status === 'Draft'`
- **Client check**: `itemsCount === 0` shows error toast
- **Router** (line 977): `protectedProcedure`
  1. Load expense with items and PO/project
  2. Validate status is Draft
  3. Validate at least 1 ExpenseItem
  4. **$transaction**:
     - Update status to `Submitted`
     - Create Notification for `project.supervisorId` with type `EXPENSE_SUBMITTED`
- **[MATCH]** Diagram shows: submit validates items, notifies Supervisor

### Step 4: Approve procedure (Submitted -> Approved)
- **UI**: `ExpenseActions.tsx` shows approve button when `status === 'Submitted'`
- **Router** (line 1073): **`supervisorProcedure`** (correctly enforced!)
  1. Load expense with PO, project, budgetPool, budgetCategory
  2. Validate status is Submitted
  3. **Budget sufficiency check**: `usedAmount + totalAmount > totalAmount` -> throw PRECONDITION_FAILED
  4. **$transaction**:
     - Update expense status to `Approved`
     - **BudgetPool.usedAmount += expense.totalAmount**
     - **BudgetCategory.usedAmount += expense.totalAmount** (if budgetCategoryId exists, uses `increment`)
     - Create Notification for `project.managerId` with type `EXPENSE_APPROVED`
- **[MATCH]** Diagram accurately shows: BudgetPool.usedAmount += totalAmount, BudgetCategory.usedAmount += totalAmount, notify PM

### Step 5: Exact budget deduction order verification
1. First: expense status updated to Approved
2. Second: `budgetPool.update({ usedAmount: usedAmount })` (calculated as `budgetPool.usedAmount + expense.totalAmount`)
3. Third: `budgetCategory.update({ usedAmount: { increment: expense.totalAmount } })` (only if budgetCategoryId exists)
4. Fourth: notification created
- **All within $transaction** - atomic operation
- **[MATCH]** Order and atomicity match documentation

### Step 6: BudgetPool AND BudgetCategory both update
- **BudgetPool**: Direct set to pre-calculated `usedAmount` (line 1145-1150)
- **BudgetCategory**: Uses Prisma `increment` operator (line 1153-1162)
- **Conditional**: BudgetCategory update only happens `if (expense.budgetCategoryId)` - not all expenses have a category
- **[MATCH]** Both fields update correctly within the transaction

### Step 7: Reject procedure (Submitted -> Draft)
- **Router** (line 1192): `supervisorProcedure`
- **Status**: Submitted -> **Draft** (not a "Rejected" status - goes back to editable Draft)
- **[MATCH]** Diagram shows `reject()` returns to Draft state

### Step 8: revertToSubmitted (Approved -> Submitted)
- **Router** (line 890): **`supervisorProcedure`** (correctly enforced)
- **Validates**: Only Approved can revert to Submitted
- **$transaction**:
  1. **BudgetPool.usedAmount -= expense.totalAmount** (with Math.max(0, ...) safety)
  2. **BudgetCategory.usedAmount -= expense.totalAmount** (with Math.max(0, ...) safety)
  3. Update status to Submitted, clear approvedDate
- **[MATCH]** Diagram shows revert reverses budget deductions

### Step 9: revertToDraft (any non-Draft -> Draft)
- **Router** (line 743): `protectedProcedure`
- **Budget reversal**: Only if `status === 'Approved' || status === 'Paid'` (already deducted states)
- **$transaction**: Reverses both BudgetPool and BudgetCategory usedAmount
- **[MATCH]** Correctly identifies which states need budget reversal

### Step 10: markAsPaid (Approved -> Paid)
- **Router** (line 1277): `protectedProcedure`
- Records `paidDate`, no budget impact (already deducted on approve)
- **[MATCH]** Diagram shows Approved -> Paid with paidDate recording

### Flow 2 Score: 25/25
- All steps verified with exact match to documentation
- Budget deduction logic precisely matches diagrams
- Permission enforcement correct (supervisorProcedure for approve/reject/revertToSubmitted)

---

## Flow 3: OM Expense Import from Excel (~20 points)

### Step 1: Three-step wizard
- **File**: `apps/web/src/app/[locale]/data-import/page.tsx`
- **State**: `currentStep: 'upload' | 'preview' | 'result'`
- **Steps**: Upload -> Preview (validation display) -> Result (import stats)
- **[MATCH]** Diagram shows three-step flow: Upload -> Preview -> Import Result

### Step 2: File upload and xlsx parsing
- **Library**: `import * as XLSX from 'xlsx'` (client-side parsing)
- **Column mapping**: `EXCEL_COLUMN_MAP` defined at lines 163-174
  - Col A(0): Financial Year
  - Col B(1): Header Name
  - Col C(2): Header Description
  - Col D(3): Item Name / Col E(4): Item Description
  - Col F(5): Category
  - Col G(6): Budget Amount (USD)
  - Col J(9): Charge to OpCos
  - Col K(10): Last FY Actual Expense
  - Col M(12): End Date
- **Data structure**: Parsed into `ImportItem[]` with headerName, category, itemName, budgetAmount, opCoName, etc.
- **[MATCH]** Diagram shows "前端解析 (xlsx 庫)" with client-side parsing

### Step 3: Client-side validation
- **Checks**:
  - Required fields (headerName, itemName, category, budgetAmount, opCoName)
  - Budget amount must be numeric and >= 0
  - Duplicate detection: Same headerName + itemName + itemDescription + category + opCoName + budgetAmount
  - FY parsing supports multiple formats (FY26, 2026, 26)
- **Parse result**: Statistics (totalRows, validItems, skippedRows, errorRows, duplicateRows) + error/duplicate details
- **[MATCH]** Diagram shows validation step with error/duplicate reporting

### Step 4: Import via tRPC
- **Mutation**: `api.omExpense.importData.useMutation()` at line 204
- **Input**: `{ financialYear, items: ImportItem[], importMode: 'skip'|'update'|'replace' }`
- **[MATCH]** Diagram shows "批量匯入 呼叫 API"

### Step 5: Server-side importData procedure
- **File**: `packages/api/src/routers/omExpense.ts` (line 384)
- **Procedure**: `protectedProcedure`
- **Single $transaction** with extended timeout:
  1. Step 0 (replace mode): Delete all existing OMExpense for that FY
  2. Step 1: Collect unique OpCo names
  3. Step 2: Query existing OpCos, **auto-create missing OpCos**
  4. Step 2.5: Query existing ExpenseCategories, **auto-create missing categories**
  5. Step 3: Collect unique header keys (name + category + FY)
  6. Step 4: Query existing headers (OMExpense)
  7. Step 5: **Auto-create missing OMExpense headers**
  8. Step 6: For each item:
     - Uniqueness check (6-field composite key)
     - Duplicate handling per importMode (skip/update)
     - **Create OMExpenseItem** with budgetAmount, opCoId, etc.
     - **Create 12 OMExpenseMonthly** records (month 1-12, actualAmount: 0)
  9. Step 7: Update all affected headers' totalBudgetAmount = SUM(items.budgetAmount)
  10. Step 8: Return statistics
- **[MATCH]** Diagram sequence shows: $transaction -> OMExpense.create -> OMExpenseItem.create -> OMExpenseMonthly.create x12 -> update totals

### Step 6: Transaction atomicity
- Entire import is wrapped in single `$transaction` with extended timeout
- All-or-nothing: if any step fails, all changes roll back
- **[MATCH]** Documented as atomic operation

### Step 7: Duplicate detection
- Server-side: 6-field composite key check via `findFirst` query:
  - `omExpenseId` (header), `name` (item), `description`, `opCoId`, `budgetAmount`
- Three modes: `skip` (default - log and skip), `update` (update existing), `replace` (delete all first)
- **[UNDOCUMENTED]** The diagram shows basic duplicate detection but does not detail the three import modes (skip/update/replace from CHANGE-027). The data-flow diagram at section 6 only mentions basic flow without import modes.

### Flow 3 Score: 18/20
- 1 UNDOCUMENTED: Three import modes (skip/update/replace) not reflected in data-flow diagram
- 1 minor: Permission check uses `protectedProcedure` but documentation says "Admin/Supervisor" only (no middleware enforcement)

---

## Flow 4: ChargeOut Lifecycle (Draft -> Confirmed -> Paid) (~15 points)

### Step 1: Page -> Form -> API
- **Page**: `apps/web/src/app/[locale]/charge-outs/new/page.tsx`
- **Component**: `apps/web/src/components/charge-out/ChargeOutForm.tsx`
- **Mutation**: `api.chargeOut.create.useMutation()` at line 193
- **[MATCH]** Standard CRUD pattern

### Step 2: Required data and items
- **Input schema**: `createChargeOutSchema` requires:
  - `name` (min 1, max 200)
  - `projectId` (min 1)
  - `opCoId` (min 1)
  - `items[]` (min 1 item) - each item has `expenseId?`, `expenseItemId?`, `amount`, `description?`, `sortOrder`
- **Create procedure** (line 127): `protectedProcedure`
  1. Verify Project exists
  2. Verify OpCo exists
  3. Verify all referenced Expenses exist and have `requiresChargeOut = true`
  4. Calculate `totalAmount = SUM(items.amount)`
  5. **$transaction**: Create ChargeOut (status: Draft) + create ChargeOutItems
- **[MATCH]** Diagram shows: "選擇 Project + OpCo, 添加 ChargeOutItem[], totalAmount = SUM"

### Step 3: Submit flow (Draft -> Submitted)
- **Router** (line 447): `protectedProcedure`
  1. Check exists + status is Draft
  2. Validate at least 1 item
  3. Update status to `Submitted`
  4. **NOTE**: `// TODO: 發送通知給主管` - notification NOT implemented
- **[MISMATCH]** Diagram does not mention notification, which aligns with the TODO, but the lack of notification is a functional gap compared to the Expense and Proposal flows

### Step 4: Confirm flow (Submitted -> Confirmed)
- **Router** (line 514): **`supervisorProcedure`** (correctly enforced)
  1. Check exists + status is Submitted
  2. Update status to `Confirmed`, record `confirmedBy` (user.id) and `confirmedAt`
  3. **NOTE**: `// TODO: 發送通知給創建者` - notification NOT implemented
- **[MATCH]** Diagram shows: "記錄 confirmedBy + confirmedAt"

### Step 5: Reject flow (Submitted -> Rejected)
- **Router** (line 572): `supervisorProcedure`
  1. Check exists + status is Submitted
  2. Update status to `Rejected`
  3. Appends reject reason to description field (not a separate field)
- **[MATCH]** Diagram shows Submitted -> Rejected transition

### Step 6: Paid flow (Confirmed -> Paid)
- **Router** (line 635): `protectedProcedure`
  1. Check exists + status is Confirmed
  2. Update status to `Paid`, record `paymentDate`
- **[MATCH]** Diagram shows: "記錄 paymentDate"

### Step 7: Delete
- **Allowed states**: Draft or Rejected (verified in code, matches diagram)
- **[MATCH]** Diagram shows delete from Draft and Rejected

### Step 8: Permissions summary
| Operation | Procedure | Match? |
|-----------|-----------|--------|
| create | protectedProcedure | [MATCH] |
| update | protectedProcedure (Draft only) | [MATCH] |
| submit | protectedProcedure | [MATCH] |
| confirm | supervisorProcedure | [MATCH] |
| reject | supervisorProcedure | [MATCH] |
| markAsPaid | protectedProcedure | [MATCH] |
| delete | protectedProcedure | [MATCH] |

### Step 9: No OpCo record creation/update on chargeout
- ChargeOut references existing OpCo and Project
- No `ProjectChargeOutOpCo` records created in the chargeOut router itself
- **[MATCH]** Diagram correctly shows ChargeOut as a reference to existing entities

### Flow 4 Score: 13/15
- 1 MISMATCH: Notifications are TODO (not implemented) for submit and confirm - a functional gap vs other modules
- All state transitions and permissions correctly documented

---

## Flow 5: User Authentication (Azure AD SSO) (~15 points)

### Step 1: User clicks "Sign in with Azure AD"
- **File**: `apps/web/src/app/[locale]/login/page.tsx`
- **Handler**: `handleAzureLogin()` at line 167 calls `signIn('azure-ad', { callbackUrl })`
- **callbackUrl**: From URL searchParams or defaults to `/${locale}/dashboard`
- **[MATCH]** Diagram shows "點擊 SSO 登入按鈕" -> signIn('azure-ad')

### Step 2: NextAuth signIn('azure-ad')
- **Provider config**: `packages/auth/src/index.ts` line 188-217
- **AzureADProvider** (not Azure AD B2C - actual code uses `azure-ad` provider):
  - `clientId`: from `AZURE_AD_CLIENT_ID`
  - `clientSecret`: from `AZURE_AD_CLIENT_SECRET`
  - `issuer`: `https://login.microsoftonline.com/${AZURE_AD_TENANT_ID}/v2.0`
  - `scope`: `openid profile email User.Read`
  - **Profile mapping**: Returns `{ id: sub/oid, email, name, roleId: 1, role: { id: 1, name: 'ProjectManager' } }`
- **[MISMATCH]** CLAUDE.md references "Azure AD B2C" throughout, but actual code uses standard **Azure AD (Microsoft Entra ID)** provider, not Azure AD B2C. The provider ID is `'azure-ad'`, env vars are `AZURE_AD_CLIENT_ID` (not `AZURE_AD_B2C_CLIENT_ID`), and the issuer URL is standard Azure AD v2.0, not B2C.

### Step 3: JWT callback - user upsert
- **File**: `packages/auth/src/index.ts` line 280-336
- **JWT callback** executes on every token creation/refresh:
  1. If `user` exists (first sign-in): Set token fields from user object
  2. If `account.provider === 'azure-ad'` and `user` exists:
     - **`prisma.user.upsert`**:
       - `where: { email: user.email }`
       - `update`: Sync name, image, emailVerified
       - `create`: New user with `roleId: 1`, `password: null`
     - Include `role` relation
     - Set token from DB user (including actual roleId and role)
- **[MATCH]** Diagram shows: "JWT Callback: 查詢/建立 User 記錄, 同步 Azure AD 資料"

### Step 4: JWT token fields
- **Stored in JWT**:
  - `id`: Database user ID (from upsert result)
  - `email`: User email
  - `name`: User name
  - `roleId`: From DB user record
  - `role`: `{ id, name }` from DB user.role relation
- **Default role**: If role undefined, falls back to `{ id: 1, name: 'ProjectManager' }`
- **[MATCH]** Diagram shows JWT contains: user.id, email, name, roleId, role.name, maxAge 24h

### Step 5: Session callback
- **File**: `packages/auth/src/index.ts` line 340-357
- **Session callback**: Maps JWT token fields to `session.user`:
  - `session.user.id = token.id`
  - `session.user.email = token.email`
  - `session.user.name = token.name`
  - `session.user.roleId = token.roleId`
  - `session.user.role = token.role`
- **tRPC context**: `apps/web/src/app/api/trpc/[trpc]/route.ts` line 88-96:
  - Calls `auth()` to get session
  - Passes to `createInnerTRPCContext({ session })`
  - Context provides `ctx.session.user` to all procedures
- **[MATCH]** Documented flow: JWT -> Session -> tRPC Context

### Step 6: Protected route middleware check
- **File**: `apps/web/src/middleware.ts`
- **Mechanism**: 
  1. `NextAuth(authConfig)` creates `auth` function
  2. Middleware strips locale prefix from pathname
  3. Checks against `protectedRoutes` array (17 routes)
  4. If protected + not logged in: Redirect to `/zh-TW/login?callbackUrl=...`
  5. Otherwise: Pass to `handleI18nRouting`
- **Protected routes list**: dashboard, projects, budget-pools, budget-proposals, vendors, purchase-orders, expenses, users, om-expenses, om-summary, charge-outs, quotes, notifications, settings, data-import, operating-companies, om-expense-categories
- **[MATCH]** Diagram shows: "middleware.ts 檢查 Session Cookie" -> redirect or allow
- **Note**: `proposals` route is listed as `budget-proposals` in middleware but actual route is `/proposals/` - potential issue but existing since the route prefix matching uses `startsWith` so `/proposals` would NOT be caught by `/budget-proposals`. 

### Step 7: Credential login flow
- **Provider**: `CredentialsProvider` at line 221-276
- **Flow**:
  1. Receive email + password
  2. `prisma.user.findUnique({ where: { email }, include: { role: true } })`
  3. If no user: throw error
  4. If no password field: throw error (SSO-only user)
  5. `bcrypt.compare(password, dbUser.password)`
  6. If invalid: throw error
  7. Return user object with role
- **[MATCH]** Diagram accurately shows: query user -> check password field -> bcrypt compare -> match/fail branches

### Step 8: Missing route protection
- **[MISMATCH]** The middleware `protectedRoutes` includes `/budget-proposals` but the actual route is `/proposals`. The `/proposals` path is NOT in the protected routes list! This means unauthenticated users could potentially access `/en/proposals` without being redirected to login. However, tRPC calls would fail with UNAUTHORIZED, so no data would be exposed.

### Flow 5 Score: 12/15
- 1 MISMATCH: Code uses Azure AD (not Azure AD B2C as documented everywhere)
- 1 MISMATCH: `/proposals` route missing from middleware protectedRoutes (listed as `/budget-proposals`)
- All other authentication mechanics verified and matching

---

## Summary

### Overall Scores

| Flow | Score | Max | Key Findings |
|------|-------|-----|-------------|
| 1. Budget Proposal | 23 | 25 | `approve` uses `protectedProcedure` not `supervisorProcedure` |
| 2. Expense Lifecycle | 25 | 25 | Perfect match - budget deduction logic precisely documented |
| 3. OM Expense Import | 18 | 20 | Import modes (skip/update/replace) undocumented in diagrams |
| 4. ChargeOut Lifecycle | 13 | 15 | Notifications are TODO (not implemented) |
| 5. Authentication | 12 | 15 | Azure AD vs Azure AD B2C naming; `/proposals` route unprotected |
| **Total** | **91** | **100** | |

### Critical Issues Found

1. **SECURITY: Proposal approve has no role check** (Flow 1, Step 6)
   - `budgetProposal.approve` uses `protectedProcedure` instead of `supervisorProcedure`
   - Any logged-in user (including ProjectManager) could call the approve API directly
   - UI mitigates this by only showing approval buttons to supervisors, but API is unprotected
   - **Recommendation**: Change to `supervisorProcedure` to match expense.approve

2. **SECURITY: `/proposals` route unprotected in middleware** (Flow 5, Step 8)
   - Middleware protects `/budget-proposals` but actual route is `/proposals`
   - Unauthenticated access to proposal pages is possible (though data won't load due to tRPC auth)
   - **Recommendation**: Add `/proposals` to protectedRoutes in middleware.ts

3. **DOCUMENTATION: Azure AD vs Azure AD B2C** (Flow 5, Step 2)
   - All documentation (CLAUDE.md, diagrams) says "Azure AD B2C"
   - Actual code uses standard Azure AD provider (`azure-ad` not `azure-ad-b2c`)
   - Environment variables are `AZURE_AD_*` not `AZURE_AD_B2C_*`
   - **Recommendation**: Update documentation to reflect actual provider

### Diagram Accuracy Assessment

| Diagram | Section | Accuracy |
|---------|---------|----------|
| data-flow.md | S2: Proposal state machine | 98% - correct transitions and side effects |
| data-flow.md | S3: Expense state machine | 100% - perfect match including budget deduction |
| data-flow.md | S4: ChargeOut state machine | 95% - missing note about notification TODOs |
| data-flow.md | S6: Excel import flow | 90% - missing import modes detail |
| data-flow.md | S7: Budget pool tracking | 100% - increment/decrement logic verified |
| business-process.md | S1: Auth flow | 95% - Azure AD vs B2C naming issue |
| business-process.md | S2: Proposal workflow | 98% - correct flow, missing role enforcement note |

### Items Not Covered by Previous Rounds

- The `approve` procedure permission gap was not caught in R2-B (which verified state machine transitions but not procedure types)
- The middleware route protection gap for `/proposals` was not caught in R3 (which checked auth config but not route list completeness)
- The Azure AD vs B2C documentation discrepancy was not flagged in R3 deep auth review
