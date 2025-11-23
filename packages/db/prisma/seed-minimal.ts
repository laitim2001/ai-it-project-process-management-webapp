/**
 * Minimal Database Seed Script for Azure Deployment
 *
 * 這個 script 只插入系統必需的基礎資料（Role, Currency），不包含測試資料。
 * 適用於 Azure 生產環境和 UAT 環境的初始化。
 *
 * 執行方式:
 * - 開發環境: pnpm db:seed (使用 seed.ts 完整測試資料)
 * - 生產/UAT: pnpm db:seed:minimal (使用此 script)
 * - CI/CD: 在 migration 後自動執行此 script
 *
 * @fileoverview Minimal Seed Data for Production Environments
 * @author IT Department
 * @since 2025-11-22
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 開始基礎種子數據（Minimal Seed）...');
  console.log('');

  // ========================================
  // 1. 創建系統角色 (Roles) - 必需
  // ========================================
  console.log('📝 創建系統角色...');

  const roles = [
    { id: 1, name: 'ProjectManager', description: '專案經理 - 負責專案執行和預算提案' },
    { id: 2, name: 'Supervisor', description: '主管 - 審批預算提案和費用' },
    { id: 3, name: 'Admin', description: '系統管理員 - 完整系統權限' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: {
        name: role.name,
      },
      create: {
        id: role.id,
        name: role.name,
      },
    });
    console.log(`  ✅ 角色創建: ${role.name} (ID: ${role.id}) - ${role.description}`);
  }

  console.log('✅ 系統角色創建完成（3 個）');
  console.log('');

  // ========================================
  // 2. 創建預設貨幣 (Currencies) - 必需
  // ========================================
  console.log('💱 創建預設貨幣...');

  const currencies = [
    { code: 'TWD', name: '新台幣', symbol: 'NT$', active: true },
    { code: 'USD', name: '美元', symbol: '$', active: true },
    { code: 'CNY', name: '人民幣', symbol: '¥', active: true },
    { code: 'HKD', name: '港幣', symbol: 'HK$', active: true },
    { code: 'JPY', name: '日圓', symbol: '¥', active: true },
    { code: 'EUR', name: '歐元', symbol: '€', active: true },
  ];

  for (const currency of currencies) {
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
    console.log(`  ✅ 貨幣創建: ${currency.code} (${currency.name}) ${currency.symbol}`);
  }

  console.log('✅ 預設貨幣創建完成（6 個）');
  console.log('');

  // ========================================
  // 完成摘要
  // ========================================
  console.log('🎉 基礎種子數據完成！');
  console.log('');
  console.log('📊 資料摘要:');
  console.log('  ✅ 系統角色: 3 個');
  console.log('    - ProjectManager (ID: 1)');
  console.log('    - Supervisor (ID: 2)');
  console.log('    - Admin (ID: 3)');
  console.log('');
  console.log('  ✅ 預設貨幣: 6 個');
  console.log('    - TWD (新台幣)');
  console.log('    - USD (美元)');
  console.log('    - CNY (人民幣)');
  console.log('    - HKD (港幣)');
  console.log('    - JPY (日圓)');
  console.log('    - EUR (歐元)');
  console.log('');
  console.log('⚠️  注意: 此為基礎資料 seed，不包含測試用戶和範例資料');
  console.log('💡 如需測試資料，請執行: pnpm db:seed (使用完整 seed.ts)');
  console.log('');
}

main()
  .then(async () => {
    console.log('✅ 種子數據執行成功');
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('');
    console.error('❌ 種子數據失敗:', e);
    console.error('');
    console.error('錯誤詳情:');
    if (e instanceof Error) {
      console.error('  類型:', e.constructor.name);
      console.error('  訊息:', e.message);
      if (e.stack) {
        console.error('  堆疊:');
        console.error(e.stack.split('\n').map(line => `    ${line}`).join('\n'));
      }
    }
    console.error('');
    await prisma.$disconnect();
    process.exit(1);
  });
