/**
 * ================================================================
 * BudgetPoolForm 組件 - 預算池表單（支持 Categories）
 * ================================================================
 *
 * 【功能說明】
 * 創建/編輯預算池表單，支持多個預算類別的 CRUD 操作
 *
 * 【重要變更】
 * - 移除 totalAmount 欄位（改為從 categories 自動計算）
 * - 新增 description 欄位（可選）
 * - 新增 categories 陣列管理（至少1個類別）
 *
 * 【API 數據結構】
 * Create: { name, financialYear, description?, categories: [...] }
 * Update: { id, name?, description?, categories?: [...] }
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/trpc';
import { useToast } from '@/components/ui/Toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryFormRow, CategoryFormData, CategoryErrors } from './CategoryFormRow';
import { Plus, Calculator } from 'lucide-react';

interface BudgetPoolFormProps {
  initialData?: {
    id: string;
    name: string;
    description?: string;
    financialYear: number;
    categories?: CategoryFormData[];
  };
  mode: 'create' | 'edit';
}

export function BudgetPoolForm({ initialData, mode }: BudgetPoolFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  // 基本表單數據
  const [formData, setFormData] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    financialYear: initialData?.financialYear ?? new Date().getFullYear(),
  });

  // 類別陣列狀態
  const [categories, setCategories] = useState<CategoryFormData[]>(
    initialData?.categories && initialData.categories.length > 0
      ? initialData.categories
      : [
          {
            categoryName: '',
            categoryCode: '',
            totalAmount: 0,
            description: '',
            sortOrder: 0,
          },
        ]
  );

  // 錯誤訊息狀態
  const [errors, setErrors] = useState<{
    name?: string;
    financialYear?: string;
    categories?: CategoryErrors[];
  }>({});

  // ========== API Mutations ==========

  const createMutation = api.budgetPool.create.useMutation({
    onSuccess: () => {
      showToast('預算池創建成功！', 'success');
      router.push('/budget-pools');
      router.refresh();
    },
    onError: (error) => {
      showToast(`錯誤：${error.message}`, 'error');
    },
  });

  const updateMutation = api.budgetPool.update.useMutation({
    onSuccess: () => {
      showToast('預算池更新成功！', 'success');
      router.push(`/budget-pools/${initialData?.id}`);
      router.refresh();
    },
    onError: (error) => {
      showToast(`錯誤：${error.message}`, 'error');
    },
  });

  // ========== 計算總預算 ==========
  const computedTotalAmount = categories.reduce(
    (sum, cat) => sum + (cat.totalAmount || 0),
    0
  );

  // ========== Categories CRUD 操作 ==========

  /**
   * 新增類別
   */
  const handleAddCategory = () => {
    const newCategory: CategoryFormData = {
      categoryName: '',
      categoryCode: '',
      totalAmount: 0,
      description: '',
      sortOrder: categories.length,
    };
    setCategories([...categories, newCategory]);
  };

  /**
   * 更新類別
   * @param index - 類別索引
   * @param updatedCategory - 更新後的類別數據
   */
  const handleUpdateCategory = (
    index: number,
    updatedCategory: CategoryFormData
  ) => {
    const newCategories = [...categories];
    newCategories[index] = updatedCategory;
    setCategories(newCategories);
  };

  /**
   * 刪除類別
   * @param index - 類別索引
   */
  const handleDeleteCategory = (index: number) => {
    if (categories.length <= 1) {
      showToast('至少需要保留一個類別', 'error');
      return;
    }
    const newCategories = categories.filter((_, i) => i !== index);
    setCategories(newCategories);
  };

  // ========== 表單驗證 ==========

  /**
   * 驗證整個表單
   * @returns {boolean} 是否驗證通過
   */
  const validate = (): boolean => {
    const newErrors: {
      name?: string;
      financialYear?: string;
      categories?: CategoryErrors[];
    } = {};

    // 驗證基本欄位
    if (!formData.name.trim()) {
      newErrors.name = '預算池名稱為必填欄位';
    }

    if (formData.financialYear < 2000 || formData.financialYear > 2100) {
      newErrors.financialYear = '財政年度範圍：2000-2100';
    }

    // 驗證類別
    const categoryErrors: CategoryErrors[] = [];
    const categoryNames = new Set<string>();

    categories.forEach((cat, index) => {
      const catError: CategoryErrors = {};

      // 類別名稱必填且不重複
      if (!cat.categoryName.trim()) {
        catError.categoryName = '類別名稱為必填欄位';
      } else if (categoryNames.has(cat.categoryName.trim())) {
        catError.categoryName = '類別名稱不可重複';
      } else {
        categoryNames.add(cat.categoryName.trim());
      }

      // 預算金額必須 ≥ 0
      if (cat.totalAmount < 0) {
        catError.totalAmount = '預算金額不可為負數';
      }

      // 排序必須是整數
      if (cat.sortOrder !== undefined && !Number.isInteger(cat.sortOrder)) {
        catError.sortOrder = '排序必須為整數';
      }

      if (Object.keys(catError).length > 0) {
        categoryErrors[index] = catError;
      }
    });

    if (categoryErrors.length > 0) {
      newErrors.categories = categoryErrors;
    }

    setErrors(newErrors);
    return (
      Object.keys(newErrors).length === 0 ||
      (Object.keys(newErrors).length === 1 && !newErrors.categories)
    );
  };

  // ========== 表單提交 ==========

  /**
   * 處理表單提交
   * @param e - 表單事件
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      showToast('請修正表單錯誤後再提交', 'error');
      return;
    }

    if (mode === 'create') {
      // 創建模式：提交完整數據
      createMutation.mutate({
        ...formData,
        categories: categories.map(({ id, isActive, ...cat }) => cat), // 移除 id 和 isActive
      });
    } else if (initialData) {
      // 編輯模式：提交變更數據
      updateMutation.mutate({
        id: initialData.id,
        ...formData,
        categories: categories, // 保留 id（用於判斷新增/更新）
      });
    }
  };

  const isSubmitting = createMutation.isLoading || updateMutation.isLoading;

  // ========== UI 渲染 ==========

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-6xl mx-auto">
      {/* ========== 基本信息區塊 ========== */}
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 預算池名稱 */}
          <div>
            <Label htmlFor="name" className="text-sm font-medium">
              預算池名稱 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="例如：FY2025 IT 基礎設施預算"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* 財政年度 */}
          <div>
            <Label htmlFor="financialYear" className="text-sm font-medium">
              財政年度 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="financialYear"
              type="number"
              value={formData.financialYear}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  financialYear: parseInt(e.target.value) || new Date().getFullYear(),
                })
              }
              placeholder="2025"
              className={errors.financialYear ? 'border-red-500' : ''}
            />
            {errors.financialYear && (
              <p className="mt-1 text-sm text-red-600">
                {errors.financialYear}
              </p>
            )}
          </div>

          {/* 說明（可選） */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              說明
            </Label>
            <Input
              id="description"
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="選填：預算池用途說明"
            />
          </div>
        </CardContent>
      </Card>

      {/* ========== 預算類別區塊 ========== */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>預算類別</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              定義預算池的各個類別，至少需要一個類別
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* 總預算顯示 */}
            <div className="flex items-center gap-2 text-sm">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">總預算：</span>
              <span className="font-semibold text-primary">
                ${computedTotalAmount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 類別列表 */}
          {categories.map((category, index) => (
            <CategoryFormRow
              key={index}
              category={category}
              index={index}
              onChange={(updated) => handleUpdateCategory(index, updated)}
              onDelete={() => handleDeleteCategory(index)}
              canDelete={categories.length > 1}
              errors={errors.categories?.[index]}
            />
          ))}

          {/* 新增類別按鈕 */}
          <Button
            type="button"
            variant="outline"
            onClick={handleAddCategory}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            新增類別
          </Button>
        </CardContent>
      </Card>

      {/* ========== 操作按鈕區塊 ========== */}
      <div className="flex gap-4 justify-end">
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
            ? '儲存中...'
            : mode === 'create'
            ? '創建預算池'
            : '更新預算池'}
        </Button>
      </div>
    </form>
  );
}
