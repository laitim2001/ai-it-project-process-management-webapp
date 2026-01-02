# CHANGE-037: OM Expenses 幣別格式從 HK$ 改為 US$

> **建立日期**: 2025-01-02
> **完成日期**: 2025-01-02
> **狀態**: ✅ 已完成
> **優先級**: Low
> **類型**: UI 格式調整

## 1. 變更概述

將 OM Expenses 相關頁面的金額顯示格式從港幣 (HK$) 改為美元 (US$) 格式。

**變更前**: `HK$153,712`
**變更後**: `US$153,712`

## 2. 變更原因

統一顯示為 US$ 格式以符合業務需求。

## 3. 技術設計

### 修改的 formatCurrency 函數

```typescript
// 變更前
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-HK', {
    style: 'currency',
    currency: 'HKD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
// 輸出: HK$153,712

// 變更後
const formatCurrency = (amount: number) => {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `US$${formatted}`;
};
// 輸出: US$153,712
```

### 技術說明

- 使用 `style: 'decimal'` 取代 `style: 'currency'` 以獲得純數字格式
- 手動添加 `US$` 前綴以達到預期的顯示效果
- 保留千分位分隔符 (逗號)

## 4. 影響範圍

### 修改的檔案

| 檔案 | 位置 | 影響欄位 |
|------|------|----------|
| `apps/web/src/app/[locale]/om-expenses/page.tsx` | 行 174-181 | Budget, Actual Spent 欄位 |
| `apps/web/src/app/[locale]/om-expenses/[id]/page.tsx` | 行 191-198 | Budget Overview 區塊金額 |
| `apps/web/src/components/om-expense/OMExpenseItemList.tsx` | 行 158-165 | Budget Amount, Actual Spent, 合計 |

### 影響頁面

| 頁面 | URL | 影響區域 |
|------|-----|----------|
| OM Expenses 列表頁 | `/om-expenses` | 表格 Budget 和 Actual Spent 欄位 |
| OM Expense 詳情頁 | `/om-expenses/[id]` | Budget Overview 卡片、Line Items 表格 |

## 5. 驗收標準

- [x] 列表頁 Budget 欄位顯示 `US$` 前綴
- [x] 列表頁 Actual Spent 欄位顯示 `US$` 前綴
- [x] 詳情頁 Budget Overview 金額顯示 `US$` 前綴
- [x] 詳情頁 Line Items Budget Amount 顯示 `US$` 前綴
- [x] 詳情頁 Line Items Actual Spent 顯示 `US$` 前綴
- [x] 詳情頁 Line Items 合計金額顯示 `US$` 前綴
- [x] 千分位分隔符正常顯示

## 6. 實施記錄

### 6.1 Git Commit

```
345f0d6 feat(om-expense): CHANGE-037 幣別格式從 HK$ 改為 US$
```

### 6.2 變更統計

- **修改檔案數**: 3
- **新增行數**: 9
- **刪除行數**: 9

## 7. 相關文檔

- FEAT-007: OM Expense 表頭-明細架構重構
- `apps/web/src/components/om-expense/OMExpenseItemList.tsx`
