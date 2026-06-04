# CHANGE-047: 審批步驟支援指定「具體用戶」為審批者（延伸 FEAT-014）

> **建立日期**: 2026-06-04
> **完成日期**: 2026-06-04（實作 + 靜態驗證 + 瀏覽器冒煙測試全數通過）
> **狀態**: ✅ 完成
> **優先級**: High
> **類型**: 現有功能增強（延伸 FEAT-014 可配置序列審批流程）
> **前置**: FEAT-014 Phase 1（已上線，commit `bbe9f20`）

---

## 1. 變更概述

FEAT-014 Phase 1 上線時，每個審批步驟（`ApprovalStep`）只能指定一個**審批角色**（Role），由「該角色任一使用者」核准即過。當時於 `01-requirements.md` 決策 **Q-C** 明確選擇「一步一角色，不支援指定具體使用者」，並預留：「若未來需要更細的審批單位，再以獨立 FEAT/CHANGE 擴充」。

本變更即實現該擴充：**讓每個審批步驟可指定「某個具體用戶」作為該步的審批者**，而不再只能設定角色。

### 已確認決策（與使用者對齊，2026-06-04）

| 決策 | 選擇 | 說明 |
|---|---|---|
| **D1 審批者模型** | **角色 / 指定用戶 二選一** | 每個步驟可選「某角色（任一該角色的人可審）」**或**「某指定用戶」。**向後相容**現有角色流程。 |
| **D2 每步人數** | **每步一位** | 指定用戶模式下，每步對應單一審批者（不做「多位任一人核准」）。 |

### 核心不變式

> 每個 `ApprovalStep` **恰好設定一個**審批來源：`approverRoleId`（角色）**或** `approverUserId`（用戶），兩者必為「一有一無」（XOR）。在 API 層強制驗證（Prisma 無法簡潔表達 XOR 約束）。

---

## 2. 功能需求

| ID | 需求 |
|---|---|
| R1 | Admin 配置步驟時，可選「審批者類型」：**角色** 或 **指定用戶**（二選一） |
| R2 | 選「指定用戶」時，提供**可搜尋的用戶下拉**（Combobox）選擇單一使用者 |
| R3 | 提案提交（submit）建立進度快照時，連同步驟的 `approverRoleId` **或** `approverUserId` 一併快照（Q-B 快照不變原則） |
| R4 | 審批閘門：步驟為「指定用戶」時，**僅該用戶本人**可核准/駁回/補件；為「角色」時，沿用現有「該角色任一人」邏輯 |
| R5 | 通知：步驟為「指定用戶」時，僅通知該用戶；為「角色」時，沿用通知該角色全體 |
| R6 | 「待我審批」視圖：同時涵蓋「指定給我本人的步驟」與「指定我角色且當前輪到的步驟」 |
| R7 | 提案詳情 / 配置頁 / 待我審批視圖中，步驟審批者顯示為**角色名**或**用戶名**（依其類型） |
| R8 | **向後相容**：現有純角色流程與進行中的提案進度（`approverUserId` 為 null）行為完全不變 |

**明確排除（本 CHANGE 不做）**：
- 每步多位指定用戶 / 並行審批（沿用 FEAT-014 排除項）
- 規則引擎（FEAT-014 Phase 2，與本 CHANGE 正交）
- 一人多角（FEAT-016 範疇）

---

## 3. 技術設計

### 3.1 Schema（`packages/db/prisma/schema.prisma`）

**`ApprovalStep`**：`approverRoleId` 改為可選，新增 `approverUserId`（XOR 由 API 強制）。

```prisma
model ApprovalStep {
  id             String  @id @default(uuid())
  workflowId     String
  sequence       Int
  approverRoleId Int?    // 改：Int → Int?（角色模式時有值）
  approverUserId String? // 新增：指定用戶模式時有值（FK User.id 為 String/uuid）
  name           String?

  workflow     ApprovalWorkflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  role         Role?            @relation(fields: [approverRoleId], references: [id]) // 改為可選
  approverUser User?            @relation("StepDesignatedApprover", fields: [approverUserId], references: [id])
  progress     ProposalApprovalProgress[]

  @@unique([workflowId, sequence])
  @@index([workflowId])
  @@index([approverRoleId])
  @@index([approverUserId]) // 新增
}
```

**`ProposalApprovalProgress`**（快照）：同樣 `approverRoleId` 改可選，新增 `approverUserId` 快照欄位。

