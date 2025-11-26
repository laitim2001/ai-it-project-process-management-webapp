#!/bin/bash
# ==============================================================================
# Azure PostgreSQL Database 設置腳本
# ==============================================================================
# 用途: 創建 Azure Database for PostgreSQL Flexible Server
# 使用: ./02-setup-database.sh <environment>
# 範例: ./02-setup-database.sh dev
#       ./02-setup-database.sh staging
#       ./02-setup-database.sh prod
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
NC='\033[0m'

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

generate_password() {
    # 生成安全的隨機密碼（20字符，包含大小寫字母和數字）
    LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 20
}

# ------------------------------------------------------------------------------
# 參數驗證
# ------------------------------------------------------------------------------
if [ $# -eq 0 ]; then
    log_error "缺少環境參數"
    echo ""
    echo "使用方式: $0 <environment>"
    echo "可用環境: dev, staging, prod"
    exit 1
fi

ENVIRONMENT=$1

if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    log_error "無效的環境參數: $ENVIRONMENT"
    exit 1
fi

log_section "🗄️  Azure PostgreSQL Database 設置 - $ENVIRONMENT 環境"

# ------------------------------------------------------------------------------
# 環境配置
# ------------------------------------------------------------------------------
case $ENVIRONMENT in
    dev)
        LOCATION="eastasia"
        RESOURCE_GROUP="rg-itpm-dev"
        SERVER_NAME="psql-itpm-dev-001"
        DATABASE_NAME="itpm_dev"
        ADMIN_USERNAME="itpmadmin"
        SKU_NAME="Standard_B1ms"          # 1 vCore, 2GB RAM (經濟型)
        STORAGE_SIZE_GB=32                # 32 GB storage
        BACKUP_RETENTION_DAYS=7           # 7 天備份保留
        GEO_REDUNDANT_BACKUP="Disabled"
        HIGH_AVAILABILITY="Disabled"
        TAGS="Environment=Development Project=ITPM ManagedBy=Automation"
        ;;
    staging)
        LOCATION="eastasia"
        RESOURCE_GROUP="rg-itpm-staging"
        SERVER_NAME="psql-itpm-staging-001"
        DATABASE_NAME="itpm_staging"
        ADMIN_USERNAME="itpmadmin"
        SKU_NAME="Standard_D2ds_v4"       # 2 vCore, 8GB RAM
        STORAGE_SIZE_GB=128               # 128 GB storage
        BACKUP_RETENTION_DAYS=14          # 14 天備份保留
        GEO_REDUNDANT_BACKUP="Disabled"
        HIGH_AVAILABILITY="Disabled"
        TAGS="Environment=Staging Project=ITPM ManagedBy=Automation"
        ;;
    prod)
        LOCATION="eastasia"
        RESOURCE_GROUP="rg-itpm-prod"
        SERVER_NAME="psql-itpm-prod-001"
        DATABASE_NAME="itpm_prod"
        ADMIN_USERNAME="itpmadmin"
        SKU_NAME="Standard_D4ds_v4"       # 4 vCore, 16GB RAM
        STORAGE_SIZE_GB=256               # 256 GB storage
        BACKUP_RETENTION_DAYS=35          # 35 天備份保留（合規要求）
        GEO_REDUNDANT_BACKUP="Enabled"    # 啟用異地備份
        HIGH_AVAILABILITY="ZoneRedundant" # 啟用區域冗餘高可用性
        TAGS="Environment=Production Project=ITPM ManagedBy=Automation"
        ;;
esac

POSTGRES_VERSION="16"  # PostgreSQL 版本

log_info "環境: $ENVIRONMENT"
log_info "伺服器名稱: $SERVER_NAME"
log_info "資料庫名稱: $DATABASE_NAME"
log_info "SKU: $SKU_NAME"
log_info "存儲大小: ${STORAGE_SIZE_GB} GB"

# ------------------------------------------------------------------------------
# 檢查 Azure CLI 登入
# ------------------------------------------------------------------------------
log_section "🔐 驗證 Azure CLI 登入狀態"

if ! az account show &> /dev/null; then
    log_error "未登入 Azure CLI"
    exit 1
fi

log_success "已登入 Azure CLI"

# ------------------------------------------------------------------------------
# 檢查資源組是否存在
# ------------------------------------------------------------------------------
log_section "📦 檢查資源組"

if ! az group exists --name "$RESOURCE_GROUP" | grep -q 'true'; then
    log_error "資源組不存在: $RESOURCE_GROUP"
    log_info "請先執行: ./01-setup-resources.sh $ENVIRONMENT"
    exit 1
fi

log_success "資源組存在: $RESOURCE_GROUP"

