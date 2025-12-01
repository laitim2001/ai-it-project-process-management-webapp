/**
 * @fileoverview OM Expense Form Component - OM 費用建立/編輯表單
 *
 * @description
 * 統一的 OM（營運維護）費用建立和編輯表單組件。
 * 支援 OpCo（營運公司）、Vendor（供應商）和 Budget Category（預算類別）的關聯管理，
 * 建立時自動產生 12 個月度記錄（Jan-Dec），月度金額在詳情頁面單獨編輯。
 *
 * @component OMExpenseForm
 *
 * @features
 * - 表單模式切換（建立 vs 編輯）
 * - OM 費用基本資訊輸入（名稱、描述、財年、類別）
 * - OpCo 和 Vendor 關聯選擇
 * - 預算金額和日期範圍設定
 * - 完整表單驗證（Zod schema + 業務規則）
 * - 建立時自動產生 12 個月度記錄（amount = 0）
 * - 日期範圍驗證（startDate < endDate）
 * - 國際化支援（繁中/英文）
 *
 * @props
 * @param {Object} props - 組件屬性
 * @param {'create' | 'edit'} props.mode - 表單模式
 * @param {Object} [props.initialData] - 編輯模式的初始數據
 * @param {string} [props.initialData.id] - OM 費用 ID
 * @param {string} [props.initialData.name] - OM 費用名稱
 * @param {number} [props.initialData.financialYear] - 財年
 * @param {string} [props.initialData.category] - 類別
 * @param {string} [props.initialData.opCoId] - 營運公司 ID
 * @param {number} [props.initialData.budgetAmount] - 預算金額
 * @param {string} [props.initialData.vendorId] - 供應商 ID（可選）
 *
 * @example
 * ```tsx
 * // 建立模式
 * <OMExpenseForm mode="create" />
 *
 * // 編輯模式
 * <OMExpenseForm
 *   mode="edit"
 *   initialData={{
 *     id: 'om-expense-1',
 *     name: '辦公室租金',
 *     financialYear: 2025,
 *     budgetAmount: 1200000
 *   }}
 * />
 * ```
 *
 * @dependencies
 * - react-hook-form: 表單狀態管理和驗證
 * - @hookform/resolvers/zod: Zod 整合
 * - @tanstack/react-query: tRPC 查詢和 mutation
 * - shadcn/ui: Form, Input, Textarea, Card, Select
 * - next-intl: 國際化
 *
 * @related
 * - packages/api/src/routers/omExpense.ts - OM 費用 API Router
 * - apps/web/src/components/om-expense/OMExpenseMonthlyGrid.tsx - 月度記錄編輯組件
 * - apps/web/src/app/[locale]/om-expenses/new/page.tsx - 建立頁面
 * - apps/web/src/app/[locale]/om-expenses/[id]/edit/page.tsx - 編輯頁面
 *
 * @author IT Department
 * @since Module 4 - OM Expense Management
 * @lastModified 2025-11-14 (Bug #9: 修復 vendorId 空字串導致 Foreign Key 錯誤)
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from "@/i18n/routing";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui';
import { api } from '@/lib/trpc';

/**
 * OMExpenseForm - OM Expense Create/Edit Form Component
 *
 * Features:
 * 1. Create new OM expense
 * 2. Edit existing OM expense basic information
 * 3. Complete form validation (Zod + react-hook-form)
 * 4. OpCo, Vendor, Category selectors
 * 5. Budget amount, date range inputs
 *
 * Notes:
 * - Creation automatically initializes 12 monthly records (amount = 0)
 * - actualSpent is calculated by system, not manually inputted
 * - Monthly records are edited separately on detail page
 */

interface OMExpenseFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<{
    id: string;
    name: string;
    description: string | undefined;
    financialYear: number;
    category: string;
    opCoId: string;
    budgetAmount: number;
    vendorId: string | undefined;
    startDate: string;
    endDate: string;
    // CHANGE-001: 來源費用追蹤
    sourceExpenseId: string | undefined;
    sourceExpense?: {
      id: string;
      name: string;
      purchaseOrder?: {
        poNumber: string;
        project?: {
          name: string;
        };
      };
    };
  }>;
}

