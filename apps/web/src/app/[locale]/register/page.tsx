/**
 * 註冊頁面
 *
 * 功能：
 * - 用戶註冊表單
 * - 表單驗證
 * - 註冊成功後重定向到登錄頁面
 *
 * TODO: 根據 Azure AD B2C 配置實現完整註冊流程
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from "@/i18n/routing";
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
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
