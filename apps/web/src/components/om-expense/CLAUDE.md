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
├── OMExpenseItemMonthlyGrid.tsx # 362 行 — 單一明細的 12 月度網格
└── OMExpenseMonthlyGrid.tsx     # 487 行 — 整張 OM Expense 的月度彙總網格
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
- 欄位：OpCo、費用類別、預算金額、日期、描述
- 建立時會自動觸發 API 產生 12 個 `OMExpenseMonthly` 記錄（每月金額預設為 0）

### 4. Monthly Grid 組件差異

| 組件 | 用途 | API |
|------|------|-----|
| `OMExpenseItemMonthlyGrid` | 單一 Item 的 12 月編輯網格 | `updateItemMonthlyRecords` |
| `OMExpenseMonthlyGrid` | 整個 OMExpense 所有 Items × 12 月的彙總顯示 | 只讀 |

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
