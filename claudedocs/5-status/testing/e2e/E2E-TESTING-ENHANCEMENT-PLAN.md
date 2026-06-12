# E2E 測試提升計劃

> **創建日期**: 2025-10-28
> **版本**: 1.0
> **基於**: FIX-010 完成後的測試基礎（7/7 基本功能測試通過）
> **預計工時**: 12-15 工作天

---

## 📊 當前測試狀態

### ✅ 已完成
- **基本功能測試**: 7/7 (100%) 通過
  - 首頁訪問
  - 登入頁面訪問
  - ProjectManager 登入
  - Supervisor 登入
  - 預算池頁面導航
  - 項目頁面導航
  - 費用轉嫁頁面導航
- **測試框架**: Playwright + TypeScript
- **測試環境**: 端口 3006 隔離測試服務器
- **認證系統**: JWT + credentials provider 100% 正常

### ⏳ 待實施
- **工作流測試**: 0/3 (預算提案、採購、費用轉嫁)
- **錯誤處理測試**: 未開始
- **邊界條件測試**: 未開始
- **表單驗證測試**: 未開始
- **文件上傳測試**: 未開始
- **CI/CD 集成**: 未開始

---

## 🎯 測試提升目標

### 短期目標（Sprint 1-2，6-8 天）
1. ✅ 創建 3 個核心工作流測試
2. ✅ 整合測試配置到主配置
3. ✅ 提升測試覆蓋率到 60%+

### 中期目標（Sprint 3-4，4-6 天）
1. ✅ 添加錯誤處理和邊界測試
2. ✅ 實施表單驗證測試
3. ✅ 集成 CI/CD 流程

### 長期目標（持續優化）
1. ⏳ 測試覆蓋率達到 80%+
2. ⏳ 實施視覺回歸測試
3. ⏳ 性能測試基準建立

---

## 📋 階段 1: 創建工作流測試（優先級：🔴 高）

### **預計時間**: 4-5 工作天
### **目標**: 實施 3 個核心業務流程的端到端驗證

### 1.1 預算提案工作流測試

**文件**: `apps/web/e2e/workflows/budget-proposal-workflow.spec.ts`

**測試場景**:

```typescript
import { test, expect } from '../fixtures/auth';

test.describe('預算提案完整工作流', () => {

  /**
   * 場景 1: PM 創建提案 → 提交審批 → Supervisor 審批 → 狀態更新
   *
   * 步驟:
   * 1. PM 登入
   * 2. 創建新提案
   * 3. 填寫提案信息（標題、金額、項目關聯）
   * 4. 上傳計劃書文件（PDF）
   * 5. 提交審批
   * 6. 驗證提案狀態變為 "PendingApproval"
   * 7. 切換到 Supervisor 登入
   * 8. 查看待審批提案列表
   * 9. 打開提案詳情
   * 10. 批准提案（設置批准金額）
   * 11. 驗證提案狀態變為 "Approved"
   * 12. 驗證項目的 approvedBudget 已更新
   */
  test('PM 創建提案 → Supervisor 審批 → 狀態更新', async ({ managerPage, supervisorPage }) => {
    // 步驟 1-6: PM 創建並提交提案
    await managerPage.goto('/proposals/new');

    // 填寫提案表單
    await managerPage.fill('input[name="title"]', '測試提案 - 自動化測試');
    await managerPage.fill('input[name="amount"]', '50000');
    await managerPage.selectOption('select[name="projectId"]', { index: 1 });

    // 上傳計劃書文件
    const fileInput = managerPage.locator('input[type="file"]');
    await fileInput.setInputFiles('test-fixtures/sample-proposal.pdf');

    // 提交提案
    await managerPage.click('button[type="submit"]');

    // 驗證提案創建成功
    await expect(managerPage).toHaveURL(/\/proposals\/[a-z0-9-]+/);

    // 獲取提案 ID
    const proposalUrl = managerPage.url();
    const proposalId = proposalUrl.split('/').pop();

    // 提交審批
    await managerPage.click('button:has-text("提交審批")');

    // 驗證狀態
    await expect(managerPage.locator('[data-testid="proposal-status"]')).toContainText('待審批');

    // 步驟 7-11: Supervisor 審批
    await supervisorPage.goto('/proposals');

    // 驗證待審批列表中有新提案
    await expect(supervisorPage.locator(`[data-proposal-id="${proposalId}"]`)).toBeVisible();

    // 打開提案詳情
    await supervisorPage.click(`[data-proposal-id="${proposalId}"]`);

    // 批准提案
    await supervisorPage.click('button:has-text("批准")');

    // 填寫批准金額（與請求金額相同）
    await supervisorPage.fill('input[name="approvedAmount"]', '50000');
    await supervisorPage.fill('textarea[name="comments"]', '提案通過，按原金額批准');

    // 確認批准
    await supervisorPage.click('button:has-text("確認批准")');

    // 驗證批准成功
    await expect(supervisorPage.locator('[data-testid="proposal-status"]')).toContainText('已批准');

    // 驗證批准者和時間
    await expect(supervisorPage.locator('[data-testid="approved-by"]')).toBeVisible();
    await expect(supervisorPage.locator('[data-testid="approved-at"]')).toBeVisible();
  });

  /**
   * 場景 2: PM 創建提案 → Supervisor 要求更多信息 → PM 補充 → Supervisor 批准
   */
  test('提案需要補充信息的完整流程', async ({ managerPage, supervisorPage }) => {
    // PM 創建提案
    await managerPage.goto('/proposals/new');
    await managerPage.fill('input[name="title"]', '測試提案 - 需要補充信息');
    await managerPage.fill('input[name="amount"]', '30000');
    await managerPage.selectOption('select[name="projectId"]', { index: 1 });
    await managerPage.click('button[type="submit"]');

    // 提交審批
    await managerPage.click('button:has-text("提交審批")');

    const proposalUrl = managerPage.url();
    const proposalId = proposalUrl.split('/').pop();

    // Supervisor 要求更多信息
    await supervisorPage.goto(`/proposals/${proposalId}`);
    await supervisorPage.click('button:has-text("要求更多信息")');
    await supervisorPage.fill('textarea[name="comments"]', '請提供更詳細的成本分解');
    await supervisorPage.click('button:has-text("確認")');

    // 驗證狀態變為 "MoreInfoRequired"
    await expect(supervisorPage.locator('[data-testid="proposal-status"]')).toContainText('需要更多信息');

    // PM 查看並補充信息
    await managerPage.goto(`/proposals/${proposalId}`);
    await expect(managerPage.locator('[data-testid="supervisor-comment"]')).toContainText('請提供更詳細的成本分解');

    // 添加評論補充信息
    await managerPage.fill('textarea[name="comment"]', '成本分解：硬體 15000, 軟體 10000, 服務 5000');
    await managerPage.click('button:has-text("提交評論")');

    // 重新提交審批
    await managerPage.click('button:has-text("重新提交")');

    // Supervisor 審批
    await supervisorPage.goto(`/proposals/${proposalId}`);
    await supervisorPage.click('button:has-text("批准")');
    await supervisorPage.fill('input[name="approvedAmount"]', '30000');
    await supervisorPage.click('button:has-text("確認批准")');

    // 驗證最終狀態為 "Approved"
    await expect(supervisorPage.locator('[data-testid="proposal-status"]')).toContainText('已批准');
  });

  /**
   * 場景 3: PM 創建提案 → Supervisor 拒絕 → 狀態更新
   */
  test('提案被拒絕的流程', async ({ managerPage, supervisorPage }) => {
    // PM 創建提案
    await managerPage.goto('/proposals/new');
    await managerPage.fill('input[name="title"]', '測試提案 - 將被拒絕');
    await managerPage.fill('input[name="amount"]', '100000');
    await managerPage.selectOption('select[name="projectId"]', { index: 1 });
    await managerPage.click('button[type="submit"]');
    await managerPage.click('button:has-text("提交審批")');

    const proposalUrl = managerPage.url();
    const proposalId = proposalUrl.split('/').pop();

    // Supervisor 拒絕提案
    await supervisorPage.goto(`/proposals/${proposalId}`);
    await supervisorPage.click('button:has-text("拒絕")');
    await supervisorPage.fill('textarea[name="rejectionReason"]', '預算超出年度限額');
    await supervisorPage.click('button:has-text("確認拒絕")');

    // 驗證狀態
    await expect(supervisorPage.locator('[data-testid="proposal-status"]')).toContainText('已拒絕');

    // PM 查看拒絕原因
    await managerPage.goto(`/proposals/${proposalId}`);
    await expect(managerPage.locator('[data-testid="rejection-reason"]')).toContainText('預算超出年度限額');

    // 驗證項目的 approvedBudget 未更新（仍為 null 或 0）
    await managerPage.goto(`/projects`);
    // 額外驗證邏輯...
  });

  /**
   * 場景 4: 會議記錄功能測試
   */
  test('提案會議記錄的新增和查看', async ({ managerPage }) => {
    // 創建提案
    await managerPage.goto('/proposals/new');
    await managerPage.fill('input[name="title"]', '測試提案 - 會議記錄');
    await managerPage.fill('input[name="amount"]', '40000');
    await managerPage.selectOption('select[name="projectId"]', { index: 1 });
    await managerPage.click('button[type="submit"]');

    const proposalUrl = managerPage.url();
    const proposalId = proposalUrl.split('/').pop();

    // 切換到會議記錄 Tab
    await managerPage.click('[data-tab="meeting"]');

    // 添加會議記錄
    await managerPage.click('button:has-text("添加會議記錄")');
    await managerPage.fill('input[name="meetingDate"]', '2025-10-30');
    await managerPage.fill('input[name="presentedBy"]', '張經理');
    await managerPage.fill('textarea[name="meetingNotes"]', `
      會議日期: 2025-10-30
      參與人員: 張經理、李主管、王工程師

      討論重點:
      1. 項目背景和需求
      2. 預算分配方案
      3. 實施時程規劃

      決議:
      - 批准預算申請
      - 啟動時間: 2025-11-01
    `);
    await managerPage.click('button:has-text("保存會議記錄")');

    // 驗證會議記錄保存成功
    await expect(managerPage.locator('[data-testid="meeting-date"]')).toContainText('2025-10-30');
    await expect(managerPage.locator('[data-testid="presented-by"]')).toContainText('張經理');
    await expect(managerPage.locator('[data-testid="meeting-notes"]')).toContainText('決議');
  });
});
```

