---
description: "完整重跑 codebase-analyze 深度分析（6 階段流程，產生 CHANGE 規劃文件）"
---

# /itpm:refresh-codebase-analysis — 完整分析重跑

重新執行 `docs/codebase-analyze/cobebase-analyze-playbook.md` 的 **6 階段完整分析流程**，並自動產生新舊版 diff 報告 + CHANGE-XXX 規劃文件。

**適用時機**（滿足任一即可）：
- ✅ Epic 完成（例：Epic 9 或 Epic 10 結束）
- ✅ 累積 10+ 個 FIX/CHANGE 項目
- ✅ 距離上次分析 > 90 天
- ✅ 架構重大變更（新增整個 Router 層 / Model 重構 / 認證機制變更）
- ✅ `pnpm check:claude-sync` 持續多項 ⚠️ 顯著漂移警告

**不適用**（用 `/itpm:refresh-stats` 即可）：
- 只是新增 1-2 個 Procedure / Page / Component
- 只是修 Bug 或 i18n key
- 只想校正統計數字

---

## 執行前預估

- **時間**: ~2-3 小時（取決於 codebase 規模）
- **Token 消耗**: 中高（約 20 個 Agent 並行）
- **產出檔案**: 更新 40+ 份分析文件 + 1 份 CHANGE-XXX + 1 份 diff 報告

---

## 執行流程（務必依序）

### Step 0: 確認前置條件

檢查必要條件：

```bash
# 1. 工作目錄乾淨（沒有未提交的變更）
git status

# 2. 已經拉取最新代碼
git pull

# 3. 當前分析版本有對應 SUMMARY.md
ls docs/codebase-analyze/SUMMARY.md
```

若 git status 有未提交變更 → **停下來**，先讓用戶提交或 stash。

### Step 1: 建立快照（關鍵 — 勿省略）

```bash
node scripts/snapshot-analysis.js save pre-refresh-$(date +%Y%m%d)
```

此快照用於之後的 diff。快照存放在 `.claude/.analysis-snapshots/`（已 gitignore）。

### Step 2: 取得 CHANGE 編號

查詢下一個可用的 CHANGE-XXX 編號：

```bash
ls claudedocs/4-changes/feature-changes/ 2>/dev/null | grep -oE "CHANGE-[0-9]+" | sort -V | tail -1
```

下一個編號 = 上述結果 + 1。若目錄不存在，從 `CHANGE-042` 開始（CHANGE-041 是上一個）。

### Step 3: 執行 Phase 1 — 項目骨架

使用 `feature-dev:code-explorer` 或 `general-purpose` agent，prompt 包含：

```
重跑 codebase-analyze Phase 1：項目骨架與技術棧。
參考：docs/codebase-analyze/cobebase-analyze-playbook.md Phase 1
更新目標：
- docs/codebase-analyze/01-project-overview/tech-stack.md
- docs/codebase-analyze/01-project-overview/architecture-patterns.md
- docs/codebase-analyze/01-project-overview/build-and-deploy.md
- docs/codebase-analyze/01-project-overview/azure-infrastructure.md

重點：
1. 讀取 package.json 所有 workspace 的 dependencies/devDependencies
2. 重新計算技術棧版本（Next.js, tRPC, Prisma, etc.）
3. 檢查是否有新的 GitHub Actions workflow
4. 檢查是否有新的 Azure 資源配置
只輸出變更部分（基於快照 .claude/.analysis-snapshots/pre-refresh-*），不要重寫整個文件。
```

### Step 4: 執行 Phase 2 — 模組功能映射

**並行啟動 4 個 agents**（依 playbook 的 Parallel Verification Pattern）：

- **Agent A (API Layer)**：更新 `02-api-layer/router-index.md` 和 `02-api-layer/detail/*.md`（17 個 Router）
- **Agent B (Frontend Pages)**：更新 `03-frontend-pages/page-index.md` 和 `03-frontend-pages/detail/group{1,2,3}.md`
- **Agent C (Components)**：更新 `04-components/component-index.md` 和 `04-components/detail/*.md`
- **Agent D (Scripts + i18n + Auth)**：更新 `06-auth-and-config/`, `07-scripts-and-tools/`, `08-i18n/`

每個 agent 的 prompt 範本：

```
重跑 codebase-analyze Phase 2 — {module 範圍}。
參考：docs/codebase-analyze/cobebase-analyze-playbook.md Phase 2
舊版快照：.claude/.analysis-snapshots/pre-refresh-{YYYYMMDD}/{對應子目錄}/

任務：
1. 逐一檢查 {module 範圍} 中每個檔案的當前狀態
2. 更新對應分析文件（保留原有結構，只改變動部分）
3. 用 JSDoc 或程式碼實際內容更新 Procedure/Function 數、行數
4. 新增的檔案要補上完整描述
5. 刪除的檔案要從索引移除
6. 記錄在回報中：新增 / 刪除 / 重構 / 無變動

輸出：修改的分析文件列表 + 變更摘要 < 500 字
```

### Step 5: 執行 Phase 3 — 資料庫層

使用 `feature-dev:code-explorer` agent：

```
重跑 codebase-analyze Phase 3：資料庫層分析。
任務：
1. 重新 parse packages/db/prisma/schema.prisma
2. 更新 05-database/schema-overview.md（Models, 索引, 級聯策略）
3. 更新 05-database/model-detail.md（每個 Model 的欄位）
4. 更新 05-database/migration-history.md（檢查 migrations/ 新增的目錄）
5. 舊版快照：.claude/.analysis-snapshots/pre-refresh-{YYYYMMDD}/05-database/
```

