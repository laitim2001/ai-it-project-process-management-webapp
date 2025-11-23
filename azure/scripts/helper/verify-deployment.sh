#!/bin/bash
# ==============================================================================
# Verify Deployment Health
# ==============================================================================
# 用途: 驗證部署後的應用健康狀態
# 使用: ./verify-deployment.sh <environment>
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
APP_URL="https://${APP_NAME}.azurewebsites.net"

log_info "驗證部署: $ENVIRONMENT"

# 1. App Service 狀態
log_info "檢查 App Service 狀態..."
az webapp show --name "$APP_NAME" --resource-group "$RG_NAME" \
  --query "{Name:name, State:state, HealthState:availabilityState}" -o table

# 2. HTTP 健康檢查
log_info "執行 HTTP 健康檢查..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL")

if [ "$HTTP_STATUS" == "200" ] || [ "$HTTP_STATUS" == "302" ]; then
    log_success "應用正常運行 (HTTP $HTTP_STATUS)"
else
    log_error "應用異常 (HTTP $HTTP_STATUS)"
    exit 1
fi

# 3. 查看最近日誌
log_info "最近 20 條日誌:"
az webapp log tail --name "$APP_NAME" --resource-group "$RG_NAME" --limit 20

log_success "部署驗證完成！"
