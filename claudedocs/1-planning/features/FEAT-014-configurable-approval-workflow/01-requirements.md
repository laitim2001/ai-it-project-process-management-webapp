# FEAT-014: 可配置序列審批流程（Budget Proposal）

> **建立日期**: 2026-06-01
> **最後更新**: 2026-06-01
> **狀態**: 📋 設計中
> **優先級**: High
> **前置依賴**: CHANGE-043（BP 會議記錄欄位，提供 `proposalType` 供規則比對）。註：**Phase 1 不阻塞於 CHANGE-043**，`proposalType` 僅 Phase 2 規則引擎需要，Phase 1 可與 CHANGE-043 並行。
> **相關**: FEAT-016（一人多角，未來；本 FEAT 先以單角色上線，見 D9）

---

## 1. 功能概述

目前 Budget Proposal 的審批是**單階段、單一審批人**——審批人寫死為 `Project.supervisor`，由 `supervisorProcedure` 一人核准/駁回/要求補件，**完全沒有**多審批人、順序或可配置流程。

本 FEAT 建立一套**可配置的序列審批流程**：Admin 可定義「依序的多個審批步驟」，每步指定一個**審批角色**，提案提交後依序流經各步驟，全部通過才算 Approved。並提供審批人的**「待我審批」視圖**（原始需求 #4）。

> **核心決策**（批次總覽 D7~D9）：序列式；審批人用**角色**判定（每步「該角色任一人核准即過」）；僅 **Admin** 可配置；規則引擎（按金額/類型套不同流程）列為 **Phase 2**；先以**單角色**上線。

---

## 2. 功能需求

### 2.1 流程配置（Admin only）

| ID | 需求 |
|---|---|
| R1 | Admin 可建立 / 編輯 / 停用「審批流程（ApprovalWorkflow）」 |
| R2 | 每個流程含**有序的多個步驟（ApprovalStep）**；每步指定一個**審批角色**（Role）與順序（sequence） |
| R3 | Admin 可**新增 / 移除步驟、調整步驟順序**（拖曳或上下移） |
| R4 | 配置入口僅 Admin 可見可用（`adminProcedure` + 前端權限閘門） |

### 2.2 審批執行（序列）

| ID | 需求 |
|---|---|
| R5 | 提案提交（submit）時，系統解析出適用的流程，並建立各步驟的審批進度（ProposalApprovalProgress） |
| R6 | **序列推進**：僅「當前步驟」開放審批；當前步驟通過後才解鎖下一步 |
| R7 | 每步「該審批角色的**任一使用者**核准即視為該步通過」（D7） |
| R8 | 任一步**駁回** → 整案 Rejected；**要求補件** → 退回提案人補件後**回到原步驟續走**（步驟 1..N-1 維持 Approved，見 §4 Q-A） |
| R9 | 最末步通過 → 提案 `Approved`，沿用既有「批准後更新 `Project.approvedBudget`、發通知」邏輯 |
| R10 | 全程記錄 History（每步由誰、何時、核准/駁回、意見） |

### 2.3 主管 / 審批人視圖（原始需求 #4）

| ID | 需求 |
|---|---|
| R11 | 提供「**待我審批**」視圖：列出「當前步驟之審批角色 = 登入者角色」且狀態 Pending 的提案（D9 用角色判定） |
| R12 | 提供「**全部尚未批准**」綜覽（給較高層級總覽用） |
| R13 | 視圖顯示提案關鍵資訊（標題、類型、Requested/Approved USD、Vendor、會議記錄連結、目前卡在第幾步） |

### 2.4 規則引擎（Phase 2）

| ID | 需求 |
|---|---|
| R14 | 支援依**條件**套用不同流程：金額門檻（如 > $X 走較長流程）、`proposalType`（BudgetProposal/Payment）、可能含專案類型 |
| R15 | 條件比對有明確優先序與 fallback（無命中時用預設流程） |

---

## 3. 範圍與分階段

| 階段 | 內容 | 對應需求 |
|---|---|---|
| **Phase 1** | 資料模型 + 單一可配置序列流程 + 序列審批推進 + Admin 配置 UI + 「待我審批」視圖 | R1–R13 |
| **Phase 2** | 規則引擎（多流程 + 條件比對） | R14–R15 |

**明確排除（本 FEAT 不做）**：
- 並行審批（多人同時、湊齊 N 人）——目前只做序列（D7）
- 一人多角（FEAT-016 處理；Phase 1 假設使用者單一角色）
- 將 Type=Payment 真正連到 Expense（CHANGE-043 D6：先為純欄位）

---

## 4. 已確認決策（Phase 1 技術設計依此定稿）

- **Q-A（補件後續走點）**：**回到原步驟續走**。在第 N 步「要求補件」退回提案人，提案人重提後**回到第 N 步**重新審（步驟 1..N-1 維持 Approved，`currentStepSequence` 不變），不從第一步重跑。
- **Q-B（流程綁定時機）**：**submit 當下鎖定**流程快照（建立各步驟 progress 列）。之後 Admin 修改流程**不影響**進行中的案件。
- **Q-C（步驟與角色關係）**：**一步一角色**（不支援同步驟多角色或指定具體使用者）。註：受限於系統現有 3 個角色（PM/Supervisor/Admin），可組成的「多步驟不同角色」流程有限；若未來需要更細的審批單位，再以獨立 FEAT 擴充。
- **Q-D（舊流程過渡）**：**保留舊單階段 `approve` 為 fallback**。未綁定 workflow 的提案沿用舊單階段審批；綁定了 workflow 的提案走新序列機制。

---

## 5. 驗收標準（Phase 1）

- [ ] Admin 能建立含 ≥2 步驟的序列流程並調整順序
- [ ] 提案提交後依序進入第 1 步；第 1 步該角色任一人核准 → 進第 2 步
- [ ] 非當前步驟角色的使用者無法搶先審批
- [ ] 任一步駁回 → 整案 Rejected 並通知提案人
- [ ] 最末步通過 → 提案 Approved 且 `Project.approvedBudget` 更新（沿用既有）
- [ ] 「待我審批」只顯示當前步驟角色匹配登入者的 Pending 提案
- [ ] 全程 History 完整；`pnpm typecheck`/`lint`/`validate:i18n`/`db:migrate` 通過

---

## 6. 相關文檔

- 批次總覽：`1-planning/roadmap/2026-06-expense-approval-batch.md`（D7~D9）
- 技術設計：`./02-technical-design.md`
- 前置：`CHANGE-043`（proposalType / 會議記錄欄位）
- 既有：`routers/budgetProposal.ts`（`submit` + 單一 `approve`，以 `input.action`=Approved/Rejected/MoreInfoRequired 分流核准/駁回/補件，非三個獨立 procedure）、`trpc.ts`（supervisorProcedure/adminProcedure）、`FEAT-011`（權限系統）
