#!/bin/bash

# ============================================================================
# 建置和部署 Docker 映像到 Azure
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🚀 建置和部署應用程式到 Azure"
echo "================================================"

# 載入環境配置
ENV=${1:-dev}
ENV_FILE="$PROJECT_ROOT/azure/environments/company/${ENV}.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ 找不到配置文件: $ENV_FILE"
  exit 1
fi

echo "📄 載入環境配置..."
set -a
source "$ENV_FILE"
set +a

echo ""
echo "📋 部署目標:"
echo "  ACR: ${ACR_NAME}.azurecr.io"
echo "  App Service: ${APP_SERVICE_NAME}"
echo ""

# ============================================================================
# 步驟 1: 獲取 ACR 憑證並登入
# ============================================================================
echo "=== 步驟 1/5: 登入 Container Registry ==="
ACR_USERNAME=$(az acr credential show --name "${ACR_NAME}" --query "username" -o tsv)
ACR_PASSWORD=$(az acr credential show --name "${ACR_NAME}" --query "passwords[0].value" -o tsv)

echo "登入 ACR: ${ACR_NAME}.azurecr.io"
echo "${ACR_PASSWORD}" | docker login "${ACR_NAME}.azurecr.io" -u "${ACR_USERNAME}" --password-stdin
echo "✅ ACR 登入成功"
echo ""

# ============================================================================
# 步驟 2: 建置 Docker 映像
# ============================================================================
echo "=== 步驟 2/5: 建置 Docker 映像 ==="
cd "$PROJECT_ROOT"

IMAGE_TAG="${ACR_NAME}.azurecr.io/itpm-web:latest"
echo "建置映像: ${IMAGE_TAG}"
echo "這可能需要 5-10 分鐘..."

docker build -t "${IMAGE_TAG}" -f Dockerfile .
echo "✅ Docker 映像建置成功"
echo ""

# ============================================================================
# 步驟 3: 推送映像到 ACR
# ============================================================================
echo "=== 步驟 3/5: 推送映像到 ACR ==="
echo "推送映像: ${IMAGE_TAG}"
docker push "${IMAGE_TAG}"
echo "✅ 映像推送成功"
echo ""

# ============================================================================
# 步驟 4: 配置 App Service 使用容器
# ============================================================================
echo "=== 步驟 4/5: 配置 App Service ==="
echo "設置容器映像..."
az webapp config container set \
  --name "${APP_SERVICE_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --docker-custom-image-name "${IMAGE_TAG}" \
  --docker-registry-server-url "https://${ACR_NAME}.azurecr.io" \
  --docker-registry-server-user "${ACR_USERNAME}" \
  --docker-registry-server-password "${ACR_PASSWORD}"
echo "✅ App Service 配置完成"
echo ""

# ============================================================================
# 步驟 5: 重啟應用程式
# ============================================================================
echo "=== 步驟 5/5: 重啟應用程式 ==="
echo "重啟 App Service..."
az webapp restart \
  --name "${APP_SERVICE_NAME}" \
  --resource-group "${RESOURCE_GROUP}"
echo "✅ 應用程式重啟完成"
echo ""

# ============================================================================
# 完成
# ============================================================================
echo "================================================"
echo "✅ 部署成功完成！"
echo "================================================"
echo ""
echo "📋 應用程式資訊:"
echo "  App Service: ${APP_SERVICE_NAME}"
echo "  URL: https://${APP_SERVICE_NAME}.azurewebsites.net"
echo "  映像: ${IMAGE_TAG}"
echo ""
echo "📝 後續步驟:"
echo "  1. 等待 2-3 分鐘讓容器完全啟動"
echo "  2. 訪問應用 URL 驗證部署"
echo "  3. 檢查應用日誌："
echo "     az webapp log tail --name ${APP_SERVICE_NAME} --resource-group ${RESOURCE_GROUP}"
echo ""
