/**
 * Auth.js v5 Edge-Compatible Configuration
 *
 * 此文件只包含 Edge Runtime 兼容的基本配置（不含 Prisma adapter 和 providers）
 * 用於 middleware.ts 中的路由保護
 *
 * 關鍵原則：
 * - 不引用 Prisma 或任何需要 Node.js runtime 的依賴
 * - 不包含 providers（providers 在 auth.ts 中定義）
 * - 只包含 pages, session, callbacks.authorized
 * - Middleware 只 import 此文件，不 import auth.ts
 *
 * 文檔: https://authjs.dev/getting-started/migrating-to-v5
 */

import type { NextAuthConfig } from 'next-auth';

// ========================================
// 🎨 NextAuth.js v5 基本配置（Edge 兼容）
// ========================================

/**
 * 核心認證配置（Edge 兼容）
 *
 * 注意：此配置只包含 Edge Runtime 兼容的部分
 * 完整的 providers 會在 auth.ts 中添加
 */
export const authConfig: NextAuthConfig = {
  // ========================================
  // 🔐 Providers Configuration (Empty for Edge)
  // ========================================
  providers: [],

  // ========================================
  // 📄 Pages Configuration
  // ========================================
  pages: {
    signIn: '/login',
    error: '/login',
  },

  // ========================================
  // 📊 Callbacks Configuration（Edge 兼容）
  // ========================================
  callbacks: {
    /**
     * Authorized Callback（路由保護）
     *
     * 此 callback 在 middleware 中使用，檢查用戶是否有權訪問路由
     * 這是 Edge-compatible 的，不需要訪問 Prisma
     */
    authorized: async ({ auth, request }) => {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      // 受保護的路由
      const protectedRoutes = [
        '/dashboard',
        '/projects',
        '/budget-pools',
        '/budget-proposals',
        '/vendors',
        '/purchase-orders',
        '/expenses',
        '/users',
      ];

      const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route),
      );

      if (isProtectedRoute && !isLoggedIn) {
        return false; // 重定向到登入頁面
      }

      return true; // 允許訪問
    },
  },

  // ========================================
  // 🔧 Session Configuration
  // ========================================
  session: {
    strategy: 'jwt', // 必須使用 JWT（因為沒有 adapter）
    maxAge: 24 * 60 * 60, // 24 hours
  },

  // ========================================
  // 🔒 Secret Configuration
  // ========================================
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,

  // ========================================
  // 🐞 Debug Configuration
  // ========================================
  debug: process.env.NODE_ENV === 'development',
};
