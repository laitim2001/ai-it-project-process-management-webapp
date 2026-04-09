# 驗證進度追蹤

> **目標準確率**: 95%+
> **最終目標**: 連續 500+ 點零錯誤
> **最後更新**: 2026-04-09

---

## 驗證輪次記錄

| Round | 日期 | 驗證點 | 錯誤 | 準確率 | 深度 |
|-------|------|--------|------|--------|------|
| R1-A: API 存在性/計數 | 2026-04-09 | 102 | 4 | 96.1% | Level 1-2 |
| R1-B: 前端存在性/計數 | 2026-04-09 | 109 | 6 | 94.5% | Level 1-2 |
| R1-C: 資料庫/基礎設施 | 2026-04-09 | 105 | 8 | 92.4% | Level 1-2 |
| **R1 小計** | | **316** | **18** | **94.3%** | |
| R2-A: API Procedure 簽名 | 2026-04-09 | 120 | 3 | 97.5% | Level 3 |
| R2-B: API 業務邏輯語義 | 2026-04-09 | 100 | 1 | 99.0% | Level 4 |
| R2-C: 前端功能聲明 | 2026-04-09 | 95 | 1 | 98.9% | Level 3-4 |
| R2-D: 安全與問題聲明 | 2026-04-09 | 27 | 4 | 85.2% | Level 4 |
| R2-E: 跨文件一致性/圖表 | 2026-04-09 | 132 | 18 | 86.4% | Level 5 |
| **R2 小計** | | **474** | **27** | **94.3%** | |
| R3-A: 剩餘 9 Router 簽名+邏輯 | 2026-04-09 | 110 | 8 | 92.7% | Level 3-4 |
| R3-B: 組件 Props+狀態+Hook+Lib | 2026-04-09 | 100 | 4 | 96.0% | Level 3-4 |
| R3-C: Migration SQL+DB 欄位深層 | 2026-04-09 | 108 | 8 | 93.0% | Level 3-4 |
| R3-D: Build/Deploy+Auth 配置 | 2026-04-09 | 75 | 5 | 93.3% | Level 3-4 |
| R3-E: i18n Key 抽樣+Script 行為 | 2026-04-09 | 100 | 7 | 93.5% | Level 4 |
| **R3 小計** | | **493** | **32** | **93.5%** | |
| **R1+R2+R3 總計** | | **1,283** | **77** | **94.0%** | |

---

## R2 錯誤分類

### R2-A: API Procedure 簽名 (3 FAIL)

| ID | 文件 | 問題 | 嚴重度 |
|----|------|------|--------|
| R2-A-01 | budgetPool.md | `createBudgetPoolSchema` 的 `.omit({ id, isActive })` 未記載 | Low |
| R2-A-02 | chargeOut.md | `getById` 返回值漏記 `expenseItem` 關聯 (CHANGE-002) | Medium |
| R2-A-03 | chargeOut.md | `getEligibleExpenses` 返回值漏記 `expenseItem` 關聯 | Medium |

### R2-B: API 業務邏輯語義 (1 FAIL)

| ID | 文件 | 問題 | 嚴重度 |
|----|------|------|--------|
| R2-B-01 | expense.md | `expense.reject` 使用 `'EXPENSE_REJECTED'` 通知類型，不在 notification.ts enum 中（代碼 bug，非文件錯誤） | Low |

**額外發現的代碼 bug**:
- `expense.getStats` 引用 `'PendingApproval'` 狀態，expense 狀態機中不存在此狀態，永遠返回 0
- `project.chargeOut` 使用 `throw new Error` 而非 `TRPCError`

### R2-C: 前端功能聲明 (1 FAIL)

| ID | 文件 | 問題 | 嚴重度 |
|----|------|------|--------|
| R2-C-01 | group2-om-and-admin.md | om-expenses 模組的 i18n namespace 列表含 `navigation`，但僅子頁面使用，主頁面不用 | Low |

