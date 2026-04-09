# 認證系統分析 (Auth System Analysis)

> 基於原始碼驗證，最後更新: 2026-04-09

---

## 1. 架構總覽

認證系統採用 **雙層架構**，分離 Edge Runtime 與 Node.js Runtime 的職責：

| 層級 | 檔案 | 執行環境 | 職責 |
|------|------|----------|------|
| Edge Config | `apps/web/src/auth.config.ts` | Edge Runtime | Middleware 路由保護（無 Prisma） |
| Full Config | `apps/web/src/auth.ts` | Node.js Runtime | 完整認證（含 Prisma、Providers） |
| Package Config | `packages/auth/src/index.ts` | Node.js Runtime | 共用 authOptions（舊版，供 packages/api 引用） |
| API Route | `apps/web/src/app/api/auth/[...nextauth]/route.ts` | Node.js Runtime | NextAuth HTTP Handler |
| Register Route | `apps/web/src/app/api/auth/register/route.ts` | Node.js Runtime | 用戶註冊 API |

### 1.1 關鍵設計決策

- **JWT Session 策略**：不使用 Database Session，所有會話資訊加密於 JWT token（第 148 行, `auth.config.ts`）
- **Edge/Node 分離**：Middleware 使用 `auth.config.ts`（無 Prisma），API Route 使用 `auth.ts`（含 Prisma），避免 Edge Runtime 不支援 Prisma 的問題
- **條件式 Provider 載入**：Azure AD 僅在環境變數齊全時啟用（第 103-128 行, `auth.ts`）

---

## 2. 認證提供者 (Auth Providers)

### 2.1 Azure AD (Microsoft Entra ID) — 企業 SSO

**檔案**: `apps/web/src/auth.ts` 第 101-128 行

```typescript
// 僅在三個環境變數都設置時啟用
...(process.env.AZURE_AD_CLIENT_ID &&
    process.env.AZURE_AD_CLIENT_SECRET &&
    process.env.AZURE_AD_TENANT_ID
  ? [AzureAD({ ... })]
  : []),
```

**配置細節**:
- Provider: `next-auth/providers/azure-ad`（非 azure-ad-b2c，儘管文件中多處提及 B2C）
- OAuth Scope: `openid profile email User.Read`
- Issuer (`packages/auth`): `https://login.microsoftonline.com/${AZURE_AD_TENANT_ID}/v2.0`
- Tenant ID 透過 `tenantId` 參數直接傳入（`auth.ts`）或透過 `issuer` URL（`packages/auth/src/index.ts`）

**Profile 映射** (`auth.ts` 第 117-125 行):
```typescript
profile(profile: any) {
  return {
    id: profile.sub || profile.oid,
    email: profile.email || profile.preferred_username || profile.upn,
    name: profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim(),
    image: profile.picture,
    emailVerified: profile.email_verified ? new Date() : null,
  };
}
```

**所需環境變數**:
- `AZURE_AD_TENANT_ID` — Azure AD Tenant ID (Directory ID)
- `AZURE_AD_CLIENT_ID` — Application (Client) ID
- `AZURE_AD_CLIENT_SECRET` — Client Secret

### 2.2 Credentials Provider — 本地帳號密碼

**檔案**: `apps/web/src/auth.ts` 第 131-191 行

**認證流程**:
1. 從 `credentials` 中提取 `email` 和 `password`
2. 查詢資料庫 `prisma.user.findUnique({ where: { email }, include: { role: true } })`
3. 檢查用戶是否存在
4. 檢查用戶是否有設定密碼（Azure AD 用戶 `password` 為 `null`）
5. 使用 `bcrypt.compare()` 驗證密碼
6. 返回 `{ id, email, name, roleId, role }` 物件

**錯誤訊息**:
- 缺少 email/password: `"請提供 Email 和密碼"`
- 用戶不存在或密碼錯誤: `"Email 或密碼錯誤"`（統一訊息避免洩露資訊）
- 用戶無密碼（SSO 帳號）: `"此帳號未設定密碼，請使用其他登入方式"`

---

## 3. Session 策略

### 3.1 JWT Session

**配置** (`auth.config.ts` 第 147-149 行):
```typescript
session: {
  strategy: 'jwt',
  maxAge: 24 * 60 * 60, // 24 小時
},
```

- **策略**: JWT（無狀態，不需要資料庫 Session 表）
- **有效期**: 24 小時 (86400 秒)
- **Secret**: `process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET`（第 155 行）
- **Trust Host**: `true`（支援 Docker、反向代理、Azure App Service）

