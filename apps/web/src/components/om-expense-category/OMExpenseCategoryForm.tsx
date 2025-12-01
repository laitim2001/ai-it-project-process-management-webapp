/**
 * @fileoverview OM Expense Category Form Component - OM 費用類別表單組件
 *
 * @description
 * 提供 OM 費用類別的建立和編輯表單。
 * 支援兩種模式：create（建立新類別）和 edit（編輯現有類別）。
 *
 * @component OMExpenseCategoryForm
 *
 * @features
 * - 建立/編輯模式切換
 * - 類別代碼格式驗證（大寫字母、數字、底線）
 * - 即時表單驗證
 * - tRPC mutation 整合
 * - 成功/失敗 Toast 通知
 *
 * @author IT Department
 * @since FEAT-005 - OM Expense Category Management
 * @lastModified 2025-12-01
 */

'use client';

import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from '@/i18n/routing';
import { Link } from '@/i18n/routing';
import { api } from '@/lib/trpc';

interface OMExpenseCategoryFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    sortOrder: number;
    isActive: boolean;
  };
}

export function OMExpenseCategoryForm({ mode, initialData }: OMExpenseCategoryFormProps) {
  const t = useTranslations('omExpenseCategories');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { toast } = useToast();

  // 表單狀態
  const [formData, setFormData] = useState({
    code: initialData?.code ?? '',
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    sortOrder: initialData?.sortOrder ?? 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 當 initialData 變更時更新表單
  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code,
        name: initialData.name,
        description: initialData.description ?? '',
        sortOrder: initialData.sortOrder,
      });
    }
  }, [initialData]);

  // CHANGE-003: tRPC Mutations（使用統一費用類別 API）
  const createMutation = api.expenseCategory.create.useMutation({
    onSuccess: () => {
      toast({
        title: tCommon('messages.success'),
        description: t('messages.createSuccess'),
      });
      router.push('/om-expense-categories');
    },
    onError: (error) => {
      toast({
        title: tCommon('messages.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = api.expenseCategory.update.useMutation({
    onSuccess: () => {
      toast({
        title: tCommon('messages.success'),
        description: t('messages.updateSuccess'),
      });
      router.push('/om-expense-categories');
    },
    onError: (error) => {
      toast({
        title: tCommon('messages.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // 表單驗證
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = t('form.code.required');
    } else if (!/^[A-Z0-9_]+$/.test(formData.code)) {
      newErrors.code = t('form.code.invalid');
    }

    if (!formData.name.trim()) {
      newErrors.name = t('form.name.required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 表單提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (mode === 'create') {
      createMutation.mutate({
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description || undefined,
        sortOrder: formData.sortOrder,
      });
    } else if (initialData) {
      updateMutation.mutate({
        id: initialData.id,
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description || null,
        sortOrder: formData.sortOrder,
      });
    }
  };

  // 處理欄位變更
  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // 清除該欄位的錯誤
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === 'create' ? t('form.createTitle') : t('form.editTitle')}
          </CardTitle>
          <CardDescription>
            {mode === 'create'
              ? t('form.createDescription')
              : t('form.editDescription', { name: initialData?.name ?? '' })}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 類別代碼 */}
          <div className="space-y-2">
            <Label htmlFor="code">
              {t('form.code.label')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
              placeholder={t('form.code.placeholder')}
              className={errors.code ? 'border-destructive' : ''}
              disabled={isLoading}
            />
            {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
            <p className="text-xs text-muted-foreground">{t('form.code.hint')}</p>
          </div>

          {/* 類別名稱 */}
          <div className="space-y-2">
            <Label htmlFor="name">
              {t('form.name.label')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder={t('form.name.placeholder')}
              className={errors.name ? 'border-destructive' : ''}
              disabled={isLoading}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          {/* 描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('form.description.label')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder={t('form.description.placeholder')}
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* 排序順序 */}
          <div className="space-y-2">
            <Label htmlFor="sortOrder">{t('form.sortOrder.label')}</Label>
            <Input
              id="sortOrder"
              type="number"
              min={0}
              value={formData.sortOrder}
              onChange={(e) => handleChange('sortOrder', parseInt(e.target.value, 10) || 0)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">{t('form.sortOrder.hint')}</p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Link href="/om-expense-categories">
            <Button type="button" variant="outline" disabled={isLoading}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {tCommon('actions.cancel')}
            </Button>
          </Link>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {tCommon('actions.saving')}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {mode === 'create' ? tCommon('actions.create') : tCommon('actions.save')}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
