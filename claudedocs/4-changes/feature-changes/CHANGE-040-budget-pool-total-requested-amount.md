# CHANGE-040: Budget Pool 總申請金額顯示

> **建立日期**: 2026-01-27
> **完成日期**: -
> **狀態**: ✅ 已完成
> **優先級**: Medium
> **類型**: 現有功能增強 (Enhancement)
> **前置依賴**: CHANGE-038 (Project Budget Category Sync)

---

## 1. 變更概述

### 1.1 背景

Budget Pool 詳情頁目前顯示以下資訊：

- **Basic Information**：Fiscal Year、Category Count、Total Budget、Used Amount、Created/Updated At
- **Budget Categories 表格**：Sort、Category、Code、Total Budget、Used、Utilization Rate、Project Count、Expense Count

目前缺少一項關鍵數據：**所有專案的 Budget Category Request Amount 總和**（即 Total Requested Amount）。管理者無法直觀看到：
- 整個 Budget Pool 被專案申請了多少金額
- 每個 Budget Category 被申請了多少金額
- 申請金額與預算總額的對比關係

### 1.2 目標

在 Budget Pool 詳情頁的兩個區域新增 **Total Requested Amount** 顯示：

1. **Basic Information 卡片**：新增一行顯示整個 Pool 的 Total Requested Amount
2. **Budget Categories 表格**：新增一欄顯示每個 Category 的 Total Requested Amount

### 1.3 視覺效果

#### Basic Information 卡片（新增 1 行）

**現狀**：
```
📊 Budget Pool Basic Information
┌────────────────────────────────────────┐
│ Fiscal Year:      FY 2025              │
│ Category Count:   5 categories         │
│ Total Budget:     $100,000.00          │
│ Used Amount:      $45,000.00           │
│ Created At:       2025-11-14           │
│ Updated At:       2025-12-18           │
└────────────────────────────────────────┘
```

**變更後**：
```
📊 Budget Pool Basic Information
┌────────────────────────────────────────┐
│ Fiscal Year:           FY 2025         │
│ Category Count:        5 categories    │
│ Total Budget:          $100,000.00     │
│ Total Requested:       $72,000.00      │  ← 新增
│ Used Amount:           $45,000.00      │
│ Created At:            2025-11-14      │
│ Updated At:            2025-12-18      │
└────────────────────────────────────────┘
```

#### Budget Categories 表格（新增 1 欄）

**現狀**（8 欄）：
```
┌──────┬──────────┬──────┬─────────────┬────────┬──────┬──────────┬─────────┐
│ Sort │ Category │ Code │ Total Budget│ Used   │ Rate │ Projects │Expenses │
├──────┼──────────┼──────┼─────────────┼────────┼──────┼──────────┼─────────┤
│  1   │ Hardware │ HW   │ $50,000.00  │ $25,000│ 50%  │ 3        │ 12      │
│  2   │ Software │ SW   │ $30,000.00  │ $15,000│ 50%  │ 2        │ 8       │
└──────┴──────────┴──────┴─────────────┴────────┴──────┴──────────┴─────────┘
```

**變更後**（9 欄，在 Total Budget 後插入 Total Requested）：
```
┌──────┬──────────┬──────┬─────────────┬─────────────────┬────────┬──────┬──────────┬─────────┐
│ Sort │ Category │ Code │ Total Budget│ Total Requested │ Used   │ Rate │ Projects │Expenses │
├──────┼──────────┼──────┼─────────────┼─────────────────┼────────┼──────┼──────────┼─────────┤
│  1   │ Hardware │ HW   │ $50,000.00  │ $42,000.00      │ $25,000│ 50%  │ 3        │ 12      │
│  2   │ Software │ SW   │ $30,000.00  │ $18,000.00      │ $15,000│ 50%  │ 2        │ 8       │
└──────┴──────────┴──────┴─────────────┴─────────────────┴────────┴──────┴──────────┴─────────┘
```

---

## 2. 功能需求

### 2.1 核心需求

| 編號 | 需求 | 優先級 | 說明 |
|------|------|--------|------|
| R-01 | Basic Info 新增 Total Requested | High | 顯示整個 Pool 所有專案的 requestedAmount 總和 |
| R-02 | Categories 表格新增 Total Requested 欄 | High | 每個 Category 顯示其所有專案的 requestedAmount 總和 |
| R-03 | 唯讀顯示 | High | 此資料僅供參考，不可編輯 |
| R-04 | 即時計算 | Medium | 資料基於最新的 ProjectBudgetCategory 記錄 |

### 2.2 業務規則

1. **Pool 級 Total Requested 計算**：
   ```
   Pool Total Requested = SUM(ProjectBudgetCategory.requestedAmount)
                          WHERE budgetCategory.budgetPoolId = [current pool]
                          AND isActive = true
   ```

2. **Category 級 Total Requested 計算**：
   ```
   Category Total Requested = SUM(ProjectBudgetCategory.requestedAmount)
                              WHERE budgetCategoryId = [current category]
                              AND isActive = true
   ```

