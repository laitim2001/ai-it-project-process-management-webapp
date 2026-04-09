# budgetProposal.ts - 預算提案審批工作流 Router 分析

## 基本資訊

| 項目 | 值 |
|------|-----|
| 檔案路徑 | `packages/api/src/routers/budgetProposal.ts` |
| 行數 | 963 行 |
| Procedure 總數 | 12 個 |
| 匯入的 middleware | `protectedProcedure`, `supervisorProcedure` _(FIX-104)_ |
| 自 | Epic 4 - Proposal and Approval Workflow |

---

## Procedures 清單

### 1. `getAll` (query) — 第 112~188 行

- **權限**: `protectedProcedure`
- **Input Schema** (optional):
  - `page`: number, min(1), default(1) _(FIX-112 新增)_
  - `limit`: number, min(1), max(100), default(20) _(FIX-112 新增)_
  - `status`: enum('Draft','PendingApproval','Approved','Rejected','MoreInfoRequired'), optional
  - `projectId`: string, optional
  - `search`: string, optional
- **回傳**: `{ items: BudgetProposal[], total, page, limit, totalPages }` _(FIX-112: 原直接返回陣列)_
- **業務邏輯**:
  - ✅ FIX-112: 新增分頁支援（page/limit），避免大量資料一次載入
  - 支援狀態、專案、搜尋（title/project.name）過濾
  - include: project (含 manager, supervisor, budgetPool, currency), comments (含 user), historyItems (含 user)
  - 按 createdAt desc 排序

### 2. `getById` (query) — 第 171~218 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ id: string.min(1) }`
- **回傳**: BudgetProposal 完整資訊
- **業務邏輯**: 同 getAll 的 include 結構，拋出 NOT_FOUND

### 3. `create` (mutation) — 第 223~259 行

- **權限**: `protectedProcedure`
- **Input Schema**: `budgetProposalCreateInputSchema`
  - `title`: string, min(1)
  - `amount`: number, positive
  - `projectId`: string, min(1)
- **回傳**: 新建的 BudgetProposal（含 project）
- **業務邏輯**:
  - 驗證 project 存在
  - 預設狀態 'Draft'

### 4. `update` (mutation) — 第 264~310 行

- **權限**: `protectedProcedure`
- **Input Schema**: `budgetProposalUpdateInputSchema`
  - `id`: string, min(1)
  - `title`: string, min(1), optional
  - `amount`: number, positive, optional
- **回傳**: 更新後的 BudgetProposal
- **業務邏輯**:
  - **狀態限制**: 僅 Draft 或 MoreInfoRequired 可編輯

### 5. `submit` (mutation) — 第 337~416 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ id: string }` _(FIX-105: 移除 userId，改用 ctx.session.user.id)_
- **回傳**: 更新後的 BudgetProposal
- **業務邏輯**:
  - **狀態流轉**: Draft/MoreInfoRequired -> PendingApproval
  - **使用 $transaction**:
    1. 更新提案狀態
    2. 建立 History 記錄（action: 'SUBMITTED'）
    3. **Epic 8 通知**: 建立 Notification 給 Supervisor
  - 通知內容：「新的預算提案待審批」

### 6. `approve` (mutation) — 第 421~555 行

- **權限**: `supervisorProcedure` _(FIX-104: 原 protectedProcedure)_
- **Input Schema**: `budgetProposalApprovalInputSchema`
  - `id`: string, min(1)
  - `action`: enum('Approved','Rejected','MoreInfoRequired')
  - `comment`: string, optional
  - `approvedAmount`: number, min(0), optional
  - _(FIX-105: 移除 userId，改用 ctx.session.user.id)_
- **回傳**: 更新後的 BudgetProposal
- **業務邏輯**:
  - **狀態限制**: 僅 PendingApproval 可審批
  - **使用 $transaction**:
    1. 更新提案狀態
    2. Approved 時記錄 approvedAmount, approvedBy, approvedAt
    3. Rejected 時記錄 rejectionReason
    4. 建立 History 記錄
    5. 有 comment 時也建立 Comment 記錄
    6. **Approved 時更新 Project**: approvedBudget 和 status -> 'InProgress'
    7. **Epic 8 通知**: 建立 Notification 給 Project Manager（根據 action 不同生成不同通知）

### 7. `addComment` (mutation) — 第 538~553 行

- **權限**: `protectedProcedure`
- **Input Schema**: `commentInputSchema`
  - `budgetProposalId`: string, min(1)
  - `userId`: string, min(1)
  - `content`: string, min(1)
- **回傳**: Comment（含 user）

### 8. `uploadProposalFile` (mutation) — 第 559~605 行

- **權限**: `protectedProcedure`
- **Input Schema**:
  - `proposalId`: string, min(1)
  - `filePath`: string, min(1)
  - `fileName`: string, min(1)
  - `fileSize`: number, int, positive
