/**
 * @fileoverview Root Page - 語言重定向邏輯（自動導向預設語言）
 * @description 根路徑 `/` 的重定向頁面，自動導向預設語言版本 `/zh-TW`
 *
 * 此頁面實現國際化（i18n）的語言自動重定向功能，當使用者訪問根路徑時，
 * 自動重定向至繁體中文版本 `/zh-TW`。未來可擴展支援瀏覽器語言偵測。
 *
 * @layout
 * @route /
 *
 * @features
 * - 自動語言重定向 - 訪問 `/` 自動導向 `/zh-TW`
 * - Next.js 14 App Router - 使用 Server Component 的 `redirect()` 函數
 * - 永久重定向 (308) - 提升 SEO 效果，告知搜尋引擎這是永久性重定向
 *
 * @metadata
 * - 無 Metadata - 此頁面僅用於重定向，不會被使用者看見
 *
 * @providers
 * - 無 Providers - 此頁面在重定向前不渲染任何 UI
 *
 * @dependencies
 * - `next/navigation` - Next.js App Router 的 `redirect()` 函數
 *
 * @related
 * - `apps/web/src/app/layout.tsx` - Root Layout（包裹此頁面）
 * - `apps/web/src/app/[locale]/page.tsx` - Locale 首頁（重定向目標之後的頁面）
 * - `apps/web/src/i18n/routing.ts` - i18n 路由設定（定義支援的語言）
 *
 * @author IT Project Management Team
 * @since Internationalization (i18n) Implementation
 *
 * @example
 * // 使用者流程
 * 使用者訪問: https://example.com/
 * → 自動重定向至: https://example.com/zh-TW
 * → [locale]/page.tsx 判斷登入狀態
 * → 重定向至 /zh-TW/dashboard (已登入) 或 /zh-TW/login (未登入)
 *
 * @example
 * // 未來擴展：瀏覽器語言偵測
 * // import { headers } from 'next/headers';
 * // const acceptLanguage = headers().get('accept-language');
 * // const preferredLocale = detectLocale(acceptLanguage);
 * // redirect(`/${preferredLocale}`);
 */

import { redirect } from 'next/navigation';

/**
 * Root Page Component
 * 重定向至預設語言（繁體中文）
 *
 * @returns {never} - 永遠不返回（因為會觸發重定向）
 */
export default function RootPage() {
  // 重定向到繁體中文版本
  redirect('/zh-TW');
}
