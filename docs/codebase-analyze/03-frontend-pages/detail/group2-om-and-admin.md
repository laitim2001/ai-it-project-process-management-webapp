# Group 2: OM 費用管理與行政管理路由模組分析

> 分析日期：2026-04-09
> 涵蓋範圍：8 個路由模組，共 21 個 .tsx 檔案，合計 7,779 行程式碼

---

## 總覽統計

| # | 路由模組 | 子路由數 | 檔案數 | 總行數 | 主要功能 |
|---|---------|---------|-------|-------|---------|
| 1 | `om-expenses/` | 4 | 4 | 1,690 | OM 費用 CRUD + 表頭-明細架構 |
| 2 | `om-expense-categories/` | 3 | 3 | 448 | OM 費用類別 CRUD |
| 3 | `om-summary/` | 1 | 1 | 386 | OM 費用 + 專案摘要報表 |
| 4 | `data-import/` | 1 | 1 | 1,606 | OM 費用 Excel/JSON 數據導入 |
| 5 | `project-data-import/` | 1 | 1 | 1,145 | 專案 Excel 數據導入 |
| 6 | `vendors/` | 4 | 4 | 1,062 | 供應商 CRUD |
| 7 | `operating-companies/` | 3 | 3 | 567 | 營運公司 CRUD |
| 8 | `users/` | 4 | 4 | 875 | 使用者管理 CRUD + 權限配置 |
| **合計** | | **21** | **21** | **7,779** | |

---

## 模組 1：om-expenses（OM 費用管理）

### 路由結構
```
om-expenses/
├── page.tsx              # 列表頁（卡片/表格雙視圖）
├── new/page.tsx           # 建立頁
├── [id]/page.tsx          # 詳情頁（明細項目 + 月度記錄）
└── [id]/edit/page.tsx     # 編輯頁（僅表頭欄位）
```

### 檔案清單

| 檔案路徑 | 行數 | 用途 |
|---------|------|------|
| `om-expenses/page.tsx` | 677 | OM 費用列表頁，支援卡片/表格雙視圖切換、搜尋過濾、批量選擇與刪除 |
| `om-expenses/new/page.tsx` | 89 | 建立 OM 費用表頭，委派 OMExpenseForm 組件處理表單 |
| `om-expenses/[id]/page.tsx` | 744 | 詳情頁，FEAT-007 表頭-明細架構核心頁面，含 Tab 切換（項目列表 / 月度記錄） |
| `om-expenses/[id]/edit/page.tsx` | 180 | 編輯表頭資訊，明細項目管理在詳情頁進行 |

### 頁面類型
全部為 **Client Component**（`'use client'`）。

### tRPC 查詢/Mutation

| 頁面 | API Procedure | 類型 |
|------|--------------|------|
| `page.tsx` | `api.operatingCompany.getAll` | Query |
| `page.tsx` | `api.omExpense.getCategories` | Query |
| `page.tsx` | `api.omExpense.getAll` | Query（含 financialYear, opCoId, category, search, page, limit 參數） |
| `page.tsx` | `api.omExpense.deleteMany` | Mutation（CHANGE-005 批量刪除） |
| `[id]/page.tsx` | `api.omExpense.getById` | Query |
| `[id]/page.tsx` | `api.omExpense.calculateYoYGrowth` | Mutation |
| `[id]/page.tsx` | `api.omExpense.delete` | Mutation |
| `[id]/page.tsx` | `api.omExpense.removeItem` | Mutation |
| `[id]/page.tsx` | `api.omExpense.reorderItems` | Mutation |
| `[id]/edit/page.tsx` | `api.omExpense.getById` | Query |

### 引用組件

| 來源目錄 | 組件 |
|---------|------|
| `components/ui/` | Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Checkbox, Table/TableHeader/TableBody/TableRow/TableHead/TableCell, AlertDialog (全套), Breadcrumb (全套), Tabs/TabsList/TabsTrigger/TabsContent, Select/SelectContent/SelectItem/SelectTrigger/SelectValue, Dialog/DialogContent/DialogDescription/DialogHeader/DialogTitle, useToast |
| `components/layout/` | DashboardLayout |
| `components/om-expense/` | OMExpenseForm, OMExpenseItemList, OMExpenseItemMonthlyGrid, OMExpenseItemForm |
| `hooks/` | useDebounce |

