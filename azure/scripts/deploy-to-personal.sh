#!/bin/bash

# ============================================================================
# 個人 Azure 環境部署腳本
# ============================================================================
# Purpose: 部署到個人 Azure 訂閱（開發和測試）
# Usage: bash azure/scripts/deploy-to-personal.sh [dev|staging|prod]
# ============================================================================

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🚀 開始部署到個人 Azure 環境"
echo "================================================"

# ============================================================================
# 1. 環境選擇
# ============================================================================
ENV=${1:-dev}  # 預設 dev

if [[ ! "$ENV" =~ ^(dev|staging|prod)$ ]]; then
  echo "❌ 無效的環境: $ENV"
  echo "用法: bash azure/scripts/deploy-to-personal.sh [dev|staging|prod]"
  exit 1
fi

echo "📋 目標環境: personal/$ENV"

# ============================================================================
# 2. 載入環境配置
# ============================================================================
# 優先使用 .env 文件，如果不存在則嘗試 .env.example
ENV_FILE="$PROJECT_ROOT/azure/environments/personal/${ENV}.env"

if [ ! -f "$ENV_FILE" ]; then
  # 嘗試使用 .env.example（僅當它是純 bash 可解析的格式）
  ENV_FILE="$PROJECT_ROOT/azure/environments/personal/${ENV}.env.example"
  if [ ! -f "$ENV_FILE" ]; then
    echo "❌ 環境配置文件不存在"
    echo "請創建配置文件: azure/environments/personal/${ENV}.env"
    echo "可參考: azure/environments/personal/dev.env.example"
    exit 1
  fi
fi

echo "📄 載入環境配置: personal/${ENV}"
set -a  # Auto-export variables
source "$ENV_FILE"
set +a

# ============================================================================
# 3. 驗證必要環境變數
# ============================================================================
echo "🔍 驗證環境變數..."

REQUIRED_VARS=(
  "RESOURCE_GROUP"
  "LOCATION"
  "APP_SERVICE_NAME"
)

for VAR in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!VAR}" ]; then
    echo "❌ 缺少必要環境變數: $VAR"
    exit 1
  fi
done

echo "✅ 環境變數驗證通過"

# ============================================================================
# 4. 執行部署腳本
# ============================================================================
echo ""
echo "================================================"
echo "開始執行部署流程 (6 個階段)"
echo "================================================"
echo ""

# 階段 1: 設置資源群組
echo "=== 階段 1/6: 設置資源群組 ==="
if [ -f "$SCRIPT_DIR/01-setup-resources.sh" ]; then
  bash "$SCRIPT_DIR/01-setup-resources.sh" "$ENV"
  echo "✅ 資源群組設置完成"
else
  echo "⚠️  腳本不存在，跳過: 01-setup-resources.sh"
fi
echo ""

# 階段 2: 設置資料庫
echo "=== 階段 2/6: 設置 PostgreSQL 資料庫 ==="
if [ -f "$SCRIPT_DIR/02-setup-database.sh" ]; then
  bash "$SCRIPT_DIR/02-setup-database.sh" "$ENV"
  echo "✅ 資料庫設置完成"
else
  echo "⚠️  腳本不存在，跳過: 02-setup-database.sh"
fi
echo ""

# 階段 3: 設置儲存體
echo "=== 階段 3/6: 設置 Blob Storage ==="
if [ -f "$SCRIPT_DIR/03-setup-storage.sh" ]; then
  bash "$SCRIPT_DIR/03-setup-storage.sh" "$ENV"
  echo "✅ 儲存體設置完成"
else
  echo "⚠️  腳本不存在，跳過: 03-setup-storage.sh"
fi
echo ""

# 階段 4: 設置 Container Registry
echo "=== 階段 4/6: 設置 Container Registry ==="
if [ -f "$SCRIPT_DIR/04-setup-acr.sh" ]; then
  bash "$SCRIPT_DIR/04-setup-acr.sh" "$ENV"
  echo "✅ Container Registry 設置完成"
else
  echo "⚠️  腳本不存在，跳過: 04-setup-acr.sh"
fi
echo ""

# 階段 5: 設置 App Service
echo "=== 階段 5/6: 設置 App Service ==="
if [ -f "$SCRIPT_DIR/05-setup-appservice.sh" ]; then
  bash "$SCRIPT_DIR/05-setup-appservice.sh" "$ENV"
  echo "✅ App Service 設置完成"
else
  echo "⚠️  腳本不存在，跳過: 05-setup-appservice.sh"
fi
echo ""

# 階段 6: 部署應用程式
echo "=== 階段 6/6: 部署應用程式 ==="
if [ -f "$SCRIPT_DIR/06-deploy-app.sh" ]; then
  bash "$SCRIPT_DIR/06-deploy-app.sh" "$ENV"
  echo "✅ 應用程式部署完成"
else
  echo "⚠️  腳本不存在，跳過: 06-deploy-app.sh"
fi
echo ""

# ============================================================================
# 5. 部署完成
# ============================================================================
echo "================================================"
echo "✅ 部署完成！"
echo "================================================"
echo ""
echo "📋 部署信息:"
echo "  環境: personal/$ENV"
echo "  資源群組: ${RESOURCE_GROUP}"
echo "  應用名稱: ${APP_SERVICE_NAME}"
echo ""

if [ -n "${APP_SERVICE_NAME}" ]; then
  echo "🌐 應用 URL:"
  echo "  https://${APP_SERVICE_NAME}.azurewebsites.net"
  echo ""
fi

echo "📚 後續步驟:"
echo "  1. 訪問應用 URL 驗證部署"
echo "  2. 測試登入功能"
echo "  3. 檢查應用日誌："
echo "     az webapp log tail --name ${APP_SERVICE_NAME} --resource-group ${RESOURCE_GROUP}"
echo ""
