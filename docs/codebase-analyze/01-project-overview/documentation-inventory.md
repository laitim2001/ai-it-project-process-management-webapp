# docs/ 目錄完整文檔盤點

> **分析日期**: 2026-04-09
> **分析範圍**: `docs/` 目錄全部子目錄及檔案
> **目的**: 填補 codebase-analyze 中從未分析的文檔目錄覆蓋缺口

---

## 總覽統計

| 子目錄 | 檔案數 | Markdown 行數 | 其他檔案 | 主要內容 |
|--------|--------|---------------|----------|----------|
| `fullstack-architecture/` | 14 | 676 | 0 | 原始技術架構設計文件 (v1.0) |
| `prd/` | 5 | 116 | 0 | 產品需求文件 |
| `stories/` | 34 | 1,357 | 0 | 10 Epic 共 33 個 User Story |
| `deployment/` | 9 | 5,048 | 0 | Azure 部署操作手冊 |
| `infrastructure/` | 4 | 1,689 | 0 | Azure 基礎設施 + 本地開發 |
| `design-system/` | 5 | 3,694 | 0 | 設計系統遷移與指南 |
| `development/` | 4 | 946 | 0 | 開發服務管理與命令 |
| `development-log/` | 1 | 1,172 | 0 | codebase 分析作業日誌 |
| `implementation/` | 3 | 852 | 0 | 實施總結與原型指南 |
| `research/` | 5 | 373 | 0 | 用戶研究與腦力激盪 |
| `For Data Import/` | 8 | 0 | 8 xlsx | OM Expense/Project 匯入範本 |
| `codebase-analyze/` | 82 | 27,187 | 0 | codebase 分析報告 (本輪) |
| `image/` | 1 | 0 | 1 png | PRD 圖片資源 |
| 根層級檔案 | 8 | 1,052 (md) | 5 (json/xlsx) | brief, front-end-spec, README, 資料檔 |
| **合計** | **183** | **~43,162** | **14** | |

---

## 1. fullstack-architecture/ (關鍵 — 首次完整分析)

**定位**: CLAUDE.md 明確指示「Always consult docs/fullstack-architecture/ for architectural decisions」，但此目錄在 codebase-analyze 中從未被分析。

**版本**: v1.0, 日期 2025-10-02, 作者 Winston (架構師)

### 檔案清單 (14 份, 676 行)

| 檔案 | 行數概估 | 涵蓋內容 |
|------|----------|----------|
| `index.md` | 26 | 13 章節索引 |
| `1-introduction.md` | 12 | 架構目標與變更日誌 |
| `2-high-level-architecture.md` | 39 | Mermaid 架構圖, 核心技術決策 (App Service, PostgreSQL, Azure AD B2C, Turborepo) |
| `3-tech-stack.md` | 54 | 全端 vs 分離架構比較, tRPC vs REST 比較, 15 項技術選型清單 |
| `4-unified-project-structure.md` | 46 | Turborepo Monorepo 目錄結構說明 |
| `5-data-model-and-prisma-schema.md` | ~176 | 完整 MVP Prisma schema (User, Role, BudgetPool, Project, BudgetProposal, Vendor, Quote, PurchaseOrder, Expense, Comment, History) |
| `6-api-design-trpc.md` | ~107 | tRPC Router 結構, Zod 驗證, protectedProcedure 中間件 |
| `7-core-components.md` | 26 | 後端 (api/db/auth) + 前端 (components/features/hooks/lib/app) 元件職責 |
| `8-core-workflows.md` | ~52 | 2 個 Mermaid 序列圖: 登入流程, 創建專案流程 |
| `9-development-workflow.md` | ~75 | 本地開發設置, 環境變數配置 |
| `10-deployment-architecture.md` | ~24 | Docker 部署, CI/CD 管道, 三環境表 |
| `11-security-performance-and-observability.md` | ~23 | 安全策略, 錯誤處理, APM, 告警 |
| `12-cost-optimization-and-management.md` | 7 | 自動縮放, 層級選擇, 成本預算 |
| `13-conclusion-and-next-steps.md` | ~22 | 總結, 交接給 PO 的審核指示 |

### 與 codebase-analyze 的差異/衝突

