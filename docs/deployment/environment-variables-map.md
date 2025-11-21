# 環境變數映射表

**最後更新**: 2025-11-20
**用途**: Azure App Service 環境變數與 Key Vault 密鑰映射關係

---

## 📋 目錄

- [概覽](#概覽)
- [映射表 - Dev 環境](#映射表---dev-環境)
- [映射表 - Staging 環境](#映射表---staging-環境)
- [映射表 - Production 環境](#映射表---production-環境)
- [Key Vault 引用語法](#key-vault-引用語法)
- [配置指南](#配置指南)
- [驗證方法](#驗證方法)

---

## 🎯 概覽

Azure App Service 通過環境變數獲取配置。敏感資訊（如密碼、API 密鑰）應存儲在 **Azure Key Vault**，並使用 **Key Vault 引用** 在 App Service 中引用。

### 配置方式對比

| 方式 | 適用場景 | 安全性 | 管理難度 |
|------|---------|--------|---------|
| **直接設置環境變數** | 非敏感配置（如 PORT, NODE_ENV） | ⚠️ 低 | 🟢 簡單 |
| **Key Vault 引用** | 敏感資訊（密碼、API 密鑰） | ✅ 高 | 🟡 中等 |

---

## 🔵 映射表 - Dev 環境

### App Service: `app-itpm-dev-001`
### Key Vault: `kv-itpm-dev`

| 環境變數名稱 | 值來源 | Key Vault 引用 | 範例值 |
|-------------|--------|---------------|--------|
| `NODE_ENV` | 直接設置 | - | `production` |
| `PORT` | 直接設置 | - | `3000` |
| `WEBSITES_PORT` | 直接設置 | - | `3000` |
| `DATABASE_URL` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-dev;SecretName=ITPM-DEV-DATABASE-URL)` | - |
| `NEXTAUTH_SECRET` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-dev;SecretName=ITPM-DEV-NEXTAUTH-SECRET)` | - |
| `NEXTAUTH_URL` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-dev;SecretName=ITPM-DEV-NEXTAUTH-URL)` | - |
| `NEXTAUTH_SESSION_MAX_AGE` | 直接設置 | - | `86400` |
| `AZURE_AD_B2C_TENANT_NAME` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-dev;SecretName=ITPM-DEV-AZUREADB2C-TENANT-NAME)` | - |
| `AZURE_AD_B2C_TENANT_ID` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-dev;SecretName=ITPM-DEV-AZUREADB2C-TENANT-ID)` | - |
| `AZURE_AD_B2C_CLIENT_ID` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-dev;SecretName=ITPM-DEV-AZUREADB2C-CLIENT-ID)` | - |
| `AZURE_AD_B2C_CLIENT_SECRET` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-dev;SecretName=ITPM-DEV-AZUREADB2C-CLIENT-SECRET)` | - |
| `AZURE_AD_B2C_PRIMARY_USER_FLOW` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-dev;SecretName=ITPM-DEV-AZUREADB2C-USER-FLOW)` | - |
| `AZURE_AD_B2C_SCOPE` | 直接設置 | - | `openid profile email offline_access` |
| `AZURE_STORAGE_USE_DEVELOPMENT` | 直接設置 | - | `false` |
| `AZURE_STORAGE_ACCOUNT_NAME` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-dev;SecretName=ITPM-DEV-STORAGE-ACCOUNT-NAME)` | - |
| `AZURE_STORAGE_ACCOUNT_KEY` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-dev;SecretName=ITPM-DEV-STORAGE-ACCOUNT-KEY)` | - |
| `AZURE_STORAGE_CONTAINER_QUOTES` | 直接設置 | - | `quotes` |
| `AZURE_STORAGE_CONTAINER_INVOICES` | 直接設置 | - | `invoices` |
| `AZURE_STORAGE_CONTAINER_PROPOSALS` | 直接設置 | - | `proposals` |
| `SENDGRID_API_KEY` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-dev;SecretName=ITPM-DEV-SENDGRID-API-KEY)` | - |
| `SENDGRID_FROM_EMAIL` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-dev;SecretName=ITPM-DEV-SENDGRID-FROM-EMAIL)` | - |
| `SENDGRID_FROM_NAME` | 直接設置 | - | `IT Project Management (Dev)` |
| `REDIS_URL` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-dev;SecretName=ITPM-DEV-REDIS-URL)` | - |
| `NEXT_PUBLIC_FEATURE_AI_ASSISTANT` | 直接設置 | - | `false` |
| `NEXT_PUBLIC_FEATURE_EXTERNAL_INTEGRATION` | 直接設置 | - | `false` |

**總計**: 26 個環境變數（12 個 Key Vault 引用 + 14 個直接設置）

---

## 🟡 映射表 - Staging 環境

### App Service: `app-itpm-staging-001`
### Key Vault: `kv-itpm-staging`

| 環境變數名稱 | 值來源 | Key Vault 引用 | 範例值 |
|-------------|--------|---------------|--------|
| `NODE_ENV` | 直接設置 | - | `production` |
| `PORT` | 直接設置 | - | `3000` |
| `WEBSITES_PORT` | 直接設置 | - | `3000` |
| `DATABASE_URL` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-staging;SecretName=ITPM-STAGING-DATABASE-URL)` | - |
| `NEXTAUTH_SECRET` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-staging;SecretName=ITPM-STAGING-NEXTAUTH-SECRET)` | - |
| `NEXTAUTH_URL` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-staging;SecretName=ITPM-STAGING-NEXTAUTH-URL)` | - |
| `NEXTAUTH_SESSION_MAX_AGE` | 直接設置 | - | `86400` |
| `AZURE_AD_B2C_TENANT_NAME` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-staging;SecretName=ITPM-STAGING-AZUREADB2C-TENANT-NAME)` | - |
| `AZURE_AD_B2C_TENANT_ID` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-staging;SecretName=ITPM-STAGING-AZUREADB2C-TENANT-ID)` | - |
| `AZURE_AD_B2C_CLIENT_ID` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-staging;SecretName=ITPM-STAGING-AZUREADB2C-CLIENT-ID)` | - |
| `AZURE_AD_B2C_CLIENT_SECRET` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-staging;SecretName=ITPM-STAGING-AZUREADB2C-CLIENT-SECRET)` | - |
| `AZURE_AD_B2C_PRIMARY_USER_FLOW` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-staging;SecretName=ITPM-STAGING-AZUREADB2C-USER-FLOW)` | - |
| `AZURE_AD_B2C_SCOPE` | 直接設置 | - | `openid profile email offline_access` |
| `AZURE_STORAGE_USE_DEVELOPMENT` | 直接設置 | - | `false` |
| `AZURE_STORAGE_ACCOUNT_NAME` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-staging;SecretName=ITPM-STAGING-STORAGE-ACCOUNT-NAME)` | - |
| `AZURE_STORAGE_ACCOUNT_KEY` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-staging;SecretName=ITPM-STAGING-STORAGE-ACCOUNT-KEY)` | - |
| `AZURE_STORAGE_CONTAINER_QUOTES` | 直接設置 | - | `quotes` |
| `AZURE_STORAGE_CONTAINER_INVOICES` | 直接設置 | - | `invoices` |
| `AZURE_STORAGE_CONTAINER_PROPOSALS` | 直接設置 | - | `proposals` |
| `SENDGRID_API_KEY` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-staging;SecretName=ITPM-STAGING-SENDGRID-API-KEY)` | - |
| `SENDGRID_FROM_EMAIL` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-staging;SecretName=ITPM-STAGING-SENDGRID-FROM-EMAIL)` | - |
| `SENDGRID_FROM_NAME` | 直接設置 | - | `IT Project Management (Staging)` |
| `REDIS_URL` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-staging;SecretName=ITPM-STAGING-REDIS-URL)` | - |
| `NEXT_PUBLIC_FEATURE_AI_ASSISTANT` | 直接設置 | - | `false` |
| `NEXT_PUBLIC_FEATURE_EXTERNAL_INTEGRATION` | 直接設置 | - | `false` |

