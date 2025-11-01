/**
 * 認證相關的測試 Fixture
 * 提供預先登入的測試上下文
 */

import { test as base, Page } from '@playwright/test';
import { loginAsProjectManager, loginAsSupervisor, loginAsAdmin } from '../helpers/test-helpers';

type AuthFixtures = {
  authenticatedPage: Page;
  pmPage: Page;
  supervisorPage: Page;
  adminPage: Page;
};

/**
 * 擴展 Playwright test，提供已認證的頁面上下文
 */
export const test = base.extend<AuthFixtures>({
  /**
   * 通用已認證頁面（ProjectManager）
   */
  authenticatedPage: async ({ page }, use) => {
    await loginAsProjectManager(page);
    await use(page);
  },

  /**
   * ProjectManager 已認證頁面
   */
  pmPage: async ({ page }, use) => {
    await loginAsProjectManager(page);
    await use(page);
  },

  /**
   * Supervisor 已認證頁面
   */
  supervisorPage: async ({ page }, use) => {
    await loginAsSupervisor(page);
    await use(page);
  },

  /**
   * Admin 已認證頁面
   */
  adminPage: async ({ page }, use) => {
    await loginAsAdmin(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
