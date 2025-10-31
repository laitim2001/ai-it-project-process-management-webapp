import { test, expect } from '../fixtures/auth';
import { generateExpenseData, generateChargeOutData, wait } from '../fixtures/test-data';
import { waitForEntityPersisted, extractIdFromURL, waitForEntityWithFields } from '../helpers/waitForEntity';

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
    // Step 1: 創建需要轉嫁的費用（純 API 方式 - Module 5 表頭明細）
    // ========================================
    await test.step('Step 1: 創建需要轉嫁的費用', async () => {
      const expenseData = generateExpenseData();

      console.log('🔧 使用 API 直接創建 Expense（避免 Module 5 表單複雜性和 ExpensesPage HotReload）');

      // 獲取可用的採購訂單（包含 project 信息）
      const purchaseOrdersData = await managerPage.evaluate(async () => {
        const res = await fetch(
          '/api/trpc/purchaseOrder.getAll?input=' +
            encodeURIComponent(JSON.stringify({ json: { page: 1, limit: 100 } }))
        );
        const result = await res.json();
        return result.result?.data?.json?.items || [];
      });

      if (purchaseOrdersData.length === 0) {
        throw new Error('沒有可用的 PurchaseOrder');
      }

      // 從 PurchaseOrder 獲取正確的 projectId（確保一致性）
      const selectedPO = purchaseOrdersData[0];
      purchaseOrderId = selectedPO.id;
      projectId = selectedPO.projectId; // ⚠️ 重要：使用 PO 的 projectId 確保一致性

      console.log(`✅ 選擇 PurchaseOrder: ${purchaseOrderId}`);
      console.log(`✅ 使用 PO 的 Project: ${projectId}`);

      // 🔧 使用 API 創建 Expense（Module 5 表頭明細結構）
      const createApiUrl = '/api/trpc/expense.create';
      const expenseResult = await managerPage.evaluate(
        async ([url, data, projId, poId]) => {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              json: {
                name: data.name,
                description: data.description || 'E2E 測試費用（需要轉嫁）',
                purchaseOrderId: poId,
                projectId: projId,
                invoiceNumber: data.invoiceNumber,
                invoiceDate: data.expenseDate || new Date().toISOString(),
                expenseDate: data.expenseDate || new Date().toISOString(),
                requiresChargeOut: true, // ⭐ 關鍵：需要轉嫁
                isOperationMaint: false,
                items: [
                  {
                    itemName: '測試費用項目 1',
                    description: '用於 ChargeOut 測試',
                    amount: 5000,
                    category: 'Software',
                    sortOrder: 0,
                  },
                ],
              },
            }),
          });

          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Create Expense API error: ${res.status} - ${errorText}`);
          }

          return await res.json();
        },
        [createApiUrl, expenseData, projectId, purchaseOrderId]
      );

      // 提取 Expense ID
      expenseId = expenseResult.result.data.json.id;
      console.log(`✅ API 創建 Expense 成功: ${expenseId}`);

      // 使用 API 驗證 Expense 已持久化
      await waitForEntityWithFields(managerPage, 'expense', expenseId, {
        status: 'Draft',
      });

      console.log(`✅ 需要轉嫁的費用已創建並驗證: ${expenseId}`);
    });

    // ========================================
    // Step 2: 提交並批准費用（純 API 方式）
    // ========================================
    await test.step('Step 2: 提交並批准費用', async () => {
      console.log('🔧 使用 API 提交費用...');

      // ProjectManager 提交
      const submitApiUrl = '/api/trpc/expense.submit';
      await managerPage.evaluate(
        async ([url, id]) => {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ json: { id } }),
          });
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Submit API error: ${res.status} - ${errorText}`);
          }
          return await res.json();
        },
        [submitApiUrl, expenseId]
      );

      // 等待狀態更新為 Submitted
      await waitForEntityWithFields(managerPage, 'expense', expenseId, { status: 'Submitted' });
      console.log(`✅ 費用已提交審核`);

      // Supervisor 批准
      console.log('🔧 使用 API 批准費用...');
      const approveApiUrl = '/api/trpc/expense.approve';
      const approveResult = await supervisorPage.evaluate(
        async ([url, id]) => {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ json: { id } }),
          });
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Approve API error: ${res.status} - ${errorText}`);
          }
          return await res.json();
        },
        [approveApiUrl, expenseId]
      );

      console.log('✅ API 批准調用成功');

      // 等待狀態更新為 Approved
      await waitForEntityWithFields(supervisorPage, 'expense', expenseId, { status: 'Approved' });

      console.log(`✅ 費用已批准（API 驗證通過）`);
    });

    // ========================================
    // Step 3: 創建費用轉嫁（ChargeOut）
    // ========================================
    // Step 3: 創建 OpCo 並通過 API 創建 ChargeOut
    // ========================================
    await test.step('Step 3: 創建 OpCo 並通過 API 創建 ChargeOut', async () => {
      console.log('🔧 使用 API 直接創建 ChargeOut（避免表單複雜性和 OpCo 資料缺失問題）');

      // 在創建 ChargeOut 前，驗證費用已經完全持久化
      console.log(`🔍 驗證費用 ${expenseId} 是否可查詢...`);
      await waitForEntityPersisted(managerPage, 'expense', expenseId);
      console.log(`✅ 費用已確認可查詢，開始創建 OpCo 和 ChargeOut`);

      // Step 3.1: 創建 OpCo（資料庫中沒有 OpCo 資料）
      console.log('🏢 Step 3.1: 創建 OpCo via API (Supervisor 權限)...');
      const createOpCoApiUrl = '/api/trpc/operatingCompany.create';
      const opCoData = {
        code: `E2E_OPCO_${Date.now()}`,
        name: 'E2E 測試營運公司',
        description: '用於 E2E ChargeOut 測試的營運公司',
      };

      const opCoResult = await supervisorPage.evaluate(
        async ([url, data]) => {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ json: data }),
          });
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Create OpCo API error: ${res.status} - ${errorText}`);
          }
          return await res.json();
        },
        [createOpCoApiUrl, opCoData]
      );

      opCoId = opCoResult.result.data.json.id;
      console.log(`✅ OpCo 創建成功: ${opCoId} (${opCoData.code})`);

      // Step 3.2: 創建 ChargeOut via API
      console.log('💰 Step 3.2: 創建 ChargeOut via API (ProjectManager 權限)...');
      const createChargeOutApiUrl = '/api/trpc/chargeOut.create';
      const chargeOutData = {
        name: `E2E_ChargeOut_${Date.now()}`,
        description: 'E2E 測試費用轉嫁',
        projectId: projectId,
        opCoId: opCoId,
        items: [
          {
            expenseId: expenseId,
            amount: 5000,
            description: 'E2E 測試費用項目',
            sortOrder: 0,
          },
        ],
      };

      const chargeOutResult = await managerPage.evaluate(
        async ([url, data]) => {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ json: data }),
          });
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Create ChargeOut API error: ${res.status} - ${errorText}`);
          }
          return await res.json();
        },
        [createChargeOutApiUrl, chargeOutData]
      );

      chargeOutId = chargeOutResult.result.data.json.id;
      console.log(`✅ ChargeOut 創建成功: ${chargeOutId}`);

      // 驗證 ChargeOut 狀態
      await waitForEntityWithFields(managerPage, 'chargeOut', chargeOutId, { status: 'Draft' });
      console.log(`✅ ChargeOut 已創建並驗證: ${chargeOutId} (status: Draft)`);
    });

    // ========================================
    // Step 5: ProjectManager 提交 ChargeOut
    // ========================================
    await test.step('Step 5: ProjectManager 提交 ChargeOut', async () => {
      // 在提交 ChargeOut 前,額外驗證 ChargeOut 已經完全持久化
      console.log(`🔍 驗證 ChargeOut ${chargeOutId} 是否可查詢...`);
      await waitForEntityPersisted(managerPage, 'chargeOut', chargeOutId);
      console.log(`✅ ChargeOut 已確認可查詢,開始提交審核`);

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

      // 等待狀態更新為 PendingConfirmation
      await waitForEntityWithFields(managerPage, 'chargeOut', chargeOutId, { status: 'PendingConfirmation' });

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

      // 等待狀態更新為 Confirmed
      await waitForEntityWithFields(supervisorPage, 'chargeOut', chargeOutId, { status: 'Confirmed' });

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

      // 等待狀態更新為 Paid
      await waitForEntityWithFields(managerPage, 'chargeOut', chargeOutId, { status: 'Paid' });

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

      // 等待狀態更新為 Rejected
      await waitForEntityWithFields(supervisorPage, 'chargeOut', chargeOutId, { status: 'Rejected' });

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