**總計**: 26 個環境變數（13 個 Key Vault 引用 + 13 個直接設置）

---

## 🔴 映射表 - Production 環境

### App Service: `app-itpm-prod-001`
### Key Vault: `kv-itpm-prod`

| 環境變數名稱 | 值來源 | Key Vault 引用 | 範例值 |
|-------------|--------|---------------|--------|
| `NODE_ENV` | 直接設置 | - | `production` |
| `PORT` | 直接設置 | - | `3000` |
| `WEBSITES_PORT` | 直接設置 | - | `3000` |
| `DATABASE_URL` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-prod;SecretName=ITPM-PROD-DATABASE-URL)` | - |
| `NEXTAUTH_SECRET` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-prod;SecretName=ITPM-PROD-NEXTAUTH-SECRET)` | - |
| `NEXTAUTH_URL` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-prod;SecretName=ITPM-PROD-NEXTAUTH-URL)` | - |
| `NEXTAUTH_SESSION_MAX_AGE` | 直接設置 | - | `86400` |
| `AZURE_AD_B2C_TENANT_NAME` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-prod;SecretName=ITPM-PROD-AZUREADB2C-TENANT-NAME)` | - |
| `AZURE_AD_B2C_TENANT_ID` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-prod;SecretName=ITPM-PROD-AZUREADB2C-TENANT-ID)` | - |
| `AZURE_AD_B2C_CLIENT_ID` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-prod;SecretName=ITPM-PROD-AZUREADB2C-CLIENT-ID)` | - |
| `AZURE_AD_B2C_CLIENT_SECRET` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-prod;SecretName=ITPM-PROD-AZUREADB2C-CLIENT-SECRET)` | - |
| `AZURE_AD_B2C_PRIMARY_USER_FLOW` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-prod;SecretName=ITPM-PROD-AZUREADB2C-USER-FLOW)` | - |
| `AZURE_AD_B2C_SCOPE` | 直接設置 | - | `openid profile email offline_access` |
| `AZURE_STORAGE_USE_DEVELOPMENT` | 直接設置 | - | `false` |
| `AZURE_STORAGE_ACCOUNT_NAME` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-prod;SecretName=ITPM-PROD-STORAGE-ACCOUNT-NAME)` | - |
| `AZURE_STORAGE_ACCOUNT_KEY` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-prod;SecretName=ITPM-PROD-STORAGE-ACCOUNT-KEY)` | - |
| `AZURE_STORAGE_CONTAINER_QUOTES` | 直接設置 | - | `quotes` |
| `AZURE_STORAGE_CONTAINER_INVOICES` | 直接設置 | - | `invoices` |
| `AZURE_STORAGE_CONTAINER_PROPOSALS` | 直接設置 | - | `proposals` |
| `SENDGRID_API_KEY` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-prod;SecretName=ITPM-PROD-SENDGRID-API-KEY)` | - |
| `SENDGRID_FROM_EMAIL` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-prod;SecretName=ITPM-PROD-SENDGRID-FROM-EMAIL)` | - |
| `SENDGRID_FROM_NAME` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-prod;SecretName=ITPM-PROD-SENDGRID-FROM-NAME)` | - |
| `REDIS_URL` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-prod;SecretName=ITPM-PROD-REDIS-URL)` | - |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | Key Vault | `@Microsoft.KeyVault(VaultName=kv-itpm-prod;SecretName=ITPM-PROD-APP-INSIGHTS-CONNECTION-STRING)` | - |
| `NEXT_PUBLIC_FEATURE_AI_ASSISTANT` | 直接設置 | - | `false` |
| `NEXT_PUBLIC_FEATURE_EXTERNAL_INTEGRATION` | 直接設置 | - | `false` |

