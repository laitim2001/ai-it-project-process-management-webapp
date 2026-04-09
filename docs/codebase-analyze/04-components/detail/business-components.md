# Business Components Detail - 業務組件詳細分析

> **分析日期**: 2026-04-09
> **分析範圍**: `apps/web/src/components/` (排除 `ui/`)

---

## 1. budget-pool/ - 預算池組件 (3 檔, 975 行)

### 1.1 BudgetPoolFilters.tsx (236 行)
- **用途**: 預算池列表頁面的過濾和排序組件，提供即時搜尋、財政年度篩選、金額範圍過濾和多種排序選項。
- **Props**: `filters: FilterState` (search, year, minAmount, maxAmount, sortBy, sortOrder), `onFilterChange: (filters) => void`
- **tRPC**: 無（純客戶端過濾）
- **i18n**: 無（硬編碼英文標籤 - 早期組件）
- **狀態**: `useState` - showAdvanced (進階面板開關)
- **組合**: 原生 HTML input/select
- **模式**: 受控過濾器元件，父組件管理狀態

### 1.2 BudgetPoolForm.tsx (512 行)
- **用途**: 預算池建立/編輯統一表單，支援多個預算類別的動態新增/刪除/更新，自動計算總預算金額。
- **Props**: `mode: 'create' | 'edit'`, `initialData?: { id, name, description, financialYear, currencyId, categories }`
- **tRPC**: `currency.getAll`, `budgetPool.create`, `budgetPool.update`
- **i18n**: `budgetPools`, `common`
- **狀態**: `useState` - formData, categories (CategoryFormData[]), errors
- **組合**: `CategoryFormRow`, `CurrencySelect`, shadcn/ui Card/Input/Button/Label
- **模式**: 表頭-類別動態列表表單，FEAT-002 貨幣選擇整合

### 1.3 CategoryFormRow.tsx (227 行)
- **用途**: 單一預算類別的表單行子組件，提供類別名稱、代碼、金額、說明和排序欄位的輸入。
- **Props**: `category: CategoryFormData`, `index: number`, `onChange`, `onDelete`, `canDelete: boolean`, `errors?: CategoryErrors`
- **tRPC**: 無（由父組件管理）
- **i18n**: `budgetPools.form.category`
- **狀態**: 無（完全受控組件）
- **匯出**: `CategoryFormData`, `CategoryErrors` 介面（供 BudgetPoolForm 使用）
- **模式**: 12 欄 Grid 佈局的表單行

---

## 2. charge-out/ - 費用轉嫁組件 (2 檔, 1,076 行)

### 2.1 ChargeOutActions.tsx (424 行)
- **用途**: ChargeOut 完整狀態流轉操作按鈕組件，支援 Draft -> Submitted -> Confirmed -> Paid 的審批和付款工作流。
- **Props**: `chargeOut: { id, name, status }`, `currentUserRole?: string`
- **tRPC**: `chargeOut.submit`, `chargeOut.confirm`, `chargeOut.reject`, `chargeOut.markAsPaid`, `chargeOut.delete`
- **i18n**: `chargeOuts.actions`
- **狀態**: 5 個 AlertDialog 開關狀態 (delete/submit/confirm/reject/paid)
- **組合**: Button, AlertDialog (5 個確認對話框)
- **模式**: 角色權限控制（Supervisor/Admin 才能 confirm/reject），FIX-050 paymentDate 修復

### 2.2 ChargeOutForm.tsx (652 行)
- **用途**: 費用轉嫁建立/編輯表單，表頭明細架構，管理專案費用轉嫁給 OpCo 的流程。
- **Props**: `initialData?: any`, `isEdit?: boolean`
- **tRPC**: `project.getAll`, `operatingCompany.getAll`, `chargeOut.getEligibleExpenses`, `chargeOut.create`, `chargeOut.update`
- **i18n**: `chargeOuts.form`, `common`
- **狀態**: react-hook-form + Zod, `useState` - items (ChargeOutItemFormData[]), selectedProjectId
- **組合**: Form, Input, Textarea, Card, select 原生元素
- **模式**: 表頭明細表格，CHANGE-002 支援 expenseItemId 明細級別轉嫁，專案變更時自動清空明細

