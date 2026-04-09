/**
 * @fileoverview NextAuth.js Edge-Compatible Configuration - 認證系統邊緣配置
 *
 * @description
 * NextAuth.js v5 的 Edge Runtime 兼容配置文件，專門用於 middleware.ts 路由保護。
 * 此文件不包含 Prisma adapter 和 providers（這些在 auth.ts 中定義），
 * 僅包含 Edge 環境可執行的基本配置（pages, session, callbacks.authorized）。
 * 確保中介軟體可在 Edge Runtime 中正常運行，不依賴 Node.js 特定功能。
 *
 * @module auth.config
 *
 * @features
 * - Edge Runtime 兼容（無 Prisma、無 Node.js 依賴）
 * - 路由保護配置（受保護路由列表）
 * - 自訂頁面路徑（登入頁、錯誤頁）
 * - JWT 會話策略（24 小時過期）
 * - authorized callback（中介軟體路由檢查）
 *
 * @security
 * - JWT Session: 使用 JWT 策略（因為 Edge 無法訪問資料庫）
 * - Secret: 使用環境變數 AUTH_SECRET 或 NEXTAUTH_SECRET
 * - Protected Routes: Dashboard, Projects, Budget Pools, Proposals, Vendors, Purchase Orders, Expenses, Users
 * - Debug Mode: 僅在開發環境啟用
 *
 * @environment
 * - AUTH_SECRET: JWT 簽名密鑰（優先）
 * - NEXTAUTH_SECRET: 備用 JWT 簽名密鑰
 * - NODE_ENV: 環境模式（development/production）
 *
 * @dependencies
 * - next-auth: NextAuth.js v5 核心庫
 *
 * @related
 * - packages/auth/src/index.ts - 完整 NextAuth 配置（包含 Prisma adapter 和 providers）
 * - apps/web/src/middleware.ts - 認證中介軟體（使用此配置）
 * - apps/web/src/app/[locale]/login/page.tsx - 登入頁面
 *
 * @architecture
 * - Edge Runtime: Vercel Edge Functions, Cloudflare Workers 兼容
 * - Middleware Only: 僅用於 middleware.ts，不用於 API routes
 * - Stateless: 無狀態設計，依賴 JWT 而非 session 資料庫
 *
 * @references
 * - NextAuth.js v5 文檔: https://authjs.dev/getting-started/migrating-to-v5
 * - Edge Runtime 限制: https://nextjs.org/docs/app/api-reference/edge
 *
 * @author IT Department
 * @since Epic 1 - Azure AD (Entra ID) Authentication
 * @lastModified 2025-11-14
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
    signIn: '/zh-TW/login',  // 添加預設 locale 前綴以修復 404 問題
    error: '/zh-TW/login',
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

      // FIX-095: 支援的 locale 列表
      const locales = ['en', 'zh-TW'];

      // FIX-095: 從 pathname 中移除 locale 前綴以進行路由匹配
      // 例如: /en/projects → /projects, /zh-TW/dashboard → /dashboard
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

      // 受保護的路由
      const protectedRoutes = [
        // ===== 現有路由 (8 個) =====
        '/dashboard',
        '/projects',
        '/budget-pools',
        '/proposals',
        '/vendors',
        '/purchase-orders',
        '/expenses',
        '/users',
        // ===== FIX-095: 新增缺失的受保護路由 (10 個) =====
        '/om-expenses',
        '/om-summary',
        '/charge-outs',
        '/quotes',
        '/notifications',
        '/settings',
        '/data-import',
        '/project-data-import',
        '/operating-companies',
        '/om-expense-categories',
      ];

      // FIX-095: 使用移除 locale 後的 pathname 進行匹配
      const isProtectedRoute = protectedRoutes.some((route) =>
        pathnameWithoutLocale.startsWith(route),
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
  // 🌐 Trust Host Configuration
  // ========================================
  // trustHost: true 允許 NextAuth 接受來自任何 Host 的請求
  // 這在 Docker 容器、反向代理、Azure App Service 等環境中是必需的
  // 因為請求的 Host header 可能與 NEXTAUTH_URL 不完全匹配
  trustHost: true,

  // ========================================
  // 🐞 Debug Configuration
  // ========================================
  debug: process.env.NODE_ENV === 'development',
};
