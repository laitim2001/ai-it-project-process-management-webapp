'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/trpc';

/**
 * OMExpenseForm - OM 費用創建/編輯表單組件
 *
 * 功能：
 * 1. 創建新 OM 費用
 * 2. 編輯現有 OM 費用基本資訊
 * 3. 完整的表單驗證（Zod + react-hook-form）
 * 4. OpCo、Vendor、Category 選擇器
 * 5. 預算金額、日期範圍輸入
 *
 * 注意：
 * - 創建時會自動初始化 12 個月度記錄（金額為 0）
 * - actualSpent 由系統自動計算，不可手動輸入
 * - 月度記錄在詳情頁單獨編輯
 */

// Zod Schema
const omExpenseSchema = z
  .object({
    name: z.string().min(1, 'OM 費用名稱不能為空').max(200),
    description: z.string().optional(),
    financialYear: z.number().int().min(2000).max(2100),
    category: z.string().min(1, 'OM 類別不能為空').max(100),
    opCoId: z.string().min(1, '請選擇 OpCo'),
    budgetAmount: z.number().positive('預算金額必須大於 0'),
    vendorId: z.string().optional(),
    startDate: z.string().min(1, '開始日期不能為空'),
    endDate: z.string().min(1, '結束日期不能為空'),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) < new Date(data.endDate);
      }
      return true;
    },
    {
      message: '結束日期必須晚於開始日期',
      path: ['endDate'],
    }
  );

type OMExpenseFormData = z.infer<typeof omExpenseSchema>;

interface OMExpenseFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<OMExpenseFormData> & { id?: string };
}

export default function OMExpenseForm({ mode, initialData }: OMExpenseFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  // 獲取 OpCo 列表
  const { data: opCos } = api.operatingCompany.getAll.useQuery();

  // 獲取 Vendor 列表
  const { data: vendors } = api.vendor.getAll.useQuery({
    page: 1,
    limit: 100,
  });

  // 獲取 OM 類別列表（用於自動完成）
  const { data: categories } = api.omExpense.getCategories.useQuery();

  // tRPC Mutations
  const createMutation = api.omExpense.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: '創建成功',
        description: `OM 費用 "${data.name}" 已創建，並自動初始化了 12 個月度記錄`,
      });
      router.push(`/om-expenses/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: '創建失敗',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = api.omExpense.update.useMutation({
    onSuccess: (data) => {
      toast({
        title: '更新成功',
        description: `OM 費用 "${data.name}" 已更新`,
      });
      router.push(`/om-expenses/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: '更新失敗',
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

  // 當 initialData 更新時，重置表單
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

  // 表單提交
  const onSubmit = (data: OMExpenseFormData) => {
    if (mode === 'create') {
      createMutation.mutate(data);
    } else if (mode === 'edit' && initialData?.id) {
      updateMutation.mutate({
        id: initialData.id,
        ...data,
      });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 基本資訊 */}
        <Card>
          <CardHeader>
            <CardTitle>基本資訊</CardTitle>
            <CardDescription>
              {mode === 'create' ? '創建新的 OM 費用記錄' : '編輯 OM 費用基本資訊'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* OM 費用名稱 */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    OM 費用名稱 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="例如：AWS Cloud Services" {...field} />
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
                      placeholder="OM 費用的詳細說明..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 財務年度 和 OM 類別 */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="financialYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      財務年度 <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={2000}
                        max={2100}
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
                      OM 類別 <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="例如：Server Maintenance"
                        list="category-suggestions"
                        {...field}
                      />
                    </FormControl>
                    <datalist id="category-suggestions">
                      {categories?.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                    <FormDescription>
                      輸入新類別或從現有類別中選擇
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* OpCo 和供應商 */}
        <Card>
          <CardHeader>
            <CardTitle>OpCo 和供應商</CardTitle>
            <CardDescription>選擇營運公司和關聯的供應商（可選）</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* OpCo 選擇 */}
            <FormField
              control={form.control}
              name="opCoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    營運公司 (OpCo) <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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

            {/* 供應商選擇（可選） */}
            <FormField
              control={form.control}
              name="vendorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>供應商</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="">無（不關聯供應商）</option>
                      {vendors?.items.map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormDescription>可選：關聯到特定供應商</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 預算和日期 */}
        <Card>
          <CardHeader>
            <CardTitle>預算和日期範圍</CardTitle>
            <CardDescription>設定年度預算金額和費用的有效期間</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 預算金額 */}
            <FormField
              control={form.control}
              name="budgetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    預算金額 (HKD) <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    年度預算金額，實際支出由月度記錄自動計算
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 開始日期 和 結束日期 */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      開始日期 <span className="text-destructive">*</span>
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
                      結束日期 <span className="text-destructive">*</span>
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

        {/* 表單操作按鈕 */}
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
            {isSubmitting
              ? mode === 'create'
                ? '創建中...'
                : '更新中...'
              : mode === 'create'
              ? '創建 OM 費用'
              : '更新 OM 費用'}
          </Button>
        </div>

        {/* 創建模式提示 */}
        {mode === 'create' && (
          <Card className="bg-muted">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                ℹ️ 創建後將自動生成 12 個月度記錄（1-12月），初始金額為 0。您可以在詳情頁面編輯每月的實際支出。
              </p>
            </CardContent>
          </Card>
        )}
      </form>
    </Form>
  );
}