---

## 3. dashboard/ - 儀表板組件 (3 檔, 438 行)

### 3.1 BudgetPoolOverview.tsx (229 行)
- **用途**: Dashboard 預算池卡片概覽，顯示財務摘要、使用率進度條和健康狀態指示器（<70% 健康, 70-90% 警告, >=90% 危險）。
- **Props**: `budgetPools: BudgetPoolSummary[]` (含 fiscalYear, totalAmount, usedAmount, remainingAmount, usagePercentage, projectCount, activeProjectCount)
- **tRPC**: 無（資料由父組件傳入）
- **i18n**: `dashboard.budgetPool`
- **組合**: Card, Progress, lucide-react 圖示
- **模式**: 響應式網格卡片佈局 (md:2 列, lg:3 列)

### 3.2 StatCard.tsx (102 行)
- **用途**: Dashboard 統計卡片（舊版），支援統計值、Lucide 圖示和趨勢百分比顯示。
- **Props**: `title: string`, `value: number | string`, `icon: LucideIcon`, `iconColor?: string`, `trend?: { value, isPositive }`
- **tRPC**: 無
- **i18n**: 無（由父組件傳入已翻譯文字）
- **模式**: 純展示組件，使用 shadcn/ui Card

### 3.3 StatsCard.tsx (107 行)
- **用途**: Dashboard 統計卡片（新版），支援變化趨勢顯示 (increase/decrease) 和自定義背景色。
- **Props**: `title`, `value`, `change?: { value, type, label }`, `icon?: ReactNode`, `bgColor?: string`
- **tRPC**: 無
- **i18n**: 無
- **模式**: 現代化設計，Hover 陰影效果

---

## 4. expense/ - 費用組件 (2 檔, 1,080 行)

### 4.1 ExpenseActions.tsx (280 行)
- **用途**: 費用記錄狀態流轉操作按鈕，支援 Draft -> Submitted -> Approved 審批工作流。
- **Props**: `expenseId: string`, `status: string`, `itemsCount: number`
- **tRPC**: `expense.submit`, `expense.approve`
- **i18n**: `expenses`, `common`
- **狀態**: showSubmitDialog, showApproveDialog
- **組合**: Button, Card, AlertDialog (2 個確認對話框)
- **模式**: 提交前驗證項目數量 >= 1，FIX-044 移除 router.refresh()

### 4.2 ExpenseForm.tsx (800 行)
- **用途**: 費用記錄建立/編輯表頭明細表單，整合動態費用項目明細表格、PO/專案/供應商關聯、布林選項 (requiresChargeOut, isOperationMaint)。
- **Props**: `initialData?: any`, `isEdit?: boolean`
- **tRPC**: `project.getAll`, `purchaseOrder.getAll`, `vendor.getAll`, `budgetPool.getAll`, `operatingCompany.getAll`, `expenseCategory.getActive`, `expense.create`, `expense.update`
- **i18n**: `expenses`, `common`
- **狀態**: react-hook-form + Zod, `useState` - items (ExpenseItemFormData[])
- **組合**: Form, Checkbox, Card, 內嵌 `ExpenseItemFormRow` 子組件
- **模式**: CHANGE-002 費用轉嫁目標 OpCo, CHANGE-003 統一費用類別, FIX-036 vendorId 欄位過濾

---

## 5. layout/ - 佈局組件 (5 檔, 1,206 行)

### 5.1 dashboard-layout.tsx (129 行)
- **用途**: 應用主佈局結構，包含桌面固定側邊欄、移動響應式彈出側邊欄、頂部導航欄和主內容區域。
- **Props**: `children: React.ReactNode`
- **狀態**: isMobileMenuOpen, useEffect 監聽 resize 和 body overflow
- **組合**: Sidebar, TopBar
- **模式**: lg 斷點切換桌面/移動佈局，最大寬度 1600px

