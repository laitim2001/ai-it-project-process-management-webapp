import { test, expect } from '../fixtures/auth';
import {
  generateBudgetPoolData,
  generateProjectData,
  generateProposalData,
  wait,
} from '../fixtures/test-data';
import { waitForEntityPersisted, waitForEntityWithFields, extractIdFromURL } from '../helpers/waitForEntity';

/**
 * 預算申請工作流 E2E 測試
 *
 * 完整流程：
 * 1. 創建預算池（BudgetPool）
 * 2. 創建項目（Project）
 * 3. 創建預算提案（BudgetProposal）
 * 4. ProjectManager 提交提案
 * 5. Supervisor 審核通過
 * 6. 驗證項目獲得批准預算
 */

test.describe('預算申請工作流', () => {
  let budgetPoolId: string;
  let budgetPoolName: string; // FIX: 跨步驟傳遞名稱，供 budgetPool Combobox 依名稱點選
  let projectId: string;
  let proposalId: string;

  // FIX: 完整工作流（6 步 + 多次持久化等待）遠超預設 30s test timeout；放寬至 120s
  test.describe.configure({ timeout: 120_000 });

  test('完整預算申請工作流：創建 → 提交 → 審核 → 批准', async ({
    managerPage,
    supervisorPage,
    adminPage,
  }) => {
    // ========================================
    // Step 1: 創建預算池（BudgetPool）
    // ========================================
    await test.step('Step 1: 創建預算池', async () => {
      const budgetPoolData = generateBudgetPoolData();
      budgetPoolName = budgetPoolData.name; // FIX: 記錄名稱供後續 Combobox 選取

      await managerPage.goto('/budget-pools');
      await managerPage.click('text=新增預算池');

      // 等待表單載入
      await managerPage.waitForSelector('input[name="name"]');

      // 填寫預算池基本信息
      await managerPage.fill('input[name="name"]', budgetPoolData.name);
      await managerPage.fill('input[name="description"]', budgetPoolData.description || '');
      await managerPage.fill('input[name="financialYear"]', budgetPoolData.financialYear);

      // 添加預算分類
      for (let i = 0; i < budgetPoolData.categories.length; i++) {
        const category = budgetPoolData.categories[i];
        if (i > 0) {
          await managerPage.click('button:has-text("新增類別")');
        }
        await managerPage.fill(`input[name="categories.${i}.categoryName"]`, category?.categoryName ?? '');
        await managerPage.fill(`input[name="categories.${i}.categoryCode"]`, category?.categoryCode ?? '');
        await managerPage.fill(
          `input[name="categories.${i}.totalAmount"]`,
          category?.totalAmount ?? ''
        );
      }

      // 提交表單
      await managerPage.click('button[type="submit"]'); // FIX: 表單唯一 submit；原 :has-text("創建預算池") 文字已改為「新增預算池」

      // 等待重定向到詳情頁
      await managerPage.waitForURL(/\/budget-pools\/[a-f0-9-]+/);

      // 提取預算池 ID
      const url = managerPage.url();
      budgetPoolId = url.split('/budget-pools/')[1] ?? '';

      // 驗證預算池創建成功
      await expect(managerPage.locator('h1')).toContainText(budgetPoolData.name);

      console.log(`✅ 預算池已創建: ${budgetPoolId}`);

      // 等待實體在數據庫中持久化（選項 C 修復）
      await waitForEntityPersisted(managerPage, 'budgetPool', budgetPoolId);
    });

    // ========================================
    // Step 2: 創建項目（Project）
    // ========================================
    await test.step('Step 2: 創建項目', async () => {
      const projectData = generateProjectData();

      // 在創建項目前,額外驗證預算池已經完全持久化
      // 這確保當表單載入時,下拉選單中可以找到該預算池
      console.log(`🔍 驗證預算池 ${budgetPoolId} 是否可查詢...`);
      await waitForEntityPersisted(managerPage, 'budgetPool', budgetPoolId);
      console.log(`✅ 預算池已確認可查詢,開始創建項目`);

      // 直接導航到創建項目頁面（更穩定）
      await managerPage.goto('/projects/new');

      // 等待表單載入
      await managerPage.waitForSelector('input[name="name"]', { timeout: 10000 });

      // 填寫項目基本信息
      await managerPage.fill('input[name="name"]', projectData.name);
      await managerPage.fill('input[name="projectCode"]', projectData.projectCode); // FIX: FEAT-001 必填欄位
      await managerPage.fill('textarea[name="description"]', projectData.description || '');

      // FIX: budgetPool 已從原生 select 改為 Combobox（FIX-093）；開啟後依名稱點選
      await managerPage.locator('button[role="combobox"]').first().click(); // 自訂 Combobox 是 button；原生 select 也有 combobox role，故用 button[role] 區分
      await managerPage.getByText(budgetPoolName, { exact: false }).click(); // 選項 label 含 FY/金額後綴，用 substring

      // 等待並選擇專案經理 (Manager)
      await managerPage.waitForFunction(() => {
        const select = document.querySelector('select[name="managerId"]') as HTMLSelectElement;
        return select && select.options.length > 1;
      }, { timeout: 15000 });
      const managerSelect = managerPage.locator('select[name="managerId"]');
      await managerSelect.selectOption({ index: 1 }); // 選擇第一個非空選項

      // 等待並選擇 Supervisor
      await managerPage.waitForFunction(() => {
        const select = document.querySelector('select[name="supervisorId"]') as HTMLSelectElement;
        return select && select.options.length > 1;
      }, { timeout: 15000 });
      const supervisorSelect = managerPage.locator('select[name="supervisorId"]');
      await supervisorSelect.selectOption({ index: 1 }); // 選擇第一個非空選項

      // 填寫日期
      await managerPage.fill('input[name="startDate"]', projectData.startDate);
      await managerPage.fill('input[name="endDate"]', projectData.endDate);

      // 填寫預算申請金額
      // FIX: requestedBudget 輸入已從專案表單移除（欄位可選，預設 undefined），略過填寫

      // 提交表單
      await managerPage.click('button[type="submit"]'); // FIX: 表單唯一 submit；原 :has-text("創建專案")

      // FIX: 原 expect(text=專案創建成功) 對應 i18n key 不存在；改等重導到專案詳情（無重導則由下方 fallback 處理）
      await managerPage.waitForURL(/\/projects\/[a-f0-9-]+/, { timeout: 10000 }).catch(() => {});

      // 等待一下讓重定向開始
      await managerPage.waitForTimeout(2000);

      // 提取項目 ID - 如果重定向成功就從 URL 獲取,否則從其他地方獲取
      let url = managerPage.url();
      if (url.includes('/projects/')) {
        projectId = (url.split('/projects/')[1]?.split('?')[0]?.split('/')[0] ?? '');
      } else {
        // 重定向未完成,手動導航到項目列表查找最新項目
        await managerPage.goto('/projects');
        await managerPage.waitForSelector('text=' + projectData.name);
        const projectLink = managerPage.locator(`a:has-text("${projectData.name}")`).first();
        const href = await projectLink.getAttribute('href');
        projectId = (href?.split('/projects/')[1] ?? '');
      }

      // 手動導航到項目詳情頁確保頁面載入
      await managerPage.goto(`/projects/${projectId}`);
      await managerPage.waitForLoadState('networkidle');

      // 驗證項目創建成功
      await expect(managerPage.locator('h1')).toContainText(projectData.name);

      console.log(`✅ 項目已創建: ${projectId}`);

      // 等待實體在數據庫中持久化（選項 C 修復）
      await waitForEntityPersisted(managerPage, 'project', projectId);
    });

    // ========================================
    // Step 3: 創建預算提案（BudgetProposal）
    // ========================================
    await test.step('Step 3: 創建預算提案', async () => {
      const proposalData = generateProposalData();

      // 在創建提案前,額外驗證項目已經完全持久化
      // 這確保當表單載入時,下拉選單中可以找到該項目
      console.log(`🔍 驗證項目 ${projectId} 是否可查詢...`);
      await waitForEntityPersisted(managerPage, 'project', projectId);
      console.log(`✅ 項目已確認可查詢,開始創建預算提案`);

      await managerPage.goto('/proposals');
      await managerPage.click('text=新增提案');

      // 等待表單載入
      await managerPage.waitForSelector('input[name="title"]');

      // 填寫提案基本信息
      await managerPage.fill('input[name="title"]', proposalData.title);
      await managerPage.fill('input[name="amount"]', proposalData.amount);
      // 註：description 字段在表單中不存在，API 也不需要

      // 選擇項目
      await managerPage.selectOption('select[name="projectId"]', projectId);

      // 提交表單（創建為草稿）
      await managerPage.click('button[type="submit"]'); // FIX: 表單唯一 submit；原 :has-text("創建提案")

      // 等待重定向到詳情頁
      await managerPage.waitForURL(/\/proposals\/[a-f0-9-]+/);

      // 提取提案 ID
      const url = managerPage.url();
      proposalId = url.split('/proposals/')[1] ?? '';

      // 驗證提案創建成功
      await expect(managerPage.locator('h1')).toContainText(proposalData.title);

      // 驗證狀態為 Draft (使用 .first() 選擇第一個 Badge)
      await expect(managerPage.locator('text=草稿').first()).toBeVisible();

      console.log(`✅ 預算提案已創建: ${proposalId}`);

      // 等待實體在數據庫中持久化（選項 C 修復）
      await waitForEntityPersisted(managerPage, 'budgetProposal', proposalId);
    });

    // ========================================
    // Step 4: ProjectManager 提交提案
    // ========================================
    await test.step('Step 4: ProjectManager 提交提案', async () => {
      // 在提交提案前,額外驗證提案已經完全持久化
      console.log(`🔍 驗證提案 ${proposalId} 是否可查詢...`);
      await waitForEntityPersisted(managerPage, 'budgetProposal', proposalId);
      console.log(`✅ 提案已確認可查詢,開始提交審核`);

      // 應該已經在提案詳情頁
      await expect(managerPage).toHaveURL(new RegExp(`/proposals/${proposalId}`)); // FIX: URL 含 locale 前綴，用 regex 部分匹配

      // 點擊提交按鈕 (正確的按鈕文字是"提交審批")
      await managerPage.click('button:has-text("提交審批")');

      // 等待提交完成並重新載入頁面
      await managerPage.waitForTimeout(2000);
      await managerPage.reload();
      await managerPage.waitForLoadState('networkidle');

      // 驗證狀態變為 PendingApproval (使用 .first() 選擇第一個 Badge)
      await expect(managerPage.locator('text=待審批').first()).toBeVisible({ timeout: 10000 });

      console.log(`✅ 提案已提交審核`);
    });

    // ========================================
    // Step 5: Supervisor 審核通過
    // ========================================
    await test.step('Step 5: Supervisor 審核通過', async () => {
      // FIX: 啟用的「BP Standard Approval Workflow」為 2 步（第 1 步 Supervisor、第 2 步 Admin）
      // 第 1 步：Supervisor 批准（通過後推進到第 2 步，狀態仍待審批）
      await supervisorPage.goto(`/proposals/${proposalId}`);
      await expect(supervisorPage.locator('text=待審批').first()).toBeVisible();
      await supervisorPage.click('button:has-text("批准")');
      await supervisorPage.waitForTimeout(2000);

      // 第 2 步：Admin 批准（最末步通過 → 整案 Approved）
      await adminPage.goto(`/proposals/${proposalId}`);
      await expect(adminPage.locator('text=待審批').first()).toBeVisible({ timeout: 10000 });
      await adminPage.click('button:has-text("批准")');
      await adminPage.waitForTimeout(2000);
      await adminPage.reload();
      await adminPage.waitForLoadState('networkidle');

      // 驗證狀態變為 Approved
      await expect(adminPage.locator('text=已批准').first()).toBeVisible({ timeout: 10000 });

      console.log(`✅ 提案已完成 2 步審批並批准`);
    });

    // ========================================
    // Step 6: 驗證項目獲得批准預算
    // ========================================
    await test.step('Step 6: 驗證項目獲得批准預算', async () => {
      // 訪問項目詳情頁
      await managerPage.goto(`/projects/${projectId}`);

      // 等待頁面載入
      await managerPage.waitForLoadState('networkidle');

      // 驗證批准預算已更新 (正確的文字是"批准預算")
      await expect(managerPage.locator('text=批准預算')).toBeVisible({ timeout: 10000 });

      // FIX: 幣別為 HKD（非 $）且 nth(3) 過於脆弱；改為 currency-agnostic 驗證批准金額 50,000 出現
      await expect(managerPage.getByText('50,000').first()).toBeVisible();

      console.log(`✅ 項目批准預算已更新`);
    });
  });

  test('預算提案拒絕流程', async ({ managerPage, supervisorPage }) => {
    // ========================================
    // 前置準備：創建預算池、項目、提案並提交
    // ========================================
    await test.step('前置準備: 創建預算池', async () => {
      const budgetPoolData = generateBudgetPoolData();
      budgetPoolName = budgetPoolData.name; // FIX: 記錄名稱供後續 Combobox 選取

      await managerPage.goto('/budget-pools');
      await managerPage.click('text=新增預算池');
      await managerPage.waitForSelector('input[name="name"]');

      await managerPage.fill('input[name="name"]', budgetPoolData.name);
      await managerPage.fill('input[name="description"]', budgetPoolData.description || '');
      await managerPage.fill('input[name="financialYear"]', budgetPoolData.financialYear);

      for (let i = 0; i < budgetPoolData.categories.length; i++) {
        const category = budgetPoolData.categories[i];
        if (i > 0) {
          await managerPage.click('button:has-text("新增類別")');
        }
        await managerPage.fill(`input[name="categories.${i}.categoryName"]`, category?.categoryName ?? '');
        await managerPage.fill(`input[name="categories.${i}.categoryCode"]`, category?.categoryCode ?? '');
        await managerPage.fill(`input[name="categories.${i}.totalAmount"]`, category?.totalAmount ?? '');
      }

      await managerPage.click('button[type="submit"]'); // FIX: 表單唯一 submit；原 :has-text("創建預算池") 文字已改為「新增預算池」
      await managerPage.waitForURL(/\/budget-pools\/[a-f0-9-]+/);

      const url = managerPage.url();
      budgetPoolId = url.split('/budget-pools/')[1] ?? '';

      console.log(`✅ 預算池已創建: ${budgetPoolId}`);
      await waitForEntityPersisted(managerPage, 'budgetPool', budgetPoolId);
    });

    await test.step('前置準備: 創建項目', async () => {
      const projectData = generateProjectData();

      console.log(`🔍 驗證預算池 ${budgetPoolId} 是否可查詢...`);
      await waitForEntityPersisted(managerPage, 'budgetPool', budgetPoolId);

      // 直接導航到創建項目頁面（更穩定）
      await managerPage.goto('/projects/new');
      await managerPage.waitForSelector('input[name="name"]', { timeout: 10000 });

      await managerPage.fill('input[name="name"]', projectData.name);
      await managerPage.fill('input[name="projectCode"]', projectData.projectCode); // FIX: FEAT-001 必填欄位
      await managerPage.fill('textarea[name="description"]', projectData.description || '');

      // FIX: budgetPool 改為 Combobox（FIX-093）；開啟後依名稱點選
      await managerPage.locator('button[role="combobox"]').first().click(); // 自訂 Combobox 是 button；原生 select 也有 combobox role，故用 button[role] 區分
      await managerPage.getByText(budgetPoolName, { exact: false }).click(); // 選項 label 含 FY/金額後綴，用 substring

      await managerPage.waitForFunction(() => {
        const select = document.querySelector('select[name="managerId"]') as HTMLSelectElement;
        return select && select.options.length > 1;
      }, { timeout: 15000 });
      const managerSelect = managerPage.locator('select[name="managerId"]');
      await managerSelect.selectOption({ index: 1 });

      await managerPage.waitForFunction(() => {
        const select = document.querySelector('select[name="supervisorId"]') as HTMLSelectElement;
        return select && select.options.length > 1;
      }, { timeout: 15000 });
      const supervisorSelect = managerPage.locator('select[name="supervisorId"]');
      await supervisorSelect.selectOption({ index: 1 });

      await managerPage.fill('input[name="startDate"]', projectData.startDate);
      await managerPage.fill('input[name="endDate"]', projectData.endDate);
      // FIX: requestedBudget 輸入已從專案表單移除（欄位可選，預設 undefined），略過填寫

      await managerPage.click('button[type="submit"]'); // FIX: 表單唯一 submit；原 :has-text("創建專案")
      // FIX: 原 expect(text=專案創建成功) 對應的 i18n key 不存在；改等重導到專案詳情（無重導則由下方 fallback 處理）
      await managerPage.waitForURL(/\/projects\/[a-f0-9-]+/, { timeout: 10000 }).catch(() => {});
      await managerPage.waitForTimeout(2000);

      let url = managerPage.url();
      if (url.includes('/projects/')) {
        projectId = (url.split('/projects/')[1]?.split('?')[0]?.split('/')[0] ?? '');
      } else {
        await managerPage.goto('/projects');
        await managerPage.waitForSelector('text=' + projectData.name);
        const projectLink = managerPage.locator(`a:has-text("${projectData.name}")`).first();
        const href = await projectLink.getAttribute('href');
        projectId = (href?.split('/projects/')[1] ?? '');
      }

      await managerPage.goto(`/projects/${projectId}`);
      await managerPage.waitForLoadState('networkidle');

      console.log(`✅ 項目已創建: ${projectId}`);
      await waitForEntityPersisted(managerPage, 'project', projectId);
    });

    await test.step('前置準備: 創建並提交提案', async () => {
      const proposalData = generateProposalData();

      console.log(`🔍 驗證項目 ${projectId} 是否可查詢...`);
      await waitForEntityPersisted(managerPage, 'project', projectId);

      await managerPage.goto('/proposals');
      await managerPage.click('text=新增提案');
      await managerPage.waitForSelector('input[name="title"]');

      await managerPage.fill('input[name="title"]', proposalData.title);
      await managerPage.fill('input[name="amount"]', proposalData.amount);
      await managerPage.selectOption('select[name="projectId"]', projectId);

      await managerPage.click('button[type="submit"]'); // FIX: 表單唯一 submit；原 :has-text("創建提案")
      await managerPage.waitForURL(/\/proposals\/[a-f0-9-]+/);

      const url = managerPage.url();
      proposalId = url.split('/proposals/')[1] ?? '';

      console.log(`✅ 預算提案已創建: ${proposalId}`);
      await waitForEntityPersisted(managerPage, 'budgetProposal', proposalId);

      // 提交提案到待審批狀態
      console.log(`🔍 驗證提案 ${proposalId} 是否可查詢...`);
      await waitForEntityPersisted(managerPage, 'budgetProposal', proposalId);

      await expect(managerPage).toHaveURL(new RegExp(`/proposals/${proposalId}`)); // FIX: URL 含 locale 前綴，用 regex 部分匹配
      await managerPage.click('button:has-text("提交審批")');
      await managerPage.waitForTimeout(2000);
      await managerPage.reload();
      await managerPage.waitForLoadState('networkidle');

      await expect(managerPage.locator('text=待審批').first()).toBeVisible({ timeout: 10000 });

      console.log(`✅ 提案已提交審核，當前狀態：待審批`);
    });

    // ========================================
    // Step 1: Supervisor 拒絕提案
    // ========================================
    await test.step('Supervisor 拒絕提案', async () => {
      await supervisorPage.goto(`/proposals/${proposalId}`);

      // 填寫審批意見 (必須在點擊拒絕前填寫)
      await supervisorPage.fill(
        'textarea#comment',
        '預算金額超出項目需求'
      );

      // 點擊拒絕按鈕 (沒有確認對話框,直接點擊即可)
      await supervisorPage.click('button:has-text("駁回")'); // FIX: i18n reject = 「駁回」（非「拒絕」）

      // 等待狀態更新
      await wait(1000);
      await supervisorPage.reload();

      // 驗證狀態變為 Rejected（使用 first() 選擇第一個匹配元素）
      await expect(supervisorPage.locator('text=已駁回').first()).toBeVisible(); // FIX: status.rejected = 「已駁回」

      console.log(`✅ 提案已拒絕`);
    });

    // ========================================
    // Step 2: ProjectManager 查看拒絕原因
    // ========================================
    await test.step('ProjectManager 查看拒絕原因', async () => {
      await managerPage.goto(`/proposals/${proposalId}`);

      // 驗證拒絕原因可見
      await expect(managerPage.locator('text=預算金額超出項目需求').first()).toBeVisible();

      console.log(`✅ 拒絕原因已顯示`);
    });
  });
});
