#!/bin/bash
# ==============================================================================
# Azure Blob Storage 設置腳本
# ==============================================================================
# 用途: 創建 Azure Storage Account 和 Blob Containers
# 使用: ./03-setup-storage.sh <environment>
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

log_section "☁️  Azure Blob Storage 設置 - $ENVIRONMENT 環境"

# 環境配置
case $ENVIRONMENT in
    dev)
        LOCATION="eastasia"
        RESOURCE_GROUP="rg-itpm-dev"
        STORAGE_ACCOUNT="stgitpmdev001"
        SKU="Standard_LRS"
        ACCESS_TIER="Hot"
        TAGS="Environment=Development Project=ITPM"
        ;;
    staging)
        LOCATION="eastasia"
        RESOURCE_GROUP="rg-itpm-staging"
        STORAGE_ACCOUNT="stgitpmstaging001"
        SKU="Standard_GRS"
        ACCESS_TIER="Hot"
        TAGS="Environment=Staging Project=ITPM"
        ;;
    prod)
        LOCATION="eastasia"
        RESOURCE_GROUP="rg-itpm-prod"
        STORAGE_ACCOUNT="stgitpmprod001"
        SKU="Standard_GZRS"
        ACCESS_TIER="Hot"
        TAGS="Environment=Production Project=ITPM"
        ;;
esac

# Container 名稱（所有環境相同）
CONTAINERS=("quotes" "invoices" "proposals")

log_info "環境: $ENVIRONMENT"
log_info "Storage Account: $STORAGE_ACCOUNT"
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

# 創建 Storage Account
log_section "🗄️  創建 Storage Account"

