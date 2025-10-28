/**
 * API 健康檢查測試腳本
 *
 * 功能：
 * - 測試所有 8 個核心 API 模塊
 * - 驗證業務邏輯和數據同步
 * - 生成測試報告
 * - 自動清理測試數據
 *
 * 執行命令：pnpm test:api
 */

import { createTestCaller, createSupervisorCaller, runTest, cleanupTestData, printTestSummary, testStats, colors, assert, assertEqual, assertGreaterThan, assertNotNull, assertArrayLength } from './test-helpers';
import { createBudgetPoolData, createProjectData, createProposalData, createVendorData, createPurchaseOrderData, createExpenseData, createOpCoData, createOMExpenseData, createChargeOutData } from './test-data';

// 測試數據 ID 存儲
const testIds: Record<string, string> = {};

/**
 * Module 1: BudgetPool API 測試
 */
async function testBudgetPoolAPI() {
  console.log(colors.bold('\n📦 Module 1: BudgetPool API'));

  const managerCaller = await createTestCaller();

  await runTest('BudgetPool', 'create: 創建預算池（含 3 個 Categories）', async () => {
    const data = createBudgetPoolData();
    const result = await managerCaller.budgetPool.create(data);

    assertNotNull(result, '創建結果不應為 null');
    assertEqual(result.name, data.name, 'name 應匹配');
    assertEqual(result.financialYear, data.financialYear, '財務年度應匹配');
    assertArrayLength(result.categories, 3, '應有 3 個 categories');

    // 驗證 totalAmount 自動計算
    const expectedTotal = data.categories.reduce((sum, cat) => sum + cat.totalAmount, 0);
    assertEqual(result.totalAmount, expectedTotal, 'totalAmount 應自動計算');

    testIds.budgetPoolId = result.id;
    testIds.budgetCategoryId = result.categories[0]!.id;
  });

  await runTest('BudgetPool', 'getById: 獲取預算池詳情（含 Categories）', async () => {
    const result = await managerCaller.budgetPool.getById({ id: testIds.budgetPoolId });

    assertNotNull(result, '結果不應為 null');
    assertEqual(result.id, testIds.budgetPoolId, 'id 應匹配');
    assertArrayLength(result.categories, 3, '應有 3 個 categories');
  });

  await runTest('BudgetPool', 'update: 更新預算池和 Categories', async () => {
    const data = await managerCaller.budgetPool.getById({ id: testIds.budgetPoolId });
    const result = await managerCaller.budgetPool.update({
      id: testIds.budgetPoolId,
      name: data.name + ' (Updated)',
      financialYear: data.financialYear,
      categories: data.categories.map((cat) => ({
        id: cat.id,
        categoryName: cat.categoryName,
        categoryCode: cat.categoryCode,
        totalAmount: cat.totalAmount + 10000,
        sortOrder: cat.sortOrder,
      })),
    });

    assertEqual(result.name, data.name + ' (Updated)', 'name 應更新');
  });

  await runTest('BudgetPool', 'getAll: 列表查詢（分頁）', async () => {
    const result = await managerCaller.budgetPool.getAll({
      page: 1,
      limit: 10,
    });

    assertNotNull(result, '結果不應為 null');
    assertGreaterThan(result.total, 0, 'total 應大於 0');
  });
}

/**
 * Module 2: Project API 測試
 */
async function testProjectAPI() {
  console.log(colors.bold('\n📁 Module 2: Project API'));

  const managerCaller = await createTestCaller();
  const supervisorCaller = await createSupervisorCaller();

  // 獲取 Manager 和 Supervisor ID
  const manager = await managerCaller.user.getMe();
  const supervisor = await supervisorCaller.user.getMe();

  await runTest('Project', 'create: 創建項目（關聯 BudgetCategory）', async () => {
    const data = createProjectData(testIds.budgetPoolId, testIds.budgetCategoryId, manager.id, supervisor.id);
    const result = await managerCaller.project.create(data);

    assertNotNull(result, '創建結果不應為 null');
    assertEqual(result.name, data.name, 'name 應匹配');
    assertEqual(result.budgetCategoryId, testIds.budgetCategoryId, 'budgetCategoryId 應匹配');

    testIds.projectId = result.id;
  });

  await runTest('Project', 'getById: 獲取項目詳情', async () => {
    const result = await managerCaller.project.getById({ id: testIds.projectId });

    assertNotNull(result, '結果不應為 null');
    assertEqual(result.id, testIds.projectId, 'id 應匹配');
  });

  await runTest('Project', 'getBudgetUsage: 預算使用情況', async () => {
    const result = await managerCaller.project.getBudgetUsage({ id: testIds.projectId });

    assertNotNull(result, '結果不應為 null');
    assert(typeof result.usedBudget === 'number', 'usedBudget 應為數字');
  });
}

