# Stage 3-4 實施計劃：進階測試 + CI/CD 自動化

**創建日期**: 2025-11-01
**預計完成**: 2025-11-22 (3 週)
**目標**: 測試覆蓋率 40% → 60%+ | 建立完整 CI/CD 管道

---

## 📋 總體時間表

```
Week 1-2: Stage 3 進階測試 (21 scenarios)
Week 3:   Stage 4 CI/CD 自動化 (GitHub Actions + Azure)
```

---

## 🎯 Phase 1: 錯誤處理測試 (Week 1, Days 1-3)

### 目標
建立完整的錯誤恢復與異常處理測試覆蓋

### 測試場景清單 (8 scenarios)

#### 1.1 API 500 錯誤恢復
**文件**: `apps/web/e2e/error-handling/api-errors.spec.ts`

```typescript
test('應該在 API 500 錯誤後顯示錯誤訊息並允許重試', async ({ page }) => {
  // 模擬 API 500 錯誤
  await page.route('**/api/trpc/project.create*', route =>
    route.fulfill({ status: 500, body: 'Internal Server Error' })
  );

  // 嘗試創建項目
  await page.goto('/projects/new');
  await page.fill('input[name="name"]', 'Test Project');
  await page.click('button[type="submit"]');

  // 驗證錯誤訊息顯示
  await expect(page.locator('text=伺服器錯誤，請稍後重試')).toBeVisible();

  // 移除 API 攔截，允許正常請求
  await page.unroute('**/api/trpc/project.create*');

  // 驗證重試成功
  await page.click('button:has-text("重試")');
  await expect(page.locator('text=項目創建成功')).toBeVisible();
});
```

**驗證重點**:
- ✅ 錯誤訊息正確顯示
- ✅ 重試按鈕可用
- ✅ 重試後正常工作
- ✅ 表單數據保留

---

#### 1.2 網路超時處理
**文件**: `apps/web/e2e/error-handling/network-timeout.spec.ts`

```typescript
test('應該在網路超時後顯示超時訊息', async ({ page }) => {
  // 模擬網路超時 (延遲 30 秒)
  await page.route('**/api/trpc/budgetProposal.submit*', route =>
    new Promise(resolve => setTimeout(() => resolve(route.abort()), 30000))
  );

  // 提交預算申請
  await page.goto('/proposals/new');
  await page.fill('input[name="title"]', 'Q1 Budget');
  await page.fill('input[name="amount"]', '50000');
  await page.click('button[type="submit"]');

  // 驗證超時訊息 (10秒超時)
  await expect(page.locator('text=請求超時，請檢查網路連接')).toBeVisible({ timeout: 15000 });
});
```

**驗證重點**:
- ✅ 超時機制正確觸發 (10秒)
- ✅ 用戶友好的錯誤訊息
- ✅ Loading 狀態正確移除
- ✅ 表單可重新提交

---

#### 1.3 權限拒絕場景
**文件**: `apps/web/e2e/error-handling/permission-denied.spec.ts`

```typescript
test('ProjectManager 不應該能訪問用戶管理頁面', async ({ page }) => {
  // 以 ProjectManager 身份登入
  await page.goto('/login');
  await page.fill('input[name="email"]', 'pm@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // 嘗試訪問用戶管理
  await page.goto('/users');

  // 驗證重定向到 403 或 dashboard
  await expect(page).toHaveURL(/\/(dashboard|403)/);
  await expect(page.locator('text=權限不足')).toBeVisible();
});

test('Supervisor 應該能審批但不能刪除項目', async ({ page }) => {
  // 以 Supervisor 身份登入
  await page.goto('/login');
  await page.fill('input[name="email"]', 'supervisor@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // 訪問項目詳情頁
  await page.goto('/projects/test-project-id');

  // 驗證沒有刪除按鈕
  await expect(page.locator('button:has-text("刪除項目")')).not.toBeVisible();

  // 驗證有審批權限
  await expect(page.locator('button:has-text("審批")')).toBeVisible();
});
```

**驗證重點**:
- ✅ RBAC 正確執行
- ✅ 未授權訪問被阻止
- ✅ 適當的錯誤訊息
- ✅ UI 元素根據權限顯示/隱藏

---

#### 1.4 數據驗證失敗
**文件**: `apps/web/e2e/error-handling/validation-errors.spec.ts`

```typescript
test('應該阻止負數預算申請並顯示驗證錯誤', async ({ page }) => {
  await page.goto('/proposals/new');

  // 輸入負數金額
  await page.fill('input[name="amount"]', '-10000');
  await page.click('button[type="submit"]');

  // 驗證客戶端驗證
  await expect(page.locator('text=金額必須大於 0')).toBeVisible();

  // 驗證表單未提交
  await expect(page).toHaveURL(/\/proposals\/new/);
});

test('應該阻止結束日期早於開始日期', async ({ page }) => {
  await page.goto('/projects/new');

  await page.fill('input[name="name"]', 'Test Project');
  await page.fill('input[name="startDate"]', '2025-12-01');
  await page.fill('input[name="endDate"]', '2025-11-01');
  await page.click('button[type="submit"]');

  // 驗證日期邏輯驗證
  await expect(page.locator('text=結束日期不能早於開始日期')).toBeVisible();
});
```

**驗證重點**:
- ✅ Zod 客戶端驗證工作
- ✅ 錯誤訊息清晰具體
- ✅ 表單欄位高亮顯示錯誤
- ✅ 多個錯誤同時顯示

---

#### 1.5 並發衝突處理
**文件**: `apps/web/e2e/error-handling/concurrent-conflicts.spec.ts`

