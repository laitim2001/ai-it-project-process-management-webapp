# 06 - UAT → PRD 資料遷移 Runbook

> **類型**: 部署 / 基礎設施 Runbook
> **建立日期**: 2026-06-02
> **狀態**: 📋 草稿（待團隊審閱後執行）
> **適用**: 將現有 UAT 環境的**完整資料**（master + transaction + 上傳檔案）遷移到全新 PRD 環境
> **資料庫**: Azure Database for PostgreSQL **Flexible Server v16**（UAT 與 PRD 同型）

---

## 0. 目的與可行性

把 UAT 累積的所有資料（master + transaction）+ 上傳檔案完整搬到一個全新的 PRD 環境。

**可行性：✅ 成熟標準作業。** PG→PG 整庫遷移 + Blob→Blob 複製是業界常規。本專案部署腳本已內建 `prod` 環境配置（`azure/scripts/02-setup-database.sh` 等），provision PRD 本身已腳本化。

**「完整資料」共 3 層（缺一不可）：**

| 層 | 內容 | 工具 | 是否複製 UAT |
|---|------|------|:---:|
| **L1 PostgreSQL** | master（User/Role/Permission/BudgetPool/BudgetCategory/Vendor/Currency/OperatingCompany/ExpenseCategory）+ transaction（Project/BudgetProposal/PurchaseOrder/Expense/ChargeOut/OMExpense/ProjectExpense…）**全在同一個 `itpm_{env}` DB** | `pg_dump` / `pg_restore` | ✅ 整庫 |
| **L2 Blob Storage** | `quotes` / `invoices` / `proposals` 三容器的上傳檔案（報價、發票、計劃書 PDF） | `azcopy` | ✅ 整容器 |
| **L3 Secrets/Config** | DATABASE_URL、NEXTAUTH_SECRET、Storage Key、Azure AD B2C、SendGrid… | Key Vault（手動） | ❌ **PRD 全新** |

> ⚠️ **最易漏的兩件事**：(1) L2 Blob 檔案；(2) DB 內存的是**完整 Blob URL**（含 UAT storage account 名），搬完 Blob 後**必須改寫 DB 的 URL**（見 Step 5）。

---

## 1. 前提與假設

- PRD 與 UAT 都是 Azure PostgreSQL Flexible Server v16（pg_dump/restore 版本須 ≥ 16）。
- 執行者具備：UAT 與 PRD 的 DB admin 帳密、Storage Account Key（或 RBAC）、Azure CLI 登入、Key Vault 寫入權限。
- **先決條件（極重要）**：UAT 的 `_prisma_migrations` 已套用 **FIX-141 baseline**（見 `claudedocs/4-changes/bug-fixes/FIX-141-prisma-migration-baseline.md`「正式環境同步」段）。否則整庫 dump 會帶出不自洽的 migration 歷史，PRD 接手後 `migrate deploy` 可能異常。
- 建議在 **Azure Cloud Shell** 執行（內建 `psql` / `pg_dump` / `pg_restore` / `az` / `azcopy`，且位於 Azure 網路內、速度快），或一台已裝 PostgreSQL 16 client 工具的跳板機。

### 1.1 變數對照表（執行前先填好，後續指令引用）

| 變數 | UAT 值 | PRD 值 |
|------|--------|--------|
| PG 主機 `*_PG_HOST` | `psql-itpm-<uat>-001.postgres.database.azure.com` | `psql-itpm-prod-001.postgres.database.azure.com` |
| DB 名 `*_DB` | `itpm_<uat>` | `itpm_prod` |
| PG admin `*_PG_ADMIN` | `<uat_admin>` | `<prd_admin>` |
| Storage 帳戶 `*_SA` | `st(g)itpm<uat>001` | `st(g)itpmprod001` |
| Resource Group | `rg-itpm-<uat>` | `rg-itpm-prod` |
| App Service | `app-itpm-<uat>-001` | `app-itpm-prod-001` |
| Key Vault | `kv-itpm-<uat>` | `kv-itpm-prod` |
| App 網域（NEXTAUTH_URL） | `https://app-itpm-<uat>-001.azurewebsites.net` | `https://<prd 網域>` |

