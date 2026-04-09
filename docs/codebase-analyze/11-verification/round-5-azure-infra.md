# Round 5 驗證報告：Azure 基礎架構與 E2E 測試

> 驗證日期：2026-04-09
> 驗證範圍：`azure/` 目錄（35 檔案）、`apps/web/e2e/` 目錄（13 檔案）
> 驗證狀態：完成

---

## A. Azure 目錄完整清單（35 檔案，共 ~6,100 行）

### A.1 IaC — Bicep 模板（3 檔案，279 行）

| 檔案 | 行數 | 用途 |
|------|------|------|
| `azure/templates/app-service.bicep` | 99 | App Service Plan (B1 Linux) + App Service (Container) + System Managed Identity |
| `azure/templates/postgresql.bicep` | 97 | PostgreSQL Flexible Server (Standard_B1ms) + 防火牆規則 + 資料庫 |
| `azure/templates/storage.bicep` | 83 | Storage Account (StorageV2, Standard_LRS) + Blob Containers (quotes, invoices) |

### A.2 部署腳本 — 主流程（10 檔案，2,825 行）

| 檔案 | 行數 | 類別 | 用途 |
|------|------|------|------|
| `azure/scripts/01-setup-resources.sh` | 394 | 基礎設施 | 建立 Resource Group + NSG + Log Analytics Workspace |
| `azure/scripts/02-setup-database.sh` | 465 | 基礎設施 | 建立 PostgreSQL Flexible Server + 防火牆 + 參數配置 |
| `azure/scripts/03-setup-storage.sh` | 291 | 基礎設施 | 建立 Storage Account + 3 個 Blob Container + CORS |
| `azure/scripts/04-setup-acr.sh` | 265 | 基礎設施 | 建立 Azure Container Registry + admin 帳號啟用 |
| `azure/scripts/05-setup-appservice.sh` | 314 | 基礎設施 | 建立 App Service Plan + App Service + Managed Identity + ACR Pull 權限 |
| `azure/scripts/06-deploy-app.sh` | 270 | 部署 | Docker build → ACR push → App Service 更新 → 健康檢查 |
| `azure/scripts/deploy-to-personal.sh` | 166 | 入口腳本 | 個人環境部署入口，依序呼叫 01-06 腳本 |
| `azure/scripts/deploy-to-company.sh` | 220 | 入口腳本 | 公司環境部署入口，含安全確認提示 + 部署歷史記錄 |
| `azure/scripts/deploy-company-simple.sh` | 325 | 簡化部署 | 公司環境一站式部署（不依賴子腳本，直接 az CLI） |
| `azure/scripts/deploy-docker-only.sh` | 113 | 部署 | 僅 Docker build + push + App Service 重啟（跳過基礎設施） |

### A.3 部署腳本 — 輔助工具（6 檔案，524 行）

| 檔案 | 行數 | 用途 |
|------|------|------|
| `azure/scripts/run-migration.sh` | 202 | 對 Azure PostgreSQL 執行 Prisma migrate deploy + seed（支援本地/Docker 兩種方式） |
| `azure/scripts/helper/add-secret.sh` | 118 | 新增 Key Vault Secret（含命名規範：`ITPM-{ENV}-{NAME}`） |
| `azure/scripts/helper/configure-app-settings.sh` | 62 | 批量設定 App Service 環境變數（含 Key Vault 引用） |
| `azure/scripts/helper/list-secrets.sh` | 28 | 列出 Key Vault 中所有 Secret |
| `azure/scripts/helper/rotate-secret.sh` | 65 | 輪換 Key Vault Secret + 重啟 App Service + 健康驗證 |
| `azure/scripts/helper/verify-deployment.sh` | 49 | 驗證部署健康：App Service 狀態 + HTTP 檢查 + 日誌 |

### A.4 測試腳本（3 檔案，356 行）

