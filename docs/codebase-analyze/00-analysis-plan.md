# Codebase Analysis Plan — IT Project Process Management Webapp

> **分析日期**: 2026-04-09
> **Codebase 規模**: 258 核心源碼檔 (81 .ts + 155 .tsx + 22 .js) + 1 Prisma Schema
> **方法論**: 基於 codebase-analyze-playbook.md 的 6 階段分析法

---

## 目錄結構

```
docs/codebase-analyze/
├── 00-analysis-plan.md              ← 本文件
├── cobebase-analyze-playbook.md     ← 分析方法論參考
│
├── 01-project-overview/             # Phase 1: 項目骨架與技術棧
│   ├── tech-stack.md                # 技術棧清查
│   ├── architecture-patterns.md     # 架構模式分析
│   └── build-and-deploy.md          # 構建與部署
│
├── 02-api-layer/                    # Phase 2a: API 層
│   ├── router-index.md              # Router 總覽 (18 routers)
│   └── detail/                      # 每個 Router 的詳細分析
│       ├── budgetPool.md
│       ├── budgetProposal.md
│       ├── ... (18 files)
│       └── vendor.md
│
├── 03-frontend-pages/               # Phase 2b: 前端頁面
│   ├── page-index.md                # 頁面路由總覽 (23 routes)
│   └── detail/                      # 每個路由模組的詳細分析
│       ├── dashboard.md
│       ├── projects.md
│       ├── ... (23 files)
│       └── vendors.md
│
├── 04-components/                   # Phase 2c: 組件層
│   ├── component-index.md           # 組件總覽 (23 dirs + ui)
│   └── detail/                      # 每個組件組的詳細分析
│       ├── ui-components.md
│       ├── layout-components.md
│       ├── ... (10+ files)
│       └── business-components.md
│
├── 05-database/                     # Phase 3: 資料庫層
│   ├── schema-overview.md           # Schema 總覽 (27+ models)
│   ├── model-detail.md              # 每個 Model 的欄位與關係
│   └── migration-history.md         # 遷移歷史
│
├── 06-auth-and-config/              # Phase 2d: 認證與配置
│   ├── auth-system.md               # NextAuth + Azure AD B2C
│   ├── config-and-env.md            # 環境變數與配置
│   └── middleware.md                 # Next.js Middleware
│
├── 07-scripts-and-tools/            # Phase 2d: 腳本工具
│   └── script-index.md              # 40 個腳本的分析
│
├── 08-i18n/                         # Phase 2d: 國際化
│   └── translation-analysis.md      # 翻譯 key 結構分析
│
├── 09-diagrams/                     # Phase 4: 系統圖表
│   ├── system-architecture.md       # 系統架構圖
│   ├── data-flow.md                 # 資料流圖
│   ├── er-diagram.md                # ER 關聯圖
│   └── business-process.md          # 業務流程圖
│
├── 10-issues-and-debt/              # Phase 5: 問題匯總
│   ├── security-review.md           # 安全審查
│   ├── tech-debt.md                 # 技術債務
│   └── dead-code.md                 # 死代碼與孤兒資源
│
└── 11-verification/                 # Phase 6: 驗證
    ├── verification-tracker.md      # 驗證進度追蹤
    ├── round-1.md                   # 第一輪驗證結果
    └── round-N.md                   # 後續驗證輪次
```

---

## 批次執行計劃

### Batch 1 — Phase 1 + Phase 3 (並行)
| Agent | 範圍 | 輸出 |
|-------|------|------|
| Agent A | 技術棧、架構模式、構建部署 | `01-project-overview/` |
| Agent B | Prisma Schema 完整分析 | `05-database/` |

### Batch 2 — Phase 2a: API 層 (分 2 組並行)
| Agent | 範圍 | 輸出 |
|-------|------|------|
| Agent C | Routers 1-9: budget*, chargeOut, currency, dashboard, expense, expenseCategory, health, notification | `02-api-layer/detail/` |
| Agent D | Routers 10-18: omExpense, operatingCompany, permission, project, purchaseOrder, quote, user, vendor | `02-api-layer/detail/` |

### Batch 3 — Phase 2b: 前端頁面 (分 3 組並行)
| Agent | 範圍 | 輸出 |
|-------|------|------|
| Agent E | Pages 1-8: dashboard, projects, proposals, budget-pools, expenses, charge-outs, purchase-orders, quotes | `03-frontend-pages/detail/` |
| Agent F | Pages 9-16: om-expenses, om-expense-categories, om-summary, data-import, project-data-import, vendors, operating-companies, users | `03-frontend-pages/detail/` |
| Agent G | Pages 17-23: notifications, settings, login, register, forgot-password + layout + root page | `03-frontend-pages/detail/` |

### Batch 4 — Phase 2c + 2d (並行)
| Agent | 範圍 | 輸出 |
|-------|------|------|
| Agent H | 所有業務組件 (23 dirs) | `04-components/` |
| Agent I | UI 組件 (ui/) 分析 | `04-components/detail/ui-components.md` |
| Agent J | Auth + Config + Middleware | `06-auth-and-config/` |
| Agent K | Scripts + i18n | `07-scripts-and-tools/` + `08-i18n/` |

### Batch 5 — Phase 4: 圖表
| Agent | 範圍 | 輸出 |
|-------|------|------|
| Agent L | 基於前面分析結果生成 Mermaid 圖表 | `09-diagrams/` |

### Batch 6 — Phase 5: 問題匯總
| Agent | 範圍 | 輸出 |
|-------|------|------|
| Agent M | 安全審查、技術債務、死代碼 | `10-issues-and-debt/` |

### Batch 7+ — Phase 6: 驗證 (多輪)
| Round | 驗證點目標 | 深度 |
|-------|-----------|------|
| R1 | ~200 點 | Level 1-2: 檔案存在性、計數 |
| R2 | ~300 點 | Level 3: 方法簽名、參數類型 |
| R3+ | ~500 點 | Level 4-5: 業務邏輯、跨文件一致性 |

---

## 計數基準線 (驗證用)

| 類別 | 數量 | 來源 |
|------|------|------|
| .ts 檔案 | 81 | `find` 計數 |
| .tsx 檔案 | 155 | `find` 計數 |
| .js 檔案 | 22 | `find` 計數 |
| .prisma 檔案 | 1 | `find` 計數 |
| .json 檔案 | 30 | `find` 計數 (非 node_modules) |
| .md 檔案 | 620 | `find` 計數 |
| API Routers | 18 | `ls packages/api/src/routers/` (含 CLAUDE.md) |
| 頁面路由 | 23 | `ls apps/web/src/app/[locale]/` |
| 組件目錄 | 23 | `ls apps/web/src/components/` (含 CLAUDE.md) |
| 腳本檔案 | 40 | `ls scripts/` (含 CLAUDE.md) |
