# CHANGE-038: 專案預算類別同步 (Project Budget Category Sync)

> **建立日期**: 2025-01-26
> **完成日期**: -
> **狀態**: 📋 設計中 (待用戶確認)
> **優先級**: Medium
> **類型**: 現有功能增強 (Enhancement)

---

## 1. 變更概述

### 1.1 背景

目前的資料模型中，Project 與 BudgetCategory 之間是**單一對應關係**：

```
Project.budgetCategoryId → BudgetCategory (可選, 1:N)
```

一個 Project 只能關聯**一個** BudgetCategory。然而，業務上一個專案可能涉及多個預算類別的支出（例如同時包含 Hardware、Software、Services 費用）。

現有限制：
- 每個 Project 只能選擇一個 BudgetCategory
- 無法在專案層級管理多個類別的預算分配
- 缺少專案層級的預算類別金額追蹤

### 1.2 目標

當 Project 選定 BudgetPool 後，**自動同步**該 Budget Pool 下所有啟用的 BudgetCategory 到專案層級，並允許為每個類別設定獨立的預算金額。

**核心流程**：
```
1. 用戶建立/編輯 Project → 選擇 Budget Pool
2. 系統自動帶入該 Pool 下所有 active BudgetCategory
3. 用戶為每個類別設定此專案的預算金額 (requestedAmount)
4. 審批後可設定 approvedAmount
5. 追蹤每個類別的實際支出
```

---

## 2. 功能需求

### 2.1 核心需求

| 編號 | 需求 | 優先級 | 說明 |
|------|------|--------|------|
| R-01 | Budget Pool 類別自動同步 | High | 選擇 BudgetPool 時，自動帶入該 Pool 下所有 active BudgetCategory |
| R-02 | 專案層級金額設定 | High | 每個同步的類別可設定 requestedAmount 和 approvedAmount |
| R-03 | Budget Pool 切換時重新同步 | High | 更換 BudgetPool 時，清除舊類別並同步新類別 |
| R-04 | 手動觸發同步 | Medium | 當 BudgetPool 新增類別後，專案可手動觸發同步 |
| R-05 | 類別金額總計驗證 | Medium | 各類別 requestedAmount 總和不應超過 Project.requestedBudget |
| R-06 | 實際支出追蹤 | Low | 記錄每個類別的實際支出金額 (actualAmount) |

### 2.2 業務規則

1. **同步觸發時機**：
   - 建立 Project 並選擇 BudgetPool 時
   - 編輯 Project 更換 BudgetPool 時
   - 用戶手動點擊「同步類別」按鈕時

2. **同步行為**：
   - 只同步 `isActive = true` 的 BudgetCategory
   - 同步後的 ProjectBudgetCategory 金額預設為 0
   - 已有金額設定的類別，重新同步時保留金額（不覆蓋）
   - 若 BudgetPool 的某個類別被停用，對應的 ProjectBudgetCategory 標記為 inactive 但不刪除

3. **金額管理**：
   - requestedAmount：專案申請的預算金額（PM 填寫）
   - approvedAmount：審批後的預算金額（Supervisor 審批）
   - actualAmount：實際支出金額（系統自動計算，或手動填寫）

4. **權限控制**：
   - PM：可同步類別、設定 requestedAmount
   - Supervisor：可設定 approvedAmount
   - Admin：完整權限

### 2.3 與現有 budgetCategoryId 的關係

| 方案 | 說明 | 優點 | 缺點 |
|------|------|------|------|
| **A: 保留 budgetCategoryId** | 保留現有單一類別欄位，新增多類別同步作為擴展 | 向後兼容、低風險 | 兩套機制並存，可能混淆 |
| **B: 替換 budgetCategoryId** | 移除 Project.budgetCategoryId，完全改用多類別模式 | 資料模型統一、清晰 | 需遷移現有資料、影響範圍大 |
| **C: 漸進過渡** | 先實現多類別同步，標記 budgetCategoryId 為 deprecated，下個版本移除 | 風險最低、可分階段 | 過渡期兩套機制並存 |

**建議**：方案 C（漸進過渡）。先不動 `budgetCategoryId`，新增 `ProjectBudgetCategory` 模型實現多類別管理，後續版本再評估是否移除舊欄位。

---

## 3. 技術設計

### 3.1 Schema 變更

#### 新增模型：ProjectBudgetCategory

```prisma
model ProjectBudgetCategory {
  id               String  @id @default(uuid())
  projectId        String
  budgetCategoryId String

  // 金額管理
  requestedAmount  Float   @default(0)  // PM 申請金額
  approvedAmount   Float?               // Supervisor 審批金額
  actualAmount     Float   @default(0)  // 實際支出金額

  // 排序與狀態
  sortOrder        Int     @default(0)
  isActive         Boolean @default(true)
  notes            String? @db.Text

  // 時間戳
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // 關聯
  project          Project        @relation(fields: [projectId], references: [id], onDelete: Cascade)
  budgetCategory   BudgetCategory @relation(fields: [budgetCategoryId], references: [id], onDelete: Restrict)

  @@unique([projectId, budgetCategoryId])
  @@index([projectId])
  @@index([budgetCategoryId])
  @@index([isActive])
}
```