# ------------------------------------------------------------------------------
# 檢查 PostgreSQL 伺服器是否已存在
# ------------------------------------------------------------------------------
log_section "🔍 檢查 PostgreSQL 伺服器"

EXISTING_SERVER=$(az postgres flexible-server show \
    --name "$SERVER_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    2>/dev/null || echo "")

if [ -n "$EXISTING_SERVER" ]; then
    log_warning "PostgreSQL 伺服器已存在: $SERVER_NAME"

    # 顯示現有伺服器資訊（使用 Azure CLI 原生查詢，避免依賴 jq）
    SERVER_STATE=$(az postgres flexible-server show --name "$SERVER_NAME" --resource-group "$RESOURCE_GROUP" --query "state" -o tsv 2>/dev/null || echo "unknown")
    SERVER_VERSION=$(az postgres flexible-server show --name "$SERVER_NAME" --resource-group "$RESOURCE_GROUP" --query "version" -o tsv 2>/dev/null || echo "unknown")
    SERVER_SKU=$(az postgres flexible-server show --name "$SERVER_NAME" --resource-group "$RESOURCE_GROUP" --query "sku.name" -o tsv 2>/dev/null || echo "unknown")
    SERVER_STORAGE=$(az postgres flexible-server show --name "$SERVER_NAME" --resource-group "$RESOURCE_GROUP" --query "storage.storageSizeGb" -o tsv 2>/dev/null || echo "unknown")
    SERVER_FQDN=$(az postgres flexible-server show --name "$SERVER_NAME" --resource-group "$RESOURCE_GROUP" --query "fullyQualifiedDomainName" -o tsv 2>/dev/null || echo "unknown")

    echo "伺服器名稱:   $SERVER_NAME"
    echo "狀態:         $SERVER_STATE"
    echo "版本:         $SERVER_VERSION"
    echo "SKU:          $SERVER_SKU"
    echo "儲存空間:     $SERVER_STORAGE GB"
    echo "FQDN:         $SERVER_FQDN"

    echo ""
    read -p "繼續使用現有伺服器? (yes/no): " CONFIRM_EXISTING

    if [[ "$CONFIRM_EXISTING" != "yes" ]]; then
        log_info "操作已取消"
        exit 0
    fi

    # 跳到防火牆規則配置
    SKIP_SERVER_CREATION=true
else
    SKIP_SERVER_CREATION=false
fi

# ------------------------------------------------------------------------------
# 生成管理員密碼
# ------------------------------------------------------------------------------
if [ "$SKIP_SERVER_CREATION" = false ]; then
    log_section "🔑 生成管理員密碼"

    ADMIN_PASSWORD=$(generate_password)
    log_success "管理員密碼已生成"
    log_warning "請將以下資訊安全保存到 Azure Key Vault:"

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "伺服器名稱:   $SERVER_NAME.postgres.database.azure.com"
    echo "資料庫名稱:   $DATABASE_NAME"
    echo "管理員帳號:   $ADMIN_USERNAME"
    echo "管理員密碼:   $ADMIN_PASSWORD"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # 保存到本地文件（僅供臨時使用，稍後需刪除）
    mkdir -p .azure/output
    cat > ".azure/output/${ENVIRONMENT}-database-credentials.txt" <<EOF
# PostgreSQL 資料庫憑證 - $ENVIRONMENT 環境
# ⚠️ 警告: 此文件包含敏感資訊，請勿提交到版本控制
# ⚠️ 請盡快將這些憑證添加到 Azure Key Vault 並刪除此文件

伺服器 FQDN:    ${SERVER_NAME}.postgres.database.azure.com
資料庫名稱:      $DATABASE_NAME
管理員帳號:      $ADMIN_USERNAME
管理員密碼:      $ADMIN_PASSWORD
PostgreSQL 版本: $POSTGRES_VERSION

# 連接字符串（用於 DATABASE_URL）
postgresql://${ADMIN_USERNAME}:${ADMIN_PASSWORD}@${SERVER_NAME}.postgres.database.azure.com:5432/${DATABASE_NAME}?sslmode=require

# Azure Key Vault 儲存建議:
# Key Vault Secret 名稱: ITPM-${ENVIRONMENT^^}-DATABASE-URL
# Secret 值: postgresql://${ADMIN_USERNAME}:${ADMIN_PASSWORD}@${SERVER_NAME}.postgres.database.azure.com:5432/${DATABASE_NAME}?sslmode=require
EOF

    log_success "憑證已保存到: .azure/output/${ENVIRONMENT}-database-credentials.txt"
    log_warning "記得在完成後刪除此文件！"

    echo ""
    read -p "確認已記錄憑證並繼續? (yes/no): " CONFIRM_PASSWORD

    if [[ "$CONFIRM_PASSWORD" != "yes" ]]; then
        log_info "操作已取消"
        exit 0
    fi

    # ------------------------------------------------------------------------------
    # 創建 PostgreSQL Flexible Server
    # ------------------------------------------------------------------------------
    log_section "🚀 創建 PostgreSQL Flexible Server"

    log_info "正在創建伺服器（這可能需要 5-10 分鐘）..."

    az postgres flexible-server create \
        --name "$SERVER_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --admin-user "$ADMIN_USERNAME" \
        --admin-password "$ADMIN_PASSWORD" \
        --sku-name "$SKU_NAME" \
        --tier "GeneralPurpose" \
        --version "$POSTGRES_VERSION" \
        --storage-size "$STORAGE_SIZE_GB" \
        --backup-retention "$BACKUP_RETENTION_DAYS" \
        --geo-redundant-backup "$GEO_REDUNDANT_BACKUP" \
        --high-availability "$HIGH_AVAILABILITY" \
        --public-access "0.0.0.0-255.255.255.255" \
        --tags $TAGS \
        --yes

    if [ $? -eq 0 ]; then
        log_success "PostgreSQL 伺服器創建成功"
    else
        log_error "PostgreSQL 伺服器創建失敗"
        exit 1
    fi

    # ------------------------------------------------------------------------------
    # 創建資料庫
    # ------------------------------------------------------------------------------
    log_section "💾 創建資料庫"

    log_info "創建資料庫: $DATABASE_NAME"

    az postgres flexible-server db create \
        --server-name "$SERVER_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --database-name "$DATABASE_NAME" \
        --charset "UTF8" \
        --collation "en_US.utf8"

    if [ $? -eq 0 ]; then
        log_success "資料庫創建成功"
    else
        log_error "資料庫創建失敗"
        exit 1
    fi
fi

# ------------------------------------------------------------------------------
# 配置防火牆規則
# ------------------------------------------------------------------------------
log_section "🔥 配置防火牆規則"

# 規則 1: 允許 Azure 服務存取
log_info "添加防火牆規則: AllowAllAzureServicesAndResourcesWithinAzureIps"

az postgres flexible-server firewall-rule create \
    --name "AllowAllAzureServicesAndResourcesWithinAzureIps" \
    --server-name "$SERVER_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --start-ip-address "0.0.0.0" \
    --end-ip-address "0.0.0.0" \
    2>/dev/null || log_info "規則已存在"

log_success "Azure 服務存取已啟用"

# 規則 2: 允許公司辦公室 IP（僅開發環境）
if [ "$ENVIRONMENT" == "dev" ]; then
    log_info "添加防火牆規則: AllowOfficeIP（開發環境）"

    # 注意: 這裡使用示例 IP，實際使用時需替換為公司真實 IP
    OFFICE_IP="203.0.113.0"  # 示例 IP，請替換

    az postgres flexible-server firewall-rule create \
        --name "AllowOfficeIP" \
        --server-name "$SERVER_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --start-ip-address "$OFFICE_IP" \
        --end-ip-address "$OFFICE_IP" \
        2>/dev/null || log_info "規則已存在"

    log_success "辦公室 IP 存取已啟用"
fi

# ------------------------------------------------------------------------------
# 配置資料庫參數
# ------------------------------------------------------------------------------
log_section "⚙️  配置資料庫參數"

# 設置連接數限制（根據環境）
case $ENVIRONMENT in
    dev)
        MAX_CONNECTIONS=100
        ;;
    staging)
        MAX_CONNECTIONS=200
        ;;
    prod)
        MAX_CONNECTIONS=400
        ;;
