# ITPM — Session Start Prompt（每個新 session 必用）

> **用法**：每個新 session 開始時，整份 copy 入對話框送出，**只需更新最後一節「今天的任務」一行**。其他段落是常駐 onboarding context，不需要每次改。
>
> **適用範圍**：IT Project Process Management Platform（ITPM）Post-MVP 階段任何開發 / 審查 / 修復 session。
>
> **語言**：本專案 primary language 為 **繁體中文**（standard 書面）。

---

## 第一部分：你正在加入的項目

你好。本項目是 **IT Project Process Management Platform（ITPM）** — 一個 **production-ready** 的全端 web app，用 **T3 Stack**（Next.js + tRPC + Prisma + TypeScript）建構，部署於 Azure。

### ITPM 為何存在（Why）

IT 部門的專案流程（從預算分配 → 提案審批 → 採購 → 費用記錄 → charge-out）原本散落在 PPT / Excel / Email，難以追蹤與審計。ITPM 用一個 **role-based 統一系統**取代這些零散流程。

### 核心業務狀態機（需常備記憶）

- **BudgetProposal**：`Draft → PendingApproval → Approved / Rejected / MoreInfoRequired`
- **Expense**：`Draft → PendingApproval → Approved → Paid`

### 目前開發階段

- ✅ **MVP Phase 1（Epic 1-8）100% 完成**
- ✅ **Post-MVP Enhancements 完成**：design system 遷移（shadcn/ui）、FEAT-007~012、CHANGE-001~041、FIX-009~139
- 🚧 **進行中**：FEAT-013 Security Hardening（Phase 1 規劃 + IR Plan，見 `claudedocs/4-changes/FEAT-013-security-hardening.md` 與 `docs/security-and-governance/`）
- 📋 **Next Phase**：Epic 9-10（AI Assistant + 外部系統整合）

> **精確統計（頁面 / 組件 / Router / Procedure / Model / i18n keys）一律以 `docs/codebase-analyze/SUMMARY.md` 為準**，本 prompt 摘要可能落後。

### ITPM 不是什麼（避免常見誤解）

- ❌ **不是「業務邏輯散在前端」** — 所有業務邏輯必須在 `packages/api`，前端只消費 tRPC
- ❌ **不是「Schema 可隨手改」** — `packages/db/prisma/schema.prisma` 是資料模型 SSOT，改後必跑 `pnpm db:migrate` + `pnpm db:generate`
- ❌ **不是「有完整 unit/component 測試」** — 目前唯一測試層是 Playwright E2E（Jest + RTL 為 planned）
- ❌ **不是「單套 Toast / 單套表單」** — 兩套 Toast 系統 + 表單處理不一致是**已知專案級技術債**，不要在無關任務中「順手統一」

---

## 第二部分：必讀順序與權威排序（衝突時誰為準）

> 對齊 `CLAUDE.md`「Session 起手必讀順序與權威排序」。本節只定義導航與優先級。

### 必讀順序（由上而下）

1. **本 prompt**（你正在讀）— 高層 onboarding
2. **`CLAUDE.md`**（專案根目錄）— 高層導航、紅線原則、開發指令
3. **`.claude/rules/karpathy-guidelines.md`** — AI 編碼行為態度（貫穿所有任務）
4. **`docs/codebase-analyze/SUMMARY.md`** — 最新精確統計與最嚴重發現
5. **對應領域規則** `.claude/rules/{frontend,components,backend-api,database,i18n,typescript,...}.md` — 依當前任務路徑
6. **`docs/codebase-analyze/02..11/`** — 需要精確介面 / 架構 / 已知問題清單時的權威細節

### 權威排序（衝突時上位者勝）

```
docs/codebase-analyze/（含 SUMMARY.md）＋ 實際程式碼
  > .claude/rules/ 領域規則
  > CLAUDE.md 的摘要數字
```

- **統計數字**（頁面 / 組件 / Router / Procedure / Model / i18n keys）一律以 `SUMMARY.md` 為準。
- **介面 / 架構細節** 以實際程式碼 + `codebase-analyze/` 對應 detail 檔為準。
- **行為態度 vs 技術規範衝突**時：遵守領域規則的技術細節，保留 karpathy 的行為態度。

---