#### 修改現有模型

```prisma
// Project 模型新增關聯
model Project {
  // ... 現有欄位不變
  budgetCategories ProjectBudgetCategory[]  // 新增
}

// BudgetCategory 模型新增關聯
model BudgetCategory {
  // ... 現有欄位不變
  projectBudgetCategories ProjectBudgetCategory[]  // 新增
}
```

### 3.2 後端 API 變更

#### 新增 Procedures（在 project.ts Router 中擴展）

| Procedure | 類型 | 權限 | 說明 |
|-----------|------|------|------|
| `syncBudgetCategories` | mutation | protectedProcedure | 同步 Budget Pool 類別到 Project |
| `getProjectBudgetCategories` | query | protectedProcedure | 取得 Project 的所有預算類別 |
| `updateProjectBudgetCategory` | mutation | protectedProcedure | 更新單一專案預算類別金額 |
| `batchUpdateProjectBudgetCategories` | mutation | protectedProcedure | 批量更新專案預算類別金額 |
| `getProjectBudgetCategorySummary` | query | protectedProcedure | 取得專案預算類別匯總 |

#### Zod Schema 定義

```typescript
const syncBudgetCategoriesSchema = z.object({
  projectId: z.string().uuid(),
});

const updateProjectBudgetCategorySchema = z.object({
  id: z.string().uuid(),
  requestedAmount: z.number().min(0).optional(),
  approvedAmount: z.number().min(0).optional(),
  notes: z.string().optional(),
});

const batchUpdateProjectBudgetCategoriesSchema = z.object({
  projectId: z.string().uuid(),
  categories: z.array(z.object({
    budgetCategoryId: z.string().uuid(),
    requestedAmount: z.number().min(0),
    notes: z.string().optional(),
  })),
});
```

#### syncBudgetCategories 核心邏輯

```typescript
// 1. 取得 Project 的 budgetPoolId
// 2. 查詢 Pool 下所有 active BudgetCategory
// 3. 使用 upsert 同步（已存在的保留金額，新的建立）
// 4. 標記 Pool 中已不存在的類別為 inactive
```

### 3.3 前端變更

#### 新增組件

| 組件 | 路徑 | 說明 |
|------|------|------|
| `ProjectBudgetCategoryTable` | `components/project/ProjectBudgetCategoryTable.tsx` | 專案預算類別表格（顯示/編輯） |
| `ProjectBudgetCategorySummary` | `components/project/ProjectBudgetCategorySummary.tsx` | 預算類別匯總卡片 |
| `SyncBudgetCategoriesButton` | `components/project/SyncBudgetCategoriesButton.tsx` | 同步類別按鈕 |

#### 修改頁面

| 頁面 | 修改內容 |
|------|----------|
| `projects/new/page.tsx` | 選擇 BudgetPool 後，自動觸發類別同步並顯示類別表格 |
| `projects/[id]/page.tsx` | 專案詳情頁新增「預算類別」區塊 |
| `projects/[id]/edit/page.tsx` | 編輯頁面整合類別金額編輯 |

#### UI 互動流程

```
建立/編輯 Project 頁面：
┌─────────────────────────────────────────────────┐
│ 專案資訊                                         │
│                                                  │
│ Budget Pool: [▼ FY2025 IT Budget Pool    ]       │
│                                                  │
│ ┌─ 預算類別分配 ──────────────────────── [🔄同步]│
│ │                                               ││
│ │ 類別        | 代碼 | Pool 總額 | 申請金額      ││
│ │ ─────────────────────────────────────────────  ││
│ │ Hardware    | HW   | 500,000  | [________]    ││
│ │ Software    | SW   | 300,000  | [________]    ││
│ │ Services    | SVC  | 200,000  | [________]    ││
│ │ Consulting  | CON  | 150,000  | [________]    ││
│ │ ─────────────────────────────────────────────  ││
│ │ 合計                 1,150,000  0             ││
│ └────────────────────────────────────────────── ││
│                                                  │
│                        [取消]  [儲存]             │
└─────────────────────────────────────────────────┘
```

### 3.4 I18N 翻譯鍵

```json
{
  "projects": {
    "budgetCategories": {
      "title": "預算類別分配",
      "syncButton": "同步類別",
      "syncSuccess": "類別同步成功",
      "syncConfirm": "確定要重新同步預算類別嗎？",
      "table": {
        "categoryName": "類別名稱",
        "categoryCode": "類別代碼",
        "poolTotal": "Pool 總額",
        "requestedAmount": "申請金額",
        "approvedAmount": "核准金額",
        "actualAmount": "實際支出",
        "notes": "備註"
      },
      "summary": {
        "totalRequested": "申請總計",
        "totalApproved": "核准總計",
        "totalActual": "實際總計"
      },
      "empty": "尚無預算類別",
      "noBudgetPool": "請先選擇預算池"
    }
  }
}
```

---

## 4. 影響範圍

### 4.1 修改文件

