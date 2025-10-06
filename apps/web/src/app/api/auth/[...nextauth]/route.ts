/**
 * NextAuth.js API Route Handler
 *
 * Next.js 14 App Router 的 NextAuth API 路由
 * 處理所有認證相關的請求：登入、登出、session 管理等
 *
 * @see https://next-auth.js.org/configuration/initialization#route-handlers-app
 */

import NextAuth from 'next-auth';
import { authOptions } from '@itpm/auth';

/**
 * NextAuth Handler
 * 處理 GET 和 POST 請求
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
