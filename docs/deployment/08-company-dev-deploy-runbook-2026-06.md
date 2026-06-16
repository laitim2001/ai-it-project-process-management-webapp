# 08 - 公司環境部署 Runbook（HEAD → company/dev, 2026-06）

> **類型**: 部署執行 Runbook（單次，含可重複的備份 / 回滾 / 資料轉移機制）
> **建立日期**: 2026-06-09
> **狀態**: 📋 待 review / 核准（**核准前不執行任何 build / push / DB 變更**）
> **目標環境**: 公司 Azure — `company/dev`（目前作為 UAT）
> **本次來源**: `main` HEAD（`1d9ca99`）→ 取代線上 `v20260504-123857`
> **權威流程依據**: `claudedocs/6-ai-assistant/prompts/SITUATION-7-AZURE-DEPLOY-COMPANY.md`、`claudedocs/4-changes/bug-fixes/FIX-141-prisma-migration-baseline.md`、`docs/deployment/04-rollback.md`、`docs/deployment/06-uat-to-prd-data-migration.md`

---

## 0. 一句話總結

這次不是「build → restart」的常規更新：HEAD 已用 **FIX-141 把 migration 歷史重立基線**，線上公司 DB 還是舊歷史，所以**必須先對齊 migration baseline，再讓 5 個新 migration 乾淨套用**。所有新 migration 都是 **additive（加表 / 加欄位），對現有資料零破壞**；但仍以「先備份、可回滾」為前提執行。

---

## 0.1 執行方式重大變更（2026-06-10，實測後）— ⚠️ 取代 §5/§6 的「本機直連」流程

實際執行時發現兩個基礎設施限制，導致**無法從這台部署 VM 直接操作 DB**，故改採 **ACI migration runner**：

| 發現 | 證據 | 影響 |
|------|------|------|
| **① 部署 VM 無法對公司 PG 建立 TLS** | `sslmode=disable` 可達 pg_hba（防火牆已加本機 IP `52.187.129.166` 並生效），但 `sslmode=require` 一致 SSL eof（psql + prisma + `gssencmode=disable` 皆同）。App Service 連同個 DB 正常 → 為本 VM egress 網路政策（疑 TLS 檢查），非 DB 端 | 備份 / baseline / migrate **不能從本機跑** |
| **② App 映像無法執行 `prisma migrate`** | 映像為 alpine openssl-3.0，但只含 `schema-engine-linux-musl`（openssl-1.1.x）→ `prisma --version`/`migrate` exit 127。既有「啟動跑 migrate deploy」一直失敗被 `set +e` 容忍，靠 `fullSchemaSync` 補；但 `schemaDefinition.ts` 未含 FEAT-014/015 新表 → fullSchemaSync 也補不出來 | **無任何映像內路徑**能套用本次 schema |

**改採方案（經使用者選定）**：建專用 **migration runner 映像**（`docker/migrate-runner.Dockerfile`：debian + 全新 `prisma@5.22.0`〔正確 debian-openssl-3.0.x engine〕+ schema/migrations + psql），push 到 ACR，於 **Azure 內部以 ACI 執行**（容器網路無 VM 的 TLS 限制）。

**修正後執行順序**：
```
P1 ✅ build/push app 映像 v20260609-185714（已完成）
P2 ✅ build/push migration runner 映像 itpm-migrate:<tag>
P3 ⬜ 連線測試 ACI（預設 CMD = prisma migrate status,唯讀)→ 確認 ACI 能連 PG
P4 ⬜ 〔停機窗口開始〕az webapp stop
P5 ⬜ migration ACI:sh /work/migrate-baseline.sh（印舊 _prisma_migrations → DELETE → resolve init → migrate deploy → status）
P6 ⬜ az webapp config container set → app 映像 v20260609-185714 → az webapp start〔窗口結束〕
P7 ⬜ 部署後驗證（health/頁面/API/FEAT-014/015）
清理 ⬜ 刪除測試 ACI 與 migration ACI；視情況刪 migration 映像
備份 ⏳ 黃金 pg_dump 延後(待 infra 解決 egress);Azure PITR(7 天)為現行安全網
```
> 可逆性:migration runner 的 STEP 1 會先印出舊 `_prisma_migrations`(含 checksum)到 ACI log → 必要時可重建該元資料表。業務資料全程不被 migration 觸碰。

