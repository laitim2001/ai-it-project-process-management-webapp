/**
 * 直接測試 NextAuth 配置
 *
 * 這個腳本直接導入 authOptions 並測試 credentials provider 的 authorize 函數
 */

import 'dotenv/config';
import { authOptions } from '../packages/auth/src/index';
import type { User } from 'next-auth';

async function testAuthorize() {
  console.log('🧪 測試 NextAuth 配置...\n');

  // 檢查 authOptions 結構
  console.log('📋 AuthOptions 結構:');
  console.log('  - adapter:', authOptions.adapter ? '✅ 存在' : '❌ 不存在');
  console.log('  - session.strategy:', authOptions.session?.strategy);
  console.log('  - providers 數量:', authOptions.providers?.length || 0);
  console.log('  - debug:', authOptions.debug);
  console.log();

  // 查找 credentials provider
  const credentialsProvider = authOptions.providers?.find(
    (p: any) => p.id === 'credentials'
  );

  if (!credentialsProvider) {
    console.log('❌ 找不到 credentials provider');
    return;
  }

  console.log('✅ 找到 credentials provider');
  console.log();

  // 測試 authorize 函數
  console.log('🔐 測試 authorize 函數...');
  console.log('測試用戶: test-manager@example.com');
  console.log();

  try {
    const authorize = (credentialsProvider as any).authorize;

    if (typeof authorize !== 'function') {
      console.log('❌ authorize 不是函數');
      return;
    }

    const credentials = {
      email: 'test-manager@example.com',
      password: 'testpassword123',
    };

    console.log('⏳ 調用 authorize 函數...\n');

    // 暫時覆蓋 console.log 來捕獲 authorize 內部的日誌
    const originalLog = console.log;
    const logs: string[] = [];
    console.log = (...args: any[]) => {
      logs.push(args.join(' '));
      originalLog(...args);
    };

    try {
      const user = await authorize(credentials, {} as any) as User | null;

      // 恢復 console.log
      console.log = originalLog;

      if (user) {
        console.log('✅ Authorize 成功！');
        console.log('📊 返回的用戶對象:');
        console.log('  - id:', user.id);
        console.log('  - email:', user.email);
        console.log('  - name:', user.name);
        console.log('  - roleId:', (user as any).roleId);
        console.log('  - role:', JSON.stringify((user as any).role));
      } else {
        console.log('❌ Authorize 返回 null');
      }

      if (logs.length > 0) {
        console.log('\n📝 Authorize 內部日誌:');
        logs.forEach(log => console.log('  ', log));
      } else {
        console.log('\n⚠️  沒有捕獲到 authorize 內部的日誌');
      }
    } catch (authorizeError: any) {
      console.log = originalLog;
      console.log('❌ Authorize 執行時拋出錯誤:', authorizeError.message);
      console.log('📍 錯誤堆疊:', authorizeError.stack);

      if (logs.length > 0) {
        console.log('\n📝 錯誤前的日誌:');
        logs.forEach(log => console.log('  ', log));
      }
    }
  } catch (error: any) {
    console.log('❌ 測試腳本錯誤:', error.message);
    console.log('📍 錯誤堆疊:', error.stack);
  }

  console.log('\n✅ 測試完成！');
}

testAuthorize()
  .catch(console.error)
  .finally(() => process.exit(0));
