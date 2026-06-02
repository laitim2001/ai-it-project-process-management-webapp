/**
 * @fileoverview Project Expense Item Form - 專案費用明細表單（FEAT-015）
 * @component ProjectExpenseItemForm
 *
 * @description
 * 明細的新增 / 編輯表單。欄位：名稱（必填）、描述、費用類別、OpCo、次要顯示幣別。
 * 不含金額欄位 —— 金額按月填於 ProjectExpenseItemMonthlyGrid（預算 + 實際）。
 * 比照 OMExpenseItemForm，但維度依 FEAT-015 調整（categoryId / opCoId 皆可選）。
 *
 * @related
 * - packages/api/src/routers/projectExpense.ts（addItem / updateItem）
 * - apps/web/src/components/shared/CurrencySelect.tsx
 *
 * @since FEAT-015 - Project Expense 月度模組
 */

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { CurrencySelect } from '@/components/shared/CurrencySelect';
import { useToast } from '@/components/ui';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LoadingButton } from '@/components/ui/loading/LoadingButton';
import { NativeSelect } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/trpc';

import type { ProjectExpenseItemData } from './types';

const itemFormSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  opCoId: z.string().optional(),
  currencyId: z.string().optional(),
});

type ItemFormValues = z.infer<typeof itemFormSchema>;

interface ProjectExpenseItemFormProps {
  mode: 'create' | 'edit';
  /** 新增模式需要：所屬費用表 ID */
  projectExpenseId?: string;
  /** 編輯模式需要：明細初始資料 */
  initialData?: ProjectExpenseItemData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ProjectExpenseItemForm({
  mode,
  projectExpenseId,
  initialData,
  onSuccess,
  onCancel,
}: ProjectExpenseItemFormProps) {
  const t = useTranslations('projectExpenses');
  const tCommon = useTranslations('common');
  const { toast } = useToast();

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
      categoryId: initialData?.categoryId ?? '',
      opCoId: initialData?.opCoId ?? '',
      currencyId: initialData?.currencyId ?? '',
    },
  });

  useEffect(() => {
    form.reset({
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
      categoryId: initialData?.categoryId ?? '',
      opCoId: initialData?.opCoId ?? '',
      currencyId: initialData?.currencyId ?? '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  // 下拉選項
  const { data: categories } = api.expenseCategory.getActive.useQuery();
  const { data: opCos } = api.operatingCompany.getAll.useQuery(undefined);

  const onError = (error: { message: string }) => {
    toast({
      title: tCommon('error'),
      description: error.message,
      variant: 'destructive',
    });
  };

  const addMutation = api.projectExpense.addItem.useMutation({
    onSuccess: () => {
      toast({ title: tCommon('success'), description: t('items.addSuccess') });
      onSuccess?.();
    },
    onError,
  });

  const updateMutation = api.projectExpense.updateItem.useMutation({
    onSuccess: () => {
      toast({ title: tCommon('success'), description: t('items.updateSuccess') });
      onSuccess?.();
    },
    onError,
  });

  const isSubmitting = addMutation.isPending || updateMutation.isPending;

  const handleSubmit = (values: ItemFormValues) => {
    // 空字串視為未選（轉為 undefined / null）
    const currencyId = values.currencyId || undefined;
    const categoryId = values.categoryId || undefined;
    const opCoId = values.opCoId || undefined;

    if (mode === 'create') {
      if (!projectExpenseId) return;
      addMutation.mutate({
        projectExpenseId,
        item: {
          name: values.name,
          description: values.description || undefined,
          currencyId,
          categoryId,
          opCoId,
        },
      });
    } else {
      if (!initialData) return;
      updateMutation.mutate({
        id: initialData.id,
        name: values.name,
        description: values.description || null,
        currencyId: currencyId ?? null,
        categoryId: categoryId ?? null,
        opCoId: opCoId ?? null,
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* 名稱 */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('itemFields.name.label')}
                <span className="ml-1 text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t('itemFields.name.placeholder')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 描述 */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('itemFields.description.label')}</FormLabel>
              <FormControl>
                <Textarea
                  rows={2}
                  placeholder={t('itemFields.description.placeholder')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 費用類別 */}
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('itemFields.category.label')}</FormLabel>
              <FormControl>
                <NativeSelect {...field}>
                  <option value="">{t('itemFields.category.placeholder')}</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </NativeSelect>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* OpCo */}
        <FormField
          control={form.control}
          name="opCoId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('itemFields.opCo.label')}</FormLabel>
              <FormControl>
                <NativeSelect {...field}>
                  <option value="">{t('itemFields.opCo.placeholder')}</option>
                  {opCos?.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.code} - {o.name}
                    </option>
                  ))}
                </NativeSelect>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 次要顯示幣別 */}
        <FormField
          control={form.control}
          name="currencyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('itemFields.currency.label')}</FormLabel>
              <FormControl>
                <CurrencySelect
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t('itemFields.currency.placeholder')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              {tCommon('actions.cancel')}
            </Button>
          )}
          <LoadingButton
            type="submit"
            isLoading={isSubmitting}
            loadingText={tCommon('saving')}
          >
            {mode === 'create'
              ? tCommon('actions.create')
              : tCommon('actions.save')}
          </LoadingButton>
        </div>
      </form>
    </Form>
  );
}
