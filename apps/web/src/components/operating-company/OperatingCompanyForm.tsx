/**
 * @fileoverview Operating Company Form Component - 營運公司建立/編輯表單
 *
 * @description
 * 統一的營運公司表單組件，支援建立新營運公司和編輯現有營運公司兩種模式。
 * 提供公司代碼、名稱、描述等基本資訊管理功能。
 * 整合即時驗證（必填欄位、代碼唯一性）和 Toast 提示。
 *
 * @component OperatingCompanyForm
 *
 * @features
 * - 表單模式切換（建立 vs 編輯）
 * - 公司代碼輸入（必填，唯一）
 * - 公司名稱輸入（必填）
 * - 描述輸入（選填）
 * - 啟用狀態切換（編輯模式）
 * - 即時表單驗證
 * - 國際化支援（繁中/英文）
 * - 錯誤處理和成功提示（Toast）
 *
 * @props
 * @param {Object} props - 組件屬性
 * @param {'create' | 'edit'} props.mode - 表單模式
 * @param {Object} [props.initialData] - 編輯模式的預設值
 *
 * @dependencies
 * - @tanstack/react-query: tRPC 查詢和 mutation
 * - next-intl: 國際化
 * - shadcn/ui: Input, Button, Textarea, Switch
 *
 * @related
 * - packages/api/src/routers/operatingCompany.ts - 營運公司 API Router
 * - apps/web/src/app/[locale]/operating-companies/new/page.tsx - 建立頁面
 * - apps/web/src/app/[locale]/operating-companies/[id]/edit/page.tsx - 編輯頁面
 *
 * @author IT Department
 * @since FEAT-004 - Operating Company Management
 * @lastModified 2025-12-01
 */

'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import { useToast } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface OperatingCompanyFormProps {
  initialData?: {
    id: string;
    code: string;
    name: string;
    description?: string | null;
    isActive: boolean;
  };
  mode: 'create' | 'edit';
}

export function OperatingCompanyForm({ initialData, mode }: OperatingCompanyFormProps) {
  const t = useTranslations('operatingCompanies');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { toast } = useToast();

  // 表單狀態
  const [formData, setFormData] = useState({
    code: initialData?.code ?? '',
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    isActive: initialData?.isActive ?? true,
  });

  // 錯誤狀態
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 創建 Mutation
  const createMutation = api.operatingCompany.create.useMutation({
    onSuccess: () => {
      toast({
        title: tCommon('messages.success'),
        description: t('messages.createSuccess'),
        variant: 'success',
      });
      router.push('/operating-companies');
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: tCommon('messages.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // 更新 Mutation
  const updateMutation = api.operatingCompany.update.useMutation({
    onSuccess: () => {
      toast({
        title: tCommon('messages.success'),
        description: t('messages.updateSuccess'),
        variant: 'success',
      });
      router.push('/operating-companies');
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: tCommon('messages.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  /**
   * 表單驗證
   */
  const validate = () => {
    const newErrors: Record<string, string> = {};

    // 必填: 公司代碼
    if (!formData.code.trim()) {
      newErrors.code = tCommon('validation.required', { field: t('form.code.label') });
    }

    // 必填: 公司名稱
    if (!formData.name.trim()) {
      newErrors.name = tCommon('validation.required', { field: t('form.name.label') });
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

    // 準備提交資料
    const submitData = {
      code: formData.code.trim(),
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
    };

    // 根據模式執行創建或更新
    if (mode === 'create') {
      createMutation.mutate(submitData);
    } else if (initialData) {
      updateMutation.mutate({
        id: initialData.id,
        ...submitData,
        isActive: formData.isActive,
      });
    }
  };

  // 提交狀態
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 公司代碼 */}
      <div className="space-y-2">
        <Label htmlFor="code">
          {t('form.code.label')} <span className="text-destructive">*</span>
        </Label>
        <Input
          type="text"
          id="code"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          placeholder={t('form.code.placeholder')}
          disabled={isSubmitting}
          className={errors.code ? 'border-destructive' : ''}
        />
        {errors.code && (
          <p className="text-sm text-destructive">{errors.code}</p>
        )}
      </div>

      {/* 公司名稱 */}
      <div className="space-y-2">
        <Label htmlFor="name">
          {t('form.name.label')} <span className="text-destructive">*</span>
        </Label>
        <Input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={t('form.name.placeholder')}
          disabled={isSubmitting}
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      {/* 描述 */}
      <div className="space-y-2">
        <Label htmlFor="description">{t('form.description.label')}</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder={t('form.description.placeholder')}
          disabled={isSubmitting}
          rows={3}
        />
      </div>

      {/* 啟用狀態（僅編輯模式） */}
      {mode === 'edit' && (
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            disabled={isSubmitting}
          />
          <Label htmlFor="isActive">
            {formData.isActive ? t('status.active') : t('status.inactive')}
          </Label>
        </div>
      )}

      {/* 操作按鈕 */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting
            ? tCommon('actions.saving')
            : mode === 'create'
            ? t('actions.create')
            : tCommon('actions.update')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          {tCommon('actions.cancel')}
        </Button>
      </div>
    </form>
  );
}