```typescript
test('應該處理兩個用戶同時審批同一申請的衝突', async ({ browser }) => {
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  // 兩個 Supervisor 同時登入
  await Promise.all([
    loginAsSupervisor(page1),
    loginAsSupervisor(page2)
  ]);

  // 同時訪問同一個申請
  const proposalId = 'test-proposal-id';
  await Promise.all([
    page1.goto(`/proposals/${proposalId}`),
    page2.goto(`/proposals/${proposalId}`)
  ]);

  // Page1 先審批
  await page1.click('button:has-text("批准")');
  await expect(page1.locator('text=審批成功')).toBeVisible();

  // Page2 嘗試審批（應該失敗）
  await page2.click('button:has-text("批准")');
  await expect(page2.locator('text=此申請已被處理')).toBeVisible();

  await context1.close();
  await context2.close();
});
```

**驗證重點**:
- ✅ 樂觀鎖機制工作
- ✅ 衝突檢測準確
- ✅ 適當的錯誤訊息
- ✅ 頁面狀態自動刷新

---

#### 1.6 文件上傳失敗
**文件**: `apps/web/e2e/error-handling/file-upload-errors.spec.ts`

```typescript
test('應該拒絕超過 10MB 的文件上傳', async ({ page }) => {
  await page.goto('/expenses/new');

  // 模擬上傳大文件
  const largeFile = Buffer.alloc(11 * 1024 * 1024); // 11MB
  await page.setInputFiles('input[type="file"]', {
    name: 'large-invoice.pdf',
    mimeType: 'application/pdf',
    buffer: largeFile
  });

  // 驗證文件大小限制
  await expect(page.locator('text=文件大小不能超過 10MB')).toBeVisible();
});

test('應該拒絕不支持的文件格式', async ({ page }) => {
  await page.goto('/expenses/new');

  await page.setInputFiles('input[type="file"]', {
    name: 'virus.exe',
    mimeType: 'application/x-msdownload',
    buffer: Buffer.from('test')
  });

  // 驗證文件類型限制
  await expect(page.locator('text=只支持 PDF、JPG、PNG 格式')).toBeVisible();
});
```

**驗證重點**:
- ✅ 文件大小限制
- ✅ 文件類型驗證
- ✅ 上傳進度顯示
- ✅ 錯誤後可重新上傳

---

#### 1.7 會話過期處理
**文件**: `apps/web/e2e/error-handling/session-expiry.spec.ts`

```typescript
test('應該在會話過期後重定向到登入頁', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'pm@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // 等待進入 dashboard
  await expect(page).toHaveURL(/\/dashboard/);

  // 模擬會話過期（清除 cookie）
  await page.context().clearCookies();

  // 嘗試訪問受保護頁面
  await page.goto('/projects/new');

  // 驗證重定向到登入頁
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator('text=會話已過期，請重新登入')).toBeVisible();
});
```

**驗證重點**:
- ✅ 會話過期檢測
- ✅ 自動重定向到登入
- ✅ 登入後返回原頁面
- ✅ 保留表單數據（如果可能）

---

#### 1.8 數據庫連接失敗
**文件**: `apps/web/e2e/error-handling/database-errors.spec.ts`

```typescript
test('應該優雅處理數據庫連接失敗', async ({ page }) => {
  // 模擬數據庫錯誤
  await page.route('**/api/trpc/**', route =>
    route.fulfill({
      status: 503,
      body: JSON.stringify({ error: 'Database connection failed' })
    })
  );

  await page.goto('/dashboard');

  // 驗證友好的錯誤訊息
  await expect(page.locator('text=系統暫時無法使用，請稍後再試')).toBeVisible();

  // 驗證有重試選項
  await expect(page.locator('button:has-text("重新載入")')).toBeVisible();
});
```

**驗證重點**:
- ✅ 友好的錯誤訊息（不暴露技術細節）
- ✅ 重試機制
- ✅ Fallback UI
- ✅ 錯誤日誌記錄

---

### Phase 1 驗收標準

- ✅ 8 個錯誤處理測試全部通過
- ✅ 錯誤訊息用戶友好
- ✅ 所有錯誤有恢復機制
- ✅ 測試覆蓋率增加 +10%

---

## 🎯 Phase 2: 表單驗證測試 (Week 1, Days 4-5)

### 目標
確保所有表單的驗證邏輯完整且用戶友好

### 測試場景清單 (6 scenarios)

#### 2.1 必填欄位驗證
**文件**: `apps/web/e2e/form-validation/required-fields.spec.ts`

```typescript
test('項目表單應該驗證所有必填欄位', async ({ page }) => {
  await page.goto('/projects/new');

  // 不填寫任何欄位，直接提交
  await page.click('button[type="submit"]');

  // 驗證所有必填欄位顯示錯誤
  await expect(page.locator('text=項目名稱為必填')).toBeVisible();
  await expect(page.locator('text=請選擇預算池')).toBeVisible();
  await expect(page.locator('text=請選擇項目經理')).toBeVisible();
  await expect(page.locator('text=請選擇主管')).toBeVisible();
});

test('預算申請表單應該驗證必填欄位', async ({ page }) => {
  await page.goto('/proposals/new');
  await page.click('button[type="submit"]');

  await expect(page.locator('text=標題為必填')).toBeVisible();
  await expect(page.locator('text=金額為必填')).toBeVisible();
  await expect(page.locator('text=請選擇項目')).toBeVisible();
});
```

**驗證重點**:
- ✅ 所有必填欄位都有驗證
- ✅ 錯誤訊息清晰
- ✅ 欄位焦點自動移到第一個錯誤
- ✅ 修正後錯誤訊息消失

---

#### 2.2 數值範圍驗證
**文件**: `apps/web/e2e/form-validation/number-ranges.spec.ts`