### R2-D: 安全與問題聲明 (4 FAIL)

| ID | 文件 | 問題 | 嚴重度 |
|----|------|------|--------|
| R2-D-01 | tech-debt.md | TODO 計數 15 → 實際 14 | Low |
| R2-D-02 | tech-debt.md | 超 500 行檔案數 29 → 實際 41 | Medium |
| R2-D-03 | tech-debt.md | react-hook-form 使用數 7 → 實際 6 | Low |
| R2-D-04 | dead-code.md | 孤立腳本數 17 → 實際 33（漏計 .py/.sh/.ps1/.sql） | Medium |

**新發現安全 bug**:
- middleware 保護 `/budget-proposals` 但實際路由是 `/proposals` — **提案頁面完全未受認證保護！**

### R2-E: 跨文件一致性/圖表 (18 FAIL)

| ID | 文件 | 問題 | 嚴重度 |
|----|------|------|--------|
| R2-E-01 | er-diagram.md | 總 model 數顯示 31，實際 32（漏 ProjectBudgetCategory） | Medium |
| R2-E-02 | er-diagram.md | OMExpense 顯示幻影欄位 `hasItems` | Medium |
| R2-E-03~12 | er-diagram.md | 10 條 schema 中存在的關聯未在 ER 圖中顯示 | Medium |
| R2-E-13 | middleware.md | 行數 220 → 實際 221 | Low |
| R2-E-14~15 | script-index.md | 2 個 pnpm 命令存在但未列入彙總表 | Low |
| R2-E-16 | script-index.md | 行數小計不一致 (7,233 vs ~7,594) | Low |
| R2-E-17~18 | er-diagram.md | model 統計表內部計數不一致 | Low |

---

## R1 錯誤分類 (已修復)

### 彙總統計錯誤 (12/18) ✅ 已修復關鍵項
| ID | 文件 | 問題 | 狀態 |
|----|------|------|------|
| R1-A-01 | router-index.md | 總行數 ~13,859 → 16,927 | ✅ 已修正 |
| R1-A-02 | router-index.md | chargeOut procedures 14 → 13 | ✅ 已修正 |
| R1-A-03 | router-index.md | protectedProcedure ~160 → 143 | ✅ 已修正 |
| R1-A-04 | router-index.md | publicProcedure ~15 → 31 | ✅ 已修正 |
| R1-B-01 | page-index.md | 頁面檔案數 ~73 → 62 | ✅ 已修正 |
| R1-B-02~05 | page-index.md + component-index.md | 其他數字偏差 | 📋 待修正 |
| R1-C-05~08 | schema-overview.md + model-detail.md | 欄位計數 + 幻影欄位 | 📋 待修正 |

---

## 綜合評估

### 按類別準確率

| 文件類別 | R1 準確率 | R2 準確率 | 綜合評估 |
|----------|----------|----------|----------|
| API Router 詳細分析 | 96.1% | 97.5% (簽名) / 99.0% (邏輯) | ⭐ 極佳 |
| 前端頁面分析 | 94.5% | 98.9% | ⭐ 極佳 |
| 安全審查 (Critical) | — | 100% | ⭐ 完美 |
| 安全審查 (計數) | — | 70% | ⚠️ 需修正 |
| 資料庫分析 | 92.4% | — | ✅ 良好 |
| ER 圖表 | — | ~70% | ⚠️ 需修正 |
| 其他圖表 (資料流/業務) | — | 100% | ⭐ 完美 |
| i18n 分析 | — | 100% | ⭐ 完美 |

### 強項
- **API 業務邏輯描述**: 99.0% — 狀態機、Transaction、預算會計幾乎完美
- **前端功能聲明**: 98.9% — tRPC 調用、組件 Props、UI Variants 全部正確
- **安全問題 Critical 聲明**: 100% — 所有關鍵安全漏洞均已驗證確認
- **資料流與業務流程圖**: 100% — 與代碼完全一致

