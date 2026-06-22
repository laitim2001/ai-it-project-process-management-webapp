# 12 — 公司 company/dev 升級到 HEAD + 啟用 Approval Workflow Runbook（2026-06）

> **狀態**：✅ **已執行完成（2026-06-22，分階段執行，使用者全程核准）**｜執行記錄見附錄 D
> **建立日期**：2026-06-22
> **觸發背景**：使用者回報「本地開發的 approval workflow（審批流程）功能，在 Azure company/dev 環境的 app 上看不到」。
> **前置文件**：本 runbook 直接延續
> - `docs/deployment/08-company-dev-deploy-runbook-2026-06.md`（首次部署 runbook / 工具鏈 / 資源名）
> - `docs/deployment/09-infra-issues-and-asks-2026-06.md`（infra 障礙 P1~P5）
> - `docs/deployment/10-schema-drift-analysis-2026-06.md`（漂移分析 + §6 修正 SQL）
> - `docs/deployment/11-schema-drift-prevention-guardrails.md`（漂移防範護欄）
>
> ⚠️ **本 runbook 涉及 production（UAT）操作。任何破壞性步驟在使用者核准前不執行。**

---

## 0. 一句話結論

> approval workflow **看不到，並非程式碼沒部署**，而是「功能的資料前置條件沒有隨程式碼補進線上 DB」。
> 線上映像 `v20260609-185714`（≈ commit `1d9ca99`）**幾乎確定已含 FEAT-014 程式碼與三張資料表**，但線上 DB **缺少 `menu:approval-workflows` 這筆權限記錄**（Sidebar 因此不顯示入口），且**沒有任何 active 審批流程資料**。本 runbook 同時處理：① 映像升級到目前 HEAD（含一批安全修復）、② 補套 CHANGE-052 migration、③ 補齊權限資料、④ 引導建立預設審批流程。

---

## 1. 差異盤點（線上 vs 目前 main HEAD）

線上基準：映像 `v20260609-185714`（commit `1d9ca99`，2026-06-09）
目前 HEAD：`e319f85`（落後 **28 個 commit**）

### 1.1 程式碼差異（映像落後 28 commit）

非文件類實質變更：

| 類別 | commit | 說明 | 重要度 |
|------|--------|------|--------|
| 🔴 安全 | `a1e0699` FIX-145 | 移除 VCS 中外洩的 NEXTAUTH_SECRET 明文 | 高 |
| 🔴 安全 | `2e243cc` FIX-145 | 移除版控中外洩的 `.env.local.backup` | 高 |
| 🔴 安全 | `34eb72b` FIX-146 | patch fast-xml-parser / jws / @trpc CVE；next 14.2.35 | 高 |
| 🔴 安全 | `b0ec837` FIX-147 | `user.getAll/getById` 移除 password hash 洩漏 | 高 |
| 🔴 安全 | `5d894e9` FIX-150 | 核心資源加物件級所有權檢查（IDOR） | 高 |
| 🔴 安全 | `1d904f1` FIX-152 | 收斂 health 診斷端點 + user 讀取端點權限 | 高 |
| 🔴 安全 | `940cece` FIX-151 | download/upload 物件級授權 + amount 驗證 | 高 |
| 功能 | `739daf8` CHANGE-052 | 預算提案多態目標（綁定 Project 或 OM Expense） | 中 |
| 其他 | `5f9b457` / `02e725c` CHANGE-051 | CI lint baseline gate | 低 |
| 其他 | `2f4ecd3` | budget-proposal 工作流 E2E 現代化 + 統一測試帳號密碼 | 低 |
| 其他 | `bd7070e` | 預設幣別找不到 TWD 時 fallback | 低 |

> **重點**：除了 approval workflow，線上映像還缺一整批**安全關鍵修復**。升級映像同時把這批安全修復一併上線。

### 1.2 資料庫 migration 差異

線上 `_prisma_migrations` 已套用（依 doc 08 §10.1 cutover 記錄）：

```
00000000000000_init                              （baseline，標記為已套用）
20260602034000_feat014_approval_workflow         ✅ 已套（建 ApprovalWorkflow/ApprovalStep/ProposalApprovalProgress）
20260602055236_security_default_role_projectmanager  ✅
20260602110000_feat015_project_expense           ✅
20260603032209_change048_om_monthly_hkd          ✅
20260604082438_change047_step_specific_user_approver ✅
```

