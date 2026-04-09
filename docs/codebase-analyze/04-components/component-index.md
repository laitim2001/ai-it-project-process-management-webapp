# Business Components Index - 業務組件索引

> **分析日期**: 2026-04-09
> **分析範圍**: `apps/web/src/components/` (排除 `ui/`)
> **總計**: 21 個業務目錄、51 個 .tsx 檔案、約 17,994 行程式碼

---

## 總覽表格

| # | 目錄 | 檔案數 | 總行數 | 用途 |
|---|------|--------|--------|------|
| 1 | `budget-pool/` | 3 | 975 | 預算池表單、過濾器、類別列管理 |
| 2 | `charge-out/` | 2 | 1,076 | 費用轉嫁表單和狀態流轉操作 |
| 3 | `dashboard/` | 3 | 438 | 儀表板統計卡片和預算池概覽 |
| 4 | `expense/` | 2 | 1,080 | 費用記錄表頭明細表單和審批操作 |
| 5 | `layout/` | 5 | 1,206 | 主佈局、側邊欄、頂部欄、權限閘門、語言切換 |
| 6 | `notification/` | 2 | 382 | 通知鈴鐺和通知下拉選單 |
| 7 | `om-expense/` | 5 | 3,032 | OM 費用表頭-明細架構（FEAT-007 核心） |
| 8 | `om-expense-category/` | 2 | 471 | OM 費用類別 CRUD 操作和表單 |
| 9 | `om-summary/` | 3 | 1,610 | OM Summary 過濾器、類別網格、明細網格 |
| 10 | `operating-company/` | 2 | 546 | 營運公司表單和操作按鈕 |
| 11 | `project/` | 2 | 1,029 | 專案表單（多欄位）和預算類別明細 |
| 12 | `project-summary/` | 2 | 837 | 專案 Summary 過濾器和階層表格 |
| 13 | `proposal/` | 5 | 1,445 | 預算提案表單、審批操作、評論、檔案上傳、會議記錄 |
| 14 | `providers/` | 1 | 56 | NextAuth SessionProvider 封裝 |
| 15 | `purchase-order/` | 2 | 895 | 採購單表頭明細表單和審批操作 |
| 16 | `quote/` | 1 | 339 | 報價單檔案上傳表單 |
| 17 | `settings/` | 2 | 341 | 認證方式顯示和密碼變更對話框 |
| 18 | `shared/` | 2 | 359 | 貨幣顯示格式化和貨幣選擇器 |
| 19 | `theme/` | 1 | 125 | Light/Dark/System 主題切換 |
| 20 | `user/` | 3 | 1,065 | 使用者表單、OpCo 權限選擇器、權限配置 |
| 21 | `vendor/` | 1 | 293 | 供應商建立/編輯表單 |
| | **合計** | **51** | **17,594** | |

---

## 按功能分類

### 表單組件 (Form) - 15 個
| 組件 | 行數 | 表單庫 | 驗證方式 |
|------|------|--------|----------|
| `BudgetPoolForm` | 512 | useState | 手動驗證 |
| `CategoryFormRow` | 227 | (子組件) | Props 錯誤傳入 |
| `ChargeOutForm` | 652 | react-hook-form | Zod |
| `ExpenseForm` | 800 | react-hook-form | Zod |
| `OMExpenseForm` | 969 | react-hook-form | Zod |
| `OMExpenseItemForm` | 599 | react-hook-form | Zod |
| `OMExpenseCategoryForm` | 279 | useState | 手動驗證 |
| `OperatingCompanyForm` | 265 | useState | 手動驗證 |
| `ProjectForm` | 813 | useState | 手動驗證 |
| `BudgetProposalForm` | 261 | useState | 手動驗證 |
| `PurchaseOrderForm` | 640 | react-hook-form | Zod |
| `QuoteUploadForm` | 339 | useState | 手動驗證 |
| `UserForm` | 480 | useState | 手動驗證 |
| `VendorForm` | 293 | useState | 手動驗證 |
| `PasswordChangeDialog` | 204 | useState | 手動驗證 |

