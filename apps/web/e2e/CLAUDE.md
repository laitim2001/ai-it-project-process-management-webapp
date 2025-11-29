# E2E Testing - 端對端測試層

## 📋 目錄用途
此目錄包含 Playwright E2E 測試，驗證完整業務流程。

## 🏗️ 測試結構

```
e2e/
├── workflows/                      # 業務流程測試
│   ├── budget-proposal-workflow.spec.ts
│   ├── expense-chargeout-workflow.spec.ts
│   └── procurement-workflow.spec.ts
├── fixtures/                       # 測試輔助工具
│   ├── auth.fixture.ts            # 認證 fixture
│   └── test-data.ts               # 測試資料
├── helpers/                        # 測試工具函數
│   ├── test-helpers.ts
│   └── waitForEntity.ts
└── error-handling/                 # 錯誤處理測試
```

## 🎯 測試模式

### 1. 基本測試結構
```typescript
import { test, expect } from '@playwright/test';
import { loginAsProjectManager } from './fixtures/auth.fixture';

test.describe('Project Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsProjectManager(page);
  });

  test('should create a new project', async ({ page }) => {
    // 1. 導航
    await page.goto('/projects/new');

    // 2. 填寫表單
    await page.fill('[name="name"]', 'Test Project');
    await page.selectOption('[name="budgetPoolId"]', 'pool-1');

    // 3. 提交
    await page.click('button[type="submit"]');

    // 4. 驗證
    await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+$/);
    await expect(page.locator('h1')).toContainText('Test Project');
  });
});
```

### 2. Auth Fixture
```typescript
// fixtures/auth.fixture.ts
import { type Page } from '@playwright/test';

export async function loginAsProjectManager(page: Page) {
  await page.goto('/login');
  await page.fill('[name="email"]', 'pm@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

export async function loginAsSupervisor(page: Page) {
  // ...
}
```

### 3. Test Helpers
```typescript
// helpers/test-helpers.ts
import { type Page } from '@playwright/test';

export async function waitForEntity(
  page: Page,
  entityType: string,
  entityId: string
) {
  await page.waitForFunction(
    ([id, type]) => {
      const element = document.querySelector(`[data-${type}-id="${id}"]`);
      return element !== null;
    },
    [entityId, entityType]
  );
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

### 4. 業務流程測試範例
```typescript
// workflows/budget-proposal-workflow.spec.ts
test('Complete budget proposal workflow', async ({ page }) => {
  // 1. 登入為專案經理
  await loginAsProjectManager(page);

  // 2. 創建提案
  await page.goto('/proposals/new');
  await page.fill('[name="projectId"]', 'project-1');
  await page.fill('[name="amount"]', '100000');
  await page.click('button[type="submit"]');

  // 3. 等待提案創建
  const proposalId = await page.url().match(/proposals\/([a-f0-9-]+)/)?.[1];

  // 4. 提交審批
  await page.click('button:has-text("Submit for Approval")');

  // 5. 登出並登入為主管
  await page.click('[data-testid="user-menu"]');
  await page.click('button:has-text("Logout")');
  await loginAsSupervisor(page);

  // 6. 審批提案
  await page.goto(`/proposals/${proposalId}`);
  await page.click('button:has-text("Approve")');

  // 7. 驗證狀態變更
  await expect(page.locator('[data-testid="status-badge"]')).toContainText('Approved');
});
```

## 📝 測試最佳實踐

### 1. Selector 策略
```typescript
// ✅ 使用 data-testid（推薦）
await page.click('[data-testid="submit-button"]');

// ✅ 使用 name 屬性（表單）
await page.fill('[name="email"]', 'test@example.com');

// ⚠️ 使用文字（謹慎使用，i18n 問題）
await page.click('button:has-text("Submit")');

// ❌ 避免 CSS class（容易變動）
await page.click('.btn-primary');
```

### 2. 等待策略
```typescript
// ✅ 等待導航
await page.waitForURL('/projects');

// ✅ 等待元素
await page.waitForSelector('[data-testid="project-card"]');

// ✅ 等待網路請求
await page.waitForResponse(resp => resp.url().includes('/api/trpc'));

// ✅ 自定義等待
await page.waitForFunction(() => document.querySelectorAll('.project').length > 0);
```

### 3. 斷言模式
```typescript
// URL 斷言
await expect(page).toHaveURL('/projects');
await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+$/);

// 文字斷言
await expect(page.locator('h1')).toContainText('Projects');
await expect(page.locator('[data-testid="count"]')).toHaveText('10');

// 可見性斷言
await expect(page.locator('[data-testid="error"]')).toBeVisible();
await expect(page.locator('[data-testid="loading"]')).toBeHidden();

// 屬性斷言
await expect(page.locator('input')).toHaveValue('test');
await expect(page.locator('button')).toBeDisabled();
```

## ⚠️ 重要約定

1. **測試必須獨立**（不依賴其他測試）
2. **使用 beforeEach 設置乾淨狀態**
3. **測試名稱必須描述性強**（should ...）
4. **使用 type-only import**（`import { type Page }`）
5. **可選屬性必須使用可選鏈**（`?.`）
6. **測試資料必須在 fixtures/ 中**
7. **複雜流程拆分為多個測試**

## 🔍 執行測試

```bash
# 執行所有測試
pnpm test:e2e

# 執行特定測試
pnpm test:e2e budget-proposal

# UI 模式（開發）
pnpm test:e2e --ui

# Debug 模式
pnpm test:e2e --debug
```

## 相關文件
- `playwright.config.ts` - Playwright 配置
- `packages/api/src/routers/` - 測試的 API
- [Playwright 文檔](https://playwright.dev/)
