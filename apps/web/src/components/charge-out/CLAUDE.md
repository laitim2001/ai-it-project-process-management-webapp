# Charge-Out Components — FEAT-005 費用轉嫁

> **Last Updated**: 2026-04-21
> **複雜度**: ⭐⭐⭐⭐（表頭-明細 + 多 OpCo 分配）
> **Feature**: FEAT-005 Expense Charge-Out
> **相關規則**: `.claude/rules/components.md`
> **深度分析參考**:
> - `docs/codebase-analyze/04-components/detail/business-components.md`（charge-out 章節）
> - `docs/codebase-analyze/02-api-layer/detail/chargeOut.md` — API Router 完整說明
> - `docs/codebase-analyze/05-database/model-detail.md#chargeout` — ChargeOut + ChargeOutItem + ProjectChargeOutOpCo

## 📋 目錄用途

實作 **FEAT-005 費用轉嫁（Charge-Out）** 的前端組件。這是將專案產生的費用從 IT 部門**轉嫁到實際受益的 OpCo（營運公司）** 的機制，是 IT 與財務對帳的核心流程。

## 🏗️ 檔案結構

```
charge-out/
├── ChargeOutForm.tsx       # 652 行 — 費用轉嫁建立/編輯表單（表頭 + 明細）
└── ChargeOutActions.tsx    # 424 行 — 狀態驅動操作按鈕 + 匯出功能
```

## 🎯 核心業務邏輯

### 資料結構

```
ChargeOut (表頭)
  ├─ projectId              # 來源專案
  ├─ opCoId                 # 目標 OpCo（單一）
  ├─ totalAmount            # 自動計算
  └─ ChargeOutItems[]       # 明細
       ├─ expenseId         # 被轉嫁的 Expense
       ├─ amount            # 轉嫁金額（可部分轉嫁）
       └─ description

關聯表：ProjectChargeOutOpCo（專案可轉嫁給哪些 OpCo）
```

### ChargeOutForm.tsx

**建立流程**：
1. 選 Project → 自動帶出可轉嫁 OpCo 清單（透過 `ProjectChargeOutOpCo`）
2. 選 OpCo → 載入該 Project 下 `requiresChargeOut=true` 且未完全轉嫁的 Expense
3. 動態明細表格（新增/編輯/刪除行）：
   - 每行選一個 Expense → 自動帶出該 Expense 剩餘可轉嫁金額
   - 可輸入轉嫁金額（≤ 剩餘額）
4. 即時總額計算
5. 提交 → `chargeOut.create`

**關鍵驗證**（Zod + 業務規則）：
- 明細至少一筆
- 每筆明細 amount > 0 且 ≤ Expense 剩餘可轉嫁額
- 同一 Expense 不可在同一 ChargeOut 出現兩次

**編輯模式注意**：編輯已存在的 ChargeOut 會**清空所有明細**並重建（簡化 diff 處理）

### ChargeOutActions.tsx

- **狀態流**：`Draft → Submitted → Confirmed`
- **匯出功能**：可匯出 Excel / PDF 給 OpCo 財務部核對
- **撤回**：`Submitted → Draft` 允許修改（若 OpCo 未 confirm）

## 🔗 依賴關係

- **API Router**: `packages/api/src/routers/chargeOut.ts`（關鍵 procedures: `create`, `update`, `getAvailableExpenses`, `exportToExcel`）
- **Prisma Models**: `ChargeOut` ↔ `ChargeOutItem` → `Expense`；`Project` ↔ `ProjectChargeOutOpCo` ↔ `OperatingCompany`
- **候選 Expense 來源**: 只顯示 `Expense.requiresChargeOut=true` 且 `status='Approved'` 或 `'Paid'` 的費用
- **頁面**: `apps/web/src/app/[locale]/charge-outs/`

## ⚠️ 開發注意事項

1. **OpCo 清單過濾**：選 Project 後，OpCo 下拉選單僅顯示 `ProjectChargeOutOpCo` 中該 Project 已授權的 OpCo
2. **部分轉嫁支援**：一個 Expense 可被拆成多筆 ChargeOut（例：一半給 OpCo A，另一半給 OpCo B）
3. **剩餘額計算**：`Expense.amount - SUM(ChargeOutItem.amount where expense=this)` — 由 `getAvailableExpenses` API 計算
4. **變更 Project 清空明細**：UI 層切換 Project 時強制清空 items（避免跨 Project 的 Expense 被混入）
5. **requiresChargeOut 旗標**：若 Expense 建立時沒勾此旗標，不會出現在候選清單；若需補標記，需回到 Expense 編輯
6. **匯出格式**：Excel 有固定欄位順序（symbol code / expense date / amount / description）以配合 OpCo 會計系統
7. **刪除 ChargeOut**：軟刪除；實際資料保留供審計

## 🐛 已知陷阱

- **並發編輯衝突**：多人同時編輯同一 ChargeOut 的不同 item 可能相互覆蓋（因編輯是「清空+重建」策略）
- **剩餘額快取延遲**：使用者剛建立 ChargeOut 後馬上建第二筆，`getAvailableExpenses` 可能仍顯示舊剩餘額（~1 秒延遲）
- **跨幣別轉嫁**：若 Project 與 OpCo 預期幣別不同，目前未自動換算（需手動在描述標註）

## 🔄 相關變更歷史

- **FEAT-005**: 基礎 Charge-Out 實作
- **CHANGE-X**: 匯出格式優化
- **CHANGE-024**: 刪除確認對話框
