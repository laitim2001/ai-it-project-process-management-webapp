#!/bin/bash
# ==============================================================================
# Azure App Service 設置腳本
# ==============================================================================
# 用途: 創建 Azure App Service (Linux Container)
# 使用: ./05-setup-appservice.sh <environment>
# ==============================================================================

set -e
set -u

# 顏色定義
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  ${NC}$1"; }
log_success() { echo -e "${GREEN}✅ ${NC}$1"; }
log_warning() { echo -e "${YELLOW}⚠️  ${NC}$1"; }
log_error() { echo -e "${RED}❌ ${NC}$1"; }
log_section() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# 參數驗證
if [ $# -eq 0 ]; then
    log_error "缺少環境參數"
    exit 1
fi

ENVIRONMENT=$1
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    log_error "無效的環境參數"
    exit 1
fi

log_section "🌐 Azure App Service 設置 - $ENVIRONMENT 環境"

# 環境配置
case $ENVIRONMENT in
    dev)
        LOCATION="eastasia"
        RESOURCE_GROUP="rg-itpm-dev"
        APP_SERVICE_PLAN="asp-itpm-dev"
        APP_SERVICE_NAME="app-itpm-dev-001"
        SKU="B1"  # Basic tier, 1 core, 1.75 GB RAM
        ACR_NAME="acritpmdev"
        TAGS="Environment=Development Project=ITPM"
        ;;
    staging)
        LOCATION="eastasia"
        RESOURCE_GROUP="rg-itpm-staging"
        APP_SERVICE_PLAN="asp-itpm-staging"
        APP_SERVICE_NAME="app-itpm-staging-001"
        SKU="S1"  # Standard tier, 1 core, 1.75 GB RAM
        ACR_NAME="acritpmstaging"
        TAGS="Environment=Staging Project=ITPM"
        ;;
    prod)
        LOCATION="eastasia"
        RESOURCE_GROUP="rg-itpm-prod"
        APP_SERVICE_PLAN="asp-itpm-prod"
        APP_SERVICE_NAME="app-itpm-prod-001"
        SKU="P1V3"  # Premium V3, 2 cores, 8 GB RAM
        ACR_NAME="acritpmprod"
        TAGS="Environment=Production Project=ITPM"
        ;;
esac

log_info "環境: $ENVIRONMENT"
log_info "App Service: $APP_SERVICE_NAME"
log_info "SKU: $SKU"

# 檢查登入
log_section "🔐 驗證 Azure CLI 登入"
if ! az account show &> /dev/null; then
    log_error "未登入 Azure CLI"
    exit 1
fi
log_success "已登入 Azure CLI"

# 檢查資源組
if ! az group exists --name "$RESOURCE_GROUP" | grep -q 'true'; then
    log_error "資源組不存在"
    exit 1
fi

# 創建 App Service Plan
log_section "📋 創建 App Service Plan"

EXISTING_PLAN=$(az appservice plan show \
    --name "$APP_SERVICE_PLAN" \
    --resource-group "$RESOURCE_GROUP" \
    2>/dev/null || echo "")

if [ -n "$EXISTING_PLAN" ]; then
    log_warning "App Service Plan 已存在"
else
    log_info "創建 App Service Plan: $APP_SERVICE_PLAN"

    az appservice plan create \
        --name "$APP_SERVICE_PLAN" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --sku "$SKU" \
        --is-linux \
        --tags $TAGS \
        --output none

    if [ $? -eq 0 ]; then
        log_success "App Service Plan 創建成功"
    else
        log_error "創建失敗"
        exit 1
    fi
fi

# 創建 App Service
log_section "🌐 創建 App Service"