**總計**: 27 個環境變數（14 個 Key Vault 引用 + 13 個直接設置）

---

## 🔗 Key Vault 引用語法

### 標準格式
```
@Microsoft.KeyVault(VaultName={vault-name};SecretName={secret-name})
```

### 範例
```bash
# 資料庫連接字串
@Microsoft.KeyVault(VaultName=kv-itpm-prod;SecretName=ITPM-PROD-DATABASE-URL)

# NextAuth 密鑰
@Microsoft.KeyVault(VaultName=kv-itpm-prod;SecretName=ITPM-PROD-NEXTAUTH-SECRET)

# SendGrid API 密鑰
@Microsoft.KeyVault(VaultName=kv-itpm-prod;SecretName=ITPM-PROD-SENDGRID-API-KEY)
```

### 重要規則

✅ **正確**:
- 使用 `VaultName` 和 `SecretName` 參數
- 分號分隔參數
- 無空格

❌ **錯誤**:
```bash
# 錯誤：使用 SecretUri 而非 VaultName + SecretName
@Microsoft.KeyVault(SecretUri=https://kv-itpm-prod.vault.azure.net/secrets/DATABASE-URL)

# 錯誤：有空格
@Microsoft.KeyVault(VaultName = kv-itpm-prod; SecretName = DATABASE-URL)

# 錯誤：缺少 SecretName
@Microsoft.KeyVault(VaultName=kv-itpm-prod)
```