### 弱項 (待修正)
- **ER 圖表**: 遺漏 model 和 10 條關聯，需重新生成
- **計數統計**: 多處彙總數字有算術錯誤
- **幻影欄位 `hasItems`**: 在 model-detail.md 和 ER 圖中都出現，需移除

### 新發現的代碼 bug（R2 驗證副產物）
1. **安全**: middleware 保護 `/budget-proposals` 但路由實為 `/proposals`
2. **邏輯**: `expense.getStats` 引用不存在的 `'PendingApproval'` 狀態
3. **類型**: `expense.reject` 發送未註冊的通知類型 `'EXPENSE_REJECTED'`
4. **錯誤處理**: `project.chargeOut` 用 `throw new Error` 而非 `TRPCError`

---

## R3 錯誤分類

### R3-A: 剩餘 9 Router (8 FAIL)

| ID | 文件 | 問題 | 嚴重度 |
|----|------|------|--------|
| R3-A-01~02 | operatingCompany.md | `getAll`/`getForCurrentUser` 漏記 input 的 `.optional()` 包裝 | Low |
| R3-A-03 | dashboard.md | `getProjectManagerDashboard` 文檔說 include 但代碼用 select | Medium |
| R3-A-04 | operatingCompany.md | `getForCurrentUser` 返回結構因路徑不同而異，文檔過度簡化 | Low |
| R3-A-05 | notification.md | `create` 的 emailSent 返回值因執行路徑不同而異 | Low |
| R3-A-06 | operatingCompany.md | Admin 檢查文檔說 `roleId >= 3`，代碼已改為 `role.name === 'Admin'` (CHANGE-014) | **Medium** |
| R3-A-07~08 | user.md | 未標記 user.ts 用 `throw new Error` 而非 `TRPCError` (7+ procedures) | Medium |

### R3-B: 組件 Props+狀態 (4 FAIL)

| ID | 文件 | 問題 | 嚴重度 |
|----|------|------|--------|
| R3-B-01~04 | 各組件文件 | 行數差 1（trailing newline 問題） | Trivial |

### R3-C: Migration SQL + DB (8 FAIL)

| ID | 文件 | 問題 | 嚴重度 |
|----|------|------|--------|
| R3-C-01~03 | migration-history.md | 3 個 migration 行數差 1 | Trivial |
| R3-C-04 | migration-history.md | OMExpense 部分欄位用 db:push 加入，無對應 migration SQL | **Medium** |
| R3-C-05 | migration-history.md | OMExpenseItem `@@index([sortOrder])` 只在 schema 不在 migration | Low |
| R3-C-06 | schema-overview.md | Comment/History model 索引未記載 | Low |
| R3-C-07 | model-detail.md | 單欄位索引用複合索引格式表示（誤導性） | Medium |
| R3-C-08 | migration-history.md | RolePermission seed 數量 ~50 → 實際 46 | Low |

### R3-D: Build/Deploy + Auth (5 FAIL)

| ID | 文件 | 問題 | 嚴重度 |
|----|------|------|--------|
| R3-D-01~03 | build-and-deploy.md | 行數差 1 (Dockerfile 等) | Trivial |
| R3-D-04 | config-and-env.md | `.env.example` 用 `SMTP_PASSWORD`，代碼用 `SMTP_PASS` | Medium |
| R3-D-05 | config-and-env.md | `.env.example` DB 端口 5432 vs docker-compose 映射 5434 | Medium |

### R3-E: i18n + Script (7 FAIL)

