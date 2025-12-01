# CHANGE-002: ExpenseItem 費用轉嫁目標

> **建立日期**: 2025-12-01
> **完成日期**: 2025-12-01
> **狀態**: ✅ 已完成 (Phase 1+2 Backend)
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

### 方案 A: ExpenseItem 新增 OpCo 目標 ✅ 已實施

```prisma
model ExpenseItem {
  // ... 現有欄位 ...

  // 新增: 費用轉嫁目標
  chargeOutOpCoId String?               // 要向哪個 OpCo 轉嫁 (null = 不需轉嫁)
  chargeOutOpCo   OperatingCompany?     @relation("ChargeOutExpenseItems", fields: [chargeOutOpCoId], references: [id])

  // 新增: 反向關聯到 ChargeOutItem
  chargeOutItems  ChargeOutItem[]
}

model OperatingCompany {
  // ... 現有欄位 ...

  // 新增: 關聯的費用明細
  chargeOutExpenseItems ExpenseItem[] @relation("ChargeOutExpenseItems")
}
```

### 方案 B: ChargeOutItem 改為關聯 ExpenseItem ✅ 已實施

```prisma
model ChargeOutItem {
  id          String @id @default(uuid())
  chargeOutId String

  // 修改: 從 Expense 改為 ExpenseItem（新增 expenseItemId）
  expenseItemId String?          // 關聯到具體的費用明細
  expenseItem   ExpenseItem?     @relation(fields: [expenseItemId], references: [id])

  // 保留為可選（向後兼容）
  expenseId     String?          // 保留向後兼容
  expense       Expense?         @relation(fields: [expenseId], references: [id])

  amount        Float            // 轉嫁金額（可能與明細金額不同）
  description   String?
}
```

---

## 影響範圍

### 修改文件
| 文件 | 變更說明 | 狀態 |
|------|----------|------|
| `packages/db/prisma/schema.prisma` | 修改 ExpenseItem, ChargeOutItem, OperatingCompany | ✅ 完成 |
| `packages/api/src/routers/expense.ts` | 更新 ExpenseItem 相關操作，新增 chargeOutOpCoId | ✅ 完成 |
| `packages/api/src/routers/chargeOut.ts` | 更新 ChargeOutItem 關聯邏輯，新增 expenseItemId | ✅ 完成 |
| `apps/web/src/components/expense/ExpenseForm.tsx` | 新增 OpCo 選擇器 | 📋 待開發 |
| `apps/web/src/components/charge-out/ChargeOutForm.tsx` | 修改明細關聯 | 📋 待開發 |
| `apps/web/src/messages/*.json` | 新增翻譯 key | 📋 待開發 |

### 資料庫遷移
- **ExpenseItem**: 新增可選欄位 `chargeOutOpCoId`，無需遷移 ✅
- **ChargeOutItem**: 新增可選欄位 `expenseItemId`，保留 `expenseId` 向後兼容 ✅

---

## 測試驗證

### 功能測試
- [x] ExpenseItem 可以選擇轉嫁目標 OpCo - API 支援
- [x] ExpenseItem 可以不選擇 OpCo（不需轉嫁）- API 支援
- [x] ChargeOutItem 支援 expenseItemId 關聯 - API 支援
- [x] ChargeOutItem 保持 expenseId 向後兼容 - API 支援
- [ ] ChargeOut 可以正確彙總按 OpCo 分組的明細 - 前端待實現
- [ ] ChargeOutItem 正確關聯到 ExpenseItem - 前端待實現

### 回歸測試
- [x] 現有 Expense CRUD 功能正常 - 向後兼容
- [x] 現有 ChargeOut CRUD 功能正常 - 向後兼容
- [x] TypeScript 編譯通過
- [x] 現有資料可正常顯示（向後兼容）

---

## 實施計劃

### Phase 1: ExpenseItem 新增 OpCo 目標 ✅ 已完成
1. ✅ 修改 `schema.prisma` - 新增 `chargeOutOpCoId` 到 ExpenseItem
2. ✅ 新增 `chargeOutOpCo` 關聯到 OperatingCompany
3. ✅ 新增 `chargeOutExpenseItems` 反向關聯到 OperatingCompany
4. ✅ 執行 Prisma generate 和 db push
5. ✅ 更新 Expense API router - expenseItemSchema 新增 chargeOutOpCoId
6. ✅ 更新 create/update mutation 處理 chargeOutOpCoId
7. ✅ 更新 getById 包含 chargeOutOpCo 關聯

### Phase 2: ChargeOutItem 關聯修改 ✅ 已完成
1. ✅ 修改 `schema.prisma` - ChargeOutItem 新增 `expenseItemId`
2. ✅ 保留 `expenseId` 為可選欄位（向後兼容）
3. ✅ 執行 Prisma generate 和 db push
4. ✅ 更新 ChargeOut API router - chargeOutItemSchema 新增 expenseItemId
5. ✅ 更新 create/updateItems mutation 處理 expenseItemId
6. ✅ 更新 getById 包含 expenseItem 關聯
7. ✅ 更新 getEligibleExpenses 包含完整 ExpenseItem 資訊

### Phase 3: 前端更新 📋 待開發
1. 更新 ExpenseForm 組件 - 新增 OpCo 選擇器
2. 更新 ChargeOutForm 組件 - 支援 ExpenseItem 選擇
3. 新增 i18n 翻譯
4. 測試前端功能

### Phase 4: 清理（未來）
1. 評估是否移除 ChargeOutItem.expenseId（完全遷移後）
2. 更新所有相關文檔

---

## API 變更說明

### expense.ts 變更
- `expenseItemSchema` 新增 `chargeOutOpCoId: z.string().nullable().optional()`
- `create` mutation 的 createMany 包含 chargeOutOpCoId
- `update` mutation 的 update/create 包含 chargeOutOpCoId
- `getById` 的 items include 包含 chargeOutOpCo 關聯

### chargeOut.ts 變更
- `chargeOutItemSchema` 新增 `expenseItemId: z.string().nullable().optional()`
- `chargeOutItemSchema` 的 expenseId 改為 `z.string().nullable().optional()`
- `create` mutation 的 createMany 包含 expenseItemId
- `updateItems` mutation 的 update/create 包含 expenseItemId
- `getById` 的 items include 包含 expenseItem 關聯（含 chargeOutOpCo）
- `getEligibleExpenses` 的 items select 包含 chargeOutOpCoId 和 chargeOutOpCo

---

## 相關文檔
- [業務流程分析](../../業務流程分析報告.md)
- [CHANGE-001: OMExpense 來源追蹤](./CHANGE-001-omexpense-source-tracking.md)

---

**最後更新**: 2025-12-01