---

## 🛠️ 配置指南

### 方法 1: 使用 Azure Portal

1. 登入 Azure Portal
2. 前往 App Service (`app-itpm-{env}-001`)
3. 左側選單 → **Settings** → **Environment variables**
4. 點擊 **+ Add**
5. 輸入環境變數名稱和值（或 Key Vault 引用）
6. 點擊 **Save**

### 方法 2: 使用 Azure CLI

#### 批量設置環境變數
```bash
#!/bin/bash
ENVIRONMENT="dev"
APP_NAME="app-itpm-${ENVIRONMENT}-001"
RG_NAME="rg-itpm-${ENVIRONMENT}"
KV_NAME="kv-itpm-${ENVIRONMENT}"

# 設置直接環境變數
az webapp config appsettings set \
  --name "$APP_NAME" \
  --resource-group "$RG_NAME" \
  --settings \
    NODE_ENV="production" \
    PORT="3000" \
    WEBSITES_PORT="3000" \
    NEXTAUTH_SESSION_MAX_AGE="86400" \
    AZURE_AD_B2C_SCOPE="openid profile email offline_access" \
    AZURE_STORAGE_USE_DEVELOPMENT="false" \
    AZURE_STORAGE_CONTAINER_QUOTES="quotes" \
    AZURE_STORAGE_CONTAINER_INVOICES="invoices" \
    AZURE_STORAGE_CONTAINER_PROPOSALS="proposals" \
    SENDGRID_FROM_NAME="IT Project Management (Dev)" \
    NEXT_PUBLIC_FEATURE_AI_ASSISTANT="false" \
    NEXT_PUBLIC_FEATURE_EXTERNAL_INTEGRATION="false"

# 設置 Key Vault 引用
az webapp config appsettings set \
  --name "$APP_NAME" \
  --resource-group "$RG_NAME" \
  --settings \
    DATABASE_URL="@Microsoft.KeyVault(VaultName=${KV_NAME};SecretName=ITPM-${ENVIRONMENT^^}-DATABASE-URL)" \
    NEXTAUTH_SECRET="@Microsoft.KeyVault(VaultName=${KV_NAME};SecretName=ITPM-${ENVIRONMENT^^}-NEXTAUTH-SECRET)" \
    NEXTAUTH_URL="@Microsoft.KeyVault(VaultName=${KV_NAME};SecretName=ITPM-${ENVIRONMENT^^}-NEXTAUTH-URL)" \
    AZURE_AD_B2C_TENANT_NAME="@Microsoft.KeyVault(VaultName=${KV_NAME};SecretName=ITPM-${ENVIRONMENT^^}-AZUREADB2C-TENANT-NAME)" \
    AZURE_AD_B2C_TENANT_ID="@Microsoft.KeyVault(VaultName=${KV_NAME};SecretName=ITPM-${ENVIRONMENT^^}-AZUREADB2C-TENANT-ID)" \
    AZURE_AD_B2C_CLIENT_ID="@Microsoft.KeyVault(VaultName=${KV_NAME};SecretName=ITPM-${ENVIRONMENT^^}-AZUREADB2C-CLIENT-ID)" \
    AZURE_AD_B2C_CLIENT_SECRET="@Microsoft.KeyVault(VaultName=${KV_NAME};SecretName=ITPM-${ENVIRONMENT^^}-AZUREADB2C-CLIENT-SECRET)" \
    AZURE_AD_B2C_PRIMARY_USER_FLOW="@Microsoft.KeyVault(VaultName=${KV_NAME};SecretName=ITPM-${ENVIRONMENT^^}-AZUREADB2C-USER-FLOW)" \
    AZURE_STORAGE_ACCOUNT_NAME="@Microsoft.KeyVault(VaultName=${KV_NAME};SecretName=ITPM-${ENVIRONMENT^^}-STORAGE-ACCOUNT-NAME)" \
    AZURE_STORAGE_ACCOUNT_KEY="@Microsoft.KeyVault(VaultName=${KV_NAME};SecretName=ITPM-${ENVIRONMENT^^}-STORAGE-ACCOUNT-KEY)" \
    SENDGRID_API_KEY="@Microsoft.KeyVault(VaultName=${KV_NAME};SecretName=ITPM-${ENVIRONMENT^^}-SENDGRID-API-KEY)" \
    SENDGRID_FROM_EMAIL="@Microsoft.KeyVault(VaultName=${KV_NAME};SecretName=ITPM-${ENVIRONMENT^^}-SENDGRID-FROM-EMAIL)" \
    REDIS_URL="@Microsoft.KeyVault(VaultName=${KV_NAME};SecretName=ITPM-${ENVIRONMENT^^}-REDIS-URL)"
```

