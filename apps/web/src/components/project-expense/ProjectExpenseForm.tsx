/**
 * @fileoverview Project Expense Form - 專案費用表（表頭）表單（FEAT-015）
 * @component ProjectExpenseForm
 *
 * @description
 * 費用表（表頭）的新增 / 編輯表單。欄位：名稱（必填）、描述、年度（financialYear）。
 * 明細於建立後在 ProjectExpenseItemList 另行新增（addItem）。
 *
 * @related
 * - packages/api/src/routers/projectExpense.ts（createExpense / updateExpense）
 *
 * @since FEAT-015 - Project Expense 月度模組
 */

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/trpc';

import type { ProjectExpenseData } from './types';

const expenseFormSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  financialYear: z.coerce
    .number()
    .int()
    .min(2000)
    .max(2100),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface ProjectExpenseFormProps {
  mode: 'create' | 'edit';
  /** 新增模式需要：所屬專案 ID */
  projectId?: string;
  /** 新增模式預設年度 */
  defaultFinancialYear?: number;
  /** 編輯模式需要：費用表初始資料 */
  initialData?: ProjectExpenseData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ProjectExpenseForm({
  mode,
  projectId,
  defaultFinancialYear,
  initialData,
  onSuccess,
  onCancel,
}: ProjectExpenseFormProps) {
  const t = useTranslations('projectExpenses');
  const tCommon = useTranslations('common');
  const { toast } = useToast();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
      financialYear:
        initialData?.financialYear ?? defaultFinancialYear ?? new Date().getFullYear(),
    },
  });

  useEffect(() => {
    form.reset({
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
      financialYear:
        initialData?.financialYear ?? defaultFinancialYear ?? new Date().getFullYear(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, defaultFinancialYear]);

  const onError = (error: { message: string }) => {
    toast({
      title: tCommon('error'),
      description: error.message,
      variant: 'destructive',
    });
  };

  const createMutation = api.projectExpense.createExpense.useMutation({
    onSuccess: () => {
      toast({ title: tCommon('success'), description: t('form.createSuccess') });
      onSuccess?.();
    },
    onError,
  });

  const updateMutation = api.projectExpense.updateExpense.useMutation({
    onSuccess: () => {
      toast({ title: tCommon('success'), description: t('form.updateSuccess') });
      onSuccess?.();
    },
    onError,
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (values: ExpenseFormValues) => {
    if (mode === 'create') {
      if (!projectId) return;
      createMutation.mutate({
        projectId,
        name: values.name,
        description: values.description || undefined,
        financialYear: values.financialYear,
      });
    } else {
      if (!initialData) return;
      updateMutation.mutate({
        id: initialData.id,
        name: values.name,
        description: values.description || null,
        financialYear: values.financialYear,
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('form.name.label')}
                <span className="ml-1 text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder={t('form.name.placeholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="financialYear"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('form.financialYear.label')}
                <span className="ml-1 text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={2000}
                  max={2100}
                  placeholder={t('form.financialYear.placeholder')}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.description.label')}</FormLabel>
              <FormControl>
                <Textarea
                  rows={2}
                  placeholder={t('form.description.placeholder')}
                  {...field}
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
            {mode === 'create' ? tCommon('actions.create') : tCommon('actions.save')}
          </LoadingButton>
        </div>
      </form>
    </Form>
  );
}