HEAD 比線上**多一個 migration**：

```
20260616055230_change052_budget_proposal_polymorphic_target   ❌ 線上尚未套用
```

> ⚠️ CHANGE-052 migration 含一步 `ALTER COLUMN "ownerId" SET NOT NULL`（先 ADD 可空 → 回填 `= project.managerId` → 設 NOT NULL）。**若線上有孤兒 `projectId`（指向不存在的 Project）的提案，回填會留 NULL → SET NOT NULL 失敗**。→ Phase 0 必做 pre-flight 檢查（見 §5）。

### 1.3 權限資料差異 🔴（approval workflow 看不到的根因）

- 前端 Sidebar 顯示「審批流程」入口需要權限 `menu:approval-workflows`（Admin only）。
- 該權限由 `permission.getMyPermissions` 從 DB 的 `Permission` + `RolePermission` 表計算（**資料庫驅動**，非程式碼常數）。
- 這筆權限記錄**只在 `packages/db/prisma/seed.ts`（第 70、109 行）的 upsert 才會寫入**；FEAT-014 migration 只建表、**不插入任何 Permission 記錄**（已核對 `20260602034000_feat014_approval_workflow/migration.sql`，全為 CREATE TABLE / ADD COLUMN / INDEX / FK）。
- 容器啟動腳本 `docker/startup.sh` 的 inline seed **只建 Role 與 Currency**（第 60-101 行），**完全不碰 Permission 表**。
- 線上是 production 副本，**從未跑過完整 `seed.ts`**（且不能跑，理由見 §4.2）。

→ **線上 DB 幾乎確定缺少 `menu:approval-workflows` 權限與其對 Admin 的授權 → 連 Admin 登入，Sidebar 也不顯示審批流程入口。**

### 1.4 流程資料差異

- `seed.ts` **不建立任何 ApprovalWorkflow 流程資料**（已核對，無此段）。
- `budgetProposal.resolveWorkflow` 找 `isActive=true` 且 `steps.length>0` 的流程；找不到時**一般提案走舊單階段 fallback**（`budgetProposal.ts` 約 592、663-700 行）。
- → 線上即使補完權限、進得了配置頁，列表仍是空的；多階段審批要由 Admin 手動建立流程才會啟用（Phase 6）。

---

## 2. 根因分析（為何 approval workflow 看不到）— 四層

| 層 | 線上狀態 | 結論 |
|----|---------|------|
| ① 程式碼（映像） | ✅ 應已含 FEAT-014 前後端（v20260609 ≈ `1d9ca99` > FEAT-014 merge 06-09；doc 10 驗證 38/38 Prisma model OK） | 非問題 |
| ② 資料表 | ✅ ApprovalWorkflow/ApprovalStep/ProposalApprovalProgress 三表已由 feat014 migration 建立（doc 08 §10.1） | 非問題 |
| ③ **權限記錄** | ❌ 缺 `menu:approval-workflows`（migration 不插、startup seed 不含、完整 seed 未跑） | **根因 — Sidebar 不顯示入口** |
| ④ **流程資料** | ❌ 無 active workflow（seed 不建、需 Admin 手動） | 啟用多階段審批的最後一哩 |

> ③ 是「程式碼/工具鏈證據反推到幾乎確定」。**唯一 100% 坐實方式** = 查線上 DB 的 `Permission` / `RolePermission` 表（Phase 0 會在 ACI 內唯讀查詢確認）。

---

## 3. 目標與成功標準（可驗證）

1. 線上 web 映像 = HEAD（含 FIX-145~152 安全修復 + CHANGE-052）→ 驗證：`az webapp` 運行映像 tag 正確、HTTP health 200。
2. 線上 DB 套用 CHANGE-052 → 驗證：`migrate status` = up to date；`migrate diff`（對 HEAD schema）**ADD COLUMN = 0**（doc 11 硬閘門）。
3. 線上 DB 有 `menu:approval-workflows` 權限且授予 Admin → 驗證：ACI 唯讀 SQL 查得到該筆 + Admin 的 RolePermission。
4. Admin 登入線上 app → **Sidebar 出現「審批流程」入口**，配置頁可開、可建立流程。
5. 全程**零 production 業務資料污染**（不跑完整 seed、不動非 Permission/RolePermission 表）、**零資料破壞**（CHANGE-052 為 additive + 安全回填）。

