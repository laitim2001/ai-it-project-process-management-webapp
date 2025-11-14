/**
 * @fileoverview NextAuth.js Authentication Configuration - 認證配置
 *
 * @description
 * NextAuth.js 認證系統的核心配置，支援雙重認證模式：
 * 1. **Azure AD B2C SSO** - 企業級單一登入（生產環境）
 * 2. **Credentials Provider** - 本地帳號密碼認證（開發/測試）
 *
 * 使用 JWT 會話策略，無需資料庫會話表，所有會話資訊加密儲存於 JWT token。
 * 支援自動用戶同步（Azure AD B2C → 資料庫），確保用戶資料一致性。
 *
 * @module packages/auth
 *
 * @features
 * - Azure AD B2C SSO 整合（Epic 1）
 * - 本地帳號密碼認證（開發用）
 * - JWT 會話策略（無狀態）
 * - 自動用戶同步至資料庫
 * - 角色權限管理（RBAC）
 * - bcrypt 密碼加密
 * - 會話時長 24 小時
 * - 自訂登入頁面 (/login)
 *
 * @example
 * ```typescript
 * // 在 API Route 中使用
 * import { getServerSession } from 'next-auth';
 * import { authOptions } from '@itpm/auth';
 *
 * export async function GET(req: Request) {
 *   const session = await getServerSession(authOptions);
 *
 *   if (!session) {
 *     return new Response('Unauthorized', { status: 401 });
 *   }
 *
 *   // session.user.id, session.user.email, session.user.role
 *   return Response.json({ user: session.user });
 * }
 * ```
 *
 * @example
 * ```typescript
 * // 在 Server Component 中使用
 * import { getServerSession } from 'next-auth';
 * import { authOptions } from '@itpm/auth';
 *
 * export default async function DashboardPage() {
 *   const session = await getServerSession(authOptions);
 *
 *   if (!session) {
 *     redirect('/login');
 *   }
 *
 *   return <Dashboard user={session.user} />;
 * }
 * ```
 *
 * @dependencies
 * - next-auth: 認證框架
 * - @next-auth/prisma-adapter: Prisma 整合（未使用，JWT 模式）
 * - @itpm/db: Prisma Client
 * - bcryptjs: 密碼加密
 *
 * @related
 * - apps/web/src/app/api/auth/[...nextauth]/route.ts - NextAuth API Route
 * - apps/web/src/middleware.ts - 路由保護中介層
 * - apps/web/src/app/[locale]/login/page.tsx - 登入頁面
 * - packages/db/prisma/schema.prisma - User, Account, Session 模型
 *
 * @author IT Department
 * @since Epic 1 - Azure AD B2C Authentication
 * @lastModified 2025-11-14
 *
 * @notes
 * - JWT 模式不使用 Prisma Adapter
 * - Azure AD B2C 用戶自動同步至資料庫（jwt callback）
 * - 本地認證使用 bcrypt hash（saltRounds: 10）
 * - 會話時長: 24 小時（可配置）
 * - Debug 模式僅在開發環境啟用
 *
 * @see {@link https://next-auth.js.org/configuration/options|NextAuth.js Configuration}
 * @see {@link https://learn.microsoft.com/azure/active-directory-b2c/|Azure AD B2C Documentation}
 */

console.log('🚀 NextAuth 配置文件正在載入...');

import type { User as NextAuthUser } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import AzureADB2CProvider from 'next-auth/providers/azure-ad-b2c';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@itpm/db';
import bcrypt from 'bcryptjs';

