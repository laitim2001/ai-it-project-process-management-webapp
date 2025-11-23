#!/bin/bash
# ==============================================================================
# Rotate Azure Key Vault Secret
# ==============================================================================
# 用途: 輪換 Key Vault 密鑰並更新到最新版本
# 使用: ./rotate-secret.sh <environment> <secret-category-name> <new-value>
# ==============================================================================

set -e
set -u

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log_info() { echo -e "${BLUE}ℹ️  ${NC}$1"; }
log_success() { echo -e "${GREEN}✅ ${NC}$1"; }
log_warning() { echo -e "${YELLOW}⚠️  ${NC}$1"; }

if [ $# -lt 3 ]; then
    echo "使用方式: $0 <environment> <secret-category-name> <new-value>"
    echo "範例: $0 prod NEXTAUTH-SECRET \"new-secret-key\""
    exit 1
fi

ENVIRONMENT=$1
SECRET_CATEGORY_NAME=$2
NEW_VALUE=$3
KV_NAME="kv-itpm-${ENVIRONMENT}"
SECRET_NAME="ITPM-${ENVIRONMENT^^}-${SECRET_CATEGORY_NAME}"
APP_NAME="app-itpm-${ENVIRONMENT}-001"
RG_NAME="rg-itpm-${ENVIRONMENT}"

log_info "輪換密鑰: $SECRET_NAME"

# 1. 備份舊版本資訊
log_info "獲取舊版本資訊..."
OLD_VERSION=$(az keyvault secret show --vault-name "$KV_NAME" --name "$SECRET_NAME" --query "id" -o tsv | awk -F'/' '{print $NF}')
log_info "舊版本 ID: $OLD_VERSION"

# 2. 創建新版本
log_info "創建新版本..."
az keyvault secret set --vault-name "$KV_NAME" --name "$SECRET_NAME" --value "$NEW_VALUE" --output none
log_success "新版本已創建"

# 3. 重啟 App Service（載入新密鑰）
log_warning "重啟 App Service 以載入新密鑰..."
az webapp restart --name "$APP_NAME" --resource-group "$RG_NAME"
log_success "App Service 已重啟"

# 4. 等待驗證
log_info "等待 60 秒後驗證..."
sleep 60

# 5. 驗證應用健康
APP_URL="https://${APP_NAME}.azurewebsites.net"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL")

if [ "$HTTP_STATUS" == "200" ] || [ "$HTTP_STATUS" == "302" ]; then
    log_success "應用正常運行，密鑰輪換成功！"
else
    log_warning "應用異常 (HTTP $HTTP_STATUS)，可能需要回滾"
    echo "回滾命令："
    echo "  az keyvault secret set --vault-name $KV_NAME --name $SECRET_NAME --value <OLD_VALUE>"
fi

log_info "舊版本保留 90 天（軟刪除期）"
log_success "密鑰輪換完成！"
