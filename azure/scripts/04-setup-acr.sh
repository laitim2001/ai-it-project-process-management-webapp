#!/bin/bash
# ==============================================================================
# Azure Container Registry 設置腳本
# ==============================================================================
# 用途: 創建 Azure Container Registry (ACR)
# 使用: ./04-setup-acr.sh <environment>
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
    echo "使用方式: $0 <environment>"
    exit 1
fi

ENVIRONMENT=$1
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    log_error "無效的環境參數: $ENVIRONMENT"
    exit 1
fi

log_section "🐳 Azure Container Registry 設置 - $ENVIRONMENT 環境"

# 環境配置
case $ENVIRONMENT in
    dev)
        LOCATION="eastasia"
        RESOURCE_GROUP="rg-itpm-dev"
        ACR_NAME="acritpmdev"
        SKU="Basic"
        TAGS="Environment=Development Project=ITPM"
        ;;
    staging)
        LOCATION="eastasia"
        RESOURCE_GROUP="rg-itpm-staging"
        ACR_NAME="acritpmstaging"
        SKU="Standard"
        TAGS="Environment=Staging Project=ITPM"
        ;;
    prod)
        LOCATION="eastasia"
        RESOURCE_GROUP="rg-itpm-prod"
        ACR_NAME="acritpmprod"
        SKU="Premium"
        TAGS="Environment=Production Project=ITPM"
        ;;
esac

log_info "環境: $ENVIRONMENT"
log_info "ACR 名稱: $ACR_NAME"
log_info "SKU: $SKU"

# 檢查登入
log_section "🔐 驗證 Azure CLI 登入"
if ! az account show &> /dev/null; then
    log_error "未登入 Azure CLI"
    exit 1
fi
log_success "已登入 Azure CLI"

# 檢查資源組
log_section "📦 檢查資源組"
if ! az group exists --name "$RESOURCE_GROUP" | grep -q 'true'; then
    log_error "資源組不存在: $RESOURCE_GROUP"
    exit 1
fi
log_success "資源組存在"

# 創建 ACR
log_section "🚀 創建 Azure Container Registry"

