/**
 * NextAuth.js API Route Handler
 *
 * 這個檔案處理所有 NextAuth.js 的認證路由
 * 路徑: /api/auth/*
 */

import NextAuth from 'next-auth';
import { authOptions } from '@itpm/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
