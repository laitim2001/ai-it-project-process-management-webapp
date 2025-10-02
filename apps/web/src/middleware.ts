/**
 * Next.js Middleware - 認證保護
 *
 * 此中間件保護需要認證的路由
 * 未登入的用戶將被重定向到登入頁面
 */

export { default } from 'next-auth/middleware';

/**
 * 配置需要保護的路徑
 *
 * matcher 支援以下格式:
 * - 字串路徑: '/dashboard'
 * - 萬用字元: '/dashboard/:path*'
 * - 正則表達式: '/((?!api|_next/static|_next/image|favicon.ico).*)'
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