### i18n 命名空間
- `omExpenses`（含 `omExpenses.new`, `omExpenses.items`）
- `common`
- `navigation`

### 權限控制
- **列表頁**：ProjectManager 可查看和建立，Supervisor 查看所有，Admin 完整權限
- **詳情頁**：ProjectManager 可編輯自己的，Supervisor 查看所有
- 前端無顯式角色檢查代碼，依賴後端 API 權限控制

### 關鍵 UI 特性
- **卡片/表格雙視圖切換**：CHANGE-006 預設為 list view
- **即時搜尋**：useDebounce(300ms)，CHANGE-035
- **多條件過濾**：財年、OpCo、類別
- **批量操作**：全選/反選 + 批量刪除確認對話框（CHANGE-005）
- **分頁導航**：每頁 12 項
- **拖曳排序**：詳情頁明細項目支援 @dnd-kit 排序
- **Tab 切換**：項目列表 / 月度記錄
- **Dialog 表單**：明細項目新增/編輯使用 Dialog 彈出
- **YoY 增長率計算**：可觸發 API 計算
- **預算使用率色碼**：>100% 紅色、>90% 黃色、其餘綠色

### 導航
- **麵包屑**：Home > OM Expenses > [name] > Edit
- **連結**：列表頁→詳情頁→編輯頁雙向導航，詳情頁→OM Expenses 列表返回

---

## 模組 2：om-expense-categories（OM 費用類別管理）

### 路由結構
```
om-expense-categories/
├── page.tsx              # 列表頁（表格視圖）
├── new/page.tsx           # 建立頁
└── [id]/edit/page.tsx     # 編輯頁
```
> 注意：此模組無 `[id]/page.tsx` 詳情頁。

### 檔案清單

| 檔案路徑 | 行數 | 用途 |
|---------|------|------|
| `om-expense-categories/page.tsx` | 248 | 類別列表，表格顯示，搜尋 + 狀態過濾 + 分頁 |
| `om-expense-categories/new/page.tsx` | 78 | 建立類別，委派 OMExpenseCategoryForm 組件 |
| `om-expense-categories/[id]/edit/page.tsx` | 122 | 編輯類別，載入現有資料後傳入 OMExpenseCategoryForm |

### 頁面類型
全部為 **Client Component**。

### tRPC 查詢/Mutation

| 頁面 | API Procedure | 類型 |
|------|--------------|------|
| `page.tsx` | `api.expenseCategory.getAll` | Query（CHANGE-003 統一費用類別 API） |
| `[id]/edit/page.tsx` | `api.expenseCategory.getById` | Query |

### 引用組件

| 來源目錄 | 組件 |
|---------|------|
| `components/ui/` | Badge, Button, Card/CardContent/CardHeader/CardTitle, Input, NativeSelect, Table (全套), Breadcrumb (全套), Skeleton |
| `components/layout/` | DashboardLayout |
| `components/om-expense-category/` | OMExpenseCategoryActions, OMExpenseCategoryForm |
| `hooks/` | useDebounce |

### i18n 命名空間
- `omExpenseCategories`
- `common`
- `navigation`

### 權限控制
- 文件標註 FEAT-005，無顯式前端角色判斷

### 關鍵 UI 特性
- **表格視圖**：顯示 code、name、description、關聯 OM 費用數量、啟用/停用狀態
- **搜尋**：useDebounce(300ms)，搜尋代碼和名稱
- **狀態過濾**：all / active / inactive
- **分頁**：每頁 10 項
- **行動按鈕**：OMExpenseCategoryActions 組件（編輯、刪除等操作）
- **骨架屏載入**：Skeleton 載入狀態
- **錯誤狀態**：AlertCircle + 返回列表連結

### 導航
- **麵包屑**：Dashboard > OM Expense Categories > Create/[name]
- **連結**：列表頁 ↔ 建立頁、列表頁 → 編輯頁

---

