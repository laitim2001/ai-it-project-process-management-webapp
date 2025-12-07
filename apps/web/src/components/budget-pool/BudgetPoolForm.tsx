/**
 * @fileoverview Budget Pool Form Component - 預算池建立/編輯表單
 *
 * @description
 * 統一的預算池表單組件，支援建立新預算池和編輯現有預算池兩種模式。
 * 實現預算池基本資訊管理和多個預算類別的動態 CRUD 操作。
 * 自動計算預算池總額，提供即時驗證、錯誤處理和成功提示功能。
 *
 * @component BudgetPoolForm
 *
 * @features
 * - 表單模式切換（建立 vs 編輯）
 * - 即時表單驗證（類別名稱不重複、金額非負）
 * - 預算類別動態管理（新增、更新、刪除）
 * - 自動計算預算池總額（從 categories 總和計算）
 * - 類別最少數量限制（至少 1 個類別）
 * - 國際化支援（繁中/英文）
 * - 錯誤處理和成功提示（Toast）
 * - 財政年度範圍驗證（2000-2100）
 *
 * @props
 * @param {Object} props - 組件屬性
 * @param {'create' | 'edit'} props.mode - 表單模式
 * @param {Object} [props.initialData] - 編輯模式的預設值
 * @param {string} props.initialData.id - 預算池 ID
 * @param {string} props.initialData.name - 預算池名稱
 * @param {string} [props.initialData.description] - 預算池說明
 * @param {number} props.initialData.financialYear - 財政年度
 * @param {CategoryFormData[]} [props.initialData.categories] - 預算類別陣列
 *
 * @example
 * ```tsx
 * // 建立模式
 * <BudgetPoolForm mode="create" />
 *
 * // 編輯模式
 * <BudgetPoolForm
 *   mode="edit"
 *   initialData={{
 *     id: 'uuid',
 *     name: '2025財年預算',
 *     financialYear: 2025,
 *     categories: [
 *       { categoryName: '硬體設備', totalAmount: 100000, sortOrder: 0 }
 *     ]
 *   }}
 * />
 * ```
 *
 * @dependencies
 * - react-hook-form: 表單狀態管理（未使用，採用原生 useState）
 * - @tanstack/react-query: tRPC 查詢和 mutation
 * - shadcn/ui: Card, Input, Button, Label
 * - next-intl: 國際化
 *
 * @related
 * - packages/api/src/routers/budgetPool.ts - 預算池 API Router
 * - apps/web/src/components/budget-pool/CategoryFormRow.tsx - 類別表單行組件
 * - apps/web/src/app/[locale]/budget-pools/new/page.tsx - 建立頁面
 * - apps/web/src/app/[locale]/budget-pools/[id]/edit/page.tsx - 編輯頁面
 *
 * @author IT Department
 * @since Epic 3 - Budget and Project Setup
 * @lastModified 2025-11-14 (Module 1: Categories 重構)
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from "@/i18n/routing";
import { api } from '@/lib/trpc';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryFormRow, CategoryFormData, CategoryErrors } from './CategoryFormRow';
import { Plus, Calculator } from 'lucide-react';
import { CurrencySelect } from '@/components/shared/CurrencySelect';

interface BudgetPoolFormProps {
  initialData?: {
    id: string;
    name: string;
    description?: string;
    financialYear: number;
    currencyId?: string; // FEAT-002: Currency ID
    categories?: CategoryFormData[];
  };
  mode: 'create' | 'edit';
}

export function BudgetPoolForm({ initialData, mode }: BudgetPoolFormProps) {
  const t = useTranslations('budgetPools');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { toast } = useToast();

  // FEAT-002: Query currency list to get TWD as default
  const { data: currencies } = api.currency.getAll.useQuery({
    includeInactive: false,
  });

  // Find TWD currency ID (default currency)
  const twdCurrency = currencies?.find((c) => c.code === 'TWD');
  const defaultCurrencyId = twdCurrency?.id ?? '';

  // 基本表單數據
  const [formData, setFormData] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    financialYear: initialData?.financialYear ?? new Date().getFullYear(),
    currencyId: initialData?.currencyId ?? defaultCurrencyId, // FEAT-002: Currency ID
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
    currencyId?: string; // FEAT-002: Currency validation error
    categories?: CategoryErrors[];
  }>({});

  // FEAT-002: Update currencyId when currencies are loaded
  // FIX: 同時處理 create 和 edit 模式（當 currencyId 為空時使用預設值）
  useEffect(() => {
    if (defaultCurrencyId && !formData.currencyId) {
      // 如果 currencyId 為空且已載入貨幣列表，設置預設值
      setFormData(prev => ({ ...prev, currencyId: defaultCurrencyId }));
    }
  }, [defaultCurrencyId, formData.currencyId]);

  // ========== API Mutations ==========

  const createMutation = api.budgetPool.create.useMutation({
    onSuccess: (budgetPool) => {
      toast({
        title: tCommon('messages.success'),
        description: t('messages.createSuccess'),
        variant: 'success',
      });
      router.push(`/budget-pools/${budgetPool.id}`);
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: tCommon('messages.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = api.budgetPool.update.useMutation({
    onSuccess: () => {
      toast({
        title: tCommon('messages.success'),
        description: t('messages.updateSuccess'),
        variant: 'success',
      });
      router.push(`/budget-pools/${initialData?.id}`);
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: tCommon('messages.error'),
        description: error.message,
        variant: 'destructive',
      });
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
      toast({
        title: tCommon('messages.error'),
        description: t('form.categories.minOneRequired'),
        variant: 'destructive',
      });
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
      currencyId?: string;
      categories?: CategoryErrors[];
    } = {};

    // 驗證基本欄位
    if (!formData.name.trim()) {
      newErrors.name = t('form.name.required');
    }

    if (formData.financialYear < 2000 || formData.financialYear > 2100) {
      newErrors.financialYear = t('form.fiscalYear.rangeError');
    }

    // FEAT-002: Validate currency
    if (!formData.currencyId) {
      newErrors.currencyId = tCommon('form.currency.required');
    }

    // 驗證類別
    const categoryErrors: CategoryErrors[] = [];
    const categoryNames = new Set<string>();

    categories.forEach((cat, index) => {
      const catError: CategoryErrors = {};

      // 類別名稱必填且不重複
      if (!cat.categoryName.trim()) {
        catError.categoryName = t('form.categories.nameRequired');
      } else if (categoryNames.has(cat.categoryName.trim())) {
        catError.categoryName = t('form.categories.nameDuplicate');
      } else {
        categoryNames.add(cat.categoryName.trim());
      }

      // 預算金額必須 ≥ 0
      if (cat.totalAmount < 0) {
        catError.totalAmount = t('form.categories.amountNegative');
      }

      // 排序必須是整數
      if (cat.sortOrder !== undefined && !Number.isInteger(cat.sortOrder)) {
        catError.sortOrder = t('form.categories.sortOrderInteger');
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
      toast({
        title: tCommon('messages.error'),
        description: t('form.validationError'),
        variant: 'destructive',
      });
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
          <CardTitle>{t('form.basicInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 預算池名稱 */}
          <div>
            <Label htmlFor="name" className="text-sm font-medium">
              {t('form.name.label')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder={t('form.name.placeholder')}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* 財政年度 */}
          <div>
            <Label htmlFor="financialYear" className="text-sm font-medium">
              {t('form.fiscalYear.label')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="financialYear"
              name="financialYear"
              type="number"
              value={formData.financialYear}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  financialYear: parseInt(e.target.value) || new Date().getFullYear(),
                })
              }
              placeholder={t('form.fiscalYear.placeholder')}
              className={errors.financialYear ? 'border-red-500' : ''}
            />
            {errors.financialYear && (
              <p className="mt-1 text-sm text-red-600">
                {errors.financialYear}
              </p>
            )}
          </div>

          {/* FEAT-002: Currency Selection */}
          <div>
            <Label htmlFor="currency" className="text-sm font-medium">
              {tCommon('form.currency.label')} <span className="text-red-500">*</span>
            </Label>
            <CurrencySelect
              value={formData.currencyId}
              onChange={(value) => setFormData({ ...formData, currencyId: value })}
              required
              className={errors.currencyId ? 'border-red-500' : ''}
            />
            {errors.currencyId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.currencyId}
              </p>
            )}
          </div>

          {/* 說明（可選） */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              {tCommon('form.description.label')}
            </Label>
            <Input
              id="description"
              name="description"
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder={t('form.description.placeholder')}
            />
          </div>
        </CardContent>
      </Card>

      {/* ========== 預算類別區塊 ========== */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('form.categories.title')}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {t('form.categories.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* 總預算顯示 */}
            <div className="flex items-center gap-2 text-sm">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t('form.categories.totalBudget')}：</span>
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
            {t('form.categories.addCategory')}
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
          {tCommon('actions.cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? tCommon('actions.saving')
            : mode === 'create'
            ? t('actions.create')
            : t('actions.update')}
        </Button>
      </div>
    </form>
  );
}
