# Round 9: fullstack-architecture/ 交叉比對驗證報告

> **驗證日期**: 2026-04-09
> **驗證目標**: `docs/fullstack-architecture/` (13 份文件) 與實際代碼 + `docs/codebase-analyze/` 的交叉比對
> **文件版本**: fullstack-architecture v1.0 (2025-10-02, 作者 Winston)
> **結論**: **fullstack-architecture 文件嚴重過時**，撰寫於 MVP 開發前的規劃階段，21 個月以來未更新

---

## 一、fullstack-architecture 文件清單

| # | 文件 | 大小 | 內容摘要 |
|---|------|------|----------|
| 1 | `index.md` | 649B | 章節索引 |
| 2 | `1-introduction.md` | 804B | 版本 1.0, 日期 2025-10-02 |
| 3 | `2-high-level-architecture.md` | 2,247B | 高層架構圖 (Mermaid) |
| 4 | `3-tech-stack.md` | 4,552B | 技術棧選型清單 |
| 5 | `4-unified-project-structure.md` | 1,938B | Monorepo 結構 |
| 6 | `5-data-model-and-prisma-schema.md` | 5,844B | Prisma Schema (11 models) |
| 7 | `6-api-design-trpc.md` | 3,544B | tRPC API 設計 |
| 8 | `7-core-components.md` | 1,550B | 前後端核心元件 |
| 9 | `8-core-workflows.md` | 2,254B | 登入/建立專案序列圖 |
| 10 | `9-development-workflow.md` | 1,528B | 開發流程與環境變數 |
| 11 | `10-deployment-architecture.md` | 1,746B | 部署策略 (Docker + ACR) |
| 12 | `11-security-performance-and-observability.md` | 2,280B | 安全/監控策略 |
| 13 | `12-cost-optimization-and-management.md` | 804B | Azure 成本管理 |
| 14 | `13-conclusion-and-next-steps.md` | 1,188B | 下一步行動 |

---

## 二、逐文件逐項交叉比對

### 2.1 文件 1: `1-introduction.md` — 介紹

| # | 聲明 | 狀態 | 說明 |
|---|------|------|------|
| 1 | 版本 1.0, 日期 2025-10-02 | [OUTDATED] | 已過 18 個月，從未更新。整個 MVP + Post-MVP 開發均在此日期之後 |
| 2 | 基於 `prd.md` 和 `front-end-spec.md` | [CURRENT] | 這兩份文件確實存在於 `docs/` |
| 3 | 選擇 T3 Stack 作為核心 | [CURRENT] | 實際使用 T3 Stack (Next.js + tRPC + Prisma) |

**準確率: 2/3 (67%)**

---

### 2.2 文件 2: `2-high-level-architecture.md` — 高層架構

| # | 聲明 | 狀態 | 說明 |
|---|------|------|------|
| 4 | Azure Front Door / CDN 作為入口 | [OUTDATED] | 實際未使用 Front Door，直接部署到 Azure App Service |
| 5 | Azure AD B2C 身份驗證 | [OUTDATED] | 實際使用 **Azure AD (Microsoft Entra ID)**，不是 B2C。codebase-analyze `auth-system.md` 明確指出 Provider 是 `next-auth/providers/azure-ad`，環境變數是 `AZURE_AD_TENANT_ID` 等 |
| 6 | SendGrid 郵件發送 | [CURRENT] | 實際支援 SendGrid + SMTP (Mailhog for dev) |
| 7 | Azure Blob Storage 文件上傳 | [CURRENT] | 實際使用 `@azure/storage-blob` |
| 8 | 部署在 Azure App Service | [CURRENT] | 確認使用 Azure App Service |

**準確率: 3/5 (60%)**

---

### 2.3 文件 3: `3-tech-stack.md` — 技術棧

