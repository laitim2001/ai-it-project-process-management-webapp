# OM Expense Components — FEAT-007 表頭-明細-月度架構

> **Last Updated**: 2026-04-21
> **複雜度**: ⭐⭐⭐⭐⭐（本項目最複雜的業務組件目錄）
> **架構**: 三層資料結構 — Header → Item → Monthly
> **相關規則**: `.claude/rules/components.md`
> **深度分析參考**:
> - `docs/codebase-analyze/04-components/detail/business-components.md`（om-expense 章節）
> - `docs/codebase-analyze/02-api-layer/detail/omExpense.md` — API 層完整 Procedure 清單
> - `docs/codebase-analyze/05-database/model-detail.md#omexpense` — Prisma 3 個 Model 關聯

## 📋 目錄用途

實作 **FEAT-007 OM Expense 表頭-明細架構重構** 的前端組件。此重構將原本單一扁平的 OMExpense 拆成三層：

```
OMExpense (表頭)
  └─ OMExpenseItem (明細，N 個)
      └─ OMExpenseMonthly (月度記錄，每個明細自動生成 12 個)
```

**為什麼需要三層**：一個 OM 費用可能涵蓋多個 OpCo、多個費用類別、跨多個月份，三層拆分才能精準追蹤每月支出與預算執行率。

## 🏗️ 檔案結構

```
om-expense/
├── OMExpenseForm.tsx            # 969 行 — 表頭建立/編輯表單
├── OMExpenseItemForm.tsx        # 599 行 — 單一明細項目 Modal 表單
├── OMExpenseItemList.tsx        # 615 行 — 明細清單（拖曳排序 + 月度展開）
└── OMExpenseItemMonthlyGrid.tsx # 362 行 — 單一明細的 12 月度網格
```

## 🎯 核心業務邏輯

### 1. OMExpenseForm — 表頭管理

| 模式 | 行為 | 使用的 API |
|------|------|-----------|
| **建立** | 填寫表頭 + 至少一個明細項目，一次提交 | `createWithItems` |
| **編輯** | 僅編輯表頭資訊；明細在詳情頁 `OMExpenseItemList` 管理 | `update` |

關鍵：建立時把 Items 收在表單 state（非獨立 API 呼叫），確保「表頭+明細」原子性。

### 2. OMExpenseItemList — 明細管理（最核心）

- **拖曳排序**：使用 `@dnd-kit/core` + `@dnd-kit/sortable` 實作 drag-and-drop，完成後呼叫 `reorderItems` API
- **月度展開**：每個 Item 可展開顯示 12 個月的記錄（透過 `OMExpenseItemMonthlyGrid`）
- **即時新增/刪除**：在詳情頁直接操作（透過 `addItem` / `removeItem` API）

### 3. OMExpenseItemForm — 單項明細

- 在 Modal 中開啟
- 欄位：OpCo、費用類別、預算金額、幣別、日期、描述
- 建立時會自動觸發 API 產生 12 個 `OMExpenseMonthly` 記錄（每月金額預設為 0）
- **CHANGE-049 金額幣別語意**：`budgetAmount`/`lastFYActualExpense` 以**所選幣別輸入**，存檔時用 `lib/currency.ts` 的 `toUSD()` **換算為 USD 儲存**（系統主帳幣別）；編輯載入時用 `fromUSD()` 換回該幣別顯示。`currencyId` = 「輸入金額所用幣別」，**非**儲存幣別。顯示一律 USD（主）+ HKD（次）。

### 4. Monthly Grid 組件

| 組件 | 用途 | API |
|------|------|-----|
| `OMExpenseItemMonthlyGrid` | 單一 Item 的 12 月編輯網格（**USD / HKD 雙欄輸入**） | `updateItemMonthlyRecords` |

> **CHANGE-048 / 046**：月度每月有 **USD 與 HKD 兩個可輸入欄**，**雙向自動換算**（編輯任一欄依匯率帶入另一欄；CHANGE-050 補上 HKD→USD 方向）。HKD 持久化於 `OMExpenseMonthly.actualAmountHKD`。**USD 仍為主帳幣別**，item/表頭 `actualSpent` 與使用率一律以 USD 計算；雙向後編輯 HKD 會經換算連動 USD 彙總。