### 5.2 Sidebar.tsx (462 行)
- **用途**: 側邊欄導航，包含品牌標識、用戶資訊、4 大分類導航選單 (概覽、專案預算、採購、系統)，FEAT-011 權限過濾。
- **Props**: 無
- **tRPC**: 無（透過 usePermissions hook 呼叫 API）
- **i18n**: `navigation`
- **狀態**: useSession (NextAuth), usePathname, usePermissions (FEAT-011)
- **組合**: Link (i18n routing), Skeleton (載入狀態), lucide-react 圖示 (18 個)
- **模式**: 權限過濾 - 根據 MENU_PERMISSIONS 動態顯示/隱藏菜單，空區段自動隱藏

### 5.3 TopBar.tsx (286 行)
- **用途**: 頂部導航欄，包含搜尋欄、通知中心、語言切換、主題切換和用戶下拉選單（登出功能）。
- **Props**: `onMenuClick?: () => void`
- **i18n**: `navigation`
- **狀態**: useSession, 靜態 notifications 陣列（範例資料）
- **組合**: LanguageSwitcher, ThemeToggle, DropdownMenu, Badge, Input

### 5.4 PermissionGate.tsx (207 行)
- **用途**: FEAT-011 客戶端路由權限保護，支援單一/任一/全部權限檢查模式，無權限時顯示拒絕訊息或重定向。
- **Props**: `permission?`, `anyPermissions?: string[]`, `allPermissions?: string[]`, `fallbackUrl?`, `showAccessDenied?`, `children`
- **tRPC**: 透過 usePermissions hook
- **i18n**: `common`
- **組合**: Card, Button, Skeleton, ShieldX 圖示
- **模式**: 包含 PermissionGateLoading 和 AccessDenied 子組件

### 5.5 LanguageSwitcher.tsx (122 行)
- **用途**: 繁體中文/英文語言切換，使用完整頁面重新載入（window.location.href）避免 React hydration 錯誤。
- **Props**: 無
- **狀態**: isChanging (防止重複點擊)
- **組合**: DropdownMenu, Button, Languages/Check 圖示
- **模式**: FIX-077 使用原生導航而非 Next.js router

---

## 6. notification/ - 通知組件 (2 檔, 382 行)

### 6.1 NotificationBell.tsx (117 行)
- **用途**: 通知鈴鐺圖示，顯示未讀數量徽章，點擊開啟通知下拉選單，每 30 秒自動刷新。
- **Props**: 無
- **tRPC**: `notification.getUnreadCount` (refetchInterval: 30000)
- **i18n**: `notifications`
- **狀態**: isOpen, dropdownRef (useRef 點擊外部關閉)
- **組合**: NotificationDropdown

### 6.2 NotificationDropdown.tsx (265 行)
- **用途**: 通知下拉選單，顯示最近 10 條通知，支援標記已讀、標記所有已讀、跳轉詳情頁。
- **Props**: `onClose: () => void`, `unreadCount: number`
- **tRPC**: `notification.getAll`, `notification.markAsRead`, `notification.markAllAsRead`
- **i18n**: `notifications`
- **組合**: Link (i18n routing), date-fns formatDistanceToNow (zhTW locale)
- **模式**: 通知類型圖示區分（PROPOSAL=藍色, EXPENSE=綠色, 其他=灰色），內嵌 NotificationItem 子組件

---

## 7. om-expense/ - OM 費用組件 (5 檔, 3,032 行) - FEAT-007 核心

### 7.1 OMExpenseForm.tsx (969 行)
- **用途**: OM 費用建立/編輯表單，FEAT-007 表頭-明細架構。建立模式支援內嵌新增多個明細項目；編輯模式僅修改表頭。
- **Props**: `mode: 'create' | 'edit'`, `initialData?`
- **tRPC**: `operatingCompany.getAll`, `vendor.getAll`, `expenseCategory.getActive`, `currency.getAll`, `expense.getAll`, `omExpense.createWithItems`, `omExpense.create`, `omExpense.update`
- **i18n**: `omExpenses.form`, `omExpenses.items`, `omExpenses.itemFields`, `omExpenses.messages`, `common`, `validation`
- **狀態**: react-hook-form + Zod (表頭), `useState` - items (ItemInput[]), showItemForm, editingItem
- **組合**: Card, Table, Select, 內嵌 `InlineItemForm` 子組件
- **模式**: 建立時明細表格含匯總行，generateTempId() 臨時 ID 管理

