/**
 * @fileoverview Locale 首頁 - 登入狀態判斷與重定向邏輯
 * @description Locale 路徑下的首頁，根據使用者登入狀態自動重定向至 Dashboard 或登入頁
 *
 * 此頁面為國際化路徑（/zh-TW、/en）的首頁，使用 NextAuth 檢查使用者登入狀態：
 * - 已登入：重定向至 /dashboard（專案管理主畫面）
 * - 未登入：重定向至 /login（登入頁面）
 * 在檢查過程中顯示載入動畫，提供良好的使用者體驗。
 *
 * @layout
 * @route /[locale]
 *
 * @features
 * - 登入狀態檢查 - 使用 NextAuth `useSession()` 取得使用者 Session
 * - 自動重定向邏輯 - 已登入導向 Dashboard，未登入導向登入頁
 * - 載入動畫 - 在 Session 檢查期間顯示旋轉載入圖示
 * - 國際化路由 - 使用 `@/i18n/routing` 的 `useRouter()` 保留語言參數
 *
 * @metadata
 * - 無 Metadata - 此頁面僅用於重定向，不會被使用者長時間停留
 *
 * @providers
 * - SessionProvider - 由父層 Locale Layout 提供（`useSession()` 需要）
 *
 * @dependencies
 * - `next-auth/react` - NextAuth.js Client Hooks（useSession）
 * - `@/i18n/routing` - 國際化路由（useRouter - 保留 locale 參數）
 * - `react` - React Hooks（useEffect）
 *
 * @related
 * - `apps/web/src/app/[locale]/layout.tsx` - Locale Layout（提供 SessionProvider）
 * - `apps/web/src/app/[locale]/dashboard/page.tsx` - Dashboard 頁面
 * - `apps/web/src/app/[locale]/login/page.tsx` - 登入頁面
 * - `apps/web/src/auth.ts` - NextAuth.js 認證設定
 *
 * @author IT Project Management Team
 * @since Epic 1 - Azure AD B2C Authentication
 *
 * @example
 * // 使用者流程（已登入）
 * 使用者訪問: /zh-TW
 * → useSession() 檢查 Session（status: 'loading'）
 * → 顯示載入動畫
 * → Session 載入完成（status: 'authenticated'）
 * → 重定向至 /zh-TW/dashboard
 *
 * @example
 * // 使用者流程（未登入）
 * 使用者訪問: /zh-TW
 * → useSession() 檢查 Session（status: 'loading'）
 * → 顯示載入動畫
 * → Session 載入完成（status: 'unauthenticated'）
 * → 重定向至 /zh-TW/login
 *
 * @example
 * // 國際化路由保留
 * 使用者訪問: /en (英文版)
 * → 檢查登入狀態
 * → 重定向至 /en/dashboard (保留語言參數)
 */

'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from '@/i18n/routing';
import { useEffect } from 'react';

/**
 * Locale 首頁元件
 * 根據登入狀態重定向至 Dashboard 或登入頁
 *
 * @returns {JSX.Element} - 載入動畫 UI
 */
export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (session) {
      // 已登入，重定向到 Dashboard
      router.push('/dashboard');
    } else {
      // 未登入，重定向到登入頁面
      router.push('/login');
    }
  }, [session, status, router]);

  // 顯示載入畫面
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p className="text-muted-foreground">載入中...</p>
      </div>
    </div>
  );
}
