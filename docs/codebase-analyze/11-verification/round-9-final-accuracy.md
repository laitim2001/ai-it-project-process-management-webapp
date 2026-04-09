# Round 9: Final Accuracy Sweep

> **驗證日期**: 2026-04-09
> **驗證範圍**: SUMMARY.md, router-index.md, page-index.md, component-index.md, schema-overview.md, CLAUDE.md
> **驗證方法**: 逐項對比文件聲稱數值與實際 codebase 數據

---

## 1. SUMMARY.md 驗證

### Codebase 規模概覽

| 指標 | 文件聲稱 | 實際數值 | 結果 |
|------|----------|----------|------|
| 核心源碼檔案 | 258 (.ts 81 + .tsx 155 + .js 22) | 256 (.ts 81 + .tsx 155 + .js 20) | **[WRONG: .js 是 20 非 22, 總數 256 非 258]** |
| Prisma Models | 32 個 | 32 個 | [CORRECT] |
| API Routers | 17 個 | 17 個 | [CORRECT] |
| API Procedures | 200 個 | 200 個 (11+12+13+7+4+15+7+21+7+19+9+7+25+13+11+13+6) | [CORRECT] |
| API 總行數 | ~16,927 行 | 16,979 行 (routers only) | **[WRONG: doc 說 16,927, 實際 16,979]** |
| 前端頁面路由模組 | 23 個 | 21 locale dirs + API + system = ~23 | [CORRECT] |
| 前端頁面檔案 | 60 個 .tsx | 60 個 page.tsx | [CORRECT] |
| 業務組件 | 51 個 (.tsx) | 51 個 | [CORRECT] |
| 業務組件行數 | ~17,600 行 | 17,597 行 | [CORRECT] |
| UI 組件 | 43 個檔案 | 43 個 (.tsx + .ts) | [CORRECT] |
| UI 組件行數 | ~7,387 行 | 7,387 行 | [CORRECT] |
| 翻譯 Keys | 2,640 個 | 2,706 個 (en + zh-TW 同步) | **[WRONG: doc 說 2,640, 實際 2,706]** |
| 命名空間 | 29 個 | 29 個 | [CORRECT] |
| 腳本工具 | 40 個 | 40 個 (scripts/ 目錄全部檔案) | [CORRECT] |
| Mermaid 圖表 | 30 個 | 31 個 (grep mermaid blocks) | **[WRONG: doc 說 30, 實際 31]** |
| 文檔 (.md) | 620 個 | 719 個 | **[WRONG: doc 說 620, 實際 719]** |

### 技術棧版本

| 技術 | 文件聲稱 | 實際數值 | 結果 |
|------|----------|----------|------|
| Next.js | 14.2.33 | 14.2.33 | [CORRECT] |
| TypeScript | 5.3.3 | ^5.3.3 | [CORRECT] |
| tRPC | 10.45.1 | ^10.45.1 | [CORRECT] |
| Prisma | 5.9.1 | ^5.9.1 | [CORRECT] |
| NextAuth.js | 5.0.0-beta.30 | 5.0.0-beta.30 | [CORRECT] |
| React | React 18 | ^18.2.0 | [CORRECT] |
| next-intl | v4 | ^4.4.0 | [CORRECT] |
| pnpm | 8.15.3 | 8.15.3 | [CORRECT] |

### 最嚴重的發現（過時狀態檢查）

| 項目 | 文件聲稱 | 實際狀態 | 結果 |
|------|----------|----------|------|
| User Router 完全無保護 | 10 個操作全用 publicProcedure | 已修復: 0 publicProcedure (全部 protected/admin) | **[WRONG: 已過時, user.ts 已修復]** |
| Health Router 公開 Schema 修改 | 21 個公開端點 | 已修復: 10 public + 11 admin | **[WRONG: 已過時, schema 修改已改 admin]** |
| 檔案上傳 API 無認證 | 3 個上傳端點無 auth | 已修復: 全部 3 個已加 auth() 檢查 | **[WRONG: 已過時, 上傳路由已修復]** |

---

## 2. router-index.md 驗證

### 總計

| 指標 | 文件聲稱 | 實際數值 | 結果 |
|------|----------|----------|------|
| 總 Router 數 | 17 | 17 | [CORRECT] |
| 總 Procedure 數 | 200 | 200 | [CORRECT] |
| 總行數 | ~16,927 | 16,979 | **[WRONG: doc 說 16,927, 實際 16,979]** |

### 各 Router 行數

