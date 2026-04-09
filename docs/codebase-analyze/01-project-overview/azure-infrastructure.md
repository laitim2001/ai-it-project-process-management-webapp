# Azure 基礎架構分析

> 分析日期：2026-04-09
> 分析範圍：`azure/` 目錄（35 檔案，約 6,100 行）
> 驗證方式：逐檔讀取原始碼

---

## 1. 架構總覽

### 1.1 部署策略：雙 Azure 訂閱

本專案支援兩套完全獨立的 Azure 環境：

| 項目 | 個人環境 | 公司環境 |
|------|----------|----------|
| 入口腳本 | `deploy-to-personal.sh` | `deploy-to-company.sh` |
| 環境配置 | `environments/personal/` | `environments/company/` |
| 安全確認 | 無 | 部署前需輸入 `yes` 確認 |
| 資源命名 | `rg-itpm-dev` | `rg-itpm-company-dev` |
| 部署歷史 | 無 | 自動記錄到 `deployment-history/company/` |

### 1.2 Azure 資源清單

依據部署腳本和 Bicep 模板，完整的 Azure 資源拓撲如下：

```
rg-itpm-{env}/
├── app-itpm-{env}-001          Azure App Service (Linux Container)
├── asp-itpm-{env}              App Service Plan
├── psql-itpm-{env}-001         PostgreSQL Flexible Server (v16)
│   ├── itpm_{env}              Database
│   └── Firewall Rules          AllowAzureServices + AllowOfficeIP(dev)
├── st(g)itpm{env}001           Storage Account (StorageV2)
│   ├── quotes                  Blob Container
│   ├── invoices                Blob Container
│   └── proposals               Blob Container
├── acritpm{env}                Azure Container Registry
│   └── itpm-web                Repository
├── kv-itpm-{env}               Key Vault
├── nsg-itpm-{env}              Network Security Group
│   ├── AllowHTTPS (443)        Inbound Rule
│   └── AllowHTTP (80)          Inbound Rule (dev only)
└── law-itpm-{env}              Log Analytics Workspace
```

### 1.3 已確認部署版本

- **個人環境**：v9-fresh-build（2025-11-25），East Asia
- **公司環境**：v10-company-deploy（2025-11-25），East Asia

---

## 2. Infrastructure as Code (Bicep)

### 2.1 app-service.bicep

**檔案**：`azure/templates/app-service.bicep`（99 行）

佈建：
- **App Service Plan** (`Microsoft.Web/serverfarms@2022-09-01`)
  - Kind: `linux`, SKU: `B1` (Basic), Capacity: 1
  - `reserved: true`（Linux 必要）
- **App Service** (`Microsoft.Web/sites@2022-09-01`)
  - Kind: `app,linux,container`
  - Container 來源：`{acrName}.azurecr.io/itpm-web:{imageTag}`
  - HTTPS Only, FTPS Disabled, TLS 1.2 最低
  - 內建設定：`WEBSITES_PORT=3000`, `NODE_ENV=production`
  - System Assigned Managed Identity

參數：

| 參數名 | 預設值 | 說明 |
|--------|--------|------|
| `location` | `resourceGroup().location` | 區域 |
| `environment` | `dev` | 環境（dev/staging/prod） |
| `appServicePlanName` | `asp-itpm-{env}` | Plan 名稱 |
| `appServiceName` | `app-itpm-{env}-001` | App 名稱 |
| `acrName` | `acritpm{env}` | ACR 名稱 |
| `imageTag` | `latest` | 映像標籤 |
| `keyVaultName` | `kv-itpm-{env}` | Key Vault 名稱 |

輸出：`appServiceUrl`, `appServicePrincipalId`, `appServiceName`

### 2.2 postgresql.bicep

**檔案**：`azure/templates/postgresql.bicep`（97 行）

佈建：
- **PostgreSQL Flexible Server** (`Microsoft.DBforPostgreSQL/flexibleServers@2022-12-01`)
  - SKU: `Standard_B1ms` (Burstable)
  - Storage: 32 GB, Backup: 7 天, GeoRedundant: Disabled, HA: Disabled
- **Firewall Rule**：允許所有 Azure 服務（0.0.0.0-0.0.0.0）
- **Database**：`itpm_{env}`, charset UTF8, collation en_US.utf8

安全參數（`@secure()`）：`administratorLogin`, `administratorPassword`

輸出：`serverFqdn`, `databaseName`, `connectionString`

**注意**：`connectionString` 輸出包含明文密碼，不應出現在部署日誌中。

