#!/bin/bash

# ============================================================================
# 簡化版公司 Azure 環境部署腳本
# ============================================================================
# 直接使用環境變數進行部署，不依賴子腳本的硬編碼配置
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🚀 公司 Azure 環境部署 (簡化版)"
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

# 驗證必要變數
REQUIRED_VARS=(
  "AZURE_SUBSCRIPTION_ID"
  "RESOURCE_GROUP"
  "LOCATION"
  "APP_SERVICE_NAME"
  "APP_SERVICE_PLAN_NAME"
  "POSTGRESQL_SERVER_NAME"
  "POSTGRESQL_ADMIN_USER"
  "POSTGRESQL_ADMIN_PASSWORD"
  "POSTGRESQL_DATABASE_NAME"
  "STORAGE_ACCOUNT_NAME"
  "ACR_NAME"
)

echo "🔍 驗證環境變數..."
for VAR in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!VAR}" ]; then
    echo "❌ 缺少環境變數: $VAR"
    exit 1
  fi
done
echo "✅ 環境變數驗證通過"

# 顯示部署信息並確認
echo ""
echo "⚠️  ================================================"
echo "⚠️  部署到公司 Azure 環境"
echo "⚠️  ================================================"
echo ""
echo "📋 目標信息:"
echo "  環境: company/$ENV"
echo "  訂閱: ${AZURE_SUBSCRIPTION_ID}"
echo "  資源群組: ${RESOURCE_GROUP}"
echo "  應用: ${APP_SERVICE_NAME}"
echo "  資料庫: ${POSTGRESQL_SERVER_NAME}"
echo "  儲存體: ${STORAGE_ACCOUNT_NAME}"
echo "  ACR: ${ACR_NAME}"
echo ""

read -p "確認繼續部署? (輸入 'yes'): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "❌ 部署已取消"
  exit 0
fi

echo ""
echo "✅ 開始部署..."
echo ""

# ============================================================================
# 階段 1: 資源群組
# ============================================================================
echo "=== 階段 1/6: 資源群組 ==="
echo "檢查資源群組: ${RESOURCE_GROUP}"
if az group show --name "${RESOURCE_GROUP}" &>/dev/null; then
  echo "✅ 資源群組已存在"
else
  echo "創建資源群組..."
  az group create --name "${RESOURCE_GROUP}" --location "${LOCATION}"
  echo "✅ 資源群組創建成功"
fi
echo ""

# ============================================================================
# 階段 2: PostgreSQL
# ============================================================================
echo "=== 階段 2/6: PostgreSQL Flexible Server ==="
echo "檢查 PostgreSQL 伺服器: ${POSTGRESQL_SERVER_NAME}"
if az postgres flexible-server show --name "${POSTGRESQL_SERVER_NAME}" --resource-group "${RESOURCE_GROUP}" &>/dev/null; then
  echo "✅ PostgreSQL 伺服器已存在"
else
  echo "創建 PostgreSQL 伺服器 (需要 5-10 分鐘)..."
  az postgres flexible-server create \
    --name "${POSTGRESQL_SERVER_NAME}" \
    --resource-group "${RESOURCE_GROUP}" \
    --location "${LOCATION}" \
    --admin-user "${POSTGRESQL_ADMIN_USER}" \
    --admin-password "${POSTGRESQL_ADMIN_PASSWORD}" \
    --sku-name "${POSTGRESQL_SKU:-Standard_B1ms}" \
    --tier Burstable \
    --version 14 \
    --storage-size 32 \
    --public-access 0.0.0.0-255.255.255.255 \
    --yes
  echo "✅ PostgreSQL 伺服器創建成功"
fi

# 檢查資料庫
echo "檢查資料庫: ${POSTGRESQL_DATABASE_NAME}"
if az postgres flexible-server db show --database-name "${POSTGRESQL_DATABASE_NAME}" \
   --server-name "${POSTGRESQL_SERVER_NAME}" --resource-group "${RESOURCE_GROUP}" &>/dev/null; then
  echo "✅ 資料庫已存在"
else
  echo "創建資料庫..."
  az postgres flexible-server db create \
    --database-name "${POSTGRESQL_DATABASE_NAME}" \
    --server-name "${POSTGRESQL_SERVER_NAME}" \
    --resource-group "${RESOURCE_GROUP}"
  echo "✅ 資料庫創建成功"
fi
echo ""

