# FEAT-015: Project Expense 月度模組 — 進度與實施記錄

> **建立日期**: 2026-06-02
> **狀態**: ✅ Phase 1 完成（實作 + E2E 驗證 + 獨立 migration）
> **對應**: `./01-requirements.md`、`./02-technical-design.md`、`./03-implementation-plan.md`

---

## 1. 完成狀態總覽

| Phase | 內容 | 狀態 |
|---|---|---|
| 1.1 | 資料模型（3 model + 反向關聯） | ✅ |
| 1.2 | 後端 `projectExpense` router（9 procedures + 三層彙總） | ✅ |
| 1.3 | 前端 5 組件（types + 4 規劃組件 + 容器） | ✅ |
| 1.4 | Project 詳情頁區塊整合 | ✅ |
| 1.5 | i18n 雙語（+77 keys） | ✅ |
| 1.6 | 驗證（typecheck/lint/validate:i18n + Playwright E2E） | ✅ |

---

## 2. 實際變更檔案

### packages/db
- `prisma/schema.prisma` — 新增 `ProjectExpense` / `ProjectExpenseItem` / `ProjectExpenseMonthly` 三 model；`Project`/`Currency`/`ExpenseCategory`/`OperatingCompany` 加反向關聯。

### packages/api
- `src/routers/projectExpense.ts`（新增）— 9 procedures，三層彙總回算 helper（`recomputeItemTotals` / `recomputeHeaderTotals`）+ `validateItemForeignKeys`，全 Zod。
- `src/root.ts` — 註冊 `projectExpense: projectExpenseRouter`。

### apps/web
- `src/components/project-expense/`（新增 6 檔）：
  - `types.ts` — 共用型別（對應 router 回傳形態）
  - `ProjectExpenseForm.tsx` — 表頭建立/編輯（react-hook-form + zod）
  - `ProjectExpenseItemList.tsx` — 明細清單（@dnd-kit 拖曳 + 類別/OpCo/雙幣別欄 + 總計）
  - `ProjectExpenseItemForm.tsx` — 明細 Modal 表單（CurrencySelect + 類別/OpCo 下拉）
  - `ProjectExpenseItemMonthlyGrid.tsx` — **12 月雙欄網格（預算 + 實際）**
  - `ProjectExpensePanel.tsx` — 容器（查詢 getByProject + 編排對話框 + reorder/delete mutation）
- `src/app/[locale]/projects/[id]/page.tsx` — 詳情頁底部全寬掛載 `<ProjectExpensePanel projectId={id} />`。
- `src/messages/{en,zh-TW}.json` — 新增 `projectExpenses` namespace（+77 keys）。

---

## 3. 與原規劃的差異 / 決策

1. **5 組件（規劃 4）**：新增容器 `ProjectExpensePanel`。OM 模組由獨立 detail page（`om-expenses/[id]/page.tsx`）編排；FEAT-015 掛在 Project 詳情頁，無專屬頁面，故需容器組件負責查詢/對話框/mutation 編排，保持頁面變更最小（僅 +1 import +1 區塊）。
2. **`createExpense` 僅建表頭**：明細由 `addItem` 另行新增（規劃曾列「可選 createWithItems」，v1 簡化為表頭單建，符合「先建表再加明細」UX）。
3. **`categoryId`/`opCoId` 可選**：依 02-tech §1 micro-decision，v1 刻意放寬（OM 明細 `opCoId` 必填）。
4. **掛載為「區塊」非「Tab」**：Project 詳情頁本身無 Tabs（堆疊 Cards），以全寬區塊掛於 grid 之後最 surgical（規劃為「Tab 或區塊」）。

---

## 4. 驗收標準達成（對齊 01-requirements §6）

- [x] 在專案下新增 ProjectExpense 費用表（設年度）→ 表下新增明細，設定幣別/費用類別/OpCo
- [x] 明細 12 月網格可分別填「月度預算」與「月度實際」並儲存
- [x] 明細年度預算/實際 = 對應 12 月加總（自動）；表頭 = 所有明細加總
- [x] 金額顯示為 USD 主值 +（有匯率時）換算次值（HKD 7.8 驗證正確）
- [x] 專案詳情頁可見此模組，且與既有 PO→Expense 預算使用卡片清楚分開、無相加
- [x] 明細可編輯（驗證預填 + 存檔保留彙總）；刪除/排序與 OM 同模式（API 已驗 typecheck，UI 未逐一點擊）
- [x] `db:generate`/`typecheck`/`lint`/`validate:i18n` 通過；schema 已補正式 migration（`migrate status` up to date，見 §5）

---

## 5. Migration（已補獨立 migration ✅）

- FEAT-015 schema 最初以 `prisma db push` 套用（dev DB 已有 3 表，E2E 驗證通過）。
- **背景**：FIX-141（commit `50c06aa`）刻意建立 **pre-FEAT-015** baseline（`00000000000000_init`，32 tables），其 commit 訊息已預告「FEAT-015 將由後續 migrate dev 產生獨立 migration」。
- **處理（經使用者選定「補獨立 migration」）**：
  - 以 `prisma migrate diff --from-schema-datamodel <pre-FEAT-015 schema> --to-schema-datamodel <當前 schema> --script` 產生 delta SQL（3 表 + 8 索引 + 唯一約束 + 6 FK）。
  - 寫入 `prisma/migrations/20260602110000_feat015_project_expense/migration.sql`。
  - 以 `prisma migrate resolve --applied` 標記（dev DB 已有表，**不重跑 SQL、無 reset、無資料遺失**）。
  - 驗證：`migrate status` → 2 migrations、up to date、無 drift。
  - commit：`a137df5`。
- **結果**：schema.prisma ↔ migrations 一致；新環境 `migrate deploy` 會建立含 FEAT-015 的完整 schema。
- **註**：FIX-141 在 DEVELOPMENT-LOG 的條目有一句「baseline 含 FEAT-015 三表（35 模型）」與其 commit 訊息（pre-FEAT-015、32 tables）及實際 init SQL（grep=0）不符 —— 屬 FIX-141 範圍的 stale 文字，本 FEAT 未擅改。

---

## 6. E2E 驗證摘要（Playwright，2026-06-02）

| 流程 | 結果 |
|---|---|
| 建費用表（2026 IT Operations / FY2026） | ✅ |
| 加明細（CLOUD 類別 / RHK OpCo / HKD 幣別） | ✅，自動建 12 月度 |
| 月度填 Jan(預算 10000 / 實際 8000) + Feb(6000 / 5000) → 存檔 | ✅ |
| 三層彙總（月度→明細→表頭） | ✅ 明細與表頭皆 Budget US$16,000 / Actual US$13,000 / 81.3% |
| 雙幣別（CHANGE-042） | ✅ US$16,000 (≈ HK$124,800)、US$13,000 (≈ HK$101,400)（匯率 7.8） |
| 與 PO→Expense Budget Usage 區隔 | ✅ 分開呈現、不相加（D11/R8） |
| edit-item（預填 + 存檔） | ✅ 預填正確；存後彙總保留 |

> 未經 UI 點擊驗證：reorder（拖曳，需 ≥2 明細）、removeItem、removeExpense —— 三者 wiring 與 OM 既有模組相同，且 router typecheck/lint 零錯誤。

---

## 7. 後續（Phase 2，不在本次）

- 與真實 Expense 對帳/帶入、跨專案月度 Summary 報表、月度 MoM 圖表（見 03-implementation-plan §6）。