| # | 聲明 | 實際值 | 狀態 | 說明 |
|---|------|--------|------|------|
| 9 | Next.js `~14.x` | 14.2.33 | [CURRENT] | 版本範圍正確 |
| 10 | TypeScript `~5.x` | ^5.3.3 | [CURRENT] | 版本範圍正確 |
| 11 | Tailwind CSS `~3.x` | ^3.4.1 | [CURRENT] | 版本範圍正確 |
| 12 | Radix UI / Headless UI `~1.x` | 多個 ^1.x~^2.x | [PARTIALLY OUTDATED] | 使用 Radix UI (正確)，但未提及 shadcn/ui (實際核心組件庫) |
| 13 | Zustand / Jotai `~4.x` | **未安裝** | [OUTDATED] | codebase-analyze SUMMARY.md 明確標記：Zustand/Jotai 提及使用但實際未安裝 |
| 14 | tRPC `~10.x` | ^10.45.1 | [CURRENT] | 版本正確 |
| 15 | Prisma `~5.x` | ^5.9.1 | [CURRENT] | 版本正確 |
| 16 | PostgreSQL 16 | 16 | [CURRENT] | 正確 |
| 17 | Jest `~29.x` + RTL | 未配置 | [OUTDATED] | 沒有 Jest 配置，實際使用 Playwright 做 E2E 測試 |
| 18 | Playwright `~1.x` | 已安裝 | [CURRENT] | 正確 |
| 19 | Azure Monitor / Log Analytics | 描述但未確認實施 | [ASPIRATIONAL] | 規劃層級，無法從代碼中確認是否實施 |
| 20 | 未提及 next-intl | next-intl ^4.4.0 | [MISSING] | 完全遺漏 i18n 框架 |
| 21 | 未提及 NextAuth.js | 5.0.0-beta.30 | [MISSING] | 文件將 auth 歸於 Azure AD B2C，未提及 NextAuth.js 作為認證框架 |
| 22 | 未提及 shadcn/ui | 41 個 UI 組件 | [MISSING] | 完全遺漏核心 UI 組件庫 |
| 23 | 未提及 react-hook-form | ^7.56.4 | [MISSING] | 遺漏表單處理庫 |
| 24 | 未提及 xlsx | 已安裝 | [MISSING] | 遺漏 Excel 處理庫 (FEAT-008) |

**準確率: 6/16 (38%)**

---

### 2.4 文件 4: `4-unified-project-structure.md` — 專案結構

| # | 聲明 | 狀態 | 說明 |
|---|------|------|------|
| 25 | Turborepo monorepo | [CURRENT] | 正確 |
| 26 | `apps/web/` Next.js 前端 | [CURRENT] | 正確 |
| 27 | `packages/api/` tRPC 後端 | [CURRENT] | 正確 |
| 28 | `packages/db/` Prisma schema | [CURRENT] | 正確 |
| 29 | `packages/auth/` 認證 | [CURRENT] | 正確 |
| 30 | `packages/eslint-config/` 共用 ESLint | [CURRENT] | 正確 |
| 31 | `packages/tsconfig/` 共用 TypeScript | [CURRENT] | 正確 |
| 32 | 未提及 `apps/web/src/app/[locale]/` | 23 個路由模組 | [MISSING] | 完全遺漏 i18n 路由結構 |
| 33 | 未提及 `apps/web/src/components/ui/` | 41 個 shadcn/ui 組件 | [MISSING] | 遺漏完整的 UI 組件層 |
| 34 | 未提及 `apps/web/src/messages/` | en.json + zh-TW.json | [MISSING] | 遺漏 i18n 翻譯檔案 |
| 35 | 未提及 `scripts/` | 40 個工具腳本 | [MISSING] | 遺漏工具腳本目錄 |
| 36 | 未提及 `docs/`, `claudedocs/` | 620 個 .md 文件 | [MISSING] | 遺漏文檔目錄 |
| 37 | 提及 `features/` 目錄 | **不存在** | [OUTDATED] | 實際使用 `components/[domain]/` 模式，不是 `features/` |

**準確率: 7/13 (54%)**

---

### 2.5 文件 5: `5-data-model-and-prisma-schema.md` — 數據模型 [最嚴重過時]

#### 文件宣稱的模型 (11 個)