---

## 4. 風險評估與護欄

### 4.1 CHANGE-052 的 `SET NOT NULL` 風險
- 護欄：Phase 0 pre-flight 檢查孤兒 `projectId`（見 §5 Phase 0-C）。回 0 筆才放行。

### 4.2 🔴 嚴禁在 production 跑完整 `seed.ts`
`seed.ts` 會：
- 注入大量測試資料（示範專案 `proj-erp-upgrade`、6 筆提案、5 家供應商、報價/採購/費用/評論/歷史）→ 污染 production。
- 建立弱密碼測試帳號（`admin@itpm.local/admin123` 等）。
- **第 848-855 行對 `bp-2024-it` 預算池做無條件 `increment` `usedAmount += 200000`**（非 upsert）→ 每跑一次就破壞一次金額正確性。

→ **補權限只能用「只動 `Permission` + `RolePermission` 兩張表」的 idempotent SQL**（附錄 A），不得整檔重跑 seed。

### 4.3 doc 11 漂移防範護欄（必須遵守）
- ✅ schema 只走 migration；company/dev 因 app 映像 schema-engine 失效，**用 migrate-runner ACI** 跑 `migrate deploy`。
- 🔴 **部署後硬閘門**：`migrate diff`（live DB → HEAD schema）**ADD COLUMN = 0**，否則代表仍缺欄位 → 會 500。
- ❌ 禁用 `health.fullSchemaSync` / `fullSchemaCompare`（hardcoded 清單 stale，且不含 approval 表）。
- ❌ 禁用 `prisma db push`。
- ✅ 驗證須到「登入後 API 層」（Prisma model sweep + 進 Sidebar 看入口），不可只看頁面 302/200。

### 4.4 Infra 前置阻擋項（doc 09）
- **P3 SP 權限**：執行前必須確認部署 SP 對 `RG-RCITest-RAPO-N8N`（Contributor）、`acritpmcompany`（AcrPush）、PostgreSQL 有足夠權限。doc 08 §10 最終 cutover 是在 SP 恢復為 `a19dfe76…` 後完成；**若目前 SP 仍是權限不足的 `2ae44f00…`，本 runbook 阻擋，需先處理 P3。**
- **P1 VM TLS**：部署 VM 無法對公司 PG 建 TLS → 所有 DB 操作走 **ACI**（已驗證可行），不在 VM 上直連。
- 本機無 `pg_dump/psql` → 備份用 Docker `postgres:18`（doc 08 §5）。
- Windows `az` 讀含中文 container log 會 cp1252 crash → ACI 輸出保持純 ASCII/SQL，或用 Cloud Shell。

---

## 5. 執行步驟

> 所有資源名以 doc 08 §1 為準：RG `RG-RCITest-RAPO-N8N`、App `app-itpm-company-dev-001`、ACR `acritpmcompany`（`acritpmcompany.azurecr.io`）、PG `psql-itpm-company-dev-001`、DB `itpm_dev`。
> `<TS>` = 執行當下的時間戳（請用實際值，勿用占位）。

### Phase 0 — Pre-flight（唯讀 + 備份，無破壞）

**0-A 取得 DATABASE_URL**
```bash
az webapp config appsettings list --name app-itpm-company-dev-001 -g RG-RCITest-RAPO-N8N \
  --query "[?name=='DATABASE_URL'].value" -o tsv
```

**0-B 設定 PITR 還原錨點**（記錄 UTC 時間，Azure 保留 7 天）
```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"   # 記下這個值作為回滾錨點
```

**0-C 🔴 孤兒 projectId 檢查（CHANGE-052 護欄）— 用 migrate-runner ACI 唯讀執行**
```sql
-- 期望結果：0 筆。非 0 則先處理孤兒提案，否則 CHANGE-052 的 SET NOT NULL 會失敗
SELECT bp.id, bp."projectId"
FROM "BudgetProposal" bp
LEFT JOIN "Project" p ON bp."projectId" = p.id
WHERE bp."projectId" IS NOT NULL AND p.id IS NULL;
```

