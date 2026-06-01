# FEAT-014: 可配置序列審批流程 — 實施計劃

> **建立日期**: 2026-06-01
> **狀態**: 📋 計劃中
> **版本**: 1.0
> **對應**: `./01-requirements.md`、`./02-technical-design.md`
> **流程依據**: `docs/10-ai-assistant/03-dev-workflow.md`（5 步流程 + 紅線 + 分支策略）

---

## 1. 實施概覽

### 1.1 範圍（本計劃只涵蓋 Phase 1）

Phase 1 = 資料模型 + 單一可配置序列流程 + 序列審批推進 + Admin 配置 UI +「待我審批」視圖（需求 R1–R13）。
**Phase 2（規則引擎 R14–R15）不在本計劃**，見 §6 後續擴展。

### 1.2 已定稿決策（驅動以下任務，見 01-requirements §4）

| 決策 | 落地方式 |
|---|---|
| Q-A 補件後**回到原步驟續走** | `requestMoreInfoStep` 將當前步 progress 轉 Pending、`currentStepSequence` 不變；重提不重跑前面步驟 |
| Q-B **submit 當下鎖定快照** | `submit` 依當下流程建立各步 `ProposalApprovalProgress`（快照 `sequence`/`approverRoleId`） |
| Q-C **一步一角色** | `ApprovalStep.approverRoleId` 單一角色（`Role.id` 為 Int） |
| Q-D **保留舊 `approve` 為 fallback** | 未綁定 `workflowId` 的提案沿用舊單階段；綁定者走新機制 |

### 1.3 時間估算

| 階段 | 任務 | 預估 |
|------|------|------|
| 1.1 | 資料模型（3 model + 關聯） | 2-3 hr |
| 1.2 | 預設流程種子（選用） | 0.5-1 hr |
| 1.3 | 後端：`approvalWorkflow` router（Admin 配置） | 3-4 hr |
| 1.4 | 後端：`budgetProposal` 審批重構（submit/各 step/視圖） | 5-7 hr |
| 1.5 | 前端：流程配置頁（拖曳排序 + 角色下拉） | 4-5 hr |
| 1.6 | 前端：審批 UI + 進度時間線 + 「待我審批」視圖 | 4-5 hr |
| 1.7 | i18n 雙語 | 1-2 hr |
| 1.8 | 驗證、E2E、回歸 | 3-4 hr |
| **總計** | | **~23-31 hr** |

---

## 2. 詳細任務分解

### Phase 1.1: 資料模型

**目標**: 新增 `ApprovalWorkflow` / `ApprovalStep` / `ProposalApprovalProgress`，並為 `BudgetProposal`/`Role`/`User` 補關聯。

**任務清單**:
- [ ] `schema.prisma` 新增 `ApprovalWorkflow`（含 Phase 2 預留欄位 `proposalTypeFilter`/`minAmount`/`maxAmount`/`matchPriority`，Phase 1 全 null）
- [ ] 新增 `ApprovalStep`（`approverRoleId Int` → Role；`@@unique([workflowId, sequence])`）
- [ ] 新增 `ProposalApprovalProgress`（快照 `sequence`/`approverRoleId`；`stepId` 用 `onDelete: SetNull`；`@@index([approverRoleId, status])`）
- [ ] `BudgetProposal` 加 `workflowId String?` + `currentStepSequence Int?` + 關聯
- [ ] `Role` 加 `approvalSteps ApprovalStep[]`；`User` 加 `approvalDecisions ProposalApprovalProgress[]`
- [ ] `pnpm db:migrate`（建立 migration）+ `pnpm db:generate`

**驗收標準**:
- [ ] `pnpm db:generate` 無錯誤；migration 套用成功
- [ ] `approverRoleId` 型別與 `Role.id`（Int）一致
- [ ] 既有 BudgetProposal 不受影響（新欄位皆 nullable）

**文件變更**:
```
packages/db/prisma/schema.prisma (修改)
packages/db/prisma/migrations/<timestamp>_feat014_approval_workflow/ (新增)
```

