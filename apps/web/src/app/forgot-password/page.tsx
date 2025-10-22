/**
 * 忘記密碼頁面
 *
 * 功能：
 * - 輸入 Email 發送重設密碼連結
 * - 顯示發送成功訊息
 * - 返回登錄頁面
 *
 * TODO: 根據 Azure AD B2C 配置實現完整密碼重設流程
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

export default function ForgotPasswordPage() {
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
      setError('發送重設連結失敗，請確認 Email 地址是否正確');
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
              重設連結已發送
            </CardTitle>
            <CardDescription className="text-sm">
              請檢查您的 Email 信箱
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              我們已將密碼重設連結發送至您的 Email 地址：
            </p>
            <p className="text-center font-medium">{email}</p>
            <p className="text-center text-sm text-muted-foreground">
              請點擊連結中的按鈕以重設您的密碼。如果沒有收到郵件，請檢查垃圾郵件資料夾。
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button className="w-full">返回登錄頁面</Button>
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
            忘記密碼
          </CardTitle>
          <CardDescription className="text-sm">
            輸入您的 Email 地址，我們將發送重設密碼連結
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <p className="text-xs text-muted-foreground">
                我們將發送重設連結至這個 Email 地址
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
              {isLoading ? '發送中...' : '發送重設連結'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            <span className="text-muted-foreground">記起密碼了？</span>{' '}
            <Link
              href="/login"
              className="text-primary font-medium hover:underline"
            >
              返回登錄
            </Link>
          </div>
          <div className="text-center text-sm">
            <span className="text-muted-foreground">還沒有帳號？</span>{' '}
            <Link
              href="/register"
              className="text-primary font-medium hover:underline"
            >
              立即註冊
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