| 文件 | 變更類型 | 說明 |
|------|----------|------|
| `packages/db/prisma/schema.prisma` | 修改 | 新增 ProjectBudgetCategory 模型，擴展 Project/BudgetCategory 關聯 |
| `packages/api/src/routers/project.ts` | 修改 | 新增 5 個 procedures |
| `apps/web/src/components/project/ProjectBudgetCategoryTable.tsx` | 新增 | 預算類別表格組件 |
| `apps/web/src/components/project/ProjectBudgetCategorySummary.tsx` | 新增 | 匯總卡片組件 |
| `apps/web/src/components/project/SyncBudgetCategoriesButton.tsx` | 新增 | 同步按鈕組件 |
| `apps/web/src/app/[locale]/projects/new/page.tsx` | 修改 | 整合類別同步流程 |
| `apps/web/src/app/[locale]/projects/[id]/page.tsx` | 修改 | 新增預算類別顯示區塊 |
| `apps/web/src/app/[locale]/projects/[id]/edit/page.tsx` | 修改 | 類別金額編輯 |
| `apps/web/src/messages/en.json` | 修改 | 新增翻譯鍵 |
| `apps/web/src/messages/zh-TW.json` | 修改 | 新增翻譯鍵 |

### 4.2 不受影響的部分

- BudgetPool CRUD（不變）
- BudgetCategory CRUD（不變）
- 現有 Project.budgetCategoryId 欄位（保留，不修改）
- Expense、PO、ChargeOut 流程（不變）
- 通知系統（不變）

---

## 5. 驗收標準

### 5.1 功能驗收
- [ ] 建立 Project 選擇 BudgetPool 後，自動同步所有 active 類別
- [ ] 同步後可為每個類別輸入 requestedAmount
- [ ] 切換 BudgetPool 時，舊類別被清除，新類別被同步
- [ ] 手動同步按鈕可重新同步類別（保留已有金額）
- [ ] 專案詳情頁正確顯示預算類別和金額
- [ ] 編輯頁面可修改類別金額
- [ ] 各類別金額合計正確顯示

### 5.2 技術驗收
- [ ] TypeScript 類型完整，無 any
- [ ] I18N 中英文翻譯完整
- [ ] `pnpm validate:i18n` 通過
- [ ] Prisma Migration 正常執行

---

## 6. 實施計劃

### Phase 1: 資料模型 (Schema + Migration)
1. 新增 `ProjectBudgetCategory` 模型到 `schema.prisma`
2. 新增 Project 和 BudgetCategory 的反向關聯
3. 執行 `pnpm db:migrate` 建立遷移
4. 執行 `pnpm db:generate` 重新生成 Prisma Client

### Phase 2: 後端 API
1. 實現 `syncBudgetCategories` procedure
2. 實現 `getProjectBudgetCategories` procedure
3. 實現 `updateProjectBudgetCategory` procedure
4. 實現 `batchUpdateProjectBudgetCategories` procedure
5. 實現 `getProjectBudgetCategorySummary` procedure
6. 整合到現有 `create` 和 `update` procedure

### Phase 3: 前端組件 + 頁面整合
1. 建立 3 個新組件
2. 修改 Project 建立/詳情/編輯頁面
3. 新增 I18N 翻譯鍵
4. 執行 `pnpm validate:i18n`

### Phase 4: 測試驗證
1. 功能測試
2. UI 測試（中英文兩種語言）

---

## 7. 相關文檔

- **Schema**: `packages/db/prisma/schema.prisma` — BudgetPool (line ~165), BudgetCategory (line ~538), Project (line ~184)
- **API**: `packages/api/src/routers/project.ts` — create (line ~638), update (line ~802), getBudgetUsage (line ~549)
- **現有功能**: Project 建立頁面已支援選擇 BudgetPool 和單一 BudgetCategory

---

## 8. 設計決策待確認

### Q1: 過渡方案選擇
**選項**:
- A) 保留現有 budgetCategoryId，新增多類別作為擴展
- B) 移除 budgetCategoryId，完全改用多類別模式
- C) 漸進過渡，先新增多類別，後續再移除舊欄位

**建議**: C) 漸進過渡

### Q2: 切換 BudgetPool 時的舊資料處理
**選項**:
- A) 直接刪除舊類別資料
- B) 標記 inactive 保留歷史記錄
- C) 歸檔到獨立表

**建議**: B) 標記 inactive

### Q3: approvedAmount 審批流程
**選項**:
- A) 需要 Supervisor 逐一審批每個類別金額
- B) Supervisor 審批專案總額，不涉及類別層級
- C) 視業務流程決定

**建議**: 待確認

### Q4: actualAmount 來源
**選項**:
- A) 系統自動從 Expense 計算
- B) PM 手動填寫
- C) 兩者皆支援

**建議**: 待確認

### Q5: BudgetPool 新增類別後的通知
**選項**:
- A) 自動通知相關 Project
- B) 不通知，由 PM 手動同步
- C) 作為後續增強

**建議**: C) 作為後續增強

---

**備註**：此文件為功能規劃文件，僅供檢視確認。確認後將依照實施計劃進行開發。所有程式碼修改、資料庫遷移、翻譯鍵建立均在正式開發階段執行。
