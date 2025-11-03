#!/bin/bash

# ============================================
# i18n 自動化批次遷移腳本
# ============================================
# 功能：自動遷移所有剩餘檔案到 next-intl
# 作者：AI Assistant
# 日期：2025-11-03
# ============================================

set -e

# 設定顏色輸出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}開始 i18n 批次遷移${NC}"
echo -e "${GREEN}========================================${NC}"

# 基礎目錄
WEB_DIR="apps/web/src"
APP_DIR="$WEB_DIR/app/[locale]"
COMP_DIR="$WEB_DIR/components"

# 統計變數
TOTAL_FILES=0
MIGRATED_FILES=0
SKIPPED_FILES=0
ERROR_FILES=0

# ============================================
# 函數：檢查檔案是否已遷移
# ============================================
is_migrated() {
    local file="$1"
    if grep -q "useTranslations" "$file" 2>/dev/null; then
        return 0  # 已遷移
    else
        return 1  # 未遷移
    fi
}

# ============================================
# 函數：遷移單一檔案
# ============================================
migrate_file() {
    local file="$1"
    local module="$2"

    TOTAL_FILES=$((TOTAL_FILES + 1))

    # 檢查是否已遷移
    if is_migrated "$file"; then
        echo -e "${YELLOW}⏭  跳過（已遷移）: $file${NC}"
        SKIPPED_FILES=$((SKIPPED_FILES + 1))
        return 0
    fi

    echo -e "${GREEN}🔄 遷移: $file${NC}"

    # 備份原檔案
    cp "$file" "$file.bak"

    # 添加 useTranslations import（如果不存在）
    if ! grep -q "import { useTranslations } from 'next-intl'" "$file"; then
        # 在最後一個 import 之後添加
        sed -i "/^import.*from/a import { useTranslations } from 'next-intl';" "$file"
    fi

    # 在組件內部添加 t hook（如果不存在）
    if ! grep -q "const t = useTranslations" "$file"; then
        # 找到 export default function 並在其後添加 t hook
        if grep -q "export default function" "$file"; then
            sed -i "/export default function.*{/a \ \ const t = useTranslations('$module');" "$file"
        elif grep -q "export function" "$file"; then
            sed -i "/export function.*{/a \ \ const t = useTranslations('$module');" "$file"
        fi
    fi

    # 基本文字替換（示例，實際需要更複雜的邏輯）
    # 這裡我們只做標記，實際替換需要更精細的處理

    MIGRATED_FILES=$((MIGRATED_FILES + 1))

    # 刪除備份
    rm -f "$file.bak"
}

# ============================================
# 主遷移流程
# ============================================

echo -e "\n${GREEN}階段 1: 遷移 Projects Module${NC}"
echo "================================"

# Projects 頁面
if [ -f "$APP_DIR/projects/[id]/page.tsx" ]; then
    migrate_file "$APP_DIR/projects/[id]/page.tsx" "projects"
fi

if [ -f "$APP_DIR/projects/[id]/quotes/page.tsx" ]; then
    migrate_file "$APP_DIR/projects/[id]/quotes/page.tsx" "projects"
fi

# Projects 組件
if [ -f "$COMP_DIR/project/ProjectForm.tsx" ]; then
    migrate_file "$COMP_DIR/project/ProjectForm.tsx" "projects"
fi

echo -e "\n${GREEN}階段 2: 遷移 Proposals Module${NC}"
echo "================================"

# Proposals 頁面
for file in "$APP_DIR/proposals/page.tsx" \
            "$APP_DIR/proposals/new/page.tsx" \
            "$APP_DIR/proposals/[id]/page.tsx" \
            "$APP_DIR/proposals/[id]/edit/page.tsx"; do
    if [ -f "$file" ]; then
        migrate_file "$file" "proposals"
    fi
done

# Proposals 組件
for file in "$COMP_DIR/proposal/BudgetProposalForm.tsx" \
            "$COMP_DIR/proposal/ProposalActions.tsx"; do
    if [ -f "$file" ]; then
        migrate_file "$file" "proposals"
    fi
done

echo -e "\n${GREEN}階段 3: 遷移 BudgetPools Module${NC}"
echo "================================"

# BudgetPools 頁面
for file in "$APP_DIR/budget-pools/page.tsx" \
            "$APP_DIR/budget-pools/new/page.tsx" \
            "$APP_DIR/budget-pools/[id]/page.tsx" \
            "$APP_DIR/budget-pools/[id]/edit/page.tsx"; do
    if [ -f "$file" ]; then
        migrate_file "$file" "budgetPools"
    fi
done

# BudgetPools 組件
if [ -f "$COMP_DIR/budget-pool/BudgetPoolForm.tsx" ]; then
    migrate_file "$COMP_DIR/budget-pool/BudgetPoolForm.tsx" "budgetPools"
fi

echo -e "\n${GREEN}階段 4-12: 遷移其他所有模組${NC}"
echo "================================"

# 定義所有需要遷移的模組
declare -A MODULES=(
    ["vendors"]="vendors"
    ["quotes"]="quotes"
    ["purchase-orders"]="purchaseOrders"
    ["expenses"]="expenses"
    ["om-expenses"]="omExpenses"
    ["charge-outs"]="chargeOuts"
    ["users"]="users"
    ["notifications"]="notifications"
    ["settings"]="settings"
)

# 批次遷移所有模組的頁面
for dir_name in "${!MODULES[@]}"; do
    module_name="${MODULES[$dir_name]}"
    echo -e "\n${YELLOW}處理模組: $module_name${NC}"

    # 遷移該模組下的所有 page.tsx
    find "$APP_DIR/$dir_name" -name "page.tsx" -type f 2>/dev/null | while read -r file; do
        migrate_file "$file" "$module_name"
    done

    # 遷移該模組對應的組件
    component_dir=$(echo "$dir_name" | sed 's/-//')
    if [ -d "$COMP_DIR/$component_dir" ]; then
        find "$COMP_DIR/$component_dir" -name "*.tsx" -type f 2>/dev/null | while read -r file; do
            migrate_file "$file" "$module_name"
        done
    fi
done

# ============================================
# 遷移總結
# ============================================
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}遷移完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "總檔案數: $TOTAL_FILES"
echo -e "${GREEN}成功遷移: $MIGRATED_FILES${NC}"
echo -e "${YELLOW}已跳過: $SKIPPED_FILES${NC}"
echo -e "${RED}錯誤: $ERROR_FILES${NC}"
echo -e "${GREEN}========================================${NC}"

# 提示下一步
echo -e "\n${YELLOW}⚠️  注意：此腳本只完成了基礎架構遷移${NC}"
echo -e "${YELLOW}   需要手動完成：${NC}"
echo -e "${YELLOW}   1. 替換所有硬編碼中文文字為 t('key')${NC}"
echo -e "${YELLOW}   2. 添加對應的翻譯鍵到 messages/zh-TW.ts 和 messages/en.ts${NC}"
echo -e "${YELLOW}   3. 測試所有頁面的語言切換功能${NC}"
echo -e "${YELLOW}   4. 驗證所有動態內容的變數插值${NC}"

exit 0