| 檔案 | 行數 | 用途 |
|------|------|------|
| `azure/tests/smoke-test.sh` | 103 | 5 項煙霧測試：首頁、API Health、登入頁、靜態資源、回應時間 |
| `azure/tests/test-azure-connectivity.sh` | 126 | 7 項 Azure 連線測試：CLI、RG、PostgreSQL、Storage、ACR、App Service、Key Vault |
| `azure/tests/test-environment-config.sh` | 127 | 環境變數完整性檢查：App Service 設定 + Key Vault Secret + Managed Identity 權限 |

### A.5 環境配置範本（5 檔案，432 行）

| 檔案 | 行數 | 用途 |
|------|------|------|
| `azure/environments/personal/dev.env.example` | 97 | 個人環境 Dev 配置範本（Key Vault 引用格式） |
| `azure/environments/personal/staging.env.example` | 64 | 個人環境 Staging 配置範本 |
| `azure/environments/personal/prod.env.example` | 74 | 個人環境 Prod 配置範本 |
| `azure/environments/company/dev.env.example` | 88 | 公司環境 Dev 配置範本（直接值格式） |
| `azure/environments/company/dev.env` | 111 | **實際公司環境配置**（未追蹤於 Git） |

### A.6 文件（7 檔案，1,673 行）

| 檔案 | 行數 | 用途 |
|------|------|------|
| `azure/README.md` | 340 | 主文件：目錄結構、雙環境策略、快速開始、部署版本記錄 |
| `azure/docs/DEPLOYMENT-TROUBLESHOOTING.md` | 399 | 故障排除：.dockerignore 排除 migrations、Currency 表缺失 |
| `azure/docs/service-principal-setup.md` | 406 | Service Principal 建立：CI/CD SP + AI 工具 SP + GitHub Secrets 配置 |
| `azure/templates/README.md` | 79 | Bicep 模板使用指引 |
| `azure/scripts/helper/README.md` | 155 | Helper 腳本使用指引 |
| `azure/environments/company/README.md` | 181 | 公司環境配置指引 |
| `azure/environments/personal/README.md` | 113 | 個人環境配置指引 |

### A.7 輸出檔案（1 檔案）

| 檔案 | 行數 | 用途 |
|------|------|------|
| `azure/output/dev-database-credentials.txt` | 16 | **已追蹤於 Git 的資料庫憑證**（見安全問題 S1） |

---

## B. IaC 分析

### B.1 Bicep 模板資源總覽

| 模板 | 佈建的 Azure 資源 | API 版本 |
|------|-------------------|----------|
| `app-service.bicep` | `Microsoft.Web/serverfarms` (B1 Linux), `Microsoft.Web/sites` (Container) | 2022-09-01 |
| `postgresql.bicep` | `Microsoft.DBforPostgreSQL/flexibleServers` (Standard_B1ms), firewallRules, databases | 2022-12-01 |
| `storage.bicep` | `Microsoft.Storage/storageAccounts` (StorageV2), blobServices, containers (quotes, invoices) | 2023-01-01 |

### B.2 參數與輸出

**app-service.bicep**:
- 參數：`location`, `environment` (dev/staging/prod), `appServicePlanName`, `appServiceName`, `acrName`, `imageTag`, `keyVaultName`
- 輸出：`appServiceUrl`, `appServicePrincipalId`, `appServiceName`
- 特點：System Assigned Managed Identity, HTTPS Only, FTPS Disabled, TLS 1.2, Port 3000

**postgresql.bicep**:
- 參數：`location`, `environment`, `serverName`, `administratorLogin` (@secure), `administratorPassword` (@secure), `postgresqlVersion`, `databaseName`
- 輸出：`serverFqdn`, `databaseName`, `connectionString`
- **安全問題**：connectionString 輸出包含明文密碼

**storage.bicep**:
- 參數：`location`, `environment`, `storageAccountName`
- 輸出：`storageAccountName`, `storageAccountId`, `quotesContainerName`, `invoicesContainerName`, `blobEndpoint`
- 特點：HTTPS Only, TLS 1.2, No Public Access, 7 天軟刪除

