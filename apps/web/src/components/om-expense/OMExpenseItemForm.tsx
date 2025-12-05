/**
 * @fileoverview OM Expense Item Form Component - OM 費用明細項目表單
 *
 * @description
 * OM 費用明細項目的新增和編輯表單組件。
 * 支援項目名稱、OpCo、預算金額、幣別、日期範圍等欄位。
 * 可作為獨立對話框或嵌入式表單使用。
 *
 * @component OMExpenseItemForm
 *
 * @features
 * - 表單模式切換（新增 vs 編輯）
 * - 明細項目資訊輸入（名稱、描述、OpCo、預算、日期）
 * - 幣別選擇（支援多幣別）
 * - 完整表單驗證（Zod schema）
 * - 國際化支援（繁中/英文）
 * - Dialog 對話框模式（可選）
 *
 * @props
 * @param {Object} props - 組件屬性
 * @param {'create' | 'edit'} props.mode - 表單模式
 * @param {string} [props.omExpenseId] - OM 費用 ID（新增模式需要）
 * @param {Object} [props.initialData] - 編輯模式的初始數據
 * @param {Function} [props.onSuccess] - 成功回調
 * @param {Function} [props.onCancel] - 取消回調
 * @param {boolean} [props.isDialog] - 是否為對話框模式
 *
 * @example
 * ```tsx
 * // 新增模式
 * <OMExpenseItemForm
 *   mode="create"
 *   omExpenseId="om-expense-1"
 *   onSuccess={(item) => refetch()}
 *   onCancel={() => setShowForm(false)}
 * />
 *
 * // 編輯模式
 * <OMExpenseItemForm
 *   mode="edit"
 *   initialData={selectedItem}
 *   onSuccess={(item) => refetch()}
 *   onCancel={() => setShowForm(false)}
 * />
 * ```
 *
 * @dependencies
 * - react-hook-form: 表單狀態管理和驗證
 * - @hookform/resolvers/zod: Zod 整合
 * - @tanstack/react-query: tRPC 查詢和 mutation
 * - shadcn/ui: Form, Input, Textarea, Button, Select
 * - next-intl: 國際化
 *
 * @related
 * - packages/api/src/routers/omExpense.ts - OM 費用 API Router (addItem, updateItem)
 * - apps/web/src/components/om-expense/OMExpenseItemList.tsx - 明細項目列表組件
 * - apps/web/src/app/[locale]/om-expenses/[id]/page.tsx - OM 費用詳情頁面
 *
 * @author IT Department
 * @since FEAT-007 - OM Expense Header-Detail Refactoring
 * @lastModified 2025-12-05
 */

'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui';
import { api } from '@/lib/trpc';

// ============================================================
// Types
// ============================================================

export interface OMExpenseItemData {
  id?: string;
  name: string;
  description?: string | null;
  sortOrder?: number;
  budgetAmount: number;
  opCoId: string;
  currencyId?: string | null;
  startDate?: string | null;
  endDate: string;
  // Read-only fields
  actualSpent?: number;
  opCo?: {
    id: string;
    code: string;
    name: string;
  };
  currency?: {
    id: string;
    code: string;
    name: string;
  } | null;
}

interface OMExpenseItemFormProps {
  mode: 'create' | 'edit';
  omExpenseId?: string; // Required for create mode
  initialData?: Partial<OMExpenseItemData>;
  onSuccess?: (item: OMExpenseItemData) => void;
  onCancel?: () => void;
  isDialog?: boolean;
  defaultOpCoId?: string; // Default OpCo for new items
}

// ============================================================
// Component
// ============================================================