---

## 1. 範圍與目標

| 項目 | 內容 |
|------|------|
| **本次要做** | 把 `main` HEAD 部署到 `app-itpm-company-dev-001`（company/dev，UAT），**不影響現有資料** |
| **同時建立** | ① 部署前 backup 機制 ② 明確 rollback 路線 ③ 可重複的 **UAT→PRD 資料轉移**能力（為日後 PRD 上線預備） |
| **本次不做** | 不 provision PRD（目前 RG 內無 prod 資源）；UAT→PRD 實際搬遷待 PRD 環境建立後另排（見 §8） |

### 1.1 目標環境資源（已驗證可連線）

| 資源 | 值 |
|------|------|
| Subscription | `Microsoft Azure (rcitest): #1023861`（`30dac177-…`） |
| Resource Group | `RG-RCITest-RAPO-N8N`（eastasia） |
| App Service | `app-itpm-company-dev-001` |
| ACR | `acritpmcompany`（`acritpmcompany.azurecr.io/itpm-web`，Basic, admin enabled） |
| PostgreSQL | `psql-itpm-company-dev-001`（**v18**, Burstable B1ms, 32GB） |
| Storage | `stitpmcompanydev001`（容器：`quotes` / `invoices`；proposals 視設定） |
| 線上 URL | https://app-itpm-company-dev-001.azurewebsites.net |
| 目前線上映像 | `acritpmcompany.azurecr.io/itpm-web:v20260504-123857` |

---

## 2. 版本落差盤點（Step 1 結果）

- **線上版本**：`v20260504-123857`，對應 commit `67e2e21`（FIX-139, 2026-05-04）
- **本次目標**：`main` HEAD `1d9ca99`（2026-06-09）
- **落差**：**37 個 commit**；`schema.prisma` +295 行（**32 → 38 models**，新增 6 表）

### 2.1 這段期間的 migration 變更（438c48d..HEAD）

migration 歷史被 **FIX-141 重立基線**：舊的 7 個 migration squash 成單一 `00000000000000_init`（32 表 baseline），之後再長出 5 個新 migration：

| # | Migration | 內容 | 資料影響 |
|---|-----------|------|----------|
| baseline | `00000000000000_init` | 32 表 baseline（= 線上現有 schema） | 線上**不重跑**（用 `migrate resolve --applied` 標記） |
| 1 | `20260602034000_feat014_approval_workflow` | FEAT-014 簽核流程（新表，含 ApprovalStep / ProposalApprovalProgress 等） | 加表，空 → 無影響 |
| 2 | `20260602055236_security_default_role_projectmanager` | `ALTER COLUMN "User"."roleId" SET DEFAULT 2` | **只改未來新列預設值**，不動現有 User |
| 3 | `20260602110000_feat015_project_expense` | FEAT-015 ProjectExpense / ProjectExpenseItem / ProjectExpenseMonthly（3 新表） | 加表，空 → 無影響 |
| 4 | `20260603032209_change048_om_monthly_hkd` | OM 月度 HKD 欄位 | 加欄位 → 無影響 |
| 5 | `20260604082438_change047_step_specific_user_approver` | ApprovalStep / ProposalApprovalProgress 加 `approverUserId`、放寬 NOT NULL、重建 FK | 對象為 FEAT-014 新表（空）→ 無影響 |

> 全 5 個 migration **無 `DELETE` / `UPDATE 既有業務列` / `TRUNCATE`**，皆為 additive。

