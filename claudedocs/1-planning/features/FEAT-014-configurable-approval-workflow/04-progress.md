# FEAT-014: 可配置序列審批流程 — 進度與實施記錄

> **建立日期**: 2026-06-02
> **狀態**: ✅ Phase 1 完成（實作 + 正規 migration + E2E 全流程驗證）
> **對應**: `./01-requirements.md`、`./02-technical-design.md`、`./03-implementation-plan.md`

---

## 1. 完成狀態總覽

| Phase | 內容 | 狀態 |
|---|---|---|
| 1.1 | 資料模型（3 model + BudgetProposal/Role/User 關聯 + 正規 migration） | ✅ |
| 1.2 | 預設流程種子 | ⏭️ 跳過（規劃標為選用；改由 Admin 配置頁建流程，E2E 經 UI 建立覆蓋更廣；未建流程時 Q-D fallback 保證既有行為） |
| 1.3 | 後端 `approvalWorkflow` router（9 procedures，全 adminProcedure） | ✅ |
| 1.4 | `budgetProposal` 審批重構（submit + approveStep/rejectStep/requestMoreInfoStep + getPendingForMe/getAllPending；保留舊 approve fallback） | ✅ |
| 1.5 | 前端流程配置頁（拖曳排序 + 角色下拉 + Sidebar 入口 + 專屬權限） | ✅ |
| 1.6 | 前端審批 UI（依當前步角色顯示）+ 進度時間線 + 待我審批視圖 | ✅ |
| 1.7 | i18n 雙語（+52 keys/locale，validate 通過） | ✅ |
| 1.8 | 驗證（typecheck/lint/validate:i18n）+ Playwright E2E 全流程 | ✅ |

---

## 2. 實際變更檔案

### packages/db
- `prisma/schema.prisma` — 新增 `ApprovalWorkflow` / `ApprovalStep` / `ProposalApprovalProgress` 三 model；`BudgetProposal` 加 `workflowId` + `currentStepSequence` + 關聯 + 索引；`Role` 加 `approvalSteps`；`User` 加 `approvalDecisions`。
- `prisma/migrations/20260602034000_feat014_approval_workflow/migration.sql`（新增）— **正規 `prisma migrate dev` 產生**（migration 歷史於 FEAT-015 後已乾淨，無需 FEAT-015 的 diff+resolve workaround）。
- `prisma/seed.ts` — 新增 `menu:approval-workflows` 權限（sortOrder 435）；Supervisor 預設權限排除此項（R4 Admin only）。

### packages/api
- `src/routers/approvalWorkflow.ts`（新增）— `list`/`getById`/`create`/`update`/`toggleActive`/`addStep`/`updateStep`/`removeStep`/`reorderSteps`，全 adminProcedure + Zod；步驟序號唯一約束以兩段式更新處理；移除步驟後壓實序號。
- `src/routers/budgetProposal.ts` — `submit` 重構（解析流程 + 建 progress 快照 / 重提回原步 Q-A / 無流程 Q-D fallback）；新增 4 step/view procedures；共用 `proposalApprovalInclude` + 3 helpers（`resolveWorkflow` / `notifyStepApprovers` / `loadCurrentStep`）；`getById` 加 workflow+progress include。
- `src/root.ts` — 註冊 `approvalWorkflow`。

### apps/web
- `src/components/approval-workflow/`（新增）：`types.ts`、`ApprovalStepList.tsx`（@dnd-kit 拖曳）。
- `src/app/[locale]/settings/approval-workflows/page.tsx`（新增）— Admin 配置頁（流程 CRUD + 步驟 dialog + 拖曳）。
- `src/app/[locale]/proposals/pending/page.tsx`（新增）— 待我審批視圖（R13 欄位）。
- `src/components/proposal/ProposalActions.tsx` — 依當前步角色顯示步驟核准/駁回/補件（LoadingButton），未綁流程走舊 approve。
- `src/app/[locale]/proposals/[id]/page.tsx` — 傳 workflow 資料給 ProposalActions + 審批進度時間線。
- `src/app/[locale]/proposals/page.tsx` — 列表頁加「待我審批」入口。
- `src/components/layout/Sidebar.tsx` — 系統管理區加「審批流程」入口（`Workflow` icon）。
- `src/hooks/usePermissions.ts` — `MENU_PERMISSIONS.APPROVAL_WORKFLOWS` + route map。
- `src/messages/{en,zh-TW}.json` — `approvalWorkflows` namespace + `proposals.approval/pending/fields` 補充（+52 keys/locale）。

---

## 3. 與原規劃的差異 / 決策

