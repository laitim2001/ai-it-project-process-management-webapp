# FEAT-015: Project Expense 月度模組 — 技術設計

> **建立日期**: 2026-06-01
> **狀態**: 📋 設計中（Q-E~Q-G 已確認，見 01-requirements §5；資料模型依此定稿為三層）
> **對應需求**: `./01-requirements.md`

---

## 1. 資料模型變更（`packages/db/prisma/schema.prisma`）

> 採 01-requirements §5 **Q-E 確認**：以**獨立 `ProjectExpense` 表頭**，新增 **3 張表**（表頭 + 明細 + 月度），與 OM 三層一致。比照 OM 但**月度多一個 `budgetAmount`**（D12），且明細加 `categoryId`/`opCoId`（Q-F）、年度放表頭（Q-G）。改後跑 `pnpm db:migrate` + `pnpm db:generate`。

```prisma
// 專案費用表頭（Q-E：獨立表頭，支援一專案多份費用表）
model ProjectExpense {
  id            String   @id @default(uuid())
  projectId     String
  name          String                              // 費用表名稱（如「2026 年度 IT 維運」）
  description   String?  @db.Text
  financialYear Int                                 // 年度（Q-G：放表頭，比照 OM）

  // 由所有明細加總自動維護（API 層計算寫入）
  totalBudgetAmount Float @default(0)               // = Σ items.totalBudgetAmount
  totalActualSpent  Float @default(0)               // = Σ items.totalActualSpent

  project       Project              @relation(fields: [projectId], references: [id], onDelete: Cascade)
  items         ProjectExpenseItem[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([projectId])
  @@index([financialYear])
}

// 專案費用明細（掛在表頭下；Q-F：加 categoryId / opCoId）
model ProjectExpenseItem {
  id               String  @id @default(uuid())
  projectExpenseId String
  name             String                            // 明細名稱
  description      String? @db.Text
  currencyId       String?                           // 次要顯示幣別（金額仍存 USD）
  categoryId       String?                           // 費用類別（Q-F，FK→ExpenseCategory；v1 可選）
  opCoId           String?                           // OpCo（Q-F，FK→OperatingCompany；v1 可選）
  sortOrder        Int     @default(0)               // 拖曳排序（比照 OM）

  // 由 12 月加總自動維護（API 層計算寫入，前端不可直接寫）
  totalBudgetAmount Float  @default(0)               // = Σ monthly.budgetAmount
  totalActualSpent  Float  @default(0)               // = Σ monthly.actualAmount

  projectExpense   ProjectExpense    @relation(fields: [projectExpenseId], references: [id], onDelete: Cascade)
  currency         Currency?         @relation(fields: [currencyId], references: [id])
  category         ExpenseCategory?  @relation(fields: [categoryId], references: [id])
  opCo             OperatingCompany? @relation(fields: [opCoId], references: [id])
  monthly          ProjectExpenseMonthly[]

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([projectExpenseId])
  @@index([currencyId])
  @@index([categoryId])
  @@index([opCoId])
}

// 月度記錄（每個明細 12 筆；比 OM 多 budgetAmount）
model ProjectExpenseMonthly {
  id                   String   @id @default(uuid())
  projectExpenseItemId String
  month                Int                          // 1-12
  budgetAmount         Float    @default(0)         // 月度預算（USD）— OM 月度沒有此欄位
  actualAmount         Float    @default(0)         // 月度實際（USD）

  item                 ProjectExpenseItem @relation(fields: [projectExpenseItemId], references: [id], onDelete: Cascade)

  @@unique([projectExpenseItemId, month])           // 每明細每月唯一（比照 OM）
  @@index([projectExpenseItemId])
}

model Project {
  // ... 既有 ...
  projectExpenses ProjectExpense[]
}

model Currency {
  // ... 既有 ...
  projectExpenseItems ProjectExpenseItem[]
}

model ExpenseCategory {
  // ... 既有 ...
  projectExpenseItems ProjectExpenseItem[]
}

model OperatingCompany {
  // ... 既有 ...
  projectExpenseItems ProjectExpenseItem[]
}
```

> **與 OM 的差異 1（月度預算）**：OM `OMExpenseMonthly` 只有 `actualAmount`；此處月度同時有 `budgetAmount` + `actualAmount`（D12）。OM 的「預算」在明細層（`OMExpenseItem.budgetAmount`），此處因預算也按月，故明細 `totalBudgetAmount` 改由月度加總、表頭再彙總明細。
> **與 OM 的差異 2（類別位置）**：Q-F 把 `categoryId` 放在**明細**（OM 的類別在表頭 `OMExpense.categoryId`）。若你其實想把類別放表頭，請告知改回。
> **v1 micro-decision**：`categoryId`/`opCoId` 設為**可選（nullable）**以降低填寫負擔（OM 明細 `opCoId` 為必填，此處刻意放寬）。若要改必填請告知。

---

## 2. API 設計（tRPC，新 router `projectExpense.ts`）

比照 `omExpense.ts` 的 procedure 形態（三層）：