---

## 3. 核心風險（務必理解）

### 🔴 風險 A：migration baseline 對不上（本次最關鍵）

線上公司 DB 的 `_prisma_migrations` 是 **FIX-141 之前的舊歷史**（add_currency / feat007 / feat008 / change038 …）。HEAD 的 migrations 目錄是 **重立基線後**的（`00000000000000_init` + 5 新）。若直接讓新映像啟動跑 `prisma migrate deploy`：

- `00000000000000_init` 不在 DB 歷史 → Prisma 會嘗試「套用」它 → 內含整套 `CREATE TABLE` → **撞「table already exists」失敗**；
- 舊歷史那幾個 migration 在 DB 有、但 migrations 目錄已無 → Prisma 報「applied migration 不在資料夾」。

→ **解法**：部署前先對公司 DB 套用 **FIX-141 baseline 對齊**（見 §6 Phase 2）。

### 🔴 風險 B：`fullSchemaSync` 對本次新表「視而不見」（安全網失效）

平常 SITUATION-7 仰賴 `health.fullSchemaSync` 當部署後救援，但它的 SSOT `packages/api/src/lib/schemaDefinition.ts` **這次只改了 import 一行，並未納入 FEAT-014 / FEAT-015 的新表**（已確認不含 `ApprovalStep` / `ProjectExpense*`）。

→ 後果：`fullSchemaCompare` 會**誤報 synced**、`fullSchemaSync` **不會建出新表**。
→ **這次必須靠正規 migration（Phase 2+3）把 schema 弄對，不能依賴 fullSchemaSync 救援。**

### 🟡 風險 C：Dockerfile 版本

