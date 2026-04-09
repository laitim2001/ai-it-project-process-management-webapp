# 配置與環境變數分析 (Configuration & Environment Variables)

> 基於原始碼驗證，最後更新: 2026-04-09

---

## 1. 環境變數清單

以下環境變數從原始碼中 `process.env.*` 使用處與 `.env.example` 交叉驗證。

### 1.1 核心環境變數（必要）

| 變數名稱 | 引用位置 | 說明 |
|----------|----------|------|
| `DATABASE_URL` | `packages/db/prisma/schema.prisma`, scripts | PostgreSQL 連線字串 |
| `NEXTAUTH_SECRET` | `packages/auth/src/index.ts:380`, `apps/web/src/auth.config.ts:155` | JWT 簽名密鑰 |
| `AUTH_SECRET` | `apps/web/src/auth.config.ts:155` | JWT 簽名密鑰（優先於 NEXTAUTH_SECRET） |
| `NEXTAUTH_URL` | `.env.example` | NextAuth 應用程式 URL |
| `NODE_ENV` | 多處 | 環境模式 (development/production) |

### 1.2 Azure AD 認證

| 變數名稱 | 引用位置 | 說明 |
|----------|----------|------|
| `AZURE_AD_TENANT_ID` | `auth.ts:105,110`, `packages/auth/src/index.ts:194` | Azure AD Tenant ID |
| `AZURE_AD_CLIENT_ID` | `auth.ts:103,108`, `packages/auth/src/index.ts:188,191` | 應用程式 Client ID |
| `AZURE_AD_CLIENT_SECRET` | `auth.ts:104,109`, `packages/auth/src/index.ts:188,192` | Client Secret |

**條件載入**: Azure AD Provider 僅在三個變數全部設置時啟用。

### 1.3 Azure Blob Storage

| 變數名稱 | 引用位置 | 說明 |
|----------|----------|------|
| `AZURE_STORAGE_USE_DEVELOPMENT` | `apps/web/src/lib/azure-storage.ts:76` | 是否使用 Azurite 開發儲存 |
| `AZURE_STORAGE_ACCOUNT_NAME` | `apps/web/src/lib/azure-storage.ts:89` | Storage 帳戶名稱 |
| `AZURE_STORAGE_ACCOUNT_KEY` | `apps/web/src/lib/azure-storage.ts:119,368` | Storage 帳戶金鑰（SAS Token 生成用） |
| `AZURE_STORAGE_CONTAINER_QUOTES` | `.env.example` | 報價單 Container 名稱 |
| `AZURE_STORAGE_CONTAINER_INVOICES` | `.env.example` | 發票 Container 名稱 |
| `AZURE_STORAGE_CONTAINER_PROPOSALS` | `.env.example` | 提案 Container 名稱 |

**注意**: Container 名稱在 `azure-storage.ts` 中硬編碼為 `quotes`, `invoices`, `proposals`（第 34-37 行），未讀取環境變數。`.env.example` 中的 Container 環境變數實際上未被使用。

### 1.4 Email 服務

| 變數名稱 | 引用位置 | 說明 |
|----------|----------|------|
| `SENDGRID_API_KEY` | `packages/api/src/lib/email.ts:111` | SendGrid API Key |
| `SMTP_HOST` | `packages/api/src/lib/email.ts:114,117` | SMTP 主機（開發用 Mailhog） |
| `SMTP_PORT` | `packages/api/src/lib/email.ts:118` | SMTP 端口（預設 587） |
| `SMTP_SECURE` | `packages/api/src/lib/email.ts:119` | 是否使用 TLS |
| `SMTP_USER` | `packages/api/src/lib/email.ts:121` | SMTP 帳號 |
| `SMTP_PASS` | `packages/api/src/lib/email.ts:122` | SMTP 密碼 |
| `EMAIL_FROM` | `packages/api/src/lib/email.ts:163` | 寄件人地址 |

**選擇邏輯**: 優先使用 `SENDGRID_API_KEY`（生產），降級到 `SMTP_HOST`（開發 Mailhog）。

### 1.5 Runtime / 部署相關