**測試數據準備**:
- 測試 PDF 文件: `test-fixtures/sample-proposal.pdf`
- 測試用戶: test-manager@example.com, test-supervisor@example.com
- 測試項目: 使用 seed 數據中的項目

**預期結果**:
- ✅ 4/4 測試通過
- ✅ 提案狀態機正確運作
- ✅ 權限控制正確（PM 只能創建，Supervisor 可以審批）
- ✅ 數據庫更新正確（project.approvedBudget 同步）

---

### 1.2 採購工作流測試

**文件**: `apps/web/e2e/workflows/procurement-workflow.spec.ts`

**測試場景**:

```typescript
import { test, expect } from '../fixtures/auth';

test.describe('採購完整工作流', () => {

  /**
   * 場景 1: 創建供應商 → 上傳報價 → 創建採購單 → 驗證關聯
   */
  test('從供應商到採購單的完整流程', async ({ managerPage }) => {
    // 步驟 1: 創建供應商
    await managerPage.goto('/vendors/new');
    await managerPage.fill('input[name="name"]', '測試供應商 - 科技公司');
    await managerPage.fill('input[name="contactName"]', '王銷售');
    await managerPage.fill('input[name="email"]', 'wang@test-vendor.com');
    await managerPage.fill('input[name="phone"]', '+852-1234-5678');
    await managerPage.click('button[type="submit"]');

    // 驗證供應商創建成功
    await expect(managerPage).toHaveURL(/\/vendors\/[a-z0-9-]+/);
    const vendorUrl = managerPage.url();
    const vendorId = vendorUrl.split('/').pop();

    // 步驟 2: 上傳報價單
    await managerPage.goto('/quotes/new');
    await managerPage.selectOption('select[name="vendorId"]', vendorId!);
    await managerPage.selectOption('select[name="projectId"]', { index: 1 });
    await managerPage.fill('input[name="amount"]', '45000');

    // 上傳報價文件
    const quoteFileInput = managerPage.locator('input[type="file"]');
    await quoteFileInput.setInputFiles('test-fixtures/sample-quote.pdf');

    await managerPage.click('button[type="submit"]');

    // 獲取報價 ID
    const quoteUrl = managerPage.url();
    const quoteId = quoteUrl.split('/').pop();

    // 步驟 3: 基於報價創建採購單
    await managerPage.goto('/purchase-orders/new');
    await managerPage.fill('input[name="name"]', '測試採購單 - 辦公設備');
    await managerPage.selectOption('select[name="projectId"]', { index: 1 });
    await managerPage.selectOption('select[name="vendorId"]', vendorId!);
    await managerPage.selectOption('select[name="quoteId"]', quoteId!);

    // 添加採購明細
    await managerPage.click('button:has-text("新增品項")');
    await managerPage.fill('input[name="items[0].itemName"]', '筆記本電腦');
    await managerPage.fill('input[name="items[0].description"]', 'Dell XPS 15, 16GB RAM, 512GB SSD');
    await managerPage.fill('input[name="items[0].quantity"]', '10');
    await managerPage.fill('input[name="items[0].unitPrice"]', '3000');

    // 驗證小計自動計算
    await expect(managerPage.locator('[data-testid="items[0].subtotal"]')).toHaveValue('30000');

    // 添加第二個品項
    await managerPage.click('button:has-text("新增品項")');
    await managerPage.fill('input[name="items[1].itemName"]', '顯示器');
    await managerPage.fill('input[name="items[1].quantity"]', '10');
    await managerPage.fill('input[name="items[1].unitPrice"]', '1500');

    // 驗證總金額自動計算
    await expect(managerPage.locator('[data-testid="total-amount"]')).toHaveText('45,000.00');

    await managerPage.click('button[type="submit"]');

    // 驗證採購單創建成功
    await expect(managerPage).toHaveURL(/\/purchase-orders\/[a-z0-9-]+/);

    // 步驟 4: 驗證關聯
    const poUrl = managerPage.url();
    const poId = poUrl.split('/').pop();

    // 驗證採購單詳情
    await expect(managerPage.locator('[data-testid="po-vendor"]')).toContainText('測試供應商 - 科技公司');
    await expect(managerPage.locator('[data-testid="po-quote"]')).toContainText(quoteId!);
    await expect(managerPage.locator('[data-testid="po-items-count"]')).toContainText('2');

    // 驗證供應商頁面顯示採購單
    await managerPage.goto(`/vendors/${vendorId}`);
    await expect(managerPage.locator(`[data-po-id="${poId}"]`)).toBeVisible();

    // 驗證項目頁面顯示採購單
    await managerPage.goto('/projects');
    await managerPage.click('[data-testid="project-link"]:first-of-type');
    await expect(managerPage.locator(`[data-po-id="${poId}"]`)).toBeVisible();
  });

  /**
   * 場景 2: 編輯採購單明細（新增、修改、刪除品項）
   */
  test('採購單明細的完整編輯流程', async ({ managerPage }) => {
    // 創建初始採購單（2 個品項）
    await managerPage.goto('/purchase-orders/new');
    await managerPage.fill('input[name="name"]', '測試採購單 - 編輯明細');
    await managerPage.selectOption('select[name="projectId"]', { index: 1 });
    await managerPage.selectOption('select[name="vendorId"]', { index: 1 });

    // 添加 2 個品項
    await managerPage.click('button:has-text("新增品項")');
    await managerPage.fill('input[name="items[0].itemName"]', '品項 A');
    await managerPage.fill('input[name="items[0].quantity"]', '5');
    await managerPage.fill('input[name="items[0].unitPrice"]', '1000');

    await managerPage.click('button:has-text("新增品項")');
    await managerPage.fill('input[name="items[1].itemName"]', '品項 B');
    await managerPage.fill('input[name="items[1].quantity"]', '3');
    await managerPage.fill('input[name="items[1].unitPrice"]', '2000');

    await managerPage.click('button[type="submit"]');

    const poUrl = managerPage.url();
    const poId = poUrl.split('/').pop();

    // 編輯採購單
    await managerPage.click('button:has-text("編輯")');

    // 修改品項 A 的數量
    await managerPage.fill('input[name="items[0].quantity"]', '8');
    await expect(managerPage.locator('[data-testid="items[0].subtotal"]')).toHaveValue('8000');

    // 刪除品項 B
    await managerPage.click('[data-testid="delete-item-1"]');
    await expect(managerPage.locator('input[name="items[1].itemName"]')).not.toBeVisible();

    // 新增品項 C
    await managerPage.click('button:has-text("新增品項")');
    await managerPage.fill('input[name="items[1].itemName"]', '品項 C');
    await managerPage.fill('input[name="items[1].quantity"]', '10');
    await managerPage.fill('input[name="items[1].unitPrice"]', '500');

    // 驗證總金額重新計算
    await expect(managerPage.locator('[data-testid="total-amount"]')).toHaveText('13,000.00');

    // 保存變更
    await managerPage.click('button[type="submit"]');

    // 驗證變更已保存
    await expect(managerPage.locator('[data-testid="po-items-count"]')).toContainText('2');
    await expect(managerPage.locator('[data-testid="total-amount"]')).toHaveText('13,000.00');
  });

  /**
   * 場景 3: 採購單狀態流轉（Draft → Submitted → Approved → Completed）
   */
  test('採購單狀態完整流轉', async ({ managerPage, supervisorPage }) => {
    // PM 創建採購單（Draft 狀態）
    await managerPage.goto('/purchase-orders/new');
    await managerPage.fill('input[name="name"]', '測試採購單 - 狀態流轉');
    await managerPage.selectOption('select[name="projectId"]', { index: 1 });
    await managerPage.selectOption('select[name="vendorId"]', { index: 1 });

    await managerPage.click('button:has-text("新增品項")');
    await managerPage.fill('input[name="items[0].itemName"]', '設備 X');
    await managerPage.fill('input[name="items[0].quantity"]', '5');
    await managerPage.fill('input[name="items[0].unitPrice"]', '2000');

    await managerPage.click('button[type="submit"]');

    const poUrl = managerPage.url();
    const poId = poUrl.split('/').pop();

    // 驗證初始狀態為 Draft
    await expect(managerPage.locator('[data-testid="po-status"]')).toContainText('草稿');

    // 提交採購單（Submitted 狀態）
    await managerPage.click('button:has-text("提交採購單")');
    await expect(managerPage.locator('[data-testid="po-status"]')).toContainText('已提交');

    // Supervisor 批准採購單（Approved 狀態）
    await supervisorPage.goto(`/purchase-orders/${poId}`);
    await supervisorPage.click('button:has-text("批准採購單")');
    await supervisorPage.fill('textarea[name="approvalComments"]', '採購單批准');
    await supervisorPage.click('button:has-text("確認批准")');

    // 驗證狀態變為 Approved
    await expect(supervisorPage.locator('[data-testid="po-status"]')).toContainText('已批准');
    await expect(supervisorPage.locator('[data-testid="approved-date"]')).toBeVisible();

    // PM 標記為完成（Completed 狀態）
    await managerPage.goto(`/purchase-orders/${poId}`);
    await managerPage.click('button:has-text("標記為完成")');

    // 驗證最終狀態
    await expect(managerPage.locator('[data-testid="po-status"]')).toContainText('已完成');
  });
});
```

