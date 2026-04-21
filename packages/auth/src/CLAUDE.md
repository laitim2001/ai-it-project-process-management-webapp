# Auth Package - 身份驗證與授權層

> **Last Updated**: 2026-04-21
> **技術基礎**: NextAuth.js 5.0.0-beta.30 + Azure AD (Entra ID)
> **深度分析參考**:
> - `docs/codebase-analyze/06-auth-and-config/auth-system.md` — 雙認證（Azure AD + Credentials）、JWT、RBAC 完整規格
> - `docs/codebase-analyze/06-auth-and-config/middleware.md` — 認證 + i18n 路由保護（17 個保護路徑）
> - `docs/codebase-analyze/10-issues-and-debt/security-review.md` — 安全審查（3 個 Critical 安全問題已於 FIX-101/102/103 修復）

## 📋 目錄用途
此目錄包含 NextAuth.js 配置和 **Azure AD (Entra ID)** 整合，提供統一的身份驗證和授權服務。

## 🏗️ 核心檔案

```
src/
├── index.ts          # NextAuth 主配置和導出
└── auth.config.ts    # 認證提供者配置（Azure AD B2C）
```

## 🎯 認證架構

### 雙重認證機制
1. **Azure AD B2C SSO**（生產環境）
   - 企業單一登入
   - OAuth 2.0 / OpenID Connect
   - 自動同步用戶資料

2. **本地密碼認證**（開發/備援）
   - Email + Password
   - bcrypt 加密
   - 用於開發測試

## 🔑 核心模式與約定

### 1. NextAuth 配置結構
```typescript
// index.ts
import NextAuth from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@itpm/db';
import authConfig from './auth.config';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 小時
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    // Session Callback: 添加用戶資訊到 session
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.roleId = token.roleId;
      }
      return session;
    },

    // JWT Callback: 添加資料到 token
    async jwt({ token, user }) {
      if (user) {
        token.roleId = user.roleId;
      }
      return token;
    },
  },
  ...authConfig,
});
```

### 2. Azure AD B2C Provider 配置
```typescript
// auth.config.ts
import AzureADB2CProvider from 'next-auth/providers/azure-ad-b2c';

export default {
  providers: [
    AzureADB2CProvider({
      clientId: process.env.AZURE_AD_B2C_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_B2C_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_B2C_TENANT_ID!,
      primaryUserFlow: process.env.AZURE_AD_B2C_PRIMARY_USER_FLOW!,
      authorization: {
        params: {
          scope: 'openid profile email offline_access',
        },
      },
    }),
    // 本地密碼認證（開發用）
    CredentialsProvider({
      async authorize(credentials) {
        // 驗證 email + password
        // 查詢資料庫 + bcrypt 比對
      },
    }),
  ],
};
```

### 3. Session 資料結構
```typescript
// TypeScript 類型擴展
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      image?: string;
      roleId: number;  // 自定義欄位
    };
  }

  interface User {
    roleId: number;
  }
}
```

## 🛡️ RBAC 權限控制

### 角色定義
```typescript
// Prisma Schema
model Role {
  id   Int    @id
  name String @unique
}

// 角色 ID 約定
// 1 = ProjectManager（專案經理）
// 2 = Supervisor（主管）
// 3 = Admin（系統管理員）
```

### 權限檢查模式

#### API 層（tRPC）
```typescript
// packages/api/src/trpc.ts
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({ ctx: { session: ctx.session } });
});

export const supervisorProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const roleId = ctx.session.user.roleId;
  if (roleId !== 2 && roleId !== 3) { // Supervisor 或 Admin
    throw new TRPCError({ code: 'FORBIDDEN' });
  }
  return next();
});
```

#### 前端頁面層
```typescript
// apps/web/src/app/[locale]/layout.tsx
import { auth } from '@itpm/auth';

export default async function Layout({ children }) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // 根據角色顯示不同內容
  const isSupervisor = session.user.roleId >= 2;

  return <DashboardLayout session={session}>{children}</DashboardLayout>;
}
```