esac

log_info "設置最大連接數: $MAX_CONNECTIONS"

az postgres flexible-server parameter set \
    --name "max_connections" \
    --server-name "$SERVER_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --value "$MAX_CONNECTIONS" \
    --output none

# 設置 timezone
log_info "設置時區: Asia/Taipei"

az postgres flexible-server parameter set \
    --name "timezone" \
    --server-name "$SERVER_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --value "Asia/Taipei" \
    --output none

# 設置 log_min_duration_statement（記錄慢查詢）
case $ENVIRONMENT in
    dev)
        LOG_MIN_DURATION=1000  # 1 秒
        ;;
    staging)
        LOG_MIN_DURATION=500   # 0.5 秒
        ;;
    prod)
        LOG_MIN_DURATION=100   # 0.1 秒
        ;;
esac

log_info "設置慢查詢日誌閾值: ${LOG_MIN_DURATION}ms"

az postgres flexible-server parameter set \
    --name "log_min_duration_statement" \
    --server-name "$SERVER_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --value "$LOG_MIN_DURATION" \
    --output none

log_success "資料庫參數配置完成"

# ------------------------------------------------------------------------------
# 顯示伺服器資訊
# ------------------------------------------------------------------------------
log_section "📊 PostgreSQL 伺服器資訊"