| 文件中的 Model | 實際存在? | 狀態 | 差異說明 |
|----------------|-----------|------|----------|
| User | 是 | [OUTDATED] | 文件缺少: `emailVerified`, `image`, `password`, `accounts`, `sessions`, `notifications`, `permissions`, `operatingCompanyPermissions` |
| Role | 是 | [OUTDATED] | 文件缺少 `defaultPermissions` 關聯 |
| BudgetPool | 是 | [OUTDATED] | 文件缺少: `usedAmount`, `description`, `currencyId`, `categories` 關聯 |
| Project | 是 | [OUTDATED] | **極度過時**: 文件 6 欄位 → 實際 30+ 欄位 (FEAT-001/006/010 擴展) |
| BudgetProposal | 是 | [OUTDATED] | 文件缺少: `proposalFilePath`, `meetingDate`, `approvedAmount`, `approvedBy`, `rejectionReason` 等 8+ 新欄位 |
| Vendor | 是 | [PARTIALLY CURRENT] | 核心欄位相同，但缺少 `expenses`, `omExpenses` 關聯 |
| Quote | 是 | [OUTDATED] | 文件定義 `purchaseOrderId` 為一對一 (`@unique`)，實際改為一對多 (`purchaseOrders`) |
| PurchaseOrder | 是 | [OUTDATED] | 文件缺少: `name`, `description`, `status`, `currencyId`, `items` |
| Expense | 是 | [OUTDATED] | **大幅改變**: 新增 `name`, `totalAmount`, `currencyId`, `invoiceNumber`, `requiresChargeOut`, `isOperationMaint`, `items` 等 |
| Comment | 是 | [CURRENT] | 核心結構未變 |
| History | 是 | [CURRENT] | 核心結構未變 |

#### 實際存在但文件完全遺漏的模型 (21 個)

| 遺漏的 Model | 來源 Feature | 說明 |
|-------------|-------------|------|
| Account | Epic 1 (NextAuth) | NextAuth OAuth 帳號 |
| Session | Epic 1 (NextAuth) | NextAuth 會話管理 |
| VerificationToken | Epic 1 (NextAuth) | NextAuth 信箱驗證 |
| Permission | FEAT-011 | 權限定義表 |
| RolePermission | FEAT-011 | 角色預設權限中間表 |
| UserPermission | FEAT-011 | 用戶自訂權限 |
| Notification | Epic 8 | 通知系統 |
| OperatingCompany | Post-MVP | 營運公司主檔 |
| ProjectChargeOutOpCo | FEAT-006 | 專案↔OpCo 多對多 |
| UserOperatingCompany | FEAT-009 | 用戶 OpCo 權限 |
| BudgetCategory | Post-MVP | 預算類別 |
| ProjectBudgetCategory | CHANGE-038 | 專案預算類別同步 |
| PurchaseOrderItem | Post-MVP | 採購單明細 |
| ExpenseItem | Post-MVP | 費用明細 |
| ExpenseCategory | FEAT-007 | 統一費用類別 |
| OMExpense | FEAT-007 | OM 費用表頭 |
| OMExpenseItem | FEAT-007 | OM 費用明細 |
| OMExpenseMonthly | FEAT-007 | OM 費用月度記錄 |
| ChargeOut | FEAT-005 | 費用轉嫁表頭 |
| ChargeOutItem | FEAT-005 | 費用轉嫁明細 |
| Currency | FEAT-001 | 多幣別支援 |

#### 數量比較

| 指標 | fullstack-architecture 宣稱 | 實際代碼 | codebase-analyze 記錄 | 差異 |
|------|---------------------------|---------|---------------------|------|
| Model 總數 | 11 | 32 | 32 | **遺漏 21 個 (66%)** |
| User 欄位數 | 6 | 10 + 10 關聯 | 10 + 10 | 遺漏 4 資料欄位 + 所有新關聯 |
| Project 欄位數 | 6 | 30+ | 30+ | **遺漏 24+ 欄位** |
| 索引定義 | 0 | 94 | 94 | 完全遺漏 |
| 級聯策略 | 0 | 16 | 16 | 完全遺漏 |

**準確率: 2/32 models fully accurate (6%), 9/32 partially (28%)**

---

### 2.6 文件 6: `6-api-design-trpc.md` — API 設計