EXISTING_STORAGE=$(az storage account show \
    --name "$STORAGE_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    2>/dev/null || echo "")

if [ -n "$EXISTING_STORAGE" ]; then
    log_warning "Storage Account 已存在: $STORAGE_ACCOUNT"
else
    log_info "創建 Storage Account: $STORAGE_ACCOUNT"

    az storage account create \
        --name "$STORAGE_ACCOUNT" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --sku "$SKU" \
        --kind "StorageV2" \
        --access-tier "$ACCESS_TIER" \
        --https-only true \
        --min-tls-version "TLS1_2" \
        --allow-blob-public-access false \
        --tags $TAGS \
        --output none

    if [ $? -eq 0 ]; then
        log_success "Storage Account 創建成功"
    else
        log_error "Storage Account 創建失敗"
        exit 1
    fi
fi

# 啟用 Blob 軟刪除（保留 7 天）
log_section "🗑️  啟用 Blob 軟刪除"

az storage blob service-properties delete-policy update \
    --account-name "$STORAGE_ACCOUNT" \
    --enable true \
    --days-retained 7 \
    --auth-mode login \
    --output none

log_success "Blob 軟刪除已啟用（7 天保留期）"

# 啟用版本控制（僅生產環境）
if [ "$ENVIRONMENT" == "prod" ]; then
    log_section "📌 啟用 Blob 版本控制"

    az storage account blob-service-properties update \
        --account-name "$STORAGE_ACCOUNT" \
        --resource-group "$RESOURCE_GROUP" \
        --enable-versioning true \
        --output none

    log_success "Blob 版本控制已啟用"
fi

# 創建 Blob Containers
log_section "📦 創建 Blob Containers"

for container in "${CONTAINERS[@]}"; do
    log_info "創建 Container: $container"

    az storage container create \
        --name "$container" \
        --account-name "$STORAGE_ACCOUNT" \
        --auth-mode login \
        --public-access off \
        --output none

    if [ $? -eq 0 ]; then
        log_success "Container \"$container\" 創建成功"
    else
        log_warning "Container \"$container\" 可能已存在"
    fi
done

# 配置 CORS（允許 Web 應用存取）
log_section "🌐 配置 CORS 規則"

az storage cors add \
    --services b \
    --methods GET POST PUT DELETE OPTIONS \
    --origins "*" \
    --allowed-headers "*" \
    --exposed-headers "*" \
    --max-age 3600 \
    --account-name "$STORAGE_ACCOUNT" \
    --auth-mode login \
    --output none

log_success "CORS 規則已配置"

# 獲取憑證資訊
log_section "🔑 獲取 Storage Account 憑證"

# 獲取 Storage Account Key
STORAGE_KEY=$(az storage account keys list \
    --account-name "$STORAGE_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --query "[0].value" -o tsv)

# 獲取 Connection String
CONNECTION_STRING=$(az storage account show-connection-string \
    --name "$STORAGE_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --query "connectionString" -o tsv)

log_success "憑證已獲取"

# 保存憑證到文件
mkdir -p .azure/output
cat > ".azure/output/${ENVIRONMENT}-storage-credentials.txt" <<EOF
# Azure Storage Account 憑證 - $ENVIRONMENT 環境
# ⚠️ 警告: 此文件包含敏感資訊，請勿提交到版本控制
# ⚠️ 請將這些憑證添加到 Azure Key Vault 並刪除此文件

Storage Account 名稱:  $STORAGE_ACCOUNT
Storage Account Key:   $STORAGE_KEY
Connection String:     $CONNECTION_STRING

# Blob Containers:
$(for container in "${CONTAINERS[@]}"; do echo "  - $container"; done)

# Azure Key Vault 儲存建議:
# ITPM-${ENVIRONMENT^^}-AZURE-STORAGE-ACCOUNT-NAME: $STORAGE_ACCOUNT
# ITPM-${ENVIRONMENT^^}-AZURE-STORAGE-ACCOUNT-KEY: $STORAGE_KEY
# ITPM-${ENVIRONMENT^^}-AZURE-STORAGE-CONNECTION-STRING: $CONNECTION_STRING
EOF

log_success "憑證已保存到: .azure/output/${ENVIRONMENT}-storage-credentials.txt"

# 顯示 Storage Account 資訊
log_section "📊 Storage Account 資訊"

STORAGE_INFO=$(az storage account show \
    --name "$STORAGE_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --output json)

echo "$STORAGE_INFO" | jq -r '
"名稱:             " + .name,
"SKU:              " + .sku.name,
"狀態:             " + .provisioningState,
"存取層級:         " + .accessTier,
"主要端點:         " + .primaryEndpoints.blob,
"HTTPS Only:       " + (.enableHttpsTrafficOnly | tostring),
"最小 TLS 版本:    " + .minimumTlsVersion
'

# 列出所有 Containers
log_info "已創建的 Containers:"
for container in "${CONTAINERS[@]}"; do
    echo "  ✅ $container"
done

# 完成總結
log_section "✅ Blob Storage 設置完成"

echo ""
log_success "環境: $ENVIRONMENT"
log_success "Storage Account: $STORAGE_ACCOUNT"
log_success "SKU: $SKU"

echo ""
log_info "已配置的資源:"
echo "  ✅ Storage Account"
echo "  ✅ 3 個 Blob Containers (quotes, invoices, proposals)"
echo "  ✅ Blob 軟刪除（7 天）"
if [ "$ENVIRONMENT" == "prod" ]; then
    echo "  ✅ Blob 版本控制"
fi
echo "  ✅ CORS 規則"

echo ""
log_warning "重要提醒:"
echo "  1. 憑證已保存到: .azure/output/${ENVIRONMENT}-storage-credentials.txt"
echo "  2. 請將憑證添加到 Azure Key Vault"
echo "  3. 完成後刪除憑證文件"

echo ""
log_info "下一步:"
echo "  1. 將 Storage 憑證添加到 Key Vault"
echo "  2. 執行: ./04-setup-acr.sh $ENVIRONMENT"

echo ""
log_success "Blob Storage 設置腳本執行完成！"
