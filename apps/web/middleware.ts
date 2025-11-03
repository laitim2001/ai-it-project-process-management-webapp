/**
 * Next.js Middleware - i18n only (testing)
 */

import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

export default createIntlMiddleware(routing);

export const config = {
  // 匹配所有路徑，除了：
  // - api: API 路由
  // - _next: Next.js 內部路徑
  // - _vercel: Vercel 平台路徑
  // - .*\..*: 靜態文件
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
