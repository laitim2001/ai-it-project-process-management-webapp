/**
 * @fileoverview NextAuth.js v5 完整配置文件
 *
 * @description
 * NextAuth.js v5 認證系統的核心配置文件，整合 Azure AD B2C SSO 和本地密碼認證。
 * 此文件合併 auth.config.ts 的 Edge-compatible 配置並添加完整的 Providers 和 Prisma 訪問。
 *
 * 文件結構：
 * - auth.config.ts: Edge-compatible 基本配置（用於 middleware）
 * - auth.ts: 完整配置 + Providers + Prisma（用於 API routes）
 * - middleware.ts: 使用 NextAuth(authConfig)（避免 Prisma）
 *
 * @module apps/web/src/auth
 * @author IT Department
 * @since Epic 1 - Story 1.3 (Azure AD B2C Integration)
 * @lastModified 2025-11-14
 *
 * @features
 * - Azure AD B2C SSO 認證
 * - 本地密碼認證（Credentials Provider）
 * - Prisma 資料庫整合
 * - 自動用戶 upsert（Azure AD B2C 登入時）
 * - JWT Session 管理
 * - RBAC 支援（role object in session；roleId 僅存在於 JWT/User，session 一律用 role.id）
 *
 * @dependencies
 * - next-auth v5 - 核心認證框架
 * - @itpm/db (Prisma) - 資料庫訪問
 * - bcryptjs - 密碼加密
 * - apps/web/src/auth.config.ts - 基本配置
 *
 * @related
 * - apps/web/src/auth.config.ts - Edge-compatible 基本配置
 * - apps/web/src/app/api/auth/[...nextauth]/route.ts - API Route Handler
 * - apps/web/src/middleware.ts - 認證中間件
 * - apps/web/src/components/providers/SessionProvider.tsx - React Session Provider
 */

import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import AzureAD from 'next-auth/providers/azure-ad';
import { prisma } from '@itpm/db';
import bcrypt from 'bcryptjs';
import { authConfig as baseAuthConfig } from './auth.config';

// NextAuth 的型別擴充（Session.user.role / User.roleId / JWT）統一由 @itpm/auth 提供，
// 此處以 side-effect import 載入，避免在本檔重複宣告造成 module augmentation 衝突。
// （與 packages/api/src/trpc.ts 的 `import '@itpm/auth'` 做法一致）
import '@itpm/auth';

console.log('🚀 NextAuth v5 配置文件正在載入...');

/**
 * NextAuth.js v5 完整配置選項
 *
 * 合併 auth.config.ts 的基本配置 + 完整的 Providers + Prisma
 */
export const authConfig: NextAuthConfig = {
  // 繼承基本配置
  ...baseAuthConfig,

  // 認證提供者（包含 Prisma 訪問）
  providers: [
    // Azure AD (Entra ID) Provider - 企業 SSO (Epic 1 - Story 1.3)
    // 僅在環境變數配置完整時啟用
    ...(process.env.AZURE_AD_CLIENT_ID &&
        process.env.AZURE_AD_CLIENT_SECRET &&
        process.env.AZURE_AD_TENANT_ID
      ? [
          AzureAD({
            clientId: process.env.AZURE_AD_CLIENT_ID,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
            // next-auth v5：azure-ad provider 已改為 microsoft-entra-id，不再接受 tenantId，
            // 改以 issuer 指定單一租戶（限制只允許本組織帳號登入）。
            issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
            authorization: {
              params: {
                scope: 'openid profile email User.Read',
              },
            },
            // 自定義 profile 映射
            profile(profile: any) {
              return {
                id: profile.sub || profile.oid,
                email: profile.email || profile.preferred_username || profile.upn,
                name: profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim(),
                image: profile.picture,
                emailVerified: profile.email_verified ? new Date() : null,
              };
            },
          }),
        ]
      : []),

    // Credentials Provider (本地開發與測試)
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'user@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('🔐 Authorize 函數執行', { email: credentials?.email });

        // 從 credentials 中提取 email 和 password
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) {
          console.log('❌ Authorize: 缺少 email 或 password');
          throw new Error('請提供 Email 和密碼');
        }

        // 查找用戶
        const user = await prisma.user.findUnique({
          where: { email },
          include: { role: true },
        });

        if (!user) {
          console.log('❌ Authorize: 用戶不存在', { email });
          throw new Error('Email 或密碼錯誤');
        }

        console.log('✅ Authorize: 用戶存在', { userId: user.id, hasPassword: !!user.password });

        // 驗證密碼
        if (!user.password) {
          console.log('❌ Authorize: 用戶無密碼');
          throw new Error('此帳號未設定密碼，請使用其他登入方式');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          console.log('❌ Authorize: 密碼錯誤');
          throw new Error('Email 或密碼錯誤');
        }

        console.log('✅ Authorize: 密碼正確，返回用戶對象', {
          userId: user.id,
          email: user.email,
          roleId: user.roleId,
        });

        // 返回用戶信息
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          roleId: user.roleId,
          role: user.role,
        };
      },
    }),
  ],

  // 合併 callbacks（繼承 authorized + 添加 jwt, session）
  callbacks: {
    // 繼承 Edge-compatible 的 authorized callback
    ...(baseAuthConfig.callbacks || {}),

    // 完整的 JWT callback（包含 Prisma 訪問）
    async jwt({ token, user, account }) {
      console.log('🔐 JWT callback 執行', { hasUser: !!user, hasAccount: !!account, provider: account?.provider });

      if (user) {
        console.log('✅ JWT callback: 用戶存在，設置 token', {
          userId: user.id,
          email: user.email,
          roleId: user.roleId,
        });
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.roleId = user.roleId!;
        token.role = user.role!;
      } else {
        console.log('⚠️ JWT callback: 用戶不存在');
      }

      // Azure AD (Entra ID) 登入時，確保用戶在資料庫中存在
      if (account?.provider === 'azure-ad' && user) {
        // 新 SSO 用戶預設角色為 ProjectManager（最小權限原則）。
        // 以 role.name 查詢取得 id，避免硬編碼 roleId — Role.id 為 autoincrement，
        // 數值會隨 seed 順序/環境而異（目前 Admin=1, ProjectManager=2, Supervisor=3）。
        const defaultRole = await prisma.role.findUnique({
          where: { name: 'ProjectManager' },
          select: { id: true },
        });
        if (!defaultRole) {
          throw new Error('預設角色 ProjectManager 不存在，請先執行資料庫 seed（pnpm db:seed）');
        }

        const dbUser = await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name,
            image: user.image,
            // 注意：不更新 roleId，避免覆蓋既有用戶被管理員調整過的角色
          },
          create: {
            email: user.email,
            name: user.name,
            image: user.image,
            roleId: defaultRole.id, // 新用戶預設 ProjectManager（最小權限）
            password: null, // Azure AD 用戶無本地密碼
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
    async session({ session, token }) {
      console.log('🔐 Session callback 執行', { hasToken: !!token, tokenId: token?.id });

      if (token) {
        // 逐欄賦值（而非整個取代 session.user）：合併後的 Session.user 型別為
        // AdapterUser & {…自訂欄位}，直接以物件字面量取代會缺少 AdapterUser 必填欄位。
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.role = token.role;
        console.log('✅ Session callback: 設置 session.user', { userId: session.user.id });
      } else {
        console.log('⚠️ Session callback: token 不存在');
      }

      return session;
    },
  },

  // pages 和 debug 已從 baseAuthConfig 繼承，無需重複定義
};

// 導出 NextAuth v5 handlers 和 auth 函數
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

/**
 * 密碼加密工具函數
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * 密碼驗證工具函數
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
