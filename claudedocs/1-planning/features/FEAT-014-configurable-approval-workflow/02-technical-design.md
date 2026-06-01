# FEAT-014: 可配置序列審批流程 — 技術設計

> **建立日期**: 2026-06-01
> **狀態**: 📋 設計中（Q-A~Q-D 已確認，見 01-requirements §4；資料模型依此定稿）
> **對應需求**: `./01-requirements.md`

---

## 1. 資料模型變更（`packages/db/prisma/schema.prisma`）

> 新增 3 個 model + `BudgetProposal` 少量欄位。改後跑 `pnpm db:migrate` + `pnpm db:generate`。枚舉用 String（database.md），外鍵建索引。

```prisma
// 審批流程定義（Phase 1：通常一條 active 預設流程；Phase 2：多條 + 規則）
model ApprovalWorkflow {
  id          String   @id @default(uuid())
  name        String                          // 如「Budget Proposal 標準流程」
  isActive    Boolean  @default(true)
  isDefault   Boolean  @default(false)         // 規則無命中時的 fallback（Phase 2 用）

  // --- Phase 2 規則欄位（Phase 1 可全為 null，視為「總是適用」）---
  proposalTypeFilter String?                   // 比對 BudgetProposal.proposalType；null=不限
  minAmount          Float?                    // 金額門檻下界（USD）；null=不限
  maxAmount          Float?                    // 金額門檻上界（USD）；null=不限
  matchPriority      Int      @default(0)      // 多流程命中時的優先序（大者優先）

  steps       ApprovalStep[]
  proposals   BudgetProposal[]                 // 已套用此流程的提案（快照綁定，見 §3）

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([isActive])
}

// 審批步驟（序列）
model ApprovalStep {
  id            String  @id @default(uuid())
  workflowId    String
  sequence      Int                            // 1,2,3… 序列順序
  approverRoleId Int                           // 該步驟的審批「角色」（D7）
  name          String?                        // 顯示名稱，如「主管初審」「財務複核」

  workflow      ApprovalWorkflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  role          Role             @relation(fields: [approverRoleId], references: [id])
  progress      ProposalApprovalProgress[]

  @@unique([workflowId, sequence])             // 同流程序號唯一
  @@index([workflowId])
  @@index([approverRoleId])
}

// 單一提案的審批進度（提交時依流程快照生成各步驟一列）
model ProposalApprovalProgress {
  id               String   @id @default(uuid())
  budgetProposalId String
  stepId           String?                      // 對應 ApprovalStep（SetNull 以防步驟被刪）
  sequence         Int                          // 快照當下的序號（不依賴 step 存活）
  approverRoleId   Int                          // 快照當下的審批角色（同上）
  status           String   @default("Pending") // 'Pending' | 'Approved' | 'Rejected' | 'Skipped'
  approvedByUserId String?                      // 實際核准/駁回者
  decidedAt        DateTime?
  comment          String?  @db.Text

  budgetProposal   BudgetProposal @relation(fields: [budgetProposalId], references: [id], onDelete: Cascade)
  step             ApprovalStep?  @relation(fields: [stepId], references: [id], onDelete: SetNull)
  approver         User?          @relation(fields: [approvedByUserId], references: [id])

  @@index([budgetProposalId])
  @@index([approverRoleId, status])             // 支援「待我審批」查詢
  @@index([stepId])
}

model BudgetProposal {
  // ... 既有 + CHANGE-043 欄位 ...
  workflowId           String?                  // 提交時鎖定的流程（Q-B：快照綁定）
  currentStepSequence  Int?                     // 目前進行到第幾步；null=未進入流程/已結束
  workflow             ApprovalWorkflow? @relation(fields: [workflowId], references: [id])
  approvalProgress     ProposalApprovalProgress[]

  @@index([workflowId])
}

model Role {
  // ... 既有 ...
  approvalSteps        ApprovalStep[]
}

model User {
  // ... 既有 ...
  approvalDecisions    ProposalApprovalProgress[]
}
```

> **為何 progress 同時快照 `sequence`/`approverRoleId`**：Admin 日後改流程不應破壞進行中案件（Q-B）。`stepId` 用 `SetNull` 容忍步驟被刪，但靠快照欄位仍能正確推進與查詢。

---

## 2. API 設計（tRPC）

### 2.1 流程配置（新 router 建議 `approvalWorkflow.ts`，全 `adminProcedure`）

| Procedure | 權限 | 說明 |
|---|---|---|
| `list` / `getById` | admin | 列出/取得流程含步驟 |
| `create` / `update` / `toggleActive` | admin | 流程 CRUD + 啟用切換 |
| `addStep` / `updateStep` / `removeStep` / `reorderSteps` | admin | 步驟維護（reorder 比照 OM `reorderItems`，傳 `[{id, sequence}]`） |

