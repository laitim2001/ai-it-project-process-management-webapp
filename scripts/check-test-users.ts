/**
 * 檢查測試用戶是否存在
 */

import { prisma } from '@itpm/db';

async function checkTestUsers() {
  console.log('🔍 檢查測試用戶...\n');

  try {
    // 檢查數據庫連接
    await prisma.$connect();
    console.log('✅ 數據庫連接成功\n');

    // 查找測試用戶
    const testUsers = [
      'test-manager@example.com',
      'test-supervisor@example.com',
    ];

    for (const email of testUsers) {
      console.log(`\n檢查用戶: ${email}`);
      const user = await prisma.user.findUnique({
        where: { email },
        include: { role: true },
      });

      if (user) {
        console.log('✅ 用戶存在');
        console.log('  - ID:', user.id);
        console.log('  - Name:', user.name);
        console.log('  - Email:', user.email);
        console.log('  - Role:', user.role.name);
        console.log('  - Has Password:', !!user.password);
        if (user.password) {
          console.log('  - Password Hash (first 20 chars):', user.password.substring(0, 20) + '...');
        }
      } else {
        console.log('❌ 用戶不存在');
      }
    }

    await prisma.$disconnect();
    console.log('\n✅ 檢查完成');

  } catch (error) {
    console.error('\n💥 錯誤:', error);
    process.exit(1);
  }
}

checkTestUsers();