export default function OMExpenseForm({ mode, initialData }: OMExpenseFormProps) {
  const t = useTranslations('omExpenses.form');
  const tMessages = useTranslations('omExpenses.messages');
  const tCommon = useTranslations('common');
  const tValidation = useTranslations('validation');
  const router = useRouter();
  const { toast } = useToast();

  // Zod Schema with Translations
  const omExpenseSchema = z
    .object({
      name: z.string().min(1, tValidation('required')).max(200),
      description: z.string().optional(),
      financialYear: z.number().int().min(2000).max(2100),
      category: z.string().min(1, tValidation('required')).max(100),
      opCoId: z.string().min(1, tValidation('required')),
      budgetAmount: z.number().positive(tValidation('positiveNumber')),
      vendorId: z.string().optional(),
      startDate: z.string().min(1, tValidation('required')),
      endDate: z.string().min(1, tValidation('required')),
      // CHANGE-001: 來源費用追蹤
      sourceExpenseId: z.string().optional(),
    })
    .refine(
      (data) => {
        if (data.startDate && data.endDate) {
          return new Date(data.startDate) < new Date(data.endDate);
        }
        return true;
      },
      {
        message: tValidation('endDateBeforeStart'),
        path: ['endDate'],
      }
    );

  type OMExpenseFormData = z.infer<typeof omExpenseSchema>;

  // Get OpCo list
  const { data: opCos } = api.operatingCompany.getAll.useQuery();

  // Get Vendor list
  const { data: vendors } = api.vendor.getAll.useQuery({
    page: 1,
    limit: 100,
  });

  // Get OM Categories list (for autocomplete)
  const { data: categories } = api.omExpense.getCategories.useQuery();

  // CHANGE-001: Get Expenses list for source expense selector
  const { data: expenses } = api.expense.getAll.useQuery({
    page: 1,
    limit: 100,
  });

  // tRPC Mutations
  const createMutation = api.omExpense.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: tCommon('success'),
        description: tMessages('createSuccess'),
      });
      router.push(`/om-expenses/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: tCommon('error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = api.omExpense.update.useMutation({
    onSuccess: (data) => {
      toast({
        title: tCommon('success'),
        description: tMessages('updateSuccess'),
      });
      router.push(`/om-expenses/${data.id}`);
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
  const form = useForm<OMExpenseFormData>({
    resolver: zodResolver(omExpenseSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      financialYear: initialData?.financialYear || new Date().getFullYear(),
      category: initialData?.category || '',
      opCoId: initialData?.opCoId || '',
      budgetAmount: initialData?.budgetAmount || 0,
      vendorId: initialData?.vendorId || '',
      startDate: initialData?.startDate || '',
      endDate: initialData?.endDate || '',
      // CHANGE-001: 來源費用追蹤
      sourceExpenseId: initialData?.sourceExpenseId || '',
    },
  });

  // Reset form when initialData updates
  useEffect(() => {
    if (initialData && mode === 'edit') {
      form.reset({
        name: initialData.name || '',
        description: initialData.description || '',
        financialYear: initialData.financialYear || new Date().getFullYear(),
        category: initialData.category || '',
        opCoId: initialData.opCoId || '',
        budgetAmount: initialData.budgetAmount || 0,
        vendorId: initialData.vendorId || '',
        startDate: initialData.startDate || '',
        endDate: initialData.endDate || '',
        // CHANGE-001: 來源費用追蹤
        sourceExpenseId: initialData.sourceExpenseId || '',
      });
    }
  }, [initialData, mode, form]);

  // Form submit
  const onSubmit = (data: OMExpenseFormData) => {
    // Fix Bug #9: Convert empty string vendorId to undefined to avoid Foreign Key error
    // CHANGE-001: Also handle sourceExpenseId
    const formattedData = {
      ...data,
      vendorId: data.vendorId || undefined,
      sourceExpenseId: data.sourceExpenseId || undefined,
    };

    if (mode === 'create') {
      createMutation.mutate(formattedData);
    } else if (mode === 'edit' && initialData?.id) {
      updateMutation.mutate({
        id: initialData.id,
        ...formattedData,
      });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('basicInfo.title', { defaultValue: 'Basic Information' })}</CardTitle>
            <CardDescription>
              {mode === 'create' ? t('create.subtitle') : t('edit.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* OM Expense Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('fields.name.label')} <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={t('fields.name.placeholder')} {...field} />
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
                  <FormLabel>{t('fields.description.label')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('fields.description.placeholder')}
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Financial Year and OM Category */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="financialYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('fields.financialYear.label')} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={2000}
                        max={2100}
                        placeholder={t('fields.financialYear.placeholder')}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('fields.category.label')} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="">{t('fields.category.placeholder')}</option>
                        {categories?.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* OpCo and Vendor */}
        <Card>
          <CardHeader>
            <CardTitle>{t('opCoAndVendor.title', { defaultValue: 'OpCo and Vendor' })}</CardTitle>
            <CardDescription>
              {t('opCoAndVendor.description', { defaultValue: 'Select operating company and associated vendor (optional)' })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* OpCo Selection */}
            <FormField
              control={form.control}
              name="opCoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('fields.opCo.label')} <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="">{t('fields.opCo.placeholder')}</option>
                      {opCos?.map((opCo) => (
                        <option key={opCo.id} value={opCo.id}>
                          {opCo.code} - {opCo.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vendor Selection (Optional) */}
            <FormField
              control={form.control}
              name="vendorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.vendor.label')}</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="">{t('fields.vendor.placeholder')}</option>
                      {vendors?.items.map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormDescription>
                    {t('vendorDescription', { defaultValue: 'Optional: Associate with a specific vendor' })}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Budget and Date Range */}
        <Card>
          <CardHeader>
            <CardTitle>{t('budgetAndDates.title', { defaultValue: 'Budget and Date Range' })}</CardTitle>
            <CardDescription>
              {t('budgetAndDates.description', { defaultValue: 'Set annual budget amount and expense valid period' })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Budget Amount */}
            <FormField
              control={form.control}
              name="budgetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('fields.budgetAmount.label')} <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder={t('fields.budgetAmount.placeholder')}
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('budgetDescription', { defaultValue: 'Annual budget amount, actual spending calculated from monthly records' })}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start Date and End Date */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('startDate', { defaultValue: 'Start Date' })} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('endDate', { defaultValue: 'End Date' })} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* CHANGE-001: Source Expense Tracking */}
        <Card>
          <CardHeader>
            <CardTitle>{t('sourceExpense.title')}</CardTitle>
            <CardDescription>
              {t('sourceExpense.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="sourceExpenseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sourceExpense.label')}</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="">{t('sourceExpense.noSelection')}</option>
                      {expenses?.items.map((expense) => (
                        <option key={expense.id} value={expense.id}>
                          {expense.name} - {expense.purchaseOrder?.poNumber || 'N/A'} ({expense.purchaseOrder?.project?.name || 'N/A'})
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormDescription>
                    {t('sourceExpense.hint')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Show linked project/PO info if source expense is selected */}
            {initialData?.sourceExpense && (
              <div className="rounded-md bg-muted p-4 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground">{t('sourceExpense.linkedProject')}:</span>{' '}
                    <span className="font-medium">
                      {initialData.sourceExpense.purchaseOrder?.project?.name || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('sourceExpense.linkedPO')}:</span>{' '}
                    <span className="font-medium">
                      {initialData.sourceExpense.purchaseOrder?.poNumber || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            {t('actions.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? mode === 'create'
                ? tCommon('submitting')
                : tCommon('saving')
              : mode === 'create'
              ? t('actions.create')
              : t('actions.update')}
          </Button>
        </div>

        {/* Create Mode Notice */}
        {mode === 'create' && (
          <Card className="bg-muted">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                ℹ️ {t('createNotice', {
                  defaultValue: 'After creation, 12 monthly records (Jan-Dec) will be automatically generated with initial amount of 0. You can edit monthly actual spending on the detail page.'
                })}
              </p>
            </CardContent>
          </Card>
        )}
      </form>
    </Form>
  );
}
