import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 測試配置
 *
 * 支持功能：
 * - 多瀏覽器測試（Chromium, Firefox）
 * - 自動啟動開發伺服器
 * - 失敗時截圖和視頻記錄
 * - CI/CD 環境優化
 */
export default defineConfig({
  // 測試目錄
  testDir: './e2e',

  // 並行運行測試
  fullyParallel: true,

  // CI 環境中禁止 .only
  forbidOnly: !!process.env.CI,

  // CI 環境重試次數
  retries: process.env.CI ? 2 : 0,

  // CI 環境使用單個 worker
  workers: process.env.CI ? 1 : undefined,

  // 測試報告器
  reporter: [
    ['html'],
    ['list'],
    ...(process.env.CI ? [['github'] as ['github']] : []),
  ],

  // 共享設置
  use: {
    // 基礎 URL（E2E 測試專用端口）
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005',

    // 首次重試時記錄 trace
    trace: 'on-first-retry',

    // 失敗時截圖
    screenshot: 'only-on-failure',

    // 失敗時保留視頻
    video: 'retain-on-failure',

    // 操作超時時間
    actionTimeout: 10000,

    // 導航超時時間
    navigationTimeout: 30000,
  },

  // 測試項目配置（多瀏覽器）
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    // 可以添加更多瀏覽器
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Web 伺服器配置
  webServer: {
    command: process.platform === 'win32'
      ? 'set PORT=3005 && set NEXTAUTH_URL=http://localhost:3005 && pnpm dev'
      : 'PORT=3005 NEXTAUTH_URL=http://localhost:3005 pnpm dev',
    url: 'http://localhost:3005',
    reuseExistingServer: false, // 總是啟動新的測試服務器
    timeout: 120 * 1000, // 2 分鐘啟動超時
  },
});
