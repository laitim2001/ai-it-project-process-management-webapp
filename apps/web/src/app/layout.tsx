/**
 * @fileoverview Root Layout - 應用程式根 Layout（HTML 結構 + 字體）
 * @description Next.js App Router 的根 Layout，提供 HTML 結構和全域字體設定
 *
 * FIX-096: 修復 Layout 嵌套導致的 Hydration 錯誤
 * 問題：原本 RootLayout 和 LocaleLayout 都渲染 <html><body>，導致嵌套錯誤
 * 解決：
 * - RootLayout (此檔案): 只渲染 <html> 和 <body> 結構 + 字體
 * - LocaleLayout: 只渲染 Providers（不含 HTML 標籤）
 *
 * @layout
 * @route /* (所有路由)
 *
 * @features
 * - HTML 結構 - 提供 `<html>` 和 `<body>` 標籤
 * - Google Inter 字體 - 優化的 Latin 字元集字體
 * - Hydration 警告抑制 - 支援 Theme 和動態 locale 屬性
 *
 * @metadata
 * - title: 'IT Project Management Platform'
 * - description: 'Centralized workflow management from budget allocation to expense charge-out'
 *
 * @dependencies
 * - `next` - Next.js 框架（Metadata、字體）
 *
 * @related
 * - `apps/web/src/app/[locale]/layout.tsx` - Locale Layout（Providers、i18n、Theme）
 * - `apps/web/src/app/globals.css` - 全域樣式
 *
 * @author IT Project Management Team
 * @since Project Initialization
 * @lastModified 2025-12-17 (FIX-096)
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'IT Project Management Platform',
  description:
    'Centralized workflow management from budget allocation to expense charge-out',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