## 模組 3：om-summary（OM 費用總覽報表）

### 路由結構
```
om-summary/
└── page.tsx              # 報表頁面（唯一頁面）
```

### 檔案清單

| 檔案路徑 | 行數 | 用途 |
|---------|------|------|
| `om-summary/page.tsx` | 386 | OM 費用 + 專案摘要雙 Tab 報表，多維度過濾 |

### 頁面類型
**Client Component**。

### tRPC 查詢/Mutation

| API Procedure | 類型 | 說明 |
|--------------|------|------|
| `api.operatingCompany.getForCurrentUser` | Query | FEAT-009 根據用戶權限過濾 OpCo |
| `api.omExpense.getCategories` | Query | 獲取 OM 類別列表 |
| `api.omExpense.getSummary` | Query | OM Summary 彙總數據（currentYear, previousYear, opCoIds, categories） |
| `api.project.getProjectSummary` | Query x2 | 專案摘要（一次全量獲取用於初始化、一次過濾後獲取） |

### 引用組件

| 來源目錄 | 組件 |
|---------|------|
| `components/ui/` | Breadcrumb (全套), Tabs/TabsList/TabsTrigger/TabsContent |
| `components/layout/` | DashboardLayout |
| `components/om-summary/` | OMSummaryFilters, OMSummaryCategoryGrid, OMSummaryDetailGrid, FilterState (type) |
| `components/project-summary/` | ProjectSummaryFilters, ProjectSummaryTable |

### i18n 命名空間
- `omSummary`
- `projectSummary`
- `common`

### 權限控制
- **Session 檢查**：使用 `useSession()` 判斷 Admin 身份（CHANGE-014/CHANGE-029）
- **雙重判斷**：`role.name === 'Admin'` OR `role.id === 3`
- **OpCo 權限傳遞**：將 `userOpCoCodes` 和 `isAdmin` 傳遞給 ProjectSummaryTable（CHANGE-014）

### 關鍵 UI 特性
- **雙 Tab 切換**：O&M Summary / Project Summary
- **O&M Summary Tab**：
  - 財年選擇（CHANGE-028 預設下一年度）
  - OpCo 多選過濾
  - Category 多選過濾
  - 搜尋功能（CHANGE-030）
  - OMSummaryCategoryGrid 類別匯總表格
  - OMSummaryDetailGrid 明細表格（Category → OpCo → Items 階層）
- **Project Summary Tab**（FEAT-006）：
  - 財年單選
  - 預算類別多選過濾
  - 搜尋功能
  - ProjectSummaryTable
- **自動初始化**：全選 OpCo 和 Category 作為初始過濾條件
- **keepPreviousData**：篩選器變更時保持之前數據直到新數據載入
- **調試日誌**：Console.log session 檢查資訊（CHANGE-029）

### 導航
- **麵包屑**：Dashboard > OM Summary

---

## 模組 4：data-import（OM 費用數據導入）

### 路由結構
```
data-import/
└── page.tsx              # 數據導入頁面（唯一頁面，1,606 行）
```

### 檔案清單

| 檔案路徑 | 行數 | 用途 |
|---------|------|------|
| `data-import/page.tsx` | 1,606 | 三步驟 OM 費用批量導入（上傳 → 預覽 → 結果），Excel/JSON 雙格式 |

### 頁面類型
**Client Component**。此為整個前端中單檔最大的頁面之一。

### tRPC 查詢/Mutation

| API Procedure | 類型 | 說明 |
|--------------|------|------|
| `api.omExpense.importData` | Mutation | 執行批量導入（含 financialYear, importMode, items） |

### 引用組件

| 來源目錄 | 組件 |
|---------|------|
| `components/ui/` | Breadcrumb (全套), Card/CardContent/CardDescription/CardHeader/CardTitle, Button, Label, NativeSelect, Textarea, Alert/AlertDescription/AlertTitle, Tabs/TabsContent/TabsList/TabsTrigger, useToast |
| `components/layout/` | DashboardLayout |
| 外部庫 | `xlsx`（XLSX 客戶端 Excel 解析） |

### i18n 命名空間
- `dataImport`
- `navigation`
- `common`

