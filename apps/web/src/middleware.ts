/**
 * @fileoverview Next.js Middleware - 認證保護 + 國際化路由
 *
 * @description
 * Next.js 中介層，整合 NextAuth.js 認證保護和 next-intl 國際化路由處理。
 * 在 Edge Runtime 執行，提供高效能的路由層級認證和語言切換。
 *
 * 此中介層負責：
 * 1. **NextAuth v5 認證保護** - 保護需要登入的頁面
 * 2. **next-intl 國際化路由** - 處理 /en 和 /zh-TW 路由前綴
 *
 * @module apps/web/src/middleware
 *
 * @features
 * - Edge Runtime 相容（使用 auth.config.ts，不含 Prisma）
 * - 路由級別認證保護
 * - 國際化路由處理（en / zh-TW）
 * - 自動重定向至登入頁面（未認證用戶）
 * - 保留原始請求 URL（登入後返回）
 * - 靜態資源和 API 路由排除
 *
 * @example
 * ```typescript
 * // 受保護的路由（需要登入）：
 * // - /dashboard/*
 * // - /projects/*
 * // - /budget-pools/*
 * // - /vendors/*
 * // - /expenses/*
 * // 等等...
 *
 * // 未受保護的路由：
 * // - /login
 * // - /register
 * // - /api/*
 * // - /_next/static/*
 * // - /favicon.ico
 * ```
 *
 * @dependencies
 * - next-auth: NextAuth v5 認證
 * - next-intl: 國際化路由
 * - ./auth.config: Edge-compatible 認證配置
 * - ./i18n/routing: next-intl 路由配置
 *
 * @related
 * - apps/web/src/auth.config.ts - Edge-compatible 認證配置
 * - apps/web/src/i18n/routing.ts - next-intl 路由配置
 * - packages/auth/src/index.ts - 完整認證配置（含 Prisma）
 * - apps/web/src/app/[locale]/login/page.tsx - 登入頁面
 *
 * @author IT Department
 * @since Epic 1 - Azure AD B2C Authentication + Post-MVP I18N
 * @lastModified 2025-11-14
 *
 * @notes
 * - **重要**: 僅 import auth.config.ts（Edge-compatible），不 import auth.ts（含 Prisma）
 * - Prisma 無法在 Edge Runtime 執行，會導致部署失敗
 * - next-intl middleware 在 NextAuth auth() 內部執行，確保 locale 正確設置
 * - 認證邏輯在 auth.config.ts 的 authorized callback 中定義
 *
 * @see {@link https://nextjs.org/docs/app/building-your-application/routing/middleware|Next.js Middleware}
 * @see {@link https://next-auth.js.org/configuration/initialization#route-handlers-app|NextAuth.js Edge Runtime}
 * @see {@link https://next-intl-docs.vercel.app/docs/routing/middleware|next-intl Middleware}
 */

import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

/**
 * next-intl 國際化路由處理器
 * @const handleI18nRouting
 * @description 處理 /en 和 /zh-TW 路由前綴，自動偵測和切換語言
 */
const handleI18nRouting = createMiddleware(routing);

/**
 * NextAuth 認證實例（Edge-compatible）
 * @const {Function} auth
 * @description 使用 Edge-compatible 配置初始化 NextAuth（不含 Prisma）
 */
const { auth } = NextAuth(authConfig);

/**
 * Next.js Middleware 主函數
 *
 * @function middleware
 * @param {Request} req - Next.js 請求物件
 * @returns {Response} Next.js 回應物件
 *
 * @description
 * 整合 NextAuth 和 next-intl middleware：
 * 1. NextAuth auth() 先執行認證檢查
 * 2. next-intl handleI18nRouting() 處理語言路由
 *
 * 執行順序：
 * Request → NextAuth 認證 → next-intl 路由 → Response
 *
 * @example
 * ```typescript
 * // 未認證用戶訪問受保護頁面：
 * // GET /dashboard → 重定向 → /login?callbackUrl=/dashboard
 *
 * // 已認證用戶訪問受保護頁面：
 * // GET /dashboard → next-intl 處理 → /zh-TW/dashboard
 *
 * // 語言切換：
 * // GET /en/projects → 顯示英文版
 * // GET /zh-TW/projects → 顯示繁中版
 * ```
 */
export default auth((req) => {
  return handleI18nRouting(req);
});

/**
 * Middleware 配置
 *
 * @const config
 * @property {string[]} matcher - 需要執行 middleware 的路由模式列表
 *
 * @description
 * 定義哪些路徑需要執行此 middleware（認證保護 + i18n 路由）。
 *
 * **Matcher 格式支援**:
 * - 字串路徑: `/dashboard`
 * - 萬用字元: `/dashboard/:path*`（匹配所有子路徑）
 * - 正則表達式: `/((?!api|_next/static).*)`
 *
 * **受保護的路徑**（需要登入）:
 * - `/dashboard/*` - 儀表板（Epic 7）
 * - `/projects/*` - 專案管理（Epic 2）
 * - `/budget-pools/*` - 預算池管理（Epic 2）
 * - `/budget-proposals/*` - 預算提案（Epic 3）
 * - `/vendors/*` - 供應商管理（Epic 5）
 * - `/purchase-orders/*` - 採購單（Epic 5）
 * - `/expenses/*` - 費用記錄（Epic 6）
 * - `/users/*` - 用戶管理（Epic 1）
 *
 * **排除的路徑**（不執行 middleware）:
 * - `/api/*` - API 路由（tRPC）
 * - `/_next/static/*` - Next.js 靜態文件
 * - `/_next/image/*` - Next.js 圖片優化
 * - `/favicon.ico` - 網站圖標
 * - `/login` - 登入頁面
 * - `/register` - 註冊頁面
 *
 * @notes
 * - Edge Runtime 執行，無需 `runtime: 'nodejs'` 配置
 * - 認證邏輯在 auth.config.ts 的 `authorized` callback 中定義
 * - 所有路徑自動加上 locale 前綴（/en, /zh-TW）
 *
 * @see {@link https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher|Next.js Middleware Matcher}
 */
export const config = {
  matcher: [
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