### 3.2 JWT Token 自訂欄位

**型別擴展** (`apps/web/src/auth.ts` 第 52-88 行):

```typescript
// Session 物件
interface Session {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: { id: number; name: string; };
  };
}

// JWT Token
interface JWT {
  id: string;
  email: string;
  name: string | null;
  roleId: number;
  role: { id: number; name: string; };
}
```

**注意**: `packages/auth/src/index.ts` 的型別擴展額外包含 `roleId` 在 Session 上（CHANGE-014），但 `apps/web/src/auth.ts` 的 Session 定義中不包含 `roleId`。兩處型別定義存在不一致。

### 3.3 JWT Callback

**檔案**: `apps/web/src/auth.ts` 第 199-243 行

```
登入時 (user 存在):
  token.id = user.id
  token.email = user.email
  token.name = user.name
  token.roleId = user.roleId
  token.role = user.role

Azure AD 登入時 (額外邏輯):
  → prisma.user.upsert() 確保用戶在資料庫中存在
  → 新用戶 roleId 預設為 1 (ProjectManager)
  → password 設為 null
  → token 欄位更新為資料庫值
```

### 3.4 Session Callback

**檔案**: `apps/web/src/auth.ts` 第 247-263 行

```typescript
session.user = {
  id: token.id,
  email: token.email,
  name: token.name,
  role: token.role,
};
```

---

## 4. 用戶同步 / 首次登入流程

### 4.1 Azure AD 首次登入

**觸發條件**: `account?.provider === 'azure-ad' && user` (`auth.ts` 第 218 行)

**流程**:
```
1. Azure AD 登入成功，返回 profile 資訊
2. JWT callback 偵測到 provider === 'azure-ad'
3. 呼叫 prisma.user.upsert()
   - where: { email: user.email }
   - update: { name, image }
   - create: { email, name, image, roleId: 1, password: null }
   - include: { role: true }
4. 將資料庫用戶資訊寫入 JWT token
```

### 4.2 Credentials 首次登入

Credentials Provider 不自動建立用戶。用戶必須先透過 `/api/auth/register` 註冊。

### 4.3 用戶註冊 API

**路由**: `POST /api/auth/register`
**檔案**: `apps/web/src/app/api/auth/register/route.ts`

**Zod Schema** (第 57-67 行):
```typescript
const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().min(1).email(),
  password: z.string().min(8).max(100),
});
```

**流程**:
1. Zod 驗證輸入
2. 檢查 Email 唯一性 (`prisma.user.findUnique`)
3. bcrypt 加密密碼 (10 rounds salt)
4. 建立用戶記錄 (`roleId: 1` — ProjectManager)
5. 返回 `{ success: true, user: { id, name, email } }`

---

## 5. 角色型存取控制 (RBAC)

### 5.1 角色定義

| roleId | 角色名稱 | 說明 |
|--------|----------|------|
| 1 | ProjectManager | 專案經理 (預設角色) |
| 2 | Supervisor | 主管 |
| 3 | Admin | 系統管理員 |

**自動初始化**: `apps/web/src/lib/db-init.ts` 在應用啟動時檢查 Role 表，若為空則自動 seed 三個角色。

### 5.2 API 層權限中間件

**檔案**: `packages/api/src/trpc.ts`

| Procedure | 第幾行 | 允許角色 | 說明 |
|-----------|--------|----------|------|
| `publicProcedure` | 286 | 所有人（含未登入） | 公開 API |
| `protectedProcedure` | 323-333 | 任何已登入用戶 | 檢查 `ctx.session.user` 存在 |
| `supervisorProcedure` | 392-403 | Supervisor, Admin | 檢查 `role.name !== 'Supervisor' && !== 'Admin'` |
| `adminProcedure` | 442-453 | Admin only | 檢查 `role.name !== 'Admin'` |

**權限檢查依據**: `ctx.session.user.role.name` 字串比對（非 roleId 數值比對）

### 5.3 前端權限控制

**usePermissions Hook** (`apps/web/src/hooks/usePermissions.ts`):
- 透過 `api.permission.getMyPermissions.useQuery()` 查詢用戶有效權限
- 提供 `hasPermission(code)`, `hasAnyPermission(codes)`, `hasAllPermissions(codes)`
- 18 個菜單權限代碼（`menu:dashboard`, `menu:projects`, etc.）
- 緩存策略: `staleTime: 5min`, `cacheTime: 30min`

