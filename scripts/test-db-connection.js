#!/usr/bin/env node

/**
 * 數據庫連接測試腳本
 * 用於診斷 Azure App Service 到 PostgreSQL 的連接問題
 */

// 需要從 packages/db 導入 Prisma Client
const { prisma } = require('../packages/db');

console.log('🔍 開始數據庫連接測試...\n');

// 顯示環境變數（隱藏敏感信息）
console.log('📋 環境變數檢查:');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 30)}...` : '❌ 未設置');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('');

async function testDatabaseConnection() {
  // prisma 已從 @itpm/db 導入，無需重新創建

  try {
    console.log('🔗 嘗試連接到數據庫...');

    // 測試 1: 基本連接測試
    await prisma.$connect();
    console.log('✅ 數據庫連接成功\n');

    // 測試 2: 查詢測試
    console.log('🔍 測試查詢用戶...');
    const userCount = await prisma.user.count();
    console.log(`✅ 用戶總數: ${userCount}\n`);

    // 測試 3: 查詢特定用戶（測試用戶）
    console.log('🔍 查詢測試用戶 (admin@itpm.local)...');
    const testUser = await prisma.user.findUnique({
      where: { email: 'admin@itpm.local' },
      include: { role: true },
    });

    if (testUser) {
      console.log('✅ 找到測試用戶:');
      console.log(`  - ID: ${testUser.id}`);
      console.log(`  - Email: ${testUser.email}`);
      console.log(`  - Name: ${testUser.name}`);
      console.log(`  - Role: ${testUser.role.name} (ID: ${testUser.roleId})`);
      console.log(`  - Has Password: ${!!testUser.password}`);
    } else {
      console.log('⚠️ 測試用戶不存在');
    }

    console.log('\n✅ 所有測試通過！數據庫連接正常。\n');
  } catch (error) {
    console.error('\n❌ 數據庫連接錯誤:\n');
    console.error('錯誤類型:', error.constructor.name);
    console.error('錯誤訊息:', error.message);

    if (error.code) {
      console.error('錯誤代碼:', error.code);
    }

    if (error.meta) {
      console.error('詳細信息:', error.meta);
    }

    console.error('\n完整錯誤堆棧:');
    console.error(error);

    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 已斷開數據庫連接');
  }
}

testDatabaseConnection();
