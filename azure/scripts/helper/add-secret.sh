#!/bin/bash
# ==============================================================================
# Add Secret to Azure Key Vault
# ==============================================================================
# 用途: 快速添加密鑰到指定環境的 Key Vault
# 使用: ./add-secret.sh <environment> <secret-category-name> <secret-value>
# 範例: ./add-secret.sh dev DATABASE-URL "postgresql://..."
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

# 參數驗證
if [ $# -lt 3 ]; then
    log_error "缺少參數"
    echo ""
    echo "使用方式: $0 <environment> <secret-category-name> <secret-value>"
    echo ""
    echo "範例:"
    echo "  $0 dev DATABASE-URL \"postgresql://user:pass@host:5432/db\""
    echo "  $0 staging NEXTAUTH-SECRET \"your-secret-key\""
    echo "  $0 prod SENDGRID-API-KEY \"SG.xxxxxxxx\""
    echo ""
    exit 1
fi

ENVIRONMENT=$1
SECRET_CATEGORY_NAME=$2
SECRET_VALUE=$3

# 驗證環境參數
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    log_error "無效的環境參數：$ENVIRONMENT"
    echo "有效值: dev, staging, prod"
    exit 1
fi

# 設置 Key Vault 名稱
KV_NAME="kv-itpm-${ENVIRONMENT}"

# 生成完整密鑰名稱（遵循命名規範）
SECRET_NAME="ITPM-${ENVIRONMENT^^}-${SECRET_CATEGORY_NAME}"

log_info "添加密鑰到 Key Vault"
echo "Environment: $ENVIRONMENT"
echo "Key Vault:   $KV_NAME"
echo "Secret Name: $SECRET_NAME"
echo ""

# 檢查 Azure CLI 登入
if ! az account show &> /dev/null; then
    log_error "未登入 Azure CLI，請先執行: az login"
    exit 1
fi

# 檢查 Key Vault 是否存在
log_info "檢查 Key Vault 是否存在..."
if ! az keyvault show --name "$KV_NAME" &> /dev/null; then
    log_error "Key Vault '$KV_NAME' 不存在"
    exit 1
fi

log_success "Key Vault 存在"

# 檢查密鑰是否已存在
log_info "檢查密鑰是否已存在..."
if az keyvault secret show --vault-name "$KV_NAME" --name "$SECRET_NAME" &> /dev/null; then
    log_warning "密鑰 '$SECRET_NAME' 已存在"
    echo ""
    read -p "是否要更新現有密鑰？(y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "操作已取消"
        exit 0
    fi
fi

# 添加/更新密鑰
log_info "正在添加密鑰..."
az keyvault secret set \
    --vault-name "$KV_NAME" \
    --name "$SECRET_NAME" \
    --value "$SECRET_VALUE" \
    --output none

if [ $? -eq 0 ]; then
    log_success "密鑰已成功添加！"
    echo ""
    echo "密鑰詳情:"
    echo "  Name:     $SECRET_NAME"
    echo "  Vault:    $KV_NAME"
    echo ""
    echo "App Service 引用格式:"
    echo "  @Microsoft.KeyVault(VaultName=${KV_NAME};SecretName=${SECRET_NAME})"
    echo ""
else
    log_error "添加密鑰失敗"
    exit 1
fi

# 顯示密鑰資訊（不顯示值）
log_info "密鑰元數據:"
az keyvault secret show \
    --vault-name "$KV_NAME" \
    --name "$SECRET_NAME" \
    --query "{Name:name, Enabled:attributes.enabled, Created:attributes.created, Updated:attributes.updated}" \
    -o table

log_success "操作完成！"
