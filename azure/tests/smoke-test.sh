#!/bin/bash
# ==============================================================================
# Smoke Test - Post-Deployment Validation
# ==============================================================================
# 用途: 部署後快速驗證應用關鍵功能
# 使用: ./smoke-test.sh <environment>
# ==============================================================================

set -e
set -u

GREEN='\033[0;32m'; RED='\033[0;31m'; BLUE='\033[0;34m'; NC='\033[0m'
log_info() { echo -e "${BLUE}ℹ️  ${NC}$1"; }
log_success() { echo -e "${GREEN}✅ ${NC}$1"; }
log_error() { echo -e "${RED}❌ ${NC}$1"; }

if [ $# -eq 0 ]; then
    echo "使用方式: $0 <environment>"
    exit 1
fi

ENVIRONMENT=$1
APP_URL="https://app-itpm-${ENVIRONMENT}-001.azurewebsites.net"

log_info "執行煙霧測試: $ENVIRONMENT"
echo "App URL: $APP_URL"
echo ""

FAILED_TESTS=0
TOTAL_TESTS=5

# Test 1: Homepage Accessibility
log_info "Test 1/5: 首頁可訪問性"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL" || echo "000")

if [ "$HTTP_STATUS" == "200" ] || [ "$HTTP_STATUS" == "302" ]; then
    log_success "首頁可訪問 (HTTP $HTTP_STATUS)"
else
    log_error "首頁不可訪問 (HTTP $HTTP_STATUS)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test 2: API Health Endpoint
log_info "Test 2/5: API 健康檢查端點"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/health" || echo "000")

if [ "$API_STATUS" == "200" ] || [ "$API_STATUS" == "404" ]; then
    log_success "API 端點響應 (HTTP $API_STATUS)"
else
    log_error "API 端點異常 (HTTP $API_STATUS)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test 3: Login Page
log_info "Test 3/5: 登入頁面"
LOGIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/login" || echo "000")

if [ "$LOGIN_STATUS" == "200" ]; then
    log_success "登入頁面可訪問 (HTTP $LOGIN_STATUS)"
else
    log_error "登入頁面異常 (HTTP $LOGIN_STATUS)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test 4: Static Assets
log_info "Test 4/5: 靜態資源載入"
STATIC_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/_next/static/" || echo "000")

if [ "$STATIC_STATUS" == "200" ] || [ "$STATIC_STATUS" == "404" ]; then
    log_success "靜態資源路徑可訪問"
else
    log_error "靜態資源路徑異常 (HTTP $STATIC_STATUS)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test 5: Response Time
log_info "Test 5/5: 響應時間測試"
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$APP_URL" || echo "0")
RESPONSE_MS=$(echo "$RESPONSE_TIME * 1000" | bc)

if (( $(echo "$RESPONSE_TIME < 5.0" | bc -l) )); then
    log_success "響應時間: ${RESPONSE_MS} ms"
else
    log_error "響應時間過慢: ${RESPONSE_MS} ms (> 5000ms)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Summary
echo ""
echo "========================================="
echo "煙霧測試結果"
echo "========================================="
echo "通過測試: $((TOTAL_TESTS - FAILED_TESTS))/$TOTAL_TESTS"
echo "失敗測試: $FAILED_TESTS/$TOTAL_TESTS"
echo "========================================="

if [ $FAILED_TESTS -eq 0 ]; then
    log_success "所有煙霧測試通過！"
    exit 0
else
    log_error "部分測試失敗，請檢查應用狀態"
    exit 1
fi
