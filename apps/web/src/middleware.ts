/**
 * Next.js Middleware - 認證保護 (NextAuth v5) + i18n 路由 (next-intl)
 *
 * 此中間件整合：
 * 1. NextAuth v5 認證保護
 * 2. next-intl 國際化路由處理
 *
 * 重要：
 * - 此文件只 import auth.config.ts（Edge-compatible）
 * - 不 import auth.ts（包含 Prisma，無法在 Edge Runtime 運行）
 * - next-intl middleware 在 NextAuth 內部執行，確保 locale 正確設置
 */

import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// 創建 next-intl middleware 處理 i18n 路由
const handleI18nRouting = createMiddleware(routing);

// 使用 Edge-compatible 配置初始化 NextAuth
const { auth } = NextAuth(authConfig);

// 整合 NextAuth 和 next-intl middleware
// NextAuth 的 auth() 包裝 next-intl middleware，確保認證後正確處理 locale
export default auth((req) => {
  return handleI18nRouting(req);
});

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