### 權限控制
- 文件標註 Admin/Supervisor 可執行，無前端顯式角色判斷

### 關鍵 UI 特性
- **三步驟流程**：upload → preview → result（步驟指示器 UI）
- **Excel 檔案上傳**：
  - 拖放支援（onDrop/onDragOver）
  - 客戶端解析（XLSX 庫，非伺服器上傳）
  - 欄位映射配置（13 個 Excel 欄位 → 系統欄位，CHANGE-020 新增 FY 欄位）
- **JSON 資料輸入**：Textarea 貼上或 .json 檔案上傳
- **預覽階段**：
  - 8 格統計面板（totalRows, validItems, skippedRows, errorRows, duplicateRows, uniqueHeaders, uniqueOpCos, uniqueCategories）
  - 問題數據行表格（可展開/收合）
  - 重複數據行表格（可展開/收合）
  - Headers 預覽表格（前 10 項，可展開全部）
  - Items 預覽表格（前 10 項，可展開全部）
- **導入模式選擇**（CHANGE-027）：skip / update / replace
- **FY 自動偵測**（CHANGE-020）：從 Excel Column A 偵測財務年度
- **結果階段**：8 格統計（createdOpCos, createdCategories, createdHeaders, createdItems, createdMonthlyRecords, updatedItems, deletedBeforeReplace, skippedDuplicates）
- **重複檢測**：6 欄位唯一鍵（headerName + itemName + itemDescription + category + opCoName + budgetAmount）
- **日期解析**：支援 Excel 序列號、ISO 字串、Date 物件
- **isOngoing 支援**（CHANGE-011）：End Date 為空時自動設定

### 頁面內定義的類型
- `ImportItem`, `ErrorRow`, `DuplicateRow`, `HeaderPreview`, `ItemPreview`, `ParseResult`, `ImportStep`, `ImportMode`

### 導航
- **麵包屑**：Dashboard > Data Import
- **結果頁連結**：→ OM Expenses 列表

---

## 模組 5：project-data-import（專案數據導入）

### 路由結構
```
project-data-import/
└── page.tsx              # 專案導入頁面（唯一頁面，1,145 行）
```

### 檔案清單

| 檔案路徑 | 行數 | 用途 |
|---------|------|------|
| `project-data-import/page.tsx` | 1,145 | 三步驟專案批量導入（上傳 → 預覽 → 結果），支援 100+ 筆記錄 |

### 頁面類型
**Client Component**。含 2 個內部子組件（StepIndicator, StatCard）。

### tRPC 查詢/Mutation

| API Procedure | 類型 | 說明 |
|--------------|------|------|
| `api.project.importProjects` | Mutation | 執行專案批量導入 |
| `api.project.getByProjectCodes` | Query（enabled: false，手動 refetch） | 檢查重複 projectCode |

### 引用組件

| 來源目錄 | 組件 |
|---------|------|
| `components/ui/` | Button, Card/CardContent/CardDescription/CardHeader/CardTitle, Alert/AlertDescription/AlertTitle, Badge, Progress, Tabs/TabsContent/TabsList/TabsTrigger, Table (全套) |
| `components/layout/` | DashboardLayout |
| 外部庫 | `xlsx`（Excel 解析）, `react-dropzone`（拖放上傳） |

### i18n 命名空間
- `projectDataImport`
- `common`

### 權限控制
- 無顯式前端角色判斷

### 關鍵 UI 特性
- **三步驟流程**：upload → preview → result
- **react-dropzone 整合**：拖放上傳（useDropzone hook）
- **Excel 模板下載**：可產生並下載範例 .xlsx
- **欄位映射**：22 個 Excel 欄位（by header name 對應，不區分大小寫）
- **必填欄位驗證**：name, projectCode
- **Preview Tabs**：valid / errors / duplicates 三個分頁
- **重複檢測**：依 projectCode 檢查資料庫中已存在的專案
- **ChargeOut OpCos 解析**（CHANGE-013）：支援逗號分隔的 OpCo 代碼
- **Probability/Priority 解析**：支援字串（High/Medium/Low）和數字（>=80→High, <=30→Low）
- **結果統計**：created, updated, skipped 三格面板
- **警告列表**（CHANGE-013）：無效 OpCo 代碼等

