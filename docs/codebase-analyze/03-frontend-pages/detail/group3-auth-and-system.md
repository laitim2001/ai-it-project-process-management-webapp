# Group 3: 認證、系統頁面、根佈局與 API 路由分析

> **分析日期**: 2026-04-09
> **分析範圍**: notifications, settings, login, register, forgot-password, 根佈局, locale 佈局, API Routes, middleware
> **檔案總數**: 19 個原始碼檔案 + 1 個 CSS 檔案
> **總行數**: 3,811 行（不含 globals.css 80 行另計）

---

## 目錄

1. [Notifications 通知中心](#1-notifications-通知中心)
2. [Settings 用戶設定](#2-settings-用戶設定)
3. [Login 登入頁面](#3-login-登入頁面)
4. [Register 註冊頁面](#4-register-註冊頁面)
5. [Forgot Password 忘記密碼](#5-forgot-password-忘記密碼)
6. [根佈局與共用頁面](#6-根佈局與共用頁面)
7. [API 路由處理器](#7-api-路由處理器)
8. [Middleware 中介層](#8-middleware-中介層)
9. [統計匯總](#9-統計匯總)

---

## 1. Notifications 通知中心

### 路由結構
```
/[locale]/notifications/
  └── page.tsx        # 通知列表頁
```

### 檔案清單

| 檔案 | 行數 | 用途 |
|------|------|------|
| `page.tsx` | 306 | 通知列表頁面，支援無限捲動、過濾、標記已讀與刪除 |

**總計**: 1 個檔案，306 行

### 頁面類型
- **Client Component** (`'use client'`)

### tRPC 查詢/Mutations 使用

| Procedure | 類型 | 用途 |
|-----------|------|------|
| `notification.getAll` | `useInfiniteQuery` | 無限捲動取得通知列表，支援 `limit`、`isRead` 過濾參數 |
| `notification.markAsRead` | `useMutation` | 標記單一通知為已讀 |
| `notification.markAllAsRead` | `useMutation` | 標記所有通知為已讀 |
| `notification.delete` | `useMutation` | 刪除單一通知 |
| `notification.getUnreadCount` | invalidate | Mutation 成功後使未讀計數快取失效 |

### 匯入的元件

| 元件/模組 | 來源 |
|-----------|------|
| `Link` | `@/i18n/routing` |
| `formatDistanceToNow`, `zhTW` | `date-fns`, `date-fns/locale` |
| `api` | `@/lib/trpc` |
| `BellRing`, `FileText`, `DollarSign`, `Trash2`, `Check` | `lucide-react` |

**注意**: 此頁面未使用 `DashboardLayout` 包裹，而是自行定義 `max-w-4xl` 容器佈局。

### i18n 命名空間

| 命名空間 | 使用的翻譯鍵 |
|----------|-------------|
| `notifications` | `title`, `description`, `filters.*`, `actions.*`, `states.*` |
| `common` | （已宣告 `tCommon` 但在程式碼中未明確使用） |

### 認證/權限
- 需要登入（受 middleware 保護，`/notifications` 在 `protectedRoutes` 列表中）
- 所有已認證用戶皆可查看自己的通知

### 關鍵 UI 功能
- **三狀態過濾器**: all / unread / read，以按鈕切換
- **無限捲動**: 使用 `useInfiniteQuery` + `fetchNextPage`，每頁 20 筆
- **通知圖示分類**: 依據通知類型（PROPOSAL / EXPENSE / 其他）顯示不同 lucide-react 圖示
- **相對時間顯示**: 使用 `date-fns` 的 `formatDistanceToNow` + 繁中 locale
- **快速跳轉**: 點擊通知連結同時觸發標記已讀
- **批量操作**: 「標記全部已讀」按鈕（在有未讀通知時顯示）
- **空狀態**: 依過濾條件顯示不同的空狀態訊息
- **未讀高亮**: 未讀通知以 `ring-2 ring-primary` 環繞標示

---

## 2. Settings 用戶設定

### 路由結構
```
/[locale]/settings/
  ├── page.tsx              # 設定首頁（4 個 Tab）
  └── currencies/
      └── page.tsx          # 貨幣管理子頁面
```

### 檔案清單

| 檔案 | 行數 | 用途 |
|------|------|------|
| `page.tsx` | 403 | 用戶設定主頁面，包含 Profile / Notifications / Preferences / Security 四個 Tab |
| `currencies/page.tsx` | 474 | 貨幣管理頁面，支援 CRUD、啟用/停用切換 |

**總計**: 2 個檔案，877 行

### 2.1 Settings 主頁面 (`page.tsx`)

#### 頁面類型
- **Client Component** (`'use client'`)

#### tRPC 查詢/Mutations 使用
- **無 tRPC 呼叫** — 目前 save 功能均為 TODO 狀態，僅以 `toast` 提示模擬成功

#### 匯入的元件

| 元件/模組 | 來源 |
|-----------|------|
| `DashboardLayout` | `@/components/layout/dashboard-layout` |
| `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbSeparator`, `BreadcrumbPage` | `@/components/ui/breadcrumb` |
| `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle` | `@/components/ui/card` |
| `Button` | `@/components/ui/button` |
| `Input` | `@/components/ui/input` |
| `Label` | `@/components/ui/label` |
| `Switch` | `@/components/ui/switch` |
| `NativeSelect` | `@/components/ui/select` |
| `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger` | `@/components/ui/tabs` |
| `useToast` | `@/components/ui/use-toast` |
| `AuthMethodsCard` | `@/components/settings/AuthMethodsCard` |
| `useSession` | `next-auth/react` |
| `Settings`, `User`, `Bell`, `Eye`, `Shield`, `Save` | `lucide-react` |
| `Link` | `@/i18n/routing` |

#### i18n 命名空間

| 命名空間 | 使用的翻譯鍵 |
|----------|-------------|
| `settings` | `title`, `description`, `tabs.*`, `profile.*`, `notificationSettings.*`, `preferences.*`, `security.*`, `toast.*` |
| `navigation` | `dashboard`, `menu.settings` |
| `common` | `actions.save` |

#### 關鍵 UI 功能
- **四個 Tabs**:
  - **Profile**: 姓名（可編輯）、Email（唯讀）、角色（唯讀）
  - **Notifications**: 4 個 Switch 開關（Email、提案、費用、專案更新通知）
  - **Preferences**: 語言下拉（zh-TW/en）、時區下拉、日期格式下拉
  - **Security**: `AuthMethodsCard` 元件（CHANGE-041 雙認證支援）、2FA（未來功能，disabled）、活動記錄（未來功能，disabled）
- **Session 整合**: 從 `useSession()` 取得用戶姓名、Email、角色
- **TODO 標記**: `handleSaveProfile`, `handleSaveNotifications`, `handleSavePreferences` 均為模擬操作

### 2.2 Currencies 貨幣管理 (`currencies/page.tsx`)

#### 頁面類型
- **Client Component** (`'use client'`)

#### tRPC 查詢/Mutations 使用

| Procedure | 類型 | 用途 |
|-----------|------|------|
| `currency.getAll` | `useQuery` | 取得貨幣列表，支援 `includeInactive` 參數 |
| `currency.create` | `useMutation` | 建立新貨幣 |
| `currency.update` | `useMutation` | 更新貨幣資訊 |
| `currency.toggleActive` | `useMutation` | 切換貨幣啟用/停用狀態 |

#### 匯入的元件

| 元件/模組 | 來源 |
|-----------|------|
| `DashboardLayout` | `@/components/layout/dashboard-layout` |
| `Breadcrumb` 系列 | `@/components/ui/breadcrumb` |
| `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle` | `@/components/ui/card` |
| `Button`, `Input`, `Label` | `@/components/ui/button`, `input`, `label` |
| `Skeleton` | `@/components/ui/skeleton` |
| `Alert`, `AlertDescription` | `@/components/ui/alert` |
| `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` | `@/components/ui/table` |
| `Dialog`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogTitle` | `@/components/ui/dialog` |
| `Badge` | `@/components/ui/badge` |
| `useToast` | `@/components/ui/use-toast` |
| `Plus`, `Pencil`, `Power`, `AlertCircle`, `CheckCircle2`, `Home` | `lucide-react` |
| `Link` | `@/i18n/routing` |
| `api` | `@/lib/trpc` |

#### i18n 命名空間

| 命名空間 | 使用的翻譯鍵 |
|----------|-------------|
| `currencies` | `title`, `description`, `actions.*`, `filters.*`, `list.*`, `fields.*`, `status.*`, `messages.*`, `form.*` |
| `common` | `actions.title`, `actions.cancel`, `actions.save`, `saving` |
| `navigation` | `menu.settings` |

#### 認證/權限
- 需要登入（middleware 保護 `/settings`）
- JSDoc 標示僅限 Admin 角色，但程式碼中未實現前端角色檢查

#### 關鍵 UI 功能
- **貨幣列表表格**: 顯示代碼、名稱、符號、匯率、狀態（Badge）、專案使用數量
- **新增貨幣 Dialog**: 代碼（ISO 4217，最多 3 字元自動大寫）、名稱、符號、匯率
- **編輯貨幣 Dialog**: 與新增相同欄位，預載現有資料
- **啟用/停用切換**: 透過 `toggleActive` mutation 實現軟刪除
- **過濾器**: 勾選框控制是否顯示已停用的貨幣
- **載入骨架**: 5 個 `Skeleton` 元件
- **錯誤狀態**: `Alert` 顯示載入錯誤
- **空狀態**: 文字提示

---

## 3. Login 登入頁面

### 路由結構
```
/[locale]/login/
  └── page.tsx        # 登入頁面
```

### 檔案清單

| 檔案 | 行數 | 用途 |
|------|------|------|
| `page.tsx` | 269 | 雙認證登入頁面（Azure AD SSO + Email/Password） |

**總計**: 1 個檔案，269 行

### 頁面類型
- **Client Component** (`'use client'`)

### tRPC 查詢/Mutations 使用
- **無 tRPC 呼叫** — 直接使用 NextAuth.js `signIn()` 函數

### 匯入的元件

| 元件/模組 | 來源 |
|-----------|------|
| `signIn` | `next-auth/react` |
| `useRouter` | `@/i18n/routing` |
| `useSearchParams` | `next/navigation` |
| `Button` | `@/components/ui/button` |
| `Input` | `@/components/ui/input` |
| `Label` | `@/components/ui/label` |
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` | `@/components/ui/card` |

### i18n 命名空間

| 命名空間 | 使用的翻譯鍵 |
|----------|-------------|
| `auth.login` | `title`, `description`, `azureLogin`, `orDivider`, `email.*`, `password.*`, `errors.*`, `loggingIn`, `loginButton` |

### 認證/權限
- **公開頁面**: 所有用戶可訪問
- 已登入用戶不會被重定向（需手動訪問）

### 關鍵 UI 功能
- **居中 Card 佈局**: `min-h-screen` 全螢幕居中顯示
- **Azure AD SSO 按鈕**: 帶有 Microsoft 四格圖示的 outline 按鈕，呼叫 `signIn('azure-ad', { callbackUrl })`
- **分隔線**: "或" 分隔線（`orDivider`）
- **Email/Password 表單**:
  - Email 輸入框（`type="email"`, `autoComplete="email"`）
  - Password 輸入框（`type="password"`, `autoComplete="current-password"`）
  - 提交按鈕（載入狀態切換文字）
- **客戶端驗證**:
  - 空值檢查
  - Email 格式正則驗證
  - 密碼長度 >= 6 字元
- **錯誤處理**: 根據 NextAuth 錯誤類型提供不同的中文錯誤訊息（`Configuration`, `AccessDenied`, `Verification`, `CredentialsSignin`）
- **登入成功流程**: 使用 `router.push(callbackUrl)` 重定向（忽略 `result.url`）
- **CHANGE-033**: 簡化登入頁面，已移除忘記密碼和註冊連結

---

## 4. Register 註冊頁面

### 路由結構
```
/[locale]/register/
  └── page.tsx        # 註冊頁面
```

### 檔案清單

| 檔案 | 行數 | 用途 |
|------|------|------|
| `page.tsx` | 266 | 用戶自助註冊頁面，呼叫 `/api/auth/register` API |

**總計**: 1 個檔案，266 行

### 頁面類型
- **Client Component** (`'use client'`)

### tRPC 查詢/Mutations 使用
- **無 tRPC 呼叫** — 直接使用 `fetch('/api/auth/register', ...)` REST API

### 匯入的元件

| 元件/模組 | 來源 |
|-----------|------|
| `Link` | `@/i18n/routing` |
| `Button` | `@/components/ui/button` |
| `Input` | `@/components/ui/input` |
| `Label` | `@/components/ui/label` |
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | `@/components/ui/card` |

### i18n 命名空間

| 命名空間 | 使用的翻譯鍵 |
|----------|-------------|
| `auth.register` | `title`, `description`, `name.*`, `email.*`, `password.*`, `confirmPassword.*`, `errors.*`, `registering`, `registerButton`, `successTitle`, `successDescription`, `successMessage`, `goToLogin`, `hasAccount`, `loginNow`, `termsAgreement` |

### 認證/權限
- **公開頁面**: 所有用戶可訪問

### 關鍵 UI 功能
- **居中 Card 佈局**: 與 Login 頁面一致的全螢幕居中風格
- **註冊表單**: 4 個欄位（姓名、Email、密碼、確認密碼）
- **客戶端驗證**:
  - 密碼與確認密碼匹配檢查
  - 密碼長度 >= 8 字元
- **成功狀態頁面**: 註冊成功後切換為成功提示 Card，顯示 `goToLogin` 按鈕
- **API 整合**: 呼叫 `POST /api/auth/register`，處理 JSON 回應
- **底部連結**: 「已有帳號？立即登入」連結到 `/login`
- **使用條款提示**: `termsAgreement` 翻譯鍵

---

## 5. Forgot Password 忘記密碼

### 路由結構
```
/[locale]/forgot-password/
  └── page.tsx        # 忘記密碼頁面
```

### 檔案清單

| 檔案 | 行數 | 用途 |
|------|------|------|
| `page.tsx` | 194 | 密碼重設郵件請求頁面（目前為模擬 API） |

**總計**: 1 個檔案，194 行

### 頁面類型
- **Client Component** (`'use client'`)

### tRPC 查詢/Mutations 使用
- **無 tRPC 呼叫** — 目前使用 `setTimeout` 模擬 API（TODO 標記）

### 匯入的元件

| 元件/模組 | 來源 |
|-----------|------|
| `Link` | `@/i18n/routing` |
| `Button` | `@/components/ui/button` |
| `Input` | `@/components/ui/input` |
| `Label` | `@/components/ui/label` |
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` | `@/components/ui/card` |

### i18n 命名空間

| 命名空間 | 使用的翻譯鍵 |
|----------|-------------|
| `auth.forgotPassword` | `title`, `description`, `email.*`, `errors.*`, `sending`, `sendButton`, `successTitle`, `successDescription`, `successMessage`, `checkSpam`, `backToLogin`, `rememberedPassword`, `noAccount`, `registerNow` |

### 認證/權限
- **公開頁面**: 所有用戶可訪問

### 關鍵 UI 功能
- **居中 Card 佈局**: 與 Login/Register 一致的全螢幕居中風格
- **Email 輸入表單**: 單一 Email 欄位 + 提示文字
- **模擬 API**: `await new Promise(resolve => setTimeout(resolve, 1000))` — 尚未實作真正的密碼重設
- **成功狀態頁面**: 顯示 Email 地址 + 檢查垃圾郵件提示 + 返回登入按鈕
- **底部連結**: 「記起密碼？」連結到 `/login`、「沒有帳號？」連結到 `/register`
- **TODO**: 整合 Azure AD B2C 密碼重設流程、實作 SendGrid 郵件發送

---

## 6. 根佈局與共用頁面

### 6.1 Root Layout (`apps/web/src/app/layout.tsx`)

| 檔案 | 行數 | 用途 |
|------|------|------|
| `layout.tsx` | 59 | 應用程式根 Layout，提供 HTML 結構與 Google Inter 字體 |

#### 頁面類型
- **Server Component**（預設）

#### 功能說明
- 渲染 `<html>` 和 `<body>` 標籤
- 載入 Google Inter 字體（`next/font/google`）
- 引入 `globals.css`（Tailwind CSS + 主題變數）
- 設定全域 Metadata：`title: 'IT Project Management Platform'`
- **FIX-096**: 為避免 Hydration 錯誤，`<html>` 和 `<body>` 都加了 `suppressHydrationWarning`

#### 匯入的模組

| 模組 | 來源 |
|------|------|
| `Metadata` | `next` |
| `Inter` | `next/font/google` |
| `globals.css` | `./globals.css` |

### 6.2 Root Page (`apps/web/src/app/page.tsx`)

| 檔案 | 行數 | 用途 |
|------|------|------|
| `page.tsx` | 59 | 根路徑 `/` 的語言重定向頁面 |

#### 頁面類型
- **Server Component**（使用 `redirect()`）

#### 功能說明
- 訪問 `/` 時執行 `redirect('/zh-TW')` 永久重定向（308）
- 預設語言為繁體中文
- 不渲染任何 UI

### 6.3 Locale Layout (`apps/web/src/app/[locale]/layout.tsx`)

| 檔案 | 行數 | 用途 |
|------|------|------|
| `layout.tsx` | 122 | 國際化應用 Providers Layout，初始化所有應用層級 Provider |

#### 頁面類型
- **Server Component**（`async function`）

#### Provider 鏈結構（由外到內）
```
<Fragment>
  ├── <Script>                          # 動態設定 <html lang="...">
  ├── <Suspense fallback={null}>
  │   └── <GlobalProgress />            # FEAT-012: 頂部導航進度條
  └── <SessionProvider>                 # NextAuth Session
      └── <NextIntlClientProvider>      # next-intl 國際化
          └── <TRPCProvider>            # tRPC + React Query
              ├── {children}            # 實際頁面內容
              └── <Toaster />           # shadcn/ui Toast 通知
```

#### 功能說明
- **語言驗證**: 檢查 `locale` 是否在 `routing.locales` 中，否則回傳 `notFound()`
- **訊息載入**: `getMessages({ locale })` 取得翻譯訊息
- **FIX-096**: 不渲染 `<html>`/`<body>`（由 Root Layout 負責），改用 `<Script>` 動態設定 `lang` 屬性
- **FIX-060**: 明確傳遞 `locale` 參數給 `getMessages()`
- **靜態參數生成**: `generateStaticParams()` 為所有 locale 生成靜態路由

#### 匯入的模組

| 模組 | 來源 |
|------|------|
| `Suspense` | `react` |
| `Script` | `next/script` |
| `TRPCProvider` | `@/lib/trpc-provider` |
| `Toaster` | `@/components/ui/toaster` |
| `GlobalProgress` | `@/components/ui/loading` |
| `SessionProvider` | `@/components/providers/SessionProvider` |
| `NextIntlClientProvider` | `next-intl` |
| `getMessages` | `next-intl/server` |
| `notFound` | `next/navigation` |
| `routing` | `@/i18n/routing` |

### 6.4 Locale Root Page (`apps/web/src/app/[locale]/page.tsx`)

| 檔案 | 行數 | 用途 |
|------|------|------|
| `page.tsx` | 99 | Locale 首頁，根據登入狀態重定向 |

#### 頁面類型
- **Client Component** (`'use client'`)

#### 功能說明
- 使用 `useSession()` 檢查登入狀態
- **已登入**: `router.push('/dashboard')`
- **未登入**: `router.push('/login')`
- **載入中**: 顯示旋轉動畫 + 「載入中...」文字

#### 匯入的模組

| 模組 | 來源 |
|------|------|
| `useSession` | `next-auth/react` |
| `useRouter` | `@/i18n/routing` |
| `useEffect` | `react` |

### 6.5 Globals CSS (`apps/web/src/app/globals.css`)

| 檔案 | 行數 | 用途 |
|------|------|------|
| `globals.css` | 80 | Tailwind CSS 指令 + 主題色彩變數定義 |

#### 功能說明
- **Tailwind 指令**: `@tailwind base/components/utilities`
- **Light 主題**: 18 個 CSS 自訂屬性（HSL 色彩）
- **Dark 主題**: `.dark` 選擇器下相同 18 個 CSS 自訂屬性
- **全域樣式**: `border-border` 預設邊框顏色、`bg-background text-foreground` body 樣式
- 定義 `--radius: 0.5rem` 全域圓角變數

---

## 7. API 路由處理器

### 7.1 API 路由總覽

```
apps/web/src/app/api/
├── admin/
│   └── seed/
│       └── route.ts          # 管理員種子資料 API（GET + POST）
├── auth/
│   ├── [...nextauth]/
│   │   └── route.ts          # NextAuth.js 認證端點（GET + POST）
│   └── register/
│       └── route.ts          # 用戶註冊 API（POST）
├── trpc/
│   └── [trpc]/
│       └── route.ts          # tRPC HTTP Handler（GET + POST）
└── upload/
    ├── invoice/
    │   └── route.ts          # 發票上傳（POST）
    ├── proposal/
    │   └── route.ts          # 提案文件上傳（POST）
    └── quote/
        └── route.ts          # 報價單上傳（POST）
```

**總計**: 7 個 API 路由檔案

### 7.2 各 API 路由詳情

#### 7.2.1 NextAuth Handler (`api/auth/[...nextauth]/route.ts`)

| 項目 | 說明 |
|------|------|
| **行數** | 73 |
| **HTTP 方法** | GET, POST |
| **路由** | `/api/auth/*` |
| **功能** | NextAuth.js v5 統一認證端點，處理登入、登出、Session 查詢、OAuth Callback |
| **設定** | `export const dynamic = 'force-dynamic'` |
| **核心邏輯** | 匯出 `handlers` 從 `../../../../auth` (即 `apps/web/src/auth.ts`) |
| **安全特性** | CSRF 保護、JWT 簽章、HTTP-Only Cookies |

#### 7.2.2 Register API (`api/auth/register/route.ts`)

| 項目 | 說明 |
|------|------|
| **行數** | 241 |
| **HTTP 方法** | POST |
| **路由** | `/api/auth/register` |
| **功能** | 用戶自助註冊（Email/Password） |
| **輸入驗證** | Zod schema：`name`（必填）、`email`（格式驗證）、`password`（8-100 字元） |
| **密碼加密** | bcryptjs，10 輪 salt |
| **預設角色** | `roleId = 1`（ProjectManager） |
| **重複檢查** | Prisma `findUnique` + Unique constraint 防禦性檢查 |
| **依賴** | `@itpm/db`（Prisma）、`bcryptjs`、`zod` |
| **回應格式** | 成功: `201 { success, message, user: { id, name, email } }`；錯誤: `400/500 { success, error }` |

#### 7.2.3 tRPC Handler (`api/trpc/[trpc]/route.ts`)

| 項目 | 說明 |
|------|------|
| **行數** | 120 |
| **HTTP 方法** | GET, POST |
| **路由** | `/api/trpc/*` |
| **功能** | tRPC v10 統一 API 端點，轉發所有業務 API 請求 |
| **Session 注入** | 使用 `auth()` 取得 NextAuth Session，注入 tRPC Context |
| **錯誤處理** | 開發環境: console.error 輸出路徑和錯誤訊息；生產環境: 靜默 |
| **依賴** | `@trpc/server/adapters/fetch`、`@itpm/api`（`appRouter`, `createInnerTRPCContext`）、`@/auth` |

#### 7.2.4 Invoice Upload (`api/upload/invoice/route.ts`)

| 項目 | 說明 |
|------|------|
| **行數** | 170 |
| **HTTP 方法** | POST |
| **路由** | `/api/upload/invoice` |
| **功能** | 費用發票檔案上傳至 Azure Blob Storage |
| **支援格式** | PDF, Word (.doc/.docx), Excel (.xls/.xlsx), 圖片 (JPEG/PNG) |
| **檔案限制** | 最大 10MB |
| **必填參數** | `file`（File）, `purchaseOrderId`（string） |
| **命名規則** | `invoice_{purchaseOrderId}_{timestamp}.{ext}` |
| **儲存** | Azure Blob Storage（`BLOB_CONTAINERS.INVOICES`） |
| **依賴** | `@/lib/azure-storage`（`uploadToBlob`, `BLOB_CONTAINERS`） |

#### 7.2.5 Quote Upload (`api/upload/quote/route.ts`)

| 項目 | 說明 |
|------|------|
| **行數** | 243 |
| **HTTP 方法** | POST |
| **路由** | `/api/upload/quote` |
| **功能** | 供應商報價單上傳 + 自動建立 Quote 資料庫記錄 |
| **支援格式** | PDF, Word (.doc/.docx), Excel (.xls/.xlsx) |
| **檔案限制** | 最大 10MB |
| **必填參數** | `file`, `projectId`, `vendorId`, `amount` |
| **業務驗證** | 專案必須存在且有已批准提案、供應商必須存在 |
| **命名規則** | `quote_{projectId}_{vendorId}_{timestamp}.{ext}` |
| **特殊功能** | 上傳成功後自動建立 `Quote` 記錄（含 vendor、project include） |
| **依賴** | `@/lib/azure-storage`、`@itpm/db`（Prisma） |

#### 7.2.6 Proposal Upload (`api/upload/proposal/route.ts`)

| 項目 | 說明 |
|------|------|
| **行數** | 174 |
| **HTTP 方法** | POST |
| **路由** | `/api/upload/proposal` |
| **功能** | 預算提案計劃書上傳至 Azure Blob Storage |
| **支援格式** | PDF, PowerPoint (.ppt/.pptx), Word (.doc/.docx) |
| **檔案限制** | 最大 20MB（比其他上傳大，因計劃書可能含圖表） |
| **必填參數** | `file`, `proposalId` |
| **命名規則** | `proposal_{proposalId}_{timestamp}.{ext}` |
| **特殊功能** | 使用 `TYPE_TO_EXTENSION` 映射表確保副檔名正確 |
| **依賴** | `@/lib/azure-storage` |

#### 7.2.7 Admin Seed (`api/admin/seed/route.ts`)

| 項目 | 說明 |
|------|------|
| **行數** | 240 |
| **HTTP 方法** | GET, POST |
| **路由** | `/api/admin/seed` |
| **功能** | 管理員種子資料 API，初始化 Role 和 Currency 基礎資料 |
| **GET 功能** | 檢查目前 seed 狀態（Role 數量、Currency 數量、是否需要 seed） |
| **POST 功能** | 執行 upsert 建立/更新 3 個 Role + 6 個 Currency |
| **安全驗證** | Bearer token 驗證（`ADMIN_SEED_SECRET` 或 `NEXTAUTH_SECRET`） |
| **預設資料** | Roles: ProjectManager(1), Supervisor(2), Admin(3)；Currencies: TWD, USD, CNY, HKD, JPY, EUR |
| **依賴** | `@itpm/db`（Prisma） |

### 7.3 API 路由統計

| API 路由 | 行數 | HTTP 方法 | 用途類別 |
|----------|------|-----------|----------|
| `auth/[...nextauth]/route.ts` | 73 | GET, POST | 認證 |
| `auth/register/route.ts` | 241 | POST | 認證 |
| `trpc/[trpc]/route.ts` | 120 | GET, POST | API 閘道 |
| `upload/invoice/route.ts` | 170 | POST | 檔案上傳 |
| `upload/quote/route.ts` | 243 | POST | 檔案上傳 + DB |
| `upload/proposal/route.ts` | 174 | POST | 檔案上傳 |
| `admin/seed/route.ts` | 240 | GET, POST | 管理維護 |
| **合計** | **1,261** | | |

---

## 8. Middleware 中介層

### 檔案資訊

| 檔案 | 行數 | 用途 |
|------|------|------|
| `apps/web/src/middleware.ts` | 220 | 認證保護 + 國際化路由處理 |

### 執行環境
- **Edge Runtime**（不可使用 Prisma，僅匯入 `auth.config.ts`）

### 核心邏輯

#### 1. NextAuth 認證初始化
```typescript
const { auth } = NextAuth(authConfig);  // Edge-compatible 配置
```

#### 2. next-intl 國際化路由
```typescript
const handleI18nRouting = createMiddleware(routing);
```

#### 3. Middleware 執行流程
```
Request
  → NextAuth auth() 取得 Session
  → 移除 locale 前綴（/en/... 或 /zh-TW/...）
  → 判斷是否為受保護路由
  → 未登入 + 受保護路由 → 重定向到 /zh-TW/login?callbackUrl=...
  → 其他 → handleI18nRouting() 處理語言路由
```

### 受保護路由清單（17 個）
```
/dashboard, /projects, /budget-pools, /budget-proposals,
/vendors, /purchase-orders, /expenses, /users,
/om-expenses, /om-summary, /charge-outs, /quotes,
/notifications, /settings, /data-import,
/operating-companies, /om-expense-categories
```

### Matcher 配置
排除以下路徑不執行 middleware：
- `api`（API 路由）
- `_next/static`（靜態檔案）
- `_next/image`（圖片優化）
- `favicon.ico`
- `login`, `register`, `forgot-password`（認證頁面）

### 相關修復
- **FIX-095**: 手動處理未登入用戶的重定向（NextAuth v5 authorized callback 返回 false 後不自動重定向）
- 保存原始請求 URL 為 `callbackUrl` 參數，登入後可返回

### 匯入的模組

| 模組 | 來源 |
|------|------|
| `NextAuth` | `next-auth` |
| `authConfig` | `./auth.config` |
| `createMiddleware` | `next-intl/middleware` |
| `routing` | `./i18n/routing` |

---

## 9. 統計匯總

### 9.1 頁面路由模組統計

| 路由模組 | 檔案數 | 總行數 | 頁面類型 | 是否使用 DashboardLayout |
|----------|--------|--------|----------|--------------------------|
| Notifications | 1 | 306 | Client | 否（自訂容器） |
| Settings | 2 | 877 | Client | 是 |
| Login | 1 | 269 | Client | 否（全螢幕居中） |
| Register | 1 | 266 | Client | 否（全螢幕居中） |
| Forgot Password | 1 | 194 | Client | 否（全螢幕居中） |
| **小計** | **6** | **1,912** | | |

### 9.2 根佈局與共用頁面統計

| 檔案 | 行數 | 類型 |
|------|------|------|
| `app/layout.tsx` | 59 | Server |
| `app/page.tsx` | 59 | Server |
| `app/[locale]/layout.tsx` | 122 | Server |
| `app/[locale]/page.tsx` | 99 | Client |
| `app/globals.css` | 80 | CSS |
| **小計** | **419** | |

### 9.3 API 路由統計

| 分類 | 檔案數 | 總行數 |
|------|--------|--------|
| 認證（NextAuth + Register） | 2 | 314 |
| API 閘道（tRPC） | 1 | 120 |
| 檔案上傳（Invoice/Quote/Proposal） | 3 | 587 |
| 管理維護（Admin Seed） | 1 | 240 |
| **小計** | **7** | **1,261** |

### 9.4 Middleware 統計

| 檔案 | 行數 |
|------|------|
| `middleware.ts` | 220 |

### 9.5 總計

| 分類 | 檔案數 | 行數 |
|------|--------|------|
| 頁面路由模組 | 6 | 1,912 |
| 根佈局與共用頁面 | 4 (+1 CSS) | 419 |
| API 路由 | 7 | 1,261 |
| Middleware | 1 | 220 |
| **總計** | **19** (+1 CSS) | **3,812** |

### 9.6 tRPC 使用統計

| 路由模組 | 使用的 tRPC Router | Procedure 數量 |
|----------|-------------------|----------------|
| Notifications | `notification` | 4 (getAll, markAsRead, markAllAsRead, delete) + 1 invalidate |
| Settings/Currencies | `currency` | 4 (getAll, create, update, toggleActive) |
| Settings 主頁 | 無 | 0（TODO 狀態） |
| Login | 無（使用 NextAuth） | 0 |
| Register | 無（使用 REST API） | 0 |
| Forgot Password | 無（模擬 API） | 0 |

### 9.7 i18n 命名空間使用統計

| 命名空間 | 使用模組 |
|----------|----------|
| `notifications` | Notifications |
| `settings` | Settings 主頁 |
| `currencies` | Settings/Currencies |
| `auth.login` | Login |
| `auth.register` | Register |
| `auth.forgotPassword` | Forgot Password |
| `navigation` | Settings 主頁、Settings/Currencies |
| `common` | Notifications、Settings 主頁、Settings/Currencies |

### 9.8 認證頁面 vs 系統頁面對照

| 頁面 | 認證要求 | 佈局風格 | 實作狀態 |
|------|----------|----------|----------|
| Login | 公開 | 全螢幕居中 Card | 完整（Azure AD + Credentials） |
| Register | 公開 | 全螢幕居中 Card | 完整（REST API 串接） |
| Forgot Password | 公開 | 全螢幕居中 Card | 模擬 API（TODO） |
| Notifications | 需登入 | 自訂 max-w-4xl 容器 | 完整（Infinite Query） |
| Settings | 需登入 | DashboardLayout | 部分完成（Save 為 TODO） |
| Settings/Currencies | 需登入 | DashboardLayout | 完整（CRUD） |

### 9.9 檔案上傳 API 對照

| API | 最大檔案 | 支援格式 | 自動建立 DB 記錄 | Azure Blob Container |
|-----|----------|----------|------------------|---------------------|
| Invoice | 10MB | PDF, Word, Excel, JPEG, PNG | 否 | `invoices` |
| Quote | 10MB | PDF, Word, Excel | 是（Quote 記錄） | `quotes` |
| Proposal | 20MB | PDF, PPT, Word | 否 | `proposals` |
