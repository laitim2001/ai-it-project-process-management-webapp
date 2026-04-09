# 架構模式分析報告

> 分析日期：2026-04-09
> 分析範圍：tRPC、Auth、i18n、Provider、Error Handling、State Management

---

## 1. 資料存取模式 (tRPC + Prisma)

### 1.1 Context 建立流程

**檔案**：`packages/api/src/trpc.ts:124-129`

```
HTTP Request → route.ts (auth()) → createInnerTRPCContext({ session }) → { session, prisma }
```

Context 包含兩個關鍵物件：
- `session`：來自 NextAuth v5 的 `auth()` 結果（JWT 模式）
- `prisma`：來自 `@itpm/db` 的 Prisma Client 實例（Proxy lazy-init 模式）

### 1.2 Procedure 權限層級

**檔案**：`packages/api/src/trpc.ts:286-453`

| Procedure | 權限要求 | 實現方式 |
|-----------|----------|----------|
| `publicProcedure` | 無 | `t.procedure`（基礎 procedure） |
| `protectedProcedure` | 已登入 | 檢查 `ctx.session.user` 存在 |
| `supervisorProcedure` | Supervisor 或 Admin | 檢查 `ctx.session.user.role.name` |
| `adminProcedure` | Admin | 檢查 `ctx.session.user.role.name === 'Admin'` |

Middleware 鏈：`publicProcedure` → `protectedProcedure` → `supervisorProcedure`/`adminProcedure`

### 1.3 Router 註冊

**檔案**：`packages/api/src/root.ts:81-99`

共 17 個 Router 註冊於 `appRouter`：
health, budgetPool, project, user, budgetProposal, vendor, quote, purchaseOrder, expense, dashboard, notification, currency, operatingCompany, omExpense, expenseCategory, chargeOut, permission

### 1.4 前端 tRPC Client

**檔案**：`apps/web/src/lib/trpc.ts:114`

```typescript
export const api = createTRPCReact<AppRouter>();
```

**Provider 配置**：`apps/web/src/lib/trpc-provider.tsx:115-133`
- 使用 `httpBatchLink` 進行 HTTP 批次請求
- 端點 URL：`/api/trpc`
- Transformer：`superjson`
- QueryClient：使用預設配置（無自定 staleTime）

### 1.5 典型 Router 結構（以 project.ts 為例）

**檔案**：`packages/api/src/routers/project.ts`

```
1. Zod Schema 定義（projectStatusEnum, globalFlagEnum, priorityEnum 等）
2. createTRPCRouter({ ... })
3. 標準 CRUD procedures（create, update, delete, getAll, getById）
4. 業務特定 procedures（getBudgetUsage, getStats, export, chargeOut）
5. 分頁查詢模式（page/limit/search/sort）
6. 並行 Promise.all 查詢（items + count）
```

---

## 2. 認證流程

### 2.1 雙重認證模式

**檔案**：`packages/auth/src/index.ts:186-276`

| 認證方式 | Provider | 啟用條件 |
|----------|----------|----------|
| Azure AD SSO | `azure-ad`（Microsoft Entra ID） | `AZURE_AD_CLIENT_ID` + `AZURE_AD_CLIENT_SECRET` 同時存在 |
| 本地密碼 | `credentials` | 永遠啟用 |

### 2.2 Session 策略

- **模式**：JWT（無資料庫 Session 表）
- **過期時間**：24 小時 (`maxAge: 86400`)
- **Secret**：`AUTH_SECRET` 或 `NEXTAUTH_SECRET`
- **JWT 內容**：`id`, `email`, `name`, `roleId`, `role { id, name }`

### 2.3 Azure AD 用戶同步

**檔案**：`packages/auth/src/index.ts:295-333`

Azure AD 登入時，JWT callback 會自動 upsert 用戶到資料庫：
```
Azure AD Profile → prisma.user.upsert({ where: { email }, ... }) → 同步 role 到 JWT token
```