**路由到權限映射** (`ROUTE_PERMISSION_MAP` 第 103-122 行):
```typescript
'/dashboard': 'menu:dashboard',
'/projects': 'menu:projects',
'/budget-pools': 'menu:budget-pools',
// ... 共 17 個路由映射
```

---

## 6. 密碼處理

### 6.1 密碼加密

**演算法**: bcrypt (via `bcryptjs` 純 JavaScript 實現，Azure 兼容)
**Salt Rounds**: 10

**工具函數** (同時存在於 `packages/auth/src/index.ts` 和 `apps/web/src/auth.ts`):

```typescript
// 加密
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// 驗證
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
```

### 6.2 密碼規則

- 最小長度: 8 字元（Register API Zod schema）
- 最大長度: 100 字元
- Azure AD 用戶 `password` 欄位為 `null`

---

## 7. NextAuth API Route

**檔案**: `apps/web/src/app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from '../../../../auth';
export const dynamic = 'force-dynamic';
export const { GET, POST } = handlers;
```

- `dynamic = 'force-dynamic'` 防止 Next.js 在 build time 嘗試評估此路由（需要資料庫連接）
- `handlers` 從 `apps/web/src/auth.ts` 的 `NextAuth(authConfig)` 匯出

**處理的請求**:
- `GET /api/auth/session` — 取得當前 Session
- `GET /api/auth/signin` — 登入頁面（重定向到自訂 `/zh-TW/login`）
- `POST /api/auth/signin/credentials` — Credentials 登入
- `GET /api/auth/callback/azure-ad` — Azure AD OAuth Callback
- `POST /api/auth/signout` — 登出

---

## 8. 安全機制

| 機制 | 狀態 | 說明 |
|------|------|------|
| CSRF 保護 | 內建 | NextAuth 自動處理 CSRF Token |
| XSS 防護 | 內建 | Session Cookie 設置 `httpOnly: true` |
| Session Fixation | 內建 | 登入成功後自動重新生成 Session ID |
| 密碼加密 | bcrypt (10 rounds) | 使用 `bcryptjs` 純 JS 實現 |
| JWT Secret | 環境變數 | `AUTH_SECRET` 或 `NEXTAUTH_SECRET` |
| Trust Host | 啟用 | 允許 Docker/反向代理環境 |
| Debug Mode | 僅開發環境 | `process.env.NODE_ENV === 'development'` |

---

## 9. 檔案依賴關係圖

```
apps/web/src/middleware.ts
  └── imports auth.config.ts (Edge-compatible, 無 Prisma)
        └── defines: pages, session, callbacks.authorized

apps/web/src/auth.ts
  └── imports auth.config.ts (繼承 base config)
  └── adds: Providers (AzureAD, Credentials), jwt/session callbacks
  └── uses: @itpm/db (Prisma)
  └── exports: { handlers, auth, signIn, signOut }

apps/web/src/app/api/auth/[...nextauth]/route.ts
  └── imports handlers from auth.ts
  └── exports: { GET, POST }

apps/web/src/app/api/trpc/[trpc]/route.ts
  └── imports auth from auth.ts
  └── calls auth() to get session
  └── passes session to createInnerTRPCContext()

packages/auth/src/index.ts (舊版配置)
  └── exports: authOptions, hashPassword, verifyPassword
  └── 獨立的 NextAuth 配置（非 v5 風格，使用 any 型別）
```

---

## 10. 已知問題與觀察

1. **雙重配置**: `packages/auth/src/index.ts` 和 `apps/web/src/auth.ts` 都包含完整的 NextAuth 配置，容易導致不同步。實際 API Route 使用 `apps/web/src/auth.ts`。
2. **型別不一致**: `packages/auth` 的 Session 型別包含 `roleId`，而 `apps/web/src/auth.ts` 的 Session 型別不包含 `roleId`。
3. **大量 console.log**: 認證相關檔案包含大量調試日誌（`console.log('...')`），生產環境可能需要清理。
4. **Provider 名稱混淆**: 程式碼中使用 `azure-ad` provider（Microsoft Entra ID），但文件多處提及 `azure-ad-b2c`。
5. **authOptions 型別**: `packages/auth/src/index.ts` 中 `authOptions` 使用 `any` 型別（第 175 行），繞過 TypeScript 檢查。
6. **自訂登入頁面路徑**: `auth.config.ts` 設定 `signIn: '/zh-TW/login'`（硬編碼 locale），可能影響英文用戶體驗。
