import { test, expect } from '@playwright/test';

/**
 * 專案更新 — 切換 Budget Pool 跨池一致性測試
 *
 * 回歸覆蓋：在 Azure 部署上發現的 HTTP 400 bug
 * - 編輯一個已有 budgetCategoryId 的 Project
 * - 把 Budget Pool 從 A 切換到 B（B 有不同的 categories）
 * - 提交
 *
 * 修復前行為：server 端 update procedure 校驗 budgetCategory.budgetPoolId
 *           !== 新 pool → throw BAD_REQUEST → HTTP 400
 *
 * 修復後行為（本測試的成功標準）：
 *   1. POST /api/trpc/project.update 回應 200
 *   2. 跳轉回專案 detail 頁
 *
 * 前置條件：
 *   1. dev server 跑在 BASE_URL（預設讀 env）
 *   2. 種子資料已建立：scripts/seed-cross-pool-test-data.sql
 *      Pool A: aaaa1111-1111-1111-1111-111111111111
 *      Pool B: bbbb2222-2222-2222-2222-222222222222
 *      Project: eeee9999-9999-9999-9999-999999999999（指派 Pool A + cat aaaacccc...）
 *
 * 注意：本 spec 不使用既有的 fixtures/auth.ts，因為該 fixture 用 input[name="email"]
 *       selector，但目前登入頁是用 placeholder/label 識別，selector 不匹配。
 *       此處 inline 用 getByRole 風格，與 ProjectForm 現況一致。
 */

const TEST_PROJECT_ID = 'eeee9999-9999-9999-9999-999999999999';
const POOL_A_LABEL = 'Test Pool A (UUID)';
const POOL_B_LABEL = 'Test Pool B (UUID)';

test.describe('Project Update — 切換 Budget Pool 跨池一致性', () => {
  test('切換 Budget Pool 後不應出現 HTTP 400', async ({ page }) => {
    // 1. 登入
    await page.goto('/zh-TW/login');
    await page.getByRole('textbox', { name: '電子郵件' }).fill('admin@itpm.local');
    await page.getByRole('textbox', { name: '密碼' }).fill('admin123');
    await page.getByRole('button', { name: '登入', exact: true }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    // 2. 開啟編輯頁
    await page.goto(`/zh-TW/projects/${TEST_PROJECT_ID}/edit`);

    // 等待 Budget Pool combobox 顯示 Pool A（form 已載入）
    await expect(
      page.locator('button[role="combobox"]', { hasText: POOL_A_LABEL })
    ).toBeVisible({ timeout: 15000 });

    // 3. 切換到 Pool B
    await page.locator('button[role="combobox"]', { hasText: POOL_A_LABEL }).click();
    await page.locator('div[role="dialog"]').getByText(POOL_B_LABEL).click();

    // 驗證 form 已切到 Pool B
    await expect(
      page.locator('button[role="combobox"]', { hasText: POOL_B_LABEL })
    ).toBeVisible();

    // 4. 監聽 update response 並提交
    const updateResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/trpc/project.update') && resp.request().method() === 'POST',
      { timeout: 15000 }
    );
    await page.locator('button:has-text("更新專案")').click();

    // 5. 斷言：response status 必須是 200，不可是 400
    const updateResp = await updateResponsePromise;
    expect(updateResp.status(), '切換 budget pool 後 update 應回 200').toBe(200);

    // 6. 驗證提交後跳回 detail 頁
    await page.waitForURL(`**/projects/${TEST_PROJECT_ID}`, { timeout: 10000 });
  });
});
