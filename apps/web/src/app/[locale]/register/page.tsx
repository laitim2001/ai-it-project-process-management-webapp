/**
 * @fileoverview Register Page - 註冊頁面
 *
 * @description
 * 提供用戶註冊功能的頁面，支援姓名、Email 和密碼註冊。
 * 目前為 MVP 版本，使用模擬 API，未來將整合 Azure AD B2C 註冊流程。
 * 包含完整的表單驗證（Email 格式、密碼強度、密碼確認）和友好的用戶引導。
 *
 * @page /[locale]/register
 *
 * @features
 * - 用戶資訊輸入（姓名、Email、密碼、確認密碼）
 * - 即時表單驗證（密碼匹配、密碼長度）
 * - 註冊成功狀態頁面
 * - 自動跳轉到登入頁面
 * - 登入頁面連結
 * - 使用條款提示
 * - 錯誤處理和用戶提示
 *
 * @routing
 * - 當前頁: /register
 * - 成功後: /login
 * - 登入: /login
 *
 * @stateManagement
 * - React State: email, password, confirmPassword, name, isLoading, error, success
 * - Form State: 表單輸入和驗證狀態
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - shadcn/ui: Card, Button, Input, Label
 * - @/i18n/routing: 國際化路由
 *
 * @related
 * - apps/web/src/app/[locale]/login/page.tsx - 登入頁面
 * - apps/web/src/app/[locale]/forgot-password/page.tsx - 忘記密碼頁面
 * - apps/web/src/messages/en.json - 英文翻譯
 * - apps/web/src/messages/zh-TW.json - 繁體中文翻譯
 *
 * @validation
 * - Email: 必填，格式驗證
 * - 密碼: 必填，最少 8 字元
 * - 確認密碼: 必填，必須與密碼相同
 * - 姓名: 必填
 *
 * @todo
 * - 整合 Azure AD B2C 註冊流程
 * - 實作註冊 API 端點
 * - 添加 Email 驗證功能
 * - 添加密碼強度檢查器
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

export default function RegisterPage() {
  const t = useTranslations('auth.register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  /**
   * 處理註冊表單提交
   */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // 基本驗證
    if (password !== confirmPassword) {
      setError(t('errors.passwordMismatch'));
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError(t('errors.passwordTooShort'));
      setIsLoading(false);
      return;
    }

    try {
      // TODO: 實現註冊 API 調用
      // const result = await signUp({ email, password, name });

      // 模擬 API 調用
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess(true);
    } catch (err) {
      setError(t('errors.registerFailed'));
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
          </CardContent>
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button className="w-full">{t('goToLogin')}</Button>
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
          <form onSubmit={handleRegister} className="space-y-4">
            {/* 姓名 */}
            <div className="space-y-2">
              <Label htmlFor="name">{t('name.label')}</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                placeholder={t('name.placeholder')}
              />
            </div>

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
            </div>

            {/* 密碼 */}
            <div className="space-y-2">
              <Label htmlFor="password">{t('password.label')}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                placeholder={t('password.placeholder')}
              />
            </div>

            {/* 確認密碼 */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('confirmPassword.label')}</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                placeholder={t('confirmPassword.placeholder')}
              />
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
              {isLoading ? t('registering') : t('registerButton')}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            <span className="text-muted-foreground">{t('hasAccount')}</span>{' '}
            <Link
              href="/login"
              className="text-primary font-medium hover:underline"
            >
              {t('loginNow')}
            </Link>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            {t('termsAgreement')}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
