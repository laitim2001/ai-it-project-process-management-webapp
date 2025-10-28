/**
 * 快速測試 3006 端口的登入功能
 */

import { chromium } from 'playwright';

async function testLogin() {
  console.log('🧪 測試 3006 端口的登入功能...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 監聽控制台日誌
  const logs: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('🔐') || text.includes('📊') || text.includes('✅') || text.includes('❌')) {
      logs.push(text);
      console.log('🔍 瀏覽器:', text);
    }
  });

  try {
    // 訪問登入頁面
    console.log('📍 訪問 http://localhost:3006/login');
    await page.goto('http://localhost:3006/login', { waitUntil: 'load' });

    // 等待 React hydration
    await page.waitForTimeout(2000);

    // 填寫登入表單
    console.log('📝 填寫登入表單...');
    await page.fill('input[name="email"]', 'test-manager@example.com');
    await page.fill('input[name="password"]', 'testpassword123');

    // 等待表單狀態更新
    await page.waitForTimeout(500);

    // 提交表單（使用 Promise.all 等待導航）
    console.log('🚀 提交登入...\n');
    await Promise.all([
      page.waitForNavigation({ timeout: 10000 }).catch(() => null),
      page.click('button[type="submit"]')
    ]);

    // 等待一段時間讓頁面處理
    await page.waitForTimeout(3000);

    // 檢查當前 URL
    const currentURL = page.url();
    console.log('\n📍 當前 URL:', currentURL);

    // 檢查頁面標題
    const title = await page.title();
    console.log('📄 頁面標題:', title);

    // 檢查是否有錯誤
    const hasError = await page.locator('.text-destructive').isVisible().catch(() => false);
    if (hasError) {
      const errorText = await page.locator('.text-destructive').textContent();
      console.log('❌ 頁面錯誤:', errorText);
    }

    // 判斷結果
    if (currentURL.includes('/dashboard')) {
      console.log('\n✅ 登入成功！已重定向到 dashboard');
      return true;
    } else if (currentURL.includes('/login')) {
      console.log('\n❌ 登入失敗：仍在登入頁面');
      console.log('\n📝 捕獲的日誌:');
      logs.forEach(log => console.log('  ', log));
      return false;
    } else {
      console.log('\n⚠️  重定向到意外的位置:', currentURL);
      return false;
    }
  } catch (error: any) {
    console.log('\n💥 測試錯誤:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testLogin()
  .then((success) => {
    console.log('\n' + '='.repeat(50));
    if (success) {
      console.log('✅ 測試通過：登入功能正常工作');
      console.log('✅ NextAuth 修復已生效');
    } else {
      console.log('❌ 測試失敗：登入功能仍有問題');
    }
    console.log('='.repeat(50));
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 致命錯誤:', error);
    process.exit(1);
  });