### 2.2 審批執行（擴充 `budgetProposal.ts`）

| Procedure | 權限 | 變更 |
|---|---|---|
| `submit` | protected | 提交時：解析適用流程（Phase 1=唯一 active/default；Phase 2=規則比對）→ 建立 progress 各列 → `currentStepSequence=1` → 通知第 1 步角色 |
| `approveStep`（新） | protected + 步驟角色檢查 | 取代舊 `approve`：驗證「登入者角色 == 當前步驟 `approverRoleId`」→ 標記該步 Approved → 有下一步則前移並通知；否則整案 Approved（沿用既有 Project 更新+通知） |
| `rejectStep`（新） | 同上 | 當前步 Rejected → 整案 Rejected + 通知提案人（須帶原因，沿用 rejectionReason / cause.reason） |
| `requestMoreInfoStep`（新） | 同上 | 退回提案人（整案 MoreInfoRequired，當前步 progress 轉 Pending）；提案人重提後**回到原步驟續走**（Q-A），不重跑前面步驟 |
| `getPendingForMe`（新） | protected | 「待我審批」：progress 中 `status=Pending` 且 `approverRoleId == 登入者 role` 且為該案當前步驟 |
| `getAllPending`（新） | supervisor/admin | 全部尚未批准綜覽（R12） |

> **權限模式**：審批不再硬編碼 `supervisorProcedure`，改為 `protectedProcedure` + **procedure 內部比對「登入者角色 == 當前步驟角色」**（因審批角色現由流程動態決定）。Admin 可保留 override 能力（選用，Phase 1 可不做）。
> **過渡（Q-D）**：未綁定 workflow 的提案沿用舊單階段 `approve`；綁定者走新機制。

---

## 3. 流程狀態機

```
Draft ──submit──► 解析流程 + 建 progress ──► 進入 Step 1 (Pending)
  Step N (Pending) ──approveStep──► 有下一步? ─是─► Step N+1 (Pending)
                                              └─否─► Proposal Approved（更新 Project.approvedBudget + 通知）
  Step N ──rejectStep──► Proposal Rejected（通知提案人）
  Step N ──requestMoreInfoStep──► Proposal MoreInfoRequired ──(提案人重提)──► 回到 Step N 續走（Q-A：步驟 1..N-1 維持 Approved）
```

> 既有 `ProposalStatus`（Draft/PendingApproval/Approved/Rejected/MoreInfoRequired）大致沿用；`PendingApproval` 期間以 `currentStepSequence` + progress 表達「卡在第幾步」。

---

## 4. 前端設計

- **配置頁（Admin）**：`/settings/approval-workflows`（或 settings 子頁）——流程列表 + 步驟編輯（角色下拉 + 拖曳排序，沿用 `@dnd-kit` 模式）。權限用 `PermissionGate`。
- **審批 UI**：提案詳情頁的 `ProposalActions` 改為依「登入者是否為當前步驟角色」顯示核准/駁回/補件；顯示審批進度時間線（progress + History）。
- **待我審批視圖**：新頁或 dashboard 區塊，呼叫 `getPendingForMe`。
- 所有 mutation 按鈕用 `LoadingButton`；錯誤用 `code`/`cause.reason`（backend-api.md）。

---

## 5. 影響範圍

- **Schema**: +3 model（ApprovalWorkflow/ApprovalStep/ProposalApprovalProgress）、`BudgetProposal`/`Role`/`User` 加關聯 → **需 migration**
- **API**: 新 `approvalWorkflow` router；`budgetProposal` 審批 procedures 重構
- **前端**: 配置頁（新）、`ProposalActions`、待我審批視圖（新）、提案詳情進度時間線
- **i18n**: 配置與審批相關 key（雙語）
- **既有行為**: 審批不再單一 supervisor；需處理過渡（Q-D）

---

## 6. 風險與緩解

| 風險 | 緩解 |
|---|---|
| 審批邏輯重構動到核心流程 | 保留舊單階段為 fallback；新機制以 workflow 綁定為開關；補 Playwright E2E 覆蓋審批路徑 |
| Admin 改流程影響進行中案件 | progress 快照 sequence/role（Q-B）；步驟刪除用 SetNull |
| 單角色限制下「待我審批」可能漏人 | 文件註明 FEAT-016（多角色）落地後查詢自然擴充；Phase 1 接受此限制 |
| 規則比對歧義（Phase 2） | matchPriority + isDefault fallback；無命中走預設流程 |

---

## 7. 相關文檔

- 需求：`./01-requirements.md` | 批次總覽：`1-planning/roadmap/2026-06-expense-approval-batch.md`
- 前置：`CHANGE-043` | 未來：`FEAT-016`（多角色）
- 參考實作模式：OM `reorderItems`（拖曳排序）、`FEAT-011` 權限、`routers/budgetProposal.ts` 既有審批
