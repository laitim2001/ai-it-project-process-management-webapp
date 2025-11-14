/**
 * E2E 測試輔助函數
 * 用於錯誤處理、表單驗證、邊界條件測試
 */

import { type Page, expect } from '@playwright/test';

/**
 * 登入輔助函數 - ProjectManager 角色
 *
 * 預設使用 seed.ts 中的測試帳號：
 * - Email: pm@itpm.local
 * - Password: pm123
 */
export async function loginAsProjectManager(page: Page, email = 'pm@itpm.local', password = 'pm123') {
  await page.goto('/login');

  // 使用 ID 選擇器（更可靠）
  await page.fill('input#email', email);
  await page.fill('input#password', password);

  // 點擊登入按鈕並等待導航
  await Promise.all([
    page.waitForNavigation({ timeout: 15000 }),
    page.click('button[type="submit"]'),
  ]);

  // 驗證登入成功並重定向到 dashboard
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

/**
 * 登入輔助函數 - Supervisor 角色
 *
 * 預設使用 seed.ts 中的測試帳號：
 * - Email: supervisor@itpm.local
 * - Password: supervisor123
 */
export async function loginAsSupervisor(page: Page, email = 'supervisor@itpm.local', password = 'supervisor123') {
  await page.goto('/login');

  // 使用 ID 選擇器（更可靠）
  await page.fill('input#email', email);
  await page.fill('input#password', password);

  // 點擊登入按鈕並等待導航
  await Promise.all([
    page.waitForNavigation({ timeout: 15000 }),
    page.click('button[type="submit"]'),
  ]);

  // 驗證登入成功並重定向到 dashboard
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

/**
 * 登入輔助函數 - Admin 角色
 *
 * 預設使用 seed.ts 中的測試帳號：
 * - Email: admin@itpm.local
 * - Password: admin123
 */
export async function loginAsAdmin(page: Page, email = 'admin@itpm.local', password = 'admin123') {
  await page.goto('/login');

  // 使用 ID 選擇器（更可靠）
  await page.fill('input#email', email);
  await page.fill('input#password', password);

  // 點擊登入按鈕並等待導航
  await Promise.all([
    page.waitForNavigation({ timeout: 15000 }),
    page.click('button[type="submit"]'),
  ]);

  // 驗證登入成功並重定向到 dashboard
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

/**
 * 模擬 API 500 錯誤
 */
export async function mockApiError(page: Page, apiPath: string, statusCode = 500, errorMessage = 'Internal Server Error') {
  await page.route(apiPath, (route) =>
    route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          message: errorMessage,
          code: 'INTERNAL_SERVER_ERROR'
        }
      })
    })
  );
}

/**
 * 模擬網路超時
 */
export async function mockNetworkTimeout(page: Page, apiPath: string, timeoutMs = 30000) {
  await page.route(apiPath, (route) =>
    new Promise((resolve) =>
      setTimeout(() => resolve(route.abort('timedout')), timeoutMs)
    )
  );
}

/**
 * 模擬數據庫連接失敗
 */
export async function mockDatabaseError(page: Page) {
  await page.route('**/api/trpc/**', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          message: 'Service temporarily unavailable',
          code: 'DATABASE_CONNECTION_FAILED'
        }
      })
    })
  );
}

/**
 * 清除所有 API 攔截
 */
export async function clearApiMocks(page: Page) {
  await page.unrouteAll({ behavior: 'ignoreErrors' });
}

/**
 * 等待 Toast 通知出現
 */
export async function waitForToast(page: Page, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') {
  const toastSelector = `div[role="alert"]:has-text("${message}")`;
  await expect(page.locator(toastSelector)).toBeVisible({ timeout: 5000 });
}

/**
 * 等待錯誤訊息出現
 */
export async function waitForErrorMessage(page: Page, message: string) {
  await expect(page.locator(`text=${message}`)).toBeVisible({ timeout: 5000 });
}

/**
 * 等待加載狀態消失
 */
export async function waitForLoadingToFinish(page: Page) {
  await expect(page.locator('text=載入中')).not.toBeVisible({ timeout: 10000 });
  await expect(page.locator('[data-loading="true"]')).not.toBeVisible({ timeout: 10000 });
}

/**
 * 填寫項目表單
 */