### 2.3 storage.bicep

**檔案**：`azure/templates/storage.bicep`（83 行）

佈建：
- **Storage Account** (`Microsoft.Storage/storageAccounts@2023-01-01`)
  - Kind: `StorageV2`, SKU: `Standard_LRS`
  - HTTPS Only, TLS 1.2, No Public Blob Access, Hot Tier
- **Blob Service**：7 天軟刪除
- **Containers**：`quotes`, `invoices`（Public Access: None）

輸出：`storageAccountName`, `storageAccountId`, `quotesContainerName`, `invoicesContainerName`, `blobEndpoint`

### 2.4 缺少的 Bicep 模板

以下資源由腳本建立，但無對應 Bicep 模板：
- Azure Container Registry
- Azure Key Vault
- Network Security Group
- Log Analytics Workspace
- Application Insights

---

## 3. 部署腳本詳解

### 3.1 六階段部署流程

#### 階段 1：01-setup-resources.sh（394 行）

**功能**：建立 Resource Group + NSG + Log Analytics Workspace

**步驟**：
1. 驗證環境參數（dev/staging/prod）
2. 檢查 Azure CLI 登入狀態
3. 用戶確認操作
4. 建立或復用 Resource Group（含標籤：Environment, Project, ManagedBy, CostCenter）
5. 生產環境設置 CanNotDelete 資源鎖定
6. 建立 NSG + HTTPS 規則（dev 額外添加 HTTP）
7. 建立 Log Analytics Workspace（保留期：dev 30 天, staging 60 天, prod 90 天）
8. 儲存 Workspace ID 到 `.azure/output/`

**環境變數**：無外部依賴，所有配置硬編碼於 case 區塊。

#### 階段 2：02-setup-database.sh（465 行）

**功能**：建立 PostgreSQL Flexible Server + 資料庫 + 防火牆 + 參數配置

**環境差異**：

| 參數 | Dev | Staging | Prod |
|------|-----|---------|------|
| SKU | Standard_B1ms | Standard_D2ds_v4 | Standard_D4ds_v4 |
| 儲存 | 32 GB | 128 GB | 256 GB |
| 備份保留 | 7 天 | 14 天 | 35 天 |
| 異地備份 | Disabled | Disabled | Enabled |
| 高可用 | Disabled | Disabled | ZoneRedundant |
| 最大連線數 | 100 | 200 | 400 |
| 慢查詢閾值 | 1000ms | 500ms | 100ms |

**密碼處理**：使用 `tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 20` 生成隨機密碼，儲存到 `.azure/output/{env}-database-credentials.txt`。

#### 階段 3：03-setup-storage.sh（291 行）

**功能**：建立 Storage Account + 3 個 Blob Container (quotes, invoices, proposals) + CORS + 軟刪除

**特殊處理**：
- 生產環境啟用 Blob 版本控制
- CORS 允許所有來源（`*`），未限定特定域名
- Storage Key 認證方式

#### 階段 4：04-setup-acr.sh（265 行）

**功能**：建立 Azure Container Registry + 啟用管理員帳號

**環境差異**：
- Dev: Basic SKU
- Staging: Standard SKU
- Prod: Premium SKU + 網路規則（Default Deny）+ 內容信任

#### 階段 5：05-setup-appservice.sh（314 行）

**功能**：建立 App Service Plan + App Service + Managed Identity + ACR Pull 權限

**關鍵配置**：
- 基礎設定：`WEBSITES_PORT=3000`, `DOCKER_ENABLE_CI=true`
- HTTPS Only 強制
- Staging/Prod 建立 staging 部署槽位
- 診斷日誌：Application Logging, Detailed Error Messages, Failed Request Tracing, Docker Container Logging

#### 階段 6：06-deploy-app.sh（270 行）

**功能**：Docker build → ACR push → App Service 更新 → 健康檢查

**步驟**：
1. 檢查 Docker daemon 運行
2. `az acr login` 登入 ACR
3. `docker build -f docker/Dockerfile` 建置映像（含 `latest` 和指定標籤）
4. `docker push` 推送到 ACR
5. `az webapp config container set` 更新 App Service 容器配置
6. `az webapp restart` 重啟
7. 最多 2 分鐘等待（24 次 x 5 秒）HTTP 200/302
8. 儲存部署記錄到 `.azure/output/{env}-last-deployment.txt`

### 3.2 入口腳本

#### deploy-to-personal.sh（166 行）

