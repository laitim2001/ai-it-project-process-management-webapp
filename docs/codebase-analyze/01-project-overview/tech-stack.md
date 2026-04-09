# 技術棧分析報告

> 分析日期：2026-04-09
> 分析範圍：所有 package.json、turbo.json、tsconfig 配置

---

## 1. 核心框架版本

| 技術 | 版本 | 所在套件 | 來源檔案 |
|------|------|----------|----------|
| Next.js | 14.2.33 | `@itpm/web` | `apps/web/package.json:63` |
| React | ^18.2.0 | `@itpm/web` | `apps/web/package.json:65` |
| React DOM | ^18.2.0 | `@itpm/web` | `apps/web/package.json:66` |
| TypeScript | ^5.3.3 | 所有套件 | 根 `package.json:67` |
| tRPC (server) | ^10.45.1 | `@itpm/api` | `packages/api/package.json:15` |
| tRPC (client) | ^10.45.1 | `@itpm/web` | `apps/web/package.json:50` |
| Prisma Client | ^5.9.1 | `@itpm/db` | `packages/db/package.json:17` |
| Prisma CLI | ^5.9.1 | `@itpm/db` | `packages/db/package.json:23` |
| NextAuth.js | 5.0.0-beta.30 | `@itpm/auth` | `packages/auth/package.json:16` |
| Node.js | >= 20.0.0 (固定 20.11.0) | 根 | `package.json:71`, `.nvmrc` |
| pnpm | >= 8.0.0 (固定 8.15.3) | 根 | `package.json:69` |
| Turborepo | ^1.12.4 | 根 | `package.json:66` |

## 2. 依賴總覽

- **根 package.json**：1 個 dependency + 7 個 devDependencies
- **apps/web**：42 個 dependencies + 13 個 devDependencies
- **packages/api**：6 個 dependencies + 5 個 devDependencies
- **packages/db**：1 個 dependency + 5 個 devDependencies
- **packages/auth**：3 個 dependencies + 4 個 devDependencies
- **packages/tsconfig**：0 個 dependencies（純設定檔）

**合計（去重前）**：53 個 dependencies + 34 個 devDependencies

## 3. 依賴分類詳解

### 3.1 UI 框架與元件庫 (22 個)

| 套件 | 版本 | 用途 |
|------|------|------|
| `tailwindcss` | ^3.4.1 | CSS 框架 |
| `class-variance-authority` | ^0.7.0 | 元件變體管理（shadcn/ui 基礎） |
| `clsx` | ^2.1.0 | 條件 CSS class 合併 |
| `tailwind-merge` | ^2.2.0 | Tailwind class 去重合併 |
| `lucide-react` | ^0.292.0 | 圖標庫 |
| `cmdk` | ^1.1.1 | Command palette（命令面板） |
| `@radix-ui/react-accordion` | ^1.2.12 | 手風琴面板 |
| `@radix-ui/react-alert-dialog` | ^1.1.15 | 警告對話框 |
| `@radix-ui/react-avatar` | ^1.1.10 | 用戶頭像 |
| `@radix-ui/react-checkbox` | ^1.3.3 | 複選框 |
| `@radix-ui/react-context-menu` | ^2.2.16 | 右鍵選單 |
| `@radix-ui/react-dialog` | ^1.1.15 | 對話框 |
| `@radix-ui/react-dropdown-menu` | ^2.1.16 | 下拉選單 |
| `@radix-ui/react-icons` | ^1.3.2 | Radix 圖標 |
| `@radix-ui/react-label` | ^2.1.7 | 表單標籤 |
| `@radix-ui/react-popover` | ^1.1.15 | 彈出框 |
| `@radix-ui/react-progress` | ^1.1.7 | 進度條 |
| `@radix-ui/react-radio-group` | ^1.3.8 | 單選按鈕組 |
| `@radix-ui/react-select` | ^2.2.6 | 下拉選擇 |
| `@radix-ui/react-separator` | ^1.1.7 | 分隔線 |
| `@radix-ui/react-slider` | ^1.3.6 | 滑桿 |
| `@radix-ui/react-slot` | ^1.2.3 | Slot 模式 |
| `@radix-ui/react-switch` | ^1.2.6 | 開關 |
| `@radix-ui/react-tabs` | ^1.1.13 | 標籤頁 |
| `@radix-ui/react-toast` | ^1.2.15 | Toast 通知 |
| `@radix-ui/react-tooltip` | ^1.2.8 | 工具提示 |

### 3.2 資料層與 API (7 個)

| 套件 | 版本 | 用途 |
|------|------|------|
| `@trpc/server` | ^10.45.1 | tRPC 伺服端 |
| `@trpc/client` | ^10.45.1 | tRPC 客戶端 |
| `@trpc/next` | ^10.45.1 | tRPC Next.js 整合 |
| `@trpc/react-query` | ^10.45.1 | tRPC React Query 整合 |
| `@tanstack/react-query` | ^4.36.1 | 伺服端狀態管理 |
| `zod` | ^3.25.76 | Schema 驗證（前端最新版） |
| `superjson` | ^2.2.1 | 序列化（Date, BigInt 等） |

### 3.3 認證與安全 (5 個)

| 套件 | 版本 | 用途 |
|------|------|------|
| `next-auth` | 5.0.0-beta.30 | 認證框架（NextAuth v5） |
| `@auth/prisma-adapter` | 2.7.4 | Prisma 資料庫適配器 |
| `bcrypt` | ^6.0.0 | 密碼雜湊（native） |
| `bcryptjs` | ^2.4.3 | 密碼雜湊（JS 實作，跨平台） |

