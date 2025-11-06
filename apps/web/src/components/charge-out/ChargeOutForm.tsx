'use client';

/**
 * ChargeOutForm 組件 - Module 7-8 費用轉嫁表頭明細表單
 *
 * 功能說明：
 * - ChargeOut 基本信息（name, description, projectId, opCoId）
 * - 費用明細表格（動態新增/刪除行）
 * - 明細字段：expenseId, amount, description
 * - 自動計算總金額
 * - 表單驗證（至少一個費用項目）
 * - 只允許 requiresChargeOut = true 的費用
 *
 * Module 7-8: ChargeOut 費用轉嫁 - 前端實施
 */

import { useState, useEffect } from 'react';
import { useRouter } from "@/i18n/routing";
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
import { Plus, Loader2, DollarSign, Trash2 } from 'lucide-react';

// ========================================
// Types & Schemas
// ========================================

/**
 * 費用明細表單數據
 */
interface ChargeOutItemFormData {
  id?: string; // 編輯時有 id
  expenseId: string;
  amount: number;
  description?: string;
  sortOrder: number;
}

/**
 * 表單驗證 Schema
 */
const formSchema = z.object({
  name: z.string().min(1, 'ChargeOut 名稱為必填'),
  description: z.string().optional(),
  projectId: z.string().min(1, '請選擇項目'),
  opCoId: z.string().min(1, '請選擇營運公司 (OpCo)'),
});

type FormValues = z.infer<typeof formSchema>;

/**
 * 組件 Props
 */