## 第三部分：最高指導原則（不可違反）

### 原則 1 — Karpathy 行為準則（貫穿所有任務）

完整版見 `.claude/rules/karpathy-guidelines.md`，核心 4 條：

1. **Think Before Coding** — 不假設、不隱藏困惑、浮現 tradeoffs；不確定就**問**，有更簡單做法就**推回**
2. **Simplicity First** — 用最少代碼解決問題，不做投機性擴展 / 抽象 / 「靈活性」
3. **Surgical Changes** — 只動必須動的，配合既有風格，**每一行改動都應能追溯到使用者的請求**
4. **Goal-Driven Execution** — 把任務轉成可驗證目標，多步驟先給簡短計畫，循環直到驗證通過

### 原則 2 — 技術紅線（CLAUDE.md Critical Constraints）

- **Schema SSOT**：`packages/db/prisma/schema.prisma`；改後必跑 `pnpm db:migrate` + `pnpm db:generate`
- **所有業務邏輯在 `packages/api`**，不可在前端組件中
- **所有 tRPC procedures 必須用 Zod 驗證輸入**
- **所有受保護路由必須用** `protectedProcedure` / `supervisorProcedure` / `adminProcedure`
- **i18n 改翻譯前必跑 `pnpm validate:i18n`**（避免重複 key 靜默覆蓋；同步改 en.json + zh-TW.json）
- **錯誤分類用 `code` / `cause.reason` / i18n key**，禁止讓前端用 `err.message.includes()` 比對字串（見 `backend-api.md`）
- **mutation / 長非同步按鈕的 loading 用 `LoadingButton`**，禁止手刻 `'...'`（見 `components.md`）

### 原則 3 — 行為硬規則（不可逾越）

- ❌ 未授權**不刪測試 / 不關測試 / 不跳測試**（Playwright E2E 為目前唯一測試層）
- ❌ 未授權**不刪 `docs/` 與 `claudedocs/` 文件**
- ❌ 不順手「改善」與需求無關的代碼（Karpathy §3）
- ❌ 不執行 `git reset --hard` / `git push --force` / `--no-verify`（除非使用者明確授權）

### 原則 4 — 協作行為邊界（何時問、何時直接做）

**破壞性操作才需確認**：`git push` / `git reset --hard` / 刪分支 / 刪或大幅改寫 production 程式碼、Prisma migration、`.github/` workflow / 對外送出內容（PR comment / email / 第三方上傳）/ `pnpm db:reset` 或操作正式 DB。

**策略模糊才需先問**：需求有多種合理解讀（如「加權限檢查」可指 procedure 層 / Sidebar 過濾 / Middleware）/ 多個有效方案且取捨影響架構 / 意圖不明或與紅線衝突。

**不需確認（在已對齊的 scope 內）**：`Read` / `Glob` / `Grep` / 唯讀 Bash；計畫中已同意的 `Edit` / `Write`；本地檢查指令（`pnpm typecheck` / `lint` / `validate:i18n` / `db:generate`）。

---

## 第四部分：架構骨架（Turborepo Monorepo）

ITPM 是 Turborepo monorepo。**所有 file 必須明確歸屬到正確的 package**，禁止跨層雜湊（如把業務邏輯寫進前端組件）。

```
apps/web/         # Next.js 前端（App Router pages + React components）
packages/
  api/            # tRPC 後端 — 所有業務邏輯 / routers / procedures（17 routers / ~204 procedures）
  db/             # Prisma schema — 資料模型 SSOT（32 models）
  auth/           # NextAuth.js + Azure AD（Entra ID）
  eslint-config/  # 共用 lint 設定
  tsconfig/       # 共用 TS 設定
scripts/          # 開發 / 維運腳本（~41 個）
docs/, claudedocs/
```

### 處理某類檔案前，先讀對應領域規則（`.claude/rules/`）