```prisma
model ProposalApprovalProgress {
  id               String    @id @default(uuid())
  budgetProposalId String
  stepId           String?
  sequence         Int
  approverRoleId   Int?      // 改：Int → Int?
  approverUserId   String?   // 新增：快照當下指定用戶
  status           String    @default("Pending")
  approvedByUserId String?   // 既有：實際做出決策者（與「指定審批人」是不同語意）
  decidedAt        DateTime?
  comment          String?   @db.Text
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  budgetProposal    BudgetProposal @relation(fields: [budgetProposalId], references: [id], onDelete: Cascade)
  step              ApprovalStep?  @relation(fields: [stepId], references: [id], onDelete: SetNull)
  approver          User?          @relation("ProgressActualDecider", fields: [approvedByUserId], references: [id])   // 既有，補命名
  designatedApprover User?         @relation("ProgressDesignatedApprover", fields: [approverUserId], references: [id]) // 新增

  @@index([budgetProposalId])
  @@index([approverRoleId, status])
  @@index([approverUserId, status]) // 新增：支援「指定給我本人」查詢
  @@index([stepId])
}
```

**`User`**（新增 3 條反向關聯；既有那條補命名以消歧義）：

```prisma
// 既有第 50 行：approvalDecisions ProposalApprovalProgress[]  → 改為具名
approvalDecisions       ProposalApprovalProgress[] @relation("ProgressActualDecider")
// 新增：
approvalDesignations    ProposalApprovalProgress[] @relation("ProgressDesignatedApprover")
approvalStepDesignations ApprovalStep[]            @relation("StepDesignatedApprover")
```

> **Migration**：以 `pnpm db:migrate` 產生正式 migration。三項皆為「欄位改可選 + 新增可選欄位/索引」，屬**非破壞性**；既有資料 `approverUserId` 自動為 null，沿用角色分支。`approverRoleId` 由 NOT NULL 改 NULL 對既有列安全。

### 3.2 API — `packages/api/src/routers/approvalWorkflow.ts`

- `addStepSchema` / `updateStepSchema`：改為 `approverType: z.enum(['role','user'])` + `approverRoleId?` + `approverUserId?`，以 `.refine()` 強制「type=role 須有 roleId 且無 userId；type=user 反之」（XOR）。
- 新增 `assertUserExists()`（比照既有 `assertRoleExists()`）。
- `workflowInclude`：`steps.include` 除 `role` 外加入 `approverUser: { select: { id, name, email } }`。
- `addStep` / `updateStep`：依 `approverType` 寫入對應欄位、清空另一欄位。

### 3.3 API — `packages/api/src/routers/budgetProposal.ts`

- `proposalApprovalInclude`：`workflow.steps` 與 `approvalProgress.step` 的 include 補上 `approverUser`（select 安全欄位）；progress 補 `designatedApprover`。
- `notifyStepApprovers()`：參數由「`approverRoleId`」改為傳入步驟/進度的審批描述（`{ approverUserId, approverRoleId }`）。`approverUserId` 有值 → 只通知該人；否則查 `roleId` 全體（現狀）。
- `loadCurrentStep()`：簽章加入 `actingUserId`（現只傳 roleId）。閘門：
  - `currentProgress.approverUserId != null` → 比對 `actingUserId === approverUserId`，否則 `NOT_YOUR_STEP`
  - 否則 → 沿用 `actingRoleId === approverRoleId`
- `submit`（首次提交快照 `createMany`）：每列加 `approverUserId: s.approverUserId`。
- `submit`（重提 Q-A 分支）與 `approveStep`（推進下一步通知）：呼叫 `notifyStepApprovers` 改傳新描述物件。
- `approveStep` / `rejectStep` / `requestMoreInfoStep`：`loadCurrentStep` 改傳 `ctx.session.user.id` + `ctx.session.user.role.id`。
- `getPendingForMe`：where 與記憶體過濾改為「`approverUserId === userId`」**或**「`approverUserId == null && approverRoleId === roleId`」。

### 3.4 前端

- **`components/approval-workflow/types.ts`**：`ApprovalStepData` 的 `approverRoleId: number → number | null`、`role → ApprovalRole | null`；新增 `approverUserId: string | null` 與 `approverUser: { id; name: string | null; email: string } | null`。
- **`settings/approval-workflows/page.tsx`**：步驟 Dialog 加「審批者類型」切換（角色 / 指定用戶）；用戶模式以 `Combobox`（可搜尋）選擇，資料來自 `api.user.getAll`（既有 procedure）。`stepForm` 擴充為 `{ approverType, roleId, userId, name }`，submit 組對應 payload。
- **`components/approval-workflow/ApprovalStepList.tsx`**：每步顯示角色 Badge 或用戶名。
- **`components/proposal/ProposalActions.tsx`**：`StepProgress` interface 加 `approverUserId`、`designatedApprover`；`isMyStep` 改為「指定用戶比對 `userId` / 否則比對 `userRoleId`」；當前步驟指示與「非您的步驟」改為顯示角色名**或**用戶名。
- **`proposals/pending/page.tsx`**：當前步驟審批者欄顯示角色名或用戶名。
- **i18n（`messages/en.json` + `zh-TW.json`）**：`approvalWorkflows.steps` 增 `approverTypeLabel`、`approverTypeRole`、`approverTypeUser`、`userLabel`、`userPlaceholder`；`proposals.approval.currentStep` 既有以 role 帶入，新增可帶用戶名的變體 key（或將參數泛化為 `approver`）。兩 locale 同步。