> 🔴 紅線：Schema 為 SSOT，改完必跑 `db:migrate` + `db:generate`（03-dev-workflow §1③）。

---

### Phase 1.2: 預設流程種子（選用）

**目標**: 提供一條可立即運作的預設流程（避免空資料時無法測試）。

**任務清單**:
- [ ] 在 seed 建立一條 `isActive=true` 流程「Budget Proposal 標準流程」
- [ ] 加 1-2 個步驟（如 step1 = Supervisor）對齊現況審批
- [ ] 確認可重複執行（冪等）

**驗收標準**:
- [ ] seed 後存在一條 active 流程含 ≥1 步驟
- [ ] 不影響既有 seed 資料

> 註：若選擇不種子，Admin 須先在配置頁手建流程；未建流程時提案走 Q-D fallback（舊 `approve`）。

**文件變更**:
```
packages/db/prisma/seed.ts 或 seed-*.ts (修改/新增)
```

---

### Phase 1.3: 後端 — `approvalWorkflow` Router（Admin 配置）

**目標**: 新 router 提供流程 + 步驟的 Admin CRUD（R1–R4）。

**任務清單**:
- [ ] 新增 `packages/api/src/routers/approvalWorkflow.ts`
- [ ] `list` / `getById`（adminProcedure，含 steps）
- [ ] `create` / `update` / `toggleActive`（adminProcedure）
- [ ] `addStep` / `updateStep` / `removeStep`（adminProcedure）
- [ ] `reorderSteps`（adminProcedure，傳 `[{id, sequence}]`，比照 OM `reorderItems`）
- [ ] 全部 Zod 驗證輸入；關鍵操作記 History
- [ ] `root.ts` 註冊 `approvalWorkflowRouter`

**驗收標準**:
- [ ] 僅 Admin 可呼叫（adminProcedure）
- [ ] 可建立含 ≥2 步驟並調整順序；`@@unique([workflowId, sequence])` 不衝突
- [ ] `pnpm typecheck` 通過

**文件變更**:
```
packages/api/src/routers/approvalWorkflow.ts (新增)
packages/api/src/root.ts (修改)
```

> 🔴 紅線：業務邏輯只在 `packages/api`；受保護路由用對 `adminProcedure`。

---

### Phase 1.4: 後端 — `budgetProposal` 審批重構

**目標**: 序列審批推進（R5–R10）+ 視圖（R11–R13），同時保留舊 `approve` 為 fallback（Q-D）。

**任務清單**:
- [ ] `submit`：解析適用流程（Phase 1 = 唯一 active/default）→ 建 progress 各列（快照 sequence/role，Q-B）→ `currentStepSequence=1` → 通知第 1 步角色
- [ ] `approveStep`（新，protectedProcedure + 內部比對「登入者 `roleId` == 當前步 `approverRoleId`」）：標記該步 Approved；有下一步→前移並通知；否則整案 `Approved`（沿用既有更新 `Project.approvedBudget` + 通知）
- [ ] `rejectStep`（新）：當前步 Rejected → 整案 `Rejected` + 通知提案人（帶原因，沿用 `rejectionReason` / `cause.reason`）
- [ ] `requestMoreInfoStep`（新）：整案 `MoreInfoRequired`、當前步 progress 轉 Pending、`currentStepSequence` **不變**；提案人重提後**回到原步續走**（Q-A，前面步驟維持 Approved）
- [ ] `getPendingForMe`（新，protected）：progress `status=Pending` 且 `approverRoleId == 登入者 roleId` 且為該案當前步
- [ ] `getAllPending`（新，supervisor/admin）：全部尚未批准綜覽（R12）
- [ ] 保留舊 `approve`（supervisorProcedure）為 fallback：未綁定 `workflowId` 者走舊路（Q-D）
- [ ] 各步決策寫 `ProposalApprovalProgress`（approvedByUserId/decidedAt/comment）+ History（R10）
- [ ] 新增的通知類型先在通知系統**註冊**（避免發送未註冊類型）

