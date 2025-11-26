#!/bin/bash
# ==============================================================================
# Azure 資料庫 Migration + Seed 腳本
# ==============================================================================
# 用途: 對 Azure PostgreSQL 執行 Prisma 遷移和種子資料
# 使用: ./azure/scripts/run-migration.sh <environment>
# 範例: ./azure/scripts/run-migration.sh dev
# ==============================================================================

set -e

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
    echo "可用環境: dev, staging, prod"
    exit 1
fi

ENVIRONMENT=$1

if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    log_error "無效的環境參數: $ENVIRONMENT"
    exit 1
fi

log_section "🗄️  Azure 資料庫 Migration + Seed - $ENVIRONMENT 環境"

# 取得腳本目錄
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# 環境配置（公司環境）
case $ENVIRONMENT in
    dev)
        RESOURCE_GROUP="RG-RCITest-RAPO-N8N"
        SERVER_NAME="psql-itpm-company-dev-001"
        DATABASE_NAME="itpm_dev"
        ADMIN_USERNAME="itpmadmin"
        ;;
    staging)
        RESOURCE_GROUP="rg-itpm-staging"
        SERVER_NAME="psql-itpm-staging-001"
        DATABASE_NAME="itpm_staging"
        ADMIN_USERNAME="itpmadmin"
        ;;
    prod)
        RESOURCE_GROUP="rg-itpm-prod"
        SERVER_NAME="psql-itpm-prod-001"
        DATABASE_NAME="itpm_prod"
        ADMIN_USERNAME="itpmadmin"
        ;;
esac

log_info "環境: $ENVIRONMENT"
log_info "伺服器: $SERVER_NAME"
log_info "資料庫: $DATABASE_NAME"

# 檢查 Azure CLI 登入
log_section "🔐 驗證 Azure CLI 登入"

if ! az account show &> /dev/null; then
    log_error "未登入 Azure CLI，請先執行: az login"
    exit 1
fi

log_success "Azure CLI 已登入"

# 取得資料庫密碼
log_section "🔑 取得資料庫連線資訊"

echo ""
log_warning "需要輸入資料庫管理員密碼"
log_info "密碼可在 Azure Portal 或 Key Vault 中找到"
echo ""
read -s -p "請輸入 $ADMIN_USERNAME 的密碼: " DB_PASSWORD
echo ""

if [ -z "$DB_PASSWORD" ]; then
    log_error "密碼不能為空"
    exit 1
fi

# 建構 DATABASE_URL
DATABASE_URL="postgresql://${ADMIN_USERNAME}:${DB_PASSWORD}@${SERVER_NAME}.postgres.database.azure.com:5432/${DATABASE_NAME}?sslmode=require"

log_success "連線字串已建構"

# 選擇執行方式
log_section "🚀 選擇執行方式"

echo ""
echo "請選擇執行方式："
echo "  1. 本地執行（需要 Node.js 和 pnpm）"
echo "  2. Docker 執行（需要 Docker）"
echo ""
read -p "請選擇 (1/2): " EXEC_METHOD

case $EXEC_METHOD in
    1)
        # 本地執行
        log_section "📦 本地執行 Migration + Seed"

        cd "$PROJECT_ROOT"

        # 設定環境變數
        export DATABASE_URL="$DATABASE_URL"

        # Step 1: Migration
        log_info "執行 Prisma migrate deploy..."
        cd packages/db
        npx prisma migrate deploy

        if [ $? -eq 0 ]; then
            log_success "Migration 完成"
        else
            log_error "Migration 失敗"
            exit 1
        fi

        # Step 2: Seed
        log_info "執行 seed-minimal.ts..."
        pnpm db:seed:minimal

        if [ $? -eq 0 ]; then
            log_success "Seed 完成"
        else
            log_error "Seed 失敗"
            exit 1
        fi
        ;;
    2)
        # Docker 執行
        log_section "🐳 Docker 執行 Migration + Seed"

        cd "$PROJECT_ROOT"

        # 檢查 Docker
        if ! docker info &> /dev/null; then
            log_error "Docker 未運行"
            exit 1
        fi

        # 建構 migration image
        log_info "建構 migration Docker image..."
        docker build -f Dockerfile.migrate -t itpm-migrate .

        if [ $? -ne 0 ]; then
            log_error "Docker image 建構失敗"
            exit 1
        fi

        # 執行 migration + seed
        log_info "執行 migration + seed..."
        docker run --rm \
            -e DATABASE_URL="$DATABASE_URL" \
            itpm-migrate

        if [ $? -eq 0 ]; then
            log_success "Migration + Seed 完成"
        else
            log_error "Migration + Seed 失敗"
            exit 1
        fi
        ;;
    *)
        log_error "無效的選擇"
        exit 1
        ;;
esac

# 完成
log_section "✅ 資料庫 Migration + Seed 完成"

echo ""
log_success "環境: $ENVIRONMENT"
log_success "伺服器: $SERVER_NAME"
log_success "資料庫: $DATABASE_NAME"
echo ""
log_info "已完成的操作："
echo "  ✅ Prisma migrate deploy（表結構更新）"
echo "  ✅ Seed minimal（基礎資料：Role, Currency）"
echo ""
log_info "下一步："
echo "  1. 驗證應用程式是否正常運作"
echo "  2. 測試用戶註冊功能"
echo ""
