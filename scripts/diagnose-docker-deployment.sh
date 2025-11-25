#!/bin/bash

# ============================================================================
# Docker 部署流程完整診斷腳本
# ============================================================================
# 用途: 系統性檢查 Docker 建置和部署流程中的所有關鍵點
# 日期: 2025-11-22
# ============================================================================

set -e  # 遇到錯誤立即退出

echo "============================================================================"
echo "🔍 Docker 部署流程完整診斷"
echo "============================================================================"
echo ""

# ----------------------------------------------------------------------------
# Step 1: 檢查本地環境
# ----------------------------------------------------------------------------
echo "📋 Step 1: 檢查本地環境"
echo "----------------------------------------------------------------------------"

# 1.1 Prisma 版本
echo "🔍 檢查 Prisma 版本:"
PRISMA_VERSION=$(grep -A 1 "@prisma/client" packages/db/package.json | grep -o '"[0-9^.]*"' | tr -d '"')
echo "   package.json 定義: $PRISMA_VERSION"

INSTALLED_VERSION=$(find node_modules/.pnpm -name "@prisma+client*" -type d 2>/dev/null | head -1 | grep -o '@prisma+client@[^/]*' | cut -d'@' -f3)
echo "   實際安裝版本: $INSTALLED_VERSION"

if [ "$PRISMA_VERSION" != "$INSTALLED_VERSION" ] && [ ! -z "$INSTALLED_VERSION" ]; then
    echo "   ⚠️  警告: 版本不一致!"
fi
echo ""

# 1.2 pnpm 虛擬存儲路徑
echo "🔍 檢查 pnpm 虛擬存儲路徑:"
PRISMA_PATH=$(find node_modules/.pnpm -name "@prisma+client*" -type d 2>/dev/null | head -1)
if [ ! -z "$PRISMA_PATH" ]; then
    echo "   ✅ 找到路徑: $PRISMA_PATH"
    echo "   📁 檢查關鍵文件:"
    if [ -d "$PRISMA_PATH/node_modules/@prisma/client" ]; then
        echo "      ✅ @prisma/client 目錄存在"
    else
        echo "      ❌ @prisma/client 目錄不存在"
    fi
    if [ -d "$PRISMA_PATH/node_modules/.prisma" ]; then
        echo "      ✅ .prisma 目錄存在"
    else
        echo "      ❌ .prisma 目錄不存在"
    fi
else
    echo "   ❌ 未找到 Prisma Client 路徑"
fi
echo ""

# 1.3 檢查 Prisma 是否已生成
echo "🔍 檢查 Prisma Client 生成狀態:"
if [ -d "node_modules/.prisma/client" ]; then
    echo "   ✅ Prisma Client 已生成"
    echo "   📂 生成的文件:"
    ls -la node_modules/.prisma/client | head -5
else
    echo "   ❌ Prisma Client 未生成"
fi
echo ""

# ----------------------------------------------------------------------------
# Step 2: 檢查 Dockerfile 配置
# ----------------------------------------------------------------------------
echo "📋 Step 2: 檢查 Dockerfile 配置"
echo "----------------------------------------------------------------------------"

echo "🔍 檢查 Dockerfile 中的 Prisma 相關配置:"
echo ""

# 2.1 Prisma generate 命令
echo "   📌 Builder Stage - Prisma Generate:"
grep -n "prisma generate" docker/Dockerfile || echo "      ❌ 未找到 prisma generate"
echo ""

# 2.2 Prisma Client 複製邏輯
echo "   📌 Runner Stage - Prisma Client COPY:"
grep -n -A 1 "@prisma+client" docker/Dockerfile || echo "      ❌ 未找到 @prisma+client COPY"
echo ""

# 2.3 檢查硬編碼版本
echo "   📌 檢查是否使用硬編碼版本:"
DOCKERFILE_VERSION=$(grep "@prisma+client@" docker/Dockerfile | grep -o '@[0-9.]*' | head -1 | tr -d '@')
if [ ! -z "$DOCKERFILE_VERSION" ]; then
    echo "      Dockerfile 硬編碼版本: $DOCKERFILE_VERSION"
    if [ "$DOCKERFILE_VERSION" != "$INSTALLED_VERSION" ]; then
        echo "      ⚠️  警告: Dockerfile 版本與實際安裝版本不一致!"
    else
        echo "      ✅ 版本一致"
    fi
else
    echo "      ℹ️  未使用硬編碼版本(可能使用動態查找)"
fi
echo ""

# ----------------------------------------------------------------------------
# Step 3: 建置測試 Docker 映像
# ----------------------------------------------------------------------------
echo "📋 Step 3: 建置測試 Docker 映像"
echo "----------------------------------------------------------------------------"

echo "🔨 建置測試映像 (僅 builder stage)..."
docker build --target=builder -t itpm-web-test:builder -f docker/Dockerfile . 2>&1 | tail -20
echo ""

echo "🔍 檢查 builder stage 中的 Prisma Client:"
docker run --rm itpm-web-test:builder sh -c "find /app/node_modules/.pnpm -name '@prisma+client*' -type d 2>/dev/null | head -3" || echo "❌ 無法檢查 builder stage"
echo ""