SITUATION-7（公司）用**根目錄 `Dockerfile`** + `docker-entrypoint.sh`；個人環境手冊用 `docker/Dockerfile` + `startup.sh`。本次沿用公司歷史（根目錄 `Dockerfile`），但**build 後必驗證映像內含 `migrations/` 與正確 Prisma engine`**（§6 Phase 4）。→ 見 §9 決策 3。

### 🟠 風險 D（已發現並修正）：Dockerfile `deps` 階段缺 Prisma schema → build 失敗

2026-06-09 首次 build 失敗於 `deps` 階段：根 `package.json` 有 `postinstall: pnpm db:generate`（2025-10-02 起存在），會在 `pnpm install` 後跑 `prisma generate`，但 `deps` 階段只 `COPY package.json` 未複製 `packages/db/prisma/` → `Could not find Prisma Schema` → install 失敗。**根 `Dockerfile` 與 `docker/Dockerfile` 皆有此缺陷**（先前能建置疑為他機 layer cache 掩蓋）。

**修正（已套用，經使用者核准）**：根 `Dockerfile` 的 `deps` 階段、`pnpm install` 之前加一行：
```dockerfile
COPY packages/db/prisma ./packages/db/prisma
```
只動 build 階段、不影響執行期 / 業務碼 / migration。後續 PRD 部署若改用 `docker/Dockerfile` 需同樣補上。

---

## 4. 資料安全分析（為何「現有資料零影響」）

1. **業務資料存在 PostgreSQL flexible server**，與容器生命週期解耦；換映像 / 重啟**不動資料**。
2. **5 個 migration 全 additive**（§2.1）：只加表 / 加欄位 / 改未來預設值；無刪除或改寫既有列。
3. **baseline 對齊只動 `_prisma_migrations`**（migration 元資料表，會先備份），**不碰任何業務表**。
4. **Seed 為冪等 upsert**（Role / Currency），重跑不覆蓋既有資料。
5. **檔案在 Blob**（`stitpmcompanydev001`），本次不動。

> 結論：在「先備份 + 走正規 migration」前提下，這次部署對現有資料的風險屬**低**。剩餘風險集中在 §3 風險 A（流程做錯會 500，但資料不丟）。

---

## 5. 備份策略（部署前，Phase 1 執行）

> 三層備份，缺一不可。本機（Azure VM，公網 IP `20.212.90.174`）已在 PG 防火牆白名單 `AllowDevMachine`，可直連公司 DB。

| 層 | 備份方式 | 用途 |
|----|----------|------|
| **L1 黃金 dump** | `pg_dump --format=custom` 整庫（含 `_prisma_migrations`、序列） | 最強回滾依據；亦為日後 UAT→PRD 的來源（§8） |
| **L2 migration 元資料** | 單獨 dump `_prisma_migrations`（CSV / SQL） | baseline 對齊出錯時可單表還原 |
| **L3 Azure PITR** | 平台自動備份（保留 **7 天**，earliest restore 2026-06-03） | 災難情境的時間點還原（建立新 server） |

⚠️ **PITR 限制**（已查證）：保留 **7 天**、`geoRedundantBackup=Disabled`、`HA=Disabled`。→ **不可只靠 PITR**，L1 黃金 dump 必做。

**前置需求（已查證並調整）**：本機**未安裝** `pg_dump` / `pg_restore` / `psql` / `azcopy`。→ 改用 **Docker `postgres:18` 映像跑 `pg_dump`**（本機 Docker 已就緒，免安裝；容器走主機網路 egress，PG 防火牆白名單 `20.212.90.174` 適用）。Migration 對齊（Phase 2/3）用 **Prisma engine**（`pnpm prisma`，不需 PG client）。DB 連線字串由 appsettings 取得（`DATABASE_URL` 為 plaintext，執行時遮蔽）。

> **L1 替代方案**：若不想本機落地 dump 檔，可改用 **Azure PITR 還原成預部署快照 server**（`az postgres flexible-server restore` → `psql-itpm-company-dev-001-predeploy`）當作可還原備份。兩者擇一或併用。

---

## 6. 部署程序（分階段，每階段有驗證閘門）

> 全程在本機（PowerShell / az / docker / pnpm）執行。

**🔒 鎖定執行順序（最小停機，依 §9 決策）**：先做非破壞性的 build/push（線上不受影響），再進停機窗口。
```
Phase 0  前置確認（唯讀）
Phase 1  Build 映像 + 驗證內容 + push ACR        ← 非破壞性，App 仍運行
─────────── ⏸ 此處停下，等使用者指定停機窗口 ───────────
Phase 2  【窗口開始】az webapp stop → 三層備份
Phase 3  FIX-141 baseline 對齊（只動 _prisma_migrations）
Phase 4  migrate deploy 5 個新 migration
Phase 5  container set 新映像 → az webapp start  【窗口結束】
Phase 6  部署後驗證
```
> 下方各 Phase 內文仍以「備份→對齊→build」的邏輯順序撰寫；實際執行以上方鎖定順序為準（build 提前到停機前以縮短 downtime）。每個破壞性步驟前 AI 會停下確認。

### Phase 0 — 前置確認（唯讀）
- [ ] `az account show` = 正確訂閱；本機 `docker version` 正常（已驗證 27.4/29.5）
- [ ] 確認可用 Docker `postgres:18` 跑 pg_dump（本機未裝 PG client，改走容器）
- [ ] 取得 DB 連線字串：`az webapp config appsettings list --name app-itpm-company-dev-001 -g RG-RCITest-RAPO-N8N --query "[?name=='DATABASE_URL'].value" -o tsv`
- [ ] 本機 repo 在 `main` HEAD、工作區乾淨；`.dockerignore` 未排除 `migrations`；`schema.prisma` 含 `linux-musl-openssl-3.0.x`

### Phase 1 — 備份（§5 三層；pg_dump 走 Docker `postgres:18`，免安裝）
```bash
# L1 整庫黃金 dump（-v 掛載當前目錄輸出 dump 檔）
docker run --rm -v ${PWD}:/backup postgres:18 pg_dump \
  "host=psql-itpm-company-dev-001.postgres.database.azure.com port=5432 dbname=<DB> user=<USER> password=<PWD> sslmode=require" \
  --format=custom --no-owner --no-privileges --verbose -f /backup/company_dev_full_<TS>.dump
