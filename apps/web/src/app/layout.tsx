/**
 * @fileoverview Root Layout - 根路徑重定向專用 Layout（最小化設計）
 * @description 僅用於根路徑 `/` 的重定向頁面，實際應用 Layout 位於 `[locale]/layout.tsx`
 *
 * 此 Layout 的唯一目的是包裹根路徑 `/` 的重定向邏輯（page.tsx），
 * 避免與 `[locale]/layout.tsx` 中的完整 HTML/Body 設定產生 Hydration 衝突。
 * 使用 `suppressHydrationWarning` 抑制 React 18 的 Hydration 警告。
 *
 * @layout
 * @route /
 *
 * @features
 * - 最小化 HTML 結構 - 僅包含必要的 `<html>` 和 `<body>` 標籤
 * - Hydration 警告抑制 - 使用 `suppressHydrationWarning` 避免與 Locale Layout 衝突
 * - 無樣式和 Provider - 所有應用層級設定位於 `[locale]/layout.tsx`
 *
 * @metadata
 * - 無 Metadata - 實際 Metadata 由 `[locale]/layout.tsx` 提供
 *
 * @dependencies
 * - `react` - React 18 核心邏輯
 *
 * @related
 * - `apps/web/src/app/page.tsx` - 根路徑重定向邏輯（重定向至 `/zh-TW`）
 * - `apps/web/src/app/[locale]/layout.tsx` - 實際應用 Layout（包含 Providers、Theme、i18n）
 * - `apps/web/src/app/[locale]/page.tsx` - Locale 首頁（重定向至 `/dashboard` 或 `/login`）
 *
 * @author IT Project Management Team
 * @since Project Initialization
 *
 * @example
 * // 頁面結構
 * / (Root)
 * ├── layout.tsx (此檔案 - 最小化 Layout)
 * └── page.tsx (重定向至 /zh-TW)
 *
 * /zh-TW (Locale)
 * ├── layout.tsx (完整 Layout - Providers、Theme、i18n)
 * └── page.tsx (重定向至 /dashboard 或 /login)
 */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