### 7.2 OMExpenseItemForm.tsx (599 行)
- **用途**: OM 費用明細項目的新增/編輯表單，支援 OpCo、預算金額、幣別、日期範圍、isOngoing 標記等欄位。
- **Props**: `mode`, `omExpenseId?`, `initialData?`, `onSuccess?`, `onCancel?`, `isDialog?`, `defaultOpCoId?`
- **tRPC**: `operatingCompany.getAll`, `currency.getAll`, `omExpense.addItem`, `omExpense.updateItem`
- **i18n**: `omExpenses`, `common`, `validation`
- **狀態**: react-hook-form + Zod (含 refine 條件驗證)
- **模式**: CHANGE-006 上年度實際支出, CHANGE-011 isOngoing 持續進行中標記（endDate 條件必填）

### 7.3 OMExpenseItemList.tsx (615 行)
- **用途**: OM 費用明細項目列表，支援 @dnd-kit 拖曳排序，每行顯示預算/實際支出/利用率。
- **Props**: `omExpenseId`, `items: OMExpenseItemData[]`, `onAddItem`, `onEditItem`, `onDeleteItem`, `onReorder`, `onEditMonthly`, `isLoading?`, `canEdit?`
- **tRPC**: 無（操作由父組件回調處理）
- **i18n**: `omExpenses`, `common`
- **組合**: DndContext, SortableContext, Table, AlertDialog, Tooltip
- **模式**: 內嵌 `SortableRow` 子組件（useSortable hook），利用率顏色警示 (>100% 紅色, >90% 黃色), CHANGE-009 可點擊名稱編輯

### 7.4 OMExpenseItemMonthlyGrid.tsx (362 行)
- **用途**: 單一明細項目的 12 個月度費用記錄網格編輯器，Excel 風格表格介面。
- **Props**: `item: OMExpenseItemData`, `onSave?`, `onClose?`
- **tRPC**: `omExpense.updateItemMonthlyRecords`
- **i18n**: `omExpenses`, `common`
- **狀態**: `useState` - monthlyData (MonthlyRecord[])
- **模式**: 預算概覽區（預算/實際/剩餘/利用率），使用提示區塊

### 7.5 OMExpenseMonthlyGrid.tsx (487 行)
- **用途**: OM 費用月度記錄網格，支援 legacy 模式（可編輯）和 aggregate 模式（唯讀匯總）。
- **Props**: `omExpenseId`, `budgetAmount`, `initialRecords?`, `onSave?`, `mode?: 'legacy' | 'aggregate'`, `itemsMonthlyData?`, `onViewItems?`
- **tRPC**: `omExpense.updateMonthlyRecords` (legacy 模式)
- **i18n**: `omExpenses`, `common`
- **狀態**: `useState` - monthlyData, `useMemo` - aggregatedMonthlyData
- **模式**: aggregate 模式顯示項目分解摘要，Lock 圖示標示唯讀

---

## 8. om-expense-category/ - OM 費用類別組件 (2 檔, 471 行)

### 8.1 OMExpenseCategoryActions.tsx (192 行)
- **用途**: OM 費用類別操作按鈕（DropdownMenu），支援編輯、啟用/停用狀態切換、刪除（有關聯資料時禁止）。
- **Props**: `category: { id, code, name, isActive, _count? }`, `onActionComplete?`
- **tRPC**: `expenseCategory.delete`, `expenseCategory.toggleStatus` (CHANGE-003 統一 API)
- **i18n**: `omExpenseCategories`, `common`
- **組合**: DropdownMenu, AlertDialog

