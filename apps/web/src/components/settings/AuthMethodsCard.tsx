/**
 * @fileoverview AuthMethodsCard - 認證方式狀態卡片
 *
 * @description
 * 顯示使用者已連結的認證方式及其狀態。
 * 包含 Azure AD SSO 和本機密碼兩種認證方式的狀態顯示，
 * 以及密碼管理（設定/變更）功能的入口。
 *
 * @component AuthMethodsCard
 *
 * @features
 * - Azure AD SSO 狀態顯示（根據環境配置）
 * - 本機密碼狀態顯示（已設定/未設定）
 * - 設定/變更密碼按鈕
 * - 雙認證說明資訊
 * - i18n 國際化支援
 *
 * @dependencies
 * - @/components/ui/card
 * - @/components/ui/badge
 * - @/components/ui/button
 * - @/lib/trpc
 * - next-intl
 *
 * @related
 * - packages/api/src/routers/user.ts - getOwnAuthInfo API
 * - apps/web/src/components/settings/PasswordChangeDialog.tsx
 * - apps/web/src/app/[locale]/settings/page.tsx
 *
 * @since CHANGE-041 - Dual Authentication Support
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, KeyRound, Globe } from 'lucide-react';
import { PasswordChangeDialog } from './PasswordChangeDialog';

export function AuthMethodsCard() {
  const t = useTranslations('settings.security');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: authInfo, isLoading } = api.user.getOwnAuthInfo.useQuery();

  const hasPassword = authInfo?.hasPassword ?? false;

  return (
    <>
      {/* 認證方式 Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('authMethods.title')}
          </CardTitle>
          <CardDescription>
            {t('authMethods.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Azure AD SSO */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">{t('authMethods.azureAd')}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              {t('authMethods.azureAdAvailable')}
            </Badge>
          </div>

          {/* 本機密碼 */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <KeyRound className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{t('authMethods.localPassword')}</p>
              </div>
            </div>
            {isLoading ? (
              <Badge variant="outline">...</Badge>
            ) : hasPassword ? (
              <Badge variant="default">{t('authMethods.passwordSet')}</Badge>
            ) : (
              <Badge variant="secondary">{t('authMethods.passwordNotSet')}</Badge>
            )}
          </div>

          {/* 說明文字 */}
          <p className="text-xs text-muted-foreground">
            {t('authMethods.dualAuthInfo')}
          </p>
        </CardContent>
      </Card>

      {/* 密碼管理 Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            {t('passwordManagement.title')}
          </CardTitle>
          <CardDescription>
            {hasPassword
              ? t('passwordManagement.changeDescription')
              : t('passwordManagement.setDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => setDialogOpen(true)}
            disabled={isLoading}
          >
            {hasPassword
              ? t('passwordManagement.changeButton')
              : t('passwordManagement.setButton')}
          </Button>
        </CardContent>
      </Card>

      {/* 密碼設定/變更 Dialog */}
      <PasswordChangeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        hasExistingPassword={hasPassword}
      />
    </>
  );
}
