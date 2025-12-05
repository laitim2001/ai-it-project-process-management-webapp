/**
 * @fileoverview OM Expense Form Component - OM 費用建立/編輯表單
 *
 * @description
 * FEAT-007 重構版本：支援表頭-明細架構的 OM 費用表單組件。
 *
 * 建立模式：
 * - 填寫表頭資訊（名稱、描述、財年、類別）
 * - 新增至少一個明細項目（每個項目有獨立 OpCo、預算、日期）
 * - 一次提交表頭 + 所有明細
 * - 使用 createWithItems API
 *
 * 編輯模式：
 * - 僅編輯表頭資訊
 * - 明細項目在詳情頁面使用 OMExpenseItemList 管理
 * - 使用 update API
 *
 * @component OMExpenseForm
 *
 * @features
 * - 表單模式切換（建立 vs 編輯）
 * - FEAT-007 表頭-明細架構支援
 * - 建立時可新增多個明細項目
 * - 每個項目獨立 OpCo、預算、日期
 * - 即時預算總額計算
 * - 完整表單驗證
 * - 國際化支援
 *
 * @author IT Department
 * @since Module 4 - OM Expense Management
 * @lastModified 2025-12-05 (FEAT-007: Header-Detail Architecture)
 */

'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui';
import { api } from '@/lib/trpc';
import { cn } from '@/lib/utils';

// ============================================================
// Types
// ============================================================

interface ItemInput {
  id: string; // Temporary ID for local state management
  name: string;
  description?: string;
  opCoId: string;
  budgetAmount: number;
  currencyId?: string;
  startDate?: string;
  endDate: string;
}

