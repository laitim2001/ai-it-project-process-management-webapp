# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Last Updated**: 2026-06-22
> **Project Status**: Post-MVP Enhancement Phase (FEAT-014/015 + CHANGE-001~052 + FIX-101~156 Complete；含 2026-06 P0/P1 安全修復批次)
> **Code Statistics**: → 見 `docs/codebase-analyze/SUMMARY.md`（由 `scripts/refresh-stats.js` 自動同步）
> **Epic Status**: Epic 1-8 ✅ Complete | Epic 9-10 📋 Planned
> **Azure Deployment**: ✅ 個人環境 + ✅ 公司環境（company/dev=UAT，2026-06-22 已升級至 main HEAD，含 FEAT-014/015 與 P0/P1 安全修復；部署護欄見 `docs/deployment/11`）
> **Language Preference**: 繁體中文 (Traditional Chinese) - AI assistants should communicate in Traditional Chinese by default

---

## ⚠️ Session 起手必讀順序與權威排序

> 每次 session 開始依此順序載入脈絡；資訊衝突時依「權威排序」決定誰為準。本區塊只定義導航與優先級，不放細節。

**必讀順序（由上而下）**：

1. **本檔案（CLAUDE.md）** — 高層導航、紅線原則、開發指令
2. **`.claude/rules/karpathy-guidelines.md`** — AI 編碼行為態度（貫穿所有任務）
3. **`docs/codebase-analyze/SUMMARY.md`** — 最新精確統計與最嚴重發現
4. **對應領域規則** `.claude/rules/{frontend,components,backend-api,database,i18n,...}.md` — 依當前任務路徑（見下方「📋 Code Standards & Rules」表格）
5. **`docs/codebase-analyze/02..11/`** — 需要精確介面 / 架構 / 已知問題清單時的權威細節
6. **`docs/10-ai-assistant/03-dev-workflow.md`**（按需，非每次必讀）— 規劃 / 開發 FEAT / CHANGE / FIX 時的**權威流程**（任務分類、規劃文件正確位置、分支策略、暫緩條款）

> **注意**：本檔（CLAUDE.md）＋ `.claude/rules/*.md` 由 Claude Code 在 session 啟動時**自動載入**，AI 開新 session 時已具備上述脈絡；上表第 3–6 項屬**按需深讀**，無需每次全讀。`docs/10-ai-assistant/01-session-start.md` 為**非自動載入環境**（網頁版 / 其他工具 / 新人 onboarding）才需要的貼上式 prompt，在 Claude Code 中通常不需要。

**權威排序（衝突時誰為準）**：

> `docs/codebase-analyze/`（含 `SUMMARY.md`）＋ 實際程式碼　＞　`.claude/rules/` 領域規則　＞　本 CLAUDE.md 的摘要數字

- **統計數字**（頁面 / 組件 / Router / Procedure / Model / i18n keys）一律以 `SUMMARY.md` 為準；本檔案頂部 meta block 僅為摘要，可能落後。
- **介面 / 架構細節** 以實際程式碼 + `codebase-analyze/` 對應 detail 檔為準。
- **行為態度 vs 技術規範衝突**時：遵守領域規則的技術細節，保留 karpathy 的行為態度（見 `karpathy-guidelines.md`「衝突處理」）。

---

## 📚 Codebase 深度分析參考文件（權威資料來源）

> **重要**：`docs/codebase-analyze/` 目錄包含 **2026-04-09 完成的全面 Codebase 掃描與驗證**（77 份文件，790 個驗證點，準確率 94.3%）。當需要**精確的統計數據、架構細節、已知問題清單**時，**AI 助手應優先參考此目錄**，而非本 CLAUDE.md 的摘要數字。

**關鍵索引檔**：

