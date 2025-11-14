'use client';

/**
 * @fileoverview 使用者表單組件
 *
 * @description
 * 使用者（User）的新增和編輯表單組件，支援電子郵件、姓名和角色選擇。
 * 用於管理員進行使用者管理操作。
 *
 * @module apps/web/src/components/user/UserForm
 * @component UserForm
 * @author IT Department
 * @since Epic 1 - Story 1.4 (User Management)
 * @lastModified 2025-11-14
 *
 * @features
 * - 新增/編輯模式切換
 * - 電子郵件驗證（格式檢查）
 * - 角色選擇（ProjectManager, Supervisor, Admin）
 * - 表單驗證和錯誤提示
 * - tRPC mutation 整合（create, update）
 * - 國際化支援（next-intl）
 *
 * @dependencies
 * - @/lib/trpc - tRPC client（user.create, user.update, user.getRoles）
 * - next-intl - 國際化
 * - @/components/ui - Toast 通知
 *
 * @related
 * - ../../app/[locale]/users/new/page.tsx - 新增使用者頁面
 * - ../../app/[locale]/users/[id]/edit/page.tsx - 編輯使用者頁面
 * - ../../../../packages/api/src/routers/user.ts - User API procedures
 * - ../../../../packages/db/prisma/schema.prisma - User model
 */

import { useState } from 'react';
import { useRouter } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import { useToast } from '@/components/ui';

interface UserFormProps {
  initialData?: {
    id: string;
    email: string;
    name: string | null;
    roleId: number;
  };
  mode: 'create' | 'edit';
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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 取得所有角色
  const { data: roles } = api.user.getRoles.useQuery();

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

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = t('form.validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('form.validation.emailInvalid');
    }

    if (!formData.roleId) {
      newErrors.roleId = t('form.validation.roleRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      createMutation.mutate(submitData);
    } else if (initialData) {
      updateMutation.mutate({
        id: initialData.id,
        ...submitData,
      });
    }
  };

  const isSubmitting = createMutation.isLoading || updateMutation.isLoading;

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          {t('form.fields.email.label')} *
        </label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder={t('form.fields.email.placeholder')}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          {t('form.fields.name.label')}
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder={t('form.fields.name.placeholder')}
        />
      </div>

      <div>
        <label htmlFor="roleId" className="block text-sm font-medium text-gray-700">
          {t('form.fields.role.label')} *
        </label>
        <select
          id="roleId"
          value={formData.roleId}
          onChange={(e) => setFormData({ ...formData, roleId: parseInt(e.target.value) })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
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
          className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
        >
          {tCommon('actions.cancel')}
        </button>
      </div>
    </form>
  );
}
