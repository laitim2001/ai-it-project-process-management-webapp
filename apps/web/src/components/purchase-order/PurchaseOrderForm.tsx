'use client';

/**
 * PurchaseOrderForm 組件 - Module 4 表頭明細表單
 *
 * 功能說明：
 * - 採購單基本信息（name, description, projectId, vendorId, quoteId, date）
 * - 採購品項明細表格（動態新增/刪除行）
 * - 明細字段：itemName, description, quantity, unitPrice
 * - 自動計算小計和總金額
 * - 表單驗證（至少一個品項）
 *
 * Module 4: PurchaseOrder 表頭明細重構 - 前端實施
 */

import { useState, useEffect } from 'react';
import { useRouter } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Loader2, Package, Trash2 } from 'lucide-react';

// ========================================
// Types & Schemas
// ========================================

/**
 * 採購品項表單數據
 */
interface POItemFormData {
  id?: string; // 編輯時有 id
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  sortOrder: number;
}

type FormValues = {
  name: string;
  description?: string;
  projectId: string;
  vendorId: string;
  quoteId?: string;
  date?: string;
};

/**
 * 組件 Props
 */
interface PurchaseOrderFormProps {
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

export function PurchaseOrderForm({ initialData, isEdit = false }: PurchaseOrderFormProps) {
  const router = useRouter();
  const t = useTranslations('purchaseOrders');
  const tCommon = useTranslations('common');
  const { toast } = useToast();

  // ===== State Management =====
  const [items, setItems] = useState<POItemFormData[]>(
    initialData?.items || [{ itemName: '', quantity: 1, unitPrice: 0, sortOrder: 0 }]
  );

  // ===== 表單驗證 Schema (with i18n) =====
  const formSchema = z.object({
    name: z.string().min(1, t('form.toast.validationFailed')),
    description: z.string().optional(),
    projectId: z.string().min(1, tCommon('selectPlaceholder')),
    vendorId: z.string().min(1, tCommon('selectPlaceholder')),
    quoteId: z.string().optional(),
    date: z.string().optional(),
  });

  // ===== React Hook Form =====
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      projectId: initialData?.projectId || '',
      vendorId: initialData?.vendorId || '',
      quoteId: initialData?.quoteId || '',
      date: initialData?.date
        ? new Date(initialData.date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    },
  });

  // ===== 查詢數據 =====
  const { data: projects } = api.project.getAll.useQuery({
    page: 1,
    limit: 100,
  });

  const { data: vendors } = api.vendor.getAll.useQuery({
    page: 1,
    limit: 100,
  });

  const { data: quotes } = api.quote.getAll.useQuery({
    page: 1,
    limit: 100,
  });

  // ===== Mutations =====
  const createMutation = api.purchaseOrder.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: t('form.toast.createSuccess'),
        description: t('form.toast.createSuccessDesc', { name: data.name }),
      });
      router.push(`/purchase-orders/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: t('form.toast.createFailed'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = api.purchaseOrder.update.useMutation({
    onSuccess: (data) => {
      toast({
        title: t('form.toast.updateSuccess'),
        description: t('form.toast.updateSuccessDesc', { name: data.name }),
      });
      router.push(`/purchase-orders/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: t('form.toast.updateFailed'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // ===== 計算總金額 =====
  const totalAmount = items.reduce((sum, item) => {
    return sum + item.quantity * item.unitPrice;
  }, 0);

  // ===== 明細操作函數 =====

  /**
   * 新增品項
   */
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        itemName: '',
        quantity: 1,
        unitPrice: 0,
        sortOrder: items.length,
      },
    ]);
  };

  /**
   * 更新品項
   */
  const handleUpdateItem = (index: number, field: keyof POItemFormData, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  /**
   * 刪除品項
   */
  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      toast({
        title: t('form.toast.cannotDelete'),
        description: t('form.toast.minOneItem'),
        variant: 'destructive',
      });
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  // ===== 表單提交 =====
  const onSubmit = async (values: FormValues) => {
    // 驗證品項
    if (items.length === 0) {
      toast({
        title: t('form.toast.validationFailed'),
        description: t('form.toast.minOneItem'),
        variant: 'destructive',
      });
      return;
    }

    // 驗證每個品項的必填字段
    const invalidItems = items.filter(
      (item) => !item.itemName.trim() || item.quantity < 1 || item.unitPrice < 0
    );

    if (invalidItems.length > 0) {
      toast({
        title: t('form.toast.validationFailed'),
        description: t('form.toast.completeAllItems'),
        variant: 'destructive',
      });
      return;
    }

    // FIX-029: 過濾空 quoteId 以避免外鍵約束錯誤
    // 組裝提交數據
    const submitData = {
      name: values.name,
      description: values.description,
      projectId: values.projectId,
      vendorId: values.vendorId,
      ...(values.quoteId && values.quoteId.trim() !== '' && { quoteId: values.quoteId }),
      ...(values.date && { date: values.date }),
      items: items.map((item, index) => ({
        ...(item.id && { id: item.id }), // 編輯時包含 id
        itemName: item.itemName,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
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
            {/* PO 名稱 */}
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

            {/* 採購日期 */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.fields.date.label')}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 關聯項目 */}
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

            {/* 供應商 */}
            <FormField
              control={form.control}
              name="vendorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.fields.vendor.label')} <span className="text-destructive">*</span></FormLabel>
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

            {/* 關聯報價（可選） */}
            <FormField
              control={form.control}
              name="quoteId"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>{t('form.fields.quote.label')}</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="">{t('form.fields.quote.placeholder')}</option>
                      {quotes?.items.map((quote) => (
                        <option key={quote.id} value={quote.id}>
                          Quote #{quote.id} - {formatCurrency(quote.amount)}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

        {/* 採購品項明細 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('form.itemsSection.title')}</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-2" />
                {t('form.itemsSection.addItem')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item, index) => (
                <POItemFormRow
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
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('form.itemsSection.noItems')}</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={handleAddItem}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('form.itemsSection.addFirstItem')}
                  </Button>
                </div>
              )}

              {/* 總計顯示 */}
              {items.length > 0 && (
                <div className="mt-6 p-4 bg-primary/5 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('form.itemsSection.totalItems')}</p>
                      <p className="text-2xl font-bold">{items.length}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{t('form.itemsSection.totalAmount')}</p>
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
            {isEdit ? t('form.buttons.update') : t('form.buttons.create')}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {t('form.buttons.cancel')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ========================================
// POItemFormRow 子組件
// ========================================

interface POItemFormRowProps {
  item: POItemFormData;
  index: number;
  onUpdate: (index: number, field: keyof POItemFormData, value: any) => void;
  onRemove: (index: number) => void;
  t: any;
}

function POItemFormRow({ item, index, onUpdate, onRemove, t }: POItemFormRowProps) {
  const subtotal = item.quantity * item.unitPrice;

  return (
    <div className="grid grid-cols-12 gap-4 p-4 border rounded-lg bg-card">
      {/* 品項名稱 */}
      <div className="col-span-4">
        <Label>{t('items.itemName')} <span className="text-destructive">*</span></Label>
        <Input
          name={`items[${index}].itemName`}
          value={item.itemName}
          onChange={(e) => onUpdate(index, 'itemName', e.target.value)}
          placeholder={t('form.itemRow.itemNamePlaceholder')}
        />
      </div>

      {/* 數量 */}
      <div className="col-span-2">
        <Label>{t('items.quantity')} <span className="text-destructive">*</span></Label>
        <Input
          name={`items[${index}].quantity`}
          type="number"
          value={item.quantity}
          onChange={(e) => onUpdate(index, 'quantity', parseInt(e.target.value) || 1)}
          min="1"
        />
      </div>

      {/* 單價 */}
      <div className="col-span-2">
        <Label>{t('items.unitPrice')} <span className="text-destructive">*</span></Label>
        <Input
          name={`items[${index}].unitPrice`}
          type="number"
          step="0.01"
          value={item.unitPrice}
          onChange={(e) => onUpdate(index, 'unitPrice', parseFloat(e.target.value) || 0)}
          placeholder="0.00"
        />
      </div>

      {/* 小計 */}
      <div className="col-span-3">
        <Label>{t('items.subtotal')}</Label>
        <div className="p-2 bg-muted rounded-lg">
          <p className="text-lg font-semibold">{formatCurrency(subtotal)}</p>
        </div>
      </div>

      {/* 刪除按鈕 */}
      <div className="col-span-1 flex items-end">
        <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(index)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      {/* 描述 */}
      <div className="col-span-12">
        <Label>{t('items.description')}</Label>
        <Textarea
          name={`items[${index}].description`}
          value={item.description || ''}
          onChange={(e) => onUpdate(index, 'description', e.target.value)}
          placeholder={t('form.itemRow.descriptionPlaceholder')}
          rows={2}
        />
      </div>
    </div>
  );
}
