/**
 * NextAuth.js v5 API Route Handler
 *
 * Next.js 14 App Router 的 NextAuth API 路由
 * 處理所有認證相關的請求：登入、登出、session 管理等
 *
 * @see https://authjs.dev/reference/nextjs
 */

import { handlers } from '../../../auth';

/**
 * NextAuth v5 Handler
 * 直接導出 GET 和 POST handlers
 */
export const { GET, POST } = handlers;
