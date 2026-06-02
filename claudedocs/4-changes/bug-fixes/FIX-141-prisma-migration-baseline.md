# FIX-141: 重建 Prisma Migration Baseline，恢復 `migrate dev` 流程

> **類型**: Chore / 基礎設施（Infrastructure）
> **日期**: 2026-06-02
> **負責人**: AI 助手（經使用者逐步確認破壞性操作）
> **狀態**: ✅ 本機 dev 完成並驗證；⏳ Azure 正式環境待團隊執行（見下方「正式環境同步」）

---

## 問題描述

`pnpm --filter db exec prisma migrate dev` 無法運作。執行時 Prisma 會建立 shadow database 重放 `packages/db/prisma/migrations/` 全部 migration 以驗證歷史一致性，但在第一個 migration 就失敗：

```
Error: P3006
Migration `20251126100000_add_currency` failed to apply cleanly to the shadow database.
Error code: P1014
The underlying table for model `BudgetPool` does not exist.
```

導致團隊只能用 `prisma db push` 套用 schema 變更（如 CHANGE-043），無法產生正式 migration 檔，並依賴 `health.ts` 的 schemaCompare/fixAllSchemaIssues 與 SCHEMA-SYNC 機制同步 Azure。

## 重現步驟

1. `pnpm --filter db exec prisma migrate dev --create-only --name test`
2. → P3006 / P1014（shadow DB 重放 `20251126100000_add_currency` 時 `BudgetPool` 不存在）

## 根本原因

1. **缺少建立 base tables 的 init migration**：base schema 當初是用 `prisma db push` 建立、未捕捉成 migration。最早的 `20251126100000_add_currency` 直接 `ALTER TABLE "BudgetPool" / "Project" / "Expense" / "PurchaseOrder"`，但**沒有任何前置 migration 建立這些表** → migration 歷史不自洽。
2. **migration 歷史半提交、半冪等**：7 個 migration 中只有 4 個曾被 git 追蹤（add_currency、feat007、feat008、change038），3 個從未提交；且 `_prisma_migrations` 的 8 列全部 `applied_steps_count = 0`、同一時間（2026-04-10）建立，代表它們是用 `migrate resolve --applied` 事後標記，從未真正透過 migrate engine 執行。
3. **無法用「保留 7 個 + 前置完整 init」修復**：migration #1（add_currency）、#6（permission_tables）、#7（change038）是**非冪等**的純 `CREATE TABLE`/`ADD COLUMN`。若前置含完整 schema 的 init，重放時會撞「column/table already exists」。#2~#5 用了 `IF NOT EXISTS` 可倖存，但 #1/#6/#7 會壞。→ 唯一乾淨解是 **squash 成單一 baseline init**。
4. **附帶發現：`.gitignore` 行內註解 bug**：第 289 行 `!packages/db/prisma/migrations/**/*.sql  # Allow...` —— `.gitignore` 不支援行內註解，`# Allow...` 變成 pattern 的一部分使反向規則失效，於是 `*.sql`（第 286 行）生效、**所有 migration SQL 被忽略**。這正是為何舊 migration 需 force-add、而新 init 不會被 `git add` 收進去 → 若不修，baseline 對其他環境/CI 無效。

## 解決方案（Squash Baseline）

採 Prisma 官方 baseline / squash 流程：

1. **產生 init**：以 git **HEAD** 的 `schema.prisma`（pre-FEAT-015，32 模型）執行 `prisma migrate diff --from-empty --to-schema-datamodel <HEAD schema> --script` → `packages/db/prisma/migrations/00000000000000_init/migration.sql`（**32 tables、59 FK**；FK 集中在最後 → shadow 重放無相依順序問題）。
2. **封存舊 7 個 migration** → `packages/db/prisma/_archived-migrations-pre-baseline/`（Prisma 不掃描，保留供對照）。
3. **重置 `_prisma_migrations`**（先備份）：`DELETE` 既有 8 列 + `prisma migrate resolve --applied 00000000000000_init`，使既有 dev DB 標記為已套用該 baseline（不重跑 SQL、不動既有資料、不 reset）。
4. **修正 `.gitignore`** 第 289 行，使 migration SQL 可進版控；並加一條 negation 讓封存 migration 亦可進版控（備份 dump 維持忽略，符合 repo dump 慣例）。

### Baseline 範圍決策（經使用者確認）

baseline init 取自 git **HEAD 的 schema（32 模型，pre-FEAT-015）**，**完全排除**當時進行中、僅以 `db push` 存在於 dev DB 的 **FEAT-015**（`ProjectExpense` / `ProjectExpenseItem` / `ProjectExpenseMonthly`，3 表皆空）。

理由：baseline init 若含 FEAT-015 三表，但其 model 定義仍在未提交的 `schema.prisma`，則 commit 後 git 樹會不一致（init 建表、HEAD schema 未定義 → 他人 checkout 後 `migrate dev` 會想刪表）。為產生**自洽且不含 FEAT-015 的 commit**，採以下處理：
- baseline 定在 HEAD（32 模型）。
- 從 dev DB **drop 3 個空的 FEAT-015 表**（0 筆資料，無風險）。
- FEAT-015 日後由使用者 `migrate dev --name <feat015...>` 產生**第一個正式 migration**——正是本任務要恢復的工作流。已驗證 `migrate diff [init@32] vs 工作區 schema@35` 會將 ProjectExpense* 三表列為「待建立」，工作流已就緒。

