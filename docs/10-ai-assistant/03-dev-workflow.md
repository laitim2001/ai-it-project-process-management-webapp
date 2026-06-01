# ITPM 開發工作流（權威流程文件）

> **狀態**：✅ 權威（authoritative）— 規劃 / 開發 FEAT / CHANGE / FIX 時的**單一事實來源**。
> **作用**：本專案的流程原本分散在多份文件中，且部分**文件規範與實際操作不一致**。本文件以「**目前實際在跑的流程**」為現行標準，並明確標註哪些文件條款**暫緩（suspended）**、何時恢復，藉此消除落差。
> **語言**：繁體中文（standard 書面）。

---

## 0. 背景：為何需要這份文件

本專案目前存在兩個「層」的流程文件，部分內容彼此衝突：

| 面向 | 文件上規範（理想/aspirational） | 實際在跑（de-facto，本文件採用為標準） |
|---|---|---|
| **分支** | Issue → `feature/xxx` → PR → Review → Squash merge（`CONTRIBUTING.md`）；甚至 `main ← develop ← feature ← phase-N` 兩人審查（Git workflow 文件） | **直接 commit 到 `main`**（近期 commit 全線性、0 個 merge commit；單人 / AI 協作）|
| **追蹤單位** | GitHub Issue + PR | **`FIX-NNN` / `CHANGE-NNN` / `FEAT-NNN` 規劃文件** + `FIXLOG.md` / `DEVELOPMENT-LOG.md` |
| **測試** | 單元 80% + 元件 60%（Jest + RTL）| **只有 Playwright E2E（6 個 spec）**；Jest / RTL **尚未實作**（planned）|
| **驗證 gate** | GitHub Actions CI + 1~2 人 Code Review | 本地 `/itpm:pre-commit`（`validate:i18n` + `typecheck` + `lint`）|

> ⚠️ 關鍵釐清：`claudedocs/1-planning/architecture/GIT-WORKFLOW-AND-BRANCHING-STRATEGY.md` 是**「設計系統遷移專案」專用**的分支策略（其首行已載明），**不是**本專案的通用工作流，現已不適用於日常開發。