| 查詢目的 | 參考文件 |
|---------|---------|
| 整體統計、最嚴重發現 | `docs/codebase-analyze/SUMMARY.md` |
| 分析方法與驗證流程 | `docs/codebase-analyze/00-analysis-plan.md` |
| 技術棧完整清單 (53 deps + 34 devDeps) | `docs/codebase-analyze/01-project-overview/tech-stack.md` |
| 架構模式（tRPC 4 層、JWT、Provider 鏈） | `docs/codebase-analyze/01-project-overview/architecture-patterns.md` |
| Docker 構建 + 6 個 GitHub Actions | `docs/codebase-analyze/01-project-overview/build-and-deploy.md` |
| Azure 基礎設施完整規格 | `docs/codebase-analyze/01-project-overview/azure-infrastructure.md` |
| **17 Routers + 200 Procedures 詳解** | `docs/codebase-analyze/02-api-layer/` |
| **23 路由模組、60 頁面詳解** | `docs/codebase-analyze/03-frontend-pages/` |
| **51 業務 + 43 UI 組件詳解** | `docs/codebase-analyze/04-components/` |
| **32 Models + 94 索引 + ER 圖** | `docs/codebase-analyze/05-database/` |
| 認證、Middleware、環境變數 | `docs/codebase-analyze/06-auth-and-config/` |
| 40 個腳本分類索引 | `docs/codebase-analyze/07-scripts-and-tools/` |
| **2,706 翻譯 keys、29 namespaces** | `docs/codebase-analyze/08-i18n/` |
| 30 個 Mermaid 系統/流程圖 | `docs/codebase-analyze/09-diagrams/` |
| **🔴 安全問題、技術債務、死碼清單** | `docs/codebase-analyze/10-issues-and-debt/` |
| 驗證報告（R1–R10） | `docs/codebase-analyze/11-verification/` |

**典型使用情境**：
- 被問到「總共幾個 procedures？」→ 查 `02-api-layer/router-index.md`，答 200 個
- 要修某個 Router → 先看 `02-api-layer/detail/{router}.md` 了解完整介面
- 碰到安全 / 權限問題 → 查 `10-issues-and-debt/security-review.md`
- 新增 i18n key 前 → 查 `08-i18n/translation-analysis.md` 確認命名空間

---

## 🌐 Language and Communication

**Primary Language**: 繁體中文 (Traditional Chinese)

All AI assistants working with this codebase should:
- **Communicate in Traditional Chinese** by default for all interactions
- Use Chinese for explanations, documentation, and technical discussions
- Keep code comments and technical terms in English when appropriate (e.g., variable names, function names)
- Translate technical concepts into clear Chinese explanations
- Use Chinese for commit messages, documentation updates, and development logs

**Code Language Standards**:
- **Code**: English (variable names, function names, class names)
- **Comments**: Traditional Chinese for business logic explanations
- **Documentation**: Traditional Chinese for user-facing docs, English for technical specs when needed
- **Commit Messages**: Traditional Chinese with conventional commit format

**Examples**:
```typescript
// ✅ Good: English code with Chinese comments
function calculateBudgetUtilization(budgetPool: BudgetPool): number {
  // 計算預算池使用率：已使用金額 / 總金額
  return (budgetPool.usedAmount / budgetPool.totalAmount) * 100;
}

// ❌ Avoid: Chinese variable names
function 計算預算使用率(預算池: BudgetPool): number {
  return (預算池.已使用金額 / 預算池.總金額) * 100;
}
```

---

## 🧠 AI 編碼行為準則（Karpathy Guidelines）

