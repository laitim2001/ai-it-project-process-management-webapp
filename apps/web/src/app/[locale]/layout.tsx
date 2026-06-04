/**
 * @fileoverview Locale Layout - 國際化應用 Providers Layout（不含 HTML 標籤）
 * @description Next.js App Router 的 Locale 層級 Layout，負責初始化所有應用層級的 Providers
 *
 * FIX-096: 修復 Layout 嵌套導致的 Hydration 錯誤
 * 問題：原本此 Layout 和 RootLayout 都渲染 <html><body>，導致 <html> 在 <body> 內的嵌套錯誤
 * 解決：
 * - RootLayout (app/layout.tsx): 渲染 <html> 和 <body> 結構 + 字體
 * - LocaleLayout (此檔案): 只渲染 Providers + 設定 lang 屬性（不含 HTML 標籤）
 *
 * 此 Layout 負責初始化所有應用層級的 Providers 和設定。
 * 支援多語言（next-intl）、深色模式（Theme）、型別安全 API（tRPC）、認證（NextAuth）。
 * 所有 `[locale]/*` 路徑下的頁面都會被此 Layout 包裹。
 *
 * @layout
 * @route /[locale]/*
 *
 * @features
 * - 國際化支援 (next-intl) - 支援繁體中文（zh-TW）和英文（en）
 * - tRPC Provider - 提供端到端型別安全的 API 呼叫
 * - NextAuth Session Provider - 提供認證狀態和使用者資訊
 * - Toast 通知系統 - 全域 Toast 通知元件（shadcn/ui）
 * - 語言驗證 - 檢查語言參數是否在支援列表中，否則返回 404
 * - 動態 lang 屬性 - 透過 Script 設定 <html lang="...">
 *
 * @providers
 * - SessionProvider - NextAuth.js 認證狀態管理
 * - NextIntlClientProvider - next-intl 國際化 Provider
 * - TRPCProvider - tRPC Client Provider（包含 React Query）
 * - Toaster - shadcn/ui Toast 通知元件
 *
 * @dependencies
 * - `next-intl` - 國際化框架（NextIntlClientProvider、getMessages）
 * - `next-auth/react` - NextAuth.js Client Provider
 * - `@/lib/trpc-provider` - tRPC Client Provider
 * - `@/components/ui/toaster` - shadcn/ui Toast 元件
 * - `@/components/providers/SessionProvider` - NextAuth Session Provider
 * - `@/i18n/routing` - i18n 路由設定（支援的語言列表）
 *
 * @related
 * - `apps/web/src/app/layout.tsx` - Root Layout（HTML 結構 + 字體）
 * - `apps/web/src/app/[locale]/page.tsx` - Locale 首頁
 * - `apps/web/src/i18n/routing.ts` - i18n 路由設定（定義 locales: ['en', 'zh-TW']）
 * - `apps/web/src/messages/en.json` - 英文翻譯檔案
 * - `apps/web/src/messages/zh-TW.json` - 繁體中文翻譯檔案
 *
 * @author IT Project Management Team
 * @since Epic 1 (Authentication) + Internationalization Implementation
 * @lastModified 2025-12-17 (FIX-096)
 *
 * @example
 * // 頁面結構
 * /zh-TW (Locale Layout - 此檔案)
 * ├── Script (設定 lang 屬性)
 * ├── GlobalProgress
 * └── SessionProvider
 *     └── NextIntlClientProvider
 *         └── TRPCProvider
 *             ├── {children} (實際頁面內容)
 *             └── Toaster (全域 Toast 通知)
 */

import { Suspense } from 'react';
import Script from 'next/script';
import { TRPCProvider } from '@/lib/trpc-provider';
import { Toaster } from '@/components/ui/toaster';
import { GlobalProgress } from '@/components/ui/loading';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { SessionExpiryWatcher } from '@/components/providers/SessionExpiryWatcher';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

// 生成靜態參數用於預渲染
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // 驗證語言是否在支援列表中
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // 🔧 FIX-060: 明確傳遞 locale 參數給 getMessages()
  const messages = await getMessages({ locale });

  // FIX-096: 不再渲染 <html> 和 <body>，改用 Script 設定 lang 屬性
  // RootLayout 已經渲染了 <html> 和 <body>
  return (
    <>
      {/* FIX-096: 動態設定 <html lang="..."> 屬性 */}
      <Script
        id="set-html-lang"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang = "${locale}";`,
        }}
      />

      {/* FEAT-012: 全局導航進度條 - 需要 Suspense 包裹以支援 useSearchParams */}
      <Suspense fallback={null}>
        <GlobalProgress />
      </Suspense>

      <SessionProvider>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {/* FIX-142: 監聽 session 過期並導向登入頁（須在 NextIntlClientProvider 內以使用 i18n） */}
          <SessionExpiryWatcher />
          <TRPCProvider>
            {children}
            <Toaster />
          </TRPCProvider>
        </NextIntlClientProvider>
      </SessionProvider>
    </>
  );
}
