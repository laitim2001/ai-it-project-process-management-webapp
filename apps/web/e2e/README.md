# E2E 測試文檔

IT 項目管理平台的端到端（E2E）測試套件，使用 Playwright 實現。

## 📁 目錄結構

```
e2e/
├── fixtures/              # 測試 fixtures 和助手函數
│   ├── auth.ts           # 認證 fixtures（managerPage, supervisorPage）
│   └── test-data.ts      # 測試數據工廠（生成測試數據）
├── workflows/            # 核心工作流測試
│   ├── budget-proposal-workflow.spec.ts    # 預算申請工作流
│   ├── procurement-workflow.spec.ts        # 採購工作流
│   └── expense-chargeout-workflow.spec.ts  # 費用轉嫁工作流
├── example.spec.ts       # 基本功能示例測試
└── README.md            # 本文檔
```

## 🚀 運行測試

### 前置條件

1. **安裝依賴**：
   ```bash
   pnpm install
   ```

2. **安裝 Playwright 瀏覽器**：
   ```bash
   pnpm exec playwright install
   ```

3. **準備測試環境**：
   - 確保 PostgreSQL 數據庫運行中
   - 確保有測試用戶：
     - `test-manager@example.com` / `testpassword123` (ProjectManager 角色)
     - `test-supervisor@example.com` / `testpassword123` (Supervisor 角色)

### 運行命令

```bash
# 運行所有測試
pnpm test:e2e

# 運行測試（UI 模式 - 推薦用於調試）
pnpm test:e2e:ui

# 運行測試（顯示瀏覽器）
pnpm test:e2e:headed

# 調試模式
pnpm test:e2e:debug

# 查看測試報告
pnpm test:e2e:report
```

## 📝 測試覆蓋範圍

### 1. 預算申請工作流 (`budget-proposal-workflow.spec.ts`)

測試完整的預算申請流程：

**主流程**：
1. ✅ 創建預算池（BudgetPool）
2. ✅ 創建項目（Project）
3. ✅ 創建預算提案（BudgetProposal）
4. ✅ ProjectManager 提交提案
5. ✅ Supervisor 審核通過
6. ✅ 驗證項目獲得批准預算

**拒絕流程**：
1. ✅ Supervisor 拒絕提案
2. ✅ ProjectManager 查看拒絕原因

**預期時長**: ~3-5 分鐘

---

### 2. 採購工作流 (`procurement-workflow.spec.ts`)

測試完整的採購和費用記錄流程：

**主流程**：
1. ✅ 創建供應商（Vendor）
2. ✅ 上傳報價單（Quote）
3. ✅ 創建採購訂單（PurchaseOrder）
4. ✅ 記錄費用（Expense）
5. ✅ ProjectManager 提交費用
6. ✅ Supervisor 批准費用
7. ✅ 驗證預算池扣款

**拒絕流程**：
1. ✅ Supervisor 拒絕費用
2. ✅ ProjectManager 查看並修改

**預期時長**: ~4-6 分鐘

---

### 3. 費用轉嫁工作流 (`expense-chargeout-workflow.spec.ts`)

測試完整的費用轉嫁到 OpCo 的流程：

**主流程**：
1. ✅ 創建需要轉嫁的費用（requiresChargeOut=true）
2. ✅ 批准費用
3. ✅ 創建費用轉嫁（ChargeOut）
4. ✅ 選擇費用明細
5. ✅ ProjectManager 提交 ChargeOut
6. ✅ Supervisor 確認 ChargeOut
7. ✅ 標記為已付款（Paid）
8. ✅ 驗證完整流程

**拒絕流程**：
1. ✅ Supervisor 拒絕 ChargeOut
2. ✅ ProjectManager 刪除被拒絕的 ChargeOut

**多費用項目測試**：
1. ✅ 創建包含多個費用的 ChargeOut
2. ✅ 驗證總金額自動計算

**預期時長**: ~5-7 分鐘

---

### 4. 基本功能測試 (`example.spec.ts`)

驗證應用程式的基本功能：

1. ✅ 訪問首頁
2. ✅ 訪問登入頁面
3. ✅ ProjectManager 登入
4. ✅ Supervisor 登入
5. ✅ 導航到各個頁面

**預期時長**: ~1-2 分鐘

## 🛠 Fixtures 說明

### 認證 Fixtures (`fixtures/auth.ts`)

提供預先認證的 Page 實例：

```typescript
import { test, expect } from './fixtures/auth';

test('我的測試', async ({ managerPage }) => {
  // managerPage 已經以 ProjectManager 身份登入
  await managerPage.goto('/projects');
  // ... 測試邏輯
});
```

**可用 Fixtures**：
- `authenticatedPage`: 通用認證 Page（ProjectManager）
- `managerPage`: ProjectManager 角色的獨立 Page
- `supervisorPage`: Supervisor 角色的獨立 Page

### 測試數據工廠 (`fixtures/test-data.ts`)

生成測試數據的助手函數：

```typescript
import { generateProjectData } from './fixtures/test-data';

const projectData = generateProjectData();
// 返回: { name: 'E2E_Project_123456', description: 'E2E 測試項目', ... }
```

**可用函數**：
- `generateBudgetPoolData()`: 生成預算池數據
- `generateProjectData()`: 生成項目數據
- `generateProposalData()`: 生成預算提案數據
- `generateVendorData()`: 生成供應商數據
- `generatePurchaseOrderData()`: 生成採購訂單數據
- `generateExpenseData()`: 生成費用數據
- `generateChargeOutData()`: 生成費用轉嫁數據
- `wait(ms)`: 等待助手函數
- `formatCurrency(amount)`: 格式化貨幣顯示

