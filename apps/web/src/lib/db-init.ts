/**
 * @fileoverview Database Initialization - Auto Seed on Startup
 *
 * @description
 * 此模組在應用程式啟動時自動檢查並執行基礎種子資料。
 * 用於確保 Azure 部署後資料庫有必要的基礎資料（Role, Currency）。
 *
 * @features
 * - 自動檢測 Role 表是否為空
 * - 如果為空，自動執行 seed-minimal 邏輯
 * - 使用 upsert 確保冪等性（可重複執行）
 * - 詳細日誌記錄便於問題診斷
 *
 * @usage
 * 在 Next.js 應用啟動時調用：
 *   import { initializeDatabase } from '@/lib/db-init';
 *   await initializeDatabase();
 *
 * @author IT Department
 * @since 2025-11-25
 */

import { prisma } from '@itpm/db';

// 基礎角色資料
const SEED_ROLES = [
  { id: 1, name: 'ProjectManager' },
  { id: 2, name: 'Supervisor' },
  { id: 3, name: 'Admin' },
];

// 基礎貨幣資料
const SEED_CURRENCIES = [
  { code: 'TWD', name: '新台幣', symbol: 'NT$', active: true },
  { code: 'USD', name: '美元', symbol: '$', active: true },
  { code: 'CNY', name: '人民幣', symbol: '¥', active: true },
  { code: 'HKD', name: '港幣', symbol: 'HK$', active: true },
  { code: 'JPY', name: '日圓', symbol: '¥', active: true },
  { code: 'EUR', name: '歐元', symbol: '€', active: true },
];

/**
 * 檢查資料庫是否需要初始化
 */
async function needsInitialization(): Promise<boolean> {
  try {
    const roleCount = await prisma.role.count();
    return roleCount === 0;
  } catch (error) {
    console.error('❌ [DB-INIT] 無法檢查 Role 表:', error);
    return false; // 如果無法檢查，不要嘗試初始化
  }
}

/**
 * 執行基礎種子資料初始化
 */
async function seedDatabase(): Promise<void> {
  console.log('🌱 [DB-INIT] 開始執行基礎種子資料...');

  // 創建角色
  for (const role of SEED_ROLES) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: { name: role.name },
      create: { id: role.id, name: role.name },
    });
    console.log(`  ✅ 角色創建: ${role.name} (ID: ${role.id})`);
  }

  // 創建貨幣
  for (const currency of SEED_CURRENCIES) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      update: {
        name: currency.name,
        symbol: currency.symbol,
        active: currency.active,
      },
      create: {
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol,
        active: currency.active,
      },
    });
    console.log(`  ✅ 貨幣創建: ${currency.code} (${currency.name})`);
  }

  console.log('✅ [DB-INIT] 基礎種子資料完成');
}

/**
 * 初始化資料庫（應用啟動時調用）
 *
 * 此函數是冪等的，可以安全地重複調用。
 * 它會檢查 Role 表是否為空，只有在需要時才執行 seed。
 */
export async function initializeDatabase(): Promise<void> {
  console.log('🔍 [DB-INIT] 檢查資料庫初始化狀態...');

  try {
    const needsInit = await needsInitialization();

    if (needsInit) {
      console.log('⚠️  [DB-INIT] 檢測到空的 Role 表，需要初始化');
      await seedDatabase();
    } else {
      console.log('✅ [DB-INIT] 資料庫已初始化，跳過 seed');
    }
  } catch (error) {
    console.error('❌ [DB-INIT] 資料庫初始化失敗:', error);
    // 不要拋出錯誤，讓應用程式繼續啟動
    // 用戶可以透過其他方式手動執行 seed
  }
}