/**
 * 擴展 NextAuth 類型定義
 *
 * @description
 * 為 NextAuth.js 的 Session 和 User 類型添加自訂欄位。
 * 包含用戶角色資訊（id, name），支援 RBAC 權限管理。
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      role: {
        id: number;
        name: string;
      };
    };
  }

  interface User {
    id: string;
    email: string;
    name: string | null;
    roleId?: number;
    role?: {
      id: number;
      name: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string | null;
    roleId: number;
    role: {
      id: number;
      name: string;
    };
  }
}

/**
 * NextAuth.js 配置選項
 *
 * @type {any}
 * @const authOptions
 *
 * @description
 * NextAuth.js 的核心配置物件，定義認證提供者、會話策略、回調函數等。
 *
 * @property {Object} session - 會話配置
 * @property {string} session.strategy - 會話策略（jwt）
 * @property {number} session.maxAge - 會話時長（秒）
 * @property {Array} providers - 認證提供者列表
 * @property {Object} callbacks - 回調函數
 * @property {Function} callbacks.jwt - JWT 生成回調
 * @property {Function} callbacks.session - Session 生成回調
 * @property {Object} pages - 自訂頁面路由
 * @property {string} pages.signIn - 登入頁面路徑
 * @property {boolean} debug - 除錯模式
 * @property {string} secret - JWT 加密金鑰
 */