| 任務路徑 | 領域規則 | 重點 |
|---|---|---|
| `apps/web/src/app/**` | `frontend.md` | Next.js 頁面、路由保護、Metadata、locale 前綴 |
| `apps/web/src/components/**` | `components.md` | React 組件模式、Props、`LoadingButton`、Toast |
| `apps/web/src/components/ui/**` | `ui-design-system.md` | shadcn/ui 使用、不改核心邏輯、不刪 ARIA |
| `packages/api/src/**` | `backend-api.md` | tRPC Router、Zod、權限、錯誤 `code`/`cause`、Transaction |
| `packages/db/prisma/**` | `database.md` | Prisma Schema、遷移、查詢、索引、級聯策略 |
| `apps/web/src/messages/**` | `i18n.md` | Key 命名、重複 key、雙語同步、`validate:i18n` |
| `**/*.ts`, `**/*.tsx` | `typescript.md` | 類型定義、命名、Zod 整合、避免 any |
| `scripts/**` | `scripts.md` | 腳本命名、輸出格式、錯誤處理 |
| `claudedocs/**`, `docs/**` | `documentation.md` | 文檔結構、格式範本、語言規範 |

> **需要精確介面 / 架構細節時**：查 `docs/codebase-analyze/02-api-layer/`（Router 詳解）、`03-frontend-pages/`、`04-components/`、`05-database/`、`10-issues-and-debt/`（安全 / 技術債 / 死碼）。

### RBAC（角色權限）

| 角色 | tRPC procedure | 能力 |
|---|---|---|
| **ProjectManager** | `protectedProcedure` | 建立專案、提交提案、記錄費用、看自己的專案 |
| **Supervisor** | `supervisorProcedure` | 審批提案 / 費用、總覽所有專案、策略儀表板 |
| **Admin** | `adminProcedure` | 全系統存取、使用者管理 |

---

## 第五部分：開發工作流（Task Classification + ITPM Slash Commands）

### Task Type 分類（收到任務先分類，再 propose）

| 使用者請求訊號 | 類型 | 規劃文件位置 |
|---|---|---|
| 「實作新功能 / 新模組」 / 對應 Epic deliverable | **Feature（FEAT-NNN）** | `claudedocs/4-changes/feature-changes/` |
| 「改 X 行為」/「加 Y 選項」/「調整 Z」 | **Change（CHANGE-NNN）** | `claudedocs/4-changes/feature-changes/` |
| 「X 壞了」/「broken」/「fail」/「錯了」 | **Bug-fix（FIX-NNN）** | `claudedocs/4-changes/bug-fixes/` + 同步 `FIXLOG.md` |
| 「修 typo」/「rename 變數」/「更新註解」（< 30 min） | **Trivial** | 無需 doc，直接改 |

**Protocol**：
1. AI 依訊號**分類**
2. **明確 propose**：「我判斷這是 [Feature / Change / Bug-fix / Trivial]，建議走 X workflow，先準備 [規劃文件]。OK？」
3. **等使用者 confirm**（或 override）
4. 編號接續最新（查 `FIXLOG.md` / `claudedocs/4-changes/`，目前 FIX 已到 ~FIX-139、FEAT 到 FEAT-013、CHANGE 到 CHANGE-041）

### ITPM Slash Commands（跨電腦開發工作流）

本專案在**兩台電腦間切換開發**，以下指令簡化日常操作：

| 指令 | 使用時機 | 功能 |
|---|---|---|
| `/itpm:sync` | 切到另一台電腦開始工作 | 拉代碼、裝依賴、同步 DB、啟動服務 |
| `/itpm:status` | 隨時快速檢查 | 一覽 Git / Docker / DB / Dev Server |
| `/itpm:pre-commit` | 提交代碼前 | i18n 一致性、TypeScript、Lint |
| `/itpm:push` | 結束開發離開前 | 提交變更並推送（破壞性，需確認）|
| `/itpm:init` | 全新電腦首次設置 | 完整初始化 |
| `/itpm:refresh-stats` | 輕量更新統計 | 重跑 `scripts/refresh-stats.js`，同步 SUMMARY.md |
| `/itpm:refresh-codebase-analysis` | 完整重跑深度分析 | 6 階段流程，產生 CHANGE 規劃文件 |

**典型流程**：`電腦 A 開始 → /itpm:sync` → `開發中 → /itpm:status` → `提交前 → /itpm:pre-commit` → `離開前 → /itpm:push`

---

## 第六部分：當前進度自查（AI 自查，不需使用者手動更新）

