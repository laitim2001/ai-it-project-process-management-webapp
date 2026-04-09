# FIX-100: Codebase Analysis Bug-Fix 總規劃

> **建立日期**: 2026-04-09
> **來源**: R1-R6 Codebase 分析驗證 (2,793 驗證點)
> **問題總數**: 42 個 (9 Critical + 11 High + 22 Medium)
> **修復策略**: 分 5 個批次按嚴重度優先修復

---

## 修復批次規劃

### Batch 1: 🔴 Critical 安全修復 (FIX-101 ~ FIX-107)
**優先級**: 立即修復 — 生產環境安全漏洞
**預計影響**: packages/api, apps/web/src/app/api, azure/, middleware

| FIX # | 問題 | 影響範圍 | 修復方式 |
|-------|------|----------|----------|
| FIX-101 | User Router 全用 publicProcedure | user.ts | 改為 protectedProcedure + adminProcedure |
| FIX-102 | Health Router 公開 Schema 修改 | health.ts | Schema 修改端點改為 adminProcedure |
| FIX-103 | 檔案上傳 API 無認證 | upload/quote,invoice,proposal | 加入 auth() session 檢查 |
| FIX-104 | budgetProposal.approve 權限不足 | budgetProposal.ts | 改為 supervisorProcedure |
| FIX-105 | 客戶端可提供 userId 冒充他人 | budgetProposal.ts | 改用 ctx.session.user.id |
| FIX-106 | 密碼 hash 透過 include 洩漏 | 5+ routers | 所有 User include 改用 select 排除 password |
| FIX-107 | Azure DB 密碼明文在 Git 中 | azure/output/ | 修正 .gitignore 規則，移除敏感檔案 |

### Batch 2: 🟠 High 安全與功能修復 (FIX-108 ~ FIX-115)
**優先級**: 本週修復
**預計影響**: middleware, next.config, package.json, schema.prisma

| FIX # | 問題 | 影響範圍 | 修復方式 |
|-------|------|----------|----------|
| FIX-108 | middleware 路由名稱錯誤 | middleware.ts, auth.config.ts | /budget-proposals → /proposals, 加 /project-data-import |
| FIX-109 | 零安全 headers | next.config.mjs | 加入 CSP, X-Frame-Options, HSTS headers |
| FIX-110 | tailwindcss-animate 未安裝 | package.json, tailwind.config | pnpm add tailwindcss-animate + 註冊 plugin |
| FIX-111 | Email 在 DB transaction 內 | budgetProposal.ts, expense.ts | 將 email 發送移到 transaction 外部 |
| FIX-112 | budgetProposal.getAll 無分頁 | budgetProposal.ts | 加入 skip/take 分頁 |
| FIX-113 | 文檔 "Azure AD B2C" vs 代碼 "Azure AD" | CLAUDE.md, turbo.json | 統一命名為實際使用的 Azure AD |
| FIX-114 | 所有金額用 Float | schema.prisma | 評估是否遷移至 Decimal (需 migration) |
| FIX-115 | 213 處硬編碼顏色 | 16+ 業務組件 | 將 gray-* 替換為 theme tokens |

### Batch 3: 🟡 i18n 修復 (FIX-116 ~ FIX-120)
**優先級**: 下次部署前
**預計影響**: messages/en.json, messages/zh-TW.json, 多個組件

| FIX # | 問題 | 影響範圍 | 修復方式 |
|-------|------|----------|----------|
| FIX-116 | 87 個缺失翻譯 key | en.json, zh-TW.json | 補齊所有缺失 key |
| FIX-117 | toLowerCase() 狀態渲染 bug | expense, purchase-order 頁面 | 改用精確的狀態 key 映射 |
| FIX-118 | 10 檔案用 zh-HK 而非 zh-TW | 多個組件 | 統一為 zh-TW |
| FIX-119 | 2 個孤兒 namespace | en.json, zh-TW.json | 移除或連接到組件 |
| FIX-120 | auth.forgotPassword key 結構不匹配 | forgot-password 頁面, JSON | 統一 JSON 結構與代碼 |

### Batch 4: 🟡 代碼品質修復 (FIX-121 ~ FIX-128)
**優先級**: 計劃性改善
**預計影響**: 多個 routers, 多個組件