**0-D 確認根因 ③（唯讀）— 查權限現狀**
```sql
-- 期望：升級前查無 menu:approval-workflows（或查無對 Admin 的授權）→ 坐實根因
SELECT code FROM "Permission" WHERE code = 'menu:approval-workflows';
SELECT r.name, COUNT(*) FROM "RolePermission" rp
JOIN "Role" r ON rp."roleId" = r.id
JOIN "Permission" p ON rp."permissionId" = p.id
WHERE p.category = 'menu' GROUP BY r.name;
```

**0-E L2 備份 `_prisma_migrations`**（migration 元資料，回滾用）
```sql
-- ACI 內：輸出到可保存位置，或先 SELECT 全表存檔
SELECT * FROM "_prisma_migrations" ORDER BY started_at;
```

> （可選，建議）整庫 `pg_dump` 黃金備份：用 Docker `postgres:18` 跑（doc 08 §5 Phase 1），保留至新版穩定 2 週。

### Phase 1 — 建置映像

**1-A 建 web 映像（HEAD）**
> ⚠️ 必須用**根目錄 `Dockerfile`**（`-f Dockerfile`），非 `docker/Dockerfile`。
> 後者 deps 階段缺 `COPY packages/db/prisma`，會在 `pnpm install` 的 root postinstall（`prisma generate`）失敗。
> 修復在根目錄 Dockerfile 的 `7e842e7`（deps 階段 line 20-22）。
```bash
WEB_IMAGE=acritpmcompany.azurecr.io/itpm-web:v20260622-e319f85
docker build -t $WEB_IMAGE -f Dockerfile .

# 驗證映像內容（doc 08 SITUATION-7）
docker run --rm $WEB_IMAGE ls /app/packages/db/prisma/migrations/   # 須見 init + 6 個 migration（含 change052）
```

**1-B 建 migrate-runner 映像（含 change052 migration + 補權限 SQL）**
- migrate-runner.Dockerfile 已 `COPY packages/db/prisma /work/prisma`（自動含 change052 migration）。
- 需**新增** `COPY docker/seed-permissions.sql /work/seed-permissions.sql`（內容見附錄 A；此檔在 Phase 1 前由本 runbook 核准後建立）。
```bash
MIG_VERSION=v$(date -u +%Y%m%d-%H%M%S)
MIG_IMAGE=acritpmcompany.azurecr.io/itpm-migrate:$MIG_VERSION
docker build -t $MIG_IMAGE -f docker/migrate-runner.Dockerfile .
```

**1-C 推送映像**
```bash
az acr login --name acritpmcompany
docker push $WEB_IMAGE
docker push $MIG_IMAGE
```

### Phase 2 — 套用 CHANGE-052 migration（migrate-runner ACI）

> 線上已 baseline 對齊完成，**不需再 baseline 重置**（doc 11 §F.3）。直接 `migrate deploy` 套 pending 的 change052。
> ⚠️ 不要跑 `migrate-baseline.sh`（那會 DELETE `_prisma_migrations`）。本 Phase 用單純 `migrate deploy`。

```bash
az container create \
  --resource-group RG-RCITest-RAPO-N8N \
  --name itpm-migrate-change052-<TS> \
  --image $MIG_IMAGE \
  --restart-policy Never \
  --secure-environment-variables DATABASE_URL="<company DB URL>" \
  --command-line "prisma migrate deploy --schema=/work/prisma/schema.prisma"

# 讀 log 確認：Applying migration 20260616055230_change052... / up to date
az container logs --resource-group RG-RCITest-RAPO-N8N --name itpm-migrate-change052-<TS>
```

驗證閘門：
```bash
# migrate status → up to date（7 個 migration 全 applied）
# migrate diff（live → HEAD schema）→ ADD COLUMN 數 = 0
```

### Phase 3 — 補齊權限資料（migrate-runner ACI，只動 Permission/RolePermission）

