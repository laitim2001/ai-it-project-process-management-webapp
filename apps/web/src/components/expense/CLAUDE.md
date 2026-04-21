# Expense Components — Epic 6 費用記錄與審批

> **Last Updated**: 2026-04-21
> **複雜度**: ⭐⭐⭐（狀態機 + 跨實體關聯）
> **Epic**: Epic 6 - Expense Recording & Financial Integration + Epic 6.5 Real-time Budget Tracking
> **相關規則**: `.claude/rules/components.md`
> **深度分析參考**:
> - `docs/codebase-analyze/04-components/detail/business-components.md`（expense 章節）
> - `docs/codebase-analyze/02-api-layer/detail/expense.md`（44KB Router）
> - `docs/codebase-analyze/09-diagrams/data-flow.md#expense-flow`

## 📋 目錄用途

實作 **Epic 6 費用記錄** 的前端組件。費用是 `PurchaseOrder` 實現的結果，整合採購、發票、付款流程，同時是 **Epic 6.5 預算池即時追蹤** 的資料來源。

## 🏗️ 檔案結構

```
expense/
├── ExpenseForm.tsx       # 800 行 — 費用建立/編輯表單（含 ExpenseItem 明細管理）
└── ExpenseActions.tsx    # 280 行 — 狀態驅動操作按鈕
```

## 🎯 核心業務邏輯

### 狀態機

```
[Draft]
  │  submit
  ▼
[PendingApproval]
  ├─ approve → [Approved]
  └─ reject  → [Rejected / Draft]
              │
              │  markAsPaid（Finance/Admin 特定權限）
              ▼
           [Paid]
```

### ExpenseForm.tsx

**核心概念：費用必須綁定 PurchaseOrder**

| 欄位類別 | 欄位 |
|---------|------|
| 關聯 | `purchaseOrderId`（必填，決定 vendor 與 projectId）|
| 基本 | amount, expenseDate, description, invoiceNumber |
| 附件 | invoiceFilePath（Azure Blob）|
| 分類 | `categoryId`（ExpenseCategory）、`requiresChargeOut`（FEAT-005 轉嫁標記）|
| 明細（CHANGE-X）| `ExpenseItem[]` — 單張費用可有多項費用明細 |

**建立模式流程**：
1. 選 PurchaseOrder → 自動帶入 vendor、project、可用剩餘額度
2. 填寫金額（不可超過 PO 剩餘額度）
3. 新增 ExpenseItem 明細（選填；不含明細時金額等於總額）
4. 上傳發票（選填，但 approve 前通常需補齊）
5. submit 送審

### ExpenseActions.tsx

**狀態驅動**，類似 `ProposalActions` 但：
- 角色權限檢查不同：財務核准需 `Admin` 或特定權限（`permission.ts`）
- `Paid` 為終態，無回滾（避免改寫已入帳資料）
- approve 時會即時更新 `BudgetPool.usedAmount`（Epic 6.5 的核心）

## 🔗 依賴關係

- **API Router**: `packages/api/src/routers/expense.ts`（44KB，共 ~25 個 procedures）
- **Prisma Models**: `Expense` → `PurchaseOrder`（必有）→ `Project` → `BudgetPool`；`Expense` ↔ `ExpenseItem` ↔ `ExpenseCategory`
- **通知**: Epic 8 — submit / approve / reject 均觸發通知
- **預算池追蹤**: Epic 6.5 — approve 時 `BudgetPool.usedAmount += amount`，paid 時無影響（金額已在 approve 時計入）
- **ChargeOut**: FEAT-005 — 勾選 `requiresChargeOut` 的費用才會出現在 ChargeOutForm 的候選清單

## ⚠️ 開發注意事項

1. **PO 額度即時驗證**：建立/編輯時呼叫 `purchaseOrder.getRemainingBudget` 取得剩餘可用額；prefer 使用 Zod schema + API 層雙重驗證
2. **ExpenseItem 明細總和 = Expense.amount**：若有明細，兩者必須相等（API 層會自動計算；若前端允許手動輸入兩者需同步）
3. **發票檔案路徑**：儲存在 `invoices` container；刪除 Expense 時 Azure Blob **不會**自動刪除（需另手動清理）
4. **expenseDate vs createdAt**：`expenseDate` 是業務上的發生日期（使用者填），`createdAt` 是系統時間
5. **跨幣別**：若 PO 幣別 ≠ Project 幣別，使用 `currency.ts` 的匯率轉換；UI 應標示使用哪個幣別
6. **FIX-105（已修復）**：`expense.getStats` 曾引用不存在的 `'PendingApproval'` 狀態，已修正
7. **FIX-106（已修復）**：`expense.reject` 發送未註冊通知類型，已修正

## 🐛 已知陷阱

- **不要假設 markAsPaid 可逆**：設計為單向狀態，需 DBA 直接改資料才能還原
- **即時預算池更新的樂觀鎖**：高並發下多人同時 approve 可能導致 `usedAmount` 計算偏差；API 已用 transaction 避免，但 UI 顯示可能有 1-2 秒延遲
- **明細新增順序**：若 `ExpenseItem` 有 `sortOrder`，需在建立時分配（避免 race condition）

## 🔄 相關變更歷史

- **Epic 6**: 基礎 CRUD + 審批工作流
- **Epic 6.5**: 即時預算池使用率追蹤
- **FEAT-005**: 新增 `requiresChargeOut` 標記支援費用轉嫁
- **FEAT-007**: ExpenseCategory 架構統一
- **CHANGE-X**: ExpenseItem 明細架構
- **FIX-105/106**: 狀態與通知類型修正