**驗收標準**:
- [ ] 非當前步角色無法搶先審批（內部角色比對擋下）
- [ ] 序列推進 / 駁回 / 補件回原步 行為正確
- [ ] 最末步通過 → 整案 Approved 且 `Project.approvedBudget` 更新（沿用既有）
- [ ] 未綁定 workflow 的提案仍可用舊 `approve`
- [ ] `pnpm typecheck` 通過

**文件變更**:
```
packages/api/src/routers/budgetProposal.ts (修改)
packages/api/src/lib/* 或 notification 註冊處 (如需新通知類型)
```

> 🔴 紅線：錯誤分類用 `code`/`cause.reason`（非 `message.includes()`）。

---

### Phase 1.5: 前端 — 流程配置頁（Admin）

**目標**: `/settings/approval-workflows`（比照 `/settings/currencies`）流程列表 + 步驟編輯。

**任務清單**:
- [ ] 新增 `app/[locale]/settings/approval-workflows/page.tsx`
- [ ] 流程列表 + 啟用切換
- [ ] 步驟編輯：角色下拉（值用 `Role.id`）+ 拖曳排序（沿用 `@dnd-kit`，比照 `OMExpenseItemList`）
- [ ] 用 `PermissionGate`（或 admin 判斷）做前端權限閘門（R4）
- [ ] 所有 mutation 按鈕用 `LoadingButton`

**驗收標準**:
- [ ] 非 Admin 看不到 / 進不去此頁
- [ ] 拖曳排序後正確呼叫 `reorderSteps`
- [ ] 新增/移除步驟即時反映

**文件變更**:
```
apps/web/src/app/[locale]/settings/approval-workflows/page.tsx (新增)
apps/web/src/components/approval-workflow/* (新增，視拆分需要)
```

---

### Phase 1.6: 前端 — 審批 UI + 進度時間線 + 「待我審批」

**目標**: 提案詳情頁依當前步角色顯示審批操作；新增待我審批視圖（R11–R13）。

**任務清單**:
- [ ] 改 `components/proposal/ProposalActions.tsx`：依「登入者是否為當前步角色」顯示核准/駁回/補件
- [ ] 提案詳情頁顯示**審批進度時間線**（progress + History：第幾步、誰、何時、意見）
- [ ] 新增「待我審批」視圖（新頁或 dashboard 區塊），呼叫 `getPendingForMe`
- [ ] 視圖顯示：標題、類型、Requested/Approved（USD）、Vendor、會議記錄連結、卡在第幾步（R13）
- [ ] mutation 按鈕用 `LoadingButton`；錯誤用 `code`/`cause.reason`

**驗收標準**:
- [ ] 「待我審批」只列當前步角色 == 登入者且 Pending 的提案
- [ ] 非當前步角色在詳情頁看不到審批按鈕
- [ ] 進度時間線正確呈現各步狀態

**文件變更**:
```
apps/web/src/components/proposal/ProposalActions.tsx (修改)
apps/web/src/app/[locale]/proposals/[id]/page.tsx (修改，進度時間線)
apps/web/src/app/[locale]/proposals/pending/page.tsx 或 dashboard 區塊 (新增)
```

---

### Phase 1.7: i18n 雙語

**任務清單**:
- [ ] `zh-TW.json` + `en.json` 同步新增：流程配置、步驟、審批操作、進度時間線、待我審批等 key
- [ ] `pnpm validate:i18n` 通過

**驗收標準**:
- [ ] 兩語系 key 結構一致、無重複 key
- [ ] 中英文切換正常

**文件變更**:
```
apps/web/src/messages/zh-TW.json (修改)
apps/web/src/messages/en.json (修改)
```

> 🔴 紅線：i18n 雙語同步 + `validate:i18n`（03-dev-workflow §1③）。

---

### Phase 1.8: 驗證、E2E、回歸