```bash
az container create \
  --resource-group RG-RCITest-RAPO-N8N \
  --name itpm-seed-perms-<TS> \
  --image $MIG_IMAGE \
  --restart-policy Never \
  --secure-environment-variables DATABASE_URL="<company DB URL>" \
  --command-line "psql \"$DATABASE_URL\" -v ON_ERROR_STOP=1 -f /work/seed-permissions.sql"

az container logs --resource-group RG-RCITest-RAPO-N8N --name itpm-seed-perms-<TS>
```

驗證：重跑 Phase 0-D 的查詢，確認 `menu:approval-workflows` 存在且 Admin 已授權。

### Phase 4 — 切換 web 映像 + 重啟

```bash
az webapp config container set --name app-itpm-company-dev-001 -g RG-RCITest-RAPO-N8N \
  --container-image-name $WEB_IMAGE
az webapp restart --name app-itpm-company-dev-001 -g RG-RCITest-RAPO-N8N
```

### Phase 5 — 驗證（必須到登入後 API 層）

```bash
APP=https://app-itpm-company-dev-001.azurewebsites.net
curl -s $APP/api/health/ping        # pong
curl -s $APP/api/health/dbCheck     # healthy
# 核心頁回 302（導登入）而非 500
for p in proposals projects om-expenses charge-outs settings/approval-workflows; do
  curl -s -o /dev/null -w "$p %{http_code}\n" $APP/zh-TW/$p
done
```

- 🔴 `migrate diff`（live → HEAD）ADD COLUMN = 0。
- HEAD Prisma Client 對 live DB model sweep（doc 08 §B.4）：38+ model OK、`budgetProposal.getAll` 正常回筆數。
- **人工驗證（關鍵）**：用 Admin 帳號登入線上 app →
  - Sidebar **出現「審批流程」** 入口；
  - 開 `/zh-TW/settings/approval-workflows` 頁面正常（非 500）。

### Phase 6 — 建立預設審批流程（啟用多階段審批）

> 非阻擋上線項（無 active workflow 時一般提案走舊單階段 fallback），但這是「真正啟用 FEAT-014」的最後一哩。

- **建議做法**：Admin 登入 → 審批流程配置頁 → 建立一條 `isActive` 流程 + 有序步驟（每步指定角色/指定用戶）。步驟數與審批者由業務決定。
- （可選）若要用 SQL 直接建一條最小流程，見附錄 C（需先確認業務要幾步、誰審批）。

---

## 6. 驗證清單（Phase 5 完成後逐項勾選）

- [ ] web 運行映像 tag = 本次 `$WEB_IMAGE`
- [ ] `migrate status` = up to date（含 change052）
- [ ] `migrate diff`（live → HEAD）ADD COLUMN = 0
- [ ] `menu:approval-workflows` 權限存在且授予 Admin（ACI SQL 確認）
- [ ] Admin 登入 → Sidebar 出現「審批流程」
- [ ] `/zh-TW/settings/approval-workflows` 可開、非 500
- [ ] `budgetProposal.getAll` 正常（無 500）
- [ ] 安全修復生效抽查：`user.getAll` 不回傳 password hash（FIX-147）
- [ ] 無 production 業務資料被污染（Phase 3 只動 Permission/RolePermission）

---

## 7. 回滾預案（依 doc 08 §7）

**L1 應用層回滾（首選，1–3 分，無資料影響）** — 新映像頁面異常時：
```bash
az webapp config container set --name app-itpm-company-dev-001 -g RG-RCITest-RAPO-N8N \
  --container-image-name acritpmcompany.azurecr.io/itpm-web:v20260609-185714
az webapp restart --name app-itpm-company-dev-001 -g RG-RCITest-RAPO-N8N
```
> 註：補了 change052 + permission 後回舊映像 `v20260609`，因變更皆 additive，舊映像對新 DB 向前相容（舊映像不讀 ownerId/omExpenseId 也能運作）。

**L2 migration 元資料還原** — Phase 2 失敗時：用 Phase 0-E 備份還原 `_prisma_migrations`。

**L3 PITR 時間點還原** — 資料疑損（理論上本次無需）：用 Phase 0-B 錨點 `az postgres flexible-server restore` 還原成新 server，改 App `DATABASE_URL` 指向。

---

## 8. 後續待辦（不在本次範圍，另行 doc-first 提案）

