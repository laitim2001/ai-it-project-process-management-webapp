'use client';

/**
 * @fileoverview 使用者表單組件
 *
 * @description
 * 使用者（User）的新增和編輯表單組件，支援電子郵件、姓名、角色選擇和密碼設定。
 * 用於管理員進行使用者管理操作。
 *
 * @module apps/web/src/components/user/UserForm
 * @component UserForm
 * @author IT Department
 * @since Epic 1 - Story 1.4 (User Management)
 * @lastModified 2025-12-16
 *
 * @features
 * - 新增/編輯模式切換
 * - 電子郵件驗證（格式檢查）
 * - 角色選擇（ProjectManager, Supervisor, Admin）
 * - 密碼設定/更改（CHANGE-032）
 * - 密碼強度驗證和視覺指示器
 * - 表單驗證和錯誤提示
 * - tRPC mutation 整合（create, update, setPassword）
 * - 國際化支援（next-intl）
 *
 * @dependencies
 * - @/lib/trpc - tRPC client（user.create, user.update, user.getRoles, user.setPassword）
 * - next-intl - 國際化
 * - @/components/ui - Toast 通知, PasswordInput, PasswordStrengthIndicator
 *
 * @related
 * - ../../app/[locale]/users/new/page.tsx - 新增使用者頁面
 * - ../../app/[locale]/users/[id]/edit/page.tsx - 編輯使用者頁面
 * - ../../../../packages/api/src/routers/user.ts - User API procedures
 * - ../../../../packages/db/prisma/schema.prisma - User model
 */

import { useState, useEffect } from 'react';
import { useRouter } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import {
  useToast,
  PasswordInput,
  PasswordStrengthIndicator,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui';

interface UserFormProps {
  initialData?: {
    id: string;
    email: string;
    name: string | null;
    roleId: number;
  };
  mode: 'create' | 'edit';
}

/** 密碼驗證常數（與後端保持一致） */
const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 12,
  MIN_SPECIAL_CHARS: 6,
} as const;

/** 驗證密碼是否符合要求（前端快速驗證） */
function isPasswordValid(password: string): boolean {
  if (password.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) return false;
  const uppercaseCount = (password.match(/[A-Z]/g) || []).length;
  const digitCount = (password.match(/[0-9]/g) || []).length;
  const symbolCount = (password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/g) || []).length;
  return (uppercaseCount + digitCount + symbolCount) >= PASSWORD_REQUIREMENTS.MIN_SPECIAL_CHARS;
}