### 頁面內定義的類型
- `ParsedProject`（22 個欄位）, `ValidationError`, `DuplicateInfo`, `ParseResult`, `ImportResult`, `ImportStep`, `ChargeOutOpCosParseResult`

### 頁面內子組件
- `StepIndicator({ number, label, active, completed })`：步驟指示器
- `StatCard({ label, value, icon, variant })`：統計卡片

### 導航
- 無麵包屑導航
- **結果頁連結**：→ /projects 列表

---

## 模組 6：vendors（供應商管理）

### 路由結構
```
vendors/
├── page.tsx              # 列表頁（卡片/表格雙視圖）
├── new/page.tsx           # 建立頁
├── [id]/page.tsx          # 詳情頁（含報價和採購單列表）
└── [id]/edit/page.tsx     # 編輯頁
```

### 檔案清單

| 檔案路徑 | 行數 | 用途 |
|---------|------|------|
| `vendors/page.tsx` | 408 | 供應商列表，卡片/表格雙視圖，搜尋 + 排序 + 分頁 |
| `vendors/new/page.tsx` | 94 | 建立供應商，委派 VendorForm 組件 |
| `vendors/[id]/page.tsx` | 367 | 供應商詳情，基本資訊 + 報價列表 + 採購單列表 |
| `vendors/[id]/edit/page.tsx` | 193 | 編輯供應商，載入現有資料後傳入 VendorForm |

### 頁面類型
全部為 **Client Component**。

### tRPC 查詢/Mutation

| 頁面 | API Procedure | 類型 |
|------|--------------|------|
| `page.tsx` | `api.vendor.getAll` | Query（page, limit, search, sortBy, sortOrder） |
| `[id]/page.tsx` | `api.vendor.getById` | Query |
| `[id]/page.tsx` | `api.vendor.delete` | Mutation |
| `[id]/edit/page.tsx` | `api.vendor.getById` | Query |

### 引用組件

| 來源目錄 | 組件 |
|---------|------|
| `components/ui/` | Button, Input, NativeSelect, PaginationControls, Card, Skeleton, Alert/AlertDescription, Badge, Table (全套), Breadcrumb (全套), useToast |
| `components/layout/` | DashboardLayout |
| `components/vendor/` | VendorForm |
| `hooks/` | useDebounce |

### i18n 命名空間
- `vendors`
- `common`
- `navigation`

### 權限控制
- ProjectManager 可查看和管理，Supervisor/Admin 完整權限
- 無顯式前端角色判斷

### 關鍵 UI 特性
- **卡片/表格雙視圖切換**
- **即時搜尋**：useDebounce(300ms)，ref 保持 focus
- **排序**：name-asc/desc, createdAt-asc/desc, updatedAt-asc/desc
- **分頁**：PaginationControls 組件
- **聯絡資訊快速操作**：`mailto:` / `tel:` 連結
- **統計卡片**：報價數量、採購單數量
- **關聯資料**：詳情頁顯示報價列表和採購單列表
- **刪除確認**：`confirm()` 對話框
- **骨架屏載入**：完整的 Skeleton 佈局

### 導航
- **麵包屑**：Home > Vendors > [name] > Edit
- **連結**：→ quotes/[id]、→ purchase-orders/[id]

### 注意事項
- `[id]/edit/page.tsx` 第 118-174 行存在**硬編碼中文文字**（「首頁」「供應商管理」「編輯」等），未使用 i18n，違反 i18n 規範

---

## 模組 7：operating-companies（營運公司管理）

### 路由結構
```
operating-companies/
├── page.tsx              # 列表頁（表格視圖）
├── new/page.tsx           # 建立頁
└── [id]/edit/page.tsx     # 編輯頁
```
> 注意：此模組無 `[id]/page.tsx` 詳情頁。

### 檔案清單

