/**
 * @fileoverview ChargeOut Form Component - 費用轉嫁表頭明細表單
 *
 * @description
 * 統一的費用轉嫁（ChargeOut）建立/編輯表單組件，支援表頭明細架構。
 * 管理專案費用轉嫁給 OpCo（營運公司）的完整流程，包含費用項目選擇、金額分配和描述。
 * 僅顯示標記為 requiresChargeOut = true 的合格費用，並支援動態明細表格編輯。
 *
 * @component ChargeOutForm
 *
 * @features
 * - 表單模式切換（建立 vs 編輯）
 * - ChargeOut 基本資訊輸入（名稱、描述）
 * - 專案和 OpCo 關聯選擇
 * - 動態費用明細表格（新增/編輯/刪除行）
 * - 合格費用篩選（requiresChargeOut = true）
 * - 選擇費用時自動填充金額
 * - 即時總金額計算和顯示
 * - 完整表單驗證（Zod schema + 業務規則）
 * - 專案變更時自動清空明細（費用列表聯動）
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
 * <ChargeOutForm isEdit={false} />
 *
 * // 編輯模式
 * <ChargeOutForm
 *   isEdit={true}
 *   initialData={{
 *     id: 'chargeout-1',
 *     name: '2025 Q1 費用轉嫁',
 *     projectId: 'project-1',
 *     opCoId: 'opco-1',
 *     items: [{ expenseId: 'expense-1', amount: 50000 }]
 *   }}
 * />
 * ```
 *
 * @dependencies
 * - react-hook-form: 表單狀態管理和驗證
 * - @hookform/resolvers/zod: Zod 整合
 * - @tanstack/react-query: tRPC 查詢和 mutation
 * - shadcn/ui: Form, Input, Textarea, Card, Button
 * - next-intl: 國際化
 *
 * @related
 * - packages/api/src/routers/chargeOut.ts - ChargeOut API Router（getEligibleExpenses procedure）
 * - apps/web/src/components/charge-out/ChargeOutActions.tsx - ChargeOut 操作組件
 * - apps/web/src/app/[locale]/charge-outs/new/page.tsx - 建立頁面
 * - apps/web/src/app/[locale]/charge-outs/[id]/edit/page.tsx - 編輯頁面
 *
 * @author IT Department
 * @since Module 7-8 - ChargeOut Management
 * @lastModified 2025-11-14
 */

'use client';

import { useState, useEffect } from 'react';
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
 * CHANGE-002: 新增 expenseItemId 支援明細級別轉嫁
 */
interface ChargeOutItemFormData {
  id?: string; // 編輯時有 id
  expenseId: string; // 保留向後兼容
  expenseItemId?: string | null; // CHANGE-002: 關聯到具體費用明細
  amount: number;
  description?: string;
  sortOrder: number;
}

