# 前端頁面路由總覽索引

> **分析日期**: 2026-04-09
> **總計**: 23 個路由模組, 60 個 .tsx 頁面檔案, ~23,831 行程式碼

---

## 路由模組清單

### Group 1: 核心工作流 (8 模組, 31 檔案, ~12,240 行)

| # | 路由 | 子路由 | 檔案數 | 行數 | 主要功能 |
|---|------|--------|--------|------|----------|
| 1 | /dashboard | / + /pm + /supervisor | 3 | 1,036 | PM/Supervisor 儀表板 + CSV 導出 |
| 2 | /projects | list/new/[id]/[id]/edit/[id]/quotes | 5 | 3,090 | 專案 CRUD + 篩選 + 批量刪除 |
| 3 | /proposals | list/new/[id]/[id]/edit | 4 | 1,482 | 預算提案 + 審批工作流 |
| 4 | /budget-pools | list/new/[id]/[id]/edit | 4 | 1,330 | 預算池 + 類別 + 使用率 |
| 5 | /expenses | list/new/[id]/[id]/edit | 4 | 1,841 | 費用表頭-明細 + 審批 |
| 6 | /charge-outs | list/new/[id]/[id]/edit | 4 | 1,294 | 費用轉嫁 + OpCo 篩選 |
| 7 | /purchase-orders | list/new/[id]/[id]/edit | 4 | 1,650 | 採購單 + 品項明細 |
| 8 | /quotes | list/new/[id] | 3 | 1,517 | 報價 + 文件上傳 |

### Group 2: OM 與管理 (8 模組, 21 檔案, ~7,779 行)

| # | 路由 | 子路由 | 檔案數 | 行數 | 主要功能 |
|---|------|--------|--------|------|----------|
| 9 | /om-expenses | list/new/[id]/[id]/edit | 4 | 1,690 | OM 費用表頭-明細 + 拖曳排序 |
| 10 | /om-expense-categories | list/new/[id]/edit | 3 | 448 | 費用類別 CRUD |
| 11 | /om-summary | / | 1 | 386 | 雙分頁報表 |
| 12 | /data-import | / | 1 | 1,606 | Excel 匯入精靈 (最大單檔) |
| 13 | /project-data-import | / | 1 | 1,145 | 專案 Excel 匯入 |
| 14 | /vendors | list/new/[id]/[id]/edit | 4 | 1,062 | 供應商 CRUD |
| 15 | /operating-companies | list/new/[id]/edit | 3 | 567 | 營運公司 CRUD |
| 16 | /users | list/new/[id]/[id]/edit | 4 | 875 | 用戶管理 (Admin) |

### Group 3: 認證與系統 (7 模組, ~21 檔案, ~3,812 行)

| # | 路由 | 檔案數 | 行數 | 主要功能 |
|---|------|--------|------|----------|
| 17 | /notifications | 1 | 306 | 通知中心 + 無限捲動 |
| 18 | /settings | 2 | 877 | 設定 (4 Tab, Save=TODO) + 幣別 |
| 19 | /login | 1 | 269 | 雙認證 (Azure AD + Password) |
| 20 | /register | 1 | 266 | 註冊 (REST API) |
| 21 | /forgot-password | 1 | 194 | 密碼重設 (模擬, 未實作) |

### 共用系統檔案

| 檔案 | 行數 | 功能 |
|------|------|------|
| app/layout.tsx | ~30 | 根佈局 + Inter 字體 |
| app/[locale]/layout.tsx | ~150 | Provider 鏈: Session→i18n→tRPC→Toaster |
| app/page.tsx | ~20 | 重定向到 /zh-TW |
| app/[locale]/page.tsx | ~40 | Session 判斷 → /dashboard 或 /login |
| middleware.ts | 220 | Auth + i18n 路由保護 |

### API 路由 (7 個, ~1,261 行)

| 路由 | 功能 |
|------|------|
| /api/auth/[...nextauth] | NextAuth handler |
| /api/auth/register | 用戶註冊 |
| /api/trpc/[trpc] | tRPC handler |
| /api/upload/invoice | 發票上傳 (Azure Blob) |
| /api/upload/quote | 報價上傳 (Azure Blob) |
| /api/upload/proposal | 提案上傳 (Azure Blob) |
| /api/admin/seed | 管理員種子數據 |

---

## 關鍵發現

1. **⚠️ i18n 違規**: charge-outs/[id]/edit, purchase-orders/[id]/edit, vendors/[id]/edit 有硬編碼中文
2. **⚠️ 未完成功能**: Settings Save 全為 TODO; Forgot Password 用 setTimeout 模擬
3. **⚠️ 硬編碼幣別**: charge-outs/[id] 金額格式化硬編碼 HKD
4. **📋 最大單檔**: data-import/page.tsx (1,606 行) — 建議拆分
5. **📋 模式不一致**: quotes/new 表單邏輯直接在頁面內，未分離為業務組件

---

## 詳細分析文件

- [Group 1: 核心工作流](detail/group1-core-workflow.md) — dashboard, projects, proposals, budget-pools, expenses, charge-outs, purchase-orders, quotes
- [Group 2: OM 與管理](detail/group2-om-and-admin.md) — om-expenses, om-expense-categories, om-summary, data-import, project-data-import, vendors, operating-companies, users
- [Group 3: 認證與系統](detail/group3-auth-and-system.md) — notifications, settings, login, register, forgot-password, layouts, API routes, middleware