| 檔案路徑 | 行數 | 用途 |
|---------|------|------|
| `operating-companies/page.tsx` | 288 | 營運公司列表，表格視圖，搜尋 + 狀態過濾（客戶端過濾） |
| `operating-companies/new/page.tsx` | 75 | 建立營運公司，委派 OperatingCompanyForm 組件 |
| `operating-companies/[id]/edit/page.tsx` | 204 | 編輯營運公司，載入後傳入 OperatingCompanyForm |

### 頁面類型
全部為 **Client Component**。

### tRPC 查詢/Mutation

| 頁面 | API Procedure | 類型 |
|------|--------------|------|
| `page.tsx` | `api.operatingCompany.getAll` | Query（includeInactive: true，一次載入全部） |
| `[id]/edit/page.tsx` | `api.operatingCompany.getById` | Query |

### 引用組件

| 來源目錄 | 組件 |
|---------|------|
| `components/ui/` | Button, Input, NativeSelect, Card, Skeleton, Alert/AlertDescription, Badge, Table (全套), Breadcrumb (全套), CardContent/CardDescription/CardHeader/CardTitle |
| `components/layout/` | DashboardLayout |
| `components/operating-company/` | OperatingCompanyActions, OperatingCompanyForm |

### i18n 命名空間
- `operatingCompanies`
- `common`
- `navigation`

### 權限控制
- 文件標註 ProjectManager 可查看，Supervisor/Admin 可建立/編輯
- 無顯式前端角色判斷

### 關鍵 UI 特性
- **客戶端過濾**：一次載入全部資料（`includeInactive: true`），前端 `useMemo` 過濾（非伺服器端分頁）
- **搜尋**：code 和 name 不區分大小寫匹配
- **狀態過濾**：all / active / inactive
- **表格顯示**：code、name、description、啟用/停用 Badge、chargeOuts 數量、omExpenses 數量
- **行動按鈕**：OperatingCompanyActions 組件
- **啟用/停用 Badge**：`variant="default"` vs `variant="secondary"`
- **OM 費用計數**：`omExpenseItems + omExpensesLegacy`（向後相容）

### 導航
- **麵包屑**：Dashboard > Operating Companies > Create/[code]
- **連結**：code 連結到編輯頁（非詳情頁）

---

## 模組 8：users（使用者管理）

### 路由結構
```
users/
├── page.tsx              # 列表頁（表格視圖）
├── new/page.tsx           # 建立頁（動態載入 UserForm）
├── [id]/page.tsx          # 詳情頁（含專案列表 + 權限配置）
└── [id]/edit/page.tsx     # 編輯頁（動態載入 UserForm + OpCo 權限）
```

### 檔案清單

| 檔案路徑 | 行數 | 用途 |
|---------|------|------|
| `users/page.tsx` | 243 | 使用者列表，表格視圖，角色 Badge |
| `users/new/page.tsx` | 104 | 建立使用者，動態載入 UserForm |
| `users/[id]/page.tsx` | 307 | 詳情頁，管理的專案 + 監督的專案 + FEAT-011 權限配置 |
| `users/[id]/edit/page.tsx` | 221 | 編輯使用者 + FEAT-009 OpCo 權限設定 |

### 頁面類型
- `page.tsx`：Client Component
- `new/page.tsx`：**Server Component**（無 `'use client'`），使用 `next/dynamic` 動態載入 UserForm（ssr: false）
- `[id]/page.tsx`：Client Component
- `[id]/edit/page.tsx`：Client Component，使用 `next/dynamic` 動態載入 UserForm

### tRPC 查詢/Mutation

| 頁面 | API Procedure | 類型 |
|------|--------------|------|
| `page.tsx` | `api.user.getAll` | Query（無分頁參數，一次全量載入） |
| `[id]/page.tsx` | `api.user.getById` | Query |
| `[id]/edit/page.tsx` | `api.user.getById` | Query |

### 引用組件

| 來源目錄 | 組件 |
|---------|------|
| `components/ui/` | Button, Badge, Table (全套), Skeleton, Alert/AlertDescription, Card/CardContent/CardHeader/CardTitle/CardDescription, Breadcrumb (全套) |
| `components/layout/` | DashboardLayout |
| `components/user/` | UserForm（動態載入）, UserPermissionsConfig（FEAT-011）, OpCoPermissionSelector（FEAT-009） |

