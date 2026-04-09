# FIX-107 / FIX-108: .gitignore、Middleware 路由、文檔修正

> **修復日期**: 2026-04-09
> **影響範圍**: 安全性（路由保護）、Git 忽略規則、分析文檔準確性

---

## FIX-107: .gitignore 路徑修正

**問題**: `.azure/output/` 規則帶有錯誤的前導點 (`.`)，實際目錄為 `azure/output/`（無點），導致該目錄的敏感檔案未被 gitignore 匹配。

**修改檔案**:
- `.gitignore` — `.azure/output/` → `azure/output/`

---

## FIX-108: Middleware 受保護路由修正

**問題 1**: `protectedRoutes` 陣列中使用 `/budget-proposals`，但實際路由目錄為 `/proposals`，導致提案頁面未受認證保護。

**問題 2**: `/project-data-import` 路由缺少保護，任何未登入使用者可訪問專案數據匯入頁面。

**修改檔案**:
- `apps/web/src/middleware.ts` — `/budget-proposals` → `/proposals`，新增 `/project-data-import`
- `apps/web/src/auth.config.ts` — 同步修正（兩個檔案維持一致的受保護路由列表）

---

## DOC-FIX: 分析文檔錯誤修正

### 1. ER 圖 — 移除 hasItems 幽靈欄位
- `docs/codebase-analyze/09-diagrams/er-diagram.md` — OMExpense entity 中移除 `hasItems` 欄位（schema.prisma 中不存在此欄位）

### 2. Schema 總覽 — 修正 Expense 狀態值
- `docs/codebase-analyze/05-database/schema-overview.md` — Expense status 從 `Draft, PendingApproval, Approved, Paid, Rejected` 修正為 `Draft, Submitted, Approved, Paid`（與 expense.ts 中 `ExpenseStatusEnum` 一致）

### 3. 業務流程圖 — 修正 revertToDraft 權限
- `docs/codebase-analyze/09-diagrams/business-process.md` — 提案 revertToDraft 操作權限從 "Admin/PM" 修正為 "Admin/Supervisor"（與 budgetProposal.ts 程式碼一致）

### 4. 頁面索引 — 修正頁面數量
- `docs/codebase-analyze/03-frontend-pages/page-index.md` — 頁面數從 62 修正為 60

### 5. SUMMARY.md — 修正多項數值
- `docs/codebase-analyze/SUMMARY.md`:
  - 頁面數 62 → 60
  - Mermaid 圖表數 29 → 30（兩處）
  - 分析文件總數 53 (48+5) → 77 (48+29)

### 6. Model 詳細規格 — 移除 hasItems
- `docs/codebase-analyze/05-database/model-detail.md` — OMExpense model 移除 `hasItems` 欄位列

---

## 驗證方式

| 項目 | 驗證方法 |
|------|----------|
| .gitignore | `git check-ignore azure/output/test` 應匹配 |
| Middleware 路由 | 確認 `/proposals` 和 `/project-data-import` 在受保護列表中 |
| hasItems 欄位 | `grep hasItems packages/db/prisma/schema.prisma` 應無結果 |
| Expense 狀態 | `grep ExpenseStatusEnum packages/api/src/routers/expense.ts` 確認為 Draft/Submitted/Approved/Paid |
| revertToDraft 權限 | `grep -A5 revertToDraft packages/api/src/routers/budgetProposal.ts` 確認檢查 Admin/Supervisor |
