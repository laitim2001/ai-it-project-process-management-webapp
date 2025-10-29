/**
 * ================================================================
 * CategoryFormRow 組件 - 預算類別表單行
 * ================================================================
 *
 * 【功能說明】
 * 單一預算類別的輸入表單行，用於 BudgetPool 的 categories 陣列管理
 *
 * 【數據結構】
 * - categoryName: 類別名稱（必填）
 * - categoryCode: 類別代碼（選填）
 * - totalAmount: 預算金額（必填，≥0）
 * - description: 說明（選填）
 * - sortOrder: 排序（選填）
 *
 * 【使用範例】
 * ```tsx
 * <CategoryFormRow
 *   category={category}
 *   index={0}
 *   onChange={(updated) => handleUpdateCategory(0, updated)}
 *   onDelete={() => handleDeleteCategory(0)}
 *   canDelete={categories.length > 1}
 *   errors={errors}
 * />
 * ```
 */

'use client';

import React from 'react';
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
          類別名稱 <span className="text-red-500">*</span>
        </Label>
        <Input
          id={`categoryName-${index}`}
          name={`categories.${index}.categoryName`}
          type="text"
          value={category.categoryName || ''}
          onChange={(e) => handleChange('categoryName', e.target.value)}
          placeholder="例如：硬體設備"
          className={errors?.categoryName ? 'border-red-500' : ''}
        />
        {errors?.categoryName && (
          <p className="mt-1 text-xs text-red-600">{errors.categoryName}</p>
        )}
      </div>

      {/* 類別代碼 - 選填 */}
      <div className="col-span-2">
        <Label htmlFor={`categoryCode-${index}`} className="text-sm font-medium">
          類別代碼
        </Label>
        <Input
          id={`categoryCode-${index}`}
          name={`categories.${index}.categoryCode`}
          type="text"
          value={category.categoryCode || ''}
          onChange={(e) => handleChange('categoryCode', e.target.value)}
          placeholder="例如：HW"
        />
      </div>

      {/* 預算金額 - 必填 */}
      <div className="col-span-2">
        <Label htmlFor={`totalAmount-${index}`} className="text-sm font-medium">
          預算金額 <span className="text-red-500">*</span>
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
          說明
        </Label>
        <Input
          id={`description-${index}`}
          type="text"
          value={category.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="選填：類別用途說明"
        />
      </div>

      {/* 排序 - 選填 */}
      <div className="col-span-1">
        <Label htmlFor={`sortOrder-${index}`} className="text-sm font-medium">
          排序
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
          title={canDelete ? '刪除此類別' : '至少需要保留一個類別'}
          className="h-10 w-10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
