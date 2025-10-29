/**
 * Next.js Middleware - 認證保護 (NextAuth v5)
 *
 * 此中間件保護需要認證的路由
 * 未登入的用戶將被重定向到登入頁面
 *
 * 重要：
 * - 此文件只 import auth.config.ts（Edge-compatible）
 * - 不 import auth.ts（包含 Prisma，無法在 Edge Runtime 運行）
 * - 使用 NextAuth(authConfig) 來初始化，不是 import { auth }
 */

import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

// 使用 Edge-compatible 配置初始化 NextAuth
// 直接導出 auth middleware（不解構）
export default NextAuth(authConfig).auth;

/**
 * 配置需要保護的路徑
 *
 * matcher 支援以下格式:
 * - 字串路徑: '/dashboard'
 * - 萬用字元: '/dashboard/:path*'
 * - 正則表達式: '/((?!api|_next/static|_next/image|favicon.ico).*)'
 *
 * 注意：
 * - 不再需要 runtime: 'nodejs'，因為使用 Edge-compatible 配置
 * - 路由保護邏輯在 auth.config.ts 的 authorized callback 中定義
 */
export const config = {
  matcher: [
    /*
     * 保護以下路徑:
     * - /dashboard (儀表板)
     * - /projects (專案管理)
     * - /budget-pools (預算池)
     * - /budget-proposals (預算提案)
     * - /vendors (供應商)
     * - /purchase-orders (採購單)
     * - /expenses (費用)
     * - /users (用戶管理)
     *
     * 排除以下路徑:
     * - /api (API 路由)
     * - /_next/static (Next.js 靜態文件)
     * - /_next/image (Next.js 圖片優化)
     * - /favicon.ico (網站圖標)
     * - /login (登入頁面)
     */
    '/dashboard/:path*',
    '/projects/:path*',
    '/budget-pools/:path*',
    '/budget-proposals/:path*',
    '/vendors/:path*',
    '/purchase-orders/:path*',
    '/expenses/:path*',
    '/users/:path*',
  ],
};