```typescript
test('預算金額應該在合理範圍內', async ({ page }) => {
  await page.goto('/proposals/new');

  // 測試負數
  await page.fill('input[name="amount"]', '-1000');
  await page.blur('input[name="amount"]');
  await expect(page.locator('text=金額必須大於 0')).toBeVisible();

  // 測試零
  await page.fill('input[name="amount"]', '0');
  await page.blur('input[name="amount"]');
  await expect(page.locator('text=金額必須大於 0')).toBeVisible();

  // 測試過大金額
  await page.fill('input[name="amount"]', '999999999999');
  await page.blur('input[name="amount"]');
  await expect(page.locator('text=金額不能超過 1,000,000,000')).toBeVisible();

  // 測試有效金額
  await page.fill('input[name="amount"]', '50000');
  await page.blur('input[name="amount"]');
  await expect(page.locator('text=金額必須大於 0')).not.toBeVisible();
});

test('採購單數量應該為正整數', async ({ page }) => {
  await page.goto('/purchase-orders/new');

  // 測試小數
  await page.fill('input[name="items[0].quantity"]', '1.5');
  await page.blur('input[name="items[0].quantity"]');
  await expect(page.locator('text=數量必須為整數')).toBeVisible();

  // 測試負數
  await page.fill('input[name="items[0].quantity"]', '-5');
  await page.blur('input[name="items[0].quantity"]');
  await expect(page.locator('text=數量必須大於 0')).toBeVisible();
});
```

**驗證重點**:
- ✅ 最小值/最大值驗證
- ✅ 整數/小數驗證
- ✅ 即時驗證（blur 事件）
- ✅ 適當的錯誤訊息

---

#### 2.3 日期邏輯驗證
**文件**: `apps/web/e2e/form-validation/date-logic.spec.ts`

```typescript
test('項目結束日期必須晚於開始日期', async ({ page }) => {
  await page.goto('/projects/new');

  await page.fill('input[name="name"]', 'Test Project');
  await page.selectOption('select[name="budgetPoolId"]', { index: 1 });

  // 設置開始日期
  await page.fill('input[name="startDate"]', '2025-06-01');

  // 設置早於開始日期的結束日期
  await page.fill('input[name="endDate"]', '2025-05-01');
  await page.blur('input[name="endDate"]');

  // 驗證錯誤訊息
  await expect(page.locator('text=結束日期必須晚於開始日期')).toBeVisible();

  // 修正日期
  await page.fill('input[name="endDate"]', '2025-07-01');
  await page.blur('input[name="endDate"]');

  // 驗證錯誤消失
  await expect(page.locator('text=結束日期必須晚於開始日期')).not.toBeVisible();
});

test('費用日期不能是未來日期', async ({ page }) => {
  await page.goto('/expenses/new');

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);
  const futureDateStr = futureDate.toISOString().split('T')[0];

  await page.fill('input[name="expenseDate"]', futureDateStr);
  await page.blur('input[name="expenseDate"]');

  await expect(page.locator('text=費用日期不能是未來日期')).toBeVisible();
});
```

**驗證重點**:
- ✅ 日期邏輯關係驗證
- ✅ 過去/未來日期限制
- ✅ 日期格式驗證
- ✅ 跨欄位依賴驗證

---

#### 2.4 文件上傳驗證
**文件**: `apps/web/e2e/form-validation/file-upload.spec.ts`

```typescript
test('發票文件應該符合格式和大小要求', async ({ page }) => {
  await page.goto('/expenses/new');

  // 測試不支持的格式
  await page.setInputFiles('input[name="invoiceFile"]', {
    name: 'invoice.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('test invoice')
  });

  await expect(page.locator('text=只支持 PDF、JPG、PNG 格式')).toBeVisible();

  // 測試過大文件
  const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
  await page.setInputFiles('input[name="invoiceFile"]', {
    name: 'invoice.pdf',
    mimeType: 'application/pdf',
    buffer: largeBuffer
  });

  await expect(page.locator('text=文件大小不能超過 10MB')).toBeVisible();

  // 測試有效文件
  const validBuffer = Buffer.from('%PDF-1.4 test content');
  await page.setInputFiles('input[name="invoiceFile"]', {
    name: 'invoice.pdf',
    mimeType: 'application/pdf',
    buffer: validBuffer
  });

  await expect(page.locator('text=只支持 PDF、JPG、PNG 格式')).not.toBeVisible();
});
```

**驗證重點**:
- ✅ 文件類型驗證
- ✅ 文件大小限制
- ✅ 上傳預覽
- ✅ 移除已上傳文件

---

#### 2.5 Email 格式驗證
**文件**: `apps/web/e2e/form-validation/email-validation.spec.ts`

```typescript
test('供應商 Email 應該符合格式要求', async ({ page }) => {
  await page.goto('/vendors/new');

  await page.fill('input[name="name"]', 'Test Vendor');

  // 測試無效 email
  const invalidEmails = [
    'notanemail',
    'missing@domain',
    '@nodomain.com',
    'spaces in@email.com'
  ];

  for (const email of invalidEmails) {
    await page.fill('input[name="email"]', email);
    await page.blur('input[name="email"]');
    await expect(page.locator('text=請輸入有效的 Email 地址')).toBeVisible();
  }

  // 測試有效 email
  await page.fill('input[name="email"]', 'vendor@example.com');
  await page.blur('input[name="email"]');
  await expect(page.locator('text=請輸入有效的 Email 地址')).not.toBeVisible();
});
```

**驗證重點**:
- ✅ Email 格式驗證
- ✅ 即時驗證反饋
- ✅ 多種錯誤格式測試
- ✅ 國際化 email 支持

---

#### 2.6 唯一性驗證
**文件**: `apps/web/e2e/form-validation/uniqueness-validation.spec.ts`