**測試數據準備**:
- 測試 PDF 文件: `test-fixtures/sample-quote.pdf`
- 測試供應商: seed 數據中的供應商
- 測試項目: seed 數據中的項目

**預期結果**:
- ✅ 3/3 測試通過
- ✅ 表頭-明細結構正確
- ✅ 金額自動計算正確
- ✅ 供應商-報價-採購單關聯正確

---

### 1.3 費用轉嫁工作流測試

**文件**: `apps/web/e2e/workflows/expense-chargeout-workflow.spec.ts`

**測試場景**:

```typescript
import { test, expect } from '../fixtures/auth';

test.describe('費用轉嫁完整工作流', () => {

  /**
   * 場景 1: 記錄費用 → 提交審批 → 費用轉嫁 → 預算池扣除
   */
  test('從費用記錄到預算池扣除的完整流程', async ({ managerPage, supervisorPage }) => {
    // 步驟 1: PM 記錄費用
    await managerPage.goto('/expenses/new');

    // 選擇採購單
    await managerPage.selectOption('select[name="purchaseOrderId"]', { index: 1 });

    // 填寫費用信息
    await managerPage.fill('input[name="invoiceNumber"]', 'INV-2025-001');
    await managerPage.fill('input[name="expenseDate"]', '2025-10-28');

    // 上傳發票
    const invoiceInput = managerPage.locator('input[type="file"][name="invoice"]');
    await invoiceInput.setInputFiles('test-fixtures/sample-invoice.pdf');

    // 添加費用明細
    await managerPage.click('button:has-text("新增費用項")');
    await managerPage.fill('input[name="items[0].description"]', '硬體設備');
    await managerPage.fill('input[name="items[0].amount"]', '10000');
    await managerPage.selectOption('select[name="items[0].categoryId"]', { index: 0 }); // Hardware category

    await managerPage.click('button:has-text("新增費用項")');
    await managerPage.fill('input[name="items[0].description"]', '軟體授權');
    await managerPage.fill('input[name="items[0].amount"]', '5000');
    await managerPage.selectOption('select[name="items[0].categoryId"]', { index: 1 }); // Software category

    // 驗證總金額
    await expect(managerPage.locator('[data-testid="expense-total"]')).toHaveText('15,000.00');

    // 保存費用
    await managerPage.click('button[type="submit"]');

    const expenseUrl = managerPage.url();
    const expenseId = expenseUrl.split('/').pop();

    // 驗證狀態為 Draft
    await expect(managerPage.locator('[data-testid="expense-status"]')).toContainText('草稿');

    // 步驟 2: 提交審批
    await managerPage.click('button:has-text("提交審批")');

    // 驗證狀態變為 PendingApproval
    await expect(managerPage.locator('[data-testid="expense-status"]')).toContainText('待審批');

    // 步驟 3: Supervisor 審批費用
    await supervisorPage.goto('/expenses');
    await supervisorPage.click('[data-expense-status="PendingApproval"]:first-of-type');

    // 驗證費用詳情
    await expect(supervisorPage.locator('[data-testid="invoice-number"]')).toContainText('INV-2025-001');
    await expect(supervisorPage.locator('[data-testid="expense-total"]')).toHaveText('15,000.00');

    // 批准費用
    await supervisorPage.click('button:has-text("批准")');
    await supervisorPage.fill('textarea[name="approvalComments"]', '費用審批通過');
    await supervisorPage.click('button:has-text("確認批准")');

    // 驗證狀態變為 Approved
    await expect(supervisorPage.locator('[data-testid="expense-status"]')).toContainText('已批准');

    // 步驟 4: 查詢費用關聯的預算類別
    const expensePage = supervisorPage;
    const hardwareCategoryId = await expensePage.locator('[data-testid="item-0-category-id"]').textContent();
    const softwareCategoryId = await expensePage.locator('[data-testid="item-1-category-id"]').textContent();

    // 步驟 5: 費用轉嫁
    await supervisorPage.goto('/charge-outs/new');
    await supervisorPage.fill('input[name="name"]', '測試費用轉嫁 - 2025年10月');
    await supervisorPage.selectOption('select[name="opCoId"]', { index: 0 }); // 選擇營運公司
    await supervisorPage.fill('input[name="chargeOutDate"]', '2025-10-28');

    // 關聯費用
    await supervisorPage.click('button:has-text("添加費用")');
    await supervisorPage.selectOption('select[name="expenseId"]', expenseId!);

    // 驗證費用金額自動填入
    await expect(supervisorPage.locator('[data-testid="chargeout-total"]')).toHaveText('15,000.00');

    // 提交費用轉嫁
    await supervisorPage.click('button[type="submit"]');

    const chargeOutUrl = supervisorPage.url();
    const chargeOutId = chargeOutUrl.split('/').pop();

    // 步驟 6: 驗證預算池扣除
    // 記錄轉嫁前的預算池餘額
    await supervisorPage.goto('/budget-pools');
    const poolCard = supervisorPage.locator('[data-testid="budget-pool-card"]:first-of-type');

    // 獲取 Hardware 類別的餘額
    const hardwareCategoryBefore = await poolCard.locator(`[data-category-id="${hardwareCategoryId}"]`).textContent();

    // 確認費用轉嫁
    await supervisorPage.goto(`/charge-outs/${chargeOutId}`);
    await supervisorPage.click('button:has-text("確認轉嫁")');

    // 驗證狀態變為 Confirmed
    await expect(supervisorPage.locator('[data-testid="chargeout-status"]')).toContainText('已確認');

    // 驗證預算池已扣除
    await supervisorPage.goto('/budget-pools');
    const hardwareCategoryAfter = await poolCard.locator(`[data-category-id="${hardwareCategoryId}"]`).textContent();

    // 驗證 usedAmount 增加了 10000
    // (這裡需要解析金額字符串並比較)

    // 步驟 7: 驗證費用狀態變為 ChargedOut
    await supervisorPage.goto(`/expenses/${expenseId}`);
    await expect(supervisorPage.locator('[data-testid="expense-status"]')).toContainText('已轉嫁');
  });

  /**
   * 場景 2: 操作維護費用的月度記錄和轉嫁
   */
  test('OM 費用的月度記錄和轉嫁流程', async ({ managerPage, supervisorPage }) => {
    // PM 創建 OM 費用
    await managerPage.goto('/om-expenses/new');
    await managerPage.fill('input[name="name"]', '測試 OM 費用 - 2025年11月');
    await managerPage.selectOption('select[name="projectId"]', { index: 1 });
    await managerPage.selectOption('select[name="budgetCategoryId"]', { index: 2 }); // Services category
    await managerPage.fill('input[name="year"]', '2025');
    await managerPage.fill('input[name="month"]', '11');

    // 填寫月度金額（使用網格輸入）
    const months = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    for (const month of months) {
      await managerPage.fill(`input[name="monthly[${month}].amount"]`, '2000');
    }

    // 驗證總金額
    await expect(managerPage.locator('[data-testid="om-total"]')).toHaveText('24,000.00');

    // 保存 OM 費用
    await managerPage.click('button[type="submit"]');

    const omExpenseUrl = managerPage.url();
    const omExpenseId = omExpenseUrl.split('/').pop();

    // 提交審批
    await managerPage.click('button:has-text("提交審批")');

    // Supervisor 審批
    await supervisorPage.goto(`/om-expenses/${omExpenseId}`);
    await supervisorPage.click('button:has-text("批准")');
    await supervisorPage.click('button:has-text("確認批准")');

    // 創建費用轉嫁（只轉嫁 11 月的金額）
    await supervisorPage.goto('/charge-outs/new');
    await supervisorPage.fill('input[name="name"]', '測試 OM 轉嫁 - 2025年11月');
    await supervisorPage.selectOption('select[name="opCoId"]', { index: 0 });
    await supervisorPage.fill('input[name="chargeOutDate"]', '2025-11-30');

    // 添加 OM 費用項目
    await supervisorPage.click('button:has-text("添加 OM 費用")');
    await supervisorPage.selectOption('select[name="omExpenseId"]', omExpenseId!);
    await supervisorPage.selectOption('select[name="month"]', '11');

    // 驗證金額為 2000
    await expect(supervisorPage.locator('[data-testid="chargeout-total"]')).toHaveText('2,000.00');

    // 提交並確認轉嫁
    await supervisorPage.click('button[type="submit"]');
    await supervisorPage.click('button:has-text("確認轉嫁")');

    // 驗證預算類別（Services）的 usedAmount 增加了 2000
    await supervisorPage.goto('/budget-pools');
    // 驗證邏輯...
  });

  /**
   * 場景 3: 費用轉嫁取消和回滾測試
   */
  test('費用轉嫁的取消和回滾流程', async ({ supervisorPage }) => {
    // 創建並確認費用轉嫁
    // ... (類似場景 1 的步驟)

    // 記錄確認前的預算池狀態
    await supervisorPage.goto('/budget-pools');
    const initialUsedAmount = await supervisorPage.locator('[data-testid="used-amount"]').textContent();

    // 確認轉嫁
    await supervisorPage.goto(`/charge-outs/${chargeOutId}`);
    await supervisorPage.click('button:has-text("確認轉嫁")');

    // 驗證預算池已扣除
    await supervisorPage.goto('/budget-pools');
    const confirmedUsedAmount = await supervisorPage.locator('[data-testid="used-amount"]').textContent();
    // 驗證 confirmedUsedAmount > initialUsedAmount

    // 取消轉嫁
    await supervisorPage.goto(`/charge-outs/${chargeOutId}`);
    await supervisorPage.click('button:has-text("取消轉嫁")');
    await supervisorPage.fill('textarea[name="cancellationReason"]', '測試回滾機制');
    await supervisorPage.click('button:has-text("確認取消")');

    // 驗證狀態變為 Cancelled
    await expect(supervisorPage.locator('[data-testid="chargeout-status"]')).toContainText('已取消');

    // 驗證預算池金額已回滾
    await supervisorPage.goto('/budget-pools');
    const cancelledUsedAmount = await supervisorPage.locator('[data-testid="used-amount"]').textContent();
    // 驗證 cancelledUsedAmount === initialUsedAmount

    // 驗證費用狀態回滾為 Approved
    await supervisorPage.goto(`/expenses/${expenseId}`);
    await expect(supervisorPage.locator('[data-testid="expense-status"]')).toContainText('已批准');
  });
});
```

