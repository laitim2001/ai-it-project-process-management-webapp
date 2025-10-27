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
import {
  Form,
  FormControl,
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

/**
 * 表單驗證 Schema
 */
const formSchema = z.object({
  name: z.string().min(1, 'PO 名稱為必填'),
  description: z.string().optional(),
  projectId: z.string().min(1, '請選擇項目'),
  vendorId: z.string().min(1, '請選擇供應商'),
  quoteId: z.string().optional(),
  date: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

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
  const { toast } = useToast();

  // ===== State Management =====
  const [items, setItems] = useState<POItemFormData[]>(
    initialData?.items || [{ itemName: '', quantity: 1, unitPrice: 0, sortOrder: 0 }]
  );

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
        title: '創建成功',
        description: `採購單 ${data.name} 已成功創建`,
      });
      router.push(`/purchase-orders/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: '創建失敗',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = api.purchaseOrder.update.useMutation({
    onSuccess: (data) => {
      toast({
        title: '更新成功',
        description: `採購單 ${data.name} 已成功更新`,
      });
      router.push(`/purchase-orders/${data.id}`);
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
        title: '無法刪除',
        description: '至少需要保留一個採購品項',
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
        title: '驗證失敗',
        description: '至少需要一個採購品項',
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
        title: '驗證失敗',
        description: '請填寫所有品項的必填信息（名稱、數量、單價）',
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
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PO 名稱 */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>採購單名稱 <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="如: Q1 伺服器採購" {...field} />
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
                  <FormLabel>採購日期</FormLabel>
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
                  <FormLabel>關聯項目 <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="選擇項目" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects?.items.map((proj) => (
                        <SelectItem key={proj.id} value={proj.id}>
                          {proj.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <FormLabel>供應商 <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="選擇供應商" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
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

            {/* 關聯報價（可選） */}
            <FormField
              control={form.control}
              name="quoteId"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>關聯報價（可選）</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="選擇報價（可選）" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">無</SelectItem>
                      {quotes?.items.map((quote) => (
                        <SelectItem key={quote.id} value={quote.id}>
                          Quote #{quote.id} - {formatCurrency(quote.amount)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <FormLabel>描述（可選）</FormLabel>
                    <FormControl>
                      <Textarea placeholder="採購單描述..." rows={3} {...field} />
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
              <CardTitle>採購品項</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-2" />
                新增品項
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
                />
              ))}

              {items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>尚未添加採購品項</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={handleAddItem}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    新增第一個品項
                  </Button>
                </div>
              )}

              {/* 總計顯示 */}
              {items.length > 0 && (
                <div className="mt-6 p-4 bg-primary/5 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">總品項數</p>
                      <p className="text-2xl font-bold">{items.length}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">採購總金額</p>
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
            {isEdit ? '更新採購單' : '創建採購單'}
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
// POItemFormRow 子組件
// ========================================

interface POItemFormRowProps {
  item: POItemFormData;
  index: number;
  onUpdate: (index: number, field: keyof POItemFormData, value: any) => void;
  onRemove: (index: number) => void;
}

function POItemFormRow({ item, index, onUpdate, onRemove }: POItemFormRowProps) {
  const subtotal = item.quantity * item.unitPrice;

  return (
    <div className="grid grid-cols-12 gap-4 p-4 border rounded-lg bg-card">
      {/* 品項名稱 */}
      <div className="col-span-4">
        <Label>品項名稱 <span className="text-destructive">*</span></Label>
        <Input
          value={item.itemName}
          onChange={(e) => onUpdate(index, 'itemName', e.target.value)}
          placeholder="如: Dell Server R740"
        />
      </div>

      {/* 數量 */}
      <div className="col-span-2">
        <Label>數量 <span className="text-destructive">*</span></Label>
        <Input
          type="number"
          value={item.quantity}
          onChange={(e) => onUpdate(index, 'quantity', parseInt(e.target.value) || 1)}
          min="1"
        />
      </div>

      {/* 單價 */}
      <div className="col-span-2">
        <Label>單價 <span className="text-destructive">*</span></Label>
        <Input
          type="number"
          step="0.01"
          value={item.unitPrice}
          onChange={(e) => onUpdate(index, 'unitPrice', parseFloat(e.target.value) || 0)}
          placeholder="0.00"
        />
      </div>

      {/* 小計 */}
      <div className="col-span-3">
        <Label>小計</Label>
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
        <Label>描述（可選）</Label>
        <Textarea
          value={item.description || ''}
          onChange={(e) => onUpdate(index, 'description', e.target.value)}
          placeholder="品項描述..."
          rows={2}
        />
      </div>
    </div>
  );
}
