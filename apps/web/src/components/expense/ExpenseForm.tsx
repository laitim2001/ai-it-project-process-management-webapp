/**
 * @fileoverview Expense Form Component - 費用記錄表頭明細表單
 *
 * @description
 * 統一的費用記錄建立/編輯表單組件，支援表頭明細架構。
 * 整合費用基本資訊和動態費用項目明細表格，提供完整的費用記錄管理功能。
 * 使用 React Hook Form + Zod 進行表單驗證，並支援自動總金額計算。
 *
 * @component ExpenseForm
 *
 * @features
 * - 表單模式切換（建立 vs 編輯）
 * - 費用基本信息輸入（名稱、發票號碼、日期等）
 * - 採購單和專案關聯選擇
 * - 動態費用項目明細表格（新增/編輯/刪除行）
 * - 自動計算總金額和即時顯示
 * - 完整表單驗證（Zod schema + 業務規則）
 * - 布林選項支援（requiresChargeOut, isOperationMaint）
 * - 國際化支援（繁中/英文）
 *
 * @props
 * @param {Object} props - 組件屬性
 * @param {any} [props.initialData] - 編輯模式的初始數據（包含 items）
 * @param {boolean} [props.isEdit=false] - 是否為編輯模式
 *
 * @example
 * ```tsx
 * // 建立模式
 * <ExpenseForm isEdit={false} />
 *
 * // 編輯模式
 * <ExpenseForm
 *   isEdit={true}
 *   initialData={{
 *     id: 'expense-1',
 *     name: '辦公設備採購',
 *     items: [{ itemName: '電腦', amount: 50000 }]
 *   }}
 * />
 * ```
 *
 * @dependencies
 * - react-hook-form: 表單狀態管理和驗證
 * - @hookform/resolvers/zod: Zod 整合
 * - @tanstack/react-query: tRPC 查詢和 mutation
 * - shadcn/ui: Form, Input, Textarea, Card, Checkbox
 * - next-intl: 國際化
 *
 * @related
 * - packages/api/src/routers/expense.ts - 費用 API Router
 * - apps/web/src/components/expense/ExpenseActions.tsx - 費用操作組件
 * - apps/web/src/app/[locale]/expenses/new/page.tsx - 建立頁面
 * - apps/web/src/app/[locale]/expenses/[id]/edit/page.tsx - 編輯頁面
 *
 * @author IT Department
 * @since Epic 6 - Expense Recording & Financial Integration
 * @lastModified 2025-11-14 (FIX-036: 修復 vendorId 欄位錯誤)
 */

'use client';

import { useState } from 'react';
import { useRouter } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Loader2, Receipt, Trash2 } from 'lucide-react';

// ========================================
// Types & Schemas
// ========================================

/**
 * 費用項目表單數據
 */
interface ExpenseItemFormData {
  id?: string; // 編輯時有 id
  itemName: string;
  description?: string;
  amount: number;
  category?: string;
  sortOrder: number;
}

/**
 * 表單驗證 Schema
 * 注意:Zod 驗證消息使用翻譯 keys
 */
const getFormSchema = (t: any) => z.object({
  name: z.string().min(1, t('validation.nameRequired')),
  description: z.string().optional(),
  purchaseOrderId: z.string().min(1, t('validation.purchaseOrderRequired')),
  projectId: z.string().min(1, t('validation.projectRequired')),
  budgetCategoryId: z.string().optional(),
  vendorId: z.string().optional(),
  invoiceNumber: z.string().min(1, t('validation.invoiceNumberRequired')),
  invoiceDate: z.string().min(1, t('validation.invoiceDateRequired')),
  expenseDate: z.string().optional(),
  requiresChargeOut: z.boolean().default(false),
  isOperationMaint: z.boolean().default(false),
});

type FormValues = z.infer<ReturnType<typeof getFormSchema>>;

/**
 * 組件 Props
 */
interface ExpenseFormProps {
  initialData?: any; // 編輯時的初始數據
  isEdit?: boolean;
}

// ========================================
// 工具函數
// ========================================

