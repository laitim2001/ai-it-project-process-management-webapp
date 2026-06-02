# CHANGE-043: Budget Proposal 會議記錄欄位擴充

> **建立日期**: 2026-06-01
> **完成日期**: 2026-06-02
> **狀態**: ✅ 已完成
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

- [x] 會議記錄編輯器可選 Type（BudgetProposal/Payment）、選 Vendor、填 Docuware 連結、填 Review notes（瀏覽器端到端驗證：填寫→存檔→refetch 後顯示模式正確呈現）
- [ ] ~~Requested / Approved 金額在 UI 標示為 USD~~ → **未做**（移至待辦：amount/approvedAmount 顯示於提案詳情 header，非會議記錄 block；屬獨立小調整）
- [x] Docuware 連結可點開新分頁（`target=_blank rel=noopener`）；非法 URL 由 Zod `.url()` 驗證 + toast 提示
- [x] 既有 proposals 不受影響（proposalType 預設 `BudgetProposal`、其餘 nullable 為 null）
- [x] Schema 已套用至 dev DB（改用 `prisma db push`，見 §8）；`pnpm validate:i18n` 通過（2717 keys）；本變更檔案 `typecheck` 零新增錯誤

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

---

## 8. 實施記錄（2026-06-02）

### 8.1 實際變更檔案
- `packages/db/prisma/schema.prisma` — `BudgetProposal` +4 欄位（`proposalType` 預設 BudgetProposal、`vendorId` FK、`reviewNotes` Text、`documentLink`）+ `vendor` 關聯 + `@@index([vendorId])`；`Vendor` +`budgetProposals` 反向關聯
- `packages/api/src/routers/budgetProposal.ts` — 新增 `proposalTypeEnum`；`getById` include `vendor`；`updateMeetingNotes` 收納 4 個新欄位（input + data + include vendor）
- `apps/web/src/components/proposal/ProposalMeetingNotes.tsx` — 加入 Type 下拉、Vendor 下拉（取 `vendor.getAll`）、Review notes、Document link（含顯示模式 + 編輯模式 + 可點外連）
- `apps/web/src/app/[locale]/proposals/[id]/page.tsx` — 傳入 4 個新 props（含 `vendor?.name`）
- `apps/web/src/messages/{en,zh-TW}.json` — `proposals.meeting.fields` 新增 type/vendor/reviewNotes/documentLink（+11 keys）

### 8.2 與原規劃的差異 / 決策
- **欄位歸屬**：4 個新欄位全部放入「會議記錄」編輯器（`ProposalMeetingNotes` + `updateMeetingNotes`），主 create/update 表單**未動**（外科手術；符合使用者「會議記錄欄位」的語意）。
- **Schema 套用方式改為 `prisma db push`**（經使用者確認）：`prisma migrate dev` 因 repo **缺少初始 migration**，shadow DB 重放至 `20251126100000_add_currency` 時報 `BudgetPool 表不存在` 而失敗（既有基礎設施問題，非本變更造成）。純新增欄位用 db push 非破壞性套用，符合本專案既有實務（migrations 不完整 + SCHEMA-SYNC 機制供 Azure）。
- **db push 後 `prisma generate` 在 Windows 遇 EPERM**（dev server 鎖住 query engine DLL）→ 暫停 dev server → generate 成功 → 重啟 dev server。

### 8.3 待辦 / 未做
- 🟡 **amount/approvedAmount 的「(USD)」標籤**未做：這兩個金額顯示於提案詳情 header（非會議記錄 block），屬獨立小 UI 調整，建議後續 CHANGE 或併入相關頁面整理時處理。
- 🟡 **Migration baseline 缺失**為既有基礎設施債：`prisma migrate dev` 目前無法乾淨運作（缺 init migration）。建議獨立 chore/FIX：用 `prisma migrate diff` 補建 baseline，恢復正規 migration 流程。

### 8.4 驗證
- **瀏覽器端到端**（Playwright，admin）：於 `proposal-cloud-001` 會議記錄分頁，設 Type=Payment、Vendor=Microsoft Taiwan、填日期/介紹人/記錄/行動項/Docuware 連結 → 存檔 → refetch 後顯示模式完整呈現全部欄位，Docuware 連結可點開。
- **靜態**：`validate:i18n` 通過（2717 keys 一致）；`budgetProposal.ts` 與 `ProposalMeetingNotes.tsx` typecheck 零 error（`proposals/[id]/page.tsx:149` 的 `role` 錯誤為全站既有 User 型別問題，非本變更）。