**測試數據準備**:
- 測試 PDF 文件: `test-fixtures/sample-invoice.pdf`
- 測試採購單: seed 數據或前置測試創建
- 測試預算類別: seed 數據中的類別
- 測試營運公司: seed 數據中的 OpCo

**預期結果**:
- ✅ 3/3 測試通過
- ✅ 費用轉嫁流程正確
- ✅ 預算池 usedAmount 正確更新
- ✅ 取消轉嫁時金額正確回滾

---

### 1.4 工作流測試輔助工具

**文件**: `apps/web/e2e/helpers/workflow-helpers.ts`

```typescript
import { Page } from '@playwright/test';

/**
 * 工作流測試輔助函數集
 */

/**
 * 創建測試提案並返回 ID
 */
export async function createTestProposal(
  page: Page,
  data: {
    title: string;
    amount: number;
    projectIndex?: number;
  }
): Promise<string> {
  await page.goto('/proposals/new');
  await page.fill('input[name="title"]', data.title);
  await page.fill('input[name="amount"]', data.amount.toString());
  await page.selectOption('select[name="projectId"]', { index: data.projectIndex || 0 });
  await page.click('button[type="submit"]');

  const url = page.url();
  return url.split('/').pop()!;
}

/**
 * 提交提案審批
 */
export async function submitProposalForApproval(
  page: Page,
  proposalId: string
): Promise<void> {
  await page.goto(`/proposals/${proposalId}`);
  await page.click('button:has-text("提交審批")');
  await page.waitForSelector('[data-testid="proposal-status"]:has-text("待審批")');
}

/**
 * 批准提案
 */
export async function approveProposal(
  page: Page,
  proposalId: string,
  approvedAmount: number,
  comments?: string
): Promise<void> {
  await page.goto(`/proposals/${proposalId}`);
  await page.click('button:has-text("批准")');
  await page.fill('input[name="approvedAmount"]', approvedAmount.toString());
  if (comments) {
    await page.fill('textarea[name="comments"]', comments);
  }
  await page.click('button:has-text("確認批准")');
  await page.waitForSelector('[data-testid="proposal-status"]:has-text("已批准")');
}

/**
 * 創建測試供應商並返回 ID
 */
export async function createTestVendor(
  page: Page,
  data: {
    name: string;
    contactName?: string;
    email?: string;
  }
): Promise<string> {
  await page.goto('/vendors/new');
  await page.fill('input[name="name"]', data.name);
  if (data.contactName) await page.fill('input[name="contactName"]', data.contactName);
  if (data.email) await page.fill('input[name="email"]', data.email);
  await page.click('button[type="submit"]');

  const url = page.url();
  return url.split('/').pop()!;
}

/**
 * 創建測試採購單並返回 ID
 */
export async function createTestPurchaseOrder(
  page: Page,
  data: {
    name: string;
    vendorId: string;
    projectIndex?: number;
    items: Array<{
      itemName: string;
      quantity: number;
      unitPrice: number;
    }>;
  }
): Promise<string> {
  await page.goto('/purchase-orders/new');
  await page.fill('input[name="name"]', data.name);
  await page.selectOption('select[name="projectId"]', { index: data.projectIndex || 0 });
  await page.selectOption('select[name="vendorId"]', data.vendorId);

  for (let i = 0; i < data.items.length; i++) {
    if (i > 0) {
      await page.click('button:has-text("新增品項")');
    }
    const item = data.items[i]!;
    await page.fill(`input[name="items[${i}].itemName"]`, item.itemName);
    await page.fill(`input[name="items[${i}].quantity"]`, item.quantity.toString());
    await page.fill(`input[name="items[${i}].unitPrice"]`, item.unitPrice.toString());
  }

  await page.click('button[type="submit"]');

  const url = page.url();
  return url.split('/').pop()!;
}

/**
 * 獲取預算類別的當前餘額
 */
export async function getBudgetCategoryBalance(
  page: Page,
  categoryId: string
): Promise<{ totalAmount: number; usedAmount: number; remaining: number }> {
  await page.goto('/budget-pools');
  const categoryCard = page.locator(`[data-category-id="${categoryId}"]`);

  const totalAmountText = await categoryCard.locator('[data-testid="total-amount"]').textContent();
  const usedAmountText = await categoryCard.locator('[data-testid="used-amount"]').textContent();

  const totalAmount = parseFloat(totalAmountText!.replace(/[^0-9.]/g, ''));
  const usedAmount = parseFloat(usedAmountText!.replace(/[^0-9.]/g, ''));

  return {
    totalAmount,
    usedAmount,
    remaining: totalAmount - usedAmount,
  };
}

/**
 * 等待通知出現
 */
export async function waitForNotification(
  page: Page,
  expectedText: string,
  timeout: number = 5000
): Promise<boolean> {
  try {
    await page.waitForSelector(`[data-testid="notification"]:has-text("${expectedText}")`, { timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * 上傳測試文件
 */
export async function uploadTestFile(
  page: Page,
  inputSelector: string,
  filePath: string
): Promise<void> {
  const fileInput = page.locator(inputSelector);
  await fileInput.setInputFiles(filePath);
  await page.waitForTimeout(500); // 等待文件上傳處理
}
```

