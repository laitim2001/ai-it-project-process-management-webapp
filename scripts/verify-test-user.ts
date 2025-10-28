/**
 * 驗證測試用戶密碼
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 驗證測試用戶密碼...\n');

  // 測試用戶憑證
  const testUsers = [
    {
      email: 'test-manager@example.com',
      password: 'testpassword123',
      role: 'ProjectManager',
    },
    {
      email: 'test-supervisor@example.com',
      password: 'testpassword123',
      role: 'Supervisor',
    },
  ];

  for (const testUser of testUsers) {
    console.log(`\n📧 檢查用戶: ${testUser.email}`);

    // 查找用戶
    const user = await prisma.user.findUnique({
      where: { email: testUser.email },
      include: { role: true },
    });

    if (!user) {
      console.log(`❌ 用戶不存在！`);
      continue;
    }

    console.log(`✅ 用戶存在`);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Name: ${user.name}`);
    console.log(`   - Role: ${user.role.name} (ID: ${user.roleId})`);
    console.log(`   - Email Verified: ${user.emailVerified ? '✅ Yes' : '❌ No'}`);
    console.log(`   - Has Password: ${user.password ? '✅ Yes' : '❌ No'}`);

    if (user.password) {
      // 驗證密碼
      const isPasswordValid = await bcrypt.compare(testUser.password, user.password);

      if (isPasswordValid) {
        console.log(`✅ 密碼驗證成功！`);
      } else {
        console.log(`❌ 密碼驗證失敗！`);

        // 顯示當前密碼哈希的一部分（用於調試）
        console.log(`   - 數據庫密碼哈希: ${user.password.substring(0, 20)}...`);

        // 嘗試生成新的哈希並比較
        const newHash = await bcrypt.hash(testUser.password, 10);
        console.log(`   - 新生成的哈希: ${newHash.substring(0, 20)}...`);

        // 測試新哈希是否能驗證
        const canVerifyNewHash = await bcrypt.compare(testUser.password, newHash);
        console.log(`   - 新哈希能否驗證: ${canVerifyNewHash ? '✅ Yes' : '❌ No'}`);
      }
    }
  }

  console.log('\n✨ 驗證完成！');
}

main()
  .catch((e) => {
    console.error('❌ 錯誤:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