### 2.4 Edge Middleware 認證

**檔案**：`apps/web/src/middleware.ts:67-220`

執行順序：
```
Request → NextAuth auth(authConfig) → 路由保護檢查 → next-intl i18n 路由 → Response
```

**Edge 配置**（`apps/web/src/auth.config.ts:64-169`）：
- 不包含 Prisma（Edge Runtime 不支援）
- 不包含 Providers（在完整 auth 中定義）
- 僅包含 `authorized` callback 和 `session` 策略

**受保護路由列表**（共 17 個路由前綴）：
`/dashboard`, `/projects`, `/budget-pools`, `/budget-proposals`, `/vendors`, `/purchase-orders`, `/expenses`, `/users`, `/om-expenses`, `/om-summary`, `/charge-outs`, `/quotes`, `/notifications`, `/settings`, `/data-import`, `/operating-companies`, `/om-expense-categories`

---

## 3. 頁面生命週期與 Provider 結構

### 3.1 Layout 嵌套

**Root Layout** (`apps/web/src/app/layout.tsx:47-59`)：
- 渲染 `<html>` + `<body>`
- 載入 Inter 字體
- 設定全域 Metadata

**Locale Layout** (`apps/web/src/app/[locale]/layout.tsx:79-122`)：
- **不渲染** HTML 標籤（FIX-096 修復 hydration 錯誤）
- 動態設定 `<html lang>` 屬性（透過 Script）

### 3.2 Provider 包裹順序

```
<GlobalProgress />              ← 全域導航進度條（FEAT-012）
<SessionProvider>                ← NextAuth Session
  <NextIntlClientProvider>       ← next-intl 國際化
    <TRPCProvider>               ← tRPC + React Query
      {children}                 ← 實際頁面內容
      <Toaster />                ← shadcn/ui Toast
    </TRPCProvider>
  </NextIntlClientProvider>
</SessionProvider>
```

### 3.3 頁面模式

所有業務頁面為 Client Component（`'use client'`），使用 tRPC hooks 進行資料存取。
標準 CRUD 資源頁面結構：
- `page.tsx` — 列表頁（分頁、搜尋、過濾）
- `new/page.tsx` — 建立頁（表單元件）
- `[id]/page.tsx` — 詳情頁（含關聯資料）
- `[id]/edit/page.tsx` — 編輯頁（預載現有資料）

---

## 4. 錯誤處理模式

### 4.1 API 層（TRPCError）

**檔案**：`packages/api/src/trpc.ts:206-218`（Zod 錯誤格式化）

```typescript
errorFormatter({ shape, error }) {
  return {
    ...shape,
    data: {
      ...shape.data,
      zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
    },
  };
}
```

**錯誤碼使用慣例**：
| 錯誤碼 | 場景 |
|--------|------|
| `UNAUTHORIZED` | 未登入（protectedProcedure middleware） |
| `FORBIDDEN` | 角色權限不足（supervisor/adminProcedure） |
| `NOT_FOUND` | 資源不存在（getById 查詢） |
| `BAD_REQUEST` | 業務邏輯錯誤（例如刪除有關聯的資源） |

### 4.2 前端層（Toast 通知）

前端 mutation 統一使用 `onSuccess`/`onError` callback 搭配 `useToast`：
```typescript
const mutation = api.entity.create.useMutation({
  onSuccess: () => toast({ title: t('createSuccess') }),
  onError: (error) => toast({ title: t('createError'), description: error.message, variant: 'destructive' }),
});
```

### 4.3 頁面層（條件渲染）

```typescript
if (isLoading) return <LoadingSkeleton />;
if (error) return <ErrorState error={error} />;
if (!data) return <NotFound />;
```

---

## 5. 狀態管理架構

### 5.1 實際使用情況

