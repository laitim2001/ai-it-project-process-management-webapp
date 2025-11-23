#!/bin/bash
# ==============================================================================
# Azure 資源組設置腳本
# ==============================================================================
# 用途: 創建 Resource Groups 和基礎設施
# 使用: ./01-setup-resources.sh <environment>
# 範例: ./01-setup-resources.sh dev
#       ./01-setup-resources.sh staging
#       ./01-setup-resources.sh prod
# ==============================================================================

set -e  # 遇到錯誤立即退出
set -u  # 使用未定義變數時退出

# ------------------------------------------------------------------------------
# 顏色定義
# ------------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ------------------------------------------------------------------------------
# 輔助函數
# ------------------------------------------------------------------------------
log_info() {
    echo -e "${BLUE}ℹ️  ${NC}$1"
}

log_success() {
    echo -e "${GREEN}✅ ${NC}$1"
}

log_warning() {
    echo -e "${YELLOW}⚠️  ${NC}$1"
}

log_error() {
    echo -e "${RED}❌ ${NC}$1"
}

log_section() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ------------------------------------------------------------------------------
# 參數驗證
# ------------------------------------------------------------------------------
if [ $# -eq 0 ]; then
    log_error "缺少環境參數"
    echo ""
    echo "使用方式: $0 <environment>"
    echo ""
    echo "可用環境:"
    echo "  dev      - 開發環境"
    echo "  staging  - 預發布環境"
    echo "  prod     - 生產環境"
    echo ""
    echo "範例:"
    echo "  $0 dev"
    echo "  $0 staging"
    echo "  $0 prod"
    exit 1
fi

ENVIRONMENT=$1

# 驗證環境參數
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    log_error "無效的環境參數: $ENVIRONMENT"
    log_info "允許的環境: dev, staging, prod"
    exit 1
fi

log_section "🚀 Azure 資源組設置 - $ENVIRONMENT 環境"

# ------------------------------------------------------------------------------
# 環境配置
# ------------------------------------------------------------------------------
case $ENVIRONMENT in
    dev)
        LOCATION="eastasia"
        RESOURCE_GROUP="rg-itpm-dev"
        TAGS="Environment=Development Project=ITPM ManagedBy=Automation CostCenter=IT"
        ;;
    staging)
        LOCATION="eastasia"
        RESOURCE_GROUP="rg-itpm-staging"
        TAGS="Environment=Staging Project=ITPM ManagedBy=Automation CostCenter=IT"
        ;;
    prod)
        LOCATION="eastasia"
        RESOURCE_GROUP="rg-itpm-prod"
        TAGS="Environment=Production Project=ITPM ManagedBy=Automation CostCenter=IT"
        ;;
esac

log_info "環境: $ENVIRONMENT"
log_info "區域: $LOCATION"
log_info "資源組: $RESOURCE_GROUP"

# ------------------------------------------------------------------------------
# 檢查 Azure CLI 登入狀態
# ------------------------------------------------------------------------------
log_section "🔐 驗證 Azure CLI 登入狀態"

if ! az account show &> /dev/null; then
    log_error "未登入 Azure CLI"
    log_info "請執行: az login"
    exit 1
fi

CURRENT_SUBSCRIPTION=$(az account show --query "name" -o tsv)
CURRENT_TENANT=$(az account show --query "tenantId" -o tsv)

log_success "已登入 Azure CLI"
log_info "訂閱: $CURRENT_SUBSCRIPTION"
log_info "租戶: $CURRENT_TENANT"

# ------------------------------------------------------------------------------
# 確認操作
# ------------------------------------------------------------------------------
echo ""
log_warning "即將創建以下資源:"
echo "  • 資源組: $RESOURCE_GROUP"
echo "  • 區域: $LOCATION"
echo "  • 環境: $ENVIRONMENT"
echo ""
read -p "確認繼續? (yes/no): " CONFIRM

if [[ "$CONFIRM" != "yes" ]]; then
    log_info "操作已取消"
    exit 0
