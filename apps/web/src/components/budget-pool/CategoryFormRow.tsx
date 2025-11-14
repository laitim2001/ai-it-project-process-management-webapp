/**
 * @fileoverview Category Form Row Component - 預算類別表單行
 *
 * @description
 * 單一預算類別的輸入表單行組件，用於 BudgetPoolForm 的動態類別管理。
 * 提供類別名稱、代碼、金額、說明和排序欄位的輸入功能。
 * 支援即時驗證、錯誤顯示和刪除操作。
 *
 * @component CategoryFormRow
 *
 * @features
 * - 類別名稱輸入（必填）
 * - 類別代碼輸入（選填）
 * - 預算金額輸入（必填，≥0）
 * - 類別說明輸入（選填）
 * - 排序順序輸入（選填，整數）
 * - 刪除類別按鈕（可禁用）
 * - 欄位即時驗證和錯誤顯示
 * - 國際化支援（繁中/英文）
 *
 * @props
 * @param {Object} props - 組件屬性
 * @param {CategoryFormData} props.category - 類別資料
 * @param {number} props.index - 類別索引（用於欄位 ID）
 * @param {(category: CategoryFormData) => void} props.onChange - 類別變更回調
 * @param {() => void} props.onDelete - 刪除類別回調
 * @param {boolean} props.canDelete - 是否允許刪除
 * @param {CategoryErrors} [props.errors] - 驗證錯誤訊息
 *
 * @example
 * ```tsx
 * <CategoryFormRow
 *   category={{ categoryName: '硬體設備', totalAmount: 100000, sortOrder: 0 }}
 *   index={0}
 *   onChange={(updated) => handleUpdateCategory(0, updated)}
 *   onDelete={() => handleDeleteCategory(0)}
 *   canDelete={categories.length > 1}
 *   errors={{ categoryName: '類別名稱不可重複' }}
 * />
 * ```
 *
 * @dependencies
 * - shadcn/ui: Input, Button, Label
 * - next-intl: 國際化
 * - lucide-react: Trash2 圖示
 *
 * @related
 * - apps/web/src/components/budget-pool/BudgetPoolForm.tsx - 父組件（預算池表單）
 * - packages/api/src/routers/budgetPool.ts - 預算池 API Router
 *
 * @author IT Department
 * @since Epic 3 - Budget and Project Setup
 * @lastModified 2025-11-14 (Module 1: Categories 重構)
 */

'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';

// 類別數據類型（用於前端表單）
export interface CategoryFormData {
  id?: string;              // 有 id = 更新現有類別，無 id = 新增類別
  categoryName: string;
  categoryCode?: string;
  totalAmount: number;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// 錯誤訊息類型
export interface CategoryErrors {
  categoryName?: string;
  totalAmount?: string;
  sortOrder?: string;
}

interface CategoryFormRowProps {
  category: CategoryFormData;
  index: number;
  onChange: (category: CategoryFormData) => void;
  onDelete: () => void;
  canDelete: boolean;  // 是否允許刪除（第一行或只剩一行時不可刪除）
  errors?: CategoryErrors;
}

export function CategoryFormRow({
  category,
  index,
  onChange,
  onDelete,
  canDelete,
  errors,
}: CategoryFormRowProps) {
  const t = useTranslations('budgetPools.form.category');
  const tCommon = useTranslations('common');

  /**
   * 處理欄位變更
   * @param field - 欄位名稱
   * @param value - 新值
   */
  const handleChange = (
    field: keyof CategoryFormData,
    value: string | number
  ) => {
    onChange({
      ...category,
      [field]: value,
    });
  };

  return (
    <div className="grid grid-cols-12 gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* 類別名稱 - 必填 */}
      <div className="col-span-3">
        <Label htmlFor={`categoryName-${index}`} className="text-sm font-medium">
          {t('name.label')} <span className="text-red-500">*</span>
        </Label>
        <Input
          id={`categoryName-${index}`}
          name={`categories.${index}.categoryName`}
          type="text"
          value={category.categoryName || ''}
          onChange={(e) => handleChange('categoryName', e.target.value)}
          placeholder={t('name.placeholder')}
          className={errors?.categoryName ? 'border-red-500' : ''}
        />
        {errors?.categoryName && (
          <p className="mt-1 text-xs text-red-600">{errors.categoryName}</p>
        )}
      </div>

      {/* 類別代碼 - 選填 */}
      <div className="col-span-2">
        <Label htmlFor={`categoryCode-${index}`} className="text-sm font-medium">
          {t('code.label')}
        </Label>
        <Input
          id={`categoryCode-${index}`}
          name={`categories.${index}.categoryCode`}
          type="text"
          value={category.categoryCode || ''}
          onChange={(e) => handleChange('categoryCode', e.target.value)}
          placeholder={t('code.placeholder')}
        />
      </div>

      {/* 預算金額 - 必填 */}
      <div className="col-span-2">
        <Label htmlFor={`totalAmount-${index}`} className="text-sm font-medium">
          {t('amount.label')} <span className="text-red-500">*</span>
        </Label>
        <Input
          id={`totalAmount-${index}`}
          name={`categories.${index}.totalAmount`}
          type="number"
          value={category.totalAmount ?? 0}
          onChange={(e) =>
            handleChange('totalAmount', parseFloat(e.target.value) || 0)
          }
          placeholder="0.00"
          step="0.01"
          min="0"
          className={errors?.totalAmount ? 'border-red-500' : ''}
        />
        {errors?.totalAmount && (
          <p className="mt-1 text-xs text-red-600">{errors.totalAmount}</p>
        )}
      </div>

      {/* 說明 - 選填 */}
      <div className="col-span-3">
        <Label htmlFor={`description-${index}`} className="text-sm font-medium">
          {t('description.label')}
        </Label>
        <Input
          id={`description-${index}`}
          type="text"
          value={category.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder={t('description.placeholder')}
        />
      </div>

      {/* 排序 - 選填 */}
      <div className="col-span-1">
        <Label htmlFor={`sortOrder-${index}`} className="text-sm font-medium">
          {t('sortOrder.label')}
        </Label>
        <Input
          id={`sortOrder-${index}`}
          type="number"
          value={category.sortOrder ?? index}
          onChange={(e) =>
            handleChange('sortOrder', parseInt(e.target.value) || index)
          }
          placeholder="0"
          className={errors?.sortOrder ? 'border-red-500' : ''}
        />
        {errors?.sortOrder && (
          <p className="mt-1 text-xs text-red-600">{errors.sortOrder}</p>
        )}
      </div>

      {/* 刪除按鈕 */}
      <div className="col-span-1 flex items-end">
        <Button
          type="button"
          variant="destructive"
          size="icon"
          onClick={onDelete}
          disabled={!canDelete}
          title={canDelete ? t('delete.tooltip') : t('delete.tooltipDisabled')}
          className="h-10 w-10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