載入 `environments/personal/{env}.env` 後依序執行 01-06 腳本。驗證 `RESOURCE_GROUP`, `LOCATION`, `APP_SERVICE_NAME` 三個必要變數。

#### deploy-to-company.sh（220 行）

與 personal 類似，但增加：
- 額外驗證 `AZURE_SUBSCRIPTION_ID`
- 安全確認提示（顯示目標訂閱 + 資源群組）
- 部署完成後自動記錄到 `deployment-history/company/`

#### deploy-company-simple.sh（325 行）

一站式部署，不依賴子腳本，直接在單一腳本中執行所有 `az` CLI 命令。適用於環境已部分存在的情況。驗證 11 個必要環境變數。

#### deploy-docker-only.sh（113 行）

僅執行 Docker build + push + App Service 重啟，跳過所有基礎設施建置。適用於應用程式更新部署。

### 3.3 資料庫遷移腳本

**檔案**：`azure/scripts/run-migration.sh`（202 行）

提供兩種執行方式：
1. **本地執行**：`npx prisma migrate deploy` + `pnpm db:seed:minimal`
2. **Docker 執行**：建置 `Dockerfile.migrate` 映像並運行

互動式輸入資料庫密碼（`read -s`），不儲存於任何檔案。

### 3.4 Helper 工具

#### add-secret.sh（118 行）
```bash
./add-secret.sh <environment> <secret-category-name> <secret-value>
# 例：./add-secret.sh dev DATABASE-URL "postgresql://..."
# 產生 Key Vault Secret: ITPM-DEV-DATABASE-URL
```
功能：檢查 Key Vault 存在 → 檢查 Secret 是否已存在（可選更新）→ `az keyvault secret set` → 顯示 App Service 引用格式

#### configure-app-settings.sh（62 行）
批量設定 App Service 環境變數，分為：
- **直接值**：NODE_ENV, PORT, WEBSITES_PORT, Container 名稱, Feature Flags
- **Key Vault 引用**：DATABASE_URL, NEXTAUTH_SECRET, Azure AD B2C 全部設定, Storage 帳戶, SendGrid, Redis

#### list-secrets.sh（28 行）
`az keyvault secret list` 的簡單封裝，表格輸出 Name/Enabled/Updated。

#### rotate-secret.sh（65 行）
密鑰輪換流程：記錄舊版本 → 建立新版本 → 重啟 App Service → 等待 60 秒 → HTTP 健康檢查 → 失敗時提供回滾命令。

#### verify-deployment.sh（49 行）
驗證部署：App Service 狀態查詢 + HTTP 狀態碼檢查 + 最近 20 條日誌。

---

## 4. 測試腳本

### 4.1 smoke-test.sh（103 行）

5 項部署後煙霧測試：

| 測試 | 預期結果 |
|------|----------|
| 首頁可訪問 | HTTP 200/302 |
| API Health 端點 | HTTP 200/404 |
| 登入頁面 | HTTP 200 |
| 靜態資源路徑 | HTTP 200/404 |
| 回應時間 | < 5000ms |

### 4.2 test-azure-connectivity.sh（126 行）

7 項 Azure 連線測試：

| 測試 | 檢查內容 |
|------|----------|
| Azure CLI | 登入狀態 |
| Resource Group | 是否存在 |
| PostgreSQL | 伺服器存在 + FQDN + 防火牆規則數量 |
| Storage Account | 存在 + Container 列表 |
| ACR | 存在 + 映像倉庫數量 |
| App Service | 存在 + 狀態 + HTTP 健康檢查 |
| Key Vault | 存在 + Secret 數量 |

### 4.3 test-environment-config.sh（127 行）

環境配置完整性驗證：

**App Service 環境變數**（14 個必要項）：
NODE_ENV, PORT, WEBSITES_PORT, DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, AZURE_AD_B2C_TENANT_NAME, AZURE_AD_B2C_TENANT_ID, AZURE_AD_B2C_CLIENT_ID, AZURE_AD_B2C_CLIENT_SECRET, AZURE_STORAGE_ACCOUNT_NAME, AZURE_STORAGE_ACCOUNT_KEY, SENDGRID_API_KEY, SENDGRID_FROM_EMAIL

**Key Vault Secret**（4 個核心項）：
ITPM-{ENV}-DATABASE-URL, ITPM-{ENV}-NEXTAUTH-SECRET, ITPM-{ENV}-NEXTAUTH-URL, ITPM-{ENV}-SENDGRID-API-KEY

**Managed Identity**：Principal ID 存在 + Key Vault 角色分配