| 變數名稱 | 引用位置 | 說明 |
|----------|----------|------|
| `NEXT_RUNTIME` | `apps/web/instrumentation.ts:16` | Next.js Runtime (`nodejs` / `edge`) |
| `VERCEL_URL` | `apps/web/src/lib/trpc-provider.tsx:100` | Vercel 部署 URL |
| `PORT` | `apps/web/src/lib/trpc-provider.tsx:101` | 應用程式端口（預設 3000） |
| `CI` | `playwright.config.ts:10,11,12,17` | CI 環境標記 |
| `BASE_URL` | `playwright.config.ts:39` | E2E 測試基礎 URL |
| `NEXT_PUBLIC_APP_URL` | `playwright.config.ts:39` | 公開的應用程式 URL |
| `ADMIN_SEED_SECRET` | `apps/web/src/app/api/admin/seed/route.ts:104` | Seed API 保護密鑰 |

### 1.6 前端公開變數 (NEXT_PUBLIC_)

| 變數名稱 | 定義位置 | 說明 |
|----------|----------|------|
| `NEXT_PUBLIC_APP_NAME` | `.env.example` | 應用程式名稱 |
| `NEXT_PUBLIC_APP_VERSION` | `.env.example` | 應用程式版本 |
| `NEXT_PUBLIC_ENVIRONMENT` | `.env.example` | 環境名稱 |
| `NEXT_PUBLIC_FEATURE_AI_ASSISTANT` | `.env.example` | Epic 9 Feature Flag |
| `NEXT_PUBLIC_FEATURE_EXTERNAL_INTEGRATION` | `.env.example` | Epic 10 Feature Flag |

### 1.7 僅在 .env.example 定義（程式碼中未直接引用）

| 變數名稱 | 說明 |
|----------|------|
| `APP_NAME`, `APP_URL` | 應用程式基本資訊 |
| `NEXTAUTH_SESSION_MAX_AGE` | Session 有效期（程式碼中硬編碼 86400） |
| `AZURE_AD_SCOPE` | OAuth Scope（程式碼中硬編碼） |
| `REDIS_URL` | Redis 連線（程式碼中未發現使用處） |
| `RATE_LIMIT_*` | API 速率限制（未實作） |
| `LOG_LEVEL`, `LOG_FORMAT` | 日誌配置（未實作） |
| `CORS_ORIGIN` | CORS 設定（未實作） |
| `TZ` | 時區設定 |
| `DEFAULT_PAGE_SIZE`, `MAX_PAGE_SIZE` | 分頁預設值（程式碼中硬編碼） |
| `MAX_FILE_SIZE_MB`, `ALLOWED_FILE_TYPES` | 檔案限制（程式碼中硬編碼） |
| `TEST_DATABASE_URL` | 測試資料庫 URL |
| `DEBUG`, `VERBOSE_LOGGING` | 調試模式 |

---

## 2. Next.js 配置

**檔案**: `apps/web/next.config.mjs` (38 行)

```javascript
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@itpm/api', '@itpm/db'],
  output: 'standalone',
  experimental: {
    instrumentationHook: true,
    typedRoutes: true,
    workerThreads: false,
    cpus: 1,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@prisma/client');
    }
    return config;
  },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default withNextIntl(nextConfig);
```

### 2.1 配置細節

| 選項 | 值 | 說明 |
|------|-----|------|
| `reactStrictMode` | `true` | React 嚴格模式 |
| `transpilePackages` | `['@itpm/api', '@itpm/db']` | 轉譯 monorepo 套件 |
| `output` | `'standalone'` | Docker 部署用獨立輸出 |
| `instrumentationHook` | `true` | 啟用 `instrumentation.ts` 初始化 Hook |
| `typedRoutes` | `true` | 實驗性類型安全路由 |
| `workerThreads` | `false` | 停用 Worker Threads（避免 Prisma 衝突） |
| `cpus` | `1` | 限制 CPU 使用（Azure 環境優化） |
| `ignoreBuildErrors` | `true` | 跳過 TypeScript 構建錯誤 |
| `ignoreDuringBuilds` | `true` | 跳過 ESLint 構建檢查 |

### 2.2 Webpack 自訂

- Server-side: `@prisma/client` 標記為 external，避免打包（第 23-25 行）
- Edge Runtime 不使用 Prisma（由 `auth.config.ts` 處理）

### 2.3 next-intl 整合

```javascript
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
export default withNextIntl(nextConfig);
```

指定 `request.ts` 為 next-intl 的請求處理器路徑。

---

## 3. Turborepo 配置

**檔案**: `turbo.json` (53 行)

### 3.1 全域環境變數

