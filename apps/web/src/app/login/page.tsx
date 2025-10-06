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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError('登入失敗，請稍後再試');
    } finally {
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            IT 專案流程管理平台
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            請登入您的帳號以繼續
          </p>
        </div>

        <div className="mt-8 space-y-6 rounded-lg bg-white p-8 shadow">
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
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">或</span>
                </div>
              </div>
            </>
          )}

          {/* Email/Password 登入表單 */}
          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email 地址
              </label>
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
                className="mt-1"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密碼
              </label>
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
                className="mt-1"
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? '登入中...' : '登入'}
            </Button>
          </form>

          <p className="text-center text-xs text-gray-500">
            登入即表示您同意我們的服務條款和隱私政策
          </p>
        </div>
      </div>
    </div>
  );
}