export const authOptions: any = {
  // 注意：JWT strategy 不應該使用 adapter
  // adapter: PrismaAdapter(prisma),

  // 會話策略：使用 JWT（無需資料庫會話表）
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 小時
  },

  // 認證提供者
  providers: [
    // Azure AD B2C Provider (Epic 1 - Story 1.3)
    ...(process.env.AZURE_AD_B2C_CLIENT_ID && process.env.AZURE_AD_B2C_CLIENT_SECRET
      ? [
          AzureADB2CProvider({
            clientId: process.env.AZURE_AD_B2C_CLIENT_ID,
            clientSecret: process.env.AZURE_AD_B2C_CLIENT_SECRET,
            // @ts-ignore - tenantId is required for Azure AD B2C but not in type definition
            tenantId: process.env.AZURE_AD_B2C_TENANT_NAME || '',
            primaryUserFlow: process.env.AZURE_AD_B2C_PRIMARY_USER_FLOW || 'B2C_1_signupsignin',
            authorization: {
              params: {
                scope: process.env.AZURE_AD_B2C_SCOPE || 'openid profile email offline_access',
              },
            },
            // 自定義 profile 映射
            profile(profile: any) {
              return {
                id: profile.sub || profile.oid,
                email: profile.email || profile.emails?.[0] || profile.preferred_username,
                name: profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim(),
                image: profile.picture,
                emailVerified: profile.email_verified ? new Date() : null,
                roleId: 1, // 預設為 ProjectManager
                role: {
                  id: 1,
                  name: 'ProjectManager',
                },
              };
            },
          }),
        ]
      : []),

    // Credentials Provider (本地開發與測試)
    // 注意：不設置 id，使用默認值 'credentials'
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'user@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        console.log('🔐 Authorize 函數執行', { email: credentials?.email });

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Authorize: 缺少 email 或 password');
          throw new Error('請提供 Email 和密碼');
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        // 查找用戶
        const dbUser = await prisma.user.findUnique({
          where: { email },
          include: { role: true },
        });

        if (!dbUser) {
          console.log('❌ Authorize: 用戶不存在', { email });
          throw new Error('Email 或密碼錯誤');
        }

        console.log('✅ Authorize: 用戶存在', { userId: dbUser.id, hasPassword: !!dbUser.password });

        // 驗證密碼
        if (!dbUser.password) {
          console.log('❌ Authorize: 用戶無密碼');
          throw new Error('此帳號未設定密碼，請使用其他登入方式');
        }

        const isPasswordValid = await bcrypt.compare(password, dbUser.password);

        if (!isPasswordValid) {
          console.log('❌ Authorize: 密碼錯誤');
          throw new Error('Email 或密碼錯誤');
        }

        console.log('✅ Authorize: 密碼正確，返回用戶對象', { userId: dbUser.id, email: dbUser.email, roleId: dbUser.roleId });

        // 返回用戶信息
        return {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          roleId: dbUser.roleId,
          role: (dbUser as any).role || { id: dbUser.roleId, name: 'ProjectManager' },
        };
      },
    }),
  ],

  // JWT 回調：將用戶信息添加到 JWT
  callbacks: {
    async jwt({ token, user, account }: { token: JWT; user: NextAuthUser; account: any }) {
      console.log('🔐 JWT callback 執行', { hasUser: !!user, hasAccount: !!account, provider: account?.provider });

      if (user) {
        console.log('✅ JWT callback: 用戶存在，設置 token', { userId: user.id, email: user.email, roleId: user.roleId });
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.roleId = user.roleId ?? 1; // Default to ProjectManager if undefined
        token.role = user.role ?? { id: 1, name: 'ProjectManager' as const }; // Default role if undefined
      } else {
        console.log('⚠️ JWT callback: 用戶不存在');
      }

      // Azure AD B2C 登入時，確保用戶在資料庫中存在
      if (account?.provider === 'azure-ad-b2c' && user) {
        const dbUser = await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name,
            image: user.image,
            emailVerified: (user as any).emailVerified,
          },
          create: {
            email: user.email,
            name: user.name,
            image: user.image,
            emailVerified: (user as any).emailVerified,
            roleId: 1, // 預設為 ProjectManager (roleId = 1)
            password: null, // Azure AD B2C 用戶無本地密碼
          },
          include: { role: true },
        });

        token.id = dbUser.id;
        token.email = dbUser.email;
        token.name = dbUser.name;
        token.roleId = dbUser.roleId;
        token.role = dbUser.role;
      }

      console.log('📊 JWT callback 返回 token', { id: token.id, email: token.email });
      return token;
    },

    // Session 回調：將 JWT 信息添加到 Session
    async session({ session, token }: { session: any; token: JWT }) {
      console.log('🔐 Session callback 執行', { hasToken: !!token, tokenId: token?.id });

      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          name: token.name,
          role: token.role,
        };
        console.log('✅ Session callback: 設置 session.user', { userId: session.user.id });
      } else {
        console.log('⚠️ Session callback: token 不存在');
      }

      return session;
    },
  },

  // 自定義頁面路由
  pages: {
    signIn: '/login',
    // signOut: '/auth/signout',
    // error: '/auth/error',
    // verifyRequest: '/auth/verify-request',
    // newUser: '/auth/new-user',
  },

  // 事件處理
  events: {
    async signOut() {
      // 登出事件處理（如需記錄日誌等）
    },
  },

  // 調試模式（僅在開發環境）
  debug: process.env.NODE_ENV === 'development',

  // Secret（用於加密 JWT）
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * 密碼加密工具函數
 *
 * @param {string} password - 明文密碼
 * @returns {Promise<string>} bcrypt hash 值
 *
 * @description
 * 使用 bcrypt 演算法對密碼進行單向加密。
 * Salt Rounds: 10（安全性與性能的平衡）
 *
 * @example
 * ```typescript
 * import { hashPassword } from '@itpm/auth';
 *
 * const hashedPassword = await hashPassword('myPassword123');
 * // "$2a$10$..."
 * ```
 *
 * @see {@link https://github.com/kelektiv/node.bcrypt.js|bcryptjs Documentation}
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * 密碼驗證工具函數
 *
 * @param {string} password - 明文密碼
 * @param {string} hashedPassword - bcrypt hash 值
 * @returns {Promise<boolean>} 驗證結果（true: 密碼正確, false: 密碼錯誤）
 *
 * @description
 * 驗證明文密碼是否與 bcrypt hash 值匹配。
 * 使用常數時間比較，防止時序攻擊。
 *
 * @example
 * ```typescript
 * import { verifyPassword } from '@itpm/auth';
 *
 * const isValid = await verifyPassword('myPassword123', hashedPassword);
 * if (isValid) {
 *   console.log('密碼正確');
 * }
 * ```
 *
 * @security
 * - 使用 bcrypt.compare() 進行安全比較
 * - 防止時序攻擊（timing attack）
 * - 不洩露密碼長度或內容資訊
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