| # | 聲明 | 狀態 | 說明 |
|---|------|------|------|
| 38 | Router 目錄在 `packages/api/src/routers/` | [CURRENT] | 正確 |
| 39 | 主 Router 檔案名為 `_app.ts` | [OUTDATED] | 實際檔案名為 `root.ts`，不是 `_app.ts` |
| 40 | 提及 `projectRouter` 和 `budgetPoolRouter` | [CURRENT] | 兩者確實存在 |
| 41 | 提及 proposal router 名為 `proposal.ts` | [OUTDATED] | 實際名為 `budgetProposal.ts` |
| 42 | 只列出 3 個 Router | [OUTDATED] | 實際有 **17 個 Router** |
| 43 | `protectedProcedure` 中介軟體 | [CURRENT] | 確認存在且邏輯一致 |
| 44 | `publicProcedure` | [CURRENT] | 存在 |
| 45 | 未提及 `supervisorProcedure` | 實際存在 | [MISSING] | RBAC 中介軟體遺漏 |
| 46 | 未提及 `adminProcedure` | 實際存在 | [MISSING] | Admin 權限遺漏 |
| 47 | 未提及 Zod enum 模式 | 廣泛使用 | [MISSING] | 狀態枚舉未描述 |
| 48 | project.create 中 supervisorId 寫 "TODO" | 已實現 | [OUTDATED] | supervisor 分配已在實際代碼中實現 |
| 49 | 範例使用 `z.string().uuid()` | 實際混用 `.uuid()` 和 `.min(1)` | [PARTIALLY CURRENT] | 範例偏簡化 |

**準確率: 4/12 (33%)**

---

### 2.7 文件 7: `7-core-components.md` — 核心元件

| # | 聲明 | 狀態 | 說明 |
|---|------|------|------|
| 50 | `api` 是應用的「大腦」 | [CURRENT] | 概念正確 |
| 51 | `db` 是數據的「單一事實來源」 | [CURRENT] | 正確 |
| 52 | `auth` 封裝 Azure AD B2C 互動 | [OUTDATED] | 實際是 Azure AD (非 B2C) + Credentials Provider 雙模式 |
| 53 | 前端有 `features/` 目錄 | [OUTDATED] | **不存在**。實際使用 `components/[domain]/` 模式 (project/, proposal/, expense/ 等 21 個業務組件目錄) |
| 54 | 提及 `hooks/` | [CURRENT] | 存在 |
| 55 | 提及 `lib/trpc.ts` | [CURRENT] | 存在 |
| 56 | 未提及 `components/ui/` | 41 個 shadcn/ui 組件 | [MISSING] | 完全遺漏 |
| 57 | 未提及 `components/layout/` | Sidebar, TopBar 等 | [MISSING] | 遺漏佈局組件 |
| 58 | 未提及 notification, om-expense 等業務組件 | 51 個業務組件 | [MISSING] | 遺漏所有業務組件 |

**準確率: 4/9 (44%)**

---

### 2.8 文件 8: `8-core-workflows.md` — 核心工作流程

| # | 聲明 | 狀態 | 說明 |
|---|------|------|------|
| 59 | 登入流程：Azure AD B2C OAuth | [OUTDATED] | 實際支援雙模式：Azure AD SSO + Email/Password (Credentials)。序列圖只描述了 Azure AD B2C 流程 |
| 60 | 登入設置 HttpOnly Session Cookie | [OUTDATED] | 實際使用 **JWT Session 策略** (不是 Database Session)，auth-system.md 明確指出：JWT 模式 |
| 61 | 建立專案流程：Zod 前端驗證 → tRPC mutation → Prisma create | [CURRENT] | 概念流程正確 |
| 62 | 建立專案流程中 supervisorId "TODO" | [OUTDATED] | 已實現 supervisor 分配 |

**準確率: 1/4 (25%)**

---

### 2.9 文件 9: `9-development-workflow.md` — 開發流程

