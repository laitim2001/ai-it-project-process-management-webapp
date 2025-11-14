/**
 * @fileoverview NextAuth.js API Route Handler - 認證服務統一進入點
 * @description NextAuth.js v5 的 API Route Handler，處理所有認證相關請求
 *
 * 此檔案為 NextAuth.js 在 Next.js App Router 中的標準 API 路由處理器，
 * 負責處理所有與認證相關的 HTTP 請求，包括登入、登出、Session 管理等。
 *
 * @api
 * @method GET, POST
 * @route /api/auth/[...nextauth]
 *
 * @features
 * - Azure AD B2C 單一登入 (SSO) - 企業用戶通過 Azure AD B2C 進行身份驗證
 * - 本地帳號認證 (Email/Password) - 開發環境使用 bcrypt 加密密碼驗證
 * - Session 管理 (JWT Strategy) - 使用 JWT Token 進行無狀態 Session 管理
 * - OAuth 2.0 Provider 整合 - 支援 Azure AD B2C OAuth 2.0 流程
 * - 自動 CSRF 保護 - NextAuth.js 內建 CSRF Token 驗證
 *
 * @security
 * - NEXTAUTH_SECRET 環境變數用於 JWT 簽章和加密
 * - Azure AD B2C OAuth 2.0 標準流程（Authorization Code Flow）
 * - Session Token 有效期：24 小時（NEXTAUTH_SESSION_MAX_AGE）
 * - 支援 HTTP-Only Cookies（防止 XSS 攻擊）
 * - 自動處理 OAuth State Parameter（防止 CSRF）
 *
 * @dependencies
 * - `@auth/core` - NextAuth.js v5 核心邏輯
 * - `apps/web/src/auth.ts` - NextAuth.js 配置檔案（包含 providers、callbacks）
 *
 * @related
 * - `apps/web/src/auth.ts` - NextAuth.js 主要配置（Azure AD B2C、Credentials Provider）
 * - `packages/auth/src/index.ts` - 認證相關共用邏輯和類型定義
 * - `apps/web/src/app/[locale]/login/page.tsx` - 登入頁面 UI
 * - `apps/web/src/components/providers/SessionProvider.tsx` - Client-side Session Provider
 *
 * @author IT Project Management Team
 * @since Epic 1 - Azure AD B2C Authentication
 * @see https://authjs.dev/reference/nextjs
 * @see https://learn.microsoft.com/zh-tw/azure/active-directory-b2c/
 *
 * @example
 * // 前端呼叫登入
 * import { signIn } from 'next-auth/react';
 * await signIn('azure-ad-b2c'); // Azure AD B2C 登入
 * await signIn('credentials', { email, password }); // 本地帳號登入
 *
 * @example
 * // 前端呼叫登出
 * import { signOut } from 'next-auth/react';
 * await signOut({ callbackUrl: '/login' });
 *
 * @example
 * // 取得當前 Session（Server Component）
 * import { auth } from '@/auth';
 * const session = await auth();
 * console.log(session?.user);
 */

import { handlers } from '../../../../auth';

/**
 * NextAuth.js GET Handler
 * 處理 GET 請求（如 Session 查詢、OAuth Callback）
 * @type {import('next/server').NextApiHandler}
 */
export const GET = handlers.GET;

/**
 * NextAuth.js POST Handler
 * 處理 POST 請求（如登入、登出、Credentials 驗證）
 * @type {import('next/server').NextApiHandler}
 */
export const POST = handlers.POST;
