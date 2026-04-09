# 中間件分析 (Middleware Analysis)

> 基於原始碼驗證，最後更新: 2026-04-09

---

## 1. 概述

**檔案**: `apps/web/src/middleware.ts` (220 行)
**執行環境**: Edge Runtime
**職責**: 認證保護 + 國際化路由

中間件整合兩個系統：
1. **NextAuth v5** — 認證檢查
2. **next-intl** — 語言路由處理

---

## 2. 執行流程

```
Request
  │
  ├── matcher 過濾 (排除 api, _next/static, favicon 等)
  │
  ├── NextAuth auth() 執行認證檢查
  │   ├── auth.config.ts 的 authorized callback
  │   └── req.auth?.user 是否存在
  │
  ├── middleware 主函數 (第 114 行)
  │   ├── 提取 pathname
  │   ├── 判斷 isLoggedIn (!!req.auth?.user)
  │   ├── 移除 locale 前綴 (/en/projects → /projects)
  │   ├── 檢查是否為受保護路由
  │   ├── 未登入 + 受保護路由 → 重定向 /zh-TW/login?callbackUrl=...
  │   └── 其他情況 → handleI18nRouting(req) 處理語言路由
  │
  └── Response
```

---

## 3. 路由保護

### 3.1 受保護路由列表

**定義位置**: 同時在 `middleware.ts` 第 132-150 行和 `auth.config.ts` 第 109-129 行

```typescript
const protectedRoutes = [
  // 原有 8 個路由
  '/dashboard',
  '/projects',
  '/budget-pools',
  '/budget-proposals',
  '/vendors',
  '/purchase-orders',
  '/expenses',
  '/users',
  // FIX-095 新增 9 個路由
  '/om-expenses',
  '/om-summary',
  '/charge-outs',
  '/quotes',
  '/notifications',
  '/settings',
  '/data-import',
  '/operating-companies',
  '/om-expense-categories',
];
```

共 **17 個受保護路由前綴**。

### 3.2 路由匹配邏輯

**Locale 前綴移除** (第 120-130 行):
```typescript
const locales = ['en', 'zh-TW'];
let pathnameWithoutLocale = pathname;
for (const locale of locales) {
  if (pathname.startsWith(`/${locale}/`)) {
    pathnameWithoutLocale = pathname.slice(locale.length + 1);
    break;
  } else if (pathname === `/${locale}`) {
    pathnameWithoutLocale = '/';
    break;
  }
}
```

**保護路由匹配** (第 152-154 行):
```typescript
const isProtectedRoute = protectedRoutes.some((route) =>
  pathnameWithoutLocale.startsWith(route),
);
```

使用 `startsWith` 前綴匹配，所以 `/projects/new`、`/projects/abc-123/edit` 等子路由也受保護。

### 3.3 未認證重定向

**條件**: `isProtectedRoute && !isLoggedIn` (第 157 行)

```typescript
const loginUrl = new URL('/zh-TW/login', req.nextUrl.origin);
loginUrl.searchParams.set('callbackUrl', req.nextUrl.href);
return Response.redirect(loginUrl);
```

- 重定向到 `/zh-TW/login`（硬編碼繁體中文 locale）
- 保存原始 URL 為 `callbackUrl` 參數
- 使用 `Response.redirect()` 而非 NextAuth 內建重定向（FIX-095 修復）

### 3.4 雙重保護機制

路由保護在兩處執行，構成雙重防線：

| 位置 | 檔案 | 第幾行 | 行為 |
|------|------|--------|------|
| authorized callback | `auth.config.ts` | 88-141 | 返回 `false` 觸發 NextAuth 重定向 |
| middleware 主函數 | `middleware.ts` | 157-162 | 手動 `Response.redirect()` |

**FIX-095 註解**: 因為 NextAuth v5 的 `authorized` callback 返回 `false` 後可能不會自動重定向，所以 middleware 主函數中增加了手動重定向邏輯作為保險。

---

## 4. 國際化路由

### 4.1 next-intl Middleware

**初始化** (第 77 行):
```typescript
const handleI18nRouting = createMiddleware(routing);
```

**routing 配置** (`apps/web/src/i18n/routing.ts`):
```typescript
export const routing = defineRouting({
  locales: ['en', 'zh-TW'],
  defaultLocale: 'zh-TW',
  localePrefix: 'always',
});
```

- 支援語言: `en` (English), `zh-TW` (繁體中文)
- 預設語言: `zh-TW`
- URL 策略: `always` — 所有語言都顯示前綴（`/en/projects`, `/zh-TW/projects`）
- 根路徑 `/` 自動重定向到 `/zh-TW`

### 4.2 語言偵測與切換