### 8.2 OMExpenseCategoryForm.tsx (279 行)
- **用途**: OM 費用類別建立/編輯表單，支援代碼格式驗證（大寫字母、數字、底線）。
- **Props**: `mode: 'create' | 'edit'`, `initialData?`
- **tRPC**: `expenseCategory.create`, `expenseCategory.update` (CHANGE-003 統一 API)
- **i18n**: `omExpenseCategories`, `common`
- **狀態**: `useState` - formData, errors
- **組合**: Card, Input, Textarea, Label

---

## 9. om-summary/ - OM Summary 組件 (3 檔, 1,610 行)

### 9.1 OMSummaryCategoryGrid.tsx (199 行)
- **用途**: O&M 費用按類別分組匯總表格，顯示當年預算、上年實際、變化百分比和項目數量。
- **Props**: `data: CategorySummaryItem[]`, `grandTotal: GrandTotal`, `currentYear`, `previousYear`, `isLoading?`
- **tRPC**: 無（資料由父組件傳入）
- **i18n**: `omSummary`
- **模式**: 百分比顏色編碼（正值綠色、負值紅色），table-fixed 寬度百分比對齊

### 9.2 OMSummaryDetailGrid.tsx (1,032 行)
- **用途**: O&M 明細網格（最大的業務組件之一），顯示完整的 OM 費用明細及月度資料。
- **Props**: 完整的 summary 資料集
- **i18n**: `omSummary`
- **模式**: 複雜資料表格，大量金額格式化邏輯

### 9.3 OMSummaryFilters.tsx (379 行)
- **用途**: O&M Summary 頁面過濾器，包含財務年度單選、OpCo 多選、Category 多選和全文搜尋。
- **Props**: `filters: FilterState`, `onFiltersChange`, `availableYears`, `opCoOptions`, `categoryOptions`, `searchTerm?`, `onSearchChange?`
- **tRPC**: 無（選項由父組件傳入）
- **i18n**: `omSummary`
- **組合**: NativeSelect, 自建 MultiSelect (含 Popover), Input
- **模式**: CHANGE-030 搜尋功能，MultiSelect 含「Select All」

---

## 10. operating-company/ - 營運公司組件 (2 檔, 546 行)

### 10.1 OperatingCompanyForm.tsx (265 行)
- **用途**: 營運公司建立/編輯表單，支援代碼、名稱、描述和啟用狀態（編輯模式）。
- **Props**: `mode: 'create' | 'edit'`, `initialData?`
- **tRPC**: `operatingCompany.create`, `operatingCompany.update`
- **i18n**: `operatingCompanies`, `common`
- **組合**: Input, Textarea, Switch, Label

### 10.2 OperatingCompanyActions.tsx (281 行)
- **用途**: 營運公司操作按鈕（直接按鈕顯示），支援編輯、切換啟用/停用、刪除（有關聯資料時禁止）。
- **Props**: `opCo: { id, code, name, isActive, _count? }`, `onSuccess?`
- **tRPC**: `operatingCompany.toggleActive`, `operatingCompany.delete`
- **i18n**: `operatingCompanies`, `common`
- **組合**: Button, AlertDialog (2 個), Tooltip (3 個)
- **模式**: hasRelations 檢查（chargeOuts + omExpenseItems + omExpensesLegacy）

---

## 11. project/ - 專案組件 (2 檔, 1,029 行)

### 11.1 ProjectForm.tsx (813 行)
- **用途**: 專案建立/編輯表單，支援 20+ 個欄位（FEAT-001/006/010 增強），包含預算池選擇、預算類別、OpCo 轉嫁、專案類型等。
- **Props**: `mode: 'create' | 'edit'`, `initialData?` (含 20+ 欄位)
- **tRPC**: `budgetPool.getAll`, `user.getAll`, `currency.getAll`, `operatingCompany.getAll`, `project.checkProjectCode`, `project.create`, `project.update`
- **i18n**: `projects`, `common`
- **狀態**: `useState` - formData (20+ 欄位), errors
- **組合**: Combobox (預算池/貨幣搜尋), BudgetCategoryDetails, useDebounce (專案編號唯一性驗證)
- **模式**: FEAT-010 表單佈局重新編排

