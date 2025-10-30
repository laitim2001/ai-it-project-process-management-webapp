import { test as base } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * 認證 Fixtures
 *
 * 提供預先認證的 Page 實例，簡化測試編寫
 *
 * 使用方式：
 * import { test, expect } from './fixtures/auth';
 * test('我的測試', async ({ managerPage }) => { ... });
 */

export type AuthFixtures = {
  authenticatedPage: Page;
  managerPage: Page;
  supervisorPage: Page;
};

/**
 * 登入助手函數
 */
export async function login(page: Page, email: string, password: string): Promise<void> {
  // ⚠️ FIX: 先訪問 CSRF 端點以初始化 NextAuth CSRF token
  // 這解決了 cold start 時的 MissingCSRF 錯誤
  await page.goto('/api/auth/csrf');
  await page.waitForTimeout(500); // 等待 CSRF token cookie 設置完成

  await page.goto('/login');

  // 等待登入表單載入
  await page.waitForSelector('input[name="email"]', { timeout: 10000 });

  // 填寫登入信息
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  // 設置控制台日誌監聽（調試用）- 捕獲所有 console 消息
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.log('❌ 瀏覽器控制台錯誤:', text);
    } else if (type === 'log' && (text.includes('🔐') || text.includes('📊') || text.includes('✅') || text.includes('💥'))) {
      console.log('🔍 瀏覽器控制台日誌:', text);
    }
  });

  // 監聽網絡響應（調試 signIn API 調用）
  const responsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/auth/callback/credentials') || response.url().includes('/api/auth/session'),
    { timeout: 15000 }
  ).catch(() => null);

  // 提交表單
  await page.click('button[type="submit"]');

  // 等待 API 響應
  const response = await responsePromise;
  if (response) {
    console.log('認證 API 響應:', response.status(), response.url());
    if (response.status() !== 200) {
      const body = await response.text().catch(() => 'Unable to read response body');
      console.log('認證失敗響應:', body);
    }
  }

  // 等待一秒讓頁面處理登入結果
  await page.waitForTimeout(2000);

  // 檢查頁面上是否有錯誤信息
  const errorElement = await page.locator('.text-destructive').first();
  const hasError = await errorElement.isVisible().catch(() => false);
  if (hasError) {
    const errorText = await errorElement.textContent();
    console.log('登入頁面錯誤信息:', errorText);
    throw new Error(`登入失敗: ${errorText}`);
  }

  // 等待重定向到 dashboard（延長超時時間）
  try {
    await page.waitForURL('/dashboard', { timeout: 15000 });
  } catch (e) {
    // 如果沒有重定向，檢查當前 URL 和頁面狀態
    console.log('當前 URL:', page.url());
    const currentURL = page.url();
    if (currentURL.includes('/login')) {
      // 嘗試捕獲頁面上的任何錯誤信息
      const bodyText = await page.locator('body').textContent();
      console.log('頁面內容（部分）:', bodyText?.substring(0, 500));
    }
    throw e;
  }
}

/**
 * 擴展的 test fixture，包含預先認證的 pages
 */
export const test = base.extend<AuthFixtures>({
  /**
   * 通用認證 Page（使用 ProjectManager）
   */
  authenticatedPage: async ({ page }, use) => {
    await login(page, 'pm@itpm.local', 'pm123');
    await use(page);
  },

  /**
   * ProjectManager 角色的 Page
   */
  managerPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, 'pm@itpm.local', 'pm123');
    await use(page);
    await context.close();
  },

  /**
   * Supervisor 角色的 Page
   */
  supervisorPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, 'supervisor@itpm.local', 'supervisor123');
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