type FormValues = {
  name: string;
  description?: string;
  projectId: string;
  opCoId: string;
};

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
  const t = useTranslations('chargeOuts.form');
  const tCommon = useTranslations('common');

  // ===== State Management =====
  const [items, setItems] = useState<ChargeOutItemFormData[]>(
    initialData?.items || [{ expenseId: '', amount: 0, sortOrder: 0 }]
  );

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialData?.projectId || ''
  );

  // ===== Form Schema =====
  const formSchema = z.object({
    name: z.string().min(1, t('validation.nameRequired')),
    description: z.string().optional(),
    projectId: z.string().min(1, t('validation.projectRequired')),
    opCoId: z.string().min(1, t('validation.opCoRequired')),
  });

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
        title: t('messages.createSuccess'),
        description: t('messages.createSuccessDesc', { name: data.name }),
      });
      router.push(`/charge-outs/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: t('messages.createError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = api.chargeOut.update.useMutation({
    onSuccess: (data) => {
      toast({
        title: t('messages.updateSuccess'),
        description: t('messages.updateSuccessDesc', { name: data.name }),
      });
      router.push(`/charge-outs/${data.id}`);
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
   * CHANGE-002: 支援 expenseItemId 選擇
   */
  const handleUpdateItem = (index: number, field: keyof ChargeOutItemFormData, value: any) => {
    const newItems = [...items];
    const currentItem = newItems[index];

    // 確保項目存在
    if (!currentItem) return;

    // 更新指定欄位
    newItems[index] = { ...currentItem, [field]: value };

    // 當選擇費用時，自動填充金額並清空 expenseItemId
    if (field === 'expenseId' && eligibleExpenses) {
      const selectedExpense = eligibleExpenses.find((e) => e.id === value);
      if (selectedExpense && newItems[index]) {
        newItems[index].amount = selectedExpense.totalAmount;
        newItems[index].expenseItemId = null; // 清空明細選擇
      }
    }

    // CHANGE-002: 當選擇費用明細時，自動填充該明細的金額
    if (field === 'expenseItemId' && eligibleExpenses && value && newItems[index]) {
      const selectedExpense = eligibleExpenses.find((e) => e.id === newItems[index]?.expenseId);
      if (selectedExpense?.items) {
        const selectedItem = selectedExpense.items.find((item: any) => item.id === value);
        if (selectedItem) {
          newItems[index].amount = selectedItem.amount;
        }
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
        title: t('messages.cannotDelete'),
        description: t('messages.minOneItem'),
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
        title: t('validation.validationFailed'),
        description: t('validation.minOneItem'),
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
        title: t('validation.validationFailed'),
        description: t('validation.fillAllRequired'),
        variant: 'destructive',
      });
      return;
    }

    // 組裝提交數據
    // CHANGE-002: 包含 expenseItemId 支援明細級別轉嫁
    const submitData = {
      ...values,
      items: items.map((item, index) => ({
        ...(item.id && { id: item.id }), // 編輯時包含 id
        expenseId: item.expenseId,
        expenseItemId: item.expenseItemId || null, // CHANGE-002: 費用明細 ID
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
              {t('sections.basicInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* ChargeOut 名稱 */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('fields.name.label')} *</FormLabel>
                  <FormControl>
                    <Input placeholder={t('fields.name.placeholder')} {...field} />
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
                  <FormLabel>{t('fields.description.label')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('fields.description.placeholder')}
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
                    <FormLabel>{t('fields.project.label')} *</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        {...field}
                      >
                        <option value="">{t('fields.project.placeholder')}</option>
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
                    <FormLabel>{t('fields.opCo.label')} *</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
            </div>
          </CardContent>
        </Card>

        {/* 費用明細卡片 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('sections.items')}</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                disabled={!selectedProjectId || isLoadingExpenses}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('actions.addItem')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!selectedProjectId ? (
              <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
                {t('messages.selectProjectFirst')}
              </div>
            ) : isLoadingExpenses ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">{t('messages.loadingExpenses')}</span>
              </div>
            ) : !eligibleExpenses || eligibleExpenses.length === 0 ? (
              <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
                {t('messages.noEligibleExpenses')}
              </div>
            ) : (
              <div className="space-y-4">
                {/* 明細表格 */}
                {/* CHANGE-002: 新增 ExpenseItem 選擇欄位 */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="p-2 text-left text-sm font-medium">#</th>
                        <th className="p-2 text-left text-sm font-medium">{t('table.expense')} *</th>
                        <th className="p-2 text-left text-sm font-medium">{t('table.expenseItem')}</th>
                        <th className="p-2 text-left text-sm font-medium">{t('table.amount')} *</th>
                        <th className="p-2 text-left text-sm font-medium">{t('table.description')}</th>
                        <th className="p-2 text-center text-sm font-medium">{tCommon('actions.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => {
                        const selectedExpense = eligibleExpenses?.find(
                          (e) => e.id === item.expenseId
                        );
                        const expenseItems = selectedExpense?.items || [];
                        const selectedExpenseItem = expenseItems.find(
                          (ei: any) => ei.id === item.expenseItemId
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
                                <option value="">{t('fields.expense.placeholder')}</option>
                                {eligibleExpenses?.map((expense) => (
                                  <option key={expense.id} value={expense.id}>
                                    {expense.name} - {formatCurrency(expense.totalAmount)}
                                  </option>
                                ))}
                              </select>
                              {selectedExpense && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                  {t('fields.expense.invoiceNumber')}: {selectedExpense.invoiceNumber || 'N/A'}
                                </div>
                              )}
                            </td>
                            {/* CHANGE-002: ExpenseItem 選擇器 */}
                            <td className="p-2">
                              <select
                                name={`items[${index}].expenseItemId`}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm disabled:opacity-50"
                                value={item.expenseItemId || ''}
                                onChange={(e) =>
                                  handleUpdateItem(index, 'expenseItemId', e.target.value || null)
                                }
                                disabled={!selectedExpense || expenseItems.length === 0}
                              >
                                <option value="">{t('fields.expenseItem.placeholder')}</option>
                                {expenseItems.map((ei: any) => (
                                  <option key={ei.id} value={ei.id}>
                                    {ei.itemName} - {formatCurrency(ei.amount)}
                                    {ei.chargeOutOpCo ? ` (${ei.chargeOutOpCo.code})` : ''}
                                  </option>
                                ))}
                              </select>
                              {selectedExpenseItem?.chargeOutOpCo && (
                                <div className="mt-1 text-xs text-blue-600">
                                  {t('fields.expenseItem.targetOpCo')}: {selectedExpenseItem.chargeOutOpCo.code}
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
                                placeholder={t('fields.itemDescription.placeholder')}
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
                    <div className="text-sm text-muted-foreground">{t('table.totalAmount')}</div>
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
            {tCommon('actions.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? t('actions.update') : t('actions.create')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
