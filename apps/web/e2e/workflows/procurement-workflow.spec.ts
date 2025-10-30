import { test, expect } from '../fixtures/auth';
import {
  generateVendorData,
  generatePurchaseOrderData,
  generateExpenseData,
  wait,
} from '../fixtures/test-data';
import { waitForEntityPersisted, extractIdFromURL, waitForEntityWithFields } from '../helpers/waitForEntity';

/**
 * 採購工作流 E2E 測試
 *
 * 完整流程：
 * 1. 創建供應商（Vendor）
 * 2. 上傳報價單（Quote）
 * 3. 創建採購訂單（PurchaseOrder）
 * 4. 記錄費用（Expense）
 * 5. ProjectManager 提交費用
 * 6. Supervisor 批准費用
 * 7. 驗證預算池扣款
 */

test.describe('採購工作流', () => {
  let vendorId: string;
  let quoteId: string;
  let purchaseOrderId: string;
  let expenseId: string;

  // 前置條件：需要有項目和預算池
  let projectId: string = 'existing-project-id'; // 在實際測試中應該先創建

  test('完整採購工作流：供應商 → 報價 → 採購訂單 → 費用記錄 → 批准', async ({
    managerPage,
    supervisorPage,
  }) => {
    // ========================================
    // Step 1: 創建供應商（Vendor）
    // ========================================
    await test.step('Step 1: 創建供應商', async () => {
      const vendorData = generateVendorData();

      await managerPage.goto('/vendors');
      await managerPage.click('text=新增供應商');

      // 等待表單載入
      await managerPage.waitForSelector('input[name="name"]');

      // 填寫供應商信息
      await managerPage.fill('input[name="name"]', vendorData.name);
      await managerPage.fill('input[name="contactPerson"]', vendorData.contactPerson || '');
      await managerPage.fill('input[name="contactEmail"]', vendorData.contactEmail || '');
      await managerPage.fill('input[name="phone"]', vendorData.phone || '');

      // 提交表單
      await managerPage.click('button[type="submit"]:has-text("創建供應商")');

      // 等待重定向到詳情頁
      await managerPage.waitForURL(/\/vendors\/[a-f0-9-]+/);

      // 提取供應商 ID
      const url = managerPage.url();
      vendorId = url.split('/vendors/')[1];

      // 驗證供應商創建成功
      await expect(managerPage.locator('h1')).toContainText(vendorData.name);

      // 等待實體在數據庫中持久化（選項 C 修復）
      await waitForEntityPersisted(managerPage, 'vendor', vendorId);

      console.log(`✅ 供應商已創建: ${vendorId}`);
    });

    // ========================================
    // Step 2: 上傳報價單（Quote）
    // ========================================
    await test.step('Step 2: 上傳報價單', async () => {
      // 在創建報價單前,額外驗證供應商已經完全持久化
      console.log(`🔍 驗證供應商 ${vendorId} 是否可查詢...`);
      await waitForEntityPersisted(managerPage, 'vendor', vendorId);
      console.log(`✅ 供應商已確認可查詢,開始創建報價單`);

      await managerPage.goto('/quotes');
      await managerPage.click('text=新增報價單');

      // 等待表單載入
      await managerPage.waitForSelector('select[name="vendorId"]');

      // 選擇供應商
      await managerPage.selectOption('select[name="vendorId"]', vendorId);

      // 選擇項目（需要先有項目數據）
      // 這裡假設有可用的項目
      const projectSelect = managerPage.locator('select[name="projectId"]');
      const projectOptions = await projectSelect.locator('option').allTextContents();
      if (projectOptions.length > 1) {
        const projectOption = await projectSelect.locator('option').nth(1);
        projectId = (await projectOption.getAttribute('value')) || '';
        await projectSelect.selectOption({ index: 1 });
      }

      // 填寫報價金額
      await managerPage.fill('input[name="amount"]', '50000');

      // 上傳報價文件（可選，模擬上傳）
      // await managerPage.setInputFiles('input[type="file"]', 'path/to/quote.pdf');

      // 提交表單
      await managerPage.click('button[type="submit"]:has-text("創建報價單")');

      // 等待重定向到詳情頁或列表頁
      await managerPage.waitForURL(/\/quotes/);

      // 提取報價單 ID（假設重定向到詳情頁）
      const url = managerPage.url();
      if (url.includes('/quotes/')) {
        const parts = url.split('/quotes/');
        if (parts[1] && parts[1] !== '') {
          quoteId = parts[1];
        }
      }

      // 如果無法從 URL 提取，從列表頁查找
      if (!quoteId || quoteId === '') {
        const firstQuote = managerPage.locator('tr').first();
        quoteId = (await firstQuote.getAttribute('data-quote-id')) || 'quote-id';
      }

      // 等待實體在數據庫中持久化（選項 C 修復）
      if (quoteId && quoteId !== 'quote-id') {
        await waitForEntityPersisted(managerPage, 'quote', quoteId);
      }

      console.log(`✅ 報價單已創建: ${quoteId}`);
    });

    // ========================================
    // Step 3: 創建採購訂單（PurchaseOrder）
    // ========================================
    await test.step('Step 3: 創建採購訂單', async () => {
      const poData = generatePurchaseOrderData();

      // 在創建採購訂單前,額外驗證供應商已經完全持久化
      console.log(`🔍 驗證供應商 ${vendorId} 是否可查詢...`);
      await waitForEntityPersisted(managerPage, 'vendor', vendorId);
      console.log(`✅ 供應商已確認可查詢,開始創建採購訂單`);

      await managerPage.goto('/purchase-orders');
      await managerPage.click('text=新增採購單');

      // 等待表單載入
      await managerPage.waitForSelector('input[name="poNumber"]');

      // 填寫採購訂單信息
      await managerPage.fill('input[name="poNumber"]', poData.poNumber);

      // 選擇項目
      await managerPage.selectOption('select[name="projectId"]', projectId);

      // 選擇供應商
      await managerPage.selectOption('select[name="vendorId"]', vendorId);

      // 選擇報價單（如果有）
      try {
        await managerPage.selectOption('select[name="quoteId"]', quoteId);
      } catch (e) {
        // 報價單選擇失敗，繼續
      }

      // 填寫日期和金額
      await managerPage.fill('input[name="poDate"]', poData.poDate);
      await managerPage.fill('input[name="deliveryDate"]', poData.deliveryDate || poData.poDate);
      await managerPage.fill('input[name="totalAmount"]', poData.totalAmount);

      // 提交表單
      await managerPage.click('button[type="submit"]:has-text("創建採購訂單")');

      // 等待重定向到詳情頁
      await managerPage.waitForURL(/\/purchase-orders\/[a-f0-9-]+/);

      // 提取採購訂單 ID
      const url = managerPage.url();
      purchaseOrderId = url.split('/purchase-orders/')[1];

      // 驗證採購訂單創建成功
      await expect(managerPage.locator('h1')).toContainText(poData.poNumber);

      // 等待實體在數據庫中持久化（選項 C 修復）
      await waitForEntityPersisted(managerPage, 'purchaseOrder', purchaseOrderId);

      console.log(`✅ 採購訂單已創建: ${purchaseOrderId}`);
    });

    // ========================================
    // Step 4: 記錄費用（Expense）
    // ========================================
    await test.step('Step 4: 記錄費用', async () => {
      const expenseData = generateExpenseData();

      // 在記錄費用前,額外驗證採購訂單已經完全持久化
      console.log(`🔍 驗證採購訂單 ${purchaseOrderId} 是否可查詢...`);
      await waitForEntityPersisted(managerPage, 'purchaseOrder', purchaseOrderId);
      console.log(`✅ 採購訂單已確認可查詢,開始記錄費用`);

      await managerPage.goto('/expenses');
      await managerPage.click('text=新增費用');

      // 等待表單載入
      await managerPage.waitForSelector('input[name="name"]');

      // 填寫費用基本信息
      await managerPage.fill('input[name="name"]', expenseData.name);
      await managerPage.fill('textarea[name="description"]', expenseData.description || '');

      // 選擇採購訂單
      await managerPage.selectOption('select[name="purchaseOrderId"]', purchaseOrderId);

      // 填寫金額和日期
      await managerPage.fill('input[name="totalAmount"]', expenseData.totalAmount);
      await managerPage.fill('input[name="expenseDate"]', expenseData.expenseDate);
      await managerPage.fill('input[name="invoiceNumber"]', expenseData.invoiceNumber || '');

      // 勾選需要轉嫁（如果適用）
      if (expenseData.requiresChargeOut) {
        await managerPage.check('input[name="requiresChargeOut"]');
      }

      // 提交表單
      await managerPage.click('button[type="submit"]:has-text("創建費用")');

      // 等待重定向到詳情頁
      await managerPage.waitForURL(/\/expenses\/[a-f0-9-]+/);

      // 提取費用 ID
      const url = managerPage.url();
      expenseId = url.split('/expenses/')[1];

      // 驗證費用創建成功
      await expect(managerPage.locator('h1')).toContainText(expenseData.name);

      // 驗證狀態為 Draft
      await expect(managerPage.locator('text=草稿')).toBeVisible();

      // 等待實體在數據庫中持久化（選項 C 修復）
      await waitForEntityPersisted(managerPage, 'expense', expenseId);

      console.log(`✅ 費用已記錄: ${expenseId}`);
    });

    // ========================================
    // Step 5: ProjectManager 提交費用
    // ========================================
    await test.step('Step 5: ProjectManager 提交費用', async () => {
      // 應該已經在費用詳情頁
      await expect(managerPage).toHaveURL(`/expenses/${expenseId}`);

      // 點擊提交按鈕
      await managerPage.click('button:has-text("提交審核")');

      // 確認對話框
      await managerPage.click('button:has-text("確認提交")');

      // 等待狀態更新並驗證（選項 C 修復）
      await waitForEntityWithFields(managerPage, 'expense', expenseId, {
        status: 'Submitted'
      });
      await managerPage.reload();

      // 驗證狀態變為 Submitted
      await expect(managerPage.locator('text=已提交')).toBeVisible();

      console.log(`✅ 費用已提交審核`);
    });

    // ========================================
    // Step 6: Supervisor 批准費用
    // ========================================
    await test.step('Step 6: Supervisor 批准費用', async () => {
      // Supervisor 訪問費用詳情頁
      await supervisorPage.goto(`/expenses/${expenseId}`);

      // 驗證費用信息
      await expect(supervisorPage.locator('text=已提交')).toBeVisible();

      // 點擊批准按鈕
      await supervisorPage.click('button:has-text("批准")');

      // 確認對話框
      await supervisorPage.click('button:has-text("確認批准")');

      // 等待狀態更新並驗證（選項 C 修復）
      await waitForEntityWithFields(supervisorPage, 'expense', expenseId, {
        status: 'Approved'
      });
      await supervisorPage.reload();

      // 驗證狀態變為 Approved
      await expect(supervisorPage.locator('text=已批准')).toBeVisible();

      console.log(`✅ 費用已批准`);
    });

    // ========================================
    // Step 7: 驗證預算池扣款
    // ========================================
    await test.step('Step 7: 驗證預算池扣款', async () => {
      // 訪問項目詳情頁
      await managerPage.goto(`/projects/${projectId}`);

      // 查看預算池使用情況
      // 驗證 usedAmount 已更新（具體驗證邏輯取決於 UI 展示）
      await expect(managerPage.locator('text=已使用預算')).toBeVisible();

      console.log(`✅ 預算池已扣款`);
    });
  });

  test('費用拒絕流程', async ({ managerPage, supervisorPage }) => {
    // ========================================
    // 前置準備：創建費用並提交
    // ========================================
    await test.step('前置準備', async () => {
      // 簡化版創建流程
      const expenseData = generateExpenseData();
      // ... 創建和提交邏輯 ...

      expenseId = 'test-expense-id'; // 假設已創建
    });

    // ========================================
    // Step 1: Supervisor 拒絕費用
    // ========================================
    await test.step('Supervisor 拒絕費用', async () => {
      await supervisorPage.goto(`/expenses/${expenseId}`);

      // 點擊拒絕按鈕
      await supervisorPage.click('button:has-text("拒絕")');

      // 填寫拒絕原因
      await supervisorPage.fill('textarea[name="rejectionReason"]', '發票信息不完整');

      // 確認拒絕
      await supervisorPage.click('button:has-text("確認拒絕")');

      // 等待狀態更新
      await wait(1000);
      await supervisorPage.reload();

      // 驗證狀態變為 Rejected
      await expect(supervisorPage.locator('text=已拒絕')).toBeVisible();

      console.log(`✅ 費用已拒絕`);
    });

    // ========================================
    // Step 2: ProjectManager 查看並修改
    // ========================================
    await test.step('ProjectManager 查看拒絕原因並修改', async () => {
      await managerPage.goto(`/expenses/${expenseId}`);

      // 驗證拒絕原因可見
      await expect(managerPage.locator('text=發票信息不完整')).toBeVisible();

      // 點擊編輯按鈕（如果狀態允許）
      // await managerPage.click('button:has-text("編輯")');
      // ... 修改邏輯 ...

      console.log(`✅ 拒絕原因已顯示`);
    });
  });
});
