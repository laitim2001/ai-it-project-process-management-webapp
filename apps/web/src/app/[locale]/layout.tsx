import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import { TRPCProvider } from '@/lib/trpc-provider';
import { Toaster } from '@/components/ui/toaster';
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

  // 獲取對應語言的翻譯文件
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <SessionProvider>
          <NextIntlClientProvider messages={messages}>
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
