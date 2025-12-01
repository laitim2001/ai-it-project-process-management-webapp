# CHANGE-002: ExpenseItem 費用轉嫁目標

> **建立日期**: 2025-12-01
> **狀態**: 📋 待開發
> **類型**: 資料模型增強
> **優先級**: High

---

## 問題描述

### 業務背景
用戶的業務流程中，費用轉嫁（ChargeOut）的粒度應該是**費用明細（ExpenseItem）**層級：
- 每個專案會產生多筆支出（Expense）
- 每筆支出有多個明細項目（ExpenseItem）
- **每個明細項目可能需要向不同的營運公司（OpCo）收費**

### 目前問題

#### 問題 2a: ExpenseItem 缺少 OpCo 目標
- `ExpenseItem` 模型沒有 `chargeOutOpCoId` 欄位
- 無法在明細層級指定轉嫁目標

#### 問題 2b: ChargeOutItem 關聯錯誤
- 目前 `ChargeOutItem.expenseId` 關聯到 `Expense`（表頭）
- 應該關聯到 `ExpenseItem`（明細）

### 預期行為
```
Expense (表頭)
├── requiresChargeOut = true
└── ExpenseItem (明細)
     ├── item 1 (軟體授權) → chargeOutOpCoId: OpCo-HK
     ├── item 2 (硬體設備) → chargeOutOpCoId: OpCo-SG
     └── item 3 (顧問服務) → chargeOutOpCoId: OpCo-TW
```

---

## 根本原因

資料模型設計時，將 ChargeOut 目標設計在表頭層級（ChargeOut.opCoId），而非明細層級（ExpenseItem）。

---

## 解決方案

### 方案 A: ExpenseItem 新增 OpCo 目標（建議）

```prisma
model ExpenseItem {
  // ... 現有欄位 ...

  // 新增: 費用轉嫁目標
  chargeOutOpCoId String?               // 要向哪個 OpCo 轉嫁 (null = 不需轉嫁)
  chargeOutOpCo   OperatingCompany?     @relation(fields: [chargeOutOpCoId], references: [id])

  // 新增: 反向關聯到 ChargeOutItem
  chargeOutItems  ChargeOutItem[]
}

model OperatingCompany {
  // ... 現有欄位 ...

  // 新增: 關聯的費用明細
  chargeOutExpenseItems ExpenseItem[]
}
```

### 方案 B: ChargeOutItem 改為關聯 ExpenseItem

```prisma
model ChargeOutItem {
  id          String @id @default(uuid())
  chargeOutId String

  // 修改: 從 Expense 改為 ExpenseItem
  expenseItemId String           // 關聯到具體的費用明細
  expenseItem   ExpenseItem      @relation(fields: [expenseItemId], references: [id])

  // 移除或保留為可選（向後兼容）
  expenseId     String?          // 保留向後兼容，未來可移除
  expense       Expense?         @relation(fields: [expenseId], references: [id])

  amount        Float            // 轉嫁金額（可能與明細金額不同）
  description   String?
}
```

### 建議實施順序
1. 先實施方案 A（ExpenseItem 新增 OpCo 目標）
2. 再實施方案 B（ChargeOutItem 關聯修改）
3. 這樣可以分階段驗證，降低風險

---

## 影響範圍

### 修改文件
| 文件 | 變更說明 |
|------|----------|
| `packages/db/prisma/schema.prisma` | 修改 ExpenseItem, ChargeOutItem, OperatingCompany |
| `packages/api/src/routers/expense.ts` | 更新 ExpenseItem 相關操作 |
| `packages/api/src/routers/chargeOut.ts` | 更新 ChargeOutItem 關聯邏輯 |
| `apps/web/src/components/expense/ExpenseForm.tsx` | 新增 OpCo 選擇器 |
| `apps/web/src/components/charge-out/ChargeOutForm.tsx` | 修改明細關聯 |
| `apps/web/src/messages/*.json` | 新增翻譯 key |

### 資料庫遷移
- **ExpenseItem**: 新增可選欄位，無需遷移
- **ChargeOutItem**: 需要處理現有資料的 expenseId → expenseItemId 轉換

---

## 測試驗證

### 功能測試
- [ ] ExpenseItem 可以選擇轉嫁目標 OpCo
- [ ] ExpenseItem 可以不選擇 OpCo（不需轉嫁）
- [ ] ChargeOut 可以正確彙總按 OpCo 分組的明細
- [ ] ChargeOutItem 正確關聯到 ExpenseItem

### 回歸測試
- [ ] 現有 Expense CRUD 功能正常
- [ ] 現有 ChargeOut CRUD 功能正常
- [ ] 現有資料可正常顯示（向後兼容）

---

## 實施計劃

### Phase 1: ExpenseItem 新增 OpCo 目標
1. 修改 `schema.prisma` - 新增 `chargeOutOpCoId`
2. 執行資料庫遷移
3. 更新 Expense API router
4. 更新 ExpenseForm 組件

### Phase 2: ChargeOutItem 關聯修改
1. 修改 `schema.prisma` - ChargeOutItem 新增 `expenseItemId`
2. 準備資料遷移腳本
3. 執行資料庫遷移
4. 更新 ChargeOut API router
5. 更新 ChargeOutForm 組件

### Phase 3: 清理
1. 移除 ChargeOutItem.expenseId（如已完全遷移）
2. 更新所有相關文檔

---

## 相關文檔
- [業務流程分析](../../業務流程分析報告.md)
- [CHANGE-001: OMExpense 來源追蹤](./CHANGE-001-omexpense-source-tracking.md)

---

**最後更新**: 2025-12-01