> 後文以 `<UAT_PG_HOST>`、`<PRD_SA>` 等代稱，請以上表實值替換。

---

## 2. 前置工作（維護窗口前，可從容進行）

### 2.1 決策確認（必須先拍板）

- [ ] **停機窗口**：可接受一次維護窗口（內部工具通常 30–60 分鐘足夠）？本 runbook 採「維護窗口 + 整庫 dump」最簡路徑。若要求近零停機 → 需 logical replication / Azure DMS（複雜許多，另議）。
- [ ] **資料清洗**：UAT 是否混入測試/草稿資料（如 `E2E_` 前綴）？要全搬還是先清？決定見 §2.4。
- [ ] **PRD 訂閱/區域**：與 UAT 同訂閱同區（East Asia）或分開？
- [ ] **安全**：建 PRD 前先處理已知洩露憑證（`azure/output/dev-database-credentials.txt`，見 azure-infrastructure 安全發現 8.1），避免 PRD 重蹈覆轍。

### 2.2 把 FIX-141 baseline 套到 UAT（先決條件）

在 **UAT DB** 執行（步驟細節見 FIX-141 文件「正式環境同步」段）：

```bash
# 1) 備份 UAT 的 _prisma_migrations
psql "host=<UAT_PG_HOST> port=5432 dbname=<UAT_DB> user=<UAT_PG_ADMIN> sslmode=require" \
  -c "\copy (SELECT * FROM \"_prisma_migrations\") TO 'uat_prisma_migrations_backup.csv' CSV HEADER"

# 2) 確認 UAT schema 與 repo HEAD schema 一致（應為空 diff）
#    （在 repo 內，DATABASE_URL 指向 UAT）
pnpm --filter db exec prisma migrate diff \
  --from-url "postgresql://<UAT_PG_ADMIN>:<pwd>@<UAT_PG_HOST>:5432/<UAT_DB>?sslmode=require" \
  --to-schema-datamodel packages/db/prisma/schema.prisma --script
```

> 若上面 diff 非空 → UAT 有 db-push drift，須先 `prisma migrate deploy` 或處理後再繼續。
> baseline reset（`DELETE _prisma_migrations` + `migrate resolve --applied`）建議在 §3 dump 之前完成，使 dump 帶出乾淨歷史。

> ⚠️ **同時確認 UAT 的 seed 資料（權限）已對齊 HEAD**：整庫遷移會讓 PRD **完整繼承 UAT 現況**（含 `Permission`/`RolePermission`）。若 UAT 本身的權限未對齊 `seed.ts`（如 2026-06-22 發現的 `menu:approval-workflows` 缺失、PM/Supervisor 授權殘缺），**PRD 會一併繼承缺陷**。dump 前先依 **doc 11 §1.2 + §2「Seed 同步護欄」** 確認 UAT 權限正確（用 Admin/Supervisor/ProjectManager 各登入驗 Sidebar，或比對 `seed.ts` 的 `menuPermissions`/`rolePermissionMapping`）。

### 2.3 Provision PRD 環境（空殼，無資料）

用既有 6 階段腳本的 **prod 檔位**（DB / Storage / ACR / App Service / Key Vault）：

```bash
cd azure/scripts
# 依公司/個人環境選擇入口腳本，環境參數帶 prod
./deploy-to-company.sh prod         # 或 ./deploy-to-personal.sh prod
# 完成後：PRD DB 為空、3 個 Blob 容器已建、App Service 已起（尚未灌資料）
```

> prod 配置自動套用：Standard_D4ds_v4、256GB、35 天備份、GeoRedundant + ZoneRedundant HA、ACR Premium、Resource Lock（CanNotDelete）。

### 2.4（可選）資料清洗

若決定清洗，**在 UAT dump 之前**於 UAT 執行（先 `SELECT` 確認筆數再 `DELETE`），例如：