### 操作按鈕組件 (Actions) - 6 個
| 組件 | 行數 | 狀態流轉 |
|------|------|----------|
| `ChargeOutActions` | 424 | Draft/Submitted/Confirmed/Paid/Rejected |
| `ExpenseActions` | 280 | Draft/Submitted/Approved |
| `ProposalActions` | 364 | Draft/PendingApproval/Approved/Rejected |
| `PurchaseOrderActions` | 255 | Draft/Submitted/Approved |
| `OMExpenseCategoryActions` | 192 | Edit/Delete/Toggle Active |
| `OperatingCompanyActions` | 281 | Edit/Delete/Toggle Active |

### 過濾器組件 (Filters) - 3 個
| 組件 | 行數 | 過濾欄位 |
|------|------|----------|
| `BudgetPoolFilters` | 236 | 搜尋、年度、金額範圍、排序 |
| `OMSummaryFilters` | 379 | 年度、OpCo 多選、Category 多選、搜尋 |
| `ProjectSummaryFilters` | 329 | 年度、預算類別多選、搜尋 |

### 資料顯示組件 (Display) - 9 個
| 組件 | 行數 | 用途 |
|------|------|------|
| `BudgetPoolOverview` | 229 | 預算池卡片（進度條、健康指示器） |
| `StatCard` | 102 | 統計卡片（舊版） |
| `StatsCard` | 107 | 統計卡片（新版） |
| `OMSummaryCategoryGrid` | 199 | O&M 類別匯總表格 |
| `OMSummaryDetailGrid` | 1,032 | O&M 明細網格（最大組件之一） |
| `OMExpenseItemList` | 615 | 明細項目列表（拖曳排序） |
| `OMExpenseItemMonthlyGrid` | 362 | 項目月度記錄編輯 |
| `OMExpenseMonthlyGrid` | 487 | OM 費用月度記錄（legacy/aggregate） |
| `ProjectSummaryTable` | 508 | 專案階層摘要（Accordion） |

### 佈局與導航組件 - 5 個
| 組件 | 行數 | 用途 |
|------|------|------|
| `DashboardLayout` | 129 | 主佈局（Sidebar + TopBar + Content） |
| `Sidebar` | 462 | 側邊欄導航（FEAT-011 權限過濾） |
| `TopBar` | 286 | 頂部導航欄 |
| `PermissionGate` | 207 | 客戶端路由權限保護 |
| `LanguageSwitcher` | 122 | 語言切換（zh-TW / en） |

### 通知組件 - 2 個
| 組件 | 行數 | 用途 |
|------|------|------|
| `NotificationBell` | 117 | 通知鈴鐺（30 秒自動刷新） |
| `NotificationDropdown` | 265 | 通知下拉選單（標記已讀、跳轉） |

### 其他組件 - 11 個
| 組件 | 行數 | 用途 |
|------|------|------|
| `SessionProvider` | 56 | NextAuth 會話 Provider |
| `ThemeToggle` | 125 | 主題切換（Light/Dark/System） |
| `CurrencyDisplay` | 174 | 貨幣金額格式化顯示 |
| `CurrencySelect` | 185 | 貨幣選擇下拉組件 |
| `AuthMethodsCard` | 137 | 認證方式狀態卡片 |
| `PasswordChangeDialog` | 204 | 密碼設定/變更對話框 |
| `BudgetCategoryDetails` | 216 | 專案預算類別明細表格 |
| `CommentSection` | 173 | 提案評論區 |
| `ProposalFileUpload` | 340 | 提案文件上傳 |
| `ProposalMeetingNotes` | 307 | 提案會議記錄 |
| `OpCoPermissionSelector` | 226 | OpCo 權限多選（FEAT-009） |

---

## 技術棧使用統計

| 技術 | 使用組件數 | 說明 |
|------|-----------|------|
| `useTranslations` (next-intl) | 47/51 | 幾乎所有業務組件都支援 i18n |
| `api` (tRPC) | 40/51 | 大部分組件都有 API 整合 |
| `useToast` (shadcn/ui) | 32/51 | 操作回饋普遍使用 Toast |
| `react-hook-form` + `zod` | 6/51 | 複雜表單使用 RHF + Zod |
| `useState` 手動驗證 | 9/51 | 簡單表單使用原生 state |
| `@dnd-kit` 拖曳排序 | 1/51 | OMExpenseItemList |
| `useSession` (NextAuth) | 5/51 | Sidebar, TopBar, ProposalActions 等 |
| `usePermissions` (FEAT-011) | 2/51 | Sidebar, PermissionGate |
| `AlertDialog` 確認對話框 | 8/51 | 所有 Actions 組件 + 刪除操作 |