export async function fillProjectForm(
  page: Page,
  data: {
    name: string;
    description?: string;
    budgetPoolId?: string;
    managerId?: string;
    supervisorId?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  await page.fill('input[name="name"]', data.name);

  if (data.description) {
    await page.fill('textarea[name="description"]', data.description);
  }

  if (data.budgetPoolId) {
    await page.selectOption('select[name="budgetPoolId"]', data.budgetPoolId);
  }

  if (data.managerId) {
    await page.selectOption('select[name="managerId"]', data.managerId);
  }

  if (data.supervisorId) {
    await page.selectOption('select[name="supervisorId"]', data.supervisorId);
  }

  if (data.startDate) {
    await page.fill('input[name="startDate"]', data.startDate);
  }

  if (data.endDate) {
    await page.fill('input[name="endDate"]', data.endDate);
  }
}

/**
 * 填寫預算申請表單
 */
export async function fillProposalForm(
  page: Page,
  data: {
    title: string;
    amount: string;
    projectId?: string;
    description?: string;
  }
) {
  await page.fill('input[name="title"]', data.title);
  await page.fill('input[name="amount"]', data.amount);

  if (data.projectId) {
    await page.selectOption('select[name="projectId"]', data.projectId);
  }

  if (data.description) {
    await page.fill('textarea[name="description"]', data.description);
  }
}

/**
 * 填寫供應商表單
 */
export async function fillVendorForm(
  page: Page,
  data: {
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
  }
) {
  await page.fill('input[name="name"]', data.name);

  if (data.contactPerson) {
    await page.fill('input[name="contactPerson"]', data.contactPerson);
  }

  if (data.email) {
    await page.fill('input[name="email"]', data.email);
  }

  if (data.phone) {
    await page.fill('input[name="phone"]', data.phone);
  }
}

/**
 * 驗證表單驗證錯誤存在
 */
export async function expectValidationError(page: Page, fieldName: string, errorMessage: string) {
  const errorLocator = page.locator(`[data-field="${fieldName}"] ~ .error-message, .error-message:near(input[name="${fieldName}"])`);
  await expect(errorLocator.filter({ hasText: errorMessage })).toBeVisible({ timeout: 3000 });
}

/**
 * 驗證表單驗證錯誤不存在
 */
export async function expectNoValidationError(page: Page, fieldName: string) {
  const errorLocator = page.locator(`[data-field="${fieldName}"] ~ .error-message, .error-message:near(input[name="${fieldName}"])`);
  await expect(errorLocator).not.toBeVisible({ timeout: 1000 });
}

/**
 * 清除所有 Cookies（模擬會話過期）
 */
export async function clearSession(page: Page) {
  await page.context().clearCookies();
  await page.context().clearPermissions();
}

/**
 * 檢查是否重定向到登入頁
 */
export async function expectRedirectToLogin(page: Page) {
  await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
}

/**
 * 上傳文件
 */
export async function uploadFile(
  page: Page,
  inputSelector: string,
  file: {
    name: string;
    mimeType: string;
    buffer: Buffer;
  }
) {
  await page.setInputFiles(inputSelector, file);
}

/**
 * 檢查元素是否存在但不可見
 */
export async function expectHidden(page: Page, selector: string) {
  const element = page.locator(selector);
  await expect(element).not.toBeVisible({ timeout: 3000 });
}

/**
 * 檢查元素是否不存在於 DOM
 */
export async function expectNotInDOM(page: Page, selector: string) {
  await expect(page.locator(selector)).toHaveCount(0, { timeout: 3000 });
}

/**
 * 等待 API 請求完成
 */
export async function waitForApiResponse(page: Page, apiPath: string, timeout = 10000) {
  return page.waitForResponse(
    (response) => response.url().includes(apiPath) && response.status() === 200,
    { timeout }
  );
}

/**
 * 模擬樂觀鎖衝突（版本號不匹配）
 */
export async function mockOptimisticLockConflict(page: Page, apiPath: string) {
  await page.route(apiPath, (route) =>
    route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          message: '此記錄已被其他用戶修改，請刷新後重試',
          code: 'OPTIMISTIC_LOCK_ERROR'
        }
      })
    })
  );
}

/**
 * 生成隨機字串
 */
export function generateRandomString(length = 10): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * 生成隨機 Email
 */
export function generateRandomEmail(): string {
  return `test-${generateRandomString(8)}@example.com`;
}

/**
 * 格式化日期為 YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}

/**
 * 取得今天日期字串
 */
export function getTodayDateString(): string {
  return formatDate(new Date());
}

/**
 * 取得未來日期字串
 */
export function getFutureDateString(daysFromNow: number): string {
  const future = new Date();
  future.setDate(future.getDate() + daysFromNow);
  return formatDate(future);
}

/**
 * 取得過去日期字串
 */
export function getPastDateString(daysAgo: number): string {
  const past = new Date();
  past.setDate(past.getDate() - daysAgo);
  return formatDate(past);
}

/**
 * 等待並點擊按鈕（處理可能的遮罩或動畫）
 */
export async function waitAndClick(page: Page, selector: string) {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout: 5000 });
  await element.click({ force: false, timeout: 5000 });
}

/**
 * 截圖用於除錯
 */
export async function takeDebugScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `test-results/debug-screenshots/${name}-${Date.now()}.png`,
    fullPage: true
  });
}

/**
 * 驗證分頁元素存在並可用
 */
export async function expectPaginationVisible(page: Page) {
  const pagination = page.locator('nav[aria-label="pagination"]');
  await expect(pagination).toBeVisible({ timeout: 5000 });
}

/**
 * 導航到指定頁碼
 */
export async function navigateToPage(page: Page, pageNumber: number) {
  const pageButton = page.locator(`button:has-text("${pageNumber}")`);
  await pageButton.click();
  await waitForLoadingToFinish(page);
}