---

## 5. 環境配置範本

### 5.1 個人環境（Key Vault 引用格式）

`environments/personal/dev.env.example` 使用 Key Vault 引用語法：
```bash
DATABASE_URL=@Microsoft.KeyVault(VaultName=YOUR_COMPANY_KV;SecretName=ITPM-DEV-DATABASE-URL)
NEXTAUTH_SECRET=@Microsoft.KeyVault(VaultName=YOUR_COMPANY_KV;SecretName=ITPM-DEV-NEXTAUTH-SECRET)
```

### 5.2 公司環境（直接值格式）

`environments/company/dev.env.example` 使用直接值（因暫無 Key Vault 權限）：
```bash
AZURE_SUBSCRIPTION_ID=your-subscription-id
RESOURCE_GROUP=RG-RCITest-RAPO-N8N
POSTGRESQL_SERVER_NAME=psql-itpm-company-dev-001
POSTGRESQL_ADMIN_PASSWORD=your-strong-password
```

### 5.3 變數完整列表

| 類別 | 變數 | 個人範本 | 公司範本 |
|------|------|----------|----------|
| Azure SP | AZURE_TENANT_ID, AZURE_SUBSCRIPTION_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET | - | 必要 |
| 資源命名 | RESOURCE_GROUP, LOCATION, APP_SERVICE_NAME, APP_SERVICE_PLAN_NAME | 必要 | 必要 |
| PostgreSQL | POSTGRESQL_SERVER_NAME, ADMIN_USER, ADMIN_PASSWORD, DATABASE_NAME, SKU | - | 必要 |
| Storage | STORAGE_ACCOUNT_NAME, STORAGE_SKU | - | 必要 |
| ACR | ACR_NAME, ACR_SKU | - | 必要 |
| App 基礎 | NODE_ENV, PORT | 必要 | 必要 |
| NextAuth | NEXTAUTH_URL, NEXTAUTH_SECRET, SESSION_MAX_AGE | Key Vault 引用 | 直接值 |
| Azure AD B2C | TENANT_NAME, TENANT_ID, CLIENT_ID, CLIENT_SECRET, USER_FLOW, SCOPE | Key Vault 引用 | 直接值 |
| Storage | CONTAINER_QUOTES, CONTAINER_INVOICES, CONTAINER_PROPOSALS | 直接值 | 直接值 |
| Email | SENDGRID_API_KEY, FROM_EMAIL, FROM_NAME | Key Vault 引用 | 直接值 |
| Feature | FEATURE_AI_ASSISTANT, FEATURE_EXTERNAL_INTEGRATION | 直接值 | 直接值 |

---

## 6. 文件體系

### 6.1 核心文件

| 文件 | 對象讀者 | 核心內容 |
|------|----------|----------|
| `azure/README.md` | 所有開發者 | 目錄結構、雙環境策略、快速開始、部署版本記錄 |
| `azure/docs/DEPLOYMENT-TROUBLESHOOTING.md` | 部署工程師 | .dockerignore 排除 migrations 根因分析、部署前/後檢查清單 |
| `azure/docs/service-principal-setup.md` | DevOps/CI 管理者 | 4 種 SP 建立步驟、GitHub Secrets 配置、密鑰輪換、安全最佳實踐 |

### 6.2 故障排除重點

已記錄的部署問題：

**問題 #1**：用戶註冊 500 錯誤
- 根因：`.dockerignore` 中 `**/migrations` 排除了 Prisma migrations
- 影響鏈：Docker image 無 migrations → `prisma migrate deploy` 失敗 → 資料庫表不存在 → 外鍵約束失敗
- 解決：從 `.dockerignore` 移除 `**/migrations`

**問題 #2**：Currency 表不存在
- 根因：schema.prisma 新增 Currency model 但缺少對應 migration SQL
- 解決：手動建立 `20251126100000_add_currency` migration

---

## 7. E2E 測試體系

### 7.1 架構

```
apps/web/e2e/
├── fixtures/           認證 fixture + 測試資料工廠
├── helpers/            通用 helper（API mock、等待、表單填寫）
├── workflows/          3 個核心業務流程測試
├── error-handling/     API 錯誤恢復測試
└── example.spec.ts     基本功能驗證
```

- **框架**：Playwright
- **瀏覽器**：Chromium, Firefox
- **測試用戶**：
  - `test-manager@example.com` / `testpassword123`（ProjectManager）
  - `test-supervisor@example.com` / `testpassword123`（Supervisor）