### B.3 Bicep 與腳本的關係

Bicep 模板是**可選替代方案**。實際部署主要使用 `01-06` Shell 腳本中的 `az` CLI 命令。Bicep 模板涵蓋 App Service、PostgreSQL、Storage 三大資源，但**缺少**以下腳本中建立的資源：
- Azure Container Registry（無對應 Bicep）
- Key Vault（無對應 Bicep）
- NSG 網路安全組（無對應 Bicep）
- Log Analytics Workspace（無對應 Bicep）

### B.4 與 Docker 的關係

- `06-deploy-app.sh` 引用 `docker/Dockerfile` 進行建置
- `deploy-company-simple.sh` 和 `deploy-docker-only.sh` 引用根目錄 `Dockerfile`
- 映像命名規範：`{ACR_NAME}.azurecr.io/itpm-web:{tag}`
- App Service 配置 `WEBSITES_PORT=3000` 對應 Dockerfile 的 `EXPOSE 3000`

---

## C. 部署腳本分析

### C.1 部署流程（6 階段）

```
01-setup-resources.sh → 02-setup-database.sh → 03-setup-storage.sh
    → 04-setup-acr.sh → 05-setup-appservice.sh → 06-deploy-app.sh
```

每個腳本的前置條件：
- **所有腳本**：Azure CLI 已登入、環境參數 (dev/staging/prod)
- **02-06**：Resource Group 已存在
- **06**：Docker daemon 運行中、ACR 可存取

### C.2 環境差異化配置

| 資源 | Dev | Staging | Prod |
|------|-----|---------|------|
| PostgreSQL SKU | Standard_B1ms | Standard_D2ds_v4 | Standard_D4ds_v4 |
| PostgreSQL 儲存 | 32 GB | 128 GB | 256 GB |
| 備份保留 | 7 天 | 14 天 | 35 天 |
| 異地備份 | Disabled | Disabled | Enabled |
| 高可用 | Disabled | Disabled | ZoneRedundant |
| 最大連線數 | 100 | 200 | 400 |
| 慢查詢閾值 | 1000ms | 500ms | 100ms |
| Log Analytics 保留 | 30 天 | 60 天 | 90 天 |
| Storage SKU | Standard_LRS | Standard_GRS | Standard_GZRS |
| ACR SKU | Basic | Standard | Premium |
| App Service SKU | B1 | S1 | P1V3 |
| 部署槽位 | 無 | staging slot | staging slot |
| 資源鎖定 | 無 | 無 | CanNotDelete |

### C.3 與 GitHub Actions 的關係

- `azure-deploy-dev.yml`：觸發於 `develop` 分支，執行 Docker build → ACR push → App Service 部署
- `azure-deploy-prod.yml`：觸發於 Release Tag，藍綠部署 + Slot Swap
- Shell 腳本主要用於**手動部署**和**首次基礎設施建置**
- GitHub Actions 直接使用 `az` CLI 命令，不依賴 Shell 腳本

### C.4 Secret 管理策略

Key Vault Secret 命名規範：`ITPM-{ENV}-{CATEGORY-NAME}`
- 範例：`ITPM-DEV-DATABASE-URL`, `ITPM-PROD-NEXTAUTH-SECRET`
- App Service 引用格式：`@Microsoft.KeyVault(VaultName=kv-itpm-{env};SecretName=...)`
- Managed Identity 授權 App Service 存取 Key Vault

---

## D. 與現有文件交叉比對

### D.1 build-and-deploy.md 缺失項目

現有 `docs/codebase-analyze/01-project-overview/build-and-deploy.md` 已涵蓋：
- Turborepo 建置命令
- Docker 設置（3 個 Dockerfile）
- GitHub Actions CI/CD（5 個 Workflow）
- 環境變數配置
- 開發環境設置

