/**
 * NextAuth.js 認證配置
 *
 * 提供簡化版的本地憑證認證，可輕鬆升級到 Azure AD B2C
 *
 * @module packages/auth
 */

import type { NextAuthOptions, User as NextAuthUser } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import AzureADB2CProvider from 'next-auth/providers/azure-ad-b2c';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@itpm/db';
import bcrypt from 'bcryptjs';

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
    roleId: number;
    role: {
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
 */
export const authOptions: NextAuthOptions = {
  // 使用 Prisma Adapter 管理會話（未來可切換到資料庫會話）
  adapter: PrismaAdapter(prisma),

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
            tenantId: process.env.AZURE_AD_B2C_TENANT_ID || process.env.AZURE_AD_B2C_TENANT_NAME,
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
              };
            },
          }),
        ]
      : []),

    // Credentials Provider (本地開發與測試)
    CredentialsProvider({
      id: 'credentials',
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'user@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('請提供 Email 和密碼');
        }

        // 查找用戶
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { role: true },
        });

        if (!user) {
          throw new Error('Email 或密碼錯誤');
        }

        // 驗證密碼
        if (!user.password) {
          throw new Error('此帳號未設定密碼，請使用其他登入方式');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Email 或密碼錯誤');
        }

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
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.roleId = user.roleId;
        token.role = user.role;
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

      return token;
    },

    // Session 回調：將 JWT 信息添加到 Session
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          name: token.name,
          role: token.role,
        };
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