EXISTING_ACR=$(az acr show \
    --name "$ACR_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    2>/dev/null || echo "")

if [ -n "$EXISTING_ACR" ]; then
    log_warning "ACR 已存在: $ACR_NAME"
else
    log_info "創建 ACR: $ACR_NAME （這可能需要幾分鐘）"

    az acr create \
        --name "$ACR_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --sku "$SKU" \
        --admin-enabled true \
        --tags $TAGS \
        --output none

    if [ $? -eq 0 ]; then
        log_success "ACR 創建成功"
    else
        log_error "ACR 創建失敗"
        exit 1
    fi
fi

# 啟用管理員帳號（如果尚未啟用）
log_section "🔑 啟用管理員帳號"

az acr update \
    --name "$ACR_NAME" \
    --admin-enabled true \
    --output none

log_success "管理員帳號已啟用"

# 配置 ACR 網路規則（生產環境限制存取）
if [ "$ENVIRONMENT" == "prod" ]; then
    log_section "🛡️  配置網路規則（生產環境）"

    az acr update \
        --name "$ACR_NAME" \
        --public-network-enabled true \
        --default-action Deny \
        --output none

    log_success "網路規則已配置（僅允許 Azure 服務存取）"
fi

# 啟用內容信任（生產環境）
if [ "$ENVIRONMENT" == "prod" ] && [ "$SKU" == "Premium" ]; then
    log_section "🔒 啟用內容信任"

    az acr config content-trust update \
        --name "$ACR_NAME" \
        --status enabled \
        --output none

    log_success "內容信任已啟用"
fi

# 獲取 ACR 憑證
log_section "🔐 獲取 ACR 憑證"

ACR_LOGIN_SERVER=$(az acr show \
    --name "$ACR_NAME" \
    --query "loginServer" -o tsv)

ACR_USERNAME=$(az acr credential show \
    --name "$ACR_NAME" \
    --query "username" -o tsv)

ACR_PASSWORD=$(az acr credential show \
    --name "$ACR_NAME" \
    --query "passwords[0].value" -o tsv)

log_success "ACR 憑證已獲取"

# 保存憑證到文件
mkdir -p .azure/output
cat > ".azure/output/${ENVIRONMENT}-acr-credentials.txt" <<EOF
# Azure Container Registry 憑證 - $ENVIRONMENT 環境
# ⚠️ 警告: 此文件包含敏感資訊，請勿提交到版本控制
# ⚠️ 請將這些憑證添加到 GitHub Secrets 和 Azure Key Vault

ACR 名稱:         $ACR_NAME
ACR 登入伺服器:   $ACR_LOGIN_SERVER
ACR 用戶名:       $ACR_USERNAME
ACR 密碼:         $ACR_PASSWORD

# Docker 登入指令:
docker login $ACR_LOGIN_SERVER -u $ACR_USERNAME -p $ACR_PASSWORD

# GitHub Secrets 設置建議:
# ACR_REGISTRY: $ACR_LOGIN_SERVER
# ACR_USERNAME: $ACR_USERNAME
# ACR_PASSWORD: $ACR_PASSWORD

# 鏡像命名規範:
# $ACR_LOGIN_SERVER/itpm-web:latest
# $ACR_LOGIN_SERVER/itpm-web:\${GITHUB_SHA}
# $ACR_LOGIN_SERVER/itpm-web:v1.0.0
EOF

log_success "憑證已保存到: .azure/output/${ENVIRONMENT}-acr-credentials.txt"

# 創建倉庫（可選，首次推送時自動創建）
log_section "📦 準備容器倉庫"

REPOSITORY_NAME="itpm-web"
log_info "倉庫名稱: $REPOSITORY_NAME"
log_info "推送鏡像時將自動創建倉庫"

# 測試 ACR 登入
log_section "🧪 測試 ACR 登入"

if az acr login --name "$ACR_NAME" &> /dev/null; then
    log_success "ACR 登入測試成功"
else
    log_warning "ACR 登入測試失敗（可能需要 Docker daemon 運行）"
fi

# 顯示 ACR 資訊
log_section "📊 ACR 資訊"

ACR_INFO=$(az acr show \
    --name "$ACR_NAME" \
    --output json)

echo "$ACR_INFO" | jq -r '
"名稱:             " + .name,
"登入伺服器:       " + .loginServer,
"SKU:              " + .sku.name,
"狀態:             " + .provisioningState,
"管理員啟用:       " + (.adminUserEnabled | tostring),
"位置:             " + .location
'

# 完成總結
log_section "✅ Container Registry 設置完成"

echo ""
log_success "環境: $ENVIRONMENT"
log_success "ACR: $ACR_LOGIN_SERVER"

echo ""
log_info "已配置的資源:"
echo "  ✅ Azure Container Registry"
echo "  ✅ 管理員帳號已啟用"
if [ "$ENVIRONMENT" == "prod" ]; then
    echo "  ✅ 網路規則已配置"
    if [ "$SKU" == "Premium" ]; then
        echo "  ✅ 內容信任已啟用"
    fi
fi

echo ""
log_warning "重要提醒:"
echo "  1. 憑證已保存到: .azure/output/${ENVIRONMENT}-acr-credentials.txt"
echo "  2. 請將 ACR 憑證添加到 GitHub Secrets"
echo "  3. Secret 名稱: ACR_REGISTRY, ACR_USERNAME, ACR_PASSWORD"

echo ""
log_info "下一步:"
echo "  1. 設置 GitHub Secrets"
echo "  2. 測試 Docker 推送:"
echo "     docker login $ACR_LOGIN_SERVER"
echo "     docker tag my-image $ACR_LOGIN_SERVER/itpm-web:test"
echo "     docker push $ACR_LOGIN_SERVER/itpm-web:test"
echo "  3. 執行: ./05-setup-appservice.sh $ENVIRONMENT"

echo ""
log_success "Container Registry 設置腳本執行完成！"