interface OMExpenseFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<{
    id: string;
    name: string;
    description: string | undefined;
    financialYear: number;
    category: string;
    vendorId: string | undefined;
    sourceExpenseId: string | undefined;
    defaultOpCoId: string | undefined;
    // FEAT-007: Legacy fields (deprecated, for backward compatibility)
    opCoId?: string;
    budgetAmount?: number;
    startDate?: string;
    endDate?: string;
    // Source expense info
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

// ============================================================
// Utility Functions
// ============================================================

function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-HK', {
    style: 'currency',
    currency: 'HKD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ============================================================
// Component
// ============================================================

export default function OMExpenseForm({ mode, initialData }: OMExpenseFormProps) {
  const t = useTranslations('omExpenses.form');
  const tItems = useTranslations('omExpenses.items');
  const tItemFields = useTranslations('omExpenses.itemFields');
  const tMessages = useTranslations('omExpenses.messages');
  const tCommon = useTranslations('common');
  const tValidation = useTranslations('validation');
  const router = useRouter();
  const { toast } = useToast();

  // ============================================================
  // State for Items (Create Mode Only)
  // ============================================================
  const [items, setItems] = useState<ItemInput[]>([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemInput | null>(null);

  // Calculate total budget from items
  const totalBudgetAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.budgetAmount, 0),
    [items]
  );

  // ============================================================
  // Zod Schema
  // ============================================================
  const headerSchema = z.object({
    name: z.string().min(1, tValidation('required')).max(200),
    description: z.string().optional(),
    financialYear: z.number().int().min(2000).max(2100),
    category: z.string().min(1, tValidation('required')).max(100),
    vendorId: z.string().optional(),
    sourceExpenseId: z.string().optional(),
    defaultOpCoId: z.string().optional(),
  });

  type HeaderFormData = z.infer<typeof headerSchema>;

  // ============================================================
  // Data Queries
  // ============================================================
  const { data: opCos } = api.operatingCompany.getAll.useQuery();
  const { data: vendors } = api.vendor.getAll.useQuery({ page: 1, limit: 100 });
  const { data: expenseCategories } = api.expenseCategory.getActive.useQuery();
  const { data: currencies } = api.currency.getAll.useQuery({});
  const { data: expenses } = api.expense.getAll.useQuery({ page: 1, limit: 100 });

  // ============================================================
  // Mutations
  // ============================================================

  // FEAT-007: Create with items
  const createWithItemsMutation = api.omExpense.createWithItems.useMutation({
    onSuccess: (data) => {
      toast({
        title: tCommon('success'),
        description: tMessages('createSuccess'),
      });
      router.push(`/om-expenses/${data?.id}`);
    },
    onError: (error) => {
      toast({
        title: tCommon('error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Legacy: Create (single item, backward compatible)
  const createMutation = api.omExpense.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: tCommon('success'),
        description: tMessages('createSuccess'),
      });
      if (data?.id) {
        router.push(`/om-expenses/${data.id}`);
      } else {
        router.push('/om-expenses');
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

  // Update (header only)
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

  // ============================================================
  // Form Setup
  // ============================================================
  const form = useForm<HeaderFormData>({
    resolver: zodResolver(headerSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      financialYear: initialData?.financialYear || new Date().getFullYear(),
      category: initialData?.category || '',
      vendorId: initialData?.vendorId || '',
      sourceExpenseId: initialData?.sourceExpenseId || '',
      defaultOpCoId: initialData?.defaultOpCoId || initialData?.opCoId || '',
    },
  });

  // Reset form when initialData updates (edit mode)
  useEffect(() => {
    if (initialData && mode === 'edit') {
      form.reset({
        name: initialData.name || '',
        description: initialData.description || '',
        financialYear: initialData.financialYear || new Date().getFullYear(),
        category: initialData.category || '',
        vendorId: initialData.vendorId || '',
        sourceExpenseId: initialData.sourceExpenseId || '',
        defaultOpCoId: initialData.defaultOpCoId || initialData.opCoId || '',
      });
    }
  }, [initialData, mode, form]);

  // ============================================================
  // Item Management (Create Mode)
  // ============================================================

  const handleAddItem = useCallback(() => {
    const defaultOpCoId = form.getValues('defaultOpCoId');
    const newItem: ItemInput = {
      id: generateTempId(),
      name: '',
      description: '',
      opCoId: defaultOpCoId || '',
      budgetAmount: 0,
      currencyId: '',
      startDate: '',
      endDate: '',
    };
    setEditingItem(newItem);
    setShowItemForm(true);
  }, [form]);

  const handleSaveItem = useCallback((item: ItemInput) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.id === item.id);
      if (existingIndex >= 0) {
        // Update existing
        const updated = [...prev];
        updated[existingIndex] = item;
        return updated;
      } else {
        // Add new
        return [...prev, item];
      }
    });
    setShowItemForm(false);
    setEditingItem(null);
  }, []);

  const handleEditItem = useCallback((item: ItemInput) => {
    setEditingItem(item);
    setShowItemForm(true);
  }, []);

  const handleDeleteItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const handleCancelItemForm = useCallback(() => {
    setShowItemForm(false);
    setEditingItem(null);
  }, []);

  // ============================================================
  // Form Submit
  // ============================================================
  const onSubmit = (data: HeaderFormData) => {
    const cleanedData = {
      ...data,
      vendorId: data.vendorId || undefined,
      sourceExpenseId: data.sourceExpenseId || undefined,
      defaultOpCoId: data.defaultOpCoId || undefined,
    };

    if (mode === 'create') {
      if (items.length === 0) {
        toast({
          title: tCommon('error'),
          description: tItems('atLeastOne', { defaultValue: '至少需要一個明細項目' }),
          variant: 'destructive',
        });
        return;
      }

      // FEAT-007: Use createWithItems
      createWithItemsMutation.mutate({
        ...cleanedData,
        items: items.map((item, index) => ({
          name: item.name,
          description: item.description || undefined,
          sortOrder: index,
          budgetAmount: item.budgetAmount,
          opCoId: item.opCoId,
          currencyId: item.currencyId || undefined,
          startDate: item.startDate || undefined,
          endDate: item.endDate,
        })),
      });
    } else if (mode === 'edit' && initialData?.id) {
      updateMutation.mutate({
        id: initialData.id,
        ...cleanedData,
      });
    }
  };

  const isSubmitting =
    createWithItemsMutation.isPending ||
    createMutation.isPending ||
    updateMutation.isPending;

  // ============================================================
  // Render
  // ============================================================
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t('basicInfo.title', { defaultValue: '基本資訊' })}
            </CardTitle>
            <CardDescription>
              {mode === 'create' ? t('create.subtitle') : t('edit.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
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

            {/* Financial Year and Category */}
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('fields.category.placeholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {expenseCategories?.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.code} - {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Vendor and Default OpCo Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t('opCoAndVendor.title', { defaultValue: '供應商與預設 OpCo' })}
            </CardTitle>
            <CardDescription>
              {t('opCoAndVendor.description', { defaultValue: '選擇關聯供應商和預設營運公司（用於新增項目）' })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Default OpCo */}
              <FormField
                control={form.control}
                name="defaultOpCoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('fields.defaultOpCo.label', { defaultValue: '預設 OpCo' })}
                    </FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === '__none__' ? '' : value)}
                      value={field.value || '__none__'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('fields.opCo.placeholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">
                          {t('fields.defaultOpCo.noSelection', { defaultValue: '不指定' })}
                        </SelectItem>
                        {opCos?.map((opCo) => (
                          <SelectItem key={opCo.id} value={opCo.id}>
                            {opCo.code} - {opCo.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {t('fields.defaultOpCo.description', {
                        defaultValue: '新增明細項目時的預設值',
                      })}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Vendor */}
              <FormField
                control={form.control}
                name="vendorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('fields.vendor.label')}</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === '__none__' ? '' : value)}
                      value={field.value || '__none__'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('fields.vendor.placeholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">
                          {t('fields.vendor.noSelection', { defaultValue: '不指定' })}
                        </SelectItem>
                        {vendors?.items.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Source Expense Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('sourceExpense.title')}</CardTitle>
            <CardDescription>{t('sourceExpense.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="sourceExpenseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sourceExpense.label')}</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === '__none__' ? '' : value)}
                    value={field.value || '__none__'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('sourceExpense.noSelection')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">
                        {t('sourceExpense.noSelection')}
                      </SelectItem>
                      {expenses?.items.map((expense) => (
                        <SelectItem key={expense.id} value={expense.id}>
                          {expense.name} - {expense.purchaseOrder?.poNumber || 'N/A'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>{t('sourceExpense.hint')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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

        {/* FEAT-007: Items Card (Create Mode Only) */}
        {mode === 'create' && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>
                    {t('itemsSection.title', { defaultValue: '明細項目' })}
                  </CardTitle>
                  <CardDescription>
                    {tItems('description', {
                      defaultValue: '新增 OM 費用的明細項目（至少一個）',
                    })}
                  </CardDescription>
                </div>
                <Button type="button" onClick={handleAddItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  {tItems('addItem', { defaultValue: '新增項目' })}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Item Form (Inline) */}
              {showItemForm && (
                <InlineItemForm
                  item={editingItem}
                  opCos={opCos || []}
                  currencies={currencies || []}
                  onSave={handleSaveItem}
                  onCancel={handleCancelItemForm}
                />
              )}

              {/* Items Table */}
              {items.length > 0 ? (
                <div className="mt-4 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>{tItemFields('name.label')}</TableHead>
                        <TableHead>{tItemFields('opCo.label')}</TableHead>
                        <TableHead className="text-right">{tItemFields('budgetAmount.label')}</TableHead>
                        <TableHead className="text-right">{tItemFields('endDate.label')}</TableHead>
                        <TableHead className="w-24">{tCommon('actions.title')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                              {opCos?.find((o) => o.id === item.opCoId)?.code || '-'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(item.budgetAmount)}
                          </TableCell>
                          <TableCell className="text-right">{item.endDate || '-'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditItem(item)}
                              >
                                {tCommon('actions.edit')}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={3} className="font-semibold">
                          {tItems('total', { defaultValue: '總計' })} ({items.length}{' '}
                          {tItems('itemCount', { defaultValue: '項' })})
                        </TableCell>
                        <TableCell className="text-right font-semibold font-mono">
                          {formatCurrency(totalBudgetAmount)}
                        </TableCell>
                        <TableCell colSpan={2}></TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              ) : (
                !showItemForm && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      {tItems('noItems', { defaultValue: '尚無明細項目' })}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tItems('addFirstItem', { defaultValue: '點擊上方按鈕新增第一個項目' })}
                    </p>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        )}

        {/* Form Actions */}
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
                ℹ️ {t('createNoticeNew', {
                  defaultValue: '建立後，每個明細項目會自動產生 12 個月度記錄（1-12 月，初始金額為 0）。您可以在詳情頁面編輯各項目的月度實際支出。',
                })}
              </p>
            </CardContent>
          </Card>
        )}
      </form>
    </Form>
  );
}

// ============================================================
// Inline Item Form Sub-Component
// ============================================================

interface InlineItemFormProps {
  item: ItemInput | null;
  opCos: Array<{ id: string; code: string; name: string }>;
  currencies: Array<{ id: string; code: string; name: string }>;
  onSave: (item: ItemInput) => void;
  onCancel: () => void;
}

function InlineItemForm({
  item,
  opCos,
  currencies,
  onSave,
  onCancel,
}: InlineItemFormProps) {
  const t = useTranslations('omExpenses.itemFields');
  const tCommon = useTranslations('common');
  const tValidation = useTranslations('validation');

  const [formData, setFormData] = useState<ItemInput>(
    item || {
      id: generateTempId(),
      name: '',
      description: '',
      opCoId: '',
      budgetAmount: 0,
      currencyId: '',
      startDate: '',
      endDate: '',
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = tValidation('required');
    }
    if (!formData.opCoId) {
      newErrors.opCoId = tValidation('required');
    }
    if (formData.budgetAmount < 0) {
      newErrors.budgetAmount = tValidation('positiveNumber');
    }
    if (!formData.endDate) {
      newErrors.endDate = tValidation('required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave(formData);
    }
  };

  return (
    <Card className="mb-4 border-2 border-primary/20">
      <CardContent className="pt-4">
        <div className="space-y-4">
          {/* Item Name */}
          <div>
            <label className="text-sm font-medium">
              {t('name.label')} <span className="text-destructive">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={t('name.placeholder')}
              className={cn(errors.name && 'border-destructive')}
            />
            {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
          </div>

          {/* OpCo and Budget */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">
                {t('opCo.label')} <span className="text-destructive">*</span>
              </label>
              <select
                value={formData.opCoId}
                onChange={(e) => setFormData((prev) => ({ ...prev, opCoId: e.target.value }))}
                className={cn(
                  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
                  errors.opCoId && 'border-destructive'
                )}
              >
                <option value="">{t('opCo.placeholder')}</option>
                {opCos.map((opCo) => (
                  <option key={opCo.id} value={opCo.id}>
                    {opCo.code} - {opCo.name}
                  </option>
                ))}
              </select>
              {errors.opCoId && <p className="text-sm text-destructive mt-1">{errors.opCoId}</p>}
            </div>

            <div>
              <label className="text-sm font-medium">
                {t('budgetAmount.label')} <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={formData.budgetAmount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    budgetAmount: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder={t('budgetAmount.placeholder')}
                className={cn(errors.budgetAmount && 'border-destructive')}
              />
              {errors.budgetAmount && (
                <p className="text-sm text-destructive mt-1">{errors.budgetAmount}</p>
              )}
            </div>
          </div>

          {/* Currency and End Date */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">{t('currency.label')}</label>
              <select
                value={formData.currencyId || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, currencyId: e.target.value || undefined }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">{t('currency.placeholder')}</option>
                {currencies.map((currency) => (
                  <option key={currency.id} value={currency.id}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">
                {t('endDate.label')} <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                className={cn(errors.endDate && 'border-destructive')}
              />
              {errors.endDate && <p className="text-sm text-destructive mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              {tCommon('actions.cancel')}
            </Button>
            <Button type="button" onClick={handleSave}>
              {item ? tCommon('actions.save') : tCommon('actions.add')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