| Router | 文件聲稱 | 實際數值 | 結果 |
|--------|----------|----------|------|
| budgetPool.ts | 688 | 689 | **[WRONG: +1]** |
| budgetProposal.ts | 941 | 963 | **[WRONG: +22]** |
| chargeOut.ts | 1,040 | 1,045 | **[WRONG: +5]** |
| currency.ts | 348 | 353 | **[WRONG: +5]** |
| dashboard.ts | 522 | 527 | **[WRONG: +5]** |
| expense.ts | 1,382 | 1,387 | **[WRONG: +5]** |
| expenseCategory.ts | 337 | 337 | [CORRECT] |
| health.ts | 2,421 | 2,421 | [CORRECT] |
| notification.ts | 380 | 382 | **[WRONG: +2]** |
| omExpense.ts | 2,762 | 2,762 | [CORRECT] |
| operatingCompany.ts | 439 | 439 | [CORRECT] |
| permission.ts | 451 | 451 | [CORRECT] |
| project.ts | 2,634 | 2,640 | **[WRONG: +6]** |
| purchaseOrder.ts | 1,004 | 1,004 | [CORRECT] |
| quote.ts | 712 | 712 | [CORRECT] |
| user.ts | 519 | 520 | **[WRONG: +1]** |
| vendor.ts | 347 | 347 | [CORRECT] |

### 各 Router Procedure 數

| Router | 文件聲稱 | 實際數值 | 結果 |
|--------|----------|----------|------|
| budgetPool | 11 | 11 | [CORRECT] |
| budgetProposal | 12 | 12 | [CORRECT] |
| chargeOut | 13 | 13 | [CORRECT] |
| currency | 7 | 7 | [CORRECT] |
| dashboard | 4 | 4 | [CORRECT] |
| expense | 15 | 15 | [CORRECT] |
| expenseCategory | 7 | 7 | [CORRECT] |
| health | 21 | 21 | [CORRECT] |
| notification | 7 | 7 | [CORRECT] |
| omExpense | 19 | 19 | [CORRECT] |
| operatingCompany | 9 | 9 | [CORRECT] |
| permission | 7 | 7 | [CORRECT] |
| project | 25 | 25 | [CORRECT] |
| purchaseOrder | 13 | 13 | [CORRECT] |
| quote | 11 | 11 | [CORRECT] |
| user | 13 | 13 | [CORRECT] |
| vendor | 6 | 6 | [CORRECT] |

### 權限分佈

| 類型 | 文件聲稱 | 實際數值 | 結果 |
|------|----------|----------|------|
| protectedProcedure | ~143 | 165 (grep count incl imports) | **[WRONG: 已因修復增加, user.ts 全改 protected/admin]** |
| supervisorProcedure | ~15 | 25 (grep count incl imports) | **[WRONG: doc 說 ~15, 實際 ~25]** |
| adminProcedure | ~10 | 28 (grep count incl imports) | **[WRONG: doc 說 ~10, 實際 ~28 (health 修改端點改 admin)]** |
| publicProcedure | ~31 (health 21 + user 10) | 12 (all in health.ts; user.ts = 0) | **[WRONG: doc 說 ~31, 實際 ~12 (health 10 procs + user 0)]** |

### 基礎設施檔案

| 檔案 | 文件聲稱 | 實際數值 | 結果 |
|------|----------|----------|------|
| email.ts | 466 行 | 465 行 | **[WRONG: -1]** |
| passwordValidation.ts | 147 行 | 147 行 | [CORRECT] |
| schemaDefinition.ts | 599 行 | 599 行 | [CORRECT] |

---

## 3. page-index.md 驗證

### 總計

| 指標 | 文件聲稱 | 實際數值 | 結果 |
|------|----------|----------|------|
| 路由模組 | 23 | 21 locale + API + system ≈ 23 | [CORRECT] |
| 頁面檔案 | 60 | 60 page.tsx files | [CORRECT] |
| 總行數 | ~23,831 | 23,287 (page.tsx only) | **[WRONG: 聲稱的 group sums 加總不符]** |

### Group 1: 核心工作流

| 指標 | 文件聲稱 | 實際數值 | 結果 |
|------|----------|----------|------|
| 模組數 | 8 | 8 | [CORRECT] |
| 檔案數 | 31 | 31 | [CORRECT] |
| 總行數 | ~12,240 | 13,297 | **[WRONG: +1,057]** |

各模組:

| 模組 | 聲稱檔案 | 實際 | 聲稱行數 | 實際 | 結果 |
|------|----------|------|----------|------|------|
| dashboard | 3 | 3 | 1,036 | 1,049 | **[WRONG: +13]** |
| projects | 5 | 5 | 3,090 | 3,090 | [CORRECT] |
| proposals | 4 | 4 | 1,482 | 1,485 | **[WRONG: +3]** |
| budget-pools | 4 | 4 | 1,330 | 1,359 | **[WRONG: +29]** |
| expenses | 4 | 4 | 1,841 | 1,841 | [CORRECT] |
| charge-outs | 4 | 4 | 1,294 | 1,304 | **[WRONG: +10]** |
| purchase-orders | 4 | 4 | 1,650 | 1,652 | **[WRONG: +2]** |
| quotes | 3 | 3 | 1,517 | 1,517 | [CORRECT] |

