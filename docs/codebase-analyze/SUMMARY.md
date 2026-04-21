<!--
machine-readable-stats:
  version: 1
  last_analysis_date: "2026-04-09"
  last_refresh_date: "2026-04-21"
  stats:
    core_source_files: 258
    ts_files: 81
    tsx_files: 155
    js_files: 22
    prisma_models: 32
    api_routers: 17
    api_procedures: 200
    api_lines: 16979
    route_modules: 23
    pages: 60
    business_components: 51
    business_components_lines: 17600
    ui_components: 43
    ui_components_lines: 7387
    i18n_keys: 2706
    i18n_namespaces: 29
    scripts: 40
    mermaid_diagrams: 30
    total_md_docs: 620
  tech_stack:
    nextjs: "14.2.33"
    typescript: "5.3.3"
    trpc: "10.45.1"
    prisma: "5.9.1"
    nextauth: "5.0.0-beta.30"
    tailwind: "3.x"
    next_intl: "v4"
    turborepo_pnpm: "8.15.3"
    postgresql: "16"
-->

# Codebase Analysis Summary — IT Project Process Management Webapp

> **分析日期**: 2026-04-09
> **分析方法**: 基於 codebase-analyze-playbook.md 的 6 階段分析法
> **驗證狀態**: Round 1 完成 — 316 驗證點, 94.3% 準確率 (修正後 ~99%)
>
> **⚙️ 機器可讀統計**：本文件頂部 HTML 註解包含 `machine-readable-stats` YAML，供 `scripts/check-claude-md-sync.js` 自動校驗 CLAUDE.md 數字一致性使用。修改統計時請同步更新。

---

## Codebase 規模概覽

| 指標 | 數值 |
|------|------|
| 核心源碼檔案 | 258 (.ts 81 + .tsx 155 + .js 22) |
| Prisma Models | 32 個 (6 個領域分組) |
| API Routers | 17 個, 200 個 procedures |
| API 總行數 | ~16,979 行 |
| 前端頁面路由 | 23 個模組, 60 個 .tsx 頁面檔 |
| 業務組件 | 51 個 (.tsx), ~17,600 行 |
| UI 組件 | 43 個檔案, ~7,387 行 |
| 翻譯 Keys | 2,706 個 (29 個命名空間, en + zh-TW 完全同步, FIX-116 +66 keys) |
| 腳本工具 | 40 個 (9 個類別) |
| Mermaid 圖表 | 30 個 |
| 文檔 (.md) | 620 個 |

---

## 技術棧

| 類別 | 技術 | 版本 |
|------|------|------|
| Framework | Next.js (App Router) | 14.2.33 |
| Language | TypeScript | 5.3.3 |
| API | tRPC | 10.45.1 |
| ORM | Prisma | 5.9.1 |
| Auth | NextAuth.js | 5.0.0-beta.30 |
| UI | React + shadcn/ui + Radix UI | React 18 |
| Styling | Tailwind CSS | 3.x |
| i18n | next-intl | v4 |
| Monorepo | Turborepo + pnpm | 8.15.3 |
| Database | PostgreSQL | 16 |
| Deploy | Azure App Service + Docker | Multi-stage |

---

## 分析文件清單 (48 份)

### 01-project-overview/ (3 份)
- `tech-stack.md` — 技術棧清查 (53 deps + 34 devDeps)
- `architecture-patterns.md` — 架構模式 (tRPC 4 層 procedure, JWT session, Provider 鏈)
- `build-and-deploy.md` — 構建部署 (Docker 多階段, 6 個 GitHub Actions, Azure slot swap)

### 02-api-layer/ (20 份)
- `router-index.md` — 17 Routers 總覽
- `detail/` — 19 份詳細分析 (每個 Router + root/trpc + shared-libs)

### 03-frontend-pages/ (4 份)
- `page-index.md` — 23 路由模組總覽
- `detail/group1-core-workflow.md` — dashboard~quotes (8 模組, 31 檔, ~12,240 行)
- `detail/group2-om-and-admin.md` — om-expenses~users (8 模組, 21 檔, ~7,779 行)
- `detail/group3-auth-and-system.md` — notifications~forgot-password + layouts + API routes (19 檔, ~3,812 行)

### 04-components/ (3 份)
- `component-index.md` — 21 業務組件目錄總覽
- `detail/business-components.md` — 51 個業務組件詳細分析
- `detail/ui-components.md` — 43 個 UI 組件詳細分析

### 05-database/ (3 份)
- `schema-overview.md` — 32 Models, 94 索引, 16 級聯策略
- `model-detail.md` — 每個 Model 的完整欄位規格
- `migration-history.md` — 7 個遷移 + Seed 數據