| 項目 | fullstack-architecture (v1.0 設計) | codebase-analyze (實際代碼) | 備註 |
|------|------|------|------|
| **Prisma Models** | 11 個 (User, Role, BudgetPool, Project, BudgetProposal, Vendor, Quote, PurchaseOrder, Expense, Comment, History) | 32 個 | 設計文件只描述 MVP 核心 model, 後續新增 21 個 model 未回寫 |
| **NextAuth Models** | 未提及 Account/Session/VerificationToken | 存在且使用中 | 設計文件未涵蓋 NextAuth.js 的資料模型 |
| **Router 主檔名** | `_app.ts` | `root.ts` | 實際實現使用 root.ts |
| **User.password** | 未包含 password 欄位 | `password String?` 存在 | 設計僅考慮 Azure AD B2C, 後來加入本地密碼登入 |
| **BudgetPool.usedAmount** | 未定義 | `usedAmount Float @default(0)` | Epic 6.5 即時追蹤功能後加 |
| **OM Expense** | 不存在 | 3 個 model (OMExpense, OMExpenseItem, OMExpenseMonthly) | FEAT-007 新增 |
| **Notification** | 不存在 | 完整 model | Epic 8 新增 |
| **ChargeOut** | 不存在 | 2 個 model (ChargeOut, ChargeOutItem) | FEAT-005 新增 |
| **DATABASE_URL port** | 5432 (標準) | 5434 (本地 Docker) | 設計文件用標準 port, 實際開發為避免衝突改用 5434 |
| **Azure Front Door** | 架構圖中包含 | 未在代碼中發現 | 設計時規劃但未實際部署 |
| **pino 結構化日誌** | 規劃使用 | 未在代碼中發現 | 設計時規劃但未實施 |
| **Azure VNet/NSG** | 規劃在安全策略中 | 部分實施 (NSG 存在) | 不完整 |

**結論**: fullstack-architecture 是 v1.0 初始設計文件, 自 2025-10-02 後從未更新。代碼已遠超原始設計 (32 個 model vs 11 個), 多個架構決策在實施過程中被修改。此文件作為"歷史設計意圖參考"有價值, 但**不再反映當前系統狀態**。codebase-analyze 的分析更準確地反映了實際代碼。

---

## 2. prd/ (產品需求文件)

**版本**: v1.0, 日期 2025-10-01

### 檔案清單 (5 份, 116 行)

| 檔案 | 內容 |
|------|------|
| `index.md` | PRD 4 章節索引 |
| `1-goals-and-background-context.md` | 4 個目標 (效率+30%, 數據集中化, 決策品質, 使用者體驗) |
| `2-functional-and-non-functional-requirements.md` | FR1-FR7 功能需求 + NFR1-NFR5 非功能需求 |
| `3-epic-list.md` | 10 Epic 列表 (Phase 1: 1-8, Phase 2: 9-10) |
| `4-epic-and-user-story-details.md` | 10 Epic 含 33 個 Story 的高階清單 |

### PRD 功能需求實施狀態

| 需求 | 描述 | 實施狀態 |
|------|------|----------|
| FR1 | 6 個核心流程 CRUD | ✅ 完成 (Budget Pool, Project, Proposal, Procurement, Expense, Charge Out) |
| FR2 | 雙角色權限 (PM + Supervisor) | ✅ 完成 (加上 Admin 角色) |
| FR3.1 | 主管儀表板 | ✅ 完成 |
| FR3.2 | 經理儀表板 | ✅ 完成 |
| FR4 | 審批工作流 (批准/拒絕/需要更多資訊) | ✅ 完成 |
| FR5 | 評論/留言功能 | ✅ 完成 |
| FR6 | 電子郵件通知 | ✅ 完成 (SendGrid + Mailhog) |
| FR7 | 數據導出 CSV/Excel | ✅ 完成 (CSV 支援) |
| NFR1 | 效能 <3s 載入 | ✅ 實現 (<2s 首屏) |
| NFR2 | 易用性 | ✅ 實現 (shadcn/ui 設計系統) |
| NFR3 | 可靠性 99.5% | ⚠️ 未經正式 SLA 測試 |
| NFR4 | 主流瀏覽器相容性 | ✅ 支援 (Next.js 預設) |
| NFR5 | 可擴展性 (AI + 外部整合) | ✅ 架構已預留 (Epic 9-10 計劃中) |

