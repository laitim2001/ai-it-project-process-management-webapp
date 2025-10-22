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
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

export default function RegisterPage() {
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
      setError('密碼與確認密碼不一致');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('密碼長度至少需要 8 個字元');
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
      setError('註冊失敗，請稍後再試');
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
              註冊成功！
            </CardTitle>
            <CardDescription className="text-sm">
              您的帳號已成功建立
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              請點擊下方按鈕前往登錄頁面
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button className="w-full">前往登錄</Button>
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
            建立新帳號
          </CardTitle>
          <CardDescription className="text-sm">
            填寫以下資訊以註冊 IT 專案管理平台
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {/* 姓名 */}
            <div className="space-y-2">
              <Label htmlFor="name">姓名</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                placeholder="請輸入您的姓名"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email 地址</Label>
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

            {/* 密碼 */}
            <div className="space-y-2">
              <Label htmlFor="password">密碼</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                placeholder="至少 8 個字元"
              />
            </div>

            {/* 確認密碼 */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">確認密碼</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                placeholder="再次輸入密碼"
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
              {isLoading ? '註冊中...' : '註冊'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            <span className="text-muted-foreground">已經有帳號？</span>{' '}
            <Link
              href="/login"
              className="text-primary font-medium hover:underline"
            >
              立即登錄
            </Link>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            註冊即表示您同意我們的服務條款和隱私政策
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
