# 09 — 公司 Azure 部署阻礙與 Infra 協助請求（2026-06）

> **用途**：彙整 2026-06 嘗試將最新版部署到公司 Azure（`company/dev` = UAT）時遇到的所有問題，供 **Infra / Azure 管理團隊**評估與協助。
> **建立**：2026-06-16
> **目標環境**：公司 Azure 訂閱 `Microsoft Azure (rcitest): #1023861`（`30dac177-6dcb-412e-94f6-da9308fd1d09`，tenant `4f63aaa0-…`）
> **現況**：部署**被阻擋**，線上仍為舊版 `itpm-web:v20260504-123857`；新版映像已備妥但無法完成 DB 遷移與切換。
> **相關**：完整技術 runbook 見 `docs/deployment/08-company-dev-deploy-runbook-2026-06.md`

---

## 0. 摘要（給 Infra 的一頁速覽）

| # | 問題 | 嚴重度 | 是否阻擋部署 | 需 Infra 協助 |
|---|------|:---:|:---:|:---:|
| **P1** | 部署機（VM）對 Azure PostgreSQL 的 **TLS 連線被切斷**（防火牆已過，純 TLS 握手失敗） | 🔴 高 | **是** | ✅ 最關鍵 |
| **P2** | PG 防火牆白名單與部署機 **egress IP 不一致 / 不固定**（VM 無公網 IP，SNAT 依目的地不同） | 🟠 中 | 部分 | ✅ |
| **P3** | 部署用 **Service Principal 權限不一致／不足**（目前這顆 SP 對 ITPM 資源群組無任何存取權） | 🔴 高 | **是** | ✅ |
| **P4** | PostgreSQL **備份 / DR 偏弱**（保留 7 天、無 geo 備援、無 HA）——UAT→PRD 前須檢視 | 🟡 低-中 | 否 | ✅（決策） |
| **P5** | **機密以明文存於 App Service 設定**（非 Key Vault 參照） | 🟡 中 | 否 | ✅（決策） |

> **單一最關鍵阻擋**＝ **P1**。只要部署機能對公司 PostgreSQL 正常建立 TLS 連線（或 Infra 核可一條 Azure 內部執行路徑），其餘即可推進。

---

## 1. 環境資源對照（供 Infra 定位）

| 資源 | 名稱 |
|------|------|
| Resource Group | `RG-RCITest-RAPO-N8N`（East Asia） |
| App Service | `app-itpm-company-dev-001` |
| PostgreSQL Flexible Server | `psql-itpm-company-dev-001`（FQDN `psql-itpm-company-dev-001.postgres.database.azure.com`，解析 `104.208.73.41`，**v18**，Burstable B1ms，DB `itpm_dev`，admin `itpmadmin`） |
| Container Registry | `acritpmcompany`（`acritpmcompany.azurecr.io`） |
| Storage | `stitpmcompanydev001` |
| 部署機 | Azure VM（Windows，private IP `10.160.58.142`，**無公網 IP**） |

---

## 2. 詳細問題與請求

### 🔴 P1 — 部署機對 Azure PostgreSQL 的 TLS 連線被切斷（最關鍵）

**現象**：從部署機（含 Windows host 的 Prisma、以及本機 Docker 容器內的 `psql`）連 `psql-itpm-company-dev-001:5432` 時，**TLS 握手被遠端強制關閉**。

**證據**：
```text
# sslmode=require（psql, 容器內）
psql: error: connection ... (104.208.73.41), port 5432 failed:
      SSL error: unexpected eof while reading

# sslmode=require（Prisma, host）
Error: P1011  Error opening a TLS connection:
      An existing connection was forcibly closed by the remote host. (os error 10054)

# 對照：sslmode=disable（同一機器、同一連線字串）→ 已到達 PostgreSQL 認證層
psql: error: ... FATAL: no pg_hba.conf entry for host "52.187.129.166",
      user "itpmadmin", database "itpm_dev", no encryption
```

**關鍵判讀**：
- `sslmode=disable` 能到達 `pg_hba`（伺服器回應、且看到來源 IP `52.187.129.166`）→ **防火牆與 TCP 連通沒問題**。
- 但 `sslmode=require` 一致地在 TLS 握手階段被切斷（psql 與 Prisma 皆同，連 `gssencmode=disable` 也無效）。
- 同一個 PostgreSQL，**App Service 連線正常**；我們另起的 **Azure 內部容器（ACI）連線也正常**。
- → 研判為**部署機這條對外網路路徑**對 PostgreSQL 5432 的 TLS 有干擾（疑似 **egress 防火牆 / TLS 檢查 / forced tunnel** 之類的網路政策），**非 PostgreSQL 端問題**。

**影響**：備份（pg_dump）、migration baseline 對齊、`prisma migrate deploy` **都無法從部署機執行** → 整個部署卡住。