```sql
-- 範例：刪除 E2E 測試殘留（依實際前綴/條件調整，務必先 SELECT 確認）
-- SELECT count(*) FROM "BudgetPool" WHERE name LIKE 'E2E_%';
-- DELETE FROM "BudgetPool" WHERE name LIKE 'E2E_%';   -- 注意：FK cascade 影響
```

> ⚠️ 刪除有 FK 關聯的資料前先確認級聯行為，避免誤刪。建議在 UAT 的**副本**上先演練。

### 2.5 演練（強烈建議）

正式遷移前，先用一次 dump 還原到一個**臨時 PRD-staging DB** 跑完 §3–§5，驗證流程與時間，再排正式窗口。

---

## 3. 遷移執行（維護窗口 T0）

### Step 1 — 凍結 UAT 寫入

```bash
# 停掉 UAT App Service，確保 dump 是一致快照
az webapp stop --name app-itpm-<uat>-001 --resource-group rg-itpm-<uat>
```

記錄凍結時間（T0），此後 UAT 不再有寫入。

### Step 2 — 匯出 UAT 資料庫（整庫，含 master + transaction + 序列 + _prisma_migrations）

```bash
TS=$(date +%Y%m%d_%H%M)
pg_dump \
  "host=<UAT_PG_HOST> port=5432 dbname=<UAT_DB> user=<UAT_PG_ADMIN> sslmode=require" \
  --format=custom --no-owner --no-privileges --verbose \
  --file="uat_full_${TS}.dump"

# 記下 dump 檔大小與結束時間，妥善保存（這是回滾的黃金備份）
ls -lh uat_full_${TS}.dump
```

> `--no-owner --no-privileges`：PRD admin 與 UAT 不同，避免 owner/grant 還原錯誤。
> `--format=custom`：供 `pg_restore` 彈性還原（可平行、可選表）。
> 本專案 PK 多為 UUID，少數 Int（如 `Role.id`）；整庫 dump 會自動以 `setval` 還原序列，無須手動處理。

### Step 3 — 還原到 PRD（PRD DB 此時應為空）

```bash
pg_restore \
  --dbname="host=<PRD_PG_HOST> port=5432 dbname=<PRD_DB> user=<PRD_PG_ADMIN> sslmode=require" \
  --no-owner --no-privileges --verbose \
  --single-transaction \
  "uat_full_${TS}.dump"
```

> `--single-transaction`：全有或全無，中途失敗自動回滾，PRD 不會留半套資料。
> **不要**在還原前對 PRD 跑 `migrate deploy`——整庫 dump 已含 schema 與 `_prisma_migrations`，先建 schema 會衝突。

### Step 4 — 複製 Blob 檔案（3 個容器，UAT → PRD）

先各自產生 SAS（或用 `azcopy login` + RBAC `Storage Blob Data Contributor`）：

```bash
# 產生來源（讀）與目的（寫）SAS——有效期視窗口長度
UAT_SAS=$(az storage container generate-sas --account-name <UAT_SA> --name proposals \
  --permissions rl --expiry $(date -u -d '+4 hours' '+%Y-%m-%dT%H:%MZ') --auth-mode key -o tsv)
# （對 PRD_SA 以 --permissions rwl 產生 PRD_SAS）

# 對 3 個容器各做一次 server-side 複製
for c in quotes invoices proposals; do
  azcopy copy \
    "https://<UAT_SA>.blob.core.windows.net/${c}/*?<UAT_SAS>" \
    "https://<PRD_SA>.blob.core.windows.net/${c}?<PRD_SAS>" \
    --recursive
done
```

> azcopy 走 server-side copy，速度快、不經本機。完成後比對每個容器的 blob 數量（見 §4.3）。

### Step 5 — 改寫 PRD DB 中的 Blob URL（🔴 關鍵，勿漏）

