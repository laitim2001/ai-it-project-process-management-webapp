/**
 * 登入頁面
 *
 * Epic 1 - Story 1.3: 核心認證與用戶管理服務 - 註冊與登入功能
 *
 * 功能：
 * - 支援 Email/Password 憑證登入
 * - 支援 Azure AD B2C SSO 登入
 * - 表單驗證與錯誤處理
 * - 登入成功後重定向到儀表板
 */

'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      setError('請輸入 Email 和密碼');
      setIsLoading(false);
      return;
    }

    // Email 格式驗證
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Email 格式不正確，請檢查輸入');
      setIsLoading(false);
      return;
    }

    // 密碼長度驗證
    if (password.length < 6) {
      setError('密碼長度必須至少 6 個字元');
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
        let errorMessage = 'Email 或密碼錯誤';

        if (result.error === 'Configuration') {
          errorMessage = '系統配置錯誤，請聯繫管理員';
        } else if (result.error === 'AccessDenied') {
          errorMessage = '訪問被拒絕，您沒有權限登入';
        } else if (result.error === 'Verification') {
          errorMessage = '請先驗證您的 Email 地址';
        } else if (result.error === 'CredentialsSignin') {
          // NextAuth 的憑證登入錯誤
          // 注意：為了安全，後端不區分"用戶不存在"和"密碼錯誤"
          errorMessage = 'Email 或密碼錯誤，請檢查您的登入信息';
        } else {
          errorMessage = '登入失敗，請稍後再試';
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
      setError('登入失敗，請稍後再試');
      setIsLoading(false);
    }
  };

  /**
   * 處理 Azure AD B2C SSO 登入
   */
  const handleAzureLogin = () => {
    setIsLoading(true);
    signIn('azure-ad-b2c', { callbackUrl });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">
            IT 專案流程管理平台
          </CardTitle>
          <CardDescription className="text-sm">
            請登入您的帳號以繼續
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Azure AD B2C SSO 登入按鈕 */}
          {process.env.NEXT_PUBLIC_AZURE_AD_B2C_ENABLED === 'true' && (
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
                使用 Microsoft 帳號登入
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-card px-2 text-muted-foreground">或</span>
                </div>
              </div>
            </>
          )}

          {/* Email/Password 登入表單 */}
          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                Email 地址
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
                placeholder="user@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                密碼
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
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <a
                href="/forgot-password"
                className="text-primary hover:underline"
              >
                忘記密碼？
              </a>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? '登入中...' : '登入'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            <span className="text-muted-foreground">還沒有帳號？</span>{' '}
            <a
              href="/register"
              className="text-primary font-medium hover:underline"
            >
              立即註冊
            </a>
          </div>
          <p className="text-center text-xs text-muted-foreground w-full">
            登入即表示您同意我們的服務條款和隱私政策
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