---

## 測試數據 Fixtures

**目錄結構**:
```
apps/web/test-fixtures/
├── sample-proposal.pdf      (測試用計劃書 PDF)
├── sample-quote.pdf          (測試用報價單 PDF)
├── sample-invoice.pdf        (測試用發票 PDF)
└── README.md                 (文件說明)
```

**test-fixtures/README.md**:
```markdown
# E2E 測試文件 Fixtures

本目錄包含 E2E 測試使用的測試文件。

## 文件清單

### sample-proposal.pdf
- **用途**: 預算提案工作流測試
- **內容**: 假的項目計劃書 PDF
- **大小**: < 1MB
- **創建方式**: 使用 Word/Google Docs 創建後轉 PDF

### sample-quote.pdf
- **用途**: 採購工作流測試
- **內容**: 假的供應商報價單
- **大小**: < 1MB

### sample-invoice.pdf
- **用途**: 費用轉嫁工作流測試
- **內容**: 假的供應商發票
- **大小**: < 1MB

## 注意事項
- 所有文件都是測試用途，不包含真實數據
- 文件應該被 .gitignore（或使用 Git LFS）
- 可以使用在線工具生成假的 PDF 文件
```

---

## 階段 1 成功標準

### 測試通過率
- ✅ 預算提案工作流: 4/4 (100%)
- ✅ 採購工作流: 3/3 (100%)
- ✅ 費用轉嫁工作流: 3/3 (100%)
- ✅ 總計: 10/10 (100%)

### 功能覆蓋
- ✅ 完整業務流程驗證
- ✅ 多角色協作流程
- ✅ 狀態機正確運作
- ✅ 數據庫更新正確
- ✅ 關聯關係正確

### 代碼品質
- ✅ 使用輔助函數減少重複代碼
- ✅ 清晰的測試命名和註釋
- ✅ 適當的等待和同步
- ✅ 完整的斷言驗證

---

## 📋 階段 2: 整合測試配置（優先級：🟡 中）

### **預計時間**: 1-2 工作天
### **目標**: 統一測試環境配置，清理臨時測試文件

### 2.1 合併測試配置

**任務**:
1. 將 `playwright.config.test.ts` 的配置合併到 `playwright.config.ts`
2. 使用環境變數區分測試環境和開發環境
3. 標準化所有測試使用統一端口

**實施步驟**:

#### 步驟 1: 更新主配置文件

**文件**: `apps/web/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 配置
 *
 * 環境變數:
 * - TEST_PORT: 測試服務器端口（默認 3000）
 * - CI: CI 環境標記
 */

const TEST_PORT = process.env.TEST_PORT || '3000';
const BASE_URL = process.env.BASE_URL || `http://localhost:${TEST_PORT}`;

export default defineConfig({
  testDir: './e2e',

  // 測試執行配置
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter 配置
  reporter: process.env.CI
    ? [['github'], ['html', { outputFolder: 'playwright-report' }]]
    : [['list'], ['html', { open: 'on-failure' }]],

  // 全局配置
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // 項目配置（瀏覽器）
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile 配置（可選）
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  // Web Server 配置（用於 CI 環境）
  webServer: process.env.CI ? {
    command: 'pnpm build && pnpm start',
    port: parseInt(TEST_PORT),
    timeout: 120 * 1000,
    reuseExistingServer: false,
  } : undefined,
});
```

#### 步驟 2: 更新環境變數配置

**文件**: `.env.test` (新建)

```bash
# E2E 測試環境配置

# 應用端口
PORT=3000
TEST_PORT=3000

# NextAuth 配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<ROTATED-2026-06-11-SEE-KEYVAULT>
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 數據庫配置（使用測試數據庫）
DATABASE_URL="postgresql://postgres:localdev123@localhost:5434/itpm_test"

# 其他服務配置（繼承自主 .env）
# Redis, Azure Storage, etc.
```

#### 步驟 3: 更新 package.json 測試腳本

**文件**: `apps/web/package.json`

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:chromium": "playwright test --project=chromium",
    "test:e2e:firefox": "playwright test --project=firefox",
    "test:e2e:webkit": "playwright test --project=webkit",
    "test:e2e:mobile": "playwright test --project=mobile-chrome",
    "test:e2e:workflows": "playwright test e2e/workflows",
    "test:e2e:basic": "playwright test e2e/example.spec.ts",
    "test:e2e:report": "playwright show-report"
  }
}
```

#### 步驟 4: 清理臨時文件

**刪除文件**:
- ❌ `apps/web/playwright.config.test.ts` (合併到主配置)
- ❌ `apps/web/.env.test.local` (改用 .env.test)
- ❌ `scripts/test-login-3006.ts` (不再需要)
- ❌ `scripts/test-nextauth-direct.ts` (不再需要)

**保留文件**:
- ✅ `apps/web/playwright.config.ts` (主配置)
- ✅ `apps/web/.env.test` (測試環境配置)
- ✅ `claudedocs/E2E-*.md` (文檔記錄)

### 2.2 創建測試數據管理腳本

**文件**: `scripts/test-data-setup.ts`