> **來源**：[Andrej Karpathy 對 LLM 編碼陷阱的觀察](https://x.com/karpathy/status/2015883857489522876)
> **適用範圍**：**所有** AI 協助的編碼、審查、重構任務（與具體路徑無關）
> **取捨**：這些準則偏向「謹慎」而非「速度」，瑣碎任務可用判斷力調整

以下 4 條核心原則**必須**貫徹於所有代碼相關工作：

### 1️⃣ Think Before Coding（先思考再動手）
**不假設、不隱藏困惑、浮現 tradeoffs。**
- 明確陳述你的假設；不確定就**問**
- 存在多種解讀時，**全部呈現**，不要默默選一個
- 如果有更簡單的做法，說出來；有正當理由時要**推回**（push back）
- 遇到不清楚的地方，**停下來**，指出困惑點，發問

### 2️⃣ Simplicity First（極簡優先）
**用解決問題的最少代碼。不做任何投機性的擴展。**
- 不實作沒被要求的功能
- 不為一次性代碼建立抽象
- 不加沒被要求的「靈活性」或「可配置性」
- 不為不可能發生的情境加錯誤處理
- 寫了 200 行但其實 50 行就夠 → **重寫**

**自問**：「資深工程師會不會說這太複雜了？」若會，就簡化。

### 3️⃣ Surgical Changes（外科手術式修改）
**只動必須動的。只清理自己製造的殘局。**
- 不「順便優化」鄰近代碼、註解、格式
- 不重構沒壞掉的東西
- **配合既有風格**，即使你會用不同寫法
- 發現無關的死碼 → **提出但不刪除**（除非被要求）
- **測試標準**：每一行改動都應能直接追溯到使用者的請求

當你的修改讓某些 imports/variables/functions 變成孤兒 → **只刪除 YOUR 變更造成的孤兒**，不碰預先存在的死碼。

### 4️⃣ Goal-Driven Execution（目標驅動執行）
**定義可驗證的成功標準。循環直到驗證通過。**

把任務轉化為可驗證的目標：
- 「加驗證」→「寫出對無效輸入的測試，然後讓它通過」
- 「修 bug」→「寫出能重現它的測試，然後讓它通過」
- 「重構 X」→「確認重構前後測試都通過」

多步驟任務要先給出簡短計畫：
```
1. [步驟] → 驗證：[檢查]
2. [步驟] → 驗證：[檢查]
3. [步驟] → 驗證：[檢查]
```

**強成功標準**讓你能獨立循環；**弱標準**（「讓它 work」）則需要不斷回來澄清。

---

**詳細版本與範例**：`.claude/rules/karpathy-guidelines.md`

---

## 🤝 協作行為邊界（何時問、何時直接做）

> 補充 Karpathy §1「不清楚就停下」：劃出明確邊界，避免兩種摩擦——瑣事過度確認、破壞性操作卻不確認。

### 🚩 規劃文件先行（Doc-First — 開發流程紅線）

非 trivial 的 **FEAT / CHANGE / FIX**：**必須先建立規劃文件（實體 `.md` 檔）→ 交付使用者 review → 取得核准，才開始實作**。
依 `docs/10-ai-assistant/03-dev-workflow.md` §1：① 分類提案 → **② 寫規劃文件** → ③ 實作 → ④ 驗證 → ⑤ 推送。**② 在 ③ 之前。**

- ❌ **不可**用「聊天室內的計畫 + 口頭 OK」**取代**「規劃文件 + review」——聊天計畫不是可留存、可審閱的 review artifact。
- ❌ **不可**先實作、事後補規劃文件。
- ✅ **Trivial**（typo / rename / 改註解，< 30 min）豁免文件，直接改。
- ✅ 文件位置/模板依 §2 與 `.claude/rules/documentation.md`：CHANGE → `claudedocs/4-changes/feature-changes/`、FIX → `bug-fixes/`、FEAT → `1-planning/features/`。
- ✅ 流程順序：先寫文件 → 請使用者 review → 待核准 → 才 `Edit`/`Write` 程式碼。實作中的後續步驟（已核准 scope 內）不需逐步再問。

> **自檢**：動任何 FEAT/CHANGE/FIX 的程式碼前，先問自己「規劃文件建立了嗎？使用者 review 過了嗎？」否則停下，先補文件。

### 破壞性操作才需確認（Confirmation on Destructive Only）

**必須先問**：
- `git push` / `git reset --hard` / `git push --force` / 刪除分支
- 刪除或大幅改寫 production 程式碼、Prisma migration、CI/CD workflow（`.github/`）
- 對外送出內容（PR comment、email、第三方服務上傳）
- `pnpm db:reset` 或直接操作正式資料庫

**不需確認**（在已對齊的 scope 內）：
- `Read` / `Glob` / `Grep` / 唯讀 Bash 指令
- `Edit` / `Write` 在已討論同意的範圍內、或計畫中已列出的新檔
- `pnpm typecheck` / `pnpm lint` / `pnpm validate:i18n` / `pnpm db:generate` 等本地檢查

### 策略模糊才需先問（Ask Before Acting on Strategy）

**必須先問**：
- 需求有多種合理解讀（如「加權限檢查」可指 procedure 層 / Sidebar 過濾 / Middleware 擋路由）
- 存在多個有效技術方案，且取捨會影響架構
- 使用者意圖不明，或需求與既有紅線衝突（Schema SSOT、業務邏輯只能在 `packages/api`）

**不需先問**（直接執行）：
- tool 回傳結果後、同一 aligned scope 內的下一步
- 已同意計畫中的後續步驟
- 可並行的 batch 唯讀查詢

### 不可逾越（行為硬規則）

- ❌ 未授權不刪測試 / 不關測試 / 不跳測試（Playwright E2E 為目前唯一測試層）
- ❌ 未授權不刪 `docs/` 與 `claudedocs/` 文件
- ❌ 不順手「改善」與需求無關的代碼（Karpathy §3 外科手術原則）
- 其餘技術紅線見下方「Critical Constraints」與各 `.claude/rules/`

---

## 📋 Code Standards & Rules

專案代碼規範位於 `.claude/rules/` 目錄，為 AI 助手提供詳細的編碼指引：

| 規則文件 | 適用路徑 | 主要內容 |
|----------|----------|----------|
| `frontend.md` | `apps/web/src/app/**` | Next.js 頁面、路由、Metadata |
| `components.md` | `apps/web/src/components/**` | React 組件模式、Props、狀態管理 |
| `ui-design-system.md` | `apps/web/src/components/ui/**` | shadcn/ui 組件使用規範 |
| `backend-api.md` | `packages/api/src/**` | tRPC Router、Zod Schema、權限控制 |
| `database.md` | `packages/db/prisma/**` | Prisma Schema、遷移、查詢模式 |
| `i18n.md` | `apps/web/src/messages/**` | 翻譯 Key 命名、驗證流程 |
| `typescript.md` | `**/*.ts`, `**/*.tsx` | 類型定義、命名約定、泛型使用 |
| `scripts.md` | `scripts/**` | 腳本命名、輸出格式、錯誤處理 |
| `documentation.md` | `claudedocs/**`, `docs/**` | 文檔結構、格式範本 |

**AI 助手使用指南**：
1. 處理特定路徑檔案時，參考對應的規則文件
2. 遵循規則中的代碼模式和約定
3. 避免「禁止事項」中列出的做法

詳細索引：`.claude/rules/index.md`

---

## Project Overview

This is an **IT Project Process Management Platform** - a **production-ready** full-stack web application built with the **T3 Stack** (Next.js + tRPC + Prisma + TypeScript). The platform centralizes and streamlines IT department project workflows from budget allocation to expense charge-out, replacing fragmented manual processes (PPT/Excel/Email) with a unified, role-based system.

### 🎯 Current Development Stage

**✅ MVP Phase 1: 100% Complete** (Epic 1-8)
- All 8 core Epics delivered and tested
- **精確統計數字（頁面 / 組件 / Routers / Procedures / Models / i18n keys）** → 見 `docs/codebase-analyze/SUMMARY.md`（由 `scripts/refresh-stats.js` 自動同步，避免此處漂移）

**✅ Post-MVP Enhancements: Complete**
- Design system migration (shadcn/ui + Radix UI)
- 4 new pages (Quotes, Settings, Register, Forgot Password)
- Environment deployment optimization
- **Quality fixes (FIX-009 ~ FIX-156, 共 80+ bug fixes)**
  - FIX-009 ~ FIX-099: MVP 階段品質修復
  - **FIX-101 ~ FIX-137**: Codebase 分析驗證修復（34 項安全、品質、UX 修正，commit `5017bd0`）
  - **FIX-138 ~ FIX-156**（2026-05~06）: FIX-141 migration baseline 重立、FIX-142 session 過期偵測、**FIX-145~152 P0/P1 安全修復**（NEXTAUTH_SECRET 外洩移除、依賴 CVE patch、password hash 洩漏、物件級授權 IDOR）、FIX-154~156 schema 漂移防範規劃
    - FIX-101: User Router 權限修復（改 protectedProcedure / adminProcedure）
    - FIX-102: Health Router Schema 修改端點改 adminProcedure
    - FIX-103: 檔案上傳 API 加認證中間件
- **FEAT-007**: OM Expense 表頭-明細架構重構 (OMExpense → OMExpenseItem → OMExpenseMonthly)
- **FEAT-008**: OM Expense Data Import (Excel 數據導入 v1.0 → v1.3)
- **FEAT-009**: OpCo 數據權限管理
- **FEAT-010**: Project Data Import（前端模組 `project-data-import/`）
- **FEAT-011**: Permission Management（Sidebar 權限過濾）
- **FEAT-012**: 統一載入特效系統（Spinner, LoadingButton, LoadingOverlay, GlobalProgress）
- **FEAT-014**: 可配置序列審批流程（ApprovalWorkflow/ApprovalStep；budgetProposal 序列審批執行）
- **FEAT-015**: Project Expense 月度模組（三層架構 ProjectExpense/Item/Monthly）
- **CHANGE-001~052**: 52 項功能改進 (OM Summary、Dashboard、Delete Enhancement、User Password、OM 雙幣輸入 CHANGE-048~050、CI 有效閘門 CHANGE-051、提案多態目標 CHANGE-052 等)

**📋 Next Phase: Epic 9-10** (AI Assistant + External Integration)

### ⚠️ 已知未完成 / 技術債務（節選，完整清單見 `docs/codebase-analyze/10-issues-and-debt/`）

- **未完成功能**：
  - Settings 頁面 Profile / Notification / Display 三個 save handler 為 TODO（`settings/page.tsx:96, 105, 114`）
  - Forgot Password 以 `setTimeout` 模擬重置流程（`forgot-password/page.tsx:79`，未接真實 API）
- **超大檔案**：多個檔案超過 500/1000 行（最大：`data-import/page.tsx` 1,606 行、`omExpense` router 2,762 行）→ 即時數字見 `docs/codebase-analyze/10-issues-and-debt/tech-debt.md`
- **兩套 Toast 系統共存**（MVP Context 版 + Post-MVP Pub/Sub 版，待統一）
- **表單處理不一致**：部分用 react-hook-form + Zod，部分用 useState（待統一）
- **代碼 Bug**（僅列仍存在的；其他已於 FIX-101~137 修復）：
  - `expense.reject` 發送未註冊的通知類型 `'EXPENSE_REJECTED'`（`expense.ts:1268`）
- **安全現況**：2026-06 已完成 P0/P1 安全修復批次（FIX-145~152，詳見 FIXLOG）——`codebase-analyze/10-issues-and-debt/security-review.md` 列的多數安全問題已解決；**唯一手動殘留：Azure Key Vault 輪換 `NEXTAUTH_SECRET`**（個人＋公司環境，外洩密鑰未輪換前風險未完全解除）

---

## Tech Stack

→ 見 `docs/codebase-analyze/01-project-overview/tech-stack.md`（53 deps + 34 devDeps 完整清單、版本、用途）

**Development Requirements**（最小需求，更詳細見 `DEVELOPMENT-SETUP.md`）：
- Node.js >= 20.0.0（鎖定 20.11.0 於 `.nvmrc`）
- pnpm >= 8.0.0（current: 8.15.3）
- Docker（本地 PostgreSQL / Redis / Mailhog）

---

## Project Structure

Turborepo monorepo，頂層結構：

```
apps/web/        # Next.js 前端（pages / components）
packages/
  api/           # tRPC 後端（routers / procedures）
  db/            # Prisma schema — 資料模型 SSOT
  auth/          # NextAuth.js + Azure AD
  eslint-config/ # Shared
  tsconfig/      # Shared
scripts/         # 開發/維運腳本
docs/, claudedocs/
```

**實時數字** → 見 `docs/codebase-analyze/SUMMARY.md`

**完整路由/組件清單** → 見 `docs/codebase-analyze/03-frontend-pages/page-index.md` 與 `04-components/component-index.md`

**Key Architecture Patterns:**
- **packages/db**: Single source of truth for data models (Prisma schema)
- **packages/api**: All business logic and tRPC procedures live here
- **packages/auth**: Centralized authentication with NextAuth.js + Azure AD (Entra ID)
- **apps/web**: Consumes `packages/api` via tRPC, handles UI/UX

---

## Core Data Model

Prisma Schema 為資料模型**單一真相來源（SSOT）**：`packages/db/prisma/schema.prisma`

- **完整 32 models + 94 索引 + 16 級聯策略** → 見 `docs/codebase-analyze/05-database/model-detail.md`
- **ER 圖** → 見 `docs/codebase-analyze/09-diagrams/er-diagram.md`
- **Migration 歷史** → 見 `docs/codebase-analyze/05-database/migration-history.md`

**Status Flows**（關鍵業務狀態機，需常備記憶）：
- **BudgetProposal**: Draft → PendingApproval → Approved/Rejected/MoreInfoRequired
- **Expense**: Draft → PendingApproval → Approved → Paid

---

## Development Commands

### Initial Setup
```bash
# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env
# Fill in: DATABASE_URL, AZURE credentials, NEXTAUTH_SECRET, etc.

# Start local services (Docker)
docker-compose up -d

# Run database migrations
pnpm db:migrate

# Generate Prisma Client
pnpm db:generate

# (Optional) Seed database
pnpm db:seed

# Run environment check
pnpm check:env
```

### Daily Development
```bash
# Start all services (web app + Turborepo)
pnpm dev

# Start only Next.js app
pnpm dev --filter=web

# Run all tests
pnpm test

# Run specific workspace tests
pnpm test --filter=api

# Database operations
pnpm db:studio          # Open Prisma Studio GUI
pnpm db:migrate         # Create and apply migration
pnpm db:generate        # Regenerate Prisma Client
pnpm db:push            # Push schema changes (dev only)
pnpm db:seed            # Seed database with test data
```

### Building and Quality Checks
```bash
# Build all packages
pnpm build

# Lint all code
pnpm lint

# Type-check all packages
pnpm typecheck

# Format code
pnpm format
pnpm format:check
```

### Environment & Index Management (Post-MVP)
```bash
# One-click setup: install + generate + check
pnpm setup

# Check environment configuration
pnpm check:env

# Index maintenance (AI Assistant navigation)
pnpm index:check             # Basic sync check
pnpm index:check:incremental # Only check changed files
pnpm index:fix               # Auto-fix (use with caution)
pnpm index:health            # Complete health check
```

---

## Environment Variables

環境變數**權威來源**：根目錄 `.env.example`（複製為 `.env` 後填值）

- **完整變數清單與說明** → 見 `docs/codebase-analyze/06-auth-and-config/config-and-env.md`
- **Azure 基礎設施規格** → 見 `docs/codebase-analyze/01-project-overview/azure-infrastructure.md`

### Docker Service Ports (Local Development)
```bash
PostgreSQL:   localhost:5434 (mapped from 5432)
Redis:        localhost:6381 (mapped from 6379)
Mailhog SMTP: localhost:1025
Mailhog UI:   localhost:8025
```

**⚠️ Important**: All local Docker services use **non-standard ports** to avoid conflicts（此為救命資訊，故保留於此）。

---

## Key Development Principles

詳細開發模式已拆分到 `.claude/rules/` 各領域規則檔（見 L138「Code Standards & Rules」表格）：

- **tRPC API** → `.claude/rules/backend-api.md`
- **Prisma Schema / 資料庫** → `.claude/rules/database.md`
- **Next.js 頁面** → `.claude/rules/frontend.md`
- **React 組件** → `.claude/rules/components.md`
- **shadcn/ui** → `.claude/rules/ui-design-system.md`
- **i18n（含重複 key、AI agent 使用注意）** → `.claude/rules/i18n.md`
- **TypeScript / Zod** → `.claude/rules/typescript.md`

**高層原則（紅線，不可忽略）**：
- **Schema 是 SSOT**：`packages/db/prisma/schema.prisma`；改後必跑 `pnpm db:migrate` + `pnpm db:generate`
- **所有業務邏輯在 `packages/api`，不可在前端組件中**
- **所有 tRPC procedures 必須用 Zod 驗證輸入**
- **所有受保護路由必須用 `protectedProcedure` / `supervisorProcedure` / `adminProcedure`**
- **i18n 改翻譯前必跑 `pnpm validate:i18n`**（避免重複 key 靜默覆蓋）
- **Testing**：目前僅 Playwright E2E；Unit/Component tests 尚未實作（Jest + RTL planned）

---

## Epic Status & Feature Completion

**現況概要**：Epic 1-8 ✅ 完成（MVP Phase 1）+ Post-MVP（含 FEAT-007~012 / CHANGE-001~041 / FIX-009~137）✅ 完成；Epic 9-10 📋 規劃中。

詳細歷史 → 見：
- `DEVELOPMENT-LOG.md`（每個 Epic / Sprint 的決策與變更）
- `FIXLOG.md`（FIX-009 ~ FIX-156 完整修復記錄）
- `docs/stories/`（每個 Epic 下的 user stories 原始規格）
- `claudedocs/4-changes/`（FEAT / CHANGE / FIX 規劃文件）

**待辦 Epic 9-10**：AI Assistant（智能預算建議、費用分類、風險預警）+ 外部系統整合（ERP / HR / 資料倉儲）

---

## Documentation Structure

Comprehensive documentation exists in multiple locations:

### Primary Documentation
- `README.md` - Project overview and quick start
- `CLAUDE.md` - This file (AI assistant guidance)
- `DEVELOPMENT-SETUP.md` - Complete cross-platform setup guide
- `docs/brief.md` - Project brief and problem statement
- `docs/prd/` - Product Requirements Documents
- `docs/fullstack-architecture/` - Complete technical architecture spec
- `docs/stories/` - Detailed user stories organized by epic
- `docs/front-end-spec.md` - Frontend specifications

### AI Assistant Navigation System
- `AI-ASSISTANT-GUIDE.md` - Quick reference for AI assistants
- `PROJECT-INDEX.md` - Complete file index
- `INDEX-MAINTENANCE-GUIDE.md` - Index maintenance strategy
- `DEVELOPMENT-LOG.md` - Development history and decisions
- `FIXLOG.md` - Bug fix records (FIX-009 ~ FIX-156, 80+ fixes)

### Analysis & Planning (claudedocs/)
- `DESIGN-SYSTEM-MIGRATION-PROGRESS.md` - Design system migration tracking
- `USER-FEEDBACK-ENHANCEMENTS-*.md` - User feedback implementation records
- `CLAUDE-MD-ANALYSIS-REPORT.md` - This file's analysis report

**Important**: Always consult `docs/fullstack-architecture/` for architectural decisions, data model details, and API design patterns before making significant changes.

---

## User Roles and Permissions

The system has role-based access control (RBAC):

| Role | Capabilities |
|------|--------------|
| **ProjectManager** | Create projects, submit proposals, record expenses, view own projects |
| **Supervisor** | Review/approve proposals, approve expenses, oversee all projects, access strategic dashboard |
| **Admin** | Full system access, user management (future) |

Role enforcement happens in:
1. **tRPC middleware**: `protectedProcedure`, `supervisorProcedure`, `adminProcedure`
2. **Frontend**: Role-based UI rendering
3. **Database**: User.roleId foreign key

---

## Code Generation and AI Assistance

This project is designed for AI-assisted development with production-quality code:

### Current AI Integration
- **BMad methodology**: Files in `.bmad-core/`, `.claude/`, `.cursor/`
- **Index navigation system**: 4-layer index for AI context loading
- **Automated checks**: `check-environment.js` for setup validation
- **ITPM Slash Commands**: `.claude/commands/itpm/` 跨電腦開發工作流指令

### ITPM Slash Commands（跨電腦開發工作流）

本專案支援在**兩台電腦間切換開發**，以下 slash commands 簡化日常操作：

| 指令 | 使用時機 | 功能 |
|------|---------|------|
| `/itpm:sync` | 切換到另一台電腦開始工作時 | 拉取最新代碼、安裝依賴、同步資料庫、啟動服務 |
| `/itpm:status` | 隨時快速檢查 | 一覽 Git / Docker / DB / Dev Server 狀態 |
| `/itpm:pre-commit` | 提交代碼前 | i18n 一致性、TypeScript、Lint 品質檢查 |
| `/itpm:push` | 結束開發離開前 | 提交變更並推送到 GitHub |
| `/itpm:init` | 全新電腦首次設置 | 完整初始化（Docker → 依賴 → DB → 種子資料） |
| `/itpm:refresh-stats` | 輕量更新統計數字 | 重跑 `scripts/refresh-stats.js`，同步 `SUMMARY.md` |
| `/itpm:refresh-codebase-analysis` | 完整重跑深度分析 | 6 階段流程，產生 CHANGE 規劃文件 |

**典型工作流程**：
```
電腦 A 開始工作 → /itpm:sync
開發中隨時檢查 → /itpm:status
準備提交代碼   → /itpm:pre-commit
離開前推送     → /itpm:push
電腦 B 開始工作 → /itpm:sync
```

**初始化注意事項**（詳見 `docs/deployment/05-local-initialization-checklist.md`）：
- 種子資料 `pnpm --filter db db:seed` **必須執行**，否則 Sidebar 不顯示任何功能
- `.env` 中的 `NEXTAUTH_URL` Port 必須與實際運行 Port 一致
- 跨電腦遷移後須清除瀏覽器 cookies（避免舊 JWT session 錯誤）
- 用 `prisma db push` 同步 Schema 時，勿用 shell 直接更新密碼（`$` 符號會被轉義）

**測試帳號**（由種子資料建立）：

| 角色 | Email | 密碼 | 權限 |
|------|-------|------|------|
| Admin | `admin@itpm.local` | `admin123` | 全部 18 項功能 |
| ProjectManager | `pm@itpm.local` | `pm123456` | 11 項核心業務 |
| Supervisor | `supervisor@itpm.local` | `supervisor123` | 17 項（除用戶管理） |

### AI Development Guidelines
- tRPC provides end-to-end type safety with zero API schema maintenance
- Prisma auto-generates types from schema - always regenerate after schema changes
- Use Zod schemas for runtime validation and TypeScript type inference
- All business logic in `packages/api`, not in frontend components
- Follow established patterns for consistency

---

## Critical Constraints

### Security
- **Never commit secrets** to the repository (`.env` is gitignored)
- Azure AD redirect URIs must be configured in Azure portal
- Use `protectedProcedure` for all authenticated routes
- Validate all user inputs with Zod schemas

### Architecture
- **Always use Turborepo commands** from root (`pnpm dev`, not `cd apps/web && npm run dev`)
- **Never modify Prisma Client manually** - it's auto-generated
- **Database migrations are immutable** in production
- **All business logic belongs in `packages/api`**, not frontend

### Development Workflow
- Clear Turborepo cache if builds behave strangely: `pnpm turbo clean`
- Regenerate Prisma Client after schema changes: `pnpm db:generate`
- Restart TypeScript server after API router changes
- Use `pnpm check:env` before starting development

---

## Deployment (Azure)

→ 見 `docs/codebase-analyze/01-project-overview/azure-infrastructure.md`（完整 Azure 基礎設施規格）
→ 見 `docs/codebase-analyze/01-project-overview/build-and-deploy.md`（Docker 構建 + 6 個 GitHub Actions workflow）

**Build Process**（關鍵命令）：
```bash
pnpm build    # Builds all packages
pnpm start    # Runs Next.js production server
```

---

## Common Gotchas

1. **Docker port mapping**: Local PostgreSQL uses **5434**, not 5432
2. **Turborepo caching**: Clear cache with `pnpm turbo clean` if builds fail
3. **Prisma Client sync**: Run `pnpm db:generate` after any schema change
4. **tRPC type errors**: Restart TypeScript server in IDE after API changes
5. **Environment variables**: Next.js public vars must be prefixed with `NEXT_PUBLIC_`
6. **Multiple dev servers**: Check `netstat -ano | findstr :300` to avoid port conflicts
7. **Email in dev**: Use Mailhog UI at http://localhost:8025 to view test emails

---

## Development Tools & Scripts

→ 見 `docs/codebase-analyze/07-scripts-and-tools/script-index.md`（40 個腳本分類索引）
→ 跨電腦開發工作流 → 見下方 ITPM Slash Commands 區塊；詳細參考 `DEVELOPMENT-SETUP.md`

**最常用 3 個**：
- `pnpm setup` — 一鍵：install + generate Prisma + check env
- `pnpm check:env` — 驗證 15+ 環境需求
- `pnpm index:health` — AI navigation index 完整健康檢查

---

## Next Steps for New Contributors

1. **Setup Environment**: Follow `DEVELOPMENT-SETUP.md` (cross-platform)
2. **Run Environment Check**: `pnpm check:env` to verify setup
3. **Read Documentation**:
   - `docs/brief.md` for business context
   - `docs/fullstack-architecture/` for technical architecture
   - `packages/db/prisma/schema.prisma` for data model
   - `AI-ASSISTANT-GUIDE.md` for AI assistant workflow
4. **Explore Codebase**:
   - `docs/stories/` for feature requirements
   - `PROJECT-INDEX.md` for file navigation
   - `DEVELOPMENT-LOG.md` for development history
5. **Start Development**: `pnpm dev` and access http://localhost:3000

---

## Project Metrics

→ 權威來源：`docs/codebase-analyze/SUMMARY.md`（由 `scripts/refresh-stats.js` 自動同步，避免此處數字過時）

頂部 meta block（L5-10）已有關鍵數字摘要。

---

**Last Updated**: 2026-06-22
**Maintained By**: Development Team + AI Assistant
**Next Review**: After Epic 9-10 completion