```typescript
test('項目名稱應該是唯一的', async ({ page }) => {
  // 先創建一個項目
  await page.goto('/projects/new');
  await page.fill('input[name="name"]', 'Unique Project');
  await page.selectOption('select[name="budgetPoolId"]', { index: 1 });
  await page.selectOption('select[name="managerId"]', { index: 1 });
  await page.selectOption('select[name="supervisorId"]', { index: 2 });
  await page.click('button[type="submit"]');

  await expect(page.locator('text=項目創建成功')).toBeVisible();

  // 嘗試創建同名項目
  await page.goto('/projects/new');
  await page.fill('input[name="name"]', 'Unique Project');
  await page.blur('input[name="name"]');

  // 驗證唯一性錯誤
  await expect(page.locator('text=項目名稱已存在')).toBeVisible();
});

test('供應商名稱應該是唯一的', async ({ page }) => {
  await page.goto('/vendors/new');
  await page.fill('input[name="name"]', 'Existing Vendor');
  await page.fill('input[name="email"]', 'vendor1@example.com');
  await page.click('button[type="submit"]');

  await expect(page.locator('text=供應商創建成功')).toBeVisible();

  // 嘗試創建同名供應商
  await page.goto('/vendors/new');
  await page.fill('input[name="name"]', 'Existing Vendor');
  await page.blur('input[name="name"]');

  await expect(page.locator('text=供應商名稱已存在')).toBeVisible();
});
```

**驗證重點**:
- ✅ 唯一性檢查
- ✅ 即時 API 驗證
- ✅ 適當的錯誤訊息
- ✅ 編輯時排除自身

---

### Phase 2 驗收標準

- ✅ 6 個表單驗證測試全部通過
- ✅ 所有表單有完整驗證
- ✅ 錯誤訊息清晰友好
- ✅ 測試覆蓋率增加 +8%

---

## 🎯 Phase 3: 邊界條件測試 (Week 2, Days 1-3)

### 目標
測試系統在極端或特殊情況下的行為

### 測試場景清單 (7 scenarios)

#### 3.1 預算池額度耗盡
**文件**: `apps/web/e2e/boundary-conditions/budget-exhaustion.spec.ts`

```typescript
test('應該阻止超過預算池剩餘額度的申請', async ({ page }) => {
  // 假設預算池總額 100,000，已使用 95,000，剩餘 5,000

  await page.goto('/proposals/new');

  await page.fill('input[name="title"]', 'Large Budget Request');
  await page.fill('input[name="amount"]', '10000'); // 超過剩餘額度
  await page.selectOption('select[name="projectId"]', { index: 1 });

  await page.click('button[type="submit"]');

  // 驗證錯誤訊息
  await expect(page.locator('text=申請金額超過預算池剩餘額度')).toBeVisible();
  await expect(page.locator('text=剩餘額度: $5,000')).toBeVisible();
});

test('應該允許等於剩餘額度的申請', async ({ page }) => {
  await page.goto('/proposals/new');

  await page.fill('input[name="title"]', 'Exact Budget Request');
  await page.fill('input[name="amount"]', '5000'); // 正好等於剩餘額度
  await page.selectOption('select[name="projectId"]', { index: 1 });

  await page.click('button[type="submit"]');

  // 驗證提交成功
  await expect(page.locator('text=申請提交成功')).toBeVisible();
});
```

**驗證重點**:
- ✅ 實時預算額度檢查
- ✅ 適當的錯誤訊息
- ✅ 顯示剩餘額度
- ✅ 邊界值處理（等於剩餘額度）

---

#### 3.2 同時審批衝突
**文件**: `apps/web/e2e/boundary-conditions/concurrent-approval.spec.ts`

```typescript
test('兩個 Supervisor 同時審批應該只有一個成功', async ({ browser }) => {
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();
  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  // 兩個 Supervisor 同時登入
  await Promise.all([
    loginAsSupervisor(page1, 'supervisor1@example.com'),
    loginAsSupervisor(page2, 'supervisor2@example.com')
  ]);

  const proposalId = 'pending-proposal-id';

  // 同時打開同一個申請
  await Promise.all([
    page1.goto(`/proposals/${proposalId}`),
    page2.goto(`/proposals/${proposalId}`)
  ]);

  // 同時點擊批准
  await Promise.all([
    page1.click('button:has-text("批准")'),
    page2.click('button:has-text("批准")')
  ]);

  // 等待響應
  await page1.waitForTimeout(2000);
  await page2.waitForTimeout(2000);

  // 驗證只有一個成功
  const success1 = await page1.locator('text=審批成功').isVisible();
  const success2 = await page2.locator('text=審批成功').isVisible();

  expect(success1 !== success2).toBe(true); // 一個成功，一個失敗

  // 驗證失敗的顯示衝突訊息
  if (!success1) {
    await expect(page1.locator('text=此申請已被處理')).toBeVisible();
  } else {
    await expect(page2.locator('text=此申請已被處理')).toBeVisible();
  }

  await context1.close();
  await context2.close();
});
```

**驗證重點**:
- ✅ 樂觀鎖機制
- ✅ 衝突檢測
- ✅ 適當的錯誤訊息
- ✅ 頁面狀態同步

---

#### 3.3 大量數據處理
**文件**: `apps/web/e2e/boundary-conditions/large-datasets.spec.ts`

