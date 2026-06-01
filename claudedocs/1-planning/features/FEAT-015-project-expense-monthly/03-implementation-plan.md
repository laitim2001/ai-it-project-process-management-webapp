# FEAT-015: Project Expense 月度模組 — 實施計劃

> **建立日期**: 2026-06-01
> **狀態**: 📋 計劃中
> **版本**: 1.0
> **對應**: `./01-requirements.md`、`./02-technical-design.md`
> **流程依據**: `docs/10-ai-assistant/03-dev-workflow.md`（5 步流程 + 紅線 + 分支策略）

---

## 1. 實施概覽

### 1.1 範圍（本計劃只涵蓋 Phase 1）

Phase 1 = 資料模型（表頭+明細+月度）+ 表頭/明細 CRUD/排序 + 12 月網格（預算+實際）+ Project 詳情頁 Tab + 雙幣別顯示（需求 R1–R7）。
**Phase 2（對帳/帶入、跨專案月度報表、MoM 圖表）不在本計劃**，見 §6。

### 1.2 已定稿決策（驅動以下任務，見 01-requirements §5）

| 決策 | 落地方式 |
|---|---|
| Q-E **獨立表頭 `ProjectExpense`** | 完整三層 `ProjectExpense → ProjectExpenseItem → ProjectExpenseMonthly`，含表頭 CRUD + 表單 |
| Q-F **明細加 `categoryId`/`opCoId`** | 明細 FK→ExpenseCategory / OperatingCompany，v1 皆 nullable |
| Q-G **年度 `financialYear` 放表頭** | 表頭欄位；跨年度建多張表頭 |
| D12 月度同時 budget+actual | `ProjectExpenseMonthly` 兩個金額欄（比 OM 多 `budgetAmount`） |
| D11 不相加、不約束 approvedBudget | UI/計算與 PO→Expense 嚴格分離，永不相加 |

### 1.3 前置依賴

- **CHANGE-042**（貨幣換算 `convertFromUSD` + 雙幣別顯示組件）：FEAT-015 金額顯示重用之 → **CHANGE-042 需先完成或至少先交付 helper**。

### 1.4 時間估算

| 階段 | 任務 | 預估 |
|------|------|------|
| 1.1 | 資料模型（3 model + 關聯） | 2-3 hr |
| 1.2 | 後端 `projectExpense` router（表頭+明細+月度） | 4-6 hr |
| 1.3 | 前端 4 組件（表頭/清單/明細表單/月度網格） | 8-12 hr |
| 1.4 | Project 詳情頁 Tab 整合 + 雙幣別顯示 | 2-3 hr |
| 1.5 | i18n 雙語 | 1-2 hr |
| 1.6 | 驗證、E2E、回歸 | 2-3 hr |
| **總計** | | **~19-29 hr** |

---

## 2. 詳細任務分解

### Phase 1.1: 資料模型

**目標**: 新增 `ProjectExpense` / `ProjectExpenseItem` / `ProjectExpenseMonthly`，並為 `Project`/`Currency`/`ExpenseCategory`/`OperatingCompany` 補反向關聯。

**任務清單**:
- [ ] `schema.prisma` 新增 `ProjectExpense`（表頭：`projectId`/`name`/`financialYear`/匯總欄；`onDelete: Cascade` 自 Project）
- [ ] 新增 `ProjectExpenseItem`（`projectExpenseId`/`name`/`currencyId?`/`categoryId?`/`opCoId?`/`sortOrder`/明細匯總欄）
- [ ] 新增 `ProjectExpenseMonthly`（`projectExpenseItemId`/`month`/`budgetAmount`/`actualAmount`；`@@unique([projectExpenseItemId, month])`）
- [ ] `Project` 加 `projectExpenses`；`Currency`/`ExpenseCategory`/`OperatingCompany` 各加 `projectExpenseItems` 反向關聯
- [ ] `pnpm db:migrate` + `pnpm db:generate`

**驗收標準**:
- [ ] `pnpm db:generate` 無錯誤；migration 套用成功
- [ ] 4 個外鍵皆有對應 `@@index`
- [ ] 不影響既有資料表

**文件變更**:
```
packages/db/prisma/schema.prisma (修改)
packages/db/prisma/migrations/<timestamp>_feat015_project_expense/ (新增)
```

> 🔴 紅線：Schema 為 SSOT，改完必跑 `db:migrate` + `db:generate`。

---