/**
 * 格式化貨幣顯示
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// ========================================
// Main Component
// ========================================

export function ExpenseForm({ initialData, isEdit = false }: ExpenseFormProps) {
  const t = useTranslations('expenses');
  const commonT = useTranslations('common');
  const router = useRouter();
  const { toast } = useToast();

  // ===== State Management =====
  const [items, setItems] = useState<ExpenseItemFormData[]>(
    initialData?.items || [{ itemName: '', amount: 0, sortOrder: 0 }]
  );

  // ===== React Hook Form =====
  const form = useForm<FormValues>({
    resolver: zodResolver(getFormSchema(t)),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      purchaseOrderId: initialData?.purchaseOrderId || '',
      projectId: initialData?.projectId || '',
      budgetCategoryId: initialData?.budgetCategoryId || '',
      vendorId: initialData?.vendorId || '',
      invoiceNumber: initialData?.invoiceNumber || '',
      invoiceDate: initialData?.invoiceDate
        ? new Date(initialData.invoiceDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      expenseDate: initialData?.expenseDate
        ? new Date(initialData.expenseDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      requiresChargeOut: initialData?.requiresChargeOut || false,
      isOperationMaint: initialData?.isOperationMaint || false,
    },
  });

  // ===== 查詢數據 =====
  const { data: projects } = api.project.getAll.useQuery({
    page: 1,
    limit: 100,
  });

  const { data: purchaseOrders } = api.purchaseOrder.getAll.useQuery({
    page: 1,
    limit: 100,
  });

  const { data: vendors } = api.vendor.getAll.useQuery({
    page: 1,
    limit: 100,
  });

  const { data: budgetCategories } = api.budgetPool.getAll.useQuery({
    page: 1,
    limit: 100,
  });

  // ===== Mutations =====
  const createMutation = api.expense.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: commonT('success'),
        description: t('messages.createSuccess', { name: data.name }),
      });
      router.push(`/expenses/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: t('messages.createError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = api.expense.update.useMutation({
    onSuccess: (data) => {
      toast({
        title: commonT('success'),
        description: t('messages.updateSuccess', { name: data.name }),
      });
      router.push(`/expenses/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: t('messages.updateError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // ===== 計算總金額 =====
  const totalAmount = items.reduce((sum, item) => {
    return sum + item.amount;
  }, 0);

  // ===== 明細操作函數 =====

  /**
   * 新增費用項目
   */
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        itemName: '',
        amount: 0,
        sortOrder: items.length,
      },
    ]);
  };

  /**
   * 更新費用項目
   */
  const handleUpdateItem = (index: number, field: keyof ExpenseItemFormData, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  /**
   * 刪除費用項目
   */
  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      toast({
        title: tCommon('messages.error'),
        description: t('form.validation.atLeastOneItem'),
        variant: 'destructive',
      });
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  // ===== 表單提交 =====
  const onSubmit = async (values: FormValues) => {
    // 驗證費用項目
    if (items.length === 0) {
      toast({
        title: tCommon('messages.validationError'),
        description: t('form.validation.atLeastOneItem'),
        variant: 'destructive',
      });
      return;
    }

    // 驗證每個項目的必填字段
    const invalidItems = items.filter(
      (item) => !item.itemName.trim() || item.amount < 0
    );

    if (invalidItems.length > 0) {
      toast({
        title: tCommon('messages.validationError'),
        description: t('form.validation.itemNameRequired'),
        variant: 'destructive',
      });
      return;
    }

    // FIX-036: 組裝提交數據，過濾掉 vendorId（Expense 模型沒有此欄位）
    // 類似 PurchaseOrderForm 的 FIX-029，明確列出欄位而非展開 ...values
    const submitData = {
      name: values.name,
      description: values.description,
      purchaseOrderId: values.purchaseOrderId,
      projectId: values.projectId,
      invoiceNumber: values.invoiceNumber,
      invoiceDate: values.invoiceDate,
      ...(values.budgetCategoryId && { budgetCategoryId: values.budgetCategoryId }),
      requiresChargeOut: values.requiresChargeOut || false,
      isOperationMaint: values.isOperationMaint || false,
      items: items.map((item, index) => ({
        ...(item.id && { id: item.id }), // 編輯時包含 id
        itemName: item.itemName,
        description: item.description,
        amount: item.amount,
        category: item.category,
        sortOrder: index,
      })),
    };

    // 調用 API
    if (isEdit && initialData?.id) {
      updateMutation.mutate({
        id: initialData.id,
        ...submitData,
      });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const isSubmitting = createMutation.isLoading || updateMutation.isLoading;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* 基本信息卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('form.basicInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 費用名稱 */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.fields.name.label')} <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder={t('form.fields.name.placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 發票號碼 */}
            <FormField
              control={form.control}
              name="invoiceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.fields.invoiceNumber.label')} <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder={t('form.fields.invoiceNumber.placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 關聯採購單 */}
            <FormField
              control={form.control}
              name="purchaseOrderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.fields.purchaseOrder.label')} <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="">{t('form.fields.purchaseOrder.placeholder')}</option>
                      {purchaseOrders?.items.map((po) => (
                        <option key={po.id} value={po.id}>
                          {po.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 關聯專案 */}
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.fields.project.label')} <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="">{t('form.fields.project.placeholder')}</option>
                      {projects?.items.map((proj) => (
                        <option key={proj.id} value={proj.id}>
                          {proj.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 發票日期 */}
            <FormField
              control={form.control}
              name="invoiceDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.fields.invoiceDate.label')} <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 費用日期 */}
            <FormField
              control={form.control}
              name="expenseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.fields.expenseDate.label')}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 供應商（可選） */}
            <FormField
              control={form.control}
              name="vendorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.fields.vendor.label')}</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="">{t('form.fields.vendor.placeholder')}</option>
                      {vendors?.items.map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 預算類別（可選） */}
            <FormField
              control={form.control}
              name="budgetCategoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.fields.budgetCategory.label')}</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="">{t('form.fields.budgetCategory.placeholder')}</option>
                      {budgetCategories?.items.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 布林選項 */}
            <div className="col-span-2 space-y-4">
              <FormField
                control={form.control}
                name="requiresChargeOut"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>{t('form.fields.requiresChargeOut.label')}</FormLabel>
                      <FormDescription>
                        {t('form.fields.requiresChargeOut.description')}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isOperationMaint"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>{t('form.fields.isOperationMaint.label')}</FormLabel>
                      <FormDescription>
                        {t('form.fields.isOperationMaint.description')}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* 描述 */}
            <div className="col-span-2">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.fields.description.label')}</FormLabel>
                    <FormControl>
                      <Textarea placeholder={t('form.fields.description.placeholder')} rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* 費用項目明細 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('form.expenseItems')}</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-2" />
                {t('form.addItem')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item, index) => (
                <ExpenseItemFormRow
                  key={index}
                  item={item}
                  index={index}
                  onUpdate={handleUpdateItem}
                  onRemove={handleRemoveItem}
                  t={t}
                />
              ))}

              {items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('form.noItems')}</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={handleAddItem}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('form.addFirstItem')}
                  </Button>
                </div>
              )}

              {/* 總計顯示 */}
              {items.length > 0 && (
                <div className="mt-6 p-4 bg-primary/5 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('form.totalItems')}</p>
                      <p className="text-2xl font-bold">{items.length}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{t('form.totalAmount')}</p>
                      <p className="text-3xl font-bold text-primary">
                        {formatCurrency(totalAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 提交按鈕 */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting || items.length === 0}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit
              ? t('form.edit.title')
              : t('form.create.title')}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {commonT('actions.cancel')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ========================================
// ExpenseItemFormRow 子組件
// ========================================

interface ExpenseItemFormRowProps {
  item: ExpenseItemFormData;
  index: number;
  onUpdate: (index: number, field: keyof ExpenseItemFormData, value: any) => void;
  onRemove: (index: number) => void;
  t: (key: string) => string;
}

function ExpenseItemFormRow({ item, index, onUpdate, onRemove, t }: ExpenseItemFormRowProps) {
  return (
    <div className="grid grid-cols-12 gap-4 p-4 border rounded-lg bg-card">
      {/* 費用項目名稱 */}
      <div className="col-span-4">
        <Label>{t('form.itemFields.itemName.label')} <span className="text-destructive">*</span></Label>
        <Input
          name={`items[${index}].itemName`}
          value={item.itemName}
          onChange={(e) => onUpdate(index, 'itemName', e.target.value)}
          placeholder={t('form.itemFields.itemName.placeholder')}
        />
      </div>

      {/* 金額 */}
      <div className="col-span-3">
        <Label>{t('form.itemFields.amount.label')} <span className="text-destructive">*</span></Label>
        <Input
          name={`items[${index}].amount`}
          type="number"
          step="0.01"
          value={item.amount}
          onChange={(e) => onUpdate(index, 'amount', parseFloat(e.target.value) || 0)}
          placeholder={t('form.itemFields.amount.placeholder')}
        />
      </div>

      {/* 類別 */}
      <div className="col-span-4">
        <Label>{t('form.itemFields.category.label')}</Label>
        <select
          name={`items[${index}].category`}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={item.category || ''}
          onChange={(e) => onUpdate(index, 'category', e.target.value)}
        >
          <option value="">{t('form.itemFields.category.placeholder')}</option>
          <option value="Hardware">{t('form.itemFields.category.options.hardware')}</option>
          <option value="Software">{t('form.itemFields.category.options.software')}</option>
          <option value="Consulting">{t('form.itemFields.category.options.consulting')}</option>
          <option value="Maintenance">{t('form.itemFields.category.options.maintenance')}</option>
          <option value="Other">{t('form.itemFields.category.options.other')}</option>
        </select>
      </div>

      {/* 刪除按鈕 */}
      <div className="col-span-1 flex items-end">
        <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(index)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      {/* 描述 */}
      <div className="col-span-12">
        <Label>{t('form.itemFields.description.label')}</Label>
        <Textarea
          name={`items[${index}].description`}
          value={item.description || ''}
          onChange={(e) => onUpdate(index, 'description', e.target.value)}
          placeholder={t('form.itemFields.description.placeholder')}
          rows={2}
        />
      </div>
    </div>
  );
}