**本文件的立場**：以「實際在跑」為現行標準。`CONTRIBUTING.md` 與 Git workflow 文件中**做不到 / 不適用**的條款，集中列在 [§5 暫緩條款](#5-暫緩條款contributingmd--git-workflow-對照) 並標註恢復條件——它們**不刪除**（保留為未來多人協作 / 正式化時的藍本）。

---

## 1. 現行標準流程（這就是該照的）

```
① 分類並提案 → ② 寫規劃文件 → ③ 按 .claude/rules 實作 → ④ /itpm:pre-commit 驗證 → ⑤ /itpm:push 提交推送
```

### ① 分類並向使用者提案（Task Classification）

收到需求先判斷類型，**明確提案後等確認**（依 `CLAUDE.md` 協作行為邊界：策略模糊才需先問）：

> 「我判斷這是 [Feature / Change / Bug-fix / Trivial]，建議走 X workflow，先準備 [規劃文件]。OK？」

### ② 寫規劃文件

用 `.claude/rules/documentation.md` 的現成模板（各類型有固定章節）。**正確放置位置**見 [§2](#2-任務分類與規劃文件放置位置)。

### ③ 實作

遵循對應領域規則 `.claude/rules/{backend-api, frontend, components, ui-design-system, database, i18n, typescript}.md` + Karpathy guidelines。**紅線**（不可違反）：
- Schema SSOT：改 `packages/db/prisma/schema.prisma` → 跑 `pnpm db:migrate` + `pnpm db:generate`
- 業務邏輯只在 `packages/api`，不在前端組件
- tRPC procedure input 一律 Zod 驗證；受保護路由用對 `protected/supervisor/admin`
- i18n 雙語同步（`en.json` + `zh-TW.json`）+ `pnpm validate:i18n`
- 錯誤分類用 `code`/`cause.reason`/i18n key（非 `message.includes()`）；mutation 按鈕用 `LoadingButton`

### ④ 驗證 — `/itpm:pre-commit`

跑：敏感檔案檢查 → `validate:i18n`（如改翻譯）→ `typecheck` → `lint` → `check:claude-sync`。涉及核心流程改動時，另跑對應 Playwright E2E。

### ⑤ 提交並推送 — `/itpm:push`

逐檔 `git add`（**不用 `git add .`**）→ Conventional Commits 訊息（繁體中文，subject 帶 `(FIX-NNN)` 等）→ 同步 `FIXLOG.md` / `DEVELOPMENT-LOG.md` → `git push origin main`。

> **破壞性操作確認**：`git push` / `reset --hard` / `push --force` / 刪分支 / 操作正式 DB 前必須先向使用者確認（`CLAUDE.md` 協作行為邊界）。

---

## 2. 任務分類與規劃文件放置位置

| 類型 | 觸發訊號 | 規劃文件位置（**權威：`claudedocs/CLAUDE.md`**）| 同步記錄 |
|---|---|---|---|
| **Feature（FEAT-NNN）** | 新功能 / 新模組 / 對應 Epic | `claudedocs/1-planning/features/FEAT-{NNN}-{name}/`（**資料夾**：`01-requirements.md` / `02-technical-design.md` / `03-implementation-plan.md` / `04-progress.md`）| `DEVELOPMENT-LOG.md` |
| **Change（CHANGE-NNN）** | 改行為 / 加選項 / 調整現有功能 | `claudedocs/4-changes/feature-changes/CHANGE-{NNN}-*.md`（**單一檔案**）| `DEVELOPMENT-LOG.md` |
| **Bug-fix（FIX-NNN）** | 壞了 / fail / regression / 錯了 | `claudedocs/4-changes/bug-fixes/FIX-{NNN}-*.md`（**單一檔案**）| `FIXLOG.md` |
| **Trivial** | typo / rename / 改註解（< 30 min）| 無需文件，直接改 | — |

**目前編號現況**（接續用下一個；權威以 `FIXLOG.md` / 對應目錄為準）：
- FIX → **~FIX-139**｜CHANGE → **~CHANGE-041**｜FEAT → **~FEAT-013**

> 📌 **已知放置不一致**：FEAT-001~012 是 `1-planning/features/` 底下的資料夾；但最新的 **FEAT-013 是放在 `claudedocs/4-changes/FEAT-013-security-hardening.md`（單一檔案）**，偏離了上表標準。新 FEAT 建議回到 `1-planning/features/` 資料夾標準；若沿用 FEAT-013 的單檔做法，請在提案時說明。

---

## 3. Commit / 分支 / 推送規範

### Commit 訊息（Conventional Commits）

格式 `type(scope): 繁體中文描述`。type 與 scope 對照見 `CONTRIBUTING.md`（此部分**仍然有效**）。常用：`feat` / `fix` / `docs` / `refactor` / `chore` / `perf` / `test`。subject 帶任務編號，如 `fix(proposal): 修復下拉選單只顯示 20 個 (FIX-139)`。AI 產生的 commit 附 co-author trailer。

### 分支（現行標準：直接 `main`）

- **現行**：直接在 `main` 開發與提交（單人 / AI 快速迭代）。
- **何時該開 branch**：(a) 多人同時協作同一塊；(b) 高風險大改（Prisma migration、認證、大規模重構）想要可回滾 / review gate；(c) 實驗性 spike。此時用 `CONTRIBUTING.md` 的命名：`feature/` `fix/` `refactor/` `docs/` `chore/`。
- 開 branch 屬破壞性流程變更前，先與使用者確認走 branch + PR 還是直接 main。

### 推送

`/itpm:push` → `git push origin main`。跨電腦由另一台用 `/itpm:sync` 或 `git pull` 同步。

---

## 4. 驗證與測試

| 項目 | 現行做法 | 指令 |
|---|---|---|
| TypeScript | 必跑 | `pnpm typecheck` |
| Lint | 必跑 | `pnpm lint`（修復 `pnpm lint:fix`）|
| i18n 一致性 | 改翻譯時必跑 | `pnpm validate:i18n` |
| CLAUDE.md ↔ 統計同步 | 警告級（不阻斷）| `pnpm check:claude-sync` |
| E2E（唯一測試層）| 涉及核心流程時跑 | `pnpm test`（Playwright，目前 6 個 spec）|
| 單元 / 元件（Jest + RTL）| **尚未實作** | — → 見 [§5](#5-暫緩條款contributingmd--git-workflow-對照) |

一鍵跑前三項 + 敏感檔案檢查：`/itpm:pre-commit`。

---

## 5. 暫緩條款（`CONTRIBUTING.md` / Git workflow 對照）

以下條款**寫在文件中但現行不執行**。保留文件、不刪除，標註恢復條件：

| # | 暫緩條款 | 出處 | 現況 | 暫緩理由 | 恢復條件 |
|---|---|---|---|---|---|
| 1 | Issue → feature branch → PR → Code Review → Squash merge | `CONTRIBUTING.md` §開發工作流程 | 直接推 `main`，不開 Issue / PR | 單人 / AI 協作，PR + review 是純開銷 | 團隊 > 1 人，或需正式 review gate |
| 2 | `main` 禁止直接 push、需 **2 人** 批准、`main ← develop ← feature ← phase-N` | Git workflow 文件 §分支架構 | 不適用 | 該文件是**設計系統遷移專案專用**，非通用流程 | 啟動類似規模的大型遷移專案時，才在該專案內套用 |
| 3 | 單元測試 80% + 元件 60%（Jest + RTL）| `CONTRIBUTING.md` §測試要求 | 未裝 Jest / RTL，只有 Playwright E2E | 測試基礎建設尚未建立（planned）| 導入 Jest + RTL 後（屬獨立 FEAT / chore 任務）|
| 4 | GitHub Actions CI 作為 PR gate | `CONTRIBUTING.md` §PR 審查流程 | 以本地 `/itpm:pre-commit` 取代 | 無 PR 流程，CI gate 無觸發點 | 恢復條款 #1（PR 流程）時一併恢復 |

> 仍然**有效**的 `CONTRIBUTING.md` 內容：Conventional Commits 規範、TypeScript / 命名 / Import 規範、Code Review 留言前綴（`[MUST]`/`[SHOULD]`/`[NITS]`…，用於人工審查時）。

---

## 6. 相關文件導航（本文件為中樞，細節指向以下）

| 主題 | 文件 |
|---|---|
| 高層導航 / 紅線 / 開發指令 | `CLAUDE.md`（根目錄）|
| AI 編碼行為態度 | `.claude/rules/karpathy-guidelines.md` |
| 領域編碼規範 | `.claude/rules/{frontend, components, ui-design-system, backend-api, database, i18n, typescript, scripts, documentation}.md` |
| FEAT / CHANGE / FIX 模板與目錄 | `.claude/rules/documentation.md` + `claudedocs/CLAUDE.md`（文檔分類權威）|
| Commit / 命名 / Code Review 規範 | `CONTRIBUTING.md`（部分暫緩，見 §5）|
| 精確統計與架構細節 | `docs/codebase-analyze/SUMMARY.md` + `02..11/` |
| Session 起手 / 結尾 | `docs/10-ai-assistant/01-session-start.md`、`02-compact-session.md` |
| 既有情境提示詞（legacy）| `claudedocs/6-ai-assistant/prompts/SITUATION-*` + `session-guides/`（部署 / onboarding / debug 等情境，仍可參考）|
| 跨電腦 / 日常指令 | `.claude/commands/itpm/{sync, status, pre-commit, push, init, refresh-stats, refresh-codebase-analysis}.md` |

---

## 附錄：維護

- **何時更新**：流程變更（如改回 branch + PR、導入 Jest）、ITPM slash command 變動、`CLAUDE.md` 紅線修訂、文檔目錄結構調整時 → 更新對應段落與 §5 暫緩表。
- **與 session-start / compact 的關係**：本文件是「流程 what & how」的權威；`01-session-start.md` 是 session 起手的 onboarding 摘要（會指向本文件）；`02-compact-session.md` 是結尾紀律自檢。三者不重複內容。

---

**Last Updated**：2026-06-01（初版 v1.0 — 整合 `CONTRIBUTING.md` / Git workflow 文件 / `CLAUDE.md` / `claudedocs/CLAUDE.md` / `.claude/rules/` / ITPM slash commands，以「實際在跑的流程」為現行標準，並標註 4 條暫緩條款與恢復條件）
**Maintained By**：開發團隊 + AI 助手共同維護
**File location**：`docs/10-ai-assistant/03-dev-workflow.md`

---

## Update history

| Date | 變更 | 說明 |
|---|---|---|
| 2026-06-01 | 初版 v1.0 | 建立權威開發工作流文件，消除「文件規範 vs 實況」落差：現行 5 步流程 + 任務分類與正確規劃文件位置 + commit/分支/推送 + 驗證測試 + §5 暫緩條款對照（branch+PR / 2 人審查 GitFlow / Jest+RTL 80% / CI gate）+ §6 文件導航中樞。釐清 Git workflow 文件為設計系統遷移專案專用。|
