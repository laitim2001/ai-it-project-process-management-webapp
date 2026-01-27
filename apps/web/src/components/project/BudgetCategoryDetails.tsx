/**
 * @fileoverview BudgetCategoryDetails - 專案預算類別明細表格
 *
 * @description
 * CHANGE-038: 顯示 Budget Pool 下的預算類別，支援三種模式：
 * - create: 從 BudgetPool 取得類別，顯示可編輯的 Request Amount
 * - edit: 從 ProjectBudgetCategory 取得已儲存的資料，可編輯 Request Amount
 * - readonly: 唯讀顯示（用於專案詳情頁）
 *
 * @component BudgetCategoryDetails
 * @since CHANGE-038 - Project Budget Category Sync
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CategoryAmount {
  budgetCategoryId: string;
  requestedAmount: number;
}

interface BudgetCategoryDetailsProps {
  budgetPoolId: string;
  projectId?: string;
  mode: 'create' | 'edit' | 'readonly';
  onCategoriesChange?: (categories: CategoryAmount[]) => void;
}

export function BudgetCategoryDetails({
  budgetPoolId,
  projectId,
  mode,
  onCategoriesChange,
}: BudgetCategoryDetailsProps) {
  const tFields = useTranslations('projects.form.fields.budgetCategoryDetails');

  // 本地狀態管理 Request Amount（使用字串以支援自然輸入體驗）
  const [localAmounts, setLocalAmounts] = useState<Record<string, string>>({});

  // 查詢 BudgetPool 的類別（create 模式或作為基礎資料）
  const { data: poolCategories } = api.budgetPool.getCategories.useQuery(
    { budgetPoolId },
    { enabled: !!budgetPoolId }
  );

  // 查詢已儲存的 ProjectBudgetCategory（edit/readonly 模式）
  const { data: projectCategories } = api.project.getProjectBudgetCategories.useQuery(
    { projectId: projectId ?? '' },
    { enabled: !!projectId && mode !== 'create' }
  );

  // 初始化本地金額（edit 模式）
  useEffect(() => {
    if (mode !== 'create' && projectCategories) {
      const amounts: Record<string, string> = {};
      for (const cat of projectCategories) {
        amounts[cat.budgetCategoryId] = String(cat.requestedAmount);
      }
      setLocalAmounts(amounts);
    }
  }, [projectCategories, mode]);

  // 當 budgetPoolId 改變時重置（create 模式）
  useEffect(() => {
    if (mode === 'create') {
      setLocalAmounts({});
    }
  }, [budgetPoolId, mode]);

  // 處理金額變更（只更新本地狀態，不在 setState 內觸發父組件更新）
  const handleAmountChange = useCallback(
    (budgetCategoryId: string, value: string) => {
      setLocalAmounts((prev) => ({ ...prev, [budgetCategoryId]: value }));
    },
    []
  );

  // 透過 useEffect 通知父組件，避免在 setState updater 內觸發另一個 setState
  useEffect(() => {
    if (onCategoriesChange && poolCategories) {
      const categories = poolCategories.map((cat) => ({
        budgetCategoryId: cat.id,
        requestedAmount: parseFloat(localAmounts[cat.id] || '0') || 0,
      }));
      onCategoriesChange(categories);
    }
  }, [localAmounts, onCategoriesChange, poolCategories]);

  // 決定顯示的類別列表
  // edit/readonly 模式：優先使用 projectCategories，若為空則 fallback 到 poolCategories
  // （舊專案在 CHANGE-038 之前建立，可能沒有 ProjectBudgetCategory 記錄）
  const hasProjectCategories = projectCategories && projectCategories.length > 0;

  const displayCategories =
    mode === 'create' || (mode !== 'create' && !hasProjectCategories)
      ? poolCategories?.map((cat) => ({
          budgetCategoryId: cat.id,
          categoryName: cat.categoryName,
          categoryCode: cat.categoryCode,
          totalAmount: cat.totalAmount,
          requestedAmount: parseFloat(localAmounts[cat.id] || '0') || 0,
        }))
      : projectCategories?.map((pbc) => {
          const localVal = localAmounts[pbc.budgetCategoryId];
          return {
            budgetCategoryId: pbc.budgetCategoryId,
            categoryName: pbc.budgetCategory?.categoryName ?? '',
            categoryCode: pbc.budgetCategory?.categoryCode ?? '',
            totalAmount: pbc.budgetCategory?.totalAmount ?? 0,
            requestedAmount: localVal !== undefined
              ? parseFloat(localVal) || 0
              : pbc.requestedAmount,
          };
        });

  if (!budgetPoolId) {
    return null;
  }

  if (!displayCategories || displayCategories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{tFields('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            {tFields('empty')}
          </p>
        </CardContent>
      </Card>
    );
  }

  const isEditable = mode === 'create' || mode === 'edit';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{tFields('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">{tFields('table.category')}</TableHead>
              <TableHead className="w-[15%]">{tFields('table.code')}</TableHead>
              <TableHead className="w-[20%] text-right">{tFields('table.budgetAmount')}</TableHead>
              <TableHead className="w-[25%] text-right">{tFields('table.requestAmount')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayCategories.map((cat, index) => (
              <TableRow key={cat.budgetCategoryId}>
                <TableCell className="font-medium">
                  {index + 1}. {cat.categoryName}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {cat.categoryCode || '-'}
                </TableCell>
                <TableCell className="text-right">
                  ${cat.totalAmount.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {isEditable ? (
                    <input
                      type="number"
                      value={localAmounts[cat.budgetCategoryId] ?? ''}
                      onChange={(e) =>
                        handleAmountChange(cat.budgetCategoryId, e.target.value)
                      }
                      min="0"
                      step="0.01"
                      placeholder="0"
                      className="w-full max-w-[160px] ml-auto text-right rounded-md border border-gray-300 px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    />
                  ) : (
                    <span>${cat.requestedAmount.toLocaleString()}</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
