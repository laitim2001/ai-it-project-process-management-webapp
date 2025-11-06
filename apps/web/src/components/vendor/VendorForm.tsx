'use client';

/**
 * Vendor 表單組件
 *
 * 功能說明:
 * - 供應商新增/編輯表單
 * - 表單驗證
 * - tRPC mutation 整合
 * - Toast 通知反饋
 *
 * Epic 4 - Story 5.1: 管理供應商基本資訊
 */

import { useState } from 'react';
import { useRouter } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import { useToast } from '@/components/ui';

interface VendorFormProps {
  initialData?: {
    id: string;
    name: string;
    contactPerson?: string | null;
    contactEmail?: string | null;
    phone?: string | null;
  };
  mode: 'create' | 'edit';
}

export function VendorForm({ initialData, mode }: VendorFormProps) {
  const t = useTranslations('vendors');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { toast } = useToast();

  // 表單狀態
  const [formData, setFormData] = useState({
    name: initialData?.name ?? '',
    contactPerson: initialData?.contactPerson ?? '',
    contactEmail: initialData?.contactEmail ?? '',
    phone: initialData?.phone ?? '',
  });

  // 錯誤狀態
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 創建 Mutation
  const createMutation = api.vendor.create.useMutation({
    onSuccess: () => {
      toast({
        title: tCommon('messages.success'),
        description: t('messages.createSuccess'),
        variant: 'success',
      });
      router.push('/vendors');
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: tCommon('messages.error'),
        description: `${tCommon('messages.createFailed')}: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // 更新 Mutation
  const updateMutation = api.vendor.update.useMutation({
    onSuccess: () => {
      toast({
        title: tCommon('messages.success'),
        description: t('messages.updateSuccess'),
        variant: 'success',
      });
      router.push(`/vendors/${initialData?.id}`);
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: tCommon('messages.error'),
        description: `${tCommon('messages.updateFailed')}: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  /**
   * 表單驗證
   */
  const validate = () => {
    const newErrors: Record<string, string> = {};

    // 必填: 供應商名稱
    if (!formData.name.trim()) {
      newErrors.name = tCommon('validation.required', { field: t('form.name.label') });
    }

    // 選填: 電子郵件格式驗證
    if (formData.contactEmail && formData.contactEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.contactEmail)) {
        newErrors.contactEmail = tCommon('validation.invalidEmail');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 表單提交處理
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 驗證表單
    if (!validate()) {
      return;
    }

    // 準備提交資料(空字串轉為 undefined,讓 Zod 處理為可選)
    const submitData = {
      name: formData.name,
      contactPerson: formData.contactPerson || undefined,
      contactEmail: formData.contactEmail || undefined,
      phone: formData.phone || undefined,
    };

    // 根據模式執行創建或更新
    if (mode === 'create') {
      createMutation.mutate(submitData);
    } else if (initialData) {
      updateMutation.mutate({
        id: initialData.id,
        ...submitData,
      });
    }
  };

  // 提交狀態
  const isSubmitting = createMutation.isLoading || updateMutation.isLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 供應商名稱 */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          {t('form.name.label')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder={t('form.name.placeholder')}
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      {/* 聯絡人 */}
      <div>
        <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">
          {t('form.contactPerson.label')}
        </label>
        <input
          type="text"
          id="contactPerson"
          name="contactPerson"
          value={formData.contactPerson}
          onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder={t('form.contactPerson.placeholder')}
          disabled={isSubmitting}
        />
      </div>

      {/* 聯絡郵箱 */}
      <div>
        <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
          {t('form.email.label')}
        </label>
        <input
          type="email"
          id="contactEmail"
          name="contactEmail"
          value={formData.contactEmail}
          onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder={t('form.email.placeholder')}
          disabled={isSubmitting}
        />
        {errors.contactEmail && (
          <p className="mt-1 text-sm text-red-600">{errors.contactEmail}</p>
        )}
      </div>

      {/* 聯絡電話 */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          {t('form.phone.label')}
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder={t('form.phone.placeholder')}
          disabled={isSubmitting}
        />
      </div>

      {/* 操作按鈕 */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? tCommon('actions.saving')
            : mode === 'create'
            ? t('actions.create')
            : tCommon('actions.update')}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          {tCommon('actions.cancel')}
        </button>
      </div>
    </form>
  );
}
