# Group 1: 核心工作流前端頁面分析

> **分析範圍**: 8 個路由模組，31 個 `.tsx` 頁面檔案
> **分析日期**: 2026-04-09
> **基礎路徑**: `apps/web/src/app/[locale]/`
> **總行數**: 約 12,920 行

---

## 目錄

1. [dashboard/ - 儀表板](#1-dashboard---儀表板)
2. [projects/ - 專案管理](#2-projects---專案管理)
3. [proposals/ - 預算提案](#3-proposals---預算提案)
4. [budget-pools/ - 預算池](#4-budget-pools---預算池)
5. [expenses/ - 費用記錄](#5-expenses---費用記錄)
6. [charge-outs/ - 費用轉嫁](#6-charge-outs---費用轉嫁)
7. [purchase-orders/ - 採購單](#7-purchase-orders---採購單)
8. [quotes/ - 報價單](#8-quotes---報價單)

---

## 1. dashboard/ - 儀表板

### 1.1 路由結構

| 路由路徑 | 檔案 | 用途 |
|----------|------|------|
| `/dashboard` | `page.tsx` | 通用歡迎頁面 |
| `/dashboard/pm` | `pm/page.tsx` | 專案經理專用儀表板 |
| `/dashboard/supervisor` | `supervisor/page.tsx` | 主管戰略級儀表板 |

### 1.2 檔案清單

| 檔案 | 行數 | 頁面類型 | 用途 |
|------|------|----------|------|
| `dashboard/page.tsx` | 139 | Client (`'use client'`) | 簡化版歡迎頁面，展示系統名稱、用戶角色、日期 |
| `dashboard/pm/page.tsx` | 445 | Client (`'use client'`) | PM 操作視圖：統計卡片、專案列表、待處理任務 |
| `dashboard/supervisor/page.tsx` | 452 | Client (`'use client'`) | Supervisor 全局視圖：預算池概覽、專案篩選、CSV 導出 |

**子路由數**: 3 | **總行數**: 1,036

### 1.3 tRPC 查詢/Mutations

| 頁面 | Procedure | 類型 |
|------|-----------|------|
| `page.tsx` | (無 tRPC 查詢) | - |
| `pm/page.tsx` | `api.dashboard.getProjectManagerDashboard.useQuery()` | Query |
| `supervisor/page.tsx` | `api.dashboard.getSupervisorDashboard.useQuery(...)` | Query |
| `supervisor/page.tsx` | `api.dashboard.getProjectManagers.useQuery()` | Query |
| `supervisor/page.tsx` | `api.dashboard.exportProjects.query(...)` | Direct Query (CSV 導出) |

### 1.4 組件依賴

**共用組件**:
- `DashboardLayout` (`@/components/layout/dashboard-layout`)
- `Card`, `CardContent`, `CardHeader`, `CardTitle` (`@/components/ui/card`)
- `Skeleton` (`@/components/ui/skeleton`)
- `Alert`, `AlertDescription` (`@/components/ui/alert`)

**PM 專用**:
- `StatCard` (`@/components/dashboard/StatCard`)
- `Badge` (`@/components/ui/badge`)
- `Button` (`@/components/ui/button`)
- `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger` (`@/components/ui/tabs`)

**Supervisor 專用**:
- `StatCard` (`@/components/dashboard/StatCard`)
- `BudgetPoolOverview` (`@/components/dashboard/BudgetPoolOverview`)
- `NativeSelect` (`@/components/ui/select`)
- `PaginationControls` (`@/components/ui`)

### 1.5 i18n 命名空間

| 頁面 | 命名空間 |
|------|----------|
| `page.tsx` | `dashboard`, `users` |
| `pm/page.tsx` | `dashboardPM`, `common` |
| `supervisor/page.tsx` | `dashboardSupervisor`, `common` |

### 1.6 權限/角色控制

- `page.tsx`: 所有登入用戶可訪問（CHANGE-015 通用登陸頁面），讀取 `session.user.role.name` 顯示角色
- `pm/page.tsx`: ProjectManager 視圖，API 回傳僅自己管理的專案
- `supervisor/page.tsx`: Supervisor/Admin 視圖，API 層驗證角色權限，前端顯示角色錯誤提示

### 1.7 關鍵 UI 功能

| 功能 | 頁面 |
|------|------|
| 統計卡片 (StatCard) | PM, Supervisor |
| 預算概覽（金額/使用率） | PM |
| 預算池健康狀態 (BudgetPoolOverview) | Supervisor |
| 專案列表（卡片式，前 5 筆） | PM |
| 專案列表（篩選/分頁） | Supervisor |
| 待處理任務分頁 (Tabs) | PM |
| 狀態篩選 (NativeSelect) | Supervisor |
| 專案經理篩選下拉選單 | Supervisor |
| CSV 導出 (Blob download) | Supervisor |
| 分頁控制 (PaginationControls) | Supervisor |
| 骨架屏載入 (Skeleton) | PM, Supervisor |

### 1.8 頁面導航

- `page.tsx`: 無外部連結，透過 Sidebar 導航到 PM/Supervisor
- `pm/page.tsx`: 連結到 `/projects`, `/projects/new`, `/projects/[id]`, `/proposals/[id]`, `/expenses/[id]`
- `supervisor/page.tsx`: 連結到 `/projects/[id]`, `/budget-pools/[id]`

---

## 2. projects/ - 專案管理

### 2.1 路由結構

| 路由路徑 | 檔案 | 用途 |
|----------|------|------|
| `/projects` | `page.tsx` | 專案列表（搜尋/篩選/分頁/雙視圖） |
| `/projects/new` | `new/page.tsx` | 建立專案（動態載入 ProjectForm） |
| `/projects/[id]` | `[id]/page.tsx` | 專案詳情（統計/預算/提案/採購單） |
| `/projects/[id]/edit` | `[id]/edit/page.tsx` | 編輯專案（動態載入 ProjectForm） |
| `/projects/[id]/quotes` | `[id]/quotes/page.tsx` | 專案報價管理（上傳/比較/生成 PO） |

### 2.2 檔案清單

| 檔案 | 行數 | 頁面類型 | 用途 |
|------|------|----------|------|
| `projects/page.tsx` | 980 | Client | 列表頁：雙視圖(卡片/表格)、搜尋、多條件篩選、排序、分頁、CSV 導出、批量刪除 |
| `projects/new/page.tsx` | 113 | Client | 建立頁：動態載入 `ProjectForm` (mode="create") |
| `projects/[id]/page.tsx` | 1,223 | Client | 詳情頁：基本資訊、統計卡片、預算使用情況、提案列表、採購單列表、刪除/退回草稿 |
| `projects/[id]/edit/page.tsx` | 259 | Client | 編輯頁：動態載入 `ProjectForm` (mode="edit")，傳遞含 FEAT-001/006/010 擴展欄位的 initialData |
| `projects/[id]/quotes/page.tsx` | 515 | Client | 報價管理頁：上傳表單、統計卡片、比較列表、生成採購單 |

**子路由數**: 5 | **總行數**: 3,090

### 2.3 tRPC 查詢/Mutations

| 頁面 | Procedure | 類型 |
|------|-----------|------|
| `page.tsx` | `api.project.getAll.useQuery(...)` | Query (分頁/搜尋/篩選/排序) |
| `page.tsx` | `api.budgetPool.getAll.useQuery(...)` | Query (預算池篩選器) |
| `page.tsx` | `api.currency.getAll.useQuery(...)` | Query (幣別篩選器) |
| `page.tsx` | `api.project.getFiscalYears.useQuery()` | Query (財年篩選器) |
| `page.tsx` | `api.project.getProjectCategories.useQuery()` | Query (類別篩選器) |
| `page.tsx` | `api.project.deleteMany.useMutation(...)` | Mutation (批量刪除) |
| `[id]/page.tsx` | `api.project.getById.useQuery(...)` | Query |
| `[id]/page.tsx` | `api.project.getStats.useQuery(...)` | Query |
| `[id]/page.tsx` | `api.project.getBudgetUsage.useQuery(...)` | Query |
| `[id]/page.tsx` | `api.quote.getByProject.useQuery(...)` | Query |
| `[id]/page.tsx` | `api.project.delete.useMutation(...)` | Mutation |
| `[id]/page.tsx` | `api.project.revertToDraft.useMutation(...)` | Mutation |
| `[id]/edit/page.tsx` | `api.project.getById.useQuery(...)` | Query |
| `[id]/quotes/page.tsx` | `api.project.getById.useQuery(...)` | Query |
| `[id]/quotes/page.tsx` | `api.quote.getByProject.useQuery(...)` | Query |
| `[id]/quotes/page.tsx` | `api.quote.compare.useQuery(...)` | Query |
| `[id]/quotes/page.tsx` | `api.purchaseOrder.createFromQuote.useMutation(...)` | Mutation |

### 2.4 組件依賴

**業務組件**:
- `ProjectForm` (`@/components/project/ProjectForm`) - 動態載入 (`next/dynamic`)
- `BudgetCategoryDetails` (`@/components/project/BudgetCategoryDetails`)
- `QuoteUploadForm` (`@/components/quote/QuoteUploadForm`)
- `CurrencyDisplay` (`@/components/shared/CurrencyDisplay`)

**UI 組件**: `Card`, `Badge`, `Button`, `Input`, `Checkbox`, `Table`, `Breadcrumb`, `AlertDialog`, `Skeleton`, `Alert`

**Hooks**: `useDebounce` (`@/hooks/useDebounce`)
**工具**: `convertToCSV`, `downloadCSV`, `generateExportFilename` (`@/lib/exportUtils`)

### 2.5 i18n 命名空間

`projects`, `projects.detail`, `projects.form`, `projects.form.edit`, `common`, `common.status`, `navigation`, `navigation.menu`, `toast`, `quotes`

### 2.6 權限/角色控制

- 列表頁：PM 只看自己的專案 (API 層控制)，使用 `useSession` 取得角色
- 詳情頁：刪除按鈕僅 Supervisor/Admin 可見（CHANGE-019 狀態/權限檢查）
- 編輯頁：PM 可編輯自己管理的專案，Supervisor 可編輯全部

### 2.7 關鍵 UI 功能

| 功能 | 頁面 |
|------|------|
| 雙視圖切換（卡片/列表） | 列表頁 |
| 即時搜尋（防抖 300ms） | 列表頁 |
| 多條件篩選（預算池/狀態/全域旗標/優先權/幣別/財年/專案類別） | 列表頁 |
| 排序（名稱/狀態/建立日期/專案編號/優先權/財年） | 列表頁 |
| 分頁（每頁 9 項） | 列表頁 |
| CSV 導出 | 列表頁 |
| 批量選擇 + 刪除 (Checkbox + AlertDialog) | 列表頁 |
| 統計卡片 | 詳情頁 |
| 預算使用率視覺化（進度條） | 詳情頁 |
| 提案/採購單關聯列表 | 詳情頁 |
| 退回草稿功能 (revertToDraft) | 詳情頁 |
| AlertDialog 刪除確認 | 詳情頁 |
| 動態表單載入 (next/dynamic) | 建立頁、編輯頁 |
| 報價上傳表單 | 報價管理頁 |
| 報價比較（最低/最高標記） | 報價管理頁 |
| 報價轉採購單 (createFromQuote) | 報價管理頁 |
| CurrencyDisplay 幣別顯示 | 報價管理頁 |

### 2.8 頁面導航

- 列表頁: `/projects/new`, `/projects/[id]`
- 詳情頁: `/projects/[id]/edit`, `/projects/[id]/quotes`, `/proposals/new?projectId=[id]`, `/purchase-orders/new?projectId=[id]`, `/proposals/[id]`, `/purchase-orders/[id]`
- 報價管理頁: `/vendors/[id]`, `/purchase-orders/[id]`
- 麵包屑: Dashboard > Projects > [Name] > Edit/Quotes

---

## 3. proposals/ - 預算提案

### 3.1 路由結構

| 路由路徑 | 檔案 | 用途 |
|----------|------|------|
| `/proposals` | `page.tsx` | 提案列表 |
| `/proposals/new` | `new/page.tsx` | 建立提案 |
| `/proposals/[id]` | `[id]/page.tsx` | 提案詳情（審批/評論/檔案/會議/歷史） |
| `/proposals/[id]/edit` | `[id]/edit/page.tsx` | 編輯提案 |

### 3.2 檔案清單

| 檔案 | 行數 | 頁面類型 | 用途 |
|------|------|----------|------|
| `proposals/page.tsx` | 617 | Client | 列表頁：雙視圖、搜尋、狀態篩選、單筆/批量刪除 |
| `proposals/new/page.tsx` | 115 | Client | 建立頁：動態載入 `BudgetProposalForm` (mode="create") |
| `proposals/[id]/page.tsx` | 529 | Client | 詳情頁：多分頁介面(Tabs)、審批操作、評論、檔案、會議記錄、歷史 |
| `proposals/[id]/edit/page.tsx` | 221 | Client | 編輯頁：動態載入 `BudgetProposalForm` (mode="edit")，僅 Draft/MoreInfoRequired 可編輯 |

**子路由數**: 4 | **總行數**: 1,482

### 3.3 tRPC 查詢/Mutations

| 頁面 | Procedure | 類型 |
|------|-----------|------|
| `page.tsx` | `api.budgetProposal.getAll.useQuery(...)` | Query |
| `page.tsx` | `api.budgetProposal.delete.useMutation(...)` | Mutation (單筆刪除) |
| `page.tsx` | `api.budgetProposal.deleteMany.useMutation(...)` | Mutation (批量刪除) |
| `[id]/page.tsx` | `api.budgetProposal.getById.useQuery(...)` | Query |
| `[id]/page.tsx` | `api.budgetProposal.delete.useMutation(...)` | Mutation |
| `[id]/edit/page.tsx` | `api.budgetProposal.getById.useQuery(...)` | Query |

### 3.4 組件依賴

**業務組件**:
- `BudgetProposalForm` (`@/components/proposal/BudgetProposalForm`) - 動態載入
- `ProposalActions` (`@/components/proposal/ProposalActions`) - 審批操作按鈕
- `CommentSection` (`@/components/proposal/CommentSection`) - 評論系統
- `ProposalFileUpload` (`@/components/proposal/ProposalFileUpload`) - 檔案上傳
- `ProposalMeetingNotes` (`@/components/proposal/ProposalMeetingNotes`) - 會議記錄
- `CurrencyDisplay` (`@/components/shared/CurrencyDisplay`)

**UI 組件**: `Card`, `Badge`, `Button`, `Input`, `Checkbox`, `Table`, `Breadcrumb`, `AlertDialog`, `Tabs`, `Textarea`, `Skeleton`, `Alert`

### 3.5 i18n 命名空間

`proposals`, `common`, `navigation`

### 3.6 權限/角色控制

- 列表頁：PM 查看自己專案的提案；Supervisor 查看全部 (API 層)；使用 `useSession` 取得角色
- 詳情頁：審批操作由 `ProposalActions` 組件根據角色控制（Supervisor 可審批 PendingApproval）
- 編輯頁：僅 `Draft` 或 `MoreInfoRequired` 狀態可編輯，其餘 redirect 到詳情頁

### 3.7 關鍵 UI 功能

| 功能 | 頁面 |
|------|------|
| 雙視圖（卡片/表格） | 列表頁 |
| 即時搜尋（防抖 300ms） | 列表頁 |
| 狀態篩選 (5 種狀態) | 列表頁 |
| 批量選擇 + 刪除 (Checkbox + AlertDialog) | 列表頁 (CHANGE-017) |
| 多分頁介面 (Tabs: 詳情/評論/檔案/會議/歷史) | 詳情頁 |
| 審批工作流操作 (ProposalActions) | 詳情頁 |
| 評論系統 (CommentSection) | 詳情頁 |
| 檔案上傳/預覽/下載 (ProposalFileUpload) | 詳情頁 |
| 會議記錄 CRUD (ProposalMeetingNotes) | 詳情頁 |
| 刪除確認 AlertDialog | 詳情頁、列表頁 |
| 動態表單載入 (next/dynamic) | 建立頁、編輯頁 |
| 狀態守衛 (Draft/MoreInfoRequired 才可編輯) | 編輯頁 |

### 3.8 頁面導航

- 列表頁: `/proposals/new`, `/proposals/[id]`, `/proposals/[id]/edit`
- 詳情頁: `/proposals/[id]/edit`, `/proposals`
- 麵包屑: Dashboard > Proposals > [Title] > Edit

---

## 4. budget-pools/ - 預算池

### 4.1 路由結構

| 路由路徑 | 檔案 | 用途 |
|----------|------|------|
| `/budget-pools` | `page.tsx` | 預算池列表 |
| `/budget-pools/new` | `new/page.tsx` | 建立預算池 |
| `/budget-pools/[id]` | `[id]/page.tsx` | 預算池詳情 |
| `/budget-pools/[id]/edit` | `[id]/edit/page.tsx` | 編輯預算池 |

### 4.2 檔案清單

| 檔案 | 行數 | 頁面類型 | 用途 |
|------|------|----------|------|
| `budget-pools/page.tsx` | 500 | Client | 列表頁：雙視圖、搜尋、財年篩選、排序、分頁、CSV 導出 |
| `budget-pools/new/page.tsx` | 104 | Client | 建立頁：動態載入 `BudgetPoolForm` (mode="create") |
| `budget-pools/[id]/page.tsx` | 502 | Client | 詳情頁：基本資訊、預算類別表格、使用率統計、關聯專案列表、刪除 |
| `budget-pools/[id]/edit/page.tsx` | 224 | Client | 編輯頁：動態載入 `BudgetPoolForm` (mode="edit")，傳遞 categories 資料 |

**子路由數**: 4 | **總行數**: 1,330

### 4.3 tRPC 查詢/Mutations

| 頁面 | Procedure | 類型 |
|------|-----------|------|
| `page.tsx` | `api.budgetPool.getAll.useQuery(...)` | Query (分頁/搜尋/財年/排序) |
| `[id]/page.tsx` | `api.budgetPool.getById.useQuery(...)` | Query |
| `[id]/page.tsx` | `api.budgetPool.getStats.useQuery(...)` | Query |
| `[id]/page.tsx` | `api.budgetPool.delete.useMutation(...)` | Mutation |
| `[id]/edit/page.tsx` | `api.budgetPool.getById.useQuery(...)` | Query |

### 4.4 組件依賴

**業務組件**:
- `BudgetPoolForm` (`@/components/budget-pool/BudgetPoolForm`) - 動態載入
- `CurrencyDisplay` (`@/components/shared/CurrencyDisplay`)
- `PaginationControls` (`@/components/ui`)
- `BudgetPoolListSkeleton` (`@/components/ui`)

**UI 組件**: `Card`, `Badge`, `Button`, `Input`, `NativeSelect`, `Table`, `Breadcrumb`, `Skeleton`, `Alert`

**Hooks**: `useDebounce` (`@/hooks/useDebounce`)
**工具**: `convertToCSV`, `downloadCSV`, `generateExportFilename` (`@/lib/exportUtils`)

### 4.5 i18n 命名空間

`budgetPools`, `common`, `navigation`

### 4.6 權限/角色控制

- 列表頁：PM 查看相關預算池；Supervisor 查看全部
- 詳情頁：刪除操作可用
- 編輯頁：僅 Admin 有完整編輯權限（文件說明 PM/Supervisor 不可編輯）

### 4.7 關鍵 UI 功能

| 功能 | 頁面 |
|------|------|
| 雙視圖（卡片/列表） | 列表頁 |
| 即時搜尋（防抖 300ms，自動恢復焦點） | 列表頁 |
| 財年篩選 (NativeSelect) | 列表頁 |
| 多維度排序（名稱/財年/總金額） | 列表頁 |
| 分頁（每頁 9 項） | 列表頁 |
| CSV 導出 | 列表頁 |
| 使用率視覺化（顏色編碼：綠 <75%、黃 75-90%、紅 >90%） | 列表頁、詳情頁 |
| 預算類別詳細表格 | 詳情頁 |
| 預算統計卡片 | 詳情頁 |
| 關聯專案列表（可點擊） | 詳情頁 |
| 動態表單載入 (next/dynamic) | 建立頁、編輯頁 |

### 4.8 頁面導航

- 列表頁: `/budget-pools/new`, `/budget-pools/[id]`
- 詳情頁: `/budget-pools/[id]/edit`, `/projects/[id]`
- 麵包屑: Dashboard > Budget Pools > [Name] > Edit

---

## 5. expenses/ - 費用記錄

### 5.1 路由結構

| 路由路徑 | 檔案 | 用途 |
|----------|------|------|
| `/expenses` | `page.tsx` | 費用列表 |
| `/expenses/new` | `new/page.tsx` | 建立費用 |
| `/expenses/[id]` | `[id]/page.tsx` | 費用詳情 |
| `/expenses/[id]/edit` | `[id]/edit/page.tsx` | 編輯費用 |

### 5.2 檔案清單

| 檔案 | 行數 | 頁面類型 | 用途 |
|------|------|----------|------|
| `expenses/page.tsx` | 1,008 | Client | 列表頁：雙視圖、搜尋、狀態/採購單篩選、排序、分頁、批量刪除、狀態退回(revert)、DropdownMenu 操作 |
| `expenses/new/page.tsx` | 108 | Client | 建立頁：直接渲染 `ExpenseForm`（無動態載入） |
| `expenses/[id]/page.tsx` | 511 | Client | 詳情頁：表頭-明細結構、費用項目表格、審批操作(ExpenseActions)、CurrencyDisplay |
| `expenses/[id]/edit/page.tsx` | 214 | Client | 編輯頁：直接渲染 `ExpenseForm`，僅 Draft 可編輯（狀態守衛） |

**子路由數**: 4 | **總行數**: 1,841

### 5.3 tRPC 查詢/Mutations

| 頁面 | Procedure | 類型 |
|------|-----------|------|
| `page.tsx` | `api.expense.getAll.useQuery(...)` | Query |
| `page.tsx` | `api.purchaseOrder.getAll.useQuery(...)` | Query (採購單篩選器) |
| `page.tsx` | `api.expense.getStats.useQuery(...)` | Query |
| `page.tsx` | `api.expense.delete.useMutation(...)` | Mutation |
| `page.tsx` | `api.expense.deleteMany.useMutation(...)` | Mutation |
| `page.tsx` | `api.expense.revertToDraft.useMutation(...)` | Mutation |
| `page.tsx` | `api.expense.revertToApproved.useMutation(...)` | Mutation |
| `page.tsx` | `api.expense.revertToSubmitted.useMutation(...)` | Mutation |
| `[id]/page.tsx` | `api.expense.getById.useQuery(...)` | Query |
| `[id]/edit/page.tsx` | `api.expense.getById.useQuery(...)` | Query |

### 5.4 組件依賴

**業務組件**:
- `ExpenseForm` (`@/components/expense/ExpenseForm`) - 直接導入（非動態載入）
- `ExpenseActions` (`@/components/expense/ExpenseActions`) - 審批操作
- `CurrencyDisplay` (`@/components/shared/CurrencyDisplay`)
- `PaginationControls` (`@/components/ui`)

**UI 組件**: `Card`, `Badge`, `Button`, `NativeSelect`, `Table`, `Breadcrumb`, `Checkbox`, `AlertDialog`, `DropdownMenu`, `Skeleton`, `Alert`

### 5.5 i18n 命名空間

`expenses`, `common`, `navigation`

### 5.6 權限/角色控制

- 列表頁：PM 查看自己專案的費用，Supervisor 查看全部並審批
- 詳情頁：`ExpenseActions` 組件根據角色控制操作（Supervisor 審批 Submitted）
- 編輯頁：僅 `Draft` 狀態可編輯，非 Draft 顯示錯誤訊息

### 5.7 關鍵 UI 功能

| 功能 | 頁面 |
|------|------|
| 雙視圖（卡片/表格） | 列表頁 |
| 狀態篩選 (Draft/Submitted/Approved/Paid) | 列表頁 |
| 採購單篩選 | 列表頁 |
| 批量選擇 + 刪除 (Checkbox + AlertDialog) | 列表頁 |
| 狀態退回操作 (revertToDraft/toApproved/toSubmitted) | 列表頁 |
| DropdownMenu 快速操作 | 列表頁 |
| 表頭-明細結構展示 | 詳情頁 |
| 費用項目明細表格 | 詳情頁 |
| 審批工作流 (ExpenseActions) | 詳情頁 |
| 狀態守衛 (Draft 才可編輯) | 編輯頁 |

### 5.8 頁面導航

- 列表頁: `/expenses/new`, `/expenses/[id]`, `/expenses/[id]/edit`
- 詳情頁: `/expenses/[id]/edit`, `/expenses`, `/purchase-orders/[id]`, `/projects/[id]`
- 麵包屑: Dashboard > Expenses > [Name] > Edit

---

## 6. charge-outs/ - 費用轉嫁

### 6.1 路由結構

| 路由路徑 | 檔案 | 用途 |
|----------|------|------|
| `/charge-outs` | `page.tsx` | 費用轉嫁列表 |
| `/charge-outs/new` | `new/page.tsx` | 建立費用轉嫁 |
| `/charge-outs/[id]` | `[id]/page.tsx` | 費用轉嫁詳情 |
| `/charge-outs/[id]/edit` | `[id]/edit/page.tsx` | 編輯費用轉嫁 |

### 6.2 檔案清單

| 檔案 | 行數 | 頁面類型 | 用途 |
|------|------|----------|------|
| `charge-outs/page.tsx` | 601 | Client | 列表頁：狀態/OpCo/專案篩選、批量刪除、狀態退回、DropdownMenu |
| `charge-outs/new/page.tsx` | 108 | Client | 建立頁：直接渲染 `ChargeOutForm`，返回按鈕 |
| `charge-outs/[id]/page.tsx` | 427 | Client | 詳情頁：專案資訊、明細項目、ChargeOutActions 操作、金額格式化(HKD) |
| `charge-outs/[id]/edit/page.tsx` | 158 | Client | 編輯頁：直接渲染 `ChargeOutForm`，僅 Draft 可編輯（**部分硬編碼中文**） |

**子路由數**: 4 | **總行數**: 1,294

### 6.3 tRPC 查詢/Mutations

| 頁面 | Procedure | 類型 |
|------|-----------|------|
| `page.tsx` | `api.operatingCompany.getAll.useQuery()` | Query (OpCo 篩選器) |
| `page.tsx` | `api.project.getAll.useQuery(...)` | Query (專案篩選器) |
| `page.tsx` | `api.chargeOut.getAll.useQuery(...)` | Query |
| `page.tsx` | `api.chargeOut.delete.useMutation(...)` | Mutation |
| `page.tsx` | `api.chargeOut.deleteMany.useMutation(...)` | Mutation |
| `page.tsx` | `api.chargeOut.revertToDraft.useMutation(...)` | Mutation |
| `[id]/page.tsx` | `api.chargeOut.getById.useQuery(...)` | Query |
| `[id]/edit/page.tsx` | `api.chargeOut.getById.useQuery(...)` | Query |

### 6.4 組件依賴

**業務組件**:
- `ChargeOutForm` (`@/components/charge-out/ChargeOutForm`) - 直接導入
- `ChargeOutActions` (`@/components/charge-out/ChargeOutActions`) - 工作流操作

**UI 組件**: `Card`, `Badge`, `Button`, `Checkbox`, `Breadcrumb`, `AlertDialog`, `DropdownMenu`

### 6.5 i18n 命名空間

`chargeOuts`, `navigation`, `common`

### 6.6 權限/角色控制

- 詳情頁：使用 `useSession` 取得角色，`ChargeOutActions` 根據角色控制操作
- 編輯頁：僅 Draft 狀態可編輯

### 6.7 關鍵 UI 功能

| 功能 | 頁面 |
|------|------|
| 狀態篩選 (Draft/Submitted/Approved/Completed) | 列表頁 |
| OpCo 篩選 | 列表頁 |
| 專案篩選 | 列表頁 |
| 批量選擇 + 刪除 | 列表頁 |
| 狀態退回 (revertToDraft) | 列表頁 |
| DropdownMenu 操作選單 | 列表頁 |
| ChargeOut 明細項目展示 | 詳情頁 |
| 工作流操作 (ChargeOutActions) | 詳情頁 |
| 金額格式化 (HKD) | 詳情頁 |
| 狀態守衛 (Draft 才可編輯) | 編輯頁 |

**注意**: 編輯頁 (`[id]/edit/page.tsx`) 存在**硬編碼中文**（如 "首頁"、"費用轉嫁"、"編輯"、"找不到 ChargeOut 記錄" 等），未使用 i18n。

### 6.8 頁面導航

- 列表頁: `/charge-outs/new`, `/charge-outs/[id]`
- 詳情頁: `/charge-outs/[id]/edit`, `/charge-outs`
- 麵包屑: 首頁 > 費用轉嫁 > [Name] > 編輯

---

## 7. purchase-orders/ - 採購單

### 7.1 路由結構

| 路由路徑 | 檔案 | 用途 |
|----------|------|------|
| `/purchase-orders` | `page.tsx` | 採購單列表 |
| `/purchase-orders/new` | `new/page.tsx` | 建立採購單 |
| `/purchase-orders/[id]` | `[id]/page.tsx` | 採購單詳情 |
| `/purchase-orders/[id]/edit` | `[id]/edit/page.tsx` | 編輯採購單 |

### 7.2 檔案清單

| 檔案 | 行數 | 頁面類型 | 用途 |
|------|------|----------|------|
| `purchase-orders/page.tsx` | 813 | Client | 列表頁：雙視圖、搜尋、專案/供應商篩選、批量刪除、狀態退回、DropdownMenu |
| `purchase-orders/new/page.tsx` | 103 | Client | 建立頁：直接渲染 `PurchaseOrderForm` |
| `purchase-orders/[id]/page.tsx` | 530 | Client | 詳情頁：採購品項明細表格、費用記錄列表、PurchaseOrderActions 操作、CurrencyDisplay |
| `purchase-orders/[id]/edit/page.tsx` | 204 | Client | 編輯頁：直接渲染 `PurchaseOrderForm`，僅 Draft 可編輯（**部分硬編碼中文**） |

**子路由數**: 4 | **總行數**: 1,650

### 7.3 tRPC 查詢/Mutations

| 頁面 | Procedure | 類型 |
|------|-----------|------|
| `page.tsx` | `api.purchaseOrder.getAll.useQuery(...)` | Query |
| `page.tsx` | `api.purchaseOrder.delete.useMutation(...)` | Mutation |
| `page.tsx` | `api.purchaseOrder.deleteMany.useMutation(...)` | Mutation |
| `page.tsx` | `api.purchaseOrder.revertToDraft.useMutation(...)` | Mutation |
| `page.tsx` | `api.purchaseOrder.revertToSubmitted.useMutation(...)` | Mutation |
| `page.tsx` | `api.project.getAll.useQuery(...)` | Query (專案篩選器) |
| `page.tsx` | `api.vendor.getAll.useQuery(...)` | Query (供應商篩選器) |
| `[id]/page.tsx` | `api.purchaseOrder.getById.useQuery(...)` | Query |
| `[id]/edit/page.tsx` | `api.purchaseOrder.getById.useQuery(...)` | Query |

### 7.4 組件依賴

**業務組件**:
- `PurchaseOrderForm` (`@/components/purchase-order/PurchaseOrderForm`) - 直接導入
- `PurchaseOrderActions` (`@/components/purchase-order/PurchaseOrderActions`) - 工作流操作
- `CurrencyDisplay` (`@/components/shared/CurrencyDisplay`)
- `PaginationControls` (`@/components/ui`)

**UI 組件**: `Card`, `Badge`, `Button`, `Input`, `NativeSelect`, `Table`, `Breadcrumb`, `Checkbox`, `AlertDialog`, `DropdownMenu`, `Skeleton`, `Alert`

**Hooks**: `useDebounce` (`@/hooks/useDebounce`)

### 7.5 i18n 命名空間

`purchaseOrders`, `navigation`

### 7.6 權限/角色控制

- 列表頁：PM 查看自己專案的採購單，Supervisor 查看全部
- 詳情頁：`PurchaseOrderActions` 組件根據角色控制工作流操作
- 編輯頁：僅 Draft 狀態可編輯

### 7.7 關鍵 UI 功能

| 功能 | 頁面 |
|------|------|
| 雙視圖（卡片/列表） | 列表頁 |
| 即時搜尋（防抖 300ms） | 列表頁 |
| 專案/供應商篩選 | 列表頁 |
| 批量選擇 + 刪除 | 列表頁 |
| 狀態退回 (revertToDraft / revertToSubmitted) | 列表頁 |
| DropdownMenu 操作 | 列表頁 |
| 採購品項明細表格 | 詳情頁 |
| 相關費用記錄列表 | 詳情頁 |
| 工作流操作 (PurchaseOrderActions) | 詳情頁 |
| StatusBadge / ExpenseStatusBadge 組件 | 詳情頁 |
| CurrencyDisplay | 詳情頁 |
| 狀態守衛 (Draft 才可編輯) | 編輯頁 |

**注意**: 編輯頁 (`[id]/edit/page.tsx`) 存在**硬編碼中文**（如 "首頁"、"採購單"、"編輯"、"只有草稿狀態的採購單才能編輯" 等），未使用 i18n。

### 7.8 頁面導航

- 列表頁: `/purchase-orders/new`, `/purchase-orders/[id]`
- 詳情頁: `/purchase-orders/[id]/edit`, `/projects/[id]`, `/vendors/[id]`, `/expenses/[id]`
- 麵包屑: Dashboard > Purchase Orders > [Name] > Edit

---

## 8. quotes/ - 報價單

### 8.1 路由結構

| 路由路徑 | 檔案 | 用途 |
|----------|------|------|
| `/quotes` | `page.tsx` | 報價單列表 |
| `/quotes/new` | `new/page.tsx` | 新增報價單（含文件上傳） |
| `/quotes/[id]/edit` | `[id]/edit/page.tsx` | 編輯報價單（金額/說明，不含文件修改） |

**注意**: 無 `/quotes/[id]` 詳情頁面，報價詳情透過 `/projects/[id]/quotes` 頁面查看。

### 8.2 檔案清單

| 檔案 | 行數 | 頁面類型 | 用途 |
|------|------|----------|------|
| `quotes/page.tsx` | 726 | Client | 列表頁：雙視圖、專案/供應商篩選、批量刪除、解除關聯、DropdownMenu |
| `quotes/new/page.tsx` | 394 | Client | 新增頁：專案/供應商選擇、金額輸入、文件上傳(API route)、文件類型/大小驗證 |
| `quotes/[id]/edit/page.tsx` | 397 | Client | 編輯頁：金額和說明編輯、已關聯 PO 檢查（禁止編輯） |

**子路由數**: 3 | **總行數**: 1,517

### 8.3 tRPC 查詢/Mutations

| 頁面 | Procedure | 類型 |
|------|-----------|------|
| `page.tsx` | `api.quote.getAll.useQuery(...)` | Query |
| `page.tsx` | `api.quote.delete.useMutation(...)` | Mutation |
| `page.tsx` | `api.quote.deleteMany.useMutation(...)` | Mutation |
| `page.tsx` | `api.quote.revertToDraft.useMutation(...)` | Mutation |
| `page.tsx` | `api.project.getAll.useQuery(...)` | Query (專案篩選器) |
| `page.tsx` | `api.vendor.getAll.useQuery(...)` | Query (供應商篩選器) |
| `new/page.tsx` | `api.project.getAll.useQuery(...)` | Query |
| `new/page.tsx` | `api.vendor.getAll.useQuery(...)` | Query |
| `[id]/edit/page.tsx` | `api.quote.getById.useQuery(...)` | Query |
| `[id]/edit/page.tsx` | `api.quote.update.useMutation(...)` | Mutation |

### 8.4 組件依賴

**UI 組件**: `Card`, `Button`, `Input`, `Label`, `Textarea`, `NativeSelect`, `Table`, `Breadcrumb`, `Checkbox`, `AlertDialog`, `DropdownMenu`, `Skeleton`, `Alert`
**共用組件**: `CurrencyDisplay`, `PaginationControls`

**注意**: 新增頁直接在頁面內建構表單，未分離為獨立業務組件（與其他模組不同）。

### 8.5 i18n 命名空間

`quotes`, `common`, `navigation`, `toast`

### 8.6 權限/角色控制

- PM 查看自己專案的報價；Supervisor 查看全部
- 編輯頁：已關聯採購單的報價禁止編輯

### 8.7 關鍵 UI 功能

| 功能 | 頁面 |
|------|------|
| 雙視圖（卡片/列表） | 列表頁 |
| 專案/供應商篩選 | 列表頁 |
| 批量選擇 + 刪除 | 列表頁 |
| 解除報價關聯 (unlinkDialog) | 列表頁 |
| DropdownMenu 操作 | 列表頁 |
| 專案選擇下拉選單 | 新增頁 |
| 供應商選擇下拉選單 | 新增頁 |
| 文件上傳（PDF/DOC/XLS，最大 10MB） | 新增頁 |
| 文件類型/大小驗證 | 新增頁 |
| 金額和說明編輯 | 編輯頁 |
| 已關聯 PO 守衛 | 編輯頁 |

### 8.8 頁面導航

- 列表頁: `/quotes/new`, `/quotes/[id]/edit`, `/projects/[id]/quotes`
- 新增頁: `/quotes` (成功後返回)
- 編輯頁: `/quotes` (成功後返回)
- 麵包屑: Dashboard > Quotes > New/Edit

---

## 跨模組統計摘要

### 檔案統計

| 模組 | 頁面數 | 總行數 | 最大檔案 |
|------|--------|--------|----------|
| dashboard | 3 | 1,036 | supervisor/page.tsx (452) |
| projects | 5 | 3,090 | [id]/page.tsx (1,223) |
| proposals | 4 | 1,482 | page.tsx (617) |
| budget-pools | 4 | 1,330 | [id]/page.tsx (502) |
| expenses | 4 | 1,841 | page.tsx (1,008) |
| charge-outs | 4 | 1,294 | page.tsx (601) |
| purchase-orders | 4 | 1,650 | page.tsx (813) |
| quotes | 3 | 1,517 | page.tsx (726) |
| **合計** | **31** | **12,240** | - |

### 共通設計模式

1. **所有頁面均為 Client Component** (`'use client'`)
2. **統一佈局**: 全部使用 `DashboardLayout` 包裝
3. **麵包屑導航**: 使用 `Breadcrumb` 組件，層級為 Dashboard > Module > [Entity] > Action
4. **載入狀態**: Skeleton 骨架屏
5. **錯誤處理**: `Alert` variant="destructive" + 返回按鈕
6. **動態表單載入**: `new/` 和 `edit/` 頁面使用 `next/dynamic` 載入表單組件（projects, proposals, budget-pools 採用此模式；expenses, charge-outs, purchase-orders 直接導入）
7. **狀態守衛**: 編輯頁檢查 `Draft` 狀態，非 Draft redirect 或顯示錯誤
8. **批量操作**: CHANGE-017~022 統一引入 Checkbox + AlertDialog 批量刪除
9. **狀態退回**: 多模組支援 `revertToDraft` / `revertToSubmitted` / `revertToApproved`

### 已發現問題

| 問題 | 模組 | 說明 |
|------|------|------|
| 硬編碼中文 | charge-outs/[id]/edit | "首頁"、"費用轉嫁"、"編輯"、"找不到 ChargeOut 記錄" 等未使用 i18n |
| 硬編碼中文 | purchase-orders/[id]/edit | "首頁"、"採購單"、"編輯"、"只有草稿狀態的採購單才能編輯" 等未使用 i18n |
| 無詳情頁 | quotes | 無獨立 `/quotes/[id]` 詳情頁，需透過 `/projects/[id]/quotes` 查看 |
| 表單模式不一致 | quotes/new | 新增頁直接在頁面內建構表單邏輯（未分離為業務組件），與其他模組模式不同 |
| 金額格式化 | charge-outs/[id] | 使用 `Intl.NumberFormat` 硬編碼 HKD，而非 `CurrencyDisplay` 組件 |

### 涉及的 API Router 匯總

| Router | 使用的 Procedures | 調用來源頁面 |
|--------|-------------------|-------------|
| `dashboard` | `getProjectManagerDashboard`, `getSupervisorDashboard`, `getProjectManagers`, `exportProjects` | dashboard/pm, dashboard/supervisor |
| `project` | `getAll`, `getById`, `getStats`, `getBudgetUsage`, `getFiscalYears`, `getProjectCategories`, `delete`, `deleteMany`, `revertToDraft` | projects/*, purchase-orders/page, charge-outs/page, quotes/* |
| `budgetPool` | `getAll`, `getById`, `getStats`, `delete` | budget-pools/*, projects/page |
| `budgetProposal` | `getAll`, `getById`, `delete`, `deleteMany` | proposals/* |
| `expense` | `getAll`, `getById`, `getStats`, `delete`, `deleteMany`, `revertToDraft`, `revertToApproved`, `revertToSubmitted` | expenses/* |
| `chargeOut` | `getAll`, `getById`, `delete`, `deleteMany`, `revertToDraft` | charge-outs/* |
| `purchaseOrder` | `getAll`, `getById`, `createFromQuote`, `delete`, `deleteMany`, `revertToDraft`, `revertToSubmitted` | purchase-orders/*, projects/[id]/quotes |
| `quote` | `getAll`, `getById`, `getByProject`, `compare`, `update`, `delete`, `deleteMany`, `revertToDraft` | quotes/*, projects/[id]/quotes, projects/[id] |
| `vendor` | `getAll` | purchase-orders/page, quotes/* |
| `currency` | `getAll` | projects/page |
| `operatingCompany` | `getAll` | charge-outs/page |
