/**
 * @fileoverview tRPC Provider Component - tRPC 提供者組件
 *
 * @description
 * 配置並提供 tRPC 客戶端和 React Query 的 Context，
 * 讓整個 React 應用程式都能使用 tRPC API 和資料快取功能。
 * 處理客戶端/伺服器端 URL 差異和 HTTP 批次請求配置。
 *
 * @component TRPCProvider
 *
 * @features
 * - tRPC 客戶端初始化（httpBatchLink 批次請求）
 * - React Query 快取配置（資料持久化和背景更新）
 * - Superjson 序列化（支援 Date, BigInt, Map, Set 等）
 * - 環境自適應 URL（本地開發 / Vercel 部署）
 * - SSR 支援（客戶端和伺服器端分離）
 *
 * @props
 * @param {Object} props - 組件屬性
 * @param {React.ReactNode} props.children - 子組件（整個應用程式）
 *
 * @example
 * ```tsx
 * // 在根 layout.tsx 中使用
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <TRPCProvider>
 *           {children}
 *         </TRPCProvider>
 *       </body>
 *     </html>
 *   );
 * }
 *
 * // 子組件中自動可用 tRPC
 * function ProjectList() {
 *   const { data } = api.project.getAll.useQuery(); // 直接使用
 * }
 * ```
 *
 * @dependencies
 * - @tanstack/react-query: React Query 核心庫
 * - @trpc/client: tRPC 客戶端核心
 * - superjson: 序列化庫（處理特殊型別）
 * - ./trpc: tRPC React 客戶端實例
 *
 * @related
 * - apps/web/src/lib/trpc.ts - tRPC 客戶端實例
 * - apps/web/src/app/[locale]/layout.tsx - Provider 使用位置
 * - apps/web/src/app/api/trpc/[trpc]/route.ts - tRPC HTTP 處理器
 * - packages/api/src/root.ts - AppRouter 定義
 *
 * @author IT Department
 * @since Epic 1 - Platform Foundation
 * @lastModified 2025-11-14
 *
 * @notes
 * - QueryClient 和 trpcClient 使用 useState 確保每個應用實例獨立
 * - httpBatchLink 會自動合併短時間內的多個查詢為單一請求
 * - getBaseUrl() 處理不同環境的 API endpoint 差異
 * - Superjson transformer 讓 Date 物件可以直接使用，無需手動轉換
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import superjson from 'superjson';

import { api } from './trpc';

/**
 * 取得 tRPC API 的基礎 URL
 *
 * @returns {string} API 端點 URL
 *
 * @description
 * 根據執行環境自動選擇正確的 API URL：
 * - 客戶端: 使用相對路徑（空字串），由瀏覽器自動拼接
 * - Vercel 部署: 使用 VERCEL_URL 環境變數
 * - 本地開發 SSR: 使用 localhost + PORT（預設 3000）
 *
 * @example
 * ```typescript
 * // 客戶端: getBaseUrl() → ""
 * // 實際請求: /api/trpc/project.getAll
 *
 * // Vercel SSR: getBaseUrl() → "https://myapp.vercel.app"
 * // 實際請求: https://myapp.vercel.app/api/trpc/project.getAll
 *
 * // 本地 SSR: getBaseUrl() → "http://localhost:3000"
 * // 實際請求: http://localhost:3000/api/trpc/project.getAll
 * ```
 */
function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

/**
 * TRPCProvider 組件
 *
 * @param {Object} props - 組件屬性
 * @param {React.ReactNode} props.children - 應用程式內容
 * @returns {JSX.Element} tRPC 和 React Query 提供者包裝的子組件
 *
 * @description
 * 創建並提供 tRPC 客戶端和 React Query 實例給整個應用程式。
 * 使用 useState 確保客戶端實例穩定（避免每次渲染重新建立）。
 */
export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    api.createClient({
      transformer: superjson,
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    })
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  );
}
