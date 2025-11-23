#!/bin/bash

# ============================================================================
# 公司 Azure 環境部署腳本
# ============================================================================
# Purpose: 部署到公司 Azure 訂閱（正式環境）
# Usage: bash azure/scripts/deploy-to-company.sh [dev|staging|prod]
# ============================================================================

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "🚀 準備部署到公司 Azure 環境"
echo "================================================"

# ============================================================================
# 1. 環境選擇
# ============================================================================
ENV=${1:-dev}  # 預設 dev

if [[ ! "$ENV" =~ ^(dev|staging|prod)$ ]]; then
  echo "❌ 無效的環境: $ENV"
  echo "用法: bash azure/scripts/deploy-to-company.sh [dev|staging|prod]"
  exit 1
fi

echo "📋 目標環境: company/$ENV"

# ============================================================================
# 2. 載入環境配置
# ============================================================================
ENV_FILE="$PROJECT_ROOT/azure/environments/company/${ENV}.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ 環境配置文件不存在: $ENV_FILE"
  echo ""
  echo "請先完成以下步驟："
  echo "  1. 複製範例配置: cp azure/environments/personal/dev.env.example azure/environments/company/${ENV}.env"
  echo "  2. 根據公司規範修改配置文件"
  echo "  3. 與公司 Azure Admin 確認配置"
  echo "  4. 重新執行部署腳本"
  exit 1
fi

echo "📄 載入環境配置: company/${ENV}"
set -a  # Auto-export variables
source "$ENV_FILE"
set +a

# ============================================================================
# 3. 驗證必要環境變數
# ============================================================================
echo "🔍 驗證環境變數..."

REQUIRED_VARS=(
  "AZURE_SUBSCRIPTION_ID"
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
# 4. 安全確認提示
# ============================================================================
echo ""
echo "⚠️  ================================================"
echo "⚠️  您即將部署到公司 Azure 環境"
echo "⚠️  ================================================"
echo ""
echo "📋 部署目標信息:"
echo "  環境: company/$ENV"
echo "  訂閱 ID: ${AZURE_SUBSCRIPTION_ID}"
echo "  資源群組: ${RESOURCE_GROUP}"
echo "  區域: ${LOCATION}"
echo "  應用名稱: ${APP_SERVICE_NAME}"
echo ""
echo "⚠️  請確認以下事項："
echo "  [ ] 已獲得部署授權"
echo "  [ ] 配置符合公司規範"
echo "  [ ] 已與 Azure Admin 確認"
echo "  [ ] 了解變更影響範圍"
echo ""

# 等待用戶確認
read -p "確認繼續部署? (輸入 'yes' 繼續): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ 部署已取消"
  exit 0
fi

echo ""
echo "✅ 用戶已確認，開始部署..."
echo ""

# ============================================================================
# 5. 執行部署腳本
# ============================================================================
echo "================================================"
echo "開始執行部署流程 (6 個階段)"
echo "================================================"
echo ""

# 階段 1: 設置資源群組
echo "=== 階段 1/6: 設置資源群組 ==="
if [ -f "$SCRIPT_DIR/01-setup-resources.sh" ]; then
  bash "$SCRIPT_DIR/01-setup-resources.sh"
  echo "✅ 資源群組設置完成"
else
  echo "⚠️  腳本不存在，跳過: 01-setup-resources.sh"
fi
echo ""

# 階段 2: 設置資料庫
echo "=== 階段 2/6: 設置 PostgreSQL 資料庫 ==="
if [ -f "$SCRIPT_DIR/02-setup-database.sh" ]; then
  bash "$SCRIPT_DIR/02-setup-database.sh"
  echo "✅ 資料庫設置完成"
else
  echo "⚠️  腳本不存在，跳過: 02-setup-database.sh"
fi
echo ""

# 階段 3: 設置儲存體
echo "=== 階段 3/6: 設置 Blob Storage ==="
if [ -f "$SCRIPT_DIR/03-setup-storage.sh" ]; then
  bash "$SCRIPT_DIR/03-setup-storage.sh"
  echo "✅ 儲存體設置完成"
else
  echo "⚠️  腳本不存在，跳過: 03-setup-storage.sh"
fi
echo ""

# 階段 4: 設置 Container Registry
echo "=== 階段 4/6: 設置 Container Registry ==="
if [ -f "$SCRIPT_DIR/04-setup-acr.sh" ]; then
  bash "$SCRIPT_DIR/04-setup-acr.sh"
  echo "✅ Container Registry 設置完成"
else
  echo "⚠️  腳本不存在，跳過: 04-setup-acr.sh"
fi
echo ""

# 階段 5: 設置 App Service
echo "=== 階段 5/6: 設置 App Service ==="
if [ -f "$SCRIPT_DIR/05-setup-appservice.sh" ]; then
  bash "$SCRIPT_DIR/05-setup-appservice.sh"
  echo "✅ App Service 設置完成"
else
  echo "⚠️  腳本不存在，跳過: 05-setup-appservice.sh"
fi
echo ""

# 階段 6: 部署應用程式
echo "=== 階段 6/6: 部署應用程式 ==="
if [ -f "$SCRIPT_DIR/06-deploy-app.sh" ]; then
  bash "$SCRIPT_DIR/06-deploy-app.sh"
  echo "✅ 應用程式部署完成"
else
  echo "⚠️  腳本不存在，跳過: 06-deploy-app.sh"
fi
echo ""

# ============================================================================
# 6. 部署完成
# ============================================================================
echo "================================================"
echo "✅ 公司環境部署完成！"
echo "================================================"
echo ""
echo "📋 部署信息:"
echo "  環境: company/$ENV"
echo "  訂閱: ${AZURE_SUBSCRIPTION_ID}"
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
echo "  2. 執行完整測試流程"
echo "  3. 檢查應用日誌："
echo "     az webapp log tail --name ${APP_SERVICE_NAME} --resource-group ${RESOURCE_GROUP}"
echo "  4. 通知相關團隊部署完成"
echo ""

# ============================================================================
# 7. 記錄部署歷史
# ============================================================================
DEPLOYMENT_LOG="$PROJECT_ROOT/azure/deployment-history/company/deploy-${ENV}-$(date +%Y%m%d-%H%M%S).log"
mkdir -p "$(dirname "$DEPLOYMENT_LOG")"

cat > "$DEPLOYMENT_LOG" <<EOF
部署時間: $(date)
環境: company/$ENV
訂閱: ${AZURE_SUBSCRIPTION_ID}
資源群組: ${RESOURCE_GROUP}
應用名稱: ${APP_SERVICE_NAME}
執行者: $(whoami)
狀態: 成功
EOF

echo "📝 部署記錄已保存: $DEPLOYMENT_LOG"
echo ""
