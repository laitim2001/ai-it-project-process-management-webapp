'use client';

import { useEffect } from 'react';
import { useRouter } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
      });
    }
  }, [initialData, mode, form]);

  // Form submit
  const onSubmit = (data: OMExpenseFormData) => {
    // Fix Bug #9: Convert empty string vendorId to undefined to avoid Foreign Key error
    const formattedData = {
      ...data,
      vendorId: data.vendorId || undefined,
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