/**
 * Module 3: BudgetProposal API 測試
 */
async function testBudgetProposalAPI() {
  console.log(colors.bold('\n📄 Module 3: BudgetProposal API'));

  const managerCaller = await createTestCaller();
  const supervisorCaller = await createSupervisorCaller();

  await runTest('BudgetProposal', 'create: 創建預算提案', async () => {
    const data = createProposalData(testIds.projectId);
    const result = await managerCaller.budgetProposal.create(data);

    assertNotNull(result, '創建結果不應為 null');
    assertEqual(result.title, data.title, 'title 應匹配');
    assertEqual(result.status, 'Draft', '初始狀態應為 Draft');

    testIds.proposalId = result.id;
  });

  await runTest('BudgetProposal', 'submit: 提交審批', async () => {
    const result = await managerCaller.budgetProposal.submit({ id: testIds.proposalId });

    assertEqual(result.status, 'PendingApproval', '狀態應為 PendingApproval');
  });

  await runTest('BudgetProposal', 'approve: 批准（自動同步 approvedBudget 到 Project）⭐', async () => {
    const result = await supervisorCaller.budgetProposal.approve({
      id: testIds.proposalId,
      approvedAmount: 100000,
      comments: '批准',
    });

    assertEqual(result.status, 'Approved', '狀態應為 Approved');

    // 驗證 Project.approvedBudget 已更新
    const project = await managerCaller.project.getById({ id: testIds.projectId });
    assertEqual(project.approvedBudget, 100000, 'Project.approvedBudget 應已同步');
  });
}

/**
 * Module 4: PurchaseOrder API 測試
 */
async function testPurchaseOrderAPI() {
  console.log(colors.bold('\n🛒 Module 4: PurchaseOrder API'));

  const managerCaller = await createTestCaller();
  const supervisorCaller = await createSupervisorCaller();

  await runTest('PurchaseOrder', '前置: 創建 Vendor', async () => {
    const data = createVendorData();
    const result = await managerCaller.vendor.create(data);

    testIds.vendorId = result.id;
  });

  await runTest('PurchaseOrder', 'create: 創建採購單（表頭 + 3 個明細）', async () => {
    const data = createPurchaseOrderData(testIds.projectId, testIds.vendorId);
    const result = await managerCaller.purchaseOrder.create(data);

    assertNotNull(result, '創建結果不應為 null');
    assertEqual(result.name, data.name, 'name 應匹配');
    assertArrayLength(result.items, 3, '應有 3 個明細');

    // 驗證 totalAmount 自動計算
    const expectedTotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    assertEqual(result.totalAmount, expectedTotal, 'totalAmount 應自動計算');

    testIds.purchaseOrderId = result.id;
  });

  await runTest('PurchaseOrder', 'getById: 獲取採購單詳情（含明細）', async () => {
    const result = await managerCaller.purchaseOrder.getById({ id: testIds.purchaseOrderId });

    assertNotNull(result, '結果不應為 null');
    assertArrayLength(result.items, 3, '應有 3 個明細');
  });

  await runTest('PurchaseOrder', 'update: 更新明細', async () => {
    const data = await managerCaller.purchaseOrder.getById({ id: testIds.purchaseOrderId });
    const result = await managerCaller.purchaseOrder.update({
      id: testIds.purchaseOrderId,
      name: data.name,
      description: data.description,
      projectId: data.projectId,
      vendorId: data.vendorId,
      date: data.date,
      items: data.items.map((item) => ({
        id: item.id,
        itemName: item.itemName,
        description: item.description || '',
        quantity: item.quantity + 1,
        unitPrice: item.unitPrice,
        sortOrder: item.sortOrder,
      })),
    });

    assertGreaterThan(result.totalAmount, data.totalAmount, 'totalAmount 應增加');
  });

  await runTest('PurchaseOrder', 'submit: 提交採購單', async () => {
    const result = await managerCaller.purchaseOrder.submit({ id: testIds.purchaseOrderId });

    assertEqual(result.status, 'Submitted', '狀態應為 Submitted');
  });

  await runTest('PurchaseOrder', 'approve: 批准採購單（Supervisor）', async () => {
    const result = await supervisorCaller.purchaseOrder.approve({
      id: testIds.purchaseOrderId,
      comment: '批准',
    });

    assertEqual(result.status, 'Approved', '狀態應為 Approved');
  });
}

