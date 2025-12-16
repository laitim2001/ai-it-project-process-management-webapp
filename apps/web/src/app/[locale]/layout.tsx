/**
 * @fileoverview Locale Layout - 國際化應用主 Layout（包含所有 Providers）
 * @description Next.js App Router 的完整應用 Layout，整合 i18n、Theme、tRPC、Session 管理
 *
 * 此 Layout 為實際應用程式的主要 Layout，負責初始化所有應用層級的 Providers 和設定。
 * 支援多語言（next-intl）、深色模式（Theme）、型別安全 API（tRPC）、認證（NextAuth）。
 * 所有 `[locale]/*` 路徑下的頁面都會被此 Layout 包裹。
 *
 * @layout
 * @route /[locale]/*
 *
 * @features
 * - 國際化支援 (next-intl) - 支援繁體中文（zh-TW）和英文（en）
 * - 深色模式支援 (Theme Provider) - 支援 Light/Dark/System 三種模式
 * - tRPC Provider - 提供端到端型別安全的 API 呼叫
 * - NextAuth Session Provider - 提供認證狀態和使用者資訊
 * - Toast 通知系統 - 全域 Toast 通知元件（shadcn/ui）
 * - Google Inter 字體 - 優化的 Latin 字元集字體
 * - 語言驗證 - 檢查語言參數是否在支援列表中，否則返回 404
 *
 * @metadata
 * - title: 'IT Project Management Platform'
 * - description: 'Centralized workflow management from budget allocation to expense charge-out'
 *
 * @providers
 * - SessionProvider - NextAuth.js 認證狀態管理
 * - NextIntlClientProvider - next-intl 國際化 Provider
 * - TRPCProvider - tRPC Client Provider（包含 React Query）
 * - Toaster - shadcn/ui Toast 通知元件
 *
 * @dependencies
 * - `next` - Next.js 框架（Metadata、字體）
 * - `next-intl` - 國際化框架（NextIntlClientProvider、getMessages）
 * - `next-auth/react` - NextAuth.js Client Provider
 * - `@/lib/trpc-provider` - tRPC Client Provider
 * - `@/components/ui/toaster` - shadcn/ui Toast 元件
 * - `@/components/providers/SessionProvider` - NextAuth Session Provider
 * - `@/i18n/routing` - i18n 路由設定（支援的語言列表）
 *
 * @related
 * - `apps/web/src/app/page.tsx` - 根路徑（重定向至此 Layout 的 `/zh-TW`）
 * - `apps/web/src/app/[locale]/page.tsx` - Locale 首頁（使用此 Layout）
 * - `apps/web/src/i18n/routing.ts` - i18n 路由設定（定義 locales: ['en', 'zh-TW']）
 * - `apps/web/src/messages/en.json` - 英文翻譯檔案
 * - `apps/web/src/messages/zh-TW.json` - 繁體中文翻譯檔案
 * - `apps/web/src/lib/trpc-provider.tsx` - tRPC Provider 實作
 * - `apps/web/src/components/providers/SessionProvider.tsx` - Session Provider 實作
 *
 * @author IT Project Management Team
 * @since Epic 1 (Authentication) + Internationalization Implementation
 *
 * @example
 * // 頁面結構
 * /zh-TW (Locale Layout - 此檔案)
 * ├── SessionProvider
 * │   └── NextIntlClientProvider
 * │       └── TRPCProvider
 * │           ├── {children} (實際頁面內容)
 * │           └── Toaster (全域 Toast 通知)
 *
 * @example
 * // 語言切換流程
 * 使用者點擊語言切換按鈕 → 路由改變至 /en → 此 Layout 重新渲染
 * → getMessages({ locale: 'en' }) 載入英文翻譯
 * → NextIntlClientProvider 更新翻譯上下文
 * → 所有子元件自動顯示英文
 *
 * @example
 * // FIX-060 修復說明
 * // 之前：const messages = await getMessages(); (未明確傳遞 locale)
 * // 問題：可能無法正確獲取當前語言的翻譯
 * // 修復：const messages = await getMessages({ locale }); (明確傳遞 locale)
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import { Suspense } from 'react';
import { TRPCProvider } from '@/lib/trpc-provider';
import { Toaster } from '@/components/ui/toaster';
import { GlobalProgress } from '@/components/ui/loading';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'IT Project Management Platform',
  description:
    'Centralized workflow management from budget allocation to expense charge-out',
};

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
  // 之前：const messages = await getMessages();
  // 問題：getMessages() 可能沒有正確獲取當前 locale
  // 修復：明確傳遞 { locale } 參數
  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <body className={inter.className}>
        {/* FEAT-012: 全局導航進度條 - 需要 Suspense 包裹以支援 useSearchParams */}
        <Suspense fallback={null}>
          <GlobalProgress />
        </Suspense>

        <SessionProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <TRPCProvider>
              {children}
              <Toaster />
            </TRPCProvider>
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