3. **金額格式**：與頁面既有金額格式一致（USD，2 位小數，千分位逗號）

---

## 3. 技術設計

### 3.1 API 變更

**方案：擴展現有 `budgetPool.getById` 回傳資料**

在 `packages/api/src/routers/budgetPool.ts` 的 `getById` procedure 中，增加計算邏輯：

```typescript
// 在 getById query 中新增 aggregation
const requestedAmounts = await ctx.prisma.projectBudgetCategory.groupBy({
  by: ['budgetCategoryId'],
  where: {
    isActive: true,
    budgetCategory: {
      budgetPoolId: input.id,
      isActive: true,
    },
  },
  _sum: {
    requestedAmount: true,
  },
});

// 轉為 Map
const requestedMap = new Map(
  requestedAmounts.map(item => [
    item.budgetCategoryId,
    item._sum.requestedAmount ?? 0,
  ])
);

// 擴展 categories 回傳
const categoriesWithRequested = pool.categories.map(cat => ({
  ...cat,
  totalRequestedAmount: requestedMap.get(cat.id) ?? 0,
  utilizationRate: ...,
}));

// 計算 Pool 級總計
const computedTotalRequested = requestedAmounts.reduce(
  (sum, item) => sum + (item._sum.requestedAmount ?? 0),
  0
);

return {
  ...pool,
  categories: categoriesWithRequested,
  computedTotalAmount: totalAmount,
  computedTotalRequested: computedTotalRequested, // 新增
  computedUsedAmount: usedAmount,
  utilizationRate: ...,
};
```

### 3.2 前端變更

**檔案**: `apps/web/src/app/[locale]/budget-pools/[id]/page.tsx`

1. **Basic Information 區域**：在 Total Budget 和 Used Amount 之間新增一行 Total Requested
2. **Budget Categories 表格**：在 Total Budget 欄後新增 Total Requested 欄

### 3.3 I18N

新增翻譯 Key：

**en.json**：
```json
{
  "budgetPools": {
    "detail": {
      "basicInfo": {
        "totalRequested": "Total Requested"
      },
      "categories": {
        "totalRequested": "Total Requested"
      }
    }
  }
}
```

**zh-TW.json**：
```json
{
  "budgetPools": {
    "detail": {
      "basicInfo": {
        "totalRequested": "總申請金額"
      },
      "categories": {
        "totalRequested": "總申請金額"
      }
    }
  }
}
```

---

## 4. 影響範圍

| 層級 | 檔案 | 變更內容 |
|------|------|----------|
| **API** | `packages/api/src/routers/budgetPool.ts` | 擴展 `getById` 增加 requestedAmount aggregation |
| **前端頁面** | `apps/web/src/app/[locale]/budget-pools/[id]/page.tsx` | Basic Info + Categories 表格新增欄位 |
| **I18N** | `apps/web/src/messages/en.json` | 新增 `totalRequested` key |
| **I18N** | `apps/web/src/messages/zh-TW.json` | 新增 `totalRequested` key |

**影響頁面**：
- Budget Pool 詳情頁 (`/budget-pools/[id]`)

**無影響**：
- Budget Pool 列表頁（不顯示此欄位）
- Budget Pool 建立/編輯頁

---

## 5. 驗收標準

| 編號 | 驗收條件 | 測試方式 |
|------|----------|----------|
| AC-01 | Basic Info 顯示正確的 Pool 級 Total Requested 金額 | 手動測試 |
| AC-02 | Categories 表格每列顯示正確的 Category 級 Total Requested | 手動測試 |
| AC-03 | 無專案申請時顯示 $0.00 | 手動測試 |
| AC-04 | 新增/修改專案 Request Amount 後重新載入頁面，數據更新 | 手動測試 |
| AC-05 | 金額格式與頁面既有格式一致 | 視覺檢查 |
| AC-06 | I18N 英文/中文都正確顯示 | 手動測試 |

---

## 6. 與 CHANGE-039 的關係

| 項目 | CHANGE-039 | CHANGE-040 |
|------|------------|------------|
| **目標** | 專案頁面看其他專案申請額 | Budget Pool 頁面看所有專案總申請額 |
| **位置** | BudgetCategoryDetails 組件 | Budget Pool 詳情頁 |
| **排除邏輯** | 排除當前專案 | 不排除，顯示所有 |
| **API** | 新增獨立 procedure | 擴展現有 getById |
| **可獨立開發** | ✅ 是 | ✅ 是 |

兩個 CHANGE 共用相同的資料來源（`ProjectBudgetCategory.requestedAmount`），但查詢方式和顯示位置不同，**可以獨立開發和部署**。

---

## 7. 相關文檔

- **CHANGE-038**: 專案預算類別同步（前置功能）
- **CHANGE-039**: Budget Category 其他專案已申請金額（相關功能）
- **budgetPool.ts**: 目標 API Router
- **budget-pools/[id]/page.tsx**: 目標頁面
- **schema.prisma**: ProjectBudgetCategory model