#### Client Component
```typescript
'use client';
import { useSession } from 'next-auth/react';

export function MyComponent() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <LoadingSkeleton />;
  if (status === 'unauthenticated') redirect('/login');

  const canEdit = session.user.roleId >= 2;

  return <div>{canEdit && <EditButton />}</div>;
}
```

## 🔄 認證流程

### 1. Azure AD B2C 登入流程
```
1. 用戶點擊登入按鈕
2. 重定向到 Azure AD B2C 登入頁
3. 用戶輸入企業帳號密碼
4. Azure AD B2C 驗證成功，返回 Authorization Code
5. NextAuth 用 Code 交換 Access Token
6. NextAuth 查詢用戶資料，創建 Session
7. 重定向回應用（帶 Session Cookie）
```

### 2. 本地密碼登入流程
```
1. 用戶在登入頁輸入 email + password
2. NextAuth 調用 CredentialsProvider.authorize()
3. 查詢資料庫中的 User（email）
4. bcrypt.compare(password, user.password)
5. 驗證成功，創建 Session
6. 重定向到 Dashboard
```

### 3. Session 驗證流程
```
每次請求 → Middleware 檢查 Session Cookie
         → 有效：允許訪問
         → 無效/過期：重定向到 /login
```

## 📝 常見操作

### 登入
```typescript
// Server Action
import { signIn } from '@itpm/auth';

await signIn('azure-ad-b2c', { redirectTo: '/dashboard' });

// 或本地密碼
await signIn('credentials', {
  email: 'user@example.com',
  password: 'password123',
  redirectTo: '/dashboard',
});
```

### 登出
```typescript
import { signOut } from '@itpm/auth';

await signOut({ redirectTo: '/login' });
```

### 取得 Session（Server Component）
```typescript
import { auth } from '@itpm/auth';

const session = await auth();
console.log(session?.user.id);
```

### 取得 Session（Client Component）
```typescript
'use client';
import { useSession } from 'next-auth/react';

const { data: session } = useSession();
console.log(session?.user.id);
```

## ⚠️ 重要約定

1. **Session 策略統一使用 JWT**（不使用 Database Session）
2. **Session 過期時間：24 小時**
3. **密碼必須使用 bcrypt 加密**（Salt rounds: 10）
4. **Azure AD B2C 用戶的 password 欄位為 null**
5. **所有受保護路由必須檢查 Session**
6. **角色權限在 API 層和前端層雙重檢查**
7. **不要在 Client Component 中暴露敏感資訊**

## 🔒 安全最佳實踐

### 環境變數
```bash
# 必須設置
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

# Azure AD B2C
AZURE_AD_B2C_TENANT_ID=<tenant-id>
AZURE_AD_B2C_CLIENT_ID=<client-id>
AZURE_AD_B2C_CLIENT_SECRET=<client-secret>
AZURE_AD_B2C_PRIMARY_USER_FLOW=B2C_1_signupsignin
```

### CSRF 保護
NextAuth 自動處理 CSRF Token（內建）

### Session Fixation 防護
NextAuth 在登入成功後自動重新生成 Session ID

### XSS 防護
- Session Cookie 設置 `httpOnly: true`
- 不在 localStorage 儲存 Token

## 🔍 除錯技巧

### 啟用 Debug 模式
```typescript
// auth.config.ts
export default {
  debug: process.env.NODE_ENV === 'development',
  // ...
};
```

### 檢查 Session
```typescript
// 任何 Server Component
const session = await auth();
console.log('Session:', JSON.stringify(session, null, 2));
```

### 檢查 JWT Token
```typescript
// Callback 中記錄
async jwt({ token, user }) {
  console.log('JWT Token:', token);
  console.log('User:', user);
  return token;
}
```

## 相關文件
- `apps/web/src/app/api/auth/[...nextauth]/route.ts` - NextAuth API Route
- `apps/web/src/middleware.ts` - Auth Middleware（路由保護）
- `packages/api/src/trpc.ts` - tRPC Auth Context
- [NextAuth.js 官方文檔](https://next-auth.js.org/)