| ID | 文件 | 問題 | 嚴重度 |
|----|------|------|--------|
| R3-E-01 | (代碼 bug) | `BudgetPoolOverview.tsx` 使用不存在的 namespace `dashboard.budgetPool`，11 keys 缺失 | **Critical** |
| R3-E-02 | translation-analysis.md | `common` namespace 子 key 計數不準，漏記 7 個子 key | Medium |
| R3-E-03 | script-index.md | 漏記 4 個已註冊 pnpm 命令 | Low |
| R3-E-04~06 | translation-analysis.md | 3 個 config 檔行數差 1 | Trivial |
| R3-E-07 | translation-analysis.md | `common.dialogs.delete` path 不存在 | Low |

### 新發現的代碼 bug（R3 驗證副產物）
5. **i18n 運行時**: `BudgetPoolOverview.tsx` 使用不存在的 namespace，導致 MISSING_MESSAGE 錯誤
6. **錯誤處理**: user.ts 7+ procedures 用 `throw new Error` 而非 `TRPCError`
7. **環境配置**: `.env.example` SMTP 變數名與代碼不一致 (`SMTP_PASSWORD` vs `SMTP_PASS`)
8. **環境配置**: `.env.example` DB 端口與 docker-compose 不一致 (5432 vs 5434)
9. **部署**: SendGrid 整合仍是 TODO — 只有 SMTP 實作
10. **文檔**: CLAUDE.md 和 docs 多處提及 Mailhog，但代碼實際用 Ethereal Email

---

## R4 錯誤分類

### R4-A: 未發現安全問題 (22 個新安全問題)
詳見 `round-4-undiscovered-security.md`，主要包括：
- **Critical**: budgetProposal.approve 用 protectedProcedure (任何用戶可審批)
- **Critical**: 客戶端可提供 userId 冒充他人 (budgetProposal submit/approve/addComment)
- **Critical**: 密碼 hash 透過 include 關聯洩漏 (5+ routers)
- **Critical**: 零安全 headers (無 CSP/X-Frame-Options/HSTS)
- **Medium**: 11 個授權缺口 + 輸入驗證不足

### R4-B: 端到端流程追蹤 (9 MISMATCH/UNDOCUMENTED)
- 確認 Azure AD B2C vs Azure AD 命名不一致 (代碼用 azure-ad，文檔寫 B2C)
- ChargeOut 通知未實作 (TODO)
- OM Expense import modes 未反映在資料流圖

### R4-C: 跨文件一致性 (8 INCONSISTENT)
- schema-overview Expense 狀態值錯誤 (PendingApproval → 應為 Submitted)
- business-process 圖 revertToDraft 權限錯誤 (寫 PM 實為 Supervisor)
- Model 數量四處不一致 (27/31/32)

### R4-D: 完整性掃描 (11 gaps)
- `azure/` 目錄 35 檔完全未分析
- `tailwind.config.ts` 未分析
- `apps/web/e2e/` 13 檔未分析
- config-and-env.md 引用不存在的 `packages/eslint-config`

### R4-E: 深層語義抽樣 (1 FAIL)
- users 頁面前端無 Admin 角色檢查

---

## R5 結果摘要

### R5-A: Azure 基礎設施 + E2E (100 points)
- **已填補 R4 發現的最大覆蓋缺口** — azure/ 35 檔 + e2e/ 13 檔已完整分析
- 🔴 **Critical**: Azure DB 密碼明文在 Git 中 (`.gitignore` 規則寫錯)
- E2E 測試覆蓋 3 核心工作流，但 OM/Import/Users/Notifications 未覆蓋

### R5-B: 代碼品質 (100 points)
- N+1 查詢風險：omExpense batchImport 5+ 循環查詢
- 15+ 無界 findMany 查詢
- 錯誤處理不一致：user.ts 17 個 raw Error、project.ts 混用
- 4 處重複 deleteMany + 5 處重複通知建立
- TypeScript 嚴格度良好：0 個 @ts-ignore、22 個 as any

### R5-C: Git 歷史 (98/100)
- 開發歷史文檔極為準確
- CLAUDE.md CHANGE 計數過時 (36 → 實際 41)