interface ChargeOutFormProps {
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
  return new Intl.NumberFormat('zh-HK', {
    style: 'currency',
    currency: 'HKD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// ========================================
// Main Component
// ========================================

export function ChargeOutForm({ initialData, isEdit = false }: ChargeOutFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  // ===== State Management =====
  const [items, setItems] = useState<ChargeOutItemFormData[]>(
    initialData?.items || [{ expenseId: '', amount: 0, sortOrder: 0 }]
  );

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialData?.projectId || ''
  );

  // ===== React Hook Form =====
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      projectId: initialData?.projectId || '',
      opCoId: initialData?.opCoId || '',
    },
  });

  // ===== 查詢數據 =====
  const { data: projects } = api.project.getAll.useQuery({
    page: 1,
    limit: 100,
  });

  const { data: opCos } = api.operatingCompany.getAll.useQuery({
    isActive: true, // 只顯示啟用的 OpCo
  });

  // 獲取可用於 ChargeOut 的費用（requiresChargeOut = true）
  const { data: eligibleExpenses, isLoading: isLoadingExpenses } =
    api.chargeOut.getEligibleExpenses.useQuery(
      { projectId: selectedProjectId },
      { enabled: !!selectedProjectId }
    );

  // ===== Mutations =====
  const createMutation = api.chargeOut.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: '創建成功',
        description: `ChargeOut ${data.name} 已成功創建`,
      });
      router.push(`/charge-outs/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: '創建失敗',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = api.chargeOut.update.useMutation({
    onSuccess: (data) => {
      toast({
        title: '更新成功',
        description: `ChargeOut ${data.name} 已成功更新`,
      });
      router.push(`/charge-outs/${data.id}`);
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

  // ===== 監聽 projectId 變化 =====
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'projectId' && value.projectId) {
        setSelectedProjectId(value.projectId);
        // 當項目變更時，清空明細（因為費用列表會變化）
        if (value.projectId !== selectedProjectId) {
          setItems([{ expenseId: '', amount: 0, sortOrder: 0 }]);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, selectedProjectId]);

  // ===== 明細操作函數 =====

  /**
   * 新增費用項目
   */
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        expenseId: '',
        amount: 0,
        sortOrder: items.length,
      },
    ]);
  };

  /**
   * 更新費用項目
   */
  const handleUpdateItem = (index: number, field: keyof ChargeOutItemFormData, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // 當選擇費用時，自動填充金額
    if (field === 'expenseId' && eligibleExpenses) {
      const selectedExpense = eligibleExpenses.find((e) => e.id === value);
      if (selectedExpense) {
        newItems[index].amount = selectedExpense.totalAmount;
      }
    }

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

    // 驗證每個費用項目的必填字段
    const invalidItems = items.filter(
      (item) => !item.expenseId.trim() || item.amount <= 0
    );

    if (invalidItems.length > 0) {
      toast({
        title: '驗證失敗',
        description: '請填寫所有費用項目的必填信息（費用、金額）',
        variant: 'destructive',
      });
      return;
    }

    // 組裝提交數據
    const submitData = {
      ...values,
      items: items.map((item, index) => ({
        ...(item.id && { id: item.id }), // 編輯時包含 id
        expenseId: item.expenseId,
        amount: item.amount,
        description: item.description,
        sortOrder: index,
      })),
    };

    // 提交
    if (isEdit && initialData?.id) {
      await updateMutation.mutateAsync({
        id: initialData.id,
        ...submitData,
      });
    } else {
      await createMutation.mutateAsync(submitData);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // ===== Render =====
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 基本信息卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              ChargeOut 基本信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* ChargeOut 名稱 */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ChargeOut 名稱 *</FormLabel>
                  <FormControl>
                    <Input placeholder="例如：2024 Q1 IT 服務費用轉嫁" {...field} />
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
                  <FormLabel>描述</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="詳細說明此 ChargeOut 的目的和內容..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* 項目選擇 */}
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>項目 *</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        {...field}
                      >
                        <option value="">選擇項目</option>
                        {projects?.items?.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* OpCo 選擇 */}
              <FormField
                control={form.control}
                name="opCoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>營運公司 (OpCo) *</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        {...field}
                      >
                        <option value="">選擇 OpCo</option>
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
            </div>
          </CardContent>
        </Card>

        {/* 費用明細卡片 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>費用明細</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                disabled={!selectedProjectId || isLoadingExpenses}
              >
                <Plus className="mr-2 h-4 w-4" />
                新增費用項目
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!selectedProjectId ? (
              <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
                請先選擇項目以載入可用的費用列表
              </div>
            ) : isLoadingExpenses ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">載入費用列表...</span>
              </div>
            ) : !eligibleExpenses || eligibleExpenses.length === 0 ? (
              <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
                此項目沒有可用於 ChargeOut 的費用（requiresChargeOut = true）
              </div>
            ) : (
              <div className="space-y-4">
                {/* 明細表格 */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="p-2 text-left text-sm font-medium">#</th>
                        <th className="p-2 text-left text-sm font-medium">費用 *</th>
                        <th className="p-2 text-left text-sm font-medium">金額 (HKD) *</th>
                        <th className="p-2 text-left text-sm font-medium">描述</th>
                        <th className="p-2 text-center text-sm font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => {
                        const selectedExpense = eligibleExpenses?.find(
                          (e) => e.id === item.expenseId
                        );
                        return (
                          <tr key={index} className="border-b hover:bg-muted/50">
                            <td className="p-2 text-sm">{index + 1}</td>
                            <td className="p-2">
                              <select
                                name={`items[${index}].expenseId`}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                value={item.expenseId}
                                onChange={(e) =>
                                  handleUpdateItem(index, 'expenseId', e.target.value)
                                }
                              >
                                <option value="">選擇費用</option>
                                {eligibleExpenses?.map((expense) => (
                                  <option key={expense.id} value={expense.id}>
                                    {expense.name} - {formatCurrency(expense.totalAmount)}
                                  </option>
                                ))}
                              </select>
                              {selectedExpense && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  發票號碼: {selectedExpense.invoiceNumber || 'N/A'}
                                </div>
                              )}
                            </td>
                            <td className="p-2">
                              <Input
                                name={`items[${index}].amount`}
                                type="number"
                                min={0}
                                step={0.01}
                                value={item.amount}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    index,
                                    'amount',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="h-9"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                name={`items[${index}].description`}
                                value={item.description || ''}
                                onChange={(e) =>
                                  handleUpdateItem(index, 'description', e.target.value)
                                }
                                placeholder="可選說明"
                                className="h-9"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(index)}
                                disabled={items.length === 1}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 總計 */}
                <div className="flex justify-end border-t pt-4">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">總金額</div>
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(totalAmount)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 提交按鈕 */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? '更新 ChargeOut' : '創建 ChargeOut'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