### 方法 3: 使用輔助腳本
```bash
# 使用自動化腳本
./.azure/scripts/helper/configure-app-settings.sh dev
```

---

## ✅ 驗證方法

### 1. 驗證環境變數已設置
```bash
# 列出所有環境變數
az webapp config appsettings list \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev \
  --query "[].{Name:name, Value:value}" -o table

# 檢查特定環境變數
az webapp config appsettings list \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev \
  --query "[?name=='DATABASE_URL'].{Name:name, Value:value}" -o table
```

### 2. 驗證 Key Vault 引用格式
```bash
# 確認 Key Vault 引用格式正確
az webapp config appsettings list \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev \
  --query "[?contains(value, '@Microsoft.KeyVault')].{Name:name, Reference:value}" -o table
```

### 3. 驗證 Managed Identity 權限
```bash
# 確認 App Service 的 Managed Identity 已啟用
az webapp identity show \
  --name app-itpm-dev-001 \
  --resource-group rg-itpm-dev

# 確認 Managed Identity 有 Key Vault 存取權限
PRINCIPAL_ID=$(az webapp identity show --name app-itpm-dev-001 --resource-group rg-itpm-dev --query principalId -o tsv)

az role assignment list \
  --assignee $PRINCIPAL_ID \
  --scope "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/rg-itpm-dev/providers/Microsoft.KeyVault/vaults/kv-itpm-dev"
```

### 4. 測試應用連接
```bash
# 重啟應用以載入新環境變數
az webapp restart --name app-itpm-dev-001 --resource-group rg-itpm-dev

# 等待 30 秒
sleep 30

# 檢查應用健康狀態
curl -I https://app-itpm-dev-001.azurewebsites.net

# 查看應用日誌
az webapp log tail --name app-itpm-dev-001 --resource-group rg-itpm-dev
```

---

## 📚 相關文檔

- [Key Vault 密鑰列表](./key-vault-secrets-list.md)
- [首次部署設置](./01-first-time-setup.md) - 階段 3: 配置 Key Vault
- [Azure App Service 環境變數文檔](https://docs.microsoft.com/azure/app-service/configure-common)
- [Key Vault 引用文檔](https://docs.microsoft.com/azure/app-service/app-service-key-vault-references)

---

**重要提醒**:
- 🔄 **更新環境變數後需要重啟 App Service**
- 🔐 **Key Vault 引用需要 Managed Identity 權限**
- ✅ **始終驗證 Key Vault 引用格式正確**
- 📋 **記錄所有配置變更**

---

**最後更新**: 2025-11-20
**維護者**: DevOps Team