1. **migration 用正規 `migrate dev`**（非 FEAT-015 的 diff+resolve）：FEAT-141 baseline + FEAT-015 migration 後歷史已乾淨（`migrate status` up to date、無 drift），故直接 `migrate dev` 安全乾淨。
2. **跳過種子（1.2）**：規劃標為選用。配置頁可建流程，E2E 經 UI 建立反而覆蓋 config CRUD；未建流程時 Q-D fallback 保證提案仍可走舊單階段。
3. **Phase 1.3 不寫 History**：`History.budgetProposalId` 為**必填**（結構綁定 BudgetProposal），流程配置變更無對應 BP，無法寫 History；擴寬 History 屬非外科手術改動（Karpathy §3）。配置變更靠 `updatedAt` + Q-B 快照保護即可。**Phase 1.4 審批執行 History 完整**（綁定 BP，R10 滿足）。
4. **通知重用既有類型**：步驟通知用已註冊的 `PROPOSAL_SUBMITTED`，終局用 `PROPOSAL_APPROVED/REJECTED/MORE_INFO`，**不新增類型**（避開「未註冊類型」覆轍 + 極簡）。
5. **配置頁新增專屬權限 `menu:approval-workflows`（Admin only）**：比照 currencies 既有模式（Sidebar 入口 + 種子 + route map），R4「僅 Admin 可見可用」。需 `db:seed` 後生效（已執行並驗證）。

---

## 4. 🐛 E2E 過程發現並修復的 Bug

**`session.user.roleId` 在 runtime 為 undefined**（auth augmentation 宣告了該欄位使 typecheck 通過，但 session callback 僅填充 `session.user.role = {id, name}`，未填頂層 `roleId`）。
- **症狀**：「待我審批」對 Supervisor 顯示空清單（`approverRoleId: undefined` 比對無結果）；步驟角色比對失效。
- **修復**：後端 `getPendingForMe` / 3 個 step procedures 改用 `ctx.session.user.role.id`；前端 `ProposalActions` 改用 `session?.user?.role?.id`（皆為已驗證填充的欄位）。
- **驗證**：修復後 Supervisor 待審清單正確顯示，全流程 E2E 通過。

---

## 5. E2E 驗證摘要（Playwright，2026-06-02）

| 流程 | 結果 |
|---|---|
| Admin 建流程「BP 標準審批流程」+ 2 步驟（Step1 Supervisor / Step2 Admin，角色下拉） | ✅ |
| 步驟清單渲染（序號 + 角色 badge + 名稱 + 步驟間箭頭） | ✅ |
| Sidebar「審批流程」入口（Admin 可見） | ✅ |
| PM/Admin 提交 Draft 提案 → 綁定流程 + 建 progress + 進 Step 1 | ✅ |
| 角色閘門：Admin（非當前步）見「目前步驟非由您的角色審批」 | ✅ |
| 「待我審批」對 Supervisor 顯示該提案（R13 全欄位：類型/金額/專案/供應商/當前步/文件連結） | ✅（修 bug 後） |
| Supervisor 核准 Step 1 → 推進 Step 2 + 通知 Admin + 時間線/History 更新 | ✅ |
| Admin 核准 Step 2（最末步）→ 整案 Approved | ✅ |
| `Project.approvedBudget` 更新為 2,500,000、status InProgress（R9） | ✅ |
| 時間線各步狀態（已核准 + 審批人 + 時間 + 意見）、History 三筆完整 | ✅ |

> **未經 UI 點擊驗證**（wiring 與已通過路徑同模式，typecheck/lint 通過）：
> - `rejectStep` / `requestMoreInfoStep`（與 `approveStep` 同 `loadCurrentStep` + transaction 結構）
> - 步驟拖曳排序 `reorderSteps`（與 FEAT-015 ProjectExpenseItemList dnd 同模式）
> - Q-D fallback（未綁流程提案走舊 `approve`）— 程式分支簡單、typecheck 驗證；既有 `approve` procedure 未改動

---

## 6. 驗證結果

- `prisma migrate dev` → migration 建立並套用，`db:generate` 成功；`migrate status` up to date。
- `pnpm typecheck`：**FEAT-014 新增/修改檔零錯誤**（既有 `project.ts` baseline 錯誤非本 FEAT，未觸碰）。
- `pnpm lint`：**新增檔（ApprovalStepList/types/pending page）零問題**；`session.user.role/roleId` 的 unsafe-any 為全 codebase 既有通用模式（currencies/Sidebar/middleware 等同樣），屬既有紅 baseline。修正了自己引入的 non-null assertion / unused var / `[...Array]` spread。
- `pnpm validate:i18n`：通過（2846 keys，雙語一致、無重複）。
- `db:seed`：已執行，`menu:approval-workflows` 權限存在且僅 Admin 持有（驗證通過）。

---

## 7. 後續（Phase 2，不在本次）

- 規則引擎（R14–R15）：依 `proposalType`（CHANGE-043）/ 金額門檻套不同流程；schema 已預留 `proposalTypeFilter`/`minAmount`/`maxAmount`/`matchPriority`。
- 多角色（FEAT-016）：使用者一人多角後，「待我審批」查詢自然涵蓋多角色。
- 並行審批（湊齊 N 人）— 目前明確排除，僅做序列。
