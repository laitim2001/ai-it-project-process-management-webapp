/**
 * 獨立的 NextAuth v5 登入測試腳本
 *
 * 直接使用 Playwright API，不依賴配置文件
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3006';

async function testLogin() {
  console.log('🚀 啟動 Playwright 瀏覽器...\n');

  const browser = await chromium.launch({ headless: false }); // 可視化模式
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 測試 1: 成功登入
    console.log('📍 測試 1: 使用有效憑證登入');
    console.log('━'.repeat(50));

    console.log('步驟 1: 訪問登入頁面');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    console.log('✅ 登入頁面已載入');

    console.log('\n步驟 2: 填寫登入表單');
    // 使用正確的測試帳號（來自 seed 數據）
    const emailInput = await page.locator('input[name="email"], input[type="email"]').first();
    await emailInput.fill('pm@itpm.local');
    console.log('✅ Email 已填入: pm@itpm.local');

    const passwordInput = await page.locator('input[name="password"], input[type="password"]').first();
    await passwordInput.fill('pm123456');
    console.log('✅ Password 已填入: pm123456');

    console.log('\n步驟 3: 提交表單');
    const submitButton = await page.locator('button[type="submit"]').first();
    await submitButton.click();
    console.log('✅ 已點擊登入按鈕');

    console.log('\n步驟 4: 等待重定向到 dashboard');
    try {
      await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
      console.log('✅ 成功重定向到 dashboard！');

      // 截圖
      await page.screenshot({ path: 'test-results/login-success.png' });
      console.log('✅ 已保存成功截圖：test-results/login-success.png');

      // 獲取當前 URL
      const currentUrl = page.url();
      console.log(`✅ 當前 URL: ${currentUrl}`);

      console.log('\n' + '═'.repeat(50));
      console.log('🎉 測試 1 PASSED: 登入流程成功！');
      console.log('═'.repeat(50));

    } catch (error) {
      console.error('❌ 等待重定向超時');
      console.error('當前 URL:', page.url());

      // 保存失敗截圖
      await page.screenshot({ path: 'test-results/login-failure.png' });
      console.log('📸 已保存失敗截圖：test-results/login-failure.png');

      throw error;
    }

    // 測試 2: 無效憑證（可選）
    console.log('\n\n📍 測試 2: 使用無效憑證登入');
    console.log('━'.repeat(50));

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.locator('input[name="email"], input[type="email"]').first().fill('invalid@example.com');
    await page.locator('input[name="password"], input[type="password"]').first().fill('wrongpassword');
    await page.locator('button[type="submit"]').first().click();

    // 等待一段時間檢查是否仍在登入頁面
    await page.waitForTimeout(3000);

    const finalUrl = page.url();
    const isOnLoginPage = finalUrl.includes('/login');

    if (isOnLoginPage) {
      console.log('✅ 無效憑證被正確拒絕（仍在登入頁面）');
      console.log('\n' + '═'.repeat(50));
      console.log('🎉 測試 2 PASSED: 無效憑證驗證成功！');
      console.log('═'.repeat(50));
    } else {
      console.error('❌ 無效憑證未被拒絕，這不應該發生');
      await page.screenshot({ path: 'test-results/invalid-creds-failure.png' });
    }

  } catch (error) {
    console.error('\n❌ 測試失敗！');
    console.error(error);
    await page.screenshot({ path: 'test-results/test-error.png' });
    throw error;
  } finally {
    console.log('\n🔚 關閉瀏覽器...');
    await browser.close();
  }
}

// 執行測試
testLogin()
  .then(() => {
    console.log('\n✅ 所有測試完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 測試執行失敗');
    console.error(error);
    process.exit(1);
  });
