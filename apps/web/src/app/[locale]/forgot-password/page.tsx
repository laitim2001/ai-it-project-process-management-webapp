/**
 * @fileoverview Forgot Password Page - 忘記密碼頁面
 *
 * @description
 * 提供密碼重設功能的頁面，用戶輸入 Email 後接收密碼重設連結。
 * 目前為 MVP 版本，使用模擬 API，未來將整合 Azure AD B2C 密碼重設流程。
 * 包含表單驗證、發送成功提示和友好的用戶引導。
 *
 * @page /[locale]/forgot-password
 *
 * @features
 * - Email 輸入表單（含即時驗證）
 * - 發送密碼重設郵件（目前為模擬）
 * - 發送成功狀態頁面
 * - 返回登入頁面導航
 * - 註冊頁面連結
 * - 錯誤處理和用戶提示
 *
 * @routing
 * - 當前頁: /forgot-password
 * - 返回: /login
 * - 註冊: /register
 *
 * @stateManagement
 * - React State: email, isLoading, error, success
 * - Form State: 表單輸入和驗證狀態
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - shadcn/ui: Card, Button, Input, Label
 * - @/i18n/routing: 國際化路由
 *
 * @related
 * - apps/web/src/app/[locale]/login/page.tsx - 登入頁面
 * - apps/web/src/app/[locale]/register/page.tsx - 註冊頁面
 * - apps/web/src/messages/en.json - 英文翻譯
 * - apps/web/src/messages/zh-TW.json - 繁體中文翻譯
 *
 * @todo
 * - 整合 Azure AD B2C 密碼重設流程
 * - 實作密碼重設 API 端點
 * - 添加郵件發送功能（SendGrid）
 *
 * @author IT Department
 * @since Post-MVP - User Management Enhancement
 * @lastModified 2025-11-14
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from "@/i18n/routing";
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  /**
   * 處理忘記密碼表單提交
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // TODO: 實現密碼重設 API 調用
      // const result = await sendPasswordResetEmail({ email });

      // 模擬 API 調用
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess(true);
    } catch (err) {
      setError(t('errors.sendFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold tracking-tight">
              {t('successTitle')}
            </CardTitle>
            <CardDescription className="text-sm">
              {t('successDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              {t('successMessage')}
            </p>
            <p className="text-center font-medium">{email}</p>
            <p className="text-center text-sm text-muted-foreground">
              {t('checkSpam')}
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button className="w-full">{t('backToLogin')}</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

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

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">{t('email.label')}</Label>
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
              <p className="text-xs text-muted-foreground">
                {t('email.hint')}
              </p>
            </div>

            {/* 錯誤訊息 */}
            {error && (
              <div className="rounded-md bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* 提交按鈕 */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? t('sending') : t('sendButton')}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            <span className="text-muted-foreground">{t('rememberedPassword')}</span>{' '}
            <Link
              href="/login"
              className="text-primary font-medium hover:underline"
            >
              {t('backToLogin')}
            </Link>
          </div>
          <div className="text-center text-sm">
            <span className="text-muted-foreground">{t('noAccount')}</span>{' '}
            <Link
              href="/register"
              className="text-primary font-medium hover:underline"
            >
              {t('registerNow')}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