- **FIX-A**：修 app 映像 schema-engine（讓 startup `migrate deploy` 可用，免長期依賴 migrate-runner ACI）。
- **FIX-B**：startup migrate 失敗不再被 `set +e` 靜默吞（doc 11）。
- **FIX-C**：`fullSchemaSync` 加護欄 / 棄用。
- 🔴 **安全**：`admin@itpm.local` 仍為種子弱密碼 `admin123` → 上線後立即改；清理公司 DB 中的 `*@example.com` 測試帳號（doc 08 §10 收尾）。
- 殘留快照 server `psql-itpm-company-dev-001-predeploy` 穩定後清理。

---

## 附錄 A — `docker/seed-permissions.sql`（補權限，idempotent，只動 Permission/RolePermission）

> 邏輯對齊 `packages/db/prisma/seed.ts` 第 47-161 行。用 `Role.name` 匹配（不依賴 role id 數值）。
> `ON CONFLICT` 確保：已存在的權限/授權不重複、缺失的補上。**不碰任何業務資料表。**
> 此檔在本 runbook 核准後、Phase 1-B 前建立。

```sql
BEGIN;

-- 1) 補齊 18 個 menu permission（idempotent）
INSERT INTO "Permission" (id, code, name, category, description, "isActive", "sortOrder", "createdAt", "updatedAt") VALUES
  (gen_random_uuid()::text, 'menu:dashboard',             '儀表板',     'menu', '訪問儀表板頁面',                         true, 100, now(), now()),
  (gen_random_uuid()::text, 'menu:budget-pools',          '預算池',     'menu', '訪問預算池管理頁面',                     true, 200, now(), now()),
  (gen_random_uuid()::text, 'menu:projects',              '專案',       'menu', '訪問專案管理頁面',                       true, 210, now(), now()),
  (gen_random_uuid()::text, 'menu:proposals',             '提案',       'menu', '訪問預算提案頁面',                       true, 220, now(), now()),
  (gen_random_uuid()::text, 'menu:vendors',               '供應商',     'menu', '訪問供應商管理頁面',                     true, 300, now(), now()),
  (gen_random_uuid()::text, 'menu:quotes',                '報價單',     'menu', '訪問報價單頁面',                         true, 310, now(), now()),
  (gen_random_uuid()::text, 'menu:purchase-orders',       '採購單',     'menu', '訪問採購單管理頁面',                     true, 320, now(), now()),
  (gen_random_uuid()::text, 'menu:expenses',              '費用',       'menu', '訪問費用管理頁面',                       true, 330, now(), now()),
  (gen_random_uuid()::text, 'menu:om-expenses',           'OM 費用',    'menu', '訪問 OM 費用管理頁面',                   true, 340, now(), now()),
  (gen_random_uuid()::text, 'menu:om-summary',            'OM 總覽',    'menu', '訪問 OM 總覽報表頁面',                   true, 350, now(), now()),
  (gen_random_uuid()::text, 'menu:charge-outs',           '費用轉嫁',   'menu', '訪問費用轉嫁管理頁面',                   true, 360, now(), now()),
  (gen_random_uuid()::text, 'menu:users',                 '用戶管理',   'menu', '訪問用戶管理頁面',                       true, 400, now(), now()),
  (gen_random_uuid()::text, 'menu:operating-companies',   '營運公司',   'menu', '訪問營運公司管理頁面',                   true, 410, now(), now()),
  (gen_random_uuid()::text, 'menu:om-expense-categories', 'OM 費用類別','menu', '訪問 OM 費用類別管理頁面',               true, 420, now(), now()),
  (gen_random_uuid()::text, 'menu:currencies',            '幣別',       'menu', '訪問幣別管理頁面',                       true, 430, now(), now()),
  (gen_random_uuid()::text, 'menu:approval-workflows',    '審批流程',   'menu', '訪問審批流程配置頁面（FEAT-014，僅 Admin）', true, 435, now(), now()),
  (gen_random_uuid()::text, 'menu:data-import',           'OM 數據導入','menu', '訪問 OM 數據導入頁面',                   true, 440, now(), now()),
  (gen_random_uuid()::text, 'menu:project-data-import',   '專案數據導入','menu','訪問專案數據導入頁面',                   true, 450, now(), now()),
  (gen_random_uuid()::text, 'menu:settings',              '設定',       'menu', '訪問個人設定頁面',                       true, 500, now(), now())
ON CONFLICT (code) DO UPDATE SET
  name        = EXCLUDED.name,
  category    = EXCLUDED.category,
  description = EXCLUDED.description,
  "sortOrder" = EXCLUDED."sortOrder",
  "isActive"  = true,
  "updatedAt" = now();

-- 2) Admin：全部 menu 權限
INSERT INTO "RolePermission" (id, "roleId", "permissionId", "createdAt")
SELECT gen_random_uuid()::text, r.id, p.id, now()
FROM "Role" r CROSS JOIN "Permission" p
WHERE r.name = 'Admin' AND p.category = 'menu'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- 3) Supervisor：除 menu:users 與 menu:approval-workflows
INSERT INTO "RolePermission" (id, "roleId", "permissionId", "createdAt")
SELECT gen_random_uuid()::text, r.id, p.id, now()
FROM "Role" r CROSS JOIN "Permission" p
WHERE r.name = 'Supervisor' AND p.category = 'menu'
  AND p.code NOT IN ('menu:users', 'menu:approval-workflows')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- 4) ProjectManager：11 個核心
INSERT INTO "RolePermission" (id, "roleId", "permissionId", "createdAt")
SELECT gen_random_uuid()::text, r.id, p.id, now()
FROM "Role" r CROSS JOIN "Permission" p
WHERE r.name = 'ProjectManager' AND p.code IN (
  'menu:dashboard','menu:budget-pools','menu:projects','menu:proposals',
  'menu:vendors','menu:quotes','menu:purchase-orders','menu:expenses',
  'menu:om-expenses','menu:om-summary','menu:settings'
)
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

COMMIT;
```