**Request 層** (`apps/web/src/i18n/request.ts`):
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

**導航輔助函數** (`routing.ts`):
- `Link` — 自動添加 locale 前綴的 Link 組件
- `redirect` — 型別安全的重定向
- `usePathname` — 獲取不含 locale 的路徑
- `useRouter` — 型別安全的 Router Hook
- `getPathname` — 獲取含 locale 的完整路徑

---

## 5. Matcher 配置

**檔案**: `middleware.ts` 第 206-219 行

```typescript
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login|register|forgot-password).*)',
  ],
};
```

**排除的路徑** (不執行 middleware):
| 路徑模式 | 說明 |
|----------|------|
| `api` | API 路由 (tRPC, NextAuth, upload) |
| `_next/static` | Next.js 靜態檔案 |
| `_next/image` | Next.js 圖片優化 |
| `favicon.ico` | 網站圖標 |
| `login` | 登入頁面 |
| `register` | 註冊頁面 |
| `forgot-password` | 忘記密碼頁面 |

**匹配的路徑** (會執行 middleware):
- 所有業務頁面 (`/dashboard`, `/projects`, `/budget-pools`, etc.)
- 根路徑 `/`
- 帶 locale 的路徑 (`/en/...`, `/zh-TW/...`)

---

## 6. Edge Runtime 限制

由於 middleware 在 Edge Runtime 執行，有以下限制：

| 限制 | 解決方案 |
|------|----------|
| 不能使用 Prisma | `auth.config.ts` 不包含 Prisma，僅做路由判斷 |
| 不能使用 Node.js API | 使用 Web API (URL, Response, etc.) |
| Provider 為空 | `auth.config.ts` 的 `providers: []`，實際 provider 在 `auth.ts` 中定義 |

**關鍵**: `middleware.ts` 第 68 行只 import `auth.config.ts`，不 import `auth.ts`：
```typescript
import { authConfig } from './auth.config';
const { auth } = NextAuth(authConfig);
```

---

## 7. 自訂頁面路由

**定義** (`auth.config.ts` 第 73-76 行):
```typescript
pages: {
  signIn: '/zh-TW/login',
  error: '/zh-TW/login',
},
```

- 登入頁面: `/zh-TW/login`（硬編碼中文 locale）
- 錯誤頁面: `/zh-TW/login`（複用登入頁面）

---

## 8. 完整請求生命週期示例

### 8.1 未認證用戶訪問 /projects

```
1. GET /projects
2. Matcher: 匹配（不在排除列表中）
3. NextAuth auth() 執行
   - authorized callback: pathname=/projects, isLoggedIn=false
   - protectedRoutes.some('/projects'.startsWith) → true
   - 返回 false
4. middleware 主函數:
   - isLoggedIn = false
   - pathnameWithoutLocale = '/projects'
   - isProtectedRoute = true
   - 重定向到 /zh-TW/login?callbackUrl=http://localhost:3000/projects
```

### 8.2 已認證用戶訪問 /en/projects

```
1. GET /en/projects
2. Matcher: 匹配
3. NextAuth auth() 執行
   - authorized callback: isLoggedIn=true → 返回 true
4. middleware 主函數:
   - isLoggedIn = true
   - isProtectedRoute = true (但已登入)
   - 不重定向
   - handleI18nRouting(req) 處理
   - 載入英文翻譯，渲染 /en/projects 頁面
```

### 8.3 訪問 /api/trpc/project.getAll

```
1. GET /api/trpc/project.getAll
2. Matcher: 不匹配 (api 被排除)
3. Middleware 不執行
4. 直接由 Next.js 路由到 app/api/trpc/[trpc]/route.ts
5. route handler 中 auth() 獲取 session
6. session 傳入 tRPC context
7. protectedProcedure 中間件檢查 session
```

---

## 9. 已知問題與觀察

1. **受保護路由重複定義**: `protectedRoutes` 陣列在 `auth.config.ts` (第 109-129 行) 和 `middleware.ts` (第 132-150 行) 各定義一次，內容相同但不共享，容易不同步。
2. **硬編碼 locale**: 未認證重定向目標 `/zh-TW/login` 硬編碼繁體中文（第 158 行），英文用戶被重定向後看到的是中文登入頁面路由。
3. **Matcher 模式風險**: `login`, `register`, `forgot-password` 在 matcher 排除列表中沒有斜線前綴，可能意外排除包含這些子字串的路徑（如 `/login-history`）。
4. **FIX-095 雙重保護**: `authorized` callback 和 middleware 主函數都做了路由保護，邏輯有冗餘。理論上只需要一處，但因為 NextAuth v5 行為不確定，保留雙重保護作為防禦性程式設計。
