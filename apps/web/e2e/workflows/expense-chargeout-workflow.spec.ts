import { test, expect } from '../fixtures/auth';
import { generateExpenseData, generateChargeOutData, wait } from '../fixtures/test-data';

/**
 * 費用轉嫁工作流 E2E 測試
 *
 * 完整流程：
 * 1. 創建需要轉嫁的費用（Expense with requiresChargeOut=true）
 * 2. 批准費用
 * 3. 創建費用轉嫁（ChargeOut）
 * 4. 選擇費用明細
 * 5. ProjectManager 提交 ChargeOut
 * 6. Supervisor 確認 ChargeOut
 * 7. 標記為已付款（Paid）
 * 8. 驗證完整流程
 */

test.describe('費用轉嫁工作流', () => {
  let expenseId: string;
  let chargeOutId: string;

  // 前置條件：需要有項目、採購訂單、OpCo
  let projectId: string = 'existing-project-id';
  let purchaseOrderId: string = 'existing-po-id';
  let opCoId: string = 'existing-opco-id';

  test('完整費用轉嫁工作流：費用 → ChargeOut → 確認 → 付款', async ({
    managerPage,
    supervisorPage,
  }) => {
    // ========================================
    // Step 1: 創建需要轉嫁的費用
    // ========================================
    await test.step('Step 1: 創建需要轉嫁的費用', async () => {
      const expenseData = generateExpenseData();

      await managerPage.goto('/expenses');
      await managerPage.click('text=新增費用');

      // 等待表單載入
      await managerPage.waitForSelector('input[name="name"]');

      // 填寫費用基本信息
      await managerPage.fill('input[name="name"]', expenseData.name);
      await managerPage.fill('textarea[name="description"]', expenseData.description || '');

      // 選擇採購訂單（需要先選擇項目以載入 PO）
      const projectSelect = managerPage.locator('select[name="projectId"]');
      const projectOptions = await projectSelect.locator('option').allTextContents();
      if (projectOptions.length > 1) {
        await projectSelect.selectOption({ index: 1 });
        projectId = await projectSelect.inputValue();
        await wait(500); // 等待 PO 列表載入
      }

      // 選擇採購訂單
      const poSelect = managerPage.locator('select[name="purchaseOrderId"]');
      const poOptions = await poSelect.locator('option').allTextContents();
      if (poOptions.length > 1) {
        await poSelect.selectOption({ index: 1 });
        purchaseOrderId = await poSelect.inputValue();
      }

      // 填寫金額和日期
      await managerPage.fill('input[name="totalAmount"]', expenseData.totalAmount);
      await managerPage.fill('input[name="expenseDate"]', expenseData.expenseDate);
      await managerPage.fill('input[name="invoiceNumber"]', expenseData.invoiceNumber || '');

      // ⭐ 關鍵：勾選需要轉嫁
      await managerPage.check('input[name="requiresChargeOut"]');

      // 提交表單
      await managerPage.click('button[type="submit"]:has-text("創建費用")');

      // 等待重定向到詳情頁
      await managerPage.waitForURL(/\/expenses\/[a-f0-9-]+/);

      // 提取費用 ID
      const url = managerPage.url();
      expenseId = url.split('/expenses/')[1];

      // 驗證費用創建成功
      await expect(managerPage.locator('h1')).toContainText(expenseData.name);
      await expect(managerPage.locator('text=需要轉嫁')).toBeVisible();

      console.log(`✅ 需要轉嫁的費用已創建: ${expenseId}`);
    });

    // ========================================
    // Step 2: 提交並批准費用
    // ========================================
    await test.step('Step 2: 提交並批准費用', async () => {
      // ProjectManager 提交
      await managerPage.click('button:has-text("提交審核")');
      await managerPage.click('button:has-text("確認提交")');
      await wait(1000);
      await managerPage.reload();
      await expect(managerPage.locator('text=已提交')).toBeVisible();

      console.log(`✅ 費用已提交審核`);

      // Supervisor 批准
      await supervisorPage.goto(`/expenses/${expenseId}`);
      await supervisorPage.click('button:has-text("批准")');
      await supervisorPage.click('button:has-text("確認批准")');
      await wait(1000);
      await supervisorPage.reload();
      await expect(supervisorPage.locator('text=已批准')).toBeVisible();

      console.log(`✅ 費用已批准`);
    });

    // ========================================
    // Step 3: 創建費用轉嫁（ChargeOut）
    // ========================================
    await test.step('Step 3: 創建費用轉嫁', async () => {
      const chargeOutData = generateChargeOutData();

      await managerPage.goto('/charge-outs');
      await managerPage.click('text=新增 ChargeOut');

      // 等待表單載入
      await managerPage.waitForSelector('input[name="name"]');

      // 填寫 ChargeOut 基本信息
      await managerPage.fill('input[name="name"]', chargeOutData.name);
      await managerPage.fill('textarea[name="description"]', chargeOutData.description || '');

      // 選擇項目
      await managerPage.selectOption('select[name="projectId"]', projectId);
      await wait(500); // 等待費用列表載入

      // 選擇 OpCo
      const opCoSelect = managerPage.locator('select[name="opCoId"]');
      const opCoOptions = await opCoSelect.locator('option').allTextContents();
      if (opCoOptions.length > 1) {
        await opCoSelect.selectOption({ index: 1 });
        opCoId = await opCoSelect.inputValue();
      }

      console.log(`✅ ChargeOut 基本信息已填寫`);
    });

    // ========================================
    // Step 4: 選擇費用明細
    // ========================================
    await test.step('Step 4: 選擇費用明細', async () => {
      // 等待費用列表載入
      await wait(500);

      // 選擇第一筆費用（應該是我們剛創建的）
      const expenseSelect = managerPage.locator('select[name*="expenseId"]').first();
      const expenseOptions = await expenseSelect.locator('option').allTextContents();

      if (expenseOptions.length > 1) {
        // 選擇我們創建的費用
        await expenseSelect.selectOption({ index: 1 });

        // 驗證金額自動填充
        const amountInput = managerPage.locator('input[name*="amount"]').first();
        const amount = await amountInput.inputValue();
        expect(parseFloat(amount)).toBeGreaterThan(0);

        console.log(`✅ 費用明細已選擇，金額: ${amount}`);
      }

      // 可以添加更多費用項目（如果需要）
      // await managerPage.click('button:has-text("新增費用項目")');

      // 提交表單
      await managerPage.click('button[type="submit"]:has-text("創建 ChargeOut")');

      // 等待重定向到詳情頁
      await managerPage.waitForURL(/\/charge-outs\/[a-f0-9-]+/);

      // 提取 ChargeOut ID
      const url = managerPage.url();
      chargeOutId = url.split('/charge-outs/')[1];

      // 驗證 ChargeOut 創建成功
      await expect(managerPage.locator('h1')).toContainText('E2E_ChargeOut');
      await expect(managerPage.locator('text=草稿')).toBeVisible();

      console.log(`✅ ChargeOut 已創建: ${chargeOutId}`);
    });

    // ========================================
    // Step 5: ProjectManager 提交 ChargeOut
    // ========================================
    await test.step('Step 5: ProjectManager 提交 ChargeOut', async () => {
      // 應該已經在 ChargeOut 詳情頁
      await expect(managerPage).toHaveURL(`/charge-outs/${chargeOutId}`);

      // 驗證費用明細顯示
      await expect(managerPage.locator('table tbody tr')).toHaveCount({ min: 1 });

      // 驗證總金額顯示
      await expect(managerPage.locator('text=總金額')).toBeVisible();

      // 點擊提交按鈕
      await managerPage.click('button:has-text("提交審核")');

      // 確認對話框
      await managerPage.click('button:has-text("確認提交")');

      // 等待狀態更新
      await wait(1000);
      await managerPage.reload();

      // 驗證狀態變為 Submitted
      await expect(managerPage.locator('text=已提交')).toBeVisible();

      console.log(`✅ ChargeOut 已提交審核`);
    });

    // ========================================
    // Step 6: Supervisor 確認 ChargeOut
    // ========================================
    await test.step('Step 6: Supervisor 確認 ChargeOut', async () => {
      // Supervisor 訪問 ChargeOut 詳情頁
      await supervisorPage.goto(`/charge-outs/${chargeOutId}`);

      // 驗證 ChargeOut 信息
      await expect(supervisorPage.locator('text=已提交')).toBeVisible();

      // 驗證費用明細
      await expect(supervisorPage.locator('table tbody tr')).toHaveCount({ min: 1 });

      // 驗證項目和 OpCo 信息
      await expect(supervisorPage.locator('text=項目信息')).toBeVisible();
      await expect(supervisorPage.locator('text=營運公司')).toBeVisible();

      // 點擊確認按鈕
      await supervisorPage.click('button:has-text("確認")');

      // 確認對話框
      await supervisorPage.click('button:has-text("確認"):last-child'); // 使用 last-child 選擇對話框中的確認按鈕

      // 等待狀態更新
      await wait(1000);
      await supervisorPage.reload();

      // 驗證狀態變為 Confirmed
      await expect(supervisorPage.locator('text=已確認')).toBeVisible();

      console.log(`✅ ChargeOut 已確認`);
    });

    // ========================================
    // Step 7: 標記為已付款（Paid）
    // ========================================
    await test.step('Step 7: 標記為已付款', async () => {
      // ProjectManager 或 Supervisor 可以標記為已付款
      await managerPage.goto(`/charge-outs/${chargeOutId}`);

      // 驗證已確認狀態
      await expect(managerPage.locator('text=已確認')).toBeVisible();

      // 點擊標記為已付款按鈕
      await managerPage.click('button:has-text("標記為已付款")');

      // 確認對話框
      await managerPage.click('button:has-text("確認標記")');

      // 等待狀態更新
      await wait(1000);
      await managerPage.reload();

      // 驗證狀態變為 Paid
      await expect(managerPage.locator('text=已付款')).toBeVisible();

      // 驗證付款日期已記錄
      await expect(managerPage.locator('text=付款日期')).toBeVisible();

      console.log(`✅ ChargeOut 已標記為已付款`);
    });

    // ========================================
    // Step 8: 驗證完整流程
    // ========================================
    await test.step('Step 8: 驗證完整流程', async () => {
      // 驗證 ChargeOut 最終狀態
      await expect(managerPage).toHaveURL(`/charge-outs/${chargeOutId}`);
      await expect(managerPage.locator('text=已付款')).toBeVisible();

      // 驗證確認人信息
      await expect(managerPage.locator('text=確認人')).toBeVisible();

      // 驗證時間軸完整性
      await expect(managerPage.locator('text=創建時間')).toBeVisible();
      await expect(managerPage.locator('text=確認時間')).toBeVisible();

      // 返回列表頁驗證
      await managerPage.goto('/charge-outs');
      await expect(managerPage.locator(`text=E2E_ChargeOut`).first()).toBeVisible();
      await expect(managerPage.locator('text=已付款').first()).toBeVisible();

      console.log(`✅ 完整費用轉嫁工作流驗證通過`);
    });
  });

  test('ChargeOut 拒絕流程', async ({ managerPage, supervisorPage }) => {
    // ========================================
    // 前置準備：創建 ChargeOut 並提交
    // ========================================
    await test.step('前置準備', async () => {
      const chargeOutData = generateChargeOutData();
      // ... 創建和提交邏輯 ...

      chargeOutId = 'test-chargeout-id'; // 假設已創建
    });

    // ========================================
    // Step 1: Supervisor 拒絕 ChargeOut
    // ========================================
    await test.step('Supervisor 拒絕 ChargeOut', async () => {
      await supervisorPage.goto(`/charge-outs/${chargeOutId}`);

      // 點擊拒絕按鈕
      await supervisorPage.click('button:has-text("拒絕")');

      // 確認拒絕
      await supervisorPage.click('button:has-text("確認"):last-child');

      // 等待狀態更新
      await wait(1000);
      await supervisorPage.reload();

      // 驗證狀態變為 Rejected
      await expect(supervisorPage.locator('text=已拒絕')).toBeVisible();

      console.log(`✅ ChargeOut 已拒絕`);
    });

    // ========================================
    // Step 2: ProjectManager 查看並刪除
    // ========================================
    await test.step('ProjectManager 查看拒絕狀態並刪除', async () => {
      await managerPage.goto(`/charge-outs/${chargeOutId}`);

      // 驗證拒絕狀態
      await expect(managerPage.locator('text=已拒絕')).toBeVisible();

      // 拒絕狀態下可以刪除
      await managerPage.click('button:has-text("刪除")');
      await managerPage.click('button:has-text("確認刪除")');

      // 等待重定向到列表頁
      await managerPage.waitForURL('/charge-outs');

      console.log(`✅ 已拒絕的 ChargeOut 已刪除`);
    });
  });

  test('ChargeOut 多費用項目處理', async ({ managerPage }) => {
    // ========================================
    // 創建包含多個費用項目的 ChargeOut
    // ========================================
    await test.step('創建多費用項目 ChargeOut', async () => {
      const chargeOutData = generateChargeOutData();

      await managerPage.goto('/charge-outs/new');
      await managerPage.waitForSelector('input[name="name"]');

      // 填寫基本信息
      await managerPage.fill('input[name="name"]', chargeOutData.name);

      // 選擇項目
      const projectSelect = managerPage.locator('select[name="projectId"]');
      await projectSelect.selectOption({ index: 1 });
      await wait(500);

      // 選擇 OpCo
      const opCoSelect = managerPage.locator('select[name="opCoId"]');
      await opCoSelect.selectOption({ index: 1 });

      // 添加第一個費用項目
      const firstExpenseSelect = managerPage.locator('select[name*="expenseId"]').first();
      await firstExpenseSelect.selectOption({ index: 1 });

      // 新增第二個費用項目
      await managerPage.click('button:has-text("新增費用項目")');
      const secondExpenseSelect = managerPage.locator('select[name*="expenseId"]').nth(1);
      const secondExpenseOptions = await secondExpenseSelect.locator('option').allTextContents();

      if (secondExpenseOptions.length > 2) {
        await secondExpenseSelect.selectOption({ index: 2 }); // 選擇不同的費用
      }

      // 驗證總金額自動計算
      await expect(managerPage.locator('text=總金額')).toBeVisible();

      // 提交
      await managerPage.click('button[type="submit"]:has-text("創建 ChargeOut")');
      await managerPage.waitForURL(/\/charge-outs\/[a-f0-9-]+/);

      // 驗證費用明細數量
      await expect(managerPage.locator('table tbody tr')).toHaveCount(2);

      console.log(`✅ 多費用項目 ChargeOut 已創建`);
    });
  });
});
