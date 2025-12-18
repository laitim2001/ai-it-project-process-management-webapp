/**
 * @fileoverview Login Page - 登入頁面
 *
 * @description
 * 提供雙認證登入功能的頁面，支援 Azure AD (Microsoft Entra ID) SSO 和 Email/Password 憑證登入。
 * 整合 NextAuth.js 進行會話管理，包含完整的表單驗證、錯誤處理和用戶引導。
 * 登入成功後自動重定向到指定的回調 URL 或預設的儀表板頁面。
 *
 * @page /[locale]/login
 *
 * @features
 * - Azure AD (Microsoft Entra ID) SSO 登入（企業用戶）
 * - Email/Password 憑證登入（本地開發用戶）
 * - 即時表單驗證（Email 格式、密碼長度）
 * - 客戶端和伺服器端雙重驗證
 * - 詳細錯誤訊息處理（區分配置錯誤、憑證錯誤等）
 * - 自動重定向到回調 URL
 *
 * @changelog
 * - CHANGE-033 (2025-12-18): 簡化登入頁面，移除忘記密碼、註冊連結和使用條款提示
 *
 * @permissions
 * - Public: 所有用戶可訪問
 *
 * @routing
 * - 當前頁: /login
 * - 成功後: callbackUrl 或 /dashboard
 * - 忘記密碼: /forgot-password
 * - 註冊: /register
 *
 * @stateManagement
 * - React State: email, password, isLoading, error
 * - NextAuth Session: 登入狀態和用戶資訊
 * - URL Search Params: callbackUrl（登入後返回的頁面）
 *
 * @dependencies
 * - next-auth/react: NextAuth.js 客戶端函數（signIn）
 * - next-intl: 國際化支援
 * - shadcn/ui: Card, Button, Input, Label
 * - @/i18n/routing: 國際化路由
 *
 * @related
 * - packages/auth/src/index.ts - NextAuth.js 認證配置
 * - apps/web/src/app/[locale]/register/page.tsx - 註冊頁面
 * - apps/web/src/app/[locale]/forgot-password/page.tsx - 忘記密碼頁面
 * - apps/web/src/middleware.ts - 認證中介軟體
 *
 * @security
 * - Email/Password 透過 HTTPS 傳輸
 * - 密碼不在客戶端明文儲存
 * - 錯誤訊息不洩露用戶是否存在（安全實踐）
 * - Azure AD 使用 OAuth 2.0 + OpenID Connect
 *
 * @author IT Department
 * @since Epic 1 - Azure AD Authentication
 * @lastModified 2025-11-14 (Updated from Azure AD B2C to Azure AD)
 */

'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('auth.login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 取得回調 URL（登入後要返回的頁面）
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  /**
   * 處理憑證登入（Email + Password）
   */
  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // 客戶端輸入驗證 - 提供即時反饋
    if (!email || !password) {
      setError(t('errors.emailPasswordRequired'));
      setIsLoading(false);
      return;
    }

    // Email 格式驗證
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('errors.invalidEmailFormat'));
      setIsLoading(false);
      return;
    }

    // 密碼長度驗證
    if (password.length < 6) {
      setError(t('errors.passwordTooShort'));
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔐 開始登入流程', { email, callbackUrl });

      // 使用 redirect: false 先獲取結果，然後手動重定向
      const result = await signIn('credentials', {
        email,
        password,
        callbackUrl,
        redirect: false,
      });

      console.log('📊 signIn 結果:', result);

      if (result?.error) {
        console.error('❌ 登入錯誤:', result.error);

        // 根據錯誤類型提供具體的錯誤訊息
        let errorMessage = t('errors.invalidCredentials');

        if (result.error === 'Configuration') {
          errorMessage = t('errors.configurationError');
        } else if (result.error === 'AccessDenied') {
          errorMessage = t('errors.accessDenied');
        } else if (result.error === 'Verification') {
          errorMessage = t('errors.verificationRequired');
        } else if (result.error === 'CredentialsSignin') {
          // NextAuth 的憑證登入錯誤
          // 注意：為了安全，後端不區分"用戶不存在"和"密碼錯誤"
          errorMessage = t('errors.invalidCredentials');
        } else {
          errorMessage = t('errors.loginFailed');
        }

        setError(errorMessage);
        setIsLoading(false);
      } else if (result?.ok) {
        console.log('✅ 登入成功');
        console.log('📍 result.url:', result.url);
        console.log('📍 callbackUrl:', callbackUrl);

        // 登入成功，使用 router.push 重定向到 callbackUrl（忽略 result.url）
        console.log('🔄 重定向到:', callbackUrl);
        router.push(callbackUrl);
      }
    } catch (err) {
      console.error('💥 登入異常:', err);
      setError(t('errors.loginFailed'));
      setIsLoading(false);
    }
  };

  /**
   * 處理 Azure AD (Microsoft Entra ID) SSO 登入
   */
  const handleAzureLogin = () => {
    setIsLoading(true);
    signIn('azure-ad', { callbackUrl });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            {t('title')}
          </CardTitle>
          <CardDescription className="text-sm">
            {t('description')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Azure AD (Microsoft Entra ID) SSO 登入按鈕 */}
          {/* 移除環境變數檢查以避免 hydration mismatch - 按鈕始終顯示 */}
          <>
            <Button
              type="button"
              onClick={handleAzureLogin}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"
                />
              </svg>
              {t('azureLogin')}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card px-2 text-muted-foreground">{t('orDivider')}</span>
              </div>
            </div>
          </>

          {/* Email/Password 登入表單 */}
          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                {t('email.label')}
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                placeholder={t('email.placeholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                {t('password.label')}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                placeholder={t('password.placeholder')}
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? t('loggingIn') : t('loginButton')}
            </Button>
          </form>
        </CardContent>

      </Card>
    </div>
  );
}