# L2 _prisma_migrations 單表備份
docker run --rm -v ${PWD}:/backup postgres:18 pg_dump "<同上連線>" \
  --table='_prisma_migrations' --data-only -f /backup/company_dev_prisma_migrations_<TS>.sql
# L3 記錄 PITR 時間點（部署開始前的 UTC 時間）→ 寫入本檔末「執行記錄」
```
- [ ] 驗證：`docker run --rm -v ${PWD}:/backup postgres:18 pg_restore --list /backup/company_dev_full_<TS>.dump` 可列出內容
- [ ]（替代）或改用 Azure PITR 還原成 `…-predeploy` server 作為備份

### Phase 2 — FIX-141 baseline 對齊（對公司 DB；只動 `_prisma_migrations`）
> 依 FIX-141「正式環境同步」段。先確認 schema 一致（無 db-push drift），再重置 migration 歷史標記。
```bash
# 2.1 確認線上 schema == baseline init（應為空 diff；非空代表有 drift，須先處理、暫停）
pnpm --filter db exec prisma migrate diff \
  --from-url "<company DB URL>" \
  --to-schema-datamodel packages/db/prisma/migrations/00000000000000_init/migration.sql ... # 或對 pre-FEAT-014 schema
# 2.2 重置 _prisma_migrations，標記 init 為已套用（不重跑 SQL、不動業務資料）
#     DELETE FROM "_prisma_migrations";
pnpm --filter db exec prisma migrate resolve --applied 00000000000000_init   # DATABASE_URL=company DB
```
- [ ] **閘門**：`prisma migrate status` 顯示僅 `00000000000000_init` 已套用、其餘 5 個 pending

### Phase 3 — 套用 5 個新 migration（schema 變更實際發生處）
```bash
DATABASE_URL="<company DB URL>" pnpm --filter db exec prisma migrate deploy
```
- [ ] **閘門**：`migrate status` = up to date；`migrate diff --from-url <company DB> --to-schema-datamodel schema.prisma` 為**空**
- [ ] 抽查：`SELECT count(*) FROM "ApprovalStep";`、`"ProjectExpense"` 等新表存在（空表 OK）

### Phase 4 — Build 映像 + 驗證內容 + 推 ACR
```bash
VERSION=v20260609-xxxx
IMAGE=acritpmcompany.azurecr.io/itpm-web:$VERSION
docker build -t $IMAGE -f Dockerfile .         # 根目錄 Dockerfile（見 §9 決策 3）
# 驗證映像（SITUATION-7 強制）
docker run --rm $IMAGE ls /app/packages/db/prisma/migrations/      # 須見 00000000000000_init + 5 個
docker run --rm $IMAGE ls /app/node_modules/.prisma/client/ | grep libquery_engine  # linux-musl-openssl-3.0.x
az acr login --name acritpmcompany
docker push $IMAGE
docker tag $IMAGE acritpmcompany.azurecr.io/itpm-web:latest; docker push acritpmcompany.azurecr.io/itpm-web:latest
```

### Phase 5 — 切換 App Service 映像 + 重啟
```bash
az webapp config container set --name app-itpm-company-dev-001 -g RG-RCITest-RAPO-N8N --container-image-name $IMAGE
az webapp restart --name app-itpm-company-dev-001 -g RG-RCITest-RAPO-N8N
```
> 容器啟動會跑 `migrate deploy`；因 Phase 3 已套用 → 應為 **no-op**。

### Phase 6 — 部署後驗證（依 SITUATION-7 §4 完整清單）
- [ ] `health.ping` → pong；`health.dbCheck` → healthy；`health.schemaCheck` → 所有表存在
- [ ] 頁面：`/zh-TW/login` `/projects` `/users` `/om-expenses` `/om-summary` `/charge-outs` 皆 200/302（非 500）
- [ ] **API 級**：新功能 tRPC 端點回 401（非 500）；登入後手動觸發 FEAT-014 簽核 / FEAT-015 ProjectExpense
- [ ] **舊資料相容**：開「舊專案」編輯頁，新功能區不為空 / 不報錯
- [ ] 觀察 15 分鐘穩定性；更新本檔「執行記錄」

> ⚠️ 本次**不要**用 `fullSchemaSync` 當驗證手段（§3 風險 B：它看不到新表）。以 `migrate status` + 實際頁面/API 為準。

---

## 7. 回滾計畫（Rollback）

> 因 schema 變更為 additive，**舊映像對「新 DB」是向前相容的**（舊 app 不認得新表/新欄位 → 忽略即可），故 **L1 應用層回滾通常就夠**，且不丟資料。

| 級別 | 觸發 | 動作 | 時間 / 資料影響 |
|------|------|------|----------|
| **L1 應用層**（首選） | 新版頁面 500 / 行為異常 | `az webapp config container set … :v20260504-123857` → `restart` | 1–3 分；**無資料影響**（DB 為相容超集） |
| **L2 migration 元資料** | baseline 對齊步驟出錯 | 由 L2 備份還原 `_prisma_migrations`（新表/欄位 additive，留著對舊 app 無害） | 5–10 分；無業務資料影響 |
| **L3 時間點還原** | 資料疑似損壞（理論上本次不會） | Azure PITR 還原到 Phase 1 記錄時間點（建新 server）→ 改 `DATABASE_URL` 指向；或 `pg_restore` 黃金 dump | 10–30 分；回到部署前狀態 |

**回滾決策門檻**（建議）：頁面/功能問題 → L1；migration 卡住 → 先 L2 再重試 Phase 2/3；只有在確認資料異常時才動 L3。

**L1 指令**：
```bash
az webapp config container set --name app-itpm-company-dev-001 -g RG-RCITest-RAPO-N8N \
  --container-image-name acritpmcompany.azurecr.io/itpm-web:v20260504-123857