fi

# ------------------------------------------------------------------------------
# 檢查資源組是否已存在
# ------------------------------------------------------------------------------
log_section "📦 檢查資源組"

if az group exists --name "$RESOURCE_GROUP" | grep -q 'true'; then
    log_warning "資源組已存在: $RESOURCE_GROUP"

    # 顯示現有資源
    log_info "查詢現有資源..."
    EXISTING_RESOURCES=$(az resource list --resource-group "$RESOURCE_GROUP" --query "length(@)")

    if [ "$EXISTING_RESOURCES" -gt 0 ]; then
        log_info "資源組中已有 $EXISTING_RESOURCES 個資源"

        echo ""
        log_warning "繼續將使用現有資源組"
        read -p "確認繼續? (yes/no): " CONFIRM_EXISTING

        if [[ "$CONFIRM_EXISTING" != "yes" ]]; then
            log_info "操作已取消"
            exit 0
        fi
    fi
else
    # 創建資源組
    log_info "創建資源組: $RESOURCE_GROUP"

    az group create \
        --name "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --tags $TAGS \
        --output none

    if [ $? -eq 0 ]; then
        log_success "資源組創建成功"
    else
        log_error "資源組創建失敗"
        exit 1
    fi
fi

# ------------------------------------------------------------------------------
# 顯示資源組詳情
# ------------------------------------------------------------------------------
log_section "📊 資源組詳情"

RG_INFO=$(az group show --name "$RESOURCE_GROUP" --output json)

echo "$RG_INFO" | jq -r '
"資源組名稱:   " + .name,
"區域:         " + .location,
"狀態:         " + .properties.provisioningState,
"資源組 ID:    " + .id
'

# 顯示標籤
log_info "標籤:"
echo "$RG_INFO" | jq -r '.tags | to_entries | .[] | "  • \(.key): \(.value)"'