**缺失的 azure/ 相關內容**：
1. **azure/ 目錄完全未被分析**（R4 已標記）
2. 缺少 Bicep 模板分析
3. 缺少 6 階段部署腳本流程說明
4. 缺少 Key Vault Secret 管理工具文件
5. 缺少 Azure 煙霧測試和連線測試說明
6. 缺少雙環境（個人/公司）部署策略
7. 缺少 deploy-company-simple.sh 簡化部署腳本

**已有但不完整**：
- Azure 基礎架構表（第 6.1 節）列出資源但缺少 Key Vault 和 NSG
- 缺少 deploy-docker-only.sh 和 run-migration.sh

### D.2 config-and-env.md 比對

現有 `config-and-env.md` 已涵蓋 `.env.example` 中的環境變數。

**azure/ 環境配置中額外的變數**（未在 config-and-env.md 中記錄）：
- `AZURE_TENANT_ID` / `AZURE_SUBSCRIPTION_ID` / `AZURE_CLIENT_ID` / `AZURE_CLIENT_SECRET`（Service Principal 用）
- `RESOURCE_GROUP` / `LOCATION` / `APP_SERVICE_NAME` / `APP_SERVICE_PLAN_NAME`（Azure 資源命名用）
- `POSTGRESQL_SERVER_NAME` / `POSTGRESQL_ADMIN_USER` / `POSTGRESQL_ADMIN_PASSWORD`（資料庫建置用）
- `STORAGE_ACCOUNT_NAME` / `ACR_NAME`（資源建置用）
- `NEXT_PUBLIC_AZURE_AD_B2C_ENABLED`（B2C 啟用旗標）

這些變數屬於 **Azure 部署腳本專用**，不影響應用程式 runtime。

---

## E. E2E 測試目錄分析

### E.1 完整檔案清單（13 檔案，約 3,340 行獨立內容）

| 檔案 | 行數 | 類別 | 用途 |
|------|------|------|------|
| `e2e/example.spec.ts` | 51 | 基本測試 | 首頁、登入頁、PM/Supervisor 登入、頁面導航（7 個測試） |
| `e2e/workflows/budget-proposal-workflow.spec.ts` | 479 | 工作流 | 完整預算申請流程 + 拒絕流程（2 個測試） |
| `e2e/workflows/procurement-workflow.spec.ts` | 620 | 工作流 | 供應商 → 報價 → PO → 費用 → 批准（含拒絕流程） |
| `e2e/workflows/expense-chargeout-workflow.spec.ts` | 481 | 工作流 | 費用轉嫁 ChargeOut 完整流程（含拒絕 + 多項目） |
| `e2e/error-handling/api-errors.spec.ts` | 314 | 錯誤處理 | API 500 錯誤恢復測試 |
| `e2e/fixtures/auth.ts` | 131 | Fixture | 認證 fixture：managerPage, supervisorPage |
| `e2e/fixtures/auth.fixture.ts` | 53 | Fixture | 認證 helper（loginAsProjectManager, loginAsSupervisor） |
| `e2e/fixtures/test-data.ts` | 117 | Fixture | 測試資料工廠（generate*Data 函數） |
| `e2e/fixtures/test-data.fixture.ts` | 174 | Fixture | 擴展測試資料 + API 錯誤訊息 |
| `e2e/helpers/test-helpers.ts` | 419 | Helper | mockApiError, waitForToast, fillProjectForm 等 |
| `e2e/helpers/waitForEntity.ts` | 291 | Helper | waitForEntityPersisted, extractIdFromURL |
| `e2e/README.md` | 452 | 文件 | 完整使用說明 + 測試覆蓋 + CI/CD 配置 |
| `e2e/CLAUDE.md` | 211 | 文件 | AI 助手測試指引 |

### E.2 測試框架與配置

- **框架**：Playwright
- **瀏覽器**：Chromium + Firefox
- **並行**：fullyParallel = true
- **重試**：CI 環境 2 次，本地 0 次
- **超時**：30 秒
- **失敗處理**：trace on-first-retry, screenshot only-on-failure, video retain-on-failure
- **開發伺服器**：自動啟動 `pnpm dev`，復用已運行的伺服器