### 11.2 BudgetCategoryDetails.tsx (216 行)
- **用途**: CHANGE-038 專案預算類別明細表格，支援 create/edit/readonly 三種模式，顯示 Budget Pool 類別和 Request Amount。
- **Props**: `budgetPoolId`, `projectId?`, `mode`, `onCategoriesChange?`
- **tRPC**: `budgetPool.getCategories`, `project.getProjectBudgetCategories`, `project.getOthersRequestedAmounts` (CHANGE-039)
- **i18n**: `projects.form.fields.budgetCategoryDetails`
- **狀態**: `useState` - localAmounts (Record<string, string>)
- **模式**: useCallback 避免 setState updater 內觸發父組件更新，useEffect 通知父組件

---

## 12. project-summary/ - 專案 Summary 組件 (2 檔, 837 行)

### 12.1 ProjectSummaryFilters.tsx (329 行)
- **用途**: Project Summary 過濾器，包含財務年度單選和預算類別多選（可搜尋）。
- **Props**: `filters`, `onFiltersChange`, `availableYears`, `budgetCategoryOptions`, `searchTerm?`, `onSearchChange?`
- **i18n**: `projectSummary`
- **組合**: NativeSelect, 自建 MultiSelect (含 Popover), Input
- **模式**: 與 OMSummaryFilters 結構類似（共用 MultiSelect 模式）

### 12.2 ProjectSummaryTable.tsx (508 行)
- **用途**: 專案摘要階層表格，使用 Accordion 展示 OpCo -> Category -> Projects 結構。
- **Props**: ProjectSummaryItem[] 等
- **i18n**: `projectSummary`
- **組合**: Accordion, Table, Badge
- **模式**: FEAT-006 16 個欄位顯示，每個 Category 小計

---

## 13. proposal/ - 預算提案組件 (5 檔, 1,445 行)

### 13.1 BudgetProposalForm.tsx (261 行)
- **用途**: 預算提案建立/編輯表單，支援標題、金額和專案選擇。
- **Props**: `mode: 'create' | 'edit'`, `initialData?: { id, title, amount, projectId }`
- **tRPC**: `project.getAll`, `budgetProposal.create`, `budgetProposal.update`
- **i18n**: `proposals`, `common`

### 13.2 ProposalActions.tsx (364 行)
- **用途**: 提案狀態流轉操作，支援提交/批准/拒絕/請求更多資訊/回退草稿 (CHANGE-018)。
- **Props**: `proposalId: string`, `status: string`
- **tRPC**: `budgetProposal.submit`, `budgetProposal.approve`, `budgetProposal.revertToDraft`
- **i18n**: `proposals`, `common`
- **組合**: AlertDialog (含 Trigger), RotateCcw 圖示
- **模式**: useSession 用戶身份驗證，React Query 快取更新

### 13.3 CommentSection.tsx (173 行)
- **用途**: 提案評論區組件，支援查看評論歷史和新增評論。
- **Props**: `proposalId: string`, `comments: Comment[]`
- **tRPC**: `budgetProposal.addComment`
- **i18n**: 透過 useTranslations

### 13.4 ProposalFileUpload.tsx (340 行)
- **用途**: 提案文件上傳組件，支援 PDF/PPT/Word 格式，上傳到 Azure Blob Storage。
- **Props**: `proposalId`, `proposalFilePath?`, `proposalFileName?`, `proposalFileSize?`
- **tRPC**: 上傳 mutation
- **模式**: 文件類型驗證、20MB 限制、上傳進度顯示

### 13.5 ProposalMeetingNotes.tsx (307 行)
- **用途**: 提案會議記錄管理，支援顯示/編輯模式切換，包含會議日期、記錄和介紹人員。
- **Props**: `proposalId`, `meetingDate?`, `meetingNotes?`, `presentedBy?`
- **tRPC**: `budgetProposal.updateMeetingNotes`
- **組合**: Card, Input, Textarea, Alert