```typescript
test('應該正確渲染包含 100+ 項目的列表', async ({ page }) => {
  // 假設數據庫已有 100+ 項目
  await page.goto('/projects');

  // 驗證分頁顯示
  await expect(page.locator('text=第 1 頁')).toBeVisible();
  await expect(page.locator('text=共 100+ 項')).toBeVisible();

  // 驗證首頁只顯示 20 項（默認分頁大小）
  const projectRows = await page.locator('table tbody tr').count();
  expect(projectRows).toBeLessThanOrEqual(20);

  // 測試跳轉到第 5 頁
  await page.click('button:has-text("5")');
  await expect(page).toHaveURL(/page=5/);

  // 驗證頁面正常載入
  await expect(page.locator('table tbody tr').first()).toBeVisible();
});

test('採購單包含 50 個項目應該正確處理', async ({ page }) => {
  await page.goto('/purchase-orders/new');

  // 添加 50 個項目
  for (let i = 0; i < 50; i++) {
    if (i > 0) {
      await page.click('button:has-text("添加項目")');
    }
    await page.fill(`input[name="items[${i}].itemName"]`, `Item ${i + 1}`);
    await page.fill(`input[name="items[${i}].quantity"]`, '1');
    await page.fill(`input[name="items[${i}].unitPrice"]`, '100');
  }

  // 驗證總金額計算正確
  await expect(page.locator('text=總金額: $5,000')).toBeVisible();

  // 提交表單
  await page.click('button[type="submit"]');

  // 驗證提交成功
  await expect(page.locator('text=採購單創建成功')).toBeVisible();
});
```

**驗證重點**:
- ✅ 分頁正確工作
- ✅ 大量數據渲染性能
- ✅ 滾動和虛擬化
- ✅ 複雜表單處理

---

#### 3.4 會話過期處理
**文件**: `apps/web/e2e/boundary-conditions/session-expiry.spec.ts`

```typescript
test('應該在會話過期後保存表單數據並重定向登入', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'pm@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/dashboard/);

  // 開始填寫項目表單
  await page.goto('/projects/new');
  await page.fill('input[name="name"]', 'Important Project');
  await page.fill('input[name="description"]', 'Critical description');

  // 模擬會話過期
  await page.context().clearCookies();

  // 嘗試提交（應該被攔截）
  await page.click('button[type="submit"]');

  // 驗證重定向到登入
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator('text=會話已過期，請重新登入')).toBeVisible();

  // 重新登入
  await page.fill('input[name="email"]', 'pm@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // 驗證返回原頁面且數據保留（如果實現了）
  await expect(page).toHaveURL(/\/projects\/new/);

  // 可選：驗證表單數據恢復
  const nameValue = await page.inputValue('input[name="name"]');
  expect(nameValue).toBe('Important Project');
});
```

**驗證重點**:
- ✅ 會話過期檢測
- ✅ 自動重定向登入
- ✅ 表單數據保存（可選）
- ✅ 登入後返回原頁面

---

#### 3.5 網路不穩定場景
**文件**: `apps/web/e2e/boundary-conditions/network-instability.spec.ts`

```typescript
test('應該在網路中斷後自動重連並恢復', async ({ page, context }) => {
  await page.goto('/dashboard');

  // 模擬網路中斷
  await context.setOffline(true);

  // 嘗試導航到新頁面
  await page.click('a[href="/projects"]');

  // 驗證離線訊息
  await expect(page.locator('text=網路連接中斷')).toBeVisible();

  // 恢復網路
  await context.setOffline(false);

  // 驗證自動重連
  await expect(page.locator('text=網路已恢復')).toBeVisible({ timeout: 5000 });

  // 驗證頁面正常工作
  await page.click('a[href="/projects"]');
  await expect(page).toHaveURL(/\/projects/);
});

test('應該處理間歇性網路延遲', async ({ page }) => {
  await page.goto('/proposals/new');

  // 模擬高延遲（1秒）
  await page.route('**/api/trpc/project.getAll*', async route => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    await route.continue();
  });

  await page.click('select[name="projectId"]');

  // 驗證載入狀態顯示
  await expect(page.locator('text=載入中...')).toBeVisible();

  // 驗證最終載入成功
  await expect(page.locator('select[name="projectId"] option').first()).toBeVisible({ timeout: 3000 });
});
```

**驗證重點**:
- ✅ 離線檢測
- ✅ 重連機制
- ✅ 載入狀態指示
- ✅ 超時處理

---

#### 3.6 極端日期範圍
**文件**: `apps/web/e2e/boundary-conditions/extreme-dates.spec.ts`

```typescript
test('應該處理跨年度的項目日期', async ({ page }) => {
  await page.goto('/projects/new');

  await page.fill('input[name="name"]', 'Multi-Year Project');
  await page.selectOption('select[name="budgetPoolId"]', { index: 1 });

  // 設置跨年度日期
  await page.fill('input[name="startDate"]', '2025-12-15');
  await page.fill('input[name="endDate"]', '2026-03-15');

  await page.click('button[type="submit"]');

  // 驗證創建成功
  await expect(page.locator('text=項目創建成功')).toBeVisible();

  // 驗證項目詳情正確顯示日期
  await page.click('a:has-text("Multi-Year Project")');
  await expect(page.locator('text=2025-12-15')).toBeVisible();
  await expect(page.locator('text=2026-03-15')).toBeVisible();
});

test('應該處理歷史日期查詢', async ({ page }) => {
  await page.goto('/expenses');

  // 設置 3 年前的日期範圍
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
  const startDate = threeYearsAgo.toISOString().split('T')[0];

  await page.fill('input[name="startDate"]', startDate);
  await page.fill('input[name="endDate"]', new Date().toISOString().split('T')[0]);

  await page.click('button:has-text("搜尋")');

  // 驗證查詢不報錯
  await expect(page.locator('text=查詢結果')).toBeVisible({ timeout: 10000 });
});
```

**驗證重點**:
- ✅ 跨年度日期處理
- ✅ 歷史日期查詢
- ✅ 日期格式正確性
- ✅ 時區處理

---

#### 3.7 特殊字符處理
**文件**: `apps/web/e2e/boundary-conditions/special-characters.spec.ts`