| FIX # | 問題 | 影響範圍 | 修復方式 |
|-------|------|----------|----------|
| FIX-121 | 錯誤處理不一致 (throw new Error) | user.ts, notification.ts, project.ts | 統一改用 TRPCError |
| FIX-122 | expense.getStats 引用不存在的狀態 | expense.ts | PendingApproval → Submitted |
| FIX-123 | expense.reject 發送未註冊通知類型 | expense.ts, notification.ts | 在 enum 中加入 EXPENSE_REJECTED |
| FIX-124 | N+1 查詢風險 (batchImport) | omExpense.ts | 改用 createMany 批次操作 |
| FIX-125 | 重複 deleteMany 實作 | 4 routers | 提取共用 utility |
| FIX-126 | 5 層深 include chain | chargeOut.ts | 優化為 select 或拆分查詢 |
| FIX-127 | User delete 不檢查 FK 依賴 | user.ts | 加入依賴檢查 |
| FIX-128 | .env.example SMTP/DB 不一致 | .env.example | 統一變數名稱和端口 |

### Batch 5: 🟡 UX 一致性修復 (FIX-129 ~ FIX-134)
**優先級**: 漸進式改善
**預計影響**: 多個頁面和組件

| FIX # | 問題 | 影響範圍 | 修復方式 |
|-------|------|----------|----------|
| FIX-129 | 刪除確認不一致 (confirm vs AlertDialog) | budget-pools, vendors, om-expenses | 統一用 AlertDialog |
| FIX-130 | 表單驗證兩套系統 | 多個表單組件 | 記錄現狀，漸進統一 |
| FIX-131 | 必填欄位指示器不一致 | 多個表單 | 統一用 text-destructive |
| FIX-132 | 8 個列表頁缺分頁 | 多個列表頁 | 加入 PaginationControls |
| FIX-133 | 4 模組 Loading 用純文字 | charge-outs, om-expenses 等 | 改用 Skeleton 組件 |
| FIX-134 | 前端角色檢查缺失 | users, dashboard/supervisor, currencies | 加入 useSession role check |

### 文檔修正 (DOC-FIX, 與 Batch 1-5 平行)

| 項目 | 影響範圍 | 修復方式 |
|------|----------|----------|
| CLAUDE.md Model 數量 27→32 | CLAUDE.md | 更新數字 |
| CLAUDE.md 移除 Zustand/Jotai | CLAUDE.md | 移除不實描述 |
| CLAUDE.md CHANGE 數量 36→41+ | CLAUDE.md | 更新數字 |
| ER 圖表 9 條遺漏關聯 | er-diagram.md | 加入遺漏關聯 |
| ER 圖表 hasItems 幻影欄位 | er-diagram.md, model-detail.md | 移除 |
| schema-overview Expense 狀態值 | schema-overview.md | PendingApproval → Submitted |
| business-process 圖權限錯誤 | business-process.md | PM → Supervisor |
| 頁面計數 62→60 | page-index.md, SUMMARY.md | 更正 |
| Mermaid 圖表數 29→30 | SUMMARY.md | 更正 |
| config-and-env 引用不存在目錄 | config-and-env.md | 移除 packages/eslint-config |
| .gitignore 規則修正 | .gitignore | .azure/output/ → azure/output/ |
| 舊 Toast.tsx 死代碼 | Toast.tsx | 移除（確認零消費者） |

---

## 執行順序

```
Week 1: Batch 1 (Critical 安全) + DOC-FIX (文檔修正)
Week 2: Batch 2 (High) + Batch 3 (i18n)
Week 3: Batch 4 (代碼品質) + Batch 5 (UX)
```

## 風險評估

| Batch | 風險 | 緩解措施 |
|-------|------|----------|
| Batch 1 | 權限變更可能影響現有用戶流程 | 先在 staging 測試 |
| Batch 2 | security headers 可能阻擋合法請求 | 先用 Report-Only mode |
| Batch 3 | i18n key 變更需確保雙語同步 | 每次修改跑 validate:i18n |
| Batch 4 | Router 重構可能影響前端呼叫 | 確保 tRPC type 不變 |
| Batch 5 | UI 統一可能影響用戶習慣 | A/B testing |
