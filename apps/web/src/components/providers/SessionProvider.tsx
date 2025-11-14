/**
 * @fileoverview NextAuth SessionProvider 包裝器組件
 *
 * @description
 * 客戶端 React 組件，封裝 NextAuth.js 的 SessionProvider 用於全應用 session 上下文管理。
 * 必須在 'use client' 環境中使用，通常放置在根 layout 或主要布局組件中。
 *
 * @module apps/web/src/components/providers/SessionProvider
 * @component SessionProvider
 * @author IT Department
 * @since Epic 1 - Story 1.3 (Azure AD B2C Integration)
 * @lastModified 2025-11-14
 *
 * @features
 * - 全應用 NextAuth session 上下文
 * - 客戶端 session 狀態管理
 * - 支援 useSession hook
 *
 * @dependencies
 * - next-auth/react - NextAuth.js React hooks 和 providers
 *
 * @related
 * - ../../auth.ts - NextAuth 配置
 * - ../../app/[locale]/layout.tsx - 主要布局（使用此組件）
 *
 * @example
 * ```tsx
 * // 在根布局中使用
 * import { SessionProvider } from '@/components/providers/SessionProvider';
 *
 * export default function RootLayout({ children }: { children: ReactNode }) {
 *   return (
 *     <html>
 *       <body>
 *         <SessionProvider>
 *           {children}
 *         </SessionProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
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