本專案 DB 存的是**完整 Blob URL**（含 storage account 名），分布在 3 個欄位：`Quote.filePath`、`BudgetProposal.proposalFilePath`、`Expense.invoiceFilePath`。Blob 搬到 PRD 後須把 host 從 UAT account 換成 PRD account，否則檔案點開會指向 UAT（或 404）。

在 **PRD DB** 執行：

```sql
-- 先看影響筆數（執行前）
SELECT
  (SELECT count(*) FROM "Quote"          WHERE "filePath"         LIKE 'https://<UAT_SA>.blob.core.windows.net%') AS quote_rows,
  (SELECT count(*) FROM "BudgetProposal" WHERE "proposalFilePath" LIKE 'https://<UAT_SA>.blob.core.windows.net%') AS proposal_rows,
  (SELECT count(*) FROM "Expense"        WHERE "invoiceFilePath"  LIKE 'https://<UAT_SA>.blob.core.windows.net%') AS expense_rows;

BEGIN;

UPDATE "Quote"
   SET "filePath" = REPLACE("filePath",
       'https://<UAT_SA>.blob.core.windows.net', 'https://<PRD_SA>.blob.core.windows.net')
 WHERE "filePath" LIKE 'https://<UAT_SA>.blob.core.windows.net%';

UPDATE "BudgetProposal"
   SET "proposalFilePath" = REPLACE("proposalFilePath",
       'https://<UAT_SA>.blob.core.windows.net', 'https://<PRD_SA>.blob.core.windows.net')
 WHERE "proposalFilePath" LIKE 'https://<UAT_SA>.blob.core.windows.net%';

UPDATE "Expense"
   SET "invoiceFilePath" = REPLACE("invoiceFilePath",
       'https://<UAT_SA>.blob.core.windows.net', 'https://<PRD_SA>.blob.core.windows.net')
 WHERE "invoiceFilePath" LIKE 'https://<UAT_SA>.blob.core.windows.net%';

-- 驗證：應為 0（不該再有任何指向 UAT account 的 URL）
SELECT
  (SELECT count(*) FROM "Quote"          WHERE "filePath"         LIKE 'https://<UAT_SA>.%') +
  (SELECT count(*) FROM "BudgetProposal" WHERE "proposalFilePath" LIKE 'https://<UAT_SA>.%') +
  (SELECT count(*) FROM "Expense"        WHERE "invoiceFilePath"  LIKE 'https://<UAT_SA>.%') AS remaining_uat_urls;

COMMIT;  -- remaining_uat_urls = 0 才 COMMIT，否則 ROLLBACK
```

> 註：`seed.ts` 內有舊式相對路徑（`/uploads/...`），那是種子資料；真實上傳檔案皆為完整 Azure URL。如 PRD 有來自 seed 的舊路徑且需處理，另行評估。

### Step 6 — 設定 PRD 的 Config / Secrets（全新，不複製 UAT）

```bash
# Key Vault 寫入 PRD 專屬 secret（範例，實值自填）
cd azure/scripts/helper
./add-secret.sh prod DATABASE-URL "postgresql://<PRD_PG_ADMIN>:<pwd>@<PRD_PG_HOST>:5432/<PRD_DB>?sslmode=require"
./add-secret.sh prod NEXTAUTH-SECRET "$(openssl rand -base64 32)"   # PRD 新 secret
./add-secret.sh prod NEXTAUTH-URL "https://<PRD 網域>"
# Storage：AZURE_STORAGE_ACCOUNT_NAME=<PRD_SA>、AZURE_STORAGE_ACCOUNT_KEY=<PRD key>
# SendGrid / Azure AD B2C 等比照 environment-variables-map.md
./configure-app-settings.sh prod
```

**Azure AD B2C（必做）**：到 App Registration 把 **PRD 網域的 redirect URI** 加入允許清單（`https://<PRD 網域>/api/auth/callback/azure-ad-b2c`），否則 SSO 登入失敗。

> ⚠️ 換新 `NEXTAUTH_SECRET` 會使所有舊 JWT session 失效——cutover 後使用者需重新登入一次（可接受）。bcrypt 密碼隨 DB 過去，帳號照常可登入。

