import { test, expect } from './fixtures/auth';

/**
 * 基本功能示例測試
 *
 * 驗證應用程式的基本功能和認證流程
 */

test.describe('應用程式基本功能', () => {
  test('應該能夠訪問首頁', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/IT Project Management/i);
  });

  test('應該能夠訪問登入頁面', async ({ page }) => {
    await page.goto('/login');
    // 檢查登入頁面的標題文字
    await expect(page.locator('h3')).toContainText(/IT 專案流程管理平台/i);
    // 檢查是否有登入表單
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('應該能夠以 ProjectManager 身份登入', async ({ managerPage }) => {
    await expect(managerPage).toHaveURL('/dashboard');
    await expect(managerPage.locator('h1', { hasText: '儀表板' })).toBeVisible();
  });

  test('應該能夠以 Supervisor 身份登入', async ({ supervisorPage }) => {
    await expect(supervisorPage).toHaveURL('/dashboard');
    await expect(supervisorPage.locator('h1', { hasText: '儀表板' })).toBeVisible();
  });

  test('應該能夠導航到預算池頁面', async ({ managerPage }) => {
    await managerPage.click('text=預算池');
    await expect(managerPage).toHaveURL(/\/budget-pools/);
    await expect(managerPage.locator('h1')).toContainText(/預算池/i);
  });

  test('應該能夠導航到項目頁面', async ({ managerPage }) => {
    await managerPage.click('a[href="/projects"]');
    await expect(managerPage).toHaveURL(/\/projects/);
    await expect(managerPage.locator('h1')).toContainText(/專案管理/i);
  });

  test('應該能夠導航到費用轉嫁頁面', async ({ managerPage }) => {
    await managerPage.click('text=費用轉嫁');
    await expect(managerPage).toHaveURL(/\/charge-outs/);
    await expect(managerPage.locator('h1')).toContainText(/費用轉嫁/i);
  });
});