# 使用 Azure CLI 原生查詢，避免依賴 jq
FINAL_NAME=$(az postgres flexible-server show --name "$SERVER_NAME" --resource-group "$RESOURCE_GROUP" --query "name" -o tsv)
FINAL_FQDN=$(az postgres flexible-server show --name "$SERVER_NAME" --resource-group "$RESOURCE_GROUP" --query "fullyQualifiedDomainName" -o tsv)
FINAL_STATE=$(az postgres flexible-server show --name "$SERVER_NAME" --resource-group "$RESOURCE_GROUP" --query "state" -o tsv)
FINAL_VERSION=$(az postgres flexible-server show --name "$SERVER_NAME" --resource-group "$RESOURCE_GROUP" --query "version" -o tsv)
FINAL_SKU=$(az postgres flexible-server show --name "$SERVER_NAME" --resource-group "$RESOURCE_GROUP" --query "sku.name" -o tsv)
FINAL_TIER=$(az postgres flexible-server show --name "$SERVER_NAME" --resource-group "$RESOURCE_GROUP" --query "sku.tier" -o tsv)
FINAL_STORAGE=$(az postgres flexible-server show --name "$SERVER_NAME" --resource-group "$RESOURCE_GROUP" --query "storage.storageSizeGb" -o tsv)
FINAL_BACKUP=$(az postgres flexible-server show --name "$SERVER_NAME" --resource-group "$RESOURCE_GROUP" --query "backup.backupRetentionDays" -o tsv)
FINAL_HA=$(az postgres flexible-server show --name "$SERVER_NAME" --resource-group "$RESOURCE_GROUP" --query "highAvailability.mode" -o tsv)
FINAL_LOCATION=$(az postgres flexible-server show --name "$SERVER_NAME" --resource-group "$RESOURCE_GROUP" --query "location" -o tsv)

echo "伺服器名稱:       $FINAL_NAME"
echo "完整域名:         $FINAL_FQDN"
echo "狀態:             $FINAL_STATE"
echo "PostgreSQL 版本:  $FINAL_VERSION"
echo "SKU:              $FINAL_SKU ($FINAL_TIER)"
echo "儲存空間:         $FINAL_STORAGE GB"
echo "備份保留:         $FINAL_BACKUP 天"
echo "高可用性:         $FINAL_HA"
echo "位置:             $FINAL_LOCATION"

# ------------------------------------------------------------------------------
# 完成總結
# ------------------------------------------------------------------------------
log_section "✅ PostgreSQL Database 設置完成"

echo ""
log_success "環境: $ENVIRONMENT"
log_success "伺服器: $SERVER_NAME.postgres.database.azure.com"
log_success "資料庫: $DATABASE_NAME"

echo ""
log_info "已配置的資源:"
echo "  ✅ PostgreSQL Flexible Server"
echo "  ✅ 資料庫: $DATABASE_NAME"
echo "  ✅ 防火牆規則: Azure 服務存取"
if [ "$ENVIRONMENT" == "dev" ]; then
    echo "  ✅ 防火牆規則: 辦公室 IP 存取"
fi
echo "  ✅ 資料庫參數: 最大連接數、時區、慢查詢日誌"

if [ "$SKIP_SERVER_CREATION" = false ]; then
    echo ""
    log_warning "重要提醒:"
    echo "  1. 憑證已保存到: .azure/output/${ENVIRONMENT}-database-credentials.txt"
    echo "  2. 請立即將憑證添加到 Azure Key Vault"
    echo "  3. Key Vault Secret 名稱: ITPM-${ENVIRONMENT^^}-DATABASE-URL"
    echo "  4. 完成後刪除憑證文件: rm .azure/output/${ENVIRONMENT}-database-credentials.txt"
fi

echo ""
log_info "下一步:"
echo "  1. 將資料庫憑證添加到 Key Vault"
echo "  2. 執行 Prisma 遷移和種子資料:"
echo "     方法 A（本地執行）:"
echo "       export DATABASE_URL='postgresql://...'"
echo "       cd packages/db && npx prisma migrate deploy && pnpm db:seed:minimal"
echo "     方法 B（Docker 執行）:"
echo "       docker build -f Dockerfile.migrate -t itpm-migrate ."
echo "       docker run --env DATABASE_URL='...' itpm-migrate"
echo "  3. 執行: ./03-setup-storage.sh $ENVIRONMENT"

echo ""
log_success "PostgreSQL Database 設置腳本執行完成！"
