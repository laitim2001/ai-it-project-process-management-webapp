# FEAT-015: Project Expense 月度模組（按月管理預算 + 實際）

> **建立日期**: 2026-06-01
> **最後更新**: 2026-06-02
> **狀態**: ✅ Phase 1 完成（實作 + E2E 驗證 + 獨立 migration，見 `./04-progress.md`）
> **優先級**: High
> **前置依賴**: CHANGE-042（重用貨幣換算 helper 與雙幣別顯示組件）
> **參考實作**: FEAT-007（OM Expense 表頭-明細-月度三層架構）

---

## 1. 功能概述

目前**專案完全沒有「按月」維度**：專案預算掛在 `Project.requestedBudget/approvedBudget`（年度層級），實際支出則是即時聚合 `Project → PurchaseOrder → Expense`（無月度分解）。

本 FEAT 為專案新增一個**比照 OM Expense 三層架構的月度費用模組**：`Project → ProjectExpense（表頭）→ ProjectExpenseItem（明細）→ ProjectExpenseMonthly（月度）`。一個 Project 可有多份費用表（表頭），每張表含多個明細，每個明細有 **12 個月的「預算」與「實際」**（原始需求 #1：兩者都要）。

> **核心決策**（批次總覽 D10~D12）：
> - 比照 OM 自成一格、手填月度（D10）
> - 與 PO→Expense 是「同一筆錢的兩種記法」，**v1 各自獨立、任何地方不得相加、不自動同步、不約束 `approvedBudget`**（D11）
> - 月度同時有 `budgetAmount` + `actualAmount`（比 OM 月度多一個預算欄位）（D12）
> - OM 與 Project 是**兩種不同費用類型**，模組各自獨立、不合併（決策 #12）

---

## 2. 功能需求

| ID | 需求 |
|---|---|
| R1 | 一個 Project 可有多份 **ProjectExpense 費用表（表頭：名稱、年度 financialYear）**（Q-E）；每張表含多個 **明細（名稱、幣別 currencyId、費用類別 categoryId、OpCo opCoId）**（Q-F） |
| R2 | 每個明細有 **12 個月**的記錄，每月含 **`budgetAmount`（月度預算）+ `actualAmount`（月度實際）**（D12） |
| R3 | 提供 **12 月網格 UI**（比照 `OMExpenseItemMonthlyGrid`），可一次編輯一個明細的 12 個月預算與實際 |
| R4 | 金額一律以 **USD 儲存**，顯示沿用 CHANGE-042 的「USD 主值 + 依 currencyId 換算次值」 |
| R5 | 明細支援新增 / 編輯 / 刪除 / 排序（比照 OM `addItem`/`updateItem`/`removeItem`/`reorderItems`） |
| R6 | 在 **Project 詳情頁**以分頁（Tab）或區塊呈現此月度模組 |
| R7 | 明細層自動彙總：明細年度預算 = 12 月 budget 加總；年度實際 = 12 月 actual 加總（由 API 維護，比照 OM 計算值） |
| R8 | **不得與 PO→Expense 聚合的實際支出相加**；專案詳情頁須明確區分兩個來源（D11） |

---

## 3. 與其他模組的關係（關鍵，原始需求明確點出）

| 模組 | 關係 | v1 處理 |
|---|---|---|
| **PO → Expense（既有實際支出）** | 「同一筆錢的兩種記法」（D10/D11） | **各自獨立顯示、不相加、不自動同步**；對帳留未來版本 |
| **Project.approvedBudget** | 概念上專案核定預算 | v1 **不約束**月度預算總和需等於它（D11） |
| **OM Expense** | 不同費用類型（營運維護 vs 專案性） | 完全獨立的模組，僅**沿用架構模式與貨幣顯示**，不共用資料表 |
| **CHANGE-042 貨幣** | 顯示一致性 | 重用其 `convertFromUSD` + 雙幣別顯示組件 |

---

## 4. 範圍與分階段

| 階段 | 內容 | 對應需求 |
|---|---|---|
| **Phase 1** | 資料模型（表頭+明細+月度）+ 表頭/明細 CRUD/排序 + 12 月網格（預算+實際）+ Project 詳情頁 Tab + 雙幣別顯示 | R1–R7 |
| **Phase 2（未來）** | 與真實 Expense 的對帳/帶入、跨專案月度 Summary 報表、月度圖表（MoM） | — |

**明確排除（v1）**：自動同步 PO→Expense、把兩個來源相加成單一「實際」、月度預算與 approvedBudget 的強制校驗。

---

## 5. 已確認決策（技術設計依此定稿）

- **Q-E（是否獨立表頭）**：**需要獨立的「表頭」表 `ProjectExpense`**。完整三層 `ProjectExpense → ProjectExpenseItem → ProjectExpenseMonthly`（與 OM 結構一致），支援同一專案有多份費用表（分版本/分情境）。
- **Q-F（明細維度）**：**明細加上 `categoryId`（費用類別，FK→ExpenseCategory）與 `opCoId`（OpCo，FK→OperatingCompany）**，比照 OM 維度。v1 兩者皆設為**可選（nullable）**以降低填寫負擔（OM 明細 `opCoId` 為必填，此處刻意放寬；若要改必填請告知）。
- **Q-G（年度位置）**：**年度 `financialYear` 放表頭**（比照 OM `OMExpense.financialYear`）；跨年度時為同一專案建立多張表頭。

---

## 6. 驗收標準（Phase 1）

- [x] 在某專案下新增 ProjectExpense 費用表（表頭，設年度），再於表下新增明細，設定幣別/費用類別/OpCo
- [x] 該明細 12 月網格可分別填「月度預算」與「月度實際」並儲存
- [x] 明細年度預算/實際 = 對應 12 月加總（自動）
- [x] 金額顯示為 USD 主值 +（有匯率時）換算次值
- [x] 專案詳情頁可見此模組，且與既有 PO→Expense 預算使用卡片**清楚分開、無相加**
- [x] 明細可編輯/刪除/排序（編輯已 E2E 驗證；刪除/排序與 OM 同模式，typecheck 通過）
- [x] `db:generate`/`typecheck`/`lint`/`validate:i18n` 通過；已補正式 migration（`migrate status` up to date，見 `./04-progress.md` §5）

---

## 7. 相關文檔

- 批次總覽：`1-planning/roadmap/2026-06-expense-approval-batch.md`（D10~D12）
- 技術設計：`./02-technical-design.md`
- 架構參考：`FEAT-007`（OM 三層）、`components/om-expense/CLAUDE.md`
- 重用：`CHANGE-042`（貨幣換算與顯示）