```json
"globalEnv": [
  "NODE_ENV",
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "AZURE_AD_B2C_TENANT_NAME",
  "AZURE_AD_B2C_CLIENT_ID",
  "AZURE_AD_B2C_CLIENT_SECRET"
]
```

**注意**: `globalEnv` 中列出 `AZURE_AD_B2C_*` 變數，但實際程式碼使用 `AZURE_AD_*`（無 B2C 後綴）。這是一個不一致之處。

### 3.2 Pipeline 配置

| 任務 | dependsOn | outputs | cache |
|------|-----------|---------|-------|
| `build` | `^build` | `.next/**`, `dist/**` (排除 `.next/cache/**`) | 是 |
| `dev` | - | - | 否 (persistent) |
| `lint` | `^lint` | - | 是 |
| `typecheck` | `^typecheck` | - | 是 |
| `test` | `^build` | `coverage/**` | 是 |
| `test:watch` | - | - | 否 (persistent) |
| `clean` | - | - | 否 |
| `db:generate` | - | - | 否 |
| `db:migrate` | - | - | 否 |
| `db:push` | - | - | 否 |
| `db:studio` | - | - | 否 (persistent) |

### 3.3 全域依賴

```json
"globalDependencies": ["**/.env"]
```

任何 `.env` 檔案變更都會使所有任務快取失效。

---

## 4. Monorepo 工作區配置

**檔案**: `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### 4.1 工作區結構

| 工作區 | 套件名稱 | 說明 |
|--------|----------|------|
| `apps/web` | (web app) | Next.js 前端應用 |
| `packages/api` | `@itpm/api` | tRPC API 路由 |
| `packages/db` | `@itpm/db` | Prisma 資料庫層 |
| `packages/auth` | `@itpm/auth` | 認證配置 |
| `packages/eslint-config` | `@itpm/eslint-config` | 共享 ESLint 配置 |
| `packages/tsconfig` | `@itpm/tsconfig` | 共享 TypeScript 配置 |

### 4.2 根 tsconfig.json

```json
{
  "files": [],
  "references": [
    { "path": "./apps/web" },
    { "path": "./packages/api" },
    { "path": "./packages/db" },
    { "path": "./packages/auth" }
  ]
}
```

使用 Project References 管理 monorepo TypeScript 編譯。

---

## 5. Docker Compose 配置

**檔案**: `docker-compose.yml` (105 行)

### 5.1 服務清單

| 服務 | 映像 | 容器名稱 | 外部端口 → 內部端口 |
|------|------|----------|---------------------|
| PostgreSQL 16 | `postgres:16-alpine` | `itpm-postgres-dev` | **5434** → 5432 |
| pgAdmin 4 | `dpage/pgadmin4:latest` | `itpm-pgadmin` | 5050 → 80 |
| Redis 7 | `redis:7-alpine` | `itpm-redis-dev` | **6381** → 6379 |
| Mailhog | `mailhog/mailhog:latest` | `itpm-mailhog` | 1025 → 1025 (SMTP), 8025 → 8025 (Web UI) |
| Azurite | `mcr.microsoft.com/azure-storage/azurite` | `itpm-azurite-dev` | 10000-10002 → 10000-10002 |

**重要**: PostgreSQL 和 Redis 使用非標準端口（5434, 6381），避免與其他專案衝突。

### 5.2 PostgreSQL 配置

```yaml
environment:
  POSTGRES_USER: postgres
  POSTGRES_PASSWORD: localdev123
  POSTGRES_DB: itpm_dev
  POSTGRES_INITDB_ARGS: '-E UTF8 --locale=C'
```

對應 DATABASE_URL: `postgresql://postgres:localdev123@localhost:5434/itpm_dev`

### 5.3 pgAdmin 配置

```yaml
environment:
  PGADMIN_DEFAULT_EMAIL: admin@itpm.local
  PGADMIN_DEFAULT_PASSWORD: admin123
  PGADMIN_CONFIG_SERVER_MODE: 'False'
```

### 5.4 Health Check

- PostgreSQL: `pg_isready -U postgres`（每 10 秒，5 次重試）
- Redis: `redis-cli ping`（每 10 秒，5 次重試）
- Azurite: `nc 127.0.0.1 10000 -z`（每 10 秒，5 次重試）

### 5.5 Volumes

| Volume | 說明 |
|--------|------|
| `postgres_data` | PostgreSQL 資料持久化 |
| `pgadmin_data` | pgAdmin 配置持久化 |
| `redis_data` | Redis 資料持久化 |
| `azurite_data` | Azurite Blob 資料持久化 |