- **回傳**: 更新後的 BudgetProposal
- **業務邏輯**: 更新 proposalFilePath, proposalFileName, proposalFileSize

### 9. `updateMeetingNotes` (mutation) — 第 611~657 行

- **權限**: `protectedProcedure`
- **Input Schema**:
  - `proposalId`: string, min(1)
  - `meetingDate`: string, min(1)
  - `meetingNotes`: string, min(1)
  - `presentedBy`: string, optional
- **回傳**: 更新後的 BudgetProposal
- **業務邏輯**: 更新 meetingDate (轉 Date), meetingNotes, presentedBy

### 10. `delete` (mutation) — 第 663~726 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ id: string.min(1) }`
- **回傳**: `{ success: true }`
- **業務邏輯**:
  - **狀態限制**: 僅 Draft 可刪除
  - **CHANGE-017 權限檢查**: 僅專案經理（managerId）或 Admin 可刪除
  - **使用 $transaction**: 先刪除 History, Comment，再刪除 proposal

### 11. `deleteMany` (mutation) — 第 732~802 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ ids: string[].min(1) }`
- **回傳**: `{ success: true, deletedCount: number }`
- **業務邏輯**:
  - CHANGE-017: 批量刪除
  - 檢查所有提案存在、全部為 Draft 狀態
  - 非 Admin 時檢查每個提案的 managerId 權限
  - **使用 $transaction**: 批量刪除 History, Comment, proposals

### 12. `revertToDraft` (mutation) — 第 814~940 行

- **權限**: `protectedProcedure`
- **Input Schema**: `{ id: string.min(1), reason: string.min(1) }`
- **回傳**: 更新後的 BudgetProposal（含完整關聯）
- **業務邏輯**:
  - **CHANGE-018 狀態回退**: 任何非 Draft 狀態 -> Draft
  - **權限**: Admin 或 Supervisor 才能執行
  - **使用 $transaction**:
    1. 清除 approvedAmount, approvedBy, approvedAt, rejectionReason
    2. 建立 History（REVERTED_TO_DRAFT）
    3. 若原狀態 Approved 且有 approvedAmount: **回退 Project.approvedBudget**（decrement）
    4. FIX-008: 若無其他 Approved 提案，Project.status 回退到 'Draft'

---

## 匯出的 Zod Schemas

此 Router 的 schemas 均為檔案內部定義（未 export），包括：

| Schema 名稱 | 用途 |
|---|---|
| `ProposalStatus` | 提案狀態枚舉 |
| `budgetProposalCreateInputSchema` | 建立提案 |
| `budgetProposalUpdateInputSchema` | 更新提案 |
| `budgetProposalSubmitInputSchema` | 提交審批 _(FIX-105: 移除 userId)_ |
| `budgetProposalApprovalInputSchema` | 審批操作 _(FIX-105: 移除 userId)_ |
| `commentInputSchema` | 新增評論 _(FIX-105: 移除 userId)_ |

---

## 使用的 Prisma Models

| Model | 操作 |
|-------|------|
| `BudgetProposal` | 讀/寫（完整 CRUD + 狀態流轉） |
| `Project` | 讀/寫（驗證存在、更新 approvedBudget/status） |
| `Comment` | 讀/寫（建立、刪除） |
| `History` | 讀/寫（建立、刪除） |
| `Notification` | 寫入（submit/approve 時建立通知） |
| `User` | 讀取（查詢 submitter/reviewer 名稱） |

---

## 跨 Router 依賴

- 無直接調用其他 Router
- submit/approve 直接在 transaction 中建立 Notification（未透過 notification Router）

---

## 特殊模式

- **審批工作流狀態機**: Draft -> PendingApproval -> Approved/Rejected/MoreInfoRequired
- **狀態回退**: revertToDraft 支援任何狀態回退到 Draft（含預算回沖）
- **通知整合**: submit 通知 Supervisor，approve 通知 Project Manager
- **審計追蹤**: 所有狀態變更均建立 History 記錄
- **批量操作**: deleteMany 支援批量刪除
- **檔案管理**: uploadProposalFile 記錄檔案元數據（路徑、名稱、大小）
- **會議記錄**: updateMeetingNotes 支援會議日期、記錄、介紹人
- **權限控制**: delete/deleteMany 檢查 managerId 或 Admin
- **✅ FIX-112**: getAll 已新增分頁支援（page/limit/totalPages）
- **✅ FIX-105**: submit/approve 已移除前端傳入 userId，改用 ctx.session.user.id（避免身份偽造）
- **✅ FIX-104**: approve 已升級為 supervisorProcedure（原 protectedProcedure）
- **✅ FIX-106**: User select 使用 safeUserSelect 避免洩漏密碼 hash