az webapp restart --name app-itpm-company-dev-001 -g RG-RCITest-RAPO-N8N
```

> 黃金 dump（`company_dev_full_${TS}.dump`）至少保留至新版穩定運行 2 週。

---

## 8. UAT→PRD 資料轉移機制（可重複；為日後 PRD 預備）

這正是你要的「整個平台資料可搬到 PRD」的能力。**已有現成 runbook**：`docs/deployment/06-uat-to-prd-data-migration.md`，且 `azure/scripts/` 內對應腳本**皆已存在**（`deploy-to-company.sh` / `deploy-docker-only.sh` / `helper/add-secret.sh` / `helper/configure-app-settings.sh` / `run-migration.sh` / `verify-deployment.sh`）。

**機制三層（缺一不可）**：
1. **L1 PostgreSQL 整庫** — `pg_dump --format=custom`（UAT）→ `pg_restore --single-transaction`（PRD 空庫）。含 master + transaction + 序列 + `_prisma_migrations`。
2. **L2 Blob** — `azcopy` server-side copy 三容器（`quotes` / `invoices` / `proposals`）。
3. **L3 Secrets/Config** — PRD 全新（不複製 UAT）：Key Vault / appsettings / Azure AD redirect URI。

**最易漏的 2 件事**（doc 06 附錄 B）：
- DB 存的是**完整 Blob URL**（`Quote.filePath` / `BudgetProposal.proposalFilePath` / `Expense.invoiceFilePath`）→ 搬完 Blob 後**必做 URL 改寫**（UAT account 名 → PRD account 名）。
- **UAT 須先套 FIX-141 baseline**（本次 §6 Phase 2 正好完成這件事）→ dump 才帶乾淨 migration 歷史。

> ✅ **本次部署的附帶效益**：Phase 2 把 company/dev（UAT）的 `_prisma_migrations` 對齊到 FIX-141 baseline，**正是 doc 06 的 UAT 先決條件**。做完這次部署，UAT 就具備「乾淨可 dump」狀態。

**需修正 / 待辦（移交 PRD 階段）**：
- ⚠️ doc 06 §1 寫「UAT 與 PRD 為 PostgreSQL **v16**」，但實測 company/dev 是 **v18** → PRD provision 與 `pg_dump`/`pg_restore` client 需對齊 **v18**（向後相容，但 dump 工具版本須 ≥ 來源）。建議 PRD 搬遷時 `pg_dump`/`pg_restore` 一律走 Docker `postgres:18`（與本次備份一致）。
- ⚠️ 本機未裝 `azcopy` → Blob 搬遷時改用 `mcr.microsoft.com/azure-cli` 容器或 Cloud Shell（內建 azcopy），或屆時安裝。
- PRD 尚未 provision（RG 內無 prod 資源）；實際搬遷待 PRD 建立後，依 doc 06 §2–§6 演練一次再正式執行。

---

## 9. 已確認決策（2026-06-09，使用者拍板）

| # | 決策 | 結論 |
|---|------|------|
| 1 | 維護窗口 | ✅ **短暫停機**：停機窗口內做備份 + baseline 對齊 + migrate + 切換映像（見 §6 鎖定順序） |
| 2 | 備份方式 | ✅ **Docker `postgres:18` 黃金 dump**（整庫 + `_prisma_migrations` 單表落地本機） |
| 3 | Dockerfile | ✅ **根目錄 `Dockerfile`** + build 後強制驗證映像內容 |
| 4 | 執行授權 | ✅ **AI 逐步執行**，每個破壞性步驟（停機 / DB 變更 / 切換映像）前停下確認 |
| 5 | UAT→PRD | 本次僅文件化 + 確認腳本就緒；PRD 實際搬遷待環境 provision 後依 doc 06 演練（預設，未反對即採用） |

---

## 10. 執行記錄（執行時填寫）

| 項目 | 值 |
|------|------|
| 執行日 | 2026-06-16 |
| 安全等級（使用者選定） | 最安全：先建預部署快照再 migrate |
| 預部署快照還原點（UTC） | `2026-06-16T02:05:05Z` |
| 預部署快照 server | `psql-itpm-company-dev-001-predeploy`（PITR restore，自有還原點） |
| migration 執行方式 | ACI（`itpm-migrate:v20260610-000604`，跑 `sh /work/migrate-baseline.sh`） |
| 新 app 映像 tag | `itpm-web:v20260609-185714` |
| 回滾映像 | `itpm-web:v20260504-123857` |
| 快照還原結果 | ✅ Ready（`psql-itpm-company-dev-001-predeploy`，32GB，v18） |
| migration 結果（migrate status） | ✅ 成功（ACI exitCode=0；驗證 ACI 回報 `Database schema is up to date!`，6 migrations 全套用） |
| 部署後驗證結果（初次） | ⚠️ **頁面層 PASS 但功能層 FAIL**：login 200 / 頁面 302、schemaCheck=complete，但**登入後** `budgetProposal.getAll` 等 tRPC 回 500 |
| 🔴 根因 | **公司 DB 與 HEAD schema 大量漂移**（長期靠 `fullSchemaSync` raw SQL 同步而偏離 Prisma schema：DB 多了 HEAD 已移除的欄位、缺了 HEAD 新增的欄位，如 `BudgetProposal.documentLink/proposalType/reviewNotes/vendorId`）。baseline `resolve --applied init`（標記已套用但未實跑 init）**遮蔽了此漂移** → `migrate status` 誤報 up to date，但 Prisma Client SELECT 缺失欄位 → 500。應在 baseline 前先跑 `migrate diff --from-url <DB> --to-schema-datamodel schema` 偵測漂移（已補做，輸出見事故記錄）。 |
| 是否回滾 / 原因 | ✅ **已回滾** → `v20260504-123857`（舊 app 配現有 DB 仍相容；2026-06-16 ping=pong 恢復）。資料未損（migration 對該漂移的表為純加表 + baseline 僅動元資料；舊欄位均保留）。 |
| 殘留清理 | migration ACI 已刪；測試防火牆規則已刪；**預部署快照 `psql-itpm-company-dev-001-predeploy` 保留中**（現為修漂移的測試床，務必保留） |
| 待辦（重新部署前） | ✅ **漂移分析 + 快照測試完成**（見 `docs/deployment/10-schema-drift-analysis-2026-06.md`）。最小安全修法＝只 ADD BudgetProposal 6 欄 + 對應 index/FK + 5 個 DROP NOT NULL（零 DROP COLUMN/SET NOT NULL/backfill）。已在快照（production 副本）證實：HEAD Prisma Client 38/38 model OK、當初 500 的 `budgetProposal.getAll` 回 5 筆。**下一步：待使用者核准 → 對正式 DB 套 doc 10 §6 SQL + cutover v20260609** |

---

## 10.1 重新 cutover（漂移修正後）— 2026-06-16 ✅ 成功

> 詳見 `docs/deployment/10-schema-drift-analysis-2026-06.md`（分析 + §6 SQL + 快照測試 + cutover 記錄）。

| 項目 | 值 |
|------|------|
| PITR 錨點（UTC） | `2026-06-16T04:27:12Z`（套用修正前；Azure 7 天連續備份為安全網） |
| Pre-flight（唯讀） | 對正式 DB `migrate diff` → 確認 pre-fix 狀態與快照測試一致（BudgetProposal 缺 4 欄 documentLink/proposalType/reviewNotes/vendorId；`workflowId`/`currentStepSequence` 已由 feat014 migration 具備）；無意料外缺欄位/缺表 |
| DB 修正 | ACI psql 套 doc 10 §6 SQL（冪等，`BEGIN…COMMIT`，exit 0）：新增 4 欄 + vendorId index/FK + 5 個 DROP NOT NULL；`currentStepSequence`/`workflowId`/`workflowId_idx` 自動 skip |
| 修正後 diff | `ADD COLUMN` 殘留 = **0**（僅剩刻意延後的 DROP COLUMN/SET NOT NULL/噪音/可選 index・FK） |
| Cutover | `container set` `v20260504-123857` → `v20260609-185714` + restart |
| **驗證（DB/API 層）** | HEAD Prisma Client 對**正式 DB** sweep：**38/38 model OK**；當初 500 的 `budgetProposal.getAll` 深層 include **回 5 筆**；`RESULT ALL_PASS`（補上次只驗頁面之缺口） |
| 驗證（HTTP 層） | `health.ping`=200(pong)、`/login`=200、`/proposals` `/projects` `/om-expenses` `/charge-outs`=302（導登入，非 500） |
| 回滾預案 | 異常即 `container set :v20260504-123857`（加項對舊 app 無害；資料零影響） |
| 殘留待清 | 預部署快照 server（測試中已套 baseline+fix，非乾淨還原點）+ 其 `AllowAzureServices`(0.0.0.0) 防火牆規則 → 新版穩定後刪 |
| 待使用者最終確認 | 實際登入 UAT，操作 proposals/projects/om-expenses/charge-outs/簽核流程，確認功能正常 |

---

**維護者**: AI 助手 + DevOps
**相關**: SITUATION-7（公司部署）、SITUATION-9（故障排查）、FIX-141（baseline）、doc 04（rollback）、doc 06（UAT→PRD）、**doc 10（schema 漂移分析+修正）**