export function UserForm({ initialData, mode }: UserFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations('users');
  const tCommon = useTranslations('common');

  const [formData, setFormData] = useState({
    email: initialData?.email ?? '',
    name: initialData?.name ?? '',
    roleId: initialData?.roleId ?? 1,
    password: '', // 新增密碼欄位
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(mode === 'create');
  const [hasExistingPassword, setHasExistingPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 取得所有角色
  const { data: roles } = api.user.getRoles.useQuery();

  // 編輯模式下檢查用戶是否已有密碼
  const { data: passwordStatus } = api.user.hasPassword.useQuery(
    { userId: initialData?.id ?? '' },
    { enabled: mode === 'edit' && !!initialData?.id }
  );

  // 當獲取到密碼狀態時更新
  useEffect(() => {
    if (passwordStatus) {
      setHasExistingPassword(passwordStatus.hasPassword);
    }
  }, [passwordStatus]);

  const createMutation = api.user.create.useMutation({
    onSuccess: () => {
      toast({
        title: tCommon('success'),
        description: t('form.messages.createSuccess'),
        variant: 'success',
      });
      router.push('/users');
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: tCommon('error'),
        description: `${tCommon('error')}: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = api.user.update.useMutation({
    onSuccess: () => {
      toast({
        title: tCommon('success'),
        description: t('form.messages.updateSuccess'),
        variant: 'success',
      });
      router.push(`/users/${initialData?.id}`);
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: tCommon('error'),
        description: `${tCommon('error')}: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // 設定/更改密碼 mutation (CHANGE-032)
  const setPasswordMutation = api.user.setPassword.useMutation({
    onSuccess: () => {
      toast({
        title: tCommon('success'),
        description: hasExistingPassword
          ? t('password.messages.changeSuccess')
          : t('password.messages.setSuccess'),
        variant: 'success',
      });
      setFormData(prev => ({ ...prev, password: '' }));
      setConfirmPassword('');
      setShowPasswordSection(false);
      setHasExistingPassword(true);
    },
    onError: (error) => {
      toast({
        title: tCommon('error'),
        description: `${t('password.messages.setError')}: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const validate = (isPasswordOnly = false) => {
    const newErrors: Record<string, string> = {};

    // 密碼專用驗證（用於編輯模式下的密碼更改）
    if (isPasswordOnly) {
      if (!formData.password) {
        newErrors.password = t('form.validation.passwordRequired');
      } else if (!isPasswordValid(formData.password)) {
        newErrors.password = t('password.messages.tooWeak');
      }
      if (formData.password !== confirmPassword) {
        newErrors.confirmPassword = t('password.messages.mismatch');
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    // 基本表單驗證
    if (!formData.email.trim()) {
      newErrors.email = t('form.validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('form.validation.emailInvalid');
    }

    if (!formData.roleId) {
      newErrors.roleId = t('form.validation.roleRequired');
    }

    // 建立模式下的密碼驗證（密碼是可選的，但如果填寫了就要驗證）
    if (mode === 'create' && formData.password) {
      if (!isPasswordValid(formData.password)) {
        newErrors.password = t('password.messages.tooWeak');
      }
      if (formData.password !== confirmPassword) {
        newErrors.confirmPassword = t('password.messages.mismatch');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 處理密碼設定/更改（編輯模式專用）
  const handleSetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(true) || !initialData?.id) return;

    setPasswordMutation.mutate({
      userId: initialData.id,
      password: formData.password,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const submitData = {
      email: formData.email,
      name: formData.name || undefined,
      roleId: formData.roleId,
    };

    if (mode === 'create') {
      // 建立模式：包含可選的密碼
      createMutation.mutate({
        ...submitData,
        password: formData.password || undefined,
      });
    } else if (initialData) {
      // 編輯模式：只更新基本資訊（密碼由 handleSetPassword 處理）
      updateMutation.mutate({
        id: initialData.id,
        ...submitData,
      });
    }
  };

  const isSubmitting = createMutation.isLoading || updateMutation.isLoading;
  const isSettingPassword = setPasswordMutation.isLoading;

  const getRoleName = (roleName: string) => {
    switch (roleName) {
      case 'ProjectManager':
        return t('roles.projectManager');
      case 'Supervisor':
        return t('roles.supervisor');
      case 'Admin':
        return t('roles.admin');
      default:
        return roleName;
    }
  };

  return (
    <div className="space-y-8">
      {/* 基本資訊表單 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('form.fields.email.label')} *
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder={t('form.fields.email.placeholder')}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('form.fields.name.label')}
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder={t('form.fields.name.placeholder')}
          />
        </div>

        <div>
          <label htmlFor="roleId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('form.fields.role.label')} *
          </label>
          <select
            id="roleId"
            value={formData.roleId}
            onChange={(e) => setFormData({ ...formData, roleId: parseInt(e.target.value) })}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="">{t('form.fields.role.placeholder')}</option>
            {roles?.map((role) => (
              <option key={role.id} value={role.id}>
                {getRoleName(role.name)}
              </option>
            ))}
          </select>
          {errors.roleId && (
            <p className="mt-1 text-sm text-red-600">{errors.roleId}</p>
          )}
        </div>

        {/* 建立模式的密碼欄位 (CHANGE-032) */}
        {mode === 'create' && (
          <div className="space-y-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('password.title')} {t('password.optional')}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('password.hint')}
            </p>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('password.newPassword')}
              </label>
              <PasswordInput
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={t('password.placeholder')}
                className="mt-1"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
              <PasswordStrengthIndicator password={formData.password} className="mt-2" />
            </div>

            {formData.password && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('password.confirmPassword')}
                </label>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('password.placeholderConfirm')}
                  className="mt-1"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSubmitting ? tCommon('saving') : mode === 'create' ? t('form.buttons.create') : t('form.buttons.update')}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {tCommon('actions.cancel')}
          </button>
        </div>
      </form>

      {/* 編輯模式的密碼管理區塊 (CHANGE-032) */}
      {mode === 'edit' && initialData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t('password.title')}
            </CardTitle>
            <CardDescription>
              {hasExistingPassword
                ? t('password.changePassword')
                : t('password.setPassword')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showPasswordSection ? (
              <button
                type="button"
                onClick={() => setShowPasswordSection(true)}
                className="rounded-md bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                {hasExistingPassword ? t('password.changePassword') : t('password.setPassword')}
              </button>
            ) : (
              <form onSubmit={handleSetPassword} className="space-y-4">
                <div>
                  <label htmlFor="editPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('password.newPassword')} *
                  </label>
                  <PasswordInput
                    id="editPassword"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={t('password.placeholder')}
                    className="mt-1"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                  <PasswordStrengthIndicator password={formData.password} className="mt-2" />
                </div>

                <div>
                  <label htmlFor="editConfirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('password.confirmPassword')} *
                  </label>
                  <PasswordInput
                    id="editConfirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('password.placeholderConfirm')}
                    className="mt-1"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isSettingPassword}
                    className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {isSettingPassword ? tCommon('saving') : hasExistingPassword ? t('password.changePassword') : t('password.setPassword')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordSection(false);
                      setFormData(prev => ({ ...prev, password: '' }));
                      setConfirmPassword('');
                      setErrors({});
                    }}
                    className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    {tCommon('actions.cancel')}
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