```typescript
test('應該正確處理名稱中的特殊字符', async ({ page }) => {
  await page.goto('/projects/new');

  const specialNames = [
    'Project "Quotes" Test',
    "Project 'Apostrophe' Test",
    'Project & Ampersand Test',
    'Project <HTML> Test',
    'Project 中文 Test',
    'Project Emoji 🚀 Test'
  ];

  for (const name of specialNames) {
    await page.fill('input[name="name"]', name);
    await page.selectOption('select[name="budgetPoolId"]', { index: 1 });
    await page.selectOption('select[name="managerId"]', { index: 1 });
    await page.selectOption('select[name="supervisorId"]', { index: 2 });

    await page.click('button[type="submit"]');

    // 驗證創建成功
    await expect(page.locator('text=項目創建成功')).toBeVisible();

    // 驗證列表中正確顯示
    await page.goto('/projects');
    await expect(page.locator(`text=${name}`)).toBeVisible();

    // 返回創建新項目
    await page.goto('/projects/new');
  }
});

test('應該防止 XSS 攻擊', async ({ page }) => {
  await page.goto('/projects/new');

  const xssAttempts = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror="alert(\'XSS\')">',
    'javascript:alert("XSS")'
  ];

  for (const xss of xssAttempts) {
    await page.fill('input[name="name"]', xss);
    await page.selectOption('select[name="budgetPoolId"]', { index: 1 });
    await page.click('button[type="submit"]');

    // 驗證創建成功但內容被轉義
    await page.goto('/projects');

    // 驗證沒有執行腳本（不會有 alert）
    const alerts = [];
    page.on('dialog', dialog => {
      alerts.push(dialog.message());
      dialog.dismiss();
    });

    await page.waitForTimeout(1000);
    expect(alerts).toHaveLength(0);
  }
});
```

**驗證重點**:
- ✅ 特殊字符正確處理
- ✅ Unicode 支持
- ✅ XSS 防護
- ✅ SQL 注入防護（間接測試）

---

### Phase 3 驗收標準

- ✅ 7 個邊界條件測試全部通過
- ✅ 極端情況正確處理
- ✅ 系統穩定性增強
- ✅ 測試覆蓋率達到 60%+

---

## 🎯 Phase 4: GitHub Actions CI/CD 配置 (Week 3, Days 1-2)

### 目標
建立自動化測試和質量檢查流程

### 4.1 創建 CI 工作流

**文件**: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-typecheck:
    name: Lint & Type Check
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.11.0'
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8.15.3

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run ESLint
        run: pnpm lint

      - name: Run TypeScript type check
        run: pnpm typecheck

  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    needs: lint-and-typecheck

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: testpass123
          POSTGRES_DB: itpm_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.11.0'
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8.15.3

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Setup environment
        run: |
          cp .env.example .env
          echo "DATABASE_URL=postgresql://postgres:testpass123@localhost:5432/itpm_test" >> .env
          echo "REDIS_URL=redis://localhost:6379" >> .env

      - name: Run database migrations
        run: pnpm db:migrate

      - name: Generate Prisma Client
        run: pnpm db:generate

      - name: Run unit tests
        run: pnpm test --coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests

  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: lint-and-typecheck

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: testpass123
          POSTGRES_DB: itpm_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    strategy:
      matrix:
        browser: [chromium, firefox, webkit]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.11.0'
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8.15.3

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps ${{ matrix.browser }}

      - name: Setup environment
        run: |
          cp .env.example .env
          echo "DATABASE_URL=postgresql://postgres:testpass123@localhost:5432/itpm_test" >> .env
          echo "REDIS_URL=redis://localhost:6379" >> .env
          echo "NEXTAUTH_URL=http://localhost:3006" >> .env
          echo "NEXTAUTH_SECRET=test-secret-for-ci" >> .env

      - name: Run database migrations
        run: pnpm db:migrate

      - name: Generate Prisma Client
        run: pnpm db:generate

      - name: Seed test data
        run: pnpm db:seed

      - name: Build application
        run: pnpm build

      - name: Run E2E tests
        run: pnpm exec playwright test --project=${{ matrix.browser }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report-${{ matrix.browser }}
          path: playwright-report/
          retention-days: 30

      - name: Upload test videos
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-videos-${{ matrix.browser }}
          path: test-results/
          retention-days: 7

  build:
    name: Build Check
    runs-on: ubuntu-latest
    needs: [unit-tests, e2e-tests]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.11.0'
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8.15.3

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build application
        run: pnpm build

      - name: Check bundle size
        run: |
          pnpm exec next build
          du -sh apps/web/.next
```

---

### 4.2 創建 PR 檢查工作流

**文件**: `.github/workflows/pr-checks.yml`

```yaml
name: PR Checks

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  pr-quality-gate:
    name: Quality Gate
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.11.0'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8.15.3

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Check for breaking changes
        run: |
          # 檢查是否有 Prisma schema 更改
          git diff origin/main HEAD -- packages/db/prisma/schema.prisma > schema.diff
          if [ -s schema.diff ]; then
            echo "⚠️ Warning: Prisma schema changes detected"
            cat schema.diff
          fi

      - name: Check test coverage
        run: |
          pnpm test --coverage
          COVERAGE=$(cat coverage/lcov.info | grep -o 'LF:[0-9]*' | awk -F: '{sum+=$2} END {print sum}')
          echo "Current coverage: $COVERAGE lines"
          if [ "$COVERAGE" -lt 1000 ]; then
            echo "❌ Coverage too low"
            exit 1
          fi

      - name: Check bundle size
        run: |
          pnpm build
          SIZE=$(du -sb apps/web/.next | awk '{print $1}')
          MAX_SIZE=$((50 * 1024 * 1024)) # 50MB
          if [ "$SIZE" -gt "$MAX_SIZE" ]; then
            echo "❌ Bundle size too large: $(($SIZE / 1024 / 1024))MB"
            exit 1
          fi

      - name: Comment PR
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ Quality checks passed! Ready for review.'
            })
