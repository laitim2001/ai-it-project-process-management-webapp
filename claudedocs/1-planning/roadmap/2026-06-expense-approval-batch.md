# 2026-06 規劃批次：費用 / 審批 / 貨幣 總覽

> **建立日期**: 2026-06-01
> **最後更新**: 2026-06-01
> **狀態**: 📋 規劃中（等待使用者確認分類與順序）
> **作用**: 本批次源自一份使用者原始需求清單（6 條），經逐條釐清後拆分為 2 個 CHANGE + 2 個 FEAT（+ 1 個 backlog FEAT）。本文件為**導航與依賴中樞**，細節指向各自的規劃文件。

---

## 1. 原始需求 → 分類對照

| 原始需求（使用者語言） | 釐清後結論 | 分類 | 編號 | 規劃文件 |
|---|---|---|---|---|
| OM expense 貨幣單位要改成 USD（附截圖：同頁 US$ / HK$ 不一致） | 金額一律存 USD（主值）；依明細 `currencyId` 換算顯示次值（如 HKD）；補回 CHANGE-037 漏改的月度網格 | **CHANGE** | CHANGE-042 | `4-changes/feature-changes/CHANGE-042-om-expense-dual-currency-display.md` |
| Budget Proposal 加「會議記錄」6 欄位 | 在既有 `BudgetProposal` 補欄位（Type / Vendor / Docuware link / Review notes；Requested/Approved 已存在） | **CHANGE** | CHANGE-043 | `4-changes/feature-changes/CHANGE-043-budget-proposal-meeting-minutes-fields.md` |
| 可配置 BP 審批流程（多審批人 + 可調順序） | 新模組：可配置**序列**審批流，審批人用**角色**判定，僅 Admin 可配置；支援按金額/類型套用不同流程（第二階段） | **FEAT** | FEAT-014 | `1-planning/features/FEAT-014-configurable-approval-workflow/` |
| 主管專屬「待審 BP 會議記錄」視圖 | 併入 FEAT-014（是審批流資料的消費端，獨立無意義）；用**角色**判定 | **FEAT-014 Phase** | FEAT-014 | 同上 |
| Project Expense 模組（且要考慮與其他模組關係） | 新模組，比照 OM Expense 三層，源頭錨定 Project；月度同時管理**預算 + 實際** | **FEAT** | FEAT-015 | `1-planning/features/FEAT-015-project-expense-monthly/` |
| （從審批需求衍生）一人多角 | 確認延後，獨立 FEAT，與 FEAT-014 解耦 | **FEAT（backlog）** | FEAT-016 | 暫不開資料夾，僅在此登記 |

> **編號依據**：`docs/10-ai-assistant/03-dev-workflow.md` §2 現況（FEAT~013 / CHANGE~041 / FIX~139），接續取下一個。

---

## 2. 已對齊的關鍵決策（討論結論存證）

| # | 主題 | 決策 |
|---|---|---|
| D1 | 系統幣別策略 | **USD 為主要記帳幣別**，所有金額**存 USD** |
| D2 | OM 次要幣別 | 跟明細的 `currencyId` 走（OM 場景多為 HKD；截圖那筆為 TWD） |
| D3 | 換算來源 | 重用既有 `/settings/currencies` 的 `Currency.exchangeRate`，**不另做貨幣模組**；語意定為 **1 USD = exchangeRate × 該幣別** |
| D4 | 次值顯示樣式 | `US$500,000 (≈ HK$3,900,000)`；缺匯率時優雅降級只顯示 USD |
| D5 | BP 會議記錄 | 在 `BudgetProposal` 補欄位（非新實體）；BP 一律以 **USD** 記錄 |
| D6 | BP Type 欄位 | 「BudgetProposal / Payment」先做成**可選欄位**，暫不真正連到 Expense |
| D7 | 審批流程形態 | **序列式**；審批人用**角色**判定（每步「該角色任一人核准即過」）；僅 **Admin** 可配置 |
| D8 | 審批規則引擎 | 「按金額門檻 / 專案類型套用不同流程」列為 **FEAT-014 第二階段** |
| D9 | 一人多角 | **延後**；FEAT-014 先用單角色上線，多角色另立 FEAT-016 |
| D10 | Project Expense 形態 | 比照 OM 自成一格、手填月度；**與 PO→Expense 是「同一筆錢的兩種記法」** |
| D11 | Project Expense v1 對帳 | v1 各自獨立、**任何地方不得相加**、不自動同步、不約束 `approvedBudget`；對帳留未來版本 |
| D12 | Project 月度欄位 | 月度同時有 `budgetAmount` + `actualAmount`（比 OM 月度多一個預算欄位） |

---

## 3. 依賴關係與建議實施順序

```
群組 0（最小、可先落地，獨立）：
  ① CHANGE-042  OM 雙幣別顯示 + 換算層        ── 前置：Admin 在 /settings/currencies 填好 exchangeRate

群組 A（會議記錄 → 審批 → 主管視圖）：
  ② CHANGE-043  BP 會議記錄欄位               ── 可獨立先上線，提供即時價值
        └─► ③ FEAT-014  可配置序列審批流（含 #4 主管待審視圖）
                   Phase 1 不阻塞於 CHANGE-043；proposalType 僅 Phase 2 規則引擎需要
                   Phase 1：單一序列流程 + 角色判定 + 待審視圖
                   Phase 2：規則引擎（金額/類型 → 不同流程，依賴 proposalType）

群組 B（與群組 A 可並行）：
  ④ FEAT-015  Project Expense 月度模組（含 #1 月度預算+實際）
                   獨立於群組 A；可與 ②③ 並行開發

Backlog（與上述解耦）：
  ⑤ FEAT-016  一人多角（multi-role）——影響權限全身，獨立排程
```

**建議落地順序**：① CHANGE-042 → ② CHANGE-043 →（③ FEAT-014 與 ④ FEAT-015 並行）→ ⑤ FEAT-016（未來）。

---

## 4. 跨項目共用資產（避免重複造輪）

| 資產 | 由誰建立 | 誰重用 |
|---|---|---|
| 貨幣換算 helper（`convertFromUSD`）+ 雙幣別顯示組件 | CHANGE-042 | FEAT-015（Project Expense 金額顯示） |
| OM Expense 三層 + 月度網格 UI 模式（`OMExpenseItem*`） | FEAT-007（已存在） | FEAT-015 比照沿用 |
| 既有 `Vendor` model / `CurrencyDisplay` / `CurrencySelect` | 既有 | CHANGE-042、CHANGE-043 |
| 審批進度資料模型 | FEAT-014 | FEAT-014 Phase（主管視圖）；未來 FEAT-016 自然延伸 |

---

## 5. 相關文檔

- 權威流程：`docs/10-ai-assistant/03-dev-workflow.md`
- 文檔規範：`.claude/rules/documentation.md`、`claudedocs/CLAUDE.md`
- 既有相關：`CHANGE-037`（OM 幣別 HK$→US$，本批次 CHANGE-042 取代其硬編碼做法）、`FEAT-007`（OM 三層架構）、`FEAT-011`（權限系統）