EXISTING_APP=$(az webapp show \
    --name "$APP_SERVICE_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    2>/dev/null || echo "")

if [ -n "$EXISTING_APP" ]; then
    log_warning "App Service 已存在"
    SKIP_APP_CREATION=true
else
    log_info "創建 App Service: $APP_SERVICE_NAME"

    az webapp create \
        --name "$APP_SERVICE_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --plan "$APP_SERVICE_PLAN" \
        --deployment-container-image-name "mcr.microsoft.com/appsvc/staticsite:latest" \
        --tags $TAGS \
        --output none

    if [ $? -eq 0 ]; then
        log_success "App Service 創建成功"
        SKIP_APP_CREATION=false
    else
        log_error "創建失敗"
        exit 1
    fi
fi

# 啟用 Managed Identity
log_section "🆔 啟用 Managed Identity"

az webapp identity assign \
    --name "$APP_SERVICE_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --output none

log_success "Managed Identity 已啟用"

# 獲取 Managed Identity Principal ID
PRINCIPAL_ID=$(az webapp identity show \
    --name "$APP_SERVICE_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "principalId" -o tsv)

log_info "Principal ID: $PRINCIPAL_ID"

# 配置 ACR 存取
log_section "🐳 配置 ACR 存取"

ACR_LOGIN_SERVER="${ACR_NAME}.azurecr.io"

az webapp config container set \
    --name "$APP_SERVICE_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --docker-custom-image-name "${ACR_LOGIN_SERVER}/itpm-web:latest" \
    --docker-registry-server-url "https://${ACR_LOGIN_SERVER}" \
    --output none

log_success "ACR 配置完成"

# 授予 Managed Identity 訪問 ACR 的權限
log_info "授予 Managed Identity AcrPull 權限"

ACR_RESOURCE_ID=$(az acr show \
    --name "$ACR_NAME" \
    --query "id" -o tsv)

az role assignment create \
    --assignee "$PRINCIPAL_ID" \
    --role "AcrPull" \
    --scope "$ACR_RESOURCE_ID" \
    --output none

log_success "ACR 存取權限已配置"

# 配置應用設定
log_section "⚙️  配置應用設定"

az webapp config appsettings set \
    --name "$APP_SERVICE_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --settings \
        "WEBSITES_PORT=3000" \
        "WEBSITES_ENABLE_APP_SERVICE_STORAGE=false" \
        "DOCKER_REGISTRY_SERVER_URL=https://${ACR_LOGIN_SERVER}" \
        "DOCKER_ENABLE_CI=true" \
    --output none

log_success "應用設定已配置"

# 啟用 HTTPS Only
log_section "🔒 啟用 HTTPS Only"

az webapp update \
    --name "$APP_SERVICE_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --https-only true \
    --output none

log_success "HTTPS Only 已啟用"

# 配置自動部署槽位（僅 Staging 和 Prod）
if [[ "$ENVIRONMENT" == "staging" || "$ENVIRONMENT" == "prod" ]]; then
    log_section "🔄 創建部署槽位"

    SLOT_NAME="staging"

    az webapp deployment slot create \
        --name "$APP_SERVICE_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --slot "$SLOT_NAME" \
        --output none \
        2>/dev/null || log_warning "槽位可能已存在"

    log_success "部署槽位 \"$SLOT_NAME\" 已創建"
fi

# 配置日誌
log_section "📊 配置診斷日誌"

az webapp log config \
    --name "$APP_SERVICE_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --application-logging filesystem \
    --detailed-error-messages true \
    --failed-request-tracing true \
    --docker-container-logging filesystem \
    --output none

log_success "診斷日誌已配置"

# 顯示 App Service 資訊
log_section "📊 App Service 資訊"

APP_INFO=$(az webapp show \
    --name "$APP_SERVICE_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --output json)

echo "$APP_INFO" | jq -r '
"名稱:             " + .name,
"URL:              https://" + .defaultHostName,
"狀態:             " + .state,
"SKU:              " + .appServicePlanId | split("/") | last,
"位置:             " + .location,
"Managed Identity: " + .identity.principalId
'

# 完成總結
log_section "✅ App Service 設置完成"

echo ""
log_success "環境: $ENVIRONMENT"
log_success "App Service: $APP_SERVICE_NAME"
log_success "URL: https://${APP_SERVICE_NAME}.azurewebsites.net"

echo ""
log_info "已配置的資源:"
echo "  ✅ App Service Plan"
echo "  ✅ App Service"
echo "  ✅ Managed Identity"
echo "  ✅ ACR 存取權限"
echo "  ✅ HTTPS Only"
echo "  ✅ 診斷日誌"
if [[ "$ENVIRONMENT" == "staging" || "$ENVIRONMENT" == "prod" ]]; then
    echo "  ✅ 部署槽位 (staging)"
fi

echo ""
log_info "下一步:"
echo "  1. 配置環境變數（從 Key Vault 引用）"
echo "  2. 執行: ./06-deploy-app.sh $ENVIRONMENT"
echo "  3. 訪問: https://${APP_SERVICE_NAME}.azurewebsites.net"

echo ""
log_success "App Service 設置腳本執行完成！"
