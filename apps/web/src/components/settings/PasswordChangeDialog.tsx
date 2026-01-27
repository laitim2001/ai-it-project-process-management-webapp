/**
 * @fileoverview PasswordChangeDialog - 密碼設定/變更對話框
 *
 * @description
 * 提供使用者自助設定或變更本機密碼的 Dialog 組件。
 * 支援兩種模式：
 * - 首次設定（SSO 使用者）：不需要輸入舊密碼
 * - 變更密碼（已有密碼）：需要驗證舊密碼
 *
 * @component PasswordChangeDialog
 *
 * @features
 * - 設定/變更密碼雙模式
 * - 密碼強度即時驗證（PasswordStrengthIndicator）
 * - 密碼顯示/隱藏切換（PasswordInput）
 * - tRPC mutation 整合
 * - i18n 國際化支援
 * - Toast 操作回饋
 *
 * @dependencies
 * - @/components/ui/dialog
 * - @/components/ui/password-input
 * - @/components/ui/password-strength-indicator
 * - @/lib/trpc
 * - next-intl
 *
 * @related
 * - packages/api/src/routers/user.ts - changeOwnPassword API
 * - apps/web/src/components/settings/AuthMethodsCard.tsx
 * - apps/web/src/app/[locale]/settings/page.tsx
 *
 * @since CHANGE-041 - Dual Authentication Support
 */

'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { PasswordStrengthIndicator } from '@/components/ui/password-strength-indicator';
import { useToast } from '@/components/ui/use-toast';

interface PasswordChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 使用者是否已有密碼（決定是否顯示「目前密碼」欄位） */
  hasExistingPassword: boolean;
}

export function PasswordChangeDialog({
  open,
  onOpenChange,
  hasExistingPassword,
}: PasswordChangeDialogProps) {
  const t = useTranslations('settings.security.passwordDialog');
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const utils = api.useUtils();

  const mutation = api.user.changeOwnPassword.useMutation({
    onSuccess: (data) => {
      toast({
        title: data.isFirstTimeSet ? t('successSet') : t('successChange'),
        variant: 'success',
      });
      // 重新查詢認證狀態
      utils.user.getOwnAuthInfo.invalidate();
      handleClose();
    },
    onError: (err) => {
      // 將後端錯誤映射到 i18n 訊息
      const message = err.message;
      if (message.includes('目前密碼不正確')) {
        setError(t('errorCurrentIncorrect'));
      } else if (message.includes('新密碼不一致')) {
        setError(t('errorMismatch'));
      } else if (message.includes('密碼長度') || message.includes('密碼需包含')) {
        setError(t('errorTooWeak'));
      } else {
        setError(message);
      }
    },
  });

  const handleClose = useCallback(() => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

      // 前端驗證
      if (hasExistingPassword && !currentPassword) {
        setError(t('errorCurrentRequired'));
        return;
      }
      if (newPassword !== confirmPassword) {
        setError(t('errorMismatch'));
        return;
      }

      mutation.mutate({
        currentPassword: hasExistingPassword ? currentPassword : undefined,
        newPassword,
        confirmPassword,
      });
    },
    [hasExistingPassword, currentPassword, newPassword, confirmPassword, mutation, t]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {hasExistingPassword ? t('changeTitle') : t('setTitle')}
          </DialogTitle>
          <DialogDescription>
            {hasExistingPassword ? t('changeDescription') : t('setDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 目前密碼（僅已有密碼時顯示） */}
          {hasExistingPassword && (
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t('currentPassword')}</Label>
              <PasswordInput
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          )}

          {/* 新密碼 */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('newPassword')}</Label>
            <PasswordInput
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
            <PasswordStrengthIndicator password={newPassword} />
          </div>

          {/* 確認新密碼 */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
            <PasswordInput
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={mutation.isLoading}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isLoading}>
              {mutation.isLoading ? '...' : t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