echo "🔍 檢查 builder stage 中的 .prisma 目錄:"
docker run --rm itpm-web-test:builder sh -c "ls -la /app/node_modules/.prisma/client 2>/dev/null | head -5" || echo "❌ .prisma 目錄不存在"
echo ""

# ----------------------------------------------------------------------------
# Step 4: 檢查完整映像
# ----------------------------------------------------------------------------
echo "📋 Step 4: 檢查完整映像 (runner stage)"
echo "----------------------------------------------------------------------------"

echo "🔨 建置完整測試映像..."
docker build -t itpm-web-test:latest -f docker/Dockerfile . 2>&1 | tail -20
echo ""

echo "🔍 檢查 runtime 環境中的 Prisma Client:"
docker run --rm itpm-web-test:latest sh -c "ls -la /app/node_modules/@prisma 2>/dev/null" || echo "❌ @prisma 目錄不存在"
echo ""

echo "🔍 檢查 runtime 環境中的 .prisma 目錄:"
docker run --rm itpm-web-test:latest sh -c "ls -la /app/node_modules/.prisma 2>/dev/null" || echo "❌ .prisma 目錄不存在"
echo ""

echo "🔍 測試 require('@prisma/client'):"
docker run --rm itpm-web-test:latest sh -c "node -e \"try { require('@prisma/client'); console.log('✅ @prisma/client 可以成功載入'); } catch(e) { console.log('❌ 錯誤:', e.message); }\"" || echo "❌ 無法執行測試"
echo ""

# ----------------------------------------------------------------------------
# Step 5: 對比本地環境和 Docker 環境
# ----------------------------------------------------------------------------
echo "📋 Step 5: 環境對比"
echo "----------------------------------------------------------------------------"

echo "📊 本地環境 vs Docker 環境:"
echo ""

echo "   本地環境:"
echo "   - Node.js: $(node -v 2>/dev/null || echo '未安裝')"
echo "   - pnpm: $(pnpm -v 2>/dev/null || echo '未安裝')"
echo "   - Prisma: $INSTALLED_VERSION"
echo ""

echo "   Docker 環境:"
docker run --rm itpm-web-test:latest sh -c "echo '   - Node.js:' \$(node -v); echo '   - pnpm:' \$(pnpm -v 2>/dev/null || echo '未安裝'); echo '   - 工作目錄:' \$(pwd); echo '   - 用戶:' \$(whoami)" || echo "❌ 無法檢查 Docker 環境"
echo ""

# ----------------------------------------------------------------------------
# Step 6: Next.js Standalone 輸出檢查
# ----------------------------------------------------------------------------
echo "📋 Step 6: Next.js Standalone 輸出檢查"
echo "----------------------------------------------------------------------------"

echo "🔍 檢查本地 Next.js standalone 輸出:"
if [ -d "apps/web/.next/standalone" ]; then
    echo "   ✅ Standalone 目錄存在"
    echo "   📂 檢查是否包含 Prisma:"
    if [ -d "apps/web/.next/standalone/node_modules/@prisma/client" ]; then
        echo "      ✅ Standalone 包含 @prisma/client"
    else
        echo "      ❌ Standalone 不包含 @prisma/client (這是正常的,需要手動複製)"
    fi
else
    echo "   ℹ️  Standalone 目錄不存在(需要先執行 pnpm build)"
fi
echo ""

# ----------------------------------------------------------------------------
# Step 7: 問題總結和建議
# ----------------------------------------------------------------------------
echo "============================================================================"
echo "📊 診斷總結"
echo "============================================================================"
echo ""

# 檢查是否發現問題
ISSUES_FOUND=0

if [ "$PRISMA_VERSION" != "$INSTALLED_VERSION" ] && [ ! -z "$INSTALLED_VERSION" ]; then
    echo "⚠️  問題 1: Prisma 版本不一致"
    echo "   - package.json: $PRISMA_VERSION"
    echo "   - 實際安裝: $INSTALLED_VERSION"
    echo "   - 建議: 執行 pnpm install 重新安裝"
    echo ""
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

if [ ! -z "$DOCKERFILE_VERSION" ] && [ "$DOCKERFILE_VERSION" != "$INSTALLED_VERSION" ]; then
    echo "⚠️  問題 2: Dockerfile 硬編碼版本不匹配"
    echo "   - Dockerfile: $DOCKERFILE_VERSION"
    echo "   - 實際安裝: $INSTALLED_VERSION"
    echo "   - 建議: 更新 Dockerfile 使用動態路徑查找"
    echo ""
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

if [ $ISSUES_FOUND -eq 0 ]; then
    echo "✅ 未發現明顯問題"
    echo ""
    echo "💡 建議下一步:"
    echo "   1. 本地測試 Docker 映像登入功能"
    echo "   2. 如果本地成功,則推送到 Azure 測試"
    echo "   3. 如果本地失敗,使用上面的診斷信息進一步調查"
else
    echo "📋 發現 $ISSUES_FOUND 個問題,請按照建議修復"
fi

echo ""
echo "============================================================================"
echo "診斷完成!"
echo "============================================================================"