### Step 7 — 部署 App Image 到 PRD 並啟動

```bash
cd azure/scripts
./deploy-docker-only.sh prod      # build + push image + 重啟 PRD App Service
# 啟動時容器內會跑 prisma migrate deploy；因 PRD 已含完整 _prisma_migrations，應為 no-op（或只補比 UAT 新的 migration）
az webapp start --name app-itpm-prod-001 --resource-group rg-itpm-prod
```

---

## 4. 驗證（Validation）

### 4.1 各表筆數 UAT vs PRD 對照（精確值）

對 **UAT 與 PRD 各跑一次**，比對輸出應逐表相同（若做過清洗則差異須等於清洗量）：

```sql
SELECT relname AS table_name,
       (xpath('/row/c/text()',
         query_to_xml(format('SELECT count(*) AS c FROM %I.%I', schemaname, relname),
                      false, true, '')))[1]::text::bigint AS row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY relname;
```

重點抽查 transaction 表：`Project`、`BudgetProposal`、`PurchaseOrder`、`PurchaseOrderItem`、`Expense`、`ExpenseItem`、`ChargeOut`、`ChargeOutItem`、`OMExpense`、`OMExpenseItem`、`OMExpenseMonthly`、`Quote`、`ProjectExpense*`。

### 4.2 Migration 與完整性

```bash
# PRD：migration 歷史一致、無 drift
pnpm --filter db exec prisma migrate status        # 期望 up to date
pnpm --filter db exec prisma migrate diff \
  --from-url "postgresql://<PRD_PG_ADMIN>:<pwd>@<PRD_PG_HOST>:5432/<PRD_DB>?sslmode=require" \
  --to-schema-datamodel packages/db/prisma/schema.prisma --script   # 期望空
```

```sql
-- 抽查 FK 完整（範例：每個 Project 的 manager/supervisor/budgetPool 都存在）
SELECT count(*) AS orphan_projects FROM "Project" p
 LEFT JOIN "User" m ON m.id = p."managerId"
 LEFT JOIN "BudgetPool" bp ON bp.id = p."budgetPoolId"
 WHERE m.id IS NULL OR bp.id IS NULL;   -- 期望 0
```

### 4.3 Blob 數量對照

```bash
for c in quotes invoices proposals; do
  echo -n "$c UAT="; az storage blob list --account-name <UAT_SA> -c $c --auth-mode key --query "length(@)" -o tsv
  echo -n "$c PRD="; az storage blob list --account-name <PRD_SA> -c $c --auth-mode key --query "length(@)" -o tsv
done   # 每個容器 UAT 與 PRD 數量應相同
```

### 4.4 應用煙霧測試（PRD）

- [ ] 登入（測試帳號或 Azure AD B2C）成功
- [ ] 開一筆既有 **BudgetProposal**，點計劃書附件 → 能正常下載（驗證 L2 + Step 5 URL 改寫）
- [ ] 開一筆 **Quote** / **Expense**，附件可下載
- [ ] 跑一條核心流程（如新建 Project → Proposal → 提交），寫入成功
- [ ] `azure/tests/smoke-test.sh prod` 全綠

---

## 5. Cutover

1. 確認 §4 全部通過。
2. 將使用者 / DNS / 入口連結導向 PRD 網域。
3. 通知使用者「PRD 上線、需重新登入一次」。
4. 觀察期（建議 24–72h）：保留 UAT 不動，作為回滾後路。

---

## 6. 回滾程序（Rollback）

**遷移過程中 UAT 全程唯讀（只被 dump），未被修改** → 回滾風險低。

| 情境 | 動作 |
|------|------|
| Cutover **前**驗證未過 | 直接 `DROP DATABASE` PRD DB（或清空）、清空 PRD 容器，修正後重跑 §3–§5。UAT 重新 `az webapp start` 即恢復服務。 |
| Cutover **後**短期內發現重大問題 | 把 DNS/使用者切回 UAT；UAT 仍持有凍結點(T0)的完整資料。⚠️ **代價**：cutover 後寫入 PRD 的資料會遺失。 |
| 想保留 PRD 上的新寫入再修 | 不回滾，於 PRD 上 hotfix；必要時針對性補資料。 |