| # | 聲明 | 狀態 | 說明 |
|---|------|------|------|
| 63 | 先決條件: Node.js v20.x | [CURRENT] | 固定 20.11.0 |
| 64 | 先決條件: pnpm | [CURRENT] | 固定 8.15.3 |
| 65 | 先決條件: Docker Desktop | [CURRENT] | 正確 |
| 66 | 先決條件: Azure CLI | [PARTIALLY CURRENT] | 非開發必需，但部署需要 |
| 67 | `pnpm prisma migrate dev` | [OUTDATED] | 實際使用 `pnpm db:migrate` (turbo 命令) |
| 68 | `pnpm prisma db seed` | [OUTDATED] | 實際使用 `pnpm db:seed` |
| 69 | DATABASE_URL port 5432 | [OUTDATED] | 本地 Docker 使用 **5434** (非標準埠避免衝突) |
| 70 | 環境變數 `AZURE_TENANT_ID` | [OUTDATED] | 實際使用 `AZURE_AD_TENANT_ID` (帶 AD 前綴) |
| 71 | 環境變數 `AZURE_CLIENT_ID` | [OUTDATED] | 實際使用 `AZURE_AD_CLIENT_ID` |
| 72 | 環境變數 `AZURE_AD_B2C_*` 系列 | [OUTDATED] | 實際不使用 B2C，使用 `AZURE_AD_*` |
| 73 | 未提及 Redis | 使用 Redis (port 6381) | [MISSING] | 遺漏 Redis 快取 |
| 74 | 未提及 Mailhog | 使用 Mailhog (port 1025/8025) | [MISSING] | 遺漏郵件測試服務 |
| 75 | 未提及 `pnpm check:env` | 自動化環境檢查 | [MISSING] | 遺漏環境驗證工具 |

**準確率: 4/13 (31%)**

---

### 2.10 文件 10: `10-deployment-architecture.md` — 部署架構

| # | 聲明 | 狀態 | 說明 |
|---|------|------|------|
| 76 | Docker 容器化部署 | [CURRENT] | 確認使用 Docker 多階段構建 |
| 77 | Azure Database for PostgreSQL | [CURRENT] | 正確 |
| 78 | Azure AD B2C 身份驗證 | [OUTDATED] | 實際使用 Azure AD (非 B2C) |
| 79 | Azure Blob Storage 文件存儲 | [CURRENT] | 正確 |
| 80 | GitHub Actions CI/CD | [CURRENT] | 確認有 6 個 GitHub Actions 工作流 |
| 81 | Azure Container Registry (ACR) | [ASPIRATIONAL] | 規劃但難以從代碼確認是否在使用 |
| 82 | Staging + Production 環境 | [CURRENT] | 確認存在 |
| 83 | 零停機部署 | [ASPIRATIONAL] | 描述使用 Deployment Slots，概念正確 |

**準確率: 5/8 (63%)**

---

### 2.11 文件 11: `11-security-performance-and-observability.md`

| # | 聲明 | 狀態 | 說明 |
|---|------|------|------|
| 84 | `protectedProcedure` 保護 API | [PARTIALLY OUTDATED] | 存在但 codebase-analyze 發現 User Router 10 個操作全用 `publicProcedure`，Health Router 21 個公開端點 |
| 85 | Azure Key Vault 管理密鑰 | [ASPIRATIONAL] | 規劃層級，代碼中使用環境變數，非 Key Vault |
| 86 | VNet 網路隔離 | [ASPIRATIONAL] | 規劃層級 |
| 87 | Zod 輸入驗證 | [CURRENT] | 確認廣泛使用 |
| 88 | `pino` 結構化日誌 | [OUTDATED] | **未安裝 pino**，使用 console.log |
| 89 | Azure Application Insights 前端 SDK | [ASPIRATIONAL] | 規劃層級，無法確認實施 |
| 90 | 統一錯誤處理中間件 | [PARTIALLY OUTDATED] | codebase-analyze 發現部分 router 使用 `throw new Error` 而非 `TRPCError` |

**準確率: 1/7 (14%)**

---

### 2.12 文件 12-13: 成本優化 + 結論

| # | 聲明 | 狀態 | 說明 |
|---|------|------|------|
| 91 | Autoscaling 配置 | [ASPIRATIONAL] | 規劃層級 |
| 92 | Azure Cost Management 預算 | [ASPIRATIONAL] | 規劃層級 |
| 93 | 資源標記策略 | [ASPIRATIONAL] | 規劃層級 |
| 94 | PO Validation Checklist 下一步 | [HISTORICAL] | 這是 pre-development 交接指示，已過時 |
| 95 | 三份核心文件 (prd.md, front-end-spec.md, fullstack-architecture.md) | [CURRENT] | 這三份文件確實存在 |

**準確率: 1/5 (20%)**

---

## 三、與 codebase-analyze 交叉比對

### 3.1 Model 數量