> 範圍說明：此 SQL 會把線上 menu 權限**對齊到 seed.ts 的完整 18 項定義**。除 `menu:approval-workflows` 外，若線上還缺其他 FEAT-011 之後新增的 menu 權限（如 `menu:om-summary`），亦會一併補上 —— 這是預期且安全的。

---

## 附錄 B — CHANGE-052 migration SQL（供 review，Phase 2 套用內容）

來源：`packages/db/prisma/migrations/20260616055230_change052_budget_proposal_polymorphic_target/migration.sql`

```sql
-- projectId 改可選、重建 FK（ON DELETE SET NULL）
ALTER TABLE "BudgetProposal" DROP CONSTRAINT "BudgetProposal_projectId_fkey";
ALTER TABLE "BudgetProposal" ADD COLUMN "omExpenseId" TEXT, ADD COLUMN "ownerId" TEXT,
  ALTER COLUMN "projectId" DROP NOT NULL;
-- 回填 ownerId = 所屬專案 managerId（維持授權行為不變）
UPDATE "BudgetProposal" bp SET "ownerId" = p."managerId"
  FROM "Project" p WHERE bp."projectId" = p."id" AND bp."ownerId" IS NULL;
-- 回填後設 NOT NULL（若仍有 NULL 此步會失敗 → 預期的安全護欄，見 Phase 0-C）
ALTER TABLE "BudgetProposal" ALTER COLUMN "ownerId" SET NOT NULL;
-- OMExpense 核准回寫欄位
ALTER TABLE "OMExpense" ADD COLUMN "approvalStatus" TEXT, ADD COLUMN "approvedBudget" DOUBLE PRECISION;
CREATE INDEX "BudgetProposal_omExpenseId_idx" ON "BudgetProposal"("omExpenseId");
CREATE INDEX "BudgetProposal_ownerId_idx" ON "BudgetProposal"("ownerId");
ALTER TABLE "BudgetProposal" ADD CONSTRAINT "BudgetProposal_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BudgetProposal" ADD CONSTRAINT "BudgetProposal_omExpenseId_fkey"
  FOREIGN KEY ("omExpenseId") REFERENCES "OMExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BudgetProposal" ADD CONSTRAINT "BudgetProposal_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

---

## 附錄 C — （可選）SQL 建立一條最小審批流程

> 僅在不便用 UI 配置時使用；步驟數/審批角色須先由業務確認。以下為「單步、由 Supervisor 審批」範例。

```sql
-- 範例：建立一條 active 預設流程，含 1 步（Supervisor 審批）
WITH wf AS (
  INSERT INTO "ApprovalWorkflow" (id, name, "isActive", "isDefault", "matchPriority", "createdAt", "updatedAt")
  VALUES (gen_random_uuid()::text, '預設審批流程', true, true, 0, now(), now())
  RETURNING id
)
INSERT INTO "ApprovalStep" (id, "workflowId", sequence, "approverRoleId", name)
SELECT gen_random_uuid()::text, wf.id, 1, r.id, '主管審批'
FROM wf, "Role" r WHERE r.name = 'Supervisor';
```

> ⚠️ CHANGE-047 後 `ApprovalStep` 另有 `approverUserId`（指定用戶二擇一）。此範例用角色審批；以實際 schema 欄位為準。

---

---

## 附錄 D — 執行記錄（2026-06-22 完成）

分階段執行，使用者全程核准。實際結果：

- **Phase 0 pre-flight**（唯讀 ACI）：migration 6 筆（到 change047）、孤兒 projectId=0、`menu:approval-workflows` 不存在（坐實根因③）、三張 approval 表存在、PM/Supervisor menu 權限各僅 4（殘缺，超出原預期 → 一併修復）。
- **Phase 1 build/push**：`itpm-web:v20260622-e319f85`（HEAD `e319f85`）+ `itpm-migrate:v20260622-e319f85`。
- **Phase 2 change052**：migrate-runner ACI `migrate deploy` → 7 筆 migration、ownerId 回填 8 筆 0 孤兒、**硬閘門 ADD_COLUMN_COUNT=0**（DROP_COLUMN=4 屬 DB 多出之 deprecated 欄位，無害不處理）。
- **Phase 3 補權限**：`seed-permissions.sql` via ACI → Permission 18→19、RolePermission 26→47、Admin 19 / Supervisor 17 / ProjectManager 11、`menu:approval-workflows` isActive=t。**14 業務表筆數補權限前=後（transaction data 零變動）**。
- **Phase 4 切映像**：`container set` → `v20260622-e319f85` + restart → login 200、核心頁 302（非 500）。
- **Phase 5 驗證**：自動化部分通過（migrate diff ADD COLUMN=0 + login 200 + 核心頁非 500）；登入後 UAT 由 Admin 執行。

### 與原規劃的差異（執行中修正）

1. **web 映像用根目錄 `Dockerfile`**（非 `docker/Dockerfile`）：後者 deps 階段缺 `COPY packages/db/prisma`，root postinstall 的 `prisma generate` 失敗；fix 在根目錄 Dockerfile（`7e842e7`）。§1-A 已更正。
2. **health 端點**：`/api/health/ping` 等 REST 路徑不存在（404）；health 走 tRPC。改以 `/zh-TW/login`(200) + 核心頁(302) 驗證 app 啟動。
3. **新增 `docker/verify-schema.sh`**：Windows `az.cmd` 對複雜 `--command-line`（多雙引號+分號）會二次解析爆、且 `az container logs` 對 prisma 的 Unicode 輸出 cp1252 crash → 把 migrate diff 硬閘門封裝成腳本、輸出純 ASCII 計數。
4. **`docker/seed-permissions.sql` 加 BEFORE/AFTER 業務表計數**：提供 transaction data 零變動的鐵證（應使用者要求）。
5. **ACI `instanceView.currentState` 查詢延遲**：create 後輪詢常回 null，以 `az container logs` + DB ground truth 為主要驗證依據。
6. **`.gitignore`**：原 `*.sql` 規則會忽略部署 SQL，已加例外 `!docker/*.sql`。

### 待辦
- [ ] Admin 最終 UAT（登入看 Sidebar 審批流程入口、proposals 操作）
- [ ] Phase 6：Admin 建立 active workflow（附錄 C；否則一般提案走舊單階段 fallback）
- [ ] 安全：改 `admin@itpm.local` 弱密碼 `admin123`；清理公司 DB 的 `*@example.com` 測試帳號

---

**維護者**：Development Team + AI Assistant
**狀態**：✅ 已執行完成（2026-06-22）