### i18n 命名空間
- `users`（含 `users.permissions`）
- `navigation`
- `common`

### 權限控制
- 文件標註 **僅 Admin 可訪問**
- **詳情頁**：`useSession()` 判斷 `isAdmin`，Admin 才顯示 UserPermissionsConfig（FEAT-011）
- **編輯頁**：顯示 OpCoPermissionSelector（FEAT-009）

### 關鍵 UI 特性
- **角色 Badge 色碼**：Admin → destructive（紅），Supervisor → default（主色），ProjectManager → secondary（灰）
- **動態載入**：UserForm 使用 `next/dynamic`（ssr: false），載入時顯示 Skeleton
- **管理的專案列表**：詳情頁左側 2/3 寬度，帶專案狀態 Badge
- **監督的專案列表**：詳情頁右側 1/3 寬度
- **權限配置**（FEAT-011）：UserPermissionsConfig 組件，僅 Admin 可見
- **OpCo 權限**（FEAT-009）：編輯頁 OpCoPermissionSelector
- **無分頁**：列表頁一次載入全部使用者

### 導航
- **麵包屑**：Dashboard > Users > [name/email] > Edit
- **連結**：→ projects/[id]（從專案列表）

---

## 跨模組比較分析

### 頁面架構模式

| 模式 | 使用的模組 |
|------|-----------|
| 完整 CRUD（List + New + Detail + Edit） | om-expenses, vendors, users |
| 無詳情頁 CRUD（List + New + Edit） | om-expense-categories, operating-companies |
| 單頁報表 | om-summary |
| 單頁工具 | data-import, project-data-import |

### 表單組件委派模式

所有需要表單的模組都將表單邏輯委派給獨立組件，頁面僅負責資料載入和佈局：

| 模組 | 表單組件 | 位置 |
|------|---------|------|
| om-expenses | OMExpenseForm | `components/om-expense/` |
| om-expense-categories | OMExpenseCategoryForm | `components/om-expense-category/` |
| vendors | VendorForm | `components/vendor/` |
| operating-companies | OperatingCompanyForm | `components/operating-company/` |
| users | UserForm（動態載入） | `components/user/` |

### 資料載入策略

| 策略 | 使用的模組 | 說明 |
|------|-----------|------|
| 伺服器端分頁 | om-expenses, om-expense-categories, vendors | 每頁 10-12 項，API 傳入 page/limit |
| 客戶端過濾 | operating-companies, users | 一次全量載入，useMemo 過濾 |
| 多 Query 組合 | om-summary | 多個 API 並行查詢，手動管理初始化狀態 |

### 共用 UI 模式統計

| UI 模式 | 出現次數 | 說明 |
|---------|---------|------|
| DashboardLayout 包裝 | 21/21 | 所有頁面 |
| Breadcrumb 導航 | 18/21 | 除 data-import 部分頁面和 project-data-import |
| Table 表格 | 14/21 | 列表頁和預覽頁 |
| Card 卡片 | 20/21 | 幾乎所有頁面 |
| Skeleton 骨架屏 | 11/21 | 載入狀態 |
| Badge 徽章 | 13/21 | 狀態、角色、計數 |
| Toast 通知 | 8/21 | 操作成功/失敗回饋 |
| 搜尋 + Debounce | 5/8 模組 | om-expenses, om-expense-categories, vendors, operating-companies, om-summary |

### 檔案大小排名（前 5）

| 排名 | 檔案 | 行數 | 說明 |
|------|------|------|------|
| 1 | `data-import/page.tsx` | 1,606 | 最大單檔，含完整 Excel 解析邏輯 |
| 2 | `project-data-import/page.tsx` | 1,145 | 含 Excel 解析 + 子組件定義 |
| 3 | `om-expenses/[id]/page.tsx` | 744 | FEAT-007 表頭-明細架構核心 |
| 4 | `om-expenses/page.tsx` | 677 | 雙視圖 + 批量操作 |
| 5 | `vendors/page.tsx` | 408 | 雙視圖 + 搜尋排序 |
