/**
 * 創建 E2E 測試用戶
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 創建 E2E 測試用戶...');

  // 確保角色存在
  const managerRole = await prisma.role.upsert({
    where: { name: 'ProjectManager' },
    update: {},
    create: { name: 'ProjectManager' },
  });

  const supervisorRole = await prisma.role.upsert({
    where: { name: 'Supervisor' },
    update: {},
    create: { name: 'Supervisor' },
  });

  // 創建測試 Manager
  const managerPassword = await bcrypt.hash('testpassword123', 10);
  const testManager = await prisma.user.upsert({
    where: { email: 'test-manager@example.com' },
    update: {
      password: managerPassword,
      roleId: managerRole.id,
    },
    create: {
      email: 'test-manager@example.com',
      name: 'Test Manager',
      password: managerPassword,
      roleId: managerRole.id,
      emailVerified: new Date(),
    },
  });

  console.log(`✅ 創建測試 Manager: ${testManager.email}`);

  // 創建測試 Supervisor
  const supervisorPassword = await bcrypt.hash('testpassword123', 10);
  const testSupervisor = await prisma.user.upsert({
    where: { email: 'test-supervisor@example.com' },
    update: {
      password: supervisorPassword,
      roleId: supervisorRole.id,
    },
    create: {
      email: 'test-supervisor@example.com',
      name: 'Test Supervisor',
      password: supervisorPassword,
      roleId: supervisorRole.id,
      emailVerified: new Date(),
    },
  });

  console.log(`✅ 創建測試 Supervisor: ${testSupervisor.email}`);

  console.log('\n✨ 測試用戶創建完成！');
  console.log('\n📋 測試憑證：');
  console.log(`   Manager: test-manager@example.com / testpassword123`);
  console.log(`   Supervisor: test-supervisor@example.com / testpassword123`);
}

main()
  .catch((e) => {
    console.error('❌ 錯誤:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