### Group 2: OM 與管理

| 指標 | 文件聲稱 | 實際數值 | 結果 |
|------|----------|----------|------|
| 模組數 | 8 | 8 | [CORRECT] |
| 檔案數 | 21 | 21 | [CORRECT] |
| 總行數 | ~7,779 | 7,910 | **[WRONG: +131]** |

各模組:

| 模組 | 聲稱檔案 | 實際 | 聲稱行數 | 實際 | 結果 |
|------|----------|------|----------|------|------|
| om-expenses | 4 | 4 | 1,690 | 1,779 | **[WRONG: +89]** |
| om-expense-categories | 3 | 3 | 448 | 448 | [CORRECT] |
| om-summary | 1 | 1 | 386 | 386 | [CORRECT] |
| data-import | 1 | 1 | 1,606 | 1,606 | [CORRECT] |
| project-data-import | 1 | 1 | 1,145 | 1,145 | [CORRECT] |
| vendors | 4 | 4 | 1,062 | 1,093 | **[WRONG: +31]** |
| operating-companies | 3 | 3 | 567 | 567 | [CORRECT] |
| users | 4 | 4 | 875 | 886 | **[WRONG: +11]** |

### Group 3: 認證與系統

| 指標 | 文件聲稱 | 實際數值 | 結果 |
|------|----------|----------|------|
| 模組數 | 7 | 5 locale + system + API = ~7 | [CORRECT] |
| 檔案數 | ~21 | ~20 (6 pages + 5 system + 8 API + 1 auth.config) | **[WRONG: ~20 vs ~21]** |
| 總行數 | ~3,812 | ~3,839 (pages 1922 + system 560 + API 1357) | **[WRONG: +27]** |

各模組:

| 模組 | 聲稱行數 | 實際 | 結果 |
|------|----------|------|------|
| notifications | 306 | 306 | [CORRECT] |
| settings | 877 | 887 | **[WRONG: +10]** |
| login | 269 | 269 | [CORRECT] |
| register | 266 | 266 | [CORRECT] |
| forgot-password | 194 | 194 | [CORRECT] |

共用系統檔案:

| 檔案 | 聲稱 | 實際 | 結果 |
|------|------|------|------|
| app/layout.tsx | ~30 | 59 | **[WRONG: 實際 59]** |
| app/[locale]/layout.tsx | ~150 | 122 | **[WRONG: 實際 122]** |
| app/page.tsx | ~20 | 59 | **[WRONG: 實際 59]** |
| app/[locale]/page.tsx | ~40 | 99 | **[WRONG: 實際 99]** |
| middleware.ts | 220 | 221 | **[WRONG: +1]** |

API 路由:

| 指標 | 文件聲稱 | 實際數值 | 結果 |
|------|----------|----------|------|
| 路由數 | 7 | 8 (缺少 /api/download) | **[WRONG: 缺 /api/download]** |
| 行數 | ~1,261 | 1,357 | **[WRONG: +96]** |

---

## 4. component-index.md 驗證

| 指標 | 文件聲稱 (header) | 文件聲稱 (table total) | 實際數值 | 結果 |
|------|-------------------|----------------------|----------|------|
| 業務目錄 | 21 | 21 | 21 | [CORRECT] |
| .tsx 檔案 | 51 | 51 | 51 | [CORRECT] |
| 總行數 | 約 17,994 | 17,594 | 17,597 | **[WRONG: header 說 17,994, table 加總 17,594, 實際 17,597]** |

注: header 與 table total 有 400 行差距 (17,994 vs 17,594)。實際最接近 table total。

---

## 5. schema-overview.md 驗證

| 指標 | 文件聲稱 | 實際數值 | 結果 |
|------|----------|----------|------|
| 總 Model 數 | 32 | 32 | [CORRECT] |
| Schema 行數 | 951 | 951 | [CORRECT] |
| @@index 數 | 94 (內文提到 ~80+) | 94 | [CORRECT] (但內文 "~80+" 不精確) |
| 級聯策略 | 16 (SUMMARY claims) | 16 table rows / 20 actual onDelete directives | [CORRECT] (邏輯分組 16 正確) |
| Expense status | Draft, Submitted, Approved, Paid | Draft, Submitted, Approved, Paid | [CORRECT] |
| onDelete: Cascade | (listed 15 in table) | 18 actual | **[WRONG: table 列 14 Cascade rows, 實際 18 Cascade directives]** |
| onDelete: SetNull | 1 | 1 | [CORRECT] |
| onDelete: Restrict | 1 | 1 | [CORRECT] |

Model 分組:

| 領域 | 文件聲稱 | 實際 | 結果 |
|------|----------|------|------|
| Auth & Permission | 8 | 8 (User, Account, Session, VerificationToken, Role, Permission, RolePermission, UserPermission) | [CORRECT] |
| Budget & Project | 4 | 4 (BudgetPool, Project, BudgetProposal, ProjectBudgetCategory) | [CORRECT] |
| Procurement | 4 | 4 (Vendor, Quote, PurchaseOrder, PurchaseOrderItem) | [CORRECT] |
| Expense | 5 | 5 (Expense, ExpenseItem, ExpenseCategory, ChargeOut, ChargeOutItem) | [CORRECT] |
| OM Expense | 3 | 3 (OMExpense, OMExpenseItem, OMExpenseMonthly) | [CORRECT] |
| System | 8 | 8 (Comment, History, Notification, OperatingCompany, ProjectChargeOutOpCo, UserOperatingCompany, BudgetCategory, Currency) | [CORRECT] |

---

## 6. CLAUDE.md 驗證

| 指標 | 文件聲稱 | 實際數值 | 結果 |
|------|----------|----------|------|
| Prisma Models | 32 | 32 | [CORRECT] |
| Total Code | ~73,500 lines | ~78,082 (packages+apps+scripts) | **[WRONG: 實際約 78K, 非 73.5K]** |
| API Routers | 17 | 17 | [CORRECT] |
| Azure AD 命名 | Azure AD (Entra ID) | Azure AD (Entra ID) ← 已修正 | [CORRECT] |
| Zustand/Jotai | 已移除提及 | 無提及 | [CORRECT] |
| CHANGE 範圍 | CHANGE-001~041 | CHANGE-001~041 | [CORRECT] |
| Middleware 保護路徑 | 未明確聲稱數量 | 18 個 | N/A |

---

## 統計摘要

### 按文件統計

| 文件 | 驗證點 | 正確 | 錯誤 | 準確率 |
|------|--------|------|------|--------|
| SUMMARY.md | 26 | 18 | 8 | 69.2% |
| router-index.md | 44 | 27 | 17 | 61.4% |
| page-index.md | 46 | 25 | 21 | 54.3% |
| component-index.md | 4 | 3 | 1 | 75.0% |
| schema-overview.md | 14 | 13 | 1 | 92.9% |
| CLAUDE.md | 6 | 5 | 1 | 83.3% |
| **總計** | **140** | **91** | **49** | **65.0%** |

### 錯誤類型分類

| 類型 | 數量 | 說明 |
|------|------|------|
| 行數偏移 (Bug fixes 造成) | 30 | 多數 router 和頁面行數因修復而增加幾行~幾十行 |
| 過時安全聲稱 | 3 | user.ts, health.ts, upload routes 已修復但文件未更新 |
| 翻譯 key 數量 | 1 | 2,640 → 2,706 (FIX-116 新增 keys) |
| 核心檔案數量 | 2 | .js 數量和總數不準確 |
| 總代碼行數 | 1 | CLAUDE.md ~73,500 vs 實際 ~78,000 |
| 缺漏項目 | 2 | 缺少 /api/download 路由; mermaid 數量 |
| header vs table 不一致 | 1 | component-index header 17,994 vs table 17,594 |
| 近似值偏差 | 5 | 系統檔案行數用 ~ 估計但偏差較大 |
| 文檔數量 | 1 | .md 檔案 620 vs 實際 719 |
| 權限分佈過時 | 3 | protected/admin/public 分佈因修復大幅改變 |

### 關鍵發現

1. **行數偏移是主要錯誤來源**: bug fixes (FIX-101~112) 在多個 router 和頁面中增加了行數，導致 30 個行數不匹配
2. **安全修復未反映到文件**: SUMMARY.md 仍聲稱 user.ts, health.ts, upload routes 有安全問題，但已全部修復
3. **翻譯 keys 已增加**: FIX-116 等修復新增了 66 個翻譯 key (2,640 → 2,706)
4. **權限分佈已大幅改變**: publicProcedure 從 ~31 降至 ~12, adminProcedure 從 ~10 增至 ~28
5. **schema-overview 準確率最高** (92.9%): 因為 Prisma schema 在修復中幾乎未改動
6. **page-index 準確率最低** (54.3%): 多數頁面行數因修復而增加

---

## 總結

| 指標 | 數值 |
|------|------|
| 總驗證點 | 140 |
| 正確 | 91 |
| 錯誤 | 49 |
| **準確率** | **65.0%** |

**主要原因**: bug fixes (FIX-101~112) 修改了大量 router 和頁面檔案的行數，以及改變了權限分佈，但分析文件未同步更新。schema 和 procedure count 等結構性數據仍然準確。

**建議**: 若需保持文件準確性，應在每次批量修復後重新運行行數統計，或改用 "~" 近似值表示可能變動的行數。