**數據特點**：
- 所有測試數據使用 `E2E_` 前綴，便於識別和清理
- 使用時間戳確保唯一性
- 符合業務邏輯要求（如金額格式、日期範圍等）

## ⚙️ 配置說明

測試配置位於 `playwright.config.ts`：

```typescript
{
  testDir: './e2e',                    // 測試目錄
  fullyParallel: true,                 // 並行運行
  retries: process.env.CI ? 2 : 0,     // CI 環境重試次數
  timeout: 30000,                      // 測試超時時間（30秒）

  use: {
    baseURL: 'http://localhost:3000',  // 基礎 URL
    trace: 'on-first-retry',           // 失敗時記錄 trace
    screenshot: 'only-on-failure',     // 失敗時截圖
    video: 'retain-on-failure',        // 失敗時保留視頻
  },

  projects: [
    { name: 'chromium' },              // Chrome 瀏覽器
    { name: 'firefox' },               // Firefox 瀏覽器
  ],

  webServer: {
    command: 'pnpm dev',               // 自動啟動開發伺服器
    url: 'http://localhost:3000',
    reuseExistingServer: true,         // 復用已運行的伺服器
  },
}
```

## 📊 測試報告

測試完成後，會生成 HTML 報告：

```bash
# 查看報告
pnpm test:e2e:report
```

報告包含：
- 測試執行時間
- 通過/失敗狀態
- 失敗時的截圖和視頻
- Trace 文件（可重放測試過程）

## 🐛 調試技巧

### 1. UI 模式（推薦）

```bash
pnpm test:e2e:ui
```

優點：
- 視覺化測試執行
- 可以單步執行
- 即時查看頁面狀態
- 可以重新運行失敗的測試

### 2. Debug 模式

```bash
pnpm test:e2e:debug
```

特點：
- 打開 Playwright Inspector
- 逐步執行測試
- 查看選擇器
- 修改測試代碼即時生效

### 3. Headed 模式

```bash
pnpm test:e2e:headed
```

特點：
- 顯示瀏覽器窗口
- 實時查看測試執行
- 適合快速驗證

### 4. 使用 `page.pause()`

在測試中添加暫停點：

```typescript
await page.pause();  // 測試會在此暫停，打開調試器
```

## ⚠️ 常見問題

### Q1: 測試超時失敗

**原因**: 頁面載入慢或操作超時

**解決方案**:
```typescript
// 增加特定操作的超時時間
await page.click('button', { timeout: 10000 });

// 或在測試級別增加超時
test('my test', async ({ page }) => {
  test.setTimeout(60000); // 60 秒
});
```

### Q2: 選擇器找不到元素

**原因**: 元素還未載入或選擇器不正確

**解決方案**:
```typescript
// 等待元素可見
await page.waitForSelector('input[name="email"]', { state: 'visible' });

// 使用更具體的選擇器
await page.locator('button:has-text("提交")').click();

// 使用 data 屬性
await page.click('[data-testid="submit-button"]');
```

### Q3: 測試數據衝突

**原因**: 測試數據未清理或重複

**解決方案**:
- 使用時間戳確保數據唯一性（已實現）
- 在測試前清理舊的測試數據
- 使用事務（如果支持）

### Q4: 開發伺服器未啟動

**原因**: Playwright 嘗試啟動伺服器失敗

**解決方案**:
```bash
# 手動啟動開發伺服器
pnpm dev

# 然後運行測試（會復用已運行的伺服器）
pnpm test:e2e
```

## 📈 最佳實踐

### 1. 測試結構

```typescript
test.describe('功能模塊', () => {
  test('具體測試場景', async ({ managerPage }) => {
    // 使用 test.step 組織測試步驟
    await test.step('Step 1: 準備數據', async () => {
      // ...
    });

    await test.step('Step 2: 執行操作', async () => {
      // ...
    });

    await test.step('Step 3: 驗證結果', async () => {
      // ...
    });
  });
});
```

### 2. 等待策略

```typescript
// ✅ 好的做法：明確等待
await page.waitForSelector('button');
await page.click('button');

// ❌ 不好的做法：使用固定延遲
await wait(5000);
await page.click('button');
```

### 3. 斷言

```typescript
// ✅ 使用具體的斷言
await expect(page.locator('h1')).toContainText('預期文字');

// ✅ 驗證元素可見性
await expect(page.locator('.error-message')).toBeVisible();

// ✅ 驗證 URL
await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+/);
```

### 4. 測試數據清理

```typescript
// 使用 E2E_ 前綴標記測試數據
const projectData = generateProjectData();
// projectData.name = 'E2E_Project_123456'

// 定期清理測試數據（可以編寫清理腳本）
```

## 🔄 CI/CD 集成

在 GitHub Actions 中運行測試：

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## 📚 相關資源

- [Playwright 官方文檔](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Test Selectors](https://playwright.dev/docs/selectors)
- [Debugging Tests](https://playwright.dev/docs/debug)

## 🤝 貢獻指南

### 添加新測試

1. 在適當的目錄創建測試文件（`*.spec.ts`）
2. 使用 fixtures 和測試數據工廠
3. 遵循命名慣例和測試結構
4. 添加適當的文檔注釋

### 測試命名慣例

- 文件名：`feature-workflow.spec.ts`
- 測試組：`test.describe('功能模塊')`
- 測試用例：`test('具體場景描述')`

---

**最後更新**: 2025-10-28
**維護人員**: 開發團隊 + AI Assistant
