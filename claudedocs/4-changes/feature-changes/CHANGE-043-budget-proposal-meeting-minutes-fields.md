# CHANGE-043: Budget Proposal 會議記錄欄位擴充

> **建立日期**: 2026-06-01
> **完成日期**: —
> **狀態**: 📋 設計中
> **優先級**: Medium
> **類型**: 現有功能增強
> **前置依賴**: 無（為 FEAT-014 的前置：提供 `proposalType` 供審批規則比對、會議記錄為審議單位）

---

## 1. 變更概述

在既有 `BudgetProposal` 上補齊「會議記錄」所需欄位。經盤點，6 個目標欄位中**已有 3 個**（會議日期/記錄/介紹人）+ 申請/批准金額；本變更補上**缺的 4 個**（Type、Vendor、Review notes、Docuware 連結）。

> **決策依據**：D5（在 BudgetProposal 補欄位，非新建實體）、D6（Type 先做可選欄位，暫不連 Expense）。

### 目標欄位對照（使用者原始 6 欄）

| 原始欄位 | 現況 | 本次處理 |
|---|---|---|
| i) Budget Proposal or Payment (Type) | ❌ 無 | **新增** `proposalType`（enum，可選；預設 BudgetProposal） |
| ii) Requested $ amount (USD) | ✅ 既有 `amount` | 沿用；UI 標示為 USD（D5） |
| iii) Vendor name (Pay to) | ❌ 無 | **新增** `vendorId`（FK→Vendor，可選） |
| iv) Approved $ amount | ✅ 既有 `approvedAmount` | 沿用 |
| v) Review notes (action items) | ⚠️ 有 `meetingNotes`（會議摘要，語意不同） | **新增** `reviewNotes`（與 meetingNotes 分開：行動項 vs 會議摘要） |
| vi) Link of BP / Payment (Docuware) | ❌ 無 | **新增** `documentLink`（URL 字串，可選） |

> 既有相關欄位：`meetingDate`、`meetingNotes`、`presentedBy`（FEAT 期已存在，由 `ProposalMeetingNotes` 組件 + `updateMeetingNotes` 維護）。

---

## 2. 功能需求

| ID | 需求 |
|---|---|
| R1 | BudgetProposal 新增 `proposalType`（`BudgetProposal` / `Payment`），可選，預設 `BudgetProposal`；UI 為下拉。暫不與 Expense 建立關聯（D6）。 |
| R2 | 新增 `vendorId`（FK→Vendor，nullable），UI 為可搜尋的 Vendor 下拉（沿用既有 Vendor 選擇模式）。 |
| R3 | 新增 `reviewNotes`（長文字，nullable）作為「Review notes / action items」，與既有 `meetingNotes` 並存且語意分離。 |
| R4 | 新增 `documentLink`（字串 URL，nullable），UI 顯示為可點外連（`target=_blank` + `rel=noopener`）。 |
| R5 | `amount`（requested）與 `approvedAmount` 在 UI 明確標示為 **USD**（D5）。 |
| R6 | 以上欄位納入既有的會議記錄編輯流程（`ProposalMeetingNotes` 組件 / `updateMeetingNotes` procedure 或就近擴充）。 |

---

## 3. 技術設計

### 3.1 Schema 變更（`packages/db/prisma/schema.prisma` → 需 migration）

於 `model BudgetProposal` 新增：

```prisma
model BudgetProposal {
  // ... 既有欄位 ...
  proposalType  String   @default("BudgetProposal") // 'BudgetProposal' | 'Payment'（D6：暫為純選擇欄位）
  vendorId      String?  // iii) Pay to
  reviewNotes   String?  @db.Text // v) Review notes / action items（與 meetingNotes 分離）
  documentLink  String?  // vi) Docuware 連結（URL）

  vendor        Vendor?  @relation(fields: [vendorId], references: [id])
  // ... 既有關聯 ...

  @@index([vendorId])
}

model Vendor {
  // ... 既有欄位 ...
  budgetProposals BudgetProposal[] // 反向關聯
}
```

> 遵循 `database.md`：枚舉用 String（非 Prisma enum），實際值在 API 層用 Zod enum 約束；外鍵建索引；長文字用 `@db.Text`。改 schema 後跑 `pnpm db:migrate` + `pnpm db:generate`。

### 3.2 API 變更（`packages/api/src/routers/budgetProposal.ts`）

- Zod：新增 `proposalTypeEnum = z.enum(['BudgetProposal','Payment'])`。
- `create` / `update` schema 增加 `proposalType?`、`vendorId?`、`reviewNotes?`、`documentLink?`（皆可選，`documentLink` 用 `z.string().url().optional()`）。
- 擴充 `updateMeetingNotes`（或新增 `updateProposalDetails`）以收納 vendor / reviewNotes / documentLink / proposalType。
- 關鍵操作沿用既有 History 記錄慣例。

### 3.3 前端變更

- `components/proposal/BudgetProposalForm.tsx`：新增 Type 下拉、Vendor 下拉、Docuware link 輸入。
- `components/proposal/ProposalMeetingNotes.tsx`：新增 `reviewNotes` 欄位；金額標示 USD；顯示 Vendor 與 Docuware 外連。
- 提交按鈕（mutation 觸發）一律用 `LoadingButton`（components.md 規範）。
- 錯誤處理：如 `documentLink` URL 驗證失敗，用 `code`/`cause.reason` 而非 message 比對（backend-api.md 規範）。

---

## 4. 影響範圍

- **Schema**: `BudgetProposal`（+4 欄位、+vendor 關聯）、`Vendor`（+反向關聯）→ **需 migration**
- **API**: `budgetProposal.ts`（create/update/meeting notes procedures + Zod）
- **前端**: `BudgetProposalForm.tsx`、`ProposalMeetingNotes.tsx`，可能含 proposal 詳情頁顯示
- **i18n**: Type 選項、Vendor 標籤、Review notes、Docuware link 等 key（雙語同步）
- **資料**: 既有 proposals 的 `proposalType` 取預設值 `BudgetProposal`，其餘 nullable 欄位為 null（向後相容）

---

## 5. 驗收標準

- [ ] 新增/編輯 BP 可選 Type（BudgetProposal/Payment）、選 Vendor、填 Docuware 連結、填 Review notes
- [ ] Requested / Approved 金額在 UI 標示為 USD
- [ ] Docuware 連結可點開新分頁；非法 URL 有友善錯誤
- [ ] 既有 proposals 不受影響（proposalType 預設、其餘 null）
- [ ] `pnpm db:migrate` + `pnpm db:generate` 成功；`pnpm typecheck` / `pnpm lint` / `pnpm validate:i18n` 通過

---

## 6. 實施計劃

1. Schema 加 4 欄位 + vendor 關聯 → 驗證：`pnpm db:migrate` + `db:generate` 無誤
2. API create/update/meetingNotes 擴充 + Zod → 驗證：`pnpm typecheck`
3. 表單與會議記錄組件加欄位 → 驗證：瀏覽器手動新增/編輯一筆 BP 並存檔
4. i18n 雙語 key → 驗證：`pnpm validate:i18n`

---

## 7. 相關文檔

- 批次總覽：`1-planning/roadmap/2026-06-expense-approval-batch.md`（D5、D6）
- 後續依賴：`FEAT-014`（審批流程以本變更的 `proposalType` 做規則比對；會議記錄為審議與審批單位）
- 既有資產：`components/proposal/ProposalMeetingNotes.tsx`、`routers/budgetProposal.ts`、`model Vendor`