新 session 開始，AI 用以下方式自查當前進度。**最快做法是直接跑 `/itpm:status`**（一覽 Git / Docker / DB / Dev Server）。需要更多脈絡時：

```bash
# 1. 現在在哪個 branch（commits 通常走 main；要開 PR 才另開 branch）
git branch --show-current

# 2. 最近 commits（看過去工作痕跡）
git log --oneline -20

# 3. working tree 是否乾淨
git status --short

# 4. 最近的 development log（了解最近做了什麼）
#    路徑：docs/development-log/（檔名多為 YYYYMMDD.md 或 YYYY-MM-DD.md）

# 5. 進行中 / 規劃中的變更文件
#    路徑：claudedocs/4-changes/{bug-fixes, feature-changes, i18n}/
#    最新修復記錄：FIXLOG.md｜開發歷史決策：DEVELOPMENT-LOG.md
```

**讀完上述後**，AI 應該能回答：
- working tree 乾淨還是有未提交變更？在哪個 branch？
- 最近一次的工作是什麼（最近 commit / development log）？
- 是否有進行中的 FEAT / CHANGE / FIX 尚未完成？

### 開發環境速查（救命資訊）

| 服務 | 本地 Port（**非標準，避免衝突**）|
|---|---|
| PostgreSQL | `localhost:5434`（mapped from 5432）|
| Redis | `localhost:6381` |
| Mailhog SMTP / UI | `1025` / `http://localhost:8025` |

**測試帳號**（由 `pnpm db:seed` 建立；若 Sidebar 空白多半是沒跑 seed）：

| 角色 | Email | 密碼 |
|---|---|---|
| Admin | `admin@itpm.local` | `admin123` |
| ProjectManager | `pm@itpm.local` | `pm123` |
| Supervisor | `supervisor@itpm.local` | `supervisor123` |

---

## 第七部分：行為規範自檢清單（每次 reply 前 + 提交前）

### 必做

- [ ] 對齊 Karpathy baseline（think → simple → surgical → goal）
- [ ] 觸發紅線（Schema SSOT / 業務邏輯位置 / Zod / 權限 procedure / i18n / 破壞性操作）時，**第一句就 STOP and explain**
- [ ] 收到任務先做 **Task Classification** 並 propose（Feature / Change / Bug-fix / Trivial）
- [ ] 改 `schema.prisma` 後跑 `pnpm db:migrate` + `pnpm db:generate`
- [ ] 改翻譯前後跑 `pnpm validate:i18n`，且 **en.json + zh-TW.json 同步**
- [ ] 改代碼後跑基本循環：`pnpm typecheck` → `pnpm lint` →（如涉及 i18n）`pnpm validate:i18n`
- [ ] commit message 用 Conventional Commits（`<type>(<scope>): <繁體中文描述>`）
- [ ] 用**繁體中文**回覆
- [ ] 需要時可代為啟動 / 重啟本地服務（`pnpm dev` / `docker-compose up -d`）協助開發 + 測試；優先用 background 模式避免阻塞，完成後記得 stop；**破壞性服務操作**（刪 volume / `down -v` / kill 使用者自己的 process）仍需先確認

### ITPM 紀律自檢（每次提交前）

1. **Schema SSOT**（改 schema → 有 migrate + generate？無手改 Prisma Client？）
2. **業務邏輯位置**（業務邏輯在 `packages/api`，不在前端組件？）
3. **Zod 驗證**（所有 tRPC procedure input 有 Zod schema？）
4. **權限控制**（受保護 procedure 用對 `protected/supervisor/admin`？）
5. **錯誤分類**（多錯誤情境用 `code`/`cause.reason`/i18n key，非 `message.includes()`？）
6. **i18n**（雙語同步 + `validate:i18n` 通過 + 無硬編碼文字？）
7. **載入狀態**（mutation 按鈕用 `LoadingButton`，非手刻 `'...'`？）
8. **Surgical**（每行 diff 都能追溯到需求？沒順手 refactor 無關代碼？）
9. **Karpathy baseline**（think before / simplicity / surgical / goal-driven？）

### 不做

