#!/bin/bash
# ==============================================================================
# Test Environment Configuration
# ==============================================================================
# 用途: 驗證環境變數配置的完整性和正確性
# 使用: ./test-environment-config.sh <environment>
# ==============================================================================

set -e
set -u

GREEN='\033[0;32m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
log_info() { echo -e "${BLUE}ℹ️  ${NC}$1"; }
log_success() { echo -e "${GREEN}✅ ${NC}$1"; }
log_error() { echo -e "${RED}❌ ${NC}$1"; }

if [ $# -eq 0 ]; then
    echo "使用方式: $0 <environment>"
    exit 1
fi

ENVIRONMENT=$1
APP_NAME="app-itpm-${ENVIRONMENT}-001"
RG_NAME="rg-itpm-${ENVIRONMENT}"
KV_NAME="kv-itpm-${ENVIRONMENT}"

log_info "驗證環境配置: $ENVIRONMENT"
echo ""

# 必需的環境變數列表
REQUIRED_SETTINGS=(
    "NODE_ENV"
    "PORT"
    "WEBSITES_PORT"
    "DATABASE_URL"
    "NEXTAUTH_SECRET"
    "NEXTAUTH_URL"
    "AZURE_AD_B2C_TENANT_NAME"
    "AZURE_AD_B2C_TENANT_ID"
    "AZURE_AD_B2C_CLIENT_ID"
    "AZURE_AD_B2C_CLIENT_SECRET"
    "AZURE_STORAGE_ACCOUNT_NAME"
    "AZURE_STORAGE_ACCOUNT_KEY"
    "SENDGRID_API_KEY"
    "SENDGRID_FROM_EMAIL"
)

# 1. 檢查 App Service 環境變數
log_info "1. 檢查 App Service 環境變數..."

MISSING_COUNT=0
for SETTING in "${REQUIRED_SETTINGS[@]}"; do
    VALUE=$(az webapp config appsettings list --name "$APP_NAME" --resource-group "$RG_NAME" --query "[?name=='$SETTING'].value" -o tsv)

    if [ -n "$VALUE" ]; then
        # 檢查是否為 Key Vault 引用
        if [[ "$VALUE" == @Microsoft.KeyVault* ]]; then
            echo "  ✅ $SETTING: Key Vault 引用"
        else
            echo "  ✅ $SETTING: 已設置"
        fi
    else
        echo "  ❌ $SETTING: 未設置"
        MISSING_COUNT=$((MISSING_COUNT + 1))
    fi
done

if [ $MISSING_COUNT -eq 0 ]; then
    log_success "所有必需環境變數已設置 (${#REQUIRED_SETTINGS[@]}/${#REQUIRED_SETTINGS[@]})"
else
    log_error "缺少 $MISSING_COUNT 個環境變數"
fi

# 2. 檢查 Key Vault 密鑰
log_info "2. 檢查 Key Vault 密鑰..."

REQUIRED_SECRETS=(
    "ITPM-${ENVIRONMENT^^}-DATABASE-URL"
    "ITPM-${ENVIRONMENT^^}-NEXTAUTH-SECRET"
    "ITPM-${ENVIRONMENT^^}-NEXTAUTH-URL"
    "ITPM-${ENVIRONMENT^^}-SENDGRID-API-KEY"
)

MISSING_SECRETS=0
for SECRET in "${REQUIRED_SECRETS[@]}"; do
    if az keyvault secret show --vault-name "$KV_NAME" --name "$SECRET" &> /dev/null; then
        echo "  ✅ $SECRET"
    else
        echo "  ❌ $SECRET: 不存在"
        MISSING_SECRETS=$((MISSING_SECRETS + 1))
    fi
done

if [ $MISSING_SECRETS -eq 0 ]; then
    log_success "所有核心密鑰已配置"
else
    log_error "缺少 $MISSING_SECRETS 個密鑰"
fi

# 3. 檢查 Managed Identity 權限
log_info "3. 檢查 Managed Identity..."

PRINCIPAL_ID=$(az webapp identity show --name "$APP_NAME" --resource-group "$RG_NAME" --query "principalId" -o tsv 2>/dev/null || echo "")

if [ -n "$PRINCIPAL_ID" ]; then
    log_success "Managed Identity 已啟用: $PRINCIPAL_ID"

    # 檢查 Key Vault 權限
    KV_ROLE=$(az role assignment list --assignee "$PRINCIPAL_ID" --scope "/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RG_NAME/providers/Microsoft.KeyVault/vaults/$KV_NAME" --query "[].roleDefinitionName" -o tsv)

    if [ -n "$KV_ROLE" ]; then
        log_success "Key Vault 權限: $KV_ROLE"
    else
        log_error "未授予 Key Vault 存取權限"
    fi
else
    log_error "Managed Identity 未啟用"
fi

echo ""
log_success "配置驗證完成！"

if [ $MISSING_COUNT -gt 0 ] || [ $MISSING_SECRETS -gt 0 ]; then
    echo ""
    log_error "發現配置問題，請修正後重新測試"
    exit 1
fi