**請 Infra 協助（擇一即可）**：
1. **放行部署機對 `*.postgres.database.azure.com:5432` 的對外 TLS**（不做 TLS 攔截 / 不阻斷 PostgreSQL 的 SSL 升級封包），或
2. **提供一條核可的 Azure 內部執行路徑**（例如：跳板機 / 同 VNet 的執行環境 / 確認可用 Azure Cloud Shell / 核可我們用 ACI——見附錄 A，已實測可連），讓 DB 遷移可從「連得到 PG」的位置執行。

---

### 🟠 P2 — 防火牆白名單與部署機 egress IP 不一致 / 不固定

**現象**：
- PG 防火牆現有規則：`AllowAzureServices`（`0.0.0.0`）、`AllowDevMachine`（`20.212.90.174`）。
- 但部署機**實際連到 PG 的來源 IP 是 `52.187.129.166`**（見 P1 的 `no pg_hba.conf entry for host "52.187.129.166"`），與 `AllowDevMachine` 不符。
- 部署機**無公網 IP**（IMDS：private `10.160.58.142`、public 空）→ 走預設 SNAT；且 **egress IP 依目的地不同**（連網際網路時容器看到 `20.212.90.174`、連 PG 時 host 看到 `52.187.129.166`）→ 來源 IP 不固定、難以白名單。

**我們做過的處置**：曾臨時加 `AllowDeploy-52-187-129-166` 規則（已**移除**，未殘留）。加了之後 `pg_hba` 已可達，但 TLS 仍被切（即 P1）。

**影響**：即使要從部署機連，IP 不固定也讓白名單維護困難。

**請 Infra 協助**：
- 為部署用途提供**固定的對外 IP**（指派 VM 公網 IP 或 NAT Gateway 固定出口），並在 PG 防火牆建立對應白名單；**或**改採 P1 的方案 2（內部執行路徑，免依賴部署機 IP）。

---

### 🔴 P3 — 部署用 Service Principal 權限不一致 / 不足

**現象**：兩次 session 用到的 SP 不同，且**目前這顆 SP 對 ITPM 資源完全沒有存取權**。

**證據**：
```text
# 目前 SP（2026-06-15 起）
appId  2ae44f00-73c5-4be2-9924-468ac0b0a887
objId  e2824cf9-fc16-4eb0-a724-83ff163a1d4e
角色   Contributor  →  僅於 RG-RAPOSCM-AIDocProcessing-DEV（與 ITPM 不同的 RG）

# 嘗試讀 ITPM 資源 → 全被拒
AuthorizationFailed: ... does not have authorization to perform
  'Microsoft.Web/sites/read' / 'Microsoft.DBforPostgreSQL/flexibleServers/read'
  over RG-RCITest-RAPO-N8N
az acr show -n acritpmcompany → 'could not be found'（無讀取權限）

# 對照：2026-06-09 當時用的 SP
objId  a19dfe76-8dde-4e94-b8c4-ee18ea514d09
角色   Contributor on RG-RCITest-RAPO-N8N（可操作 firewall / ACR / webapp）
```

**影響**：目前無法用這顆 SP 進行任何部署或檢查；部署身分需要明確、穩定、授權正確。

**請 Infra 協助**：提供**一顆固定的部署 Service Principal**，並在**正確範圍**授予最小必要角色：
- `RG-RCITest-RAPO-N8N`：Contributor（或更細：Website Contributor + 重啟/設定權限）
- `acritpmcompany`（ACR）：**AcrPush**（推送映像）
- `psql-itpm-company-dev-001`：可管理 firewall rule（若採部署機直連方案）
- （若採 ACI 方案）建立 / 刪除 Container Instances 的權限
- 並請**確認此 SP 的 client secret / 有效期**，提供給部署使用。

---

### 🟡 P4 — PostgreSQL 備份 / DR 偏弱（UAT→PRD 前須檢視）

**現況（2026-06-09 查得）**：`psql-itpm-company-dev-001` = **保留 7 天、`geoRedundantBackup=Disabled`、`highAvailability=Disabled`**、Burstable B1ms。

**影響**：目前僅靠 Azure 自動 PITR（7 天）作為安全網；無異地備援、無 HA。對日後正式（PRD）資料而言偏弱。

**Infra 回覆（2026-06-16）**：已有定期備份。→ 為確立其為「足夠的資料安全網」，請**確認以下三點**：
1. **備份對象**：確認備份的是 **`psql-itpm-company-dev-001`（PostgreSQL）本身**（而非僅 App Service 容器——容器無狀態、不存用戶資料）；retention 多久、RPO 多少？
2. **可還原性 + 還原耗時**：確認還原程序可行、實際還原一次大約需多久（備份是用來還原的，不是用來看的）。
3. **Blob 是否在範圍**：上傳檔案存於 `stitpmcompanydev001`（quotes / invoices / proposals 容器）——是否一併備份？

> 補充：Azure PostgreSQL Flexible Server 本身即內建自動備份 + PITR（先前查得保留 7 天）。若 Infra 所指即此，請確認上述 retention 是否已調整。

