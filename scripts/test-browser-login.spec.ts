/**
 * NextAuth v5 瀏覽器登入流程測試
 *
 * 此測試使用真實瀏覽器來驗證 NextAuth v5 的完整認證流程
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3006';

test.describe('NextAuth v5 登入流程', () => {
  test('使用 Project Manager 帳號登入', async ({ page }) => {
    console.log('📍 步驟 1: 訪問登入頁面');
    await page.goto(`${BASE_URL}/login`);

    // 等待頁面載入
    await page.waitForLoadState('networkidle');

    console.log('📍 步驟 2: 填寫登入表單');
    // 填寫 email
    await page.fill('input[name="email"], input[type="email"]', 'pm@example.com');

    // 填寫 password
    await page.fill('input[name="password"], input[type="password"]', 'password123');

    console.log('📍 步驟 3: 提交表單');
    // 點擊登入按鈕
    await page.click('button[type="submit"], button:has-text("登入"), button:has-text("Sign in")');

    console.log('📍 步驟 4: 等待重定向');
    // 等待重定向到 dashboard
    // 使用較長的 timeout，因為可能需要等待資料庫查詢
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });

    console.log('✅ 成功重定向到 dashboard！');

    // 驗證在 dashboard 頁面
    expect(page.url()).toBe(`${BASE_URL}/dashboard`);

    console.log('📍 步驟 5: 驗證認證狀態');
    // 等待 dashboard 內容載入（可能有 "歡迎" 或用戶名稱等文字）
    await page.waitForLoadState('networkidle');

    // 可選：截圖
    await page.screenshot({ path: 'test-results/login-success.png' });

    console.log('🎉 測試完成：NextAuth v5 登入流程成功！');
  });

  test('使用無效憑證登入應該失敗', async ({ page }) => {
    console.log('📍 測試：無效憑證');
    await page.goto(`${BASE_URL}/login`);

    await page.fill('input[name="email"], input[type="email"]', 'invalid@example.com');
    await page.fill('input[name="password"], input[type="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    // 應該停留在登入頁面或顯示錯誤訊息
    await page.waitForTimeout(2000);

    // 檢查是否仍在登入頁面或看到錯誤
    const currentUrl = page.url();
    const isOnLoginPage = currentUrl.includes('/login');

    expect(isOnLoginPage).toBeTruthy();
    console.log('✅ 無效憑證正確被拒絕');
  });
});
