# CHANGE-039: Budget Category 其他專案已申請金額顯示

> **建立日期**: 2026-01-27
> **完成日期**: -
> **狀態**: ✅ 已完成
> **優先級**: Medium
> **類型**: 現有功能增強 (Enhancement)
> **前置依賴**: CHANGE-038 (Project Budget Category Sync)

---

## 1. 變更概述

### 1.1 背景

CHANGE-038 實現了專案與 Budget Pool Category 的同步功能，用戶在專案頁面可以看到每個 Budget Category 的 **Budget Amount**（預算總額）和 **Request Amount**（本專案申請金額）。

然而，用戶在填寫 Request Amount 時，**無法得知同一 Budget Category 已被其他專案申請了多少金額**。這會導致：
- 用戶不知道剩餘可用預算有多少
- 可能過度申請超出可用額度
- 需要額外查看 Budget Pool 頁面才能了解整體情況

### 1.2 目標

在 `BudgetCategoryDetails` 組件的表格中，**在 Budget Amount 和 Request Amount 之間**新增一欄 **「Others Requested」**，顯示**同一 Budget Category 下其他專案已申請的金額總和**（排除當前專案）。

### 1.3 視覺效果

**現狀**（4 欄）：
```
┌──────────────┬──────┬──────────────┬────────────────┐
│ Category     │ Code │ Budget Amount│ Request Amount │
├──────────────┼──────┼──────────────┼────────────────┤
│ 1. Hardware  │ HW   │ $50,000      │ [Input: 10000] │
│ 2. Software  │ SW   │ $30,000      │ [Input: 5000]  │
│ 3. Services  │ SVC  │ $20,000      │ [Input: 3000]  │
└──────────────┴──────┴──────────────┴────────────────┘
```

**變更後**（5 欄）：
```
┌──────────────┬──────┬──────────────┬──────────────────┬────────────────┐
│ Category     │ Code │ Budget Amount│ Others Requested │ Request Amount │
├──────────────┼──────┼──────────────┼──────────────────┼────────────────┤
│ 1. Hardware  │ HW   │ $50,000      │ $35,000          │ [Input: 10000] │
│ 2. Software  │ SW   │ $30,000      │ $12,000          │ [Input: 5000]  │
│ 3. Services  │ SVC  │ $20,000      │ $0               │ [Input: 3000]  │
└──────────────┴──────┴──────────────┴──────────────────┴────────────────┘
```

---

## 2. 功能需求

### 2.1 核心需求

| 編號 | 需求 | 優先級 | 說明 |
|------|------|--------|------|
| R-01 | 新增 Others Requested 欄位 | High | 在 Budget Amount 和 Request Amount 之間插入新欄 |
| R-02 | 排除當前專案 | High | 計算時不包含當前專案的 requestedAmount |
| R-03 | 三種模式支援 | High | create / edit / readonly 模式都要顯示此欄 |
| R-04 | 唯讀顯示 | High | 此欄位永遠不可編輯，僅供參考 |

### 2.2 業務規則

1. **計算公式**：
   ```
   Others Requested = SUM(ProjectBudgetCategory.requestedAmount)
                      WHERE budgetCategoryId = [current category]
                      AND projectId != [current project]
                      AND isActive = true
   ```

2. **Create 模式**：
   - 當前專案尚無 projectId，所以 Others Requested = 該 BudgetCategory 下所有專案的 requestedAmount 總和
   - 因為新專案還沒有記錄，不需要排除

3. **Edit / Readonly 模式**：
   - 必須排除當前專案（`projectId`）的 requestedAmount

4. **金額格式**：與 Budget Amount 一致，使用 `$X,XXX` 格式

---

## 3. 技術設計

### 3.1 API 變更

**方案：新增 API Procedure**

在 `packages/api/src/routers/project.ts` 或 `budgetPool.ts` 中新增：

```typescript
// 取得 Budget Pool 下各 Category 的其他專案已申請金額
getOthersRequestedAmounts: protectedProcedure
  .input(z.object({
    budgetPoolId: z.string().min(1),
    excludeProjectId: z.string().optional(), // edit/readonly 模式傳入，create 模式不傳
  }))
  .query(async ({ ctx, input }) => {
    const result = await ctx.prisma.projectBudgetCategory.groupBy({
      by: ['budgetCategoryId'],
      where: {
        isActive: true,
        budgetCategory: {
          budgetPoolId: input.budgetPoolId,
          isActive: true,
        },
        ...(input.excludeProjectId && {
          projectId: { not: input.excludeProjectId },
        }),
      },
      _sum: {
        requestedAmount: true,
      },
    });

    // 轉為 Record<budgetCategoryId, totalOthersRequested>
    return result.reduce((acc, item) => {
      acc[item.budgetCategoryId] = item._sum.requestedAmount ?? 0;
      return acc;
    }, {} as Record<string, number>);
  }),
```

### 3.2 前端變更

**檔案**: `apps/web/src/components/project/BudgetCategoryDetails.tsx`

1. 新增 API 查詢取得 othersRequested 資料
2. 表格新增一欄顯示 Others Requested
3. 調整各欄寬度比例

**欄位寬度調整**：
```
現狀：Category(40%) | Code(15%) | Budget Amount(20%) | Request Amount(25%)
變更：Category(30%) | Code(10%) | Budget Amount(20%) | Others Requested(20%) | Request Amount(20%)
```

### 3.3 I18N

新增翻譯 Key：
```json
{
  "projects": {
    "form": {
      "fields": {
        "budgetCategoryDetails": {
          "table": {
            "othersRequested": "Others Requested"
          }
        }
      }
    }
  }
}
```

zh-TW：
```json
{
  "table": {
    "othersRequested": "其他專案已申請"
  }
}
```

---

## 4. 影響範圍

| 層級 | 檔案 | 變更內容 |
|------|------|----------|
| **API** | `packages/api/src/routers/project.ts` 或 `budgetPool.ts` | 新增 `getOthersRequestedAmounts` procedure |
| **前端組件** | `apps/web/src/components/project/BudgetCategoryDetails.tsx` | 新增欄位、查詢、顯示 |
| **I18N** | `apps/web/src/messages/en.json` | 新增 `othersRequested` key |
| **I18N** | `apps/web/src/messages/zh-TW.json` | 新增 `othersRequested` key |

**影響頁面**（共用 BudgetCategoryDetails 組件）：
- 專案建立頁 (`/projects/new`)
- 專案編輯頁 (`/projects/[id]/edit`)
- 專案詳情頁 (`/projects/[id]`)

---

## 5. 驗收標準

| 編號 | 驗收條件 | 測試方式 |
|------|----------|----------|
| AC-01 | 建立專案時，Others Requested 顯示該類別所有已申請金額總和 | 手動測試 |
| AC-02 | 編輯專案時，Others Requested 排除當前專案的金額 | 手動測試 |
| AC-03 | 詳情頁唯讀模式正確顯示 Others Requested | 手動測試 |
| AC-04 | 無任何專案申請時顯示 $0 | 手動測試 |
| AC-05 | 切換 Budget Pool 時，Others Requested 跟著更新 | 手動測試 |
| AC-06 | I18N 英文/中文都正確顯示欄位標題 | 手動測試 |

---

## 6. 相關文檔

- **CHANGE-038**: 專案預算類別同步（前置功能）
- **BudgetCategoryDetails.tsx**: 目標組件
- **schema.prisma**: ProjectBudgetCategory model