---

## 4. 影響範圍

| 層 | 檔案 | 變更 |
|---|---|---|
| DB | `packages/db/prisma/schema.prisma` | ApprovalStep / ProposalApprovalProgress / User 關聯（+ 新 migration） |
| API | `packages/api/src/routers/approvalWorkflow.ts` | step schema、XOR 驗證、assertUserExists、include |
| API | `packages/api/src/routers/budgetProposal.ts` | include、notify、loadCurrentStep、submit 快照、getPendingForMe |
| FE | `approval-workflow/types.ts`、`approval-workflows/page.tsx`、`ApprovalStepList.tsx` | 配置 UI |
| FE | `proposal/ProposalActions.tsx`、`proposals/pending/page.tsx` | 審批 UI / 視圖 |
| i18n | `messages/en.json`、`messages/zh-TW.json` | 新增 keys（兩 locale 同步） |

---

## 5. 驗收標準

- [x] `pnpm db:migrate` + `pnpm db:generate` 無錯（migration `20260604082438_change047_...`，非破壞性）
- [x] `pnpm typecheck` 全綠（api/auth/web 3 包）；變更前端 5 檔 `next lint --file` 無警告/錯誤；`pnpm validate:i18n` 通過（en/zh-TW 2857 key 對齊）
- [x] （運行期）Admin 可建立步驟並選「指定用戶」（可搜尋 Combobox），亦可選「角色」（二選一）；步驟列表顯示用戶名
- [x] （運行期）提案提交後，「指定用戶」步驟：以 admin（非指定者）見「非您的步驟」（無審批按鈕）；以 supervisor（指定者）見批准/駁回/補件按鈕
- [x] （運行期）後端閘門：supervisor（指定者）點批准 → 單步流程整案 Approved、批准金額/時間記錄、進度與歷史顯示用戶名
- [x] （運行期）「待我審批」以 supervisor 列出該提案，目前步驟欄顯示「第 1 步 主管 - 李四」
- [x] 設計上向後相容：既有「BP 標準審批流程」角色步驟（Supervisor/Admin badge）顯示與運作不變

> **驗證備註**：靜態驗證（migration / typecheck / lint / i18n）+ 瀏覽器冒煙測試（admin 建用戶步驟 → 提交 → admin 被擋 / supervisor 可審 → 批准完成 → 待我審批）全數通過。
>
> **冒煙測試發現並修復 1 個運行期 bug**：Combobox `emptyText` 誤用 `tCommon('messages.noResults')`（不存在，IntlError: MISSING_MESSAGE），正確路徑為 `common.noResults` → 已修正為 `tCommon('noResults')`。此類「程式引用了不存在的 i18n key」無法被 `validate:i18n`（只比對雙語結構一致性）捕捉，需運行期驗證——正是本次冒煙測試的價值。
>
> **附帶準確性修正**：配置頁與待我審批頁的說明文字原寫「每步指定一個審批角色」，已更新為「角色或指定用戶」（雙語）。
>
> **測試殘留（dev DB）**：建立的「CHANGE-047 測試流程」已停用（不影響 resolveWorkflow）；提案 `proposal-draft-001` 已回退草稿（但保留審批進度快照，且 Project `proj-erp-upgrade` 的 approvedBudget 於測試中被觸碰）。如需完全還原 seed，可執行 `pnpm db:seed`。

---

## 6. 實施計劃

1. Schema 三模型改動 + `pnpm db:migrate` → 驗證 generate 無錯
2. `approvalWorkflow.ts`（schema/XOR/include/assertUser）→ `pnpm typecheck`
3. `budgetProposal.ts`（include/notify/gate/snapshot/pending）→ `pnpm typecheck`
4. i18n 兩 locale 加 keys → `pnpm validate:i18n`
5. 前端配置頁 + Step 列表 + ProposalActions + pending 視圖
6. 全量 `pnpm typecheck` / lint 變更檔 / 手動或 E2E 驗證二選一閘門
7. 更新 `FEAT-014/04-progress.md`（標註本 CHANGE 延伸）與 `DEVELOPMENT-LOG.md`

---

## 7. 相關文檔

- FEAT-014：`claudedocs/1-planning/features/FEAT-014-configurable-approval-workflow/`（特別是 `01-requirements.md` 決策 Q-C）
- 既有程式：`routers/approvalWorkflow.ts`、`routers/budgetProposal.ts`、`components/proposal/ProposalActions.tsx`
- 規則：`.claude/rules/backend-api.md`（錯誤 `cause.reason` 約定）、`.claude/rules/database.md`、`.claude/rules/i18n.md`
