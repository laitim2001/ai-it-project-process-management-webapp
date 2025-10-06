/**
 * NextAuth SessionProvider 包裝器
 *
 * 客戶端組件，用於在整個應用中提供 NextAuth session 上下文
 * 必須在 'use client' 環境中使用
 */

'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
