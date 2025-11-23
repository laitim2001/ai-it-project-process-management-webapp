#!/bin/bash
# ==============================================================================
# 應用部署腳本
# ==============================================================================
# 用途: 構建 Docker 鏡像並部署到 Azure App Service
# 使用: ./06-deploy-app.sh <environment> [image_tag]
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
    echo "使用方式: $0 <environment> [image_tag]"
    exit 1
fi

ENVIRONMENT=$1
IMAGE_TAG=${2:-"latest"}

if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    log_error "無效的環境參數"
    exit 1
fi

log_section "🚀 應用部署 - $ENVIRONMENT 環境"

# 環境配置
case $ENVIRONMENT in
    dev)
        RESOURCE_GROUP="rg-itpm-dev"
        APP_SERVICE_NAME="app-itpm-dev-001"
        ACR_NAME="acritpmdev"
        ;;
    staging)
        RESOURCE_GROUP="rg-itpm-staging"
        APP_SERVICE_NAME="app-itpm-staging-001"
        ACR_NAME="acritpmstaging"
        ;;
    prod)
        RESOURCE_GROUP="rg-itpm-prod"
        APP_SERVICE_NAME="app-itpm-prod-001"
        ACR_NAME="acritpmprod"
        ;;
esac

ACR_LOGIN_SERVER="${ACR_NAME}.azurecr.io"
IMAGE_NAME="itpm-web"
FULL_IMAGE_TAG="${ACR_LOGIN_SERVER}/${IMAGE_NAME}:${IMAGE_TAG}"

log_info "環境: $ENVIRONMENT"
log_info "App Service: $APP_SERVICE_NAME"
log_info "鏡像標籤: $FULL_IMAGE_TAG"

# 檢查 Docker 是否運行
log_section "🐳 檢查 Docker"

if ! docker info &> /dev/null; then
    log_error "Docker daemon 未運行"
    exit 1
fi

log_success "Docker daemon 運行中"

# 檢查 Azure CLI 登入
log_section "🔐 驗證 Azure CLI 登入"

if ! az account show &> /dev/null; then
    log_error "未登入 Azure CLI"
    exit 1
fi

log_success "Azure CLI 已登入"

# 登入 ACR
log_section "🔐 登入 ACR"

log_info "登入到: $ACR_LOGIN_SERVER"

az acr login --name "$ACR_NAME"

if [ $? -eq 0 ]; then
    log_success "ACR 登入成功"
else
    log_error "ACR 登入失敗"
    exit 1
fi

# 構建 Docker 鏡像
log_section "🔨 構建 Docker 鏡像"

log_info "開始構建鏡像（這可能需要幾分鐘）..."
log_info "使用 Dockerfile: ./docker/Dockerfile"

docker build \
    -f docker/Dockerfile \
    -t "$FULL_IMAGE_TAG" \
    -t "${ACR_LOGIN_SERVER}/${IMAGE_NAME}:latest" \
    --build-arg NODE_ENV=production \
    .

if [ $? -eq 0 ]; then
    log_success "Docker 鏡像構建成功"
else
    log_error "Docker 鏡像構建失敗"
    exit 1
fi

# 推送鏡像到 ACR
log_section "⬆️  推送鏡像到 ACR"

log_info "推送鏡像: $FULL_IMAGE_TAG"

docker push "$FULL_IMAGE_TAG"

if [ $? -eq 0 ]; then
    log_success "鏡像推送成功"
else
    log_error "鏡像推送失敗"
    exit 1
fi

# 如果不是 latest，也推送 latest 標籤
if [ "$IMAGE_TAG" != "latest" ]; then
    log_info "推送 latest 標籤"
    docker push "${ACR_LOGIN_SERVER}/${IMAGE_NAME}:latest"
fi

# 獲取鏡像摘要
IMAGE_DIGEST=$(az acr repository show \
    --name "$ACR_NAME" \
    --image "${IMAGE_NAME}:${IMAGE_TAG}" \
    --query "digest" -o tsv)

