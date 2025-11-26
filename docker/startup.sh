#!/bin/sh
# ==============================================================================
# ITPM App Startup Script
# ==============================================================================
# 此腳本在 Docker 容器啟動時執行，用於：
# 1. 執行 Prisma 資料庫遷移 (migrate deploy)
# 2. 執行基礎種子資料 (Seed) - 確保 Role 和 Currency 表有數據
# 3. 啟動 Next.js 應用
#
# 這確保每次部署時資料庫結構和基礎數據都是完整的。
# ==============================================================================

# 不使用 set -e，讓腳本可以處理錯誤後繼續
echo "================================================"
echo "🚀 ITPM 應用程式啟動"
echo "================================================"
echo ""

# 檢查 DATABASE_URL 環境變數
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  警告: DATABASE_URL 未設定，跳過資料庫遷移和 Seed"
else
    echo "✅ DATABASE_URL 已設定"

    cd /app

    # ------------------------------------------------------------------------------
    # Step 1: 執行 Prisma Migration
    # ------------------------------------------------------------------------------
    echo ""
    echo "📦 Step 1/2: 執行 Prisma 資料庫遷移..."

    # 使用 node 直接呼叫 prisma CLI
    if node node_modules/.pnpm/prisma@5.22.0/node_modules/prisma/build/index.js migrate deploy --schema=packages/db/prisma/schema.prisma 2>&1; then
        echo "✅ 資料庫遷移成功"
        MIGRATION_SUCCESS=true
    else
        echo "⚠️  資料庫遷移失敗或已是最新狀態"
        MIGRATION_SUCCESS=false
    fi

    # ------------------------------------------------------------------------------
    # Step 2: 執行 Seed（植入基礎數據：Role, Currency）
    # ------------------------------------------------------------------------------
    echo ""
    echo "🌱 Step 2/2: 執行基礎種子資料 (Seed)..."

    # 使用 API 端點執行 Seed（更可靠，因為 API 已經在編譯後的代碼中）
    # 但因為應用還沒啟動，我們使用 Node.js 直接執行 Seed 邏輯

    # 創建一個臨時的 Seed 腳本
    cat > /tmp/run-seed.js << 'SEEDSCRIPT'
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seed() {
    console.log('🌱 開始執行基礎 Seed...');

    // Seed Roles
    const roles = [
        { id: 1, name: 'ProjectManager' },
        { id: 2, name: 'Supervisor' },
        { id: 3, name: 'Admin' },
    ];

    for (const role of roles) {
        try {
            await prisma.role.upsert({
                where: { id: role.id },
                update: { name: role.name },
                create: { id: role.id, name: role.name },
            });
            console.log(`  ✅ Role: ${role.name} (ID: ${role.id})`);
        } catch (err) {
            console.log(`  ⚠️  Role ${role.name}: ${err.message}`);
        }
    }

    // Seed Currencies
    const currencies = [
        { code: 'TWD', name: '新台幣', symbol: 'NT$', active: true },
        { code: 'USD', name: '美元', symbol: '$', active: true },
        { code: 'CNY', name: '人民幣', symbol: '¥', active: true },
        { code: 'HKD', name: '港幣', symbol: 'HK$', active: true },
        { code: 'JPY', name: '日圓', symbol: '¥', active: true },
        { code: 'EUR', name: '歐元', symbol: '€', active: true },
    ];

    for (const currency of currencies) {
        try {
            await prisma.currency.upsert({
                where: { code: currency.code },
                update: { name: currency.name, symbol: currency.symbol, active: currency.active },
                create: currency,
            });
            console.log(`  ✅ Currency: ${currency.code} (${currency.name})`);
        } catch (err) {
            console.log(`  ⚠️  Currency ${currency.code}: ${err.message}`);
        }
    }

    // 驗證
    const roleCount = await prisma.role.count();
    const currencyCount = await prisma.currency.count();
    console.log('');
    console.log(`📊 Seed 完成: ${roleCount} Roles, ${currencyCount} Currencies`);

    await prisma.$disconnect();
}

seed().catch(async (e) => {
    console.error('❌ Seed 失敗:', e.message);
    await prisma.$disconnect();
    // 不退出，讓應用繼續啟動
});
SEEDSCRIPT

    # 執行 Seed 腳本
    if node /tmp/run-seed.js 2>&1; then
        echo "✅ Seed 執行成功"
    else
        echo "⚠️  Seed 執行失敗（應用仍將繼續啟動）"
    fi

    # 清理臨時文件
    rm -f /tmp/run-seed.js
fi

echo ""
echo "================================================"
echo "🌐 啟動 Next.js 應用..."
echo "================================================"

# 啟動 Next.js 應用
exec node apps/web/server.js