### R5-D: Prisma 查詢效能 (100 points)
- 🔴 密碼 hash 在 43+ API 回應中洩漏 (透過 include User 關聯)
- Email 發送在 DB transaction 內部 — 可能導致 timeout rollback
- budgetProposal.getAll 無分頁
- 5 層深 include chain (chargeOut getById)
- 所有 27 個金額欄位用 Float 而非 Decimal

### R5-E: CSS/Tailwind 配置 (100 points)
- 🔴 `tailwindcss-animate` 未安裝 — 20+ 組件動畫靜默失效
- 213 處硬編碼灰色 — dark mode 在業務組件中大量失效
- StatsCard 用了未定義的 Tailwind class
- 正面：UI 組件 100% cn() 使用、strict mode 啟用

---

## 綜合驗證統計

| 指標 | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9 | 累計 |
|------|-----|-----|-----|-----|-----|-----|-----|-----|-----|------|
| 總驗證點 | 316 | 474 | 493 | 510 | 500 | 500 | 500 | 520 | 540 | **4,353** |
| 驗證 Agent 數 | 3 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | **43** |
| 驗證深度 | L1-2 | L3-5 | L3-4 | L3-5 | L3-5 | L3-5 | L3-5 | L3-5 | L3-5 | L1-5 |

### R9 結果摘要

| 驗證組 | 分數 | 核心發現 |
|--------|------|---------|
| R9-A: FIX-135~137 修復驗證 | 100/100 | 所有修復完美 |
| R9-B: fullstack-architecture 交叉比對 | 31.5% 準確 | 應歸檔為 DEPRECATED |
| R9-C: 檔案級覆蓋抽樣 | 103/103 (100%) | 個別檔案覆蓋完美 |
| R9-D: Procedure 100% 完整性 | 200/200 覆蓋 | 22 個 auth 等級文檔未更新 |
| R9-E: 最終準確性 | 65% | 修復後文檔未同步 → 正在修復中 |

### R7 結果摘要

| 驗證組 | 分數 | 核心發現 |
|--------|------|---------|
| R7-A: Batch 1 修復驗證 | 95/100 | 所有 8 個 Critical 修復確認生效 |
| R7-B: Runtime 依賴圖 | 94/100 | Budget Pools 年份篩選失效 (year vs financialYear) |
| R7-C: API 回應一致性 | 83/100 | 兩種分頁格式共存、Currency _count bug |
| R7-D: 測試覆蓋與品質 | — | 零單元測試！代碼 73,500 行 vs 聲稱 35,000+ |

### R7 新發現的問題
| # | 嚴重度 | 描述 | 來源 |
|---|--------|------|------|
| 43 | 🔴 | 零單元測試 — CLAUDE.md 聲稱 Jest 但不存在 | R7-D |
| 44 | 🔴 | 代碼行數 ~73,500 vs 聲稱 ~35,000+ (2.1x 差距) | R7-D |
| 45 | 🟠 | Budget Pools 年份篩選失效 (year vs financialYear) | R7-B |
| 46 | 🟠 | Currency _count.projects 永遠顯示 0 | R7-C |
| 47 | 🟡 | 兩種分頁格式共存 (nested vs flat) | R7-C |
| 48 | 🟡 | 3 個列表頁缺 error handling | R7-C |
| 49 | 🟡 | NextAuth session type 缺 role 定義 (5 處 as any) | R7-C |
| 50 | 🟡 | roleId 存在 JWT 但被 session callback 丟棄 | R7-B |
| 51 | Low | health.ts 7 個診斷查詢仍為 public | R7-A |

## 累計發現的問題 (R1-R7)

### 🔴 Critical 安全問題 (7 個)

