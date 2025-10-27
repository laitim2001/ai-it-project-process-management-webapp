'use client';

/**
 * ExpenseForm 組件 - Module 5 費用記錄表頭明細表單
 *
 * 功能說明：
 * - 費用基本信息（name, purchaseOrderId, projectId, vendorId, invoiceNumber, invoiceDate 等）
 * - 費用項目明細表格（動態新增/刪除行）
 * - 明細字段：itemName, description, amount, category
 * - 自動計算總金額
 * - 表單驗證（至少一個費用項目）
 *
 * Module 5: Expense 表頭明細重構 - 前端實施
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';
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
 */
const formSchema = z.object({
  name: z.string().min(1, '費用名稱為必填'),
  description: z.string().optional(),
  purchaseOrderId: z.string().min(1, '請選擇採購單'),
  projectId: z.string().min(1, '請選擇專案'),
  budgetCategoryId: z.string().optional(),
  vendorId: z.string().optional(),
  invoiceNumber: z.string().min(1, '發票號碼為必填'),
  invoiceDate: z.string().min(1, '發票日期為必填'),
  expenseDate: z.string().optional(),
  requiresChargeOut: z.boolean().default(false),
  isOperationMaint: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

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
  const router = useRouter();
  const { toast } = useToast();

  // ===== State Management =====
  const [items, setItems] = useState<ExpenseItemFormData[]>(
    initialData?.items || [{ itemName: '', amount: 0, sortOrder: 0 }]
  );

  // ===== React Hook Form =====
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
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
        title: '創建成功',
        description: `費用記錄 ${data.name} 已成功創建`,
      });
      router.push(`/expenses/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: '創建失敗',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = api.expense.update.useMutation({
    onSuccess: (data) => {
      toast({
        title: '更新成功',
        description: `費用記錄 ${data.name} 已成功更新`,
      });
      router.push(`/expenses/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: '更新失敗',
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
        title: '無法刪除',
        description: '至少需要保留一個費用項目',
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
        title: '驗證失敗',
        description: '至少需要一個費用項目',
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
        title: '驗證失敗',
        description: '請填寫所有費用項目的必填信息（名稱、金額）',
        variant: 'destructive',
      });
      return;
    }

    // 組裝提交數據
    const submitData = {
      ...values,
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
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 費用名稱 */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>費用名稱 <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="如: Q1 伺服器維運費用" {...field} />
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
                  <FormLabel>發票號碼 <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="如: AB-12345678" {...field} />
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
                  <FormLabel>關聯採購單 <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="">選擇採購單</option>
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
                  <FormLabel>關聯專案 <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="">選擇專案</option>
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
                  <FormLabel>發票日期 <span className="text-destructive">*</span></FormLabel>
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
                  <FormLabel>費用日期</FormLabel>
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
                  <FormLabel>供應商（可選）</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="">無</option>
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
                  <FormLabel>預算類別（可選）</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="">無</option>
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
                      <FormLabel>需要從預算池扣款</FormLabel>
                      <FormDescription>
                        勾選此項表示此費用需要從專案預算池中扣除金額
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
                      <FormLabel>維運費用</FormLabel>
                      <FormDescription>
                        勾選此項表示此費用屬於系統維運費用
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
                    <FormLabel>描述（可選）</FormLabel>
                    <FormControl>
                      <Textarea placeholder="費用記錄描述..." rows={3} {...field} />
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
              <CardTitle>費用項目</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-2" />
                新增費用項目
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
                />
              ))}

              {items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>尚未添加費用項目</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={handleAddItem}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    新增第一個費用項目
                  </Button>
                </div>
              )}

              {/* 總計顯示 */}
              {items.length > 0 && (
                <div className="mt-6 p-4 bg-primary/5 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">總項目數</p>
                      <p className="text-2xl font-bold">{items.length}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">費用總金額</p>
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
            {isEdit ? '更新費用記錄' : '創建費用記錄'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            取消
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
}

function ExpenseItemFormRow({ item, index, onUpdate, onRemove }: ExpenseItemFormRowProps) {
  return (
    <div className="grid grid-cols-12 gap-4 p-4 border rounded-lg bg-card">
      {/* 費用項目名稱 */}
      <div className="col-span-4">
        <Label>費用項目名稱 <span className="text-destructive">*</span></Label>
        <Input
          value={item.itemName}
          onChange={(e) => onUpdate(index, 'itemName', e.target.value)}
          placeholder="如: 伺服器維護費"
        />
      </div>

      {/* 金額 */}
      <div className="col-span-3">
        <Label>金額 <span className="text-destructive">*</span></Label>
        <Input
          type="number"
          step="0.01"
          value={item.amount}
          onChange={(e) => onUpdate(index, 'amount', parseFloat(e.target.value) || 0)}
          placeholder="0.00"
        />
      </div>

      {/* 類別 */}
      <div className="col-span-4">
        <Label>類別（可選）</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={item.category || ''}
          onChange={(e) => onUpdate(index, 'category', e.target.value)}
        >
          <option value="">無</option>
          <option value="Hardware">Hardware</option>
          <option value="Software">Software</option>
          <option value="Consulting">Consulting</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Other">Other</option>
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
        <Label>描述（可選）</Label>
        <Textarea
          value={item.description || ''}
          onChange={(e) => onUpdate(index, 'description', e.target.value)}
          placeholder="費用項目描述..."
          rows={2}
        />
      </div>
    </div>
  );
}