### Phase 1.2: 後端 — `projectExpense` Router

**目標**: 三層 CRUD + 月度批量更新 + 二級彙總回算（比照 `omExpense.ts`）。

**任務清單**:
- [ ] 新增 `packages/api/src/routers/projectExpense.ts`
- [ ] `getByProject`（protected）：取某專案所有表頭，含 items + monthly + currency/category/opCo
- [ ] `createExpense` / `updateExpense` / `removeExpense`（protected，表頭 CRUD；可選 `createWithItems` 同時帶首批明細）
- [ ] `addItem`（protected）：於 `projectExpenseId` 下建明細；transaction 內自動建 12 筆月度（budget=0, actual=0）
- [ ] `updateItem` / `removeItem`（protected）
- [ ] `reorderItems`（protected，`[{id, sortOrder}]`，比照 OM）
- [ ] `updateItemMonthlyRecords`（protected）：`monthlyData` 長度 12，元素 `{month:1..12, budgetAmount>=0, actualAmount>=0}`；transaction 內 upsert 12 筆 → 重算明細彙總 → **回算表頭彙總**
- [ ] 全部 Zod 驗證；金額存 USD（換算只在前端顯示）
- [ ] `root.ts` 註冊 `projectExpenseRouter`

**驗收標準**:
- [ ] 明細年度預算/實際 = 對應 12 月加總（自動）；表頭 = 所有明細加總
- [ ] 月度恆 12 筆、`@@unique` 不衝突
- [ ] `pnpm typecheck` 通過

**文件變更**:
```
packages/api/src/routers/projectExpense.ts (新增)
packages/api/src/root.ts (修改)
```

> 🔴 紅線：業務邏輯只在 `packages/api`；複雜交易用 Prisma Transaction。

---

### Phase 1.3: 前端 — 4 組件（比照 `components/om-expense/`）

**目標**: 表頭表單 + 明細清單（拖曳/月度展開）+ 明細 Modal 表單 + 12 月雙欄網格。

**任務清單**:
- [ ] 新增 `components/project-expense/ProjectExpenseForm.tsx`（表頭建立/編輯：name/年度；可附首批明細）
- [ ] 新增 `ProjectExpenseItemList.tsx`（明細清單 + `@dnd-kit` 拖曳排序 + 月度展開）
- [ ] 新增 `ProjectExpenseItemForm.tsx`（明細 Modal：`CurrencySelect` + 費用類別下拉 + OpCo 下拉）
- [ ] 新增 `ProjectExpenseItemMonthlyGrid.tsx`（**每月兩欄**：預算 + 實際；比 OM 多一欄）
- [ ] 所有 mutation 按鈕用 `LoadingButton`；錯誤用 `code`/`cause.reason`

**驗收標準**:
- [ ] 組件 TypeScript 無錯誤、支援 Loading/Error 狀態
- [ ] 拖曳排序後正確呼叫 `reorderItems`
- [ ] 月度網格可分別填預算/實際並儲存

**文件變更**:
```
apps/web/src/components/project-expense/ProjectExpenseForm.tsx (新增)
apps/web/src/components/project-expense/ProjectExpenseItemList.tsx (新增)
apps/web/src/components/project-expense/ProjectExpenseItemForm.tsx (新增)
apps/web/src/components/project-expense/ProjectExpenseItemMonthlyGrid.tsx (新增)
```

---

### Phase 1.4: Project 詳情頁 Tab 整合 + 雙幣別顯示

**目標**: 在 Project 詳情頁掛載模組，重用 CHANGE-042 顯示，且與既有 PO→Expense 卡片明確區隔（D11/R8）。

**任務清單**:
- [ ] `projects/[id]/page.tsx` 新增 Tab / 區塊，內含一或多張費用表
- [ ] 金額顯示重用 CHANGE-042 `convertFromUSD` + 雙幣別組件（`US$ (≈ 次值)`）
- [ ] 標題明確標示「Project Expense（月度手填）」vs 既有「實際支出（採購/費用單據）」
- [ ] **畫面與計算都不相加**（不動 `project.getBudgetUsage`）

**驗收標準**:
- [ ] 專案詳情頁可見此模組，與既有預算使用卡片清楚分開、無相加
- [ ] 金額顯示為 USD 主值 +（有匯率時）換算次值

**文件變更**:
```
apps/web/src/app/[locale]/projects/[id]/page.tsx (修改)
```

> 🔴 紅線：D11 — 兩來源永不相加；不約束 `approvedBudget`。

