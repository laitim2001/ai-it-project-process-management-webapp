# Azure 基礎設施設置指南

**版本**: 1.0
**日期**: 2025-10-02
**適用對象**: DevOps Engineer, System Administrator

---

## 📋 目錄

1. [前置需求](#前置需求)
2. [Azure 訂閱與資源群組設置](#azure-訂閱與資源群組設置)
3. [Azure AD B2C 設置](#azure-ad-b2c-設置)
4. [Azure Database for PostgreSQL 設置](#azure-database-for-postgresql-設置)
5. [Azure Blob Storage 設置](#azure-blob-storage-設置)
6. [Azure Key Vault 設置](#azure-key-vault-設置)
7. [Azure App Service 設置](#azure-app-service-設置)
8. [Azure Container Registry 設置](#azure-container-registry-設置)
9. [SendGrid Email 服務設置](#sendgrid-email-服務設置)
10. [Azure Application Insights 設置](#azure-application-insights-設置)
11. [成本估算](#成本估算)
12. [下一步](#下一步)

---

## 1. 前置需求

### 必要權限

- ✅ Azure 訂閱的 **Owner** 或 **Contributor** 角色
- ✅ Azure AD 的 **Global Administrator** 角色 (用於創建 B2C Tenant)

### 必要工具

```bash
# 安裝 Azure CLI
# Windows
winget install Microsoft.AzureCLI

# macOS
brew install azure-cli

# 驗證安裝
az --version

# 登入 Azure
az login

# 設定預設訂閱
az account set --subscription "Your-Subscription-Name-or-ID"

# 驗證當前訂閱
az account show
```

---

## 2. Azure 訂閱與資源群組設置

### 建立資源群組

我們將建立三個環境的資源群組:

```bash
# 設定變數
LOCATION="eastasia"              # 東亞區域 (台灣/香港)
PROJECT_NAME="itpm"              # 專案縮寫

# Development 環境
az group create \
  --name "rg-${PROJECT_NAME}-dev" \
  --location $LOCATION \
  --tags Environment=Development Project=ITPM

# Staging 環境
az group create \
  --name "rg-${PROJECT_NAME}-staging" \
  --location $LOCATION \
  --tags Environment=Staging Project=ITPM

# Production 環境
az group create \
  --name "rg-${PROJECT_NAME}-prod" \
  --location $LOCATION \
  --tags Environment=Production Project=ITPM
```

**命名規範**:
- `rg` = Resource Group
- `itpm` = IT Project Management
- `dev/staging/prod` = 環境

---

## 3. Azure AD B2C 設置

### Step 1: 創建 Azure AD B2C Tenant

⚠️ **注意**: B2C Tenant 是**全域獨立**的, 不屬於任何資源群組。

1. **透過 Azure Portal 創建**:
   - 前往 [Azure Portal](https://portal.azure.com)
   - 搜尋 "Azure AD B2C"
   - 點擊 "Create a new B2C Tenant"
   - 填寫:
     - Organization name: `IT Project Management`
     - Initial domain name: `itpmplatform` (必須全域唯一)
     - Country/Region: `Taiwan`

2. **等待創建完成** (約 2-3 分鐘)

3. **切換到 B2C Tenant**:
   - 點擊右上角個人頭像
   - 選擇 "Switch directory"
   - 選擇新創建的 B2C Tenant

### Step 2: 創建 User Flows

**Sign-up and Sign-in Flow**:

1. 在 B2C Tenant 中, 前往 "User flows"
2. 點擊 "New user flow"
3. 選擇 "Sign up and sign in"
4. 填寫:
   - Name: `signupsignin1` (會自動加上前綴 `B2C_1_`)
   - Identity providers: ✅ Email signup
   - User attributes and claims:
     - ✅ Email Address (Collect + Return)
     - ✅ Given Name (Collect + Return)
     - ✅ Surname (Collect + Return)
     - ✅ User's Object ID (Return only)
5. 點擊 "Create"

**Password Reset Flow** (可選):

1. 點擊 "New user flow"
2. 選擇 "Password reset"
3. Name: `passwordreset1`
4. 配置與上述類似

**Profile Editing Flow** (可選):

1. 點擊 "New user flow"
2. 選擇 "Profile editing"
3. Name: `profileediting1`

### Step 3: 註冊應用程式

1. 前往 "App registrations"
2. 點擊 "New registration"
3. 填寫:
   - Name: `IT Project Management Platform - Dev`
   - Supported account types: `Accounts in any identity provider or organizational directory`
   - Redirect URI:
     - Type: `Web`
     - URI: `http://localhost:3000/api/auth/callback/azure-ad-b2c`
4. 點擊 "Register"

5. **記錄重要資訊**:
   ```bash
   # 在 Overview 頁面
   Application (client) ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   Directory (tenant) ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```

6. **創建 Client Secret**:
   - 前往 "Certificates & secrets"
   - 點擊 "New client secret"
   - Description: `Dev Environment`
   - Expires: `24 months` (建議)
   - 點擊 "Add"
   - ⚠️ **立即複製 Secret Value**, 離開頁面後無法再查看

7. **配置 API Permissions**:
   - 前往 "API permissions"
   - 預設已有 `User.Read`, 保持即可
   - 如需額外權限, 點擊 "Add a permission"

8. **設定 Redirect URIs** (稍後為 Staging/Production 添加):
   - 前往 "Authentication"
   - 添加 Redirect URIs:
     - `https://your-staging-app.azurewebsites.net/api/auth/callback/azure-ad-b2c`
     - `https://your-production-app.azurewebsites.net/api/auth/callback/azure-ad-b2c`

### Step 4: 配置 .env

將獲取的資訊填入 `.env`:

```bash
AZURE_AD_B2C_TENANT_NAME="itpmplatform"
AZURE_AD_B2C_TENANT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
AZURE_AD_B2C_CLIENT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
AZURE_AD_B2C_CLIENT_SECRET="your-secret-value"
AZURE_AD_B2C_PRIMARY_USER_FLOW="B2C_1_signupsignin1"
```

---

## 4. Azure Database for PostgreSQL 設置

### Development 環境 (Flexible Server)

```bash
# 設定變數
RG_NAME="rg-itpm-dev"
DB_SERVER_NAME="psql-itpm-dev-001"      # 必須全域唯一
DB_ADMIN_USER="itpmadmin"
DB_ADMIN_PASSWORD="YourSecurePassword123!"  # ⚠️ 請使用強密碼
DB_NAME="itpm_dev"
SKU="Standard_B1ms"                     # 1 vCore, 2GB RAM (Dev tier)

# 創建 PostgreSQL Flexible Server
az postgres flexible-server create \
  --resource-group $RG_NAME \
  --name $DB_SERVER_NAME \
  --location eastasia \
  --admin-user $DB_ADMIN_USER \
  --admin-password $DB_ADMIN_PASSWORD \
  --sku-name $SKU \
  --tier Burstable \
  --version 16 \
  --storage-size 32 \
  --public-access 0.0.0.0-255.255.255.255 \
  --tags Environment=Development

# 創建資料庫
az postgres flexible-server db create \
  --resource-group $RG_NAME \
  --server-name $DB_SERVER_NAME \
  --database-name $DB_NAME

# 允許 Azure 服務存取
az postgres flexible-server firewall-rule create \
  --resource-group $RG_NAME \
  --name $DB_SERVER_NAME \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# 允許本地開發機器存取 (⚠️ 使用實際 IP)
az postgres flexible-server firewall-rule create \
  --resource-group $RG_NAME \
  --name $DB_SERVER_NAME \
  --rule-name AllowLocalDev \
  --start-ip-address YOUR_LOCAL_IP \
  --end-ip-address YOUR_LOCAL_IP

# 獲取連接字串
az postgres flexible-server show-connection-string \
  --server-name $DB_SERVER_NAME \
  --database-name $DB_NAME \
  --admin-user $DB_ADMIN_USER \
  --admin-password $DB_ADMIN_PASSWORD
```

**Production 環境** (使用更高規格):

```bash
RG_NAME="rg-itpm-prod"
DB_SERVER_NAME="psql-itpm-prod-001"
SKU="Standard_D2s_v3"  # 2 vCore, 8GB RAM
TIER="GeneralPurpose"

# 其餘設定類似, 並啟用:
# - High Availability (--high-availability Enabled)
# - Automated Backups (預設啟用, 保留 7 天)
# - Private Endpoint (生產環境強烈建議)
```

### 配置 .env

```bash
# Development
DATABASE_URL="postgresql://itpmadmin:YourPassword@psql-itpm-dev-001.postgres.database.azure.com:5432/itpm_dev?sslmode=require"

# Production
DATABASE_URL="postgresql://itpmadmin:YourPassword@psql-itpm-prod-001.postgres.database.azure.com:5432/itpm_prod?sslmode=require"
```

---

## 5. Azure Blob Storage 設置

```bash
# 設定變數
RG_NAME="rg-itpm-dev"
STORAGE_ACCOUNT_NAME="stitpmdev001"  # 必須全域唯一, 僅小寫字母和數字

# 創建 Storage Account
az storage account create \
  --name $STORAGE_ACCOUNT_NAME \
  --resource-group $RG_NAME \
  --location eastasia \
  --sku Standard_LRS \
  --kind StorageV2 \
  --access-tier Hot \
  --tags Environment=Development

# 創建 Blob Containers
az storage container create \
  --name quotes \
  --account-name $STORAGE_ACCOUNT_NAME \
  --public-access off

az storage container create \
  --name invoices \
  --account-name $STORAGE_ACCOUNT_NAME \
  --public-access off

# 獲取 Connection String
az storage account show-connection-string \
  --name $STORAGE_ACCOUNT_NAME \
  --resource-group $RG_NAME \
  --output tsv

# 獲取 Access Key
az storage account keys list \
  --resource-group $RG_NAME \
  --account-name $STORAGE_ACCOUNT_NAME \
  --query "[0].value" \
  --output tsv
```

### 配置 CORS (允許前端直接上傳)

```bash
az storage cors add \
  --services b \
  --methods GET POST PUT DELETE \
  --origins "http://localhost:3000" "https://your-app.azurewebsites.net" \
  --allowed-headers "*" \
  --exposed-headers "*" \
  --max-age 3600 \
  --account-name $STORAGE_ACCOUNT_NAME
```

### 配置 .env

```bash
AZURE_STORAGE_ACCOUNT_NAME="stitpmdev001"
AZURE_STORAGE_ACCOUNT_KEY="your-storage-account-key"
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net"
AZURE_STORAGE_CONTAINER_QUOTES="quotes"
AZURE_STORAGE_CONTAINER_INVOICES="invoices"
```

---

## 6. Azure Key Vault 設置

⚠️ **僅生產環境建議使用**, 開發環境可使用 `.env` 管理密鑰。

```bash
RG_NAME="rg-itpm-prod"
VAULT_NAME="kv-itpm-prod-001"  # 必須全域唯一

# 創建 Key Vault
az keyvault create \
  --name $VAULT_NAME \
  --resource-group $RG_NAME \
  --location eastasia \
  --sku standard \
  --tags Environment=Production

# 添加密鑰
az keyvault secret set \
  --vault-name $VAULT_NAME \
  --name "DATABASE-URL" \
  --value "postgresql://..."

az keyvault secret set \
  --vault-name $VAULT_NAME \
  --name "NEXTAUTH-SECRET" \
  --value "..."

az keyvault secret set \
  --vault-name $VAULT_NAME \
  --name "SENDGRID-API-KEY" \
  --value "SG...."

# 為 App Service 創建 Managed Identity (稍後設定)
# az webapp identity assign --name your-app-name --resource-group $RG_NAME

# 授予 App Service 存取 Key Vault 的權限
# az keyvault set-policy \
#   --name $VAULT_NAME \
#   --object-id <app-service-managed-identity-object-id> \
#   --secret-permissions get list
```

---

## 7. Azure App Service 設置

### 創建 App Service Plan

```bash
RG_NAME="rg-itpm-dev"
PLAN_NAME="plan-itpm-dev"
SKU="B1"  # Basic B1: 1 Core, 1.75GB RAM

az appservice plan create \
  --name $PLAN_NAME \
  --resource-group $RG_NAME \
  --location eastasia \
  --is-linux \
  --sku $SKU \
  --tags Environment=Development
```

**生產環境使用更高規格**:
```bash
SKU="P1v3"  # Premium v3: 2 Core, 8GB RAM, Auto-scaling
```

### 創建 Web App

```bash
APP_NAME="app-itpm-dev-001"  # 必須全域唯一, 將成為 URL: https://app-itpm-dev-001.azurewebsites.net

az webapp create \
  --name $APP_NAME \
  --resource-group $RG_NAME \
  --plan $PLAN_NAME \
  --deployment-container-image-name "mcr.microsoft.com/appsvc/staticsite:latest" \
  --tags Environment=Development

# 配置 Deployment Slots (Staging) - 僅 Standard tier 以上支援
az webapp deployment slot create \
  --name $APP_NAME \
  --resource-group $RG_NAME \
  --slot staging
```

### 配置應用程式設定 (Environment Variables)

```bash
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RG_NAME \
  --settings \
    NODE_ENV=production \
    DATABASE_URL="@Microsoft.KeyVault(SecretUri=https://kv-itpm-prod-001.vault.azure.net/secrets/DATABASE-URL/)" \
    NEXTAUTH_SECRET="@Microsoft.KeyVault(SecretUri=...)" \
    NEXTAUTH_URL="https://$APP_NAME.azurewebsites.net"
```

---

## 8. Azure Container Registry 設置

```bash
RG_NAME="rg-itpm-prod"
ACR_NAME="acritpmprod001"  # 必須全域唯一, 僅小寫字母和數字

# 創建 Container Registry
az acr create \
  --name $ACR_NAME \
  --resource-group $RG_NAME \
  --location eastasia \
  --sku Basic \
  --admin-enabled true

# 獲取登入憑證
az acr credential show \
  --name $ACR_NAME \
  --resource-group $RG_NAME

# 登入 ACR
az acr login --name $ACR_NAME
```

### 配置 App Service 使用 ACR

```bash
# 配置 App Service 使用 ACR 中的 Image
az webapp config container set \
  --name $APP_NAME \
  --resource-group $RG_NAME \
  --docker-custom-image-name "$ACR_NAME.azurecr.io/itpm-web:latest" \
  --docker-registry-server-url "https://$ACR_NAME.azurecr.io" \
  --docker-registry-server-user <acr-username> \
  --docker-registry-server-password <acr-password>
```

---

## 9. SendGrid Email 服務設置

### Step 1: 創建 SendGrid 帳號

1. 前往 [SendGrid](https://sendgrid.com/)
2. 註冊免費帳號 (每月 100 封免費)
3. 或在 Azure Marketplace 訂閱

### Step 2: 創建 API Key

1. 登入 SendGrid Dashboard
2. 前往 Settings → API Keys
3. 點擊 "Create API Key"
4. Name: `ITPM Platform - Production`
5. Permissions: `Full Access` (或僅 `Mail Send`)
6. 點擊 "Create & View"
7. ⚠️ **立即複製 API Key**, 無法再次查看

### Step 3: 驗證發件人域名

1. 前往 Settings → Sender Authentication
2. 選擇 "Authenticate Your Domain"
3. 依照指示在你的 DNS 設定中添加 CNAME 記錄
4. 等待驗證完成 (通常數分鐘到數小時)

### Step 4: 創建 Email Templates (可選)

1. 前往 Email API → Dynamic Templates
2. 創建範本:
   - Proposal Submitted
   - Proposal Approved
   - Proposal Rejected
   - More Information Required

### 配置 .env

```bash
SENDGRID_API_KEY="SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"
SENDGRID_FROM_NAME="IT Project Management Platform"
```

---

## 10. Azure Application Insights 設置

```bash
RG_NAME="rg-itpm-prod"
INSIGHTS_NAME="appi-itpm-prod"

# 創建 Application Insights
az monitor app-insights component create \
  --app $INSIGHTS_NAME \
  --location eastasia \
  --resource-group $RG_NAME \
  --application-type web \
  --tags Environment=Production

# 獲取 Connection String
az monitor app-insights component show \
  --app $INSIGHTS_NAME \
  --resource-group $RG_NAME \
  --query connectionString \
  --output tsv

# 獲取 Instrumentation Key
az monitor app-insights component show \
  --app $INSIGHTS_NAME \
  --resource-group $RG_NAME \
  --query instrumentationKey \
  --output tsv
```

### 配置 .env

```bash
AZURE_APP_INSIGHTS_CONNECTION_STRING="InstrumentationKey=xxxx;IngestionEndpoint=https://eastasia-1.in.applicationinsights.azure.com/;LiveEndpoint=https://eastasia.livediagnostics.monitor.azure.com/"
AZURE_APP_INSIGHTS_INSTRUMENTATION_KEY="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

---

## 11. 成本估算

### Development 環境 (每月估算)

| 服務 | SKU | 預估成本 (USD) |
|------|-----|----------------|
| App Service Plan | B1 (Basic) | ~$13 |
| PostgreSQL | Burstable B1ms | ~$13 |
| Blob Storage | Standard LRS (10GB) | ~$0.50 |
| Azure AD B2C | 前 50,000 MAU 免費 | $0 |
| SendGrid | 免費方案 (100 emails/day) | $0 |
| **總計** | | **~$27/月** |

### Production 環境 (每月估算)

| 服務 | SKU | 預估成本 (USD) |
|------|-----|----------------|
| App Service Plan | P1v3 (Premium) | ~$146 |
| PostgreSQL | General Purpose D2s_v3 | ~$130 |
| Blob Storage | Standard LRS (100GB) | ~$2 |
| Application Insights | 前 5GB 免費 | ~$5 |
| Container Registry | Basic | ~$5 |
| Key Vault | 10,000 transactions | ~$0.30 |
| SendGrid | Essentials (40K emails/month) | ~$20 |
| **總計** | | **~$308/月** |

⚠️ **注意**:
- 以上為估算, 實際成本依使用量而定
- 建議設定 Cost Alerts 監控支出
- 開發環境可使用 Azure Dev/Test Pricing 節省成本

---

## 12. 下一步

完成基礎設施設置後:

1. ✅ **驗證所有服務可連通性**
   ```bash
   # 測試資料庫連線
   psql "postgresql://itpmadmin:password@psql-itpm-dev-001.postgres.database.azure.com:5432/itpm_dev?sslmode=require"

   # 測試 Blob Storage
   az storage blob list --container-name quotes --account-name stitpmdev001
   ```

2. ✅ **更新 .env 檔案** - 將所有獲取的密鑰填入

3. ✅ **執行資料庫遷移**
   ```bash
   pnpm prisma migrate deploy
   ```

4. ✅ **設定 GitHub Actions CI/CD**
   - 參考 [GitHub Actions Setup Guide](./github-actions-setup.md)

5. ✅ **配置監控告警**
   - 在 Azure Monitor 設定 Alert Rules
   - 監控指標: CPU > 80%, Memory > 80%, Response Time > 2s

6. ✅ **備份策略**
   - PostgreSQL: 自動備份已啟用 (保留 7 天)
   - Blob Storage: 啟用 Soft Delete (建議 30 天)

---

## 📞 資源連結

- [Azure Portal](https://portal.azure.com)
- [Azure AD B2C Documentation](https://learn.microsoft.com/azure/active-directory-b2c/)
- [Azure Database for PostgreSQL Documentation](https://learn.microsoft.com/azure/postgresql/)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Azure Pricing Calculator](https://azure.microsoft.com/pricing/calculator/)

---

**完成時間估算**: 4-6 小時 (首次設置)