# ------------------------------------------------------------------------------
# 設置資源鎖定（僅生產環境）
# ------------------------------------------------------------------------------
if [ "$ENVIRONMENT" == "prod" ]; then
    log_section "🔒 設置資源鎖定 (生產環境)"

    LOCK_NAME="DoNotDelete-ITPM-Prod"

    # 檢查鎖定是否已存在
    EXISTING_LOCK=$(az lock show \
        --name "$LOCK_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        2>/dev/null || echo "")

    if [ -z "$EXISTING_LOCK" ]; then
        log_info "創建資源鎖定: $LOCK_NAME"

        az lock create \
            --name "$LOCK_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --lock-type CanNotDelete \
            --notes "防止意外刪除生產環境資源組" \
            --output none

        if [ $? -eq 0 ]; then
            log_success "資源鎖定創建成功"
            log_warning "注意: 刪除資源組前需先移除此鎖定"
        else
            log_warning "資源鎖定創建失敗（可能權限不足）"
        fi
    else
        log_info "資源鎖定已存在"
    fi
fi

# ------------------------------------------------------------------------------
# 創建網路安全組（為 App Service 使用）
# ------------------------------------------------------------------------------
log_section "🛡️  創建網路安全組"

NSG_NAME="nsg-itpm-${ENVIRONMENT}"

# 檢查 NSG 是否已存在
EXISTING_NSG=$(az network nsg show \
    --name "$NSG_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    2>/dev/null || echo "")

if [ -z "$EXISTING_NSG" ]; then
    log_info "創建網路安全組: $NSG_NAME"

    az network nsg create \
        --name "$NSG_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --tags $TAGS \
        --output none

    if [ $? -eq 0 ]; then
        log_success "網路安全組創建成功"

        # 添加允許 HTTPS 的規則
        log_info "添加 HTTPS 入站規則"
        az network nsg rule create \
            --name "AllowHTTPS" \
            --nsg-name "$NSG_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --priority 100 \
            --source-address-prefixes '*' \
            --destination-port-ranges 443 \
            --protocol Tcp \
            --access Allow \
            --direction Inbound \
            --description "Allow HTTPS inbound traffic" \
            --output none

        # 添加允許 HTTP 的規則（僅開發環境）
        if [ "$ENVIRONMENT" == "dev" ]; then
            log_info "添加 HTTP 入站規則（開發環境）"
            az network nsg rule create \
                --name "AllowHTTP" \
                --nsg-name "$NSG_NAME" \
                --resource-group "$RESOURCE_GROUP" \
                --priority 110 \
                --source-address-prefixes '*' \
                --destination-port-ranges 80 \
                --protocol Tcp \
                --access Allow \
                --direction Inbound \
                --description "Allow HTTP inbound traffic (Dev only)" \
                --output none
        fi

        log_success "網路安全規則配置完成"
    else
        log_error "網路安全組創建失敗"
        exit 1
    fi
else
    log_info "網路安全組已存在: $NSG_NAME"
fi

# ------------------------------------------------------------------------------
# 創建 Log Analytics Workspace（監控用）
# ------------------------------------------------------------------------------
log_section "📊 創建 Log Analytics Workspace"

LAW_NAME="law-itpm-${ENVIRONMENT}"

# 檢查 Workspace 是否已存在
EXISTING_LAW=$(az monitor log-analytics workspace show \
    --workspace-name "$LAW_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    2>/dev/null || echo "")

if [ -z "$EXISTING_LAW" ]; then
    log_info "創建 Log Analytics Workspace: $LAW_NAME"

    # 設置數據保留天數（根據環境）
    case $ENVIRONMENT in
        dev)
            RETENTION_DAYS=30
            ;;
        staging)
            RETENTION_DAYS=60
            ;;
        prod)
            RETENTION_DAYS=90
            ;;
    esac

    az monitor log-analytics workspace create \
        --workspace-name "$LAW_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --retention-time "$RETENTION_DAYS" \
        --tags $TAGS \
        --output none

    if [ $? -eq 0 ]; then
        log_success "Log Analytics Workspace 創建成功"
        log_info "數據保留期: $RETENTION_DAYS 天"

        # 獲取 Workspace ID（後續其他資源會需要）
        WORKSPACE_ID=$(az monitor log-analytics workspace show \
            --workspace-name "$LAW_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --query "id" -o tsv)

        log_info "Workspace ID: $WORKSPACE_ID"

        # 保存到輸出文件（供後續腳本使用）
        mkdir -p .azure/output
        echo "$WORKSPACE_ID" > ".azure/output/${ENVIRONMENT}-workspace-id.txt"
        log_success "Workspace ID 已保存"
    else
        log_error "Log Analytics Workspace 創建失敗"
        exit 1
    fi
else
    log_info "Log Analytics Workspace 已存在: $LAW_NAME"
fi

# ------------------------------------------------------------------------------
# 完成總結
# ------------------------------------------------------------------------------
log_section "✅ 資源組設置完成"

echo ""
log_success "環境: $ENVIRONMENT"
log_success "資源組: $RESOURCE_GROUP"
log_success "區域: $LOCATION"

echo ""
log_info "已創建的資源:"
echo "  ✅ 資源組: $RESOURCE_GROUP"
echo "  ✅ 網路安全組: $NSG_NAME"
echo "  ✅ Log Analytics Workspace: $LAW_NAME"

if [ "$ENVIRONMENT" == "prod" ]; then
    echo "  🔒 資源鎖定: $LOCK_NAME"
fi

echo ""
log_info "下一步:"
echo "  1. 執行: ./02-setup-database.sh $ENVIRONMENT"
echo "  2. 執行: ./03-setup-storage.sh $ENVIRONMENT"
echo "  3. 執行: ./04-setup-acr.sh $ENVIRONMENT"
echo "  4. 執行: ./05-setup-appservice.sh $ENVIRONMENT"

echo ""
log_success "資源組設置腳本執行完成！"