export default function OMExpenseItemForm({
  mode,
  omExpenseId,
  initialData,
  onSuccess,
  onCancel,
  isDialog = false,
  defaultOpCoId,
}: OMExpenseItemFormProps) {
  const t = useTranslations('omExpenses');
  const tCommon = useTranslations('common');
  const tValidation = useTranslations('validation');
  const { toast } = useToast();

  // Zod Schema with Translations
  const itemSchema = z.object({
    name: z.string().min(1, tValidation('required')).max(200),
    description: z.string().optional().nullable(),
    budgetAmount: z.number().nonnegative(tValidation('positiveNumber')),
    opCoId: z.string().min(1, tValidation('required')),
    currencyId: z.string().optional().nullable(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().min(1, tValidation('required')),
  });

  type ItemFormData = z.infer<typeof itemSchema>;

  // Get OpCo list
  const { data: opCos } = api.operatingCompany.getAll.useQuery();

  // Get Currency list
  const { data: currencies } = api.currency.getAll.useQuery({});

  // tRPC Mutations
  const addItemMutation = api.omExpense.addItem.useMutation({
    onSuccess: (data) => {
      toast({
        title: tCommon('success'),
        description: t('items.addSuccess', { defaultValue: '明細項目已新增' }),
      });
      if (onSuccess && data) {
        onSuccess(data as unknown as OMExpenseItemData);
      }
    },
    onError: (error) => {
      toast({
        title: tCommon('error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateItemMutation = api.omExpense.updateItem.useMutation({
    onSuccess: (data) => {
      toast({
        title: tCommon('success'),
        description: t('items.updateSuccess', { defaultValue: '明細項目已更新' }),
      });
      if (onSuccess && data) {
        onSuccess(data as unknown as OMExpenseItemData);
      }
    },
    onError: (error) => {
      toast({
        title: tCommon('error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // React Hook Form
  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      budgetAmount: initialData?.budgetAmount || 0,
      opCoId: initialData?.opCoId || defaultOpCoId || '',
      currencyId: initialData?.currencyId || '',
      startDate: initialData?.startDate || '',
      endDate: initialData?.endDate || '',
    },
  });

  // Reset form when initialData updates
  useEffect(() => {
    if (initialData && mode === 'edit') {
      form.reset({
        name: initialData.name || '',
        description: initialData.description || '',
        budgetAmount: initialData.budgetAmount || 0,
        opCoId: initialData.opCoId || '',
        currencyId: initialData.currencyId || '',
        startDate: initialData.startDate || '',
        endDate: initialData.endDate || '',
      });
    }
  }, [initialData, mode, form]);

  // Form submit
  const onSubmit = (data: ItemFormData) => {
    // Clean up optional fields
    const cleanedData = {
      ...data,
      description: data.description || undefined,
      currencyId: data.currencyId || undefined,
      startDate: data.startDate || undefined,
    };

    if (mode === 'create' && omExpenseId) {
      addItemMutation.mutate({
        omExpenseId,
        item: cleanedData,
      });
    } else if (mode === 'edit' && initialData?.id) {
      updateItemMutation.mutate({
        id: initialData.id,
        ...cleanedData,
      });
    }
  };

  const isSubmitting = addItemMutation.isPending || updateItemMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Item Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('itemFields.name.label', { defaultValue: '項目名稱' })}{' '}
                <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t('itemFields.name.placeholder', { defaultValue: '輸入項目名稱' })}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.fields.description.label')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('form.fields.description.placeholder')}
                  className="resize-none"
                  rows={2}
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* OpCo and Budget Amount */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* OpCo Selection */}
          <FormField
            control={form.control}
            name="opCoId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('itemFields.opCo.label', { defaultValue: '所屬 OpCo' })}{' '}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t('itemFields.opCo.placeholder', { defaultValue: '選擇 OpCo' })}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {opCos?.map((opCo) => (
                      <SelectItem key={opCo.id} value={opCo.id}>
                        {opCo.code} - {opCo.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Budget Amount */}
          <FormField
            control={form.control}
            name="budgetAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('itemFields.budgetAmount.label', { defaultValue: '項目預算' })}{' '}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder={t('itemFields.budgetAmount.placeholder', { defaultValue: '0.00' })}
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Currency */}
        <FormField
          control={form.control}
          name="currencyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('itemFields.currency.label', { defaultValue: '幣別' })}</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(value === '__none__' ? '' : value)}
                value={field.value || '__none__'}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t('itemFields.currency.placeholder', { defaultValue: '選擇幣別（可選）' })}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="__none__">
                    {t('itemFields.currency.noSelection', { defaultValue: '不指定' })}
                  </SelectItem>
                  {currencies?.map((currency) => (
                    <SelectItem key={currency.id} value={currency.id}>
                      {currency.code} - {currency.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {t('itemFields.currency.description', {
                  defaultValue: '可選：指定此項目使用的幣別',
                })}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date Range */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Start Date */}
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('itemFields.startDate.label', { defaultValue: '開始日期' })}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* End Date */}
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('itemFields.endDate.label', { defaultValue: '結束日期' })}{' '}
                  <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Form Action Buttons */}
        <div className={`flex gap-4 ${isDialog ? 'justify-end' : 'justify-start'}`}>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              {tCommon('actions.cancel')}
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? tCommon('submitting')
              : mode === 'create'
                ? t('items.addItem', { defaultValue: '新增項目' })
                : t('items.saveChanges', { defaultValue: '儲存變更' })}
          </Button>
        </div>
      </form>
    </Form>
  );
}