> **歷史**：原另有 `OMExpenseMonthlyGrid`（整張 OMExpense 所有 Items × 12 月彙總顯示，唯讀），為 FEAT-007 重構前的扁平架構遺留組件，FEAT-007 後已無任何頁面引用，並於 FIX-140（2026-06-02）刪除。

## 🔗 依賴關係

- **API Router**: `packages/api/src/routers/omExpense.ts`（共 8 個 procedure）
- **Prisma Models**: `OMExpense` → `OMExpenseItem` → `OMExpenseMonthly`
- **API 路由頁面**: `apps/web/src/app/[locale]/om-expenses/`

## ⚠️ 開發注意事項

1. **建立與編輯的 API 不同**：`createWithItems` vs `update`，不要混用
2. **拖曳排序後必須呼叫 API**：`reorderItems` 傳的是 `[{id, sortOrder}]` 陣列，不可只改前端 state
3. **月度記錄數量恆為 12**：不要嘗試動態新增/刪除月度，API 已強制每個 Item 生成 12 個
4. **新增 Item 不會自動產生 Monthly**：`addItem` API 內部已在 transaction 中同步建立 12 個 Monthly，前端不需額外呼叫
5. **表頭的 `totalAmount` 是計算值**：由所有 Items 的 `budgetAmount` 加總，由 API 層維護，前端**不要**嘗試寫入
6. **FEAT-008 數據匯入相關**：Excel 匯入使用 `createWithItems` + 批次化策略，邏輯在 `app/[locale]/data-import/`
7. **金額一律以 USD 儲存（CHANGE-042/044/045）**：DB 的 `budgetAmount`、`actualSpent`、`OMExpenseMonthly.actualAmount` 皆為 **USD**；`OMExpenseItem.currencyId` 是「**輸入金額所用幣別**」而非儲存幣別。表單以 `toUSD()`/`fromUSD()` 在 USD ↔ 選定幣別間換算；顯示一律 **USD（主）+ 固定 HKD（次）**（用 `hkdCurrencyInfo()`）。**改 OM 金額相關功能前務必理解此模型**，勿把 DB 數值當成 item 幣別原值。`OMExpenseMonthly.actualAmountHKD`（CHANGE-048）是**額外**持久化的真實 HKD，不參與 USD 彙總。

## 🐛 已知陷阱

- **State 同步問題**：`OMExpenseItemList` 展開/收合 + 拖曳 + 月度編輯 同時進行時，需小心 React state 合併順序
- **樂觀更新風險**：某些 mutation 使用 `onMutate` 做樂觀更新，失敗回滾時可能與其他 mutation 衝突
- **表頭金額延遲**：修改 Item 後表頭 `totalAmount` 有約 0.5-1 秒刷新延遲（因 React Query invalidation）

## 🔄 相關變更歷史

- **FEAT-007**: 從扁平架構重構為三層（Breaking Change）
- **FEAT-008**: 新增 Excel 批量匯入能力
- **CHANGE-001**: OM Expense 來源追蹤欄位
- **CHANGE-002**: 費用類別統一
- **CHANGE-013**: 月度記錄 UI 優化
- **CHANGE-042**: OM Expense 雙幣別顯示（USD 主值 + 依匯率換算次值）
- **CHANGE-048**: 月度記錄新增**可輸入並持久化的 HKD 金額欄**（USD→HKD 自動換算、HKD 可獨立覆寫；新增 `OMExpenseMonthly.actualAmountHKD`），並修復月度 tab 上方卡片雙幣別重疊（`DualCurrency` 新增 `stacked` 變體）
- **CHANGE-049**: Edit Item **以選定幣別輸入金額、存檔依匯率換算為 USD**（修正 CHANGE-042 遺留的金額語意矛盾）；所有顯示（item list / monthly / detail）改為**固定 USD + HKD**（取代「次值跟隨各 item 幣別」）。純前端，新增 `lib/currency.ts` 的 `toUSD`/`fromUSD`/`hkdCurrencyInfo`
- **CHANGE-050**: 月度 USD/HKD 由**單向**（CHANGE-048）改為**雙向自動換算**（編輯 HKD 也回算 USD）；`OMExpenseItemMonthlyGrid` 新增 `hkdToUsd`、`updateMonthHKD` 同時更新 USD。純前端