# ============================================================================
# 階段 3: Storage Account
# ============================================================================
echo "=== 階段 3/6: Storage Account ==="
echo "檢查儲存體帳戶: ${STORAGE_ACCOUNT_NAME}"
if az storage account show --name "${STORAGE_ACCOUNT_NAME}" --resource-group "${RESOURCE_GROUP}" &>/dev/null; then
  echo "✅ 儲存體帳戶已存在"
else
  echo "創建儲存體帳戶..."
  az storage account create \
    --name "${STORAGE_ACCOUNT_NAME}" \
    --resource-group "${RESOURCE_GROUP}" \
    --location "${LOCATION}" \
    --sku "${STORAGE_SKU:-Standard_LRS}"
  echo "✅ 儲存體帳戶創建成功"
fi

# 獲取儲存體密鑰
STORAGE_KEY=$(az storage account keys list \
  --account-name "${STORAGE_ACCOUNT_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --query "[0].value" -o tsv)

# 創建容器
for CONTAINER in quotes invoices proposals; do
  echo "檢查容器: ${CONTAINER}"
  if az storage container exists --name "${CONTAINER}" \
     --account-name "${STORAGE_ACCOUNT_NAME}" \
     --account-key "${STORAGE_KEY}" \
     --query "exists" -o tsv | grep -q "true"; then
    echo "✅ 容器已存在: ${CONTAINER}"
  else
    echo "創建容器: ${CONTAINER}"
    az storage container create \
      --name "${CONTAINER}" \
      --account-name "${STORAGE_ACCOUNT_NAME}" \
      --account-key "${STORAGE_KEY}"
    echo "✅ 容器創建成功: ${CONTAINER}"
  fi
done
echo ""

# ============================================================================
# 階段 4: Container Registry
# ============================================================================
echo "=== 階段 4/6: Container Registry ==="
echo "檢查 ACR: ${ACR_NAME}"
if az acr show --name "${ACR_NAME}" --resource-group "${RESOURCE_GROUP}" &>/dev/null; then
  echo "✅ Container Registry 已存在"
else
  echo "創建 Container Registry..."
  az acr create \
    --name "${ACR_NAME}" \
    --resource-group "${RESOURCE_GROUP}" \
    --location "${LOCATION}" \
    --sku "${ACR_SKU:-Basic}" \
    --admin-enabled true
  echo "✅ Container Registry 創建成功"
fi
echo ""

# ============================================================================
# 階段 5: App Service Plan & App Service
# ============================================================================
echo "=== 階段 5/6: App Service ==="

# App Service Plan
echo "檢查 App Service Plan: ${APP_SERVICE_PLAN_NAME}"
if az appservice plan show --name "${APP_SERVICE_PLAN_NAME}" --resource-group "${RESOURCE_GROUP}" &>/dev/null; then
  echo "✅ App Service Plan 已存在"
else
  echo "創建 App Service Plan..."
  az appservice plan create \
    --name "${APP_SERVICE_PLAN_NAME}" \
    --resource-group "${RESOURCE_GROUP}" \
    --location "${LOCATION}" \
    --is-linux \
    --sku "${APP_SERVICE_SKU:-B1}"
  echo "✅ App Service Plan 創建成功"
fi

# App Service
echo "檢查 App Service: ${APP_SERVICE_NAME}"
if az webapp show --name "${APP_SERVICE_NAME}" --resource-group "${RESOURCE_GROUP}" &>/dev/null; then
  echo "✅ App Service 已存在"
else
  echo "創建 App Service..."
  az webapp create \
    --name "${APP_SERVICE_NAME}" \
    --resource-group "${RESOURCE_GROUP}" \
    --plan "${APP_SERVICE_PLAN_NAME}" \
    --deployment-container-image-name "mcr.microsoft.com/appsvc/staticsite:latest"
  echo "✅ App Service 創建成功"
fi

# 啟用 Managed Identity
echo "啟用 Managed Identity..."
az webapp identity assign \
  --name "${APP_SERVICE_NAME}" \
  --resource-group "${RESOURCE_GROUP}"
echo "✅ Managed Identity 已啟用"

# 配置 App Service
echo "配置 App Service..."

# 構建 DATABASE_URL
POSTGRES_HOST="${POSTGRESQL_SERVER_NAME}.postgres.database.azure.com"
DATABASE_URL="postgresql://${POSTGRESQL_ADMIN_USER}:${POSTGRESQL_ADMIN_PASSWORD}@${POSTGRES_HOST}:5432/${POSTGRESQL_DATABASE_NAME}?sslmode=require"

# 獲取 Storage Connection String
STORAGE_CONNECTION_STRING=$(az storage account show-connection-string \
  --name "${STORAGE_ACCOUNT_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --query "connectionString" -o tsv)

# 配置應用設置
az webapp config appsettings set \
  --name "${APP_SERVICE_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --settings \
    NODE_ENV="${NODE_ENV}" \
    PORT="${PORT:-3000}" \
    NEXTAUTH_URL="${NEXTAUTH_URL}" \
    NEXTAUTH_SECRET="${NEXTAUTH_SECRET}" \
    DATABASE_URL="${DATABASE_URL}" \
    AZURE_STORAGE_ACCOUNT_NAME="${STORAGE_ACCOUNT_NAME}" \
    AZURE_STORAGE_ACCOUNT_KEY="${STORAGE_KEY}" \
    AZURE_STORAGE_CONNECTION_STRING="${STORAGE_CONNECTION_STRING}" \
    AZURE_STORAGE_CONTAINER_QUOTES="${AZURE_STORAGE_CONTAINER_QUOTES:-quotes}" \
    AZURE_STORAGE_CONTAINER_INVOICES="${AZURE_STORAGE_CONTAINER_INVOICES:-invoices}" \
    AZURE_STORAGE_CONTAINER_PROPOSALS="${AZURE_STORAGE_CONTAINER_PROPOSALS:-proposals}" \
    SENDGRID_API_KEY="${SENDGRID_API_KEY:-}" \
    SENDGRID_FROM_EMAIL="${SENDGRID_FROM_EMAIL:-}" \
    SENDGRID_FROM_NAME="${SENDGRID_FROM_NAME:-}" \
    NEXT_PUBLIC_AZURE_AD_B2C_ENABLED="${NEXT_PUBLIC_AZURE_AD_B2C_ENABLED:-false}" \
    NEXT_PUBLIC_FEATURE_AI_ASSISTANT="${NEXT_PUBLIC_FEATURE_AI_ASSISTANT:-false}" \
    NEXT_PUBLIC_FEATURE_EXTERNAL_INTEGRATION="${NEXT_PUBLIC_FEATURE_EXTERNAL_INTEGRATION:-false}"

echo "✅ App Service 配置完成"
echo ""

# ============================================================================
# 階段 6: 建置和部署應用程式
# ============================================================================
echo "=== 階段 6/6: 建置和部署應用程式 ==="

# 獲取 ACR 憑證
ACR_USERNAME=$(az acr credential show --name "${ACR_NAME}" --query "username" -o tsv)
ACR_PASSWORD=$(az acr credential show --name "${ACR_NAME}" --query "passwords[0].value" -o tsv)

echo "登入 ACR..."
echo "${ACR_PASSWORD}" | docker login "${ACR_NAME}.azurecr.io" -u "${ACR_USERNAME}" --password-stdin

echo "建置 Docker 映像..."
cd "$PROJECT_ROOT"
docker build -t "${ACR_NAME}.azurecr.io/itpm-web:latest" -f Dockerfile .

echo "推送映像到 ACR..."
docker push "${ACR_NAME}.azurecr.io/itpm-web:latest"

echo "配置 App Service 使用容器..."
az webapp config container set \
  --name "${APP_SERVICE_NAME}" \
  --resource-group "${RESOURCE_GROUP}" \
  --docker-custom-image-name "${ACR_NAME}.azurecr.io/itpm-web:latest" \
  --docker-registry-server-url "https://${ACR_NAME}.azurecr.io" \
  --docker-registry-server-user "${ACR_USERNAME}" \
  --docker-registry-server-password "${ACR_PASSWORD}"

echo "重啟應用程式..."
az webapp restart --name "${APP_SERVICE_NAME}" --resource-group "${RESOURCE_GROUP}"

echo "✅ 應用程式部署完成"
echo ""

# ============================================================================
# 完成
# ============================================================================
echo "================================================"
echo "✅ 部署成功完成！"
echo "================================================"
echo ""
echo "📋 部署摘要:"
echo "  環境: company/$ENV"
echo "  資源群組: ${RESOURCE_GROUP}"
echo "  應用 URL: https://${APP_SERVICE_NAME}.azurewebsites.net"
echo ""
echo "📝 後續步驟:"
echo "  1. 訪問應用 URL 驗證部署"
echo "  2. 檢查應用日誌："
echo "     az webapp log tail --name ${APP_SERVICE_NAME} --resource-group ${RESOURCE_GROUP}"
echo ""