## 修改/新增的檔案

| 檔案 | 變更 |
|------|------|
| `packages/db/prisma/migrations/00000000000000_init/migration.sql` | **新增**：baseline（**32 tables / 59 FK**，pre-FEAT-015，取自 HEAD schema） |
| `packages/db/prisma/_archived-migrations-pre-baseline/` | **新增**：封存 7 個舊 migration + `_prisma_migrations_backup.sql`（dump，gitignored）+ README |
| `.gitignore` | 修正第 289 行行內註解 bug；新增封存 migration 的 negation |
| dev DB `_prisma_migrations` 表 | 重置為單一 `00000000000000_init` 記錄（既有資料表未動） |
| dev DB（schema） | drop 3 個空的 FEAT-015 表，使 dev DB == baseline@32（FEAT-015 待由 migrate dev 重建） |

> 7 個舊 migration 已從 `packages/db/prisma/migrations/` 移除（其中 4 個原被 git 追蹤，commit 時會顯示為刪除；內容保存在 `_archived-...` 與 git 歷史）。

## 驗證（本機 dev）

| 驗證 | 指令 | 結果 |
|------|------|------|
| init@32 重放 == dev DB | `migrate diff --from-migrations prisma/migrations --to-url <devDB> --shadow-database-url <scratch>` | ✅ 空 diff（dev DB == baseline，無 drift） |
| 狀態 | `prisma migrate status` | ✅ `Database schema is up to date!` |
| 部署路徑 | `prisma migrate deploy` | ✅ `No pending migrations to apply.` |
| 工作流就緒 | `migrate diff --from-migrations prisma/migrations --to-schema-datamodel <工作區 schema@35>` | ✅ 列出 ProjectExpense* 三表為待建立（FEAT-015 將成下個 migrate dev） |
| 原始 bug | `migrate dev --create-only` | ✅ 不再噴 P3006 |

> 「init@32 重放 == dev DB」為空 diff，等同證明在互動式終端跑 `migrate dev`（針對與 baseline 一致的 schema）會回報乾淨 no-op。Bash 工具無 TTY，無法直接跑互動式 `migrate dev`。

## 日後工作流（恢復後）

- **新 schema 變更**：改 `schema.prisma` → 在**互動式終端**跑 `pnpm --filter db exec prisma migrate dev --name <feat_or_fix>`（Bash/CI 等非互動環境用 `prisma migrate deploy`）→ 產生正式 migration 檔並自動套用 + regenerate Client。
- **FEAT-015 續作**：工作區 `schema.prisma` 仍含 FEAT-015 三模型；接續開發時直接 `prisma migrate dev --name feat015_project_expense` 即會產生其正式 migration 並在 dev DB 重建三表。

## 正式環境同步（Azure，⏳ 待團隊執行，屬破壞性/對外操作）

baseline init 為 pre-FEAT-015 的 32 模型，與正式環境現況（同樣未部署 FEAT-015）一致，故同步單純。每個既有環境（Azure 個人、Azure 公司）需把 `_prisma_migrations` 重置為單一 init 記錄：

1. 備份該環境 `_prisma_migrations`。
2. 確認 `migrate diff --from-url <prodDB> --to-schema-datamodel <HEAD schema>` 為空（schema 一致；如非空代表該環境另有 db-push drift，須先處理）。
3. `DELETE FROM "_prisma_migrations";` → `prisma migrate resolve --applied 00000000000000_init`。
4. `prisma migrate status` → up to date。

> 全新環境（fresh DB）則直接 `prisma migrate deploy` 即可由 init 建出完整 32 模型 schema。

## 回滾方式

dev DB 的 `_prisma_migrations` 可由備份還原；FEAT-015 三表可由工作區 schema 重建：
```bash
# 還原 _prisma_migrations
docker exec itpm-postgres-dev psql -U postgres -d itpm_dev -c 'DELETE FROM "_prisma_migrations";'
docker exec -i itpm-postgres-dev psql -U postgres -d itpm_dev < packages/db/prisma/_archived-migrations-pre-baseline/_prisma_migrations_backup.sql
# 還原 FEAT-015 三表（工作區 schema 仍定義它們）
pnpm --filter db db:push
```
並把 `_archived-migrations-pre-baseline/` 內 7 個 migration 移回 `migrations/`、刪除 `00000000000000_init/`、還原 `.gitignore`。

## 備註

- **未觸碰**進行中的 FEAT-015 / FIX-140 等未提交工作（經使用者確認「進行中勿動」）；baseline commit **完全不含 FEAT-015**（schema.prisma 的 FEAT-015 改動維持未提交）。
- 從 dev DB drop 的 3 個 FEAT-015 表皆為空（0 筆），使用者續作 FEAT-015 時由 `migrate dev` 重建。
- `.gitignore` 第 283 行（`!docs/**/*.pdf`）、第 288 行（`!scripts/init-db.sql`）有相同的行內註解 bug，但與本任務無關，依外科手術原則**僅提出未修改**。
- 解掉 DEVELOPMENT-LOG.md 中 CHANGE-043 條目記載的「repo 缺初始 migration → migrate dev shadow 重放失敗」基礎設施債。