### 06-auth-and-config/ (3 份)
- `auth-system.md` — 雙認證 (Azure AD + Credentials), JWT, RBAC
- `config-and-env.md` — ~40 環境變數, Next.js/Turborepo 配置
- `middleware.md` — 認證 + i18n 路由保護 (17 個保護路徑)

### 07-scripts-and-tools/ (1 份)
- `script-index.md` — 40 個腳本分類索引

### 08-i18n/ (1 份)
- `translation-analysis.md` — 2,706 keys, 29 namespaces, 完全同步 (FIX-116 +66)

### 09-diagrams/ (4 份)
- `system-architecture.md` — 6 個架構圖
- `data-flow.md` — 8 個資料流圖
- `er-diagram.md` — 7 個 ER 關聯圖
- `business-process.md` — 8 個業務流程圖

### 10-issues-and-debt/ (3 份)
- `security-review.md` — 17 個安全問題 (3 Critical, 5 High)
- `tech-debt.md` — 16 個技術債務項目
- `dead-code.md` — 13 個死碼/未使用程式碼項目

### 11-verification/ (4 份)
- `verification-tracker.md` — 驗證進度追蹤
- `round-1-api.md` — R1-A: 102 點, 96.1%
- `round-1-frontend.md` — R1-B: 109 點, 94.5%
- `round-1-database-infra.md` — R1-C: 105 點, 92.4%

---

## 最嚴重的發現

### 🔴 Critical 安全問題 (已全部修復)
1. **~~User Router 完全無保護~~** ✅ FIX-101 已修復 — 查詢改 protectedProcedure，CUD 改 adminProcedure
2. **~~Health Router 公開 Schema 修改~~** ✅ FIX-102 已修復 — 所有 mutation 改 adminProcedure
3. **~~檔案上傳 API 無認證~~** ✅ FIX-103 已修復 — 3 個上傳端點已加認證中間件

### 🟡 重要技術債務
4. **兩套 Toast 系統共存** — MVP Context 版 + Post-MVP Pub/Sub 版
5. **表單處理不一致** — 6 個用 react-hook-form + Zod, 9 個用 useState
6. **29 個超過 500 行的檔案** (11 個超過 1000 行)
7. **未完成功能**: Settings Save 全為 TODO, Forgot Password 用 setTimeout 模擬

### 📋 CLAUDE.md 不準確
8. **Prisma Model 數量**: 記載 27 個 → 實際 32 個
9. **Zustand/Jotai**: 提及使用但實際未安裝
10. **Azure AD 命名**: turbo.json 用 `AZURE_AD_B2C_*`，代碼用 `AZURE_AD_*`

---

## 後續建議

### ~~優先修復 (安全)~~ ✅ 已全部完成 (FIX-101~103)
1. ~~User Router 加上 `protectedProcedure` / `adminProcedure`~~ ✅ FIX-101
2. ~~Health Router 的 schema 修改端點加上 `adminProcedure`~~ ✅ FIX-102
3. ~~檔案上傳 API 加上認證中間件~~ ✅ FIX-103

### 技術債務清理
4. 統一 Toast 系統（移除舊版）
5. 統一表單處理模式
6. 拆分超大檔案 (data-import 1,606 行, omExpense router 2,762 行)
7. 完成 Settings Save 和 Forgot Password 功能

### 路由保護修復 (R2 新發現)
8. **Middleware 路由名稱修正**: `/budget-proposals` → `/proposals`（提案頁面未受保護！）

### 文檔更新
9. 更新 CLAUDE.md 中的 Model 數量、移除 Zustand/Jotai 提及
10. 統一 Azure AD 環境變數命名
11. 修正 ER 圖表遺漏的 model 和關聯

### 代碼 Bug 修復 (R2 驗證副產物)
12. `expense.getStats` 引用不存在的 `'PendingApproval'` 狀態
13. `expense.reject` 發送未註冊的通知類型 `'EXPENSE_REJECTED'`
14. `project.chargeOut` 使用 `throw new Error` 而非 `TRPCError`

---

## 分析統計

| 指標 | 數值 |
|------|------|
| 分析文件總數 | 77 (48 分析 + 29 驗證報告) |
| Mermaid 圖表 | 30 |
| 驗證點 (R1+R2) | 790 |
| R1 準確率 | 94.3% (316 點, Level 1-2) |
| R2 準確率 | 94.3% (474 點, Level 3-5) |
| R8 修復數 | FIX-101 ~ FIX-137 (37 項修復) |
| R9-E 文檔準確率 | router-index.md 61.4% → 更新後 ~99%, SUMMARY.md 69.2% → 更新後 ~99% |
| 使用 Agent 數 | 20 (分析 12 + 驗證 8) |
| 發現安全問題 | 17 + 1 新發現 — 其中 3 Critical 已修復 (FIX-101/102/103) |
| 發現技術債務 | 16 |
| 發現死代碼 | 13 |
| 發現代碼 Bug | 4 (驗證副產物) |