**回滾決策窗口**：Cutover 後一旦 PRD 開始累積真實寫入，回滾 UAT 的成本急升。建議在觀察期內定義明確的「回滾 vs 前滾」門檻。

黃金備份：`uat_full_${TS}.dump` + UAT 環境本身，至少保留至 PRD 穩定運行 2 週。

---

## 7. 後續清理

- [ ] UAT 用途轉為測試環境，或依政策下線。
- [ ] 移除遷移過程產生的暫存 SAS、dump 檔（含敏感資料，勿留在共享位置）。
- [ ] 更新 `DEVELOPMENT-LOG.md` 與部署版本記錄。
- [ ] 確認 PRD 的備份策略（35 天）、HA、監控告警已啟用。

---

## 附錄 A — 指令速查（依序）

```bash
# 0. 變數
TS=$(date +%Y%m%d_%H%M)

# 1. 凍結 UAT
az webapp stop --name app-itpm-<uat>-001 --resource-group rg-itpm-<uat>

# 2. Dump UAT
pg_dump "host=<UAT_PG_HOST> port=5432 dbname=<UAT_DB> user=<UAT_PG_ADMIN> sslmode=require" \
  --format=custom --no-owner --no-privileges --verbose --file="uat_full_${TS}.dump"

# 3. Restore PRD（空庫）
pg_restore --dbname="host=<PRD_PG_HOST> port=5432 dbname=<PRD_DB> user=<PRD_PG_ADMIN> sslmode=require" \
  --no-owner --no-privileges --single-transaction --verbose "uat_full_${TS}.dump"

# 4. Blob 複製（3 容器）
for c in quotes invoices proposals; do
  azcopy copy "https://<UAT_SA>.blob.core.windows.net/${c}/*?<UAT_SAS>" \
              "https://<PRD_SA>.blob.core.windows.net/${c}?<PRD_SAS>" --recursive
done

# 5. 改寫 DB URL（見 Step 5 的 SQL，PRD DB 執行）
# 6. 設定 PRD config / Key Vault / Azure AD redirect（見 Step 6）
# 7. 部署 image + 啟動 PRD
./deploy-docker-only.sh prod
az webapp start --name app-itpm-prod-001 --resource-group rg-itpm-prod
```

---

## 附錄 B — 關鍵陷阱清單

1. **L2 Blob 必搬**（azcopy 3 容器）——只搬 DB 會「有紀錄、檔案 404」。
2. **DB 存完整 Blob URL** → Step 5 必做 URL 改寫（`Quote.filePath` / `BudgetProposal.proposalFilePath` / `Expense.invoiceFilePath`）。
3. **FIX-141 baseline 先套 UAT** → dump 才帶乾淨 migration 歷史。
4. **PRD 還原前不要 migrate deploy**（整庫 dump 已含 schema）。
5. **Azure AD B2C redirect URI** 必加 PRD 網域。
6. **NEXTAUTH_SECRET** 換新 → 舊 session 失效，使用者重登一次。
7. **凍結 UAT 寫入** 才能取得一致快照。
8. **回滾窗口**：cutover 後 PRD 一有寫入，回滾成本急升。

---

## 相關文件

- `claudedocs/4-changes/bug-fixes/FIX-141-prisma-migration-baseline.md` — migration baseline（UAT 先決條件）
- `docs/codebase-analyze/01-project-overview/azure-infrastructure.md` — Azure 資源與 prod 配置
- `docs/deployment/environment-variables-map.md` — 環境變數對照
- `docs/deployment/key-vault-secrets-list.md` — Key Vault secret 清單
- `docs/deployment/04-rollback.md` — 應用層回滾
- `apps/web/src/lib/azure-storage.ts` — Blob URL 構成（`https://{account}.blob.core.windows.net/{container}/{blob}`）
