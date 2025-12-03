#!/bin/sh
# Docker 容器啟動腳本
# 1. 執行 Prisma 資料庫遷移
# 2. 啟動 Next.js 應用

set -e

echo "=============================================="
echo "🚀 IT Project Management Platform 啟動中..."
echo "=============================================="
echo "📅 啟動時間: $(date)"
echo ""

# 檢查 DATABASE_URL 是否設置
if [ -z "$DATABASE_URL" ]; then
    echo "❌ 錯誤: DATABASE_URL 環境變數未設置"
    exit 1
fi

# 隱藏密碼顯示連接資訊
DB_INFO=$(echo "$DATABASE_URL" | sed 's/:\/\/[^:]*:[^@]*@/:\/\/***:***@/')
echo "📍 資料庫連接: $DB_INFO"

# 執行 Prisma 遷移
echo ""
echo "🔄 執行資料庫遷移..."
echo "   Schema 路徑: /app/packages/db/prisma/schema.prisma"
echo ""

cd /app/packages/db

# 列出可用的 migration 文件
echo "📋 可用的 Migration 文件:"
if [ -d "./prisma/migrations" ]; then
    ls -la ./prisma/migrations/
else
    echo "   ❌ Migration 目錄不存在!"
fi
echo ""

# 使用本地 Prisma CLI 執行 migrate deploy
# Prisma CLI 已複製到 /app/packages/db/node_modules/prisma
echo "🔧 執行 prisma migrate deploy..."
set +e  # 暫時禁用錯誤退出
MIGRATE_OUTPUT=$(node ./node_modules/prisma/build/index.js migrate deploy --schema=./prisma/schema.prisma 2>&1)
MIGRATE_EXIT=$?
set -e  # 重新啟用錯誤退出

# 輸出完整的 migration 結果
echo "📤 Migration 輸出:"
echo "$MIGRATE_OUTPUT"
echo ""

if [ $MIGRATE_EXIT -eq 0 ]; then
    echo "✅ 資料庫遷移完成 (exit code: 0)"
else
    echo "⚠️ 資料庫遷移警告 (exit code: $MIGRATE_EXIT)"
    echo "   可能原因: 遷移已執行過、無新遷移或連接問題"
    echo "   繼續啟動應用..."
fi

# 返回應用目錄
cd /app

echo ""
echo "🌐 啟動 Next.js 應用..."
echo "   Port: ${PORT:-3000}"
echo "   Hostname: ${HOSTNAME:-0.0.0.0}"
echo "=============================================="

# 啟動 Next.js
exec node apps/web/server.js