| 來源 | Model 數量 | 說明 |
|------|-----------|------|
| fullstack-architecture | 11 | 2025-10-02 撰寫 |
| CLAUDE.md | 27 (聲明) | 已過時，SUMMARY.md 指出應為 32 |
| codebase-analyze schema-overview.md | 32 | 逐一列出並驗證 |
| 實際 `schema.prisma` (`grep -c "^model"`) | 32 | **真實值** |

**結論**: fullstack-architecture 遺漏 21 個模型 (66%)。codebase-analyze 與實際代碼一致 (32 個)。

### 3.2 API 結構

| 來源 | Router 數量 | Procedure 數量 | 說明 |
|------|-----------|---------------|------|
| fullstack-architecture | 3 (僅示例) | ~5 | 只展示 project, budgetPool, proposal |
| codebase-analyze router-index.md | 17 | ~200 | 完整記錄 |
| 實際 `root.ts` 註冊 | 17 | — | **真實值** |

**結論**: fullstack-architecture 僅示意性提及 3 個 router，實際 17 個。codebase-analyze 完整且準確。

### 3.3 認證實現

| 來源 | 認證方式 | 說明 |
|------|---------|------|
| fullstack-architecture | Azure AD B2C (唯一方式) | 2025-10-02 規劃 |
| codebase-analyze auth-system.md | Azure AD (非 B2C) + Credentials Provider (雙模式) | JWT Session，非 Database Session |
| 實際 `auth.ts` | `azure-ad` + `credentials` | Provider: `next-auth/providers/azure-ad` |

**衝突點**:
1. fullstack-architecture 說 "Azure AD B2C" → 實際是 "Azure AD" (Microsoft Entra ID)
2. fullstack-architecture 說 "HttpOnly Session Cookie" → 實際是 JWT Session
3. fullstack-architecture 未提及 Credentials Provider → 實際支援本地帳號密碼

### 3.4 前端結構

| 來源 | 頁面/路由 | 組件數 | 說明 |
|------|----------|--------|------|
| fullstack-architecture | 未具體列出 | 未具體列出 | 僅概念描述 |
| codebase-analyze | 23 路由模組, 60 頁面 | 51 業務 + 43 UI | 完整計數 |
| 實際 `[locale]/` 目錄 | 23 子目錄 | 41 UI 檔案 | **真實值** |

**衝突點**: fullstack-architecture 提及 `features/` 目錄 → 實際不存在，使用 `components/[domain]/` 模式。

### 3.5 遺漏的重大功能

fullstack-architecture 完全未提及的已實現功能：

| # | 功能 | 實際狀態 | 影響 |
|---|------|---------|------|
| 1 | i18n 國際化 (next-intl) | 2,640 個翻譯 key, 29 個命名空間 | 重大遺漏 |
| 2 | shadcn/ui 設計系統 | 41 個 UI 組件 | 重大遺漏 |
| 3 | 通知系統 (Epic 8) | 完整實現 + Email | 重大遺漏 |
| 4 | OM 費用管理 (FEAT-007) | 表頭-明細架構, 3 個新模型 | 重大遺漏 |
| 5 | 費用轉嫁 (FEAT-005) | ChargeOut + ChargeOutItem | 重大遺漏 |
| 6 | 多幣別支援 (FEAT-001) | Currency 模型 + 多處關聯 | 重大遺漏 |
| 7 | 權限管理 (FEAT-011) | 3 個新模型 + permission router | 重大遺漏 |
| 8 | Excel 數據導入 (FEAT-008) | data-import 頁面 | 重大遺漏 |
| 9 | 深色模式 / 主題切換 | Light/Dark/System | 遺漏 |
| 10 | Dashboard (Epic 7) | PM + Supervisor 儀表板 | 遺漏 |

---

## 四、逐文件過時度評分

