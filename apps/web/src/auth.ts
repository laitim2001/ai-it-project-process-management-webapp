/**
 * NextAuth.js v5 認證配置
 *
 * 提供簡化版的本地憑證認證，可輕鬆升級到 Azure AD B2C
 *
 * @module apps/web/src/auth
 */

import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import AzureADB2C from 'next-auth/providers/azure-ad-b2c';
import { prisma } from '@itpm/db';
import bcrypt from 'bcryptjs';

console.log('🚀 NextAuth v5 配置文件正在載入...');

/**
 * 擴展 NextAuth 類型定義
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

declare module '@auth/core/jwt' {
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
 * NextAuth.js v5 配置選項
 */
export const authConfig: NextAuthConfig = {
  // 會話策略：使用 JWT（NextAuth v5 預設）
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 小時
  },

  // 認證提供者
  providers: [
    // Azure AD B2C Provider (Epic 1 - Story 1.3)
    ...(process.env.AUTH_AZURE_AD_B2C_ID && process.env.AUTH_AZURE_AD_B2C_SECRET
      ? [
          AzureADB2C({
            clientId: process.env.AUTH_AZURE_AD_B2C_ID,
            clientSecret: process.env.AUTH_AZURE_AD_B2C_SECRET,
            issuer: process.env.AUTH_AZURE_AD_B2C_ISSUER,
            // 自定義 profile 映射
            profile(profile: any) {
              return {
                id: profile.sub || profile.oid,
                email: profile.email || profile.emails?.[0] || profile.preferred_username,
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

  // JWT 回調：將用戶信息添加到 JWT
  callbacks: {
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

      // Azure AD B2C 登入時，確保用戶在資料庫中存在
      if (account?.provider === 'azure-ad-b2c' && user) {
        const dbUser = await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name,
            image: user.image,
          },
          create: {
            email: user.email,
            name: user.name,
            image: user.image,
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
    async session({ session, token }) {
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
  },

  // 調試模式（僅在開發環境）
  debug: process.env.NODE_ENV === 'development',
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