### 5.6 網路

所有服務共用 `itpm-network` bridge 網路。

---

## 6. Instrumentation Hook

**檔案**: `apps/web/instrumentation.ts` (27 行)

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeDatabase } = await import('./src/lib/db-init');
    await initializeDatabase();
  }
}
```

- 僅在 Node.js runtime 執行（排除 Edge）
- 動態 import `db-init.ts` 避免客戶端打包問題
- 呼叫 `initializeDatabase()` 自動 seed Role 和 Currency 表

---

## 7. 自訂 Hooks 清單

**目錄**: `apps/web/src/hooks/`

| Hook | 檔案 | 用途 | 主要使用場景 |
|------|------|------|-------------|
| `useTheme` | `use-theme.ts` (206 行) | 主題管理 (light/dark/system) | ThemeToggle, Settings 頁面 |
| `useDebounce` | `useDebounce.ts` (127 行) | 值防抖 (預設 500ms) | 搜尋輸入框、列表篩選 |
| `usePermissions` | `usePermissions.ts` (238 行) | 權限管理 (FEAT-011) | Sidebar 菜單過濾 |

### 7.1 useTheme

- **型別**: `Theme = 'light' | 'dark' | 'system'`
- **儲存**: `localStorage` key `"theme"`
- **系統偵測**: `window.matchMedia('(prefers-color-scheme: dark)')`
- **CSS 應用**: 在 `document.documentElement` 上添加/移除 `light`/`dark` class
- **返回值**: `{ theme, resolvedTheme, setTheme }`
- **自製實現**: 不依賴 `next-themes`，完全自訂

### 7.2 useDebounce

- **泛型支援**: `useDebounce<T>(value: T, delay: number = 500): T`
- **自動清理**: 組件卸載時 clearTimeout
- **使用場景**: 搜尋欄位（projects, vendors, proposals, budget-pools, purchase-orders）

### 7.3 usePermissions

- **資料來源**: `api.permission.getMyPermissions.useQuery()`
- **緩存**: `staleTime: 5min`, `cacheTime: 30min`, 不隨視窗焦點刷新
- **查詢方法**: 使用 `Set` 實現 O(1) 查找
- **常量**: `MENU_PERMISSIONS` 包含 18 個菜單權限代碼
- **映射**: `ROUTE_PERMISSION_MAP` 將 17 個路由映射到權限代碼

---

## 8. 工具函數庫清單

**目錄**: `apps/web/src/lib/`

| 檔案 | 大小 | 用途 |
|------|------|------|
| `trpc.ts` (114 行) | tRPC React Client | 建立型別安全 API 客戶端 |
| `trpc-provider.tsx` (133 行) | tRPC Provider 組件 | 提供 tRPC + React Query Context |
| `utils.ts` (104 行) | Tailwind CSS 工具 | `cn()` 類名合併函數 |
| `exportUtils.ts` (162 行) | CSV 匯出工具 | `convertToCSV`, `downloadCSV`, `generateExportFilename` |
| `azure-storage.ts` (513 行) | Azure Blob Storage | 上傳/下載/刪除/SAS Token 生成 |
| `db-init.ts` (116 行) | 資料庫初始化 | 自動 seed Role + Currency |

### 8.1 trpc.ts

```typescript
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@itpm/api';
export const api = createTRPCReact<AppRouter>();
```

- 單行建立型別安全的 tRPC React 客戶端
- 從 `@itpm/api` 的 `AppRouter` 自動推斷所有 procedure 型別

### 8.2 trpc-provider.tsx

**URL 解析邏輯** (`getBaseUrl` 第 98-102 行):
```typescript
function getBaseUrl() {
  if (typeof window !== 'undefined') return '';        // 客戶端: 相對路徑
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // Vercel
  return `http://localhost:${process.env.PORT ?? 3000}`;  // 本地 SSR
}
```

**配置**:
- Link: `httpBatchLink` (自動批次合併請求)
- Transformer: `superjson` (支援 Date, BigInt 等)
- API URL: `${getBaseUrl()}/api/trpc`

### 8.3 cn() (utils.ts)

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- 結合 `clsx`（條件類名）和 `tailwind-merge`（衝突解決）
- 專案中使用頻率極高，幾乎所有 UI 組件都使用

### 8.4 exportUtils.ts

| 函數 | 說明 |
|------|------|
| `convertToCSV(data: BudgetPoolExportData[])` | 將預算池資料轉為 CSV 字串 |
| `escapeCSV(value: string)` | 轉義 CSV 特殊字元 (逗號、雙引號、換行) |
| `downloadCSV(csvContent, filename)` | 觸發瀏覽器下載 CSV 檔案 (Blob API) |
| `generateExportFilename(prefix)` | 生成帶時間戳的檔名 (`prefix_YYYY-MM-DD_HH-MM-SS.csv`) |

**注意**: `convertToCSV` 目前只支援 `BudgetPoolExportData` 型別，非通用實現。

### 8.5 azure-storage.ts

| 函數 | 說明 |
|------|------|
| `uploadToBlob(file, containerName, blobName, contentType?)` | 上傳檔案到 Blob Storage |
| `downloadFromBlob(containerName, blobName)` | 下載檔案為 Buffer |
| `deleteFromBlob(containerName, blobName)` | 刪除 Blob |
| `generateSasUrl(containerName, blobName, expiresInMinutes?)` | 生成 SAS Token URL |
| `blobExists(containerName, blobName)` | 檢查 Blob 是否存在 |
| `extractBlobNameFromUrl(blobUrl)` | 從 URL 提取 Blob 名稱 |
| `extractContainerNameFromUrl(blobUrl)` | 從 URL 提取 Container 名稱 |

**認證策略** (優先順序):
1. 開發環境: Azurite 連線字串 (`UseDevelopmentStorage=true`)
2. 生產環境 + Account Key: `StorageSharedKeyCredential`
3. 生產環境 + Managed Identity: `DefaultAzureCredential`

**Container 名稱常量**:
```typescript
export const BLOB_CONTAINERS = {
  QUOTES: "quotes",
  INVOICES: "invoices",
  PROPOSALS: "proposals",
} as const;
```

### 8.6 db-init.ts

**自動 Seed 資料**:
- 3 個 Role: ProjectManager (1), Supervisor (2), Admin (3)
- 6 個 Currency: TWD, USD, CNY, HKD, JPY, EUR

**觸發時機**: `instrumentation.ts` 的 `register()` 函數（應用啟動時）
**冪等性**: 使用 `prisma.role.upsert()` 和 `prisma.currency.upsert()`，可重複執行

---

## 9. I18N 配置

**目錄**: `apps/web/src/i18n/`

### 9.1 routing.ts

```typescript
export const routing = defineRouting({
  locales: ['en', 'zh-TW'],
  defaultLocale: 'zh-TW',
  localePrefix: 'always',
});

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
```

### 9.2 request.ts

```typescript
export default getRequestConfig(async ({requestLocale}) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale; // 降級到 zh-TW
  }
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
```

---

## 10. 已知問題與觀察

1. **turbo.json globalEnv 不一致**: 列出 `AZURE_AD_B2C_*` 但程式碼使用 `AZURE_AD_*`（無 B2C 後綴），Turborepo 快取可能未正確追蹤實際使用的環境變數。
2. **Container 名稱環境變數未使用**: `.env.example` 定義了 `AZURE_STORAGE_CONTAINER_*` 但 `azure-storage.ts` 硬編碼 container 名稱。
3. **Redis 未使用**: `.env.example` 定義了 `REDIS_URL`，Docker Compose 啟動了 Redis 服務，但程式碼中未發現 Redis 使用處。
4. **ignoreBuildErrors**: `next.config.mjs` 設定 `typescript.ignoreBuildErrors: true` 和 `eslint.ignoreDuringBuilds: true`，表示構建時跳過型別和 lint 檢查。這是標記為「暫時性」的設定（第 29-35 行註解）。
5. **SESSION_MAX_AGE 未讀取**: `.env.example` 定義了 `NEXTAUTH_SESSION_MAX_AGE`，但程式碼中 session maxAge 硬編碼為 `24 * 60 * 60`（86400 秒）。
6. **速率限制和 CORS 未實作**: `.env.example` 定義了 `RATE_LIMIT_*` 和 `CORS_ORIGIN`，但未發現對應實作。
7. **convertToCSV 非通用**: `exportUtils.ts` 的 CSV 轉換只支援 `BudgetPoolExportData` 型別，若要匯出其他實體需要擴展。
8. **workerThreads/cpus 限制**: Next.js 配置中 `workerThreads: false` 和 `cpus: 1` 可能影響構建性能，此設定是為了避免 Prisma 相容性問題。