**請 Infra 協助 / 決策（DR 策略）**：
- 確認此環境定位（UAT？預備轉 PRD？），據以決定**備份保留天數 / Geo 備援 / HA / 維護窗口**策略。
- （若要 PRD）建議 35 天保留 + GeoRedundant + Zone-Redundant HA + Resource Lock。

---

### 🟡 P5 — 機密以明文存於 App Service 設定（非 Key Vault）

**現況**：`app-itpm-company-dev-001` 的 `DATABASE_URL`、`NEXTAUTH_SECRET`、`AZURE_STORAGE_ACCOUNT_KEY`、`AZURE_AD_CLIENT_SECRET` 等**以明文 App Setting** 存放（非 `@Microsoft.KeyVault(...)` 參照）。

> 另：應用安全審計（`docs/development-log/security-2026-06-11.md`）指出 `NEXTAUTH_SECRET` 疑似外洩需輪換——若由 Infra 統管機密，請一併納入。

**請 Infra 協助 / 決策**：
- 是否導入公司 **Key Vault** 集中管理上述機密，App Service 改用 Key Vault 參照 + Managed Identity。
- 協助**輪換**疑似外洩的 `NEXTAUTH_SECRET`（及其他必要機密）。

---

## 3. 已由開發端自行解決（僅供背景，**不需** Infra 處理）

| 項目 | 說明 | 狀態 |
|------|------|------|
| Dockerfile `deps` 階段缺 Prisma schema 導致 build 失敗 | 根 `Dockerfile` 的 `postinstall`(`prisma generate`)在 schema 複製前執行 → 已於 deps 階段補 `COPY packages/db/prisma` | ✅ 已修 |
| Migration 歷史重立基線（FIX-141）對不上線上 DB | 線上 `_prisma_migrations` 有 9 筆舊紀錄；需 DELETE 後標記新 baseline → 已備妥 migration runner 腳本 | ✅ 方案就緒 |
| App 映像無法執行 `prisma migrate`（schema-engine openssl 1.1.x vs 映像 openssl 3.0） | 另建專用 migration runner 映像（debian + 正確 engine）由 ACI 執行 | ✅ 已驗證可行 |

---

## 4. 資訊性差異 / 備註

- **PostgreSQL 版本**：實測 **v18**（部分文件曾記為 v16）→ pg client 工具需 ≥ v18。
- **目前部署狀態**：線上 = `itpm-web:v20260504-123857`（舊版）；新版 `itpm-web:v20260609-185714` 已 push 至 ACR 但**未部署**；5 個待套用 migration（FEAT-014 簽核流程、FEAT-015 ProjectExpense、CHANGE-047/048、安全預設角色）**尚未套用**。整個 cutover 在等 P1 / P3 解除。
- **資料安全**：待套用的 migration 全為 **additive（加表 / 加欄位）**，**不會刪改現有業務資料**；baseline 對齊只動 `_prisma_migrations` 元資料表。

---

## 5. 給 Infra 的具體請求清單（Checklist）

- [ ] **P1**：放行部署機 → `*.postgres.database.azure.com:5432` 的對外 **TLS**（不攔截）；**或**提供 / 核可一條 Azure 內部執行路徑（跳板機 / Cloud Shell / 同 VNet / ACI）。
- [ ] **P2**：為部署提供**固定對外 IP** 並設 PG 防火牆白名單（若採直連方案）。
- [ ] **P3**：提供**固定部署 SP** + 在 `RG-RCITest-RAPO-N8N`／`acritpmcompany`(AcrPush)／PostgreSQL 授予最小必要角色，並提供有效 secret。
- [ ] **P4**：確認既有「定期備份」的**對象（須為 PostgreSQL `psql-itpm-company-dev-001`,非僅容器)/ retention / 還原程序與耗時 / 是否含 Blob `stitpmcompanydev001`**；並決定備份 / Geo / HA 策略（UAT→PRD 前）。
- [ ] **P5**：機密改用 Key Vault（+ Managed Identity）；輪換疑似外洩的 `NEXTAUTH_SECRET`。

---

## 附錄 A — 已實測「可連」的替代路徑（供 Infra 評估是否核可）

我們建立了一個一次性 **Azure Container Instance（ACI）**，使用內部映像，於 East Asia 執行；**ACI → PostgreSQL 連線正常**（被 `AllowAzureServices` 防火牆規則覆蓋，且無部署機的 TLS 限制）。實測 `prisma migrate status` 成功讀取 DB migration 歷史。

→ 若 Infra **核可以 ACI 作為遷移執行環境**，我們即可在不依賴部署機直連的情況下完成 DB 遷移；但仍需 **P3 的部署 SP 權限**（建立 / 刪除 ACI、ACR 拉取、讀取 App Service 設定取得 `DATABASE_URL`）。

---

**整理者**：開發端 + AI 助手　|　**待 Infra 回覆後更新**