### E.3 測試場景與頁面覆蓋

| 測試場景 | 覆蓋的頁面路由 | 對應 Epic |
|----------|---------------|----------|
| 基本功能 | `/`, `/login`, `/dashboard`, `/budget-pools`, `/projects`, `/charge-outs` | Epic 1, 2, 7 |
| 預算申請 | `/budget-pools/new`, `/budget-pools/{id}`, `/projects/new`, `/projects/{id}`, `/proposals/new`, `/proposals/{id}` | Epic 2, 3 |
| 採購流程 | `/vendors/new`, `/purchase-orders/new`, `/expenses/new` | Epic 5, 6 |
| 費用轉嫁 | `/expenses/{id}`, `/charge-outs/new`, `/charge-outs/{id}` | FEAT-005 |
| API 錯誤 | `/projects/new`, `/proposals/new` | 橫切面 |

**未覆蓋的頁面**（以 20 個路由模組計算）：
- `/quotes`
- `/om-expenses`、`/om-expense-categories`、`/om-summary`
- `/data-import`
- `/operating-companies`
- `/users`
- `/notifications`
- `/settings`
- `/register`、`/forgot-password`

---

## F. 安全問題

### S1. 資料庫憑證已提交至 Git（嚴重）

**檔案**：`azure/output/dev-database-credentials.txt`

此檔案包含 Dev 環境的 PostgreSQL 管理員帳密和完整 DATABASE_URL，且已被 Git 追蹤。

**根因**：`.gitignore` 中配置的是 `.azure/output/`（帶前綴點），但實際目錄是 `azure/output/`（無前綴點），導致 gitignore 規則未生效。

**已洩露的資訊**：
- 伺服器 FQDN：`psql-itpm-dev-001.postgres.database.azure.com`
- 管理員帳號：`itpmadmin`
- 管理員密碼：明文（20 字元）
- 完整 DATABASE_URL

**建議**：
1. 立即從 Git 歷史中移除（`git filter-branch` 或 BFG Repo-Cleaner）
2. 輪換 Dev 環境資料庫密碼
3. 在 `.gitignore` 中添加 `azure/output/`（無前綴點）

### S2. Bicep 模板輸出明文密碼（中等）

`postgresql.bicep` 第 97 行的 `connectionString` 輸出包含明文密碼。Bicep 部署日誌中可能留下此值。建議移除此輸出或標記為 `@secure()`。

---

## G. 驗證結論

### 本輪新發現（R5 專屬）

1. `azure/` 目錄包含 35 檔案、約 6,100 行程式碼，構成完整的 Azure 部署體系
2. 採用 6 階段漸進式部署腳本 + 3 個 Bicep IaC 模板（可選）
3. 支援雙環境策略（個人/公司 Azure 訂閱）
4. 完善的 Secret 管理（Key Vault + Managed Identity + Helper 腳本）
5. 3 個部署後測試腳本（smoke test、connectivity、environment config）
6. **嚴重安全問題**：`azure/output/dev-database-credentials.txt` 包含明文密碼且已追蹤於 Git
7. Bicep 模板缺少 ACR、Key Vault、NSG、Log Analytics 的定義
8. E2E 測試覆蓋 3 個核心業務流程但未覆蓋 OM Expense、Data Import 等後期功能

### 已填補的分析缺口

| 缺口 | R5 產出 |
|------|---------|
| azure/ 目錄未分析（R4 發現） | 新增 `01-project-overview/azure-infrastructure.md` |
| 部署腳本流程未記錄 | 6 階段流程 + 環境差異化配置 |
| IaC 模板未分析 | 3 個 Bicep 模板完整參數/輸出分析 |
| E2E 測試未記錄 | 13 檔案、測試場景覆蓋對照 |
| 安全問題 | 發現 S1 明文密碼洩露 |