| # | 描述 | 發現 |
|---|------|------|
| 1 | User Router 完全無保護 (publicProcedure) | R1 分析 |
| 2 | Health Router 公開 Schema 修改 (21 公開端點) | R1 分析 |
| 3 | 檔案上傳 API 無認證 | R1 分析 |
| 4 | budgetProposal.approve 任何用戶可審批 | R4 |
| 5 | 客戶端可提供 userId 冒充他人 | R4 |
| 6 | 密碼 hash 透過 include 關聯洩漏 (43+ API 回應) | R4+R5 |
| 7 | Azure DB 密碼明文在 Git 中 | R5 |

### 🟠 High 問題 (8 個)

| # | 描述 | 發現 |
|---|------|------|
| 8 | 零安全 headers (CSP/X-Frame-Options/HSTS) | R4 |
| 9 | middleware 路由名稱錯誤 (`/budget-proposals` vs `/proposals`) | R2 |
| 10 | Email 發送在 DB transaction 內 — timeout 風險 | R5 |
| 11 | budgetProposal.getAll 無分頁 — 可載入無限資料 | R5 |
| 12 | tailwindcss-animate 未安裝 — 動畫靜默失效 | R5 |
| 13 | 213 處硬編碼顏色 — dark mode 業務組件失效 | R5 |
| 14 | 所有 27 個金額欄位用 Float — 精度風險 | R5 |
| 15 | 文檔全程寫 "Azure AD B2C" 但代碼用標準 Azure AD | R4 |

### 🟡 Medium 問題 (15+ 個)

| # | 描述 | 發現 |
|---|------|------|
| 16 | BudgetPoolOverview.tsx i18n namespace 不存在 | R3 |
| 17 | expense.getStats 引用不存在的狀態 | R2 |
| 18 | schema-overview Expense 狀態值錯誤 | R4 |
| 19 | 錯誤處理不一致 (user.ts 17個、project.ts 混用) | R3+R5 |
| 20 | N+1 查詢風險 (omExpense batchImport) | R5 |
| 21 | 4 處重複 deleteMany + 5 處重複通知建立 | R5 |
| 22 | CLAUDE.md 多處過時 (Model 數、CHANGE 數、Zustand) | R1+R5 |
| 23 | .env.example SMTP/DB 配置不一致 | R3 |
| 24 | SendGrid 仍是 TODO | R3 |
| 25 | 文檔提及 Mailhog 但實際用 Ethereal Email | R3 |
| 26 | 5 層深 include chain (chargeOut) | R5 |
| 27 | User delete 不檢查 FK 依賴 | R5 |
| 28 | ER 圖表遺漏 model 和關聯 | R2 |
| 29 | config-and-env.md 引用不存在的 packages/eslint-config | R4 |
| 30 | .gitignore 規則寫錯 (`.azure/output/` vs `azure/output/`) | R5 |
| 31 | **87 個缺失翻譯 key** (dashboard.budgetPool 11, auth.forgotPassword 13, omExpenses.itemFields 32) | R6 |
| 32 | 狀態渲染 bug: `toLowerCase()` 把 PendingApproval 變成 pendingapproval (key 不匹配) | R6 |
| 33 | 10 個檔案用 `zh-HK` locale 而非 `zh-TW` | R6 |
| 34 | `/project-data-import` 路由未受 middleware 保護 | R6 |
| 35 | `/dashboard/supervisor` 和 `/settings/currencies` 無前端角色檢查 | R6 |
| 36 | 3 模組用 `confirm()` 而非 AlertDialog (刪除確認不一致) | R6 |
| 37 | 8 個列表頁缺少分頁 | R6 |
| 38 | 必填欄位指示器不一致 (text-red-500 vs text-destructive vs 無) | R6 |
| 39 | 4 個模組用 "Loading..." 純文字而非 Skeleton | R6 |
| 40 | ER 圖表 9 條關聯遺漏 (58 條中 9 條 = 84.5% 覆蓋) | R6 |
| 41 | 頁面計數仍不準確 (62 應為 60) | R6 |
| 42 | 2 個孤兒 i18n namespace (errors 9 keys, loading 10 keys) | R6 |