```typescript
#!/usr/bin/env tsx

/**
 * E2E 測試數據設置腳本
 *
 * 用途:
 * - 創建測試數據庫
 * - 運行 migrations
 * - 填充 seed 數據
 * - 創建測試用戶
 */

import { PrismaClient } from '@itpm/db';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 開始設置 E2E 測試數據...\n');

  // 1. 清理現有數據
  console.log('🗑️  清理現有測試數據...');
  await prisma.chargeOut.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.budgetProposal.deleteMany();
  await prisma.project.deleteMany();
  await prisma.budgetCategory.deleteMany();
  await prisma.budgetPool.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  console.log('✅ 清理完成\n');

  // 2. 創建角色
  console.log('👥 創建角色...');
  await prisma.role.createMany({
    data: [
      { id: 1, name: 'Admin' },
      { id: 2, name: 'ProjectManager' },
      { id: 3, name: 'Supervisor' },
    ],
  });
  console.log('✅ 角色創建完成\n');

  // 3. 創建測試用戶
  console.log('👤 創建測試用戶...');
  const hashedPassword = await bcrypt.hash('testpassword123', 10);

  const testManager = await prisma.user.create({
    data: {
      email: 'test-manager@example.com',
      name: '測試 PM',
      password: hashedPassword,
      roleId: 2,
      emailVerified: new Date(),
    },
  });
  console.log(`✅ PM 用戶創建: ${testManager.email}`);

  const testSupervisor = await prisma.user.create({
    data: {
      email: 'test-supervisor@example.com',
      name: '測試主管',
      password: hashedPassword,
      roleId: 3,
      emailVerified: new Date(),
    },
  });
  console.log(`✅ 主管用戶創建: ${testSupervisor.email}\n`);

  // 4. 創建預算池和類別
  console.log('💰 創建預算池和類別...');
  const budgetPool = await prisma.budgetPool.create({
    data: {
      name: 'FY2025 IT 預算',
      financialYear: 2025,
      description: '測試用預算池',
      categories: {
        create: [
          { categoryName: 'Hardware', totalAmount: 100000, usedAmount: 0, sortOrder: 1 },
          { categoryName: 'Software', totalAmount: 80000, usedAmount: 0, sortOrder: 2 },
          { categoryName: 'Services', totalAmount: 60000, usedAmount: 0, sortOrder: 3 },
        ],
      },
    },
    include: {
      categories: true,
    },
  });
  console.log(`✅ 預算池創建: ${budgetPool.name}`);
  console.log(`   - 類別數: ${budgetPool.categories.length}\n`);

  // 5. 創建測試項目
  console.log('📁 創建測試項目...');
  const project = await prisma.project.create({
    data: {
      name: '測試項目 - ERP 系統升級',
      description: '用於 E2E 測試的項目',
      budgetPoolId: budgetPool.id,
      budgetCategoryId: budgetPool.categories[0]!.id,
      managerId: testManager.id,
      supervisorId: testSupervisor.id,
      requestedBudget: 50000,
      startDate: new Date('2025-01-01'),
      status: 'InProgress',
    },
  });
  console.log(`✅ 項目創建: ${project.name}\n`);

  // 6. 創建測試供應商
  console.log('🏪 創建測試供應商...');
  const vendor = await prisma.vendor.create({
    data: {
      name: '測試供應商 - 科技公司',
      contactName: '王銷售',
      email: 'sales@test-vendor.com',
      phone: '+852-1234-5678',
    },
  });
  console.log(`✅ 供應商創建: ${vendor.name}\n`);

  // 7. 創建營運公司
  console.log('🏢 創建營運公司...');
  await prisma.operatingCompany.createMany({
    data: [
      { code: 'OpCo-HK', name: 'Hong Kong Operations' },
      { code: 'OpCo-SG', name: 'Singapore Operations' },
      { code: 'OpCo-CN', name: 'China Operations' },
    ],
  });
  console.log('✅ 營運公司創建完成\n');

  console.log('🎉 E2E 測試數據設置完成！');
}

main()
  .catch((e) => {
    console.error('❌ 錯誤:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**添加 npm 腳本**:

```json
{
  "scripts": {
    "test:setup": "tsx scripts/test-data-setup.ts",
    "test:reset": "pnpm test:setup"
  }
}
```

### 2.3 整合測試運行流程

**文件**: `scripts/run-e2e-tests.sh`

```bash
#!/bin/bash

# E2E 測試完整運行腳本

set -e

echo "🧪 開始 E2E 測試流程..."

# 1. 設置測試數據庫
echo "📊 設置測試數據..."
pnpm test:setup

# 2. 啟動測試服務器（後台）
echo "🚀 啟動測試服務器..."
pnpm dev &
DEV_SERVER_PID=$!

# 等待服務器啟動
sleep 10

# 3. 運行 E2E 測試
echo "🎭 運行 E2E 測試..."
pnpm test:e2e

# 4. 清理
echo "🧹 清理..."
kill $DEV_SERVER_PID

echo "✅ E2E 測試完成！"
```

### 階段 2 成功標準

- ✅ 測試配置統一到主配置文件
- ✅ 所有測試使用標準端口（3000）
- ✅ 臨時測試文件已清理
- ✅ 測試數據管理腳本可用
- ✅ 測試運行流程自動化

---

## 📋 階段 3: 提升測試覆蓋率（優先級：🟡 中）

### **預計時間**: 3-4 工作天
### **目標**: 添加錯誤處理、邊界條件和表單驗證測試

### 3.1 錯誤處理測試

**文件**: `apps/web/e2e/error-handling.spec.ts`

**測試場景**:

```typescript
import { test, expect } from './fixtures/auth';

test.describe('錯誤處理測試', () => {

  /**
   * 測試 1: 無效登入憑證
   */
  test('無效的登入憑證應顯示錯誤訊息', async ({ page }) => {
    await page.goto('/login');

    // 嘗試使用錯誤的密碼登入
    await page.fill('input[type="email"]', 'test-manager@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // 驗證錯誤訊息
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Email 或密碼錯誤');

    // 驗證仍然在登入頁面
    await expect(page).toHaveURL('/login');
  });

  /**
   * 測試 2: 未授權訪問
   */
  test('未登入用戶訪問受保護頁面應重定向到登入', async ({ page }) => {
    // 嘗試直接訪問 dashboard
    await page.goto('/dashboard');

    // 驗證重定向到登入頁面
    await expect(page).toHaveURL('/login');
  });

  /**
   * 測試 3: 權限不足
   */
  test('PM 嘗試訪問主管專屬頁面應顯示權限錯誤', async ({ managerPage }) => {
    // PM 嘗試訪問主管才能訪問的頁面
    await managerPage.goto('/admin/users');

    // 驗證錯誤訊息或重定向
    await expect(managerPage.locator('[data-testid="permission-error"]')).toContainText('權限不足');
  });

  /**
   * 測試 4: 無效的提案金額
   */
  test('提交負數金額的提案應顯示驗證錯誤', async ({ managerPage }) => {
    await managerPage.goto('/proposals/new');

    await managerPage.fill('input[name="title"]', '測試提案');
    await managerPage.fill('input[name="amount"]', '-1000'); // 負數
    await managerPage.selectOption('select[name="projectId"]', { index: 0 });
    await managerPage.click('button[type="submit"]');

    // 驗證前端驗證錯誤
    await expect(managerPage.locator('[data-testid="amount-error"]')).toContainText('金額必須大於 0');
  });

  /**
   * 測試 5: 必填欄位缺失
   */
  test('提交空白表單應顯示所有必填欄位錯誤', async ({ managerPage }) => {
    await managerPage.goto('/proposals/new');

    // 直接提交空白表單
    await managerPage.click('button[type="submit"]');

    // 驗證所有必填欄位錯誤
    await expect(managerPage.locator('[data-testid="title-error"]')).toContainText('此欄位為必填');
    await expect(managerPage.locator('[data-testid="amount-error"]')).toContainText('此欄位為必填');
    await expect(managerPage.locator('[data-testid="projectId-error"]')).toContainText('此欄位為必填');
  });

  /**
   * 測試 6: 網絡錯誤處理
   */
  test('API 錯誤應顯示友好的錯誤訊息', async ({ managerPage }) => {
    // 模擬網絡錯誤（斷開連接）
    await managerPage.context().setOffline(true);

    await managerPage.goto('/proposals');

    // 驗證錯誤訊息
    await expect(managerPage.locator('[data-testid="network-error"]')).toContainText('無法連接到服務器');

    // 恢復連接
    await managerPage.context().setOffline(false);

    // 重試應該成功
    await managerPage.click('button:has-text("重試")');
    await expect(managerPage.locator('[data-testid="proposals-list"]')).toBeVisible();
  });

  /**
   * 測試 7: 404 頁面
   */
  test('訪問不存在的頁面應顯示 404', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');

    await expect(page.locator('h1')).toContainText('404');
    await expect(page.locator('[data-testid="not-found-message"]')).toContainText('找不到頁面');

    // 驗證有返回首頁的鏈接
    await expect(page.locator('a[href="/"]')).toBeVisible();
  });

  /**
   * 測試 8: 文件上傳錯誤
   */
  test('上傳過大的文件應顯示錯誤', async ({ managerPage }) => {
    await managerPage.goto('/proposals/new');

    // 嘗試上傳超過 10MB 的文件
    // (需要準備一個大文件或模擬)
    const fileInput = managerPage.locator('input[type="file"]');
    // ... 模擬大文件上傳

    await expect(managerPage.locator('[data-testid="file-size-error"]')).toContainText('文件大小不能超過 10MB');
  });
});
```

### 3.2 表單驗證測試

**文件**: `apps/web/e2e/form-validation.spec.ts`

```typescript
import { test, expect } from './fixtures/auth';