| 狀態類型 | 技術方案 | 說明 |
|----------|----------|------|
| 伺服端狀態 | React Query (via tRPC) | 所有 API 資料、快取、重試 |
| 元件本地狀態 | React `useState` | 表單輸入、UI 開關、分頁 |
| 表單狀態 | React Hook Form + Zod | 表單驗證與提交 |
| 認證狀態 | NextAuth SessionProvider | `useSession()` 取得使用者資訊 |
| 國際化狀態 | NextIntlClientProvider | `useTranslations()` 取得翻譯 |
| 全域 UI 狀態 | React Context（shadcn/ui 內部） | Dialog、Toast 等元件狀態 |

### 5.2 未使用的狀態管理庫

**重要發現**：CLAUDE.md 聲稱使用 Zustand 和 Jotai，但搜尋整個 `apps/web/src/` 目錄**未找到任何 zustand 或 jotai 的 import 或使用**。這些庫也未出現在任何 `package.json` 的依賴中。

---

## 6. 國際化架構

### 6.1 配置層

**路由配置** (`apps/web/src/i18n/routing.ts:77-89`)：
- Locales：`['en', 'zh-TW']`
- Default Locale：`zh-TW`
- Locale Prefix 策略：`always`（所有語言都顯示前綴）
- URL 結構：`/zh-TW/projects`、`/en/projects`

**請求配置** (`apps/web/src/i18n/request.ts:55-70`)：
- 從 requestLocale 獲取語言
- 驗證 locale 有效性，無效時降級為 `zh-TW`
- 動態 import 翻譯檔案：`import(`../messages/${locale}.json`)`

### 6.2 翻譯檔案

- `apps/web/src/messages/en.json`
- `apps/web/src/messages/zh-TW.json`
- 驗證腳本：`scripts/validate-i18n.js`（`pnpm validate:i18n`）

### 6.3 導航輔助函數

**檔案**：`apps/web/src/i18n/routing.ts:93`

```typescript
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
```

所有頁面內導航使用 `@/i18n/routing` 的 Link/Router，自動處理 locale 前綴。

### 6.4 Middleware 整合

**檔案**：`apps/web/src/middleware.ts:77-165`

i18n 路由處理在 NextAuth 認證之後執行：
```
Request → NextAuth auth() → locale 解析 + 受保護路由檢查 → handleI18nRouting() → Response
```

---

## 7. Monorepo 架構

### 7.1 套件職責

| 套件 | 職責 | 對外導出 |
|------|------|----------|
| `@itpm/tsconfig` | 共享 TypeScript 配置 | `base.json`, `nextjs.json`, `react-library.json` |
| `@itpm/db` | Prisma Schema + Client | `prisma` 實例, Prisma 型別 |
| `@itpm/auth` | NextAuth 配置 | `authOptions`, `hashPassword`, `verifyPassword` |
| `@itpm/api` | tRPC Routers + 業務邏輯 | `appRouter`, `AppRouter` type, `createInnerTRPCContext` |
| `@itpm/web` | Next.js 前端應用 | 無（最終應用） |

### 7.2 Prisma Client 初始化

**檔案**：`packages/db/src/index.ts:7-56`

使用 Proxy + lazy initialization 模式：
- 避免 build-time 初始化錯誤
- 全域 singleton（開發環境避免 hot-reload 建立多個連線）
- 開發環境啟用 `query`, `error`, `warn` 日誌

### 7.3 Turborepo Pipeline

**檔案**：`turbo.json:14-52`

| Task | dependsOn | Cache | 說明 |
|------|-----------|-------|------|
| `build` | `^build` | `.next/**`, `dist/**` | 遞迴建置 |
| `dev` | — | 無快取 | 持久化 dev server |
| `lint` | `^lint` | 有快取 | 遞迴檢查 |
| `typecheck` | `^typecheck` | 有快取 | 遞迴型別檢查 |
| `test` | `^build` | `coverage/**` | 需要先建置 |
| `db:generate` | — | 無快取 | Prisma Client 生成 |
| `db:migrate` | — | 無快取 | 資料庫遷移 |