```

---

### 4.3 創建 Codecov 配置

**文件**: `codecov.yml`

```yaml
coverage:
  status:
    project:
      default:
        target: 60%
        threshold: 2%
    patch:
      default:
        target: 70%

ignore:
  - "**/*.test.ts"
  - "**/*.spec.ts"
  - "**/e2e/**"
  - "**/__tests__/**"

comment:
  layout: "reach,diff,flags,tree"
  behavior: default
  require_changes: false
```

---

### Phase 4 驗收標準

- ✅ GitHub Actions workflow 配置完成
- ✅ PR 自動觸發測試
- ✅ 多瀏覽器測試矩陣工作
- ✅ 測試報告自動生成
- ✅ 質量門檻正確執行

---

## 🎯 Phase 5: 多瀏覽器測試矩陣 (Week 3, Days 3-4)

### 目標
確保在所有主流瀏覽器上正常工作

### 5.1 更新 Playwright 配置

**文件**: `apps/web/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }],
    ['github'] // GitHub Actions 註解
  ],

  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3006',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
    },

    // Mobile browsers
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },

    // Tablet browsers
    {
      name: 'tablet-chrome',
      use: { ...devices['iPad Pro'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3006',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

---

### 5.2 創建瀏覽器相容性測試

**文件**: `apps/web/e2e/browser-compatibility/cross-browser.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Cross-browser compatibility', () => {
  test('應該在所有瀏覽器上正確渲染主要頁面', async ({ page, browserName }) => {
    console.log(`Testing on ${browserName}`);

    // 測試 Dashboard
    await page.goto('/dashboard');
    await expect(page.locator('h1:has-text("儀表板")')).toBeVisible();

    // 測試項目列表
    await page.goto('/projects');
    await expect(page.locator('h1:has-text("項目管理")')).toBeVisible();

    // 測試表單渲染
    await page.goto('/projects/new');
    await expect(page.locator('input[name="name"]')).toBeVisible();

    // 截圖對比（可選）
    await page.screenshot({
      path: `test-results/screenshots/${browserName}-dashboard.png`,
      fullPage: true
    });
  });

  test('CSS 樣式應該在所有瀏覽器上一致', async ({ page, browserName }) => {
    await page.goto('/dashboard');

    // 檢查關鍵 CSS 屬性
    const sidebar = page.locator('aside[class*="sidebar"]');
    const sidebarBox = await sidebar.boundingBox();

    // 驗證 sidebar 寬度
    expect(sidebarBox?.width).toBeGreaterThan(200);
    expect(sidebarBox?.width).toBeLessThan(300);

    // 檢查按鈕樣式
    const button = page.locator('button[type="submit"]').first();
    const buttonColor = await button.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );

    // 驗證主題色一致
    expect(buttonColor).toBeTruthy();
  });

  test('JavaScript 功能應該在所有瀏覽器上工作', async ({ page }) => {
    await page.goto('/projects/new');

    // 測試下拉選單
    await page.selectOption('select[name="budgetPoolId"]', { index: 1 });
    const selectedValue = await page.inputValue('select[name="budgetPoolId"]');
    expect(selectedValue).toBeTruthy();

    // 測試日期選擇器
    await page.fill('input[name="startDate"]', '2025-06-01');
    const dateValue = await page.inputValue('input[name="startDate"]');
    expect(dateValue).toBe('2025-06-01');

    // 測試動態表單
    await page.click('button:has-text("添加分類")');
    await expect(page.locator('input[name="categories[0].categoryName"]')).toBeVisible();
  });
});
```

---

### 5.3 創建移動端測試

**文件**: `apps/web/e2e/browser-compatibility/mobile-responsive.spec.ts`

```typescript
import { test, expect, devices } from '@playwright/test';

test.describe('Mobile responsiveness', () => {
  test.use({ ...devices['iPhone 13'] });

  test('應該在移動設備上正確顯示導航', async ({ page }) => {
    await page.goto('/dashboard');

    // 驗證漢堡選單存在
    const menuButton = page.locator('button[aria-label="Toggle menu"]');
    await expect(menuButton).toBeVisible();

    // 打開選單
    await menuButton.click();

    // 驗證側邊欄顯示
    const sidebar = page.locator('aside[class*="sidebar"]');
    await expect(sidebar).toBeVisible();
  });

  test('表單應該在移動設備上可用', async ({ page }) => {
    await page.goto('/projects/new');

    // 驗證表單元素可點擊
    await page.fill('input[name="name"]', 'Mobile Test Project');

    // 驗證下拉選單在移動設備上可用
    await page.selectOption('select[name="budgetPoolId"]', { index: 1 });

    // 驗證表單可提交
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });

  test('列表應該在移動設備上正確分頁', async ({ page }) => {
    await page.goto('/projects');

    // 驗證列表渲染
    await expect(page.locator('table, div[role="table"]')).toBeVisible();

    // 驗證分頁控制
    const pagination = page.locator('nav[aria-label="pagination"]');
    await expect(pagination).toBeVisible();
  });
});
```

---

### Phase 5 驗收標準

- ✅ 3 個桌面瀏覽器測試通過 (Chrome, Firefox, Safari)
- ✅ 2 個移動瀏覽器測試通過 (Mobile Chrome, Mobile Safari)
- ✅ 響應式設計正確工作
- ✅ 跨瀏覽器 CSS 一致性

---

## 🎯 Phase 6: Azure 部署自動化 (Week 3, Days 5-7)

### 目標
建立自動化部署管道到 Azure App Service

### 6.1 創建部署工作流

**文件**: `.github/workflows/deploy-staging.yml`

```yaml
name: Deploy to Staging

on:
  push:
    branches: [develop]
  workflow_dispatch:

env:
  AZURE_WEBAPP_NAME: itpm-staging
  NODE_VERSION: '20.11.0'

jobs:
  build-and-deploy:
    name: Build and Deploy to Staging
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://itpm-staging.azurewebsites.net

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8.15.3

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run database migrations
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
        run: pnpm db:migrate

      - name: Build application
        env:
          NEXT_PUBLIC_API_URL: https://itpm-staging.azurewebsites.net
        run: pnpm build

      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v2
        with:
          app-name: ${{ env.AZURE_WEBAPP_NAME }}
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE_STAGING }}
          package: .

      - name: Run smoke tests
        run: |
          sleep 30 # Wait for deployment
          curl -f https://itpm-staging.azurewebsites.net/api/health || exit 1

      - name: Notify deployment
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Staging deployment ${{ job.status }}'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

### 6.2 創建生產部署工作流

**文件**: `.github/workflows/deploy-production.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
    tags:
      - 'v*'
  workflow_dispatch:

env:
  AZURE_WEBAPP_NAME: itpm-production
  NODE_VERSION: '20.11.0'

jobs:
  build:
    name: Build Application
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8.15.3

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build application
        env:
          NEXT_PUBLIC_API_URL: https://itpm.azurewebsites.net
        run: pnpm build

      - name: Upload build artifact
        uses: actions/upload-artifact@v3
        with:
          name: production-build
          path: .
          retention-days: 1

  deploy-staging-slot:
    name: Deploy to Staging Slot
    runs-on: ubuntu-latest
    needs: build
    environment:
      name: production-staging-slot

    steps:
      - name: Download build artifact
        uses: actions/download-artifact@v3
        with:
          name: production-build

      - name: Deploy to Azure staging slot
        uses: azure/webapps-deploy@v2
        with:
          app-name: ${{ env.AZURE_WEBAPP_NAME }}
          slot-name: staging
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE_PROD_STAGING }}
          package: .

      - name: Run smoke tests on staging slot
        run: |
          sleep 30
          curl -f https://itpm-staging.azurewebsites.net/api/health || exit 1

      - name: Run E2E tests on staging slot
        run: |
          export PLAYWRIGHT_TEST_BASE_URL=https://itpm-staging.azurewebsites.net
          pnpm exec playwright test workflows/ --project=chromium

  swap-to-production:
    name: Swap to Production
    runs-on: ubuntu-latest
    needs: deploy-staging-slot
    environment:
      name: production
      url: https://itpm.azurewebsites.net

    steps:
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Swap staging to production
        uses: azure/CLI@v1
        with:
          inlineScript: |
            az webapp deployment slot swap \
              --resource-group itpm-rg \
              --name ${{ env.AZURE_WEBAPP_NAME }} \
              --slot staging \
              --target-slot production

      - name: Verify production deployment
        run: |
          sleep 30
          curl -f https://itpm.azurewebsites.net/api/health || exit 1

      - name: Notify successful deployment
        uses: 8398a7/action-slack@v3
        with:
          status: success
          text: '🚀 Production deployment successful!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}

  rollback:
    name: Rollback on Failure
    runs-on: ubuntu-latest
    needs: swap-to-production
    if: failure()

    steps:
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Rollback to previous version
        uses: azure/CLI@v1
        with:
          inlineScript: |
            az webapp deployment slot swap \
              --resource-group itpm-rg \
              --name ${{ env.AZURE_WEBAPP_NAME }} \
              --slot production \
              --target-slot staging

      - name: Notify rollback
        uses: 8398a7/action-slack@v3
        with:
          status: failure
          text: '⚠️ Production deployment failed, rolled back to previous version'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

### 6.3 創建健康檢查 API

**文件**: `apps/web/src/app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@itpm/db';

export async function GET() {
  try {
    // 檢查數據庫連接
    await prisma.$queryRaw`SELECT 1`;

    // 檢查 Redis 連接（如果使用）
    // await redis.ping();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || 'unknown',
      checks: {
        database: 'ok',
        // redis: 'ok'
      }
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}
```

---

### 6.4 創建 Azure 配置文件

**文件**: `azure-webapps-node.yml`

```yaml
# Azure App Service 配置
version: 1.0
runtimeStack:
  name: node
  version: '20-lts'

appSettings:
  - name: WEBSITES_PORT
    value: "3000"
  - name: NODE_ENV
    value: "production"
  - name: NEXT_TELEMETRY_DISABLED
    value: "1"

startupCommand: "pnpm start"

healthCheckPath: "/api/health"

scaling:
  minInstances: 1
  maxInstances: 10
  rules:
    - metricName: CpuPercentage
      metricThreshold: 70
      scaleAction: increase
    - metricName: MemoryPercentage
      metricThreshold: 80
      scaleAction: increase
```

---

### Phase 6 驗收標準

- ✅ Staging 自動部署工作
- ✅ Production 藍綠部署工作
- ✅ 健康檢查正確執行
- ✅ 自動回滾機制測試通過
- ✅ 部署通知發送成功

---

## 📊 總體驗收標準

### Stage 3 完成標準
- ✅ 21 個進階測試全部通過
- ✅ 測試覆蓋率達到 60%+
- ✅ 所有錯誤處理場景覆蓋
- ✅ 邊界條件正確處理

### Stage 4 完成標準
- ✅ GitHub Actions CI/CD 完整配置
- ✅ 多瀏覽器測試矩陣工作 (5 browsers)
- ✅ 自動化部署到 Azure 成功
- ✅ 藍綠部署和回滾機制驗證

---

## 🎯 下一步行動

1. **立即開始 Phase 1** (錯誤處理測試)
2. **每日 Standup**: 同步進度和阻礙
3. **每週 Review**: 驗收標準檢查
4. **最終 Demo**: Week 3 結束展示成果

---

**創建日期**: 2025-11-01
**預計完成**: 2025-11-22
**負責人**: Development Team
**優先級**: P0 (最高)
