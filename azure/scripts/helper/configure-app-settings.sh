#!/bin/bash
# ==============================================================================
# Configure App Service App Settings
# ==============================================================================
# 用途: 批量配置 App Service 環境變數（包含 Key Vault 引用）
# 使用: ./configure-app-settings.sh <environment>
# ==============================================================================

set -e
set -u

RED='\033[0;31m'; GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'
log_info() { echo -e "${BLUE}ℹ️  ${NC}$1"; }
log_success() { echo -e "${GREEN}✅ ${NC}$1"; }
log_error() { echo -e "${RED}❌ ${NC}$1"; }

if [ $# -eq 0 ]; then
    log_error "缺少環境參數"
    echo "使用方式: $0 <environment>"
    exit 1
fi

ENVIRONMENT=$1
APP_NAME="app-itpm-${ENVIRONMENT}-001"
RG_NAME="rg-itpm-${ENVIRONMENT}"
KV_NAME="kv-itpm-${ENVIRONMENT}"

log_info "配置 App Service 環境變數: $APP_NAME"

# 設置直接環境變數
az webapp config appsettings set \
  --name "$APP_NAME" --resource-group "$RG_NAME" --settings \
    NODE_ENV="production" PORT="3000" WEBSITES_PORT="3000" \
    NEXTAUTH_SESSION_MAX_AGE="86400" \
    AZURE_AD_B2C_SCOPE="openid profile email offline_access" \
    AZURE_STORAGE_USE_DEVELOPMENT="false" \
    AZURE_STORAGE_CONTAINER_QUOTES="quotes" \
    AZURE_STORAGE_CONTAINER_INVOICES="invoices" \
    AZURE_STORAGE_CONTAINER_PROPOSALS="proposals" \
    NEXT_PUBLIC_FEATURE_AI_ASSISTANT="false" \
    NEXT_PUBLIC_FEATURE_EXTERNAL_INTEGRATION="false" \
    --output none

# 設置 Key Vault 引用
az webapp config appsettings set \
  --name "$APP_NAME" --resource-group "$RG_NAME" --settings \
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
    REDIS_URL="@Microsoft.KeyVault(VaultName=${KV_NAME};SecretName=ITPM-${ENVIRONMENT^^}-REDIS-URL)" \
    --output none

log_success "環境變數配置完成！"