### Step 6: 執行 Phase 4 — 系統圖表

使用 `general-purpose` agent：

```
檢查 docs/codebase-analyze/09-diagrams/ 中的 Mermaid 圖表：
1. ER diagram 需要對應 Phase 3 的 Model 變更
2. System architecture 需要對應新增的 Router / Page
3. Data flow 需要對應新增的業務流程
舊版快照：.claude/.analysis-snapshots/pre-refresh-{YYYYMMDD}/09-diagrams/

若結構無重大變化，輸出 "No diagram update needed"。
若有變化，只更新受影響的圖表檔案。
```

### Step 7: 執行 Phase 5 — 多輪驗證（精簡版）

由於已有過往的 R1-R10 驗證紀錄，只需執行 2 輪新驗證：

**R11 - 新增內容驗證**（並行 3 個 agents）：
- Agent X：驗證 Phase 2 新增的 Router/Page 存在且可運作
- Agent Y：驗證 Phase 3 新增的 Model 在程式碼中真有被使用
- Agent Z：驗證新的 i18n keys 在兩個語言檔都存在

**R12 - 跨文件一致性**（1 個 agent）：
- 驗證 CLAUDE.md 與各 CLAUDE.md 的數字一致
- 執行 `pnpm check:claude-sync --strict` 確認

產出驗證報告：`docs/codebase-analyze/11-verification/round-11-refresh-{YYYYMMDD}.md`

### Step 8: 更新 SUMMARY.md

使用 B.1 輕量模式刷新：

```bash
pnpm refresh:stats:apply
```

然後**手動**更新 SUMMARY.md 的人類可讀區塊：
- Codebase 規模概覽表格
- 分析文件清單（若有新增/刪除）
- 最嚴重的發現（若有新 Critical 問題）
- 後續建議

### Step 9: 執行 snapshot diff 產生變更清單

```bash
node scripts/snapshot-analysis.js diff pre-refresh-{YYYYMMDD} current > /tmp/refresh-diff.txt
cat /tmp/refresh-diff.txt
```

### Step 10: 產生 CHANGE-XXX 規劃文件

1. 從 `docs/codebase-analyze/.change-template.md` 複製為新檔案：
   ```
   claudedocs/4-changes/feature-changes/CHANGE-XXX-codebase-analysis-refresh-YYYYMMDD.md
   ```
2. 依 Step 9 的 diff 報告、Step 7 的驗證結果、Step 8 的統計變化填寫
3. §7「CLAUDE.md 更新建議」要列出 **所有需要手動同步的 CLAUDE.md**

### Step 11: 同步各 CLAUDE.md（依 CHANGE §7 指引）

根據 CHANGE-XXX 的 §7 清單，逐一更新需要同步的 CLAUDE.md：
- 根 CLAUDE.md 的 Project Metrics 區塊
- 受影響模組的子 CLAUDE.md 內的數字與描述

**不要自動覆蓋**整個 CLAUDE.md，只改變動部分。

### Step 12: 最終驗證

```bash
# 1. CLAUDE.md 與 SUMMARY.md 一致
rm -f .claude/.drift-cooldown.json
pnpm check:claude-sync

# 2. i18n 完整性
pnpm validate:i18n

# 3. TypeScript 型別
pnpm typecheck
```

### Step 13: 提交（由用戶決定）

**本命令不自動 commit**。完成後建議用戶：

```bash
git add docs/codebase-analyze/ CLAUDE.md '**/CLAUDE.md' claudedocs/4-changes/feature-changes/
git commit -m "docs(codebase-analysis): CHANGE-XXX — Refresh codebase analysis YYYY-MM-DD

- 更新 {N} 份分析文件
- SUMMARY.md machine-readable-stats 同步
- 新發現 {N} 個技術債務 / {N} 個 Critical 問題
- 詳見 claudedocs/4-changes/feature-changes/CHANGE-XXX-*.md

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## 中止與恢復

若執行中途遇到問題：

- **已建立快照但未完成分析** → 安全，下次重跑即可
- **部分 agent 失敗** → 重啟該 agent 繼續（snapshot 仍是原始狀態）
- **SUMMARY.md 已更新但 CLAUDE.md 未同步** → 執行 `pnpm check:claude-sync` 找出差異逐一修正

恢復用的快照在 `.claude/.analysis-snapshots/pre-refresh-{YYYYMMDD}/`，隨時可用於還原。

---

## 與 /itpm:refresh-stats 的關係

| 功能 | /itpm:refresh-stats | /itpm:refresh-codebase-analysis |
|------|---------------------|--------------------------------|
| 更新統計數字 | ✅ | ✅ |
| 更新分析文字描述 | ❌ | ✅ |
| 重跑驗證 | ❌ | ✅ |
| 產生 CHANGE 文件 | ❌ | ✅ |
| 用到 Agent | ❌（純腳本） | ✅（~20 個） |
| 時間 | < 1 分鐘 | 2-3 小時 |
| 頻率 | 任何時候 | 季度 / Epic 結束 |

**工作流程**：
- 平時（每週/每 FIX）：`/itpm:refresh-stats:apply`
- 累積漂移 or Epic 結束：`/itpm:refresh-codebase-analysis`
