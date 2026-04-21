# Proposal Components — Epic 3 預算提案審批工作流

> **Last Updated**: 2026-04-21
> **複雜度**: ⭐⭐⭐⭐（狀態機驅動）
> **Epic**: Epic 3 - Budget Proposal Workflow
> **相關規則**: `.claude/rules/components.md`
> **深度分析參考**:
> - `docs/codebase-analyze/04-components/detail/business-components.md`（proposal 章節）
> - `docs/codebase-analyze/02-api-layer/detail/budgetProposal.md` — API Procedures 完整清單
> - `docs/codebase-analyze/09-diagrams/business-process.md#proposal-approval-flow` — 審批流程圖

## 📋 目錄用途

實作 Epic 3 的**預算提案審批工作流**前端組件。這是全專案狀態機最複雜的業務區域，涉及 **5 種狀態 + 5 種操作 + RBAC 角色分支**。

## 🏗️ 檔案結構

```
proposal/
├── BudgetProposalForm.tsx     # 261 行 — 提案建立/編輯表單
├── ProposalActions.tsx        # 362 行 — 狀態驅動的操作按鈕（最核心）
├── CommentSection.tsx         # 172 行 — 審批討論串
├── ProposalFileUpload.tsx     # 340 行 — 附件上傳（Azure Blob）
└── ProposalMeetingNotes.tsx   # 307 行 — 會議記錄管理
```

## 🎯 核心業務邏輯

### 狀態機（必須理解）

```
[Draft]
  │  submit (ProjectManager)
  ▼
[PendingApproval]
  ├─ approve       → [Approved]       (Supervisor / Admin)
  ├─ reject        → [Rejected]       (Supervisor / Admin)
  └─ requestInfo   → [MoreInfoRequired] (Supervisor / Admin)
      │
      │  update + submit (回到審批流)
      ▼
[PendingApproval]

[Approved] / [Rejected] / [MoreInfoRequired]
  │  revertToDraft (CHANGE-018, Admin/Supervisor)
  ▼
[Draft]
```

### ProposalActions.tsx — 狀態驅動 UI（最關鍵組件）

**依據兩個輸入決定顯示哪些按鈕**：
1. **當前狀態**：`Draft` / `PendingApproval` / `Approved` / `Rejected` / `MoreInfoRequired`
2. **當前用戶角色**：`ProjectManager` / `Supervisor` / `Admin`

**顯示矩陣**：

| 狀態 ↓ / 角色 → | ProjectManager | Supervisor / Admin |
|-----------------|---------------|-------------------|
| Draft | `Submit` | `Submit` + `Edit` |
| PendingApproval | 唯讀 | `Approve` + `Reject` + `Request Info` |
| Approved | 唯讀 | `Revert to Draft` (CHANGE-018) |
| Rejected | `Edit` + `Resubmit` | `Revert to Draft` |
| MoreInfoRequired | `Edit` + `Resubmit` | `Revert to Draft` |

### 其他組件重點

| 組件 | 重點 |
|------|------|
| **BudgetProposalForm** | 建立/編輯；綁定 Project；需驗證 budget 不超過 BudgetPool 剩餘額 |
| **CommentSection** | 審批討論；使用 `comment.create/list` API；支援 @ 提及（FEAT-X 規劃中）|
| **ProposalFileUpload** | 附件上傳至 Azure Blob Storage（`proposals` container）|
| **ProposalMeetingNotes** | 結構化會議記錄；採獨立 Prisma JSON 欄位儲存 |

## 🔗 依賴關係

- **API Router**: `packages/api/src/routers/budgetProposal.ts`（關鍵 procedures: `submit`, `approve`, `reject`, `requestMoreInfo`, `revertToDraft`）
- **Prisma Models**: `BudgetProposal` ← `Comment` / `History`
- **通知整合**: 狀態變更會觸發 `notification.ts` 產生對應通知（Epic 8）
- **路由**: `apps/web/src/app/[locale]/proposals/`

## ⚠️ 開發注意事項

1. **狀態轉換必須走 API**：不要嘗試直接 update `status` 欄位；必須呼叫對應 procedure（審計軌跡 + 通知會自動處理）
2. **RBAC 雙重檢查**：前端 UI 隱藏按鈕只是 UX；API 層 `supervisorProcedure` / `adminProcedure` 才是真實防線
3. **快取失效順序**：mutation 成功後需 invalidate：
   - `budgetProposal.getById`（當前提案）
   - `budgetProposal.getAll`（清單）
   - `notification.getMyNotifications`（若觸發通知）
   - `project.getBudgetUsage`（若 approve，預算池會變動）
4. **History 審計記錄**：每次狀態轉換 API 都會寫 `History` 表；前端不要另外寫
5. **Comment 與 Status 解耦**：評論可在任何狀態下新增（審批過程 or 已核准後）

## 🐛 已知陷阱

- **Bug #4/#5（已修復）**：快取更新時機不對導致 UI 顯示舊狀態 — 解法在 ProposalActions.tsx 的 `onSuccess` 內
- **revertToDraft 會清空審批意見**：CHANGE-018 設計為「回到初始狀態」，若需保留意見請用 Comment
- **CHANGE-020 之前**：ProposalFileUpload 未驗證檔案大小，可能上傳超大檔案卡住瀏覽器

## 🔄 相關變更歷史

- **Epic 3**: 基礎工作流實作
- **Epic 8**: 狀態變更自動發送通知
- **CHANGE-018**: 新增 `revertToDraft` 讓已核准/拒絕提案可重開
- **CHANGE-020**: 檔案上傳尺寸驗證
- **FIX-XXX**: 快取失效策略修正（詳見 `proposal/*.tsx` 的 JSDoc）