| Procedure | 權限 | 說明 |
|---|---|---|
| `getByProject` | protected | 取某專案的所有**費用表（表頭）**，含明細、月度、currency/category/opCo |
| `createExpense` | protected | 新增表頭（projectId/name/financialYear）；可同時帶首批明細（比照 OM `createWithItems`） |
| `updateExpense` | protected | 更新表頭（name/description/financialYear） |
| `removeExpense` | protected | 刪除表頭（級聯刪明細與月度） |
| `addItem` | protected | 於某**表頭（projectExpenseId）**下新增明細；transaction 內自動建立 12 筆月度（budget=0, actual=0） |
| `updateItem` | protected | 更新明細基本資訊（name/currencyId/categoryId/opCoId） |
| `removeItem` | protected | 刪除明細（級聯刪月度） |
| `reorderItems` | protected | 明細排序（傳 `[{id, sortOrder}]`，比照 OM `reorderItems`） |
| `updateItemMonthlyRecords` | protected | 一次更新某明細 12 個月的 `{month, budgetAmount, actualAmount}`；同 transaction 重算明細 + 表頭彙總 |
| `getMonthlyTotals`（選用） | protected | 某專案/年度的月度彙總（為 Phase 2 報表預留） |

> **Zod**：`updateItemMonthlyRecords` 的 `monthlyData` 為長度 12 陣列，每元素 `{ month: 1..12, budgetAmount: number>=0, actualAmount: number>=0 }`（比照 OM 的 `.length(12)` 約束）。
> **彙總維護**：明細 `totalBudgetAmount`/`totalActualSpent` = 該明細 12 月加總；表頭 `totalBudgetAmount`/`totalActualSpent` = 其所有明細加總（皆由 API 層維護，前端不可直接寫）。
> **業務邏輯一律在 `packages/api`**；金額存 USD（不在此做換算，換算只在前端顯示層）。

---

## 3. 前端設計（比照 `components/om-expense/`）

| 新組件（建議 `components/project-expense/`） | 對應 OM 組件 | 差異 |
|---|---|---|
| `ProjectExpenseForm.tsx` | `OMExpenseForm.tsx` | **表頭**建立/編輯（name/年度）；建立時可附首批明細 |
| `ProjectExpenseItemList.tsx` | `OMExpenseItemList.tsx` | 明細清單 + 拖曳排序 + 月度展開 |
| `ProjectExpenseItemMonthlyGrid.tsx` | `OMExpenseItemMonthlyGrid.tsx` | **每月兩欄**：預算 + 實際（OM 只有實際） |
| `ProjectExpenseItemForm.tsx` | `OMExpenseItemForm.tsx` | 明細 Modal 表單（含 `CurrencySelect` + 費用類別 + OpCo 選擇器） |

- 掛載點：**Project 詳情頁**（`projects/[id]/page.tsx`）新增一個 Tab / 區塊，內含一或多張費用表（表頭）。
- 金額顯示：重用 **CHANGE-042** 的 `convertFromUSD` + 雙幣別顯示組件（`US$ (≈ 次值)`）。
- **與既有預算使用卡片並存且明確區隔**（D11/R8）：標題清楚標示「Project Expense（月度手填）」vs 既有「實際支出（來自採購/費用單據）」，**畫面與計算都不相加**。
- mutation 按鈕用 `LoadingButton`；錯誤用 `code`/`cause.reason`。

---

## 4. 月度自動彙總邏輯

```
updateItemMonthlyRecords(itemId, monthlyData[12]):
  $transaction:
    1. upsert 12 筆 ProjectExpenseMonthly（依 itemId+month）
    2. 明細：totalBudgetAmount = Σ budgetAmount；totalActualSpent = Σ actualAmount
       → update ProjectExpenseItem.{totalBudgetAmount, totalActualSpent}
    3. 表頭：回算 ProjectExpense.{totalBudgetAmount, totalActualSpent}
       = Σ 該表頭所有明細的對應欄位
```

> 比照 OM `updateItemMonthlyRecords` 的「批量更新 + 重算明細彙總」模式（`omExpense.ts:1510` 一帶），此處多一層表頭彙總回算。

---

## 5. 影響範圍

- **Schema**: +3 model（ProjectExpense / ProjectExpenseItem / ProjectExpenseMonthly）、`Project`/`Currency`/`ExpenseCategory`/`OperatingCompany` 加反向關聯 → **需 migration**
- **API**: 新 `projectExpense` router（表頭 + 明細 + 月度 procedures；註冊到 `root.ts`）
- **前端**: 新 `components/project-expense/` 4 組件（表頭 + 明細清單 + 明細表單 + 月度網格）+ Project 詳情頁 Tab
- **i18n**: 表頭 / 明細 / 月度網格 / Tab 標題等 key（雙語）
- **重用**: CHANGE-042 貨幣換算與顯示；OM 三層 UI 模式
- **不影響**: PO→Expense 既有流程與 `project.getBudgetUsage`（v1 不動、不相加）

---

## 6. 風險與緩解

| 風險 | 緩解 |
|---|---|
| 與 PO→Expense 重複計算造成「雙倍支出」誤解 | UI/計算嚴格分離兩來源、永不相加（R8/D11）；明確標籤；文件註明對帳屬 Phase 2 |
| 大量手填月度的資料一致性 | 沿用 OM 的「恆 12 筆 + 唯一約束 + transaction 重算」模式 |
| 與 OM 模組程式碼重複 | 共用貨幣顯示與排序模式；資料表刻意獨立（兩種費用類型，決策 #12） |
| 三層彙總（月度→明細→表頭）一致性 | 彙總一律在 API transaction 內回算，前端不可寫；表頭數值為純計算值 |

---

## 7. 相關文檔

- 需求：`./01-requirements.md` | 批次總覽：`1-planning/roadmap/2026-06-expense-approval-batch.md`（D10~D12）
- 架構參考：`FEAT-007`、`routers/omExpense.ts`、`components/om-expense/CLAUDE.md`
- 重用：`CHANGE-042`（貨幣換算與雙幣別顯示）