log_info "鏡像摘要: $IMAGE_DIGEST"

# 更新 App Service 配置
log_section "🔄 更新 App Service 配置"

log_info "更新容器鏡像為: $FULL_IMAGE_TAG"

az webapp config container set \
    --name "$APP_SERVICE_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --docker-custom-image-name "$FULL_IMAGE_TAG" \
    --docker-registry-server-url "https://$ACR_LOGIN_SERVER" \
    --output none

if [ $? -eq 0 ]; then
    log_success "App Service 配置已更新"
else
    log_error "App Service 配置更新失敗"
    exit 1
fi

# 重啟 App Service
log_section "🔄 重啟 App Service"

log_info "重啟應用以載入新鏡像..."

az webapp restart \
    --name "$APP_SERVICE_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --output none

if [ $? -eq 0 ]; then
    log_success "App Service 已重啟"
else
    log_error "App Service 重啟失敗"
    exit 1
fi

# 等待應用啟動
log_section "⏳ 等待應用啟動"

log_info "等待應用完全啟動（最多 2 分鐘）..."

APP_URL="https://${APP_SERVICE_NAME}.azurewebsites.net"
MAX_RETRIES=24  # 24 x 5 秒 = 2 分鐘
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL" || echo "000")

    if [ "$HTTP_STATUS" == "200" ] || [ "$HTTP_STATUS" == "302" ]; then
        log_success "應用已成功啟動！"
        log_success "HTTP 狀態碼: $HTTP_STATUS"
        break
    fi

    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -ne "\r等待中... ($RETRY_COUNT/$MAX_RETRIES) HTTP: $HTTP_STATUS"
    sleep 5
done

echo ""

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    log_warning "應用啟動超時，但部署已完成"
    log_info "請手動檢查應用狀態"
fi

# 顯示部署資訊
log_section "📊 部署資訊"

echo "環境:               $ENVIRONMENT"
echo "App Service:        $APP_SERVICE_NAME"
echo "應用 URL:           $APP_URL"
echo "Docker 鏡像:        $FULL_IMAGE_TAG"
echo "鏡像摘要:           $IMAGE_DIGEST"
echo "部署時間:           $(date '+%Y-%m-%d %H:%M:%S')"

# 顯示日誌串流指令
log_section "📋 日誌查看"

log_info "查看即時日誌:"
echo "  az webapp log tail --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP"

log_info "下載日誌:"
echo "  az webapp log download --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP"

# 完成總結
log_section "✅ 應用部署完成"

echo ""
log_success "環境: $ENVIRONMENT"
log_success "URL: $APP_URL"
log_success "鏡像: $FULL_IMAGE_TAG"

echo ""
log_info "下一步:"
echo "  1. 訪問應用: $APP_URL"
echo "  2. 檢查日誌: az webapp log tail --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP"
echo "  3. 監控健康狀態: az webapp show --name $APP_SERVICE_NAME --resource-group $RESOURCE_GROUP"

echo ""
log_success "應用部署腳本執行完成！"

# 保存部署記錄
mkdir -p .azure/output
cat > ".azure/output/${ENVIRONMENT}-last-deployment.txt" <<EOF
# 最後部署記錄 - $ENVIRONMENT 環境

部署時間:    $(date '+%Y-%m-%d %H:%M:%S')
環境:        $ENVIRONMENT
App Service: $APP_SERVICE_NAME
應用 URL:    $APP_URL
Docker 鏡像: $FULL_IMAGE_TAG
鏡像摘要:    $IMAGE_DIGEST
部署者:      $(az account show --query "user.name" -o tsv 2>/dev/null || echo "Unknown")
訂閱:        $(az account show --query "name" -o tsv 2>/dev/null || echo "Unknown")
EOF

log_info "部署記錄已保存到: .azure/output/${ENVIRONMENT}-last-deployment.txt"