- [ ] 不在頁面 / 組件中直接做資料庫操作或業務邏輯
- [ ] 不硬編碼文字（必須用 i18n）/ 不只更新一個語言檔
- [ ] 不在無關任務中「順手」統一 Toast / 表單 / 重排檔案結構（這些是專案級技術債，需獨立處理）
- [ ] 不刪除未授權的測試 / 文件 / 死碼（發現無關死碼 → 提出但不刪）
- [ ] 不單方面執行不可逆 git 操作（`reset --hard` / `push --force` / 刪分支 / `--no-verify`）

### Coding conventions 速查

- **TypeScript strict** + Next.js App Router + Server Components default + shadcn/ui + Tailwind（避免 any / `@ts-ignore`）
- Naming：檔名 page `camelCase`/組件 `PascalCase`、TS `camelCase`、Class `PascalCase`、Const `UPPER_SNAKE`、Zod schema `create/update[Entity]Schema`
- 代碼用英文、業務邏輯註解用繁體中文（解釋 **why** 非 **what**）
- 絕不 commit：secret / API key / `.env`

---

## 第八部分：今天的任務（**唯一需要使用者填寫的部分**）

> 在每個新 session 開始，把整份 prompt copy 之後，只改下方這一節即可。

```
今天的任務：__________________

例：
- 「修 FIX-140 — 預算池切換時金額未更新」
  → AI 判斷 Bug-fix workflow，propose 在 claudedocs/4-changes/bug-fixes/ 建 FIX-140 文件 +
    同步 FIXLOG.md，先重現 → 定位根因 → 修 → 跑 typecheck/lint → 驗證

- 「實作 CHANGE-042 — Expense 列表加匯出 CSV 按鈕」
  → AI 判斷 Change workflow，先讀 expense router (backend-api.md) +
    對應頁面 (frontend.md)，確認 i18n key，propose 規劃後實作

- 「繼續 FEAT-013 Phase 2 — security hardening」
  → AI 先讀 claudedocs/4-changes/FEAT-013-security-hardening.md +
    docs/security-and-governance/ 確認 Phase 1 狀態與下一步

- 「切換到這台電腦開始工作」
  → AI 跑 /itpm:sync（拉代碼、裝依賴、同步 DB、啟動服務）

- 「幫我看一下現在專案狀態」
  → AI 跑 /itpm:status
```

---

## 附錄：本 prompt 自身的維護

### 何時更新

| 觸發 | 更新位置 |
|---|---|
| 完成一批 FEAT / CHANGE / FIX | §1 開發階段摘要（不放精確數字，數字以 SUMMARY.md 為準）|
| `CLAUDE.md` 紅線 / 權威排序修訂 | §2 權威排序 + §3 最高指導原則 |
| `.claude/rules/` 新增 / 大改領域規則 | §4 領域規則表 + §7 紀律自檢 |
| 新增 / 改 ITPM slash command | §5 slash commands 表 |
| Epic 9-10 啟動 | §1 開發階段 + §5 task classification（如新增 Epic workflow）|

### 配套文件

- **`02-compact-session.md`**（每個 session `/compact` 之前用）— 一個 session 開頭、一個 session 結尾配套使用

---

**Last Updated**：2026-06-01（初版 v1.0 — 基於 `01-session-start-sample.md`（EKP）結構，改寫成 ITPM 實際工作流：權威排序對齊 CLAUDE.md + codebase-analyze、Karpathy 4 原則 + 技術紅線 + 協作邊界、Turborepo monorepo 架構骨架 + 領域規則表、Epic/FEAT/CHANGE/FIX 分類 + ITPM slash commands、git/`itpm:status` 進度自查、ITPM 紀律 9 項自檢。移除 EKP 專屬的 13 Components / W1-W12 sprint / 22 條 OQ / H1-H6 等不適用概念）
**Maintained By**：開發團隊 + AI 助手共同維護
**File location**：`docs/10-ai-assistant/01-session-start.md`
**Companion**：`02-compact-session.md`

---

## Update history

| Date | 變更 | 說明 |
|---|---|---|
| 2026-06-01 | 初版 v1.0 | 基於 EKP `01-session-start-sample.md` 14 章結構，改寫成 ITPM 8 部分 + 附錄。對齊本專案實際工作流（Epic/FEAT/CHANGE/FIX + ITPM slash commands + codebase-analyze 權威來源 + Karpathy guidelines），移除 EKP 專屬不適用章節。|
