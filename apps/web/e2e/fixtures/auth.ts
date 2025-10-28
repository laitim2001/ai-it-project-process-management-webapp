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
  await page.goto('/login');

  // 等待登入表單載入
  await page.waitForSelector('input[name="email"]', { timeout: 10000 });

  // 填寫登入信息
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  // 提交表單
  await page.click('button[type="submit"]');

  // 等待重定向到 dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

/**
 * 擴展的 test fixture，包含預先認證的 pages
 */
export const test = base.extend<AuthFixtures>({
  /**
   * 通用認證 Page（使用 ProjectManager）
   */
  authenticatedPage: async ({ page }, use) => {
    await login(page, 'test-manager@example.com', 'testpassword123');
    await use(page);
  },

  /**
   * ProjectManager 角色的 Page
   */
  managerPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, 'test-manager@example.com', 'testpassword123');
    await use(page);
    await context.close();
  },

  /**
   * Supervisor 角色的 Page
   */
  supervisorPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, 'test-supervisor@example.com', 'testpassword123');
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