---

## 14. providers/ - Provider 組件 (1 檔, 56 行)

### 14.1 SessionProvider.tsx (56 行)
- **用途**: NextAuth SessionProvider 客戶端封裝，放置在根 layout 提供全應用 session 上下文。
- **Props**: `children: ReactNode`
- **依賴**: `next-auth/react` SessionProvider

---

## 15. purchase-order/ - 採購單組件 (2 檔, 895 行)

### 15.1 PurchaseOrderActions.tsx (255 行)
- **用途**: 採購單工作流操作按鈕，支援 Draft -> Submitted -> Approved 流程。
- **Props**: `purchaseOrderId`, `status`, `itemsCount`
- **tRPC**: `purchaseOrder.submit`, `purchaseOrder.approve`
- **模式**: 與 ExpenseActions 結構類似

### 15.2 PurchaseOrderForm.tsx (640 行)
- **用途**: 採購單建立/編輯表頭明細表單，支援品項明細動態管理、自動計算小計和總金額。
- **Props**: `initialData?`, `isEdit?: boolean`
- **tRPC**: `project.getAll`, `vendor.getAll`, `quote.getAll`, `purchaseOrder.create`, `purchaseOrder.update`
- **狀態**: react-hook-form + Zod, `useState` - items
- **模式**: FIX-029 空 quoteId 過濾

---

## 16. quote/ - 報價單組件 (1 檔, 339 行)

### 16.1 QuoteUploadForm.tsx (339 行)
- **用途**: 報價單文件上傳表單，支援 PDF/DOC/XLS 格式、供應商選擇和報價金額輸入。
- **Props**: `projectId: string`, `onSuccess?`
- **tRPC**: `vendor.getAll`
- **i18n**: `quotes`
- **模式**: 10MB 限制，上傳進度顯示

---

## 17. settings/ - 設定組件 (2 檔, 341 行)

### 17.1 AuthMethodsCard.tsx (137 行)
- **用途**: CHANGE-041 認證方式狀態卡片，顯示 Azure AD SSO 和本機密碼兩種認證方式的狀態。
- **Props**: 無
- **tRPC**: `user.getOwnAuthInfo`
- **i18n**: `settings.security`
- **組合**: Card, Badge, PasswordChangeDialog

### 17.2 PasswordChangeDialog.tsx (204 行)
- **用途**: CHANGE-041 密碼設定/變更對話框，支援首次設定（不需舊密碼）和變更密碼模式。
- **Props**: `open`, `onOpenChange`, `hasExistingPassword: boolean`
- **tRPC**: `user.changeOwnPassword`
- **i18n**: `settings`
- **組合**: Dialog, PasswordInput, PasswordStrengthIndicator

---

## 18. shared/ - 共享組件 (2 檔, 359 行)

### 18.1 CurrencyDisplay.tsx (174 行)
- **用途**: 統一的貨幣金額顯示組件，支援符號/代碼/名稱三種顯示模式，千分位格式化。
- **Props**: `amount`, `currency?`, `showSymbol?`, `showCode?`, `showName?`, `className?`, `formatOptions?`
- **匯出**: `CurrencyDisplay`, `CurrencyDisplayCompact`, `CurrencyDisplayFull` 三個變體
- **模式**: 純展示組件，無 tRPC/i18n 依賴

### 18.2 CurrencySelect.tsx (185 行)
- **用途**: 貨幣選擇下拉組件，自動從 API 載入啟用的貨幣列表。
- **Props**: `value?`, `onChange`, `disabled?`, `required?`, `placeholder?`, `className?`
- **tRPC**: `currency.getAll` (includeInactive: false)
- **i18n**: `common`
- **匯出**: `CurrencySelect`, `CurrencySelectCompact` 兩個變體
- **模式**: 載入/錯誤/空狀態處理

---

## 19. theme/ - 主題組件 (1 檔, 125 行)