**任務清單**:
- [ ] `/itpm:pre-commit`（`validate:i18n` + `typecheck` + `lint` + 敏感檔案檢查）
- [ ] Playwright E2E 覆蓋審批路徑：submit → step1 核准 → step2 → Approved；駁回；補件回原步
- [ ] 回歸：未綁定 workflow 的舊 `approve` 路徑仍正常（Q-D fallback）

**驗收清單**（對齊 01-requirements §5）:
- [ ] Admin 能建立含 ≥2 步驟流程並調整順序
- [ ] 提交後依序進入第 1 步；該角色任一人核准 → 進第 2 步
- [ ] 非當前步角色無法搶先審批
- [ ] 任一步駁回 → 整案 Rejected + 通知提案人
- [ ] 最末步通過 → Approved 且 `Project.approvedBudget` 更新
- [ ] 「待我審批」只顯示當前步角色匹配登入者的 Pending 提案
- [ ] 全程 History 完整；`typecheck`/`lint`/`validate:i18n`/`db:migrate` 通過

---

## 3. 依賴關係圖

```
Phase 1.1 資料模型
    ↓
Phase 1.2 預設流程種子（選用）
    ↓
Phase 1.3 approvalWorkflow Router ──┐
    ↓                               │
Phase 1.4 budgetProposal 審批重構 ──┤
    ↓                               ▼
Phase 1.5 配置頁          Phase 1.6 審批 UI + 待我審批
    └───────────────┬───────────────┘
                    ↓
            Phase 1.7 i18n
                    ↓
            Phase 1.8 驗證/E2E/回歸
```

---

## 4. 風險與緩解

| 風險 | 影響 | 緩解 |
|------|------|------|
| 審批重構動到核心流程 | 高 | 保留舊 `approve` 為 fallback（Q-D）；workflow 綁定為開關；補 E2E |
| Admin 改流程影響進行中案件 | 中 | progress 快照 `sequence`/`approverRoleId`（Q-B）；步驟刪除 `SetNull` |
| 僅 3 個角色，多步驟流程可組合有限 | 中 | Phase 1 接受此限制；更細審批單位另立 FEAT（見 §6 / 01-req Q-C） |
| 新通知類型未註冊導致發送失敗 | 中 | 新增類型先在通知系統註冊（對齊既有已知 bug 教訓） |
| 一人多角下「待我審批」漏人 | 低 | FEAT-016（多角色）落地後查詢自然擴充；Phase 1 假設單角色 |

---

## 5. 回滾計劃

1. **Schema 回滾**: 還原 migration（移除 3 個新表 + BudgetProposal/Role/User 新欄位）
2. **API 回滾**: 從 `root.ts` 移除 `approvalWorkflowRouter`；`budgetProposal` 還原至舊 `approve` 單階段
3. **前端回滾**: 還原 `ProposalActions.tsx`、移除配置頁與待我審批視圖
4. 因採 Q-D fallback 設計，未綁定 workflow 的提案不受影響，回滾衝擊面小

---

## 6. 後續擴展（Phase 2，不在本計劃）

- 規則引擎（R14–R15）：依 `proposalType`（來自 CHANGE-043）/ 金額門檻套不同流程；`matchPriority` + `isDefault` fallback
- 多角色（FEAT-016）：使用者一人多角後，「待我審批」查詢自然涵蓋多角色
- 並行審批（湊齊 N 人）— 目前明確排除，僅做序列

---

## 7. 分支與提交建議（依 03-dev-workflow §3）

> ⚠️ 本 FEAT 屬「核心流程重構 + Prisma migration」的**高風險大改**。依 `03-dev-workflow §3(b)`，**建議先與使用者確認**走 `feature/FEAT-014-approval-workflow` 分支（可回滾 / review gate），或維持現行直接 `main`。**開分支屬流程變更，動手前先確認。**

- Conventional Commits，subject 帶 `(FEAT-014)`，每個 Phase 完成提交一次
- 逐檔 `git add`（不用 `git add .`）；同步 `DEVELOPMENT-LOG.md`
- `git push` 前向使用者確認（破壞性操作）

---

**維護者**: AI 助手 + 開發團隊
**最後更新**: 2026-06-01
