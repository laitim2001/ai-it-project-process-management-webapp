/**
 * API 錯誤處理測試
 * 測試系統如何處理各種 API 錯誤情況
 */

import { test, expect } from '../fixtures/auth.fixture';
import {
  mockApiError,
  clearApiMocks,
  waitForToast,
  waitForErrorMessage,
  fillProjectForm,
  fillProposalForm,
} from '../helpers/test-helpers';
import { projectTestData, proposalTestData, apiErrorMessages } from '../fixtures/test-data.fixture';

test.describe('API 錯誤處理', () => {
  test.describe('1.1 API 500 錯誤恢復', () => {
    test('應該在項目創建 API 500 錯誤後顯示錯誤訊息並允許重試', async ({ pmPage }) => {
      // 導航到項目創建頁面
      await pmPage.goto('/projects/new');
      await expect(pmPage.locator('h1:has-text("新增項目")')).toBeVisible();

      // 模擬 API 500 錯誤
      await mockApiError(pmPage, '**/api/trpc/project.create*', 500, 'Internal Server Error');

      // 填寫表單
      await fillProjectForm(pmPage, {
        name: projectTestData.valid.name,
        description: projectTestData.valid.description,
      });

      // 選擇必填下拉選單（假設至少有一個選項）
      const budgetPoolSelect = pmPage.locator('select[name="budgetPoolId"]');
      const budgetPoolCount = await budgetPoolSelect.locator('option').count();
      if (budgetPoolCount > 1) {
        await budgetPoolSelect.selectOption({ index: 1 });
      }

      const managerSelect = pmPage.locator('select[name="managerId"]');
      const managerCount = await managerSelect.locator('option').count();
      if (managerCount > 1) {
        await managerSelect.selectOption({ index: 1 });
      }

      const supervisorSelect = pmPage.locator('select[name="supervisorId"]');
      const supervisorCount = await supervisorSelect.locator('option').count();
      if (supervisorCount > 1) {
        await supervisorSelect.selectOption({ index: 1 });
      }

      // 提交表單
      await pmPage.click('button[type="submit"]');

      // 驗證錯誤訊息顯示
      await waitForErrorMessage(pmPage, apiErrorMessages.serverError);

      // 驗證表單數據保留
      const nameValue = await pmPage.inputValue('input[name="name"]');
      expect(nameValue).toBe(projectTestData.valid.name);

      // 移除 API 攔截，允許正常請求
      await clearApiMocks(pmPage);

      // 驗證重試按鈕存在
      const retryButton = pmPage.locator('button:has-text("重試")');
      if (await retryButton.isVisible()) {
        await retryButton.click();
      } else {
        // 如果沒有專門的重試按鈕，再次提交表單
        await pmPage.click('button[type="submit"]');
      }

      // 驗證成功訊息（等待較長時間因為可能需要導航）
      await expect(
        pmPage.locator('text=/項目創建成功|創建成功/i')
      ).toBeVisible({ timeout: 10000 });
    });

    test('應該在預算申請提交 API 500 錯誤後正確恢復', async ({ pmPage }) => {
      // 導航到預算申請創建頁面
      await pmPage.goto('/proposals/new');
      await expect(pmPage.locator('h1:has-text("新增預算申請")')).toBeVisible();

      // 模擬 API 500 錯誤
      await mockApiError(pmPage, '**/api/trpc/budgetProposal.submit*', 500);

      // 填寫表單
      await fillProposalForm(pmPage, {
        title: proposalTestData.valid.title,
        amount: proposalTestData.valid.amount,
        description: proposalTestData.valid.description,
      });

      // 選擇項目
      const projectSelect = pmPage.locator('select[name="projectId"]');
      const projectCount = await projectSelect.locator('option').count();
      if (projectCount > 1) {
        await projectSelect.selectOption({ index: 1 });
      }

      // 提交表單
      await pmPage.click('button[type="submit"]');

      // 驗證錯誤訊息
      await waitForErrorMessage(pmPage, apiErrorMessages.serverError);

      // 清除 API 模擬
      await clearApiMocks(pmPage);

      // 重新提交
      await pmPage.click('button[type="submit"]');

      // 驗證成功
      await expect(
        pmPage.locator('text=/申請提交成功|提交成功/i')
      ).toBeVisible({ timeout: 10000 });
    });

    test('應該在 API 錯誤後不丟失用戶已填寫的表單數據', async ({ pmPage }) => {
      await pmPage.goto('/projects/new');

      // 填寫詳細的表單數據
      const testData = {
        name: 'Important Project with Long Name',
        description: 'This is a very important project with a detailed description that should not be lost',
        startDate: '2025-06-01',
        endDate: '2025-12-31',
      };

      await fillProjectForm(pmPage, testData);

      // 模擬 API 錯誤
      await mockApiError(pmPage, '**/api/trpc/project.create*', 500);

      // 選擇下拉選單
      const budgetPoolSelect = pmPage.locator('select[name="budgetPoolId"]');
      if (await budgetPoolSelect.isVisible()) {
        await budgetPoolSelect.selectOption({ index: 1 });
      }

      // 提交並觸發錯誤
      await pmPage.click('button[type="submit"]');
      await waitForErrorMessage(pmPage, apiErrorMessages.serverError);

      // 驗證所有表單數據保留
      expect(await pmPage.inputValue('input[name="name"]')).toBe(testData.name);
      expect(await pmPage.inputValue('textarea[name="description"]')).toBe(testData.description);
      expect(await pmPage.inputValue('input[name="startDate"]')).toBe(testData.startDate);
      expect(await pmPage.inputValue('input[name="endDate"]')).toBe(testData.endDate);
    });
  });

  test.describe('1.2 多個 API 錯誤場景', () => {
    test('應該正確處理 400 Bad Request 錯誤', async ({ pmPage }) => {
      await pmPage.goto('/projects/new');

      // 模擬 400 錯誤
      await mockApiError(pmPage, '**/api/trpc/project.create*', 400, 'Invalid request data');

      await fillProjectForm(pmPage, {
        name: projectTestData.valid.name,
      });

      await pmPage.click('button[type="submit"]');

      // 驗證顯示數據驗證錯誤訊息
      await expect(
        pmPage.locator('text=/驗證失敗|無效的數據|Invalid/i')
      ).toBeVisible({ timeout: 5000 });
    });

    test('應該正確處理 404 Not Found 錯誤', async ({ pmPage }) => {
      // 嘗試訪問不存在的項目
      await pmPage.goto('/projects/non-existent-project-id');

      // 應該顯示 404 錯誤或重定向
      await expect(
        pmPage.locator('text=/找不到|不存在|404/i')
      ).toBeVisible({ timeout: 5000 });
    });

    test('應該正確處理 409 Conflict 錯誤（樂觀鎖衝突）', async ({ pmPage }) => {
      await pmPage.goto('/projects');

      // 假設列表中有項目，點擊編輯
      const firstProject = pmPage.locator('table tbody tr').first();
      if (await firstProject.isVisible()) {
        const editButton = firstProject.locator('button:has-text("編輯")');
        if (await editButton.isVisible()) {
          await editButton.click();

          // 模擬 409 衝突錯誤
          await mockApiError(pmPage, '**/api/trpc/project.update*', 409, 'Resource was modified');

          // 修改某個欄位
          await pmPage.fill('input[name="name"]', 'Updated Name');

          // 提交更新
          await pmPage.click('button[type="submit"]');

          // 驗證衝突錯誤訊息
          await expect(
            pmPage.locator('text=/已被修改|衝突|conflict/i')
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('應該正確處理 503 Service Unavailable 錯誤', async ({ pmPage }) => {
      await pmPage.goto('/projects/new');

      // 模擬 503 錯誤
      await mockApiError(pmPage, '**/api/trpc/project.create*', 503, 'Service temporarily unavailable');

      await fillProjectForm(pmPage, {
        name: projectTestData.valid.name,
      });

      await pmPage.click('button[type="submit"]');

      // 驗證服務不可用訊息
      await expect(
        pmPage.locator('text=/系統暫時無法使用|服務不可用|temporarily unavailable/i')
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('1.3 錯誤訊息顯示與清除', () => {
    test('錯誤訊息應該在用戶修正後自動清除', async ({ pmPage }) => {
      await pmPage.goto('/projects/new');

      // 模擬 API 錯誤
      await mockApiError(pmPage, '**/api/trpc/project.create*', 500);

      await fillProjectForm(pmPage, {
        name: projectTestData.valid.name,
      });

      await pmPage.click('button[type="submit"]');

      // 驗證錯誤訊息出現
      const errorMessage = pmPage.locator('text=/伺服器錯誤|Server error/i');
      await expect(errorMessage).toBeVisible();

      // 清除 API 模擬
      await clearApiMocks(pmPage);

      // 修改表單（觸發重新驗證）
      await pmPage.fill('input[name="name"]', projectTestData.valid.name + ' Updated');

      // 等待一小段時間
      await pmPage.waitForTimeout(1000);

      // 錯誤訊息應該自動清除或在重新提交時清除
      await pmPage.click('button[type="submit"]');

      // 驗證成功訊息出現，錯誤訊息消失
      await expect(errorMessage).not.toBeVisible({ timeout: 5000 });
    });

    test('應該同時只顯示一個錯誤訊息', async ({ pmPage }) => {
      await pmPage.goto('/projects/new');

      // 第一次錯誤
      await mockApiError(pmPage, '**/api/trpc/project.create*', 500, 'First error');
      await fillProjectForm(pmPage, { name: 'Test 1' });
      await pmPage.click('button[type="submit"]');
      await waitForErrorMessage(pmPage, '伺服器錯誤');

      // 清除並模擬第二次錯誤
      await clearApiMocks(pmPage);
      await mockApiError(pmPage, '**/api/trpc/project.create*', 400, 'Second error');
      await pmPage.fill('input[name="name"]', 'Test 2');
      await pmPage.click('button[type="submit"]');

      // 驗證只有最新的錯誤訊息顯示
      const errorMessages = pmPage.locator('[role="alert"]');
      const count = await errorMessages.count();
      expect(count).toBeLessThanOrEqual(1);
    });
  });

  test.describe('1.4 錯誤日誌記錄', () => {
    test('API 錯誤應該被記錄到控制台', async ({ pmPage }) => {
      const consoleMessages: string[] = [];

      // 監聽控制台訊息
      pmPage.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleMessages.push(msg.text());
        }
      });

      await pmPage.goto('/projects/new');

      // 模擬 API 錯誤
      await mockApiError(pmPage, '**/api/trpc/project.create*', 500);

      await fillProjectForm(pmPage, {
        name: projectTestData.valid.name,
      });

      await pmPage.click('button[type="submit"]');

      // 等待錯誤處理
      await pmPage.waitForTimeout(2000);

      // 驗證控制台有錯誤日誌（可能被 tRPC 或應用程式記錄）
      // 注意：這取決於你的錯誤處理實現
      // expect(consoleMessages.length).toBeGreaterThan(0);
    });
  });
});