| # | 文件 | 準確聲明 | 總聲明 | 準確率 | 過時度 | 建議 |
|---|------|---------|--------|--------|--------|------|
| 1 | `1-introduction.md` | 2 | 3 | 67% | 中 | 歸檔 |
| 2 | `2-high-level-architecture.md` | 3 | 5 | 60% | 高 | 重寫或歸檔 |
| 3 | `3-tech-stack.md` | 6 | 16 | 38% | 極高 | 重寫 |
| 4 | `4-unified-project-structure.md` | 7 | 13 | 54% | 高 | 重寫 |
| 5 | `5-data-model-and-prisma-schema.md` | 2 | 32 | 6% | **極度過時** | **刪除或重寫** |
| 6 | `6-api-design-trpc.md` | 4 | 12 | 33% | 極高 | 重寫 |
| 7 | `7-core-components.md` | 4 | 9 | 44% | 高 | 重寫 |
| 8 | `8-core-workflows.md` | 1 | 4 | 25% | 極高 | 重寫 |
| 9 | `9-development-workflow.md` | 4 | 13 | 31% | 極高 | 重寫 |
| 10 | `10-deployment-architecture.md` | 5 | 8 | 63% | 中高 | 更新 |
| 11 | `11-security-performance.md` | 1 | 7 | 14% | **極度過時** | **重寫** |
| 12 | `12-cost-optimization.md` | 0 | 3 | 0% | 完全理想化 | 歸檔 |
| 13 | `13-conclusion.md` | 1 | 2 | 50% | 過時 | 歸檔 |

### 整體準確率

**40 / 127 聲明準確 = 31.5% 整體準確率**

---

## 五、綜合結論與建議

### 5.1 根本問題

`docs/fullstack-architecture/` 是一份 **pre-development 架構規劃文件** (2025-10-02 v1.0)，在整個 MVP 開發（Epic 1-8）和 Post-MVP 增強階段（FEAT-001 ~ FEAT-012, CHANGE-001 ~ CHANGE-041）期間 **從未更新**。這導致：

1. **數據模型嚴重失真**: 11 → 32 模型，66% 的模型完全遺漏
2. **API 描述嚴重不足**: 3 → 17 routers，82% 的 router 遺漏
3. **認證描述錯誤**: Azure AD B2C → Azure AD + Credentials 雙模式
4. **安全措施理想化**: 多項聲明（Key Vault, VNet, pino）從未實現
5. **技術棧遺漏**: shadcn/ui, next-intl, NextAuth.js, react-hook-form 全未提及

### 5.2 建議行動

| 優先級 | 行動 | 說明 |
|--------|------|------|
| **P0** | 在 `docs/fullstack-architecture/` 根目錄添加 DEPRECATED 標記 | 防止新開發者依賴過時文件 |
| **P1** | 將整個目錄歸檔為 `docs/archive/fullstack-architecture-v1.0-2025-10-02/` | 保留歷史參考價值 |
| **P2** | 將 `docs/codebase-analyze/` 指定為取代的權威文件 | codebase-analyze 準確率 94%+，涵蓋所有實際代碼 |
| **P3** | 若需要更新 fullstack-architecture，從 codebase-analyze 輸出生成 | 不要手動更新，從驗證過的分析結果重建 |

### 5.3 各文件具體建議

| 文件 | 建議 | 替代文件 (codebase-analyze) |
|------|------|---------------------------|
| 5-data-model | **刪除/歸檔** (6% 準確) | `05-database/schema-overview.md` + `model-detail.md` |
| 11-security | **刪除/歸檔** (14% 準確) | `10-issues-and-debt/security-review.md` |
| 8-core-workflows | **刪除/歸檔** (25% 準確) | `09-diagrams/business-process.md` |
| 9-dev-workflow | **刪除/歸檔** (31% 準確) | CLAUDE.md + DEVELOPMENT-SETUP.md |
| 6-api-design | **刪除/歸檔** (33% 準確) | `02-api-layer/router-index.md` + detail/ |
| 3-tech-stack | **刪除/歸檔** (38% 準確) | `01-project-overview/tech-stack.md` |
| 其餘 | 歸檔為歷史參考 | 各對應 codebase-analyze 文件 |

---

## 六、驗證統計

| 指標 | 數值 |
|------|------|
| 驗證的聲明總數 | 127 |
| 準確 (CURRENT) | 40 (31.5%) |
| 過時 (OUTDATED) | 52 (40.9%) |
| 遺漏 (MISSING) | 25 (19.7%) |
| 理想化/未實施 (ASPIRATIONAL) | 10 (7.9%) |
| 交叉比對文件數 | 14 (fullstack-arch) + 10 (codebase-analyze) + schema.prisma + root.ts + package.json |
| 最過時文件 | `5-data-model-and-prisma-schema.md` (6% 準確) |
| 最準確文件 | `1-introduction.md` (67%) / `10-deployment-architecture.md` (63%) |