---

### Phase 1.5: i18n 雙語

**任務清單**:
- [ ] `zh-TW.json` + `en.json` 同步新增：表頭/明細/月度網格/Tab 標題/類別/OpCo 等 key
- [ ] `pnpm validate:i18n` 通過

**驗收標準**:
- [ ] 兩語系 key 結構一致、無重複 key；中英文切換正常

**文件變更**:
```
apps/web/src/messages/zh-TW.json (修改)
apps/web/src/messages/en.json (修改)
```

---

### Phase 1.6: 驗證、E2E、回歸

**任務清單**:
- [ ] `/itpm:pre-commit`（`validate:i18n` + `typecheck` + `lint` + 敏感檔案檢查）
- [ ] 手動 / E2E：建表頭 → 加明細（設幣別/類別/OpCo）→ 填 12 月預算+實際 → 驗證彙總
- [ ] 回歸：既有 PO→Expense 與 `project.getBudgetUsage` 不受影響、未被相加

**驗收清單**（對齊 01-requirements §6）:
- [ ] 新增 ProjectExpense 表頭（設年度）→ 表下加明細（設幣別/類別/OpCo）
- [ ] 明細 12 月網格可分別填預算/實際並儲存
- [ ] 明細年度預算/實際 = 12 月加總（自動）；表頭 = 明細加總
- [ ] 金額為 USD 主值 +（有匯率時）換算次值
- [ ] 詳情頁與既有 PO→Expense 卡片清楚分開、無相加
- [ ] 明細可編輯/刪除/排序
- [ ] `db:migrate`/`db:generate`/`typecheck`/`lint`/`validate:i18n` 通過

---

## 3. 依賴關係圖

```
（前置：CHANGE-042 helper）
        ↓
Phase 1.1 資料模型
        ↓
Phase 1.2 projectExpense Router
        ↓
Phase 1.3 前端 4 組件
        ↓
Phase 1.4 Project 詳情頁 Tab + 雙幣別顯示
        ↓
Phase 1.5 i18n
        ↓
Phase 1.6 驗證/E2E/回歸
```

---

## 4. 風險與緩解

| 風險 | 影響 | 緩解 |
|------|------|------|
| 與 PO→Expense 重複計算造成「雙倍支出」誤解 | 中 | UI/計算嚴格分離、永不相加（R8/D11）；明確標籤 |
| 三層彙總（月度→明細→表頭）一致性 | 中 | 彙總一律在 API transaction 內回算，前端不可寫 |
| 與 OM 模組程式碼重複 | 低 | 共用貨幣顯示 + 排序模式；資料表刻意獨立（兩種費用類型） |
| CHANGE-042 未先交付 helper | 中 | 先完成 CHANGE-042，或暫以簡易格式顯示、後接雙幣別組件 |
| `categoryId`/`opCoId` 可選 vs OM 必填 | 低 | v1 刻意放寬（見 02-tech §1 micro-decision）；如需必填再加約束 |

---

## 5. 回滾計劃

1. **Schema 回滾**: 還原 migration（移除 3 個新表 + 4 個模型的反向關聯）
2. **API 回滾**: 從 `root.ts` 移除 `projectExpenseRouter`
3. **前端回滾**: 移除 `components/project-expense/` 與 Project 詳情頁 Tab
4. 因 v1 不動既有流程（`project.getBudgetUsage` 等），回滾衝擊面小

---

## 6. 後續擴展（Phase 2，不在本計劃）

- 與真實 Expense 的對帳 / 帶入（D11 對帳留未來版本）
- 跨專案月度 Summary 報表、月度 MoM 圖表
- `categoryId`/`opCoId` 視需要改必填、或加表頭層 `defaultOpCoId`

---

## 7. 分支與提交建議（依 03-dev-workflow §3）

> 本 FEAT 為**新增模組**（additive，不動既有流程），含 Prisma migration。風險低於 FEAT-014，現行直接 `main` 即可；如想要可回滾 gate，再考慮 `feature/FEAT-015-project-expense`（開分支前先與使用者確認）。

- Conventional Commits，subject 帶 `(FEAT-015)`，每個 Phase 完成提交一次
- 逐檔 `git add`（不用 `git add .`）；同步 `DEVELOPMENT-LOG.md`
- `git push` 前向使用者確認（破壞性操作）

---

**維護者**: AI 助手 + 開發團隊
**最後更新**: 2026-06-01