test.describe('表單驗證測試', () => {

  /**
   * 測試 1: Email 格式驗證
   */
  test('無效的 Email 格式應顯示驗證錯誤', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="name"]', '測試用戶');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page.locator('[data-testid="email-error"]')).toContainText('請輸入有效的 Email');
  });

  /**
   * 測試 2: 密碼強度驗證
   */
  test('弱密碼應顯示驗證錯誤', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="name"]', '測試用戶');
    await page.fill('input[name="password"]', '123'); // 太短
    await page.click('button[type="submit"]');

    await expect(page.locator('[data-testid="password-error"]')).toContainText('密碼至少需要 8 個字符');
  });

  /**
   * 測試 3: 日期範圍驗證
   */
  test('結束日期早於開始日期應顯示錯誤', async ({ managerPage }) => {
    await managerPage.goto('/projects/new');

    await managerPage.fill('input[name="name"]', '測試項目');
    await managerPage.selectOption('select[name="budgetPoolId"]', { index: 0 });
    await managerPage.fill('input[name="startDate"]', '2025-12-31');
    await managerPage.fill('input[name="endDate"]', '2025-01-01'); // 早於開始日期
    await managerPage.click('button[type="submit"]');

    await expect(managerPage.locator('[data-testid="endDate-error"]')).toContainText('結束日期不能早於開始日期');
  });

  /**
   * 測試 4: 數量驗證
   */
  test('採購單品項數量必須為正整數', async ({ managerPage }) => {
    await managerPage.goto('/purchase-orders/new');

    // 填寫基本信息
    await managerPage.fill('input[name="name"]', '測試採購單');
    await managerPage.selectOption('select[name="projectId"]', { index: 0 });
    await managerPage.selectOption('select[name="vendorId"]', { index: 0 });

    // 添加品項
    await managerPage.click('button:has-text("新增品項")');
    await managerPage.fill('input[name="items[0].itemName"]', '測試品項');
    await managerPage.fill('input[name="items[0].quantity"]', '0'); // 無效數量
    await managerPage.fill('input[name="items[0].unitPrice"]', '100');

    await managerPage.click('button[type="submit"]');

    await expect(managerPage.locator('[data-testid="items[0].quantity-error"]')).toContainText('數量必須大於 0');
  });

  /**
   * 測試 5: 金額格式驗證
   */
  test('金額應只接受數字和小數點', async ({ managerPage }) => {
    await managerPage.goto('/proposals/new');

    await managerPage.fill('input[name="title"]', '測試提案');
    await managerPage.fill('input[name="amount"]', 'abc123'); // 無效金額
    await managerPage.selectOption('select[name="projectId"]', { index: 0 });

    // 驗證輸入過濾或錯誤訊息
    const amountValue = await managerPage.locator('input[name="amount"]').inputValue();
    expect(amountValue).toBe(''); // 無效字符應被過濾
  });

  /**
   * 測試 6: 即時驗證
   */
  test('表單欄位應提供即時驗證反饋', async ({ page }) => {
    await page.goto('/login');

    // 填寫 email
    await page.fill('input[type="email"]', 'invalid');

    // 移動焦點
    await page.click('input[type="password"]');

    // 驗證即時錯誤訊息
    await expect(page.locator('[data-testid="email-error"]')).toContainText('請輸入有效的 Email');

    // 修正 email
    await page.fill('input[type="email"]', 'valid@example.com');

    // 驗證錯誤訊息消失
    await expect(page.locator('[data-testid="email-error"]')).not.toBeVisible();
  });
});
```

### 3.3 邊界條件測試

**文件**: `apps/web/e2e/boundary-conditions.spec.ts`

```typescript
import { test, expect } from './fixtures/auth';

test.describe('邊界條件測試', () => {

  /**
   * 測試 1: 最大長度限制
   */
  test('提案標題不能超過最大長度', async ({ managerPage }) => {
    await managerPage.goto('/proposals/new');

    // 嘗試輸入超長標題（假設最大 200 字符）
    const longTitle = 'A'.repeat(300);
    await managerPage.fill('input[name="title"]', longTitle);

    // 驗證輸入被截斷或顯示錯誤
    const actualValue = await managerPage.locator('input[name="title"]').inputValue();
    expect(actualValue.length).toBeLessThanOrEqual(200);
  });

  /**
   * 測試 2: 零金額
   */
  test('零金額提案應被拒絕', async ({ managerPage }) => {
    await managerPage.goto('/proposals/new');

    await managerPage.fill('input[name="title"]', '零金額測試');
    await managerPage.fill('input[name="amount"]', '0');
    await managerPage.selectOption('select[name="projectId"]', { index: 0 });
    await managerPage.click('button[type="submit"]');

    await expect(managerPage.locator('[data-testid="amount-error"]')).toContainText('金額必須大於 0');
  });

  /**
   * 測試 3: 極大金額
   */
  test('極大金額應被正確處理', async ({ managerPage }) => {
    await managerPage.goto('/proposals/new');

    const largeAmount = '999999999.99';
    await managerPage.fill('input[name="title"]', '極大金額測試');
    await managerPage.fill('input[name="amount"]', largeAmount);
    await managerPage.selectOption('select[name="projectId"]', { index: 0 });
    await managerPage.click('button[type="submit"]');

    // 驗證金額正確保存和顯示
    await expect(managerPage.locator('[data-testid="proposal-amount"]')).toContainText(largeAmount);
  });

  /**
   * 測試 4: 空列表處理
   */
  test('無數據時應顯示空狀態', async ({ managerPage }) => {
    // 假設這是一個新用戶，沒有任何提案
    await managerPage.goto('/proposals');

    // 驗證空狀態顯示
    await expect(managerPage.locator('[data-testid="empty-state"]')).toBeVisible();
    await expect(managerPage.locator('[data-testid="empty-state"]')).toContainText('尚無提案');
    await expect(managerPage.locator('a[href="/proposals/new"]')).toBeVisible();
  });

  /**
   * 測試 5: 分頁邊界
   */
  test('最後一頁應正確顯示', async ({ managerPage }) => {
    await managerPage.goto('/proposals');

    // 跳到最後一頁
    await managerPage.click('[data-testid="pagination-last"]');

    // 驗證「下一頁」按鈕被禁用
    await expect(managerPage.locator('[data-testid="pagination-next"]')).toBeDisabled();

    // 驗證頁碼正確
    const currentPage = await managerPage.locator('[data-testid="current-page"]').textContent();
    const totalPages = await managerPage.locator('[data-testid="total-pages"]').textContent();
    expect(currentPage).toBe(totalPages);
  });

  /**
   * 測試 6: 搜尋無結果
   */
  test('搜尋無結果時應顯示適當訊息', async ({ managerPage }) => {
    await managerPage.goto('/proposals');

    // 搜尋一個不存在的關鍵字
    await managerPage.fill('input[name="search"]', 'xyzabc123456789');
    await managerPage.click('button[type="submit"]');

    // 驗證無結果訊息
    await expect(managerPage.locator('[data-testid="no-results"]')).toBeVisible();
    await expect(managerPage.locator('[data-testid="no-results"]')).toContainText('找不到符合的結果');
  });

  /**
   * 測試 7: 併發操作
   */
  test('同時編輯同一提案應有衝突處理', async ({ managerPage, page: anotherPage }) => {
    // PM1 打開提案
    await managerPage.goto('/proposals/test-proposal-id');
    await managerPage.click('button:has-text("編輯")');

    // PM2 同時打開並編輯同一提案
    await anotherPage.goto('/proposals/test-proposal-id');
    await anotherPage.click('button:has-text("編輯")');
    await anotherPage.fill('input[name="title"]', '修改後的標題');
    await anotherPage.click('button[type="submit"]');

    // PM1 嘗試提交
    await managerPage.fill('input[name="title"]', '另一個修改');
    await managerPage.click('button[type="submit"]');

    // 驗證衝突提示
    await expect(managerPage.locator('[data-testid="conflict-warning"]')).toContainText('此提案已被其他用戶修改');
  });
});
```

### 階段 3 成功標準

- ✅ 錯誤處理測試: 8/8 通過
- ✅ 表單驗證測試: 6/6 通過
- ✅ 邊界條件測試: 7/7 通過
- ✅ 總計新增測試: 21 個
- ✅ 測試覆蓋率提升到 60%+

---

## 📋 階段 4: CI/CD 集成（優先級：🟢 低）

### **預計時間**: 2-3 工作天
### **目標**: 實施 GitHub Actions 自動化測試流程

### 4.1 GitHub Actions 工作流

**文件**: `.github/workflows/e2e-tests.yml`

```yaml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  workflow_dispatch:

env:
  NODE_VERSION: '20.11.0'
  PNPM_VERSION: '8.15.3'

jobs:
  e2e-tests:
    name: E2E Tests - ${{ matrix.browser }}
    runs-on: ubuntu-latest
    timeout-minutes: 60

    strategy:
      fail-fast: false
      matrix:
        browser: [chromium, firefox, webkit]

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: testpassword
          POSTGRES_DB: itpm_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Get pnpm store directory
        shell: bash
        run: |
          echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

      - name: Setup pnpm cache
        uses: actions/cache@v3
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Setup test environment
        run: |
          cp .env.example .env.test
          echo "DATABASE_URL=postgresql://postgres:testpassword@localhost:5432/itpm_test" >> .env.test
          echo "REDIS_URL=redis://localhost:6379" >> .env.test
          echo "NEXTAUTH_URL=http://localhost:3000" >> .env.test
          echo "NEXTAUTH_SECRET=${{ secrets.NEXTAUTH_SECRET }}" >> .env.test

      - name: Generate Prisma Client
        run: pnpm db:generate

      - name: Run database migrations
        run: pnpm db:migrate
        env:
          DATABASE_URL: postgresql://postgres:testpassword@localhost:5432/itpm_test

      - name: Setup test data
        run: pnpm test:setup
        env:
          DATABASE_URL: postgresql://postgres:testpassword@localhost:5432/itpm_test

      - name: Build application
        run: pnpm build

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps ${{ matrix.browser }}

      - name: Run E2E tests
        run: pnpm test:e2e --project=${{ matrix.browser }}
        env:
          CI: true
          DATABASE_URL: postgresql://postgres:testpassword@localhost:5432/itpm_test
          REDIS_URL: redis://localhost:6379

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report-${{ matrix.browser }}
          path: apps/web/playwright-report/
          retention-days: 30

      - name: Upload test videos
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-videos-${{ matrix.browser }}
          path: apps/web/test-results/
          retention-days: 7

  test-summary:
    name: Test Summary
    runs-on: ubuntu-latest
    needs: e2e-tests
    if: always()

    steps:
      - name: Download all test reports
        uses: actions/download-artifact@v3

      - name: Generate test summary
        run: |
          echo "## E2E Test Results" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "### Browser Coverage" >> $GITHUB_STEP_SUMMARY
          echo "- Chromium: ${{ needs.e2e-tests.result }}" >> $GITHUB_STEP_SUMMARY
          echo "- Firefox: ${{ needs.e2e-tests.result }}" >> $GITHUB_STEP_SUMMARY
          echo "- WebKit: ${{ needs.e2e-tests.result }}" >> $GITHUB_STEP_SUMMARY
```

### 4.2 PR 檢查配置

**文件**: `.github/workflows/pr-checks.yml`

```yaml
name: PR Checks

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  basic-tests:
    name: Basic E2E Tests
    runs-on: ubuntu-latest
    timeout-minutes: 30

    # ... (類似配置，但只運行基本測試)

    steps:
      # ... (setup steps)

      - name: Run basic E2E tests only
        run: pnpm test:e2e:basic --project=chromium

  workflow-tests:
    name: Workflow E2E Tests
    runs-on: ubuntu-latest
    timeout-minutes: 45

    steps:
      # ... (setup steps)

      - name: Run workflow tests
        run: pnpm test:e2e:workflows --project=chromium

  comment-results:
    name: Comment Test Results
    runs-on: ubuntu-latest
    needs: [basic-tests, workflow-tests]
    if: always()

    permissions:
      pull-requests: write

    steps:
      - name: Comment PR with results
        uses: actions/github-script@v7
        with:
          script: |
            const { data: comments } = await github.rest.issues.listComments({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
            });

            const botComment = comments.find(comment => {
              return comment.user.type === 'Bot' && comment.body.includes('E2E Test Results');
            });

            const output = `## E2E Test Results

            ✅ Basic Tests: ${{ needs.basic-tests.result }}
            ✅ Workflow Tests: ${{ needs.workflow-tests.result }}

            [View full results](${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }})
            `;

            if (botComment) {
              await github.rest.issues.updateComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                comment_id: botComment.id,
                body: output
              });
            } else {
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.issue.number,
                body: output
              });
            }
```

### 4.3 測試報告配置

**文件**: `apps/web/playwright.config.ts` (更新 reporter)

```typescript
export default defineConfig({
  // ... 其他配置

  reporter: process.env.CI
    ? [
        ['github'],
        ['html', {
          outputFolder: 'playwright-report',
          open: 'never',
        }],
        ['json', {
          outputFile: 'test-results/results.json'
        }],
        ['junit', {
          outputFile: 'test-results/junit.xml'
        }],
      ]
    : [
        ['list'],
        ['html', { open: 'on-failure' }],
      ],
});
```

### 階段 4 成功標準

- ✅ GitHub Actions 工作流配置完成
- ✅ 自動化測試在 PR 時觸發
- ✅ 測試報告自動上傳
- ✅ PR 中顯示測試結果註釋
- ✅ 支持 3 種瀏覽器（Chromium, Firefox, WebKit）

---

## 📊 總體成功指標

### 測試覆蓋率目標

| 階段 | 測試數量 | 覆蓋率 | 狀態 |
|------|---------|--------|------|
| 基本功能 | 7 | 20% | ✅ 完成 |
| 工作流 | 10 | 40% | ⏳ 階段 1 |
| 錯誤處理 | 21 | 60% | ⏳ 階段 3 |
| 完整覆蓋 | 40+ | 80%+ | ⏳ 長期 |

### 質量指標

- ✅ 測試通過率: 100%
- ✅ 測試執行時間: < 5 分鐘（基本） | < 15 分鐘（完整）
- ✅ 測試穩定性: 無 flaky 測試
- ✅ 測試可維護性: 使用輔助函數，清晰命名

### 文檔完整性

- ✅ 測試計劃文檔
- ✅ 測試數據文檔
- ✅ CI/CD 配置文檔
- ✅ 故障排除指南

---

## 📝 實施時間表

### Sprint 1 (Week 1-2)
- **Day 1-2**: 階段 1.1 - 預算提案工作流測試
- **Day 3-4**: 階段 1.2 - 採購工作流測試
- **Day 5-6**: 階段 1.3 - 費用轉嫁工作流測試

### Sprint 2 (Week 2-3)
- **Day 7-8**: 階段 2 - 整合測試配置
- **Day 9-11**: 階段 3.1 - 錯誤處理測試
- **Day 12**: 階段 3.2 - 表單驗證測試

### Sprint 3 (Week 3-4)
- **Day 13**: 階段 3.3 - 邊界條件測試
- **Day 14-15**: 階段 4 - CI/CD 集成

---

## 🎯 下一步行動

1. **立即開始**: 創建 `e2e/workflows/` 目錄
2. **準備測試數據**: 創建 test-fixtures 文件
3. **實施工作流測試**: 按照階段 1 計劃執行
4. **持續集成**: 定期運行測試並修復問題

---

**文檔創建**: 2025-10-28
**預計完成**: 2025-11-15
**負責人**: 開發團隊
