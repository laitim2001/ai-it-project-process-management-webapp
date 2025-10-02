/**
 * Database Seed Script
 *
 * 創建初始資料供開發和測試使用
 * 執行方式: pnpm db:seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 開始資料庫種子數據...');

  // 1. 創建角色 (Roles)
  console.log('📝 創建角色...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
    },
  });

  const pmRole = await prisma.role.upsert({
    where: { name: 'ProjectManager' },
    update: {},
    create: {
      name: 'ProjectManager',
    },
  });

  const supervisorRole = await prisma.role.upsert({
    where: { name: 'Supervisor' },
    update: {},
    create: {
      name: 'Supervisor',
    },
  });

  console.log('✅ 角色創建完成');

  // 2. 創建測試用戶 (Users)
  console.log('👤 創建測試用戶...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const pmPassword = await bcrypt.hash('pm123', 10);
  const supervisorPassword = await bcrypt.hash('supervisor123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@itpm.local' },
    update: {},
    create: {
      email: 'admin@itpm.local',
      name: '系統管理員',
      password: adminPassword,
      roleId: adminRole.id,
    },
  });

  const pmUser = await prisma.user.upsert({
    where: { email: 'pm@itpm.local' },
    update: {},
    create: {
      email: 'pm@itpm.local',
      name: '專案經理 - 張三',
      password: pmPassword,
      roleId: pmRole.id,
    },
  });

  const supervisorUser = await prisma.user.upsert({
    where: { email: 'supervisor@itpm.local' },
    update: {},
    create: {
      email: 'supervisor@itpm.local',
      name: '主管 - 李四',
      password: supervisorPassword,
      roleId: supervisorRole.id,
    },
  });

  console.log('✅ 測試用戶創建完成');

  // 3. 創建預算池 (Budget Pools)
  console.log('💰 創建預算池...');

  const budgetPool2024 = await prisma.budgetPool.upsert({
    where: { id: 'bp-2024-it' },
    update: {},
    create: {
      id: 'bp-2024-it',
      name: '2024 IT 部門預算池',
      totalAmount: 5000000,
      financialYear: 2024,
    },
  });

  const budgetPool2025 = await prisma.budgetPool.upsert({
    where: { id: 'bp-2025-it' },
    update: {},
    create: {
      id: 'bp-2025-it',
      name: '2025 IT 部門預算池',
      totalAmount: 6000000,
      financialYear: 2025,
    },
  });

  console.log('✅ 預算池創建完成');

  // 4. 創建示範專案 (Projects)
  console.log('📂 創建示範專案...');

  const project1 = await prisma.project.upsert({
    where: { id: 'proj-erp-upgrade' },
    update: {},
    create: {
      id: 'proj-erp-upgrade',
      name: 'ERP 系統升級專案',
      description: '將現有 ERP 系統升級至最新版本，包含模組更新和數據遷移',
      status: 'InProgress',
      managerId: pmUser.id,
      supervisorId: supervisorUser.id,
      budgetPoolId: budgetPool2024.id,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-12-31'),
    },
  });

  const project2 = await prisma.project.upsert({
    where: { id: 'proj-cloud-migration' },
    update: {},
    create: {
      id: 'proj-cloud-migration',
      name: '雲端遷移專案',
      description: '將核心業務系統遷移至 Azure 雲平台',
      status: 'Draft',
      managerId: pmUser.id,
      supervisorId: supervisorUser.id,
      budgetPoolId: budgetPool2025.id,
      startDate: new Date('2025-03-01'),
    },
  });

  console.log('✅ 示範專案創建完成');

  // 5. 創建供應商 (Vendors)
  console.log('🏢 創建供應商...');

  const vendor1 = await prisma.vendor.upsert({
    where: { name: 'Microsoft Taiwan' },
    update: {},
    create: {
      name: 'Microsoft Taiwan',
      contactPerson: '王小明',
      contactEmail: 'contact@microsoft.com.tw',
      phone: '02-1234-5678',
    },
  });

  const vendor2 = await prisma.vendor.upsert({
    where: { name: 'Dell Technologies' },
    update: {},
    create: {
      name: 'Dell Technologies',
      contactPerson: '陳大華',
      contactEmail: 'sales@dell.com.tw',
      phone: '02-8765-4321',
    },
  });

  console.log('✅ 供應商創建完成');

  console.log('');
  console.log('🎉 資料庫種子數據完成！');
  console.log('');
  console.log('📋 測試帳號:');
  console.log('  管理員: admin@itpm.local / admin123');
  console.log('  專案經理: pm@itpm.local / pm123');
  console.log('  主管: supervisor@itpm.local / supervisor123');
  console.log('');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ 種子數據失敗:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