/**
 * Module 5: Expense API 測試
 */
async function testExpenseAPI() {
  console.log(colors.bold('\n💰 Module 5: Expense API'));

  const managerCaller = await createTestCaller();
  const supervisorCaller = await createSupervisorCaller();

  await runTest('Expense', 'create: 創建費用記錄（表頭 + 明細）', async () => {
    const data = createExpenseData(testIds.projectId, testIds.purchaseOrderId, testIds.budgetCategoryId, testIds.vendorId);
    const result = await managerCaller.expense.create(data);

    assertNotNull(result, '創建結果不應為 null');
    // Expense 通過 purchaseOrder 間接關聯 project，沒有直接 projectId 字段
    assertEqual(result.purchaseOrderId, testIds.purchaseOrderId, 'purchaseOrderId 應匹配');
    assertNotNull(result.purchaseOrder, '應包含 purchaseOrder');
    assertNotNull(result.purchaseOrder.project, '應包含 project');
    assertEqual(result.purchaseOrder.project.id, testIds.projectId, 'project.id 應匹配');
    assertEqual(result.status, 'Draft', '初始狀態應為 Draft');
    assertGreaterThan(result.totalAmount, 0, '總金額應大於 0');

    testIds.expenseId = result.id;
  });

  await runTest('Expense', 'getById: 獲取費用詳情（含明細）', async () => {
    const result = await managerCaller.expense.getById({ id: testIds.expenseId });

    assertNotNull(result, '結果不應為 null');
    assert(Array.isArray(result.items), '應包含 items');
    // 驗證通過 purchaseOrder 關聯到 project
    assertNotNull(result.purchaseOrder, '應包含 purchaseOrder');
    assertNotNull(result.purchaseOrder.project, '應包含 project（通過 purchaseOrder）');
  });

  await runTest('Expense', 'submit: 提交費用', async () => {
    const result = await managerCaller.expense.submit({ id: testIds.expenseId });
    // Expense 使用 'Submitted' 狀態，與 BudgetProposal 的 'PendingApproval' 不同
    assertEqual(result.status, 'Submitted', '狀態應為 Submitted');
  });

  await runTest('Expense', 'approve: 批准費用（自動更新 BudgetCategory.usedAmount）⭐', async () => {
    // 記錄批准前的 usedAmount
    const categoryBefore = await managerCaller.budgetPool.getById({ id: testIds.budgetPoolId });
    const categoryBeforeUsed = categoryBefore.categories.find(
      (c: any) => c.id === testIds.budgetCategoryId
    )?.usedAmount || 0;

    const result = await supervisorCaller.expense.approve({
      id: testIds.expenseId,
      comment: '批准測試費用',
    });

    assertEqual(result.status, 'Approved', '狀態應為 Approved');

    // 驗證 BudgetCategory.usedAmount 已更新
    const categoryAfter = await managerCaller.budgetPool.getById({ id: testIds.budgetPoolId });
    const categoryAfterUsed = categoryAfter.categories.find(
      (c: any) => c.id === testIds.budgetCategoryId
    )?.usedAmount || 0;

    assertEqual(
      categoryAfterUsed,
      categoryBeforeUsed + result.totalAmount,
      'BudgetCategory.usedAmount 應已增加'
    );
  });
}

/**
 * Module 6: OMExpense API 測試
 */
