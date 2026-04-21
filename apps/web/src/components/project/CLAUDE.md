# Project Components — 專案核心 CRUD

> **Last Updated**: 2026-04-21
> **複雜度**: ⭐⭐⭐（核心實體，欄位多）
> **相關規則**: `.claude/rules/components.md`
> **深度分析參考**:
> - `docs/codebase-analyze/04-components/detail/business-components.md`（project 章節）
> - `docs/codebase-analyze/02-api-layer/detail/project.md` — Project Router（84KB，最大的 Router）
> - `docs/codebase-analyze/05-database/model-detail.md#project` — Project 與 ProjectBudgetCategory 關聯

## 📋 目錄用途

專案（Project）是本平台的**核心實體**，串接：
- **上游**：BudgetPool（預算池）、Manager/Supervisor（User）
- **下游**：BudgetProposal、PurchaseOrder、Expense、ChargeOut

此目錄含 Project 的表單與預算類別管理組件。

## 🏗️ 檔案結構

```
project/
├── ProjectForm.tsx             # 813 行 — 專案建立/編輯表單（含 FEAT-001 擴展欄位）
└── BudgetCategoryDetails.tsx   # 216 行 — Project 預算類別分配展示（CHANGE-038）
```

## 🎯 核心業務邏輯

### ProjectForm.tsx

**核心欄位分組**：

| 類別 | 欄位 |
|------|------|
| 基本資訊 | name, code, description, status |
| 組織關係 | budgetPoolId（必填）、managerId、supervisorId、opCos[]（多對多）|
| 時程 | startDate, endDate |
| 財務（FEAT-001）| currency, currentFY budget, lastFY actual, isOngoing（持續性專案）|
| 分類（CHANGE-038）| budgetCategories[]（多對多透過 `ProjectBudgetCategory`）|

**模式邏輯**：
- **建立**：所有欄位輸入 → `project.create`
- **編輯**：允許更新所有欄位 → `project.update`
- **budgetPoolId 限制**：編輯時若有已 Approved 的 Proposal，不可變更預算池（API 層 enforce）

### BudgetCategoryDetails.tsx（CHANGE-038）

展示專案已分配的預算類別分類資訊：
- 顯示 `ProjectBudgetCategory` 關聯表的內容
- 每個 Category 顯示已使用金額 vs 已分配金額
- 僅讀；分配邏輯在 ProjectForm 內處理

## 🔗 依賴關係

- **API Router**: `packages/api/src/routers/project.ts`（關鍵 procedures: `create`, `update`, `getBudgetUsage`, `chargeOut`, `export`, `getSummary`）
- **Prisma Models**: `Project` ↔ `User` (manager/supervisor) ↔ `BudgetPool` ↔ `BudgetCategory` ↔ `OperatingCompany`
- **頁面路由**: `apps/web/src/app/[locale]/projects/`
- **匯入模組**: `apps/web/src/app/[locale]/project-data-import/`（FEAT-010 Excel 匯入）

## ⚠️ 開發注意事項

1. **FEAT-009 OpCo 權限**：某些 OpCo 受限於 `UserOperatingCompany` 表；Manager 只看得到有權限的 OpCo — 前端下拉選單需過濾
2. **isOngoing 持續性專案（FEAT-001）**：持續性專案的 `endDate` 可為 null；報表邏輯會用 `isOngoing` 分流
3. **currency 欄位影響下游**：變更 Project currency 會影響 Proposal/Expense 的金額顯示；API 有跨幣別轉換邏輯（`currency.ts`）
4. **預算類別分配**：`ProjectBudgetCategory` 關聯表欄位為 `projectId + budgetCategoryId + allocatedAmount`；編輯時需處理新增/移除/修改三情境
5. **supervisorId / managerId 可相同**：業務上允許同一人擔任兩角色（小團隊常見）
6. **CHANGE-036**：專案詳情頁新增更多欄位顯示（如 chargeOut 統計）

## 🐛 已知陷阱

- **權限 UI 不等於 API 驗證**：`adminProcedure` 才是真實防線；Manager 不可建立自己不擔任 manager 的專案
- **編輯 vs 建立的 dirty check 差異**：編輯模式下 `isDirty` 判斷要考慮 opCos/budgetCategories 這些陣列差異
- **currency 變更風險**：若專案已有 Expense，變更 currency 不會重算歷史資料 — 應在 UI 給警告

## 🔄 相關變更歷史

- **Epic 2**: 專案 CRUD 基礎
- **FEAT-001**: currency、currentFY、lastFY、isOngoing 欄位擴展
- **FEAT-006**: Project Summary 統計
- **FEAT-009**: OpCo 權限過濾
- **FEAT-010**: Excel 批量匯入
- **CHANGE-036**: 詳情頁欄位增強
- **CHANGE-038**: ProjectBudgetCategory 多對多關聯
