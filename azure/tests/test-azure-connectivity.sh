#!/bin/bash
# ==============================================================================
# Test Azure Services Connectivity
# ==============================================================================
# 用途: 驗證本地環境到 Azure 服務的連接性
# 使用: ./test-azure-connectivity.sh <environment>
# ==============================================================================

set -e
set -u

GREEN='\033[0;32m'; RED='\033[0;31m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; NC='\033[0m'
log_info() { echo -e "${BLUE}ℹ️  ${NC}$1"; }
log_success() { echo -e "${GREEN}✅ ${NC}$1"; }
log_error() { echo -e "${RED}❌ ${NC}$1"; }
log_warning() { echo -e "${YELLOW}⚠️  ${NC}$1"; }

if [ $# -eq 0 ]; then
    echo "使用方式: $0 <environment>"
    exit 1
fi

ENVIRONMENT=$1

log_info "測試 Azure 服務連接性: $ENVIRONMENT 環境"
echo ""

# 1. Azure CLI 登入檢查
log_info "1. 檢查 Azure CLI 登入狀態..."
if az account show &> /dev/null; then
    ACCOUNT=$(az account show --query "name" -o tsv)
    log_success "已登入 Azure: $ACCOUNT"
else
    log_error "未登入 Azure CLI"
    exit 1
fi

# 2. 資源組檢查
log_info "2. 檢查資源組..."
RG_NAME="rg-itpm-${ENVIRONMENT}"
if az group show --name "$RG_NAME" &> /dev/null; then
    log_success "資源組存在: $RG_NAME"
else
    log_error "資源組不存在: $RG_NAME"
    exit 1
fi

# 3. PostgreSQL 連接測試
log_info "3. 測試 PostgreSQL 連接..."
SERVER_NAME="psql-itpm-${ENVIRONMENT}-001"
if az postgres flexible-server show --name "$SERVER_NAME" --resource-group "$RG_NAME" &> /dev/null; then
    FQDN=$(az postgres flexible-server show --name "$SERVER_NAME" --resource-group "$RG_NAME" --query "fullyQualifiedDomainName" -o tsv)
    log_success "PostgreSQL 伺服器存在: $FQDN"

    # 檢查防火牆規則
    RULE_COUNT=$(az postgres flexible-server firewall-rule list --name "$SERVER_NAME" --resource-group "$RG_NAME" --query "length(@)" -o tsv)
    log_info "防火牆規則數量: $RULE_COUNT"
else
    log_warning "PostgreSQL 伺服器不存在: $SERVER_NAME"
fi

# 4. Storage Account 檢查
log_info "4. 檢查 Storage Account..."
STORAGE_NAME="stgitpm${ENVIRONMENT}001"
if az storage account show --name "$STORAGE_NAME" --resource-group "$RG_NAME" &> /dev/null; then
    log_success "Storage Account 存在: $STORAGE_NAME"

    # 列出 Containers
    CONTAINERS=$(az storage container list --account-name "$STORAGE_NAME" --auth-mode login --query "[].name" -o tsv 2>/dev/null || echo "")
    if [ -n "$CONTAINERS" ]; then
        log_success "Containers: $CONTAINERS"
    else
        log_warning "無法列出 Containers（可能需要權限）"
    fi
else
    log_warning "Storage Account 不存在: $STORAGE_NAME"
fi

# 5. ACR 檢查
log_info "5. 檢查 Azure Container Registry..."
ACR_NAME="acritpm${ENVIRONMENT}"
if az acr show --name "$ACR_NAME" --resource-group "$RG_NAME" &> /dev/null; then
    log_success "ACR 存在: $ACR_NAME"

    # 檢查鏡像數量
    IMAGE_COUNT=$(az acr repository list --name "$ACR_NAME" --query "length(@)" -o tsv 2>/dev/null || echo "0")
    log_info "鏡像倉庫數量: $IMAGE_COUNT"
else
    log_warning "ACR 不存在: $ACR_NAME"
fi

# 6. App Service 檢查
log_info "6. 檢查 App Service..."
APP_NAME="app-itpm-${ENVIRONMENT}-001"
if az webapp show --name "$APP_NAME" --resource-group "$RG_NAME" &> /dev/null; then
    STATE=$(az webapp show --name "$APP_NAME" --resource-group "$RG_NAME" --query "state" -o tsv)
    APP_URL="https://${APP_NAME}.azurewebsites.net"
    log_success "App Service 存在: $APP_NAME (狀態: $STATE)"
    log_info "URL: $APP_URL"

    # HTTP 健康檢查
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL" || echo "000")
    if [ "$HTTP_STATUS" == "200" ] || [ "$HTTP_STATUS" == "302" ]; then
        log_success "HTTP 健康檢查通過 ($HTTP_STATUS)"
    else
        log_warning "HTTP 健康檢查失敗 ($HTTP_STATUS)"
    fi
else
    log_warning "App Service 不存在: $APP_NAME"
fi

# 7. Key Vault 檢查
log_info "7. 檢查 Key Vault..."
KV_NAME="kv-itpm-${ENVIRONMENT}"
if az keyvault show --name "$KV_NAME" --resource-group "$RG_NAME" &> /dev/null; then
    log_success "Key Vault 存在: $KV_NAME"

    # 列出密鑰數量
    SECRET_COUNT=$(az keyvault secret list --vault-name "$KV_NAME" --query "length(@)" -o tsv 2>/dev/null || echo "0")
    log_info "密鑰數量: $SECRET_COUNT"
else
    log_warning "Key Vault 不存在: $KV_NAME"
fi

echo ""
log_success "連接性測試完成！"