**結論**: PRD 中定義的所有 MVP 功能需求 (FR1-FR7) 均已完成實施。非功能需求中 NFR3 (可靠性 SLA) 尚未經過正式驗證。

---

## 3. stories/ (用戶故事)

### 結構

34 個 Markdown 檔案 (含 README.md), 分布在 10 個 Epic 目錄:

| Epic | 目錄名 | Story 數 | 實施狀態 |
|------|--------|----------|----------|
| Epic 1 | `epic-1-platform-foundation-and-user-authentication/` | 4 | ✅ 完成 |
| Epic 2 | `epic-2-ci-cd-and-deployment-automation/` | 2 | ✅ 完成 |
| Epic 3 | `epic-3-budget-and-project-setup/` | 2 | ✅ 完成 |
| Epic 4 | `epic-4-proposal-and-approval-workflow/` | 4 | ✅ 完成 |
| Epic 5 | `epic-5-procurement-and-vendor-management/` | 4 | ✅ 完成 |
| Epic 6 | `epic-6-expense-recording-and-financial-integration/` | 4 | ✅ 完成 |
| Epic 7 | `epic-7-dashboard-and-basic-reporting/` | 4 | ✅ 完成 |
| Epic 8 | `epic-8-notification-system/` | 2 | ✅ 完成 |
| Epic 9 | `epic-9-ai-assistant/` | 4 | 📋 計劃中 |
| Epic 10 | `epic-10-external-system-integration/` | 3 | 📋 計劃中 |

**Story 格式**: 每個 Story 包含:
- User Story (身為...我想要...以便)
- 背景說明
- 技術規格 (前端/後端/資料庫/權限)
- 驗收標準 (5-7 項)
- 技術債務考量

**注意**: README.md 中列出的 Story 數量與實際檔案數略有不一致 (README 說 33 個, 實際 33 個 story 檔 + 1 個 README = 34 檔)。

---

## 4. deployment/ (部署文檔)

**最活躍的文檔目錄之一**, 最後更新 2025-11-26。

### 檔案清單 (9 份, 5,048 行)

| 檔案 | 行數概估 | 內容 |
|------|----------|------|
| `AZURE-DEPLOYMENT-GUIDE.md` | ~1,200 | **核心**: v2.2 完整 Azure 部署操作手冊 (工具安裝, 部署流程, 常見問題, 環境變數, 監控, 回滾, 安全) |
| `azure-deployment-plan.md` | ~400 | 部署規劃總覽 (架構圖, 目標, CI/CD 管道) |
| `00-prerequisites.md` | ~300 | 前置條件 (工具版本, Azure 訂閱, 權限) |
| `01-first-time-setup.md` | ~500 | 首次 Azure 環境設置步驟 |
| `02-ci-cd-setup.md` | ~400 | GitHub Actions CI/CD 管道配置 |
| `03-troubleshooting.md` | ~500 | 常見部署問題排查指南 |
| `04-rollback.md` | ~200 | 回滾策略與步驟 |
| `environment-variables-map.md` | ~800 | **重要**: 環境變數 → Key Vault 完整映射表 (Dev/Staging/Production) |
| `key-vault-secrets-list.md` | ~700 | Azure Key Vault 密鑰完整清單與命名規範 |

### 與 codebase-analyze 的比較

codebase-analyze 的 `01-project-overview/azure-infrastructure.md` 分析了 `azure/` 目錄下的實際 IaC 代碼 (Bicep templates, deploy scripts)。deployment/ 目錄則提供**操作層面的手冊** (how-to 指南)。兩者互補:

- **codebase-analyze**: 分析代碼層面 (Bicep 模板語法, 部署腳本邏輯)
- **deployment/**: 提供操作指引 (步驟化流程, 環境變數清單, 問題排查)

無重大衝突, 但 deployment/ 文檔更新頻率更高 (v2.2 vs codebase-analyze 一次性分析)。

---

## 5. infrastructure/ (基礎設施)

### 檔案清單 (4 份, 1,689 行)

| 檔案 | 內容 |
|------|------|
| `README.md` | 索引 + 環境對比表 + 端口配置 |
| `azure-infrastructure-setup.md` | **v1.0 原始設計**: 12 章節的 Azure 資源設置指南 (資源群組, AD B2C, PostgreSQL, Blob Storage, Key Vault, App Service, ACR, SendGrid, Application Insights, 成本估算) |
| `local-dev-setup.md` | 本地開發環境設置 (Node.js, pnpm, Docker, 首次設置步驟, 環境變數) |
| `project-setup-checklist.md` | 設置驗證清單 |

### 與 codebase-analyze 的比較

- `azure-infrastructure-setup.md` 是 v1.0 初始設計 (2025-10-02), 描述了**規劃中的**資源設置
- codebase-analyze 的 `azure-infrastructure.md` 分析的是**實際部署的** IaC 代碼
- 差異: 初始設計中包含 Azure Cache for Redis, 但 codebase-analyze 未在 Bicep 中發現 Redis 資源定義 (本地用 Docker Redis, Azure 環境狀態不明)

---

## 6. design-system/ (設計系統)

### 檔案清單 (5 份, 3,694 行)

| 檔案 | 行數概估 | 內容 |
|------|----------|------|
| `README.md` | 83 | 索引, 遷移狀態摘要 (v4.0 完成) |
| `DESIGN-SYSTEM-GUIDE.md` | ~300 | 快速參考: 核心原則, 組件用法, 顏色系統, 間距系統 |
| `design-system-migration-plan.md` | ~800 | 完整遷移計劃 (策略, 階段劃分, 風險, 時間表) |
| `README-DESIGN-SYSTEM.md` | ~200 | 設計系統 README (快速開始, 組件列表) |
| `ui-ux-redesign.md` | ~2,300 | **大型文檔 (64KB)**: 完整 UI/UX 重新設計 (設計理念, 視覺, 交互, 體驗優化) |

**狀態**: 設計系統遷移已完成 (v4.0, 2025-10-16)。26 個 shadcn/ui 組件已遷移, Light/Dark/System 主題已實現。

---

## 7. development/ (開發指南)

### 檔案清單 (4 份, 946 行)

| 檔案 | 內容 |
|------|------|
| `README.md` | 索引 + 快速開始 + 日常工作流程 + 服務管理 + 常見問題 |
| `DEVELOPMENT-SERVICE-MANAGEMENT.md` | 開發服務管理 (端口衝突排查, 正確開發流程, 單一服務原則) |
| `INSTALL-COMMANDS.md` | 安裝命令快速參考 |
| `SETUP-COMPLETE.md` | 環境設置完成檢查清單 |

**與根目錄 DEVELOPMENT-SETUP.md 的關係**: 根目錄的 `DEVELOPMENT-SETUP.md` (711 行) 是最完整的跨平台設置指南。`docs/development/` 是較簡短的補充參考。

---

## 8. development-log/ (開發日誌)

### 檔案清單 (1 份, 1,172 行)

| 檔案 | 內容 |
|------|------|
| `development-log-20260409.md` | 2026-04-09 codebase 分析作業的完整執行日誌: 6 個 Phase 的分析進度, 驗證 Round 1 的 Agent 配置和結果 (316 驗證點, 94.3% 準確率) |

**注意**: 此目錄為 untracked 新增目錄 (見 git status)。

---

## 9. implementation/ (實施記錄)

### 檔案清單 (3 份, 852 行)

| 檔案 | 內容 |
|------|------|
| `README.md` | 索引 + 兩階段實施回顧 + 關鍵成果指標 |
| `IMPLEMENTATION-SUMMARY.md` | 實施總結: 設計系統基礎架構完成記錄 (2025-10-03), 已完成 3 個 UI 組件, 3 個佈局組件, Dashboard 原型 |
| `prototype-guide.md` | 原型開發指南 |

**注意**: `IMPLEMENTATION-SUMMARY.md` 記錄的是早期的設計系統基礎架構建立 (Phase 1 的起點, 3 個 UI 組件), 不是最終的完整實施結果。README.md 中的統計數據 (~30,000+ 行, 10 routers, 46 組件) 也已過時, 實際已增長到 ~35,000+ 行, 17 routers, 75+ 組件。

---

## 10. research/ (研究與發現)

### 檔案清單 (5 份, 373 行)

| 檔案 | 內容 |
|------|------|
| `README.md` | 索引 + 研究流程 + 主要發現摘要 |
| `brainstorming-session-results.md` | 腦力激盪會議結果 (2025-10-01): What-If 情境法, 心智圖法, 第一性原理, 核心價值提煉 |
| `user-research-prompt.md` | 用戶研究問題設計和提示 |
| `user-research-result.md` | 用戶研究原始結果數據 |
| `user-research-insights.md` | 用戶研究洞察: 雙角色畫像 (PM 協調者 + 主管決策者), 4 項核心洞察與建議 |

**價值**: 此目錄記錄了專案最初期的需求發現過程, 解釋了為什麼要建造這個平台。對理解業務背景非常有幫助。

---

## 11. For Data Import/ (數據匯入範本)

### 檔案清單 (8 份, 全部為 xlsx)

| 檔案 | 用途 |
|------|------|
| `OM Expense and Detail import data - v1.xlsx` | OM Expense 匯入範本 v1 |
| `OM Expense and Detail import data - v2.xlsx` | OM Expense 匯入範本 v2 |
| `OM Expense and Detail import data - v3.xlsx` | OM Expense 匯入範本 v3 |
| `OM Expense and Detail import data - v4.xlsx` | OM Expense 匯入範本 v4 |
| `OM Expense and Detail import data - v5.xlsx` | OM Expense 匯入範本 v5 (最新) |
| `project-data-import-template-v1.xlsx` | Project 匯入範本 v1 |
| `project-data-import-template-v2.xlsx` | Project 匯入範本 v2 |
| `project-data-import-template-v3.xlsx` | Project 匯入範本 v3 (最新) |

**用途**: 對應 FEAT-008 (OM Expense Data Import) 和 FEAT-010 (Project Data Import) 的 Excel 範本檔案。5 個 OM Expense 版本反映了 v1.0 到 v1.3 的迭代。

---

## 12. 根層級檔案

### Markdown 檔案

| 檔案 | 行數 | 內容 |
|------|------|------|
| `docs/brief.md` | 130 | **專案簡報** (v1.0, 2025-10-01): 摘要, 問題陳述, 解決方案, 目標使用者, 成功指標, MVP 範圍, 風險假設。作者 Mary (業務分析師)。 |
| `docs/front-end-spec.md` | 570 | **UI/UX 規格文件** (v2.0, 2025-10-03): UX 目標, 設計原則, 資訊架構, 網站地圖, 導航優先級。作者 Sally (UX 專家)。 |
| `docs/README.md` | 352 | **文檔總覽索引**: 8 個文檔類別概覽, 角色導向的閱讀指南, 統計數據。 |

### 數據檔案

| 檔案 | 大小 | 內容 |
|------|------|------|
| `docs/OM expense - RHK.xlsx` | 202 KB | 原始 OM Expense 資料 (RHK) |
| `docs/import-data-analysis.json` | 27 KB | 匯入數據分析結果 |
| `docs/om-expense-rhk-extracted.json` | 26 KB | 從 RHK xlsx 提取的 JSON 數據 |
| `docs/om-expense-screenshot-extracted.json` | 5 KB | 從截圖提取的 OM Expense 數據 |
| `docs/test-import-data.json` | 238 KB | 測試匯入數據 |

### 圖片資源

| 檔案 | 內容 |
|------|------|
| `docs/image/prd/1759337168374.png` | PRD 相關圖片 |

---

## 13. codebase-analyze/ (本輪分析)

**82 份檔案, 27,187 行**, 為本次 codebase 分析的產出。包含:

- `00-analysis-plan.md` — 分析計劃
- `SUMMARY.md` — 分析總結
- `cobebase-analyze-playbook.md` — 分析方法論
- `01-project-overview/` (4 份) — 技術棧, 架構模式, 構建部署, Azure 基礎架構
- `02-api-layer/` (20 份) — 17 個 Router 詳細分析
- `03-frontend-pages/` (4 份) — 23 路由模組分析
- `04-components/` (3 份) — 業務組件 + UI 組件分析
- `05-database/` (3 份) — Schema, Model, 遷移歷史
- `06-auth-and-config/` (3 份) — 認證, 配置, 中間件
- `07-scripts-and-tools/` (1 份) — 40 個腳本索引
- `08-i18n/` (1 份) — 翻譯系統分析
- `09-diagrams/` (4 份) — 30 個 Mermaid 圖表
- `10-issues-and-debt/` (3 份) — 安全審查, 技術債務, 死碼
- `11-verification/` (29 份) — Round 1-7 驗證報告

---

## 文檔時效性評估

### 當前 (Current) — 反映最新狀態

| 文檔 | 理由 |
|------|------|
| `codebase-analyze/` | 2026-04-09 全新分析, 直接讀取代碼 |
| `deployment/AZURE-DEPLOYMENT-GUIDE.md` | v2.2, 2025-11-26 更新, 含最新部署流程 |
| `deployment/environment-variables-map.md` | 含完整 Key Vault 映射 |
| `deployment/key-vault-secrets-list.md` | 含完整密鑰清單 |
| `For Data Import/*.xlsx` | 最新匯入範本 |

### 部分過時 (Partially Outdated)

| 文檔 | 過時部分 |
|------|----------|
| `docs/README.md` | 統計數據引用 Post-MVP 時期 (30,000+ 行, 10 routers), 實際已增長 |
| `implementation/README.md` | 同上, 引用舊統計 |
| `CLAUDE.md` | codebase-analyze 發現 Prisma Model 數 (27 vs 32), Zustand/Jotai 未實際安裝 |
| `design-system/DESIGN-SYSTEM-GUIDE.md` | 引用 `button-new.tsx` 但實際可能已重命名 |

### 歷史文件 (Historical) — 有參考價值但不反映當前狀態

| 文檔 | 說明 |
|------|------|
| `fullstack-architecture/` 全部 | v1.0 初始設計 (2025-10-02), 11 個 model vs 實際 32 個 |
| `prd/` | v1.0 需求定義 (2025-10-01), MVP 需求均已實施 |
| `stories/` | 原始 User Story, Epic 1-8 已完成 |
| `brief.md` | 原始專案簡報 (2025-10-01) |
| `front-end-spec.md` | 原始 UI/UX 規格 (2025-10-03) |
| `research/` | 早期用戶研究 (2025-10-01) |
| `implementation/IMPLEMENTATION-SUMMARY.md` | 早期設計系統基礎架構記錄 (2025-10-03) |

---

## 關鍵發現

### 1. fullstack-architecture 嚴重過時

CLAUDE.md 將 `docs/fullstack-architecture/` 定位為「最高技術指南」, 但該文件自 2025-10-02 以來從未更新。實際代碼已遠超原始設計:
- 11 個 model → 32 個 model
- 未涵蓋 OM Expense, ChargeOut, Notification, BudgetCategory, Currency 等
- Router 入口檔名不同 (`_app.ts` vs `root.ts`)
- 缺少本地密碼登入的設計

**建議**: 要麼更新 fullstack-architecture 為 v2.0 以反映現狀, 要麼在 CLAUDE.md 中修改指引, 將 codebase-analyze 作為當前系統的權威參考。

### 2. 文檔統計數據普遍過時

`docs/README.md` 和 `implementation/README.md` 中的統計數據 (30,000+ 行, 10 routers, 46 組件) 停留在 Post-MVP 時期。根據 codebase-analyze, 實際數據為:
- 17 個 API Routers (非 10 個)
- 32 個 Prisma Models (非 10+)
- 75+ 組件 (非 46 個)
- 23 個路由模組, 60 個頁面檔 (非 18 個頁面)

### 3. 部署文檔是最活躍的

`deployment/` 是 docs/ 中最大的 Markdown 目錄 (5,048 行) 且更新最頻繁 (v2.2, 2025-11-26)。這反映了實際運維需求驅動了文檔更新。

### 4. For Data Import 目錄缺少文字說明

8 個 xlsx 範本檔案沒有對應的 Markdown 說明文檔。使用者需要直接打開 Excel 才能理解格式要求。

### 5. 原始規劃文檔完整且有價值

brief.md, research/, prd/, stories/ 構成了完整的需求探索→需求定義→故事拆分的鏈條。對新成員理解「為什麼要建造這個系統」非常有幫助。

---

## 分析方法

- 對每個子目錄列出所有檔案
- 讀取每個關鍵檔案的前 60-120 行
- 計算檔案數和 Markdown 行數
- 與 codebase-analyze 已有分析進行交叉比對
- 評估文檔時效性 (當前/部分過時/歷史)
