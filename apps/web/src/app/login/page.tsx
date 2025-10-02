/**
 * 登入頁面
 *
 * 提供用戶使用 Email 和密碼登入系統
 */

'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

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
      setError('登入時發生錯誤，請稍後再試');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="rounded-xl bg-white p-8 shadow-card">
          {/* Logo and Title */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h1 className="text-h2 text-neutral-950">IT 專案流程管理平台</h1>
            <p className="mt-2 text-body text-neutral-700">請使用您的帳號登入系統</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <p className="text-body-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-body-sm font-medium text-neutral-900 mb-2">
                  Email 地址
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-body text-neutral-950 placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-colors disabled:bg-neutral-100 disabled:cursor-not-allowed"
                  placeholder="user@example.com"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-body-sm font-medium text-neutral-900 mb-2">
                  密碼
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-body text-neutral-950 placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-colors disabled:bg-neutral-100 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-primary-500 px-4 py-2.5 text-body font-semibold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:bg-primary-300 disabled:cursor-not-allowed"
            >
              {isLoading ? '登入中...' : '登入'}
            </button>
          </form>

          {/* Test Accounts */}
          <div className="mt-6 rounded-lg bg-neutral-50 p-4">
            <p className="text-caption font-medium text-neutral-700 mb-2">測試帳號：</p>
            <div className="space-y-1 text-caption text-neutral-600 font-mono">
              <p>admin@itpm.local / admin123 <span className="text-neutral-500">(管理員)</span></p>
              <p>pm@itpm.local / pm123 <span className="text-neutral-500">(專案經理)</span></p>
              <p>supervisor@itpm.local / supervisor123 <span className="text-neutral-500">(主管)</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          載入中...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