### 19.1 ThemeToggle.tsx (125 行)
- **用途**: 主題切換下拉選單，支援 Light/Dark/System 三種模式。
- **Props**: 無
- **i18n**: `common`
- **組合**: DropdownMenu, Sun/Moon/Monitor 圖示
- **依賴**: `@/hooks/use-theme` 自訂 Hook

---

## 20. user/ - 使用者組件 (3 檔, 1,065 行)

### 20.1 UserForm.tsx (480 行)
- **用途**: 使用者新增/編輯表單，支援電子郵件、姓名、角色選擇和 CHANGE-032 密碼管理。
- **Props**: `mode: 'create' | 'edit'`, `initialData?: { id, email, name, roleId }`
- **tRPC**: `user.create`, `user.update`, `user.getRoles`, `user.setPassword`
- **i18n**: `users`, `common`
- **組合**: PasswordInput, PasswordStrengthIndicator, Card
- **模式**: 密碼強度驗證（最少 12 字元、6 個特殊字元）

### 20.2 OpCoPermissionSelector.tsx (226 行)
- **用途**: FEAT-009 OpCo 數據權限多選組件，Checkbox 列表讓管理員分配用戶可訪問的營運公司。
- **Props**: `userId: string`, `disabled?: boolean`
- **tRPC**: `operatingCompany.getUserPermissions`, `operatingCompany.setUserPermissions`
- **i18n**: `users.permissions`
- **組合**: Checkbox, Skeleton, Button (全選/清除)

### 20.3 UserPermissionsConfig.tsx (359 行)
- **用途**: FEAT-011 用戶權限配置組件，按類別分組顯示所有權限，支援開關切換和批量保存。
- **Props**: `userId: string`
- **tRPC**: `permission.getUserEffectivePermissions`, `permission.updateUserPermissions`
- **i18n**: `users`, `common`
- **組合**: Card, Switch, Badge, Skeleton
- **模式**: 角色預設權限（Lock 圖示）vs 用戶覆蓋（Plus/Minus 圖示），重置為角色預設

---

## 21. vendor/ - 供應商組件 (1 檔, 293 行)

### 21.1 VendorForm.tsx (293 行)
- **用途**: 供應商建立/編輯表單，支援名稱、聯絡人、電子郵件（格式驗證）和電話。
- **Props**: `mode: 'create' | 'edit'`, `initialData?: { id, name, contactPerson, contactEmail, phone }`
- **tRPC**: `vendor.create`, `vendor.update`
- **i18n**: `vendors`, `common`
- **狀態**: `useState` - formData, errors

---

## 跨組件模式摘要

### 表單驗證方式分佈
| 方式 | 組件 | 說明 |
|------|------|------|
| react-hook-form + Zod | ChargeOutForm, ExpenseForm, OMExpenseForm, OMExpenseItemForm, PurchaseOrderForm | 複雜表頭明細表單 |
| useState + 手動驗證 | BudgetPoolForm, ProjectForm, VendorForm, UserForm, OMExpenseCategoryForm, OperatingCompanyForm, BudgetProposalForm, QuoteUploadForm, PasswordChangeDialog | 較簡單的表單 |

### 狀態流轉工作流
| 模型 | 狀態 | 操作組件 |
|------|------|----------|
| BudgetProposal | Draft -> PendingApproval -> Approved/Rejected/MoreInfoRequired | ProposalActions |
| Expense | Draft -> Submitted -> Approved | ExpenseActions |
| PurchaseOrder | Draft -> Submitted -> Approved | PurchaseOrderActions |
| ChargeOut | Draft -> Submitted -> Confirmed -> Paid / Rejected | ChargeOutActions |

### 共用 UI 模式
- **確認對話框**: 所有 Actions 組件使用 AlertDialog 防止誤操作
- **Toast 通知**: 所有寫入操作成功/失敗都使用 useToast
- **載入狀態**: 提交按鈕顯示 Loader2 動畫 + isSubmitting 禁用
- **i18n**: 幾乎所有組件使用 useTranslations，雙命名空間模式（領域 + common）
- **路由**: 使用 `@/i18n/routing` 的 useRouter 和 Link
