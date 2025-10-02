import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { TRPCProvider } from '@/lib/trpc-provider';
import { ToastProvider } from '@/components/ui/Toast';

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
    <html lang="zh-TW">
      <body className={inter.className}>
        <TRPCProvider>
          <ToastProvider>{children}</ToastProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