### 3.4 國際化 (1 個)

| 套件 | 版本 | 用途 |
|------|------|------|
| `next-intl` | ^4.4.0 | Next.js 國際化框架（en, zh-TW） |

### 3.5 表單處理 (2 個)

| 套件 | 版本 | 用途 |
|------|------|------|
| `react-hook-form` | ^7.65.0 | React 表單管理 |
| `@hookform/resolvers` | ^5.2.2 | 表單驗證解析器（Zod 整合） |

### 3.6 拖放與互動 (3 個)

| 套件 | 版本 | 用途 |
|------|------|------|
| `@dnd-kit/core` | ^6.3.1 | 拖放核心（OM Expense 排序） |
| `@dnd-kit/sortable` | ^10.0.0 | 排序拖放 |
| `@dnd-kit/utilities` | ^3.2.2 | 拖放工具函數 |

### 3.7 Azure 服務整合 (2 個)

| 套件 | 版本 | 用途 |
|------|------|------|
| `@azure/storage-blob` | ^12.29.1 | Azure Blob 檔案上傳 |
| `@azure/identity` | ^4.13.0 | Azure 身份驗證 |

### 3.8 工具與輔助 (5 個)

| 套件 | 版本 | 用途 |
|------|------|------|
| `date-fns` | ^4.1.0 | 日期處理 |
| `xlsx` | ^0.18.5 | Excel 解析（FEAT-008 Data Import） |
| `react-dropzone` | ^14.3.8 | 檔案拖放上傳 |
| `nodemailer` | ^7.0.7 | Email 發送（API 層） |
| `dotenv` | ^17.2.3 | 環境變數載入 |

### 3.9 開發工具 (13 個)

| 套件 | 版本 | 用途 |
|------|------|------|
| `eslint` | ^8.56.0 | 程式碼檢查 |
| `eslint-config-next` | 14.2.33 | Next.js ESLint 規則 |
| `eslint-config-prettier` | ^9.1.0 | Prettier 相容 |
| `eslint-plugin-import` | ^2.29.1 | Import 排序規則 |
| `@typescript-eslint/eslint-plugin` | ^6.21.0 | TypeScript ESLint |
| `@typescript-eslint/parser` | ^6.21.0 | TypeScript 解析器 |
| `prettier` | ^3.2.5 | 程式碼格式化 |
| `prettier-plugin-tailwindcss` | ^0.5.11 | Tailwind class 排序 |
| `autoprefixer` | ^10.4.17 | CSS 前綴 |
| `postcss` | ^8.4.35 | CSS 處理器 |
| `tsx` | ^4.7.1 | TypeScript 直接執行 |
| `@next/bundle-analyzer` | ^15.5.4 | Bundle 分析 |
| `@playwright/test` | ^1.56.1 | E2E 測試框架 |

## 4. 外部整合服務

### 4.1 Azure AD (Microsoft Entra ID)

- **使用位置**：`packages/auth/src/index.ts:191` (`AzureADProvider`)
- **Provider 類型**：`next-auth/providers/azure-ad`（非 B2C）
- **啟用條件**：環境變數 `AZURE_AD_CLIENT_ID` + `AZURE_AD_CLIENT_SECRET` 同時存在
- **Scope**：`openid profile email User.Read`
- **Issuer**：`https://login.microsoftonline.com/${AZURE_AD_TENANT_ID}/v2.0`

### 4.2 Azure Blob Storage

- **使用位置**：`apps/web/src/lib/azure-storage.ts`
- **API Route 整合**：3 個上傳端點
  - `apps/web/src/app/api/upload/quote/route.ts`
  - `apps/web/src/app/api/upload/invoice/route.ts`
  - `apps/web/src/app/api/upload/proposal/route.ts`
- **本地模擬**：Azurite（`docker-compose.yml` 定義）

### 4.3 Email 服務

- **使用位置**：`packages/api/src/lib/email.ts`
- **生產環境**：Nodemailer（支援 SendGrid SMTP）
- **開發環境**：Mailhog（`docker-compose.yml:62-69`）

### 4.4 Redis

- **定義位置**：`docker-compose.yml:46-59`
- **本地端口**：6381 (映射到容器 6379)
- **用途**：快取和 Session 儲存（目前標記為 optional/future use）

## 5. 狀態管理

**重要發現**：CLAUDE.md 提到使用 Zustand/Jotai，但實際搜尋 `apps/web/src/` 中**未找到任何 zustand 或 jotai 的使用**。應用主要依靠：

- **伺服端狀態**：React Query（透過 tRPC 整合）
- **元件本地狀態**：React `useState`
- **表單狀態**：React Hook Form
- **認證狀態**：NextAuth SessionProvider + `useSession`
- **國際化狀態**：NextIntlClientProvider
- **Context API**：用於 shadcn/ui 元件內部（Dialog, Toast, Form 等）

## 6. Monorepo 套件關係

```
@itpm/web (apps/web)
├── @itpm/api (workspace:*)
├── @itpm/auth (workspace:*)
├── @itpm/db (workspace:*)
└── @itpm/tsconfig (workspace:*)

@itpm/api (packages/api)
├── @itpm/auth (workspace:*)
├── @itpm/db (workspace:*)
└── @itpm/tsconfig (workspace:*)

@itpm/auth (packages/auth)
├── @itpm/db (workspace:*)
└── @itpm/tsconfig (workspace:*)

@itpm/db (packages/db)
└── @itpm/tsconfig (workspace:*)

@itpm/tsconfig (packages/tsconfig)
└── (無依賴)
```

層級結構：`tsconfig` -> `db` -> `auth` -> `api` -> `web`
