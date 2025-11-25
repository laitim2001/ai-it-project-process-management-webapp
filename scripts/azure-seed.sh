#!/bin/bash
# ============================================================================
# Azure Deployment Database Seed Script
# ============================================================================
# 用途: 在 Azure 部署後自動執行 minimal seed data 初始化
# 執行時機:
#   1. CI/CD pipeline 中的 migration 步驟之後
#   2. 手動部署後的初始化
#   3. 新環境建立時
#
# 使用方式:
#   ./scripts/azure-seed.sh
#
# 環境變數要求:
#   - DATABASE_URL: Azure PostgreSQL 連接字串
#
# 注意事項:
#   - 此 script 會執行 seed-minimal.ts (只包含基礎 Role 和 Currency 資料)
#   - 使用 upsert 模式,可以安全重複執行
#   - 適用於生產環境和 UAT 環境
# ============================================================================

set -e  # 遇到錯誤立即退出
set -u  # 使用未定義變數時報錯

# ============================================================================
# 顏色輸出設定
# ============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# 日誌函數
# ============================================================================
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ============================================================================
# 檢查環境變數
# ============================================================================
check_environment() {
    log_info "檢查環境變數..."

    if [ -z "${DATABASE_URL:-}" ]; then
        log_error "DATABASE_URL 環境變數未設定"
        log_info "請確保已設定 Azure PostgreSQL 連接字串"
        exit 1
    fi

    log_success "環境變數檢查通過"
}

# ============================================================================
# 檢查數據庫連接
# ============================================================================
check_database_connection() {
    log_info "測試數據庫連接..."

    # 使用 Prisma 測試連接
    if cd packages/db && npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
        log_success "數據庫連接成功"
        cd ../..
        return 0
    else
        log_error "無法連接到數據庫"
        log_info "DATABASE_URL: ${DATABASE_URL}"
        cd ../..
        exit 1
    fi
}

# ============================================================================
# 執行 Seed
# ============================================================================
run_seed() {
    log_info "開始執行 minimal seed (基礎資料初始化)..."
    echo ""

    # 切換到 db package 目錄
    cd packages/db

    # 執行 seed-minimal.ts
    if pnpm db:seed:minimal; then
        log_success "Seed 執行成功"
        cd ../..
        return 0
    else
        log_error "Seed 執行失敗"
        cd ../..
        exit 1
    fi
}

# ============================================================================
# 驗證 Seed 結果
# ============================================================================
verify_seed() {
    log_info "驗證 seed 資料..."

    cd packages/db

    # 檢查 Role 表
    local role_count=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"Role\";" 2>/dev/null | grep -oP '\d+' | head -1 || echo "0")

    if [ "$role_count" -ge 3 ]; then
        log_success "Role 資料驗證通過 ($role_count 筆記錄)"
    else
        log_warning "Role 資料可能不完整 ($role_count 筆記錄,預期至少 3 筆)"
    fi

    # 檢查 Currency 表 (如果存在)
    local currency_count=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"Currency\";" 2>/dev/null | grep -oP '\d+' | head -1 || echo "0")

    if [ "$currency_count" -ge 6 ]; then
        log_success "Currency 資料驗證通過 ($currency_count 筆記錄)"
    else
        log_info "Currency 資料: $currency_count 筆記錄"
    fi

    cd ../..
}

# ============================================================================
# 主執行流程
# ============================================================================
main() {
    echo ""
    echo "========================================"
    echo "🌱 Azure Deployment Seed Script"
    echo "========================================"
    echo ""

    check_environment
    echo ""

    check_database_connection
    echo ""

    run_seed
    echo ""

    verify_seed
    echo ""

    echo "========================================"
    log_success "Azure deployment seed 完成!"
    echo "========================================"
    echo ""
}

# 執行主流程
main "$@"
