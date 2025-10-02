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

    // 未來可在此添加 Azure AD B2C Provider
    // AzureADB2CProvider({
    //   clientId: process.env.AZURE_AD_B2C_CLIENT_ID!,
    //   clientSecret: process.env.AZURE_AD_B2C_CLIENT_SECRET!,
    //   tenantId: process.env.AZURE_AD_B2C_TENANT_ID!,
    //   primaryUserFlow: process.env.AZURE_AD_B2C_PRIMARY_USER_FLOW!,
    // }),
  ],

  // JWT 回調：將用戶信息添加到 JWT
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.roleId = user.roleId;
        token.role = user.role;
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