### 7.2 業務流程覆蓋

| 流程 | 測試檔案 | 測試步驟 | 行數 |
|------|----------|----------|------|
| 預算申請 | `budget-proposal-workflow.spec.ts` | 建立 Pool → 建立 Project → 建立 Proposal → PM 提交 → Supervisor 批准/拒絕 → 驗證 | 479 |
| 採購流程 | `procurement-workflow.spec.ts` | 建立 Vendor → Quote → PO → Expense → PM 提交 → Supervisor 批准/拒絕 → 預算池扣款驗證 | 620 |
| 費用轉嫁 | `expense-chargeout-workflow.spec.ts` | 建立 Expense → 批准 → ChargeOut → PM 提交 → Supervisor 確認 → 付款 → 完整驗證 | 481 |
| API 錯誤 | `api-errors.spec.ts` | 500 錯誤恢復、錯誤訊息顯示、重試機制 | 314 |
| 基本功能 | `example.spec.ts` | 首頁、登入、角色認證、頁面導航 | 51 |

### 7.3 Fixture 設計

**auth.ts**（131 行）：擴展 Playwright `test` 物件，提供 `managerPage` 和 `supervisorPage` 兩個預認證的 Page 實例。

**test-data.ts**（117 行）：生成帶 `E2E_` 前綴和時間戳的唯一測試資料：
- `generateBudgetPoolData()`：含 2 個預算分類
- `generateProjectData()`：含日期範圍和預算金額
- `generateProposalData()`：固定金額 $50,000
- `generateVendorData()`, `generatePurchaseOrderData()`, `generateExpenseData()`, `generateChargeOutData()`

**waitForEntity.ts**（291 行）：等待實體在資料庫中持久化（透過 tRPC API 輪詢），解決非同步建立後立即查詢的時序問題。

### 7.4 執行命令

```bash
pnpm test:e2e              # 執行所有測試
pnpm test:e2e:ui           # UI 模式（推薦除錯）
pnpm test:e2e:headed       # 顯示瀏覽器
pnpm test:e2e:debug        # Debug 模式
pnpm test:e2e:report       # 查看 HTML 報告
```

---

## 8. 安全發現

### 8.1 嚴重：明文憑證已提交 Git

**檔案**：`azure/output/dev-database-credentials.txt`

已被 `git ls-files` 確認為追蹤檔案。`.gitignore` 中配置的是 `.azure/output/`（注意前綴點），但實際路徑是 `azure/output/`（無前綴點），規則不匹配。

**建議修復**：
1. `.gitignore` 添加 `azure/output/`
2. `git rm --cached azure/output/dev-database-credentials.txt`
3. 輪換已洩露的密碼
4. 使用 `git filter-branch` 或 BFG Repo-Cleaner 從歷史中移除

### 8.2 中等：Storage CORS 過於寬鬆

`03-setup-storage.sh` 第 183-193 行配置 CORS 允許所有來源 `*`。生產環境應限定為應用程式 URL。

### 8.3 中等：Bicep connectionString 輸出

`postgresql.bicep` 第 97 行輸出 connectionString 包含明文密碼。Bicep 部署日誌會記錄輸出值。

### 8.4 低：Deploy 腳本公開存取

`02-setup-database.sh` 第 266 行設定 `--public-access "0.0.0.0-255.255.255.255"`，允許所有 IP 存取 PostgreSQL。生產環境應僅允許 App Service IP 或使用 VNet 整合。

---

## 9. 與 build-and-deploy.md 的補充關係

本文件補充 `build-and-deploy.md` 中未涵蓋的內容：

| 主題 | build-and-deploy.md | 本文件 |
|------|---------------------|--------|
| Docker 建置 | 已涵蓋（3 個 Dockerfile） | 補充與部署腳本的映射關係 |
| GitHub Actions | 已涵蓋（5 個 Workflow） | 補充與手動部署腳本的對應 |
| Bicep IaC | 未涵蓋 | 完整分析 3 個模板 |
| 6 階段腳本 | 未涵蓋 | 完整分析每個階段 |
| Key Vault 管理 | 未涵蓋 | Helper 腳本 + 命名規範 |
| 部署測試 | 未涵蓋 | 3 個測試腳本分析 |
| 雙環境策略 | 部分（第 6.2 節環境表） | 完整對比 + 配置範本 |
| E2E 測試 | 未涵蓋 | 完整分析 13 個檔案 |
| 安全問題 | 未涵蓋 | 4 項安全發現 |