async function testOMExpenseAPI() {
  console.log(colors.bold('\n🔧 Module 6: OMExpense API'));

  const supervisorCaller = await createSupervisorCaller();

  await runTest('OMExpense', '前置: 創建 OperatingCompany', async () => {
    const data = createOpCoData();
    const result = await supervisorCaller.operatingCompany.create(data);

    testIds.opCoId = result.id;
  });

  await runTest('OMExpense', 'create: 創建 OM 費用（自動初始化 12 個月度記錄）⭐', async () => {
    const data = createOMExpenseData(testIds.opCoId, testIds.vendorId);
    const result = await supervisorCaller.omExpense.create(data);

    assertNotNull(result, '創建結果不應為 null');
    assertArrayLength(result.monthlyRecords, 12, '應自動創建 12 個月度記錄');
  });

  await runTest('OMExpense', 'getById: 獲取 OM 費用詳情（含月度記錄）', async () => {
    const omExpenses = await supervisorCaller.omExpense.getAll({});
    const testOMExpense = omExpenses.items.find((item: any) => item.name.startsWith('TEST_OM_'));

    if (testOMExpense) {
      const result = await supervisorCaller.omExpense.getById({ id: testOMExpense.id });

      assertNotNull(result, '結果不應為 null');
      assertArrayLength(result.monthlyRecords, 12, '應有 12 個月度記錄');
    }
  });

  await runTest('OMExpense', 'updateMonthlyRecords: 批量更新月度記錄⭐', async () => {
    const omExpenses = await supervisorCaller.omExpense.getAll({});
    const testOMExpense = omExpenses.items.find((item: any) => item.name.startsWith('TEST_OM_'));

    if (testOMExpense) {
      const monthlyRecords = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        actualAmount: 10000,
      }));

      const result = await supervisorCaller.omExpense.updateMonthlyRecords({
        id: testOMExpense.id,
        monthlyRecords,
      });

      assertEqual(result.actualSpent, 120000, 'actualSpent 應為 120000');
    }
  });
}

/**
 * Module 7-8: ChargeOut API 測試
 */
async function testChargeOutAPI() {
  console.log(colors.bold('\n💸 Module 7-8: ChargeOut API'));

  const managerCaller = await createTestCaller();
  const supervisorCaller = await createSupervisorCaller();

  await runTest('ChargeOut', 'create: 創建費用轉嫁（表頭 + 明細）', async () => {
    const data = createChargeOutData(testIds.projectId, testIds.opCoId, testIds.expenseId, 100000);
    const result = await managerCaller.chargeOut.create(data);

    assertNotNull(result, '創建結果不應為 null');
    assertEqual(result.name, data.name, 'name 應匹配');
    assertEqual(result.status, 'Draft', '初始狀態應為 Draft');

    testIds.chargeOutId = result.id;
  });

  await runTest('ChargeOut', 'getById: 獲取 ChargeOut 詳情（含明細）', async () => {
    const result = await managerCaller.chargeOut.getById({ id: testIds.chargeOutId });

    assertNotNull(result, '結果不應為 null');
    assert(Array.isArray(result.items), '應包含 items');
  });

  await runTest('ChargeOut', 'submit: 提交 ChargeOut', async () => {
    const result = await managerCaller.chargeOut.submit({ id: testIds.chargeOutId });

    assertEqual(result.status, 'Submitted', '狀態應為 Submitted');
  });

  await runTest('ChargeOut', 'confirm: 確認 ChargeOut（Supervisor only）⭐', async () => {
    const result = await supervisorCaller.chargeOut.confirm({ id: testIds.chargeOutId });

    assertEqual(result.status, 'Confirmed', '狀態應為 Confirmed');
    assertNotNull(result.confirmedBy, 'confirmedBy 應記錄');
  });

  await runTest('ChargeOut', 'markAsPaid: 標記為已支付', async () => {
    const result = await managerCaller.chargeOut.markAsPaid({ id: testIds.chargeOutId });

    assertEqual(result.status, 'Paid', '狀態應為 Paid');
  });
}

/**
 * 主測試函數
 */
async function main() {
  console.log(colors.bold('\n🚀 API 健康檢查開始...\n'));
  console.log(colors.gray(`測試環境: localhost:5434`));
  console.log(colors.gray(`時間: ${new Date().toLocaleString('zh-TW')}\n`));

  const startTime = Date.now();

  try {
    // 清理舊測試數據
    await cleanupTestData();

    // 初始化測試數據
    console.log(colors.bold('\n🔧 初始化測試數據'));

    // 測試執行
    await testBudgetPoolAPI();
    await testProjectAPI();
    await testBudgetProposalAPI();
    await testPurchaseOrderAPI();
    await testExpenseAPI();
    await testOMExpenseAPI();
    await testChargeOutAPI();

    // 清理測試數據
    await cleanupTestData();

    // 計算執行時間
    testStats.duration = Date.now() - startTime;

    // 打印測試摘要
    const exitCode = printTestSummary();

    process.exit(exitCode);
  } catch (error) {
    console.error(colors.red('\n❌ 測試執行失敗:'));
    console.error(error);
    process.exit(1);
  }
}

// 執行測試
main();
